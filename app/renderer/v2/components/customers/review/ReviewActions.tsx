/* ===========================================================
   FINORA ENTERPRISE V2
   REVIEW ACTIONS
--------------------------------------------------------------
Customer Review Actions
=========================================================== */

import type { CSSProperties } from "react";

/* ===========================================================
   TYPES
=========================================================== */

interface ReviewActionsProps {

  onSave?: () => void;

  onEdit?: () => void;

  onCancel?: () => void;

}

/* ===========================================================
   STYLES
=========================================================== */

const wrapperStyle: CSSProperties = {

  display: "flex",

  gap: "12px",

  flexWrap: "wrap",

  marginTop: "24px",

};

const buttonStyle: CSSProperties = {

  padding: "12px 18px",

  borderRadius: "12px",

  border: "1px solid #d1d5db",

  background: "#ffffff",

  cursor: "pointer",

  fontWeight: 600,

};

/* ===========================================================
   COMPONENT
=========================================================== */

export default function ReviewActions({

  onSave,

  onEdit,

  onCancel,

}: ReviewActionsProps) {

  return (

    <div style={wrapperStyle}>

      <button

        style={buttonStyle}

        type="button"

        onClick={onSave}

      >

        💾 Save Customer

      </button>

      <button

        style={buttonStyle}

        type="button"

        onClick={onEdit}

      >

        ✏ Edit Details

      </button>

      <button

        style={buttonStyle}

        type="button"

        onClick={onCancel}

      >

        ❌ Cancel

      </button>

    </div>

  );

}
