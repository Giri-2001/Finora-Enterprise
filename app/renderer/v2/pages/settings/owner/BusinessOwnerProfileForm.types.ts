// ============================================================
// FINORA ENTERPRISE OS™
//
// ENTERPRISE SETTINGS
// BUSINESS OWNER PROFILE FORM TYPES
//
// RESPONSIBILITY:
//
// - Define Business Owner Profile Form contracts
// - Keep authenticated user identity read-only
// - Define editable owner profile text fields
// - Keep Business Owner photo updates type-safe
//
// IMPORTANT:
//
// - TYPES ONLY.
// - No React component.
// - No persistence.
// - No repository access.
// - No service calls.
// - No password field.
// - No username duplication in BusinessOwnerProfile.
// - No photo-count constants.
// - No theme values.
// - No responsive values.
// - No inline styles.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

import type {
  AuthSession,
} from "../../../components/auth/types";

import type {
  BusinessOwnerProfile,
} from "../../../types/business/business.owner.profile.types";

// ============================================================
// EDITABLE TEXT FIELD
// ============================================================

export type BusinessOwnerProfileEditableField =
  | "phone"
  | "email";

// ============================================================
// PROPS
// ============================================================

export interface BusinessOwnerProfileFormProps {
  session:
    AuthSession;

  profile:
    BusinessOwnerProfile;

  disabled?:
    boolean;

  saving?:
    boolean;

  onFieldChange:
    (
      field:
        BusinessOwnerProfileEditableField,
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
