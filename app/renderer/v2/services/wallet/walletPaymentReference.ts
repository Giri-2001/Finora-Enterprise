/* ============================================================
   FINORA ENTERPRISE OS™

   V2 WALLET ENGINE™

   WALLET PAYMENT REFERENCE

   RESPONSIBILITY:
   - Generate unique Wallet recharge attempt references
   - Keep payment-attempt identity separate from Wallet identity
   - Provide provider-neutral payment references

   IMPORTANT:
   - No persistence.
   - No repositories.
   - No Wallet balance mutation.
   - No payment verification.
   - No gateway API calls.
   - This reference identifies a payment attempt only.
============================================================ */

/* ============================================================
   NORMALIZATION
============================================================ */

function normalizeReferencePart(
  value: string,
): string {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "")
    .slice(0, 24);
}

/* ============================================================
   RANDOM TOKEN
============================================================ */

function createRandomToken(): string {
  if (
    typeof globalThis.crypto !== "undefined" &&
    typeof globalThis.crypto.randomUUID === "function"
  ) {
    return globalThis.crypto
      .randomUUID()
      .replace(/-/g, "")
      .toUpperCase();
  }

  const timePart =
    Date.now()
      .toString(36)
      .toUpperCase();

  const randomPart =
    Math.random()
      .toString(36)
      .slice(2, 14)
      .toUpperCase();

  return `${timePart}${randomPart}`;
}

/* ============================================================
   BUILD PAYMENT REFERENCE
============================================================ */

export function buildWalletPaymentReference(input: {
  walletId:
    string;

  paymentMethod:
    string;
}): string {
  const walletPart =
    normalizeReferencePart(
      input.walletId,
    );

  const methodPart =
    normalizeReferencePart(
      input.paymentMethod,
    );

  const randomToken =
    createRandomToken();

  return [
    "FINORA",
    "WALLET",
    "PAY",
    walletPart || "WALLET",
    methodPart || "UPI",
    randomToken,
  ].join("-");
}

/* ============================================================
   END
============================================================ */
