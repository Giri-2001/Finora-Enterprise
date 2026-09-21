import {
  prepareFinoraFreshDeviceBootstrap,
} from "./finoraPortableFreshDeviceBootstrapCoordinator.js";

import type {
  FinoraFreshDeviceBootstrapDependencies,
  FinoraFreshDevicePortablePayloadView,
  FinoraFreshDeviceRuntimeAuthorityView,
} from "./finoraPortableFreshDeviceBootstrapCoordinator.js";

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

const envelope =
  {
    kind:
      "PORTABLE-AUTH",
  };

const portable:
  FinoraFreshDevicePortablePayloadView = {
    sourceAuthorizationId:
      "SOURCE-AUTH-001",

    sourceAuthorizationVerificationEvidence: {
      kind:
        "TEST-EVIDENCE",
    },

    branchCertificationPublicAuthority: {
      keyId:
        "BRANCH-CERT-001",
    },

    ownerId:
      "OWNER-001",

    businessId:
      "BUSINESS-001",

    branchId:
      "BRANCH-001",

    userId:
      "USER-001",

    username:
      "giriadmin",

    canonicalUsername:
      "giriadmin",

    fullName:
      "Giri Admin",

    role:
      "ADMIN",

    dataContext:
      "REAL",

    storageMode:
      "USB",

    passwordVerifier: {
      kind:
        "PASSWORD-VERIFIER",
    },

    securityVerifier: {
      kind:
        "SECURITY-VERIFIER",
    },

    authGeneration:
      1,

    createdAt:
      "2026-01-01T00:00:00.000Z",

    updatedAt:
      "2026-09-20T00:00:00.000Z",
  };

const runtime:
  FinoraFreshDeviceRuntimeAuthorityView = {
    authorityId:
      "RUNTIME-AUTHORITY-001",

    sourceAuthorizationId:
      "SOURCE-AUTH-001",

    credentialId:
      "CREDENTIAL-001",

    activationId:
      "ACTIVATION-001",

    branchAccessGrantId:
      "GRANT-001",

    storageEntitlementId:
      "ENTITLEMENT-001",

    ownerId:
      "OWNER-001",

    businessId:
      "BUSINESS-001",

    branchId:
      "BRANCH-001",

    userId:
      "USER-001",

    username:
      "giriadmin",

    canonicalUsername:
      "giriadmin",

    fullName:
      "Giri Admin",

    role:
      "ADMIN",

    storageMode:
      "USB",

    dataContext:
      "REAL",

    authGeneration:
      1,

    activationStatus:
      "ACTIVE",

    businessCode:
      null,

    branchCode:
      null,

    activationActivatedAt:
      "2026-01-01T00:00:00.000Z",

    activationCreatedAt:
      "2026-01-01T00:00:00.000Z",

    activationUpdatedAt:
      "2026-09-20T00:00:00.000Z",

    branchAccessType:
      "REGISTERED",
    registrationPayment: {
      amount:
        2000,

      currency:
        "INR",

      paymentMode:
        "CASH",

      paidAt:
        "2026-01-01T00:00:00.000Z",

      refundable:
        false,
    },

    registrationCycle:
      1,

    demoRemarks:
      null,
    accessMode:
      "ACTIVE",

    accessValidFrom:
      "2026-01-01T00:00:00.000Z",

    accessValidUntil:
      "2027-01-01T00:00:00.000Z",

    branchAccessCreatedAt:
      "2026-01-01T00:00:00.000Z",

    branchAccessUpdatedAt:
      "2026-09-20T00:00:00.000Z",

    storageEntitlementStatus:
      "ACTIVE",

    storageEntitlementActivatedAt:
      "2026-01-01T00:00:00.000Z",

    storageEntitlementCreatedAt:
      "2026-01-01T00:00:00.000Z",

    storageEntitlementUpdatedAt:
      "2026-09-20T00:00:00.000Z",

    portableAuthFingerprint:
      "a".repeat(
        64,
      ),

    issuedAt:
      "2026-09-20T00:00:00.000Z",
  };

function createDependencies(
  overrides:
    Partial<
      FinoraFreshDeviceBootstrapDependencies
    > = {},
): {
  dependencies:
    FinoraFreshDeviceBootstrapDependencies;

  counters: {
    passwordChecks:
      number;

    decrypts:
      number;

    runtimeReads:
      number;
  };
} {
  const counters = {
    passwordChecks:
      0,

    decrypts:
      0,

    runtimeReads:
      0,
  };

  const dependencies:
    FinoraFreshDeviceBootstrapDependencies = {
      canonicalizeUsername:
        (
          username,
        ) =>
          username
            .trim()
            .toLowerCase(),

      readPortableAuth:
        async () =>
          envelope,

      verifyPortablePassword:
        async (
          _envelope,
          password,
        ) => {
          counters.passwordChecks +=
            1;

          return (
            password ===
              "CorrectPassword123!"
          );
        },

      decryptPortableAuth:
        async (
          _envelope,
          _password,
          securityCode,
        ) => {
          counters.decrypts +=
            1;

          if (
            securityCode !==
              "SecurityCode123!"
          ) {
            return {
              success:
                false,

              errorCode:
                "SECURITY_CODE_INVALID",
            };
          }

          return {
            success:
              true,

            payload:
              portable,
          };
        },

      createPortableAuthFingerprint:
        () =>
          "a".repeat(
            64,
          ),

      readRuntimeAuthority:
        async () => {
          counters.runtimeReads +=
            1;

          return {
            kind:
              "SIGNED-RUNTIME-AUTHORITY",
          };
        },

      verifyAndReadRuntimeAuthority:
        () =>
          runtime,

      now:
        () =>
          new Date(
            "2026-09-20T01:00:00.000Z",
          ),

      ...overrides,
    };

  return {
    dependencies,
    counters,
  };
}

async function main():
  Promise<void> {
  {
    const {
      dependencies,
      counters,
    } =
      createDependencies();

    const result =
      await prepareFinoraFreshDeviceBootstrap(
        {
          username:
            "giriadmin",

          password:
            "WrongPassword123!",

          storageMode:
            "USB",
        },
        dependencies,
      );

    assert(
      !result.success &&
      result.errorCode ===
        "INVALID_CREDENTIALS",
      "Wrong Password did not return INVALID_CREDENTIALS.",
    );

    assert(
      counters.passwordChecks ===
        1 &&
      counters.decrypts ===
        0 &&
      counters.runtimeReads ===
        0,
      "Wrong Password reached Security Code/runtime authority work.",
    );

    console.log(
      "PASS: wrong Password fails before Security Code or runtime-authority access",
    );
  }

  {
    const {
      dependencies,
      counters,
    } =
      createDependencies();

    const result =
      await prepareFinoraFreshDeviceBootstrap(
        {
          username:
            "giriadmin",

          password:
            "CorrectPassword123!",

          storageMode:
            "USB",
        },
        dependencies,
      );

    assert(
      !result.success &&
      result.errorCode ===
        "SECURITY_CODE_REQUIRED",
      "Valid Password did not produce SECURITY_CODE_REQUIRED.",
    );

    assert(
      counters.decrypts ===
        0 &&
      counters.runtimeReads ===
        0,
      "Security Code challenge performed privileged decrypt/runtime work.",
    );

    console.log(
      "PASS: valid Password on fresh device produces Security Code challenge only",
    );
  }

  {
    const {
      dependencies,
      counters,
    } =
      createDependencies();

    const result =
      await prepareFinoraFreshDeviceBootstrap(
        {
          username:
            "giriadmin",

          password:
            "CorrectPassword123!",

          securityCode:
            "WrongSecurityCode123!",

          storageMode:
            "USB",
        },
        dependencies,
      );

    assert(
      !result.success &&
      result.errorCode ===
        "SECURITY_CODE_INVALID",
      "Wrong Security Code was not rejected.",
    );

    assert(
      counters.decrypts ===
        1 &&
      counters.runtimeReads ===
        0,
      "Wrong Security Code reached signed runtime-authority access.",
    );

    console.log(
      "PASS: wrong Security Code fails before signed runtime-authority consumption",
    );
  }

  {
    const {
      dependencies,
    } =
      createDependencies();

    const result =
      await prepareFinoraFreshDeviceBootstrap(
        {
          username:
            "giriadmin",

          password:
            "CorrectPassword123!",

          securityCode:
            "SecurityCode123!",

          storageMode:
            "USB",
        },
        dependencies,
      );

    assert(
      result.success &&
      result.status ===
        "READY_FOR_HYDRATION",
      "Valid fresh-device authority did not produce hydration plan.",
    );

    assert(
      result.plan.credentialId ===
        "CREDENTIAL-001" &&
      result.plan.activationId ===
        "ACTIVATION-001" &&
      result.plan.branchAccessGrantId ===
        "GRANT-001" &&
      result.plan.storageEntitlementId ===
        "ENTITLEMENT-001" &&
      result.plan.storageMode ===
        "USB" &&
      result.plan.accessMode ===
        "ACTIVE",
      "Hydration plan lost authoritative identities or access mode.",
    );

    assert(
      !(
        "password" in
        result.plan
      ) &&
      !(
        "securityCode" in
        result.plan
      ),
      "Hydration plan exposed plaintext authentication secrets.",
    );

    console.log(
      "PASS: valid Password + Security Code + signed authority yields narrow hydration plan",
    );
  }

  {
    const mismatchedRuntime:
      FinoraFreshDeviceRuntimeAuthorityView = {
        ...runtime,

        portableAuthFingerprint:
          "b".repeat(
            64,
          ),
      };

    const {
      dependencies,
    } =
      createDependencies({
        verifyAndReadRuntimeAuthority:
          () =>
            mismatchedRuntime,
      });

    const result =
      await prepareFinoraFreshDeviceBootstrap(
        {
          username:
            "giriadmin",

          password:
            "CorrectPassword123!",

          securityCode:
            "SecurityCode123!",

          storageMode:
            "USB",
        },
        dependencies,
      );

    assert(
      !result.success &&
      result.errorCode ===
        "RUNTIME_AUTHORITY_MISMATCH",
      "Portable Auth fingerprint mismatch was accepted.",
    );

    console.log(
      "PASS: runtime authority must match exact Portable Auth fingerprint",
    );
  }

  {
    const {
      dependencies,
    } =
      createDependencies({
        verifyAndReadRuntimeAuthority:
          () =>
            null,
      });

    const result =
      await prepareFinoraFreshDeviceBootstrap(
        {
          username:
            "giriadmin",

          password:
            "CorrectPassword123!",

          securityCode:
            "SecurityCode123!",

          storageMode:
            "USB",
        },
        dependencies,
      );

    assert(
      !result.success &&
      result.errorCode ===
        "RUNTIME_AUTHORITY_INVALID",
      "Invalid Branch Certification signature was accepted.",
    );

    console.log(
      "PASS: invalid Branch Certification runtime-authority signature fails closed",
    );
  }

  {
    const expiredRegistered:
      FinoraFreshDeviceRuntimeAuthorityView = {
        ...runtime,

        accessValidUntil:
          "2026-09-01T00:00:00.000Z",

        branchAccessCreatedAt:
          "2026-01-01T00:00:00.000Z",

        branchAccessUpdatedAt:
          "2026-09-20T00:00:00.000Z",
      };

    const {
      dependencies,
    } =
      createDependencies({
        verifyAndReadRuntimeAuthority:
          () =>
            expiredRegistered,
      });

    const result =
      await prepareFinoraFreshDeviceBootstrap(
        {
          username:
            "giriadmin",

          password:
            "CorrectPassword123!",

          securityCode:
            "SecurityCode123!",

          storageMode:
            "USB",
        },
        dependencies,
      );

    assert(
      result.success &&
      result.plan.accessMode ===
        "REGISTERED_EXPIRED_READ_ONLY",
      "Expired REGISTERED authority did not downgrade to read-only.",
    );

    console.log(
      "PASS: expired REGISTERED authority can only hydrate as read-only",
    );
  }

  {
    const demoPortable:
      FinoraFreshDevicePortablePayloadView = {
        ...portable,

        dataContext:
          "DEMO",

        demoId:
          "DEMO-001",
      };

    const expiredDemo:
      FinoraFreshDeviceRuntimeAuthorityView = {
        ...runtime,

        dataContext:
          "DEMO",

        demoId:
          "DEMO-001",

        branchAccessType:
          "DEMO",

        accessValidUntil:
          "2026-09-01T00:00:00.000Z",

        branchAccessCreatedAt:
          "2026-01-01T00:00:00.000Z",

        branchAccessUpdatedAt:
          "2026-09-20T00:00:00.000Z",
      };

    const {
      dependencies,
    } =
      createDependencies({
        decryptPortableAuth:
          async () =>
            ({
              success:
                true,

              payload:
                demoPortable,
            }),

        verifyAndReadRuntimeAuthority:
          () =>
            expiredDemo,
      });

    const result =
      await prepareFinoraFreshDeviceBootstrap(
        {
          username:
            "giriadmin",

          password:
            "CorrectPassword123!",

          securityCode:
            "SecurityCode123!",

          storageMode:
            "USB",
        },
        dependencies,
      );

    assert(
      !result.success &&
      result.errorCode ===
        "BRANCH_ACCESS_DENIED",
      "Expired DEMO authority was accepted.",
    );

    console.log(
      "PASS: expired DEMO authority is denied on fresh device",
    );
  }

  console.log(
    "PASS: STEP A3-A1 FRESH-DEVICE PASSWORD-FIRST CONSUME EXECUTABLE PROOF",
  );
}

void main().catch(
  (
    error,
  ) => {
    console.error(
      error,
    );

    process.exitCode =
      1;
  },
);