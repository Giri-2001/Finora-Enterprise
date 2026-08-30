// ============================================================
// FINORA ENTERPRISE OS™
//
// ENTERPRISE SETTINGS
// BUSINESS IDENTITY SETUP FORM TYPES
//
// RESPONSIBILITY:
//
// - Define the first-time Business Identity setup form contract
// - Keep editable identity-name fields explicit
// - Keep the presentational form independent from services
//
// IMPORTANT:
//
// - TYPES ONLY.
// - No React state.
// - No persistence.
// - No authentication logic.
// - No theme values.
// - No responsive values.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

import type {
  BusinessIdentity,
} from "../../../types/business/business.identity.types";

// ============================================================
// EDITABLE FIELD
// ============================================================

export type BusinessIdentitySetupEditableField =
  | "businessName"
  | "branchName";

// ============================================================
// PROPS
// ============================================================

export interface BusinessIdentitySetupFormProps {

  identity:
    BusinessIdentity;

  disabled?:
    boolean;

  saving?:
    boolean;

  onFieldChange(
    field:
      BusinessIdentitySetupEditableField,
    value:
      string,
  ): void;

  onSubmit():
    void;
}

// ============================================================
// END
// ============================================================
