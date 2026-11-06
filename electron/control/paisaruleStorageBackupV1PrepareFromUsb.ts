import { Buffer } from "node:buffer";
import * as path from "node:path";

import {
  capturePaisaruleV1CombinedUsbEvidence,
  assertPaisaruleV1CombinedUsbEvidence,
} from "./paisaruleStorageBackupV1UsbAuthority.js";

import type {
  PaisaruleV1UsbAuthorityDependencies,
} from "./paisaruleStorageBackupV1UsbAuthority.js";

import {
  preparePaisaruleBackupV1FromBytes,
} from "./paisaruleStorageBackupV1PrepareFromBytes.js";

import type {
  PaisaruleV1PrepareFromBytesInput,
  PaisaruleV1PrepareFromBytesDependencies,
} from "./paisaruleStorageBackupV1PrepareFromBytes.js";

import type {
  PaisaruleV1PreparePreview,
} from "./paisaruleStorageBackupV1PreparedCache.js";

interface FileInfo {
  isFile(): boolean;
  isDirectory(): boolean;
  isSymbolicLink(): boolean;
  size: number;
}

export type PaisaruleV1UsbPrepareInput =
  Omit<
    PaisaruleV1PrepareFromBytesInput,
    | "canonicalUsbRoot"
    | "primaryBytes"
    | "secondaryBytes"
    | "expectedSource"
  > & {
    /**
     * Must verify the authoritative SERVER session,
     * OWNER role, USB mode and exact branch scope.
     * Injected by privileged Electron main process.
     */
    assertCurrentAuthority(): Promise<void>;
  };

export interface PaisaruleV1UsbPrepareDependencies {
  usbAuthority: PaisaruleV1UsbAuthorityDependencies;

  realpath(value: string): Promise<string>;
  lstat(value: string): Promise<FileInfo>;
  readFile(value: string): Promise<Buffer>;

  prepare: PaisaruleV1PrepareFromBytesDependencies;
}

const MAX_BYTES = 32 * 1024 * 1024;

function fail(code: string): never {
  throw new Error(code);
}

function exactPath(a: string, b: string): boolean {
  return path.resolve(a).toLowerCase() ===
    path.resolve(b).toLowerCase();
}

function within(parent: string, child: string): boolean {
  const relative = path.relative(parent, child);

  return relative.length > 0 &&
    relative !== ".." &&
    !relative.startsWith(".." + path.sep) &&
    !path.isAbsolute(relative);
}

function validFile(info: FileInfo): boolean {
  return (
    !info.isSymbolicLink() &&
    info.isFile() &&
    Number.isSafeInteger(info.size) &&
    info.size > 0 &&
    info.size <= MAX_BYTES
  );
}

async function readVerifiedStorageFile(
  directory: string,
  name: string,
  dependencies: PaisaruleV1UsbPrepareDependencies,
): Promise<Buffer> {
  const expected = path.join(directory, name);

  const canonical = await dependencies.realpath(expected);

  if (
    !exactPath(expected, canonical) ||
    !within(directory, canonical)
  ) {
    return fail("BACKUP_PREPARE_FILE_PATH_INVALID");
  }

  const info = await dependencies.lstat(expected);

  if (!validFile(info)) {
    return fail("BACKUP_PREPARE_FILE_INVALID");
  }

  const bytes = await dependencies.readFile(canonical);

  if (!Buffer.isBuffer(bytes)) {
    return fail("BACKUP_PREPARE_FILE_READ_INVALID");
  }

  if (bytes.length !== info.size) {
    bytes.fill(0);
    return fail("BACKUP_PREPARE_FILE_CHANGED");
  }

  return bytes;
}

/**
 * C117-R169:
 *
 * Orchestrate trusted USB source verification,
 * exact primary/secondary reads, encrypted
 * in-memory preparation, and final verification.
 *
 * No Save dialog, Download, Restore, USB writes,
 * or renderer record exposure.
 *
 * Main process owns the input and dependencies.
 * This module is not registered as IPC yet.
 */
export async function preparePaisaruleBackupV1FromUsb(
  input: PaisaruleV1UsbPrepareInput,
  dependencies: PaisaruleV1UsbPrepareDependencies,
): Promise<PaisaruleV1PreparePreview> {
  let primary: Buffer | null = null;
  let secondary: Buffer | null = null;

  const cache = dependencies?.prepare?.cache;
  const sender = input?.sender;

  const clearPrepared = () => {
    if (
      cache &&
      typeof cache.clear === "function" &&
      sender &&
      typeof sender === "object"
    ) {
      cache.clear(sender);
    }
  };

  try {
    if (
      !input ||
      !sender ||
      typeof sender !== "object" ||
      typeof input.isCurrent !== "function" ||
      typeof input.assertCurrentAuthority !== "function" ||
      !dependencies ||
      !dependencies.usbAuthority ||
      typeof dependencies.realpath !== "function" ||
      typeof dependencies.lstat !== "function" ||
      typeof dependencies.readFile !== "function" ||
      !cache ||
      typeof cache.clear !== "function"
    ) {
      return fail("BACKUP_PREPARE_DEPENDENCIES_INVALID");
    }

    // A new attempt invalidates the previous preview.
    clearPrepared();

    if (!input.isCurrent()) {
      return fail("BACKUP_PREPARE_LOGIN_CHANGED");
    }

    await input.assertCurrentAuthority();

    if (!input.isCurrent()) {
      return fail("BACKUP_PREPARE_LOGIN_CHANGED");
    }

    const before =
      await capturePaisaruleV1CombinedUsbEvidence(
        dependencies.usbAuthority,
        input.isCurrent,
      );

    await input.assertCurrentAuthority();

    if (!input.isCurrent()) {
      return fail("BACKUP_PREPARE_LOGIN_CHANGED");
    }

    const suppliedRoot =
      await dependencies.usbAuthority.resolveUsbRoot();

    if (
      !suppliedRoot ||
      !path.win32.isAbsolute(suppliedRoot) ||
      !/^[A-Za-z]:\\/.test(suppliedRoot)
    ) {
      return fail("BACKUP_PREPARE_USB_ROOT_INVALID");
    }

    const rootInfo =
      await dependencies.lstat(suppliedRoot);

    if (
      rootInfo.isSymbolicLink() ||
      !rootInfo.isDirectory()
    ) {
      return fail("BACKUP_PREPARE_USB_ROOT_INVALID");
    }

    const root = await dependencies.realpath(suppliedRoot);

    if (
      !path.isAbsolute(root) ||
      !path.win32.isAbsolute(root) ||
      !/^[A-Za-z]:\\/.test(root)
    ) {
      return fail("BACKUP_PREPARE_USB_ROOT_INVALID");
    }

    const expectedDirectory = path.join(
      root,
      "FINORA",
      "storage",
    );

    const directory =
      await dependencies.realpath(expectedDirectory);

    if (
      !within(root, directory) ||
      !exactPath(directory, expectedDirectory)
    ) {
      return fail("BACKUP_PREPARE_STORAGE_PATH_INVALID");
    }

    const directoryInfo =
      await dependencies.lstat(expectedDirectory);

    if (
      directoryInfo.isSymbolicLink() ||
      !directoryInfo.isDirectory()
    ) {
      return fail("BACKUP_PREPARE_STORAGE_PATH_INVALID");
    }

    if (!input.isCurrent()) {
      return fail("BACKUP_PREPARE_LOGIN_CHANGED");
    }

    primary = await readVerifiedStorageFile(
      directory,
      "finora-storage.json",
      dependencies,
    );

    secondary = await readVerifiedStorageFile(
      directory,
      "finora-storage.backup.json",
      dependencies,
    );

    if (!input.isCurrent()) {
      return fail("BACKUP_PREPARE_LOGIN_CHANGED");
    }

    // Counts, fingerprint and encryption all use
    // these same in-memory primary/secondary bytes.
    const preview =
      preparePaisaruleBackupV1FromBytes(
        {
          sender: input.sender,
          generation: input.generation,
          scope: input.scope,
          canonicalUsbRoot: root,
          primaryBytes: primary,
          secondaryBytes: secondary,
          expectedSource: before.source,
          businessName: input.businessName,
          branchName: input.branchName,
          isCurrent: input.isCurrent,
        },
        dependencies.prepare,
      );

    await input.assertCurrentAuthority();

    if (!input.isCurrent()) {
      return fail("BACKUP_PREPARE_LOGIN_CHANGED");
    }

    // Rehash current USB sources and check hardware.
    // The prepared encrypted artifact is NOT recreated.
    await assertPaisaruleV1CombinedUsbEvidence(
      before,
      dependencies.usbAuthority,
      input.isCurrent,
    );

    await input.assertCurrentAuthority();

    if (!input.isCurrent()) {
      return fail("BACKUP_PREPARE_LOGIN_CHANGED");
    }

    return preview;
  } catch (error) {
    clearPrepared();
    throw error;
  } finally {
    if (primary) {
      primary.fill(0);
    }

    if (secondary && secondary !== primary) {
      secondary.fill(0);
    }
  }
}