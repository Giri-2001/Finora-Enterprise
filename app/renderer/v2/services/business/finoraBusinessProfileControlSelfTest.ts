// ============================================================
// FINORA ENTERPRISE OS™
//
// V2 BUSINESS DOMAIN
// BUSINESS PROFILE CONTROL SELF-TEST
//
// RESPONSIBILITY:
//
// - Lock core BUSINESS_PROFILE domain invariants
// - Verify ISSUE / REPLACE payload construction
// - Verify malformed profile rejection
// - Verify exact signed-target matching
//
// IMPORTANT:
//
// - Pure deterministic checks.
// - No storage.
// - No IPC.
// - No signing.
// - No private keys.
//
// VERSION : 1.0
// ============================================================

import type {
  FinoraProvisionedBusinessProfileV1,
} from "../../types/business/finoraBusinessProfileControl.types";

import {
  createFinoraBusinessProfileControlPayload,
  doesFinoraBusinessProfilePayloadMatchTarget,
  validateFinoraBusinessProfileControlPayload,
} from "./finoraBusinessProfileControlService";

// ============================================================
// ASSERT
// ============================================================

function assertCondition(
  condition:
    boolean,

  message:
    string,
): void {

  if (!condition) {
    throw new Error(
      `FINORA Business Profile self-test failed: ${message}`,
    );
  }
}

// ============================================================
// SELF-TEST
// ============================================================

export function runFinoraBusinessProfileControlSelfTest(): void {

  const timestamp =
    "2026-09-05T03:00:00.000Z";

  const fingerprint =
    "a".repeat(
      64,
    );

  const profile:
    FinoraProvisionedBusinessProfileV1 = {

      profileId:
        "FINORA-PROFILE-000001",

      ownerId:
        "OWNER-000001",

      businessId:
        "BUSINESS-000001",

      branchId:
        "BRANCH-000001",

      businessCode:
        "RGG",

      branchCode:
        "BR1",

      businessName:
        "Registered Business",

      branchName:
        "Main Branch",

      createdAt:
        timestamp,

      updatedAt:
        timestamp,

      schemaVersion:
        1,
    };

  const installationBinding = {

    installationId:
      "FINORA-INSTALLATION-000001",

    bindingKeyId:
      "FINORA-BINDING-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",

    fingerprintAlgorithm:
      "SHA-256" as const,

    publicKeyFingerprint:
      fingerprint,

    schemaVersion:
      1 as const,
  };

  // ----------------------------------------------------------
  // ISSUE
  // ----------------------------------------------------------

  const issuePayload =
    createFinoraBusinessProfileControlPayload({
      action:
        "ISSUE",

      profile,

      installationBinding,

      issuedAt:
        timestamp,
    });

  assertCondition(
    validateFinoraBusinessProfileControlPayload(
      issuePayload,
    ).valid,
    "valid ISSUE payload was rejected",
  );

  // ----------------------------------------------------------
  // EXACT TARGET
  // ----------------------------------------------------------

  const target = {

    ownerId:
      profile.ownerId,

    businessId:
      profile.businessId,

    branchId:
      profile.branchId,

    installationId:
      installationBinding.installationId,

    bindingKeyId:
      installationBinding.bindingKeyId,

    fingerprintAlgorithm:
      installationBinding.fingerprintAlgorithm,

    publicKeyFingerprint:
      installationBinding.publicKeyFingerprint,
  };

  assertCondition(
    doesFinoraBusinessProfilePayloadMatchTarget(
      issuePayload,
      target,
    ),
    "valid payload did not match its exact target",
  );

  // ----------------------------------------------------------
  // WRONG BRANCH TARGET
  // ----------------------------------------------------------

  assertCondition(
    !doesFinoraBusinessProfilePayloadMatchTarget(
      issuePayload,
      {
        ...target,

        branchId:
          "BRANCH-WRONG",
      },
    ),
    "wrong branch target was accepted",
  );

  // ----------------------------------------------------------
  // MALFORMED PROFILE
  // ----------------------------------------------------------

  const malformedPayload = {
    ...issuePayload,

    profile: {
      ...issuePayload.profile,

      businessName:
        "",
    },
  };

  assertCondition(
    !validateFinoraBusinessProfileControlPayload(
      malformedPayload,
    ).valid,
    "empty businessName was accepted",
  );

  // ----------------------------------------------------------
  // REPLACE
  // ----------------------------------------------------------

  const replacePayload =
    createFinoraBusinessProfileControlPayload({
      action:
        "REPLACE",

      profile: {
        ...profile,

        businessName:
          "Registered Business Updated",

        branchName:
          "Main Branch Updated",

        updatedAt:
          "2026-09-05T04:00:00.000Z",
      },

      installationBinding,

      issuedAt:
        "2026-09-05T04:00:00.000Z",
    });

  assertCondition(
    validateFinoraBusinessProfileControlPayload(
      replacePayload,
    ).valid,
    "valid REPLACE payload was rejected",
  );
}

// ============================================================
// END
// ============================================================