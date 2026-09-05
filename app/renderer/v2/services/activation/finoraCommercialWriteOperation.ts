/* ===========================================================
   FINORA ENTERPRISE OS™

   COMMERCIAL WRITE OPERATION AUTHORIZATION

   MODULE  : Activation / Commercial Access
   LAYER   : Runtime Transaction Authorization
   VERSION : 1.0
   STATUS  : Production Foundation

   RESPONSIBILITY:

   - Begin one freshly-authorized POST_COLLECTION transaction
   - Preserve that authorization across the transaction's
     multiple authoritative persistence stages
   - Enforce exact stage ordering
   - Reject forged authorization objects
   - Reject replayed / duplicated stages
   - Mark final Collection persistence as terminal

   WHY THIS EXISTS:

   POST_COLLECTION currently spans multiple authoritative
   mutations:

     Collection number reservation
       -> Loan outstanding mutation
       -> Collection persistence

   There is no current compensating transaction that can safely
   reverse a partially-posted Collection.

   Therefore entitlement validity is checked freshly at
   transaction START.

   The exact same opaque authorization may then complete the
   already-started transaction even if registration validity
   crosses validUntil between authoritative stages.

   IMPORTANT:

   - No Business Date authority.
   - No persistence.
   - No StorageManager mutation.
   - No customer / loan / collection data mutation.
   - Authorization objects are runtime-local and in-memory only.
=========================================================== */

import {
  authorizeFinoraCommercialWrite,
} from "./finoraCommercialWriteGuard";

// ============================================================
// PUBLIC AUTHORIZATION HANDLE
// ============================================================

export interface FinoraCommercialWriteOperationAuthorization {
  readonly capability:
    "POST_COLLECTION";

  readonly authorizedAt:
    string;
}

// ============================================================
// POST_COLLECTION STAGES
// ============================================================

export type FinoraPostCollectionOperationStage =
  | "NUMBER_RESERVED"
  | "LOAN_UPDATED"
  | "COLLECTION_SAVED";

// ============================================================
// INTERNAL STATE
// ============================================================

type FinoraPostCollectionInternalStage =
  | "AUTHORIZED"
  | FinoraPostCollectionOperationStage;

interface FinoraCommercialWriteOperationInternalState {
  capability:
    "POST_COLLECTION";

  stage:
    FinoraPostCollectionInternalStage;
}

// ============================================================
// OPAQUE AUTHORIZATION REGISTRY
//
// WeakMap object identity is authoritative.
//
// A structurally identical plain object is NOT sufficient.
// ============================================================

const operationRegistry =
  new WeakMap<
    FinoraCommercialWriteOperationAuthorization,
    FinoraCommercialWriteOperationInternalState
  >();

// ============================================================
// START RESULT
// ============================================================

export interface FinoraPostCollectionOperationStarted {
  success:
    true;

  authorization:
    FinoraCommercialWriteOperationAuthorization;
}

export interface FinoraPostCollectionOperationDenied {
  success:
    false;

  error:
    string;
}

export type FinoraPostCollectionOperationStartResult =
  | FinoraPostCollectionOperationStarted
  | FinoraPostCollectionOperationDenied;

// ============================================================
// BEGIN TRANSACTION
// ============================================================

/**
 * Start one POST_COLLECTION transaction.
 *
 * This is the ONLY point where entitlement validity is freshly
 * evaluated for this transaction.
 *
 * Once this succeeds, the returned authorization may advance
 * only through the permitted POST_COLLECTION stage machine.
 */
export async function beginFinoraPostCollectionOperation():
  Promise<
    FinoraPostCollectionOperationStartResult
  > {

  const decision =
    await authorizeFinoraCommercialWrite(
      "POST_COLLECTION",
    );

  if (!decision.allowed) {
    return {
      success:
        false,

      error:
        decision.reason,
    };
  }

  const authorization:
    FinoraCommercialWriteOperationAuthorization =
      Object.freeze({
        capability:
          "POST_COLLECTION",

        authorizedAt:
          new Date().toISOString(),
      });

  operationRegistry.set(
    authorization,
    {
      capability:
        "POST_COLLECTION",

      stage:
        "AUTHORIZED",
    },
  );

  return {
    success:
      true,

    authorization,
  };
}

// ============================================================
// RESOLVE REGISTERED OPERATION
// ============================================================

function requireRegisteredOperation(
  authorization:
    FinoraCommercialWriteOperationAuthorization,
): FinoraCommercialWriteOperationInternalState {

  if (
    !authorization ||
    typeof authorization !==
      "object"
  ) {
    throw new Error(
      "A valid FINORA POST_COLLECTION operation authorization is required.",
    );
  }

  const state =
    operationRegistry.get(
      authorization,
    );

  if (!state) {
    throw new Error(
      "FINORA POST_COLLECTION operation authorization is invalid or forged.",
    );
  }

  if (
    state.capability !==
      "POST_COLLECTION" ||
    authorization.capability !==
      "POST_COLLECTION"
  ) {
    throw new Error(
      "FINORA commercial operation capability does not match POST_COLLECTION.",
    );
  }

  return state;
}

// ============================================================
// STAGE TRANSITION VALIDATION
// ============================================================

function isAllowedPostCollectionTransition(
  current:
    FinoraPostCollectionInternalStage,

  next:
    FinoraPostCollectionOperationStage,
): boolean {

  if (
    current === "AUTHORIZED" &&
    (
      next === "NUMBER_RESERVED" ||
      next === "LOAN_UPDATED"
    )
  ) {
    return true;
  }

  if (
    current === "NUMBER_RESERVED" &&
    next === "LOAN_UPDATED"
  ) {
    return true;
  }

  if (
    current === "LOAN_UPDATED" &&
    next === "COLLECTION_SAVED"
  ) {
    return true;
  }

  return false;
}

// ============================================================
// CONSUME / ADVANCE STAGE
// ============================================================

/**
 * Consume exactly one authoritative POST_COLLECTION stage.
 *
 * The transition is recorded BEFORE the downstream mutation
 * executes. This prevents concurrent or repeated use of the
 * same authorization for the same financial stage.
 *
 * If a downstream mutation fails, callers must abandon this
 * authorization and begin a fresh user transaction.
 */
export function consumeFinoraPostCollectionOperationStage(
  authorization:
    FinoraCommercialWriteOperationAuthorization,

  nextStage:
    FinoraPostCollectionOperationStage,
): void {

  const state =
    requireRegisteredOperation(
      authorization,
    );

  if (
    !isAllowedPostCollectionTransition(
      state.stage,
      nextStage,
    )
  ) {
    throw new Error(
      `Invalid FINORA POST_COLLECTION stage transition: ${state.stage} -> ${nextStage}.`,
    );
  }

  state.stage =
    nextStage;

  // ----------------------------------------------------------
  // FINAL STAGE
  //
  // Remove the authorization from the registry immediately.
  // The same object can never be replayed after Collection save
  // begins.
  // ----------------------------------------------------------

  if (
    nextStage ===
      "COLLECTION_SAVED"
  ) {
    operationRegistry.delete(
      authorization,
    );
  }
}

// ============================================================
// END
// ============================================================