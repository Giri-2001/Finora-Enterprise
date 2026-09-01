// ============================================================
// FINORA ENTERPRISE OS
//
// NOTIFICATIONS ENGINE
// NOTIFICATION ARTIFACT CONTRACT
//
// RESPONSIBILITY:
//
// - Define vendor-neutral durable Notification media artifacts.
// - Keep renderer away from arbitrary filesystem paths.
// - Keep artifact identity scoped to Owner / Business / Branch.
// - Support LOCAL and USB operational storage only.
// - Allow privileged providers to resolve the same durable
//   artifact for repeated delivery attempts.
//
// IMPORTANT:
//
// - No provider credentials.
// - No filesystem access.
// - No Electron IPC.
// - No React.
// - No cloud storage.
// - No arbitrary renderer-controlled path.
// - Base64 payload is accepted only at the privileged save
//   boundary and is NOT persisted inside Notification records.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

/* ============================================================
   STORAGE MODE
============================================================ */

export type FinoraNotificationArtifactStorageMode =
  | "LOCAL"
  | "USB";

/* ============================================================
   ARTIFACT KIND
============================================================ */

export type FinoraNotificationArtifactKind =
  | "CUSTOMER_ID_CARD";

/* ============================================================
   MIME TYPE
============================================================ */

export type FinoraNotificationArtifactMimeType =
  | "image/png";

/* ============================================================
   SCOPE
============================================================ */

export interface FinoraNotificationArtifactScope {
  ownerId: string;

  businessId: string;

  branchId: string;
}

/* ============================================================
   DURABLE REFERENCE

   This small reference may safely be persisted with a logical
   Notification record.

   No filesystem path is exposed or persisted here.
============================================================ */

export interface FinoraNotificationArtifactReference {
  artifactId: string;

  kind:
    FinoraNotificationArtifactKind;

  storageMode:
    FinoraNotificationArtifactStorageMode;

  mimeType:
    FinoraNotificationArtifactMimeType;

  fileName: string;

  byteLength: number;

  sha256: string;

  createdAt: string;

  scope:
    FinoraNotificationArtifactScope;

  schemaVersion: 1;
}

/* ============================================================
   SAVE REQUEST

   contentBase64 crosses the renderer -> privileged boundary
   only while the canonical artifact is being persisted.

   The main process owns the physical storage destination.
============================================================ */

export interface FinoraNotificationArtifactSaveRequest {
  artifactId: string;

  kind:
    FinoraNotificationArtifactKind;

  storageMode:
    FinoraNotificationArtifactStorageMode;

  mimeType:
    FinoraNotificationArtifactMimeType;

  fileName: string;

  contentBase64: string;

  scope:
    FinoraNotificationArtifactScope;
}

/* ============================================================
   PRIVILEGED ARTIFACT PAYLOAD

   Used only inside the main-process artifact store/provider
   execution boundary.

   Renderer does not require a public read-bytes operation.
============================================================ */

export interface FinoraNotificationArtifactPayload {
  reference:
    FinoraNotificationArtifactReference;

  contentBase64: string;
}

/* ============================================================
   RESULT
============================================================ */

export type FinoraNotificationArtifactResult<T> =
  | {
      success: true;

      data: T;
    }
  | {
      success: false;

      error: string;
    };

/* ============================================================
   END
============================================================ */