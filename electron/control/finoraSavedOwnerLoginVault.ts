import { app, safeStorage } from "electron";
import { createHash, randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

export interface FinoraSavedOwnerLogin {
  id: string;
  branchId: string;
  ownerId: string;
  username: string;
  branchLabel: string;
  savedAt: string;
}

interface VaultRecord extends FinoraSavedOwnerLogin {
  password: string;
}

interface VaultData {
  version: 1;
  records: VaultRecord[];
}

interface EncryptedFile {
  version: 1;
  ciphertext: string;
}

export interface SaveOwnerLoginRequest {
  branchId: string;
  ownerId: string;
  username: string;
  branchLabel: string;
  password: string;
}

const MAX_ACCOUNTS = 100;
const MAX_FILE_BYTES = 1024 * 1024;
const MAX_FIELD_LENGTH = 256;

let mutationQueue: Promise<void> = Promise.resolve();

function requireWindowsEncryption(): void {
  if (process.platform !== "win32") {
    throw new Error("FINORA_OWNER_VAULT_WINDOWS_ONLY");
  }

  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error("FINORA_OWNER_VAULT_ENCRYPTION_UNAVAILABLE");
  }
}

function vaultPath(): string {
  return path.join(
    app.getPath("userData"),
    "FINORA",
    "secure-login",
    "owner-logins.v1.enc",
  );
}

function validatedField(
  value: string,
  name: string,
): string {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.length > MAX_FIELD_LENGTH ||
    !value.trim()
  ) {
    throw new Error(`FINORA_OWNER_VAULT_INVALID_${name}`);
  }

  return value.trim();
}

function accountId(
  branchId: string,
  ownerId: string,
  username: string,
): string {
  const identity = JSON.stringify([
    branchId,
    ownerId,
    username,
  ]);

  return createHash("sha256")
    .update(identity, "utf8")
    .digest("hex");
}

function validateRecord(value: unknown): VaultRecord {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    throw new Error("FINORA_OWNER_VAULT_CORRUPTED");
  }

  const record = value as Record<string, unknown>;

  const branchId = validatedField(
    record.branchId as string,
    "BRANCH",
  );

  const ownerId = validatedField(
    record.ownerId as string,
    "OWNER",
  );

  const username = validatedField(
    record.username as string,
    "USERNAME",
  );

  const branchLabel = validatedField(
    record.branchLabel as string,
    "LABEL",
  );

  if (
    typeof record.password !== "string" ||
    record.password.length === 0 ||
    record.password.length > 4096 ||
    typeof record.savedAt !== "string" ||
    !Number.isFinite(Date.parse(record.savedAt)) ||
    record.id !== accountId(branchId, ownerId, username)
  ) {
    throw new Error("FINORA_OWNER_VAULT_CORRUPTED");
  }

  return {
    id: record.id,
    branchId,
    ownerId,
    username,
    branchLabel,
    password: record.password,
    savedAt: record.savedAt,
  };
}

async function readVault(): Promise<VaultData> {
  requireWindowsEncryption();

  let bytes: Buffer;

  try {
    bytes = await fs.readFile(vaultPath());
  } catch (error) {
    if (
      (error as NodeJS.ErrnoException).code === "ENOENT"
    ) {
      return { version: 1, records: [] };
    }

    throw new Error("FINORA_OWNER_VAULT_READ_FAILED");
  }

  if (
    bytes.length === 0 ||
    bytes.length > MAX_FILE_BYTES
  ) {
    throw new Error("FINORA_OWNER_VAULT_CORRUPTED");
  }

  try {
    const outer = JSON.parse(
      bytes.toString("utf8"),
    ) as EncryptedFile;

    if (
      outer.version !== 1 ||
      typeof outer.ciphertext !== "string"
    ) {
      throw new Error("Invalid vault envelope");
    }

    const ciphertext = Buffer.from(
      outer.ciphertext,
      "base64",
    );

    const plaintext = safeStorage.decryptString(
      ciphertext,
    );

    const decoded = JSON.parse(plaintext) as VaultData;

    if (
      decoded.version !== 1 ||
      !Array.isArray(decoded.records) ||
      decoded.records.length > MAX_ACCOUNTS
    ) {
      throw new Error("Invalid vault records");
    }

    const records = decoded.records.map(validateRecord);
    const identities = new Set(records.map((record) => record.id));

    if (identities.size !== records.length) {
      throw new Error("Duplicate vault account");
    }

    return { version: 1, records };
  } catch {
    // Never treat encrypted or corrupted data as an empty vault.
    throw new Error("FINORA_OWNER_VAULT_DECRYPT_OR_FORMAT_FAILED");
  }
}

async function writeVault(data: VaultData): Promise<void> {
  requireWindowsEncryption();

  const location = vaultPath();
  const directory = path.dirname(location);

  await fs.mkdir(directory, {
    recursive: true,
    mode: 0o700,
  });

  const ciphertext = safeStorage.encryptString(
    JSON.stringify(data),
  );

  const envelope: EncryptedFile = {
    version: 1,
    ciphertext: ciphertext.toString("base64"),
  };

  const temporary = path.join(
    directory,
    `.owner-logins-${randomUUID()}.tmp`,
  );

  try {
    await fs.writeFile(
      temporary,
      JSON.stringify(envelope),
      { flag: "wx", mode: 0o600 },
    );

    await fs.rename(temporary, location);
  } finally {
    await fs.rm(temporary, { force: true }).catch(() => undefined);
  }
}

function withMutation<T>(
  action: () => Promise<T>,
): Promise<T> {
  const result = mutationQueue.then(action);

  mutationQueue = result.then(
    () => undefined,
    () => undefined,
  );

  return result;
}

export async function listSavedOwnerLogins():
  Promise<FinoraSavedOwnerLogin[]> {
  await mutationQueue;

  const data = await readVault();

  return data.records
    .map(({ password: _password, ...entry }) => entry)
    .sort((a, b) => a.branchLabel.localeCompare(b.branchLabel));
}

// FINORA_C81_A14_SECURE_LABEL_REFRESH
// Caller must authorize the exact Owner/Branch against server identity.
// This function cannot authenticate a caller by itself.
// Never update or expose stored passwords.
export async function updateSavedOwnerLoginLabel(
  id: string,
  branchId: string,
  ownerId: string,
  username: string,
  businessName: string,
): Promise<FinoraSavedOwnerLogin | null> {
  return withMutation(async () => {
    const exactBranchId = validatedField(branchId, "BRANCH");
    const exactOwnerId = validatedField(ownerId, "OWNER");
    const exactUsername = validatedField(username, "USERNAME");
    const exactBusinessName = validatedField(businessName, "LABEL");

    const expectedId = accountId(
      exactBranchId,
      exactOwnerId,
      exactUsername,
    );

    if (id !== expectedId) {
      throw new Error("FINORA_OWNER_VAULT_SCOPE_MISMATCH");
    }

    const data = await readVault();

    const index = data.records.findIndex(
      (record) => record.id === expectedId,
    );

    if (index < 0) {
      return null;
    }

    const existing = data.records[index];

    if (
      existing.branchId !== exactBranchId ||
      existing.ownerId !== exactOwnerId ||
      existing.username !== exactUsername
    ) {
      throw new Error("FINORA_OWNER_VAULT_SCOPE_MISMATCH");
    }

    if (existing.branchLabel !== exactBusinessName) {
      data.records[index] = {
        ...existing,
        branchLabel: exactBusinessName,
      };

      await writeVault(data);
    }

    const record = data.records[index];

    return {
      id: record.id,
      branchId: record.branchId,
      ownerId: record.ownerId,
      username: record.username,
      branchLabel: record.branchLabel,
      savedAt: record.savedAt,
    };
  });
}
export async function saveOwnerLogin(
  input: SaveOwnerLoginRequest,
): Promise<FinoraSavedOwnerLogin> {
  return withMutation(async () => {
    const branchId = validatedField(input.branchId, "BRANCH");
    const ownerId = validatedField(input.ownerId, "OWNER");
    const username = validatedField(input.username, "USERNAME");
    const branchLabel = validatedField(input.branchLabel, "LABEL");

    if (
      typeof input.password !== "string" ||
      input.password.length === 0 ||
      input.password.length > 4096
    ) {
      throw new Error("FINORA_OWNER_VAULT_INVALID_PASSWORD");
    }

    const id = accountId(branchId, ownerId, username);
    const data = await readVault();

    const record: VaultRecord = {
      id,
      branchId,
      ownerId,
      username,
      branchLabel,
      password: input.password,
      savedAt: new Date().toISOString(),
    };

    const index = data.records.findIndex(
      (entry) => entry.id === id,
    );

    if (index >= 0) {
      data.records[index] = record;
    } else {
      if (data.records.length >= MAX_ACCOUNTS) {
        throw new Error("FINORA_OWNER_VAULT_ACCOUNT_LIMIT");
      }

      data.records.push(record);
    }

    await writeVault(data);

    const { password: _password, ...metadata } = record;
    return metadata;
  });
}

export async function getSavedOwnerLogin(
  id: string,
): Promise<VaultRecord | null> {
  await mutationQueue;

  if (!/^[a-f0-9]{64}$/.test(id)) {
    throw new Error("FINORA_OWNER_VAULT_INVALID_ID");
  }

  const data = await readVault();

  return data.records.find((entry) => entry.id === id) ?? null;
}

export async function removeSavedOwnerLogin(
  id: string,
): Promise<boolean> {
  return withMutation(async () => {
    if (!/^[a-f0-9]{64}$/.test(id)) {
      throw new Error("FINORA_OWNER_VAULT_INVALID_ID");
    }

    const data = await readVault();
    const remaining = data.records.filter(
      (entry) => entry.id !== id,
    );

    if (remaining.length === data.records.length) {
      return false;
    }

    await writeVault({
      version: 1,
      records: remaining,
    });

    return true;
  });
}