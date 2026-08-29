// ============================================================
// FINORA ENTERPRISE OS™
//
// GOLD LOAN ENGINE™
// GOLD CUSTODY ALLOCATION REPOSITORY
//
// RESPONSIBILITY:
//
// - Persist Gold custody allocation records through StorageManager.
// - Keep Gold custody domain contracts storage-independent.
// - Keep every allocation as an independent persisted record.
// - Support active and historical custody records.
// - Use explicit GOLD_CUSTODY_ALLOCATION entity routing.
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
// - No rack-capacity calculations.
// - No allocation business rules.
// - No release business rules.
// - No relocation business rules.
// - RELEASED / RELOCATED history is never deleted here.
// - Storage access goes only through StorageManager.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

/* ============================================================
   IMPORTS
============================================================ */

import type {
  GoldCustodyAllocation,
  GoldCustodyAllocationId,
} from "../../types/gold-loan/goldStorage.types";

import { storageManager } from "../../storage/storageManager";

import type { StorageQuery, StorageResult } from "../../storage/storage.types";

import type { RepositoryWriteOptions } from "../repository.types";

/* ============================================================
   ENTITY
============================================================ */

export const GOLD_CUSTODY_ALLOCATION_ENTITY = "GOLD_CUSTODY_ALLOCATION";

/* ============================================================
   STORAGE RECORD

   Domain GoldCustodyAllocation already owns its allocation ID.

   Persistence-only metadata:

   - entity
   - businessId

   `entity` is explicit so the same record routes correctly
   through LOCAL / USB / future CLOUD storage.
============================================================ */

interface GoldCustodyAllocationStorageRecord extends GoldCustodyAllocation {
  entity: typeof GOLD_CUSTODY_ALLOCATION_ENTITY;

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

function toGoldCustodyAllocationStorageRecord(
  businessId: string,

  allocation: GoldCustodyAllocation,
): GoldCustodyAllocationStorageRecord {
  return {
    ...allocation,

    entity: GOLD_CUSTODY_ALLOCATION_ENTITY,

    businessId,
  };
}

/* ============================================================
   DOMAIN MAPPER
============================================================ */

function fromGoldCustodyAllocationStorageRecord(
  record: GoldCustodyAllocationStorageRecord,
): GoldCustodyAllocation {
  const {
    entity: _storageEntity,

    businessId: _businessId,

    ...allocation
  } = record;

  return allocation;
}

/* ============================================================
   QUERY BUILDER
============================================================ */

function buildGoldCustodyAllocationQuery(allocationId?: string): StorageQuery {
  return {
    entity: GOLD_CUSTODY_ALLOCATION_ENTITY,

    id: allocationId,
  };
}

/* ============================================================
   REPOSITORY
============================================================ */

export class GoldCustodyAllocationRepository {
  /* ==========================================================
     FIND ALL BY BUSINESS
  ========================================================== */

  async findAllByBusinessId(
    businessId: string,
  ): Promise<StorageResult<GoldCustodyAllocation[]>> {
    const normalizedBusinessId = normalizeString(businessId);

    if (!normalizedBusinessId) {
      return {
        success: false,

        error: "Business ID is required to load Gold custody allocations.",
      };
    }

    const result =
      await storageManager.getAll<GoldCustodyAllocationStorageRecord>(
        buildGoldCustodyAllocationQuery(),
      );

    if (!result.success) {
      return {
        success: false,

        error: result.error ?? "Unable to load Gold custody allocations.",
      };
    }

    const records = result.data ?? [];

    const allocations = records
      .filter(
        (record) => normalizeString(record.businessId) === normalizedBusinessId,
      )
      .map(fromGoldCustodyAllocationStorageRecord);

    return {
      success: true,

      data: allocations,
    };
  }

  /* ==========================================================
     FIND BY ALLOCATION ID
  ========================================================== */

  async findById(
    businessId: string,

    allocationId: GoldCustodyAllocationId,
  ): Promise<StorageResult<GoldCustodyAllocation | undefined>> {
    const normalizedBusinessId = normalizeString(businessId);

    const normalizedAllocationId = normalizeString(allocationId);

    if (!normalizedBusinessId) {
      return {
        success: false,

        error: "Business ID is required to load a Gold custody allocation.",
      };
    }

    if (!normalizedAllocationId) {
      return {
        success: false,

        error: "Allocation ID is required to load a Gold custody allocation.",
      };
    }

    const result = await storageManager.get<GoldCustodyAllocationStorageRecord>(
      buildGoldCustodyAllocationQuery(normalizedAllocationId),
    );

    if (!result.success) {
      return {
        success: false,

        error: result.error ?? "Unable to load Gold custody allocation.",
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

      data: fromGoldCustodyAllocationStorageRecord(result.data),
    };
  }

  /* ==========================================================
     FIND BY LOAN ID

     Returns complete custody history for the loan:

     - OCCUPIED
     - RELEASED
     - RELOCATED
  ========================================================== */

  async findByLoanId(
    businessId: string,

    loanId: string,
  ): Promise<StorageResult<GoldCustodyAllocation[]>> {
    const normalizedLoanId = normalizeString(loanId);

    if (!normalizedLoanId) {
      return {
        success: false,

        error: "Loan ID is required to load Gold custody history.",
      };
    }

    const allResult = await this.findAllByBusinessId(businessId);

    if (!allResult.success) {
      return {
        success: false,

        error: allResult.error ?? "Unable to load Gold custody history.",
      };
    }

    const allocations = (allResult.data ?? []).filter(
      (allocation) => normalizeString(allocation.loanId) === normalizedLoanId,
    );

    return {
      success: true,

      data: allocations,
    };
  }

  /* ==========================================================
     FIND ACTIVE BY LOAN ID

     OCCUPIED is the only active physical custody state.

     RELEASED and RELOCATED remain historical records.
  ========================================================== */

  async findActiveByLoanId(
    businessId: string,

    loanId: string,
  ): Promise<StorageResult<GoldCustodyAllocation | undefined>> {
    const historyResult = await this.findByLoanId(
      businessId,

      loanId,
    );

    if (!historyResult.success) {
      return {
        success: false,

        error:
          historyResult.error ??
          "Unable to load active Gold custody allocation.",
      };
    }

    const activeAllocation = (historyResult.data ?? []).find(
      (allocation) => allocation.status === "OCCUPIED",
    );

    return {
      success: true,

      data: activeAllocation,
    };
  }

  /* ==========================================================
     SAVE ALLOCATION
  ========================================================== */

  async save(
    businessId: string,

    allocation: GoldCustodyAllocation,

    options?: RepositoryWriteOptions,
  ): Promise<StorageResult<GoldCustodyAllocation>> {
    const normalizedBusinessId = normalizeString(businessId);

    const normalizedAllocationId = normalizeString(allocation.id);

    if (!normalizedBusinessId) {
      return {
        success: false,

        error: "Business ID is required before saving Gold custody allocation.",
      };
    }

    if (!normalizedAllocationId) {
      return {
        success: false,

        error:
          "Allocation ID is required before saving Gold custody allocation.",
      };
    }

    const existing = await this.findById(
      normalizedBusinessId,

      normalizedAllocationId,
    );

    if (!existing.success) {
      return {
        success: false,

        error:
          existing.error ??
          "Unable to verify existing Gold custody allocation.",
      };
    }

    if (existing.data) {
      return {
        success: false,

        error: "Gold custody allocation already exists.",
      };
    }

    const storageRecord = toGoldCustodyAllocationStorageRecord(
      normalizedBusinessId,

      allocation,
    );

    const result =
      await storageManager.save<GoldCustodyAllocationStorageRecord>(
        storageRecord,

        options,
      );

    if (!result.success) {
      return {
        success: false,

        error: result.error ?? "Unable to save Gold custody allocation.",
      };
    }

    return {
      success: true,

      data: allocation,
    };
  }

    /* =======================================================
     REPLACE BUSINESS ALLOCATION SNAPSHOT

     IMPORTANT:

     StorageManager.replaceAll() replaces the complete
     GOLD_CUSTODY_ALLOCATION entity for the active
     owner/demo context.

     Therefore records belonging to OTHER business IDs must
     first be preserved and included in the replacement array.

     This method is used for coordinated custody transitions
     such as relocation where:

     old allocation → RELOCATED
     new allocation → OCCUPIED

     must be written as one allocation-entity replacement.
  ========================================================== */

  async replaceBusinessSnapshot(
    businessId: string,

    allocations:
      GoldCustodyAllocation[],

    options?:
      RepositoryWriteOptions,
  ): Promise<
    StorageResult<GoldCustodyAllocation[]>
  > {
    const normalizedBusinessId =
      normalizeString(
        businessId,
      );

    if (
      !normalizedBusinessId
    ) {
      return {
        success: false,

        error:
          "Business ID is required before replacing Gold custody allocations.",
      };
    }

    /*
     * Relocation always has at least the historical source
     * allocation plus the new active allocation.
     *
     * Keeping this non-empty also avoids ambiguous empty-array
     * replaceAll behavior across storage adapters.
     */
    if (
      allocations.length === 0
    ) {
      return {
        success: false,

        error:
          "Gold custody allocation snapshot cannot be empty.",
      };
    }

    const allResult =
      await storageManager.getAll<
        GoldCustodyAllocationStorageRecord
      >(
        buildGoldCustodyAllocationQuery(),
      );

    if (
      !allResult.success
    ) {
      return {
        success: false,

        error:
          allResult.error ??
          "Unable to load current Gold custody allocation snapshot.",
      };
    }

    /* --------------------------------------------------------
       PRESERVE OTHER BUSINESSES

       Same owner/demo context may contain more than one FINORA
       business. Never erase their Gold custody records.
    -------------------------------------------------------- */

    const preservedRecords =
      (allResult.data ?? [])
        .filter(
          (record) =>
            normalizeString(
              record.businessId,
            ) !==
            normalizedBusinessId,
        );

    /* --------------------------------------------------------
       PREPARE TARGET BUSINESS SNAPSHOT
    -------------------------------------------------------- */

    const replacementRecords =
      allocations.map(
        (allocation) =>
          toGoldCustodyAllocationStorageRecord(
            normalizedBusinessId,

            allocation,
          ),
      );

    const completeEntitySnapshot = [
      ...preservedRecords,

      ...replacementRecords,
    ];

    /* --------------------------------------------------------
       SINGLE ENTITY REPLACEMENT
    -------------------------------------------------------- */

    const replaceResult =
      await storageManager.replaceAll<
        GoldCustodyAllocationStorageRecord
      >(
        completeEntitySnapshot,

        options,
      );

    if (
      !replaceResult.success
    ) {
      return {
        success: false,

        error:
          replaceResult.error ??
          "Unable to replace Gold custody allocation snapshot.",
      };
    }

    return {
      success: true,

      data:
        allocations,
    };
  }

  /* ==========================================================
     UPDATE ALLOCATION

     Used later for state transitions such as:

     OCCUPIED → RELEASED
     OCCUPIED → RELOCATED

     Record identity is preserved.
  ========================================================== */

  async update(
    businessId: string,

    allocation: GoldCustodyAllocation,

    options?: RepositoryWriteOptions,
  ): Promise<StorageResult<GoldCustodyAllocation>> {
    const normalizedBusinessId = normalizeString(businessId);

    const normalizedAllocationId = normalizeString(allocation.id);

    if (!normalizedBusinessId) {
      return {
        success: false,

        error:
          "Business ID is required before updating Gold custody allocation.",
      };
    }

    if (!normalizedAllocationId) {
      return {
        success: false,

        error:
          "Allocation ID is required before updating Gold custody allocation.",
      };
    }

    const existing = await this.findById(
      normalizedBusinessId,

      normalizedAllocationId,
    );

    if (!existing.success) {
      return {
        success: false,

        error: existing.error ?? "Unable to verify Gold custody allocation.",
      };
    }

    if (!existing.data) {
      return {
        success: false,

        error: "Gold custody allocation was not found.",
      };
    }

    const storageRecord = toGoldCustodyAllocationStorageRecord(
      normalizedBusinessId,

      allocation,
    );

    const result =
      await storageManager.update<GoldCustodyAllocationStorageRecord>(
        storageRecord,

        options,
      );

    if (!result.success) {
      return {
        success: false,

        error: result.error ?? "Unable to update Gold custody allocation.",
      };
    }

    return {
      success: true,

      data: allocation,
    };
  }
}

/* ============================================================
   SINGLETON
============================================================ */

export const goldCustodyAllocationRepository =
  new GoldCustodyAllocationRepository();

/* ============================================================
   END
============================================================ */
