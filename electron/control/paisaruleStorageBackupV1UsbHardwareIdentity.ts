import { createHash, timingSafeEqual } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import * as path from "node:path";

const execFileAsync = promisify(execFile);

interface HardwareEvidence {
  drive: string;
  volumeSerial: string;
  diskSerial: string;
  pnpDeviceId: string;
}

export interface PaisaruleV1UsbHardwareIdentity {
  readonly digest: string;
}

export interface PaisaruleV1HardwareIdentityDependencies {
  queryDrive(drive: string): Promise<unknown>;
}

function fail(code: string): never {
  throw new Error(code);
}

function validText(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.trim() === value &&
    value.length <= 512
  );
}

/**
 * Windows CIM read-only hardware evidence.
 *
 * No arbitrary user-supplied PowerShell commands.
 * Drive value is strictly validated as A-Z colon.
 *
 * This is hardware-derived evidence, not a
 * cryptographically unclonable USB identity.
 */
async function queryWindowsUsbDrive(
  drive: string,
): Promise<unknown> {
  if (!/^[A-Z]:$/.test(drive)) {
    return fail("BACKUP_USB_DRIVE_INVALID");
  }

  // C117-R157-R1:
  // Avoid nested JavaScript template literals and
  // PowerShell backtick continuation entirely.
  const scriptLines = [
    "$ErrorActionPreference = 'Stop'",
    "$drive = '" + drive + "'",
    "$logical = @(Get-CimInstance Win32_LogicalDisk | Where-Object { $_.DeviceID -eq $drive })",
    "if ($logical.Count -ne 1) { throw 'LOGICAL_DRIVE_UNAVAILABLE' }",
    "$volume = [string]$logical[0].VolumeSerialNumber",
    "if ([string]::IsNullOrWhiteSpace($volume)) { throw 'VOLUME_SERIAL_UNAVAILABLE' }",
    "$found = @()",
    "$disks = @(Get-CimInstance Win32_DiskDrive | Where-Object { $_.InterfaceType -eq 'USB' })",
    "foreach ($disk in $disks) {",
    "  $partitions = @(Get-CimAssociatedInstance -InputObject $disk -Association Win32_DiskDriveToDiskPartition)",
    "  foreach ($partition in $partitions) {",
    "    $logicals = @(Get-CimAssociatedInstance -InputObject $partition -Association Win32_LogicalDiskToPartition)",
    "    foreach ($candidate in $logicals) {",
    "      if ($candidate.DeviceID -eq $drive) { $found += $disk }",
    "    }",
    "  }",
    "}",
    "if ($found.Count -ne 1) { throw 'USB_DISK_ASSOCIATION_AMBIGUOUS' }",
    "$usb = $found[0]",
    "$serial = ([string]$usb.SerialNumber).Trim()",
    "$pnp = ([string]$usb.PNPDeviceID).Trim()",
    "if ([string]::IsNullOrWhiteSpace($serial)) { throw 'USB_SERIAL_UNAVAILABLE' }",
    "if ([string]::IsNullOrWhiteSpace($pnp)) { throw 'USB_PNP_ID_UNAVAILABLE' }",
    "[pscustomobject]@{",
    "  drive = [string]$drive",
    "  volumeSerial = $volume",
    "  diskSerial = $serial",
    "  pnpDeviceId = $pnp",
    "} | ConvertTo-Json -Compress"
  ];

  const script = scriptLines.join("\r\n");

  const encoded = Buffer.from(
    script,
    "utf16le",
  ).toString("base64");

  try {
    const result = await execFileAsync(
      "powershell.exe",
      [
        "-NoProfile",
        "-NonInteractive",
        "-EncodedCommand",
        encoded,
      ],
      {
        windowsHide: true,
        timeout: 15000,
        maxBuffer: 16 * 1024,
      },
    );

    return JSON.parse(
      result.stdout.trim(),
    ) as unknown;
  } catch {
    return fail("BACKUP_USB_HARDWARE_QUERY_FAILED");
  }
}

const defaultDependencies:
  PaisaruleV1HardwareIdentityDependencies = {
    queryDrive: queryWindowsUsbDrive,
  };

function parseEvidence(
  value: unknown,
  expectedDrive: string,
): HardwareEvidence {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return fail("BACKUP_USB_HARDWARE_EVIDENCE_INVALID");
  }

  const record = value as Record<string, unknown>;

  if (
    record.drive !== expectedDrive ||
    !validText(record.volumeSerial) ||
    !validText(record.diskSerial) ||
    !validText(record.pnpDeviceId)
  ) {
    return fail("BACKUP_USB_HARDWARE_EVIDENCE_INVALID");
  }

  if (!/^[a-fA-F0-9]{8}$/.test(record.volumeSerial)) {
    return fail("BACKUP_USB_VOLUME_SERIAL_INVALID");
  }

  const pnp = record.pnpDeviceId.toUpperCase();

  if (
    !pnp.startsWith("USBSTOR\\") &&
    !pnp.startsWith("USB\\")
  ) {
    return fail("BACKUP_USB_DEVICE_BUS_INVALID");
  }

  return {
    drive: record.drive,
    volumeSerial: record.volumeSerial.toUpperCase(),
    diskSerial: record.diskSerial,
    pnpDeviceId: record.pnpDeviceId,
  };
}

/**
 * Produce a SHA256 digest without exposing hardware
 * identifiers to the renderer.
 *
 * Actual Windows CIM access occurs only when called
 * with default dependencies on Windows.
 */
export async function capturePaisaruleV1UsbHardwareIdentity(
  trustedUsbRoot: string,
  dependencies:
    PaisaruleV1HardwareIdentityDependencies =
      defaultDependencies,
): Promise<PaisaruleV1UsbHardwareIdentity> {
  if (
    process.platform !== "win32" &&
    dependencies === defaultDependencies
  ) {
    return fail("BACKUP_USB_WINDOWS_REQUIRED");
  }

  if (
    typeof trustedUsbRoot !== "string" ||
    !path.win32.isAbsolute(trustedUsbRoot)
  ) {
    return fail("BACKUP_USB_ROOT_INVALID");
  }

  const root = path.win32.parse(trustedUsbRoot).root;

  if (!/^[A-Za-z]:\\$/.test(root)) {
    return fail("BACKUP_USB_ROOT_INVALID");
  }

  const drive = root.slice(0, 2).toUpperCase();

  const evidence = parseEvidence(
    await dependencies.queryDrive(drive),
    drive,
  );

  const digest = createHash("sha256")
    .update(JSON.stringify([
      "PAISARULE_USB_HARDWARE_V1",
      evidence.drive,
      evidence.volumeSerial,
      evidence.diskSerial,
      evidence.pnpDeviceId,
    ]))
    .digest("hex");

  return Object.freeze({ digest });
}

export function matchPaisaruleV1UsbHardwareIdentity(
  expected: PaisaruleV1UsbHardwareIdentity,
  actual: PaisaruleV1UsbHardwareIdentity,
): boolean {
  if (
    !expected ||
    !actual ||
    typeof expected.digest !== "string" ||
    typeof actual.digest !== "string" ||
    !/^[a-f0-9]{64}$/.test(expected.digest) ||
    !/^[a-f0-9]{64}$/.test(actual.digest)
  ) {
    return false;
  }

  return timingSafeEqual(
    Buffer.from(expected.digest, "hex"),
    Buffer.from(actual.digest, "hex"),
  );
}