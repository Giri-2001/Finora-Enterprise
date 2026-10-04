/* ============================================================
   FINORA ENTERPRISE OS

   CANONICAL WALLET AUTHORITY PROVIDER

   RESPONSIBILITY:
   - Make the encrypted main-process Wallet Authority vault
     the sole spend-authority source.
   - Never reconstruct authority from USB Wallet records.
   - Never reconstruct authority from Full Branch Backup.
   - Reject stale generation / counter / head mutations.
   - Keep one canonical Wallet Authority per branch scope.
   - Serialize authority mutations inside the privileged process.

   SECURITY:
   - Electron main process only.
   - No renderer authority.
   - No USB authority.
   - No backup authority.
   - Missing authority => fail closed.
   - Existing authority identity cannot be replaced.
============================================================ */

import {
  createHash,
} from "node:crypto";

import {
  loadFinoraCanonicalWalletAuthorityVault,
  persistNewFinoraCanonicalWalletAuthorityVault,
  replaceFinoraCanonicalWalletAuthorityVault,
} from "./finoraCanonicalWalletAuthorityVault.js";

import type {
  FinoraCanonicalWalletAuthorityMutationInput,
  FinoraCanonicalWalletAuthorityMutationResult,
  FinoraCanonicalWalletAuthorityProvider,
  FinoraCanonicalWalletAuthorityReadInput,
  FinoraCanonicalWalletAuthorityReadResult,
  FinoraCanonicalWalletAuthorityState,
} from "./finoraCanonicalWalletAuthority.js";

/* ============================================================
   SERIALIZATION
============================================================ */

let mutationQueue:
  Promise<void> =
    Promise.resolve();

/* ============================================================
   CANONICAL HASH
============================================================ */

function calculateAuthorityHeadHash(
  input: {
    authorityId:
      string;

    walletId:
      string;

    ownerId:
      string;

    businessId:
      string;

    branchId:
      string;

    authorityGeneration:
      number;

    spendCounter:
      number;

    balance:
      number;

    previousHeadHash:
      string;

    mutationKind:
      "DEBIT" |
      "RECHARGE";

    mutationId:
      string;

    occurredAt:
      string;
  },
): string {

  const canonical =
    [
      input.authorityId,
      input.walletId,
      input.ownerId,
      input.businessId,
      input.branchId,
      String(
        input.authorityGeneration,
      ),
      String(
        input.spendCounter,
      ),
      String(
        input.balance,
      ),
      input.previousHeadHash,
      input.mutationKind,
      input.mutationId,
      input.occurredAt,
    ].join(
      "|",
    );

  return createHash(
    "sha256",
  )
    .update(
      canonical,
      "utf8",
    )
    .digest(
      "hex",
    );
}

/* ============================================================
   SCOPE
============================================================ */

function sameAuthorityScope(
  authority:
    FinoraCanonicalWalletAuthorityState,

  request:
    FinoraCanonicalWalletAuthorityReadInput,
): boolean {

  return (
    authority.ownerId ===
      request.ownerId &&
    authority.businessId ===
      request.businessId &&
    authority.branchId ===
      request.branchId &&
    authority.walletId ===
      request.walletId
  );
}

/* ============================================================
   PROVIDER
============================================================ */

export function createFinoraPersistentCanonicalWalletAuthorityProvider():
  FinoraCanonicalWalletAuthorityProvider {

  return {

    async readAuthority(
      request:
        FinoraCanonicalWalletAuthorityReadInput,
    ):
      Promise<
        FinoraCanonicalWalletAuthorityReadResult
      > {

      try {

        const authority =
          await loadFinoraCanonicalWalletAuthorityVault();

        if (!authority) {
          return {
            success:
              false,

            error:
              "FINORA canonical Wallet Authority has not been initialized.",
          };
        }

        if (
          !sameAuthorityScope(
            authority,
            request,
          )
        ) {
          return {
            success:
              false,

            error:
              "FINORA canonical Wallet Authority scope mismatch.",
          };
        }

        return {
          success:
            true,

          data:
            authority,
        };

      }
      catch (error) {

        return {
          success:
            false,

          error:
            error instanceof Error
              ? error.message
              : "Unable to read FINORA canonical Wallet Authority.",
        };

      }
    },

    async commitMutation(
      input:
        FinoraCanonicalWalletAuthorityMutationInput,
    ):
      Promise<
        FinoraCanonicalWalletAuthorityMutationResult
      > {

      let result:
        FinoraCanonicalWalletAuthorityMutationResult =
        {
          success:
            false,

          errorCode:
            "AUTHORITY_UNAVAILABLE",

          error:
            "FINORA canonical Wallet Authority mutation was not committed.",
        };

      mutationQueue =
        mutationQueue.then(
          async () => {

            const current =
              await loadFinoraCanonicalWalletAuthorityVault();

            if (!current) {

              result = {
                success:
                  false,

                errorCode:
                  "AUTHORITY_UNAVAILABLE",

                error:
                  "FINORA canonical Wallet Authority is unavailable.",
              };

              return;
            }

            if (
              !sameAuthorityScope(
                current,
                input,
              )
            ) {

              result = {
                success:
                  false,

                errorCode:
                  "AUTHORITY_SCOPE_MISMATCH",

                error:
                  "FINORA canonical Wallet Authority scope mismatch.",
              };

              return;
            }

            if (
              current.status ===
                "BLOCKED"
            ) {

              result = {
                success:
                  false,

                errorCode:
                  "AUTHORITY_BLOCKED",

                error:
                  "FINORA canonical Wallet Authority is blocked.",
              };

              return;
            }

            if (
              current.lastMutationId ===
                input.mutationId
            ) {

              result = {
                success:
                  false,

                errorCode:
                  "AUTHORITY_CONFLICT",

                error:
                  "FINORA canonical Wallet Authority mutation has already been committed.",
              };

              return;
            }
            if (
              current.status !==
                "ACTIVE"
            ) {

              result = {
                success:
                  false,

                errorCode:
                  "AUTHORITY_BLOCKED",

                error:
                  "FINORA canonical Wallet Authority continuation is required.",
              };

              return;
            }

            if (
              current.authorityGeneration !==
                input.expectedAuthorityGeneration ||
              current.spendCounter !==
                input.expectedSpendCounter ||
              current.headHash !==
                input.expectedHeadHash
            ) {

              result = {
                success:
                  false,

                errorCode:
                  "AUTHORITY_CONFLICT",

                error:
                  "FINORA canonical Wallet Authority state is stale or has already advanced.",
              };

              return;
            }

            if (
              !Number.isSafeInteger(
                input.amount,
              ) ||
              input.amount <=
                0
            ) {

              result = {
                success:
                  false,

                errorCode:
                  "INVALID_MUTATION",

                error:
                  "FINORA Wallet Authority mutation amount is invalid.",
              };

              return;
            }

            const nextBalance =
              input.mutationKind ===
                "DEBIT"
                ? current.authoritativeBalance -
                  input.amount
                : current.authoritativeBalance +
                  input.amount;

            if (
              !Number.isSafeInteger(
                nextBalance,
              ) ||
              nextBalance <
                0
            ) {

              result = {
                success:
                  false,

                errorCode:
                  "INVALID_MUTATION",

                error:
                  "FINORA Wallet Authority mutation would produce an invalid balance.",
              };

              return;
            }

            const nextSpendCounter =
              current.spendCounter +
              1;

            if (
              !Number.isSafeInteger(
                nextSpendCounter,
              )
            ) {

              result = {
                success:
                  false,

                errorCode:
                  "INVALID_MUTATION",

                error:
                  "FINORA Wallet Authority spend counter overflow.",
              };

              return;
            }

            const nextHeadHash =
              calculateAuthorityHeadHash({
                authorityId:
                  current.authorityId,

                walletId:
                  current.walletId,

                ownerId:
                  current.ownerId,

                businessId:
                  current.businessId,

                branchId:
                  current.branchId,

                authorityGeneration:
                  current.authorityGeneration,

                spendCounter:
                  nextSpendCounter,

                balance:
                  nextBalance,

                previousHeadHash:
                  current.headHash,

                mutationKind:
                  input.mutationKind,

                mutationId:
                  input.mutationId,

                occurredAt:
                  input.occurredAt,
              });

            const nextState:
              FinoraCanonicalWalletAuthorityState =
              {
                ...current,

                authoritativeBalance:
                  nextBalance,

                spendCounter:
                  nextSpendCounter,

                previousHeadHash:
                  current.headHash,

                lastMutationId:
                  input.mutationId,

                headHash:
                  nextHeadHash,

                updatedAt:
                  input.occurredAt,

                status:
                  "ACTIVE",

                schemaVersion:
                  1,
              };

            try {

              await replaceFinoraCanonicalWalletAuthorityVault(
                current,
                nextState,
              );

              result = {
                success:
                  true,

                data:
                  nextState,
              };

            }
            catch (error) {

              result = {
                success:
                  false,

                errorCode:
                  "AUTHORITY_UNAVAILABLE",

                error:
                  error instanceof Error
                    ? error.message
                    : "Unable to persist FINORA canonical Wallet Authority mutation.",
              };

            }
          },
          async () => {
            result = {
              success:
                false,

              errorCode:
                "AUTHORITY_UNAVAILABLE",

              error:
                "FINORA canonical Wallet Authority mutation queue failed.",
            };
          },
        );

      await mutationQueue;

      return result;
    },
  };
}

/* ============================================================
   TRUSTED INITIALIZATION
   ============================================================ */

/**
 * Trusted provisioning/migration code only.
 *
 * IMPORTANT:
 * This MUST NOT be called from:
 * - Full Branch Restore
 * - USB import
 * - renderer IPC
 * - generic application startup fallback
 *
 * A restored historical Wallet balance must never bootstrap a
 * new canonical authority automatically.
 */
/* ============================================================
   TRUSTED OPENING-BALANCE CANONICAL SEED
   ============================================================ */

/**
 * Trusted signed-control migration only.
 *
 * This is intentionally separate from fresh-wallet creation.
 *
 * Rules:
 * - Existing authority is never overwritten.
 * - USB is never read here.
 * - Backup is never used as authority.
 * - Caller must have already verified the signed package.
 */
export async function createOpeningBalanceFinoraCanonicalWalletAuthority(
  input: {
    ownerId:
      string;

    businessId:
      string;

    branchId:
      string;

    walletId:
      string;

    openingBalance:
      number;
  },
): Promise<FinoraCanonicalWalletAuthorityState> {

  if (
    !input.ownerId.trim() ||
    !input.businessId.trim() ||
    !input.branchId.trim() ||
    !input.walletId.trim()
  ) {
    throw new Error(
      "FINORA canonical Wallet Authority opening-balance scope is invalid.",
    );
  }

  if (
    !Number.isFinite(
      input.openingBalance,
    ) ||
    input.openingBalance < 0
  ) {
    throw new Error(
      "FINORA canonical Wallet Authority opening balance is invalid.",
    );
  }

  const existing =
    await loadFinoraCanonicalWalletAuthorityVault();

  if (existing) {
    throw new Error(
      "FINORA canonical Wallet Authority already exists. Opening-balance initialization is one-time only.",
    );
  }

  const now =
    new Date().toISOString();

  const authorityId =
    `FINORA-WALLET-AUTHORITY-${input.walletId}`;

  const authorityGeneration =
    1;

  const spendCounter =
    0;

  const previousHeadHash =
    "GENESIS";

  const authoritativeBalance =
    input.openingBalance;

  const headHash =
    calculateAuthorityHeadHash({
      authorityId,

      walletId:
        input.walletId,

      ownerId:
        input.ownerId,

      businessId:
        input.businessId,

      branchId:
        input.branchId,

      authorityGeneration,

      spendCounter,

      balance:
        authoritativeBalance,

      previousHeadHash,

      mutationKind:
        "RECHARGE",

      mutationId:
        "GENESIS",

      occurredAt:
        now,
    });

  const state:
    FinoraCanonicalWalletAuthorityState =
    {
      authorityId,

      walletId:
        input.walletId,

      ownerId:
        input.ownerId,

      businessId:
        input.businessId,

      branchId:
        input.branchId,

      authoritativeBalance,

      authorityGeneration,

      spendCounter,

      previousHeadHash:
        undefined,

      lastMutationId:
        undefined,

      pendingMutation:
        undefined,

      headHash,

      status:
        "ACTIVE",

      updatedAt:
        now,

      schemaVersion:
        1,
    };

  await persistNewFinoraCanonicalWalletAuthorityVault(
    state,
  );

  return state;
}

/* ============================================================
   FRESH WALLET INITIALIZATION
   ============================================================ */
export async function createInitialFinoraCanonicalWalletAuthority(
  input: {
    ownerId:
      string;

    businessId:
      string;

    branchId:
      string;

    walletId:
      string;
  },
): Promise<FinoraCanonicalWalletAuthorityState> {

  if (
    !input.ownerId.trim() ||
    !input.businessId.trim() ||
    !input.branchId.trim() ||
    !input.walletId.trim()
  ) {
    throw new Error(
      "FINORA canonical Wallet Authority initialization scope is invalid.",
    );
  }

  const existing =
    await loadFinoraCanonicalWalletAuthorityVault();

  if (existing) {

    if (
      existing.ownerId !==
        input.ownerId ||
      existing.businessId !==
        input.businessId ||
      existing.branchId !==
        input.branchId ||
      existing.walletId !==
        input.walletId
    ) {
      throw new Error(
        "FINORA canonical Wallet Authority already belongs to another Wallet scope.",
      );
    }

    return existing;
  }

  const now =
    new Date().toISOString();

  const authorityId =
    `FINORA-WALLET-AUTHORITY-${input.walletId}`;

  const previousHeadHash =
    "GENESIS";

  const authorityGeneration =
    1;

  const spendCounter =
    0;

  const authoritativeBalance =
    0;

  const headHash =
    calculateAuthorityHeadHash({
      authorityId,

      walletId:
        input.walletId,

      ownerId:
        input.ownerId,

      businessId:
        input.businessId,

      branchId:
        input.branchId,

      authorityGeneration,

      spendCounter,

      balance:
        authoritativeBalance,

      previousHeadHash,

      mutationKind:
        "RECHARGE",

      mutationId:
        "GENESIS",

      occurredAt:
        now,
    });

  const state:
    FinoraCanonicalWalletAuthorityState =
    {
      authorityId,

      walletId:
        input.walletId,

      ownerId:
        input.ownerId,

      businessId:
        input.businessId,

      branchId:
        input.branchId,

      authoritativeBalance,

      authorityGeneration,

      spendCounter,

      previousHeadHash:
        undefined,

      lastMutationId:
        undefined,

      pendingMutation:
        undefined,

      headHash,

      status:
        "ACTIVE",

      updatedAt:
        now,

      schemaVersion:
        1,
    };

  await persistNewFinoraCanonicalWalletAuthorityVault(
    state,
  );

  return state;
}

/**
 * Legacy low-level initializer retained for isolated trusted
 * tests and controlled migrations.
 *
 * Production fresh-wallet initialization must use
 * createInitialFinoraCanonicalWalletAuthority().
 */
export async function initializeFinoraCanonicalWalletAuthority(
  state:
    FinoraCanonicalWalletAuthorityState,
): Promise<void> {

  const existing =
    await loadFinoraCanonicalWalletAuthorityVault();

  if (existing) {
    throw new Error(
      "FINORA canonical Wallet Authority already exists.",
    );
  }

  await persistNewFinoraCanonicalWalletAuthorityVault(
    state,
  );
}




