import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import {
  lstat,
  readdir,
  realpath,
} from "node:fs/promises";

const execFileAsync = promisify(execFile);

export interface PaisarulePhysicalUsbV1 {
  root: string;
  diskNumber: number;
  deviceIdentity: string;
}

function fail(code: string): never {
  throw new Error(code);
}

function normalizeDriveRoot(value: string): string {
  if (
    process.platform !== "win32" ||
    typeof value !== "string" ||
    !/^[A-Za-z]:\\$/.test(value)
  ) {
    return fail("RESTORE_USB_ROOT_INVALID");
  }

  return value.toUpperCase();
}

/**
 * Windows authoritative disk lookup.
 * No renderer paths, no filesystem modifications.
 *
 * Disk Number is a live Windows identity, not a
 * permanent serial number. Revalidate during commit.
 */
export async function inspectPaisarulePhysicalUsbV1(
  driveRoot: string,
): Promise<PaisarulePhysicalUsbV1> {
  const root = normalizeDriveRoot(driveRoot);
  const letter = root[0];

  const command = [
    "$ErrorActionPreference='Stop'",
    "$p=Get-Partition -DriveLetter '" +
      letter + "' -ErrorAction Stop",
    "$d=$p | Get-Disk -ErrorAction Stop",
    "if($d.BusType -ne 'USB') { throw 'NOT_USB' }",
    "if($d.IsOffline -or $d.IsReadOnly) " +
      "{ throw 'USB_NOT_WRITABLE' }",
    "[pscustomobject]@{",
    "Number=[int]$d.Number",
    "BusType=[string]$d.BusType",
    "UniqueId=[string]$d.UniqueId",
    "SerialNumber=[string]$d.SerialNumber",
    "} | ConvertTo-Json -Compress",
  ].join("; ");

  let output: string;

  try {
    const result = await execFileAsync(
      "powershell.exe",
      [
        "-NoProfile",
        "-NonInteractive",
        "-Command",
        command,
      ],
      {
        timeout: 8000,
        windowsHide: true,
        maxBuffer: 65536,
      },
    );

    output = result.stdout.trim();
  } catch {
    return fail("RESTORE_USB_DEVICE_UNAVAILABLE");
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(output);
  } catch {
    return fail("RESTORE_USB_DEVICE_RESPONSE_INVALID");
  }

  if (
    !parsed ||
    typeof parsed !== "object" ||
    Array.isArray(parsed)
  ) {
    return fail("RESTORE_USB_DEVICE_RESPONSE_INVALID");
  }

  const device = parsed as Record<string, unknown>;

  if (
    device.BusType !== "USB" ||
    !Number.isSafeInteger(device.Number) ||
    (device.Number as number) < 0
  ) {
    return fail("RESTORE_USB_IDENTITY_INVALID");
  }

  const uniqueId =
    typeof device.UniqueId === "string"
      ? device.UniqueId.trim().toUpperCase()
      : "";

  const serialNumber =
    typeof device.SerialNumber === "string"
      ? device.SerialNumber.trim().toUpperCase()
      : "";

  // Neither a drive letter nor a Windows disk number is
  // a persistent identity. Reject devices without usable
  // identifying information instead of guessing.
  if (!uniqueId && !serialNumber) {
    return fail("RESTORE_USB_PERSISTENT_IDENTITY_MISSING");
  }

  const deviceIdentity = JSON.stringify({
    uniqueId,
    serialNumber,
  });

  const stat = await lstat(root);

  if (!stat.isDirectory() || stat.isSymbolicLink()) {
    return fail("RESTORE_USB_ROOT_NOT_DIRECTORY");
  }

  const resolved = await realpath(root);

  if (
    normalizeDriveRoot(
      path.win32.parse(resolved).root,
    ) !== root
  ) {
    return fail("RESTORE_USB_ROOT_CHANGED");
  }

  return {
    root,
    diskNumber: device.Number as number,
    deviceIdentity,
  };
}

/**
 * Reject source and target partitions located on the
 * SAME physical Windows disk, even if drive letters differ.
 *
 * Both roots must be currently accessible to compare.
 */
/**
 * Compare independent hardware identity attributes.
 *
 * If both devices report the same nonempty UniqueId OR
 * the same nonempty SerialNumber, fail closed as SAME USB.
 *
 * Windows-reported values are not hardware attestation.
 * A collision can reject two different devices, which
 * is safer than allowing a possible source overwrite.
 */
function paisaruleUsbIdentityMatchesV1(
  left: string,
  right: string,
): boolean {
  const parseIdentity = (serialized: string) => {
    const value: unknown = JSON.parse(serialized);

    if (
      !value ||
      typeof value !== "object" ||
      Array.isArray(value)
    ) {
      throw new Error("RESTORE_USB_IDENTITY_INVALID");
    }

    const record = value as Record<string, unknown>;

    if (
      typeof record.uniqueId !== "string" ||
      typeof record.serialNumber !== "string"
    ) {
      throw new Error("RESTORE_USB_IDENTITY_INVALID");
    }

    return {
      uniqueId: record.uniqueId,
      serialNumber: record.serialNumber,
    };
  };

  const a = parseIdentity(left);
  const b = parseIdentity(right);

  if (
    (!a.uniqueId && !a.serialNumber) ||
    (!b.uniqueId && !b.serialNumber)
  ) {
    throw new Error("RESTORE_USB_IDENTITY_MISSING");
  }

  return (
    (a.uniqueId.length > 0 &&
      b.uniqueId.length > 0 &&
      a.uniqueId === b.uniqueId) ||
    (a.serialNumber.length > 0 &&
      b.serialNumber.length > 0 &&
      a.serialNumber === b.serialNumber)
  );
}
export async function assertPaisaruleDistinctUsbDevicesV1(
  sourceRoot: string,
  targetRoot: string,
): Promise<void> {
  const source = await inspectPaisarulePhysicalUsbV1(
    normalizeDriveRoot(
      path.win32.parse(sourceRoot).root,
    ),
  );

  const target = await inspectPaisarulePhysicalUsbV1(
    normalizeDriveRoot(targetRoot),
  );

  if (
    source.diskNumber === target.diskNumber ||
    paisaruleUsbIdentityMatchesV1(source.deviceIdentity, target.deviceIdentity)
  ) {
    fail("RESTORE_SAME_PHYSICAL_USB_FORBIDDEN");
  }
}

/**
 * Fail closed unless selected Windows USB is empty.
 * A drive containing even one entry is NOT eligible.
 */
export async function assertPaisaruleEmptyTargetUsbV1(
  targetRoot: string,
): Promise<PaisarulePhysicalUsbV1> {
  const target = await inspectPaisarulePhysicalUsbV1(
    targetRoot,
  );

  const entries = await readdir(target.root);

  if (entries.length !== 0) {
    return fail("RESTORE_TARGET_USB_NOT_EMPTY");
  }

  const checkedAgain =
    await inspectPaisarulePhysicalUsbV1(
      target.root,
    );

  if (
    checkedAgain.diskNumber !== target.diskNumber ||
    checkedAgain.deviceIdentity !== target.deviceIdentity
  ) {
    return fail("RESTORE_USB_DEVICE_CHANGED");
  }

  return target;
}