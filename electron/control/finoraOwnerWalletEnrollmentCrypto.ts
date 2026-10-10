// Main-process only. Private key material must never cross renderer IPC.
import {
  createHash, createPrivateKey, createPublicKey, sign,
} from "node:crypto";
import {
  buildFinoraOwnerWalletProofMessageV1,
} from "./finoraOwnerWalletProofCrypto.js";
import type {
  FinoraOwnerWalletProofChallengeV1,
  FinoraOwnerWalletProofKeyMaterialV1,
} from "./finoraOwnerWalletProofCrypto.js";

export function buildFinoraOwnerWalletEnrollmentMessageV1(
  input: FinoraOwnerWalletProofChallengeV1,
): string {
  if (
    typeof input?.challenge !== "string" ||
    input.challenge.length !== 64 ||
    typeof input?.keyId !== "string" ||
    input.keyId.length !== 36
  ) {
    throw new Error("INVALID_ENROLLMENT_CHALLENGE");
  }

  // Reuse existing scope, UUID, challenge and generation validation.
  buildFinoraOwnerWalletProofMessageV1(input);

  return [
    "FINORA-OWNER-WALLET-ENROLLMENT-V1",
    input.challenge,
    input.keyId.toLowerCase(),
    input.userId,
    input.ownerId,
    input.businessId,
    input.branchId,
    input.credentialId,
    String(input.authGeneration),
  ].join("\n");
}

export function signFinoraOwnerWalletEnrollmentV1(
  input: FinoraOwnerWalletProofChallengeV1,
  material: FinoraOwnerWalletProofKeyMaterialV1,
): string {
  const message = buildFinoraOwnerWalletEnrollmentMessageV1(input);

  if (
    material?.schemaVersion !== 1 ||
    material.algorithm !== "ECDSA_P256_SHA256" ||
    typeof material.keyId !== "string" ||
    material.keyId.toLowerCase() !== input.keyId.toLowerCase() ||
    typeof material.publicKeySpkiDerBase64 !== "string" ||
    typeof material.privateKeyPkcs8DerBase64 !== "string" ||
    material.publicKeySpkiDerBase64.length > 512 ||
    material.privateKeyPkcs8DerBase64.length > 1024
  ) {
    throw new Error("ENROLLMENT_KEY_MISMATCH");
  }

  const publicDer = Buffer.from(material.publicKeySpkiDerBase64, "base64");
  const privateDer = Buffer.from(material.privateKeyPkcs8DerBase64, "base64");

  if (
    publicDer.length < 60 || publicDer.length > 384 ||
    privateDer.length === 0 ||
    publicDer.toString("base64") !== material.publicKeySpkiDerBase64 ||
    privateDer.toString("base64") !== material.privateKeyPkcs8DerBase64 ||
    createHash("sha256").update(publicDer).digest("hex") !==
      material.publicKeySha256
  ) {
    throw new Error("INVALID_ENROLLMENT_KEY_MATERIAL");
  }

  const privateKey = createPrivateKey({
    key: privateDer, format: "der", type: "pkcs8",
  });

  if (
    privateKey.asymmetricKeyType !== "ec" ||
    privateKey.asymmetricKeyDetails?.namedCurve !== "prime256v1"
  ) {
    throw new Error("ENROLLMENT_KEY_MUST_USE_P256");
  }

  const derivedPublic = createPublicKey(privateKey).export({
    format: "der", type: "spki",
  });

  if (!derivedPublic.equals(publicDer)) {
    throw new Error("ENROLLMENT_PRIVATE_PUBLIC_KEY_MISMATCH");
  }

  return sign("sha256", Buffer.from(message, "utf8"), {
    key: privateKey, dsaEncoding: "der",
  }).toString("base64");
}