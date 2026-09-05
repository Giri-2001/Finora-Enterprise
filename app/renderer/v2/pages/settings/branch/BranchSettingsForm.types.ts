// ============================================================
// FINORA ENTERPRISE OS™
//
// ENTERPRISE SETTINGS
// BRANCH SETTINGS FORM TYPES
//
// RESPONSIBILITY:
//
// - Define Branch Settings Form component contracts
// - Define editable Branch Settings text fields
// - Keep active branch identity and operational settings typed
// - Keep branch photo updates type-safe
//
// IMPORTANT:
//
// - TYPES ONLY.
// - No React component.
// - No persistence.
// - No repository access.
// - No service calls.
// - No photo-count constants.
// - No theme values.
// - No responsive values.
// - No inline styles.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

import type {
  FinoraProvisionedBusinessProfileV1,
} from "../../../types/business/finoraBusinessProfileControl.types";

import type {
  BranchSettings,
} from "../../../types/business/branch.settings.types";

// ============================================================
// EDITABLE TEXT FIELD
// ============================================================

export type BranchSettingsEditableField =
  | "address"
  | "phone"
  | "email";

// ============================================================
// PROPS
// ============================================================

export interface BranchSettingsFormProps {
  identity:
    FinoraProvisionedBusinessProfileV1;

  settings:
    BranchSettings;

  disabled?:
    boolean;

  saving?:
    boolean;

  onFieldChange:
    (
      field:
        BranchSettingsEditableField,
      value:
        string,
    ) => void;

  onPhotosChange:
    (
      photos:
        string[],
    ) => void;

  onPhotoError?:
    (
      message:
        string,
    ) => void;

  onSubmit:
    () => void;
}

// ============================================================
// END
// ============================================================
