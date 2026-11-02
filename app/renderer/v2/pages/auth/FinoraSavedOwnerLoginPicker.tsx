import { useState } from "react";

export type FinoraSavedOwnerAccount = {
  id: string;
  branchId: string;
  ownerId: string;
  username: string;
  branchLabel: string;
  savedAt: string;
};

type Props = {
  accounts: FinoraSavedOwnerAccount[];
  busy?: boolean;
  error?: string;
  onSelect: (id: string) => void | Promise<void>;
  onRemove: (id: string) => void | Promise<void>;
  onManual: () => void;
};

export default function FinoraSavedOwnerLoginPicker({
  accounts,
  busy = false,
  error,
  onSelect,
  onRemove,
  onManual,
}: Props) {
  const [removeId, setRemoveId] = useState<string | null>(null);

  const removing = accounts.find((item) => item.id === removeId);

  const fontFamily = "Inter, ui-sans-serif, system-ui, sans-serif";

  const buttonStyle: React.CSSProperties = {
    fontFamily,
    borderRadius: 10,
    padding: "9px 12px",
    border: "1px solid rgba(148,163,184,0.3)",
    background: "transparent",
    color: "inherit",
    cursor: busy ? "not-allowed" : "pointer",
  };

  return (
    <section
      aria-label="Saved FINORA Owner accounts"
      style={{
        fontFamily,
        width: "100%",
        padding: 14,
        borderRadius: 16,
        border: "1px solid rgba(148,163,184,0.25)",
        background: "rgba(15,23,42,0.08)",
        color: "inherit",
      }}
    >
      <div style={{ fontSize: 15, fontWeight: 650 }}>
        Saved Owner Logins
      </div>

      <p style={{ fontSize: 12, opacity: 0.7 }}>
        Select an Owner account to fill login details.
        Authentication remains required.
      </p>

      <div style={{ display: "grid", gap: 8 }}>
        {accounts.map((account) => (
          <div
            key={account.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: 9,
              minWidth: 0,
              borderRadius: 12,
              border: "1px solid rgba(148,163,184,0.2)",
            }}
          >
            <button
              type="button"
              disabled={busy}
              onClick={() => void onSelect(account.id)}
              style={{
                ...buttonStyle,
                flex: 1,
                border: "none",
                textAlign: "left",
                minWidth: 0,
              }}
            >

              <strong style={{ overflowWrap: "anywhere" }}>
                {account.branchLabel || account.branchId}
              </strong>
              <span
                style={{
                  display: "block",
                  fontSize: 14,
                  opacity: 0.7,
                  marginTop: 3,
                  overflowWrap: "anywhere",
                }}
              >
                {account.username}
              </span>
            </button>

            <button
              type="button"
              disabled={busy}
              onClick={() => setRemoveId(account.id)}
              style={buttonStyle}
              aria-label={"Remove saved " + account.username}
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      {error ? (
        <p role="alert" style={{ color: "#ef4444", fontSize: 12 }}>
          {error}
        </p>
      ) : null}

      {removing ? (
        <div
          role="group"
          aria-label="Confirm Remove Saved Login"
          style={{
            marginTop: 12,
            padding: 12,
            borderRadius: 12,
            border: "1px solid rgba(239,68,68,0.4)",
          }}
        >
          <strong>Remove saved login?</strong>
          <p style={{ fontSize: 12 }}>
            Remove saved credentials for {removing.username}?
            The Owner account and business data remain unchanged.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <button
              type="button"
              disabled={busy}
              style={buttonStyle}
              onClick={() => setRemoveId(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={busy}
              style={buttonStyle}
              onClick={() => {
                const id = removing.id;
                setRemoveId(null);
                void onRemove(id);
              }}
            >
              Confirm Remove
            </button>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        disabled={busy}
        onClick={onManual}
        style={{
          ...buttonStyle,
          width: "100%",
          marginTop: 12,
          fontWeight: 600,
        }}
      >
        + Use Another Account
      </button>
    </section>
  );
}