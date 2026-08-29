// ============================================================
// FINORA ENTERPRISE OS™
//
// GOLD LOAN ENGINE™
// GOLD STORAGE RELOCATION AUDIT REPOSITORY
//
// RESPONSIBILITY:
//
// - Persist Gold custody relocation audit records.
// - Preserve every relocation as immutable history.
// - Use explicit GOLD_RELOCATION_AUDIT entity routing.
// - Support active FINORA LOCAL / USB / future CLOUD mode.
// - Preserve REAL / DEMO owner isolation through StorageManager.
// - Preserve business isolation through businessId.
//
// IMPORTANT:
//
// - No React.
// - No UI.
// - No localStorage access.
// - No filesystem access.
// - No Electron IPC.
// - No relocation calculations.
// - No capacity validation.
// - No custody state transitions.
// - Audit records are append-only.
// - No update.
// - No delete.
// - Storage access goes only through StorageManager.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

/* ============================================================
   IMPORTS
============================================================ */

import type {
  GoldCustodyAllocationId,
  GoldStorageRelocationAudit,
} from "../../types/gold-loan/goldStorage.types";

import { storageManager } from "../../storage/storageManager";

import type { StorageQuery, StorageResult } from "../../storage/storage.types";

import type { RepositoryWriteOptions } from "../repository.types";

/* ============================================================
   ENTITY
============================================================ */

export const GOLD_RELOCATION_AUDIT_ENTITY = "GOLD_RELOCATION_AUDIT";

/* ============================================================
   STORAGE RECORD
============================================================ */

interface GoldStorageRelocationAuditStorageRecord extends GoldStorageRelocationAudit {
  entity: typeof GOLD_RELOCATION_AUDIT_ENTITY;

  businessId: string;
}

/* ============================================================
   NORMALIZATION
============================================================ */

function normalizeString(value: string): string {
  return String(value ?? "").trim();
}

/* ============================================================
   STORAGE RECORD BUILDER
============================================================ */

function toGoldStorageRelocationAuditStorageRecord(
  businessId: string,

  audit: GoldStorageRelocationAudit,
): GoldStorageRelocationAuditStorageRecord {
  return {
    ...audit,

    entity: GOLD_RELOCATION_AUDIT_ENTITY,

    businessId,
  };
}

/* ============================================================
   DOMAIN MAPPER
============================================================ */

function fromGoldStorageRelocationAuditStorageRecord(
  record: GoldStorageRelocationAuditStorageRecord,
): GoldStorageRelocationAudit {
  const {
    entity: _storageEntity,

    businessId: _businessId,

    ...audit
  } = record;

  return audit;
}

/* ============================================================
   QUERY BUILDER
============================================================ */

function buildGoldStorageRelocationAuditQuery(auditId?: string): StorageQuery {
  return {
    entity: GOLD_RELOCATION_AUDIT_ENTITY,

    id: auditId,
  };
}

/* ============================================================
   REPOSITORY
============================================================ */

export class GoldStorageRelocationAuditRepository {
  /* ==========================================================
     FIND ALL BY BUSINESS
  ========================================================== */

  async findAllByBusinessId(
    businessId: string,
  ): Promise<StorageResult<GoldStorageRelocationAudit[]>> {
    const normalizedBusinessId = normalizeString(businessId);

    if (!normalizedBusinessId) {
      return {
        success: false,

        error: "Business ID is required to load Gold relocation audits.",
      };
    }

    const result =
      await storageManager.getAll<GoldStorageRelocationAuditStorageRecord>(
        buildGoldStorageRelocationAuditQuery(),
      );

    if (!result.success) {
      return {
        success: false,

        error: result.error ?? "Unable to load Gold relocation audits.",
      };
    }

    const audits = (result.data ?? [])
      .filter(
        (record) => normalizeString(record.businessId) === normalizedBusinessId,
      )
      .map(fromGoldStorageRelocationAuditStorageRecord);

    return {
      success: true,

      data: audits,
    };
  }

  /* ==========================================================
     FIND BY AUDIT ID
  ========================================================== */

  async findById(
    businessId: string,

    auditId: string,
  ): Promise<StorageResult<GoldStorageRelocationAudit | undefined>> {
    const normalizedBusinessId = normalizeString(businessId);

    const normalizedAuditId = normalizeString(auditId);

    if (!normalizedBusinessId) {
      return {
        success: false,

        error: "Business ID is required to load a Gold relocation audit.",
      };
    }

    if (!normalizedAuditId) {
      return {
        success: false,

        error: "Audit ID is required to load a Gold relocation audit.",
      };
    }

    const result =
      await storageManager.get<GoldStorageRelocationAuditStorageRecord>(
        buildGoldStorageRelocationAuditQuery(normalizedAuditId),
      );

    if (!result.success) {
      return {
        success: false,

        error: result.error ?? "Unable to load Gold relocation audit.",
      };
    }

    if (!result.data) {
      return {
        success: true,

        data: undefined,
      };
    }

    if (normalizeString(result.data.businessId) !== normalizedBusinessId) {
      return {
        success: true,

        data: undefined,
      };
    }

    return {
      success: true,

      data: fromGoldStorageRelocationAuditStorageRecord(result.data),
    };
  }

  /* ==========================================================
     FIND BY LOAN ID
  ========================================================== */

  async findByLoanId(
    businessId: string,

    loanId: string,
  ): Promise<StorageResult<GoldStorageRelocationAudit[]>> {
    const normalizedLoanId = normalizeString(loanId);

    if (!normalizedLoanId) {
      return {
        success: false,

        error: "Loan ID is required to load Gold relocation history.",
      };
    }

    const allResult = await this.findAllByBusinessId(businessId);

    if (!allResult.success) {
      return {
        success: false,

        error: allResult.error ?? "Unable to load Gold relocation history.",
      };
    }

    return {
      success: true,

      data: (allResult.data ?? []).filter(
        (audit) => normalizeString(audit.loanId) === normalizedLoanId,
      ),
    };
  }

  /* ==========================================================
     FIND BY ALLOCATION ID
  ========================================================== */

  async findByAllocationId(
    businessId: string,

    allocationId: GoldCustodyAllocationId,
  ): Promise<StorageResult<GoldStorageRelocationAudit[]>> {
    const normalizedAllocationId = normalizeString(allocationId);

    if (!normalizedAllocationId) {
      return {
        success: false,

        error: "Allocation ID is required to load Gold relocation history.",
      };
    }

    const allResult = await this.findAllByBusinessId(businessId);

    if (!allResult.success) {
      return {
        success: false,

        error: allResult.error ?? "Unable to load Gold relocation history.",
      };
    }

    return {
      success: true,

      data: (allResult.data ?? []).filter(
        (audit) =>
          normalizeString(audit.allocationId) === normalizedAllocationId,
      ),
    };
  }

  /* ==========================================================
     SAVE AUDIT

     Audit records are immutable.

     Existing audit ID means SAVE must fail rather than update.
  ========================================================== */

  async save(
    businessId: string,

    audit: GoldStorageRelocationAudit,

    options?: RepositoryWriteOptions,
  ): Promise<StorageResult<GoldStorageRelocationAudit>> {
    const normalizedBusinessId = normalizeString(businessId);

    const normalizedAuditId = normalizeString(audit.id);

    if (!normalizedBusinessId) {
      return {
        success: false,

        error: "Business ID is required before saving Gold relocation audit.",
      };
    }

    if (!normalizedAuditId) {
      return {
        success: false,

        error: "Audit ID is required before saving Gold relocation audit.",
      };
    }

    const existing = await this.findById(
      normalizedBusinessId,

      normalizedAuditId,
    );

    if (!existing.success) {
      return {
        success: false,

        error:
          existing.error ?? "Unable to verify existing Gold relocation audit.",
      };
    }

    if (existing.data) {
      return {
        success: false,

        error: "Gold relocation audit already exists.",
      };
    }

    const storageRecord = toGoldStorageRelocationAuditStorageRecord(
      normalizedBusinessId,

      audit,
    );

    const result =
      await storageManager.save<GoldStorageRelocationAuditStorageRecord>(
        storageRecord,

        options,
      );

    if (!result.success) {
      return {
        success: false,

        error: result.error ?? "Unable to save Gold relocation audit.",
      };
    }

    return {
      success: true,

      data: audit,
    };
  }
}

/* ============================================================
   SINGLETON
============================================================ */

export const goldStorageRelocationAuditRepository =
  new GoldStorageRelocationAuditRepository();

/* ============================================================
   END
============================================================ */
