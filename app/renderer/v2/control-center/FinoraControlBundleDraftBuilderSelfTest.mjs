// ============================================================
// FINORA ENTERPRISE OS™
//
// CONTROL CENTER
// CONTROL BUNDLE DRAFT BUILDER SELF-TEST
//
// RESPONSIBILITY:
//
// - Prove valid one-child and five-child bundle composition
// - Prove signed child identity/order/reference preservation
// - Prove renderer creates no outer envelope authority
// - Prove nested/unsupported/duplicate/mismatched inputs reject
//
// IMPORTANT:
//
// - TEST ONLY.
// - No Electron.
// - No IPC.
// - No filesystem mutation.
// - No signing.
// - No private keys.
// ============================================================

import {
  FINORA_CONTROL_BUNDLE_FORMAT,
  buildFinoraControlBundleIssuanceRequest,
} from "./FinoraControlBundleDraftBuilder.ts";

// ============================================================
// FIXED TEST IDENTITY
// ============================================================

const OWNER_ID =
  "OWNER-CONTROL-BUNDLE-TEST";

const BUSINESS_ID =
  "BUSINESS-CONTROL-BUNDLE-TEST";

const BRANCH_ID =
  "BRANCH-CONTROL-BUNDLE-TEST";

const INSTALLATION_ID =
  "INSTALLATION-CONTROL-BUNDLE-TEST";

const PUBLIC_KEY_FINGERPRINT =
  "a".repeat(
    64,
  );

const BINDING_KEY_ID =
  `FINORA-BINDING-${PUBLIC_KEY_FINGERPRINT
    .slice(
      0,
      32,
    )
    .toUpperCase()}`;

const SIGNING_KEY_ID =
  "FINORA-CONTROL-CENTER-TEST-KEY";

const ISSUED_AT =
  "2026-09-07T00:00:00.000Z";

const TARGET = {
  ownerId:
    OWNER_ID,

  businessId:
    BUSINESS_ID,

  branchId:
    BRANCH_ID,

  installationId:
    INSTALLATION_ID,

  bindingKeyId:
    BINDING_KEY_ID,

  fingerprintAlgorithm:
    "SHA-256",

  publicKeyFingerprint:
    PUBLIC_KEY_FINGERPRINT,
};

// ============================================================
// ASSERTIONS
// ============================================================

function assert(
  condition,
  message,
) {

  if (!condition) {
    throw new Error(
      message,
    );
  }
}

function hasOwn(
  value,
  key,
) {

  return Object.prototype.hasOwnProperty.call(
    value,
    key,
  );
}

function expectThrow(
  operation,
  expectedMessage,
  label,
) {

  let thrown =
    null;

  try {
    operation();
  } catch (error) {
    thrown =
      error;
  }

  assert(
    thrown instanceof Error,
    `${label}: expected rejection was not produced.`,
  );

  assert(
    thrown.message.includes(
      expectedMessage,
    ),
    `${label}: unexpected rejection message: ${thrown.message}`,
  );
}

function assertNoOuterEnvelopeAuthority(
  request,
  label,
) {

  for (
    const field of
      [
        "packageId",
        "sequence",
        "issuedAt",
        "packageValidity",
      ]
  ) {
    assert(
      !hasOwn(
        request,
        field,
      ),
      `${label}: renderer created outer ${field} authority.`,
    );
  }

  assert(
    !hasOwn(
      request.payload,
      "issuedAt",
    ),
    `${label}: renderer created root payload.issuedAt authority.`,
  );
}

function assertTarget(
  target,
  label,
) {

  assert(
    target.ownerId ===
      OWNER_ID,
    `${label}: ownerId changed.`,
  );

  assert(
    target.businessId ===
      BUSINESS_ID,
    `${label}: businessId changed.`,
  );

  assert(
    target.branchId ===
      BRANCH_ID,
    `${label}: branchId changed.`,
  );

  assert(
    target.installationId ===
      INSTALLATION_ID,
    `${label}: installationId changed.`,
  );

  assert(
    target.bindingKeyId ===
      BINDING_KEY_ID,
    `${label}: bindingKeyId changed.`,
  );

  assert(
    target.fingerprintAlgorithm ===
      "SHA-256",
    `${label}: fingerprint algorithm changed.`,
  );

  assert(
    target.publicKeyFingerprint ===
      PUBLIC_KEY_FINGERPRINT,
    `${label}: public-key fingerprint changed.`,
  );
}

// ============================================================
// SIGNED CHILD FACTORY
// ============================================================

function createSignedChild(
  purpose,
  packageId,
  sequence,
  target = TARGET,
) {

  return {
    packageId,

    purpose,

    issuer: {
      type:
        "FINORA_CONTROL_CENTER",

      issuerId:
        "FINORA-CONTROL-CENTER-TEST",

      signingKeyId:
        SIGNING_KEY_ID,
    },

    target: {
      ...target,
    },

    issuedAt:
      ISSUED_AT,

    sequence,

    payloadVersion:
      1,

    payload: {
      testPurpose:
        purpose,

      schemaVersion:
        1,
    },

    payloadDigest: {
      algorithm:
        "SHA-256",

      value:
        "b".repeat(
          64,
        ),
    },

    signature: {
      algorithm:
        "ECDSA_P256_SHA256",

      encoding:
        "IEEE_P1363",

      canonicalization:
        "FINORA_CANONICAL_JSON_V1",

      signingKeyId:
        SIGNING_KEY_ID,

      value:
        "TEST-SIGNATURE",
    },

    schemaVersion:
      1,
  };
}

// ============================================================
// VALID FIVE-PACKAGE BUNDLE
// ============================================================

const children = [
  createSignedChild(
    "BRANCH_ACTIVATION",
    "PKG-BRANCH-1",
    1,
  ),

  createSignedChild(
    "STORAGE_ENTITLEMENT",
    "PKG-STORAGE-1",
    1,
  ),

  createSignedChild(
    "BUSINESS_PROFILE",
    "PKG-BUSINESS-1",
    1,
  ),

  createSignedChild(
    "PRICING_POLICY",
    "PKG-PRICING-1",
    1,
  ),

  createSignedChild(
    "WALLET_RECHARGE",
    "PKG-WALLET-1",
    1,
  ),
];

const fullBundleRequest =
  buildFinoraControlBundleIssuanceRequest({
    target:
      TARGET,

    packages:
      children,
  });

assertNoOuterEnvelopeAuthority(
  fullBundleRequest,
  "FIVE CHILD BUNDLE",
);

assertTarget(
  fullBundleRequest.target,
  "FIVE CHILD BUNDLE",
);

assert(
  fullBundleRequest.payload.bundleFormat ===
    FINORA_CONTROL_BUNDLE_FORMAT,
  "FIVE CHILD BUNDLE: bundle format changed.",
);

assert(
  fullBundleRequest.payload.schemaVersion ===
    1,
  "FIVE CHILD BUNDLE: schema version changed.",
);

assert(
  Array.isArray(
    fullBundleRequest.payload.packages,
  ),
  "FIVE CHILD BUNDLE: packages is not an array.",
);

assert(
  fullBundleRequest.payload.packages.length ===
    5,
  "FIVE CHILD BUNDLE: child count changed.",
);

for (
  let index =
    0;
  index <
    children.length;
  index +=
    1
) {
  assert(
    fullBundleRequest.payload.packages[index] ===
      children[index],
    `FIVE CHILD BUNDLE: signed child ${index} was cloned, rewritten or reordered.`,
  );
}

console.log(
  "PASS: five signed child packages preserve identity, order and object references",
);

// ============================================================
// VALID ONE-PACKAGE BUNDLE
// ============================================================

const singleChild =
  createSignedChild(
    "BUSINESS_PROFILE",
    "PKG-SINGLE-BUSINESS",
    7,
  );

const singleBundleRequest =
  buildFinoraControlBundleIssuanceRequest({
    target:
      TARGET,

    packages: [
      singleChild,
    ],
  });

assertNoOuterEnvelopeAuthority(
  singleBundleRequest,
  "SINGLE CHILD BUNDLE",
);

assert(
  singleBundleRequest.payload.packages.length ===
    1 &&
  singleBundleRequest.payload.packages[0] ===
    singleChild,
  "SINGLE CHILD BUNDLE: valid single signed child was not preserved.",
);

console.log(
  "PASS: one signed child package accepted",
);

// ============================================================
// EMPTY BUNDLE REJECTION
// ============================================================

expectThrow(
  () =>
    buildFinoraControlBundleIssuanceRequest({
      target:
        TARGET,

      packages:
        [],
    }),
  "at least one signed child package",
  "EMPTY BUNDLE",
);

console.log(
  "PASS: empty bundle rejected",
);

// ============================================================
// MAXIMUM CHILD COUNT REJECTION
// ============================================================

expectThrow(
  () =>
    buildFinoraControlBundleIssuanceRequest({
      target:
        TARGET,

      packages: [
        ...children,

        createSignedChild(
          "BRANCH_ACTIVATION",
          "PKG-SIXTH",
          2,
        ),
      ],
    }),
  "at most five signed child packages",
  "SIX CHILD BUNDLE",
);

console.log(
  "PASS: more than five child packages rejected",
);

// ============================================================
// NESTED BUNDLE REJECTION
// ============================================================

expectThrow(
  () =>
    buildFinoraControlBundleIssuanceRequest({
      target:
        TARGET,

      packages: [
        createSignedChild(
          "CONTROL_BUNDLE",
          "PKG-NESTED-BUNDLE",
          1,
        ),
      ],
    }),
  "Nested FINORA CONTROL_BUNDLE packages are not supported.",
  "NESTED BUNDLE",
);

console.log(
  "PASS: nested CONTROL_BUNDLE rejected",
);

// ============================================================
// UNSUPPORTED PURPOSE REJECTION
// ============================================================

expectThrow(
  () =>
    buildFinoraControlBundleIssuanceRequest({
      target:
        TARGET,

      packages: [
        createSignedChild(
          "UNSUPPORTED_PURPOSE",
          "PKG-UNSUPPORTED",
          1,
        ),
      ],
    }),
  "unsupported child package purpose",
  "UNSUPPORTED PURPOSE",
);

console.log(
  "PASS: unsupported child purpose rejected",
);

// ============================================================
// TARGET MISMATCH REJECTION
// ============================================================

expectThrow(
  () =>
    buildFinoraControlBundleIssuanceRequest({
      target:
        TARGET,

      packages: [
        createSignedChild(
          "BRANCH_ACTIVATION",
          "PKG-TARGET-MISMATCH",
          1,
          {
            ...TARGET,

            branchId:
              "BRANCH-OTHER",
          },
        ),
      ],
    }),
  "target does not match the outer package target",
  "TARGET MISMATCH",
);

console.log(
  "PASS: child target mismatch rejected",
);

// ============================================================
// DUPLICATE PACKAGE ID REJECTION
// ============================================================

expectThrow(
  () =>
    buildFinoraControlBundleIssuanceRequest({
      target:
        TARGET,

      packages: [
        createSignedChild(
          "BRANCH_ACTIVATION",
          "PKG-DUPLICATE-ID",
          1,
        ),

        createSignedChild(
          "STORAGE_ENTITLEMENT",
          "PKG-DUPLICATE-ID",
          1,
        ),
      ],
    }),
  "duplicate child package ID",
  "DUPLICATE PACKAGE ID",
);

console.log(
  "PASS: duplicate child package ID rejected",
);

// ============================================================
// DUPLICATE PURPOSE REJECTION
// ============================================================

expectThrow(
  () =>
    buildFinoraControlBundleIssuanceRequest({
      target:
        TARGET,

      packages: [
        createSignedChild(
          "BUSINESS_PROFILE",
          "PKG-BUSINESS-A",
          1,
        ),

        createSignedChild(
          "BUSINESS_PROFILE",
          "PKG-BUSINESS-B",
          2,
        ),
      ],
    }),
  "only one child package per purpose",
  "DUPLICATE PURPOSE",
);

console.log(
  "PASS: duplicate child purpose rejected",
);

// ============================================================
// INVALID SIGNED CHILD STRUCTURE
// ============================================================

const invalidSignedChild =
  createSignedChild(
    "PRICING_POLICY",
    "PKG-INVALID-SIGNATURE-METADATA",
    1,
  );

invalidSignedChild.signature =
  {
    ...invalidSignedChild.signature,

    signingKeyId:
      "DIFFERENT-SIGNING-KEY",
  };

expectThrow(
  () =>
    buildFinoraControlBundleIssuanceRequest({
      target:
        TARGET,

      packages: [
        invalidSignedChild,
      ],
    }),
  "invalid signed child package",
  "INVALID SIGNED CHILD",
);

console.log(
  "PASS: invalid signed child structure rejected",
);

// ============================================================
// INVALID OUTER BINDING IDENTITY
// ============================================================

expectThrow(
  () =>
    buildFinoraControlBundleIssuanceRequest({
      target: {
        ...TARGET,

        bindingKeyId:
          "FINORA-BINDING-INVALID",
      },

      packages: [
        singleChild,
      ],
    }),
  "valid FINORA Control Bundle target and native binding identity",
  "INVALID OUTER BINDING",
);

console.log(
  "PASS: invalid outer native binding identity rejected",
);

// ============================================================
// COMPLETE
// ============================================================

console.log(
  "============================================================",
);

console.log(
  "PASS: FINORA CONTROL_BUNDLE DRAFT BUILDER SELFTEST",
);

console.log(
  "============================================================",
);

// ============================================================
// END
// ============================================================