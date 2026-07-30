import type { ReactNode } from "react";

import Button from "../ui/Button";

type LoanPageHeaderProps = {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  actions?: ReactNode;
};

export default function LoanPageHeader({
  title,
  subtitle,
  actionLabel,
  onAction,
  actions,
}: LoanPageHeaderProps) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 20,
        marginBottom: 24,
      }}
    >
      <div>
        <h1
          style={{
            margin: 0,
            fontSize: 30,
            fontWeight: 800,
            color: "var(--text)",
          }}
        >
          {title}
        </h1>

        {subtitle && (
          <p
            style={{
              marginTop: 8,
              marginBottom: 0,
              color: "var(--text-muted)",
              fontSize: 15,
              lineHeight: 1.6,
            }}
          >
            {subtitle}
          </p>
        )}
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          alignItems: "center",
        }}
      >
        {actions}

        {onAction && actionLabel && (
          <Button type="button" onClick={onAction}>
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
