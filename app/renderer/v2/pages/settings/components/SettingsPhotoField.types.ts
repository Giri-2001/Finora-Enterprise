// ============================================================
// FINORA ENTERPRISE OS™
//
// ENTERPRISE SETTINGS
// SETTINGS PHOTO FIELD TYPES
//
// RESPONSIBILITY:
//
// - Define reusable Settings photo field contracts
// - Define accepted photo value representation
// - Define shared upload / preview component props
// - Keep Branch and Business Owner photo UI type-safe
//
// IMPORTANT:
//
// - TYPES ONLY.
// - Photo values use FINORA's existing Data URL string pattern.
// - No FileReader logic.
// - No React component.
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
// PHOTO VALUE
// ============================================================

export type SettingsPhotoValue =
  string;

// ============================================================
// PHOTO ITEM
// ============================================================

export interface SettingsPhotoItem {
  id:
    string;

  value:
    SettingsPhotoValue;

  alt:
    string;
}

// ============================================================
// PHOTO FIELD PROPS
// ============================================================

export interface SettingsPhotoFieldProps {
  label:
    string;

  description:
    string;

  photos:
    readonly SettingsPhotoValue[];

  maxPhotos:
    number;

  photoAltPrefix:
    string;

  disabled?:
    boolean;

  onChange:
    (
      photos:
        SettingsPhotoValue[],
    ) => void;

  onError?:
    (
      message:
        string,
    ) => void;
}

// ============================================================
// PHOTO PREVIEW PROPS
// ============================================================

export interface SettingsPhotoPreviewProps {
  photo:
    SettingsPhotoValue;

  alt:
    string;

  index:
    number;

  disabled?:
    boolean;

  onRemove:
    (
      index:
        number,
    ) => void;
}

// ============================================================
// END
// ============================================================
