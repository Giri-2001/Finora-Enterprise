// ============================================================
// FINORA ENTERPRISE OS™
//
// V2 STORAGE FOUNDATION
// LOCAL STORAGE ADAPTER
//
// RESPONSIBILITY:
//
// - Local browser/Electron renderer persistence
// - Implement the common StorageAdapter contract
// - Preserve V2 localStorage-backed persistence
// - Provide safe CRUD operations
// - Enforce owner / demo storage isolation
// - Provide FINORA-only data reset
// - Keep business logic outside the storage layer
//
// IMPORTANT:
//
// - No Customer logic.
// - No Loan logic.
// - No Collection logic.
// - No Payment logic.
// - No Report logic.
// - No Electron IPC.
// - No cloud logic.
// - delete() deletes ONE record only.
// - clear() is the explicit full-entity clear operation.
// - resetFinoraData() clears ONLY FINORA-owned entities
//   inside the active REAL / DEMO storage boundary.
//
// COLLECTION FIX:
//
// - Collection records are resolved BEFORE Loan records.
// - Collection identity is based on explicit collection fields.
// - A collection must NEVER be redirected into LOAN storage merely
//   because its workflow payload also contains loan-related fields.
// - The collection repository-generated `id` remains the storage
//   identity.
//
// VERSION : 2.5
// STATUS  : Production
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import {
  DataContext,
  StorageAvailability,
  StorageMode,
} from "../storage.types";

import type {
  StorageAdapter,
  StorageConfiguration,
  StorageQuery,
  StorageResult,
  StorageStatus,
  StorageWriteOptions,
} from "../storage.types";

// ============================================================
// STORAGE KEY PREFIX
// ============================================================

const STORAGE_PREFIX = "FINORA_V2";

const CANONICAL_REAL_STORAGE_PREFIX =
  "FINORA_V3_REAL";

const CANONICAL_DEMO_STORAGE_PREFIX =
  "FINORA_V3_DEMO";

// ============================================================
// ENTITY NAMES
// ============================================================

const ENTITY_CUSTOMER = "CUSTOMER";

const ENTITY_BUSINESS_IDENTITY = "BUSINESS_IDENTITY";

const ENTITY_BUSINESS_SETTINGS = "BUSINESS_SETTINGS";

const ENTITY_BRANCH_SETTINGS = "BRANCH_SETTINGS";

const ENTITY_BUSINESS_OWNER_PROFILE = "BUSINESS_OWNER_PROFILE";

const ENTITY_NUMBERING_SERIES = "NUMBERING_SERIES";

const ENTITY_CUSTOMER_NUMBERING_BINDING = "CUSTOMER_NUMBERING_BINDING";

const ENTITY_LOAN_NUMBER_SEQUENCE = "LOAN_NUMBER_SEQUENCE";

const ENTITY_LOAN_NUMBERING_BINDING = "LOAN_NUMBERING_BINDING";

const ENTITY_COLLECTION_NUMBER_SEQUENCE = "COLLECTION_NUMBER_SEQUENCE";

const ENTITY_LOAN = "LOAN";

const ENTITY_GOLD_STORAGE_SETTINGS = "GOLD_STORAGE_SETTINGS";

const ENTITY_GOLD_CUSTODY_ALLOCATION = "GOLD_CUSTODY_ALLOCATION";

const ENTITY_GOLD_RELOCATION_AUDIT = "GOLD_RELOCATION_AUDIT";

const ENTITY_COLLECTION = "COLLECTION";

const ENTITY_PAYMENT = "PAYMENT";

const ENTITY_WALLET = "WALLET";

const ENTITY_WALLET_TRANSACTION = "WALLET_TRANSACTION";

const ENTITY_WALLET_PAYMENT_INTENT = "WALLET_PAYMENT_INTENT";

const ENTITY_NOTIFICATION = "NOTIFICATION";

const ENTITY_NOTIFICATION_DELIVERY = "NOTIFICATION_DELIVERY";

const ENTITY_BUSINESS_NOTIFICATION_POLICY =
  "BUSINESS_NOTIFICATION_POLICY";

const ENTITY_CUSTOMER_NOTIFICATION_PREFERENCE =
  "CUSTOMER_NOTIFICATION_PREFERENCE";

const ENTITY_REPORT = "REPORT";

const ENTITY_GENERAL = "GENERAL";

// ============================================================
// FINORA RESET ENTITIES
// ============================================================

const FINORA_RESET_ENTITIES: readonly string[] = [
  ENTITY_CUSTOMER,

  ENTITY_BUSINESS_IDENTITY,

  ENTITY_BUSINESS_SETTINGS,

  ENTITY_BRANCH_SETTINGS,

  ENTITY_BUSINESS_OWNER_PROFILE,

  ENTITY_NUMBERING_SERIES,

  ENTITY_CUSTOMER_NUMBERING_BINDING,

  ENTITY_LOAN_NUMBER_SEQUENCE,

  ENTITY_LOAN_NUMBERING_BINDING,

  ENTITY_COLLECTION_NUMBER_SEQUENCE,

  ENTITY_GOLD_STORAGE_SETTINGS,

  ENTITY_GOLD_CUSTODY_ALLOCATION,

  ENTITY_GOLD_RELOCATION_AUDIT,

  ENTITY_LOAN,

  ENTITY_COLLECTION,

  ENTITY_PAYMENT,

  ENTITY_WALLET,

  ENTITY_WALLET_TRANSACTION,

  ENTITY_WALLET_PAYMENT_INTENT,

  ENTITY_NOTIFICATION,

  ENTITY_NOTIFICATION_DELIVERY,

  ENTITY_BUSINESS_NOTIFICATION_POLICY,

  ENTITY_CUSTOMER_NOTIFICATION_PREFERENCE,

  ENTITY_REPORT,

  ENTITY_GENERAL,
];

// ============================================================
// LOCAL STORAGE KEY BUILDER
// ============================================================

function normalizeStorageScopeId(
  value: string | undefined,
): string | undefined {
  const normalized =
    value?.trim();

  return normalized
    ? normalized
    : undefined;
}

// ============================================================
// LEGACY LOCAL STORAGE KEY BUILDER
// ============================================================

function buildLegacyStorageKey(
  query: StorageQuery,
  options?: StorageWriteOptions,
): string {
  const ownerId =
    normalizeStorageScopeId(
      options?.ownerId ??
        query.ownerId,
    );

  const demoId =
    normalizeStorageScopeId(
      options?.demoId ??
        query.demoId,
    );

  const context =
    demoId
      ? `${DataContext.DEMO}_${demoId}`
      : ownerId
        ? `${DataContext.REAL}_${ownerId}`
        : DataContext.REAL;

  return [
    STORAGE_PREFIX,
    context,
    query.entity,
  ].join("_");
}

// ============================================================
// TRANSITIONAL SCOPED V2 REAL KEY BUILDER
//
// Compatibility only.
//
// FINORA_V2_REAL_<OWNER>_<BUSINESS>_<BRANCH>_<ENTITY>
// ============================================================

function buildTransitionalScopedRealKey(
  query: StorageQuery,
  options?: StorageWriteOptions,
): string {
  const ownerId =
    normalizeStorageScopeId(
      options?.ownerId ??
        query.ownerId,
    );

  const businessId =
    normalizeStorageScopeId(
      options?.businessId ??
        query.businessId,
    );

  const branchId =
    normalizeStorageScopeId(
      options?.branchId ??
        query.branchId,
    );

  if (
    !ownerId ||
    !businessId ||
    !branchId
  ) {
    throw new Error(
      "Exact Owner, Business, and Branch scope is required for transitional REAL local storage.",
    );
  }

  return [
    STORAGE_PREFIX,
    `${DataContext.REAL}_${ownerId}`,
    businessId,
    branchId,
    query.entity,
  ].join("_");
}

// ============================================================
// CANONICAL V3 SEGMENT ENCODING
//
// Length-prefixing makes physical REAL keys injective even when
// identifiers contain "_", "|", ":", or other delimiters.
// ============================================================

function encodeCanonicalStorageSegment(
  value: string,
): string {
  return `${value.length}:${value}`;
}

// ============================================================
// CURRENT LOCAL STORAGE KEY BUILDER
//
// REAL canonical:
//
// FINORA_V3_REAL|<len>:<OWNER>|<len>:<BUSINESS>|
// <len>:<BRANCH>|<len>:<ENTITY>
//
// DEMO:
//
// DEMO now uses exact tenant-scoped V3 canonical grammar.
// ============================================================

function buildStorageKey(
  query: StorageQuery,
  options?: StorageWriteOptions,
): string {
  const ownerId =
    normalizeStorageScopeId(
      options?.ownerId ??
        query.ownerId,
    );

  const businessId =
    normalizeStorageScopeId(
      options?.businessId ??
        query.businessId,
    );

  const branchId =
    normalizeStorageScopeId(
      options?.branchId ??
        query.branchId,
    );

  const demoId =
    normalizeStorageScopeId(
      options?.demoId ??
        query.demoId,
    );

  if (demoId) {
    if (
      !ownerId ||
      !businessId ||
      !branchId
    ) {
      throw new Error(
        "Exact Owner, Business, Branch, and Demo scope is required for DEMO local storage.",
      );
    }

    return [
      CANONICAL_DEMO_STORAGE_PREFIX,
      encodeCanonicalStorageSegment(
        ownerId,
      ),
      encodeCanonicalStorageSegment(
        businessId,
      ),
      encodeCanonicalStorageSegment(
        branchId,
      ),
      encodeCanonicalStorageSegment(
        demoId,
      ),
      encodeCanonicalStorageSegment(
        query.entity,
      ),
    ].join("|");
  }

  if (
    !ownerId ||
    !businessId ||
    !branchId
  ) {
    throw new Error(
      "Exact Owner, Business, and Branch scope is required for REAL local storage.",
    );
  }

  return [
    CANONICAL_REAL_STORAGE_PREFIX,
    encodeCanonicalStorageSegment(
      ownerId,
    ),
    encodeCanonicalStorageSegment(
      businessId,
    ),
    encodeCanonicalStorageSegment(
      branchId,
    ),
    encodeCanonicalStorageSegment(
      query.entity,
    ),
  ].join("|");
}

// ============================================================
// LEGACY DEMO LOCAL COMPATIBILITY GUARD
//
// Pre-V3 DEMO keys contain only demoId + entity.
// They do NOT encode owner/business/branch.
//
// Historical record payloads do not universally contain
// enough tenant fields to attribute that legacy namespace.
// Therefore legacy DEMO data must never be silently assigned
// to the currently active tenant.
//
// No broad localStorage enumeration is used.
// Only FINORA-owned entity keys for the active demoId are read.
//
// Legacy bytes are preserved untouched on rejection.
// ============================================================

function guardLegacyDemoLocalTenant(
  configuration: StorageConfiguration,
): StorageResult<void> {
  try {
    if (
      configuration.dataContext !==
      DataContext.DEMO
    ) {
      return {
        success: true,
      };
    }

    const ownerId =
      normalizeStorageScopeId(
        configuration.ownerId,
      );

    const businessId =
      normalizeStorageScopeId(
        configuration.businessId,
      );

    const branchId =
      normalizeStorageScopeId(
        configuration.branchId,
      );

    const demoId =
      normalizeStorageScopeId(
        configuration.demoId,
      );

    if (
      !ownerId ||
      !businessId ||
      !branchId ||
      !demoId
    ) {
      return {
        success: false,

        error:
          "Exact Owner, Business, Branch, and Demo scope is required before DEMO LOCAL storage initialization.",
      };
    }

    for (
      const entity
      of FINORA_RESET_ENTITIES
    ) {
      const legacyKey =
        buildLegacyStorageKey({
          entity,

          ownerId,

          businessId,

          branchId,

          demoId,
        });

      if (
        localStorage.getItem(
          legacyKey,
        ) !== null
      ) {
        return {
          success: false,

          error:
            "Legacy DEMO LOCAL storage cannot be safely attributed to the active exact tenant.",
        };
      }
    }

    return {
      success: true,
    };
  }
  catch {
    return {
      success: false,

      error:
        "Unable to validate legacy DEMO LOCAL storage compatibility.",
    };
  }
}

// ============================================================
// LEGACY REAL MIGRATION CONTRACTS
// ============================================================

interface LegacyRealLocalEntry {
  entity: string;

  sourceKeys: string[];

  canonicalKey: string;

  raw: string;

  records: unknown[];
}

type StrictStoredArrayResult =
  | {
      success: true;

      records: unknown[];
    }
  | {
      success: false;

      error: string;
    };

// ============================================================
// STRICT RAW ARRAY PARSER
//
// Migration must never turn malformed persisted data into [].
// ============================================================

function parseStoredArrayStrict(
  raw: string,
  key: string,
): StrictStoredArrayResult {
  try {
    const parsed =
      JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return {
        success: false,

        error:
          `Legacy LOCAL key ${key} does not contain a JSON array.`,
      };
    }

    return {
      success: true,

      records:
        parsed as unknown[],
    };
  } catch {
    return {
      success: false,

      error:
        `Legacy LOCAL key ${key} contains malformed JSON.`,
    };
  }
}

// ============================================================
// EXPLICIT LEGACY TENANT VALIDATION
//
// Missing fields remain compatible with older records.
//
// But any explicit tenant field must:
// - be a non-empty string
// - equal the authenticated tenant
//
// REAL legacy records cannot carry a non-empty demoId.
// ============================================================

function validateExplicitLegacyTenantScope(
  record: unknown,
  ownerId: string,
  businessId: string,
  branchId: string,
): string | null {
  // Existing callers supply the full active tuple.
  // Historical business/branch identifiers are provenance,
  // not migration security boundaries.
  void businessId;
  void branchId;

  if (
    typeof record !== "object" ||
    record === null
  ) {
    return (
      "Legacy LOCAL record is not a valid object."
    );
  }

  const value =
    record as Record<string, unknown>;

  if (
    Object.prototype.hasOwnProperty.call(
      value,
      "ownerId",
    )
  ) {
    const rawOwnerId =
      value.ownerId;

    if (
      typeof rawOwnerId !== "string" ||
      !rawOwnerId.trim()
    ) {
      return (
        "Legacy LOCAL record has an invalid explicit ownerId."
      );
    }

    if (
      rawOwnerId.trim() !==
      ownerId
    ) {
      return (
        "Legacy LOCAL record ownerId does not match the active owner."
      );
    }
  }

  if (
    Object.prototype.hasOwnProperty.call(
      value,
      "demoId",
    )
  ) {
    const rawDemoId =
      value.demoId;

    if (
      typeof rawDemoId !== "string"
    ) {
      return (
        "Legacy REAL LOCAL record has an invalid explicit demoId."
      );
    }

    if (rawDemoId.trim()) {
      return (
        "Legacy REAL LOCAL record cannot contain a nonblank demoId."
      );
    }
  }

  return null;
}
// ============================================================
// BUSINESS_OWNER_PROFILE SUCCESSOR ANCHOR
//
// OWNER is the strict continuity boundary.
// Historical business/branch tuples are preserved as provenance.
// updatedAt selects the newest authoritative profile set.
// Equal newest timestamps are accepted only when every profile
// at that timestamp resolves to the active canonical tuple.
// Array order is never used as successor authority.
// ============================================================

function validateLegacyOwnerProfileAnchor(
  records: unknown[],
  ownerId: string,
  businessId: string,
  branchId: string,
): string | null {
  if (!records.length) {
    return (
      "Legacy LOCAL BUSINESS_OWNER_PROFILE anchor is empty."
    );
  }

  const expectedTuple =
    [
      ownerId,
      businessId,
      branchId,
    ].join("::");

  let hasCanonicalWitness =
    false;

  let newestUpdatedAt =
    Number.NEGATIVE_INFINITY;

  const newestTuples =
    new Set<string>();

  for (const record of records) {
    if (
      typeof record !== "object" ||
      record === null
    ) {
      return (
        "Legacy LOCAL BUSINESS_OWNER_PROFILE contains an invalid record."
      );
    }

    const value =
      record as Record<string, unknown>;

    const profileOwnerId =
      typeof value.ownerId === "string"
        ? value.ownerId.trim()
        : "";

    const profileBusinessId =
      typeof value.businessId === "string"
        ? value.businessId.trim()
        : "";

    const profileBranchId =
      typeof value.branchId === "string"
        ? value.branchId.trim()
        : "";

    const profileUserId =
      typeof value.userId === "string"
        ? value.userId.trim()
        : "";

    if (
      !profileOwnerId ||
      !profileBusinessId ||
      !profileBranchId ||
      !profileUserId
    ) {
      return (
        "Legacy LOCAL BUSINESS_OWNER_PROFILE contains an incomplete identity."
      );
    }

    if (profileOwnerId !== ownerId) {
      return (
        "Legacy LOCAL BUSINESS_OWNER_PROFILE contains a foreign owner identity."
      );
    }

    const rawUpdatedAt =
      typeof value.updatedAt === "string"
        ? value.updatedAt.trim()
        : "";

    if (!rawUpdatedAt) {
      return (
        "Legacy LOCAL BUSINESS_OWNER_PROFILE contains an invalid successor timestamp."
      );
    }

    const parsedUpdatedAt =
      Date.parse(rawUpdatedAt);

    if (
      !Number.isFinite(parsedUpdatedAt)
    ) {
      return (
        "Legacy LOCAL BUSINESS_OWNER_PROFILE contains an invalid successor timestamp."
      );
    }

    const tuple =
      [
        profileOwnerId,
        profileBusinessId,
        profileBranchId,
      ].join("::");

    if (tuple === expectedTuple) {
      hasCanonicalWitness =
        true;
    }

    if (
      parsedUpdatedAt >
      newestUpdatedAt
    ) {
      newestUpdatedAt =
        parsedUpdatedAt;

      newestTuples.clear();
      newestTuples.add(tuple);
    }
    else if (
      parsedUpdatedAt ===
      newestUpdatedAt
    ) {
      newestTuples.add(tuple);
    }
  }

  if (!hasCanonicalWitness) {
    return (
      "Legacy LOCAL BUSINESS_OWNER_PROFILE has no active canonical tenant witness."
    );
  }

  if (
    newestTuples.size !== 1 ||
    !newestTuples.has(expectedTuple)
  ) {
    return (
      "Legacy LOCAL BUSINESS_OWNER_PROFILE newest successor is ambiguous or does not match the active tenant."
    );
  }

  return null;
}
// ============================================================
// LEGACY REAL LOCAL MIGRATION
//
// PRE-FLIGHT:
// - deterministic FINORA entities only
// - strict raw JSON validation
// - owner-profile consensus
// - explicit tenant validation
// - target collision validation
// - ZERO writes until every check passes
//
// COMMIT:
// - copy exact raw string
// - exact read-back
// - delete legacy key
// - migrate owner-profile anchor LAST
//
// RESTART:
// - equal target/source pairs are safe migration residue
// ============================================================

function migrateLegacyRealLocalTenant(
  configuration: StorageConfiguration,
): StorageResult<void> {
  try {
    if (
      configuration.dataContext !==
      DataContext.REAL
    ) {
      return {
        success: true,
      };
    }

    const ownerId =
      normalizeStorageScopeId(
        configuration.ownerId,
      );

    const businessId =
      normalizeStorageScopeId(
        configuration.businessId,
      );

    const branchId =
      normalizeStorageScopeId(
        configuration.branchId,
      );

    const suppliedScopeCount =
      [
        ownerId,
        businessId,
        branchId,
      ].filter(Boolean).length;

    // resetDataContext() may intentionally initialize a blank
    // local adapter context. It has no migration target.
    if (suppliedScopeCount === 0) {
      return {
        success: true,
      };
    }

    if (
      !ownerId ||
      !businessId ||
      !branchId
    ) {
      return {
        success: false,

        error:
          "Exact Owner, Business, and Branch scope is required before REAL LOCAL migration.",
      };
    }

    const entries:
      LegacyRealLocalEntry[] = [];

    for (
      const entity
      of FINORA_RESET_ENTITIES
    ) {
      const query:
        StorageQuery = {
        entity,

        ownerId,

        businessId,

        branchId,
      };

      const legacyKey =
        buildLegacyStorageKey(
          query,
        );

      const transitionalKey =
        buildTransitionalScopedRealKey(
          query,
        );

      const canonicalKey =
        buildStorageKey(
          query,
        );

      const legacyRaw =
        localStorage.getItem(
          legacyKey,
        );

      const transitionalRaw =
        localStorage.getItem(
          transitionalKey,
        );

      if (
        legacyRaw === null &&
        transitionalRaw === null
      ) {
        continue;
      }

      if (
        legacyRaw !== null &&
        transitionalRaw !== null &&
        legacyRaw !== transitionalRaw
      ) {
        return {
          success: false,

          error:
            `Pre-V3 REAL LOCAL source conflict for ${entity}.`,
        };
      }

      const raw =
        legacyRaw ??
        transitionalRaw;

      if (raw === null) {
        continue;
      }

      const parsed =
        parseStoredArrayStrict(
          raw,
          legacyRaw !== null
            ? legacyKey
            : transitionalKey,
        );

      if (!parsed.success) {
        return {
          success: false,

          error:
            parsed.error,
        };
      }

      const sourceKeys:
        string[] = [];

      if (legacyRaw !== null) {
        sourceKeys.push(
          legacyKey,
        );
      }

      if (transitionalRaw !== null) {
        sourceKeys.push(
          transitionalKey,
        );
      }

      entries.push({
        entity,

        sourceKeys,

        canonicalKey,

        raw,

        records:
          parsed.records,
      });
    }

    if (!entries.length) {
      return {
        success: true,
      };
    }

    const anchor =
      entries.find(
        (entry) =>
          entry.entity ===
          ENTITY_BUSINESS_OWNER_PROFILE,
      );

    if (!anchor) {
      return {
        success: false,

        error:
          "Pre-V3 REAL LOCAL data cannot be attributed because BUSINESS_OWNER_PROFILE is missing.",
      };
    }

    const anchorError =
      validateLegacyOwnerProfileAnchor(
        anchor.records,
        ownerId,
        businessId,
        branchId,
      );

    if (anchorError) {
      return {
        success: false,

        error:
          anchorError,
      };
    }

    // --------------------------------------------------------
    // COMPLETE PRE-FLIGHT
    //
    // No physical mutation occurs before:
    // - all source JSON parses
    // - all tenant fields validate
    // - all dual-V2 source pairs agree
    // - all canonical V3 targets are absent or exact-equal
    // --------------------------------------------------------

    for (const entry of entries) {
      for (
        const record
        of entry.records
      ) {
        const validationError =
          validateExplicitLegacyTenantScope(
            record,
            ownerId,
            businessId,
            branchId,
          );

        if (validationError) {
          return {
            success: false,

            error:
              `${entry.entity}: ${validationError}`,
          };
        }
      }

      const existingCanonicalRaw =
        localStorage.getItem(
          entry.canonicalKey,
        );

      if (
        existingCanonicalRaw !== null &&
        existingCanonicalRaw !== entry.raw
      ) {
        return {
          success: false,

          error:
            `Canonical V3 REAL LOCAL target conflict for ${entry.entity}.`,
        };
      }
    }

    // --------------------------------------------------------
    // COMMIT ORDER
    //
    // BUSINESS_OWNER_PROFILE is the attribution authority.
    // Keep every pre-V3 anchor source until all non-anchor
    // entities have copied and verified successfully.
    // --------------------------------------------------------

    const nonAnchorEntries =
      entries.filter(
        (entry) =>
          entry.entity !==
          ENTITY_BUSINESS_OWNER_PROFILE,
      );

    const anchorEntries =
      entries.filter(
        (entry) =>
          entry.entity ===
          ENTITY_BUSINESS_OWNER_PROFILE,
      );

    const commitOrder =
      [
        ...nonAnchorEntries,
        ...anchorEntries,
      ];

    for (
      const entry
      of commitOrder
    ) {
      const existingCanonicalRaw =
        localStorage.getItem(
          entry.canonicalKey,
        );

      if (existingCanonicalRaw === null) {
        localStorage.setItem(
          entry.canonicalKey,
          entry.raw,
        );
      }

      const verifiedCanonicalRaw =
        localStorage.getItem(
          entry.canonicalKey,
        );

      if (
        verifiedCanonicalRaw !==
        entry.raw
      ) {
        return {
          success: false,

          error:
            `Canonical V3 REAL LOCAL read-back failed for ${entry.entity}.`,
        };
      }

      for (
        const sourceKey
        of entry.sourceKeys
      ) {
        localStorage.removeItem(
          sourceKey,
        );

        if (
          localStorage.getItem(
            sourceKey,
          ) !== null
        ) {
          return {
            success: false,

            error:
              `Pre-V3 REAL LOCAL cleanup failed for ${entry.entity}.`,
          };
        }
      }
    }

    return {
      success: true,
    };
  } catch {
    return {
      success: false,

      error:
        "Unable to migrate pre-V3 REAL LOCAL storage.",
    };
  }
}

function readArray<T = unknown>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed as T[];
  } catch {
    return [];
  }
}

// ============================================================
// WRITE ARRAY
// ============================================================

function writeArray<T = unknown>(
  key: string,
  records: T[],
): StorageResult<T[]> {
  try {
    localStorage.setItem(key, JSON.stringify(records));

    return {
      success: true,
      data: records,
    };
  } catch {
    return {
      success: false,
      error: "Unable to write data to local storage.",
    };
  }
}

// ============================================================
// ID EXTRACTION
// ============================================================
//
// IMPORTANT:
//
// `id` is always preferred.
//
// The other identifiers remain compatibility fallbacks for
// older FINORA V2 records.
//
// ============================================================

function getRecordId(record: unknown): string | undefined {
  if (typeof record !== "object" || record === null) {
    return undefined;
  }

  const value = record as Record<string, unknown>;

  // ----------------------------------------------------------
  // PRIMARY STORAGE ID
  // ----------------------------------------------------------

  if (typeof value.id === "string" && value.id.trim()) {
    return value.id;
  }

  // ----------------------------------------------------------
  // COMPATIBILITY IDENTIFIERS
  // ----------------------------------------------------------

  if (typeof value.customerId === "string" && value.customerId.trim()) {
    return value.customerId;
  }

  if (typeof value.loanId === "string" && value.loanId.trim()) {
    return value.loanId;
  }

  if (typeof value.paymentId === "string" && value.paymentId.trim()) {
    return value.paymentId;
  }

  if (typeof value.collectionId === "string" && value.collectionId.trim()) {
    return value.collectionId;
  }

  if (typeof value.notificationId === "string" && value.notificationId.trim()) {
    return value.notificationId;
  }

  return undefined;
}

// ============================================================
// ENTITY RESOLUTION
// ============================================================
//
// IMPORTANT:
//
// This function is the critical persistence routing boundary.
//
// Collection MUST be checked before Loan.
//
// Why:
//
// CollectionReviewData can carry loan-related workflow data.
//
// If Loan is checked first, a Collection payload containing
// `outstanding` / `loanType` can incorrectly be routed into:
//
//   FINORA_V2_REAL_<OWNER>_LOAN
//
// instead of:
//
//   FINORA_V2_REAL_<OWNER>_COLLECTION
//
// Therefore Collection gets an explicit priority.
//
// ============================================================

function resolveEntity(record: unknown): string {
  if (typeof record !== "object" || record === null) {
    return ENTITY_GENERAL;
  }

  const value = record as Record<string, unknown>;

  // ==========================================================
  // GOLD STORAGE SETTINGS
  // ==========================================================
  //
  // Gold Storage repository supplies an explicit entity marker
  // because the same persisted record must work consistently
  // across:
  //
  // - LOCAL
  // - USB
  // - future CLOUD
  //
  // Keep this rule narrow so existing heuristic routing for
  // Customer / Loan / Collection remains untouched.
  // ==========================================================

  if (value.entity === ENTITY_BUSINESS_IDENTITY) {
    return ENTITY_BUSINESS_IDENTITY;
  }

  if (value.entity === ENTITY_BUSINESS_SETTINGS) {
    return ENTITY_BUSINESS_SETTINGS;
  }

  if (value.entity === ENTITY_GOLD_STORAGE_SETTINGS) {
    return ENTITY_GOLD_STORAGE_SETTINGS;
  }

  if (value.entity === ENTITY_BRANCH_SETTINGS) {
    return ENTITY_BRANCH_SETTINGS;
  }

  if (value.entity === ENTITY_BUSINESS_OWNER_PROFILE) {
    return ENTITY_BUSINESS_OWNER_PROFILE;
  }

  if (value.entity === ENTITY_NUMBERING_SERIES) {
    return ENTITY_NUMBERING_SERIES;
  }

  if (value.entity === ENTITY_CUSTOMER_NUMBERING_BINDING) {
    return ENTITY_CUSTOMER_NUMBERING_BINDING;
  }

  if (value.entity === ENTITY_LOAN_NUMBER_SEQUENCE) {
    return ENTITY_LOAN_NUMBER_SEQUENCE;
  }

  if (value.entity === ENTITY_LOAN_NUMBERING_BINDING) {
    return ENTITY_LOAN_NUMBERING_BINDING;
  }

  if (value.entity === ENTITY_COLLECTION_NUMBER_SEQUENCE) {
    return ENTITY_COLLECTION_NUMBER_SEQUENCE;
  }

  if (value.entity === ENTITY_GOLD_CUSTODY_ALLOCATION) {
    return ENTITY_GOLD_CUSTODY_ALLOCATION;
  }

  if (value.entity === ENTITY_GOLD_RELOCATION_AUDIT) {
    return ENTITY_GOLD_RELOCATION_AUDIT;
  }

  // ==========================================================
  // WALLET ENGINE
  // ==========================================================
  //
  // Explicit Wallet entities MUST be resolved before
  // compatibility heuristics so repository reads and writes use
  // the same persistent entity key.
  // ==========================================================

  if (value.entity === ENTITY_WALLET) {
    return ENTITY_WALLET;
  }

  if (value.entity === ENTITY_WALLET_TRANSACTION) {
    return ENTITY_WALLET_TRANSACTION;
  }

  if (value.entity === ENTITY_WALLET_PAYMENT_INTENT) {
    return ENTITY_WALLET_PAYMENT_INTENT;
  }

  // ==========================================================
  // NOTIFICATIONS ENGINE
  // ==========================================================
  //
  // Explicit Notification entities MUST be resolved before
  // compatibility heuristics.
  //
  // NotificationDeliveryRecord also carries notificationId.
  // Without this explicit check it would be incorrectly routed
  // into the legacy NOTIFICATION entity.
  // ==========================================================

  if (value.entity === ENTITY_NOTIFICATION) {
    return ENTITY_NOTIFICATION;
  }

  if (value.entity === ENTITY_NOTIFICATION_DELIVERY) {
    return ENTITY_NOTIFICATION_DELIVERY;
  }

  if (
    value.entity ===
    ENTITY_BUSINESS_NOTIFICATION_POLICY
  ) {
    return ENTITY_BUSINESS_NOTIFICATION_POLICY;
  }

  if (
    value.entity ===
    ENTITY_CUSTOMER_NOTIFICATION_PREFERENCE
  ) {
    return ENTITY_CUSTOMER_NOTIFICATION_PREFERENCE;
  }

  // ==========================================================
  // COLLECTION
  // ==========================================================
  //
  // Collection is identified by the combination of:
  //
  // - loanId
  // - paymentAmount / receiptNumber / selectedEmiNumbers
  //
  // `loanId + status` remains a compatibility signal.
  //
  // IMPORTANT:
  //
  // This block intentionally comes BEFORE Loan.
  //
  // ==========================================================

  const hasLoanId =
    typeof value.loanId === "string" && value.loanId.trim().length > 0;

  const hasPaymentAmount = "paymentAmount" in value;

  const hasReceiptNumber = "receiptNumber" in value;

  const hasSelectedEmiNumbers = "selectedEmiNumbers" in value;

  const hasCollectionStatus =
    "status" in value &&
    (value.status === "Approved" ||
      value.status === "Pending" ||
      value.status === "Rejected" ||
      value.status === "Draft");

  if (
    hasLoanId &&
    (hasPaymentAmount ||
      hasReceiptNumber ||
      hasSelectedEmiNumbers ||
      hasCollectionStatus)
  ) {
    return ENTITY_COLLECTION;
  }

  // ==========================================================
  // PAYMENT
  // ==========================================================

  if ("paymentId" in value) {
    return ENTITY_PAYMENT;
  }

  // ==========================================================
  // NOTIFICATION
  // ==========================================================

  if ("notificationId" in value) {
    return ENTITY_NOTIFICATION;
  }

  // ==========================================================
  // CUSTOMER
  // ==========================================================

  if ("identity" in value) {
    return ENTITY_CUSTOMER;
  }

  // ==========================================================
  // BUSINESS IDENTITY
  // ==========================================================

  if (
    "businessId" in value &&
    "businessName" in value &&
    "branchId" in value &&
    "branchName" in value
  ) {
    return ENTITY_BUSINESS_IDENTITY;
  }

  // ==========================================================
  // BUSINESS SETTINGS
  // ==========================================================

  if ("businessId" in value && "address" in value && "currency" in value) {
    return ENTITY_BUSINESS_SETTINGS;
  }

  // ==========================================================
  // LOAN
  // ==========================================================
  //
  // Loan is evaluated only AFTER Collection.
  //
  // ==========================================================

  if ("outstanding" in value && "loanType" in value) {
    return ENTITY_LOAN;
  }

  // ==========================================================
  // REPORT
  // ==========================================================

  if ("reportId" in value) {
    return ENTITY_REPORT;
  }

  // ==========================================================
  // GENERAL
  // ==========================================================

  return ENTITY_GENERAL;
}

// ============================================================
// LOCAL STORAGE ADAPTER
// ============================================================

export class LocalStorageAdapter implements StorageAdapter {
  // ==========================================================
  // MODE
  // ==========================================================

  readonly mode = StorageMode.LOCAL;

  // ==========================================================
  // CURRENT CONFIGURATION
  // ==========================================================

  private configuration: StorageConfiguration = {
    storageMode: StorageMode.LOCAL,

    dataContext: DataContext.REAL,
  };

  // ==========================================================
  // INITIALIZE
  // ==========================================================

  async initialize(
    configuration: StorageConfiguration,
  ): Promise<StorageResult<void>> {
    try {
      if (typeof localStorage === "undefined") {
        return {
          success: false,

          error: "Local storage is not available.",
        };
      }

      if (configuration.storageMode !== StorageMode.LOCAL) {
        return {
          success: false,

          error: "Local storage adapter received an invalid storage mode.",
        };
      }

      const migrationResult =
        migrateLegacyRealLocalTenant(
          configuration,
        );

      if (!migrationResult.success) {
        return {
          success: false,

          error:
            migrationResult.error ??
            "Unable to migrate legacy REAL LOCAL storage.",
        };
      }

      const demoCompatibilityResult =
        guardLegacyDemoLocalTenant(
          configuration,
        );

      if (
        !demoCompatibilityResult.success
      ) {
        return {
          success: false,

          error:
            demoCompatibilityResult.error ??
            "Unable to establish exact DEMO LOCAL storage scope.",
        };
      }

      this.configuration = {
        ...configuration,
      };

      return {
        success: true,
      };
    } catch {
      return {
        success: false,

        error: "Unable to initialize local storage.",
      };
    }
  }

  // ==========================================================
  // AVAILABILITY
  // ==========================================================

  async isAvailable(): Promise<boolean> {
    try {
      if (typeof localStorage === "undefined") {
        return false;
      }

      const testKey = `${STORAGE_PREFIX}_AVAILABILITY_TEST`;

      localStorage.setItem(testKey, "1");

      localStorage.removeItem(testKey);

      return true;
    } catch {
      return false;
    }
  }

  // ==========================================================
  // STATUS
  // ==========================================================

  async getStatus(): Promise<StorageStatus> {
    const available = await this.isAvailable();

    return {
      mode: StorageMode.LOCAL,

      availability: available
        ? StorageAvailability.READY
        : StorageAvailability.UNAVAILABLE,

      dataContext: this.configuration.dataContext,

      ownerId: this.configuration.ownerId,

      demoId: this.configuration.demoId,

      storageId: this.configuration.storageId,

      checkedAt: new Date().toISOString(),

      message: available
        ? "Local storage is ready."
        : "Local storage is unavailable.",
    };
  }

  // ==========================================================
  // GET ONE
  // ==========================================================

  async get<T = unknown>(
    query: StorageQuery,
  ): Promise<StorageResult<T | undefined>> {
    try {
      const key = buildStorageKey(query);

      const records = readArray<T>(key);

      if (!query.id) {
        return {
          success: true,

          data: undefined,
        };
      }

      const record = records.find((item) => getRecordId(item) === query.id);

      return {
        success: true,

        data: record,
      };
    } catch {
      return {
        success: false,

        error: "Unable to read local storage.",
      };
    }
  }

  // ==========================================================
  // GET ALL
  // ==========================================================

  async getAll<T = unknown>(query: StorageQuery): Promise<StorageResult<T[]>> {
    try {
      const key = buildStorageKey(query);

      let records = readArray<T>(key);

      if (typeof query.offset === "number") {
        records = records.slice(query.offset);
      }

      if (typeof query.limit === "number") {
        records = records.slice(0, query.limit);
      }

      return {
        success: true,

        data: records,
      };
    } catch {
      return {
        success: false,

        error: "Unable to read local storage.",
      };
    }
  }

  // ==========================================================
  // SAVE
  // ==========================================================

  async save<T = unknown>(
    record: T,
    options?: StorageWriteOptions,
  ): Promise<StorageResult<T>> {
    try {
      // --------------------------------------------------------
      // RECORD ID
      // --------------------------------------------------------

      const id = getRecordId(record);

      if (!id) {
        return {
          success: false,

          error: "Storage record requires a supported identifier.",
        };
      }

      // --------------------------------------------------------
      // ENTITY RESOLUTION
      // --------------------------------------------------------

      const entity = resolveEntity(record);

      // --------------------------------------------------------
      // STORAGE QUERY
      // --------------------------------------------------------

      const query: StorageQuery = {
        entity,
      };

      // --------------------------------------------------------
      // STORAGE KEY
      // --------------------------------------------------------

      const key = buildStorageKey(query, options);

      // --------------------------------------------------------
      // READ EXISTING RECORDS
      // --------------------------------------------------------

      const records = readArray<T>(key);

      // --------------------------------------------------------
      // DUPLICATE CHECK
      // --------------------------------------------------------

      const existingIndex = records.findIndex(
        (item) => getRecordId(item) === id,
      );

      if (existingIndex !== -1) {
        return {
          success: false,

          error: "A record with the same identifier already exists.",
        };
      }

      // --------------------------------------------------------
      // APPEND
      // --------------------------------------------------------

      records.push(record);

      // --------------------------------------------------------
      // PERSIST
      // --------------------------------------------------------

      const result = writeArray(key, records);

      if (!result.success) {
        return {
          success: false,

          error: result.error ?? "Unable to save record to local storage.",
        };
      }

      // --------------------------------------------------------
      // AUDIT LOG
      // --------------------------------------------------------

      console.info("FINORA LOCAL STORAGE SAVE", {
        entity,

        key,

        id,

        ownerId: options?.ownerId ?? this.configuration.ownerId,

        demoId: options?.demoId ?? this.configuration.demoId,
      });

      return {
        success: true,

        data: record,
      };
    } catch {
      return {
        success: false,

        error: "Unable to save record to local storage.",
      };
    }
  }

  // ==========================================================
  // UPDATE
  // ==========================================================

  async update<T = unknown>(
    record: T,
    options?: StorageWriteOptions,
  ): Promise<StorageResult<T>> {
    try {
      const id = getRecordId(record);

      if (!id) {
        return {
          success: false,

          error: "Storage record requires a supported identifier.",
        };
      }

      const entity = resolveEntity(record);

      const query: StorageQuery = {
        entity,
      };

      const key = buildStorageKey(query, options);

      const records = readArray<T>(key);

      const index = records.findIndex((item) => getRecordId(item) === id);

      if (index === -1) {
        return {
          success: false,

          error: "Storage record was not found.",
        };
      }

      records[index] = record;

      const result = writeArray(key, records);

      if (!result.success) {
        return {
          success: false,

          error: result.error ?? "Unable to update record in local storage.",
        };
      }

      console.info("FINORA LOCAL STORAGE UPDATE", {
        entity,

        key,

        id,
      });

      return {
        success: true,

        data: record,
      };
    } catch {
      return {
        success: false,

        error: "Unable to update record in local storage.",
      };
    }
  }

  // ==========================================================
  // DELETE ONE RECORD
  // ==========================================================

  async delete(query: StorageQuery): Promise<StorageResult<void>> {
    try {
      if (!query.id) {
        return {
          success: false,

          error: "Storage record ID is required for delete.",
        };
      }

      const key = buildStorageKey(query);

      const records = readArray<unknown>(key);

      const existing = records.find((item) => getRecordId(item) === query.id);

      if (!existing) {
        return {
          success: false,

          error: "Storage record was not found.",
        };
      }

      const filtered = records.filter((item) => getRecordId(item) !== query.id);

      const result = writeArray(key, filtered);

      if (!result.success) {
        return {
          success: false,

          error: result.error ?? "Unable to delete local storage record.",
        };
      }

      return {
        success: true,
      };
    } catch {
      return {
        success: false,

        error: "Unable to delete local storage record.",
      };
    }
  }

  // ==========================================================
  // REPLACE ALL
  // ==========================================================

  async replaceAll<T = unknown>(
    records: T[],
    options?: StorageWriteOptions,
  ): Promise<StorageResult<void>> {
    try {
      if (!records.length) {
        return {
          success: true,
        };
      }

      const firstRecord = records[0];

      const query: StorageQuery = {
        entity: resolveEntity(firstRecord),
      };

      const key = buildStorageKey(query, options);

      const result = writeArray(key, records);

      if (!result.success) {
        return {
          success: false,

          error: result.error ?? "Unable to replace local storage records.",
        };
      }

      return {
        success: true,
      };
    } catch {
      return {
        success: false,

        error: "Unable to replace local storage records.",
      };
    }
  }

  // ==========================================================
  // CLEAR
  // ==========================================================

  async clear(query: StorageQuery): Promise<StorageResult<void>> {
    try {
      const key = buildStorageKey(query);

      localStorage.removeItem(key);

      return {
        success: true,
      };
    } catch {
      return {
        success: false,

        error: "Unable to clear local storage.",
      };
    }
  }

  // ==========================================================
  // RESET FINORA DATA
  // ==========================================================

  async resetFinoraData(): Promise<StorageResult<void>> {
    try {
      if (typeof localStorage === "undefined") {
        return {
          success: false,

          error: "Local storage is not available.",
        };
      }

      // --------------------------------------------------------
      // VALIDATE REAL CONTEXT
      // --------------------------------------------------------

      if (
        this.configuration.dataContext === DataContext.REAL &&
        (
          !this.configuration.ownerId ||
          !this.configuration.businessId ||
          !this.configuration.branchId
        )
      ) {
        return {
          success: false,

          error: "Valid Owner, Business, and Branch IDs are required to reset REAL FINORA data.",
        };
      }

      // --------------------------------------------------------
      // VALIDATE DEMO CONTEXT
      // --------------------------------------------------------

      if (
        this.configuration.dataContext === DataContext.DEMO &&
        !this.configuration.demoId
      ) {
        return {
          success: false,

          error: "A valid Demo ID is required to reset DEMO FINORA data.",
        };
      }

      // --------------------------------------------------------
      // CONTEXT QUERY
      // --------------------------------------------------------

      const contextQuery: StorageQuery = {
        entity: ENTITY_GENERAL,

        ownerId: this.configuration.ownerId,

        businessId: this.configuration.businessId,

        branchId: this.configuration.branchId,

        demoId: this.configuration.demoId,
      };

      // --------------------------------------------------------
      // REMOVE FINORA ENTITIES ONLY
      // --------------------------------------------------------

      for (const entity of FINORA_RESET_ENTITIES) {
        localStorage.removeItem(
          buildStorageKey({
            ...contextQuery,

            entity,
          }),
        );
      }

      return {
        success: true,
      };
    } catch {
      return {
        success: false,

        error: "Unable to reset FINORA data from local storage.",
      };
    }
  }
}

// ============================================================
// SINGLETON
// ============================================================

export const localStorageAdapter = new LocalStorageAdapter();

// ============================================================
// END
// ============================================================
