import { join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

// ============================================================
// PAISARULE_R175_C44_R2
// WINDOWS V1 RESTORE - FRESH USB DISK AUTHORITY
//
// Electron Main only.
// No cached FINORA USB root.
// No renderer-authorized verification.
// No LOCAL fallback.
// No filesystem writes.
// ============================================================

const execFileAsync = promisify(execFile);

const VERIFIED = "PAISARULE_USB_VERIFIED";

function fail(code: string): never {
  throw new Error(code);
}

export async function verifyPaisaruleNewRemovableUsbRoot(
  selectedDriveRoot: string,
): Promise<void> {
  if (
    process.platform !== "win32" ||
    typeof selectedDriveRoot !== "string" ||
    !/^[A-Za-z]:\\$/.test(selectedDriveRoot)
  ) {
    fail("RESTORE_USB_ROOT_INVALID");
  }

  const driveLetter =
    selectedDriveRoot.slice(0, 1).toUpperCase();

  // Only one ASCII drive letter can reach this script.
  // No user-supplied path or arbitrary command is evaluated.
  const script = [
    '$ErrorActionPreference = "Stop"',
    `$partition = @(Get-Partition -DriveLetter '${driveLetter}' -ErrorAction Stop)`,
    'if ($partition.Count -ne 1) { throw "PARTITION_NOT_UNIQUE" }',
    '$disk = @(Get-Disk -Number $partition[0].DiskNumber -ErrorAction Stop)',
    'if ($disk.Count -ne 1) { throw "DISK_NOT_UNIQUE" }',
    'if ([string]$disk[0].BusType -ne "USB") { throw "DISK_NOT_USB" }',
    'if ($disk[0].IsBoot -or $disk[0].IsSystem) { throw "SYSTEM_DISK_REJECTED" }',
    'if ($disk[0].IsOffline -or $disk[0].IsReadOnly) { throw "DISK_NOT_WRITABLE" }',
    'if ([string]$disk[0].OperationalStatus -notmatch "Online") { throw "DISK_NOT_ONLINE" }',
    `if ([string]$partition[0].DriveLetter -ne '${driveLetter}') { throw "DRIVE_LETTER_MISMATCH" }`,
    'Write-Output "PAISARULE_USB_VERIFIED"',
  ].join("\n");

  let stdout: string;

  const windowsRoot = process.env.SystemRoot ?? process.env.WINDIR;
  if (!windowsRoot) {
    fail("RESTORE_USB_AUTHORITY_UNAVAILABLE");
  }

  const systemDirectory =
    process.arch === "ia32" && process.env.PROCESSOR_ARCHITEW6432
      ? join(windowsRoot, "Sysnative")
      : join(windowsRoot, "System32");

  const powershellExecutable = join(
    systemDirectory,
    "WindowsPowerShell",
    "v1.0",
    "powershell.exe",
  );

  const encodedScript =
    Buffer.from(script, "utf16le").toString("base64");

  try {
    const result = await execFileAsync(
      powershellExecutable,
      [
        "-NoProfile",
        "-NonInteractive",
        "-ExecutionPolicy",
        "Bypass",
        "-EncodedCommand",
        encodedScript,
      ],
      {
        windowsHide: true,
        timeout: 30000,
        maxBuffer: 64 * 1024,
        encoding: "utf8",
      },
    );

    stdout = result.stdout;
  } catch (error) {
    const failure =
      error && typeof error === "object"
        ? error as {
            code?: unknown;
            killed?: unknown;
            signal?: unknown;
            stderr?: unknown;
            message?: unknown;
          }
        : {};

    const safe = (value: unknown): string =>
      String(value ?? "")
        .replace(/[\r\n\t]+/g, " ")
        .slice(0, 600);

    console.error("PAISARULE_R302_USB_SUBPROCESS", {
      code: safe(failure.code),
      killed: failure.killed === true,
      signal: safe(failure.signal),
      stderr: safe(failure.stderr),
      message: safe(failure.message),
    });

    fail("RESTORE_USB_AUTHORITY_UNAVAILABLE");
  }

  if (stdout.trim() !== VERIFIED) {
    fail("RESTORE_USB_NOT_VERIFIED");
  }
}