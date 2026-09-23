import { Buffer } from 'buffer';
import {
  decodeFrame,
  encodeFrame,
  frameChunks,
  frameChunksForLink,
  reassembleFrames,
  MAX_FRAMES_PER_SEND,
} from '../src/mesh/protocol';

function reassemble(frames: ReturnType<typeof frameChunks>): string | null {
  const parts = new Map<number, string>();
  for (const frame of frames) {
    // Through the wire and back, as a receiver sees it.
    const decoded = decodeFrame(Buffer.from(Buffer.from(encodeFrame(frame), 'utf8')).toString('utf8'));
    if (!decoded) return null;
    parts.set(decoded.index, decoded.part);
  }
  return reassembleFrames(parts, frames[0].total);
}

function wireSize(frame: ReturnType<typeof frameChunks>[number]) {
  return Buffer.byteLength(encodeFrame(frame), 'utf8');
}

const photo = JSON.stringify({
  id: 'abc',
  kind: 'chat',
  payload: { sealed: Buffer.alloc(30_000, 7).toString('base64'), nonce: 'n' },
});
const text = JSON.stringify({ body: 'Hola "Leo", ¿qué tal? \\ 👋🏽 añorado 日本 \n fin', emoji: '🚀'.repeat(200) });

describe('frameChunksForLink', () => {
  it.each([182, 244, 512])('keeps every frame within a %i-byte link and loses nothing', (budget) => {
    for (const raw of [photo, text, '', 'x']) {
      const frames = frameChunksForLink(raw, 'f1234567', budget);
      frames.forEach((frame) => expect(wireSize(frame)).toBeLessThanOrEqual(budget));
      expect(reassemble(frames)).toBe(raw);
    }
  });

  it('never splits an emoji between two frames', () => {
    const frames = frameChunksForLink('🚀'.repeat(500), 'f1234567', 182);
    frames.forEach((frame) => expect(frame.part.length % 2).toBe(0));
  });

  it('sends a photo in several times fewer frames than the fixed size', () => {
    const fixed = frameChunks(photo, 'f1234567').length;
    expect(frameChunksForLink(photo, 'f1234567', 244).length).toBeLessThan(fixed / 2);
    expect(frameChunksForLink(photo, 'f1234567', 512).length).toBeLessThan(fixed / 5);
    expect(frameChunksForLink(photo, 'f1234567', 512).length).toBeLessThanOrEqual(MAX_FRAMES_PER_SEND);
  });

  it('falls back to the fixed frames on a link too small or unknown', () => {
    expect(frameChunksForLink(photo, 'f1234567', 20)).toEqual(frameChunks(photo, 'f1234567'));
    expect(frameChunksForLink(photo, 'f1234567', -3)).toEqual(frameChunks(photo, 'f1234567'));
  });
});
