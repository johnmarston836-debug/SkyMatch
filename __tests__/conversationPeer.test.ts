import { describeConversationPeer } from '../src/state/conversationPeer';
import { AWAY_AFTER_MS } from '../src/state/discoveryStore';

const location = { kind: 'plane' as const, seat: { row: 14, letter: 'A' as const } };
const peer = { peerId: 'ana', profile: { id: 'ana', nickname: 'Ana', location }, lastSeenAt: 1_000, secure: true };

describe('describeConversationPeer', () => {
  it('is connected while their beat arrives', () => {
    const person = describeConversationPeer('ana', peer, undefined, 1_000 + 5_000);
    expect(person).toMatchObject({ nickname: 'Ana', label: '14A', connection: 'connected', secure: true });
  });

  it('is lost once the beat stops, with how long ago', () => {
    const person = describeConversationPeer('ana', peer, undefined, 1_000 + AWAY_AFTER_MS + 2 * 60_000);
    expect(person).toMatchObject({ connection: 'lost', minutesAway: 2 });
  });

  it('is gone when only the saved chat is left, with the name it was saved under', () => {
    const person = describeConversationPeer('ana', undefined, { nickname: 'Ana', label: '14A', location });
    expect(person).toMatchObject({ nickname: 'Ana', label: '14A', connection: 'gone', secure: false });
  });

  it('keeps the contact they shared once they are gone', () => {
    const person = describeConversationPeer('ana', undefined, { nickname: 'Ana', label: '14A', contact: '@ana' });
    expect(person).toMatchObject({ contact: '@ana', connection: 'gone' });
  });

  it('is nobody without either', () => {
    expect(describeConversationPeer('ana', undefined, undefined)).toBeNull();
  });
});
