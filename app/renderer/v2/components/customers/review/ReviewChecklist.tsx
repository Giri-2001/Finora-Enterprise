/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER REVIEW CHECKLIST

   RESPONSIBILITY:
   - Review checklist presentation
   - Completion status presentation
   - Theme-aware visual presentation

   BUSINESS LOGIC:
   - NONE

   IMPORTANT:
   - Completion values are supplied by Step6Review.
   - This component never assumes that every step
     is completed.
   - No inline theme colours are used.
=========================================================== */

/* ===========================================================
   IMPORTS
=========================================================== */

import {
  ClipboardCheck,
  CheckCircle2,
  Circle,
} from "lucide-react";


/* ===========================================================
   THEME ENGINE
=========================================================== */

import {
  useTheme,
} from "../../../themes/provider";


/* ===========================================================
   PRESENTATION STYLES
=========================================================== */

import {
  createReviewChecklistStyles,
} from "./ReviewChecklist.styles";


/* ===========================================================
   TYPES
=========================================================== */

export interface ReviewChecklistItem {

  label:
    string;

  completed:
    boolean;
}


interface ReviewChecklistProps {

  items?:
    ReviewChecklistItem[];

}


/* ===========================================================
   CHECKLIST ITEM
=========================================================== */

function ChecklistItem({

  label,

  completed,

  styles,

}: ReviewChecklistItem & {

  styles:
    ReturnType<
      typeof createReviewChecklistStyles
    >;

}) {

  return (

    <div
      style={
        styles.itemStyle
      }
    >

      {/* =====================================================
         STATUS ICON
      ===================================================== */}

      <span
        style={
          styles.itemIconStyle
        }
        aria-hidden="true"
      >

        {
          completed
            ? (
                <CheckCircle2
                  size={15}
                  strokeWidth={1.9}
                />
              )
            : (
                <Circle
                  size={15}
                  strokeWidth={1.9}
                />
              )
        }

      </span>


      {/* =====================================================
         ITEM LABEL
      ===================================================== */}

      <span
        style={
          styles.itemLabelStyle
        }
      >

        {label}

      </span>


      {/* =====================================================
         STATUS
      ===================================================== */}

      <strong
  style={
    {
      ...styles.statusStyle,
      ...(completed
        ? styles.completeStyle
        : styles.pendingStyle),
    }
  }
>

  <span
    style={
      styles.statusIndicatorStyle
    }
    aria-hidden="true"
  >

    {
      completed
        ? "✓"
        : "●"
    }

  </span>

  <span>

    {
      completed
        ? "Complete"
        : "Pending"
    }

  </span>

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


  /* =========================================================
     THEME ENGINE
  ========================================================= */

  const {
    theme,
  } = useTheme();


  /* =========================================================
     THEME-AWARE STYLES
  ========================================================= */

  const styles =
    createReviewChecklistStyles(
      theme,
    );


  /* =========================================================
     RENDER
  ========================================================= */

  return (

    <section
      style={
        styles.cardStyle
      }
    >

      {/* =====================================================
         HEADER
      ===================================================== */}

      <div
        style={
          styles.headerStyle
        }
      >

        {/* ===================================================
           HEADER ICON
        =================================================== */}

        <span
          style={
            styles.headerIconStyle
          }
          aria-hidden="true"
        >

          <ClipboardCheck
            size={25}
            strokeWidth={1.8}
          />

        </span>


        {/* ===================================================
           HEADER TEXT
        =================================================== */}

        <div
          style={
            styles.headerTextStyle
          }
        >

          <h3
            style={
              styles.titleStyle
            }
          >

            Review Checklist

          </h3>


          <p
            style={
              styles.subtitleStyle
            }
          >

            Final readiness checklist before customer creation.

          </p>

        </div>

      </div>


      {/* =====================================================
         DIVIDER
      ===================================================== */}

      <div
        style={
          styles.dividerStyle
        }
      />


      {/* =====================================================
         CHECKLIST
      ===================================================== */}

      <div>

        {
          items.map(
            (item) => (

              <ChecklistItem
                key={
                  item.label
                }
                label={
                  item.label
                }
                completed={
                  item.completed
                }
                styles={
                  styles
                }
              />

            ),
          )
        }

      </div>

    </section>

  );

}


/* ===========================================================
   END
=========================================================== */