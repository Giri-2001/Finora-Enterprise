import * as path from "node:path";

import {
  capturePaisaruleV1UsbHardwareIdentity,
  matchPaisaruleV1UsbHardwareIdentity,
} from "./paisaruleStorageBackupV1UsbHardwareIdentity.js";

import {
  capturePaisaruleV1SourceFingerprint,
  matchPaisaruleV1SourceFingerprint,
} from "./paisaruleStorageBackupV1SourceFingerprint.js";

import type {
  PaisaruleV1UsbHardwareIdentity,
} from "./paisaruleStorageBackupV1UsbHardwareIdentity.js";

import type {
  PaisaruleV1SourceFingerprint,
} from "./paisaruleStorageBackupV1SourceFingerprint.js";

export interface PaisaruleV1CombinedUsbEvidence {
  readonly hardware: PaisaruleV1UsbHardwareIdentity;
  readonly source: PaisaruleV1SourceFingerprint;
}

export interface PaisaruleV1UsbAuthorityDependencies {
  resolveUsbRoot(): Promise<string | null>;

  captureHardware(
    root: string,
  ): Promise<PaisaruleV1UsbHardwareIdentity>;

  captureSource(
    root: string,
  ): Promise<PaisaruleV1SourceFingerprint>;
}

export const paisaruleV1DefaultUsbAuthorityDependencies:
  PaisaruleV1UsbAuthorityDependencies = {
    resolveUsbRoot: async () => null,
    captureHardware:
      capturePaisaruleV1UsbHardwareIdentity,
    captureSource:
      capturePaisaruleV1SourceFingerprint,
  };

function fail(code: string): never {
  throw new Error(code);
}

function validateRoot(value: unknown): string {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.trim() !== value ||
    !path.win32.isAbsolute(value) ||
    !/^[A-Za-z]:\\/.test(value)
  ) {
    return fail("BACKUP_USB_ROOT_INVALID");
  }

  return path.win32.normalize(value);
}

function sameRoot(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase();
}

function validDigest(value: unknown): boolean {
  return typeof value === "string" &&
    /^[a-f0-9]{64}$/.test(value);
}

function validEvidence(
  value: unknown,
): value is PaisaruleV1CombinedUsbEvidence {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return false;
  }

  const evidence = value as
    Partial<PaisaruleV1CombinedUsbEvidence>;

  return (
    validDigest(evidence.hardware?.digest) &&
    validDigest(evidence.source?.digest)
  );
}

/**
 * Capture hardware-before, source, hardware-after.
 * Fail closed if the USB hardware changes during
 * the source inspection.
 *
 * Trusted root is resolved by Electron main process.
 * Renderer never provides a USB root or fingerprints.
 *
 * No record contents or hardware serials are returned.
 */
export async function capturePaisaruleV1CombinedUsbEvidence(
  deps: PaisaruleV1UsbAuthorityDependencies,
  isCurrent: () => boolean,
): Promise<PaisaruleV1CombinedUsbEvidence> {
  if (
    !deps ||
    typeof deps.resolveUsbRoot !== "function" ||
    typeof deps.captureHardware !== "function" ||
    typeof deps.captureSource !== "function" ||
    typeof isCurrent !== "function" ||
    !isCurrent()
  ) {
    return fail("BACKUP_USB_AUTHORITY_INVALID");
  }

  const originalRoot = validateRoot(
    await deps.resolveUsbRoot(),
  );

  if (!isCurrent()) {
    return fail("BACKUP_LOGIN_CHANGED");
  }

  const hardwareBefore =
    await deps.captureHardware(originalRoot);

  if (
    !isCurrent() ||
    !validDigest(hardwareBefore?.digest)
  ) {
    return fail("BACKUP_USB_HARDWARE_INVALID");
  }

  const source =
    await deps.captureSource(originalRoot);

  if (
    !isCurrent() ||
    !validDigest(source?.digest)
  ) {
    return fail("BACKUP_USB_SOURCE_INVALID");
  }

  const latestRoot = validateRoot(
    await deps.resolveUsbRoot(),
  );

  if (!sameRoot(originalRoot, latestRoot)) {
    return fail("BACKUP_USB_ROOT_CHANGED");
  }

  const hardwareAfter =
    await deps.captureHardware(latestRoot);

  if (
    !isCurrent() ||
    !matchPaisaruleV1UsbHardwareIdentity(
      hardwareBefore,
      hardwareAfter,
    )
  ) {
    return fail("BACKUP_USB_HARDWARE_CHANGED");
  }

  return Object.freeze({
    hardware: Object.freeze({
      digest: hardwareBefore.digest,
    }),
    source: Object.freeze({
      digest: source.digest,
    }),
  });
}

/**
 * Re-capture both identities when Download starts
 * and after the native Save dialog closes.
 *
 * The prepared evidence stays exclusively in
 * Electron main memory, never renderer IPC.
 */
export async function assertPaisaruleV1CombinedUsbEvidence(
  expected: PaisaruleV1CombinedUsbEvidence,
  deps: PaisaruleV1UsbAuthorityDependencies,
  isCurrent: () => boolean,
): Promise<void> {
  if (!validEvidence(expected)) {
    return fail("BACKUP_USB_EXPECTED_EVIDENCE_INVALID");
  }

  const actual =
    await capturePaisaruleV1CombinedUsbEvidence(
      deps,
      isCurrent,
    );

  if (
    !matchPaisaruleV1UsbHardwareIdentity(
      expected.hardware,
      actual.hardware,
    )
  ) {
    return fail("BACKUP_USB_HARDWARE_CHANGED");
  }

  if (
    !matchPaisaruleV1SourceFingerprint(
      expected.source,
      actual.source,
    )
  ) {
    return fail("BACKUP_USB_SOURCE_CHANGED");
  }
}