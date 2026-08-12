import { en } from './en';
import { fr } from './fr';
import { SupportedLocale } from '../types/i18n';

export const locales = { en, fr };

export function getTranslation(locale: SupportedLocale, key: keyof typeof en): string {
  if (locale === 'fr') {
    return fr[key] || en[key] || '';
  }
  return en[key] || '';
}

export function translateEmergencyTitle(locale: SupportedLocale, messageKey?: string): string {
  if (!messageKey) return getTranslation(locale, 'GO_TO_ED_NOW_TITLE');
  const dict = locale === 'fr' ? fr : en;
  return (dict as any)[messageKey] || getTranslation(locale, 'GO_TO_ED_NOW_TITLE');
}

export function applyPlainLanguageFilter(text: string, isPlainLanguageMode: boolean): string {
  if (!isPlainLanguageMode) return text;

  // Substitute complex medical terms with clear, simple terms
  return text
    .replace(/neurovascular compromise/gi, 'blood flow or nerve problem in your foot')
    .replace(/neurovascular evaluation/gi, 'medical check of your nerves and blood flow')
    .replace(/subarachnoid hemorrhage/gi, 'serious bleeding in the head')
    .replace(/febrile neutropenia/gi, 'fever during cancer treatment with low white blood cells')
    .replace(/focal neurological deficits/gi, 'new weakness, numbness, or trouble speaking')
    .replace(/hemodynamic instability/gi, 'dangerously low blood pressure or heart problem')
    .replace(/pharyngitis/gi, 'sore throat')
    .replace(/prophylaxis/gi, 'prevention treatment')
    .replace(/ophthalmic/gi, 'eye care')
    .replace(/anticoagulant/gi, 'blood thinner medication');
}
