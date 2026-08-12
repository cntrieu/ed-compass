import { Disposition } from './clinical';

export type RuralityCategory =
  | 'Metropolitan'
  | 'Large Urban'
  | 'Medium Urban'
  | 'Small Urban'
  | 'Rural Hub'
  | 'Rural'
  | 'Remote'
  | 'Unknown';

export type TravelTimeCategory =
  | 'UNDER_15_MINUTES'
  | '15_TO_30_MINUTES'
  | '30_TO_60_MINUTES'
  | '60_TO_120_MINUTES'
  | 'MORE_THAN_120_MINUTES'
  | 'UNKNOWN';

export type ClinicalCapability =
  | 'emergency_resuscitation'
  | 'emergency_physician_assessment'
  | 'physical_examination'
  | 'wound_assessment'
  | 'foreign_body_assessment'
  | 'imaging_possible'
  | 'tetanus_immunization_assessment'
  | 'medication_prescribing'
  | 'primary_care_assessment'
  | 'virtual_primary_care'
  | 'nursing_advice'
  | 'public_health_immunization'
  | 'monitoring_only';

export type CapabilityVerificationStatus = 'VERIFIED' | 'NOT_VERIFIED' | 'NOT_AVAILABLE';

export interface ServiceCapabilityMap {
  woundAssessment?: CapabilityVerificationStatus;
  tetanusVaccine?: CapabilityVerificationStatus;
  tetanusImmuneGlobulin?: CapabilityVerificationStatus;
  imaging?: CapabilityVerificationStatus;
  primaryCare?: CapabilityVerificationStatus;
  emergencyResuscitation?: CapabilityVerificationStatus;
}

export interface CareService {
  id: string;
  name: string;
  provider: string; // e.g. "FNHA", "Northern Health", "HealthLink BC", "Vancouver Coastal Health"
  facilityType:
    | 'Emergency Department'
    | 'Urgent and Primary Care Centre'
    | 'Walk-in Clinic'
    | 'Primary Care'
    | 'Public Health Clinic'
    | 'Nursing Station / CHC'
    | 'Virtual Primary Care'
    | 'Provincial Telehealth'
    | 'Pharmacy';
  region: 'Metro Vancouver' | 'Fraser Valley' | 'Vancouver Island' | 'Interior' | 'Northern BC' | 'Remote / First Nations' | 'Province-Wide';
  address?: string;
  city: string;
  postalPrefix?: string;
  phone: string;
  hours: string;
  isOpenNow: boolean;
  approxDistanceKm?: number;
  approxTravelTimeMinutes?: number;
  capabilities: ServiceCapabilityMap;
  isVirtual: boolean;
  virtualSuitabilityNotice?: string;
  firstNationsSpecific?: boolean;
  eligibilityNotes?: string;
  unverifiedWarning?: string;
  lastVerifiedDate: string;
  infoSource: string;
}

export interface PatientAccessContext {
  locationMethod: 'geolocation' | 'postal' | 'community' | 'skipped';
  healthAuthority?: string;
  communityName?: string;
  postalCodePrefix?: string;
  rurality: RuralityCategory;
  travelTimeCategory: TravelTimeCategory;
  hasReliableTransport: 'Yes' | 'No' | 'Difficulty' | 'Not_Applicable';
  accessBarriers: string[];
  firstNationsServicesRequested: boolean;
  communicationSupportNeeded: boolean;
  interpreterRequested: boolean;
}

export interface AccessEngineOutput {
  clinicalDisposition: Disposition;
  clinicalDispositionChanged: false; // ALWAYS FALSE! Clinical engine owns urgency
  accessContext: PatientAccessContext;
  requiredCapabilities: ClinicalCapability[];
  virtualCareCanReplaceInPersonCare: boolean;
  virtualCareExplanation: string;
  navigationOptions: CareService[];
  conceptualHandoffNotice: string;
}
