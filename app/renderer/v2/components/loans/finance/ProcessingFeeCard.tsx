// ============================================================
// FINORA ENTERPRISE V2
//
// FINANCE STUDIO
// PROCESSING FEE CARD
//
// RESPONSIBILITY:
// - Configure processing fee
// - Keep processing fee controlled by LoanStudio
// - Presentation / input responsibility only
//
// IMPORTANT:
// - No calculation logic
// - No persistence
// - No service access
// - No local state
//
// BUSINESS RULE:
// - Processing Fee is a real loan charge.
// - It is deducted from disbursement.
// - It is NOT deducted from total customer repayment.
// - Advance Deduction is intentionally NOT handled here.
// ============================================================


// ============================================================
// IMPORTS
// ============================================================

import {
  FormField,
  TextInput,
} from "../../common";


import {
  accentStyle,
  contentStyle,
  fieldContentStyle,
  fieldStyle,
  headerStyle,
  wrapperStyle,
} from "./ProcessingFeeCard.styles";


// ============================================================
// TYPES
// ============================================================

interface ProcessingFeeCardProps {

  processingFee: string;

  onProcessingFeeChange: (
    value: string,
  ) => void;

}


// ============================================================
// COMPONENT
// ============================================================

export default function ProcessingFeeCard({

  processingFee,

  onProcessingFeeChange,

}: ProcessingFeeCardProps) {

  return (

    <div
      style={
        wrapperStyle
      }
    >


      {/* ==================================================
          HEADER
      ================================================== */}

      <div
        style={
          headerStyle
        }
      >

        <span
          style={
            accentStyle
          }
        />


        <span>
          Processing Fee
        </span>

      </div>


      {/* ==================================================
          CONTENT
      ================================================== */}

      <div
        style={
          contentStyle
        }
      >


        {/* ==================================================
            PROCESSING FEE
        ================================================== */}

        <div
          style={
            fieldStyle
          }
        >

          <div
            style={
              fieldContentStyle
            }
          >

            <FormField
              label="Processing Fee (₹)"
            >

              <TextInput

                type="number"

                value={
                  processingFee
                }

                onChange={(
                  event,
                ) =>
                  onProcessingFeeChange(
                    event.target.value,
                  )
                }

                placeholder="Enter processing fee"

              />

            </FormField>

          </div>

        </div>


      </div>

    </div>
  );
}


// ============================================================
// END
// ============================================================
