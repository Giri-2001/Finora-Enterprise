// ============================================================
// FINORA ENTERPRISE OS™
//
// V2 ACTIVATION DOMAIN
// BRANCH ACCESS GRANT FACTORY
//
// RESPONSIBILITY:
//
// - Create initial REGISTERED access grants
// - Create REGISTERED renewal grants
// - Create administrator-configured DEMO grants
// - Generate cryptographically strong grant / Demo IDs
// - Enforce FINORA annual registration commercial policy
// - Preserve remaining annual validity during early renewal
//
// COMMERCIAL POLICY:
//
// REGISTERED:
//
// Fee      : INR 2,000
// Validity : Exactly 365 x 24 hours
//
// Renewal:
//
// If renewed before current expiry:
//   New cycle starts at current validUntil.
//
// If renewed after current expiry:
//   New cycle starts at renewedAt.
//
// This prevents an early renewal from destroying already-paid
// remaining validity.
//
// DEMO:
//
// No fixed duration.
// validFrom / validUntil are supplied by FINORA administration.
//
// IMPORTANT:
//
// - Pure domain/service factory.
// - No persistence.
// - No signing.
// - No private key.
// - No Electron IPC.
// - No Business Date.
// - No wallet mutation.
// - No customer / loan / collection mutation.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

import type {
  FinoraBranchAccessGrant,
  FinoraDemoBranchAccessGrant,
  FinoraRegisteredBranchAccessGrant,
  FinoraRegistrationPayment,
} from "../../types/activation/finoraBranchAccess.types";

import {
  createFinoraDemoAccessValidity,
  createFinoraRegisteredAccessValidity,
  validateFinoraBranchAccessGrant,
} from "./finoraBranchAccessEvaluator";

// ============================================================
// COMMERCIAL CONSTANTS
// ============================================================

export const FINORA_ANNUAL_REGISTRATION_FEE =
  2000 as const;

export const FINORA_ANNUAL_REGISTRATION_CURRENCY =
  "INR" as const;

// ============================================================
// ID PREFIXES
// ============================================================

const ACCESS_GRANT_ID_PREFIX =
  "FINORA-GRANT";

const DEMO_ID_PREFIX =
  "FINORA-DEMO";

// ============================================================
// COMMON INPUT
// ============================================================

export interface FinoraBranchAccessIdentityInput {

  userId:
    string;

  ownerId:
    string;

  businessId:
    string;

  branchId:
    string;
}

// ============================================================
// REGISTERED INPUT
// ============================================================

export interface CreateFinoraRegisteredAccessGrantInput
  extends FinoraBranchAccessIdentityInput {

  activatedAt:
    string;

  payment:
    FinoraRegistrationPayment;
}

// ============================================================
// RENEW INPUT
// ============================================================

export interface RenewFinoraRegisteredAccessGrantInput {

  currentGrant:
    FinoraRegisteredBranchAccessGrant;

  renewedAt:
    string;

  payment:
    FinoraRegistrationPayment;
}

// ============================================================
// DEMO INPUT
// ============================================================

export interface CreateFinoraDemoAccessGrantInput
  extends FinoraBranchAccessIdentityInput {

  validFrom:
    string;

  validUntil:
    string;

  createdAt?:
    string;

  demoRemarks?:
    string;
}

// ============================================================
// HELPERS
// ============================================================

function createSecureUuid():
  string {

  if (
    !globalThis.crypto ||
    typeof globalThis.crypto.randomUUID !==
      "function"
  ) {
    throw new Error(
      "FINORA secure UUID generation is unavailable.",
    );
  }

  return globalThis.crypto
    .randomUUID();
}

function createAccessGrantId():
  string {

  return (
    `${ACCESS_GRANT_ID_PREFIX}-${createSecureUuid()}`
  );
}

function createDemoId():
  string {

  return (
    `${DEMO_ID_PREFIX}-${createSecureUuid()}`
  );
}

function parseTimestamp(
  value: string,
  fieldName: string,
): number {

  const parsed =
    Date.parse(
      value,
    );

  if (!Number.isFinite(parsed)) {
    throw new Error(
      `A valid FINORA ${fieldName} timestamp is required.`,
    );
  }

  return parsed;
}

function normalizeTimestamp(
  value: string,
  fieldName: string,
): string {

  return new Date(
    parseTimestamp(
      value,
      fieldName,
    ),
  ).toISOString();
}

function validateIdentity(
  input:
    FinoraBranchAccessIdentityInput,
): void {

  if (
    !input.userId.trim() ||
    !input.ownerId.trim() ||
    !input.businessId.trim() ||
    !input.branchId.trim()
  ) {
    throw new Error(
      "FINORA branch access identity is incomplete.",
    );
  }
}

function validateRegistrationPayment(
  payment:
    FinoraRegistrationPayment,
): void {

  if (
    payment.amount !==
      FINORA_ANNUAL_REGISTRATION_FEE
  ) {
    throw new Error(
      `FINORA annual registration payment must be INR ${FINORA_ANNUAL_REGISTRATION_FEE}.`,
    );
  }

  if (
    payment.currency !==
      FINORA_ANNUAL_REGISTRATION_CURRENCY
  ) {
    throw new Error(
      "FINORA annual registration currency must be INR.",
    );
  }

  if (
    payment.refundable !==
      false
  ) {
    throw new Error(
      "FINORA annual registration payment must be non-refundable.",
    );
  }

  parseTimestamp(
    payment.paidAt,
    "registration payment",
  );
}

function assertValidGrant(
  grant:
    FinoraBranchAccessGrant,
): void {

  const validation =
    validateFinoraBranchAccessGrant(
      grant,
    );

  if (!validation.valid) {
    throw new Error(
      validation.error ??
      "FINORA branch access grant validation failed.",
    );
  }
}

// ============================================================
// INITIAL REGISTERED GRANT
// ============================================================

export function createFinoraRegisteredAccessGrant(
  input:
    CreateFinoraRegisteredAccessGrantInput,
): FinoraRegisteredBranchAccessGrant {

  validateIdentity(
    input,
  );

  validateRegistrationPayment(
    input.payment,
  );

  const activatedAt =
    normalizeTimestamp(
      input.activatedAt,
      "registration activation",
    );

  const grant:
    FinoraRegisteredBranchAccessGrant = {

      grantId:
        createAccessGrantId(),

      userId:
        input.userId,

      ownerId:
        input.ownerId,

      businessId:
        input.businessId,

      branchId:
        input.branchId,

      accessType:
        "REGISTERED",

      administrativeStatus:
        "ACTIVE",

      validity:
        createFinoraRegisteredAccessValidity(
          activatedAt,
        ),

      registrationPayment: {
        ...input.payment,

        paidAt:
          normalizeTimestamp(
            input.payment.paidAt,
            "registration payment",
          ),
      },

      registrationCycle:
        1,

      createdAt:
        activatedAt,

      updatedAt:
        activatedAt,

      schemaVersion:
        1,
    };

  assertValidGrant(
    grant,
  );

  return grant;
}

// ============================================================
// REGISTERED RENEWAL
// ============================================================

/**
 * Renewal rule:
 *
 * Active/unexpired current grant:
 *   next validity begins at current validUntil.
 *
 * Already expired:
 *   next validity begins at renewedAt.
 */
export function renewFinoraRegisteredAccessGrant(
  input:
    RenewFinoraRegisteredAccessGrantInput,
): FinoraRegisteredBranchAccessGrant {

  assertValidGrant(
    input.currentGrant,
  );

  validateRegistrationPayment(
    input.payment,
  );

  const renewedAtMs =
    parseTimestamp(
      input.renewedAt,
      "registration renewal",
    );

  const currentValidUntilMs =
    parseTimestamp(
      input.currentGrant.validity.validUntil,
      "current registration expiry",
    );

  const nextValidFromMs =
    Math.max(
      renewedAtMs,
      currentValidUntilMs,
    );

  const nextValidFrom =
    new Date(
      nextValidFromMs,
    ).toISOString();

  const updatedAt =
    new Date(
      renewedAtMs,
    ).toISOString();

  const nextCycle =
    input.currentGrant.registrationCycle +
    1;

  if (
    !Number.isSafeInteger(
      nextCycle,
    ) ||
    nextCycle <=
      1
  ) {
    throw new Error(
      "FINORA registration renewal cycle is invalid.",
    );
  }

  const renewedGrant:
    FinoraRegisteredBranchAccessGrant = {

      ...input.currentGrant,

      grantId:
        createAccessGrantId(),

      administrativeStatus:
        "ACTIVE",

      validity:
        createFinoraRegisteredAccessValidity(
          nextValidFrom,
        ),

      registrationPayment: {
        ...input.payment,

        paidAt:
          normalizeTimestamp(
            input.payment.paidAt,
            "registration payment",
          ),
      },

      registrationCycle:
        nextCycle,

      /**
       * Each annual renewal is a distinct immutable grant.
       */
      createdAt:
        updatedAt,

      updatedAt,

      schemaVersion:
        1,
    };

  assertValidGrant(
    renewedGrant,
  );

  return renewedGrant;
}

// ============================================================
// DEMO GRANT
// ============================================================

export function createFinoraDemoAccessGrant(
  input:
    CreateFinoraDemoAccessGrantInput,
): FinoraDemoBranchAccessGrant {

  validateIdentity(
    input,
  );

  const validity =
    createFinoraDemoAccessValidity(
      input.validFrom,
      input.validUntil,
    );

  const createdAt =
    input.createdAt
      ? normalizeTimestamp(
          input.createdAt,
          "Demo creation",
        )
      : new Date()
          .toISOString();

  const grant:
    FinoraDemoBranchAccessGrant = {

      grantId:
        createAccessGrantId(),

      userId:
        input.userId,

      ownerId:
        input.ownerId,

      businessId:
        input.businessId,

      branchId:
        input.branchId,

      accessType:
        "DEMO",

      demoId:
        createDemoId(),

      administrativeStatus:
        "ACTIVE",

      validity,

      demoRemarks:
        input.demoRemarks,

      createdAt,

      updatedAt:
        createdAt,

      schemaVersion:
        1,
    };

  assertValidGrant(
    grant,
  );

  return grant;
}

// ============================================================
// END
// ============================================================