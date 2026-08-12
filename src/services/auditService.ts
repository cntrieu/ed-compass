import { AuditEvent, AuditEventType } from '../types/audit';

const STORAGE_KEY = 'ed_compass_audit_trail';

export class AuditService {
  private static events: AuditEvent[] = [];

  static logEvent(sessionId: string, eventType: AuditEventType, details: Record<string, any> = {}): AuditEvent {
    // Sanitize details to ensure raw GPS coordinates or exact addresses are NEVER stored
    const sanitizedDetails = { ...details };
    delete sanitizedDetails.latitude;
    delete sanitizedDetails.longitude;
    delete sanitizedDetails.exactAddress;

    const event: AuditEvent = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      sessionId,
      eventType,
      details: sanitizedDetails,
      timestamp: new Date().toISOString()
    };
    this.events.unshift(event);
    this.persist();
    return event;
  }

  static getEvents(sessionId?: string): AuditEvent[] {
    this.load();
    if (sessionId) {
      return this.events.filter(e => e.sessionId === sessionId);
    }
    return this.events;
  }

  private static persist() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.events.slice(0, 500)));
      }
    } catch {
      // Ignore storage quota errors in demo mode
    }
  }

  private static load() {
    if (this.events.length === 0 && typeof localStorage !== 'undefined') {
      try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) {
          this.events = JSON.parse(data);
        }
      } catch {
        // Fallback to empty array
      }
    }
  }
}
