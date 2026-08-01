/* ===========================================================
   FINORA ENTERPRISE V2
   CUSTOMER IDENTITY TYPES
   -----------------------------------------------------------
   Module  : Customer
   Section : A - Identity
   Version : 2.0
   Status  : Production
=========================================================== */

/* ===========================================================
   CUSTOMER UNIQUE ID
=========================================================== */

export type CustomerId = string;

/* ===========================================================
   BRANCH ID
=========================================================== */

export type BranchId = string;

/* ===========================================================
   BUSINESS ID
=========================================================== */

export type BusinessId = string;

/* ===========================================================
   CUSTOMER IDENTITY
=========================================================== */

export interface CustomerIdentity {
  /**
   * Internal database ID
   */
  id: number;

  /**
   * FINORA Customer ID
   * Example:
   * FIN-CUS-000001
   */
  customerId: CustomerId;

  /**
   * Branch Identifier
   * Example:
   * BR-001
   */
  branchId: BranchId;

  /**
   * Business Identifier
   * Example:
   * FINORA-HYD-01
   */
  businessId: BusinessId;

  /**
   * Business Name
   * Printed on Customer ID Card
   */
  businessName: string;

  /**
   * Customer Registration Date
   */
  createdAt: string;

  /**
   * Last Updated Date
   */
  updatedAt: string;

  /**
   * Created By
   * Admin Username / ID
   */
  createdBy: string;

  /**
   * Updated By
   */
  updatedBy?: string;

  /**
   * Active Record
   */
  isActive: boolean;

  /**
   * Soft Delete Flag
   */
  isDeleted: boolean;
}
