// ============================================================
// FINORA ENTERPRISE OS™
//
// ENTERPRISE SETTINGS
// BUSINESS OWNER PHOTO MANAGER TYPES
//
// RESPONSIBILITY:
//
// - Define Business Owner Photo Manager component contracts
// - Keep Business Owner photo state type-safe
//
// IMPORTANT:
//
// - TYPES ONLY.
// - No React component.
// - No photo-count constants.
// - No FileReader logic.
// - No styles.
// - No theme values.
// - No responsive values.
// - No persistence.
// - No business logic.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

// ============================================================
// PROPS
// ============================================================

export interface BusinessOwnerPhotoManagerProps {
  photos:
    readonly string[];

  disabled?:
    boolean;

  onChange:
    (
      photos:
        string[],
    ) => void;

  onError?:
    (
      message:
        string,
    ) => void;
}

// ============================================================
// END
// ============================================================
