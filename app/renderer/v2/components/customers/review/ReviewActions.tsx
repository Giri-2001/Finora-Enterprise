/* ===========================================================
   FINORA ENTERPRISE V2

   CUSTOMER REVIEW ACTIONS

   RESPONSIBILITY:
   - Review action presentation
   - Save customer action
   - Edit details action
   - Cancel action
   - Premium review-action header presentation

   BUSINESS LOGIC:
   - NONE

   IMPORTANT:
   - Action handlers are supplied by Step6Review.
   - Existing save/edit/cancel flow is preserved.
   - Theme colours come only from FINORA Theme Engine.
   - Responsive geometry comes only from Responsive Engine.

   STYLES:
   ReviewActions.styles.ts
=========================================================== */


/* ===========================================================
   IMPORTS
=========================================================== */

import {
  ClipboardCheck,
  Pencil,
  Save,
  XCircle,
  LoaderCircle,
} from "lucide-react";


/* ===========================================================
   RESPONSIVE ENGINE
=========================================================== */

import {
  useResponsive,
} from "../../../utils/responsive";


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
  createReviewActionsStyles,
} from "./ReviewActions.styles";


/* ===========================================================
   TYPES
=========================================================== */

interface ReviewActionsProps {

  onSave?:
    () => void;

  onEdit?:
    () => void;

  onCancel?:
    () => void;

  isSaving?:
    boolean;

  disabled?:
    boolean;
}


/* ===========================================================
   COMPONENT
=========================================================== */

export default function ReviewActions({

  onSave,

  onEdit,

  onCancel,

  isSaving =
    false,

  disabled =
    false,

}: ReviewActionsProps) {


  /* =========================================================
     RESPONSIVE ENGINE
  ========================================================= */

  const {
    tokens,
  } =
    useResponsive();


  /* =========================================================
     THEME ENGINE
  ========================================================= */

  const {
    theme,
  } =
    useTheme();


  /* =========================================================
     THEME + RESPONSIVE STYLES
  ========================================================= */

  const styles =
    createReviewActionsStyles(
      tokens,
      theme,
    );


  /* =========================================================
     ACTION STATE
  ========================================================= */

  const actionsDisabled =
    disabled ||
    isSaving;


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
            size={
              tokens.icon.lg
            }
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

            Customer Review Actions

          </h3>


          <p
            style={
              styles.subtitleStyle
            }
          >

            Choose the next action for this customer profile.

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
         ACTION BUTTONS
      ===================================================== */}

      <div
        style={
          styles.actionListStyle
        }
      >

        {/* ===================================================
           SAVE CUSTOMER
        =================================================== */}

        <button
          type="button"
          style={
            styles.primaryButtonStyle
          }
          onClick={
            onSave
          }
          disabled={
            actionsDisabled
          }
        >

          {
            isSaving
              ? (
                <LoaderCircle
                  size={
                    tokens.icon.sm
                  }
                  strokeWidth={2}
                />
              )
              : (
                <Save
                  size={
                    tokens.icon.sm
                  }
                  strokeWidth={1.9}
                />
              )
          }

          <span>

            {
              isSaving
                ? "Saving Customer..."
                : "Save Customer"
            }

          </span>

        </button>


        {/* ===================================================
           EDIT DETAILS
        =================================================== */}

        <button
          type="button"
          style={
            styles.secondaryButtonStyle
          }
          onClick={
            onEdit
          }
          disabled={
            actionsDisabled
          }
        >

          <Pencil
            size={
              tokens.icon.sm
            }
            strokeWidth={1.9}
          />

          <span>
            Edit Details
          </span>

        </button>


        {/* ===================================================
           CANCEL
        =================================================== */}

        <button
          type="button"
          style={
            styles.dangerButtonStyle
          }
          onClick={
            onCancel
          }
          disabled={
            actionsDisabled
          }
        >

          <XCircle
            size={
              tokens.icon.sm
            }
            strokeWidth={1.9}
          />

          <span>
            Cancel
          </span>

        </button>

      </div>

    </section>

  );

}


/* ===========================================================
   END
=========================================================== */