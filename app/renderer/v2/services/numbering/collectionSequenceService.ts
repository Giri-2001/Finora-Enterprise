// ============================================================
// FINORA ENTERPRISE OS™
//
// IDENTITY & NUMBERING ENGINE
// COLLECTION SEQUENCE SERVICE
//
// RESPONSIBILITY:
//
// - Resolve the canonical Loan numbering root
// - Support current and historical Loan Numbers
// - Preview the next per-Loan Collection / Receipt pair
// - Permanently reserve the next per-Loan Collection sequence
// - Format authoritative hierarchical Collection and Receipt
//   Numbers from one shared transaction sequence
//
// IMPORTANT:
//
// - No direct localStorage access.
// - No direct filesystem access.
// - No Electron IPC.
// - No React.
// - No Collection record creation.
// - No owner-editable Collection starting sequence.
// - Every Loan begins at Collection sequence 001.
// - Receipt owns no independent sequence.
// - Preview never consumes a Collection sequence.
// - Reserved Collection sequences are never rolled back.
// - Reservation serialization protects this FINORA JS runtime.
// - Cross-process atomic locking is future hardening.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

import type {
  FinoraCommercialWriteOperationAuthorization,
} from "../activation/finoraCommercialWriteOperation";

import {
  consumeFinoraPostCollectionOperationStage,
} from "../activation/finoraCommercialWriteOperation";

import {
  COLLECTION_SEQUENCE_MAX,
  COLLECTION_SEQUENCE_MIN,
} from "../../constants/numbering/numbering.constants";

import {
  collectionSequenceRepository,
} from "../../repositories/numbering/collectionSequenceRepository";

import {
  previewLoanNumberingRoot,
  resolveOrCreateLoanNumberingRoot,
} from "./loanNumberingBindingService";

import type {
  CollectionReceiptNumberPair,
  CollectionSequenceState,
} from "../../types/numbering/numbering.types";

import type {
  StorageResult,
} from "../../storage/storage.types";

import {
  formatCollectionReceiptPair,
} from "../../utils/numbering/numbering.formatter";

// ============================================================
// NEXT COLLECTION SEQUENCE
// ============================================================

function resolveNextCollectionSequence(
  state:
    CollectionSequenceState | undefined,
): StorageResult<number> {

  const nextCollectionSequence =
    state?.lastIssuedCollectionSequence === null ||
    state?.lastIssuedCollectionSequence === undefined
      ? COLLECTION_SEQUENCE_MIN
      : state.lastIssuedCollectionSequence + 1;

  if (
    nextCollectionSequence >
    COLLECTION_SEQUENCE_MAX
  ) {
    return {
      success: false,

      error:
        "This Loan has reached the maximum FINORA Collection sequence.",
    };
  }

  return {
    success: true,
    data: nextCollectionSequence,
  };
}

// ============================================================
// FORMAT PAIR
// ============================================================

function buildCollectionReceiptPair(
  businessCode: string,
  branchCode: string,
  customerNumber: number,
  loanSequence: number,
  collectionSequence: number,
): StorageResult<
  CollectionReceiptNumberPair
> {

  try {
    return {
      success: true,

      data:
        formatCollectionReceiptPair(
          businessCode,
          branchCode,
          customerNumber,
          loanSequence,
          collectionSequence,
        ),
    };
  } catch (error) {
    return {
      success: false,

      error:
        error instanceof Error
          ? error.message
          : "Unable to format FINORA Collection / Receipt Numbers.",
    };
  }
}

// ============================================================
// PREVIEW NEXT COLLECTION / RECEIPT PAIR
//
// Preview does not:
//
// - reserve a historical Loan root;
// - consume a Collection sequence;
// - persist Collection numbering state.
// ============================================================

export async function previewNextCollectionReceiptPair(
  customerId: string,
  loanNumber: string,
): Promise<
  StorageResult<
    CollectionReceiptNumberPair
  >
> {

  const rootResult =
    await previewLoanNumberingRoot(
      customerId,
      loanNumber,
    );

  if (
    !rootResult.success ||
    !rootResult.data
  ) {
    return {
      success: false,

      error:
        rootResult.error ??
        "Unable to resolve the Loan numbering root.",
    };
  }

  const root =
    rootResult.data;

  const stateResult =
    await collectionSequenceRepository.findByLoan(
      root.businessId,
      root.branchId,
      root.canonicalLoanNumber,
    );

  if (!stateResult.success) {
    return {
      success: false,

      error:
        stateResult.error ??
        "Unable to load the Loan Collection sequence.",
    };
  }

  const nextSequenceResult =
    resolveNextCollectionSequence(
      stateResult.data,
    );

  if (
    !nextSequenceResult.success ||
    nextSequenceResult.data === undefined
  ) {
    return {
      success: false,

      error:
        nextSequenceResult.error ??
        "Unable to resolve the next Collection sequence.",
    };
  }

  return buildCollectionReceiptPair(
    root.businessCode,
    root.branchCode,
    root.customerNumber,
    root.loanSequence,
    nextSequenceResult.data,
  );
}

// ============================================================
// COLLECTION RESERVATION SERIALIZATION
//
// One queue per source Customer + Loan avoids duplicate
// Collection sequence reservations inside this FINORA JS
// runtime.
//
// Historical Loan root creation is also serialized by its own
// binding service.
// ============================================================

const collectionReservationQueues =
  new Map<
    string,
    Promise<void>
  >();

async function withCollectionReservationLock<T>(
  customerId: string,
  loanNumber: string,
  operation:
    () => Promise<T>,
): Promise<T> {

  const lockKey =
    [
      customerId.trim().toUpperCase(),
      loanNumber.trim().toUpperCase(),
    ].join("::");

  const previousOperation =
    collectionReservationQueues.get(
      lockKey,
    ) ??
    Promise.resolve();

  let releaseCurrentOperation:
    () => void =
      () => undefined;

  const currentOperation =
    new Promise<void>(
      (resolve) => {
        releaseCurrentOperation =
          resolve;
      },
    );

  collectionReservationQueues.set(
    lockKey,
    currentOperation,
  );

  await previousOperation;

  try {
    return await operation();
  } finally {
    releaseCurrentOperation();

    if (
      collectionReservationQueues.get(
        lockKey,
      ) === currentOperation
    ) {
      collectionReservationQueues.delete(
        lockKey,
      );
    }
  }
}

// ============================================================
// RESERVE NEXT COLLECTION / RECEIPT PAIR - UNLOCKED
//
// Reservation is persisted before downstream Loan mutation and
// Collection persistence.
//
// Once successfully reserved:
//
// - Collection sequence is permanently consumed;
// - Receipt mirrors that exact sequence;
// - downstream failure may create a legal numbering gap.
// ============================================================

async function reserveNextCollectionReceiptPairUnlocked(
  customerId: string,
  loanNumber: string,
): Promise<
  StorageResult<
    CollectionReceiptNumberPair
  >
> {

  const rootResult =
    await resolveOrCreateLoanNumberingRoot(
      customerId,
      loanNumber,
    );

  if (
    !rootResult.success ||
    !rootResult.data
  ) {
    return {
      success: false,

      error:
        rootResult.error ??
        "Unable to resolve the authoritative Loan numbering root.",
    };
  }

  const root =
    rootResult.data;

  const stateResult =
    await collectionSequenceRepository.findByLoan(
      root.businessId,
      root.branchId,
      root.canonicalLoanNumber,
    );

  if (!stateResult.success) {
    return {
      success: false,

      error:
        stateResult.error ??
        "Unable to load the Loan Collection sequence.",
    };
  }

  const existingState =
    stateResult.data;

  const nextSequenceResult =
    resolveNextCollectionSequence(
      existingState,
    );

  if (
    !nextSequenceResult.success ||
    nextSequenceResult.data === undefined
  ) {
    return {
      success: false,

      error:
        nextSequenceResult.error ??
        "Unable to resolve the next Collection sequence.",
    };
  }

  const collectionSequence =
    nextSequenceResult.data;

  const pairResult =
    buildCollectionReceiptPair(
      root.businessCode,
      root.branchCode,
      root.customerNumber,
      root.loanSequence,
      collectionSequence,
    );

  if (
    !pairResult.success ||
    !pairResult.data
  ) {
    return {
      success: false,

      error:
        pairResult.error ??
        "Unable to build Collection / Receipt Numbers.",
    };
  }

  const now =
    new Date().toISOString();

  let persistenceResult:
    StorageResult<
      CollectionSequenceState
    >;

  if (!existingState) {
    persistenceResult =
      await collectionSequenceRepository.save(
        {
          ownerId:
            root.ownerId,

          businessId:
            root.businessId,

          branchId:
            root.branchId,

          businessCode:
            root.businessCode,

          branchCode:
            root.branchCode,

          canonicalLoanNumber:
            root.canonicalLoanNumber,

          customerNumber:
            root.customerNumber,

          loanSequence:
            root.loanSequence,

          lastIssuedCollectionSequence:
            collectionSequence,

          createdAt:
            now,

          updatedAt:
            now,
        },
        {
          ownerId:
            root.ownerId,
        },
      );
  } else {

    if (
      existingState.ownerId !==
        root.ownerId ||
      existingState.businessId !==
        root.businessId ||
      existingState.branchId !==
        root.branchId ||
      existingState.businessCode !==
        root.businessCode ||
      existingState.branchCode !==
        root.branchCode ||
      existingState.canonicalLoanNumber !==
        root.canonicalLoanNumber ||
      existingState.customerNumber !==
        root.customerNumber ||
      existingState.loanSequence !==
        root.loanSequence
    ) {
      return {
        success: false,

        error:
          "Stored Collection sequence identity does not match the active FINORA Loan scope.",
      };
    }

    persistenceResult =
      await collectionSequenceRepository.update(
        {
          ...existingState,

          lastIssuedCollectionSequence:
            collectionSequence,

          updatedAt:
            now,
        },
        {
          ownerId:
            root.ownerId,
        },
      );
  }

  if (!persistenceResult.success) {
    return {
      success: false,

      error:
        persistenceResult.error ??
        "Unable to reserve the next Collection sequence.",
    };
  }

  return {
    success: true,
    data: pairResult.data,
  };
}

// ============================================================
// SERIALIZED RESERVATION API
// ============================================================

export async function reserveNextCollectionReceiptPair(
  customerId: string,
  loanNumber: string,
  authorization:
    FinoraCommercialWriteOperationAuthorization,
): Promise<
  StorageResult<
    CollectionReceiptNumberPair
  >
> {

  consumeFinoraPostCollectionOperationStage(
    authorization,
    "NUMBER_RESERVED",
  );

  return withCollectionReservationLock(
    customerId,
    loanNumber,
    () =>
      reserveNextCollectionReceiptPairUnlocked(
        customerId,
        loanNumber,
      ),
  );
}

// ============================================================
// END
// ============================================================
