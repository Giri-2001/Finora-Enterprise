/**
 * PAISARULE C138-R37
 * Pure atomic Collection sequence planner.
 * No USB, IPC, storage, wallet or financial side effects.
 * Must only be invoked with authoritative data inside Native lock.
 */

export interface AtomicSequenceScope {
  ownerId: string;
  businessId: string;
  branchId: string;
  businessCode: string;
  branchCode: string;
  canonicalLoanNumber: string;
  customerNumber: number;
  loanSequence: number;
}

export interface AtomicSequenceState extends AtomicSequenceScope {
  lastIssuedCollectionSequence: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface AtomicSequencePlan {
  id: string;
  entity: "COLLECTION_NUMBER_SEQUENCE";
  nextSequence: number;
  data: AtomicSequenceState;
}

const validSeq = (n: number): boolean =>
  Number.isSafeInteger(n) && n >= 1 && n <= 999;

export function planAtomicCollectionSequence(input: {
  scope: AtomicSequenceScope;
  state: AtomicSequenceState | null;
  committedSequences: readonly number[];
  now: string;
}): AtomicSequencePlan {
  const { scope, state, committedSequences, now } = input;

  for (const key of [
    "ownerId", "businessId", "branchId",
    "businessCode", "branchCode", "canonicalLoanNumber",
  ] as const) {
    if (typeof scope[key] !== "string" || !scope[key].trim()) {
      throw new Error("ATOMIC_NUMBER_SCOPE_INVALID");
    }
  }

  if (
    !Number.isSafeInteger(scope.customerNumber) ||
    scope.customerNumber < 1 ||
    scope.customerNumber > 999999 ||
    !validSeq(scope.loanSequence) ||
    typeof now !== "string" ||
    !Number.isFinite(Date.parse(now))
  ) {
    throw new Error("ATOMIC_NUMBER_INPUT_INVALID");
  }

  if (state) {
    for (const key of [
      "ownerId", "businessId", "branchId",
      "businessCode", "branchCode", "canonicalLoanNumber",
      "customerNumber", "loanSequence",
    ] as const) {
      if (state[key] !== scope[key]) {
        throw new Error("ATOMIC_NUMBER_STATE_SCOPE_MISMATCH");
      }
    }

    if (
      state.lastIssuedCollectionSequence !== null &&
      !validSeq(state.lastIssuedCollectionSequence)
    ) {
      throw new Error("ATOMIC_NUMBER_LEDGER_INVALID");
    }
  }

  const seen = new Set<number>();

  for (const seq of committedSequences) {
    if (!validSeq(seq) || seen.has(seq)) {
      throw new Error("ATOMIC_NUMBER_HISTORY_INVALID");
    }
    seen.add(seq);
  }

  const issued = state?.lastIssuedCollectionSequence ?? 0;
  const highestCommitted =
    committedSequences.length > 0
      ? Math.max(...committedSequences)
      : 0;

  const nextSequence = Math.max(issued, highestCommitted) + 1;

  if (nextSequence > 999) {
    throw new Error("ATOMIC_NUMBER_LIMIT_REACHED");
  }

  return {
    id: [
      scope.businessId,
      scope.branchId,
      scope.canonicalLoanNumber,
    ].join("::"),
    entity: "COLLECTION_NUMBER_SEQUENCE",
    nextSequence,
    data: {
      ...scope,
      lastIssuedCollectionSequence: nextSequence,
      createdAt: state?.createdAt ?? now,
      updatedAt: now,
    },
  };
}

/**
 * PAISARULE_C138_R38A
 * Pure receipt identity parser. No storage writes.
 */
export function parseAtomicCollectionReceiptIdentity(
  receiptNumber: string,
  customerNumber: number,
  loanSequence: number,
): number {
  if (typeof receiptNumber !== "string") {
    throw new Error("ATOMIC_RECEIPT_FORMAT_INVALID");
  }

  const match =
    /^(?:FIN|PAISA)-RCP-(\d{6})-(\d{3})-(\d{3})$/.exec(
      receiptNumber,
    );

  if (!match) {
    throw new Error("ATOMIC_RECEIPT_FORMAT_INVALID");
  }

  const receiptCustomer = Number(match[1]);
  const receiptLoan = Number(match[2]);
  const receiptSequence = Number(match[3]);

  if (
    !Number.isSafeInteger(customerNumber) ||
    !Number.isSafeInteger(loanSequence) ||
    receiptCustomer !== customerNumber ||
    receiptLoan !== loanSequence
  ) {
    throw new Error("ATOMIC_RECEIPT_SCOPE_MISMATCH");
  }

  if (!validSeq(receiptSequence)) {
    throw new Error("ATOMIC_RECEIPT_SEQUENCE_INVALID");
  }

  return receiptSequence;
}

/**
 * PAISARULE_C138_R39
 *
 * Strict pre-publication numbering verification.
 * Pure: no USB, storage, mutation or IPC.
 *
 * Caller must obtain scope, ledger and committed receipts
 * from the authoritative package INSIDE the Native lock.
 */
export function prepareAtomicCollectionNumberingCommit(input: {
  scope: AtomicSequenceScope;
  state: AtomicSequenceState | null;
  committedReceiptNumbers: readonly string[];
  requestedReceiptNumber: string;
  now: string;
}): AtomicSequencePlan {
  const {
    scope,
    state,
    committedReceiptNumbers,
    requestedReceiptNumber,
    now,
  } = input;

  if (!Array.isArray(committedReceiptNumbers)) {
    throw new Error("ATOMIC_NUMBER_HISTORY_INVALID");
  }

  const committedSequences =
    committedReceiptNumbers.map((receipt) =>
      parseAtomicCollectionReceiptIdentity(
        receipt,
        scope.customerNumber,
        scope.loanSequence,
      ),
    );

  const planned = planAtomicCollectionSequence({
    scope,
    state,
    committedSequences,
    now,
  });

  const requestedSequence =
    parseAtomicCollectionReceiptIdentity(
      requestedReceiptNumber,
      scope.customerNumber,
      scope.loanSequence,
    );

  if (requestedSequence !== planned.nextSequence) {
    throw new Error("ATOMIC_NUMBER_STALE_RECEIPT_REJECTED");
  }

  return planned;
}

/**
 * PAISARULE_C138_R40
 * Prepare sequence changes in memory only.
 * The caller must publish the complete package atomically.
 */
export function applyAtomicSequencePlanToRecords<
  T extends {
    id: string;
    entity: string;
    data: unknown;
    createdAt: string;
    updatedAt: string;
    ownerId?: string;
    businessId?: string;
    branchId?: string;
    demoId?: string;
  }
>(
  records: readonly T[],
  plan: AtomicSequencePlan,
): T[] {
  if (
    plan.entity !== "COLLECTION_NUMBER_SEQUENCE" ||
    !validSeq(plan.nextSequence) ||
    plan.data.lastIssuedCollectionSequence !== plan.nextSequence ||
    plan.id !== [
      plan.data.businessId,
      plan.data.branchId,
      plan.data.canonicalLoanNumber,
    ].join("::")
  ) {
    throw new Error("ATOMIC_NUMBER_PLAN_INVALID");
  }

  const matching = records.filter(
    (record) =>
      record.entity === plan.entity &&
      record.id === plan.id,
  );

  if (matching.length > 1) {
    throw new Error("ATOMIC_NUMBER_DUPLICATE_STATE");
  }

  const previous = matching[0];

  if (previous) {
    if (
      previous.ownerId !== plan.data.ownerId ||
      previous.businessId !== plan.data.businessId ||
      previous.branchId !== plan.data.branchId ||
      (previous.demoId !== undefined &&
        previous.demoId !== null &&
        previous.demoId !== "")
    ) {
      throw new Error("ATOMIC_NUMBER_SCOPE_MISMATCH");
    }

    const old = previous.data as
      | Record<string, unknown>
      | null;

    if (
      !old ||
      typeof old !== "object" ||
      Array.isArray(old) ||
      old.canonicalLoanNumber !== plan.data.canonicalLoanNumber ||
      old.customerNumber !== plan.data.customerNumber ||
      old.loanSequence !== plan.data.loanSequence ||
      old.lastIssuedCollectionSequence !==
        plan.nextSequence - 1
    ) {
      throw new Error("ATOMIC_NUMBER_STATE_CHANGED");
    }
  } else if (plan.nextSequence !== 1) {
    // Missing state with an advanced sequence needs explicit
    // authoritative reconciliation, not silent reconstruction.
    throw new Error("ATOMIC_NUMBER_MISSING_LEDGER_REVIEW_REQUIRED");
  }

  const record = {
    ...(previous ?? {}),
    id: plan.id,
    entity: plan.entity,
    data: {
      ...plan.data,
      id: plan.id,
      entity: plan.entity,
    },
    createdAt: previous?.createdAt ?? plan.data.createdAt,
    updatedAt: plan.data.updatedAt,
    ownerId: plan.data.ownerId,
    businessId: plan.data.businessId,
    branchId: plan.data.branchId,
    demoId: previous?.demoId,
  } as T;

  return previous
    ? records.map((item) =>
        item === previous ? record : item
      )
    : [...records, record];
}