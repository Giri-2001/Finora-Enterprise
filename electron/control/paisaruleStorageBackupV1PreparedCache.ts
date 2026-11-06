import { Buffer } from "node:buffer";
import { randomBytes } from "node:crypto";

import type {
  PaisaruleV1EntityCounts,
} from "./paisaruleStorageBackupV1EntityCounts.js";

export interface PaisaruleV1PreparedScope {
  userId: string;
  ownerId: string;
  businessId: string;
  branchId: string;
}

export interface PaisaruleV1PrepareInput {
  sender: object;
  generation: number;
  scope: PaisaruleV1PreparedScope;
  fileName: string;
  fileContents: string;
  createdAt: string;
  entityCounts: PaisaruleV1EntityCounts;
}

export interface PaisaruleV1PreparePreview {
  token: string;
  createdAt: string;
  expiresAt: string;
  entityCounts: PaisaruleV1EntityCounts;
}

export interface PaisaruleV1PreparedDownload {
  fileName: string;
  contents: Buffer;
  createdAt: string;
  entityCounts: PaisaruleV1EntityCounts;
}

interface CacheEntry {
  sender: object;
  generation: number;
  scope: PaisaruleV1PreparedScope;
  token: string;
  createdAt: string;
  expiresAtMs: number;
  fileName: string;
  contents: Buffer;
  entityCounts: PaisaruleV1EntityCounts;
}

export const PAISARULE_V1_PREPARE_TTL_MS =
  5 * 60 * 1000;

function fail(code: string): never {
  throw new Error(code);
}

function validText(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.trim() === value
  );
}

function copyScope(
  scope: PaisaruleV1PreparedScope,
): PaisaruleV1PreparedScope {
  if (
    !scope ||
    !validText(scope.userId) ||
    !validText(scope.ownerId) ||
    !validText(scope.businessId) ||
    !validText(scope.branchId)
  ) {
    return fail("BACKUP_PREPARE_SCOPE_INVALID");
  }

  return {
    userId: scope.userId,
    ownerId: scope.ownerId,
    businessId: scope.businessId,
    branchId: scope.branchId,
  };
}

function sameScope(
  left: PaisaruleV1PreparedScope,
  right: PaisaruleV1PreparedScope,
): boolean {
  return (
    left.userId === right.userId &&
    left.ownerId === right.ownerId &&
    left.businessId === right.businessId &&
    left.branchId === right.branchId
  );
}

function validCount(value: unknown): value is number {
  return Number.isSafeInteger(value) &&
    (value as number) >= 0;
}

function copyCounts(
  input: PaisaruleV1EntityCounts,
): PaisaruleV1EntityCounts {
  if (
    !input ||
    !validCount(input.customers) ||
    !validCount(input.loans) ||
    !validCount(input.collections) ||
    !validCount(input.goldLoans) ||
    !validCount(input.goldCustodyRecords) ||
    !validCount(input.businessRecords) ||
    !validCount(input.totalStorageRecords) ||
    input.goldLoans > input.loans ||
    input.businessRecords !==
      input.customers + input.loans + input.collections ||
    input.totalStorageRecords <
      input.businessRecords + input.goldCustodyRecords
  ) {
    return fail("BACKUP_PREPARE_COUNTS_INVALID");
  }

  return {
    customers: input.customers,
    loans: input.loans,
    collections: input.collections,
    goldLoans: input.goldLoans,
    goldCustodyRecords: input.goldCustodyRecords,
    businessRecords: input.businessRecords,
    totalStorageRecords: input.totalStorageRecords,
  };
}

/**
 * C117-R149: in-memory-only encrypted backup staging.
 *
 * One prepared artifact per renderer sender.
 * No plaintext storage records enter this cache.
 * No USB/file operations occur in this module.
 * All returned preview fields are nonsensitive metadata.
 *
 * Download is single-use. Caller must zero the returned
 * Buffer in a finally block after Save dialog/write.
 */
export class PaisaruleStorageBackupV1PreparedCache {
  private readonly entries =
    new Map<object, CacheEntry>();

  constructor(
    private readonly now: () => number = Date.now,
  ) {}

  private discard(sender: object): void {
    const previous = this.entries.get(sender);

    if (previous) {
      this.entries.delete(sender);
      previous.contents.fill(0);
    }
  }

  clear(sender: object): void {
    this.discard(sender);
  }

  clearAll(): void {
    for (const sender of this.entries.keys()) {
      this.discard(sender);
    }
  }

  prepare(
    input: PaisaruleV1PrepareInput,
  ): PaisaruleV1PreparePreview {
    if (
      !input ||
      !input.sender ||
      typeof input.sender !== "object"
    ) {
      return fail("BACKUP_PREPARE_SENDER_INVALID");
    }

    // A failed new preparation must also invalidate any
    // previously staged artifact for this sender.
    this.discard(input.sender);

    if (
      !Number.isSafeInteger(input.generation) ||
      input.generation <= 0 ||
      !validText(input.fileName) ||
      !input.fileName.endsWith(".paisarule") ||
      !validText(input.fileContents) ||
      !validText(input.createdAt) ||
      !Number.isFinite(Date.parse(input.createdAt))
    ) {
      return fail("BACKUP_PREPARE_INPUT_INVALID");
    }

    const scope = copyScope(input.scope);
    const entityCounts = copyCounts(input.entityCounts);
    const currentTime = this.now();

    if (!Number.isFinite(currentTime)) {
      return fail("BACKUP_PREPARE_CLOCK_INVALID");
    }

    const expiresAtMs =
      currentTime + PAISARULE_V1_PREPARE_TTL_MS;

    const token = randomBytes(24).toString("hex");

    const entry: CacheEntry = {
      sender: input.sender,
      generation: input.generation,
      scope,
      token,
      createdAt: input.createdAt,
      expiresAtMs,
      fileName: input.fileName,
      contents: Buffer.from(input.fileContents, "utf8"),
      entityCounts,
    };

    this.entries.set(input.sender, entry);

    return {
      token,
      createdAt: entry.createdAt,
      expiresAt: new Date(expiresAtMs).toISOString(),
      entityCounts: copyCounts(entry.entityCounts),
    };
  }

  take(
    sender: object,
    token: string,
    generation: number,
    scope: PaisaruleV1PreparedScope,
    isCurrent: () => boolean,
  ): PaisaruleV1PreparedDownload {
    if (!sender || typeof sender !== "object") {
      return fail("BACKUP_PREPARE_SENDER_INVALID");
    }

    const entry = this.entries.get(sender);

    if (!entry) {
      return fail("BACKUP_PREPARE_NOT_FOUND");
    }

    // Any invalid attempt invalidates this staging slot.
    if (
      !validText(token) ||
      entry.token !== token ||
      entry.generation !== generation ||
      !sameScope(entry.scope, copyScope(scope)) ||
      typeof isCurrent !== "function" ||
      !isCurrent()
    ) {
      this.discard(sender);
      return fail("BACKUP_PREPARE_AUTHORITY_CHANGED");
    }

    const currentTime = this.now();

    if (
      !Number.isFinite(currentTime) ||
      currentTime >= entry.expiresAtMs
    ) {
      this.discard(sender);
      return fail("BACKUP_PREPARE_EXPIRED");
    }

    // Return an independent copy to the trusted main
    // process, then destroy cached encrypted contents.
    const contents = Buffer.from(entry.contents);

    const download: PaisaruleV1PreparedDownload = {
      fileName: entry.fileName,
      contents,
      createdAt: entry.createdAt,
      entityCounts: copyCounts(entry.entityCounts),
    };

    this.discard(sender);

    return download;
  }
}