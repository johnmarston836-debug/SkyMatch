import { AppState, type AppStateStatus } from 'react-native';
import * as Native from 'skymatch-peripheral/notifications';
import { useChatStore } from '../state/chatStore';
import { useSettingsStore, type NotifyKind } from '../state/settingsStore';
import { t } from '../i18n';
import type { ChatMessage, PresenceStatus, ReactionKind } from '../types';

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
 * Whether a notification of this kind may be shown right now: the app is
 * not on screen, its switch in Settings is on, and the system allows it.
 *
 * This only ever fires while the system is still running us in the
 * background for Bluetooth. Once iOS suspends the app - or the user swipes
 * it away - nothing is received, so nothing can be announced. There is no
 * server behind SkyMatch to wake the phone up.
 */
async function mayNotify(kind: NotifyKind) {
  if (!Native.isSupported) return false;
  if (useChatStore.getState().appActive) return false;
  if (!useSettingsStore.getState().notify[kind]) return false;
  return (await Native.getPermission()) === 'granted';
}

function textOf(message: ChatMessage) {
  return message.imageBase64 && !message.body ? t.notifications.sentPhoto : message.body;
}

/** A private message that landed while SkyMatch was in the background. */
export async function notifyPrivateMessage(message: ChatMessage) {
  if (!(await mayNotify('private'))) return;
  await Native.present(`${message.fromNickname} · ${message.fromLabel}`, textOf(message), message.fromId, t.notifications.channelName);

  const unread = useChatStore.getState().unreadByPeer;
  await Native.setBadge(Object.values(unread).reduce((total, count) => total + count, 0));
}

/**
 * A full cabin can write every few seconds, so the cabin chat has one card,
 * replaced by the newest line, and buzzes at most once in this long.
 */
export const CABIN_NOTIFY_EVERY_MS = 30_000;
let lastCabinNotice = 0;

/** A message in the cabin chat that landed while SkyMatch was in the background. */
export async function notifyGroupMessage(message: ChatMessage) {
  const now = Date.now();
  if (now - lastCabinNotice < CABIN_NOTIFY_EVERY_MS) return;
  if (!(await mayNotify('cabin'))) return;
  lastCabinNotice = now;
  await Native.present(
    t.notifications.cabinTitle,
    `${message.fromNickname}: ${textOf(message)}`,
    'cabin',
    t.notifications.channelName,
  );
}

/** Notifications are system text, where emoji do render - unlike the app's own icons. */
const REACTION_EMOJI: Record<ReactionKind, string> = { ok: '👍', heart: '❤️', laugh: '😂' };

/** Someone reacted to my "I'm standing" (or "leaving the machine") alert. */
export async function notifyReaction(nickname: string, label: string, kind: ReactionKind, status: PresenceStatus, threadId: string) {
  if (!(await mayNotify('reactions'))) return;
  await Native.present(
    nickname ? `${nickname} · ${label}` : label,
    `${REACTION_EMOJI[kind]} ${t.notifications.reactedTo[status]}`,
    threadId,
    t.notifications.channelName,
  );
}
