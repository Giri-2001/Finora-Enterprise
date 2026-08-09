/* ===========================================================
   FINORA ENTERPRISE V2
   CUSTOMER RELATIONSHIP SELECTOR

   RESPONSIBILITY:

   - Nominee relationship selection
   - Relationship change events
   - Keep UI labels separate from persisted enum values
   - Normalize existing saved relationship values

   IMPORTANT:

   - CustomerProfile stores NomineeRelation enum values.
   - UI displays human-readable relationship labels.
   - Existing values such as "Brother" and "BROTHER"
     are both normalized correctly.

   STYLES:
   RelationshipSelector.styles.ts
=========================================================== */

import {
  NomineeRelation,
} from "../../../types/customers/customer.enums";

import {
  wrapperStyle,
  labelStyle,
  selectStyle,
  optionStyle,
  helperStyle,
} from "./RelationshipSelector.styles";


// ===========================================================
// RELATIONSHIP OPTIONS
//
// `value` is the persistent FINORA enum value.
// `label` is the human-readable UI value.
// ===========================================================

const relationships: Array<{
  value: NomineeRelation;
  label: string;
}> = [

  {
    value:
      NomineeRelation.FATHER,

    label:
      "Father",
  },

  {
    value:
      NomineeRelation.MOTHER,

    label:
      "Mother",
  },

  {
    value:
      NomineeRelation.BROTHER,

    label:
      "Brother",
  },

  {
    value:
      NomineeRelation.SISTER,

    label:
      "Sister",
  },

  {
    value:
      NomineeRelation.HUSBAND,

    label:
      "Husband",
  },

  {
    value:
      NomineeRelation.WIFE,

    label:
      "Wife",
  },

  {
    value:
      NomineeRelation.SON,

    label:
      "Son",
  },

  {
    value:
      NomineeRelation.DAUGHTER,

    label:
      "Daughter",
  },

  {
    value:
      NomineeRelation.UNCLE,

    label:
      "Uncle",
  },

  {
    value:
      NomineeRelation.AUNT,

    label:
      "Aunt",
  },

  {
    value:
      NomineeRelation.FRIEND,

    label:
      "Friend",
  },

  {
    value:
      NomineeRelation.OTHER,

    label:
      "Other",
  },

];


// ===========================================================
// TYPES
// ===========================================================

interface RelationshipSelectorProps {

  value:
    string;

  onChange:
    (
      value: string,
    ) => void;

}


// ===========================================================
// NORMALIZE RELATIONSHIP VALUE
//
// Handles both:
//
// BROTHER
// Brother
//
// This is important for existing draft/profile data.
// ===========================================================

function normalizeRelationshipValue(
  value: string,
): string {

  const normalized =
    value
      .trim()
      .toUpperCase();

  const matched =
    relationships.find(
      (relationship) =>
        relationship.value
          .toString()
          .toUpperCase() ===
        normalized,
    );

  if (matched) {

    return matched.value;

  }

  return "";

}


// ===========================================================
// COMPONENT
// ===========================================================

export default function RelationshipSelector({

  value,

  onChange,

}: RelationshipSelectorProps) {

  // =========================================================
  // NORMALIZED SELECT VALUE
  // =========================================================

  const normalizedValue =
    normalizeRelationshipValue(
      value,
    );


  // =========================================================
  // CHANGE HANDLER
  //
  // Always send the FINORA enum value upward.
  // =========================================================

  const handleChange =
    (
      nextValue: string,
    ): void => {

      onChange(
        nextValue,
      );

    };


  // =========================================================
  // RENDER
  // =========================================================

  return (

    <div
      style={
        wrapperStyle
      }
    >

      {/* =====================================================
         LABEL
      ===================================================== */}

      <label
        htmlFor="nominee-relationship"
        style={
          labelStyle
        }
      >
        Relationship
      </label>


      {/* =====================================================
         SELECT
      ===================================================== */}

      <select

        id="nominee-relationship"

        value={
          normalizedValue
        }

        style={
          selectStyle
        }

        onChange={
          (
            event,
          ) =>
            handleChange(
              event.target.value,
            )
        }

      >

        {/* ===================================================
           EMPTY / DEFAULT OPTION
        =================================================== */}

        <option
          value=""
          style={
            optionStyle
          }
        >
          Select Relationship
        </option>


        {/* ===================================================
           RELATIONSHIP OPTIONS
        =================================================== */}

        {relationships.map(
          (
            relationship,
          ) => (

            <option

              key={
                relationship.value
              }

              value={
                relationship.value
              }

              style={
                optionStyle
              }

            >

              {
                relationship.label
              }

            </option>

          ),
        )}

      </select>


      {/* =====================================================
         HELPER
      ===================================================== */}

      <div
        style={
          helperStyle
        }
      >
        Select the nominee's relationship with the customer.
      </div>

    </div>

  );

}


// ============================================================
// END
// ============================================================
