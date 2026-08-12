import { EvidenceSource } from '../types/clinical';

export const BC_EVIDENCE_SOURCES: Record<string, EvidenceSource> = {
  BCCDC_TETANUS_PROPHYLAXIS: {
    title: 'Tetanus Prophylaxis in Wound Management',
    organization: 'BC Centre for Disease Control (BCCDC)',
    versionOrDate: 'BCCDC Communicable Disease Control Manual, Chapter 2 (Revised 2023)',
    url: 'http://www.bccdc.ca/health-professionals/clinical-resources/communicable-disease-control-manual',
    notes: 'Primary clinical standard for post-wound tetanus immunization and TIg assessment in BC.'
  },
  BCCDC_TIG: {
    title: 'Tetanus Immune Globulin (TIg) Guidelines',
    organization: 'BC Centre for Disease Control (BCCDC)',
    versionOrDate: 'BCCDC Immunization Manual (2023)',
    notes: 'Used to guide TIg assessment for non-primary series or unknown tetanus history.'
  },
  HEALTHLINK_BC_PUNCTURE: {
    title: 'Puncture Wounds Assessment & Care',
    organization: 'HealthLink BC',
    versionOrDate: 'HealthLink BC File #47b (2023)',
    notes: 'Guides patient-facing symptom screening including foreign body, depth, infection, and circulation.'
  },
  BC_WOUND_COMMITTEE: {
    title: 'Clinical Practice Standard for Plantar Puncture Wounds',
    organization: 'BC Provincial Nursing Skin & Wound Committee / CLWK',
    versionOrDate: 'CLWK Guidelines (2022)',
    notes: 'Structured wound assessment framework.'
  },
  SNOOP_HEADACHE: {
    title: 'SNOOP & SNNOOP10 Red Flag Framework for Secondary Headache',
    organization: 'Emergency Care BC & Canadian Headache Society',
    versionOrDate: '2023 Guidelines',
    notes: 'Used for screening thunderclap, focal neuro deficits, systemic symptoms, and secondary headache triggers.'
  },
  QSOFA_SIRS_EVIDENCE: {
    title: 'Adult Fever & Sepsis Early Screening Framework',
    organization: 'BC Emergency Medicine Network',
    versionOrDate: 'EMN Clinical Guidelines (2023)',
    notes: 'Informs measured qSOFA-supporting and patient-reported SIRS-inspired conservative screening.'
  },
  MCISAAC_SORE_THROAT: {
    title: 'Modified Centor / McIsaac Clinical Decision Rule for Sore Throat',
    organization: 'BC College of Family Physicians / Toward Optimized Practice',
    versionOrDate: 'Clinical Decision Tool (2022)',
    notes: 'Supporting non-diagnostic score for sore-throat associated fever pathway.'
  }
};
