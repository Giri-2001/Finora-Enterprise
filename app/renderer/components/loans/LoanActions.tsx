import Button from "../ui/Button";

import type { Loan } from "./types";

type LoanActionsProps = {
  loan: Loan;

  onView?: (loan: Loan) => void;

  onEdit?: (loan: Loan) => void;

  onClose?: (loan: Loan) => void;
};

export default function LoanActions({
  loan,
  onView,
  onEdit,
  onClose,
}: LoanActionsProps) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 8,
        alignItems: "center",
      }}
    >
      {onView && (
        <Button type="button" size="small" onClick={() => onView(loan)}>
          View
        </Button>
      )}

      {onEdit && (
        <Button
          type="button"
          size="small"
          variant="secondary"
          onClick={() => onEdit(loan)}
        >
          Edit
        </Button>
      )}

      {onClose && (
        <Button
          type="button"
          size="small"
          variant="danger"
          onClick={() => onClose(loan)}
        >
          Close
        </Button>
      )}
    </div>
  );
}
