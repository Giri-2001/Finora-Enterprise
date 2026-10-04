/* ============================================================
   FINORA ENTERPRISE OS
   CANONICAL WALLET AUTHORITY

   RESPONSIBILITY:
   - Define the privileged Wallet spend-authority boundary
   - Keep Wallet money authority independent from removable data USB
   - Prevent Full Branch Backup from becoming spend authority
   - Support one canonical Wallet across multiple FINORA data USBs
   - Provide a future boundary for non-exportable secure hardware

   SECURITY RULES:
   - USB Wallet records are historical/cache evidence only.
   - Canonical authority must never be silently reconstructed from
     an older Full Branch Backup.
   - No authority available => paid Wallet mutation fails closed.
   - authorityGeneration and spendCounter are monotonic.
   - Implementations must reject rollback/fork attempts.

   IMPORTANT:
   This file defines the authority contract only.
   It intentionally performs no filesystem or StorageManager I/O.

   VERSION : 1.0
============================================================ */

export type FinoraCanonicalWalletAuthorityStatus =
  | "ACTIVE"
  | "CONTINUATION_REQUIRED"
  | "BLOCKED";

export interface FinoraCanonicalWalletAuthorityScope {
  ownerId: string;
  businessId: string;
  branchId: string;
}

export interface FinoraCanonicalWalletAuthorityPendingMutation {

  mutationId:
    string;

  mutationKind:
    | "DEBIT"
    | "RECHARGE";

  amount:
    number;

  balanceBefore:
    number;

  balanceAfter:
    number;

  expectedAuthorityGeneration:
    number;

  expectedSpendCounter:
    number;

  expectedHeadHash:
    string;

  createdAt:
    string;
}

export interface FinoraCanonicalWalletAuthorityState
  extends FinoraCanonicalWalletAuthorityScope {

  authorityId: string;

  walletId: string;

  authoritativeBalance: number;

  authorityGeneration: number;

  spendCounter: number;

  headHash: string;

  previousHeadHash?: string;

  /**
   * Last successfully committed canonical mutation.
   *
   * This is an additional exactly-once guard above the
   * generation / counter / head compare-and-swap checks.
   */
  lastMutationId?: string;

  /**
   * Durable two-phase authority intent.
   *
   * When present, financial mutation recovery must reconcile this
   * authority intent with the USB Wallet pending ledger before
   * another mutation is permitted.
   */
  pendingMutation?:
    FinoraCanonicalWalletAuthorityPendingMutation;

  status:
    FinoraCanonicalWalletAuthorityStatus;

  updatedAt: string;

  schemaVersion: 1;
}

export interface FinoraCanonicalWalletAuthorityReadInput
  extends FinoraCanonicalWalletAuthorityScope {

  walletId: string;
}

export interface FinoraCanonicalWalletAuthorityMutationInput
  extends FinoraCanonicalWalletAuthorityReadInput {

  expectedAuthorityGeneration: number;

  expectedSpendCounter: number;

  expectedHeadHash: string;
  /**
   * Financial mutation amount.
   *
   * The privileged provider calculates the resulting canonical
   * balance from its own current authoritative state.
   */
  amount:
    number;

  mutationKind:
    | "DEBIT"
    | "RECHARGE";

  mutationId: string;

  occurredAt: string;
}

export type FinoraCanonicalWalletAuthorityReadResult =
  | {
      success: true;
      data:
        FinoraCanonicalWalletAuthorityState;
    }
  | {
      success: false;
      error:
        string;
    };

export type FinoraCanonicalWalletAuthorityMutationResult =
  | {
      success: true;
      data:
        FinoraCanonicalWalletAuthorityState;
    }
  | {
      success: false;
      errorCode:
        | "AUTHORITY_UNAVAILABLE"
        | "AUTHORITY_BLOCKED"
        | "AUTHORITY_SCOPE_MISMATCH"
        | "AUTHORITY_ROLLBACK_DETECTED"
        | "AUTHORITY_CONFLICT"
        | "INVALID_MUTATION";
      error:
        string;
    };

export interface FinoraCanonicalWalletAuthorityProvider {

  readAuthority(
    input:
      FinoraCanonicalWalletAuthorityReadInput,
  ):
    Promise<FinoraCanonicalWalletAuthorityReadResult>;

  commitMutation(
    input:
      FinoraCanonicalWalletAuthorityMutationInput,
  ):
    Promise<FinoraCanonicalWalletAuthorityMutationResult>;
}



