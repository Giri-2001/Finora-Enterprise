/* ===========================================================
   FINORA ENTERPRISE V2
   CUSTOMER REVIEW ACTIONS

   RESPONSIBILITY:
   - Review action presentation
   - Save customer action
   - Edit details action
   - Cancel action

   BUSINESS LOGIC:
   - NONE

   IMPORTANT:
   Action handlers are supplied by Step6Review.

   STYLES:
   ReviewActions.styles.ts
=========================================================== */

import {
  wrapperStyle,
  primaryButtonStyle,
  secondaryButtonStyle,
  dangerButtonStyle,
} from "./ReviewActions.styles";

/* ===========================================================
   TYPES
=========================================================== */

interface ReviewActionsProps {

  onSave?: () => void;

  onEdit?: () => void;

  onCancel?: () => void;

  isSaving?: boolean;

  disabled?: boolean;
}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function ReviewActions({

  onSave,

  onEdit,

  onCancel,

  isSaving = false,

  disabled = false,

}: ReviewActionsProps) {

  const actionsDisabled =
    disabled || isSaving;

  return (

    <div style={wrapperStyle}>

      {/* =====================================================
         SAVE
      ===================================================== */}

      <button

        type="button"

        style={primaryButtonStyle}

        onClick={onSave}

        disabled={actionsDisabled}

      >
        {isSaving
          ? "Saving Customer..."
          : "Save Customer"}

      </button>

      {/* =====================================================
         EDIT
      ===================================================== */}

      <button

        type="button"

        style={secondaryButtonStyle}

        onClick={onEdit}

        disabled={actionsDisabled}

      >
        Edit Details

      </button>

      {/* =====================================================
         CANCEL
      ===================================================== */}

      <button

        type="button"

        style={dangerButtonStyle}

        onClick={onCancel}

        disabled={actionsDisabled}

      >
        Cancel

      </button>

    </div>

  );

}
