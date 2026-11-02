import {
  sign as cryptoSign,
  type KeyObject,
} from "node:crypto";

/*
 * FINORA C79-R14
 *
 * Windows Billing-specific receipt signer.
 *
 * Requires a separately approved Billing P-256 key.
 * This module does not generate, persist, enroll or approve keys.
 *
 * Caller must supply a trusted native USB read-back digest
 * and a server-issued challenge.
 *
 * A signature proves key possession, not physical USB
 * persistence or an authorized PostgreSQL Wallet debit.
 *
 * INTERNAL ONLY: do not expose raw signing capability
 * through unrestricted renderer IPC.
 */

export interface FinoraUsageBillingAttestationV2 {
  challengeId: string;
  operationId: string;
  ownerId: string;
  businessId: string;
  branchId: string;
  deviceId: string;
  sourceType: "CUSTOMER" | "LOAN" | "COLLECTION";
  sourceReference: string;
  recordDigest: string;
}

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ID = /^[A-Za-z0-9_-]{1,128}$/;

const DIGEST = /^[a-f0-9]{64}$/;

const TYPES = new Set([
  "CUSTOMER",
  "LOAN",
  "COLLECTION",
]);

export function createFinoraWindowsBillingCanonicalMessageV2(
  data: FinoraUsageBillingAttestationV2,
): string | null {
  if (
    !data ||
    typeof data !== "object" ||
    Array.isArray(data) ||
    !UUID.test(data.challengeId ?? "") ||
    !UUID.test(data.operationId ?? "") ||
    !ID.test(data.ownerId ?? "") ||
    !ID.test(data.businessId ?? "") ||
    !ID.test(data.branchId ?? "") ||
    !ID.test(data.deviceId ?? "") ||
    !ID.test(data.sourceReference ?? "") ||
    !TYPES.has(data.sourceType) ||
    !DIGEST.test(data.recordDigest ?? "")
  ) {
    return null;
  }

  return [
    "FINORA_USAGE_SAVE_ATTESTATION_V2",
    data.challengeId.toLowerCase(),
    data.operationId.toLowerCase(),
    data.ownerId,
    data.businessId,
    data.branchId,
    data.deviceId,
    data.sourceType,
    data.sourceReference,
    data.recordDigest,
  ].join("\n");
}

export function signFinoraWindowsBillingReceiptV2(
  attestation: FinoraUsageBillingAttestationV2,
  billingPrivateKey: KeyObject,
): string | null {
  const canonical =
    createFinoraWindowsBillingCanonicalMessageV2(
      attestation,
    );

  if (!canonical) {
    return null;
  }

  try {
    if (
      billingPrivateKey?.type !== "private" ||
      billingPrivateKey.asymmetricKeyType !== "ec" ||
      billingPrivateKey.asymmetricKeyDetails?.namedCurve !==
        "prime256v1"
    ) {
      return null;
    }

    const signature = cryptoSign(
      "sha256",
      Buffer.from(canonical, "utf8"),
      {
        key: billingPrivateKey,
        dsaEncoding: "ieee-p1363",
      },
    );

    if (signature.length !== 64) {
      return null;
    }

    return signature.toString("base64");
  } catch {
    return null;
  }
}