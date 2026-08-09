/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER PHOTO UPLOADER™

   Reusable identity photo upload component.

   Responsibility:
   - File selection
   - Image preview
   - Remove photo
   - Presentation delegated to styles module
=========================================================== */

import type {
  ChangeEvent,
} from "react";

import {
  wrapperStyle,
  previewStyle,
  imageStyle,
  infoStyle,
  titleStyle,
  descriptionStyle,
  buttonRowStyle,
  buttonStyle,
  removeButtonStyle,
  hiddenInputStyle,
  emptyPhotoStyle,
} from "./CustomerPhotoUploader.styles";

/* ===========================================================
   TYPES
=========================================================== */

interface CustomerPhotoUploaderProps {

  imageUrl: string;

  onImageChange: (
    image: string,
  ) => void;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function CustomerPhotoUploader({

  imageUrl,

  onImageChange,

}: CustomerPhotoUploaderProps) {

  /* =========================================================
     FILE SELECTION
  ========================================================= */

  function handleFileSelect(
    event: ChangeEvent<HTMLInputElement>,
  ): void {

    const file =
      event.target.files?.[0];

    if (!file) {

      return;

    }

    const reader =
      new FileReader();

    reader.onload = () => {

      onImageChange(
        String(reader.result),
      );

    };

    reader.readAsDataURL(file);

  }

  /* =========================================================
     REMOVE PHOTO
  ========================================================= */

  function removePhoto(): void {

    onImageChange("");

  }

  /* =========================================================
     UI
  ========================================================= */

  return (

    <section
      style={wrapperStyle}
    >

      {/* ===================================================
          PHOTO PREVIEW
      =================================================== */}

      <div
        style={previewStyle}
      >

        {imageUrl ? (

          <img

            src={imageUrl}

            alt="Customer"

            style={imageStyle}

          />

        ) : (

          <span
            style={emptyPhotoStyle}
          >

            PHOTO

          </span>

        )}

      </div>

      {/* ===================================================
          PHOTO INFORMATION
      =================================================== */}

      <div
        style={infoStyle}
      >

        <p
          style={titleStyle}
        >

          Customer Photo

        </p>

        <p
          style={descriptionStyle}
        >

          Add the customer's photo.
          It will appear automatically
          on the FINORA identity card.

        </p>

        {/* ===============================================
            ACTIONS
        =============================================== */}

        <div
          style={buttonRowStyle}
        >

          <label
            style={buttonStyle}
          >

            Upload Photo

            <input

              hidden

              type="file"

              accept="image/*"

              style={
                hiddenInputStyle
              }

              onChange={
                handleFileSelect
              }

            />

          </label>

          {imageUrl && (

            <button

              type="button"

              style={
                removeButtonStyle
              }

              onClick={
                removePhoto
              }

            >

              Remove

            </button>

          )}

        </div>

      </div>

    </section>

  );

}
