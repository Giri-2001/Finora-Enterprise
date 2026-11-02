/*
 * FINORA C76-R3
 *
 * Trigger only AFTER a confirmed committed server debit.
 * Do not call for local debit, pending result, uncertain
 * transaction outcome, or an unverified success popup.
 */

export interface FinoraConfirmedServerDebit {
  success: true;
  operationId: string;
  committed: true;
}

export function refreshFinoraWalletAfterConfirmedDebit(
  result: FinoraConfirmedServerDebit,
): boolean {
  if (
    result?.success !== true ||
    result.committed !== true ||
    typeof result.operationId !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      result.operationId,
    )
  ) {
    return false;
  }

  window.dispatchEvent(
    new Event("finora:verified-wallet-balance-refresh"),
  );

  window.dispatchEvent(
    new Event("finora:wallet-history-refresh"),
  );

  return true;
}