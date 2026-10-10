import {
  createHash,
  createPrivateKey,
  createPublicKey,
  generateKeyPairSync,
  randomUUID,
  sign,
  verify,
} from "node:crypto";

export interface FinoraOwnerWalletProofKeyMaterialV1 {
  schemaVersion: 1;
  keyId: string;
  algorithm: "ECDSA_P256_SHA256";
  publicKeySpkiDerBase64: string;
  publicKeySha256: string;
  privateKeyPkcs8DerBase64: string;
}

export interface FinoraOwnerWalletProofChallengeV1 {
  challenge: string;
  keyId: string;
  userId: string;
  ownerId: string;
  businessId: string;
  branchId: string;
  credentialId: string;
  authGeneration: number;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const CHALLENGE_RE = /^[a-f0-9]{64}$/;

function assertText(
  value: unknown,
  name: string,
): asserts value is string {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.length > 128 ||
    value.trim() !== value ||
    /[\r\n]/.test(value)
  ) {
    throw new Error(`Invalid ${name}.`);
  }
}

export function generateFinoraOwnerWalletProofKeyV1():
  FinoraOwnerWalletProofKeyMaterialV1 {
  const { publicKey, privateKey } =
    generateKeyPairSync("ec", {
      namedCurve: "prime256v1",
      publicKeyEncoding: {
        format: "der",
        type: "spki",
      },
      privateKeyEncoding: {
        format: "der",
        type: "pkcs8",
      },
    });

  return {
    schemaVersion: 1,
    keyId: randomUUID(),
    algorithm: "ECDSA_P256_SHA256",
    publicKeySpkiDerBase64:
      publicKey.toString("base64"),
    publicKeySha256: createHash("sha256")
      .update(publicKey)
      .digest("hex"),
    privateKeyPkcs8DerBase64:
      privateKey.toString("base64"),
  };
}

export function buildFinoraOwnerWalletProofMessageV1(
  input: FinoraOwnerWalletProofChallengeV1,
): string {
  if (
    !CHALLENGE_RE.test(input?.challenge ?? "") ||
    !UUID_RE.test(input?.keyId ?? "") ||
    !Number.isSafeInteger(input?.authGeneration) ||
    input.authGeneration < 1
  ) {
    throw new Error("Invalid wallet proof challenge.");
  }

  for (const name of [
    "userId",
    "ownerId",
    "businessId",
    "branchId",
    "credentialId",
  ] as const) {
    assertText(input[name], name);
  }

  // Must match backend buildOwnerWalletProofMessage().
  return [
    "FINORA-OWNER-WALLET-PROOF-V1",
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

export function signFinoraOwnerWalletProofV1(
  input: FinoraOwnerWalletProofChallengeV1,
  material: FinoraOwnerWalletProofKeyMaterialV1,
): string {
  if (
    material?.schemaVersion !== 1 ||
    material.algorithm !== "ECDSA_P256_SHA256" ||
    material.keyId.toLowerCase() !==
      input.keyId.toLowerCase() ||
    !UUID_RE.test(material.keyId)
  ) {
    throw new Error("Wallet proof key mismatch.");
  }

  const publicDer = Buffer.from(
    material.publicKeySpkiDerBase64,
    "base64",
  );

  const privateDer = Buffer.from(
    material.privateKeyPkcs8DerBase64,
    "base64",
  );

  if (
    publicDer.toString("base64") !==
      material.publicKeySpkiDerBase64 ||
    privateDer.toString("base64") !==
      material.privateKeyPkcs8DerBase64
  ) {
    throw new Error("Noncanonical wallet proof key.");
  }

  const fingerprint = createHash("sha256")
    .update(publicDer)
    .digest("hex");

  if (fingerprint !== material.publicKeySha256) {
    throw new Error("Wallet proof fingerprint mismatch.");
  }

  const privateKey = createPrivateKey({
    key: privateDer,
    format: "der",
    type: "pkcs8",
  });

  if (
    privateKey.asymmetricKeyType !== "ec" ||
    privateKey.asymmetricKeyDetails?.namedCurve !==
      "prime256v1"
  ) {
    throw new Error("Wallet proof key must use P-256.");
  }

  const derivedPublic = createPublicKey(privateKey)
    .export({ format: "der", type: "spki" });

  if (!Buffer.from(derivedPublic).equals(publicDer)) {
    throw new Error("Wallet proof private/public key mismatch.");
  }

  const message = buildFinoraOwnerWalletProofMessageV1(
    input,
  );

  // DER encoding: matches Node backend cryptoVerify(...,
  // { dsaEncoding: "der" }).
  const signature = sign(
    "sha256",
    Buffer.from(message, "utf8"),
    { key: privateKey, dsaEncoding: "der" },
  );

  return signature.toString("base64");
}

export function verifyFinoraOwnerWalletProofV1(
  input: FinoraOwnerWalletProofChallengeV1,
  signatureBase64: string,
  material: Pick<
    FinoraOwnerWalletProofKeyMaterialV1,
    "publicKeySpkiDerBase64"
  >,
): boolean {
  try {
    if (
      typeof signatureBase64 !== "string" ||
      !/^[A-Za-z0-9+/]+={0,2}$/.test(signatureBase64)
    ) {
      return false;
    }

    const signature = Buffer.from(
      signatureBase64,
      "base64",
    );

    if (
      signature.length < 64 ||
      signature.length > 80 ||
      signature.toString("base64") !== signatureBase64
    ) {
      return false;
    }

    const key = createPublicKey({
      key: Buffer.from(
        material.publicKeySpkiDerBase64,
        "base64",
      ),
      format: "der",
      type: "spki",
    });

    if (
      key.asymmetricKeyType !== "ec" ||
      key.asymmetricKeyDetails?.namedCurve !==
        "prime256v1"
    ) {
      return false;
    }

    return verify(
      "sha256",
      Buffer.from(
        buildFinoraOwnerWalletProofMessageV1(input),
        "utf8",
      ),
      { key, dsaEncoding: "der" },
      signature,
    );
  } catch {
    return false;
  }
}