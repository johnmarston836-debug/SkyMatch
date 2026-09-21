import 'react-native-get-random-values';
import { t } from '../i18n';

/** RFC 4122 v4 UUID, built directly on the crypto.getRandomValues polyfill to avoid the 'uuid' package's ESM-only build (breaks Jest/Metro CJS resolution). */
export function newId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10xx

  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** Longest a quoted line may be: enough to recognise the message, short enough to stay one Bluetooth frame. */
const EXCERPT_CHARS = 70;

/** Builds the quote a reply carries, from the message being answered. */
export function quoteOf(message: { fromNickname: string; body: string; imageBase64?: string }) {
  const text = message.imageBase64 && !message.body ? t.common.photo : message.body;
  return {
    nickname: message.fromNickname,
    excerpt: text.length > EXCERPT_CHARS ? `${text.slice(0, EXCERPT_CHARS - 1)}…` : text,
  };
}

/** The clock time a message was sent, as a conversation shows it. */
export function formatTime(sentAt: number): string {
  const date = new Date(sentAt);
  return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
}
