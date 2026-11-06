import { Buffer } from "node:buffer";

import type {
  PaisaruleStorageBackupV1Scope,
} from "./paisaruleStorageBackupV1Crypto.js";

import {
  encryptPaisaruleStorageBackupV1,
} from "./paisaruleStorageBackupV1Crypto.js";

import {
  getPaisaruleBackupSessionKey,
} from "./paisaruleStorageBackupV1SessionKeyAuthority.js";

import {
  createPaisaruleStorageBackupV1Payload,
} from "./paisaruleStorageBackupV1Payload.js";

import {
  createPaisaruleStorageBackupV1Export,
} from "./paisaruleStorageBackupV1Export.js";

import {
  countPaisaruleStorageBackupV1Entities,
} from "./paisaruleStorageBackupV1EntityCounts.js";

import {
  fingerprintPaisaruleV1SnapshotBytes,
} from "./paisaruleStorageBackupV1SnapshotFingerprint.js";

import {
  matchPaisaruleV1SourceFingerprint,
} from "./paisaruleStorageBackupV1SourceFingerprint.js";

import type {
  PaisaruleV1SourceFingerprint,
} from "./paisaruleStorageBackupV1SourceFingerprint.js";

import {
  PaisaruleStorageBackupV1PreparedCache,
} from "./paisaruleStorageBackupV1PreparedCache.js";

import type {
  PaisaruleV1PreparedScope,
  PaisaruleV1PreparePreview,
} from "./paisaruleStorageBackupV1PreparedCache.js";

export interface PaisaruleV1PrepareFromBytesInput {
  sender: object;
  generation: number;

  scope:
    PaisaruleStorageBackupV1Scope &
    PaisaruleV1PreparedScope;

  canonicalUsbRoot: string;

  /**
   * These Buffers belong to this operation.
   * They are wiped in finally on every exit.
   */
  primaryBytes: Buffer;
  secondaryBytes: Buffer;

  /**
   * Trusted source digest captured independently
   * by Electron main-process USB authority.
   */
  expectedSource: PaisaruleV1SourceFingerprint;

  businessName: string;
  branchName: string;

  isCurrent(): boolean;
}

export interface PaisaruleV1PrepareFromBytesDependencies {
  cache: PaisaruleStorageBackupV1PreparedCache;

  /**
   * Must return a disposable 32-byte SESSION KEY COPY.
   * Never return the authoritative original key Buffer.
   */
  getSessionKey?(
    sender: object,
    generation: number,
    scope: PaisaruleStorageBackupV1Scope,
  ): Buffer | null;
}

function fail(code: string): never {
  throw new Error(code);
}

/**
 * C117-R166: Prepare one encrypted snapshot from
 * previously verified and already-read USB bytes.
 *
 * No USB reads, USB writes, native dialogs, IPC,
 * renderer record exposure, or restore functions.
 *
 * The caller must separately enforce trusted USB
 * hardware identity and current server authority.
 */
export function preparePaisaruleBackupV1FromBytes(
  input: PaisaruleV1PrepareFromBytesInput,
  deps: PaisaruleV1PrepareFromBytesDependencies,
): PaisaruleV1PreparePreview {
  let key: Buffer | null = null;

  const primary = Buffer.isBuffer(input?.primaryBytes)
    ? input.primaryBytes
    : null;

  const secondary = Buffer.isBuffer(input?.secondaryBytes)
    ? input.secondaryBytes
    : null;

  try {
    if (
      !deps ||
      !(deps.cache instanceof
        PaisaruleStorageBackupV1PreparedCache)
    ) {
      return fail("BACKUP_PREPARE_CACHE_INVALID");
    }

    if (
      !input ||
      !input.sender ||
      typeof input.sender !== "object"
    ) {
      return fail("BACKUP_PREPARE_SENDER_INVALID");
    }

    // Invalidate an older prepared download before
    // starting any new preparation for this sender.
    deps.cache.clear(input.sender);

    if (
      !Number.isSafeInteger(input.generation) ||
      input.generation <= 0 ||
      typeof input.isCurrent !== "function" ||
      !input.isCurrent()
    ) {
      return fail("BACKUP_PREPARE_SESSION_INVALID");
    }

    if (
      !primary ||
      !secondary ||
      typeof input.businessName !== "string" ||
      typeof input.branchName !== "string"
    ) {
      return fail("BACKUP_PREPARE_INPUT_INVALID");
    }

    // Counts always originate from the exact primary
    // bytes that will enter the encrypted payload.
    const entityCounts =
      countPaisaruleStorageBackupV1Entities(
        primary,
        input.scope,
      );

    const exactSource =
      fingerprintPaisaruleV1SnapshotBytes(
        input.canonicalUsbRoot,
        primary,
        secondary,
      );

    if (
      !matchPaisaruleV1SourceFingerprint(
        input.expectedSource,
        exactSource,
      )
    ) {
      return fail("BACKUP_PREPARE_SOURCE_CHANGED");
    }

    if (!input.isCurrent()) {
      return fail("BACKUP_PREPARE_LOGIN_CHANGED");
    }

    const getter =
      deps.getSessionKey ??
      getPaisaruleBackupSessionKey;

    key = getter(
      input.sender,
      input.generation,
      input.scope,
    );

    if (
      !Buffer.isBuffer(key) ||
      key.length !== 32
    ) {
      return fail("BACKUP_PREPARE_SESSION_KEY_INVALID");
    }

    if (!input.isCurrent()) {
      return fail("BACKUP_PREPARE_LOGIN_CHANGED");
    }

    const createdAt = new Date().toISOString();

    const encrypted =
      createPaisaruleStorageBackupV1Export(
        primary,
        secondary,
        input.scope,
        key,
        {
          createPayload:
            createPaisaruleStorageBackupV1Payload,
          encryptPayload:
            encryptPaisaruleStorageBackupV1,
        },
        input.businessName,
        input.branchName,
        createdAt,
      );

    // The export coordinator already wipes
    // the disposable encryption key copy.
    key = null;

    if (!input.isCurrent()) {
      return fail("BACKUP_PREPARE_LOGIN_CHANGED");
    }

    // Cache contains only the encrypted artifact.
    // The preview contains counts, dates, and token.
    return deps.cache.prepare({
      sender: input.sender,
      generation: input.generation,
      scope: input.scope,
      fileName: encrypted.fileName,
      fileContents: encrypted.fileContents,
      createdAt: encrypted.createdAt,
      entityCounts,
    });
  } catch (error) {
    // Failed preparations must not leave a usable
    // artifact for the same renderer sender.
    if (
      deps?.cache instanceof
        PaisaruleStorageBackupV1PreparedCache &&
      input?.sender &&
      typeof input.sender === "object"
    ) {
      deps.cache.clear(input.sender);
    }

    throw error;
  } finally {
    if (key) {
      key.fill(0);
    }

    if (primary) {
      primary.fill(0);
    }

    if (secondary && secondary !== primary) {
      secondary.fill(0);
    }
  }
}