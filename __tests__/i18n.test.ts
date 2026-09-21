import { ca } from '../src/i18n/ca';
import { en } from '../src/i18n/en';
import { es } from '../src/i18n/es';
import { detectLanguage, languageFor, setLanguage, t, FALLBACK_LANGUAGE, LANGUAGES } from '../src/i18n';
import { describeLocation, formatLocation } from '../src/utils/location';
import { venueOf } from '../src/venues';

type Node = Record<string, unknown>;

/**
 * The shape of a dictionary as a flat list: one entry per leaf, saying
 * whether it is a plain string or a function and how many values that
 * function takes. TypeScript already refuses a dictionary with a missing
 * key, but it cannot see an empty string or a function that quietly ignores
 * the number it was handed.
 */
function shapeOf(node: Node, prefix = ''): Map<string, string> {
  const shape = new Map<string, string>();
  for (const [key, value] of Object.entries(node)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'function') shape.set(path, `fn/${value.length}`);
    else if (typeof value === 'object' && value !== null) {
      for (const [inner, kind] of shapeOf(value as Node, path)) shape.set(inner, kind);
    } else shape.set(path, typeof value);
  }
  return shape;
}

/** Calls a leaf with plausible arguments, so an empty result shows up. */
function render(value: unknown): string {
  if (typeof value === 'function') {
    // Every function in a dictionary takes either a name, a number or both.
    const args = Array.from({ length: value.length }, (_, index) => (index === 0 ? 'Ana' : 3));
    return String((value as (...rest: unknown[]) => string)(...(value.length === 1 ? [args[0]] : args)));
  }
  return String(value);
}

describe('the dictionaries', () => {
  const reference = shapeOf(es as unknown as Node);

  it.each([
    ['en', en],
    ['ca', ca],
  ])('%s says everything Spanish says, in the same shape', (_name, dictionary) => {
    const shape = shapeOf(dictionary as unknown as Node);
    expect([...shape.keys()].sort()).toEqual([...reference.keys()].sort());
    for (const [path, kind] of reference) {
      expect(`${path}: ${shape.get(path)}`).toBe(`${path}: ${kind}`);
    }
  });

  it.each([
    ['es', es],
    ['en', en],
    ['ca', ca],
  ])('%s leaves nothing blank', (_name, dictionary) => {
    const flat = new Map<string, unknown>();
    const walk = (node: Node, prefix = '') => {
      for (const [key, value] of Object.entries(node)) {
        const path = prefix ? `${prefix}.${key}` : key;
        if (typeof value === 'object' && value !== null && typeof value !== 'function') walk(value as Node, path);
        else flat.set(path, value);
      }
    };
    walk(dictionary as unknown as Node);
    for (const [path, value] of flat) {
      expect(`${path}: ${render(value).trim().length > 0}`).toBe(`${path}: true`);
    }
  });
});

describe('choosing the language', () => {
  afterEach(() => setLanguage('es'));

  it('ignores the region, which is not a different language', () => {
    expect(languageFor('es-ES')).toBe('es');
    expect(languageFor('es_419')).toBe('es');
    expect(languageFor('ca-AD')).toBe('ca');
    expect(languageFor('EN-gb')).toBe('en');
  });

  it('falls back rather than showing a language nobody asked for', () => {
    expect(languageFor('ja-JP')).toBe(FALLBACK_LANGUAGE);
    expect(languageFor('')).toBe(FALLBACK_LANGUAGE);
    expect(languageFor(null)).toBe(FALLBACK_LANGUAGE);
    expect(languageFor(undefined)).toBe(FALLBACK_LANGUAGE);
  });

  it('never throws, whatever the phone reports', () => {
    expect(LANGUAGES).toContain(detectLanguage());
  });

  it('carries the whole app with it, not just the screens', () => {
    // The words that live behind a helper - a badge, a profile line, a
    // venue's own copy - are the ones that quietly stay in one language
    // when only the JSX is translated.
    setLanguage('es');
    expect(formatLocation({ kind: 'gym', muscle: 'legs' })).toBe('Pierna');
    expect(describeLocation({ kind: 'plane', seat: { row: 3, letter: 'B' } })).toBe('Asiento 3B');
    expect(venueOf('plane').peopleLabel).toBe('Pasajeros');
    expect(t.common.send).toBe('Enviar');

    setLanguage('en');
    expect(formatLocation({ kind: 'gym', muscle: 'legs' })).toBe('Legs');
    expect(describeLocation({ kind: 'plane', seat: { row: 3, letter: 'B' } })).toBe('Seat 3B');
    expect(venueOf('plane').peopleLabel).toBe('Passengers');
    expect(t.common.send).toBe('Send');

    setLanguage('ca');
    expect(formatLocation({ kind: 'gym', muscle: 'legs' })).toBe('Cama');
    expect(describeLocation({ kind: 'plane', seat: { row: 3, letter: 'B' } })).toBe('Seient 3B');
    expect(venueOf('plane').peopleLabel).toBe('Passatgers');
    expect(t.common.send).toBe('Enviar');
  });

  it('keeps a train badge to the few characters a chip has room for', () => {
    for (const language of LANGUAGES) {
      setLanguage(language);
      expect(formatLocation({ kind: 'train', coach: 12, seat: { row: 22, letter: 'D' } }).length).toBeLessThanOrEqual(10);
    }
  });
});
