import * as Native from 'skymatch-peripheral/notifications';
import { notifyGroupMessage, notifyPrivateMessage, notifyReaction } from '../src/notifications/notifier';
import { useChatStore } from '../src/state/chatStore';
import { useSettingsStore } from '../src/state/settingsStore';
import type { ChatMessage } from '../src/types';

jest.mock('skymatch-peripheral/notifications', () => ({
  isSupported: true,
  getPermission: jest.fn(async () => 'granted'),
  requestPermission: jest.fn(async () => true),
  present: jest.fn(async () => true),
  setBadge: jest.fn(async () => true),
  clearDelivered: jest.fn(async () => true),
}));

const present = Native.present as jest.Mock;

function message(scope: 'group' | 'private', id: string): ChatMessage {
  return { id, scope, fromId: 'leo', fromLabel: '14C', fromNickname: 'Leo', body: 'hola', sentAt: 1 };
}

describe('notifications', () => {
  beforeEach(() => {
    present.mockClear();
    useChatStore.setState({ appActive: false });
    useSettingsStore.setState({ notify: { private: true, cabin: true, reactions: true } });
  });

  it('stays quiet while the app is on screen', async () => {
    useChatStore.setState({ appActive: true });
    await notifyPrivateMessage(message('private', 'p1'));
    await notifyReaction('Leo', '14C', 'heart', 'standing', 'r');
    expect(present).not.toHaveBeenCalled();
  });

  it('respects each switch in Settings', async () => {
    useSettingsStore.setState({ notify: { private: false, cabin: true, reactions: false } });
    await notifyPrivateMessage(message('private', 'p1'));
    await notifyReaction('Leo', '14C', 'heart', 'standing', 'r');
    expect(present).not.toHaveBeenCalled();

    useSettingsStore.setState({ notify: { private: true, cabin: true, reactions: true } });
    await notifyReaction('Leo', '14C', 'heart', 'standing', 'r');
    expect(present).toHaveBeenCalledTimes(1);
    expect(present.mock.calls[0][0]).toBe('Leo · 14C');
  });

  it('buzzes for the cabin chat at most once in a while', async () => {
    await notifyGroupMessage(message('group', 'g1'));
    await notifyGroupMessage(message('group', 'g2'));
    expect(present).toHaveBeenCalledTimes(1);
    expect(present.mock.calls[0][2]).toBe('cabin');
  });
});
