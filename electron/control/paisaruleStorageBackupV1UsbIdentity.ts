import { execFile } from "node:child_process";
import { promisify } from "node:util";

import {
  verifyPaisaruleNewRemovableUsbRoot,
} from "./paisaruleStorageBackupV1RestoreUsbAuthority.js";

// PAISARULE_R175_C66
// Native Electron Main only. No renderer-provided identity.
// This reduces drive-swap risk; it does not make filesystem
// writes atomic or eliminate all hot-swap race conditions.

const execFileAsync = promisify(execFile);

export interface PaisaruleUsbIdentityV1 {
  driveLetter: string;
  diskNumber: number;
  partitionNumber: number;
  diskUniqueId: string;
  diskSerialNumber: string;
  volumeUniqueId: string;
}

function fail(code: string): never {
  throw new Error(code);
}

function driveLetterOf(root: string): string {
  if (
    process.platform !== "win32" ||
    typeof root !== "string" ||
    !/^[A-Za-z]:\\$/.test(root)
  ) {
    fail("RESTORE_IDENTITY_ROOT_INVALID");
  }

  return root[0].toUpperCase();
}

function checkedString(value: unknown): string {
  if (
    typeof value !== "string" ||
    value.trim().length === 0 ||
    value.length > 512 ||
    /[\u0000-\u001f\u007f]/.test(value)
  ) {
    fail("RESTORE_IDENTITY_FIELD_INVALID");
  }

  return value.trim();
}

function checkedNumber(value: unknown): number {
  if (
    typeof value !== "number" ||
    !Number.isSafeInteger(value) ||
    value < 0
  ) {
    fail("RESTORE_IDENTITY_NUMBER_INVALID");
  }

  return value;
}

export async function capturePaisaruleUsbIdentityV1(
  selectedRoot: string,
): Promise<PaisaruleUsbIdentityV1> {
  const letter = driveLetterOf(selectedRoot);

  // A separate removable-drive check is mandatory.
  await verifyPaisaruleNewRemovableUsbRoot(selectedRoot);

  const ps = [
    '$ErrorActionPreference = "Stop"',
    "$letter = '" + letter + "'",
    '$parts = @(Get-Partition -DriveLetter $letter -ErrorAction Stop)',
    'if ($parts.Count -ne 1) { throw "PARTITION_INVALID" }',
    '$p = $parts[0]',
    '$disks = @(Get-Disk -Number $p.DiskNumber -ErrorAction Stop)',
    'if ($disks.Count -ne 1) { throw "DISK_INVALID" }',
    '$d = $disks[0]',
    '$vols = @(Get-Volume -DriveLetter $letter -ErrorAction Stop)',
    'if ($vols.Count -ne 1) { throw "VOLUME_INVALID" }',
    '$v = $vols[0]',
    'if ([string]$d.BusType -ne "USB") { throw "NOT_USB" }',
    'if ($d.IsBoot -or $d.IsSystem) { throw "SYSTEM_DISK" }',
    'if ($d.IsOffline -or $d.IsReadOnly) { throw "DISK_UNAVAILABLE" }',
    'if ([string]$d.OperationalStatus -notmatch "Online") { throw "DISK_OFFLINE" }',
    '$value = [ordered]@{',
    'driveLetter = [string]$p.DriveLetter',
    'diskNumber = [int]$d.Number',
    'partitionNumber = [int]$p.PartitionNumber',
    'diskUniqueId = [string]$d.UniqueId',
    'diskSerialNumber = [string]$d.SerialNumber',
    'volumeUniqueId = [string]$v.UniqueId',
    '}',
    '$value | ConvertTo-Json -Compress -Depth 3',
  ].join("\n");

  let raw: string;

  try {
    const result = await execFileAsync(
      "powershell.exe",
      [
        "-NoProfile",
        "-NonInteractive",
        "-Command",
        ps,
      ],
      {
        encoding: "utf8",
        windowsHide: true,
        timeout: 15000,
        maxBuffer: 65536,
      },
    );

    raw = result.stdout;
  } catch {
    fail("RESTORE_IDENTITY_CAPTURE_FAILED");
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(raw.trim());
  } catch {
    fail("RESTORE_IDENTITY_JSON_INVALID");
  }

  if (
    parsed === null ||
    typeof parsed !== "object" ||
    Array.isArray(parsed)
  ) {
    fail("RESTORE_IDENTITY_OBJECT_INVALID");
  }

  const obj = parsed as Record<string, unknown>;

  const identity: PaisaruleUsbIdentityV1 = {
    driveLetter: checkedString(obj.driveLetter).toUpperCase(),
    diskNumber: checkedNumber(obj.diskNumber),
    partitionNumber: checkedNumber(obj.partitionNumber),
    diskUniqueId:
      typeof obj.diskUniqueId === "string"
        ? obj.diskUniqueId.trim()
        : "",
    diskSerialNumber:
      typeof obj.diskSerialNumber === "string"
        ? obj.diskSerialNumber.trim()
        : "",
    volumeUniqueId: checkedString(obj.volumeUniqueId),
  };

  if (
    identity.driveLetter !== letter ||
    identity.diskUniqueId.length > 512 ||
    identity.diskSerialNumber.length > 512 ||
    (
      identity.diskUniqueId.length === 0 &&
      identity.diskSerialNumber.length === 0
    )
  ) {
    fail("RESTORE_IDENTITY_INSUFFICIENT");
  }

  return identity;
}

export async function assertPaisaruleUsbIdentityUnchangedV1(
  selectedRoot: string,
  expected: PaisaruleUsbIdentityV1,
): Promise<void> {
  if (!expected) {
    fail("RESTORE_IDENTITY_EXPECTED_MISSING");
  }

  const current = await capturePaisaruleUsbIdentityV1(
    selectedRoot,
  );

  const keys = [
    "driveLetter",
    "diskNumber",
    "partitionNumber",
    "diskUniqueId",
    "diskSerialNumber",
    "volumeUniqueId",
  ] as const;

  for (const key of keys) {
    if (current[key] !== expected[key]) {
      fail("RESTORE_USB_IDENTITY_CHANGED");
    }
  }
}