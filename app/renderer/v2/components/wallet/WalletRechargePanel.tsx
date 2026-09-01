/* ============================================================
   FINORA ENTERPRISE OS™

   FINORA WALLET™

   WALLET RECHARGE PANEL

   RESPONSIBILITY:
   - Capture recharge amount
   - Capture recharge payment method
   - Emit recharge request to parent/controller
   - Presentation only

   IMPORTANT:
   - No payment provider execution.
   - No wallet balance mutation.
   - No persistence.
   - No payment verification.
============================================================ */

import {
  useMemo,
  useState,
} from "react";

import {
  CreditCard,
  IndianRupee,
  Smartphone,
  WalletCards,
} from "lucide-react";

import type {
  WalletRechargePaymentMethod,
} from "../../types/wallet/wallet.types";

import {
  useResponsive,
} from "../../utils/responsive";

import {
  createWalletRechargePanelStyles,
} from "./WalletRechargePanel.styles";

import {
  FINORA_WALLET_MAX_RECHARGE_AMOUNT,
  FINORA_WALLET_MIN_RECHARGE_AMOUNT,
} from "../../services/wallet/wallet.constants";

/* ============================================================
   TYPES
============================================================ */

export interface WalletRechargePanelSubmitInput {
  amount:
    number;

  paymentMethod:
    WalletRechargePaymentMethod;
}

export interface WalletRechargePanelProps {
  disabled?:
    boolean;

  submitting?:
    boolean;

  onSubmit:
    (
      input: WalletRechargePanelSubmitInput,
    ) => void | Promise<void>;
}

/* ============================================================
   PAYMENT METHODS
============================================================ */

interface WalletRechargeMethodOption {
  value:
    WalletRechargePaymentMethod;

  label:
    string;
}

const PAYMENT_METHODS:
  WalletRechargeMethodOption[] = [
    {
      value:
        "PHONEPE",

      label:
        "PhonePe",
    },

    {
      value:
        "GOOGLE_PAY",

      label:
        "GPay",
    },

    {
      value:
        "PAYTM",

      label:
        "Paytm",
    },

    {
      value:
        "UPI",

      label:
        "UPI",
    },
  ];

/* ============================================================
   COMPONENT
============================================================ */

export default function WalletRechargePanel({
  disabled = false,
  submitting = false,
  onSubmit,
}: WalletRechargePanelProps) {
  const {
    tokens,
  } = useResponsive();

  const styles =
    createWalletRechargePanelStyles(tokens);

  const [amountText, setAmountText] =
    useState("");

  const [
    paymentMethod,
    setPaymentMethod,
  ] = useState<WalletRechargePaymentMethod>(
    "UPI",
  );

  const amount =
    useMemo(
      () => Number(amountText),
      [amountText],
    );

  const amountIsValid =
    Number.isFinite(amount) &&
    amount >= FINORA_WALLET_MIN_RECHARGE_AMOUNT &&
    amount <= FINORA_WALLET_MAX_RECHARGE_AMOUNT;

  const canSubmit =
    !disabled &&
    !submitting &&
    amountIsValid;

  async function handleSubmit(): Promise<void> {
    if (!canSubmit) {
      return;
    }

    await onSubmit({
      amount,
      paymentMethod,
    });
  }

  return (
    <section style={styles.section}>
      <header style={styles.header}>
        <div style={styles.headingGroup}>
          <h2 style={styles.title}>
            <WalletCards
              size={tokens.icon.md}
              strokeWidth={2}
              aria-hidden="true"
            />

            Recharge FINORA Wallet
          </h2>

          <p style={styles.subtitle}>
            Add money only when needed. FINORA automatically
            deducts applicable platform charges from your
            available wallet balance.
          </p>
        </div>
      </header>

      <div style={styles.form}>
        <label style={styles.field}>
          <span style={styles.label}>
            Recharge Amount
          </span>

          <input
            type="number"
            inputMode="decimal"
            min={FINORA_WALLET_MIN_RECHARGE_AMOUNT}
            max={FINORA_WALLET_MAX_RECHARGE_AMOUNT}
            step="1"
            placeholder="Enter amount"
            value={amountText}
            disabled={disabled || submitting}
            onChange={(event) => {
              setAmountText(event.target.value);
            }}
            style={styles.input}
          />
        </label>

        <div style={styles.field}>
          <span style={styles.label}>
            Payment Method
          </span>

          <div style={styles.paymentGrid}>
            {PAYMENT_METHODS.map((method) => {
              const selected =
                paymentMethod === method.value;

              return (
                <button
                  key={method.value}
                  type="button"
                  disabled={disabled || submitting}
                  aria-pressed={selected}
                  onClick={() => {
                    setPaymentMethod(method.value);
                  }}
                  style={
                    selected
                      ? styles.paymentButtonSelected
                      : styles.paymentButton
                  }
                >
                  {method.value === "UPI" ? (
                    <IndianRupee
                      size={tokens.icon.sm}
                      strokeWidth={2}
                      aria-hidden="true"
                    />
                  ) : method.value === "PAYTM" ? (
                    <CreditCard
                      size={tokens.icon.sm}
                      strokeWidth={2}
                      aria-hidden="true"
                    />
                  ) : (
                    <Smartphone
                      size={tokens.icon.sm}
                      strokeWidth={2}
                      aria-hidden="true"
                    />
                  )}

                  {method.label}
                </button>
              );
            })}
          </div>
        </div>

        {amountText && !amountIsValid ? (
          <p style={styles.helper}>
            Enter an amount between ₹
            {FINORA_WALLET_MIN_RECHARGE_AMOUNT.toLocaleString(
              "en-IN",
            )}{" "}
            and ₹
            {FINORA_WALLET_MAX_RECHARGE_AMOUNT.toLocaleString(
              "en-IN",
            )}.
          </p>
        ) : null}

        <p style={styles.helper}>
          Wallet balance is credited only after successful
          payment verification.
        </p>

        <div style={styles.actions}>
          <button
            type="button"
            disabled={!canSubmit}
            onClick={() => {
              void handleSubmit();
            }}
            style={styles.rechargeButton}
          >
            <WalletCards
              size={tokens.icon.sm}
              strokeWidth={2}
              aria-hidden="true"
            />

            {submitting
              ? "Processing..."
              : "Recharge Wallet"}
          </button>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   END
============================================================ */


