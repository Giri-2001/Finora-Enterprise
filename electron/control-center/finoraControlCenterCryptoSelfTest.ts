// ============================================================
// FINORA ENTERPRISE OS™
//
// CONTROL CENTER CRYPTO SELF TEST
//
// Pure Node self-test.
// Does NOT access production Electron safeStorage or key vault.
// ============================================================

import {
  canonicalizeFinoraControlCenterValue,
  createFinoraControlCenterPayloadDigest,
} from "./finoraControlCenterCanonicalization.js";

import {
  generateFinoraControlCenterSigningMaterial,
  signFinoraControlCenterCanonicalValue,
  validateFinoraControlCenterSigningMaterial,
  verifyFinoraControlCenterCanonicalSignature,
} from "./finoraControlCenterCrypto.js";

// ============================================================
// CANONICALIZATION VECTOR
// ============================================================

const canonicalVector =
  canonicalizeFinoraControlCenterValue({
    z:
      3,

    a: {
      y:
        2,

      x:
        1,
    },

    list: [
      3,
      2,
      1,
    ],
  });

const expectedCanonicalVector =
  '{"a":{"x":1,"y":2},"list":[3,2,1],"z":3}';

if (
  canonicalVector !==
    expectedCanonicalVector
) {
  throw new Error(
    "FINORA canonicalization self-test failed.",
  );
}

// ============================================================
// KEYPAIR
// ============================================================

const material =
  generateFinoraControlCenterSigningMaterial();

if (
  !validateFinoraControlCenterSigningMaterial(
    material,
  )
) {
  throw new Error(
    "FINORA signing material self-test failed.",
  );
}

// ============================================================
// PACKAGE
// ============================================================

const payload = {
  branchId:
    "BR1",

  amount:
    1000,

  source:
    "SELF_TEST",
};

const unsignedPackage = {
  packageId:
    "FINORA-SELFTEST-1",

  purpose:
    "WALLET_RECHARGE",

  issuer: {
    type:
      "FINORA_CONTROL_CENTER",

    issuerId:
      "FINORA-SELFTEST-CONTROL-CENTER",

    signingKeyId:
      material.signingKeyId,
  },

  target: {
    ownerId:
      "OWNER-SELFTEST",

    businessId:
      "BUSINESS-SELFTEST",

    branchId:
      "BR1",

    installationId:
      "INSTALLATION-SELFTEST",
  },

  issuedAt:
    "2026-09-05T00:00:00.000Z",

  sequence:
    1,

  payloadVersion:
    1,

  payload,

  payloadDigest:
    createFinoraControlCenterPayloadDigest(
      payload,
    ),

  schemaVersion:
    1,
};

const canonicalPackage =
  canonicalizeFinoraControlCenterValue(
    unsignedPackage,
  );

const signature =
  signFinoraControlCenterCanonicalValue(
    canonicalPackage,
    material.privateKeyPkcs8DerBase64,
  );

const verified =
  verifyFinoraControlCenterCanonicalSignature(
    canonicalPackage,
    signature,
    material.publicKeySpkiDerBase64,
  );

if (!verified) {
  throw new Error(
    "FINORA sign -> verify self-test failed.",
  );
}

// ============================================================
// TAMPER TEST
// ============================================================

const tamperedCanonicalPackage =
  canonicalizeFinoraControlCenterValue({
    ...unsignedPackage,

    payload: {
      ...payload,

      amount:
        9999,
    },
  });

const tamperedVerified =
  verifyFinoraControlCenterCanonicalSignature(
    tamperedCanonicalPackage,
    signature,
    material.publicKeySpkiDerBase64,
  );

if (tamperedVerified) {
  throw new Error(
    "FINORA tamper rejection self-test failed.",
  );
}

console.log(
  "PASS: FINORA canonicalization deterministic",
);

console.log(
  "PASS: FINORA ECDSA P-256 keypair valid",
);

console.log(
  "PASS: FINORA IEEE-P1363 sign -> verify",
);

console.log(
  "PASS: FINORA tampered package rejected",
);

// ============================================================
// END
// ============================================================