import {
  createHash,
  createPrivateKey,
  createPublicKey,
  generateKeyPairSync,
  sign as nodeSign,
  verify as nodeVerify,
} from "node:crypto";

import {
  assertFinoraP256SpkiPublicKey,
} from "./finoraInstallationBindingCrypto.js";

import {
  FINORA_BRANCH_CERTIFICATION_ALGORITHM,
  FINORA_BRANCH_CERTIFICATION_CANONICALIZATION,
  FINORA_BRANCH_CERTIFICATION_FINGERPRINT_ALGORITHM,
  FINORA_BRANCH_CERTIFICATION_KEY_ID_PREFIX,
  FINORA_BRANCH_CERTIFICATION_PRIVATE_KEY_FORMAT,
  FINORA_BRANCH_CERTIFICATION_PUBLIC_KEY_FORMAT,
  FINORA_BRANCH_CERTIFICATION_SCHEMA_VERSION,
  FINORA_BRANCH_CERTIFICATION_SIGNATURE_ENCODING,
  FINORA_BRANCH_CERTIFICATION_VAULT_SCHEMA_VERSION,
  type FinoraBranchCertificationKeyMaterialV1,
  type FinoraBranchCertificationPublicKeyV1,
  type FinoraBranchCertificationSignatureV1,
} from "./finoraBranchCertificationContract.js";

// ============================================================
// STRICT BASE64
// ============================================================

function decodeStrictBase64(
  value:
    string,
): Buffer {

  if (
    typeof value !==
      "string" ||
    value.length ===
      0 ||
    value.trim() !==
      value
  ) {
    throw new Error(
      "FINORA Branch Certification Base64 data is invalid.",
    );
  }

  let decoded:
    Buffer;

  try {
    decoded =
      Buffer.from(
        value,
        "base64",
      );
  } catch {
    throw new Error(
      "FINORA Branch Certification Base64 data is invalid.",
    );
  }

  if (
    decoded.length ===
      0 ||
    decoded.toString(
      "base64",
    ) !==
      value
  ) {
    throw new Error(
      "FINORA Branch Certification Base64 data is not canonical.",
    );
  }

  return decoded;
}

// ============================================================
// TIMESTAMP
// ============================================================

function assertCanonicalTimestamp(
  value:
    string,
): void {

  if (
    typeof value !==
      "string" ||
    value.length ===
      0
  ) {
    throw new Error(
      "FINORA Branch Certification createdAt is invalid.",
    );
  }

  const parsed =
    Date.parse(
      value,
    );

  if (
    !Number.isFinite(
      parsed,
    ) ||
    new Date(
      parsed,
    ).toISOString() !==
      value
  ) {
    throw new Error(
      "FINORA Branch Certification createdAt is not canonical.",
    );
  }
}

// ============================================================
// FINGERPRINT / KEY ID
// ============================================================

export function createFinoraBranchCertificationFingerprint(
  publicKeySpkiDerBase64:
    string,
): string {

  assertFinoraP256SpkiPublicKey(
    publicKeySpkiDerBase64,
  );

  const publicKeyDer =
    decodeStrictBase64(
      publicKeySpkiDerBase64,
    );

  return createHash(
    "sha256",
  )
    .update(
      publicKeyDer,
    )
    .digest(
      "hex",
    );
}

export function createFinoraBranchCertificationKeyId(
  publicKeyFingerprint:
    string,
): string {

  if (
    typeof publicKeyFingerprint !==
      "string" ||
    !/^[0-9a-f]{64}$/.test(
      publicKeyFingerprint,
    )
  ) {
    throw new Error(
      "FINORA Branch Certification public-key fingerprint is invalid.",
    );
  }

  return (
    FINORA_BRANCH_CERTIFICATION_KEY_ID_PREFIX +
    publicKeyFingerprint
      .slice(
        0,
        32,
      )
      .toUpperCase()
  );
}

// ============================================================
// PUBLIC KEY VALIDATION
// ============================================================

export function assertFinoraBranchCertificationPublicKey(
  value:
    FinoraBranchCertificationPublicKeyV1,
): void {

  if (
    !value ||
    typeof value !==
      "object"
  ) {
    throw new Error(
      "FINORA Branch Certification public key is required.",
    );
  }

  if (
    value.algorithm !==
      FINORA_BRANCH_CERTIFICATION_ALGORITHM ||
    value.publicKeyFormat !==
      FINORA_BRANCH_CERTIFICATION_PUBLIC_KEY_FORMAT ||
    value.fingerprintAlgorithm !==
      FINORA_BRANCH_CERTIFICATION_FINGERPRINT_ALGORITHM ||
    value.schemaVersion !==
      FINORA_BRANCH_CERTIFICATION_SCHEMA_VERSION
  ) {
    throw new Error(
      "FINORA Branch Certification public-key metadata is invalid.",
    );
  }

  assertCanonicalTimestamp(
    value.createdAt,
  );

  assertFinoraP256SpkiPublicKey(
    value.publicKey,
  );

  const expectedFingerprint =
    createFinoraBranchCertificationFingerprint(
      value.publicKey,
    );

  if (
    value.publicKeyFingerprint !==
      expectedFingerprint
  ) {
    throw new Error(
      "FINORA Branch Certification fingerprint does not match its public key.",
    );
  }

  const expectedKeyId =
    createFinoraBranchCertificationKeyId(
      expectedFingerprint,
    );

  if (
    value.keyId !==
      expectedKeyId
  ) {
    throw new Error(
      "FINORA Branch Certification keyId is not canonical.",
    );
  }
}

// ============================================================
// PRIVATE KEY VALIDATION
// ============================================================

function parsePrivateKey(
  privateKeyPkcs8DerBase64:
    string,
): ReturnType<typeof createPrivateKey> {

  const privateKeyDer =
    decodeStrictBase64(
      privateKeyPkcs8DerBase64,
    );

  let privateKey:
    ReturnType<typeof createPrivateKey>;

  try {
    privateKey =
      createPrivateKey({
        key:
          privateKeyDer,

        format:
          "der",

        type:
          "pkcs8",
      });
  } catch {
    throw new Error(
      "FINORA Branch Certification private key is invalid PKCS8 DER.",
    );
  }

  if (
    privateKey.asymmetricKeyType !==
      "ec"
  ) {
    throw new Error(
      "FINORA Branch Certification private key is not EC.",
    );
  }

  /*
   * Validate the effective curve through the derived SPKI key.
   * The shared FINORA public-key validator accepts P-256 only.
   */
  const derivedPublicKey =
    createPublicKey(
      privateKey,
    )
      .export({
        format:
          "der",

        type:
          "spki",
      }) as Buffer;

  assertFinoraP256SpkiPublicKey(
    derivedPublicKey.toString(
      "base64",
    ),
  );

  return privateKey;
}

export function assertFinoraBranchCertificationKeyMaterial(
  value:
    FinoraBranchCertificationKeyMaterialV1,
): void {

  assertFinoraBranchCertificationPublicKey(
    value,
  );

  if (
    value.privateKeyFormat !==
      FINORA_BRANCH_CERTIFICATION_PRIVATE_KEY_FORMAT ||
    value.vaultSchemaVersion !==
      FINORA_BRANCH_CERTIFICATION_VAULT_SCHEMA_VERSION
  ) {
    throw new Error(
      "FINORA Branch Certification private-key metadata is invalid.",
    );
  }

  const privateKey =
    parsePrivateKey(
      value.privateKey,
    );

  const derivedPublicKeyDer =
    createPublicKey(
      privateKey,
    )
      .export({
        format:
          "der",

        type:
          "spki",
      }) as Buffer;

  const publicKeyDer =
    decodeStrictBase64(
      value.publicKey,
    );

  if (
    !derivedPublicKeyDer.equals(
      publicKeyDer,
    )
  ) {
    throw new Error(
      "FINORA Branch Certification public/private keypair does not match.",
    );
  }
}

// ============================================================
// GENERATE
// ============================================================

export function generateFinoraBranchCertificationKeyMaterial(
  now:
    Date,
): FinoraBranchCertificationKeyMaterialV1 {

  if (
    !(now instanceof Date) ||
    !Number.isFinite(
      now.getTime(),
    )
  ) {
    throw new Error(
      "FINORA Branch Certification generation timestamp is invalid.",
    );
  }

  const {
    publicKey,
    privateKey,
  } =
    generateKeyPairSync(
      "ec",
      {
        namedCurve:
          "prime256v1",

        publicKeyEncoding: {
          format:
            "der",

          type:
            "spki",
        },

        privateKeyEncoding: {
          format:
            "der",

          type:
            "pkcs8",
        },
      },
    );

  const publicKeyBase64 =
    publicKey.toString(
      "base64",
    );

  const publicKeyFingerprint =
    createHash(
      "sha256",
    )
      .update(
        publicKey,
      )
      .digest(
        "hex",
      );

  const material:
    FinoraBranchCertificationKeyMaterialV1 = {

      keyId:
        createFinoraBranchCertificationKeyId(
          publicKeyFingerprint,
        ),

      algorithm:
        FINORA_BRANCH_CERTIFICATION_ALGORITHM,

      publicKeyFormat:
        FINORA_BRANCH_CERTIFICATION_PUBLIC_KEY_FORMAT,

      publicKey:
        publicKeyBase64,

      fingerprintAlgorithm:
        FINORA_BRANCH_CERTIFICATION_FINGERPRINT_ALGORITHM,

      publicKeyFingerprint,

      createdAt:
        now.toISOString(),

      schemaVersion:
        FINORA_BRANCH_CERTIFICATION_SCHEMA_VERSION,

      privateKeyFormat:
        FINORA_BRANCH_CERTIFICATION_PRIVATE_KEY_FORMAT,

      privateKey:
        privateKey.toString(
          "base64",
        ),

      vaultSchemaVersion:
        FINORA_BRANCH_CERTIFICATION_VAULT_SCHEMA_VERSION,
    };

  assertFinoraBranchCertificationKeyMaterial(
    material,
  );

  return material;
}

// ============================================================
// PUBLIC PROJECTION
// ============================================================

export function toFinoraBranchCertificationPublicKey(
  material:
    FinoraBranchCertificationKeyMaterialV1,
): FinoraBranchCertificationPublicKeyV1 {

  assertFinoraBranchCertificationKeyMaterial(
    material,
  );

  return {
    keyId:
      material.keyId,

    algorithm:
      material.algorithm,

    publicKeyFormat:
      material.publicKeyFormat,

    publicKey:
      material.publicKey,

    fingerprintAlgorithm:
      material.fingerprintAlgorithm,

    publicKeyFingerprint:
      material.publicKeyFingerprint,

    createdAt:
      material.createdAt,

    schemaVersion:
      FINORA_BRANCH_CERTIFICATION_SCHEMA_VERSION,
  };
}

// ============================================================
// SIGN
// ============================================================

export function signFinoraBranchCertificationCanonicalValue(
  canonicalValue:
    string,

  material:
    FinoraBranchCertificationKeyMaterialV1,
): FinoraBranchCertificationSignatureV1 {

  if (
    typeof canonicalValue !==
      "string" ||
    canonicalValue.length ===
      0
  ) {
    throw new Error(
      "Canonical FINORA Branch Certification value is required.",
    );
  }

  assertFinoraBranchCertificationKeyMaterial(
    material,
  );

  const privateKey =
    parsePrivateKey(
      material.privateKey,
    );

  const signature =
    nodeSign(
      "sha256",
      Buffer.from(
        canonicalValue,
        "utf8",
      ),
      {
        key:
          privateKey,

        dsaEncoding:
          "ieee-p1363",
      },
    );

  if (
    signature.length !==
      64
  ) {
    throw new Error(
      "FINORA Branch Certification signature must contain exactly 64 IEEE-P1363 bytes.",
    );
  }

  return {
    algorithm:
      FINORA_BRANCH_CERTIFICATION_ALGORITHM,

    encoding:
      FINORA_BRANCH_CERTIFICATION_SIGNATURE_ENCODING,

    canonicalization:
      FINORA_BRANCH_CERTIFICATION_CANONICALIZATION,

    keyId:
      material.keyId,

    value:
      signature.toString(
        "base64",
      ),
  };
}

// ============================================================
// VERIFY
// ============================================================

export function verifyFinoraBranchCertificationCanonicalValue(
  canonicalValue:
    string,

  signature:
    FinoraBranchCertificationSignatureV1,

  publicKey:
    FinoraBranchCertificationPublicKeyV1,
): boolean {

  if (
    typeof canonicalValue !==
      "string" ||
    canonicalValue.length ===
      0
  ) {
    return false;
  }

  try {

    assertFinoraBranchCertificationPublicKey(
      publicKey,
    );

    if (
      !signature ||
      typeof signature !==
        "object" ||
      signature.algorithm !==
        FINORA_BRANCH_CERTIFICATION_ALGORITHM ||
      signature.encoding !==
        FINORA_BRANCH_CERTIFICATION_SIGNATURE_ENCODING ||
      signature.canonicalization !==
        FINORA_BRANCH_CERTIFICATION_CANONICALIZATION ||
      signature.keyId !==
        publicKey.keyId
    ) {
      return false;
    }

    const signatureBytes =
      decodeStrictBase64(
        signature.value,
      );

    if (
      signatureBytes.length !==
        64
    ) {
      return false;
    }

    const publicKeyDer =
      decodeStrictBase64(
        publicKey.publicKey,
      );

    const parsedPublicKey =
      createPublicKey({
        key:
          publicKeyDer,

        format:
          "der",

        type:
          "spki",
      });

    return nodeVerify(
      "sha256",
      Buffer.from(
        canonicalValue,
        "utf8",
      ),
      {
        key:
          parsedPublicKey,

        dsaEncoding:
          "ieee-p1363",
      },
      signatureBytes,
    );

  } catch {

    return false;
  }
}