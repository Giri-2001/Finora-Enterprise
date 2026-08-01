/* ===========================================================
   FINORA ENTERPRISE V2
   CUSTOMER DOCUMENT TYPES
   -----------------------------------------------------------
   Module  : Customer
   Section : G - Digital Locker
   Version : 2.0
   Status  : Production
=========================================================== */

import {
  CustomerDocumentType,
  KYCStatus,
} from "./customer.enums";

/* ===========================================================
   DOCUMENT ID
=========================================================== */

export type CustomerDocumentId = string;

/* ===========================================================
   FILE SIZE
=========================================================== */

export type FileSize = number;

/* ===========================================================
   DOCUMENT
=========================================================== */

export interface CustomerDocument {
  /**
   * Unique Document ID
   */
  documentId: CustomerDocumentId;

  /**
   * Document Type
   */
  documentType: CustomerDocumentType;

  /**
   * Display Name
   */
  name: string;

  /**
   * File Name
   */
  fileName: string;

  /**
   * MIME Type
   */
  mimeType: string;

  /**
   * File Size (Bytes)
   */
  fileSize: FileSize;

  /**
   * Storage Path / URL
   */
  fileUrl: string;

  /**
   * Upload Date
   */
  uploadedAt: string;

  /**
   * Uploaded By
   */
  uploadedBy: string;

  /**
   * Verification Status
   */
  verificationStatus: KYCStatus;

  /**
   * Verified Date
   */
  verifiedAt?: string;

  /**
   * Verified By
   */
  verifiedBy?: string;

  /**
   * Notes
   */
  remarks?: string;
}

/* ===========================================================
   DIGITAL LOCKER
=========================================================== */

export interface CustomerDigitalLocker {
  /**
   * Locker Folder Name
   */
  folderName: string;

  /**
   * Documents
   */
  documents: CustomerDocument[];

  /**
   * Total Documents
   */
  totalDocuments: number;

  /**
   * Last Updated
   */
  updatedAt: string;
}
