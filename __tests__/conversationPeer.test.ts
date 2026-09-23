import { describeConversationPeer, withoutReplaced } from '../src/state/conversationPeer';
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

describe('withoutReplaced', () => {
  const person = (peerId: string, connection: 'connected' | 'lost' | 'gone', nickname = 'Ana', label = '14A') => ({
    peerId,
    nickname,
    label,
    secure: true,
    connection,
    minutesAway: 0,
  });

  it('hides the old copy of someone who reinstalled, but never a conversation', () => {
    const list = [
      { person: person('new', 'connected'), lastMessage: null },
      { person: person('old', 'lost', ' ana '), lastMessage: null },
      { person: person('chat', 'gone'), lastMessage: { id: 'm' } },
      { person: person('other', 'lost', 'Ana', '15B'), lastMessage: null },
    ];
    expect(withoutReplaced(list).map((entry) => entry.person.peerId)).toEqual(['new', 'chat', 'other']);
  });
});
