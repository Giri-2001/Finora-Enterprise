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
  // FINORA_P1_744E2_DECLINE
  const [declineOpen, setDeclineOpen] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [declineNote, setDeclineNote] = useState("");

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

  async function submitDecline() {
    if (busy || completed || uncertain ||
        request.status !== "PENDING") return;

    const reason = [declineReason, declineNote.trim()]
      .filter(Boolean)
      .join(": ")
      .replace(/\s+/g, " ")
      .trim();

    if (!declineReason ||
        (declineReason === "Other reason" && !declineNote.trim()) ||
        !reason || reason.length > 1000) {
      setError("A valid decline reason is required.");
      return;
    }

    const bridge = window.finoraControlCenter;
    if (typeof bridge?.decideServerWalletRecharge !== "function") {
      setError("Secure server decision bridge unavailable.");
      return;
    }

    const confirmed = window.confirm(
      `DECLINE FINORA RECHARGE\n\n` +
      `Owner: ${request.ownerName}\n` +
      `Branch: ${request.branchName}\n` +
      `Amount: INR ${request.amountInr}\n` +
      `Reason: ${reason}\n\n` +
      `This decision will NOT credit the Wallet. Confirm?`
    );
    if (!confirmed) return;

    const payload: FinoraServerRechargeDecisionInputView = {
      requestId: request.requestId,
      decision: "DECLINE",
      reason,
    };

    setBusy(true);
    setError("");

    try {
      const response =
        await bridge.decideServerWalletRecharge(payload);

      if (!response.success) {
        const message = response.error || "Decline failed.";
        setError(message);

        if (message.includes("OUTCOME_UNKNOWN") ||
            message.includes("SERVICE_UNAVAILABLE")) {
          setUncertain(true);
        }
        return;
      }

      const result = response.data;

      if (
        result.request.requestId !== request.requestId ||
        result.request.walletId !== request.walletId ||
        Number(result.request.amountInr) !== Number(request.amountInr) ||
        result.request.status !== "DECLINED"
      ) {
        setUncertain(true);
        setError(
          "Decline receipt mismatch. Do not resubmit; investigate."
        );
        return;
      }

      setCompleted(true);
      setDeclineOpen(false);
      onCompleted();
    } catch {
      setUncertain(true);
      setError(
        "Decline outcome uncertain. Check server history before retrying."
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
          background: '#087b4e',
          color: '#ffffff',
          border: '1px solid #16a34a',
          minHeight: 42,
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

            {/* FINORA_P1_744E2_DECLINE_UI */}
      <button
        type="button"
        disabled={busy || completed || uncertain ||
          request.status !== "PENDING"}
        onClick={() => {
          setError("");
          setDeclineOpen(true);
        }}
        style={{
          background: "#ae2635",
          border: "1px solid #ef4444",
          borderRadius: 10,
          color: "#ffffff",
          padding: "11px 14px",
          minHeight: 42,
          fontWeight: 750,
          cursor: "pointer",
          opacity: busy || completed || uncertain ? 0.5 : 1,
        }}
      >
        Decline Recharge
      </button>

      {declineOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Decline Recharge Request"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10000,
            background: "rgba(2,6,23,.82)",
            display: "grid",
            placeItems: "center",
            padding: 16,
          }}
        >
          <div style={{
            width: "min(100%,460px)",
            maxHeight: "90vh",
            overflowY: "auto",
            background: "linear-gradient(145deg,#192941,#0f172a)",
            border: "1px solid rgba(248,113,113,.4)",
            boxShadow: "0 24px 70px rgba(0,0,0,.5)",
            borderRadius: 20,
            padding: 22,
            color: "#f8fafc",
            display: "grid",
            gap: 14,
          }}>
            <h3 style={{ margin: 0, color: "#fca5a5" }}>
              Decline Recharge Request
            </h3>
            <div style={{ fontSize: 13, color: "#cbd5e1" }}>
              {request.ownerName} / {request.branchName}
              <div>Amount: INR {request.amountInr}</div>
            </div>
            <label style={{ display: "grid", gap: 7 }}>
              <strong>Reason *</strong>
              <select
                value={declineReason}
                disabled={busy || uncertain}
                onChange={e => setDeclineReason(e.target.value)}
                style={{
                  padding: 11,
                  borderRadius: 10,
                  background: "#0f172a",
                  border: "1px solid #475569",
                  color: "#f8fafc",
                }}
              >
                <option value="">Select reason</option>
                <option value="Payment not received">
                  Payment not received
                </option>
                <option value="Invalid UTR or payment reference">
                  Invalid UTR or payment reference
                </option>
                <option value="Payment amount mismatch">
                  Payment amount mismatch
                </option>
                <option value="Duplicate recharge request">
                  Duplicate recharge request
                </option>
                <option value="Other reason">Other reason</option>
              </select>
            </label>
            <label style={{ display: "grid", gap: 7 }}>
              <strong>
                {declineReason === "Other reason"
                  ? "Explanation *"
                  : "Additional explanation"}
              </strong>
              <textarea
                rows={3}
                maxLength={850}
                value={declineNote}
                disabled={busy || uncertain}
                onChange={e => setDeclineNote(e.target.value)}
                placeholder="Explain why this payment was declined..."
                style={{
                  padding: 11,
                  borderRadius: 10,
                  background: "#0f172a",
                  border: "1px solid #475569",
                  color: "#f8fafc",
                }}
              />
            </label>

            <div style={{ fontSize: 12, color: "#fca5a5" }}>
              Decline will not credit the Wallet.
            </div>

            {error && <p role="alert" style={{ color: "#fca5a5" }}>
              {error}
            </p>}

            {uncertain && (
              <p role="alert" style={{ color: "#fca5a5" }}>
                Outcome uncertain. Investigate this request first.
              </p>
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                disabled={busy}
                onClick={() => setDeclineOpen(false)}
                style={{
                  flex: 1,
                  borderRadius: 10,
                  padding: 12,
                  background: "#334155",
                  color: "#ffffff",
                  border: 0,
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={
                  busy || uncertain || !declineReason ||
                  (declineReason === "Other reason" &&
                   !declineNote.trim()) ||
                  [declineReason, declineNote.trim()]
                    .filter(Boolean).join(": ").length > 1000
                }
                onClick={() => { void submitDecline(); }}
                style={{
                  flex: 1,
                  borderRadius: 10,
                  padding: 12,
                  background: "#b91c1c",
                  color: "#ffffff",
                  border: "1px solid #ef4444",
                  fontWeight: 800,
                }}
              >
                {busy ? "Submitting..." : "Confirm Decline"}
              </button>
            </div>
          </div>
        </div>
      )}
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