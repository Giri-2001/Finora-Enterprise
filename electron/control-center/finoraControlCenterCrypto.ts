// ============================================================
// FINORA ENTERPRISE OS™
//
// CONTROL CENTER
// ECDSA P-256 SIGNING ENGINE
//
// RESPONSIBILITY:
//
// - Generate FINORA Control Center ECDSA P-256 key material
// - Export PKCS8 private key DER
// - Export SPKI public key DER
// - Sign FINORA canonical package bytes
// - Verify signatures for privileged self-tests
// - Use IEEE-P1363 signature encoding
//
// IMPORTANT:
//
// - NODE CRYPTO ONLY.
// - No Electron renderer.
// - No IPC.
// - No filesystem.
// - No safeStorage.
// - Private keys remain caller-owned privileged material.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

import {
  createHash,
  createPrivateKey,
  createPublicKey,
  generateKeyPairSync,
  sign as nodeSign,
  verify as nodeVerify,
} from "node:crypto";

// ============================================================
// SIGNING MATERIAL
// ============================================================

export interface FinoraControlCenterSigningMaterial {

  signingKeyId:
    string;

  privateKeyPkcs8DerBase64:
    string;

  publicKeySpkiDerBase64:
    string;
}

// ============================================================
// KEY ID
// ============================================================

function createSigningKeyId(
  publicKeyDer:
    Buffer,
): string {

  const digest =
    createHash(
      "sha256",
    )
      .update(
        publicKeyDer,
      )
      .digest(
        "hex",
      )
      .slice(
        0,
        24,
      )
      .toUpperCase();

  return `FINORA-KEY-${digest}`;
}

// ============================================================
// GENERATE
// ============================================================

export function generateFinoraControlCenterSigningMaterial():
  FinoraControlCenterSigningMaterial {

  const {
    privateKey,
    publicKey,
  } =
    generateKeyPairSync(
      "ec",
      {
        namedCurve:
          "prime256v1",
      },
    );

  const privateKeyDer =
    privateKey.export({
      format:
        "der",

      type:
        "pkcs8",
    }) as Buffer;

  const publicKeyDer =
    publicKey.export({
      format:
        "der",

      type:
        "spki",
    }) as Buffer;

  return {
    signingKeyId:
      createSigningKeyId(
        publicKeyDer,
      ),

    privateKeyPkcs8DerBase64:
      privateKeyDer.toString(
        "base64",
      ),

    publicKeySpkiDerBase64:
      publicKeyDer.toString(
        "base64",
      ),
  };
}

// ============================================================
// VALIDATE KEYPAIR
// ============================================================

export function validateFinoraControlCenterSigningMaterial(
  material:
    FinoraControlCenterSigningMaterial,
): boolean {

  try {

    const privateKey =
      createPrivateKey({
        key:
          Buffer.from(
            material.privateKeyPkcs8DerBase64,
            "base64",
          ),

        format:
          "der",

        type:
          "pkcs8",
      });

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

    const expectedPublicKey =
      Buffer.from(
        material.publicKeySpkiDerBase64,
        "base64",
      );

    if (
      !derivedPublicKey.equals(
        expectedPublicKey,
      )
    ) {
      return false;
    }

    return (
      createSigningKeyId(
        expectedPublicKey,
      ) ===
      material.signingKeyId
    );

  } catch {

    return false;
  }
}

// ============================================================
// SIGN
// ============================================================

export function signFinoraControlCenterCanonicalValue(
  canonicalValue:
    string,

  privateKeyPkcs8DerBase64:
    string,
): string {

  const privateKey =
    createPrivateKey({
      key:
        Buffer.from(
          privateKeyPkcs8DerBase64,
          "base64",
        ),

      format:
        "der",

      type:
        "pkcs8",
    });

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
    signature.byteLength !==
      64
  ) {
    throw new Error(
      "FINORA P-256 signature must contain exactly 64 IEEE-P1363 bytes.",
    );
  }

  return signature.toString(
    "base64",
  );
}

// ============================================================
// VERIFY - PRIVILEGED SELF TEST
// ============================================================

export function verifyFinoraControlCenterCanonicalSignature(
  canonicalValue:
    string,

  signatureBase64:
    string,

  publicKeySpkiDerBase64:
    string,
): boolean {

  const publicKey =
    createPublicKey({
      key:
        Buffer.from(
          publicKeySpkiDerBase64,
          "base64",
        ),

      format:
        "der",

      type:
        "spki",
    });

  const signature =
    Buffer.from(
      signatureBase64,
      "base64",
    );

  if (
    signature.byteLength !==
      64
  ) {
    return false;
  }

  return nodeVerify(
    "sha256",
    Buffer.from(
      canonicalValue,
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
}

// ============================================================
// END
// ============================================================