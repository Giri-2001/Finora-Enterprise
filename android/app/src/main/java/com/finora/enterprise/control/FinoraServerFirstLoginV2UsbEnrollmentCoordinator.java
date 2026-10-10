package com.finora.enterprise.control;

import android.content.ContentResolver;

import androidx.documentfile.provider.DocumentFile;

import org.json.JSONObject;

import java.nio.charset.StandardCharsets;
import java.util.Arrays;

/**
 * FINORA server-first V2 USB enrollment coordinator.
 *
 * This class is intentionally NOT connected to login yet.
 *
 * Security:
 * - Verified pinned server signature mandatory.
 * - Exact account-folder identity mandatory.
 * - Existing authentication file always causes conflict.
 * - No overwrite, recovery replacement or silent deletion.
 * - Fresh V2 material is encrypted before persistence.
 * - USB write result is verified by the write-once writer.
 * - No session, device trust or Control Store mutation.
 *
 * Full runtime-authority and hydration coordination must be
 * completed before invoking this operation in production.
 */
public final class FinoraServerFirstLoginV2UsbEnrollmentCoordinator {

    public enum Status {
        PREPARED_AND_WRITTEN,
        INVALID_AUTHORITY,
        INVALID_USB_ROOT,
        EXISTING_AUTH_CONFLICT,
        ENCRYPTION_FAILED,
        WRITE_FAILED
    }

    public static final class Result {
        public final Status status;

        private Result(Status status) {
            this.status = status;
        }

        public boolean success() {
            return status == Status.PREPARED_AND_WRITTEN;
        }
    }

    private FinoraServerFirstLoginV2UsbEnrollmentCoordinator() {}

    private static Result result(Status status) {
        return new Result(status);
    }

    /**
     * The caller must supply an Android SAF-authorized account folder,
     * not an arbitrary renderer-provided path.
     *
     * The method is a controlled enrollment primitive, not a
     * production login entry point.
     */
    public static Result enrollNew(
        ContentResolver resolver,
        DocumentFile selectedAccountFolder,
        FinoraServerFirstLoginClient.Result serverResult,
        String username,
        String password,
        String securityCode
    ) {

        if (
            resolver == null ||
            selectedAccountFolder == null ||
            !selectedAccountFolder.isDirectory() ||
            !selectedAccountFolder.canWrite()
        ) {
            return result(Status.INVALID_USB_ROOT);
        }

        final String canonical;

        try {
            canonical =
                FinoraPortableBranchAccountUsbRoot
                    .canonicalUsername(username);
        } catch (Exception error) {
            return result(Status.INVALID_AUTHORITY);
        }

        String selectedFolderName =
            selectedAccountFolder.getName();

        FinoraServerFirstLoginEnrollmentPreflight.Result
            preflight =
                FinoraServerFirstLoginEnrollmentPreflight.evaluate(
                    serverResult,
                    username,
                    selectedFolderName
                );

        if (!preflight.ready()) {
            return result(Status.INVALID_AUTHORITY);
        }

        if (
            !FinoraPortableBranchAuthV2UsbWriter
                .accountFolderMatches(
                    selectedFolderName,
                    canonical
                )
        ) {
            return result(Status.INVALID_USB_ROOT);
        }

        /*
         * Conflict precheck. Never create new credentials over V1,
         * V2 or unreadable existing authentication state.
         */
        try {
            DocumentFile finora =
                selectedAccountFolder.findFile("FINORA");

            if (finora != null) {
                if (!finora.isDirectory()) {
                    return result(Status.EXISTING_AUTH_CONFLICT);
                }

                DocumentFile auth =
                    finora.findFile("auth");

                if (auth != null) {
                    if (!auth.isDirectory()) {
                        return result(Status.EXISTING_AUTH_CONFLICT);
                    }

                    if (
                        auth.findFile(
                            FinoraPortableBranchAuthV2UsbWriter.AUTH_FILE
                        ) != null
                    ) {
                        return result(Status.EXISTING_AUTH_CONFLICT);
                    }
                }
            }
        } catch (Exception error) {
            return result(Status.INVALID_USB_ROOT);
        }

        final FinoraServerFirstLoginV2MaterialService.Material
            prepared;

        try {
            prepared =
                FinoraServerFirstLoginV2MaterialService.create(
                    serverResult,
                    username,
                    selectedFolderName,
                    password,
                    securityCode
                );
        } catch (Exception error) {
            return result(Status.ENCRYPTION_FAILED);
        }

        byte[] encrypted = null;
        byte[] passwordPayload = null;
        byte[] recoveryPayload = null;

        try {
            if (
                !canonical.equals(prepared.canonicalUsername) ||
                !preflight.verifiedPayload.getString("ownerId")
                    .equals(prepared.ownerId) ||
                !preflight.verifiedPayload.getString("businessId")
                    .equals(prepared.businessId) ||
                !preflight.verifiedPayload.getString("branchId")
                    .equals(prepared.branchId)
            ) {
                return result(Status.INVALID_AUTHORITY);
            }

            JSONObject envelope =
                FinoraPortableBranchAuthV2Envelope.parse(
                    prepared.serializedEnvelope
                );

            if (
                !canonical.equals(
                    envelope.getString("canonicalUsername")
                )
            ) {
                return result(Status.INVALID_AUTHORITY);
            }

            passwordPayload =
                FinoraPortableBranchAuthV2DecryptAuthority
                    .decryptWithPassword(
                        prepared.serializedEnvelope,
                        password
                    );

            recoveryPayload =
                FinoraPortableBranchAuthV2DecryptAuthority
                    .decryptWithSecurityCode(
                        prepared.serializedEnvelope,
                        securityCode
                    );

            if (!Arrays.equals(passwordPayload, recoveryPayload)) {
                return result(Status.ENCRYPTION_FAILED);
            }

            encrypted = prepared.serializedEnvelope.getBytes(
                StandardCharsets.UTF_8
            );

            // Match the V2 USB reader's stricter 128 KiB limit.
            if (encrypted.length > 128 * 1024) {
                return result(Status.ENCRYPTION_FAILED);
            }

            /*
             * Final write-once check is inside the writer's lock.
             * A race or existing file must never trigger overwrite.
             */
            FinoraPortableBranchAuthV2UsbWriter.Result written =
                FinoraPortableBranchAuthV2UsbWriter.writeNew(
                    resolver,
                    selectedAccountFolder,
                    canonical,
                    encrypted
                );

            if (
                written.status ==
                FinoraPortableBranchAuthV2UsbWriter.Status.CONFLICT
            ) {
                return result(Status.EXISTING_AUTH_CONFLICT);
            }

            if (!written.success()) {
                return result(Status.WRITE_FAILED);
            }

            return result(Status.PREPARED_AND_WRITTEN);

        } catch (Exception error) {
            return result(Status.ENCRYPTION_FAILED);
        } finally {
            if (encrypted != null) {
                Arrays.fill(encrypted, (byte) 0);
            }

            if (passwordPayload != null) {
                Arrays.fill(passwordPayload, (byte) 0);
            }

            if (recoveryPayload != null) {
                Arrays.fill(recoveryPayload, (byte) 0);
            }
        }
    }
}