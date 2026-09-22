import AsyncStorage from '@react-native-async-storage/async-storage';
import { useProfileStore } from '../src/state/profileStore';
import { useChatStore } from '../src/state/chatStore';
import { useIdentityStore } from '../src/state/identityStore';
import { isKeyedId } from '../src/crypto/identity';
import type { ChatMessage } from '../src/types';

const LOCATION = { kind: 'plane' as const, seat: { row: 3, letter: 'C' as const } };

beforeEach(async () => {
  await AsyncStorage.clear();
  useIdentityStore.setState({ identity: null });
  useProfileStore.setState({ profile: null, hydrated: false });
  useChatStore.setState({ privateMessagesByPeer: {}, groupMessages: [], hydrated: true });
});

describe('moving to a keyed id', () => {
  it('keeps the same keys across launches', async () => {
    const first = await useIdentityStore.getState().hydrate();
    useIdentityStore.setState({ identity: null });
    const second = await useIdentityStore.getState().hydrate();
    expect(second.id).toBe(first.id);
    expect(isKeyedId(first.id)).toBe(true);
  });

  it('gives a new profile the keyed id straight away', async () => {
    const identity = await useIdentityStore.getState().hydrate();
    await useProfileStore.getState().save({ nickname: 'Ana', location: LOCATION });
    expect(useProfileStore.getState().profile?.id).toBe(identity.id);
  });

  it('moves an old profile, and keeps our own messages on our side of the chat', async () => {
    const oldId = '3f2b8c1e-4d5a-4f6b-9c7d-8e9f0a1b2c3d';
    useProfileStore.setState({ profile: { id: oldId, nickname: 'Ana', location: LOCATION }, hydrated: true });
    const mine: ChatMessage = { id: 'm1', scope: 'private', fromId: oldId, toId: 'leo', fromLabel: '3C', fromNickname: 'Ana', body: 'hola', sentAt: 1 };
    const theirs: ChatMessage = { ...mine, id: 'm2', fromId: 'leo', toId: oldId, body: 'qué tal' };
    useChatStore.setState({ privateMessagesByPeer: { leo: [mine, theirs] } });

    const identity = await useIdentityStore.getState().hydrate();
    const moved = await useProfileStore.getState().adoptId(identity.id);
    expect(moved).toBe(oldId);
    useChatStore.getState().renameSelf(oldId, identity.id);

    expect(useProfileStore.getState().profile?.id).toBe(identity.id);
    expect(useChatStore.getState().privateMessagesByPeer.leo.map((m) => m.fromId)).toEqual([identity.id, 'leo']);
    // Once only.
    expect(await useProfileStore.getState().adoptId(identity.id)).toBeNull();
  });
});
