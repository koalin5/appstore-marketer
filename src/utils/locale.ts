import type { Slide } from '../types'

export const COMMON_LOCALES = [
  { code: 'en-US', name: 'English (US)' },
  { code: 'en-GB', name: 'English (UK)' },
  { code: 'es-ES', name: 'Spanish (Spain)' },
  { code: 'es-MX', name: 'Spanish (Mexico)' },
  { code: 'fr-FR', name: 'French' },
  { code: 'de-DE', name: 'German' },
  { code: 'it-IT', name: 'Italian' },
  { code: 'pt-BR', name: 'Portuguese (Brazil)' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh-Hans', name: 'Chinese (Simplified)' },
  { code: 'zh-Hant', name: 'Chinese (Traditional)' },
  { code: 'ar-SA', name: 'Arabic' },
  { code: 'nl-NL', name: 'Dutch' },
  { code: 'ru', name: 'Russian' },
  { code: 'tr', name: 'Turkish' },
  { code: 'hi', name: 'Hindi' },
  { code: 'th', name: 'Thai' },
] as const

/**
 * Resolve the effective headline and sub-caption for a slide in a given locale.
 * Falls back to the default locale, then to the raw TextConfig fields.
 */
export function resolveLocalizedText(
  slide: Slide,
  locale: string | undefined,
  defaultLocale: string | undefined
): { content: string; subCaption: string } {
  if (!locale || !slide.localizedText) {
    return { content: slide.text.content, subCaption: slide.text.subCaption }
  }

  const localeEntry = slide.localizedText[locale]
  if (localeEntry) {
    return { content: localeEntry.content, subCaption: localeEntry.subCaption }
  }

  if (defaultLocale && slide.localizedText[defaultLocale]) {
    return {
      content: slide.localizedText[defaultLocale].content,
      subCaption: slide.localizedText[defaultLocale].subCaption,
    }
  }

  return { content: slide.text.content, subCaption: slide.text.subCaption }
}
