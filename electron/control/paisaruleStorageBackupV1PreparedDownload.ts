import { basename, isAbsolute } from "node:path";
import { Buffer } from "node:buffer";

import {
  PaisaruleStorageBackupV1PreparedCache,
} from "./paisaruleStorageBackupV1PreparedCache.js";

import type {
  PaisaruleV1PreparedScope,
} from "./paisaruleStorageBackupV1PreparedCache.js";

export interface PaisaruleV1PreparedSaveInput {
  sender: object;
  token: string;
  generation: number;
  scope: PaisaruleV1PreparedScope;

  /**
   * Trusted Electron-main-owned USB identity captured
   * at preparation time. Never supplied by renderer.
   */
  expectedUsbIdentity: string;

  /**
   * Must include sender/login-generation freshness.
   */
  isCurrent(): boolean;

  /**
   * Revalidate the current Owner's SERVER session
   * and authoritative branch scope.
   */
  assertCurrentAuthority(): Promise<void>;

  /**
   * Return the validated identity of the currently
   * connected authoritative USB storage.
   */
  getCurrentUsbIdentity(): Promise<string>;

  /**
   * Main-process native dialog. The renderer cannot
   * choose the default path or destination.
   */
  showSaveDialog(
    proposedFileName: string,
  ): Promise<{
    canceled: boolean;
    filePath?: string;
  }>;

  /**
   * Main-process file writer. Called only after all
   * authority and USB identity checks succeed.
   */
  writeFile(
    filePath: string,
    contents: Buffer,
  ): Promise<void>;
}

export type PaisaruleV1PreparedSaveResult =
  | {
      success: true;
      cancelled: true;
      data: null;
      errorCode: null;
    }
  | {
      success: true;
      cancelled: false;
      data: {
        fileName: string;
        bytesWritten: number;
        createdAt: string;
      };
      errorCode: null;
    }
  | {
      success: false;
      cancelled: false;
      data: null;
      errorCode: string;
    };

function fail(code: string): never {
  throw new Error(code);
}

function isNonemptyText(value: unknown): value is string {
  return typeof value === "string" &&
    value.length > 0 &&
    value.trim() === value;
}

function validateUsbIdentity(
  identity: unknown,
): string {
  if (!isNonemptyText(identity)) {
    return fail("BACKUP_USB_IDENTITY_INVALID");
  }

  return identity;
}

async function assertAllowed(
  input: PaisaruleV1PreparedSaveInput,
): Promise<void> {
  if (!input.isCurrent()) {
    return fail("BACKUP_LOGIN_CHANGED");
  }

  await input.assertCurrentAuthority();

  if (!input.isCurrent()) {
    return fail("BACKUP_LOGIN_CHANGED");
  }

  const actual = validateUsbIdentity(
    await input.getCurrentUsbIdentity(),
  );

  if (
    !input.isCurrent() ||
    actual !== input.expectedUsbIdentity
  ) {
    return fail("BACKUP_USB_IDENTITY_CHANGED");
  }
}

/**
 * C117-R152 - Save one already-prepared encrypted V1
 * backup snapshot; never generate a second snapshot.
 *
 * - Token is consumed once.
 * - Server authority is rechecked.
 * - USB identity is checked before and after dialog.
 * - Native Save dialog is the only destination source.
 * - Encrypted bytes are zeroed on every exit path.
 * - No restore/write-to-USB capability.
 */
export async function savePaisarulePreparedBackupV1(
  cache: PaisaruleStorageBackupV1PreparedCache,
  input: PaisaruleV1PreparedSaveInput,
): Promise<PaisaruleV1PreparedSaveResult> {
  let contents: Buffer | null = null;

  const deny = (errorCode: string): PaisaruleV1PreparedSaveResult => ({
    success: false,
    cancelled: false,
    data: null,
    errorCode,
  });

  try {
    if (
      !input ||
      !input.sender ||
      typeof input.sender !== "object" ||
      !isNonemptyText(input.token) ||
      !Number.isSafeInteger(input.generation) ||
      input.generation <= 0 ||
      typeof input.isCurrent !== "function" ||
      typeof input.assertCurrentAuthority !== "function" ||
      typeof input.getCurrentUsbIdentity !== "function" ||
      typeof input.showSaveDialog !== "function" ||
      typeof input.writeFile !== "function"
    ) {
      return deny("BACKUP_DOWNLOAD_INPUT_INVALID");
    }

    validateUsbIdentity(input.expectedUsbIdentity);

    // Fail closed before consuming the snapshot.
    await assertAllowed(input);

    const prepared = cache.take(
      input.sender,
      input.token,
      input.generation,
      input.scope,
      input.isCurrent,
    );

    contents = prepared.contents;

    if (
      !prepared.fileName.endsWith(".paisarule") ||
      basename(prepared.fileName) !== prepared.fileName ||
      contents.length === 0
    ) {
      return deny("BACKUP_DOWNLOAD_ARTIFACT_INVALID");
    }

    // Recheck after single-use token consumption.
    await assertAllowed(input);

    const selected = await input.showSaveDialog(
      prepared.fileName,
    );

    if (selected.canceled) {
      return {
        success: true,
        cancelled: true,
        data: null,
        errorCode: null,
      };
    }

    if (
      !isNonemptyText(selected.filePath) ||
      !isAbsolute(selected.filePath) ||
      !selected.filePath.toLowerCase().endsWith(".paisarule")
    ) {
      return deny("BACKUP_DOWNLOAD_PATH_INVALID");
    }

    // Critical: USB could have been swapped while the
    // native Save dialog remained open.
    await assertAllowed(input);

    const bytesWritten = contents.length;

    await input.writeFile(
      selected.filePath,
      contents,
    );

    // File already written; do not claim success if
    // the authenticated session changed during write.
    await assertAllowed(input);

    return {
      success: true,
      cancelled: false,
      data: {
        fileName: basename(selected.filePath),
        bytesWritten,
        createdAt: prepared.createdAt,
      },
      errorCode: null,
    };
  } catch (error) {
    const code =
      error instanceof Error &&
      /^BACKUP_[A-Z0-9_]+$/.test(error.message)
        ? error.message
        : "BACKUP_DOWNLOAD_FAILED";

    return deny(code);
  } finally {
    // A failed or cancelled attempt invalidates staging.
    if (input?.sender) {
      cache.clear(input.sender);
    }

    if (contents) {
      contents.fill(0);
    }
  }
}