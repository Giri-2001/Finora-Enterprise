import type {
  WebContents,
} from "electron";

import type {
  FinoraVerifiedBranchCertificationRotationRequest,
} from "./finoraBranchCertificationRotationRequestVerifier.js";

// ============================================================
// SESSION STATE
// ============================================================

const verifiedRotationByWebContents =
  new WeakMap<
    WebContents,
    FinoraVerifiedBranchCertificationRotationRequest
  >();

// ============================================================
// CLONE
// ============================================================

function cloneVerifiedRotation(
  value:
    FinoraVerifiedBranchCertificationRotationRequest,
): FinoraVerifiedBranchCertificationRotationRequest {

  return {
    request: {
      ...value.request,


      replacementCertificationPublicKey: {
        ...value.request.replacementCertificationPublicKey,
      },
    },

    deviceBinding: {
      ...value.deviceBinding,
    },

    schemaVersion:
      1,
  };
}

// ============================================================
// REMEMBER
// ============================================================

export function rememberFinoraVerifiedBranchCertificationRotationRequest(
  webContents:
    WebContents,

  verifiedRequest:
    FinoraVerifiedBranchCertificationRotationRequest,
): void {

  if (
    webContents.isDestroyed()
  ) {
    throw new Error(
      "FINORA Control Center renderer is unavailable for verified Branch Certification Rotation Request session binding.",
    );
  }

  verifiedRotationByWebContents.set(
    webContents,
    cloneVerifiedRotation(
      verifiedRequest,
    ),
  );
}

// ============================================================
// GET
// ============================================================

export function getFinoraVerifiedBranchCertificationRotationRequest(
  webContents:
    WebContents,
): FinoraVerifiedBranchCertificationRotationRequest | undefined {

  if (
    webContents.isDestroyed()
  ) {
    return undefined;
  }

  const verifiedRequest =
    verifiedRotationByWebContents.get(
      webContents,
    );

  if (
    verifiedRequest ===
      undefined
  ) {
    return undefined;
  }

  return cloneVerifiedRotation(
    verifiedRequest,
  );
}

// ============================================================
// TAKE
//
// Atomically consumes the verified request before asynchronous
// issue/export work starts.
// ============================================================

export function takeFinoraVerifiedBranchCertificationRotationRequest(
  webContents:
    WebContents,
): FinoraVerifiedBranchCertificationRotationRequest | undefined {

  if (
    webContents.isDestroyed()
  ) {
    return undefined;
  }

  const verifiedRequest =
    verifiedRotationByWebContents.get(
      webContents,
    );

  if (
    verifiedRequest ===
      undefined
  ) {
    return undefined;
  }

  verifiedRotationByWebContents.delete(
    webContents,
  );

  return cloneVerifiedRotation(
    verifiedRequest,
  );
}

// ============================================================
// CLEAR
// ============================================================

export function clearFinoraVerifiedBranchCertificationRotationRequest(
  webContents:
    WebContents,
): void {

  verifiedRotationByWebContents.delete(
    webContents,
  );
}