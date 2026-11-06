import {
  createHmac,
  randomUUID,
  timingSafeEqual,
} from "node:crypto";
import path from "node:path";

// PAISARULE_C117_R282_RECOVERY_JOURNAL
//
// Pure journal codec. NO disk writes and NO automatic recovery.
// The caller MUST obtain a stable, secret authentication key
// from a trusted native authority, available again after restart.
// The key MUST NEVER be stored alongside the journal or supplied
// by the renderer.
//
// HMAC proves journal integrity only when that native key is
// authentic. It does not replace Owner server authorization,
// physical USB checks, storage exclusion or snapshot readback.

const VERSION = "PAISARULE_RECOVERY_JOURNAL_V2";
const HASH = /^[a-f0-9]{64}$/i;
const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const HEX_MAC = /^[a-f0-9]{64}$/;
const MAX_JOURNAL_LENGTH = 4096;

export interface PaisaruleJournalScopeV2 {
  userId: string;
  ownerId: string;
  businessId: string;
  branchId: string;
}

export interface PaisaruleJournalEvidenceV2 {
  branchRoot: string;
  scope: PaisaruleJournalScopeV2;
  expectedPrimarySha256: string;
  expectedSecondarySha256: string;
}

export interface PaisaruleVerifiedJournalV2
  extends PaisaruleJournalEvidenceV2 {
  transactionId: string;
  createdAt: string;
}

interface JournalBodyV2
  extends PaisaruleVerifiedJournalV2 {
  version: typeof VERSION;
}

interface JournalEnvelopeV2 {
  body: JournalBodyV2;
  mac: string;
}

function fail(code: string): never {
  throw new Error(code);
}

function normalizedRoot(value: unknown): string {
  if (
    typeof value !== "string" ||
    !path.win32.isAbsolute(value)
  ) {
    fail("RECOVERY_JOURNAL_BRANCH_INVALID");
  }

  const root = path.win32.resolve(value);
  const drive = path.win32.parse(root).root;

  if (
    !/^[A-Za-z]:\\$/.test(drive) ||
    root.toLowerCase() === drive.toLowerCase() ||
    root.includes("..")
  ) {
    fail("RECOVERY_JOURNAL_BRANCH_INVALID");
  }

  return root.toLowerCase();
}

function normalizedScope(
  scope: unknown,
): PaisaruleJournalScopeV2 {
  if (
    !scope ||
    typeof scope !== "object" ||
    Array.isArray(scope)
  ) {
    fail("RECOVERY_JOURNAL_SCOPE_INVALID");
  }

  const source = scope as Record<string, unknown>;
  const names = [
    "userId",
    "ownerId",
    "businessId",
    "branchId",
  ] as const;

  if (
    Object.keys(source).sort().join("|") !==
    [...names].sort().join("|")
  ) {
    fail("RECOVERY_JOURNAL_SCOPE_INVALID");
  }

  for (const name of names) {
    if (
      typeof source[name] !== "string" ||
      source[name].length < 1 ||
      source[name].length > 256 ||
      source[name].trim() !== source[name]
    ) {
      fail("RECOVERY_JOURNAL_SCOPE_INVALID");
    }
  }

  return {
    userId: source.userId as string,
    ownerId: source.ownerId as string,
    businessId: source.businessId as string,
    branchId: source.branchId as string,
  };
}

function keyValid(key: unknown): key is Buffer {
  return Buffer.isBuffer(key) && key.length >= 32;
}

function canonicalBody(
  evidence: PaisaruleJournalEvidenceV2,
  transactionId: string,
  createdAt: string,
): JournalBodyV2 {
  const root = normalizedRoot(evidence.branchRoot);
  const scope = normalizedScope(evidence.scope);

  if (
    !HASH.test(evidence.expectedPrimarySha256) ||
    !HASH.test(evidence.expectedSecondarySha256) ||
    !UUID.test(transactionId) ||
    !Number.isFinite(Date.parse(createdAt)) ||
    new Date(createdAt).toISOString() !== createdAt
  ) {
    fail("RECOVERY_JOURNAL_FIELDS_INVALID");
  }

  return {
    version: VERSION,
    transactionId: transactionId.toLowerCase(),
    createdAt,
    branchRoot: root,
    scope,
    expectedPrimarySha256:
      evidence.expectedPrimarySha256.toLowerCase(),
    expectedSecondarySha256:
      evidence.expectedSecondarySha256.toLowerCase(),
  };
}

function macFor(
  body: JournalBodyV2,
  key: Buffer,
): string {
  return createHmac("sha256", key)
    .update(JSON.stringify(body), "utf8")
    .digest("hex");
}

export function createPaisaruleRecoveryJournalV2(
  evidence: PaisaruleJournalEvidenceV2,
  trustedKey: Buffer,
): string {
  if (!keyValid(trustedKey)) {
    fail("RECOVERY_JOURNAL_KEY_INVALID");
  }

  const body = canonicalBody(
    evidence,
    randomUUID(),
    new Date().toISOString(),
  );

  const result: JournalEnvelopeV2 = {
    body,
    mac: macFor(body, trustedKey),
  };

  const serialized = JSON.stringify(result);

  if (Buffer.byteLength(serialized, "utf8") > MAX_JOURNAL_LENGTH) {
    fail("RECOVERY_JOURNAL_TOO_LARGE");
  }

  return serialized;
}

export function verifyPaisaruleRecoveryJournalV2(
  serialized: string,
  trustedKey: Buffer,
  expected: {
    branchRoot: string;
    scope: PaisaruleJournalScopeV2;
  },
): PaisaruleVerifiedJournalV2 {
  if (
    !keyValid(trustedKey) ||
    typeof serialized !== "string" ||
    Buffer.byteLength(serialized, "utf8") >
      MAX_JOURNAL_LENGTH ||
    !serialized.length ||
    !expected
  ) {
    fail("RECOVERY_JOURNAL_INPUT_INVALID");
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(serialized);
  } catch {
    fail("RECOVERY_JOURNAL_PARSE_FAILED");
  }

  if (
    !parsed ||
    typeof parsed !== "object" ||
    Array.isArray(parsed)
  ) {
    fail("RECOVERY_JOURNAL_FORMAT_INVALID");
  }

  const envelope = parsed as Record<string, unknown>;

  if (
    Object.keys(envelope).sort().join("|") !== "body|mac" ||
    typeof envelope.mac !== "string" ||
    !HEX_MAC.test(envelope.mac) ||
    !envelope.body ||
    typeof envelope.body !== "object" ||
    Array.isArray(envelope.body)
  ) {
    fail("RECOVERY_JOURNAL_FORMAT_INVALID");
  }

  const raw = envelope.body as Record<string, unknown>;

  const fields = [
    "version", "transactionId", "createdAt", "branchRoot",
    "scope", "expectedPrimarySha256",
    "expectedSecondarySha256",
  ];

  if (
    Object.keys(raw).sort().join("|") !==
    fields.sort().join("|") ||
    raw.version !== VERSION ||
    typeof raw.transactionId !== "string" ||
    typeof raw.createdAt !== "string" ||
    typeof raw.branchRoot !== "string" ||
    typeof raw.expectedPrimarySha256 !== "string" ||
    typeof raw.expectedSecondarySha256 !== "string"
  ) {
    fail("RECOVERY_JOURNAL_FIELDS_INVALID");
  }

  const normalized = canonicalBody(
    {
      branchRoot: raw.branchRoot,
      scope: raw.scope as PaisaruleJournalScopeV2,
      expectedPrimarySha256: raw.expectedPrimarySha256,
      expectedSecondarySha256: raw.expectedSecondarySha256,
    },
    raw.transactionId,
    raw.createdAt,
  );

  // Reject alternate encodings and noncanonical representations.
  if (JSON.stringify(normalized) !== JSON.stringify(raw)) {
    fail("RECOVERY_JOURNAL_NONCANONICAL");
  }

  const actualMac = Buffer.from(envelope.mac, "hex");
  const expectedMac = Buffer.from(
    macFor(normalized, trustedKey),
    "hex",
  );

  if (!timingSafeEqual(actualMac, expectedMac)) {
    fail("RECOVERY_JOURNAL_AUTH_FAILED");
  }

  if (
    normalized.branchRoot !==
      normalizedRoot(expected.branchRoot) ||
    JSON.stringify(normalized.scope) !==
      JSON.stringify(normalizedScope(expected.scope))
  ) {
    fail("RECOVERY_JOURNAL_AUTHORITY_SCOPE_MISMATCH");
  }

  return {
    transactionId: normalized.transactionId,
    createdAt: normalized.createdAt,
    branchRoot: normalized.branchRoot,
    scope: normalized.scope,
    expectedPrimarySha256:
      normalized.expectedPrimarySha256,
    expectedSecondarySha256:
      normalized.expectedSecondarySha256,
  };
}