package com.finora.enterprise.control;

import com.finora.enterprise.usb.FinoraUsbStorage;

import java.time.Instant;
import java.util.Arrays;

import org.json.JSONObject;

/**
 * PAISARULE R172-B8
 *
 * Internal Android Backup V1 export coordinator.
 *
 * Responsibilities:
 * 1. Read both authoritative USB storage files.
 * 2. Validate and serialize the Windows-compatible V1 payload.
 * 3. Encrypt using the supplied verified session key.
 * 4. Zero sensitive byte arrays.
 *
 * This class does NOT grant authentication.
 * This class does NOT expose plaintext to JavaScript.
 * This class does NOT write to USB or Android storage.
 *
 * The caller MUST independently verify:
 * - Live server Business Session.
 * - OWNER role and USB storage mode.
 * - Exact active branch identity.
 * - Current login generation.
 *
 * The caller MUST use the native key authority and must
 * not accept an encryption key from the renderer.
 */
final class PaisaruleAndroidStorageBackupExport {

    static final class Result {

        final String encryptedContents;
        final String createdAt;
        final long loginGeneration;
        final int bytesWrittenWhenSaved;

        private Result(
            String encryptedContents,
            String createdAt,
            long loginGeneration
        ) {
            this.encryptedContents = encryptedContents;
            this.createdAt = createdAt;
            this.loginGeneration = loginGeneration;

            this.bytesWrittenWhenSaved =
                encryptedContents.getBytes(
                    java.nio.charset.StandardCharsets.UTF_8
                ).length;
        }
    }

    private PaisaruleAndroidStorageBackupExport() {}

    static Result prepare(
        FinoraUsbStorage storage,
        JSONObject verifiedPrincipal,
        byte[] sessionKey,
        long loginGeneration
    ) throws Exception {

        if (loginGeneration <= 0L) {
            throw new IllegalArgumentException(
                "BACKUP_SAVE_GENERATION_INVALID"
            );
        }

        if (storage == null) {
            throw new IllegalArgumentException(
                "BACKUP_USB_STORAGE_REQUIRED"
            );
        }

        if (verifiedPrincipal == null ||
            !"OWNER".equals(
                verifiedPrincipal.optString("role", "")
            ) ||
            !"USB".equalsIgnoreCase(
                verifiedPrincipal.optString("storageMode", "")
            )) {
            throw new IllegalArgumentException(
                "BACKUP_OWNER_NOT_AUTHORIZED"
            );
        }

        if (sessionKey == null || sessionKey.length != 32) {
            throw new IllegalArgumentException(
                "BACKUP_SESSION_KEY_UNAVAILABLE"
            );
        }

        byte[][] rawFiles = null;
        byte[] payload = null;

        try {
            rawFiles = storage.readPaisaruleBackupRawFiles();

            if (rawFiles == null ||
                rawFiles.length != 2 ||
                rawFiles[0] == null ||
                rawFiles[1] == null) {
                throw new IllegalStateException(
                    "BACKUP_STORAGE_FILES_MISSING"
                );
            }

            String createdAt = Instant.now().toString();

            payload =
                PaisaruleAndroidStorageBackupPayload
                    .createPayload(
                        rawFiles[0],
                        rawFiles[1],
                        verifiedPrincipal,
                        createdAt
                    );

            if (payload == null || payload.length == 0) {
                throw new IllegalStateException(
                    "BACKUP_PAYLOAD_CREATION_FAILED"
                );
            }

            String encrypted =
                PaisaruleAndroidStorageBackupCrypto
                    .encrypt(
                        payload,
                        sessionKey,
                        verifiedPrincipal,
                        createdAt
                    );

            if (encrypted == null ||
                encrypted.isEmpty()) {
                throw new IllegalStateException(
                    "BACKUP_ENCRYPTION_FAILED"
                );
            }

            return new Result(
                encrypted,
                createdAt,
                loginGeneration
            );
        } finally {
            if (payload != null) {
                Arrays.fill(payload, (byte) 0);
            }

            if (rawFiles != null) {
                for (byte[] original : rawFiles) {
                    if (original != null) {
                        Arrays.fill(original, (byte) 0);
                    }
                }
            }

            Arrays.fill(sessionKey, (byte) 0);
        }
    }
}