// ============================================================
// FINORA ENTERPRISE OS™
//
// ENTERPRISE SETTINGS
// SETTINGS PHOTO PREVIEW
//
// RESPONSIBILITY:
//
// - Render one Settings photo preview
// - Display the photo position
// - Provide photo removal action
// - Keep preview presentation separate from upload logic
//
// IMPORTANT:
//
// - No inline styles.
// - No FileReader logic.
// - No theme values.
// - No responsive values.
// - No persistence.
// - No business logic.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

import {
  Trash2,
} from "lucide-react";

import type {
  SettingsPhotoPreviewProps,
} from "./SettingsPhotoField.types";

// ============================================================
// COMPONENT
// ============================================================

export default function SettingsPhotoPreview({
  photo,
  alt,
  index,
  disabled = false,
  onRemove,
}: SettingsPhotoPreviewProps) {

  return (
    <article className="finora-settings-photo-preview">
      <div className="finora-settings-photo-preview__image-frame">
        <img
          className="finora-settings-photo-preview__image"
          src={photo}
          alt={alt}
        />

        <span className="finora-settings-photo-preview__number">
          {index + 1}
        </span>
      </div>

      <button
        type="button"
        className="finora-settings-photo-preview__remove"
        disabled={disabled}
        aria-label={`Remove ${alt}`}
        onClick={() =>
          onRemove(
            index,
          )
        }
      >
        <Trash2
          className="finora-settings-photo-preview__remove-icon"
          aria-hidden="true"
        />

        <span className="finora-settings-photo-preview__remove-label">
          Remove
        </span>
      </button>
    </article>
  );
}

// ============================================================
// END
// ============================================================
