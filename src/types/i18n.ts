export type SupportedLocale = 'en' | 'fr' | 'other';

export type EmergencyMessageKey =
  | 'CALL_911_NOW_TITLE'
  | 'GO_TO_ED_NOW_TITLE'
  | 'SAME_DAY_ASSESSMENT_TITLE'
  | 'CONTACT_811_TITLE'
  | 'HOME_MONITOR_TITLE'
  | 'THUNDERCLAP_EMERGENCY'
  | 'SEVERE_BLEEDING_EMERGENCY'
  | 'NEUROVASCULAR_EMERGENCY'
  | 'UNRESPONSIVE_FEVER_EMERGENCY'
  | 'NEUTROPENIC_FEVER_EMERGENCY';

export interface CommunicationSupportPreferences {
  interpreterNeeded: boolean;
  preferredLanguageName?: string;
  supportType?:
    | 'Spoken-language interpreter'
    | 'Sign-language / Deaf support'
    | 'Written information'
    | 'Plain-language explanation'
    | 'Larger text'
    | 'Trusted helper'
    | 'Other';
}
