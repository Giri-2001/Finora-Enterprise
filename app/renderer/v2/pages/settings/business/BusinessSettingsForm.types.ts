// ============================================================
// FINORA ENTERPRISE OS™
//
// ENTERPRISE SETTINGS
// BUSINESS SETTINGS FORM TYPES
//
// RESPONSIBILITY:
//
// - Define Business Settings Form component contracts
// - Define editable Business Settings field identities
// - Keep Business identity and operational settings typed
//
// IMPORTANT:
//
// - TYPES ONLY.
// - No React component.
// - No persistence.
// - No repository access.
// - No service calls.
// - No theme values.
// - No responsive values.
// - No inline styles.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

import type {
  BusinessIdentity,
} from "../../../types/business/business.identity.types";

import type {
  BusinessSettings,
} from "../../../types/business/business.settings.types";

// ============================================================
// EDITABLE FIELD
// ============================================================

export type BusinessSettingsEditableField =
  | "address"
  | "phone"
  | "email"
  | "gst"
  | "currency"
  | "timeZone";

// ============================================================
// PROPS
// ============================================================

export interface BusinessSettingsFormProps {
  identity:
    BusinessIdentity;

  settings:
    BusinessSettings;

  disabled?:
    boolean;

  saving?:
    boolean;

  onFieldChange:
    (
      field:
        BusinessSettingsEditableField,
      value:
        string,
    ) => void;

  onSubmit:
    () => void;
}

// ============================================================
// END
// ============================================================
