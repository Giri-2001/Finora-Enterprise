package com.finora.enterprise.control;

import org.json.JSONObject;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import javax.net.ssl.HttpsURLConnection;

final class FinoraNativeWalletSession {
    private static final String BALANCE_URL =
        "https://api.finoraenterprise.com/owner/wallet/balance";

    // Volatile process memory only: never WebView, disk, USB or logs.
    private static String bearerToken;
    private static java.time.Instant walletExpiresAt;
    private static long walletSessionGeneration = 0L;
    private static boolean walletRotationInFlight = false;
    private static long walletRotationFlightGeneration = -1L;
    // FINORA_P1_720X2
    // Session credentials stay in native process memory.
    private static String verifiedBusinessSessionId;
    private static JSONObject verifiedWalletPrincipal;
    private static JSONObject verifiedBusinessPrincipal;

    // FINORA_P1_727C_ANDROID_NETWORK
    // Process-memory status only. Never grants business access.
    private static boolean businessVerifyNetworkUnavailable = false;
    // P1-737H2: diagnostic category only, never credentials.
    private static String businessVerifyFailureCode =
        "BUSINESS_SESSION_VERIFY_FAILED";


    // FINORA_P1_720Z2
    private static String receptionHandle;

    private FinoraNativeWalletSession() {}

    private static JSONObject failure(String code) {
        JSONObject result = new JSONObject();
        try {
            result.put("success", false);
            result.put("loginAuthorized", false);
            result.put("errorCode", code);
        } catch (Exception ignored) {}
        return result;
    }

    // FINORA_C80_AUTH_R155_VERIFIED_LOGIN_USERNAME
    // Native-memory only. Never written to USB or WebView.
    private static String authenticatedLoginUsername = null;

    static synchronized boolean matchesAuthenticatedLoginUsername(
        String requested
    ) {
        return authenticatedLoginUsername != null &&
            requested != null &&
            !requested.trim().isEmpty() &&
            authenticatedLoginUsername.equalsIgnoreCase(
                requested.trim()
            );
    }

    static synchronized void clear() {
        PaisaruleAndroidBackupKeyAuthority.clear();
        bearerToken = null;
        walletExpiresAt = null;
        walletSessionGeneration++;
        walletRotationInFlight = false;
        walletRotationFlightGeneration = -1L;
        authenticatedLoginUsername = null;
        verifiedBusinessSessionId = null;
        receptionHandle = null;
        verifiedWalletPrincipal = null;
        verifiedBusinessPrincipal = null;
    }

    static synchronized JSONObject login(
        String username, String password
    ) {
        clear();

        JSONObject server =
            FinoraAccountPasswordLoginClient.login(username, password);

        if (!server.optBoolean("ok", false)
            || !"ACCOUNT_WALLET_ONLY".equals(
                server.optString("sessionType", ""))
            || server.optBoolean("businessDataAccess", true)) {
            return failure(
                server.optString("errorCode", "SERVER_LOGIN_NOT_VERIFIED")
            );
        }

        String token = server.optString("accessToken", "");

        if (!token.matches("^[a-fA-F0-9]{64}$")) {
            return failure("INVALID_SERVER_TOKEN");
        }

        // PAISARULE R155: Server-issued Wallet expiry authority.
        // Never derive Wallet expiry from the Android login clock.
        final String walletExpiryText = server.optString("expiresAt", "");
        final java.time.Instant validatedWalletExpiry;
        try {
            validatedWalletExpiry = java.time.Instant.parse(walletExpiryText);
        } catch (Exception invalidExpiry) {
            return failure("WALLET_EXPIRY_INVALID");
        }

        final java.time.Instant walletExpiryCheckNow =
            java.time.Instant.now();

        if (!validatedWalletExpiry.isAfter(walletExpiryCheckNow) ||
            validatedWalletExpiry.isAfter(
                walletExpiryCheckNow.plusSeconds(3900L))) {
            return failure("WALLET_EXPIRY_INVALID");
        }

        bearerToken = token;
        walletExpiresAt = validatedWalletExpiry;
        JSONObject wallet = fetchBalance();

        if (wallet == null) {
            clear();
            return failure("SERVER_WALLET_NOT_VERIFIED");
        }

        JSONObject result = new JSONObject();
        try {
            result.put("success", true);
            result.put("loginAuthorized", false);
            result.put("sessionType", "ACCOUNT_WALLET_ONLY");
            result.put("businessDataAccess", false);
            result.put("wallet", wallet);
            // FINORA_P1_737C: Never confuse Wallet success with
            // Reception authorization. Fail closed with a useful reason.
            boolean businessVerified = verifyBusinessSession(server);
            result.put("businessSessionVerified", businessVerified);

            if (!businessVerified) {
                String rejection = "BUSINESS_SESSION_VERIFY_FAILED";
                JSONObject issued = server.optJSONObject("businessSession");

                if (issued == null) {
                    rejection = "BUSINESS_SESSION_NOT_ISSUED";
                } else if (!"BUSINESS_RECEPTION".equals(
                    issued.optString("sessionType", ""))) {
                    rejection = "BUSINESS_SESSION_TYPE_INVALID";
                } else if (!issued.optString("sessionId", "")
                    .matches("^[a-f0-9]{64}$")) {
                    rejection = "BUSINESS_SESSION_HANDLE_INVALID";
                } else if (businessVerifyNetworkUnavailable) {
                    rejection = "BUSINESS_SESSION_NETWORK_UNAVAILABLE";
                }

                if ("BUSINESS_SESSION_VERIFY_FAILED".equals(rejection)) {
                    rejection = businessVerifyFailureCode;
                }
                result.put("businessSessionErrorCode", rejection);
            }
        } catch (Exception ignored) {
            clear();
            return failure("NATIVE_RESPONSE_INVALID");
        }

        // Username is accepted only after server-authenticated
        // Account Login and verified Business Session.
        authenticatedLoginUsername =
            result.optBoolean("businessSessionVerified", false)
                ? username.trim()
                : null;

        if (result.optBoolean("businessSessionVerified", false)) {
            PaisaruleAndroidBackupKeyAuthority.captureVerifiedLogin(
                password,
                verifiedBusinessPrincipal,
                walletSessionGeneration
            );
        }

        return result;
    }

    // FINORA_P1_695G_SESSION_LIFECYCLE
    // Every balance refresh revalidates the native bearer
    // against the PostgreSQL-backed server authority.
    static synchronized JSONObject verifiedBalance() {
        JSONObject wallet = fetchBalance();

        if (wallet == null) {
            clear();
            return failure("WALLET_SESSION_NOT_AUTHORIZED");
        }

        JSONObject result = new JSONObject();

        try {
            result.put("success", true);
            result.put("businessDataAccess", false);
            result.put("wallet", wallet);
            return result;
        } catch (Exception ignored) {
            clear();
            return failure("WALLET_RESPONSE_INVALID");
        }
    }
    // FINORA_P1_695H_SERVER_LOGOUT
    // Synchronized with login and balance refresh.
    // Local token is always cleared, even during an outage.
    static synchronized JSONObject logout() {
        HttpsURLConnection connection = null;
        boolean revoked = false;

        try {
            if (bearerToken != null) {
                connection = (HttpsURLConnection)
                    new URL(
                        "https://api.finoraenterprise.com/owner/wallet/logout"
                    ).openConnection();

                connection.setRequestMethod("POST");
                connection.setConnectTimeout(10000);
                connection.setReadTimeout(10000);
                connection.setInstanceFollowRedirects(false);
                connection.setUseCaches(false);
                connection.setDoOutput(true);
                connection.setRequestProperty(
                    "Authorization", "Bearer " + bearerToken
                );
                connection.setRequestProperty(
                    "Content-Type", "application/json"
                );
                connection.setRequestProperty(
                    "Cache-Control", "no-store"
                );

                try (java.io.OutputStream out =
                    connection.getOutputStream()) {
                    out.write(
                        "{}".getBytes(StandardCharsets.UTF_8)
                    );
                }

                if (connection.getResponseCode() == 200) {
                    try (InputStream in =
                        connection.getInputStream()) {
                        byte[] bytes = new byte[4096];
                        int n = in.read(bytes);
                        if (n > 0) {
                            JSONObject response = new JSONObject(
                                new String(
                                    bytes, 0, n,
                                    StandardCharsets.UTF_8
                                )
                            );
                            revoked =
                                response.optBoolean("ok", false) &&
                                response.optBoolean("revoked", false);
                        }
                    }
                }
            }
        } catch (Exception ignored) {
            revoked = false;
        } finally {
            clear();
            if (connection != null) connection.disconnect();
        }

        JSONObject result = new JSONObject();
        try {
            // FINORA_P1_695I_LOGOUT_FAIL_CLOSED
            // Local clearing alone is not confirmed server logout.
            result.put("success", revoked);
            result.put("localCleared", true);
            result.put("serverRevoked", revoked);
            if (!revoked) {
                result.put("errorCode", "SERVER_LOGOUT_NOT_CONFIRMED");
            }
        } catch (Exception ignored) {}
        return result;
    }
    // FINORA_P1_696K_BUSINESS_VERIFY
    // Server verification only. No Reception privilege granted.
    private static boolean verifyBusinessSession(JSONObject login) {
        businessVerifyNetworkUnavailable = false;
        businessVerifyFailureCode = "BUSINESS_SESSION_VERIFY_FAILED";
        JSONObject session = login.optJSONObject("businessSession");

        if (session == null ||
            !"BUSINESS_RECEPTION".equals(
                session.optString("sessionType", ""))) {
            return false;
        }

        String credential = session.optString("sessionId", "");

        if (!credential.matches("^[a-f0-9]{64}$")) {
            return false;
        }

        HttpsURLConnection connection = null;

        try {
            connection = (HttpsURLConnection) new URL(
                "https://api.finoraenterprise.com/owner/business/session/verify"
            ).openConnection();

            connection.setRequestMethod("POST");
            connection.setConnectTimeout(10000);
            connection.setReadTimeout(10000);
            connection.setInstanceFollowRedirects(false);
            connection.setUseCaches(false);
            connection.setDoOutput(true);

            connection.setRequestProperty(
                "Authorization", "Bearer " + credential);
            connection.setRequestProperty(
                "Content-Type", "application/json");
            connection.setRequestProperty(
                "Cache-Control", "no-store");

            try (java.io.OutputStream out =
                     connection.getOutputStream()) {
                out.write("{}".getBytes(StandardCharsets.UTF_8));
            }

            int status = connection.getResponseCode();
            if (status != 200) {
                businessVerifyFailureCode =
                    status == 401 ? "BUSINESS_SESSION_HTTP_401" :
                    status == 403 ? "BUSINESS_SESSION_HTTP_403" :
                    status == 503 ? "BUSINESS_SESSION_HTTP_503" :
                    "BUSINESS_SESSION_HTTP_REJECTED";
                return false;
            }

            ByteArrayOutputStream output = new ByteArrayOutputStream();

            try (InputStream input = connection.getInputStream()) {
                byte[] buffer = new byte[4096];
                int count;

                while ((count = input.read(buffer)) != -1) {
                    if (output.size() + count > 16384) {
                        return false;
                    }
                    output.write(buffer, 0, count);
                }
            }

            JSONObject response = new JSONObject(
                new String(output.toByteArray(), StandardCharsets.UTF_8)
            );

            JSONObject principal = response.optJSONObject("principal");

            // FINORA_P1_696M_EXACT_SCOPE
            // Compare two independently server-issued principals.
            // Never accept renderer-supplied owner or branch IDs.
            JSONObject walletPrincipal =
                login.optJSONObject("principal");

            if (principal == null || walletPrincipal == null) {
                businessVerifyFailureCode = "BUSINESS_PRINCIPAL_MISSING";
                return false;
            }

            for (String field : new String[]{
                "userId", "ownerId", "businessId", "branchId"
            }) {
                String walletId =
                    walletPrincipal.optString(field, "");
                String businessId =
                    principal.optString(field, "");

                if (walletId.isEmpty() ||
                    businessId.isEmpty() ||
                    !walletId.equals(businessId)) {
                    businessVerifyFailureCode = "BUSINESS_SCOPE_MISMATCH";
                    return false;
                }
            }

            for (String field : new String[]{
                "userId", "ownerId", "businessId", "branchId"
            }) {
                if (principal.optString(field, "").trim().isEmpty()) {
                    return false;
                }
            }

            boolean authorized =
                response.optBoolean("ok", false)
                && "BUSINESS_RECEPTION".equals(
                    response.optString("sessionType", ""))
                && response.optBoolean("businessDataAccess", false)
                && "OWNER".equals(principal.optString("role", ""))
                && principal.has("credentialChangeRequired")
                && !principal.isNull("credentialChangeRequired")
                && Boolean.FALSE.equals(
                    principal.opt("credentialChangeRequired"))
                && "USB".equalsIgnoreCase(
                    principal.optString("storageMode", ""));

            if (authorized) {
                verifiedBusinessSessionId = credential;
                verifiedWalletPrincipal =
                    new JSONObject(walletPrincipal.toString());
                verifiedBusinessPrincipal =
                    new JSONObject(principal.toString());
            }

            // FINORA_P1_737J_VERIFICATION_DIAGNOSTIC
            // Error categories only. Never expose server principals.
            if (!authorized) {
                if (!response.optBoolean("ok", false)) {
                    businessVerifyFailureCode = "BUSINESS_RESPONSE_NOT_OK";
                } else if (!"BUSINESS_RECEPTION".equals(
                    response.optString("sessionType", ""))) {
                    businessVerifyFailureCode = "BUSINESS_RESPONSE_TYPE_INVALID";
                } else if (!response.optBoolean(
                    "businessDataAccess", false)) {
                    businessVerifyFailureCode = "BUSINESS_ACCESS_NOT_GRANTED";
                } else if (!"OWNER".equals(
                    principal.optString("role", ""))) {
                    businessVerifyFailureCode = "BUSINESS_OWNER_ROLE_INVALID";
                } else if (!principal.has("credentialChangeRequired")
                    || !Boolean.FALSE.equals(
                        principal.opt("credentialChangeRequired"))) {
                    businessVerifyFailureCode = "BUSINESS_CREDENTIAL_PROOF_INVALID";
                } else if (!"USB".equalsIgnoreCase(
                    principal.optString("storageMode", ""))) {
                    businessVerifyFailureCode = "BUSINESS_STORAGE_MODE_INVALID";
                } else {
                    businessVerifyFailureCode = "BUSINESS_AUTHORITY_DENIED";
                }
            }
            return authorized;

        } catch (java.io.IOException networkFailure) {
            businessVerifyFailureCode = "BUSINESS_VERIFY_NETWORK_ERROR";
            // A timeout/connection failure is not a 401 rejection.
            businessVerifyNetworkUnavailable = true;
            return false;
        } catch (Exception ignored) {
            businessVerifyFailureCode = "BUSINESS_VERIFY_RUNTIME_ERROR";
            return false;
        } finally {
            if (connection != null) connection.disconnect();
        }
    }
    // FINORA_P1_720X2_SERVER_REVALIDATION
    // No credential or bearer token returned to JavaScript.
    /**
     * PAISARULE R172-B9
     *
     * Native-only authorized Business Backup preparation.
     *
     * Must never be exposed as a renderer-facing method.
     * Only the later trusted native Save As handler may call it.
     *
     * No plaintext, encryption key, or server credential
     * is returned to JavaScript.
     */

    // PAISARULE_R175_C25_AUTHENTICATED_RESTORE
    // Native-only verified Restore preparation.
    // Does not write files or expose decrypted data to JS.
    // ========================================================
    // PAISARULE_R175_C27_AUTHENTICATED_COMMIT
    //
    // Native internal use only.
    // Not exposed through a Capacitor PluginMethod.
    //
    // Session lock spans verification, decryption and
    // the entire USB transaction.
    // ========================================================

    static synchronized void
    commitPaisaruleAndroidRestoreToNewUsb(
        android.content.Context context,
        android.net.Uri selectedBackupUri,
        android.net.Uri selectedUsbUri
    ) throws Exception {

        if (
            context == null ||
            selectedBackupUri == null ||
            selectedUsbUri == null
        ) {
            throw new IllegalArgumentException(
                "RESTORE_SELECTION_REQUIRED"
            );
        }

        byte[][] verifiedFiles = null;

        try {
            // This method revalidates the server-backed
            // Owner business session, scoped key and
            // encrypted backup payload.
            verifiedFiles =
                preparePaisaruleAndroidRestoreVerifiedFiles(
                    context,
                    selectedBackupUri
                );

            if (
                verifiedFiles == null ||
                verifiedFiles.length != 2 ||
                verifiedFiles[0] == null ||
                verifiedFiles[1] == null
            ) {
                throw new IllegalStateException(
                    "RESTORE_VERIFIED_FILES_INVALID"
                );
            }

            // Revalidate the removable target and commit
            // under the same native session lock.
            com.finora.enterprise.usb
                .PaisaruleRestoreUsbCommitBridge
                .commitVerifiedFiles(
                    context,
                    selectedUsbUri,
                    verifiedFiles
                );

        } finally {
            // Clear decrypted original storage bytes,
            // including when USB write or readback fails.
            if (verifiedFiles != null) {
                for (byte[] file : verifiedFiles) {
                    if (file != null) {
                        java.util.Arrays.fill(
                            file,
                            (byte) 0
                        );
                    }
                }
            }
        }
    }
    static synchronized byte[][]
    preparePaisaruleAndroidRestoreVerifiedFiles(
        android.content.Context context,
        android.net.Uri selectedBackupUri
    ) throws Exception {

        if (context == null ||
            selectedBackupUri == null ||
            !"content".equals(selectedBackupUri.getScheme())) {
            throw new IllegalArgumentException(
                "RESTORE_BACKUP_INPUT_INVALID"
            );
        }

        final long expectedGeneration = walletSessionGeneration;

        if (expectedGeneration <= 0L ||
            verifiedBusinessSessionId == null ||
            verifiedBusinessPrincipal == null ||
            verifiedWalletPrincipal == null) {
            throw new IllegalStateException(
                "RESTORE_BUSINESS_SESSION_REQUIRED"
            );
        }

        org.json.JSONObject authority = verifiedBusinessAuthority();

        if (!authority.optBoolean("success", false) ||
            !"BUSINESS_RECEPTION".equals(
                authority.optString("sessionType", "")) ||
            !authority.optBoolean("businessDataAccess", false)) {
            PaisaruleAndroidBackupKeyAuthority.clear();
            throw new IllegalStateException(
                "RESTORE_SERVER_SESSION_INVALID"
            );
        }

        if (walletSessionGeneration != expectedGeneration) {
            throw new IllegalStateException(
                "RESTORE_LOGIN_CHANGED"
            );
        }

        org.json.JSONObject principal =
            authority.optJSONObject("principal");

        if (principal == null ||
            !"OWNER".equals(principal.optString("role", "")) ||
            !"USB".equalsIgnoreCase(
                principal.optString("storageMode", ""))) {
            throw new IllegalStateException(
                "RESTORE_OWNER_NOT_AUTHORIZED"
            );
        }

        byte[] scopedKey =
            PaisaruleAndroidBackupKeyAuthority
                .copyForVerifiedScope(
                    principal,
                    expectedGeneration
                );

        if (scopedKey == null || scopedKey.length != 32) {
            if (scopedKey != null) {
                java.util.Arrays.fill(scopedKey, (byte) 0);
            }
            throw new IllegalStateException(
                "RESTORE_SCOPED_KEY_UNAVAILABLE"
            );
        }

        try {
            byte[][] files =
                PaisaruleAndroidBackupRestorePrepare
                    .prepareSelectedBackup(
                        context,
                        selectedBackupUri,
                        scopedKey,
                        principal
                    );

            if (walletSessionGeneration != expectedGeneration) {
                for (byte[] file : files) {
                    if (file != null) {
                        java.util.Arrays.fill(file, (byte) 0);
                    }
                }
                throw new IllegalStateException(
                    "RESTORE_LOGIN_CHANGED"
                );
            }

            return files;
        } finally {
            java.util.Arrays.fill(scopedKey, (byte) 0);
        }
    }
    static synchronized PaisaruleAndroidStorageBackupExport.Result
    preparePaisaruleAndroidBusinessBackup(
        com.finora.enterprise.usb.FinoraUsbStorage storage
    ) throws Exception {

        if (storage == null) {
            throw new IllegalStateException(
                "BACKUP_USB_STORAGE_REQUIRED"
            );
        }

        final long expectedGeneration =
            walletSessionGeneration;

        if (verifiedBusinessSessionId == null ||
            verifiedBusinessPrincipal == null ||
            verifiedWalletPrincipal == null) {
            PaisaruleAndroidBackupKeyAuthority.clear();

            throw new IllegalStateException(
                "BACKUP_BUSINESS_SESSION_REQUIRED"
            );
        }

        // Reverify against the authoritative server.
        // This does not grant access merely because the
        // local Wallet session previously succeeded.
        JSONObject authority = verifiedBusinessAuthority();

        if (!authority.optBoolean("success", false) ||
            !"BUSINESS_RECEPTION".equals(
                authority.optString("sessionType", "")
            ) ||
            !authority.optBoolean("businessDataAccess", false)) {

            PaisaruleAndroidBackupKeyAuthority.clear();

            throw new IllegalStateException(
                "BACKUP_SERVER_SESSION_INVALID"
            );
        }

        if (walletSessionGeneration != expectedGeneration) {
            PaisaruleAndroidBackupKeyAuthority.clear();

            throw new IllegalStateException(
                "BACKUP_LOGIN_CHANGED"
            );
        }

        JSONObject principal = authority.optJSONObject("principal");

        if (principal == null ||
            !"OWNER".equals(principal.optString("role", "")) ||
            !"USB".equalsIgnoreCase(
                principal.optString("storageMode", "")
            )) {

            PaisaruleAndroidBackupKeyAuthority.clear();

            throw new IllegalStateException(
                "BACKUP_OWNER_NOT_AUTHORIZED"
            );
        }

        byte[] scopedKey =
            PaisaruleAndroidBackupKeyAuthority
                .copyForVerifiedScope(
                    principal,
                    expectedGeneration
                );

        if (scopedKey == null || scopedKey.length != 32) {
            if (scopedKey != null) {
                java.util.Arrays.fill(scopedKey, (byte) 0);
            }

            throw new IllegalStateException(
                "BACKUP_SESSION_KEY_UNAVAILABLE"
            );
        }

        try {
            // This creates encrypted contents in native memory.
            // It does not write to disk or return data to WebView.
            return PaisaruleAndroidStorageBackupExport.prepare(
                storage,
                principal,
                scopedKey,
                expectedGeneration
            );
        } finally {
            java.util.Arrays.fill(scopedKey, (byte) 0);
        }
    }
    /**
     * PAISARULE R172-B12
     *
     * Save a previously encrypted Backup V1 result.
     *
     * The destination URI MUST come from Android's trusted
     * ACTION_CREATE_DOCUMENT result, never renderer input.
     *
     * Synchronized across native login/logout transitions:
     * the active login cannot switch between authorization
     * verification and destination write.
     *
     * This method does not read, modify or recover USB data.
     */
    static synchronized JSONObject savePaisaruleAndroidBusinessBackup(
        android.content.Context context,
        android.net.Uri destination,
        PaisaruleAndroidStorageBackupExport.Result prepared
    ) throws Exception {

        if (context == null ||
            destination == null ||
            prepared == null ||
            prepared.encryptedContents == null ||
            prepared.encryptedContents.isEmpty()) {
            throw new IllegalArgumentException(
                "BACKUP_SAVE_INPUT_INVALID"
            );
        }

        if (prepared.loginGeneration <= 0L ||
            prepared.loginGeneration != walletSessionGeneration) {
            throw new IllegalStateException(
                "BACKUP_SAVE_LOGIN_CHANGED"
            );
        }

        // Reverify server authority AFTER the Android picker.
        JSONObject authority = verifiedBusinessAuthority();

        if (!authority.optBoolean("success", false) ||
            !"BUSINESS_RECEPTION".equals(
                authority.optString("sessionType", "")
            ) ||
            !authority.optBoolean("businessDataAccess", false)) {
            PaisaruleAndroidBackupKeyAuthority.clear();

            throw new IllegalStateException(
                "BACKUP_SAVE_SERVER_SESSION_INVALID"
            );
        }

        JSONObject principal =
            authority.optJSONObject("principal");

        if (principal == null ||
            !"OWNER".equals(principal.optString("role", "")) ||
            !"USB".equalsIgnoreCase(
                principal.optString("storageMode", "")
            )) {
            throw new IllegalStateException(
                "BACKUP_SAVE_OWNER_NOT_AUTHORIZED"
            );
        }

        // Check the original scoped key is still present.
        // Never pass this key or encrypted contents to WebView.
        byte[] scopedKey =
            PaisaruleAndroidBackupKeyAuthority.copyForVerifiedScope(
                principal,
                prepared.loginGeneration
            );

        if (scopedKey == null || scopedKey.length != 32) {
            if (scopedKey != null) {
                java.util.Arrays.fill(scopedKey, (byte) 0);
            }

            throw new IllegalStateException(
                "BACKUP_SAVE_KEY_UNAVAILABLE"
            );
        }

        java.util.Arrays.fill(scopedKey, (byte) 0);

        byte[] outputBytes = prepared.encryptedContents.getBytes(
            java.nio.charset.StandardCharsets.UTF_8
        );

        try {
            if (outputBytes.length == 0 ||
                outputBytes.length > 96 * 1024 * 1024 ||
                outputBytes.length != prepared.bytesWrittenWhenSaved) {
                throw new IllegalStateException(
                    "BACKUP_SAVE_CONTENT_INVALID"
                );
            }

            // The synchronized lock prevents a native login
            // generation change during this authorization/write.
            if (prepared.loginGeneration != walletSessionGeneration) {
                throw new IllegalStateException(
                    "BACKUP_SAVE_LOGIN_CHANGED"
                );
            }

            try (
                java.io.OutputStream stream =
                    context.getContentResolver().openOutputStream(
                        destination,
                        "wt"
                    )
            ) {
                if (stream == null) {
                    throw new java.io.IOException(
                        "BACKUP_SAVE_DESTINATION_UNAVAILABLE"
                    );
                }

                stream.write(outputBytes);
                stream.flush();
            }

            // PAISARULE_R172_B17_READBACK
            // Verify the actual selected SAF destination,
            // not merely successful OutputStream.close().
            byte[] expectedDigest = null;
            byte[] actualDigest = null;

            try {
                java.security.MessageDigest digest =
                    java.security.MessageDigest.getInstance(
                        "SHA-256"
                    );

                expectedDigest = digest.digest(outputBytes);

                digest.reset();

                long actualLength = 0L;
                byte[] buffer = new byte[65536];

                try (
                    java.io.InputStream input =
                        context.getContentResolver()
                            .openInputStream(destination)
                ) {
                    if (input == null) {
                        throw new java.io.IOException(
                            "BACKUP_READBACK_UNAVAILABLE"
                        );
                    }

                    int bytesRead;

                    while ((bytesRead = input.read(buffer)) != -1) {
                        if (bytesRead == 0) {
                            continue;
                        }

                        actualLength += bytesRead;

                        if (actualLength > outputBytes.length) {
                            throw new java.io.IOException(
                                "BACKUP_READBACK_SIZE_MISMATCH"
                            );
                        }

                        digest.update(buffer, 0, bytesRead);
                    }
                } finally {
                    java.util.Arrays.fill(buffer, (byte) 0);
                }

                actualDigest = digest.digest();

                if (
                    actualLength != outputBytes.length ||
                    !java.security.MessageDigest.isEqual(
                        expectedDigest,
                        actualDigest
                    )
                ) {
                    throw new java.io.IOException(
                        "BACKUP_READBACK_HASH_MISMATCH"
                    );
                }
            } finally {
                if (expectedDigest != null) {
                    java.util.Arrays.fill(
                        expectedDigest,
                        (byte) 0
                    );
                }

                if (actualDigest != null) {
                    java.util.Arrays.fill(
                        actualDigest,
                        (byte) 0
                    );
                }
            }

            JSONObject data = new JSONObject();
            data.put("createdAt", prepared.createdAt);
            data.put("bytesWritten", outputBytes.length);

            JSONObject result = new JSONObject();
            result.put("success", true);
            result.put("cancelled", false);
            result.put("data", data);
            result.put("errorCode", JSONObject.NULL);

            return result;
        } finally {
            java.util.Arrays.fill(outputBytes, (byte) 0);
        }
    }
    static synchronized JSONObject verifiedBusinessAuthority() {
        try {
            if (verifiedBusinessSessionId == null ||
                verifiedWalletPrincipal == null ||
                verifiedBusinessPrincipal == null) {
                return failure("BUSINESS_SESSION_REQUIRED");
            }

            JSONObject session = new JSONObject();
            session.put("sessionType", "BUSINESS_RECEPTION");
            session.put("sessionId", verifiedBusinessSessionId);

            JSONObject login = new JSONObject();
            login.put("businessSession", session);
            login.put("principal", verifiedWalletPrincipal);

            if (!verifyBusinessSession(login)) {
                if (businessVerifyNetworkUnavailable) {
                    // No access granted; keep handle for revalidation.
                    return failure("SERVER_UNAVAILABLE");
                }
                verifiedBusinessSessionId = null;
                verifiedWalletPrincipal = null;
                verifiedBusinessPrincipal = null;
                return failure("BUSINESS_SESSION_NOT_AUTHORIZED");
            }

            JSONObject result = new JSONObject();
            result.put("success", true);
            result.put("sessionType", "BUSINESS_RECEPTION");
            result.put("businessDataAccess", true);
            result.put("principal", verifiedBusinessPrincipal);

            return result;
        } catch (Exception ignored) {
            return failure("BUSINESS_REVALIDATION_FAILED");
        }
    }
    // FINORA_C80_AUTH_R57_ANDROID_NATIVE_RENEWAL
    // Only a matching native Reception handle can request renewal.
    // The PostgreSQL session credential never crosses to JavaScript.
    static synchronized JSONObject touchAndroidReception(String handle) {
        if (handle == null ||
            receptionHandle == null ||
            !java.security.MessageDigest.isEqual(
                handle.getBytes(StandardCharsets.UTF_8),
                receptionHandle.getBytes(StandardCharsets.UTF_8))) {
            return failure("RECEPTION_SESSION_NOT_FOUND");
        }

        if (verifiedBusinessSessionId == null ||
            !verifiedBusinessSessionId.matches("^[a-f0-9]{64}$") ||
            verifiedWalletPrincipal == null ||
            verifiedBusinessPrincipal == null) {
            return failure("BUSINESS_SESSION_REQUIRED");
        }

        HttpsURLConnection connection = null;

        try {
            connection = (HttpsURLConnection) new URL(
                "https://api.finoraenterprise.com/owner/business/session/touch"
            ).openConnection();

            connection.setRequestMethod("POST");
            connection.setConnectTimeout(10000);
            connection.setReadTimeout(10000);
            connection.setInstanceFollowRedirects(false);
            connection.setUseCaches(false);
            connection.setDoOutput(true);

            connection.setRequestProperty(
                "Authorization", "Bearer " + verifiedBusinessSessionId);
            connection.setRequestProperty(
                "Content-Type", "application/json");
            connection.setRequestProperty(
                "Cache-Control", "no-store");

            try (java.io.OutputStream out =
                     connection.getOutputStream()) {
                out.write("{}".getBytes(StandardCharsets.UTF_8));
            }

            int status = connection.getResponseCode();

            if (status == 408 || status == 429 || status >= 500) {
                return failure("SERVER_UNAVAILABLE");
            }

            if (status == 401 || status == 403) {
                return failure("BUSINESS_SESSION_NOT_AUTHORIZED");
            }

            if (status != 200) {
                return failure("BUSINESS_RENEWAL_REJECTED");
            }

            ByteArrayOutputStream output = new ByteArrayOutputStream();

            try (InputStream input = connection.getInputStream()) {
                byte[] buffer = new byte[4096];
                int count;

                while ((count = input.read(buffer)) != -1) {
                    if (output.size() + count > 16384) {
                        return failure("BUSINESS_RENEWAL_RESPONSE_INVALID");
                    }
                    output.write(buffer, 0, count);
                }
            }

            JSONObject response = new JSONObject(
                new String(output.toByteArray(), StandardCharsets.UTF_8)
            );

            if (!response.optBoolean("ok", false) ||
                !response.optBoolean("renewed", false) ||
                !"BUSINESS_RECEPTION".equals(
                    response.optString("sessionType", ""))) {
                return failure("BUSINESS_RENEWAL_RESPONSE_INVALID");
            }

            String expiry = response.optString("expiresAt", "");
            java.time.Instant expiresAt =
                java.time.Instant.parse(expiry);

            if (!expiresAt.isAfter(java.time.Instant.now())) {
                return failure("BUSINESS_RENEWAL_EXPIRY_INVALID");
            }

            // Renewal is not authorization. Verify the original
            // server-issued principal again before reporting success.
            JSONObject authority = verifiedBusinessAuthority();

            if (!authority.optBoolean("success", false) ||
                !authority.optBoolean("businessDataAccess", false) ||
                !"BUSINESS_RECEPTION".equals(
                    authority.optString("sessionType", ""))) {
                if ("SERVER_UNAVAILABLE".equals(
                    authority.optString("errorCode", ""))) {
                    return failure("SERVER_UNAVAILABLE");
                }
                return failure("BUSINESS_SESSION_NOT_AUTHORIZED");
            }

            JSONObject result = new JSONObject();
            result.put("success", true);
            result.put("sessionId", receptionHandle);
            result.put("renewed", true);
            result.put("sessionType", "BUSINESS_RECEPTION");
            // PAISARULE_R172_S5_EXPIRY
            // Forward only the server-validated expiry.
            result.put("expiresAt", expiresAt.toString());
            return result;

        } catch (java.io.IOException networkFailure) {
            return failure("SERVER_UNAVAILABLE");
        } catch (Exception ignored) {
            return failure("BUSINESS_RENEWAL_FAILED");
        } finally {
            if (connection != null) connection.disconnect();
        }
    }
        // PAISARULE R158: Owner-only native Wallet rotation core.
    // Invoke only after an authenticated Reception touch succeeds.
    // Network I/O must run OUTSIDE the class monitor.
    // This method is not connected to the Plugin until tested.
    static JSONObject rotateAndroidOwnerWalletIfDue(String handle) {
        final String oldToken;
        final String businessId;
        final JSONObject oldScope;
        final java.time.Instant oldExpiry;
        final long generation;

        synchronized (FinoraNativeWalletSession.class) {
            if (handle == null || receptionHandle == null ||
                !java.security.MessageDigest.isEqual(
                    handle.getBytes(StandardCharsets.UTF_8),
                    receptionHandle.getBytes(StandardCharsets.UTF_8)) ||
                bearerToken == null ||
                verifiedBusinessSessionId == null ||
                verifiedWalletPrincipal == null ||
                verifiedBusinessPrincipal == null ||
                walletExpiresAt == null) {
                return failure("WALLET_ROTATION_NOT_AUTHORIZED");
            }

            java.time.Instant now = java.time.Instant.now();

            if (!walletExpiresAt.isAfter(now)) {
                return failure("WALLET_SESSION_EXPIRED");
            }

            if (java.time.Duration.between(
                now, walletExpiresAt
            ).toMillis() > 1500000L) {
                JSONObject skipped = new JSONObject();
                try {
                    skipped.put("success", true);
                    skipped.put("rotated", false);
                } catch (Exception ignored) {
                    return failure("WALLET_ROTATION_FAILED");
                }
                return skipped;
            }

            for (String field : new String[]{
                "userId", "ownerId", "businessId", "branchId"
            }) {
                String a = verifiedWalletPrincipal.optString(field, "");
                String b = verifiedBusinessPrincipal.optString(field, "");
                if (a.isEmpty() || !a.equals(b)) {
                    return failure("WALLET_ROTATION_SCOPE_MISMATCH");
                }
            }

            if (walletRotationInFlight) {
                return failure("WALLET_ROTATION_IN_PROGRESS");
            }

            oldToken = bearerToken;
            businessId = verifiedBusinessSessionId;
            oldExpiry = walletExpiresAt;
            generation = walletSessionGeneration;

            try {
                oldScope = new JSONObject(
                    verifiedWalletPrincipal.toString()
                );
            } catch (Exception ignored) {
                return failure("WALLET_ROTATION_SCOPE_INVALID");
            }

            walletRotationInFlight = true;
            walletRotationFlightGeneration = generation;
        }

        // No synchronized monitor is held during HTTPS I/O.
        HttpsURLConnection connection = null;

        try {
            connection = (HttpsURLConnection) new URL(
                "https://api.finoraenterprise.com/owner/wallet/session/rotate"
            ).openConnection();

            connection.setRequestMethod("POST");
            connection.setConnectTimeout(10000);
            connection.setReadTimeout(10000);
            connection.setInstanceFollowRedirects(false);
            connection.setUseCaches(false);
            connection.setDoOutput(true);
            connection.setRequestProperty(
                "Authorization", "Bearer " + oldToken
            );
            connection.setRequestProperty(
                "x-finora-business-session", businessId
            );
            connection.setRequestProperty(
                "Content-Type", "application/json"
            );
            connection.setRequestProperty(
                "Cache-Control", "no-store"
            );

            try (java.io.OutputStream out =
                     connection.getOutputStream()) {
                out.write("{}".getBytes(StandardCharsets.UTF_8));
            }

            if (connection.getResponseCode() != 200) {
                return failure("WALLET_ROTATION_UNAVAILABLE");
            }

            ByteArrayOutputStream output =
                new ByteArrayOutputStream();

            try (InputStream input = connection.getInputStream()) {
                byte[] buffer = new byte[4096];
                int count;
                while ((count = input.read(buffer)) != -1) {
                    if (output.size() + count > 16384) {
                        return failure("WALLET_ROTATION_RESPONSE_INVALID");
                    }
                    output.write(buffer, 0, count);
                }
            }

            JSONObject response = new JSONObject(
                new String(
                    output.toByteArray(),
                    StandardCharsets.UTF_8
                )
            );

            if (!response.optBoolean("ok", false)) {
                return failure("WALLET_ROTATION_REJECTED");
            }

            String nextToken =
                response.optString("accessToken", "");
            String expiryText =
                response.optString("expiresAt", "");

            JSONObject nextScope =
                response.optJSONObject("scope");

            if (!nextToken.matches("^[a-fA-F0-9]{64}$") ||
                nextToken.equalsIgnoreCase(oldToken) ||
                nextScope == null) {
                return failure("WALLET_ROTATION_RESPONSE_INVALID");
            }

            for (String field : new String[]{
                "userId", "ownerId", "businessId", "branchId"
            }) {
                String expectedScope =
                    oldScope.optString(field, "");
                String receivedScope =
                    nextScope.optString(field, "");

                if (expectedScope.isEmpty() ||
                    !expectedScope.equals(receivedScope)) {
                    return failure("WALLET_ROTATION_SCOPE_MISMATCH");
                }
            }

            java.time.Instant nextExpiry =
                java.time.Instant.parse(expiryText);

            java.time.Instant validationNow =
                java.time.Instant.now();

            if (!nextExpiry.isAfter(validationNow) ||
                nextExpiry.isAfter(
                    validationNow.plusSeconds(3605L))) {
                return failure("WALLET_ROTATION_EXPIRY_INVALID");
            }

            synchronized (FinoraNativeWalletSession.class) {
                if (generation != walletSessionGeneration ||
                    !oldToken.equals(bearerToken) ||
                    !businessId.equals(verifiedBusinessSessionId) ||
                    !oldExpiry.equals(walletExpiresAt) ||
                    receptionHandle == null ||
                    !java.security.MessageDigest.isEqual(
                        handle.getBytes(StandardCharsets.UTF_8),
                        receptionHandle.getBytes(StandardCharsets.UTF_8)) ||
                    !oldExpiry.isAfter(java.time.Instant.now()) ||
                    verifiedWalletPrincipal == null ||
                    verifiedBusinessPrincipal == null) {
                    return failure("WALLET_ROTATION_SUPERSEDED");
                }

                for (String field : new String[]{
                    "userId", "ownerId", "businessId", "branchId"
                }) {
                    String original =
                        oldScope.optString(field, "");

                    if (original.isEmpty() ||
                        !original.equals(
                            verifiedWalletPrincipal.optString(field, "")) ||
                        !original.equals(
                            verifiedBusinessPrincipal.optString(field, ""))) {
                        return failure("WALLET_ROTATION_SUPERSEDED");
                    }
                }

                bearerToken = nextToken;
                walletExpiresAt = nextExpiry;
            }

            JSONObject result = new JSONObject();
            result.put("success", true);
            result.put("rotated", true);
            return result;

        } catch (Exception ignored) {
            return failure("WALLET_ROTATION_UNAVAILABLE");
        } finally {
            if (connection != null) {
                connection.disconnect();
            }
            synchronized (FinoraNativeWalletSession.class) {
                if (walletRotationInFlight &&
                    walletRotationFlightGeneration == generation &&
                    walletSessionGeneration == generation) {
                    walletRotationInFlight = false;
                    walletRotationFlightGeneration = -1L;
                }
            }
        }
    }
    // FINORA_P1_720Z2_NATIVE_RECEPTION
    static synchronized JSONObject issueAndroidReception() {
        JSONObject authority = verifiedBusinessAuthority();

        if (!authority.optBoolean("success", false) ||
            !"BUSINESS_RECEPTION".equals(
                authority.optString("sessionType", "")) ||
            !authority.optBoolean("businessDataAccess", false)) {
            return failure("RECEPTION_SERVER_AUTHORIZATION_DENIED");
        }

        try {
            byte[] random = new byte[32];
            new java.security.SecureRandom().nextBytes(random);

            StringBuilder hex = new StringBuilder(64);

            for (byte value : random) {
                hex.append(String.format(
                    java.util.Locale.ROOT,"%02x",value & 255));
            }

            receptionHandle = hex.toString();

            JSONObject result = new JSONObject();
            result.put("success",true);
            result.put("sessionId",receptionHandle);
            result.put("principal",authority.getJSONObject("principal"));
            result.put("businessDataAccess",true);
            result.put("sessionType","BUSINESS_RECEPTION");
            return result;
        } catch (Exception ignored) {
            receptionHandle = null;
            return failure("RECEPTION_ISSUANCE_FAILED");
        }
    }

    static synchronized JSONObject validateAndroidReception(String handle) {
        if (handle == null ||
            receptionHandle == null ||
            !java.security.MessageDigest.isEqual(
                handle.getBytes(StandardCharsets.UTF_8),
                receptionHandle.getBytes(StandardCharsets.UTF_8))) {
            return failure("RECEPTION_SESSION_NOT_FOUND");
        }

        JSONObject authority = verifiedBusinessAuthority();

        if ("SERVER_UNAVAILABLE".equals(
                authority.optString("errorCode", ""))) {
            return failure("SERVER_UNAVAILABLE");
        }

        if (!authority.optBoolean("success",false) ||
            !authority.optBoolean("businessDataAccess",false)) {
            receptionHandle = null;
            return failure("RECEPTION_SERVER_REVALIDATION_DENIED");
        }

        try {
            JSONObject result = new JSONObject();
            result.put("success",true);
            result.put("sessionId",receptionHandle);
            result.put("principal",authority.getJSONObject("principal"));
            result.put("businessDataAccess",true);
            result.put("sessionType","BUSINESS_RECEPTION");
            return result;
        } catch (Exception ignored) {
            return failure("RECEPTION_VALIDATION_FAILED");
        }
    }
    // FINORA_P1_723H_NATIVE_READS
    // Fixed paths only. Credential stays in native process memory.
    private static JSONObject readOwnerWallet(String route, String source) {
        final String tokenSnapshot;

        synchronized (FinoraNativeWalletSession.class) {
            tokenSnapshot = bearerToken;
        }

        if (
            tokenSnapshot == null ||
            tokenSnapshot.trim().isEmpty()
        ) {
            return failure("WALLET_SESSION_NOT_AUTHORIZED");
        }

        return readOwnerWalletWithToken(
            route,
            source,
            tokenSnapshot
        );
    }

    private static JSONObject readOwnerWalletWithToken(String route, String source, String token) {
        HttpsURLConnection connection = null;
        try {
            if (!route.equals("/owner/wallet/pricing") &&
                !route.equals("/owner/wallet/transactions") &&
                !route.equals("/owner/wallet/recharges") &&
                !route.equals("/owner/wallet/business-identity") &&
                !route.equals("/owner/numbering/v2/customer-series")) {
                return failure("INVALID_READ_ROUTE");
            }

            if (BALANCE_URL == null ||
                !BALANCE_URL.endsWith("/owner/wallet/balance")) {
                return failure("INVALID_SERVER_ROUTE");
            }

            String url = BALANCE_URL.substring(
                0, BALANCE_URL.length() -
                "/owner/wallet/balance".length()
            ) + route;

            connection = (HttpsURLConnection)
                new URL(url).openConnection();

            connection.setRequestMethod("GET");
            connection.setConnectTimeout(10000);
            connection.setReadTimeout(10000);
            connection.setInstanceFollowRedirects(false);
            connection.setUseCaches(false);
            connection.setRequestProperty(
                "Authorization", "Bearer " + token
            );
            connection.setRequestProperty("Accept", "application/json");
            connection.setRequestProperty("Cache-Control", "no-store");

            if (connection.getResponseCode() != 200) {
                return failure("SERVER_READ_UNAVAILABLE");
            }

            ByteArrayOutputStream output = new ByteArrayOutputStream();

            try (InputStream input = connection.getInputStream()) {
                byte[] buffer = new byte[4096];
                int count;
                while ((count = input.read(buffer)) != -1) {
                    if (output.size() + count > 262144) {
                        return failure("SERVER_RESPONSE_TOO_LARGE");
                    }
                    output.write(buffer, 0, count);
                }
            }

            JSONObject response = new JSONObject(
                new String(output.toByteArray(), StandardCharsets.UTF_8)
            );

            if (!response.optBoolean("ok", false) ||
                !source.equals(response.optString("source", ""))) {
                return failure("INVALID_SERVER_RESPONSE");
            }

            if (route.equals("/owner/wallet/pricing")) {
                if (!response.has("currentSubscription") ||
                    response.optJSONArray("plans") == null ||
                    response.optJSONArray("plans").length() != 4 ||
                    response.optString("branchId", "").isEmpty()) {
                    return failure("INVALID_PRICING_RESPONSE");
                }
            } else if (route.equals("/owner/numbering/v2/customer-series")) {
                // FINORA_P1_730L_NUMBERING_VALIDATION
                JSONObject n = response.optJSONObject("numbering");
                if (n == null ||
                    !"LOCKED".equals(n.optString("status", "")) ||
                    n.optString("ownerId", "").isEmpty() ||
                    n.optString("businessId", "").isEmpty() ||
                    n.optString("branchId", "").isEmpty() ||
                    n.optString("businessCode", "").isEmpty() ||
                    n.optString("branchCode", "").isEmpty() ||
                    n.optInt("startingCustomerNumber", 0) < 1 ||
                    n.optInt("startingCustomerNumber", 0) > 999999 ||
                    n.optString("lockedAt", "").isEmpty()) {
                    return failure("INVALID_NUMBERING_RESPONSE");
                }
            } else if (route.equals("/owner/wallet/business-identity")) {
                // FINORA_P1_737Y_BUSINESS_IDENTITY_VALIDATION
                // Business identity is not wallet transaction history.
                // Require the authenticated PostgreSQL identity payload.
                JSONObject identity = response.optJSONObject("identity");

                if (identity == null ||
                    identity.optString("ownerId", "").trim().isEmpty() ||
                    identity.optString("businessId", "").trim().isEmpty() ||
                    identity.optString("branchId", "").trim().isEmpty() ||
                    identity.optString("businessName", "").trim().isEmpty() ||
                    identity.optString("branchName", "").trim().isEmpty() ||
                    !"USB".equals(identity.optString("storageMode", ""))) {
                    return failure("INVALID_BUSINESS_IDENTITY");
                }
            } else {
                if (!response.optString("walletId", "")
                        .matches("^[0-9]{8,12}$") ||
                    !"INR".equals(response.optString("currency", ""))) {
                    return failure("INVALID_HISTORY_SCOPE");
                }

                String key = route.endsWith("/transactions")
                    ? "transactions" : "requests";
                if (response.optJSONArray(key) == null) {
                    return failure("INVALID_HISTORY_RESPONSE");
                }
            }

            JSONObject result = new JSONObject();
            result.put("success", true);
            result.put("data", response);
            return result;

        } catch (Exception ignored) {
            return failure("SERVER_READ_FAILED");
        } finally {
            if (connection != null) connection.disconnect();
        }
    }

    // FINORA_P1_725M_IDENTITY
    // Server session determines Owner/Business/Branch.
    // No caller-supplied scope, no database mutation.
    static JSONObject verifiedBusinessIdentity() {
        final String tokenSnapshot;
        final long generationSnapshot;

        synchronized (FinoraNativeWalletSession.class) {
            if (
                bearerToken == null ||
                bearerToken.trim().isEmpty() ||
                verifiedBusinessSessionId == null ||
                verifiedWalletPrincipal == null ||
                verifiedBusinessPrincipal == null
            ) {
                return failure("BUSINESS_SESSION_REQUIRED");
            }

            tokenSnapshot = bearerToken;
            generationSnapshot = walletSessionGeneration;
        }

        // PAISARULE_C141_R44_ANDROID_IDENTITY_NETWORK_OUTSIDE_LOCK
        //
        // Same authenticated PostgreSQL business identity authority.
        // Only the blocking HTTP I/O runs outside the global native
        // session monitor. No Customer rule or authority is bypassed.
        JSONObject result = readOwnerWalletWithToken(
            "/owner/wallet/business-identity",
            "FINORA_POSTGRESQL_BUSINESS_IDENTITY",
            tokenSnapshot
        );

        synchronized (FinoraNativeWalletSession.class) {
            if (
                generationSnapshot != walletSessionGeneration ||
                bearerToken == null ||
                !tokenSnapshot.equals(bearerToken) ||
                verifiedBusinessSessionId == null ||
                verifiedWalletPrincipal == null ||
                verifiedBusinessPrincipal == null
            ) {
                return failure("BUSINESS_SESSION_CHANGED");
            }

            return result;
        }
    }
        // FINORA_P1_729Z_NUMBERING_READ
    // Read-only authenticated PostgreSQL numbering.
    static synchronized JSONObject verifiedCustomerNumbering() {
        return readOwnerWallet(
            "/owner/numbering/v2/customer-series",
            "FINORA_POSTGRESQL_NUMBERING"
        );
    }

        // FINORA_P1_730M_RESERVATION_POST
    // Fixed HTTPS endpoint; session credentials remain native.
    static synchronized JSONObject reserveCustomerNumber(String requestKey) {
        if (requestKey == null ||
            !requestKey.matches("(?i)^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$")) {
            return failure("INVALID_RESERVATION_KEY");
        }
        HttpsURLConnection connection = null;
        try {
            if (!BALANCE_URL.endsWith("/owner/wallet/balance")) {
                return failure("INVALID_SERVER_ROUTE");
            }
            String endpoint = BALANCE_URL.substring(
                0, BALANCE_URL.length() - "/owner/wallet/balance".length()
            ) + "/owner/numbering/v2/customer-reserve";
            connection = (HttpsURLConnection) new URL(endpoint).openConnection();
            connection.setRequestMethod("POST");
            connection.setConnectTimeout(10000);
            connection.setReadTimeout(15000);
            connection.setInstanceFollowRedirects(false);
            connection.setUseCaches(false);
            connection.setDoOutput(true);
            connection.setRequestProperty("Accept", "application/json");
            connection.setRequestProperty("Content-Type", "application/json");
            connection.setRequestProperty("Cache-Control", "no-store");
            connection.setRequestProperty("Idempotency-Key", requestKey);
            connection.setRequestProperty(
                "Authorization", "Bearer " + bearerToken
            );
            try (java.io.OutputStream out = connection.getOutputStream()) {
                out.write("{}".getBytes(StandardCharsets.UTF_8));
            }
            if (connection.getResponseCode() != 200) {
                return failure("NUMBERING_RESERVATION_UNAVAILABLE");
            }
            ByteArrayOutputStream output = new ByteArrayOutputStream();
            try (InputStream input = connection.getInputStream()) {
                byte[] buffer = new byte[4096];
                int count;
                while ((count = input.read(buffer)) != -1) {
                    if (output.size() + count > 16384) {
                        return failure("RESERVATION_RESPONSE_TOO_LARGE");
                    }
                    output.write(buffer, 0, count);
                }
            }
            JSONObject data = new JSONObject(
                new String(output.toByteArray(), StandardCharsets.UTF_8)
            );
            JSONObject reservation = data.optJSONObject("reservation");
            if (!data.optBoolean("ok", false) ||
                !"FINORA_POSTGRESQL_NUMBERING".equals(data.optString("source", "")) ||
                reservation == null ||
                !data.has("replay") ||
                !(data.opt("replay") instanceof Boolean) ||
                reservation.optInt("customerNumber", 0) < 1 ||
                reservation.optInt("customerNumber", 0) > 999999 ||
                reservation.optString("businessCode", "").isEmpty() ||
                reservation.optString("branchCode", "").isEmpty()) {
                return failure("INVALID_RESERVATION_RESPONSE");
            }
            JSONObject result = new JSONObject();
            result.put("success", true);
            result.put("data", data);
            return result;
        } catch (Exception ignored) {
            return failure("NUMBERING_RESERVATION_UNAVAILABLE");
        } finally {
            if (connection != null) connection.disconnect();
        }
    }

    static synchronized JSONObject verifiedPricing() {
        return readOwnerWallet(
            "/owner/wallet/pricing", "FINORA_POSTGRESQL_PRICING"
        );
    }

    static synchronized JSONObject verifiedTransactions() {
        return readOwnerWallet(
            "/owner/wallet/transactions",
            "POSTGRESQL_WALLET_TRANSACTIONS"
        );
    }

    static synchronized JSONObject verifiedRecharges() {
        return readOwnerWallet(
            "/owner/wallet/recharges",
            "POSTGRESQL_RECHARGE_REQUESTS"
        );
    }
    // FINORA_W9_J7_OWNER_RECHARGE_POST
    // FINORA account bearer stays exclusively in the native process.
    // Persist the original request before the first network write.
    // A successful request receipt never authorizes wallet credit.
    static synchronized JSONObject submitOwnerRecharge(
        android.content.Context context,
        String walletId,
        int amountInr,
        String paymentMethod,
        String idempotencyKey
    ) {
        HttpsURLConnection connection = null;

        if (context == null ||
            walletId == null ||
            !walletId.matches("[0-9]{8,12}") ||
            amountInr < 50 || amountInr > 2000 ||
            (!"PHONEPE".equals(paymentMethod) &&
             !"GOOGLE_PAY".equals(paymentMethod)) ||
            idempotencyKey == null ||
            !idempotencyKey.matches(
                "(?i)[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"
            )) {
            return failure("INVALID_REQUEST");
        }

        if (bearerToken == null ||
            !bearerToken.matches("(?i)[0-9a-f]{64}")) {
            return failure("UNAUTHORIZED");
        }

        final FinoraOwnerRechargeIntentStore store;

        try {
            store = new FinoraOwnerRechargeIntentStore(context);
        } catch (Exception ignored) {
            return failure("RECHARGE_INTENT_STORAGE_UNAVAILABLE");
        }

        try {
            JSONObject wallet = fetchBalance();

            if (wallet == null ||
                !walletId.equals(wallet.optString("walletId", ""))) {
                return failure("WALLET_SESSION_NOT_AUTHORIZED");
            }

            FinoraOwnerRechargeIntentStore.Intent requested =
                new FinoraOwnerRechargeIntentStore.Intent(
                    walletId, amountInr, paymentMethod, idempotencyKey
                );

            // This operation is fail-closed if an earlier request exists.
            // Never overwrite a previous unknown-outcome UUID.
            FinoraOwnerRechargeIntentStore.Intent intent =
                store.saveIfAbsent(requested);

            if (!BALANCE_URL.endsWith("/owner/wallet/balance")) {
                return failure("INVALID_SERVER_ROUTE");
            }

            String endpoint = BALANCE_URL.substring(
                0,
                BALANCE_URL.length() - "/owner/wallet/balance".length()
            ) + "/owner/wallet/recharges";

            connection = (HttpsURLConnection)
                new URL(endpoint).openConnection();

            connection.setRequestMethod("POST");
            connection.setConnectTimeout(10000);
            connection.setReadTimeout(15000);
            connection.setInstanceFollowRedirects(false);
            connection.setUseCaches(false);
            connection.setDoOutput(true);
            connection.setRequestProperty(
                "Authorization", "Bearer " + bearerToken
            );
            connection.setRequestProperty(
                "Accept", "application/json"
            );
            connection.setRequestProperty(
                "Content-Type", "application/json"
            );
            connection.setRequestProperty(
                "Cache-Control", "no-store"
            );

            JSONObject payload = new JSONObject();
            payload.put("amountInr", intent.amountInr);
            payload.put("paymentMethod", intent.paymentMethod);
            payload.put("idempotencyKey", intent.idempotencyKey);

            byte[] bytes = payload.toString().getBytes(
                StandardCharsets.UTF_8
            );

            try (java.io.OutputStream output =
                     connection.getOutputStream()) {
                output.write(bytes);
            }

            int status = connection.getResponseCode();

            if (status == 400) return failure("INVALID_REQUEST");
            if (status == 401) return failure("UNAUTHORIZED");
            if (status == 404) return failure("WALLET_NOT_AVAILABLE");
            if (status == 409) {
                return failure("SERVER_RECHARGE_IDEMPOTENCY_CONFLICT");
            }
            if (status == 429) return failure("RATE_LIMITED");

            if (status != 200 && status != 201) {
                return failure("SERVER_UNAVAILABLE");
            }

            String contentType = connection.getContentType();

            if (contentType == null ||
                !contentType.toLowerCase(java.util.Locale.ROOT)
                    .split(";")[0].trim().equals("application/json")) {
                return failure("INVALID_SERVER_RESPONSE");
            }

            ByteArrayOutputStream responseBytes =
                new ByteArrayOutputStream();

            try (InputStream input = connection.getInputStream()) {
                byte[] buffer = new byte[2048];
                int count;

                while ((count = input.read(buffer)) != -1) {
                    if (responseBytes.size() + count > 8192) {
                        return failure("INVALID_SERVER_RESPONSE");
                    }
                    responseBytes.write(buffer, 0, count);
                }
            }

            JSONObject response = new JSONObject(
                new String(
                    responseBytes.toByteArray(),
                    StandardCharsets.UTF_8
                )
            );

            JSONObject request = response.optJSONObject("request");

            String expectedAmount =
                Integer.toString(amountInr) + ".00";

            if (!response.optBoolean("ok", false) ||
                !"POSTGRESQL_RECHARGE_REQUESTS".equals(
                    response.optString("source", "")
                ) ||
                !response.has("replayed") ||
                !(response.opt("replayed") instanceof Boolean) ||
                (status == 200) != response.optBoolean("replayed") ||
                request == null ||
                !request.optString("requestId", "").matches(
                    "(?i)[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"
                ) ||
                !walletId.equals(request.optString("walletId", "")) ||
                !expectedAmount.equals(request.optString("amountInr", "")) ||
                !paymentMethod.equals(
                    request.optString("paymentMethod", "")
                ) ||
                !("PENDING".equals(request.optString("status", "")) ||
                  "APPROVED".equals(request.optString("status", "")) ||
                  "DECLINED".equals(request.optString("status", ""))) ||
                (status == 201 &&
                 !"PENDING".equals(request.optString("status", ""))) ||
                request.optString("createdAt", "").isEmpty() ||
                request.optString("createdAt", "").length() > 40) {
                return failure("INVALID_SERVER_RESPONSE");
            }

            try {
                java.time.Instant.parse(
                    request.getString("createdAt")
                );
            } catch (Exception ignored) {
                return failure("INVALID_SERVER_RESPONSE");
            }

            // A valid server receipt is sufficient to settle the exact
            // pending retry intent; it is not a wallet balance credit.
            boolean cleared = false;
            try {
                cleared = store.clearIfMatches(
                    walletId, intent.idempotencyKey
                );
            } catch (Exception ignored) {
                // Keep receipt visible; later reconciliation is required.
            }

            JSONObject receipt = new JSONObject();
            receipt.put(
                "source", "POSTGRESQL_RECHARGE_REQUESTS"
            );
            receipt.put("request", request);
            receipt.put("replayed", response.getBoolean("replayed"));

            JSONObject result = new JSONObject();
            result.put("success", true);
            result.put("data", receipt);
            result.put("intentCleared", cleared);
            return result;

        } catch (IllegalStateException error) {
            if ("LOCAL_RECHARGE_INTENT_CONFLICT".equals(
                    error.getMessage())) {
                return failure("LOCAL_RECHARGE_INTENT_CONFLICT");
            }
            return failure("RECHARGE_INTENT_STORAGE_UNAVAILABLE");
        } catch (Exception ignored) {
            // Original encrypted intent remains for explicit recovery.
            return failure("SERVER_UNAVAILABLE");
        } finally {
            if (connection != null) {
                connection.disconnect();
            }
        }
    }
    // FINORA_W9_J9_NATIVE_RECOVERY
    // Read-only metadata for the authenticated wallet.
    // Never expose the persisted UUID or bearer to the WebView.
    static synchronized JSONObject pendingOwnerRecharge(
        android.content.Context context
    ) {
        try {
            if (context == null || bearerToken == null) {
                return failure("UNAUTHORIZED");
            }

            FinoraOwnerRechargeIntentStore store =
                new FinoraOwnerRechargeIntentStore(context);

            // Read encrypted state before any network call.
            // Do not claim "no pending" if the store is corrupt.
            FinoraOwnerRechargeIntentStore.Intent intent =
                store.load();

            JSONObject wallet = fetchBalance();

            if (wallet == null) {
                return failure("WALLET_SESSION_NOT_AUTHORIZED");
            }

            String walletId = wallet.optString("walletId", "");

            if (!walletId.matches("[0-9]{8,12}")) {
                return failure("INVALID_SERVER_RESPONSE");
            }

            if (intent != null &&
                !walletId.equals(intent.walletId)) {
                return failure("LOCAL_RECHARGE_INTENT_SCOPE_CONFLICT");
            }

            JSONObject data = new JSONObject();
            data.put("pending", intent != null);

            if (intent == null) {
                data.put("amountInr", JSONObject.NULL);
                data.put("paymentMethod", JSONObject.NULL);
            } else {
                data.put("amountInr", intent.amountInr);
                data.put("paymentMethod", intent.paymentMethod);
            }

            JSONObject result = new JSONObject();
            result.put("success", true);
            result.put("data", data);
            return result;

        } catch (Exception ignored) {
            return failure("RECHARGE_INTENT_STORAGE_UNAVAILABLE");
        }
    }

    // Explicit retry: reload the same encrypted UUID.
    // This method never generates a new idempotency key.
    static synchronized JSONObject resumeOwnerRecharge(
        android.content.Context context
    ) {
        try {
            if (context == null || bearerToken == null) {
                return failure("UNAUTHORIZED");
            }

            FinoraOwnerRechargeIntentStore store =
                new FinoraOwnerRechargeIntentStore(context);

            FinoraOwnerRechargeIntentStore.Intent intent =
                store.load();

            if (intent == null) {
                return failure("NO_PENDING_RECHARGE_INTENT");
            }

            JSONObject wallet = fetchBalance();

            if (wallet == null) {
                return failure("WALLET_SESSION_NOT_AUTHORIZED");
            }

            if (!intent.walletId.equals(
                    wallet.optString("walletId", ""))) {
                return failure("LOCAL_RECHARGE_INTENT_SCOPE_CONFLICT");
            }

            // submitOwnerRecharge uses saveIfAbsent, so the
            // original encrypted payload must match exactly.
            return submitOwnerRecharge(
                context,
                intent.walletId,
                intent.amountInr,
                intent.paymentMethod,
                intent.idempotencyKey
            );

        } catch (Exception ignored) {
            return failure("RECHARGE_INTENT_STORAGE_UNAVAILABLE");
        }
    }
    private static JSONObject fetchBalance() {
        if (bearerToken == null) return null;

        HttpsURLConnection connection = null;

        try {
            connection = (HttpsURLConnection)
                new URL(BALANCE_URL).openConnection();

            connection.setRequestMethod("GET");
            connection.setConnectTimeout(10000);
            connection.setReadTimeout(10000);
            connection.setInstanceFollowRedirects(false);
            connection.setUseCaches(false);
            connection.setRequestProperty(
                "Authorization", "Bearer " + bearerToken);
            connection.setRequestProperty(
                "Accept", "application/json");
            connection.setRequestProperty(
                "Cache-Control", "no-store");

            if (connection.getResponseCode() != 200) {
                return null;
            }

            ByteArrayOutputStream output =
                new ByteArrayOutputStream();

            try (InputStream input = connection.getInputStream()) {
                byte[] buffer = new byte[4096];
                int count;

                while ((count = input.read(buffer)) != -1) {
                    if (output.size() + count > 16384) return null;
                    output.write(buffer, 0, count);
                }
            }

            JSONObject response = new JSONObject(
                new String(
                    output.toByteArray(),
                    StandardCharsets.UTF_8
                )
            );

            String amount = response.optString("balanceInr", "");

            if (!response.optBoolean("ok", false)
                || !"POSTGRESQL_WALLETS".equals(
                    response.optString("source", ""))
                || !"INR".equals(response.optString("currency", ""))
                || !amount.matches(
                    "^(?:0|[1-9][0-9]*)(?:\\.[0-9]{1,2})?$"
                )) {
                return null;
            }

            JSONObject wallet = new JSONObject();
            // FINORA_P1_722A_WALLET_CONTRACT
            // Only values returned by the authenticated server.
            String walletId = response.optString("walletId", "");
            String updatedAt = response.optString("updatedAt", "");

            if (!walletId.matches("^[0-9]{8,12}$") ||
                updatedAt.isEmpty()) {
                return null;
            }

            wallet.put("ok", true);
            wallet.put("walletId", walletId);
            wallet.put("balanceInr", amount);
            wallet.put("currency", "INR");
            wallet.put("source", "POSTGRESQL_WALLETS");
            wallet.put("updatedAt", updatedAt);
            return wallet;

        } catch (Exception ignored) {
            return null;
        } finally {
            if (connection != null) connection.disconnect();
        }
    }
}