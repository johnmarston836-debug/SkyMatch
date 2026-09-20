import { AppState, type AppStateStatus } from 'react-native';
import * as Native from 'skymatch-peripheral/notifications';
import { useChatStore } from '../state/chatStore';
import type { ChatMessage } from '../types';

export type { NotificationPermission } from 'skymatch-peripheral/notifications';

export const notificationsSupported = Native.isSupported;

let wired = false;

/**
 * Keeps the store's idea of "is anyone looking at this?" in sync with iOS, and
 * tidies up the badge and the notification stack when the user comes back.
 * Safe to call more than once.
 */
export function initNotifications() {
  if (wired) return;
  wired = true;

  useChatStore.getState().setAppActive(AppState.currentState === 'active');

  AppState.addEventListener('change', (status: AppStateStatus) => {
    const active = status === 'active';
    useChatStore.getState().setAppActive(active);
    if (active) {
      // Back in the app: whatever arrived for the chat still on screen has
      // now been seen, the cabin badge on the Pasajeros button takes over
      // from the home-screen one, and the old cards are no longer news.
      const { activePeerId, markRead } = useChatStore.getState();
      if (activePeerId) markRead(activePeerId);
      void Native.setBadge(0);
      void Native.clearDelivered();
    }
  });
}

/** Asks iOS for permission, unless the user already answered. Returns whether we may notify. */
export async function ensureNotificationPermission(): Promise<boolean> {
  if (!Native.isSupported) return false;
  const status = await Native.getPermission();
  if (status === 'granted') return true;
  if (status === 'denied') return false; // only Settings can undo this
  return Native.requestPermission();
}

export function getNotificationPermission() {
  return Native.getPermission();
}

/**
 * Announces a private message that landed while SkyMatch was in the
 * background. Group messages deliberately stay silent: a full cabin would
 * buzz every few seconds.
 *
 * This only ever fires while iOS is still running us in the background for
 * Bluetooth. Once the system suspends the app - or the user swipes it away -
 * nothing is received, so nothing can be announced. There is no server behind
 * SkyMatch to wake the phone up.
 */
export async function notifyPrivateMessage(message: ChatMessage) {
  if (!Native.isSupported) return;
  if (useChatStore.getState().appActive) return;

  const status = await Native.getPermission();
  if (status !== 'granted') return;

  const body = message.imageBase64 && !message.body ? 'Te ha enviado una foto' : message.body;
  await Native.present(`${message.fromNickname} · ${message.fromLabel}`, body, message.fromId);

  const unread = useChatStore.getState().unreadByPeer;
  await Native.setBadge(Object.values(unread).reduce((total, count) => total + count, 0));
}
