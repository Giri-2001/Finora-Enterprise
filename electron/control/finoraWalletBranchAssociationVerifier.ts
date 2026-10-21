import {
  createHash,
  createPublicKey,
  verify as cryptoVerify,
} from "node:crypto";

export interface FinoraWalletAssociationScope {
  localUserId: string;
  localOwnerId: string;
  localBusinessId: string;
  localBranchId: string;
  serverUserId: string;
  serverOwnerId: string;
  serverBusinessId: string;
  serverBranchId: string;
  serverCredentialId: string;
}

export interface FinoraWalletSignedAssociation {
  payload: FinoraWalletAssociationScope & {
    schemaVersion: 1;
    purpose: "FINORA_WALLET_BRANCH_ASSOCIATION";
    associationId: string;
    status: "ACTIVE";
    issuedAt: string;
    expiresAt: string;
  };
  signatureBase64: string;
  signingKeySha256: string;
}

const SCOPE_FIELDS = [
  "localUserId",
  "localOwnerId",
  "localBusinessId",
  "localBranchId",
  "serverUserId",
  "serverOwnerId",
  "serverBusinessId",
  "serverBranchId",
  "serverCredentialId",
] as const;

const PAYLOAD_FIELDS = [
  "schemaVersion",
  "purpose",
  "associationId",
  "status",
  ...SCOPE_FIELDS,
  "issuedAt",
  "expiresAt",
] as const;

function validId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= 128 &&
    value.trim() === value &&
    !/[\u0000-\u001f\u007f]/.test(value)
  );
}

function validTime(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) &&
    new Date(parsed).toISOString() === value;
}

function decodeBase64(value: unknown): Buffer | null {
  if (
    typeof value !== "string" ||
    !/^[A-Za-z0-9+/]+={0,2}$/.test(value)
  ) return null;

  const decoded = Buffer.from(value, "base64");
  return decoded.length > 0 &&
    decoded.toString("base64") === value
      ? decoded
      : null;
}

export function verifyFinoraWalletBranchAssociation(
  signed: unknown,
  expected: FinoraWalletAssociationScope,
  trustedPublicKeySpkiDerBase64: string,
  pinnedFingerprint: string,
  now = Date.now(),
): boolean {
  try {
    if (
      !signed ||
      typeof signed !== "object" ||
      Array.isArray(signed) ||
      !Number.isFinite(now)
    ) return false;

    const record = signed as Record<string, unknown>;

    if (
      Object.keys(record).length !== 3 ||
      !Object.hasOwn(record, "payload") ||
      !Object.hasOwn(record, "signatureBase64") ||
      !Object.hasOwn(record, "signingKeySha256")
    ) return false;

    const payload = record.payload;

    if (
      !payload ||
      typeof payload !== "object" ||
      Array.isArray(payload)
    ) return false;

    const p = payload as Record<string, unknown>;

    if (
      Object.keys(p).length !== PAYLOAD_FIELDS.length ||
      Object.keys(p).some(key =>
        !(PAYLOAD_FIELDS as readonly string[]).includes(key)
      ) ||
      p.schemaVersion !== 1 ||
      p.purpose !== "FINORA_WALLET_BRANCH_ASSOCIATION" ||
      p.status !== "ACTIVE" ||
      !validId(p.associationId) ||
      !SCOPE_FIELDS.every(field =>
        validId(p[field]) &&
        validId(expected?.[field]) &&
        p[field] === expected[field]
      ) ||
      !validTime(p.issuedAt) ||
      !validTime(p.expiresAt)
    ) return false;

    const issued = Date.parse(p.issuedAt);
    const expires = Date.parse(p.expiresAt);

    if (
      issued > now + 60000 ||
      expires <= now ||
      expires <= issued ||
      expires - issued > 900000
    ) return false;

    if (
      typeof pinnedFingerprint !== "string" ||
      !/^[a-f0-9]{64}$/.test(pinnedFingerprint) ||
      record.signingKeySha256 !== pinnedFingerprint
    ) return false;

    const publicDer = decodeBase64(
      trustedPublicKeySpkiDerBase64
    );

    const signature = decodeBase64(
      record.signatureBase64
    );

    if (
      !publicDer ||
      !signature ||
      signature.length !== 64 ||
      createHash("sha256")
        .update(publicDer)
        .digest("hex") !== pinnedFingerprint
    ) return false;

    const key = createPublicKey({
      key: publicDer,
      format: "der",
      type: "spki",
    });

    if (
      key.asymmetricKeyType !== "ec" ||
      key.asymmetricKeyDetails?.namedCurve !== "prime256v1"
    ) return false;

    // Byte-for-byte compatible with server associationSignature.js.
    const message = [
      "FINORA-WALLET-BRANCH-ASSOCIATION-V1",
      ...PAYLOAD_FIELDS.map(field => String(p[field])),
    ].join("\n");

    return cryptoVerify(
      "sha256",
      Buffer.from(message, "utf8"),
      { key, dsaEncoding: "ieee-p1363" },
      signature,
    );
  } catch {
    return false;
  }
}