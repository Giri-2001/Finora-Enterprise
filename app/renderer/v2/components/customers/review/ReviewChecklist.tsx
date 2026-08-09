/* ===========================================================
   FINORA ENTERPRISE V2
   CUSTOMER REVIEW CHECKLIST

   RESPONSIBILITY:
   - Review checklist presentation
   - Completion status presentation

   BUSINESS LOGIC:
   - NONE

   IMPORTANT:
   Completion values are supplied by Step6Review.
   This component must never assume that every step
   is completed.

   STYLES:
   ReviewChecklist.styles.ts
=========================================================== */

import {
  cardStyle,
  headerStyle,
  titleStyle,
  subtitleStyle,
  dividerStyle,
  itemStyle,
  itemLabelStyle,
  completeStyle,
  pendingStyle,
} from "./ReviewChecklist.styles";

/* ===========================================================
   TYPES
=========================================================== */

export interface ReviewChecklistItem {

  label: string;

  completed: boolean;
}

interface ReviewChecklistProps {

  items?: ReviewChecklistItem[];
}

/* ===========================================================
   CHECKLIST ITEM
=========================================================== */

function ChecklistItem({

  label,

  completed,

}: ReviewChecklistItem) {

  return (

    <div style={itemStyle}>

      <span style={itemLabelStyle}>
        {label}
      </span>

      <strong
        style={
          completed
            ? completeStyle
            : pendingStyle
        }
      >
        {completed
          ? "✓ Complete"
          : "● Pending"}
      </strong>

    </div>

  );

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function ReviewChecklist({

  items = [],

}: ReviewChecklistProps) {

  return (

    <section style={cardStyle}>

      {/* =====================================================
         HEADER
      ===================================================== */}

      <div style={headerStyle}>

        <div>

          <h3 style={titleStyle}>
            Review Checklist
          </h3>

          <p style={subtitleStyle}>
            Final readiness checklist before customer creation.
          </p>

        </div>

      </div>

      {/* =====================================================
         DIVIDER
      ===================================================== */}

      <div style={dividerStyle} />

      {/* =====================================================
         CHECKLIST
      ===================================================== */}

      <div>

        {items.map((item) => (

          <ChecklistItem
            key={item.label}
            label={item.label}
            completed={item.completed}
          />

        ))}

      </div>

    </section>

  );

}
