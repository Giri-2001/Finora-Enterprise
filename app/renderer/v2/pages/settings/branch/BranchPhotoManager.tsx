// ============================================================
// FINORA ENTERPRISE OS™
//
// ENTERPRISE SETTINGS
// BRANCH PHOTO MANAGER
//
// RESPONSIBILITY:
//
// - Bind Branch office photos to the shared Settings Photo Field
// - Reuse the authoritative Branch photo-count limit
// - Keep Branch-specific photo labels outside shared components
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
  MAX_BRANCH_OFFICE_PHOTOS,
} from "../../../services/business/branchSettingsService";

import SettingsPhotoField from "../components/SettingsPhotoField";

import type {
  BranchPhotoManagerProps,
} from "./BranchPhotoManager.types";

// ============================================================
// COMPONENT
// ============================================================

export default function BranchPhotoManager({
  photos,
  disabled = false,
  onChange,
  onError,
}: BranchPhotoManagerProps) {

  return (
    <SettingsPhotoField
      label="Branch / Shop Photos"
      description="Add clear photos of the branch exterior, interior and working area for easy visual identification."
      photos={photos}
      maxPhotos={MAX_BRANCH_OFFICE_PHOTOS}
      photoAltPrefix="Branch photo"
      disabled={disabled}
      onChange={onChange}
      onError={onError}
    />
  );
}

// ============================================================
// END
// ============================================================
