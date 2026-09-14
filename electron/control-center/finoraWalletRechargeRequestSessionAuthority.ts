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
}

// ============================================================
// END
// ============================================================