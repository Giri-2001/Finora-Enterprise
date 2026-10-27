import { useState } from "react";
import FinoraControlCenterIncomePricingPanel from "./FinoraControlCenterIncomePricingPanel";

export default function FinoraControlCenterHeaderPrices() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        data-finora-header-action="prices"
        onClick={() => setOpen(true)}
        style={{
          minHeight: 40,
          padding: "8px 12px",
          borderRadius: 10,
          border: "1px solid rgba(251,191,36,.48)",
          background: "rgba(146,64,14,.26)",
          color: "#fef3c7",
          fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
          fontSize: 13,
          fontWeight: 700,
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
      >
        FINORA Prices
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="FINORA Prices"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10000,
            overflowY: "auto",
            padding: 20,
            boxSizing: "border-box",
            background: "#0f172a",
          }}
        >
          <FinoraControlCenterIncomePricingPanel
            onClose={() => setOpen(false)}
          />
        </div>
      )}
    </>
  );
}