// ============================================================
// FINORA ENTERPRISE V2
//
// REVIEW STUDIO
// APPROVAL ACTIONS
//
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import { useState } from "react";

import Button from "../../common/buttons/Button";

import {
  accentStyle,
  actionButtonStyle,
  actionRowStyle,
  cancelButtonStyle,
  dialogActionsStyle,
  dialogBackdropStyle,
  dialogDescriptionStyle,
  dialogErrorStyle,
  dialogHeaderStyle,
  dialogPanelStyle,
  dialogTextareaStyle,
  dialogTitleStyle,
  headerStyle,
  rejectConfirmButtonStyle,
  wrapperStyle,
} from "./ApprovalActions.styles";

// ============================================================
// TYPES
// ============================================================

interface ApprovalActionsProps {
  onSaveDraft: () => void;

  onApproveLoan:
    () => void | Promise<unknown>;

  canRejectLoan: boolean;

  onRejectLoan:
    (
      rejectionReason: string,
    ) => void | Promise<void>;
}

// ============================================================
// COMPONENT
// ============================================================

export default function ApprovalActions({
  onSaveDraft,

  onApproveLoan,

  canRejectLoan,

  onRejectLoan,
}: ApprovalActionsProps) {
  const [
    isApproving,
    setIsApproving,
  ] = useState(false);

  const [
    rejectDialogOpen,
    setRejectDialogOpen,
  ] = useState(false);

  const [
    rejectionReason,
    setRejectionReason,
  ] = useState("");

  const [
    rejectionError,
    setRejectionError,
  ] = useState("");

  const [
    isRejecting,
    setIsRejecting,
  ] = useState(false);

  // ==========================================================
  // APPROVE LOCK
  // ==========================================================

  async function handleApproveLoan():
    Promise<void> {
    if (
      isApproving ||
      isRejecting
    ) {
      return;
    }

    setIsApproving(
      true,
    );

    try {
      await onApproveLoan();
    } finally {
      setIsApproving(
        false,
      );
    }
  }

  // ==========================================================
  // REJECT DIALOG
  // ==========================================================

  function handleOpenRejectDialog():
    void {
    if (
      !canRejectLoan ||
      isApproving ||
      isRejecting
    ) {
      return;
    }

    setRejectionError("");

    setRejectDialogOpen(
      true,
    );
  }

  function handleCloseRejectDialog():
    void {
    if (isRejecting) {
      return;
    }

    setRejectDialogOpen(
      false,
    );

    setRejectionReason("");

    setRejectionError("");
  }

  async function handleConfirmRejectLoan():
    Promise<void> {
    if (isRejecting) {
      return;
    }

    const normalizedReason =
      rejectionReason.trim();

    if (!normalizedReason) {
      setRejectionError(
        "Rejection reason is required.",
      );

      return;
    }

    setRejectionError("");

    setIsRejecting(
      true,
    );

    try {
      await onRejectLoan(
        normalizedReason,
      );

      setRejectDialogOpen(
        false,
      );

      setRejectionReason("");
    } finally {
      setIsRejecting(
        false,
      );
    }
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <section style={wrapperStyle}>
      <div style={headerStyle}>
        <span style={accentStyle} />

        <span>
          Approval Actions
        </span>
      </div>

      <div style={actionRowStyle}>
        <div style={actionButtonStyle}>
          <Button
            onClick={onSaveDraft}
            disabled={
              isApproving ||
              isRejecting
            }
          >
            Save Draft
          </Button>
        </div>

        <div style={actionButtonStyle}>
          <Button
            onClick={() => {
              void handleApproveLoan();
            }}
            disabled={
              isApproving ||
              isRejecting
            }
          >
            {isApproving
              ? "Approving..."
              : "Approve Loan"}
          </Button>
        </div>

        <div style={actionButtonStyle}>
          <Button
            variant="danger"
            onClick={
              handleOpenRejectDialog
            }
            disabled={
              !canRejectLoan ||
              isApproving ||
              isRejecting
            }
            title={
              canRejectLoan
                ? "Reject this pending Loan Application"
                : "Only a Pending transaction can be rejected"
            }
          >
            Reject Loan
          </Button>
        </div>
      </div>

      {rejectDialogOpen ? (
        <div
          style={dialogBackdropStyle}
          role="presentation"
          onClick={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              handleCloseRejectDialog();
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="finora-reject-loan-title"
            style={dialogPanelStyle}
          >
            <div style={dialogHeaderStyle}>
              <h2
                id="finora-reject-loan-title"
                style={dialogTitleStyle}
              >
                Reject Loan Application
              </h2>
            </div>

            <p style={dialogDescriptionStyle}>
              Enter the reason for rejection. The complete application and uploaded documents will be archived for future reopening.
            </p>

            <textarea
              value={rejectionReason}
              onChange={(event) => {
                setRejectionReason(
                  event.target.value,
                );

                if (rejectionError) {
                  setRejectionError("");
                }
              }}
              placeholder="Enter rejection reason"
              rows={4}
              autoFocus={true}
              disabled={isRejecting}
              style={dialogTextareaStyle}
            />

            {rejectionError ? (
              <div style={dialogErrorStyle}>
                {rejectionError}
              </div>
            ) : null}

            <div style={dialogActionsStyle}>
              <button
                type="button"
                onClick={
                  handleCloseRejectDialog
                }
                disabled={isRejecting}
                style={{
                  ...cancelButtonStyle,

                  opacity:
                    isRejecting
                      ? 0.55
                      : 1,
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => {
                  void handleConfirmRejectLoan();
                }}
                disabled={isRejecting}
                style={{
                  ...rejectConfirmButtonStyle,

                  opacity:
                    isRejecting
                      ? 0.6
                      : 1,

                  cursor:
                    isRejecting
                      ? "default"
                      : "pointer",
                }}
              >
                {isRejecting
                  ? "Archiving..."
                  : "Reject & Archive"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}

// ============================================================
// END
// ============================================================