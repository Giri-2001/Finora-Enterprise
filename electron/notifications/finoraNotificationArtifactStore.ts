// ============================================================
// FINORA ENTERPRISE OS
//
// NOTIFICATIONS ENGINE
// DURABLE NOTIFICATION ARTIFACT STORE
//
// RESPONSIBILITY:
//
// - Persist FINORA-owned Notification artifacts outside the
//   operational JSON record stores.
// - Support LOCAL and USB storage only.
// - Keep arbitrary filesystem paths out of the renderer.
// - Resolve durable artifacts for privileged provider delivery.
// - Verify PNG signature, size and SHA-256 integrity.
// - Preserve idempotent artifact identity across retries.
//
// IMPORTANT:
//
// - MAIN PROCESS ONLY.
// - No React.
// - No renderer storage access.
// - No provider credentials.
// - No cloud storage.
// - No arbitrary renderer-controlled filesystem path.
// - Notification records persist only the small artifact
//   reference returned by this store.
// - Physical artifact file names are derived from hashes.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

import {
  createHash,
} from "node:crypto";

import fs from "node:fs/promises";

import path from "node:path";

import type {
  FinoraNotificationArtifactPayload,
  FinoraNotificationArtifactReference,
  FinoraNotificationArtifactResult,
  FinoraNotificationArtifactSaveRequest,
  FinoraNotificationArtifactScope,
  FinoraNotificationArtifactStorageMode,
} from "./finoraNotificationArtifact.types.js";

/* ============================================================
   CONSTANTS
============================================================ */

const FINORA_DIRECTORY =
  "FINORA";

const NOTIFICATION_DIRECTORY =
  "notifications";

const ARTIFACT_DIRECTORY =
  "artifacts";

const PNG_EXTENSION =
  ".png";

const PNG_MIME_TYPE =
  "image/png";

const CUSTOMER_ID_CARD_KIND =
  "CUSTOMER_ID_CARD";

const ARTIFACT_SCHEMA_VERSION =
  1 as const;

/*
 * Customer ID-card artifacts are intentionally small.
 *
 * The privileged boundary rejects unexpectedly large payloads
 * instead of allowing renderer-controlled memory/disk growth.
 */

const MAX_ARTIFACT_BYTES =
  5 * 1024 * 1024;

const SHA256_PATTERN =
  /^[a-f0-9]{64}$/;

const BASE64_PATTERN =
  /^[A-Za-z0-9+/]*={0,2}$/;

const PNG_SIGNATURE =
  Buffer.from([
    0x89,
    0x50,
    0x4e,
    0x47,
    0x0d,
    0x0a,
    0x1a,
    0x0a,
  ]);

/* ============================================================
   DEPENDENCIES

   The caller owns storage-root resolution.

   LOCAL:
     Electron userData root.

   USB:
     Existing FINORA removable-drive resolver.

   The renderer never provides either root.
============================================================ */

export interface FinoraNotificationArtifactStoreDependencies {
  resolveLocalRoot():
    string;

  resolveUsbRoot():
    Promise<string | null>;
}

/* ============================================================
   RESULT HELPERS
============================================================ */

function success<T>(
  data: T,
): FinoraNotificationArtifactResult<T> {
  return {
    success: true,

    data,
  };
}

function failure<T = never>(
  error: string,
): FinoraNotificationArtifactResult<T> {
  return {
    success: false,

    error,
  };
}

/* ============================================================
   NORMALIZATION
============================================================ */

function normalizeString(
  value: unknown,
): string {
  return typeof value === "string"
    ? value.trim()
    : "";
}

/* ============================================================
   HASH
============================================================ */

function sha256(
  value: string | Buffer,
): string {
  return createHash("sha256")
    .update(value)
    .digest("hex");
}

/* ============================================================
   ERROR HELPERS
============================================================ */

function isFileNotFoundError(
  error: unknown,
): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as NodeJS.ErrnoException).code === "ENOENT"
  );
}

/* ============================================================
   SCOPE VALIDATION
============================================================ */

function validateScope(
  scope:
    FinoraNotificationArtifactScope,
): string | undefined {
  if (
    !scope ||
    typeof scope !== "object"
  ) {
    return "Notification artifact scope is required.";
  }

  if (
    !normalizeString(
      scope.ownerId,
    )
  ) {
    return "Notification artifact Owner ID is required.";
  }

  if (
    !normalizeString(
      scope.businessId,
    )
  ) {
    return "Notification artifact Business ID is required.";
  }

  if (
    !normalizeString(
      scope.branchId,
    )
  ) {
    return "Notification artifact Branch ID is required.";
  }

  return undefined;
}

/* ============================================================
   COMMON REFERENCE VALIDATION
============================================================ */

function validateReference(
  reference:
    FinoraNotificationArtifactReference,
): string | undefined {
  if (
    !reference ||
    typeof reference !== "object"
  ) {
    return "Notification artifact reference is required.";
  }

  if (
    !normalizeString(
      reference.artifactId,
    )
  ) {
    return "Notification artifact ID is required.";
  }

  if (
    reference.artifactId.length >
    512
  ) {
    return "Notification artifact ID is too long.";
  }

  if (
    reference.kind !==
    CUSTOMER_ID_CARD_KIND
  ) {
    return "Unsupported Notification artifact kind.";
  }

  if (
    reference.storageMode !== "LOCAL" &&
    reference.storageMode !== "USB"
  ) {
    return "Unsupported Notification artifact storage mode.";
  }

  if (
    reference.mimeType !==
    PNG_MIME_TYPE
  ) {
    return "Notification artifact must use image/png.";
  }

  const fileName =
    normalizeString(
      reference.fileName,
    );

  if (
    !fileName ||
    !fileName
      .toLowerCase()
      .endsWith(
        PNG_EXTENSION,
      )
  ) {
    return "Notification artifact file name must end with .png.";
  }

  if (
    fileName.includes("/") ||
    fileName.includes("\\")
  ) {
    return "Notification artifact file name must not contain a path.";
  }

  if (
    !Number.isSafeInteger(
      reference.byteLength,
    ) ||
    reference.byteLength <= 0 ||
    reference.byteLength >
      MAX_ARTIFACT_BYTES
  ) {
    return "Notification artifact byte length is invalid.";
  }

  if (
    !SHA256_PATTERN.test(
      normalizeString(
        reference.sha256,
      ),
    )
  ) {
    return "Notification artifact SHA-256 is invalid.";
  }

  if (
    !normalizeString(
      reference.createdAt,
    ) ||
    !Number.isFinite(
      Date.parse(
        reference.createdAt,
      ),
    )
  ) {
    return "Notification artifact createdAt is invalid.";
  }

  if (
    reference.schemaVersion !==
    ARTIFACT_SCHEMA_VERSION
  ) {
    return "Unsupported Notification artifact schema version.";
  }

  return validateScope(
    reference.scope,
  );
}

/* ============================================================
   SAVE REQUEST VALIDATION
============================================================ */

function validateSaveRequest(
  request:
    FinoraNotificationArtifactSaveRequest,
): string | undefined {
  if (
    !request ||
    typeof request !== "object"
  ) {
    return "Notification artifact save request is required.";
  }

  const artifactId =
    normalizeString(
      request.artifactId,
    );

  if (!artifactId) {
    return "Notification artifact ID is required.";
  }

  if (
    artifactId.length >
    512
  ) {
    return "Notification artifact ID is too long.";
  }

  if (
    request.kind !==
    CUSTOMER_ID_CARD_KIND
  ) {
    return "Unsupported Notification artifact kind.";
  }

  if (
    request.storageMode !== "LOCAL" &&
    request.storageMode !== "USB"
  ) {
    return "Unsupported Notification artifact storage mode.";
  }

  if (
    request.mimeType !==
    PNG_MIME_TYPE
  ) {
    return "Notification artifact must use image/png.";
  }

  const fileName =
    normalizeString(
      request.fileName,
    );

  if (
    !fileName ||
    !fileName
      .toLowerCase()
      .endsWith(
        PNG_EXTENSION,
      )
  ) {
    return "Notification artifact file name must end with .png.";
  }

  if (
    fileName.includes("/") ||
    fileName.includes("\\")
  ) {
    return "Notification artifact file name must not contain a path.";
  }

  const contentBase64 =
    normalizeString(
      request.contentBase64,
    );

  if (!contentBase64) {
    return "Notification artifact Base64 payload is required.";
  }

  if (
    contentBase64.length % 4 !== 0 ||
    !BASE64_PATTERN.test(
      contentBase64,
    )
  ) {
    return "Notification artifact Base64 payload is invalid.";
  }

  return validateScope(
    request.scope,
  );
}

/* ============================================================
   PNG VALIDATION
============================================================ */

function isPng(
  buffer: Buffer,
): boolean {
  if (
    buffer.length <
    PNG_SIGNATURE.length
  ) {
    return false;
  }

  return buffer
    .subarray(
      0,
      PNG_SIGNATURE.length,
    )
    .equals(
      PNG_SIGNATURE,
    );
}

/* ============================================================
   DIRECTORY SEGMENT

   Scope values never become raw filesystem path segments.
============================================================ */

function buildHashedSegment(
  value: string,
): string {
  return sha256(
    normalizeString(
      value,
    ),
  );
}

/* ============================================================
   ARTIFACT DIRECTORY
============================================================ */

function buildArtifactDirectory(
  storageRoot: string,

  scope:
    FinoraNotificationArtifactScope,
): string {
  return path.join(
    storageRoot,

    FINORA_DIRECTORY,

    NOTIFICATION_DIRECTORY,

    ARTIFACT_DIRECTORY,

    buildHashedSegment(
      scope.ownerId,
    ),

    buildHashedSegment(
      scope.businessId,
    ),

    buildHashedSegment(
      scope.branchId,
    ),
  );
}

/* ============================================================
   ARTIFACT FILE
============================================================ */

function buildArtifactFile(
  storageRoot: string,

  reference: {
    artifactId: string;

    scope:
      FinoraNotificationArtifactScope;
  },
): string {
  const directory =
    buildArtifactDirectory(
      storageRoot,
      reference.scope,
    );

  const artifactFileName =
    `${sha256(
      normalizeString(
        reference.artifactId,
      ),
    )}${PNG_EXTENSION}`;

  return path.join(
    directory,
    artifactFileName,
  );
}

/* ============================================================
   STORE
============================================================ */

export class FinoraNotificationArtifactStore {
  constructor(
    private readonly dependencies:
      FinoraNotificationArtifactStoreDependencies,
  ) {}

  /* ==========================================================
     RESOLVE STORAGE ROOT
  ========================================================== */

  private async resolveStorageRoot(
    storageMode:
      FinoraNotificationArtifactStorageMode,
  ): Promise<
    FinoraNotificationArtifactResult<string>
  > {
    if (
      storageMode ===
      "LOCAL"
    ) {
      const localRoot =
        normalizeString(
          this.dependencies
            .resolveLocalRoot(),
        );

      if (!localRoot) {
        return failure(
          "FINORA LOCAL Notification artifact root is unavailable.",
        );
      }

      return success(
        localRoot,
      );
    }

    const usbRoot =
      normalizeString(
        await this.dependencies
          .resolveUsbRoot(),
      );

    if (!usbRoot) {
      return failure(
        "FINORA Pendrive is disconnected.",
      );
    }

    return success(
      usbRoot,
    );
  }

  /* ==========================================================
     SAVE

     Idempotency:

     Same artifactId + same bytes
       -> existing durable artifact is accepted.

     Same artifactId + different bytes
       -> collision fails closed.
  ========================================================== */

  async save(
    request:
      FinoraNotificationArtifactSaveRequest,
  ): Promise<
    FinoraNotificationArtifactResult<
      FinoraNotificationArtifactReference
    >
  > {
    const requestError =
      validateSaveRequest(
        request,
      );

    if (requestError) {
      return failure(
        requestError,
      );
    }

    let content: Buffer;

    try {
      content =
        Buffer.from(
          request.contentBase64,
          "base64",
        );
    } catch {
      return failure(
        "Unable to decode Notification artifact Base64 payload.",
      );
    }

    if (
      content.length === 0
    ) {
      return failure(
        "Notification artifact payload is empty.",
      );
    }

    if (
      content.length >
      MAX_ARTIFACT_BYTES
    ) {
      return failure(
        "Notification artifact exceeds the 5 MiB size limit.",
      );
    }

    if (
      !isPng(
        content,
      )
    ) {
      return failure(
        "Notification artifact payload is not a valid PNG image.",
      );
    }

    const normalizedBase64 =
      content.toString(
        "base64",
      );

    if (
      normalizedBase64 !==
      request.contentBase64
    ) {
      return failure(
        "Notification artifact Base64 payload is not canonical.",
      );
    }

    const contentHash =
      sha256(
        content,
      );

    const createdAt =
      new Date()
        .toISOString();

    const reference:
      FinoraNotificationArtifactReference = {
        artifactId:
          normalizeString(
            request.artifactId,
          ),

        kind:
          CUSTOMER_ID_CARD_KIND,

        storageMode:
          request.storageMode,

        mimeType:
          PNG_MIME_TYPE,

        fileName:
          normalizeString(
            request.fileName,
          ),

        byteLength:
          content.length,

        sha256:
          contentHash,

        createdAt,

        scope: {
          ownerId:
            normalizeString(
              request.scope.ownerId,
            ),

          businessId:
            normalizeString(
              request.scope.businessId,
            ),

          branchId:
            normalizeString(
              request.scope.branchId,
            ),
        },

        schemaVersion:
          ARTIFACT_SCHEMA_VERSION,
      };

    const rootResult =
      await this.resolveStorageRoot(
        reference.storageMode,
      );

    if (!rootResult.success) {
      return failure(
        rootResult.error,
      );
    }

    const artifactFile =
      buildArtifactFile(
        rootResult.data,
        reference,
      );

    const artifactDirectory =
      path.dirname(
        artifactFile,
      );

    try {
      await fs.mkdir(
        artifactDirectory,
        {
          recursive: true,

          mode: 0o700,
        },
      );
    } catch (error) {
      return failure(
        error instanceof Error
          ? error.message
          : "Unable to prepare FINORA Notification artifact directory.",
      );
    }

    /*
     * Existing file check makes deterministic artifact saves
     * safely idempotent.
     */

    try {
      const existing =
        await fs.readFile(
          artifactFile,
        );

      const existingHash =
        sha256(
          existing,
        );

      if (
        existingHash ===
        contentHash
      ) {
        return success(
          {
            ...reference,

            byteLength:
              existing.length,

            sha256:
              existingHash,
          },
        );
      }

      return failure(
        "Notification artifact ID collision detected.",
      );
    } catch (error) {
      if (
        !isFileNotFoundError(
          error,
        )
      ) {
        return failure(
          error instanceof Error
            ? error.message
            : "Unable to inspect existing Notification artifact.",
        );
      }
    }

    const temporaryFile =
      `${artifactFile}.${process.pid}.${Date.now()}.tmp`;

    try {
      await fs.writeFile(
        temporaryFile,
        content,
        {
          flag: "wx",

          mode: 0o600,
        },
      );

      try {
        await fs.rename(
          temporaryFile,
          artifactFile,
        );
      } catch (renameError) {
        /*
         * A concurrent deterministic save may have won the
         * race. Verify the resulting durable bytes before
         * deciding whether this is a collision.
         */

        try {
          const existing =
            await fs.readFile(
              artifactFile,
            );

          const existingHash =
            sha256(
              existing,
            );

          if (
            existingHash ===
            contentHash
          ) {
            await fs
              .unlink(
                temporaryFile,
              )
              .catch(
                () => undefined,
              );

            return success(
              {
                ...reference,

                byteLength:
                  existing.length,

                sha256:
                  existingHash,
              },
            );
          }
        } catch {
          /*
           * Fall through to the original rename failure.
           */
        }

        throw renameError;
      }

      return success(
        reference,
      );
    } catch (error) {
      await fs
        .unlink(
          temporaryFile,
        )
        .catch(
          () => undefined,
        );

      return failure(
        error instanceof Error
          ? error.message
          : "Unable to persist FINORA Notification artifact.",
      );
    }
  }

  /* ==========================================================
     READ

     Provider execution receives bytes only after:
     - scope-derived path resolution
     - PNG signature verification
     - byte-length verification
     - SHA-256 verification
  ========================================================== */

  async read(
    reference:
      FinoraNotificationArtifactReference,
  ): Promise<
    FinoraNotificationArtifactResult<
      FinoraNotificationArtifactPayload
    >
  > {
    const referenceError =
      validateReference(
        reference,
      );

    if (referenceError) {
      return failure(
        referenceError,
      );
    }

    const rootResult =
      await this.resolveStorageRoot(
        reference.storageMode,
      );

    if (!rootResult.success) {
      return failure(
        rootResult.error,
      );
    }

    const artifactFile =
      buildArtifactFile(
        rootResult.data,
        reference,
      );

    let content: Buffer;

    try {
      content =
        await fs.readFile(
          artifactFile,
        );
    } catch (error) {
      return failure(
        isFileNotFoundError(
          error,
        )
          ? "FINORA Notification artifact was not found."
          : error instanceof Error
            ? error.message
            : "Unable to read FINORA Notification artifact.",
      );
    }

    if (
      content.length >
      MAX_ARTIFACT_BYTES
    ) {
      return failure(
        "FINORA Notification artifact exceeds the allowed size.",
      );
    }

    if (
      !isPng(
        content,
      )
    ) {
      return failure(
        "FINORA Notification artifact is not a valid PNG image.",
      );
    }

    if (
      content.length !==
      reference.byteLength
    ) {
      return failure(
        "FINORA Notification artifact byte length does not match its durable reference.",
      );
    }

    const contentHash =
      sha256(
        content,
      );

    if (
      contentHash !==
      reference.sha256
    ) {
      return failure(
        "FINORA Notification artifact failed SHA-256 integrity verification.",
      );
    }

    return success(
      {
        reference,

        contentBase64:
          content.toString(
            "base64",
          ),
      },
    );
  }

  /* ==========================================================
     DELETE

     Deletes only the exact hashed FINORA artifact represented
     by the validated durable reference.
  ========================================================== */

  async delete(
    reference:
      FinoraNotificationArtifactReference,
  ): Promise<
    FinoraNotificationArtifactResult<void>
  > {
    const referenceError =
      validateReference(
        reference,
      );

    if (referenceError) {
      return failure(
        referenceError,
      );
    }

    const rootResult =
      await this.resolveStorageRoot(
        reference.storageMode,
      );

    if (!rootResult.success) {
      return failure(
        rootResult.error,
      );
    }

    const artifactFile =
      buildArtifactFile(
        rootResult.data,
        reference,
      );

    try {
      await fs.unlink(
        artifactFile,
      );

      return success(
        undefined,
      );
    } catch (error) {
      if (
        isFileNotFoundError(
          error,
        )
      ) {
        /*
         * Delete is idempotent.
         */

        return success(
          undefined,
        );
      }

      return failure(
        error instanceof Error
          ? error.message
          : "Unable to delete FINORA Notification artifact.",
      );
    }
  }
}

/* ============================================================
   END
============================================================ */