// ============================================================
// FINORA ENTERPRISE OS™
//
// COLLECTIONS ENGINE
//
// RECEIPT DETAILS
//
// RESPONSIBILITY
//
// - Render receipt metadata fields
// - Connect receipt number to Collection Controller
// - Connect receipt date to Collection Controller
// - Render issued-by field
// - Connect remarks to Collection Controller
// - Consume dedicated Receipt Details styles
//
// IMPORTANT
//
// - No inline styles
// - No inline colour definitions
// - No inline responsive dimensions
// - No local theme system
// - No local breakpoint system
// - No business styling logic
//
// VERSION : 2.0
// STATUS  : Production
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import {
  FinoraCalendar,
  FormField,
  TextArea,
  TextInput,
} from "../../common";

import { useCollectionController } from "../controller";

import { receiptDetailsStyles } from "./ReceiptDetails.styles";

// ============================================================
// COMPONENT
// ============================================================

export default function ReceiptDetails() {
  // ==========================================================
  // COLLECTION CONTROLLER
  // ==========================================================

  const {
    reviewData,
    updateField,
  } = useCollectionController();

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div style={receiptDetailsStyles.wrapper}>
      {/* ======================================================
          RECEIPT NUMBER
      ====================================================== */}

      <FormField
        label="Receipt Number"
        required
      >
        <TextInput
          value={reviewData.receiptNumber}
          placeholder="Enter receipt number"
          onChange={(event) =>
            updateField(
              "receiptNumber",
              event.target.value,
            )
          }
        />
      </FormField>

      {/* ======================================================
          RECEIPT DATE
      ====================================================== */}

      <FormField
        label="Receipt Date"
        required
      >
        <FinoraCalendar
          value={reviewData.receiptDate}
          onChange={(nextDate) =>
            updateField(
              "receiptDate",
              nextDate,
            )
          }
          allowToday
          showRelativeDay
          placeholder="DD/MM/YYYY"
          ariaLabel="Receipt Date"
        />
      </FormField>

      {/* ======================================================
          ISSUED BY
      ====================================================== */}

      <FormField
        label="Issued By"
        required
      >
        <TextInput
          placeholder="Enter collector name"
        />
      </FormField>

      {/* ======================================================
          REMARKS
      ====================================================== */}

      <FormField label="Remarks">
        <TextArea
          value={reviewData.remarks}
          placeholder="Enter receipt remarks"
          onChange={(event) =>
            updateField(
              "remarks",
              event.target.value,
            )
          }
        />
      </FormField>
    </div>
  );
}

// ============================================================
// END
// ============================================================