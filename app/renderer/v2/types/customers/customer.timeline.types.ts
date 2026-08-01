/* ===========================================================
   FINORA ENTERPRISE V2
   CUSTOMER TIMELINE TYPES
   -----------------------------------------------------------
   Module  : Customer
   Section : Timeline
   Version : 2.0
   Status  : Production
=========================================================== */

/* ===========================================================
   TIMELINE EVENT TYPE
=========================================================== */

export enum CustomerTimelineEventType {
  CUSTOMER_CREATED = "CUSTOMER_CREATED",

  PROFILE_UPDATED = "PROFILE_UPDATED",

  LOAN_CREATED = "LOAN_CREATED",

  LOAN_UPDATED = "LOAN_UPDATED",

  LOAN_CLOSED = "LOAN_CLOSED",

  COLLECTION_RECEIVED = "COLLECTION_RECEIVED",

  GOLD_DEPOSITED = "GOLD_DEPOSITED",

  GOLD_RELEASED = "GOLD_RELEASED",

  DOCUMENT_UPLOADED = "DOCUMENT_UPLOADED",

  DOCUMENT_UPDATED = "DOCUMENT_UPDATED",

  DOCUMENT_DELETED = "DOCUMENT_DELETED",

  NOMINEE_UPDATED = "NOMINEE_UPDATED",

  ADDRESS_UPDATED = "ADDRESS_UPDATED",

  STATUS_CHANGED = "STATUS_CHANGED",

  NOTE_ADDED = "NOTE_ADDED",

  NOTE_UPDATED = "NOTE_UPDATED",

  CUSTOMER_ARCHIVED = "CUSTOMER_ARCHIVED",

  CUSTOMER_RESTORED = "CUSTOMER_RESTORED",
}

/* ===========================================================
   TIMELINE PRIORITY
=========================================================== */

export enum CustomerTimelinePriority {
  LOW = "LOW",

  MEDIUM = "MEDIUM",

  HIGH = "HIGH",

  CRITICAL = "CRITICAL",
}

/* ===========================================================
   TIMELINE ITEM
=========================================================== */

export interface CustomerTimelineItem {
  /**
   * Timeline Event ID
   */
  id: string;

  /**
   * Event Type
   */
  type: CustomerTimelineEventType;

  /**
   * Timeline Title
   */
  title: string;

  /**
   * Timeline Description
   */
  description?: string;

  /**
   * Event Priority
   */
  priority: CustomerTimelinePriority;

  /**
   * Event Date & Time
   * ISO 8601 Format
   */
  occurredAt: string;

  /**
   * User / Admin
   */
  performedBy: string;

  /**
   * Related Record ID
   * (Loan, Collection, Document etc.)
   */
  referenceId?: string;

  /**
   * Additional Information
   */
  metadata?: Record<string, unknown>;
}

/* ===========================================================
   CUSTOMER TIMELINE
=========================================================== */

export interface CustomerTimeline {
  /**
   * Timeline Events
   */
  events: CustomerTimelineItem[];

  /**
   * Last Updated
   */
  updatedAt: string;
}
