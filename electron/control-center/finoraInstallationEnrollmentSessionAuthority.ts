/* ===========================================================
   FINORA ENTERPRISE OS™

   INSTALLATION ENROLLMENT SESSION AUTHORITY

   MODULE  : Control Center
   LAYER   : Privileged Main-Process Session Authority
   VERSION : 1.0
   STATUS  : Production Foundation

   RESPONSIBILITY:

   - Keep one cryptographically verified Enrollment Request
     bound to the exact privileged Control Center WebContents
   - Prevent renderer-controlled requestId / installation /
     binding metadata from becoming issuance authority
   - Return defensive snapshots to privileged main-process
     issuance operations
   - Automatically disappear with WebContents garbage collection

   SECURITY:

   - MAIN PROCESS ONLY.
   - No IPC registration.
   - No filesystem API.
   - No renderer session token.
   - No renderer-supplied lookup identifier.
   - No persistent state.
   - No signing authority.
   - No REGISTERED / DEMO authority.
   - No storage entitlement authority.
=========================================================== */

import type {
  WebContents,
} from "electron";

import type {
  FinoraVerifiedInstallationEnrollmentRequest,
} from "./finoraInstallationEnrollmentRequestVerifier.js";

// ============================================================
// SESSION STORE
// ============================================================

const verifiedEnrollmentByWebContents =
  new WeakMap<
    WebContents,
    FinoraVerifiedInstallationEnrollmentRequest
  >();

// ============================================================
// DEFENSIVE SNAPSHOT
// ============================================================

function cloneVerifiedEnrollment(
  enrollment:
    FinoraVerifiedInstallationEnrollmentRequest,
): FinoraVerifiedInstallationEnrollmentRequest {

  return {
    requestId:
      enrollment.requestId,

    deviceBinding: {
      ...enrollment.deviceBinding,
    },

    requestedAt:
      enrollment.requestedAt,

    ...(
      enrollment.requestSchemaVersion ===
        undefined
        ? {}
        : {
            requestSchemaVersion:
              enrollment.requestSchemaVersion,
          }
    ),

    ...(
      enrollment.branchCertificationPublicKey ===
        undefined
        ? {}
        : {
            branchCertificationPublicKey: {
              ...enrollment.branchCertificationPublicKey,
            },
          }
    ),

    target: {
      ...enrollment.target,
    },

    schemaVersion:
      1,
  };
}

// ============================================================
// REMEMBER
// ============================================================

export function rememberFinoraVerifiedInstallationEnrollment(
  webContents:
    WebContents,

  enrollment:
    FinoraVerifiedInstallationEnrollmentRequest,
): void {

  if (
    webContents.isDestroyed()
  ) {
    throw new Error(
      "FINORA Control Center renderer is unavailable for verified Enrollment Request session binding.",
    );
  }

  verifiedEnrollmentByWebContents.set(
    webContents,
    cloneVerifiedEnrollment(
      enrollment,
    ),
  );
}

// ============================================================
// GET
// ============================================================

export function getFinoraVerifiedInstallationEnrollment(
  webContents:
    WebContents,
): FinoraVerifiedInstallationEnrollmentRequest | undefined {

  if (
    webContents.isDestroyed()
  ) {
    return undefined;
  }

  const enrollment =
    verifiedEnrollmentByWebContents.get(
      webContents,
    );

  if (!enrollment) {
    return undefined;
  }

  return cloneVerifiedEnrollment(
    enrollment,
  );
}

// ============================================================
// TAKE
//
// Atomically consumes the currently verified request before
// any asynchronous issuance operation begins.
//
// This prevents concurrent issuance operations from reusing
// the same verified native possession proof.
// ============================================================

export function takeFinoraVerifiedInstallationEnrollment(
  webContents:
    WebContents,
): FinoraVerifiedInstallationEnrollmentRequest | undefined {

  if (
    webContents.isDestroyed()
  ) {
    return undefined;
  }

  const enrollment =
    verifiedEnrollmentByWebContents.get(
      webContents,
    );

  if (!enrollment) {
    return undefined;
  }

  verifiedEnrollmentByWebContents.delete(
    webContents,
  );

  return cloneVerifiedEnrollment(
    enrollment,
  );
}

// ============================================================
// CLEAR
// ============================================================

export function clearFinoraVerifiedInstallationEnrollment(
  webContents:
    WebContents,
): void {

  verifiedEnrollmentByWebContents.delete(
    webContents,
  );
}

// ============================================================
// END
// ============================================================