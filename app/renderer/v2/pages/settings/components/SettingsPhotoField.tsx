// ============================================================
// FINORA ENTERPRISE OS™
//
// ENTERPRISE SETTINGS
// SETTINGS PHOTO FIELD
//
// RESPONSIBILITY:
//
// - Render reusable multi-photo Settings field
// - Handle image file selection
// - Enforce UI photo-count limits
// - Read photos through Settings Photo Reader
// - Render individual photo previews
// - Support photo removal
//
// IMPORTANT:
//
// - No inline styles.
// - No direct FileReader usage.
// - No theme values.
// - No responsive values.
// - No persistence.
// - No repository access.
// - Authoritative photo limits remain enforced by services.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

import type {
  ChangeEvent,
} from "react";

import {
  ImagePlus,
} from "lucide-react";

import {
  getSettingsPhotoErrorMessage,
  readSettingsPhoto,
  SETTINGS_PHOTO_ACCEPT,
} from "../utils/settingsPhotoReader";

import type {
  SettingsPhotoFieldProps,
  SettingsPhotoValue,
} from "./SettingsPhotoField.types";

import SettingsPhotoPreview from "./SettingsPhotoPreview";

// ============================================================
// COMPONENT
// ============================================================

export default function SettingsPhotoField({
  label,
  description,
  photos,
  maxPhotos,
  photoAltPrefix,
  disabled = false,
  onChange,
  onError,
}: SettingsPhotoFieldProps) {

  const remainingSlots =
    Math.max(
      0,
      maxPhotos - photos.length,
    );

  const limitReached =
    remainingSlots === 0;

  // ==========================================================
  // ERROR
  // ==========================================================

  function reportError(
    message: string,
  ): void {

    onError?.(
      message,
    );
  }

  // ==========================================================
  // FILE SELECTION
  // ==========================================================

  async function handleFileSelect(
    event: ChangeEvent<HTMLInputElement>,
  ): Promise<void> {

    const input =
      event.currentTarget;

    const files =
      Array.from(
        input.files ?? [],
      );

    /*
     * Allow the same file to be selected again later.
     */
    input.value = "";

    if (
      disabled ||
      files.length === 0
    ) {
      return;
    }

    if (limitReached) {
      reportError(
        `A maximum of ${maxPhotos} photos is allowed.`,
      );

      return;
    }

    const selectedFiles =
      files.slice(
        0,
        remainingSlots,
      );

    if (
      files.length >
      remainingSlots
    ) {
      reportError(
        `Only ${remainingSlots} more photo${remainingSlots === 1 ? "" : "s"} can be added.`,
      );
    }

    const nextPhotos:
      SettingsPhotoValue[] = [
        ...photos,
      ];

    for (
      const file of selectedFiles
    ) {
      try {
        const photo =
          await readSettingsPhoto(
            file,
          );

        if (
          !nextPhotos.includes(
            photo,
          )
        ) {
          nextPhotos.push(
            photo,
          );
        }
      } catch (error) {
        reportError(
          getSettingsPhotoErrorMessage(
            error,
          ),
        );
      }
    }

    if (
      nextPhotos.length !==
      photos.length
    ) {
      onChange(
        nextPhotos,
      );
    }
  }

  // ==========================================================
  // REMOVE
  // ==========================================================

  function handleRemove(
    index: number,
  ): void {

    if (disabled) {
      return;
    }

    onChange(
      photos.filter(
        (_photo, photoIndex) =>
          photoIndex !== index,
      ),
    );
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <section className="finora-settings-photo-field">
      <div className="finora-settings-photo-field__header">
        <div className="finora-settings-photo-field__heading">
          <h3 className="finora-settings-photo-field__title">
            {label}
          </h3>

          <p className="finora-settings-photo-field__description">
            {description}
          </p>
        </div>

        <span className="finora-settings-photo-field__count">
          {photos.length} / {maxPhotos}
        </span>
      </div>

      {photos.length > 0 && (
        <div className="finora-settings-photo-field__grid">
          {photos.map(
            (
              photo,
              index,
            ) => (
              <SettingsPhotoPreview
                key={`${index}-${photo.slice(0, 32)}`}
                photo={photo}
                alt={`${photoAltPrefix} ${index + 1}`}
                index={index}
                disabled={disabled}
                onRemove={handleRemove}
              />
            ),
          )}
        </div>
      )}

      <div className="finora-settings-photo-field__actions">
        <label
          className={[
            "finora-settings-photo-field__upload",

            disabled || limitReached
              ? "finora-settings-photo-field__upload--disabled"
              : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <ImagePlus
            className="finora-settings-photo-field__upload-icon"
            aria-hidden="true"
          />

          <span className="finora-settings-photo-field__upload-label">
            {limitReached
              ? "Photo Limit Reached"
              : photos.length > 0
                ? "Add Photo"
                : "Upload Photos"}
          </span>

          <input
            className="finora-settings-photo-field__input"
            type="file"
            accept={SETTINGS_PHOTO_ACCEPT}
            multiple
            disabled={
              disabled ||
              limitReached
            }
            onChange={
              (event) =>
                void handleFileSelect(
                  event,
                )
            }
          />
        </label>

        <span className="finora-settings-photo-field__helper">
          JPG, PNG or WEBP • Up to {maxPhotos} photos
        </span>
      </div>
    </section>
  );
}

// ============================================================
// END
// ============================================================
