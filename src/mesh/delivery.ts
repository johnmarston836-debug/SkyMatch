/**
 * Keeps trying a private message until the other phone says it arrived.
 *
 * A send finishing only means the frames left this phone. A link that
 * drops half way through a photo, a repair that runs out of rounds, or a
 * person briefly out of range all lose the message with nobody the wiser:
 * the bubble sat there as if sent, and the other phone never saw it. Now
 * the receiver answers every private message with a DeliveryReceipt, and
 * until it does the message goes again - under a new envelope id, so the
 * relays' duplicate filter lets it through, while the receiver still files
 * it once by its message id.
 *
 * Only for people whose build answers (ProfilePacket.acks); anyone else
 * would be sent everything DELIVERY_ATTEMPTS times for nothing.
 */

/**
 * How long to wait for the receipt after a send has left this phone. The
 * receipt only goes back once the whole message is in, so this has to cover
 * a photo's last repairs as well as the trip back.
 */
export const DELIVERY_WAIT_MS = 20_000;

/** The first send included. After this many the bubble says it didn't arrive. */
export const DELIVERY_ATTEMPTS = 4;

interface Tracked {
  peerId: string;
  attempts: number;
  timer: ReturnType<typeof setTimeout> | null;
  /** Set once it gave up and was tried again because the person came back; that happens once. */
  revived: boolean;
}

export class DeliveryTracker {
  private tracked = new Map<string, Tracked>();
  /** Given up on, by message id: kept so the person reappearing can bring them back. */
  private givenUp = new Map<string, Tracked>();

  constructor(
    /** Puts the message on the air again. */
    private resend: (messageId: string, peerId: string) => Promise<void>,
    /** Every attempt went unanswered. */
    private onGiveUp: (messageId: string, peerId: string) => void,
  ) {}

  /**
   * Call before the first send of a message. Before, not after: on a good
   * link the receipt can come back while the send is still finishing, and
   * one that finds nothing to confirm would leave the message to be sent
   * again and marked as lost.
   */
  expect(messageId: string, peerId: string) {
    this.givenUp.delete(messageId);
    this.tracked.set(messageId, { peerId, attempts: 1, timer: null, revived: false });
  }

  /** Call once that first send has left this phone: the wait for its receipt starts now. */
  sent(messageId: string) {
    const entry = this.tracked.get(messageId);
    if (entry && !entry.timer) this.wait(messageId, entry);
  }

  /** The receipt came back: nothing more to do, even if it had been given up on. */
  confirm(messageId: string) {
    const entry = this.tracked.get(messageId);
    if (entry?.timer) clearTimeout(entry.timer);
    this.tracked.delete(messageId);
    this.givenUp.delete(messageId);
  }

  /** Whether this message is still being tried. */
  isPending(messageId: string): boolean {
    return this.tracked.has(messageId);
  }

  /**
   * The person was heard from again. What was given up on while they were
   * out of range gets one more full round - once, so a phone that is in
   * range but never answers isn't sent the same photo on every beat.
   */
  peerBack(peerId: string) {
    this.givenUp.forEach((entry, messageId) => {
      if (entry.peerId !== peerId || entry.revived) return;
      this.givenUp.delete(messageId);
      this.restart(messageId, { ...entry, revived: true });
    });
  }

  /** Tried again by hand: a full new round, whatever happened before. */
  retry(messageId: string, peerId: string) {
    const entry = this.tracked.get(messageId);
    if (entry?.timer) clearTimeout(entry.timer);
    this.givenUp.delete(messageId);
    this.restart(messageId, { peerId, attempts: 0, timer: null, revived: entry?.revived ?? false });
  }

  clear() {
    this.tracked.forEach((entry) => {
      if (entry.timer) clearTimeout(entry.timer);
    });
    this.tracked.clear();
    this.givenUp.clear();
  }

  private restart(messageId: string, entry: Tracked) {
    entry.attempts = 0;
    this.tracked.set(messageId, entry);
    void this.attempt(messageId, entry);
  }

  private wait(messageId: string, entry: Tracked) {
    entry.timer = setTimeout(() => {
      entry.timer = null;
      if (this.tracked.get(messageId) !== entry) return;
      if (entry.attempts >= DELIVERY_ATTEMPTS) {
        this.tracked.delete(messageId);
        this.givenUp.set(messageId, entry);
        this.onGiveUp(messageId, entry.peerId);
        return;
      }
      void this.attempt(messageId, entry);
    }, DELIVERY_WAIT_MS);
  }

  private async attempt(messageId: string, entry: Tracked) {
    entry.attempts += 1;
    try {
      await this.resend(messageId, entry.peerId);
    } catch {
      // Counts as an attempt all the same; the wait below decides what's next.
    }
    // Confirmed, retried by hand or cleared while it was sending.
    if (this.tracked.get(messageId) !== entry) return;
    this.wait(messageId, entry);
  }
}
