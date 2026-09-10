/* ===========================================================
   FINORA ENTERPRISE OS™

   CONTROL CENTER
   SIGNED BRANCH ACCESS LIFECYCLE ISSUER SELF TEST

   PURPOSE:

   - Exercise the real privileged BRANCH_ACCESS issuer
   - Exercise the real Control Center signing-key vault
   - Exercise real ECDSA P-256 signing
   - Independently verify every produced signature
   - Prove signed ISSUE / RENEW / REPLACE
   - Prove signed SUSPEND / RESUME / REVOKE
   - Prove action / administrative-status mismatch rejection
   - Prove credential enrollment is ISSUE-only
   - Prove credential authorization contains metadata only

   ISOLATION:

   - Electron userData is redirected to a temporary directory
     before app readiness.
   - Production Control Center key-vault data is never touched.
=========================================================== */

import {
  app,
} from "electron";

import {
  mkdtemp,
  rm,
} from "node:fs/promises";

import {
  tmpdir,
} from "node:os";

import {
  join,
} from "node:path";

import {
  canonicalizeFinoraControlCenterValue,
} from "./finoraControlCenterCanonicalization.js";

import {
  verifyFinoraControlCenterCanonicalSignature,
} from "./finoraControlCenterCrypto.js";

import {
  getFinoraControlCenterPublicIdentity,
} from "./finoraControlCenterKeyVault.js";

import {
  signFinoraBranchAccessPackage,
} from "./finoraBranchAccessIssuer.js";

import {
  FINORA_BRANCH_ACCESS_CREDENTIAL_ENROLLMENT_METHOD,
} from "../control/finoraBranchAccessPackage.types.js";

import type {
  FinoraBranchAccessAction,
  FinoraBranchAccessAdministrativeStatus,
  FinoraBranchAccessGrantPayload,
  FinoraBranchAccessPackageTarget,
  FinoraBranchAccessPayloadV1,
  FinoraBranchCredentialEnrollmentAuthorization,
} from "../control/finoraBranchAccessPackage.types.js";

/* ============================================================
   FIXED TEST AUTHORITY
============================================================ */

const OWNER_ID =
  "OWNER-BRANCH-ACCESS-SIGNED-LIFECYCLE-TEST";

const BUSINESS_ID =
  "BUSINESS-BRANCH-ACCESS-SIGNED-LIFECYCLE-TEST";

const BRANCH_ID =
  "BRANCH-BRANCH-ACCESS-SIGNED-LIFECYCLE-TEST";

const USER_ID =
  "USER-BRANCH-ACCESS-SIGNED-LIFECYCLE-TEST";

const INSTALLATION_ID =
  "INSTALLATION-BRANCH-ACCESS-SIGNED-LIFECYCLE-TEST";

const BINDING_KEY_ID =
  "FINORA-BINDING-0123456789ABCDEF0123456789ABCDEF";

const PUBLIC_KEY_FINGERPRINT =
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

const ISSUED_AT =
  "2026-09-06T06:00:00.000Z";

const VALID_FROM =
  "2026-01-01T00:00:00.000Z";

const VALID_UNTIL =
  "2027-01-01T00:00:00.000Z";

const TARGET:
  FinoraBranchAccessPackageTarget = {

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

/* ============================================================
   ASSERTIONS
============================================================ */

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

async function expectRejected(
  label:
    string,

  operation:
    () => Promise<unknown>,

  expectedFragment:
    string,
): Promise<void> {

  let rejected =
    false;

  try {
    await operation();

  } catch (
    error
  ) {

    rejected =
      error instanceof Error &&
      error.message.includes(
        expectedFragment,
      );
  }

  assert(
    rejected,
    `${label}: expected rejection containing "${expectedFragment}".`,
  );

  console.log(
    `PASS: ${label}`,
  );
}

/* ============================================================
   ACTION -> TARGET ADMIN STATUS
============================================================ */

function administrativeStatusForAction(
  action:
    FinoraBranchAccessAction,
): FinoraBranchAccessAdministrativeStatus {

  switch (action) {

    case "SUSPEND":
      return "SUSPENDED";

    case "REVOKE":
      return "REVOKED";

    case "ISSUE":
    case "RENEW":
    case "REPLACE":
    case "RESUME":
      return "ACTIVE";
  }
}

/* ============================================================
   ACCESS GRANT
============================================================ */

function createRegisteredGrant(
  action:
    FinoraBranchAccessAction,

  administrativeStatus =
    administrativeStatusForAction(
      action,
    ),
): FinoraBranchAccessGrantPayload {

  return {
    grantId:
      "GRANT-BRANCH-ACCESS-SIGNED-LIFECYCLE-TEST",

    userId:
      USER_ID,

    ownerId:
      OWNER_ID,

    businessId:
      BUSINESS_ID,

    branchId:
      BRANCH_ID,

    storageMode:
      "LOCAL",

    accessType:
      "REGISTERED",

    administrativeStatus,

    validity: {
      validFrom:
        VALID_FROM,

      validUntil:
        VALID_UNTIL,
    },

    registrationPayment: {
      amount:
        2000,

      currency:
        "INR",

      paymentMode:
        "CASH",

      paidAt:
        VALID_FROM,

      remarks:
        "FINORA BRANCH_ACCESS signed lifecycle issuer self-test.",

      refundable:
        false,
    },

    registrationCycle:
      action === "RENEW"
        ? 2
        : 1,

    createdAt:
      VALID_FROM,

    updatedAt:
      ISSUED_AT,

    schemaVersion:
      1,
  };
}

/* ============================================================
   CREDENTIAL ENROLLMENT AUTHORIZATION
============================================================ */

function createCredentialEnrollment():
  FinoraBranchCredentialEnrollmentAuthorization {

  return {
    authorizationId:
      "FINORA-CREDENTIAL-ENROLLMENT-BRANCH-ACCESS-SIGNED-LIFECYCLE-TEST",

    userId:
      USER_ID,

    username:
      "branch.admin",

    fullName:
      "Branch Administrator",

    role:
      "ADMIN",

    ownerId:
      OWNER_ID,

    businessId:
      BUSINESS_ID,

    branchId:
      BRANCH_ID,

    storageMode:
      "LOCAL",

    dataContext:
      "REAL",

    method:
      FINORA_BRANCH_ACCESS_CREDENTIAL_ENROLLMENT_METHOD,

    oneTime:
      true,

    schemaVersion:
      1,
  };
}

/* ============================================================
   PAYLOAD
============================================================ */

function createPayload(
  action:
    FinoraBranchAccessAction,

  options?: {
    administrativeStatus?:
      FinoraBranchAccessAdministrativeStatus;

    credentialEnrollment?:
      FinoraBranchCredentialEnrollmentAuthorization;
  },
): FinoraBranchAccessPayloadV1 {

  return {
    action,

    accessGrant:
      createRegisteredGrant(
        action,
        options?.administrativeStatus,
      ),

    ...(
      options?.credentialEnrollment ===
        undefined
        ? {}
        : {
            credentialEnrollment:
              options.credentialEnrollment,
          }
    ),

    issuedAt:
      ISSUED_AT,

    schemaVersion:
      1,
  };
}

/* ============================================================
   SIGN + INDEPENDENT VERIFY
============================================================ */

async function signAndVerify(
  action:
    FinoraBranchAccessAction,

  sequence:
    number,
): Promise<{
  issuerId: string;
  signingKeyId: string;
}> {

  const signedPackage =
    await signFinoraBranchAccessPackage({
      packageId:
        `PACKAGE-BRANCH-ACCESS-${action}-${sequence}`,

      sequence,

      issuedAt:
        ISSUED_AT,

      target:
        TARGET,

      payload:
        createPayload(
          action,
        ),
    });

  assert(
    signedPackage.purpose ===
      "BRANCH_ACCESS",
    `${action}: signed package purpose is invalid.`,
  );

  assert(
    signedPackage.signature.algorithm ===
      "ECDSA_P256_SHA256",
    `${action}: signature algorithm is invalid.`,
  );

  assert(
    signedPackage.signature.encoding ===
      "IEEE_P1363",
    `${action}: signature encoding is invalid.`,
  );

  assert(
    signedPackage.signature.canonicalization ===
      "FINORA_CANONICAL_JSON_V1",
    `${action}: canonicalization is invalid.`,
  );

  const payload =
    signedPackage.payload as
      Record<string, unknown>;

  assert(
    payload.action ===
      action,
    `${action}: signed payload action changed.`,
  );

  const accessGrant =
    payload.accessGrant as
      Record<string, unknown>;

  assert(
    accessGrant.administrativeStatus ===
      administrativeStatusForAction(
        action,
      ),
    `${action}: signed administrative status changed.`,
  );

  const publicIdentity =
    await getFinoraControlCenterPublicIdentity();

  assert(
    signedPackage.issuer.issuerId ===
      publicIdentity.issuerId,
    `${action}: issuer identity mismatch.`,
  );

  assert(
    signedPackage.issuer.signingKeyId ===
      publicIdentity.signingKeyId,
    `${action}: issuer signing-key mismatch.`,
  );

  assert(
    signedPackage.signature.signingKeyId ===
      publicIdentity.signingKeyId,
    `${action}: signature signing-key mismatch.`,
  );

  const {
    signature,
    ...unsignedPackage
  } =
    signedPackage;

  const canonicalPackage =
    canonicalizeFinoraControlCenterValue(
      unsignedPackage,
    );

  const verified =
    verifyFinoraControlCenterCanonicalSignature(
      canonicalPackage,
      signature.value,
      publicIdentity.publicKeySpkiDerBase64,
    );

  assert(
    verified,
    `${action}: independent public-key signature verification failed.`,
  );

  console.log(
    `PASS: real Control Center BRANCH_ACCESS ${action} signed and independently verified`,
  );

  return {
    issuerId:
      publicIdentity.issuerId,

    signingKeyId:
      publicIdentity.signingKeyId,
  };
}

/* ============================================================
   SELF TEST
============================================================ */

async function runFinoraBranchAccessSignedLifecycleIssuerSelfTest():
  Promise<void> {

  let temporaryUserData:
    string |
    undefined;

  let failure:
    unknown;

  try {

    assert(
      !app.isReady(),
      "Self-test must redirect Electron userData before app readiness.",
    );

    temporaryUserData =
      await mkdtemp(
        join(
          tmpdir(),
          "finora-branch-access-signed-lifecycle-",
        ),
      );

    app.setPath(
      "userData",
      temporaryUserData,
    );

    console.log(
      "PASS: isolated Electron userData configured",
    );

    await app.whenReady();

    const actions:
      FinoraBranchAccessAction[] = [
        "ISSUE",
        "RENEW",
        "REPLACE",
        "SUSPEND",
        "RESUME",
        "REVOKE",
      ];

    const identities:
      {
        issuerId: string;
        signingKeyId: string;
      }[] = [];

    let sequence =
      0;

    for (const action of actions) {

      sequence +=
        1;

      identities.push(
        await signAndVerify(
          action,
          sequence,
        ),
      );
    }

    assert(
      new Set(
        identities.map(
          (
            identity,
          ) =>
            identity.issuerId,
        ),
      ).size ===
        1,
      "Lifecycle packages did not use one isolated Control Center issuer.",
    );

    assert(
      new Set(
        identities.map(
          (
            identity,
          ) =>
            identity.signingKeyId,
        ),
      ).size ===
        1,
      "Lifecycle packages did not use one isolated Control Center signing key.",
    );

    console.log(
      "PASS: all six BRANCH_ACCESS lifecycle actions used one isolated signing identity",
    );

    // --------------------------------------------------------
    // ACTION / STATUS MISMATCH MUST FAIL CLOSED
    // --------------------------------------------------------

    await expectRejected(
      "SUSPEND with ACTIVE administrative status rejected",
      async () => {

        await signFinoraBranchAccessPackage({
          packageId:
            "PACKAGE-BRANCH-ACCESS-STATUS-MISMATCH",

          sequence:
            7,

          issuedAt:
            ISSUED_AT,

          target:
            TARGET,

          payload:
            createPayload(
              "SUSPEND",
              {
                administrativeStatus:
                  "ACTIVE",
              },
            ),
        });
      },
      "action does not match the target administrative status",
    );

    // --------------------------------------------------------
    // VALID ISSUE CREDENTIAL ENROLLMENT AUTHORIZATION
    // --------------------------------------------------------

    const credentialEnrollment =
      createCredentialEnrollment();

    const credentialPackage =
      await signFinoraBranchAccessPackage({
        packageId:
          "PACKAGE-BRANCH-ACCESS-CREDENTIAL-ISSUE",

        sequence:
          8,

        issuedAt:
          ISSUED_AT,

        target:
          TARGET,

        payload:
          createPayload(
            "ISSUE",
            {
              credentialEnrollment,
            },
          ),
      });

    const credentialPayload =
      credentialPackage.payload as
        Record<string, unknown>;

    const signedCredentialEnrollment =
      credentialPayload.credentialEnrollment as
        Record<string, unknown>;

    assert(
      signedCredentialEnrollment.method ===
        "SET_PASSWORD_ON_RECIPIENT",
      "Credential enrollment method changed during signing.",
    );

    assert(
      signedCredentialEnrollment.oneTime ===
        true,
      "Credential enrollment one-time authority changed during signing.",
    );

    assert(
      signedCredentialEnrollment.role ===
        "ADMIN",
      "Credential enrollment role changed during signing.",
    );

    const forbiddenCredentialSecretField =
      Object.keys(
        signedCredentialEnrollment,
      ).find(
        (
          key,
        ) =>
          /^(password|passwordHash|hash|salt|privateKey)$/i.test(
            key,
          ),
      );

    assert(
      forbiddenCredentialSecretField ===
        undefined,
      `Credential enrollment package leaked forbidden credential-secret field "${forbiddenCredentialSecretField ?? "<none>"}".`,
    );
    console.log(
      "PASS: ISSUE credential enrollment contains authorization metadata only",
    );

    // --------------------------------------------------------
    // CREDENTIAL ENROLLMENT ON NON-ISSUE MUST FAIL
    // --------------------------------------------------------

    await expectRejected(
      "credential enrollment on RENEW rejected",
      async () => {

        await signFinoraBranchAccessPackage({
          packageId:
            "PACKAGE-BRANCH-ACCESS-CREDENTIAL-RENEW",

          sequence:
            9,

          issuedAt:
            ISSUED_AT,

          target:
            TARGET,

          payload:
            createPayload(
              "RENEW",
              {
                credentialEnrollment,
              },
            ),
        });
      },
      "permitted only with the signed ISSUE action",
    );

    console.log(
      "PASS: FINORA SIGNED BRANCH ACCESS LIFECYCLE ISSUER SELFTEST",
    );

  } catch (
    error
  ) {

    failure =
      error;

  } finally {

    if (
      temporaryUserData !==
        undefined
    ) {

      try {

        await rm(
          temporaryUserData,
          {
            recursive:
              true,

            force:
              true,
          },
        );

        console.log(
          "PASS: isolated temporary FINORA userData deleted",
        );

      } catch (
        cleanupError
      ) {

        if (!failure) {
          failure =
            cleanupError;
        }
      }
    }

  }

  if (failure) {
    throw failure;
  }
}

void runFinoraBranchAccessSignedLifecycleIssuerSelfTest()
  .then(
    () => {

      console.log(
        "PASS: BRANCH_ACCESS lifecycle self-test process exiting with code 0",
      );

      app.exit(
        0,
      );
    },
  )
  .catch(
    (
      error,
    ) => {

      console.error(
        "FAIL: FINORA SIGNED BRANCH ACCESS LIFECYCLE ISSUER SELFTEST",
        error,
      );

      app.exit(
        1,
      );
    },
  );
/* ============================================================
   END
============================================================ */