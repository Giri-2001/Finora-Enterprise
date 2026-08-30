// ============================================================
// FINORA ENTERPRISE OS™
//
// ENTERPRISE SETTINGS
// BUSINESS OWNER PHOTO MANAGER
//
// RESPONSIBILITY:
//
// - Bind Business Owner photos to the shared Settings Photo Field
// - Reuse the authoritative Business Owner photo-count limit
// - Keep Owner-specific photo labels outside shared components
//
// IMPORTANT:
//
// - No inline styles.
// - No FileReader logic.
// - No duplicated photo-count value.
// - No theme values.
// - No responsive values.
// - No persistence.
// - No repository access.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

import {
  MAX_BUSINESS_OWNER_PHOTOS,
} from "../../../services/business/businessOwnerProfileService";

import SettingsPhotoField from "../components/SettingsPhotoField";

import type {
  BusinessOwnerPhotoManagerProps,
} from "./BusinessOwnerPhotoManager.types";

// ============================================================
// COMPONENT
// ============================================================

export default function BusinessOwnerPhotoManager({
  photos,
  disabled = false,
  onChange,
  onError,
}: BusinessOwnerPhotoManagerProps) {

  return (
    <SettingsPhotoField
      label="Business Owner Photos"
      description="Add clear Business Owner identification photos for quick visual verification inside FINORA."
      photos={photos}
      maxPhotos={MAX_BUSINESS_OWNER_PHOTOS}
      photoAltPrefix="Business Owner photo"
      disabled={disabled}
      onChange={onChange}
      onError={onError}
    />
  );
}

// ============================================================
// END
// ============================================================
