import { INITIAL_SYNTHETIC_ENCOUNTERS, INITIAL_IMPROVEMENT_ITEMS, SyntheticEncounter } from '../data/syntheticEncounters';
import { PatientFeedback, StaffReview, ImprovementItem, ImprovementStatus } from '../types/feedback';
import { AuditService } from './auditService';

const ENCOUNTERS_KEY = 'ed_compass_encounters';
const IMPROVEMENTS_KEY = 'ed_compass_improvements';

export class StoreService {
  private static encounters: SyntheticEncounter[] = [];
  private static improvements: ImprovementItem[] = [];

  static getEncounters(): SyntheticEncounter[] {
    this.init();
    return this.encounters;
  }

  static getEncounterById(sessionId: string): SyntheticEncounter | undefined {
    this.init();
    return this.encounters.find(e => e.sessionId === sessionId);
  }

  static saveEncounter(encounter: SyntheticEncounter): void {
    this.init();
    const index = this.encounters.findIndex(e => e.sessionId === encounter.sessionId);
    if (index >= 0) {
      this.encounters[index] = encounter;
    } else {
      this.encounters.unshift(encounter);
    }
    this.persist();
  }

  static addPatientFeedback(feedback: PatientFeedback): void {
    this.init();
    const encounter = this.getEncounterById(feedback.sessionId);
    if (encounter) {
      encounter.patientFeedback = feedback;
      this.saveEncounter(encounter);

      AuditService.logEvent(feedback.sessionId, 'PATIENT_FEEDBACK_SUBMITTED', {
        clarity: feedback.nextStepClear,
        confidence: feedback.confidenceScore,
        barriers: feedback.reportedBarriers,
        careOptionsRealistic: feedback.careOptionsRealistic,
        ruralityCategory: feedback.ruralityCategory
      });
    }
  }

  static addStaffReview(review: StaffReview): void {
    this.init();
    const encounter = this.getEncounterById(review.sessionId);
    if (encounter) {
      encounter.staffReview = review;
      this.saveEncounter(encounter);

      AuditService.logEvent(review.sessionId, 'STAFF_REVIEW_SUBMITTED', {
        reviewerId: review.reviewerId,
        appropriate: review.dispositionAppropriate,
        unsafeFlag: review.unsafeFlag
      });
    }
  }

  static getImprovementItems(): ImprovementItem[] {
    this.init();
    return this.improvements;
  }

  static createImprovementItem(item: Omit<ImprovementItem, 'id' | 'createdAt' | 'updatedAt'>): ImprovementItem {
    this.init();
    const newItem: ImprovementItem = {
      ...item,
      id: `imp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.improvements.unshift(newItem);
    this.persist();

    AuditService.logEvent(item.sourceSessionId, 'IMPROVEMENT_ITEM_CREATED', {
      improvementId: newItem.id,
      theme: newItem.feedbackTheme,
      status: newItem.status
    });

    return newItem;
  }

  static updateImprovementStatus(id: string, newStatus: ImprovementStatus, reviewer: string): ImprovementItem | undefined {
    this.init();
    const item = this.improvements.find(i => i.id === id);
    if (item) {
      const oldStatus = item.status;
      item.status = newStatus;
      item.reviewer = reviewer;
      item.updatedAt = new Date().toISOString();
      this.persist();

      AuditService.logEvent(item.sourceSessionId, 'IMPROVEMENT_STATUS_CHANGED', {
        improvementId: id,
        fromStatus: oldStatus,
        toStatus: newStatus,
        reviewer
      });
    }
    return item;
  }

  private static init() {
    if (this.encounters.length === 0) {
      if (typeof localStorage !== 'undefined') {
        try {
          const encData = localStorage.getItem(ENCOUNTERS_KEY);
          const impData = localStorage.getItem(IMPROVEMENTS_KEY);

          if (encData) {
            this.encounters = JSON.parse(encData);
          } else {
            this.encounters = [...INITIAL_SYNTHETIC_ENCOUNTERS];
          }

          if (impData) {
            this.improvements = JSON.parse(impData);
          } else {
            this.improvements = [...INITIAL_IMPROVEMENT_ITEMS];
          }
        } catch {
          this.encounters = [...INITIAL_SYNTHETIC_ENCOUNTERS];
          this.improvements = [...INITIAL_IMPROVEMENT_ITEMS];
        }
      } else {
        this.encounters = [...INITIAL_SYNTHETIC_ENCOUNTERS];
        this.improvements = [...INITIAL_IMPROVEMENT_ITEMS];
      }
    }
  }

  private static persist() {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(ENCOUNTERS_KEY, JSON.stringify(this.encounters));
        localStorage.setItem(IMPROVEMENTS_KEY, JSON.stringify(this.improvements));
      } catch {
        // Ignore quota error
      }
    }
  }
}
