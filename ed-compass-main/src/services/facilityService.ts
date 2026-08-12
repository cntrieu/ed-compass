import { SYNTHETIC_BC_CARE_SERVICES } from '../data/syntheticFacilities';
import { CareService, PatientAccessContext } from '../types/access';
import { Disposition } from '../types/clinical';

export interface FacilitySearchQuery {
  disposition: Disposition;
  accessContext?: PatientAccessContext;
  cityOrPostal?: string;
  requiresWoundCapability?: boolean;
  requiresTetanusVaccine?: boolean;
}

export class FacilityService {
  static searchFacilities(query: FacilitySearchQuery): CareService[] {
    let filtered = [...SYNTHETIC_BC_CARE_SERVICES];

    // Emergency filtering
    if (query.disposition === 'CALL_911_NOW' || query.disposition === 'GO_TO_ED_NOW') {
      filtered = filtered.filter(f => f.facilityType === 'Emergency Department' || f.id === 'fac-healthlink-811');
    } else if (query.disposition === 'SAME_DAY_CLINICAL_ASSESSMENT') {
      filtered = filtered.filter(f =>
        f.facilityType === 'Emergency Department' ||
        f.facilityType === 'Urgent and Primary Care Centre' ||
        f.facilityType === 'Walk-in Clinic' ||
        f.facilityType === 'Nursing Station / CHC' ||
        f.isVirtual
      );
    }

    if (query.requiresWoundCapability) {
      // Filter in-person capabilities
      filtered = filtered.filter(f => f.isVirtual || f.capabilities.woundAssessment === 'VERIFIED' || f.facilityType === 'Emergency Department');
    }

    if (query.accessContext && !query.accessContext.firstNationsServicesRequested) {
      // Exclude FNHA specific services if explicitly declined/not requested
      filtered = filtered.filter(f => !f.firstNationsSpecific);
    }

    if (query.cityOrPostal && query.cityOrPostal.trim()) {
      const search = query.cityOrPostal.trim().toLowerCase();
      const inPerson = filtered.filter(f => !f.isVirtual);
      const matches = inPerson.filter(
        f =>
          f.city.toLowerCase().includes(search) ||
          (f.postalPrefix && f.postalPrefix.toLowerCase().includes(search)) ||
          f.name.toLowerCase().includes(search) ||
          f.region.toLowerCase().includes(search)
      );

      if (matches.length > 0) {
        // Return matched in-person facilities plus virtual fallbacks
        const virtuals = filtered.filter(f => f.isVirtual);
        return [...matches, ...virtuals];
      }
    }

    return filtered;
  }
}
