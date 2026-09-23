import AsyncStorage from '@react-native-async-storage/async-storage';
import { useChatStore } from '../src/state/chatStore';
import { t } from '../src/i18n';
import type { ChatMessage } from '../src/types';

const ME = 'me';
const THEM = 'them';

function message(id: string, fromId: string, sentAt: number, extra: Partial<ChatMessage> = {}): ChatMessage {
  return {
    id,
    scope: 'private',
    fromId,
    fromLabel: '14A',
    fromNickname: fromId === ME ? 'Yo' : 'Ana',
    toId: fromId === ME ? THEM : ME,
    body: 'hola',
    sentAt,
    ...extra,
  };
}

function reset() {
  useChatStore.setState({
    groupMessages: [],
    privateMessagesByPeer: {},
    unreadByPeer: {},
    readUpToByPeer: {},
    activePeerId: null,
    notice: null,
    appActive: true,
    hydrated: false,
  });
}

beforeEach(async () => {
  await AsyncStorage.clear();
  reset();
});

describe('the seen mark', () => {
  it('only ever moves forward', () => {
    const store = useChatStore.getState();
    store.noteReadUpTo(THEM, 500);
    store.noteReadUpTo(THEM, 200); // an older receipt arriving late
    expect(useChatStore.getState().readUpToByPeer[THEM]).toBe(500);
  });

  it('covers their newest message and nothing of ours', () => {
    const store = useChatStore.getState();
    store.addPrivateMessage(THEM, message('a', THEM, 100), true);
    store.addPrivateMessage(THEM, message('b', ME, 200));
    store.addPrivateMessage(THEM, message('c', THEM, 300), true);
    // What we would tell them we have read: their newest, not our own.
    expect(useChatStore.getState().newestIncoming(THEM, ME)).toBe(300);
  });

  it('has nothing to acknowledge in a conversation we started', () => {
    useChatStore.getState().addPrivateMessage(THEM, message('a', ME, 100));
    expect(useChatStore.getState().newestIncoming(THEM, ME)).toBe(0);
  });
});

describe('conversations kept on the phone', () => {
  it('writes nothing before the disk has been read, so a saved history survives', async () => {
    useChatStore.getState().addPrivateMessage(THEM, message('a', THEM, 100), true);
    await new Promise<void>((resolve) => setImmediate(resolve));
    // Nothing written yet: a message landing this early used to overwrite a
    // history that had not even been loaded.
    expect(await AsyncStorage.getItem('@skymatch/chats')).toBeNull();
  });

  it('are still there after a restart', async () => {
    // As the app does: the disk is read before anything can arrive.
    await useChatStore.getState().hydrate();
    useChatStore.getState().addPrivateMessage(THEM, message('a', THEM, 100), true);
    await new Promise<void>((resolve) => setImmediate(resolve));

    reset();
    await useChatStore.getState().hydrate();

    expect(useChatStore.getState().privateMessagesByPeer[THEM]).toHaveLength(1);
    expect(useChatStore.getState().hydrated).toBe(true);
  });

  it('keep the newest photos and let the older ones go', async () => {
    await useChatStore.getState().hydrate();
    const store = useChatStore.getState();
    for (let i = 0; i < 10; i++) {
      store.addPrivateMessage(THEM, message(`p${i}`, THEM, i, { imageBase64: 'x'.repeat(50), body: '' }), true);
    }
    await new Promise<void>((resolve) => setImmediate(resolve));

    reset();
    await useChatStore.getState().hydrate();
    const kept = useChatStore.getState().privateMessagesByPeer[THEM];

    expect(kept).toHaveLength(10);
    expect(kept.filter((m) => m.imageBase64 !== undefined)).toHaveLength(6);
    // The ones that lost their photo still say what they were, in whatever
    // language the phone was in when the photo was dropped.
    expect(kept[0].body).toBe(t.common.photo);
  });

  it('does not lose what arrived while the disk was being read', async () => {
    await useChatStore.getState().hydrate();
    useChatStore.getState().addPrivateMessage(THEM, message('old', THEM, 100), true);
    await new Promise<void>((resolve) => setImmediate(resolve));

    reset();
    // A message lands in the moment between launching and the read finishing.
    useChatStore.getState().addPrivateMessage(THEM, message('fresh', THEM, 200), true);
    await useChatStore.getState().hydrate();

    const ids = useChatStore.getState().privateMessagesByPeer[THEM].map((m) => m.id);
    expect(ids).toEqual(['old', 'fresh']);
  });
});

describe('deleting a conversation', () => {
  it('forgets its messages, badge, seen mark and banner, and nobody else’s', () => {
    const message = (id: string, peer: string) => ({
      id,
      scope: 'private' as const,
      fromId: peer,
      toId: 'me',
      fromLabel: '1A',
      fromNickname: peer,
      body: 'hola',
      sentAt: 1,
    });
    useChatStore.setState({
      privateMessagesByPeer: { ana: [message('a1', 'ana')], leo: [message('l1', 'leo')] },
      unreadByPeer: { ana: 2, leo: 1 },
      readUpToByPeer: { ana: 5 },
      notice: { peerId: 'ana', messageId: 'a1', nickname: 'ana', body: 'hola' },
      hydrated: true,
    });

    useChatStore.getState().deleteConversation('ana');

    const state = useChatStore.getState();
    expect(state.privateMessagesByPeer.ana).toBeUndefined();
    expect(state.unreadByPeer.ana).toBeUndefined();
    expect(state.readUpToByPeer.ana).toBeUndefined();
    expect(state.notice).toBeNull();
    expect(state.privateMessagesByPeer.leo).toHaveLength(1);
    expect(state.unreadByPeer.leo).toBe(1);
  });
});
