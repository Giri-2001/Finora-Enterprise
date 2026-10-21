import { useState } from "react";
import type {
  FinoraServerPendingRechargeRecordView,
  FinoraServerRechargeDecisionInputView,
} from "../../../../electron/control-center/finoraControlCenterPreload";

interface Props {
  request: FinoraServerPendingRechargeRecordView;
  onCompleted: () => void;
}

export default function FinoraRechargePaymentReview({
  request,
  onCompleted,
}: Props) {
  const [reference, setReference] = useState("");
  const [verified, setVerified] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [completed, setCompleted] = useState(false);
  const [uncertain, setUncertain] = useState(false);

  const normalized = reference.trim().toUpperCase();
  const validReference = /^[A-Z0-9]{6,64}$/.test(normalized);

  async function approve() {
    if (busy || completed || uncertain ||
        !verified || !validReference ||
        request.status !== "PENDING") {
      return;
    }

    const bridge = window.finoraControlCenter;
    if (!bridge ||
        typeof bridge.decideServerWalletRecharge !== "function") {
      setError("Server approval bridge unavailable.");
      return;
    }

    const payload: FinoraServerRechargeDecisionInputView = {
      requestId: request.requestId,
      decision: "APPROVE",
      paymentVerified: true,
      paymentReference: normalized,
    };

    const confirmed = window.confirm(
      `FINORA RECHARGE APPROVAL\n\n` +
      `Owner: ${request.ownerName}\n` +
      `Branch: ${request.branchName}\n` +
      `Wallet: ${request.walletId}\n` +
      `Amount: INR ${request.amountInr}\n` +
      `Payment Reference: ${normalized}\n\n` +
      `Confirm only if the payment was independently ` +
      `verified in the receiving bank or payment provider. ` +
      `This action may CREDIT the real wallet when the ` +
      `production approval endpoint is enabled.`
    );

    if (!confirmed) return;

    setBusy(true);
    setError("");

    try {
      const response = await bridge.decideServerWalletRecharge(
        payload
      );

      if (!response.success) {
        const message = response.error ||
          "Recharge approval failed.";

        setError(message);

        // A timeout or ambiguous outcome must not create a new
        // payment reference or another recharge request.
        if (
          message.includes("OUTCOME_UNKNOWN") ||
          message.includes("SERVICE_UNAVAILABLE")
        ) {
          setUncertain(true);
        }
        return;
      }

      const result = response.data;

      if (result.request.requestId !== request.requestId ||
          result.request.walletId !== request.walletId ||
          Number(result.request.amountInr) !==
            Number(request.amountInr) ||
          result.request.status !== "APPROVED") {
        setUncertain(true);
        setError(
          "Server receipt mismatch. Do not resubmit; " +
          "investigate the original request."
        );
        return;
      }

      setCompleted(true);
      onCompleted();
    } catch {
      setUncertain(true);
      setError(
        "Approval outcome uncertain. Check original request " +
        "before retrying with the SAME reference."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{
      marginTop: 12,
      paddingTop: 12,
      borderTop: "1px solid rgba(148,163,184,.25)",
      display: "grid",
      gap: 10,
    }}>
      <strong>Payment verification</strong>
      <p style={{ fontSize: 12, margin: 0 }}>
        Manual operator attestation, not automatic UPI or
        bank verification.
      </p>

      <label style={{ display: "grid", gap: 5 }}>
        Verified bank/payment reference
        <input
          aria-label={`Payment reference ${request.requestId}`}
          value={reference}
          disabled={busy || completed || uncertain}
          maxLength={64}
          autoComplete="off"
          onChange={e => {
            setReference(e.target.value);
            setVerified(false);
          }}
          placeholder="Enter verified reference"
          style={{
            width: "100%",
            minWidth: 0,
            padding: 10,
            borderRadius: 8,
          }}
        />
      </label>

      <label style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 8,
        fontSize: 13,
      }}>
        <input
          type="checkbox"
          checked={verified}
          disabled={busy || completed || uncertain}
          onChange={e => setVerified(e.target.checked)}
        />
        I independently confirmed receipt of this exact
        amount in FINORA's receiving bank/payment account
        and matched the reference to this request.
      </label>

      <button
        type="button"
        disabled={
          busy || completed || uncertain ||
          !verified || !validReference
        }
        onClick={() => { void approve(); }}
        style={{
          padding: "10px 12px",
          borderRadius: 9,
          fontWeight: 700,
          cursor: busy ? "wait" : "pointer",
        }}
      >
        {completed
          ? "Approved — server confirmed"
          : busy
            ? "Submitting decision..."
            : "Review & Approve Recharge"}
      </button>

      {uncertain && (
        <p role="alert">
          Decision locked due to uncertain outcome.
          Refresh server requests and investigate before
          retrying the same decision.
        </p>
      )}

      {error && <p role="alert">{error}</p>}
    </div>
  );
}