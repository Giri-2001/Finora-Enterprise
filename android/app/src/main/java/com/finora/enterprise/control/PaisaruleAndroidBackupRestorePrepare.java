package com.finora.enterprise.control;

// PAISARULE_R175_C6
//
// Validates an encrypted V1 business backup in native code.
//
// This is not an authentication entry point.
// The caller MUST independently verify:
// - authenticated Owner and live business session;
// - correct business / branch scope;
// - authorized backup key recovered for that scope.
//
// No USB operations, filesystem writes, or login grants.
//
// The returned two byte arrays belong to the caller.
// The caller MUST zero both arrays after use.

import java.nio.ByteBuffer;
import java.nio.charset.CodingErrorAction;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;

import org.json.JSONObject;

final class PaisaruleAndroidBackupRestorePrepare {

    private static final int MAX_PACKAGE_BYTES =
        96 * 1024 * 1024;

    private static final int MAX_PLAINTEXT_BYTES =
        64 * 1024 * 1024;

    private static final String ENVELOPE_FORMAT =
        "PAISARULE_STORAGE_BACKUP";

    private PaisaruleAndroidBackupRestorePrepare() {
    }

    static byte[][] prepareVerifiedFiles(
        byte[] encryptedPackage,
        byte[] authorizedBackupKey,
        JSONObject verifiedPrincipal
    ) throws Exception {

        if (
            encryptedPackage == null ||
            encryptedPackage.length == 0 ||
            encryptedPackage.length > MAX_PACKAGE_BYTES ||
            authorizedBackupKey == null ||
            authorizedBackupKey.length != 32 ||
            verifiedPrincipal == null
        ) {
            throw new IllegalArgumentException(
                "RESTORE_PREPARATION_INPUT_INVALID"
            );
        }

        byte[] plaintext = null;
        byte[][] validatedFiles = null;

        boolean success = false;

        try {
            // Reject invalid UTF-8 rather than replacing bytes.
            String envelopeText =
                StandardCharsets.UTF_8.newDecoder()
                    .onMalformedInput(
                        CodingErrorAction.REPORT
                    )
                    .onUnmappableCharacter(
                        CodingErrorAction.REPORT
                    )
                    .decode(
                        ByteBuffer.wrap(encryptedPackage)
                    )
                    .toString();

            JSONObject envelope =
                new JSONObject(envelopeText);

            if (
                !ENVELOPE_FORMAT.equals(
                    envelope.optString("format", "")
                ) ||
                !(envelope.opt("createdAt") instanceof String)
            ) {
                throw new IllegalArgumentException(
                    "RESTORE_ENVELOPE_INVALID"
                );
            }

            // AES-GCM authentication is enforced by
            // the existing V1-compatible decryptor.
            plaintext =
                PaisaruleAndroidStorageBackupCrypto
                    .decrypt(
                        envelopeText,
                        authorizedBackupKey,
                        verifiedPrincipal
                    );

            if (
                plaintext == null ||
                plaintext.length == 0 ||
                plaintext.length > MAX_PLAINTEXT_BYTES
            ) {
                throw new IllegalArgumentException(
                    "RESTORE_DECRYPTED_SIZE_INVALID"
                );
            }

            // Strictly validate decrypted file contents,
            // SHA256, storage schema and business identity.
            validatedFiles =
                PaisaruleAndroidStorageBackupPayload
                    .parseVerifiedRestorePayload(
                        plaintext,
                        verifiedPrincipal
                    );

            if (
                validatedFiles == null ||
                validatedFiles.length != 2 ||
                validatedFiles[0] == null ||
                validatedFiles[1] == null
            ) {
                throw new IllegalStateException(
                    "RESTORE_VALIDATED_FILES_INVALID"
                );
            }

            // The backup envelope and decrypted payload
            // must identify the same creation timestamp.
            String payloadText =
                StandardCharsets.UTF_8.newDecoder()
                    .onMalformedInput(
                        CodingErrorAction.REPORT
                    )
                    .onUnmappableCharacter(
                        CodingErrorAction.REPORT
                    )
                    .decode(
                        ByteBuffer.wrap(plaintext)
                    )
                    .toString();

            JSONObject payload =
                new JSONObject(payloadText);

            if (
                !envelope.getString("createdAt").equals(
                    payload.optString("createdAt", "")
                )
            ) {
                throw new IllegalArgumentException(
                    "RESTORE_BACKUP_TIMESTAMP_MISMATCH"
                );
            }

            success = true;

            return validatedFiles;

        } finally {
            // This stage never keeps decrypted JSON
            // bytes after processing.

            if (plaintext != null) {
                Arrays.fill(plaintext, (byte) 0);
            }

            if (!success && validatedFiles != null) {
                for (byte[] file : validatedFiles) {
                    if (file != null) {
                        Arrays.fill(file, (byte) 0);
                    }
                }
            }

            // The authorized key is owned by the caller.
            // The crypto decryptor clones and clears its
            // own working key.
        }
    }

    // ========================================================
    // PAISARULE_R175_C7
    //
    // Read a selected encrypted backup and validate it.
    //
    // SECURITY CONTRACT:
    // - Caller must authenticate Owner independently.
    // - Caller must verify live business session.
    // - Caller must obtain the authorized backup key.
    // - Caller must supply the URI selected by SAF.
    // - No USB writes and no login authorization here.
    // - Returned files must be zeroed by caller.
    // ========================================================

    static byte[][] prepareSelectedBackup(
        android.content.Context context,
        android.net.Uri selectedBackupUri,
        byte[] authorizedBackupKey,
        JSONObject verifiedPrincipal
    ) throws Exception {

        if (
            context == null ||
            selectedBackupUri == null ||
            authorizedBackupKey == null ||
            authorizedBackupKey.length != 32 ||
            verifiedPrincipal == null
        ) {
            throw new IllegalArgumentException(
                "RESTORE_SELECTED_BACKUP_INPUT_INVALID"
            );
        }

        byte[] encryptedPackage = null;

        try {
            // Bounded ContentResolver read; no storage writes.
            encryptedPackage =
                com.finora.enterprise.usb
                    .PaisaruleRestoreBackupReader
                    .readEncryptedBackup(
                        context,
                        selectedBackupUri
                    );

            if (
                encryptedPackage == null ||
                encryptedPackage.length == 0 ||
                encryptedPackage.length > MAX_PACKAGE_BYTES
            ) {
                throw new IllegalStateException(
                    "RESTORE_SELECTED_BACKUP_SIZE_INVALID"
                );
            }

            // V1 AES-GCM authentication, strict payload
            // parsing, business scope and SHA256 checks.
            return prepareVerifiedFiles(
                encryptedPackage,
                authorizedBackupKey,
                verifiedPrincipal
            );

        } finally {
            // Never retain the encrypted package in this
            // preparation pipeline after processing.
            if (encryptedPackage != null) {
                Arrays.fill(
                    encryptedPackage,
                    (byte) 0
                );
            }
        }
    }
}