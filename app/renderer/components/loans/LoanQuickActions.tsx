import type { ReactNode } from "react";

import Button from "../ui/Button";

export type LoanQuickAction = {
  id: string;
  label: string;
  icon?: ReactNode;
  variant?: "primary" | "secondary" | "danger";
  onClick: () => void;
};

type LoanQuickActionsProps = {
  actions: LoanQuickAction[];
};

export default function LoanQuickActions({ actions }: LoanQuickActionsProps) {
  if (actions.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 12,
        marginBottom: 24,
      }}
    >
      {actions.map((action) => (
        <Button
          key={action.id}
          type="button"
          variant={action.variant ?? "primary"}
          onClick={action.onClick}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            {action.icon}
            <span>{action.label}</span>
          </span>
        </Button>
      ))}
    </div>
  );
}
