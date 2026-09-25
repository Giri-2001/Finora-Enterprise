/* ===========================================================
   FINORA ENTERPRISE OSâ„¢

   WALLET RECHARGE REQUEST SESSION AUTHORITY

   MODULE  : Control Center
   LAYER   : Privileged Main-Process Session Authority
   VERSION : 1.0
   STATUS  : Production Foundation

   RESPONSIBILITY:

   - Keep one cryptographically verified Wallet Recharge Request
     bound to the exact privileged Control Center WebContents.
   - Prevent renderer-controlled amount / paymentReference /
     payment method / branch identity from becoming approval
     authority after import.
   - Return defensive snapshots to later privileged approval or
     decline operations.
   - Support atomic take-before-async processing.
   - Automatically disappear with WebContents garbage collection.

   SECURITY:

   - MAIN PROCESS ONLY.
   - No IPC registration.
   - No filesystem API.
   - No renderer session token.
   - No renderer-supplied lookup identifier.
   - No persistent state.
   - No signing authority.
   - No private-key access.
   - No Wallet mutation.
=========================================================== */

import type {
  WebContents,
} from "electron";

import path from "node:path";

import type {
  FinoraVerifiedWalletRechargeRequest,
} from "./finoraWalletRechargeRequestVerifier.js";

// ============================================================
// SESSION STORE
// ============================================================

const verifiedWalletRechargeRequestByWebContents =
  new WeakMap<
    WebContents,
    FinoraVerifiedWalletRechargeRequest
  >();

export interface FinoraVerifiedWalletRechargeRequestFileEvidence {
  requestId:
    string;

  fileName:
    string;

  filePath:
    string;
}

const verifiedWalletRechargeRequestFileEvidenceByWebContents =
  new WeakMap<
    WebContents,
    FinoraVerifiedWalletRechargeRequestFileEvidence
  >();

function cloneFileEvidence(
  evidence:
    FinoraVerifiedWalletRechargeRequestFileEvidence,
): FinoraVerifiedWalletRechargeRequestFileEvidence {

  return {
    requestId:
      evidence.requestId,

    fileName:
      evidence.fileName,

    filePath:
      evidence.filePath,
  };
}

// ============================================================
// DEFENSIVE SNAPSHOT
// ============================================================

function cloneVerifiedWalletRechargeRequest(
  request:
    FinoraVerifiedWalletRechargeRequest,
): FinoraVerifiedWalletRechargeRequest {

  return {
    requestId:
      request.requestId,

    paymentReference:
      request.paymentReference,

    target: {
      ...request.target,
    },

    amountMinor:
      request.amountMinor,

    currency:
      request.currency,

    paymentMethod:
      request.paymentMethod,

    paymentSource:
      request.paymentSource,

    requestedAt:
      request.requestedAt,

    schemaVersion:
      1,
  };
}

// ============================================================
// REMEMBER
// ============================================================

export function rememberFinoraVerifiedWalletRechargeRequest(
  webContents:
    WebContents,

  request:
    FinoraVerifiedWalletRechargeRequest,
): void {

  if (
    webContents.isDestroyed()
  ) {
    throw new Error(
      "FINORA Control Center renderer is unavailable for verified Wallet Recharge Request session binding.",
    );
  }

  verifiedWalletRechargeRequestByWebContents.set(
    webContents,
    cloneVerifiedWalletRechargeRequest(
      request,
    ),
  );
}

// ============================================================
// TRUSTED IMPORT FILE EVIDENCE
//
// The native file picker owns filePath.
// This metadata never becomes signing or financial authority.
// ============================================================

export function rememberFinoraVerifiedWalletRechargeRequestFileEvidence(
  webContents:
    WebContents,

  evidence:
    FinoraVerifiedWalletRechargeRequestFileEvidence,
): void {

  if (
    webContents.isDestroyed()
  ) {
    throw new Error(
      "FINORA Control Center renderer is unavailable for Wallet Recharge Request file evidence.",
    );
  }

  const requestId =
    evidence.requestId.trim();

  const fileName =
    evidence.fileName.trim();

  const filePath =
    evidence.filePath.trim();

  if (
    !requestId ||
    !fileName ||
    !filePath
  ) {
    throw new Error(
      "FINORA Wallet Recharge Request file evidence is incomplete.",
    );
  }

  if (
    !path.isAbsolute(
      filePath,
    )
  ) {
    throw new Error(
      "FINORA Wallet Recharge Request file evidence path must be absolute.",
    );
  }

  if (
    path.basename(
      filePath,
    ).toLocaleLowerCase() !==
    fileName.toLocaleLowerCase()
  ) {
    throw new Error(
      "FINORA Wallet Recharge Request filename/path evidence does not match.",
    );
  }

  verifiedWalletRechargeRequestFileEvidenceByWebContents.set(
    webContents,
    {
      requestId,
      fileName,
      filePath,
    },
  );
}

export function getFinoraVerifiedWalletRechargeRequestFileEvidence(
  webContents:
    WebContents,
): FinoraVerifiedWalletRechargeRequestFileEvidence | undefined {

  if (
    webContents.isDestroyed()
  ) {
    return undefined;
  }

  const evidence =
    verifiedWalletRechargeRequestFileEvidenceByWebContents.get(
      webContents,
    );

  return evidence ===
    undefined
    ? undefined
    : cloneFileEvidence(
        evidence,
      );
}

export function clearFinoraVerifiedWalletRechargeRequestFileEvidence(
  webContents:
    WebContents,

  requestId:
    string,
): void {

  const evidence =
    verifiedWalletRechargeRequestFileEvidenceByWebContents.get(
      webContents,
    );

  if (
    evidence?.requestId ===
      requestId
  ) {
    verifiedWalletRechargeRequestFileEvidenceByWebContents.delete(
      webContents,
    );
  }
}

// ============================================================
// GET
// ============================================================

export function getFinoraVerifiedWalletRechargeRequest(
  webContents:
    WebContents,
): FinoraVerifiedWalletRechargeRequest | undefined {

  if (
    webContents.isDestroyed()
  ) {
    return undefined;
  }

  const request =
    verifiedWalletRechargeRequestByWebContents.get(
      webContents,
    );

  if (!request) {
    return undefined;
  }

  return cloneVerifiedWalletRechargeRequest(
    request,
  );
}

// ============================================================
// TAKE
//
// Atomically consumes the currently verified request before
// any asynchronous approval / decline operation begins.
//
// This prevents concurrent privileged operations from reusing
// the same imported signed Wallet Recharge Request.
// ============================================================

export function takeFinoraVerifiedWalletRechargeRequest(
  webContents:
    WebContents,
): FinoraVerifiedWalletRechargeRequest | undefined {

  if (
    webContents.isDestroyed()
  ) {
    return undefined;
  }

  const request =
    verifiedWalletRechargeRequestByWebContents.get(
      webContents,
    );

  if (!request) {
    return undefined;
  }

  verifiedWalletRechargeRequestByWebContents.delete(
    webContents,
  );

  return cloneVerifiedWalletRechargeRequest(
    request,
  );
}

// ============================================================
// CLEAR
// ============================================================

export function clearFinoraVerifiedWalletRechargeRequest(
  webContents:
    WebContents,
): void {

  verifiedWalletRechargeRequestByWebContents.delete(
    webContents,
  );

  verifiedWalletRechargeRequestFileEvidenceByWebContents.delete(
    webContents,
  );
}

// ============================================================
// END
// ============================================================