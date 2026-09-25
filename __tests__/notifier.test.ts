import * as Native from 'skymatch-peripheral/notifications';
import { notifyGroupMessage, notifyPrivateMessage, notifyReaction } from '../src/notifications/notifier';
import { useChatStore } from '../src/state/chatStore';
import { useSettingsStore } from '../src/state/settingsStore';
import { setLanguage } from '../src/i18n';
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
    setLanguage('es');
    present.mockClear();
    useChatStore.setState({ appActive: false });
    useSettingsStore.setState({ notify: { private: true, cabin: true, reactions: true }, cabinMode: 'each' });
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

  it('notifies every common chat message by default', async () => {
    await notifyGroupMessage(message('group', 'g1'));
    await notifyGroupMessage(message('group', 'g2'));
    expect(present).toHaveBeenCalledTimes(2);
    expect(present.mock.calls[0][2]).toBe('cabin');
    expect(present.mock.calls[0][4]).toBeUndefined();
  });

  it('in summary mode, sounds once and then keeps counting quietly on the same card', async () => {
    useSettingsStore.setState({ cabinMode: 'summary' });
    await notifyGroupMessage(message('group', 'g1'));
    await notifyGroupMessage(message('group', 'g2'));
    await notifyGroupMessage(message('group', 'g3'));
    const options = present.mock.calls.map((call) => call[4]);
    expect(options[0]).toEqual({ replaceId: 'cabin-summary', quiet: false });
    expect(options[1]).toEqual({ replaceId: 'cabin-summary', quiet: true });
    expect(present.mock.calls[2][1]).toBe('3 mensajes nuevos · Leo: hola');
  });
});
