import { NativeModules, Platform } from 'react-native';
import { ca } from './ca';
import { en } from './en';
import { es, type Strings } from './es';

export type { Strings, VenueStrings } from './es';

export type Language = 'es' | 'en' | 'ca';

/** Every language the app carries. Adding one is this list plus its file. */
export const LANGUAGES: Language[] = ['es', 'en', 'ca'];

/**
 * What a phone set to Japanese gets. English rather than Spanish: this is an
 * app for aeroplanes and stations, where the one language a stranger is
 * likeliest to share is that one.
 */
export const FALLBACK_LANGUAGE: Language = 'en';

const DICTIONARIES: Record<Language, Strings> = { es, en, ca };

/**
 * The language out of a BCP 47 tag, ignoring the region: someone on
 * "es-419" gets Spanish, and the difference between Mexico and Spain is not
 * worth a second dictionary here.
 */
export function languageFor(tag: string | null | undefined): Language {
  const base = (tag ?? '').toLowerCase().replace(/_/g, '-').split('-')[0];
  return LANGUAGES.find((language) => language === base) ?? FALLBACK_LANGUAGE;
}

/**
 * The phone's language, without adding a dependency for it.
 *
 * Three sources, because no single one is there on both platforms and in
 * Jest: iOS keeps the user's ordered preference in NSUserDefaults, Android
 * exposes it on the I18nManager module, and Hermes' Intl knows it in both.
 * Any of them can be missing or throw, and none of them is worth crashing
 * the app over, so every read is guarded and the fallback covers the rest.
 */
export function detectLanguage(): Language {
  try {
    if (Platform.OS === 'ios') {
      const settings = NativeModules.SettingsManager?.settings;
      // AppleLanguages is what the user actually chose, in order of
      // preference; AppleLocale is the region's formatting and only a hint.
      const preferred = settings?.AppleLanguages?.[0] ?? settings?.AppleLocale;
      if (typeof preferred === 'string' && preferred.length > 0) return languageFor(preferred);
    } else if (Platform.OS === 'android') {
      const identifier = NativeModules.I18nManager?.localeIdentifier;
      if (typeof identifier === 'string' && identifier.length > 0) return languageFor(identifier);
    }
  } catch {
    // A missing native module is not a reason to fail to start.
  }

  try {
    return languageFor(Intl.DateTimeFormat().resolvedOptions().locale);
  } catch {
    return FALLBACK_LANGUAGE;
  }
}

export let language: Language = detectLanguage();

/**
 * Every word the app says, in the phone's language.
 *
 * Read at the moment of use rather than captured in a constant, so the
 * screens all follow a change of language - which is what makes this
 * testable, and what an in-app language setting would need the day it
 * exists. iOS restarts the app when the phone's own language changes, so in
 * practice this is chosen once at launch.
 */
export let t: Strings = DICTIONARIES[language];

/** Switches the whole app's language. Nothing calls it in production yet. */
export function setLanguage(next: Language) {
  language = next;
  t = DICTIONARIES[next];
}
