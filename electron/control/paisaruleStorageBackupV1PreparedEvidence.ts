import { timingSafeEqual } from "node:crypto";

import type {
  PaisaruleV1CombinedUsbEvidence,
} from "./paisaruleStorageBackupV1UsbAuthority.js";

import type {
  PaisaruleV1PreparedScope,
} from "./paisaruleStorageBackupV1PreparedCache.js";

import {
  PAISARULE_V1_PREPARE_TTL_MS,
} from "./paisaruleStorageBackupV1PreparedCache.js";

interface Entry {
  readonly sender: object;
  readonly token: string;
  readonly generation: number;
  readonly scope: PaisaruleV1PreparedScope;
  readonly evidence: PaisaruleV1CombinedUsbEvidence;
  readonly expiresAtMs: number;
}

export interface PaisaruleV1EvidenceRegistration {
  sender: object;
  token: string;
  generation: number;
  scope: PaisaruleV1PreparedScope;
  evidence: PaisaruleV1CombinedUsbEvidence;
  expiresAt: string;
}

function fail(code: string): never {
  throw new Error(code);
}

function validText(value: unknown): value is string {
  return typeof value === "string" &&
    value.length > 0 &&
    value.trim() === value;
}

function validDigest(value: unknown): value is string {
  return typeof value === "string" &&
    /^[a-f0-9]{64}$/.test(value);
}

function equalToken(a: string, b: string): boolean {
  if (!validText(a) || !validText(b)) {
    return false;
  }

  const first = Buffer.from(a, "utf8");
  const second = Buffer.from(b, "utf8");

  if (first.length !== second.length) {
    return false;
  }

  return timingSafeEqual(first, second);
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
    return fail("BACKUP_EVIDENCE_SCOPE_INVALID");
  }

  return Object.freeze({
    userId: scope.userId,
    ownerId: scope.ownerId,
    businessId: scope.businessId,
    branchId: scope.branchId,
  });
}

function sameScope(
  a: PaisaruleV1PreparedScope,
  b: PaisaruleV1PreparedScope,
): boolean {
  return a.userId === b.userId &&
    a.ownerId === b.ownerId &&
    a.businessId === b.businessId &&
    a.branchId === b.branchId;
}

function copyEvidence(
  evidence: PaisaruleV1CombinedUsbEvidence,
): PaisaruleV1CombinedUsbEvidence {
  if (
    !evidence ||
    !validDigest(evidence.hardware?.digest) ||
    !validDigest(evidence.source?.digest)
  ) {
    return fail("BACKUP_EVIDENCE_INVALID");
  }

  return Object.freeze({
    hardware: Object.freeze({
      digest: evidence.hardware.digest,
    }),
    source: Object.freeze({
      digest: evidence.source.digest,
    }),
  });
}

/**
 * C117-R171: trusted Electron-main-only pairing
 * of a prepared encrypted artifact token with the
 * exact hardware/source evidence verified at Prepare.
 *
 * Does not store original USB files, encryption keys,
 * raw hardware identifiers or encrypted artifact bytes.
 *
 * This registry is NOT an authority by itself:
 * the caller must revalidate Owner/server session,
 * login generation, USB and source before Download.
 */
export class PaisaruleStorageBackupV1PreparedEvidence {
  private readonly entries = new Map<object, Entry>();

  constructor(
    private readonly now: () => number = Date.now,
  ) {}

  clear(sender: object): void {
    this.entries.delete(sender);
  }

  clearAll(): void {
    this.entries.clear();
  }

  register(
    input: PaisaruleV1EvidenceRegistration,
  ): void {
    if (!input?.sender || typeof input.sender !== "object") {
      return fail("BACKUP_EVIDENCE_SENDER_INVALID");
    }

    this.clear(input.sender);

    if (
      !validText(input.token) ||
      !Number.isSafeInteger(input.generation) ||
      input.generation <= 0
    ) {
      return fail("BACKUP_EVIDENCE_TOKEN_INVALID");
    }

    const scope = copyScope(input.scope);
    const evidence = copyEvidence(input.evidence);
    const expiresAtMs = Date.parse(input.expiresAt);
    const current = this.now();

    if (
      !Number.isFinite(expiresAtMs) ||
      !Number.isFinite(current) ||
      expiresAtMs <= current ||
      expiresAtMs - current >
        PAISARULE_V1_PREPARE_TTL_MS
    ) {
      return fail("BACKUP_EVIDENCE_EXPIRY_INVALID");
    }

    this.entries.set(input.sender, Object.freeze({
      sender: input.sender,
      token: input.token,
      generation: input.generation,
      scope,
      evidence,
      expiresAtMs,
    }));
  }

  /**
   * Consume BEFORE beginning the download operation.
   * Replay, mismatch, expiry and missing entries fail
   * closed. The encrypted artifact cache separately
   * applies its own single-use token authority.
   */
  take(
    sender: object,
    token: string,
    generation: number,
    scope: PaisaruleV1PreparedScope,
    isCurrent: () => boolean,
  ): PaisaruleV1CombinedUsbEvidence {
    if (!sender || typeof sender !== "object") {
      return fail("BACKUP_EVIDENCE_SENDER_INVALID");
    }

    const entry = this.entries.get(sender);

    // Consume even when supplied token/scope is wrong.
    this.clear(sender);

    if (!entry) {
      return fail("BACKUP_EVIDENCE_NOT_FOUND");
    }

    if (
      !equalToken(entry.token, token) ||
      entry.generation !== generation ||
      !sameScope(entry.scope, copyScope(scope)) ||
      typeof isCurrent !== "function" ||
      !isCurrent()
    ) {
      return fail("BACKUP_EVIDENCE_AUTHORITY_CHANGED");
    }

    if (
      !Number.isFinite(this.now()) ||
      this.now() >= entry.expiresAtMs
    ) {
      return fail("BACKUP_EVIDENCE_EXPIRED");
    }

    return copyEvidence(entry.evidence);
  }
}