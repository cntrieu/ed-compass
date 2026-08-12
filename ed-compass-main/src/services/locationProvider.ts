import { RuralityCategory, TravelTimeCategory, PatientAccessContext } from '../types/access';

export interface LocationQueryResult {
  success: boolean;
  locationMethod: 'geolocation' | 'postal' | 'community' | 'skipped';
  communityName: string;
  postalCodePrefix?: string;
  healthAuthority: string;
  rurality: RuralityCategory;
  approxTravelTimeCategory: TravelTimeCategory;
  errorNotice?: string;
}

export interface ILocationProvider {
  getCurrentLocation(): Promise<LocationQueryResult>;
  lookupByPostalOrCommunity(input: string): LocationQueryResult;
}

export const DEMO_BC_COMMUNITIES: Record<string, { healthAuthority: string; rurality: RuralityCategory; postalPrefix: string }> = {
  smithers: { healthAuthority: 'Northern Health', rurality: 'Rural Hub', postalPrefix: 'V0J' },
  hazelton: { healthAuthority: 'Northern Health', rurality: 'Remote', postalPrefix: 'V0J' },
  terrace: { healthAuthority: 'Northern Health', rurality: 'Rural Hub', postalPrefix: 'V8G' },
  'prince george': { healthAuthority: 'Northern Health', rurality: 'Small Urban', postalPrefix: 'V2M' },
  'fort st. john': { healthAuthority: 'Northern Health', rurality: 'Rural Hub', postalPrefix: 'V1J' },
  vancouver: { healthAuthority: 'Vancouver Coastal Health', rurality: 'Metropolitan', postalPrefix: 'V5Z' },
  surrey: { healthAuthority: 'Fraser Health', rurality: 'Large Urban', postalPrefix: 'V3V' },
  victoria: { healthAuthority: 'Island Health', rurality: 'Medium Urban', postalPrefix: 'V8V' },
  haida_gwaii: { healthAuthority: 'Northern Health', rurality: 'Remote', postalPrefix: 'V0T' },
  remote_northern_bc: { healthAuthority: 'Northern Health', rurality: 'Remote', postalPrefix: 'V0J' }
};

export class LocalDemoLocationProvider implements ILocationProvider {
  async getCurrentLocation(): Promise<LocationQueryResult> {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      return {
        success: false,
        locationMethod: 'geolocation',
        communityName: 'Vancouver Demo',
        healthAuthority: 'Vancouver Coastal Health',
        rurality: 'Metropolitan',
        approxTravelTimeCategory: 'UNDER_15_MINUTES',
        errorNotice: 'Geolocation unavailable in browser. Defaulted to demo urban location.'
      };
    }

    return new Promise(resolve => {
      navigator.geolocation.getCurrentPosition(
        position => {
          // Derive access context without persisting raw lat/long
          resolve({
            success: true,
            locationMethod: 'geolocation',
            communityName: 'Derived Device Location (BC)',
            healthAuthority: 'Local BC Health Authority',
            rurality: 'Medium Urban',
            approxTravelTimeCategory: '15_TO_30_MINUTES'
          });
        },
        error => {
          resolve({
            success: false,
            locationMethod: 'geolocation',
            communityName: 'Location Denied',
            healthAuthority: 'Unknown',
            rurality: 'Unknown',
            approxTravelTimeCategory: 'UNKNOWN',
            errorNotice: 'Browser location access denied. Please select postal code or community.'
          });
        },
        { timeout: 5000 }
      );
    });
  }

  lookupByPostalOrCommunity(input: string): LocationQueryResult {
    const clean = input.trim().toLowerCase();

    // Check postal code prefix match
    if (clean.length >= 3) {
      const pfx = clean.substring(0, 3).toUpperCase();
      for (const [commKey, info] of Object.entries(DEMO_BC_COMMUNITIES)) {
        if (info.postalPrefix === pfx) {
          return {
            success: true,
            locationMethod: 'postal',
            communityName: commKey.charAt(0).toUpperCase() + commKey.slice(1),
            postalCodePrefix: pfx,
            healthAuthority: info.healthAuthority,
            rurality: info.rurality,
            approxTravelTimeCategory: info.rurality === 'Remote' ? '60_TO_120_MINUTES' : '15_TO_30_MINUTES'
          };
        }
      }
    }

    // Check community name match
    for (const [commKey, info] of Object.entries(DEMO_BC_COMMUNITIES)) {
      if (clean.includes(commKey) || commKey.includes(clean)) {
        return {
          success: true,
          locationMethod: 'community',
          communityName: commKey.charAt(0).toUpperCase() + commKey.slice(1),
          postalCodePrefix: info.postalPrefix,
          healthAuthority: info.healthAuthority,
          rurality: info.rurality,
          approxTravelTimeCategory: info.rurality === 'Remote' ? '60_TO_120_MINUTES' : '15_TO_30_MINUTES'
        };
      }
    }

    // Default fallback
    return {
      success: true,
      locationMethod: 'community',
      communityName: input.trim() || 'BC Demonstration Community',
      healthAuthority: 'BC Regional Health Authority',
      rurality: 'Rural',
      approxTravelTimeCategory: '30_TO_60_MINUTES'
    };
  }
}
