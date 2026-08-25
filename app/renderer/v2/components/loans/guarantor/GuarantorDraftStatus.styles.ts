// ============================================================

// FINORA ENTERPRISE V2

//

// GUARANTOR STUDIO

// GUARANTOR DRAFT STATUS STYLES

//

// RESPONSIBILITY:

// - GuarantorDraftStatus presentation wrapper only

// - Guarantor-specific spacing and layout

// - FINORA Enterprise theme compatibility

//

// THEME:

// - No local colour palette
// - No hard-coded theme colours
// - The inner Draft Status card owns the visible
//   theme surface and consumes the FINORA Theme Engine
//

// DESIGN:

// - Minimum font-size: 12px

// - Font weights: 500–750

//

// ============================================================

import type { CSSProperties } from "react";

// ============================================================

// CARD WRAPPER

// ============================================================

export const cardStyle: CSSProperties = {

  width: "100%",

  minWidth: 0,

  boxSizing: "border-box",

  overflow: "hidden",

};

// ============================================================

// STATUS WRAPPER

//

// IMPORTANT:

// - No border

// - No radius

// - No shadow

//

// The inner Draft Status card already provides the visual

// card surface. Keeping this wrapper neutral prevents the

// appearance of two nested cards.

// ============================================================

export const statusStyle: CSSProperties = {

  width: "100%",

  minWidth: 0,

  boxSizing: "border-box",

  padding: 0,

  border: "none",

  borderRadius: 0,

  background: "transparent",

  boxShadow: "none",

  overflow: "hidden",

};

// ============================================================

// END

// ============================================================