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

        gap: 8,
      }}
    >
      <Button type="button" onClick={() => onView?.(loan)}>
        View
      </Button>

      <Button type="button" onClick={() => onEdit?.(loan)}>
        Edit
      </Button>

      <Button type="button" onClick={() => onClose?.(loan)}>
        Close
      </Button>
    </div>
  );
}
