// ============================================================
// FINORA ENTERPRISE OS™
//
// ENTERPRISE SETTINGS
// SETTINGS PHOTO READER
//
// RESPONSIBILITY:
//
// - Validate selected Settings image files
// - Read accepted images as FINORA Data URL strings
// - Centralize photo read errors
// - Keep FileReader logic outside React components
//
// IMPORTANT:
//
// - No React component.
// - No UI logic.
// - No styles.
// - No theme values.
// - No responsive values.
// - No persistence.
// - No repository access.
// - No StorageManager access.
//
// STORAGE REPRESENTATION:
//
// File
//   -> FileReader
//   -> Data URL string
//   -> Branch / Business Owner Settings domain
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

import type {
  SettingsPhotoValue,
} from "../components/SettingsPhotoField.types";

// ============================================================
// ACCEPTED MIME TYPES
// ============================================================

export const SETTINGS_PHOTO_ACCEPT =
  "image/jpeg,image/png,image/webp";

export const SETTINGS_PHOTO_MIME_TYPES:
  readonly string[] = [
    "image/jpeg",
    "image/png",
    "image/webp",
  ];

// ============================================================
// MIME VALIDATION
// ============================================================

export function isSupportedSettingsPhoto(
  file: File,
): boolean {

  return SETTINGS_PHOTO_MIME_TYPES
    .includes(
      file.type.toLowerCase(),
    );
}

// ============================================================
// READ PHOTO
// ============================================================

export function readSettingsPhoto(
  file: File,
): Promise<SettingsPhotoValue> {

  return new Promise(
    (resolve, reject) => {

      if (
        !isSupportedSettingsPhoto(
          file,
        )
      ) {
        reject(
          new Error(
            "Only JPG, PNG and WEBP images are supported.",
          ),
        );

        return;
      }

      const reader =
        new FileReader();

      reader.onload = () => {

        const result =
          reader.result;

        if (
          typeof result !== "string" ||
          !result.startsWith("data:image/")
        ) {
          reject(
            new Error(
              "The selected image could not be read.",
            ),
          );

          return;
        }

        resolve(
          result,
        );
      };

      reader.onerror = () => {

        reject(
          new Error(
            "The selected image could not be read.",
          ),
        );
      };

      reader.onabort = () => {

        reject(
          new Error(
            "Image selection was cancelled.",
          ),
        );
      };

      reader.readAsDataURL(
        file,
      );
    },
  );
}

// ============================================================
// ERROR MESSAGE
// ============================================================

export function getSettingsPhotoErrorMessage(
  error: unknown,
): string {

  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to process the selected image.";
}

// ============================================================
// END
// ============================================================
