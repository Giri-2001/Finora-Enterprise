export type AuditAction = "CREATE" | "UPDATE" | "DELETE" | "LOGIN" | "LOGOUT";

export type AuditModule =
  | "AUTH"
  | "CUSTOMER"
  | "LOAN"
  | "COLLECTION"
  | "RECEIPT"
  | "REPORT"
  | "USER";

export type AuditLog = {
  id: string;

  action: AuditAction;

  module: AuditModule;

  description: string;

  performedBy: string;

  userRole: string;

  createdAt: string;
};
