/* ===========================================================
   FINORA ENTERPRISE OS™

   CONTROL CENTER
   WALLET RECHARGE FORM

   RESPONSIBILITY:

   - Collect Wallet Recharge renderer-editable draft values
   - Preserve shared Control Center target authority
   - Capture user-facing INR major-unit amount
   - Capture payment method / payment source evidence
   - Capture optional provider evidence
   - Forward a prepared draft to the parent workspace

   IMPORTANT:

   - Currency is fixed to INR.
   - amountMinor is derived by the pure payload builder.
   - walletId is not part of the signed Recharge payload.
   - packageId is not renderer authority.
   - sequence is not renderer authority.
   - root issuedAt is not renderer authority.
   - Signing remains inside privileged Control Center main process.
=========================================================== */

import {
  useState,
} from "react";

import type {
  FinoraControlCenterTargetDraft,
  FinoraWalletPaymentSourceDraft,
  FinoraWalletRechargeFormDraft,
  FinoraWalletRechargePaymentMethodDraft,
} from "./FinoraControlCenterIssuanceForm.types";

/* ============================================================
   PROPS
============================================================ */

export interface FinoraControlCenterWalletRechargeFormProps {
  target:
    FinoraControlCenterTargetDraft;

  onIssue?:
    (
      draft:
        FinoraWalletRechargeFormDraft,
    ) => void;
}

/* ============================================================
   OPTIONS
============================================================ */

interface PaymentMethodOption {
  value:
    FinoraWalletRechargePaymentMethodDraft;

  label:
    string;
}

interface PaymentSourceOption {
  value:
    FinoraWalletPaymentSourceDraft;

  label:
    string;
}

const PAYMENT_METHOD_OPTIONS:
  PaymentMethodOption[] = [
    {
      value:
        "UPI",

      label:
        "UPI",
    },
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
        "Google Pay",
    },
    {
      value:
        "PAYTM",

      label:
        "Paytm",
    },
    {
      value:
        "RAZORPAY",

      label:
        "Razorpay",
    },
    {
      value:
        "BANK_TRANSFER",

      label:
        "Bank Transfer",
    },
    {
      value:
        "OTHER",

      label:
        "Other",
    },
  ];

const PAYMENT_SOURCE_OPTIONS:
  PaymentSourceOption[] = [
    {
      value:
        "UPI",

      label:
        "UPI",
    },
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
        "Google Pay",
    },
    {
      value:
        "PAYTM",

      label:
        "Paytm",
    },
    {
      value:
        "RAZORPAY",

      label:
        "Razorpay",
    },
    {
      value:
        "BANK_TRANSFER",

      label:
        "Bank Transfer",
    },
    {
      value:
        "MANUAL",

      label:
        "Manual",
    },
  ];

/* ============================================================
   COMPONENT
============================================================ */

export function FinoraControlCenterWalletRechargeForm({
  target,
  onIssue,
}: FinoraControlCenterWalletRechargeFormProps) {

  const [
    paymentReference,
    setPaymentReference,
  ] =
    useState(
      "",
    );

  const [
    amount,
    setAmount,
  ] =
    useState(
      "",
    );

  const [
    paymentMethod,
    setPaymentMethod,
  ] =
    useState<
      FinoraWalletRechargePaymentMethodDraft
    >(
      "UPI",
    );

  const [
    paymentSource,
    setPaymentSource,
  ] =
    useState<
      FinoraWalletPaymentSourceDraft
    >(
      "UPI",
    );

  const [
    providerOrderId,
    setProviderOrderId,
  ] =
    useState(
      "",
    );

  const [
    providerTransactionId,
    setProviderTransactionId,
  ] =
    useState(
      "",
    );

  const fieldStyle = {
    display:
      "grid",

    gap:
      "6px",
  } as const;

  const labelStyle = {
    fontSize:
      "11px",

    fontWeight:
      600,

    opacity:
      0.76,
  } as const;

  const controlStyle = {
    width:
      "100%",

    boxSizing:
      "border-box",

    border:
      "1px solid rgba(148, 163, 184, 0.24)",

    borderRadius:
      "8px",

    padding:
      "10px 11px",

    font:
      "inherit",

    fontSize:
      "12px",

    color:
      "inherit",

    background:
      "rgba(2, 6, 23, 0.38)",

    outline:
      "none",
  } as const;

  return (
    <section
      data-finora-control-center-wallet-recharge-form="true"
      style={{
        marginTop:
          "20px",

        borderTop:
          "1px solid rgba(148, 163, 184, 0.18)",

        paddingTop:
          "20px",
      }}
    >
      <div
        style={{
          display:
            "flex",

          alignItems:
            "flex-start",

          justifyContent:
            "space-between",

          gap:
            "16px",

          marginBottom:
            "18px",

          flexWrap:
            "wrap",
        }}
      >
        <div>
          <h3
            style={{
              margin:
                0,

              fontSize:
                "15px",

              fontWeight:
                650,
            }}
          >
            Wallet Recharge
          </h3>

          <p
            style={{
              margin:
                "6px 0 0",

              maxWidth:
                "720px",

              fontSize:
                "12px",

              lineHeight:
                1.55,

              opacity:
                0.66,
            }}
          >
            Prepare one signed Wallet Recharge authorization for
            this exact Owner / Business / Branch / Installation
            target and external payment reference.
          </p>
        </div>

        <div
          style={{
            border:
              "1px solid rgba(148, 163, 184, 0.2)",

            borderRadius:
              "9px",

            padding:
              "8px 10px",

            fontSize:
              "11px",

            lineHeight:
              1.5,

            background:
              "rgba(2, 6, 23, 0.34)",
          }}
        >
          <div>
            Purpose: <strong>WALLET_RECHARGE</strong>
          </div>

          <div>
            Currency: <strong>INR</strong>
          </div>

          <div>
            Signed Amount: <strong>Minor Units</strong>
          </div>
        </div>
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();

          onIssue?.({
            target,

            paymentReference,

            amount,

            paymentMethod,

            paymentSource,

            providerOrderId,

            providerTransactionId,
          });
        }}
      >
        <div
          style={{
            display:
              "grid",

            gridTemplateColumns:
              "repeat(auto-fit, minmax(240px, 1fr))",

            gap:
              "12px",
          }}
        >
          <label
            style={fieldStyle}
          >
            <span
              style={labelStyle}
            >
              Payment Reference
            </span>

            <input
              type="text"
              value={paymentReference}
              onChange={(event) => {
                setPaymentReference(
                  event.target.value,
                );
              }}
              placeholder="WALLET-PAYMENT-REFERENCE-001"
              autoComplete="off"
              style={controlStyle}
            />
          </label>

          <label
            style={fieldStyle}
          >
            <span
              style={labelStyle}
            >
              Amount (INR)
            </span>

            <input
              type="number"
              inputMode="decimal"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(event) => {
                setAmount(
                  event.target.value,
                );
              }}
              placeholder="1000.00"
              autoComplete="off"
              style={controlStyle}
            />
          </label>

          <label
            style={fieldStyle}
          >
            <span
              style={labelStyle}
            >
              Payment Method
            </span>

            <select
              value={paymentMethod}
              onChange={(event) => {
                setPaymentMethod(
                  event.target.value as
                    FinoraWalletRechargePaymentMethodDraft,
                );
              }}
              style={controlStyle}
            >
              {PAYMENT_METHOD_OPTIONS.map(
                (option) => (
                  <option
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                ),
              )}
            </select>
          </label>

          <label
            style={fieldStyle}
          >
            <span
              style={labelStyle}
            >
              Payment Source
            </span>

            <select
              value={paymentSource}
              onChange={(event) => {
                setPaymentSource(
                  event.target.value as
                    FinoraWalletPaymentSourceDraft,
                );
              }}
              style={controlStyle}
            >
              {PAYMENT_SOURCE_OPTIONS.map(
                (option) => (
                  <option
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                ),
              )}
            </select>
          </label>

          <label
            style={fieldStyle}
          >
            <span
              style={labelStyle}
            >
              Provider Order ID
            </span>

            <input
              type="text"
              value={providerOrderId}
              onChange={(event) => {
                setProviderOrderId(
                  event.target.value,
                );
              }}
              placeholder="Optional"
              autoComplete="off"
              style={controlStyle}
            />
          </label>

          <label
            style={fieldStyle}
          >
            <span
              style={labelStyle}
            >
              Provider Transaction ID
            </span>

            <input
              type="text"
              value={providerTransactionId}
              onChange={(event) => {
                setProviderTransactionId(
                  event.target.value,
                );
              }}
              placeholder="Optional"
              autoComplete="off"
              style={controlStyle}
            />
          </label>
        </div>

        <p
          style={{
            margin:
              "12px 0 0",

            fontSize:
              "11px",

            lineHeight:
              1.5,

            opacity:
              0.58,
          }}
        >
          Amount is entered in INR. The payload builder converts
          the exact decimal value to signed INR minor units.
          Provider identifiers are optional and are omitted when
          blank.
        </p>

        {onIssue && (
          <div
            style={{
              display:
                "flex",

              justifyContent:
                "flex-end",

              marginTop:
                "18px",
            }}
          >
            <button
              type="submit"
              style={{
                border:
                  "1px solid rgba(74, 222, 128, 0.38)",

                borderRadius:
                  "9px",

                padding:
                  "10px 14px",

                font:
                  "inherit",

                fontSize:
                  "12px",

                fontWeight:
                  650,

                cursor:
                  "pointer",

                color:
                  "#bbf7d0",

                background:
                  "rgba(22, 101, 52, 0.16)",
              }}
            >
              Prepare Wallet Recharge Issuance
            </button>
          </div>
        )}
      </form>
    </section>
  );
}

/* ============================================================
   END
============================================================ */