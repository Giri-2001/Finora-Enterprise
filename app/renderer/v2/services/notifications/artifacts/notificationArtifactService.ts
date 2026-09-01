// ============================================================
// FINORA ENTERPRISE OS
//
// NOTIFICATIONS ENGINE
// NOTIFICATION ARTIFACT SERVICE
//
// RESPONSIBILITY:
//
// - Provide one renderer-side boundary for durable Notification
//   artifact persistence.
// - Hide the Electron preload bridge from Customer/UI modules.
// - Preserve FINORA Owner / Business / Branch scope.
// - Support LOCAL and USB operational storage only.
//
// IMPORTANT:
//
// - No filesystem paths.
// - No provider credentials.
// - No artifact read API.
// - No artifact delete API.
// - No cloud storage.
// - No Notification record persistence.
// - Main process remains authoritative for PNG, size, Base64,
//   storage-root and integrity validation.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

/* ============================================================
   TYPES
============================================================ */

export type NotificationArtifactStorageMode =
  | "LOCAL"
  | "USB";

export type NotificationArtifactKind =
  | "CUSTOMER_ID_CARD";

export type NotificationArtifactMimeType =
  | "image/png";

export interface NotificationArtifactScope {
  ownerId: string;

  businessId: string;

  branchId: string;
}

export interface NotificationArtifactReference {
  artifactId: string;

  kind:
    NotificationArtifactKind;

  storageMode:
    NotificationArtifactStorageMode;

  mimeType:
    NotificationArtifactMimeType;

  fileName: string;

  byteLength: number;

  sha256: string;

  createdAt: string;

  scope:
    NotificationArtifactScope;

  schemaVersion: 1;
}

export interface SaveNotificationArtifactInput {
  artifactId: string;

  kind:
    NotificationArtifactKind;

  storageMode:
    NotificationArtifactStorageMode;

  mimeType:
    NotificationArtifactMimeType;

  fileName: string;

  contentBase64: string;

  scope:
    NotificationArtifactScope;
}

export type NotificationArtifactServiceResult<T> =
  | {
      success: true;

      data: T;
    }
  | {
      success: false;

      error: string;
    };

/* ============================================================
   HELPERS
============================================================ */

function failure<T = never>(
  error: string,
): NotificationArtifactServiceResult<T> {
  return {
    success: false,

    error,
  };
}

/* ============================================================
   SERVICE
============================================================ */

class NotificationArtifactService {

  async save(
    input:
      SaveNotificationArtifactInput,
  ): Promise<
    NotificationArtifactServiceResult<
      NotificationArtifactReference
    >
  > {
    const bridge =
      window.finora
        ?.notificationArtifacts;

    if (!bridge) {
      return failure(
        "FINORA Notification artifact bridge is unavailable.",
      );
    }

    try {
      const result =
        await bridge.save({
          artifactId:
            input.artifactId,

          kind:
            input.kind,

          storageMode:
            input.storageMode,

          mimeType:
            input.mimeType,

          fileName:
            input.fileName,

          contentBase64:
            input.contentBase64,

          scope: {
            ownerId:
              input.scope.ownerId,

            businessId:
              input.scope.businessId,

            branchId:
              input.scope.branchId,
          },
        });

      if (!result.success) {
        return failure(
          result.error ??
            "Unable to persist FINORA Notification artifact.",
        );
      }

      if (!result.data) {
        return failure(
          "FINORA Notification artifact save returned no durable reference.",
        );
      }

      return {
        success: true,

        data:
          result.data,
      };
    } catch (error) {
      return failure(
        error instanceof Error
          ? error.message
          : "Unable to persist FINORA Notification artifact.",
      );
    }
  }
}

/* ============================================================
   SINGLETON
============================================================ */

export const notificationArtifactService =
  new NotificationArtifactService();

/* ============================================================
   END
============================================================ */