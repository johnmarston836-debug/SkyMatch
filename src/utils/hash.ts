/**
 * FNV-1a, 32 bits, as 8 hex characters.
 *
 * Used as a photo's fingerprint: it rides along in every profile
 * announcement, so a phone can tell at a glance whether the photo it holds
 * for someone is the one that person is actually showing - without either
 * side re-sending hundreds of Bluetooth frames to find out.
 */
export function shortHash(value: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    // The classic FNV prime multiply, written as shifts so it stays inside
    // 32 bits in JavaScript's doubles.
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}
