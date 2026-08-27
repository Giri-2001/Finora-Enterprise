// ============================================================
// FINORA ENTERPRISE V2
//
// RECEIPT STUDIO™
//
// HEADER
//
// RESPONSIBILITY
//
// - Render Receipt Studio header
// - Use shared StudioHeader
// - Inherit FINORA Theme Engine
// - Inherit shared responsive behavior
//
// IMPORTANT
//
// - No inline theme
// - No inline responsive logic
// - No local colour palette
// - No local breakpoint system
// - No business logic
//
// VERSION : 2.0
// STATUS  : Production
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import StudioHeader from "../../common/studio/StudioHeader";

// ============================================================
// COMPONENT
// ============================================================

export default function ReceiptHeader() {
  return (
    <StudioHeader
      title="Receipt Studio™"
      subtitle="Generate, preview and manage collection receipts."
    />
  );
}

// ============================================================
// END
// ============================================================