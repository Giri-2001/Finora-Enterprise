/* ============================================================
   FINORA ENTERPRISE OS
   BRANCH CERTIFICATION ROTATION
   AUTHORITATIVE PRODUCTION APPLY SERVICE

   Renderer authority:
   - sessionId
   - Password
   - Security Code

   Main-process authority:
   - operational branch/storage scope
   - current Portable Auth
   - protected pending replacement key custody
   - native device binding
   - recipient trusted signer keys
   - signed rotation verification and durable apply

   Recipient trust load -> coordinator completion executes inside
   the shared recipient-trust authority queue.
============================================================ */

import {
  resolveFinoraBranchOperationalSessionContext,
} from "./finoraBranchLoginSessionAuthority.js";

import {
  getFinoraWindowsInstallationBinding,
} from "./finoraInstallationBindingService.js";

import {
  loadFinoraBranchCertificationRotationPending,
} from "./finoraBranchCertificationRotationPendingStore.js";

import {
  loadFinoraRecipientTrustStore,
} from "./finoraRecipientTrustStore.js";

import {
  runFinoraRecipientTrustAuthoritySerialized,
} from "./finoraRecipientTrustAuthorityQueue.js";

import {
  applyFinoraBranchCertificationRotationAuthority,
} from "./finoraBranchCertificationRotationApplyCoordinator.js";

import type {
  FinoraPortableBranchAuthStore,
} from "./finoraPortableBranchAuthStore.js";

// ============================================================
// CONTRACT
// ============================================================

export interface FinoraBranchCertificationRotationAuthoritativeApplyRequest {
  sessionId:
    string;

  password:
    string;

  securityCode:
    string;
}

export type FinoraBranchCertificationRotationAuthoritativeApplyResult =
  Awaited<
    ReturnType<
      typeof applyFinoraBranchCertificationRotationAuthority
    >
  >;

type RotationPortableStore =
  Pick<
    FinoraPortableBranchAuthStore,
    "read" | "replaceExact"
  >;

// ============================================================
// REQUEST VALIDATION
// ============================================================

function isRecord(
  value:
    unknown,
): value is Record<string, unknown> {

  return (
    typeof value ===
      "object" &&
    value !==
      null &&
    !Array.isArray(
      value,
    )
  );
}

function isNonEmptyString(
  value:
    unknown,
): value is string {

  return (
    typeof value ===
      "string" &&
    value.trim().length >
      0
  );
}

function sanitizeRequest(
  value:
    unknown,
): FinoraBranchCertificationRotationAuthoritativeApplyRequest | undefined {

  if (
    !isRecord(
      value,
    )
  ) {
    return undefined;
  }

  const keys =
    Object.keys(
      value,
    ).sort();

  if (
    keys.length !==
      3 ||
    keys[0] !==
      "password" ||
    keys[1] !==
      "securityCode" ||
    keys[2] !==
      "sessionId" ||
    !isNonEmptyString(
      value.sessionId,
    ) ||
    !isNonEmptyString(
      value.password,
    ) ||
    !isNonEmptyString(
      value.securityCode,
    )
  ) {
    return undefined;
  }

  return {
    sessionId:
      value.sessionId,

    password:
      value.password,

    securityCode:
      value.securityCode,
  };
}

function failure(
  error:
    string,
): FinoraBranchCertificationRotationAuthoritativeApplyResult {

  return {
    success:
      false,

    error,
  };
}

// ============================================================
// APPLY
// ============================================================

export async function applyFinoraBranchCertificationRotationWithAuthoritativeContext(
  requestInput:
    unknown,

  signedPackage:
    unknown,

  portableStore:
    RotationPortableStore,
): Promise<
  FinoraBranchCertificationRotationAuthoritativeApplyResult
> {

  const request =
    sanitizeRequest(
      requestInput,
    );

  if (
    request ===
      undefined ||
    !portableStore ||
    typeof portableStore.read !==
      "function" ||
    typeof portableStore.replaceExact !==
      "function"
  ) {
    return failure(
      "A valid FINORA Branch Certification Rotation apply request is required.",
    );
  }

  // ----------------------------------------------------------
  // ACTIVE OPERATIONAL SESSION / AUTHORITATIVE STORAGE MODE
  // ----------------------------------------------------------

  const sessionResult =
    await resolveFinoraBranchOperationalSessionContext({
      sessionId:
        request.sessionId,
    });

  if (
    !sessionResult.success
  ) {
    return failure(
      sessionResult.error,
    );
  }

  const principal =
    sessionResult.data.principal;

  const storageMode =
    principal.storageMode;

  // ----------------------------------------------------------
  // CURRENT PORTABLE AUTH
  // ----------------------------------------------------------

  let currentPortableEnvelope:
    Awaited<
      ReturnType<
        RotationPortableStore["read"]
      >
    >;

  try {
    currentPortableEnvelope =
      await portableStore.read(
        storageMode,
      );
  }
  catch (
    error
  ) {
    return failure(
      error instanceof Error
        ? error.message
        : "Unable to read current FINORA Portable Branch Auth state.",
    );
  }

  if (
    currentPortableEnvelope ===
      null
  ) {
    return failure(
      "Current FINORA Portable Branch Auth state was not found in the provisioned storage mode.",
    );
  }

  // ----------------------------------------------------------
  // PROTECTED PENDING REPLACEMENT CUSTODY
  // ----------------------------------------------------------

  let pending:
    Awaited<
      ReturnType<
        typeof loadFinoraBranchCertificationRotationPending
      >
    >;

  try {
    pending =
      await loadFinoraBranchCertificationRotationPending();
  }
  catch (
    error
  ) {
    return failure(
      error instanceof Error
        ? error.message
        : "Unable to read FINORA Branch Certification Rotation pending custody.",
    );
  }

  if (
    pending ===
      undefined
  ) {
    return failure(
      "FINORA Branch Certification Rotation pending custody was not found.",
    );
  }

  // ----------------------------------------------------------
  // NATIVE DEVICE BINDING
  // ----------------------------------------------------------

  let binding:
    Awaited<
      ReturnType<
        typeof getFinoraWindowsInstallationBinding
      >
    >;

  try {
    binding =
      await getFinoraWindowsInstallationBinding();
  }
  catch (
    error
  ) {
    return failure(
      error instanceof Error
        ? error.message
        : "Unable to read the FINORA native installation binding.",
    );
  }

  if (
    binding ===
      undefined
  ) {
    return failure(
      "FINORA native installation binding is unavailable.",
    );
  }

  // ----------------------------------------------------------
  // EXACT BRANCH / DEVICE / GENERATION PENDING BINDING
  // ----------------------------------------------------------

  if (
    pending.ownerId !==
      principal.ownerId ||
    pending.businessId !==
      principal.businessId ||
    pending.branchId !==
      principal.branchId ||
    pending.installationId !==
      binding.installationId ||
    pending.bindingKeyId !==
      binding.bindingKeyId ||
    pending.fingerprintAlgorithm !==
      binding.fingerprintAlgorithm ||
    pending.publicKeyFingerprint !==
      binding.publicKeyFingerprint ||
    pending.authGeneration !==
      principal.authGeneration
  ) {
    return failure(
      "FINORA Branch Certification Rotation pending custody does not match the active branch session or native device.",
    );
  }

  const expectedTarget = {
    ownerId:
      principal.ownerId,

    businessId:
      principal.businessId,

    branchId:
      principal.branchId,

    installationId:
      binding.installationId,

    bindingKeyId:
      binding.bindingKeyId,

    fingerprintAlgorithm:
      binding.fingerprintAlgorithm,

    publicKeyFingerprint:
      binding.publicKeyFingerprint,
  } as const;

  // ----------------------------------------------------------
  // AUTHORITATIVE RECIPIENT TRUST SERIALIZATION
  // ----------------------------------------------------------

  return runFinoraRecipientTrustAuthoritySerialized(
    async () => {

      let recipientTrust:
        Awaited<
          ReturnType<
            typeof loadFinoraRecipientTrustStore
          >
        >;

      try {
        recipientTrust =
          await loadFinoraRecipientTrustStore();
      }
      catch (
        error
      ) {
        return failure(
          error instanceof Error
            ? error.message
            : "Unable to load authoritative FINORA recipient trust.",
        );
      }

      if (
        recipientTrust ===
          undefined ||
        recipientTrust.trustedKeys.length ===
          0
      ) {
        return failure(
          "FINORA recipient trust must be bootstrapped before applying Branch Certification Rotation.",
        );
      }

      return applyFinoraBranchCertificationRotationAuthority(
        {
          signedPackage,

          trustedKeys:
            recipientTrust.trustedKeys,

          expectedTarget,

          pending,

          currentPortableEnvelope,

          portableStore,

          storageMode,

          password:
            request.password,

          securityCode:
            request.securityCode,
        },
      );
    },
  );
}