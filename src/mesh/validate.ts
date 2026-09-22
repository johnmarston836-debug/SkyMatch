import type {
  AvatarPacket,
  ChatMessage,
  PresenceAlert,
  PresenceReaction,
  ReactionKind,
  ReadReceipt,
  ReplyQuote,
} from '../types';

/**
 * The shapes other phones send, checked before anything in the app sees
 * them.
 *
 * A packet is written by whatever build the other person happens to run -
 * older, newer, or broken - and one this phone can't draw is not a local
 * problem: a message whose body is a number takes down the chat screen of
 * everyone in the room who receives it. Profiles already had this boundary
 * (see normalizeProfile in meshController); everything else goes through
 * here.
 *
 * Deliberately lenient about what it keeps: fields an older build sent
 * (`fromSeat`, `seat`) travel through untouched, because the controller
 * still reads them to label that build's messages.
 */

/** Longest message anyone can type; see the composers' maxLength. */
export const MAX_BODY_CHARS = 500;
/**
 * Longest private photo accepted, in base64 characters. The composer now
 * sends at most 40K, but earlier builds didn't squeeze at all; this is what
 * the frame limit can carry (MAX_FRAMES_PER_SEND chunks of 80), so a photo
 * that made it across is never thrown away at the last step.
 */
export const MAX_IMAGE_CHARS = 300_000;
/** Longest profile photo accepted: the portrait is capped at 14K characters when it is picked. */
export const MAX_AVATAR_IMAGE_CHARS = 20_000;
/**
 * The furthest in the future an alert may claim to expire. Senders set five
 * minutes; a phone that says a year would pin its banner on every screen in
 * the room for the rest of the trip.
 */
export const MAX_ALERT_LIFETIME_MS = 10 * 60_000;

const REACTIONS: ReactionKind[] = ['ok', 'heart', 'laugh'];

function isText(value: unknown): value is string {
  return typeof value === 'string';
}

function isTime(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function readQuote(value: unknown): ReplyQuote | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const { nickname, excerpt } = value as Partial<ReplyQuote>;
  if (!isText(nickname) || !isText(excerpt)) return undefined;
  return { nickname: nickname.slice(0, 24), excerpt: excerpt.slice(0, 80) };
}

/**
 * A chat message, or null.
 *
 * `envelopeFromId` is who the mesh says sent it; a message claiming to be
 * from somebody else is refused rather than filed under the wrong person.
 * A photo in a group message is dropped, never shown: the group chat does
 * not carry images (see MeshService.sendPrivateMessage), so one that does
 * came from a build that shouldn't be flooding the room with it.
 */
export function readChatMessage(value: unknown, envelopeFromId: string): ChatMessage | null {
  if (!value || typeof value !== 'object') return null;
  const message = value as Partial<ChatMessage>;
  if (!isText(message.id) || message.id.length === 0) return null;
  if (message.fromId !== envelopeFromId) return null;
  if (message.scope !== 'group' && message.scope !== 'private') return null;
  if (message.scope === 'private' && !isText(message.toId)) return null;
  if (!isText(message.body) || !isText(message.fromNickname)) return null;
  if (!isTime(message.sentAt)) return null;

  const image =
    message.scope === 'private' &&
    isText(message.imageBase64) &&
    message.imageBase64.length > 0 &&
    message.imageBase64.length <= MAX_IMAGE_CHARS
      ? message.imageBase64
      : undefined;

  const read: ChatMessage = {
    ...(message as ChatMessage),
    body: message.body.slice(0, MAX_BODY_CHARS),
    fromNickname: message.fromNickname.slice(0, 24),
    fromLabel: isText(message.fromLabel) ? message.fromLabel.slice(0, 32) : '',
    replyTo: readQuote(message.replyTo),
  };
  if (image === undefined) delete read.imageBase64;
  else read.imageBase64 = image;
  if (read.replyTo === undefined) delete read.replyTo;
  // A message with neither words nor a picture has nothing to show.
  if (read.body.length === 0 && image === undefined) return null;
  return read;
}

export function readPresenceAlert(value: unknown, envelopeFromId: string, now = Date.now()): PresenceAlert | null {
  if (!value || typeof value !== 'object') return null;
  const alert = value as Partial<PresenceAlert>;
  if (!isText(alert.id) || alert.id.length === 0) return null;
  if (alert.fromId !== envelopeFromId) return null;
  if (!isTime(alert.startedAt) || !isTime(alert.expiresAt)) return null;
  return {
    ...(alert as PresenceAlert),
    // The first builds announced a 'bathroom' status and had no cancel, so
    // no `active` either. Both read as what they meant: someone is up.
    status: alert.status === 'leavingMachine' ? 'leavingMachine' : 'standing',
    active: alert.active !== false,
    label: isText(alert.label) ? alert.label.slice(0, 32) : '',
    expiresAt: Math.min(alert.expiresAt, now + MAX_ALERT_LIFETIME_MS),
  };
}

export function readReaction(value: unknown, envelopeFromId: string): PresenceReaction | null {
  if (!value || typeof value !== 'object') return null;
  const reaction = value as Partial<PresenceReaction>;
  if (!isText(reaction.id) || !isText(reaction.alertId)) return null;
  if (reaction.fromId !== envelopeFromId) return null;
  if (!REACTIONS.includes(reaction.kind as ReactionKind)) return null;
  if (!isTime(reaction.sentAt)) return null;
  return {
    ...(reaction as PresenceReaction),
    fromLabel: isText(reaction.fromLabel) ? reaction.fromLabel.slice(0, 32) : '',
  };
}

/** A receipt only counts when it is from who the mesh says, about messages sent to us. */
export function readReceipt(value: unknown, envelopeFromId: string, myId: string): ReadReceipt | null {
  if (!value || typeof value !== 'object') return null;
  const receipt = value as Partial<ReadReceipt>;
  if (receipt.fromId !== envelopeFromId || receipt.toId !== myId) return null;
  if (!isTime(receipt.upTo)) return null;
  return { fromId: receipt.fromId, toId: receipt.toId, upTo: receipt.upTo };
}

export function readAvatar(value: unknown, envelopeFromId: string): AvatarPacket | null {
  if (!value || typeof value !== 'object') return null;
  const avatar = value as Partial<AvatarPacket>;
  if (avatar.fromId !== envelopeFromId) return null;
  if (!isText(avatar.imageBase64) || avatar.imageBase64.length === 0) return null;
  if (avatar.imageBase64.length > MAX_AVATAR_IMAGE_CHARS) return null;
  // Absent stays absent: a photo from the build before thumbnails has no
  // fingerprint and no size, and the controller reads that as what it is.
  const read: AvatarPacket = {
    fromId: avatar.fromId,
    imageBase64: avatar.imageBase64,
    sentAt: isTime(avatar.sentAt) ? avatar.sentAt : Date.now(),
  };
  if (isText(avatar.hash) && avatar.hash.length > 0) read.hash = avatar.hash.slice(0, 16);
  if (avatar.full === true) read.full = true;
  return read;
}
