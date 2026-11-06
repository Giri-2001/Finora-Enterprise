import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import {
  verifyPaisaruleRecoveryJournalV2,
  type PaisaruleJournalScopeV2,
  type PaisaruleVerifiedJournalV2,
} from "./paisaruleStorageBackupV1RecoveryJournal.js";

// PAISARULE_C117_R291_RECOVERY_JOURNAL_STORE
//
// This is a storage primitive, NOT a restore authorization.
// Native Main integration is intentionally absent.
// Caller must own authenticated branch authority, physical
// USB identity checks and an exclusive mutation lock.
//
// Never overwrite an existing journal.
// Never delete an incomplete journal automatically.
// A journal alone never authorizes predecessor recovery.

const JOURNAL = "paisarule-restore-journal-v2.json";
const MAX_BYTES = 4096;

export interface PaisaruleRecoveryJournalStoreAuthorityV2 {
  branchRoot: string;
  scope: PaisaruleJournalScopeV2;
}

export interface PaisaruleRecoveryJournalStoreResultV2 {
  written: true;
  journalSha256: string;
  transactionId: string;
}

function fail(code: string): never {
  throw new Error(code);
}

function resolveJournalPath(branchRoot: string): {
  finora: string;
  filename: string;
} {
  if (
    process.platform !== "win32" ||
    typeof branchRoot !== "string" ||
    !path.win32.isAbsolute(branchRoot)
  ) {
    fail("RECOVERY_JOURNAL_PATH_INVALID");
  }

  const root = path.win32.resolve(branchRoot);
  const drive = path.win32.parse(root).root;

  if (
    !/^[A-Za-z]:\\$/.test(drive) ||
    root.toLowerCase() === drive.toLowerCase()
  ) {
    fail("RECOVERY_JOURNAL_BRANCH_REQUIRED");
  }

  const finora = path.win32.join(root, "FINORA");

  return {
    finora,
    filename: path.win32.join(finora, JOURNAL),
  };
}

async function assertDirectory(
  filename: string,
): Promise<void> {
  const stat = await fs.lstat(filename);

  if (!stat.isDirectory() || stat.isSymbolicLink()) {
    fail("RECOVERY_JOURNAL_DIRECTORY_INVALID");
  }
}

async function readExact(
  filename: string,
): Promise<Buffer> {
  const stat = await fs.lstat(filename);

  if (
    !stat.isFile() ||
    stat.isSymbolicLink() ||
    stat.size < 1 ||
    stat.size > MAX_BYTES
  ) {
    fail("RECOVERY_JOURNAL_FILE_INVALID");
  }

  const handle = await fs.open(filename, "r");

  try {
    const handleStat = await handle.stat();

    if (
      !handleStat.isFile() ||
      handleStat.size !== stat.size
    ) {
      fail("RECOVERY_JOURNAL_FILE_CHANGED");
    }

    const bytes = await handle.readFile();

    if (bytes.length !== stat.size) {
      bytes.fill(0);
      fail("RECOVERY_JOURNAL_FILE_CHANGED");
    }

    return bytes;
  } finally {
    await handle.close();
  }
}

export async function readPaisaruleRecoveryJournalStoreV2(
  authority: PaisaruleRecoveryJournalStoreAuthorityV2,
  trustedKey: Buffer,
): Promise<PaisaruleVerifiedJournalV2> {
  if (!authority || !authority.scope) {
    fail("RECOVERY_JOURNAL_AUTHORITY_INVALID");
  }

  const location = resolveJournalPath(
    authority.branchRoot,
  );

  await assertDirectory(
    path.win32.dirname(location.finora),
  );
  await assertDirectory(location.finora);

  const bytes = await readExact(location.filename);

  try {
    return verifyPaisaruleRecoveryJournalV2(
      bytes.toString("utf8"),
      trustedKey,
      {
        branchRoot: authority.branchRoot,
        scope: authority.scope,
      },
    );
  } finally {
    bytes.fill(0);
  }
}

export async function writePaisaruleRecoveryJournalStoreV2(
  authority: PaisaruleRecoveryJournalStoreAuthorityV2,
  serialized: string,
  trustedKey: Buffer,
): Promise<PaisaruleRecoveryJournalStoreResultV2> {
  if (
    !authority ||
    !authority.scope ||
    typeof serialized !== "string" ||
    Buffer.byteLength(serialized, "utf8") > MAX_BYTES
  ) {
    fail("RECOVERY_JOURNAL_INPUT_INVALID");
  }

  const location = resolveJournalPath(
    authority.branchRoot,
  );

  await assertDirectory(
    path.win32.dirname(location.finora),
  );
  await assertDirectory(location.finora);

  // Reject malformed, tampered or wrong-scope journals
  // BEFORE any disk write.
  const verified = verifyPaisaruleRecoveryJournalV2(
    serialized,
    trustedKey,
    {
      branchRoot: authority.branchRoot,
      scope: authority.scope,
    },
  );

  const bytes = Buffer.from(serialized, "utf8");

  try {
    // Exclusive creation. No replacement, truncation,
    // rename-overwrite or silent reuse of old journals.
    const handle = await fs.open(
      location.filename,
      "wx",
      0o600,
    );

    try {
      await handle.writeFile(bytes);
      await handle.sync();
    } finally {
      await handle.close();
    }

    // Readback proves the journal is present and
    // authentic at verification time.
    const published =
      await readPaisaruleRecoveryJournalStoreV2(
        authority,
        trustedKey,
      );

    if (
      published.transactionId !==
      verified.transactionId
    ) {
      fail("RECOVERY_JOURNAL_READBACK_MISMATCH");
    }

    const readback = await readExact(location.filename);

    try {
      const expectedSha = createHash("sha256")
        .update(bytes)
        .digest("hex");

      const actualSha = createHash("sha256")
        .update(readback)
        .digest("hex");

      if (actualSha !== expectedSha) {
        fail("RECOVERY_JOURNAL_READBACK_MISMATCH");
      }

      return {
        written: true as const,
        journalSha256: actualSha,
        transactionId: verified.transactionId,
      };
    } finally {
      readback.fill(0);
    }
  } finally {
    bytes.fill(0);
  }
}