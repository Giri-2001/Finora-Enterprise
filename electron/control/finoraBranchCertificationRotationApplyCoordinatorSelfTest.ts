/* ============================================================
   FINORA ENTERPRISE OS
   BRANCH CERTIFICATION ROTATION APPLY COORDINATOR SELF-TEST

   Focus:
   - authenticated legacy migration payload handoff
   - post-CAS recovery envelope authority
   - durable Control Store before pending-key destruction
============================================================ */

import {
  applyFinoraBranchCertificationRotationAuthority,
} from "./finoraBranchCertificationRotationApplyCoordinator.js";

import type {
  FinoraBranchCertificationRotationApplyDependencies,
  FinoraBranchCertificationRotationApplyInput,
} from "./finoraBranchCertificationRotationApplyCoordinator.js";

function assert(
  condition:
    unknown,

  message:
    string,
): asserts condition {
  if (!condition) {
    throw new Error(
      message,
    );
  }
}

type Dependencies =
  FinoraBranchCertificationRotationApplyDependencies;

type VerifyInput =
  Parameters<
    Dependencies["verifyAuthority"]
  >[0];

type PortablePayload =
  Awaited<
    ReturnType<
      Dependencies["decryptPortableAuth"]
    >
  >;

type CertificationPublicKey =
  ReturnType<
    Dependencies["toCertificationPublicKey"]
  >;

type ControlStateInput =
  Parameters<
    Dependencies["applyControlState"]
  >[0];

type ControlStateResult =
  Awaited<
    ReturnType<
      Dependencies["applyControlState"]
    >
  >;

type DestroyInput =
  Parameters<
    Dependencies["destroyPending"]
  >[0];

type ReplaceExact =
  FinoraBranchCertificationRotationApplyInput[
    "portableStore"
  ][
    "replaceExact"
  ];

const OWNER_ID =
  "OWNER-000001";

const BUSINESS_ID =
  "BUSINESS-000001";

const BRANCH_ID =
  "BRANCH-000001-001";

const INSTALLATION_ID =
  "FINORA-INSTALLATION-P6-B3-SELFTEST";

const AUTH_STATE_ID =
  "FINORA-AUTH-STATE-P6-B3-SELFTEST";

const AUTH_GENERATION =
  7;

const REQUEST_ID =
  "FIN-BCR-REQ-P6-B3-SELFTEST";

const PACKAGE_ID =
  "FINORA-CC-PKG-P6-B3-SELFTEST";

const ISSUER_ID =
  "FINORA-SELFTEST-P6-B3-ISSUER";

const REPLACEMENT_KEY_ID =
  "FINORA-BRANCH-CERT-BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB";

const PORTABLE_FINGERPRINT =
  "a".repeat(
    64,
  );

const APPLIED_AT =
  "2026-09-21T12:00:00.000Z";

const PASSWORD =
  "P6-B3-selftest-password";

const SECURITY_CODE =
  "P6-B3-selftest-security-code";

function createPending():
  FinoraBranchCertificationRotationApplyInput[
    "pending"
  ] {
  return {
    requestId:
      REQUEST_ID,

    ownerId:
      OWNER_ID,

    businessId:
      BUSINESS_ID,

    branchId:
      BRANCH_ID,

    authStateId:
      AUTH_STATE_ID,

    authGeneration:
      AUTH_GENERATION,

    portableAuthFingerprint:
      PORTABLE_FINGERPRINT,

    replacementCertificationKeyMaterial: {
      keyId:
        REPLACEMENT_KEY_ID,
    },
  } as unknown as
    FinoraBranchCertificationRotationApplyInput[
      "pending"
    ];
}

function createPayload(
  postCasRecovery:
    boolean,
): PortablePayload {
  return {
    ownerId:
      OWNER_ID,

    businessId:
      BUSINESS_ID,

    branchId:
      BRANCH_ID,

    storageMode:
      "USB",

    authStateId:
      AUTH_STATE_ID,

    authGeneration:
      AUTH_GENERATION,

    sourceAuthorizationVerificationEvidence: {
      legacyNativeBoundMigrationEvidence: {},
    },

    ...(
      postCasRecovery
        ? {
            branchCertificationKeyMaterial: {
              keyId:
                REPLACEMENT_KEY_ID,
            },
          }
        : {}
    ),
  } as unknown as
    PortablePayload;
}

function createPublicKey():
  CertificationPublicKey {
  return {
    keyId:
      REPLACEMENT_KEY_ID,
  } as unknown as
    CertificationPublicKey;
}

function createVerificationSuccess():
  ReturnType<
    Dependencies["verifyAuthority"]
  > {
  return {
    success:
      true,

    data: {
      requestId:
        REQUEST_ID,

      packageId:
        PACKAGE_ID,

      sequence:
        1,

      replacementCertificationPublicKey:
        createPublicKey(),

      verifiedTrustedKey: {
        issuerId:
          ISSUER_ID,
      },
    },
  } as unknown as
    ReturnType<
      Dependencies["verifyAuthority"]
    >;
}

function createInput(
  currentPortableEnvelope:
    FinoraBranchCertificationRotationApplyInput[
      "currentPortableEnvelope"
    ],

  portableStore:
    FinoraBranchCertificationRotationApplyInput[
      "portableStore"
    ],
):
  FinoraBranchCertificationRotationApplyInput {
  return {
    signedPackage: {
      selfTest:
        true,
    },

    trustedKeys: [
      {
        selfTest:
          true,
      },
    ],

    expectedTarget: {
      ownerId:
        OWNER_ID,

      businessId:
        BUSINESS_ID,

      branchId:
        BRANCH_ID,

      installationId:
        INSTALLATION_ID,
    },

    pending:
      createPending(),

    currentPortableEnvelope,

    portableStore,

    storageMode:
      "USB",

    password:
      PASSWORD,

    securityCode:
      SECURITY_CODE,
  } as unknown as
    FinoraBranchCertificationRotationApplyInput;
}

async function runNormalLegacyPath():
  Promise<void> {
  const events:
    string[] =
    [];

  const currentEnvelope = {
    marker:
      "CURRENT",
  } as unknown as
    FinoraBranchCertificationRotationApplyInput[
      "currentPortableEnvelope"
    ];

  const replacementEnvelope = {
    marker:
      "REPLACEMENT",
  } as unknown as
    FinoraBranchCertificationRotationApplyInput[
      "currentPortableEnvelope"
    ];

  const payload =
    createPayload(
      false,
    );

  let verifyInput:
    VerifyInput |
    undefined;

  let controlStateInput:
    ControlStateInput |
    undefined;

  let destroyInput:
    DestroyInput |
    undefined;

  const replaceExact =
    (async (
      ...args:
        Parameters<
          ReplaceExact
        >
    ) => {
      events.push(
        "replaceExact",
      );

      assert(
        args[0] ===
          "USB",
        "Normal path CAS used wrong storage mode.",
      );

      assert(
        args[1] ===
          currentEnvelope,
        "Normal path CAS lost exact current envelope identity.",
      );

      assert(
        args[2] ===
          replacementEnvelope,
        "Normal path CAS did not receive exact replacement envelope.",
      );

      return "REPLACED";
    }) as
      ReplaceExact;

  const dependencies:
    Dependencies =
    {
      now:
        () =>
          new Date(
            APPLIED_AT,
          ),

      verifyAuthority:
        ((
          input:
            VerifyInput,
        ) => {
          verifyInput =
            input;

          return createVerificationSuccess();
        }) as
          Dependencies[
            "verifyAuthority"
          ],

      decryptPortableAuth:
        (async (
          ..._args:
            Parameters<
              Dependencies[
                "decryptPortableAuth"
              ]
            >
        ) =>
          payload) as
          Dependencies[
            "decryptPortableAuth"
          ],

      toCertificationPublicKey:
        ((
          ..._args:
            Parameters<
              Dependencies[
                "toCertificationPublicKey"
              ]
            >
        ) =>
          createPublicKey()) as
          Dependencies[
            "toCertificationPublicKey"
          ],

      reencryptPortableAuth:
        (async (
          input:
            Parameters<
              Dependencies[
                "reencryptPortableAuth"
              ]
            >[0],
        ) => {
          events.push(
            "reencrypt",
          );

          assert(
            input.currentEnvelope ===
              currentEnvelope,
            "Normal path re-encrypt lost exact current envelope.",
          );

          assert(
            input.branchCertificationKeyMaterial.keyId ===
              REPLACEMENT_KEY_ID,
            "Normal path re-encrypt used wrong replacement key.",
          );

          assert(
            input.updatedAt ===
              APPLIED_AT,
            "Normal path re-encrypt used wrong appliedAt timestamp.",
          );

          return replacementEnvelope;
        }) as
          Dependencies[
            "reencryptPortableAuth"
          ],

      applyControlState:
        (async (
          input:
            ControlStateInput,
        ) => {
          events.push(
            "applyControlState",
          );

          controlStateInput =
            input;

          return {
            success:
              true,

            data: {
              committed:
                true,

              updatedEnrollmentTransactions:
                1,
            },
          } as
            ControlStateResult;
        }) as
          Dependencies[
            "applyControlState"
          ],

      destroyPending:
        (async (
          input:
            DestroyInput,
        ) => {
          events.push(
            "destroyPending",
          );

          destroyInput =
            input;

          return true;
        }) as
          Dependencies[
            "destroyPending"
          ],
    };

  const result =
    await applyFinoraBranchCertificationRotationAuthority(
      createInput(
        currentEnvelope,
        {
          replaceExact,
        },
      ),
      dependencies,
    );

  if (!result.success) {
    throw new Error(
      `Normal legacy coordinator path failed: ${result.error}`,
    );
  }

  assert(
    events.join(
      ",",
    ) ===
      "reencrypt,replaceExact,applyControlState,destroyPending",
    `Normal path order is invalid: ${events.join(",")}`,
  );

  assert(
    verifyInput !==
      undefined,
    "Normal path verifier was not called.",
  );

  assert(
    !(
      "expectedPortableAuthFingerprintForRecovery" in
      verifyInput
    ),
    "Normal path incorrectly entered post-CAS verifier recovery mode.",
  );

  assert(
    controlStateInput !==
      undefined,
    "Normal path did not call durable Control Store authority.",
  );

  assert(
    controlStateInput.legacyEnrollmentRecovery !==
      undefined,
    "Normal legacy path omitted authenticated enrollment recovery evidence.",
  );

  assert(
    controlStateInput.legacyEnrollmentRecovery.portableEnvelope ===
      replacementEnvelope,
    "Normal legacy path did not hand the post-CAS replacement envelope to Control Store.",
  );

  assert(
    controlStateInput.legacyEnrollmentRecovery.payload ===
      payload,
    "Normal legacy path did not hand the authenticated current payload to Control Store.",
  );

  assert(
    destroyInput !==
      undefined &&
      destroyInput.requestId ===
        REQUEST_ID &&
      destroyInput.replacementCertificationKeyId ===
        REPLACEMENT_KEY_ID,
    "Normal path pending destruction lost exact protected custody identity.",
  );

  assert(
    result.data.pendingDestroyed ===
      true,
    "Normal path did not report pending custody destruction.",
  );

  console.log(
    "PASS: normal legacy rotation hands the post-CAS replacement envelope and authenticated payload to Control Store",
  );
}

async function runPostCasRecoveryPath():
  Promise<void> {
  const events:
    string[] =
    [];

  const currentReplacementEnvelope = {
    marker:
      "CURRENT-POST-CAS-REPLACEMENT",
  } as unknown as
    FinoraBranchCertificationRotationApplyInput[
      "currentPortableEnvelope"
    ];

  const payload =
    createPayload(
      true,
    );

  let verifyInput:
    VerifyInput |
    undefined;

  let controlStateInput:
    ControlStateInput |
    undefined;

  const dependencies:
    Dependencies =
    {
      now:
        () =>
          new Date(
            APPLIED_AT,
          ),

      verifyAuthority:
        ((
          input:
            VerifyInput,
        ) => {
          verifyInput =
            input;

          return createVerificationSuccess();
        }) as
          Dependencies[
            "verifyAuthority"
          ],

      decryptPortableAuth:
        (async (
          ..._args:
            Parameters<
              Dependencies[
                "decryptPortableAuth"
              ]
            >
        ) =>
          payload) as
          Dependencies[
            "decryptPortableAuth"
          ],

      toCertificationPublicKey:
        ((
          ..._args:
            Parameters<
              Dependencies[
                "toCertificationPublicKey"
              ]
            >
        ) =>
          createPublicKey()) as
          Dependencies[
            "toCertificationPublicKey"
          ],

      reencryptPortableAuth:
        (async () => {
          throw new Error(
            "Post-CAS recovery unexpectedly attempted Portable Auth re-encryption.",
          );
        }) as
          Dependencies[
            "reencryptPortableAuth"
          ],

      applyControlState:
        (async (
          input:
            ControlStateInput,
        ) => {
          events.push(
            "applyControlState",
          );

          controlStateInput =
            input;

          return {
            success:
              true,

            data: {
              committed:
                true,

              updatedEnrollmentTransactions:
                1,
            },
          } as
            ControlStateResult;
        }) as
          Dependencies[
            "applyControlState"
          ],

      destroyPending:
        (async () => {
          events.push(
            "destroyPending",
          );

          return true;
        }) as
          Dependencies[
            "destroyPending"
          ],
    };

  const replaceExact =
    (async () => {
      throw new Error(
        "Post-CAS recovery unexpectedly attempted Portable Auth CAS.",
      );
    }) as
      ReplaceExact;

  const result =
    await applyFinoraBranchCertificationRotationAuthority(
      createInput(
        currentReplacementEnvelope,
        {
          replaceExact,
        },
      ),
      dependencies,
    );

  if (!result.success) {
    throw new Error(
      `Post-CAS coordinator recovery failed: ${result.error}`,
    );
  }

  assert(
    events.join(
      ",",
    ) ===
      "applyControlState,destroyPending",
    `Post-CAS recovery order is invalid: ${events.join(",")}`,
  );

  assert(
    verifyInput !==
      undefined,
    "Post-CAS recovery verifier was not called.",
  );

  const recoveryVerifyInput =
    verifyInput as
      VerifyInput & {
        expectedPortableAuthFingerprintForRecovery?:
          string;
      };

  assert(
    recoveryVerifyInput.expectedPortableAuthFingerprintForRecovery ===
      PORTABLE_FINGERPRINT,
    "Post-CAS recovery did not verify against the pending pre-CAS Portable Auth fingerprint.",
  );

  assert(
    controlStateInput !==
      undefined &&
      controlStateInput.legacyEnrollmentRecovery !==
        undefined,
    "Post-CAS recovery omitted authenticated legacy enrollment recovery evidence.",
  );

  assert(
    controlStateInput.legacyEnrollmentRecovery.portableEnvelope ===
      currentReplacementEnvelope,
    "Post-CAS recovery did not hand the already-replaced current envelope to Control Store.",
  );

  assert(
    controlStateInput.legacyEnrollmentRecovery.payload ===
      payload,
    "Post-CAS recovery did not preserve the authenticated current payload.",
  );

  console.log(
    "PASS: post-CAS recovery skips re-encryption/CAS and resumes with the already-replaced authoritative envelope",
  );
}

async function runControlStateFailurePath():
  Promise<void> {
  const events:
    string[] =
    [];

  const currentEnvelope = {
    marker:
      "FAILURE-CURRENT",
  } as unknown as
    FinoraBranchCertificationRotationApplyInput[
      "currentPortableEnvelope"
    ];

  const replacementEnvelope = {
    marker:
      "FAILURE-REPLACEMENT",
  } as unknown as
    FinoraBranchCertificationRotationApplyInput[
      "currentPortableEnvelope"
    ];

  const payload =
    createPayload(
      false,
    );

  const replaceExact =
    (async (
      ..._args:
        Parameters<
          ReplaceExact
        >
    ) => {
      events.push(
        "replaceExact",
      );

      return "REPLACED";
    }) as
      ReplaceExact;

  const dependencies:
    Dependencies =
    {
      now:
        () =>
          new Date(
            APPLIED_AT,
          ),

      verifyAuthority:
        (() =>
          createVerificationSuccess()) as
          Dependencies[
            "verifyAuthority"
          ],

      decryptPortableAuth:
        (async (
          ..._args:
            Parameters<
              Dependencies[
                "decryptPortableAuth"
              ]
            >
        ) =>
          payload) as
          Dependencies[
            "decryptPortableAuth"
          ],

      toCertificationPublicKey:
        (() =>
          createPublicKey()) as
          Dependencies[
            "toCertificationPublicKey"
          ],

      reencryptPortableAuth:
        (async () => {
          events.push(
            "reencrypt",
          );

          return replacementEnvelope;
        }) as
          Dependencies[
            "reencryptPortableAuth"
          ],

      applyControlState:
        (async () => {
          events.push(
            "applyControlState",
          );

          return {
            success:
              false,

            error:
              "SELFTEST_CONTROL_STATE_FAILURE",
          } as
            ControlStateResult;
        }) as
          Dependencies[
            "applyControlState"
          ],

      destroyPending:
        (async () => {
          events.push(
            "destroyPending",
          );

          return true;
        }) as
          Dependencies[
            "destroyPending"
          ],
    };

  const result =
    await applyFinoraBranchCertificationRotationAuthority(
      createInput(
        currentEnvelope,
        {
          replaceExact,
        },
      ),
      dependencies,
    );

  assert(
    !result.success,
    "Control Store failure path unexpectedly succeeded.",
  );

  assert(
    result.error ===
      "SELFTEST_CONTROL_STATE_FAILURE",
    `Control Store failure path returned unexpected error: ${result.error}`,
  );

  assert(
    events.join(
      ",",
    ) ===
      "reencrypt,replaceExact,applyControlState",
    `Pending custody was destroyed before durable Control Store success: ${events.join(",")}`,
  );

  console.log(
    "PASS: Control Store failure after Portable Auth CAS retains pending private-key custody for crash recovery",
  );
}

async function run():
  Promise<void> {
  await runNormalLegacyPath();

  await runPostCasRecoveryPath();

  await runControlStateFailurePath();

  console.log(
    "PASS: pending private-key custody destruction occurs only after durable Control Store success",
  );

  console.log(
    "PASS: P6-B3 APPLY COORDINATOR LEGACY RECOVERY EXECUTABLE PROOF",
  );
}

void run()
  .then(
    () => {
      setTimeout(
        () =>
          process.exit(
            0,
          ),
        50,
      );
    },
  )
  .catch(
  (
    error:
      unknown,
  ) => {
    console.error(
      "SELF-TEST FAILED",
    );

    console.error(
      error instanceof Error
        ? error.stack ??
          error.message
        : String(
            error,
          ),
    );

    setTimeout(
      () =>
        process.exit(
          1,
        ),
      50,
    );
  },
);