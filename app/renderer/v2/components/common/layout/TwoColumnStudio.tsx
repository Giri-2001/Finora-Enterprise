/* ===========================================================
   FINORA ENTERPRISE OS™

   REUSABLE TWO COLUMN STUDIO LAYOUT

   RESPONSIBILITY:
   - Reusable two-column presentation layout
   - Left workspace presentation
   - Right preview / intelligence presentation

   IMPORTANT:
   - No business logic
   - No module-specific styling
   - No scrolling inside columns
   - Parent decides the overall page height
=========================================================== */

import type {
  ReactNode,
} from "react";

import {
  containerStyle,
  leftStyle,
  rightStyle,
} from "./TwoColumnStudio.styles";

/* ===========================================================
   TYPES
=========================================================== */

interface TwoColumnStudioProps {
  left: ReactNode;

  right: ReactNode;
}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function TwoColumnStudio({
  left,
  right,
}: TwoColumnStudioProps) {

  return (
    <div style={containerStyle}>

      {/* =====================================================
         LEFT WORKSPACE
      ===================================================== */}

      <section style={leftStyle}>
        {left}
      </section>

      {/* =====================================================
         RIGHT INTELLIGENCE PANEL
      ===================================================== */}

      <aside style={rightStyle}>
        {right}
      </aside>

    </div>
  );
}
