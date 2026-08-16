// ============================================================
// FINORA ENTERPRISE OS™
//
// AUDIT TYPES
//
// RESPONSIBILITY:
//
// - Define FINORA audit action contract
// - Define FINORA audit module contract
// - Define FINORA audit log record
//
// IMPORTANT:
//
// - Types only.
// - No storage access.
// - No audit logic.
// - No business logic.
//
// VERSION : 2.1
// STATUS  : Production Foundation
// ============================================================

// ============================================================
// AUDIT ACTION
// ============================================================

export type AuditAction =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "LOGIN"
  | "LOGOUT"
  | "EXPORT"
  | "RESTORE";

// ============================================================
// AUDIT MODULE
// ============================================================

export type AuditModule =
  | "AUTH"
  | "CUSTOMER"
  | "LOAN"
  | "COLLECTION"
  | "PAYMENT"
  | "RECEIPT"
  | "USER"
  | "REPORT"
  | "SYSTEM";

// ============================================================
// AUDIT LOG
// ============================================================

export interface AuditLog {
  id: string;

  action: AuditAction;

  module: AuditModule;

  description: string;

  performedBy: string;

  userRole: string;

  createdAt: string;
}

// ============================================================
// END
// ============================================================