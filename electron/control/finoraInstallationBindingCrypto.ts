/* ===========================================================
   FINORA ENTERPRISE OS™

   WINDOWS INSTALLATION BINDING CRYPTO

   MODULE  : Native Control
   LAYER   : Electron Main
   VERSION : 1.0
   STATUS  : Production Foundation

   RESPONSIBILITY:

   - Generate one P-256 installation binding keypair
   - Generate native installation identity
   - Export public key as SPKI DER Base64
   - Persist private key contract as PKCS8 DER Base64
   - Derive SHA-256 public-key fingerprint
   - Sign installation enrollment proof only
   - Verify installation-binding signatures

   SECURITY:

   - This is a BRANCH INSTALLATION possession key.
   - This is NOT the FINORA Control Center signing key.
   - It cannot authorize Branch Activation by itself.
   - Private material must remain Electron-main native.
   - No IPC.
   - No preload.
   - No renderer.
   - No filesystem.
   - No Business Date.
=========================================================== */

import {
  createHash,
  createPrivateKey,
  createPublicKey,
  generateKeyPairSync,
  randomUUID,
  sign as nodeSign,
  verify as nodeVerify,
} from "node:crypto";

// ============================================================
// CONSTANTS
// ============================================================

export const FINORA_INSTALLATION_BINDING_ALGORITHM =
  "ECDSA_P256_SHA256" as const;

export const FINORA_INSTALLATION_BINDING_PUBLIC_KEY_FORMAT =
  "SPKI_DER_BASE64" as const;

export const FINORA_INSTALLATION_BINDING_PRIVATE_KEY_FORMAT =
  "PKCS8_DER_BASE64" as const;

export const FINORA_INSTALLATION_BINDING_SIGNATURE_ENCODING =
  "IEEE_P1363" as const;

export const FINORA_INSTALLATION_BINDING_FINGERPRINT_ALGORITHM =
  "SHA-256" as const;

export const FINORA_INSTALLATION_BINDING_PLATFORM =
  "WINDOWS" as const;

// ============================================================
// TYPES
// ============================================================

export interface FinoraWindowsInstallationBindingPublic {

  installationId:
    string;

  bindingKeyId:
    string;

  platform:
    typeof FINORA_INSTALLATION_BINDING_PLATFORM;

  algorithm:
    typeof FINORA_INSTALLATION_BINDING_ALGORITHM;

  publicKeyFormat:
    typeof FINORA_INSTALLATION_BINDING_PUBLIC_KEY_FORMAT;

  publicKey:
    string;

  fingerprintAlgorithm:
    typeof FINORA_INSTALLATION_BINDING_FINGERPRINT_ALGORITHM;

  publicKeyFingerprint:
    string;

  createdAt:
    string;

  schemaVersion:
    1;
}

export interface FinoraWindowsInstallationBindingMaterial
  extends FinoraWindowsInstallationBindingPublic {

  privateKeyFormat:
    typeof FINORA_INSTALLATION_BINDING_PRIVATE_KEY_FORMAT;

  privateKey:
    string;

  vaultSchemaVersion:
    1;
}

// ============================================================
// BASE64
// ============================================================

function decodeStrictBase64(
  value:
    string,
): Buffer {

  if (
    value.length === 0 ||
    value.length % 4 !== 0 ||
    !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(
      value,
    )
  ) {
    throw new Error(
      "FINORA installation binding contains invalid Base64 data.",
    );
  }

  const decoded =
    Buffer.from(
      value,
      "base64",
    );

  if (
    decoded.length === 0 ||
    decoded.toString(
      "base64",
    ) !== value
  ) {
    throw new Error(
      "FINORA installation binding Base64 data is not canonical.",
    );
  }

  return decoded;
}

// ============================================================
// FINGERPRINT
// ============================================================

export function createFinoraInstallationBindingFingerprint(
  publicKeySpkiDerBase64:
    string,
): string {

  const publicKeyBytes =
    decodeStrictBase64(
      publicKeySpkiDerBase64,
    );

  return createHash(
    "sha256",
  )
    .update(
      publicKeyBytes,
    )
    .digest(
      "hex",
    );
}

// ============================================================
// KEY VALIDATION
// ============================================================

function assertP256PublicKey(
  publicKeySpkiDerBase64:
    string,
): Buffer {

  const der =
    decodeStrictBase64(
      publicKeySpkiDerBase64,
    );

  const publicKey =
    createPublicKey({
      key:
        der,

      format:
        "der",

      type:
        "spki",
    });

  if (
    publicKey.asymmetricKeyType !==
      "ec"
  ) {
    throw new Error(
      "FINORA installation binding public key is not EC.",
    );
  }

  const namedCurve =
    publicKey
      .asymmetricKeyDetails
      ?.namedCurve;

  if (
    namedCurve !== "prime256v1" &&
    namedCurve !== "P-256"
  ) {
    throw new Error(
      "FINORA installation binding public key is not P-256.",
    );
  }

  return der;
}

function assertP256PrivateKey(
  privateKeyPkcs8DerBase64:
    string,
): ReturnType<typeof createPrivateKey> {

  const der =
    decodeStrictBase64(
      privateKeyPkcs8DerBase64,
    );

  const privateKey =
    createPrivateKey({
      key:
        der,

      format:
        "der",

      type:
        "pkcs8",
    });

  if (
    privateKey.asymmetricKeyType !==
      "ec"
  ) {
    throw new Error(
      "FINORA installation binding private key is not EC.",
    );
  }

  const namedCurve =
    privateKey
      .asymmetricKeyDetails
      ?.namedCurve;

  if (
    namedCurve !== "prime256v1" &&
    namedCurve !== "P-256"
  ) {
    throw new Error(
      "FINORA installation binding private key is not P-256.",
    );
  }

  return privateKey;
}

// ============================================================
// MATERIAL VALIDATION
// ============================================================

export function validateFinoraWindowsInstallationBindingMaterial(
  value:
    FinoraWindowsInstallationBindingMaterial,
): void {

  if (
    typeof value.installationId !== "string" ||
    value.installationId.trim().length === 0
  ) {
    throw new Error(
      "FINORA Windows installationId is invalid.",
    );
  }

  if (
    typeof value.bindingKeyId !== "string" ||
    !value.bindingKeyId.startsWith(
      "FINORA-BINDING-",
    )
  ) {
    throw new Error(
      "FINORA Windows bindingKeyId is invalid.",
    );
  }

  if (
    value.platform !==
      FINORA_INSTALLATION_BINDING_PLATFORM ||
    value.algorithm !==
      FINORA_INSTALLATION_BINDING_ALGORITHM ||
    value.publicKeyFormat !==
      FINORA_INSTALLATION_BINDING_PUBLIC_KEY_FORMAT ||
    value.privateKeyFormat !==
      FINORA_INSTALLATION_BINDING_PRIVATE_KEY_FORMAT ||
    value.fingerprintAlgorithm !==
      FINORA_INSTALLATION_BINDING_FINGERPRINT_ALGORITHM ||
    value.schemaVersion !== 1 ||
    value.vaultSchemaVersion !== 1
  ) {
    throw new Error(
      "FINORA Windows installation binding cryptographic contract is invalid.",
    );
  }

  if (
    typeof value.createdAt !== "string" ||
    !Number.isFinite(
      Date.parse(
        value.createdAt,
      ),
    )
  ) {
    throw new Error(
      "FINORA Windows installation binding timestamp is invalid.",
    );
  }

  if (
    !/^[0-9a-f]{64}$/.test(
      value.publicKeyFingerprint,
    )
  ) {
    throw new Error(
      "FINORA Windows installation binding fingerprint is invalid.",
    );
  }

  const publicKeyDer =
    assertP256PublicKey(
      value.publicKey,
    );

  const privateKey =
    assertP256PrivateKey(
      value.privateKey,
    );

  const derivedPublicKeyDer =
    createPublicKey(
      privateKey,
    ).export({
      format:
        "der",

      type:
        "spki",
    }) as Buffer;

  if (
    !publicKeyDer.equals(
      derivedPublicKeyDer,
    )
  ) {
    throw new Error(
      "FINORA Windows installation binding public/private keypair does not match.",
    );
  }

  const expectedFingerprint =
    createHash(
      "sha256",
    )
      .update(
        publicKeyDer,
      )
      .digest(
        "hex",
      );

  if (
    expectedFingerprint !==
      value.publicKeyFingerprint
  ) {
    throw new Error(
      "FINORA Windows installation binding fingerprint does not match its public key.",
    );
  }

  const expectedBindingKeyId =
    `FINORA-BINDING-${expectedFingerprint
      .slice(
        0,
        32,
      )
      .toUpperCase()}`;

  if (
    value.bindingKeyId !==
      expectedBindingKeyId
  ) {
    throw new Error(
      "FINORA Windows installation binding key identity is invalid.",
    );
  }
}

// ============================================================
// GENERATE
// ============================================================

export function generateFinoraWindowsInstallationBindingMaterial(
  now:
    Date = new Date(),

  preferredInstallationId?:
    string,
): FinoraWindowsInstallationBindingMaterial {

  if (
    !Number.isFinite(
      now.getTime(),
    )
  ) {
    throw new Error(
      "FINORA installation binding generation timestamp is invalid.",
    );
  }

  const normalizedPreferredInstallationId =
    preferredInstallationId
      ?.trim();

  if (
    preferredInstallationId !== undefined &&
    !normalizedPreferredInstallationId
  ) {
    throw new Error(
      "Preferred FINORA installationId is invalid.",
    );
  }

  const installationId =
    normalizedPreferredInstallationId ??
    `FINORA-INSTALLATION-${randomUUID()}`;

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

  const fingerprint =
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
    FinoraWindowsInstallationBindingMaterial = {

      installationId:
        installationId,

      bindingKeyId:
        `FINORA-BINDING-${fingerprint
          .slice(
            0,
            32,
          )
          .toUpperCase()}`,

      platform:
        FINORA_INSTALLATION_BINDING_PLATFORM,

      algorithm:
        FINORA_INSTALLATION_BINDING_ALGORITHM,

      publicKeyFormat:
        FINORA_INSTALLATION_BINDING_PUBLIC_KEY_FORMAT,

      publicKey:
        publicKeyBase64,

      fingerprintAlgorithm:
        FINORA_INSTALLATION_BINDING_FINGERPRINT_ALGORITHM,

      publicKeyFingerprint:
        fingerprint,

      privateKeyFormat:
        FINORA_INSTALLATION_BINDING_PRIVATE_KEY_FORMAT,

      privateKey:
        privateKey.toString(
          "base64",
        ),

      createdAt:
        now.toISOString(),

      schemaVersion:
        1,

      vaultSchemaVersion:
        1,
    };

  validateFinoraWindowsInstallationBindingMaterial(
    material,
  );

  return material;
}

// ============================================================
// PUBLIC VIEW
// ============================================================

export function toFinoraWindowsInstallationBindingPublic(
  material:
    FinoraWindowsInstallationBindingMaterial,
): FinoraWindowsInstallationBindingPublic {

  validateFinoraWindowsInstallationBindingMaterial(
    material,
  );

  return {
    installationId:
      material.installationId,

    bindingKeyId:
      material.bindingKeyId,

    platform:
      material.platform,

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
      1,
  };
}

// ============================================================
// ENROLLMENT POSSESSION SIGNATURE
// ============================================================

export function signFinoraInstallationEnrollmentCanonicalValue(
  canonicalEnrollmentPayload:
    string,

  material:
    FinoraWindowsInstallationBindingMaterial,
): string {

  if (
    typeof canonicalEnrollmentPayload !==
      "string" ||
    canonicalEnrollmentPayload.length ===
      0
  ) {
    throw new Error(
      "Canonical FINORA installation enrollment payload is required.",
    );
  }

  validateFinoraWindowsInstallationBindingMaterial(
    material,
  );

  const privateKey =
    assertP256PrivateKey(
      material.privateKey,
    );

  const signature =
    nodeSign(
      "sha256",
      Buffer.from(
        canonicalEnrollmentPayload,
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
      "FINORA installation binding signature must contain exactly 64 IEEE-P1363 bytes.",
    );
  }

  return signature.toString(
    "base64",
  );
}

// ============================================================
// PUBLIC VERIFY
// ============================================================

export function verifyFinoraInstallationBindingCanonicalValue(
  canonicalEnrollmentPayload:
    string,

  signatureBase64:
    string,

  publicBinding:
    FinoraWindowsInstallationBindingPublic,
): boolean {

  if (
    typeof canonicalEnrollmentPayload !==
      "string" ||
    canonicalEnrollmentPayload.length ===
      0
  ) {
    return false;
  }

  try {

    const publicKeyDer =
      assertP256PublicKey(
        publicBinding.publicKey,
      );

    if (
      createFinoraInstallationBindingFingerprint(
        publicBinding.publicKey,
      ) !==
      publicBinding.publicKeyFingerprint
    ) {
      return false;
    }

    const signature =
      decodeStrictBase64(
        signatureBase64,
      );

    if (
      signature.length !==
        64
    ) {
      return false;
    }

    const publicKey =
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
        canonicalEnrollmentPayload,
        "utf8",
      ),
      {
        key:
          publicKey,

        dsaEncoding:
          "ieee-p1363",
      },
      signature,
    );

  } catch {

    return false;
  }
}

// ============================================================
// END
// ============================================================