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
        bearerToken = null;
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

        bearerToken = token;
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
            return result;

        } catch (java.io.IOException networkFailure) {
            return failure("SERVER_UNAVAILABLE");
        } catch (Exception ignored) {
            return failure("BUSINESS_RENEWAL_FAILED");
        } finally {
            if (connection != null) connection.disconnect();
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
                "Authorization", "Bearer " + bearerToken
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
    static synchronized JSONObject verifiedBusinessIdentity() {
        return readOwnerWallet(
            "/owner/wallet/business-identity",
            "FINORA_POSTGRESQL_BUSINESS_IDENTITY"
        );
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