/* ============================================================
   FINORA ENTERPRISE OS™

   WALLET RECHARGE REQUEST EXCHANGE

   MODULE  : Wallet
   LAYER   : Native Request Authority
   VERSION : 1.0
   STATUS  : Production Foundation

   RESPONSIBILITY:

   - Accept only minimal renderer-provided Wallet request data.
   - Revalidate the opaque FINORA login session natively.
   - Derive exact Owner / Business / Branch scope from that session.
   - Read trusted Business / Branch display codes from Control Store.
   - Read exact native installation binding from protected authority.
   - Derive one deterministic requestId from exact branch scope +
     stable paymentReference.
   - Canonicalize the request payload.
   - Sign it with the native installation-binding private key.
   - Return a public signed request artifact.

   SECURITY:

   - Renderer cannot supply Owner / Business / Branch identity.
   - Renderer cannot supply Business / Branch codes.
   - Renderer cannot supply installation identity or fingerprint.
   - Renderer never receives installation private-key material.
   - DEMO and read-only sessions cannot create REAL recharge requests.
   - This request grants NO Wallet credit.
   - Filename is never authorization authority.
============================================================ */

import {
  createHash,
} from "node:crypto";

import {
  canonicalizeFinoraControlCenterValue,
} from "../control-center/finoraControlCenterCanonicalization.js";

import {
  resolveFinoraBranchOperationalSessionContext,
} from "./finoraBranchLoginSessionAuthority.js";

import {
  findFinoraPortableBusinessProfile,
} from "./finoraControlStore.js";

import {
  checkFinoraCurrentBranchDeviceTrust,
} from "./finoraBranchDeviceTrustAuthority.js";

import type {
  FinoraPortableBranchAuthStore,
} from "./finoraPortableBranchAuthStore.js";

import {
  getFinoraWindowsInstallationBinding,
  signFinoraWindowsInstallationCanonicalValue,
} from "./finoraInstallationBindingService.js";

import {
  FINORA_WALLET_RECHARGE_REQUEST_CANONICALIZATION,
  FINORA_WALLET_RECHARGE_REQUEST_CURRENCY,
  FINORA_WALLET_RECHARGE_REQUEST_PURPOSE,
  FINORA_WALLET_RECHARGE_REQUEST_SCHEMA_VERSION,
  FINORA_WALLET_RECHARGE_REQUEST_SIGNATURE_ALGORITHM,
  FINORA_WALLET_RECHARGE_REQUEST_SIGNATURE_ENCODING,
  type FinoraSignedWalletRechargeRequest,
  type FinoraWalletRechargeRequestPaymentMethod,
  type FinoraWalletRechargeRequestPaymentSource,
  type FinoraWalletRechargeRequestPayloadV1,
} from "./finoraWalletRechargeRequest.types.js";

// ============================================================
// INPUT
// ============================================================

export interface CreateFinoraWalletRechargeRequestInput {

  sessionId:
    string;

  paymentReference:
    string;

  amountMinor:
    number;

  paymentMethod:
    FinoraWalletRechargeRequestPaymentMethod;

  paymentSource:
    FinoraWalletRechargeRequestPaymentSource;
}

// ============================================================
// INTERNAL VALIDATION
// ============================================================

const ALLOWED_PAYMENT_METHODS:
  readonly FinoraWalletRechargeRequestPaymentMethod[] = [
    "UPI",
    "PHONEPE",
    "GOOGLE_PAY",
    "PAYTM",
    "RAZORPAY",
    "BANK_TRANSFER",
    "OTHER",
  ];

const ALLOWED_PAYMENT_SOURCES =
  new Set<FinoraWalletRechargeRequestPaymentSource>([
    "PHONEPE",
    "RAZORPAY",
    "UPI",
    "GOOGLE_PAY",
    "PAYTM",
    "BANK_TRANSFER",
    "MANUAL",
  ]);

function requireTrimmedText(
  value:
    unknown,

  label:
    string,

  maxLength:
    number,
): string {

  if (
    typeof value !==
      "string"
  ) {
    throw new Error(
      `${label} is required.`,
    );
  }

  const normalized =
    value.trim();

  if (
    normalized.length ===
      0 ||
    normalized.length >
      maxLength
  ) {
    throw new Error(
      `${label} is invalid.`,
    );
  }

  return normalized;
}

function assertCanonicalP1363Signature(
  value:
    string,
): void {

  const decoded =
    Buffer.from(
      value,
      "base64",
    );

  if (
    decoded.byteLength !==
      64 ||
    decoded.toString(
      "base64",
    ) !==
      value
  ) {
    throw new Error(
      "FINORA Wallet Recharge Request possession proof must be a canonical 64-byte IEEE-P1363 Base64 signature.",
    );
  }
}

function buildDeterministicRequestId(
  ownerId:
    string,

  businessId:
    string,

  branchId:
    string,

  paymentReference:
    string,
): string {

  const digest =
    createHash(
      "sha256",
    )
      .update(
        [
          FINORA_WALLET_RECHARGE_REQUEST_PURPOSE,
          ownerId,
          businessId,
          branchId,
          paymentReference,
        ].join(
          "\u0000",
        ),
        "utf8",
      )
      .digest(
        "hex",
      )
      .toUpperCase();

  return `FINORA-WAL-REQ-${digest}`;
}

// ============================================================
// CREATE SIGNED OWNER REQUEST
// ============================================================

export async function createFinoraWalletRechargeRequest(
  input:
    CreateFinoraWalletRechargeRequestInput,

  portableStore:
    FinoraPortableBranchAuthStore,
): Promise<
  FinoraSignedWalletRechargeRequest
> {

  // ----------------------------------------------------------
  // MINIMAL CALLER DATA
  // ----------------------------------------------------------

  const sessionId =
    requireTrimmedText(
      input?.sessionId,
      "FINORA session ID",
      512,
    );

  const paymentReference =
    requireTrimmedText(
      input?.paymentReference,
      "Wallet Recharge payment reference",
      256,
    );

  if (
    !Number.isSafeInteger(
      input?.amountMinor,
    ) ||
    input.amountMinor <=
      0
  ) {
    throw new Error(
      "Wallet Recharge amountMinor must be a positive safe integer.",
    );
  }

  if (
    !ALLOWED_PAYMENT_METHODS.includes(
      input?.paymentMethod,
    )
  ) {
    throw new Error(
      "Wallet Recharge payment method is invalid.",
    );
  }

  const paymentSource =
    requireTrimmedText(
      input?.paymentSource,
      "Wallet Recharge payment source",
      64,
    );

  if (
    !ALLOWED_PAYMENT_SOURCES.has(
      paymentSource as FinoraWalletRechargeRequestPaymentSource,
    )
  ) {
    throw new Error(
      "Wallet Recharge payment source is invalid.",
    );
  }

  const validatedPaymentSource =
    paymentSource as
      FinoraWalletRechargeRequestPaymentSource;

  // ----------------------------------------------------------
  // AUTHORITATIVE LOGIN SESSION
  //
  // This re-reads Control Store and re-evaluates access/binding.
  // ----------------------------------------------------------

  const sessionContextResult =
    await resolveFinoraBranchOperationalSessionContext({
      sessionId,
    });

  if (
    !sessionContextResult.success
  ) {
    throw new Error(
      sessionContextResult.error,
    );
  }

  const sessionContext =
    sessionContextResult.data;

  const session =
    sessionContext.session;

  const principal =
    sessionContext.principal;

  if (
    session.dataContext !==
      "REAL"
  ) {
    throw new Error(
      "Wallet Recharge Requests are available only for REAL FINORA business sessions.",
    );
  }

  if (
    session.accessMode !==
      "ACTIVE"
  ) {
    throw new Error(
      "Wallet Recharge Request creation requires ACTIVE branch access.",
    );
  }

  // ----------------------------------------------------------
  // FRESH CURRENT-DEVICE TRUST
  //
  // The login session proves authenticated branch authority.
  // Wallet export additionally requires the exact current
  // native device to remain TRUSTED at export time.
  //
  // SECURITY_CODE_REQUIRED is not handled here. Unknown
  // devices must complete the existing login authorization
  // flow before creating a Wallet Recharge Request.
  // ----------------------------------------------------------

  const deviceTrustResult =
    await checkFinoraCurrentBranchDeviceTrust({
      principal,

      portableStore,
    });

  if (
    !deviceTrustResult.success ||
    deviceTrustResult.status !==
      "TRUSTED"
  ) {
    throw new Error(
      "Wallet Recharge Request creation requires a trusted current FINORA device.",
    );
  }

  // ----------------------------------------------------------
  // TRUSTED BUSINESS / BRANCH PROFILE
  // ----------------------------------------------------------

  const profileResult =
    await findFinoraPortableBusinessProfile(
      session.ownerId,
      session.businessId,
      session.branchId,
    );

  if (
    !profileResult.success
  ) {
    throw new Error(
      profileResult.error ??
        "Unable to read the trusted FINORA Business Profile.",
    );
  }

  const profile =
    profileResult.data;

  if (!profile) {
    throw new Error(
      "A trusted FINORA Business Profile is required before creating a Wallet Recharge Request.",
    );
  }

  // ----------------------------------------------------------
  // CURRENT NATIVE INSTALLATION BINDING
  // ----------------------------------------------------------

  const installation =
    await getFinoraWindowsInstallationBinding();

  if (!installation) {
    throw new Error(
      "FINORA Windows installation binding is unavailable.",
    );
  }

  // ----------------------------------------------------------
  // DEFENCE-IN-DEPTH PROFILE / BINDING CONSISTENCY
  // ----------------------------------------------------------

  if (
    profile.ownerId !==
      session.ownerId ||
    profile.businessId !==
      session.businessId ||
    profile.branchId !==
      session.branchId
  ) {
    throw new Error(
      "FINORA Wallet Recharge Request scope does not match the trusted Business Profile.",
    );
  }

  /*
   * Portable BUSINESS_PROFILE installation/binding values are
   * immutable signed historical provenance. They deliberately
   * do not identify the current portable device.
   *
   * Current-device authorization is established independently
   * above by fresh Device Trust, and possession is proven below
   * by signing with this device's native P-256 key.
   */

  // ----------------------------------------------------------
  // STABLE REQUEST ID
  //
  // Same exact branch + paymentReference => same requestId.
  // A new paymentReference => a different requestId.
  // ----------------------------------------------------------

  const requestId =
    buildDeterministicRequestId(
      session.ownerId,
      session.businessId,
      session.branchId,
      paymentReference,
    );

  // ----------------------------------------------------------
  // CANONICAL PAYLOAD
  // ----------------------------------------------------------

  const payload:
    FinoraWalletRechargeRequestPayloadV1 = {

      purpose:
        FINORA_WALLET_RECHARGE_REQUEST_PURPOSE,

      requestId,

      paymentReference,

      scope: {
        ownerId:
          session.ownerId,

        businessId:
          session.businessId,

        branchId:
          session.branchId,
      },

      displayIdentity: {
        businessCode:
          profile.businessCode,

        branchCode:
          profile.branchCode,
      },

      installation: {
        installationId:
          installation.installationId,

        bindingKeyId:
          installation.bindingKeyId,

        fingerprintAlgorithm:
          installation.fingerprintAlgorithm,

        publicKeyFingerprint:
          installation.publicKeyFingerprint,
      },

      amountMinor:
        input.amountMinor,

      currency:
        FINORA_WALLET_RECHARGE_REQUEST_CURRENCY,

      paymentMethod:
        input.paymentMethod,

      paymentSource:
        validatedPaymentSource,

      requestedAt:
        new Date().toISOString(),

      schemaVersion:
        FINORA_WALLET_RECHARGE_REQUEST_SCHEMA_VERSION,
    };

  // ----------------------------------------------------------
  // INSTALLATION POSSESSION SIGNATURE
  // ----------------------------------------------------------

  const canonicalPayload =
    canonicalizeFinoraControlCenterValue(
      payload,
    );

  const signatureValue =
    await signFinoraWindowsInstallationCanonicalValue(
      canonicalPayload,
    );

  assertCanonicalP1363Signature(
    signatureValue,
  );

  return {
    payload,

    signature: {
      algorithm:
        FINORA_WALLET_RECHARGE_REQUEST_SIGNATURE_ALGORITHM,

      encoding:
        FINORA_WALLET_RECHARGE_REQUEST_SIGNATURE_ENCODING,

      canonicalization:
        FINORA_WALLET_RECHARGE_REQUEST_CANONICALIZATION,

      bindingKeyId:
        installation.bindingKeyId,

      value:
        signatureValue,
    },

    schemaVersion:
      FINORA_WALLET_RECHARGE_REQUEST_SCHEMA_VERSION,
  };
}

/* ============================================================
   END
============================================================ */