import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";

export interface PaisaruleLastUsbIdentityV1 {
  diskUniqueId: string;
  diskSerialNumber: string;
  volumeUniqueId: string;
}

export interface PaisaruleLastUsbScopeV1 {
  ownerId: string;
  businessId: string;
  branchId: string;
}

interface SavedFolder {
  fingerprint: string;
  folderName: string;
  ownerId: string;
  businessId: string;
  branchId: string;
  updatedAt: string;
}

interface SavedDocument {
  version: 1;
  entries: SavedFolder[];
}

const FILE_NAME = "paisarule-last-usb-folder-v1.json";

function normalized(value: string): string {
  if (
    typeof value !== "string" ||
    !value.trim() ||
    value.length > 512 ||
    /[\u0000-\u001f\u007f]/.test(value)
  ) {
    throw new Error("LAST_USB_INPUT_INVALID");
  }

  return value.trim();
}

function validFolderName(value: string): string {
  const name = normalized(value);

  if (
    name === "." ||
    name === ".." ||
    name.endsWith(".") ||
    name.endsWith(" ") ||
    /[\\/:*?"<>|]/.test(name) ||
    /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(?:\..*)?$/i.test(name)
  ) {
    throw new Error("LAST_USB_FOLDER_INVALID");
  }

  return name;
}

function exactRemovableChild(
  removableRoot: string,
  branchRoot: string,
): string {
  const drive = path.win32.resolve(normalized(removableRoot));
  const branch = path.win32.resolve(normalized(branchRoot));

  if (
    !/^[A-Za-z]:\\$/.test(drive) ||
    path.win32.dirname(branch).toLowerCase() !==
      drive.toLowerCase()
  ) {
    throw new Error("LAST_USB_FOLDER_SCOPE_INVALID");
  }

  return validFolderName(path.win32.basename(branch));
}

function fingerprint(identity: PaisaruleLastUsbIdentityV1): string {
  const diskId =
    String(identity.diskUniqueId ?? "").trim();
  const serial =
    String(identity.diskSerialNumber ?? "").trim();
  const volume =
    normalized(identity.volumeUniqueId);

  if (!diskId && !serial) {
    throw new Error("LAST_USB_IDENTITY_INSUFFICIENT");
  }

  return createHash("sha256")
    .update(
      JSON.stringify([
        diskId.toUpperCase(),
        serial.toUpperCase(),
        volume.toUpperCase(),
      ]),
    )
    .digest("hex");
}

function checkedScope(scope: PaisaruleLastUsbScopeV1) {
  return {
    ownerId: normalized(scope.ownerId),
    businessId: normalized(scope.businessId),
    branchId: normalized(scope.branchId),
  };
}

function storePath(userData: string): string {
  return path.join(normalized(userData), FILE_NAME);
}

async function readDocument(userData: string): Promise<SavedDocument> {
  let bytes: string;

  try {
    bytes = await readFile(storePath(userData), "utf8");
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return { version: 1, entries: [] };
    }
    throw error;
  }

  if (Buffer.byteLength(bytes, "utf8") > 65536) {
    throw new Error("LAST_USB_STORE_TOO_LARGE");
  }

  const parsed: unknown = JSON.parse(bytes);

  if (
    !parsed ||
    typeof parsed !== "object" ||
    Array.isArray(parsed) ||
    (parsed as SavedDocument).version !== 1 ||
    !Array.isArray((parsed as SavedDocument).entries)
  ) {
    throw new Error("LAST_USB_STORE_INVALID");
  }

  const entries = (parsed as SavedDocument).entries;

  if (
    entries.length > 32 ||
    entries.some(
      (entry) =>
        !entry ||
        !/^[a-f0-9]{64}$/.test(String(entry.fingerprint)) ||
        typeof entry.folderName !== "string" ||
        typeof entry.ownerId !== "string" ||
        typeof entry.businessId !== "string" ||
        typeof entry.branchId !== "string" ||
        typeof entry.updatedAt !== "string",
    )
  ) {
    throw new Error("LAST_USB_STORE_INVALID");
  }

  for (const entry of entries) {
    validFolderName(entry.folderName);
    checkedScope(entry);
  }

  return { version: 1, entries };
}

/**
 * Invoke ONLY after server-verified Owner login.
 * This preference contains no password, token or Wallet data.
 */
export async function savePaisaruleLastUsbFolderV1(input: {
  userData: string;
  removableRoot: string;
  branchRoot: string;
  identity: PaisaruleLastUsbIdentityV1;
  scope: PaisaruleLastUsbScopeV1;
}): Promise<void> {
  const folderName = exactRemovableChild(
    input.removableRoot,
    input.branchRoot,
  );
  const key = fingerprint(input.identity);
  const scope = checkedScope(input.scope);
  const current = await readDocument(input.userData);

  const entries = current.entries.filter(
    (entry) =>
      !(
        entry.fingerprint === key &&
        entry.ownerId === scope.ownerId &&
        entry.businessId === scope.businessId &&
        entry.branchId === scope.branchId
      ),
  );

  entries.unshift({
    fingerprint: key,
    folderName,
    ...scope,
    updatedAt: new Date().toISOString(),
  });

  const destination = storePath(input.userData);
  const temporary =
    destination + "." + randomUUID() + ".tmp";

  await mkdir(path.dirname(destination), { recursive: true });

  try {
    await writeFile(
      temporary,
      JSON.stringify({
        version: 1,
        entries: entries.slice(0, 32),
      }),
      { encoding: "utf8", flag: "wx" },
    );

    await rename(temporary, destination);
  } finally {
    await rm(temporary, { force: true }).catch(() => undefined);
  }
}

/**
 * Returns only a candidate. Caller MUST revalidate:
 * removable hardware, folder/auth file and account login.
 * Multiple different branch folders fail closed.
 */
export async function findPaisaruleLastUsbFolderV1(input: {
  userData: string;
  removableRoot: string;
  identity: PaisaruleLastUsbIdentityV1;
}): Promise<string | null> {
  const drive = path.win32.resolve(
    normalized(input.removableRoot),
  );

  if (!/^[A-Za-z]:\\$/.test(drive)) {
    return null;
  }

  const key = fingerprint(input.identity);
  const saved = await readDocument(input.userData);
  const matches = saved.entries.filter(
    (entry) => entry.fingerprint === key,
  );

  const names = Array.from(
    new Set(matches.map(
      (entry) => entry.folderName.toLowerCase(),
    )),
  );

  if (names.length !== 1 || matches.length === 0) {
    return null;
  }

  const name = validFolderName(matches[0].folderName);
  return path.win32.join(drive, name);
}