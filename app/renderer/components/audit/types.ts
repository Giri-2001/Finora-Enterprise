export type AuditAction =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "LOGIN"
  | "LOGOUT"
  | "EXPORT"
  | "RESTORE";

export type AuditModule =
  | "AUTH"
  | "CUSTOMER"
  | "LOAN"
  | "COLLECTION"
  | "RECEIPT"
  | "USER"
  | "REPORT"
  | "SYSTEM";

export type AuditLog = {
  id: string;

  action: AuditAction;

  module: AuditModule;

  description: string;

  performedBy: string;

  userRole: string;

  createdAt: string;
};
