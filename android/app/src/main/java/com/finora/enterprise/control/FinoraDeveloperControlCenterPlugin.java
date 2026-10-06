package com.finora.enterprise.control;

import android.app.Activity;
import android.content.ContentResolver;
import android.content.Intent;
import android.net.Uri;

import androidx.activity.result.ActivityResult;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

@CapacitorPlugin(
    name = "FinoraDeveloperControlCenter"
)
public final class FinoraDeveloperControlCenterPlugin
    extends Plugin {

    private static final int
        MAX_ADMIN_RECOVERY_BYTES =
            4 * 1024 * 1024;

    private static final String
        ADMIN_RECOVERY_FORMAT =
            "FINORA_CONTROL_CENTER_ADMIN_AUTHORITY_RECOVERY";

    private boolean sessionUnlocked =
        false;

    private int sessionFailedAttempts =
        0;

    private long sessionBlockedUntilMilliseconds =
        0L;

    private long retryAfterMilliseconds() {

        return Math.max(
            0L,
            sessionBlockedUntilMilliseconds -
                System.currentTimeMillis()
        );
    }

    private long computeBackoffMilliseconds(
        int failedAttempts
    ) {

        int exponent =
            Math.min(
                Math.max(
                    failedAttempts - 1,
                    0
                ),
                6
            );

        long backoff =
            1000L *
            (1L << exponent);

        return Math.min(
            60000L,
            backoff
        );
    }

    private JSObject sessionState() {

        JSObject state =
            new JSObject();

        state.put(
            "unlocked",
            sessionUnlocked
        );

        state.put(
            "failedAttempts",
            sessionFailedAttempts
        );

        state.put(
            "retryAfterMs",
            retryAfterMilliseconds()
        );

        return state;
    }

    private void resolveSuccess(
        PluginCall call,
        Object data
    ) {

        JSObject result =
            new JSObject();

        result.put(
            "success",
            true
        );

        result.put(
            "data",
            data
        );

        call.resolve(
            result
        );
    }

    private void resolveFailure(
        PluginCall call,
        String error
    ) {

        JSObject result =
            new JSObject();

        result.put(
            "success",
            false
        );

        result.put(
            "error",
            error
        );

        call.resolve(
            result
        );
    }

    @PluginMethod
    public void getDeveloperSecurityState(
        PluginCall call
    ) {

        try {

            FinoraDeveloperControlCenterKeyVaultStore keyVaultStore =
                new FinoraDeveloperControlCenterKeyVaultStore(
                    getContext()
                );

            JSONObject vault =
                keyVaultStore.read();

            boolean authorityPresent =
                vault != null;

            boolean securityCodeConfigured =
                false;

            if (authorityPresent) {

                String issuerId =
                    vault.getString(
                        "issuerId"
                    );

                FinoraDeveloperSecurityCodeStore securityStore =
                    new FinoraDeveloperSecurityCodeStore(
                        getContext()
                    );

                securityCodeConfigured =
                    securityStore.isConfigured(
                        issuerId
                    );

                if (securityCodeConfigured) {

                    sessionFailedAttempts =
                        securityStore.readFailedAttempts(
                            issuerId
                        );

                    sessionBlockedUntilMilliseconds =
                        securityStore.readBlockedUntilMilliseconds(
                            issuerId
                        );

                } else {

                    sessionFailedAttempts =
                        0;

                    sessionBlockedUntilMilliseconds =
                        0L;
                }

            } else {

                sessionUnlocked =
                    false;

                sessionFailedAttempts =
                    0;

                sessionBlockedUntilMilliseconds =
                    0L;
            }

            JSObject state =
                new JSObject();

            state.put(
                "bootstrapStatus",
                authorityPresent
                    ? "READY_WITH_EXISTING_AUTHORITY"
                    : "RECOVERY_REQUIRED"
            );

            state.put(
                "authorityPresent",
                authorityPresent
            );

            state.put(
                "securityCodeConfigured",
                securityCodeConfigured
            );

            state.put(
                "session",
                sessionState()
            );

            resolveSuccess(
                call,
                state
            );

        } catch (Exception error) {

            resolveFailure(
                call,
                error.getMessage() != null
                    ? error.getMessage()
                    : "FINORA Developer Security state could not be read."
            );
        }
    }

    @PluginMethod
    public void initializeDeveloperSecurityCodeFromAdminRecovery(
        PluginCall call
    ) {

        String adminRecoverySecurityCode =
            call.getString(
                "adminRecoverySecurityCode"
            );

        String newDeveloperSecurityCode =
            call.getString(
                "newDeveloperSecurityCode"
            );

        if (
            adminRecoverySecurityCode == null ||
            adminRecoverySecurityCode.isEmpty() ||
            newDeveloperSecurityCode == null ||
            newDeveloperSecurityCode.isEmpty()
        ) {
            resolveFailure(
                call,
                "FINORA Developer Security Code initialization request is invalid."
            );

            return;
        }

        Intent intent =
            new Intent(
                Intent.ACTION_OPEN_DOCUMENT
            );

        intent.addCategory(
            Intent.CATEGORY_OPENABLE
        );

        intent.setType(
            "application/json"
        );

        /*
         * Some Android document providers expose custom FINORA files
         * as generic binary/text content. Keep MIME handling portable.
         */
        intent.putExtra(
            Intent.EXTRA_MIME_TYPES,
            new String[] {
                "application/json",
                "text/plain",
                "application/octet-stream"
            }
        );

        startActivityForResult(
            call,
            intent,
            "adminRecoverySelected"
        );
    }

    @ActivityCallback
    private void adminRecoverySelected(
        PluginCall call,
        ActivityResult result
    ) {

        if (call == null) {
            return;
        }

        if (
            result == null ||
            result.getResultCode() !=
                Activity.RESULT_OK ||
            result.getData() == null ||
            result.getData().getData() == null
        ) {
            resolveFailure(
                call,
                "FINORA Admin Authority Recovery file selection was cancelled."
            );

            return;
        }

        Uri uri =
            result
                .getData()
                .getData();

        try {

            byte[] bytes =
                readBoundedDocument(
                    uri
                );

            String serializedBundle =
                new String(
                    bytes,
                    StandardCharsets.UTF_8
                );

            JSONObject bundle =
                new JSONObject(
                    serializedBundle
                );

            validateRecoveryEnvelopeShape(
                bundle
            );

            String adminRecoverySecurityCode =
                call.getString(
                    "adminRecoverySecurityCode"
                );

            if (
                adminRecoverySecurityCode == null
            ) {
                throw new IllegalStateException(
                    "FINORA Admin Recovery Security Code is missing."
                );
            }

            JSONObject recoveredVault =
                FinoraDeveloperAdminRecoveryCrypto.decrypt(
                    bundle,
                    adminRecoverySecurityCode
                );

            /*
             * SECURITY BOUNDARY:
             * recoveredVault contains private signing material.
             * Never return it through Capacitor/renderer.
             */
            if (
                recoveredVault == null
            ) {
                throw new IllegalStateException(
                    "FINORA recovered signing authority is unavailable."
                );
            }

            FinoraDeveloperControlCenterKeyVaultStore keyVaultStore =
                new FinoraDeveloperControlCenterKeyVaultStore(
                    getContext()
                );

            JSONObject restoredVault =
                keyVaultStore.restoreOrMatch(
                    recoveredVault
                );

            if (
                !restoredVault.getString(
                    "issuerId"
                ).equals(
                    bundle.getString(
                        "issuerId"
                    )
                ) ||
                !restoredVault.getString(
                    "signingKeyId"
                ).equals(
                    bundle.getString(
                        "signingKeyId"
                    )
                )
            ) {
                throw new IllegalStateException(
                    "FINORA restored Control Center authority identity verification failed."
                );
            }

            String newDeveloperSecurityCode =
                call.getString(
                    "newDeveloperSecurityCode"
                );

            if (
                newDeveloperSecurityCode == null
            ) {
                throw new IllegalStateException(
                    "FINORA new Developer Security Code is missing."
                );
            }

            FinoraDeveloperSecurityCodeStore securityStore =
                new FinoraDeveloperSecurityCodeStore(
                    getContext()
                );

            String issuerId =
                restoredVault.getString(
                    "issuerId"
                );

            if (
                securityStore.isConfigured(
                    issuerId
                )
            ) {
                throw new IllegalStateException(
                    "FINORA Developer Security Code is already configured for this Control Center authority."
                );
            }

            securityStore.initialize(
                issuerId,
                newDeveloperSecurityCode
            );

            /*
             * First setup intentionally remains LOCKED.
             * User must pass normal unlock next.
             */
            sessionUnlocked =
                false;

            JSObject initialized =
                new JSObject();

            initialized.put(
                "authorityPresent",
                true
            );

            initialized.put(
                "securityCodeConfigured",
                true
            );

            initialized.put(
                "issuerId",
                issuerId
            );

            initialized.put(
                "signingKeyId",
                restoredVault.getString(
                    "signingKeyId"
                )
            );

            initialized.put(
                "session",
                sessionState()
            );

            android.widget.Toast.makeText(
                getContext(),
                "FINORA Admin Authority Recovery imported successfully. Developer Security Code configured.",
                android.widget.Toast.LENGTH_LONG
            ).show();

            resolveSuccess(
                call,
                initialized
            );
            /*
             * FINORA_RECOVERY_SUCCESS_RELOAD
             *
             * Recovery + first Developer Security Code are now
             * persisted. Reload the privileged renderer so its
             * bootstrap state is read again and the UI moves from
             * Recovery/Configure directly to normal Security Code
             * unlock without requiring an app restart.
             */
            new android.os.Handler(
                android.os.Looper.getMainLooper()
            ).postDelayed(
                () -> {
                    if (
                        getBridge() != null &&
                        getBridge().getWebView() != null
                    ) {
                        getBridge()
                            .getWebView()
                            .reload();
                    }
                },
                850
            );


        } catch (Exception error) {

            String message =
                error.getMessage();

            resolveFailure(
                call,
                message == null ||
                message.trim().isEmpty()
                    ? "FINORA Admin Authority Recovery file could not be loaded."
                    : message
            );
        }
    }

    private byte[] readBoundedDocument(
        Uri uri
    ) throws Exception {

        ContentResolver resolver =
            getContext()
                .getContentResolver();

        try (
            InputStream input =
                resolver.openInputStream(
                    uri
                )
        ) {

            if (input == null) {
                throw new IllegalStateException(
                    "FINORA Admin Authority Recovery file could not be opened."
                );
            }

            ByteArrayOutputStream output =
                new ByteArrayOutputStream();

            byte[] buffer =
                new byte[8192];

            int total =
                0;

            while (true) {

                int read =
                    input.read(
                        buffer
                    );

                if (read < 0) {
                    break;
                }

                total +=
                    read;

                if (
                    total >
                    MAX_ADMIN_RECOVERY_BYTES
                ) {
                    throw new IllegalStateException(
                        "FINORA Admin Authority Recovery file exceeds the maximum allowed size."
                    );
                }

                output.write(
                    buffer,
                    0,
                    read
                );
            }

            if (total == 0) {
                throw new IllegalStateException(
                    "FINORA Admin Authority Recovery file is empty."
                );
            }

            return output.toByteArray();
        }
    }

    private void validateRecoveryEnvelopeShape(
        JSONObject bundle
    ) {

        String format =
            bundle.optString(
                "format",
                ""
            );

        if (
            !ADMIN_RECOVERY_FORMAT.equals(
                format
            )
        ) {
            throw new IllegalStateException(
                "FINORA Admin Authority Recovery file format is invalid."
            );
        }

        if (
            !bundle.has(
                "schemaVersion"
            ) ||
            !bundle.has(
                "bundleId"
            ) ||
            !bundle.has(
                "issuerId"
            ) ||
            !bundle.has(
                "signingKeyId"
            ) ||
            !bundle.has(
                "createdAt"
            ) ||
            !bundle.has(
                "kdf"
            ) ||
            !bundle.has(
                "encryption"
            )
        ) {
            throw new IllegalStateException(
                "FINORA Admin Authority Recovery file schema is incomplete."
            );
        }

        JSONObject kdf =
            bundle.optJSONObject(
                "kdf"
            );

        JSONObject encryption =
            bundle.optJSONObject(
                "encryption"
            );

        if (
            kdf == null ||
            encryption == null
        ) {
            throw new IllegalStateException(
                "FINORA Admin Authority Recovery cryptographic metadata is invalid."
            );
        }

        if (
            !encryption.has(
                "algorithm"
            ) ||
            !encryption.has(
                "iv"
            ) ||
            !encryption.has(
                "authTag"
            ) ||
            !bundle.has(
                "ciphertext"
            )
        ) {
            throw new IllegalStateException(
                "FINORA Admin Authority Recovery encryption metadata is incomplete."
            );
        }
    }

    @PluginMethod
    public void unlockDeveloperControlCenter(
        PluginCall call
    ) {

        try {

            if (sessionUnlocked) {

                JSObject alreadyUnlocked =
                    new JSObject();

                alreadyUnlocked.put(
                    "success",
                    true
                );

                alreadyUnlocked.put(
                    "status",
                    "UNLOCKED"
                );

                alreadyUnlocked.put(
                    "state",
                    sessionState()
                );

                resolveSuccess(
                    call,
                    alreadyUnlocked
                );

                return;
            }

            String securityCode =
                call.getString(
                    "securityCode"
                );

            FinoraDeveloperControlCenterKeyVaultStore keyVaultStore =
                new FinoraDeveloperControlCenterKeyVaultStore(
                    getContext()
                );

            JSONObject vault =
                keyVaultStore.read();

            if (vault == null) {

                JSObject missingConfiguration =
                    new JSObject();

                missingConfiguration.put(
                    "success",
                    false
                );

                missingConfiguration.put(
                    "errorCode",
                    "SECURITY_CODE_NOT_CONFIGURED"
                );

                missingConfiguration.put(
                    "retryAfterMs",
                    0
                );

                missingConfiguration.put(
                    "state",
                    sessionState()
                );

                resolveSuccess(
                    call,
                    missingConfiguration
                );

                return;
            }

            String issuerId =
                vault.getString(
                    "issuerId"
                );

            FinoraDeveloperSecurityCodeStore securityStore =
                new FinoraDeveloperSecurityCodeStore(
                    getContext()
                );

            if (
                !securityStore.isConfigured(
                    issuerId
                )
            ) {

                JSObject notConfigured =
                    new JSObject();

                notConfigured.put(
                    "success",
                    false
                );

                notConfigured.put(
                    "errorCode",
                    "SECURITY_CODE_NOT_CONFIGURED"
                );

                notConfigured.put(
                    "retryAfterMs",
                    0
                );

                notConfigured.put(
                    "state",
                    sessionState()
                );

                resolveSuccess(
                    call,
                    notConfigured
                );

                return;
            }

            sessionFailedAttempts =
                securityStore.readFailedAttempts(
                    issuerId
                );

            sessionBlockedUntilMilliseconds =
                securityStore.readBlockedUntilMilliseconds(
                    issuerId
                );

            long retryAfterMs =
                retryAfterMilliseconds();

            if (retryAfterMs > 0L) {

                JSObject retry =
                    new JSObject();

                retry.put(
                    "success",
                    false
                );

                retry.put(
                    "errorCode",
                    "RETRY_LATER"
                );

                retry.put(
                    "retryAfterMs",
                    retryAfterMs
                );

                retry.put(
                    "state",
                    sessionState()
                );

                resolveSuccess(
                    call,
                    retry
                );

                return;
            }

            boolean verified =
                securityCode != null &&
                securityStore.verify(
                    issuerId,
                    securityCode
                );

            if (!verified) {

                sessionFailedAttempts +=
                    1;

                long backoffMilliseconds =
                    computeBackoffMilliseconds(
                        sessionFailedAttempts
                    );

                sessionBlockedUntilMilliseconds =
                    System.currentTimeMillis() +
                    backoffMilliseconds;

                securityStore.writeThrottle(
                    issuerId,
                    sessionFailedAttempts,
                    sessionBlockedUntilMilliseconds
                );

                JSObject invalid =
                    new JSObject();

                invalid.put(
                    "success",
                    false
                );

                invalid.put(
                    "errorCode",
                    "SECURITY_CODE_INVALID"
                );

                invalid.put(
                    "retryAfterMs",
                    backoffMilliseconds
                );

                invalid.put(
                    "state",
                    sessionState()
                );

                resolveSuccess(
                    call,
                    invalid
                );

                return;
            }

            securityStore.clearThrottle(
                issuerId
            );

            sessionUnlocked =
                true;

            sessionFailedAttempts =
                0;

            sessionBlockedUntilMilliseconds =
                0L;

            JSObject unlocked =
                new JSObject();

            unlocked.put(
                "success",
                true
            );

            unlocked.put(
                "status",
                "UNLOCKED"
            );

            unlocked.put(
                "state",
                sessionState()
            );

            resolveSuccess(
                call,
                unlocked
            );

        } catch (Exception error) {

            sessionUnlocked =
                false;

            resolveFailure(
                call,
                error.getMessage() != null
                    ? error.getMessage()
                    : "FINORA Developer Control Center unlock failed."
            );
        }
    }

    @PluginMethod
    public void lockDeveloperControlCenter(
        PluginCall call
    ) {

        sessionUnlocked =
            false;

        JSObject lock =
            new JSObject();

        lock.put(
            "locked",
            true
        );

        lock.put(
            "session",
            sessionState()
        );

        resolveSuccess(
            call,
            lock
        );
    }

    @PluginMethod
    public void changeDeveloperSecurityCode(
        PluginCall call
    ) {

        try {

            if (!sessionUnlocked) {

                resolveFailure(
                    call,
                    "FINORA Developer Control Center privileged authority is locked."
                );

                return;
            }

            String oldSecurityCode =
                call.getString(
                    "oldSecurityCode"
                );

            String newDeveloperSecurityCode =
                call.getString(
                    "newDeveloperSecurityCode"
                );

            if (
                oldSecurityCode == null ||
                newDeveloperSecurityCode == null
            ) {
                resolveFailure(
                    call,
                    "FINORA Developer Security Code change request is invalid."
                );

                return;
            }

            FinoraDeveloperControlCenterKeyVaultStore keyVaultStore =
                new FinoraDeveloperControlCenterKeyVaultStore(
                    getContext()
                );

            JSONObject vault =
                keyVaultStore.read();

            if (vault == null) {

                resolveFailure(
                    call,
                    "FINORA Developer Control Center signing authority is unavailable."
                );

                return;
            }

            String issuerId =
                vault.getString(
                    "issuerId"
                );

            FinoraDeveloperSecurityCodeStore securityStore =
                new FinoraDeveloperSecurityCodeStore(
                    getContext()
                );

            boolean changed =
                securityStore.change(
                    issuerId,
                    oldSecurityCode,
                    newDeveloperSecurityCode
                );

            if (changed) {

                sessionFailedAttempts =
                    0;

                sessionBlockedUntilMilliseconds =
                    0L;
            }

            resolveSuccess(
                call,
                changed
            );

        } catch (Exception error) {

            resolveFailure(
                call,
                error.getMessage() != null
                    ? error.getMessage()
                    : "FINORA Developer Security Code change failed."
            );
        }
    }

    // ============================================================
    // PORTABLE STATE IMPORT - ANDROID DEVELOPER CONTROL CENTER
    // ============================================================

    @PluginMethod
    public void importPortableState(
        PluginCall call
    ) {

        if (!sessionUnlocked) {
            resolveFailure(
                call,
                "FINORA Developer Control Center must be unlocked before Portable State import."
            );
            return;
        }

        String transferCode =
            call.getString(
                "transferCode"
            );

        if (
            transferCode == null ||
            transferCode.length() < 12 ||
            transferCode.length() > 128 ||
            !transferCode.equals(
                transferCode.trim()
            )
        ) {
            resolveFailure(
                call,
                "A valid FINORA Portable State Transfer Code is required."
            );
            return;
        }

        Intent intent =
            new Intent(
                Intent.ACTION_OPEN_DOCUMENT
            );

        intent.addCategory(
            Intent.CATEGORY_OPENABLE
        );

        intent.setType(
            "application/json"
        );

        intent.putExtra(
            Intent.EXTRA_MIME_TYPES,
            new String[] {
                "application/json",
                "text/plain",
                "application/octet-stream"
            }
        );

        startActivityForResult(
            call,
            intent,
            "portableStateSelected"
        );
    }


    @ActivityCallback
    private void portableStateSelected(
        PluginCall call,
        ActivityResult result
    ) {

        if (call == null) {
            return;
        }

        if (
            result == null ||
            result.getResultCode() !=
                Activity.RESULT_OK ||
            result.getData() == null ||
            result.getData().getData() == null
        ) {
            resolveFailure(
                call,
                "FINORA Portable State file selection was cancelled."
            );
            return;
        }

        String transferCode =
            call.getString(
                "transferCode"
            );

        if (
            transferCode == null ||
            transferCode.length() < 12 ||
            transferCode.length() > 128
        ) {
            resolveFailure(
                call,
                "FINORA Portable State Transfer Code is unavailable."
            );
            return;
        }

        Uri uri =
            result
                .getData()
                .getData();

        byte[] bytes =
            null;

        try {

            bytes =
                readPortableStateDocument(
                    uri
                );

            String serialized =
                new String(
                    bytes,
                    java.nio.charset.StandardCharsets.UTF_8
                );

            JSONObject transferBundle =
                new JSONObject(
                    serialized
                );

            JSONObject envelope =
                FinoraDeveloperPortableStateTransferCrypto.decrypt(
                    transferBundle,
                    transferCode
                );

            FinoraDeveloperControlCenterKeyVaultStore keyVaultStore =
                new FinoraDeveloperControlCenterKeyVaultStore(
                    getContext()
                );

            JSONObject vault =
                keyVaultStore.read();

            if (vault == null) {
                throw new IllegalStateException(
                    "FINORA Control Center signing authority is unavailable. Restore Admin Authority first."
                );
            }

            JSONObject payload =
                FinoraDeveloperPortableStateVerifier.verify(
                    envelope,
                    vault
                );

            FinoraDeveloperPortableStateStore stateStore =
                new FinoraDeveloperPortableStateStore(
                    getContext()
                );

            String adoptionStatus =
                stateStore.adoptVerifiedEnvelope(
                    envelope
                );

            JSObject response =
                new JSObject();

            response.put(
                "status",
                adoptionStatus
            );

            response.put(
                "stateGeneration",
                payload.getLong(
                    "stateGeneration"
                )
            );

            response.put(
                "payloadSha256",
                envelope.getString(
                    "payloadSha256"
                )
            );

            if (
                payload.isNull(
                    "parentPayloadSha256"
                )
            ) {
                response.put(
                    "parentPayloadSha256",
                    JSONObject.NULL
                );
            } else {
                response.put(
                    "parentPayloadSha256",
                    payload.getString(
                        "parentPayloadSha256"
                    )
                );
            }

            resolveSuccess(
                call,
                response
            );

        } catch (Exception error) {

            resolveFailure(
                call,
                error.getMessage() != null
                    ? error.getMessage()
                    : "FINORA Portable State import failed."
            );

        } finally {

            if (bytes != null) {
                java.util.Arrays.fill(
                    bytes,
                    (byte) 0
                );
            }
        }
    }


    private byte[] readPortableStateDocument(
        Uri uri
    ) throws Exception {

        java.io.InputStream input =
            getContext()
                .getContentResolver()
                .openInputStream(
                    uri
                );

        if (input == null) {
            throw new IllegalStateException(
                "FINORA Portable State document could not be opened."
            );
        }

        try {

            java.io.ByteArrayOutputStream output =
                new java.io.ByteArrayOutputStream();

            byte[] buffer =
                new byte[8192];

            int read;

            while (
                (
                    read =
                        input.read(
                            buffer
                        )
                ) != -1
            ) {

                output.write(
                    buffer,
                    0,
                    read
                );

                if (
                    output.size() >
                    40 * 1024 * 1024
                ) {
                    throw new IllegalStateException(
                        "FINORA Portable State document exceeds the supported size limit."
                    );
                }
            }

            byte[] bytes =
                output.toByteArray();

            if (bytes.length == 0) {
                throw new IllegalStateException(
                    "FINORA Portable State document is empty."
                );
            }

            return bytes;

        } finally {

            input.close();
        }
    }


    // ============================================================
    // CURRENT CONTROL CENTER TRUST / SIGNING AUTHORITY VIEW
    // ============================================================

    @PluginMethod
    public void getTrustRecord(
        PluginCall call
    ) {

        if (!sessionUnlocked) {
            resolveFailure(
                call,
                "FINORA Developer Control Center is locked."
            );
            return;
        }

        try {

            FinoraDeveloperControlCenterKeyVaultStore keyVaultStore =
                new FinoraDeveloperControlCenterKeyVaultStore(
                    getContext()
                );

            JSONObject vault =
                keyVaultStore.read();

            if (vault == null) {
                throw new IllegalStateException(
                    "FINORA Control Center signing authority is unavailable."
                );
            }

            JSObject trust =
                new JSObject();

            trust.put(
                "issuerId",
                vault.getString(
                    "issuerId"
                )
            );

            trust.put(
                "signingKeyId",
                vault.getString(
                    "signingKeyId"
                )
            );

            trust.put(
                "publicKeySpkiDerBase64",
                vault.getString(
                    "publicKeySpkiDerBase64"
                )
            );

            trust.put(
                "createdAt",
                vault.getString(
                    "createdAt"
                )
            );

            resolveSuccess(
                call,
                trust
            );

        } catch (Exception error) {

            resolveFailure(
                call,
                error.getMessage() != null
                    ? error.getMessage()
                    : "FINORA Control Center Trust Record could not be loaded."
            );
        }
    }


    // ============================================================
    // FINORA_PORTABLE_BRANCH_DIRECTORY_METADATA_VIEW
    //
    // Read-only Android view of the verified Portable State.
    // Portable payload contract:
    //   branchDirectoryMetadata: { records: [...] }
    //
    // No independent mutable Android registry is created here.
    // The imported, signature-verified Portable State remains
    // the authoritative cross-device snapshot.
    // ============================================================

    @PluginMethod
    public void getBranchDirectoryMetadata(
        PluginCall call
    ) {

        if (!sessionUnlocked) {
            resolveFailure(
                call,
                "FINORA Developer Control Center is locked."
            );
            return;
        }

        try {

            FinoraDeveloperPortableStateStore stateStore =
                new FinoraDeveloperPortableStateStore(
                    getContext()
                );

            JSONObject envelope =
                stateStore.read();

            if (envelope == null) {
                resolveSuccess(
                    call,
                    new org.json.JSONArray()
                );
                return;
            }

            JSONObject payload =
                envelope.getJSONObject(
                    "payload"
                );

            JSONObject directoryMetadata =
                payload.optJSONObject(
                    "branchDirectoryMetadata"
                );

            if (directoryMetadata == null) {
                resolveSuccess(
                    call,
                    new org.json.JSONArray()
                );
                return;
            }

            org.json.JSONArray records =
                directoryMetadata.optJSONArray(
                    "records"
                );

            resolveSuccess(
                call,
                records != null
                    ? records
                    : new org.json.JSONArray()
            );

        } catch (Exception error) {

            resolveFailure(
                call,
                error.getMessage() != null
                    ? error.getMessage()
                    : "Unable to load FINORA Branch Directory Metadata."
            );
        }
    }
    // ============================================================
    // FINORA_ANDROID_BRANCH_SOFT_DELETE_V1
    //
    // Signed Portable State remains immutable.
    // Exact original Branch record is preserved in Restore Bin.
    // Subscription / recharge / pricing / entitlement remain intact.
    // ============================================================

    @PluginMethod
    public void deleteBranchRegistryRecord(
        PluginCall call
    ) {

        if (!sessionUnlocked) {
            resolveFailure(
                call,
                "FINORA Developer Control Center is locked."
            );
            return;
        }

        try {

            String ownerId =
                call.getString(
                    "ownerId",
                    ""
                );

            String businessId =
                call.getString(
                    "businessId",
                    ""
                );

            String branchId =
                call.getString(
                    "branchId",
                    ""
                );

            String confirmationText =
                call.getString(
                    "confirmationText",
                    ""
                );

            if (
                ownerId.trim().isEmpty() ||
                businessId.trim().isEmpty() ||
                branchId.trim().isEmpty()
            ) {
                throw new IllegalArgumentException(
                    "FINORA Branch delete request is incomplete."
                );
            }

            int confirmationCount =
                confirmationText
                    .replaceAll(
                        "\\s",
                        ""
                    )
                    .length();

            if (confirmationCount < 15) {
                throw new IllegalArgumentException(
                    "FINORA Branch delete confirmation requires at least 15 non-space characters."
                );
            }

            FinoraDeveloperPortableStateStore stateStore =
                new FinoraDeveloperPortableStateStore(
                    getContext()
                );

            JSONObject envelope =
                stateStore.read();

            if (envelope == null) {
                throw new IllegalStateException(
                    "FINORA Portable State has not been imported on this device yet."
                );
            }

            JSONObject payload =
                envelope.getJSONObject(
                    "payload"
                );

            JSONObject registry =
                payload.optJSONObject(
                    "branchRegistry"
                );

            if (registry == null) {
                throw new IllegalStateException(
                    "FINORA Branch Registry is unavailable."
                );
            }

            org.json.JSONArray branches =
                registry.optJSONArray(
                    "branches"
                );

            if (branches == null) {
                throw new IllegalStateException(
                    "FINORA Branch Registry records are unavailable."
                );
            }

            JSONObject matchingBranch =
                null;

            int originalIndex =
                -1;

            int matchCount =
                0;

            for (
                int index = 0;
                index < branches.length();
                index++
            ) {

                JSONObject branch =
                    branches.getJSONObject(
                        index
                    );

                JSONObject identity =
                    branch.optJSONObject(
                        "identity"
                    );

                if (
                    identity != null &&
                    ownerId.equals(
                        identity.optString(
                            "ownerId",
                            ""
                        )
                    ) &&
                    businessId.equals(
                        identity.optString(
                            "businessId",
                            ""
                        )
                    ) &&
                    branchId.equals(
                        identity.optString(
                            "branchId",
                            ""
                        )
                    )
                ) {

                    matchCount++;

                    matchingBranch =
                        new JSONObject(
                            branch.toString()
                        );

                    originalIndex =
                        index;
                }
            }

            if (
                matchCount != 1 ||
                matchingBranch == null
            ) {
                throw new IllegalStateException(
                    "FINORA exact Branch delete expected 1 Registry record but found " +
                    matchCount +
                    "."
                );
            }

            FinoraDeveloperBranchRestoreBinStore restoreStore =
                new FinoraDeveloperBranchRestoreBinStore(
                    getContext()
                );

            restoreStore.deleteBranch(
                matchingBranch,
                originalIndex
            );

            JSONObject visibleRegistry =
                createVisibleBranchRegistry(
                    registry,
                    restoreStore
                );

            resolveSuccess(
                call,
                visibleRegistry
            );

        } catch (Exception error) {

            resolveFailure(
                call,
                error.getMessage() != null
                    ? error.getMessage()
                    : "FINORA Branch could not be moved to the Restore Bin."
            );
        }
    }

    private JSONObject createVisibleBranchRegistry(
        JSONObject registry,
        FinoraDeveloperBranchRestoreBinStore restoreStore
    ) throws Exception {

        JSONObject visible =
            new JSONObject(
                registry.toString()
            );

        org.json.JSONArray branches =
            registry.optJSONArray(
                "branches"
            );

        if (branches == null) {
            return visible;
        }

        org.json.JSONArray visibleBranches =
            new org.json.JSONArray();

        for (
            int index = 0;
            index < branches.length();
            index++
        ) {

            JSONObject branch =
                branches.getJSONObject(
                    index
                );

            JSONObject identity =
                branch.optJSONObject(
                    "identity"
                );

            if (identity == null) {
                throw new IllegalStateException(
                    "FINORA Branch Registry contains a record without identity."
                );
            }

            String ownerId =
                identity.optString(
                    "ownerId",
                    ""
                );

            String businessId =
                identity.optString(
                    "businessId",
                    ""
                );

            String branchId =
                identity.optString(
                    "branchId",
                    ""
                );

            if (
                !restoreStore.isDeleted(
                    ownerId,
                    businessId,
                    branchId
                )
            ) {
                visibleBranches.put(
                    new JSONObject(
                        branch.toString()
                    )
                );
            }
        }

        visible.put(
            "branches",
            visibleBranches
        );

        return visible;
    }

    // ============================================================
    // ============================================================
    // FINORA_ANDROID_BRANCH_RESTORE_API_V1
    // ============================================================

    @PluginMethod
    public void getDeletedBranchRestoreBin(
        PluginCall call
    ) {

        if (!sessionUnlocked) {
            resolveFailure(
                call,
                "FINORA Developer Control Center is locked."
            );
            return;
        }

        try {

            FinoraDeveloperBranchRestoreBinStore restoreStore =
                new FinoraDeveloperBranchRestoreBinStore(
                    getContext()
                );

            resolveSuccess(
                call,
                restoreStore.readDeletedBranches()
            );

        } catch (Exception error) {

            resolveFailure(
                call,
                error.getMessage() != null
                    ? error.getMessage()
                    : "Unable to load FINORA Branch Restore Bin."
            );
        }
    }

    @PluginMethod
    public void restoreBranchRegistryRecord(
        PluginCall call
    ) {

        if (!sessionUnlocked) {
            resolveFailure(
                call,
                "FINORA Developer Control Center is locked."
            );
            return;
        }

        try {

            String ownerId =
                call.getString(
                    "ownerId",
                    ""
                );

            String businessId =
                call.getString(
                    "businessId",
                    ""
                );

            String branchId =
                call.getString(
                    "branchId",
                    ""
                );

            FinoraDeveloperBranchRestoreBinStore restoreStore =
                new FinoraDeveloperBranchRestoreBinStore(
                    getContext()
                );

            restoreStore.restoreBranch(
                ownerId,
                businessId,
                branchId
            );

            FinoraDeveloperPortableStateStore stateStore =
                new FinoraDeveloperPortableStateStore(
                    getContext()
                );

            JSONObject envelope =
                stateStore.read();

            if (envelope == null) {
                throw new IllegalStateException(
                    "FINORA Portable State has not been imported on this device yet."
                );
            }

            JSONObject payload =
                envelope.getJSONObject(
                    "payload"
                );

            JSONObject registry =
                payload.optJSONObject(
                    "branchRegistry"
                );

            if (registry == null) {
                throw new IllegalStateException(
                    "FINORA Branch Registry is unavailable."
                );
            }

            resolveSuccess(
                call,
                createVisibleBranchRegistry(
                    registry,
                    restoreStore
                )
            );

        } catch (Exception error) {

            resolveFailure(
                call,
                error.getMessage() != null
                    ? error.getMessage()
                    : "Unable to restore FINORA Branch."
            );
        }
    }
    // PORTABLE BRANCH REGISTRY VIEW
    // ============================================================

    @PluginMethod
    public void getBranchRegistry(
        PluginCall call
    ) {

        if (!sessionUnlocked) {
            resolveFailure(
                call,
                "FINORA Developer Control Center is locked."
            );
            return;
        }

        try {

            FinoraDeveloperPortableStateStore stateStore =
                new FinoraDeveloperPortableStateStore(
                    getContext()
                );

            JSONObject envelope =
                stateStore.read();

            if (envelope == null) {
                resolveFailure(
                    call,
                    "FINORA Portable State has not been imported on this device yet."
                );
                return;
            }

            JSONObject payload =
                envelope.getJSONObject(
                    "payload"
                );

            Object branchRegistry =
                payload.opt(
                    "branchRegistry"
                );

            if (
                branchRegistry == null ||
                branchRegistry == JSONObject.NULL
            ) {
                resolveSuccess(
                    call,
                    null
                );
                return;
            }

            if (!(branchRegistry instanceof JSONObject)) {
                throw new IllegalStateException(
                    "FINORA Branch Registry payload is invalid."
                );
            }

            FinoraDeveloperBranchRestoreBinStore restoreStore =
                new FinoraDeveloperBranchRestoreBinStore(
                    getContext()
                );

            JSONObject visibleRegistry =
                createVisibleBranchRegistry(
                    (JSONObject) branchRegistry,
                    restoreStore
                );

            resolveSuccess(
                call,
                visibleRegistry
            );

        } catch (Exception error) {

            resolveFailure(
                call,
                error.getMessage() != null
                    ? error.getMessage()
                    : "FINORA Control Center Branch Registry could not be loaded."
            );
        }
    }

}
