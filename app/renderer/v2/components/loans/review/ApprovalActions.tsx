/* ===========================================================
FINORA ENTERPRISE V2
REVIEW STUDIO
APPROVAL ACTIONS
=========================================================== */

/* ===========================================================
IMPORTS
=========================================================== */

import {
  useState,
} from "react";

import Button from "../../common/buttons/Button";

import {
  accentStyle,
  actionButtonStyle,
  actionRowStyle,
  headerStyle,
  wrapperStyle,
} from "./ApprovalActions.styles";

/* ===========================================================
TYPES
=========================================================== */

interface ApprovalActionsProps {
  onSaveDraft: () => void;
  onApproveLoan: () => void | Promise<any>;
  onRejectLoan: () => void;
}

/* ===========================================================
COMPONENT
=========================================================== */

export default function ApprovalActions({
  onSaveDraft,
  onApproveLoan,
  onRejectLoan,
}: ApprovalActionsProps) {
  const [
    isApproving,
    setIsApproving,
  ] = useState(false);

  /* =========================================================
  APPROVE LOCK
  ========================================================= */

  const handleApproveLoan = async () => {
    if (isApproving) {
      return;
    }

    setIsApproving(true);

    try {
      await onApproveLoan();
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <section style={wrapperStyle}>

      {/* HEADER */}
      <div style={headerStyle}>
        <span style={accentStyle} />

        <span>
          Approval Actions
        </span>
      </div>

      {/* ACTIONS */}
      <div style={actionRowStyle}>

        <div style={actionButtonStyle}>
          <Button
            onClick={onSaveDraft}
          >
            Save Draft
          </Button>
        </div>

        <div style={actionButtonStyle}>
          <Button
            onClick={handleApproveLoan}
            disabled={isApproving}
          >
            {isApproving
              ? "Approving..."
              : "Approve Loan"}
          </Button>
        </div>

        <div style={actionButtonStyle}>
          <Button
            onClick={onRejectLoan}
            disabled={isApproving}
          >
            Reject Loan
          </Button>
        </div>

      </div>
    </section>
  );
}

/* ===========================================================
END
=========================================================== */
