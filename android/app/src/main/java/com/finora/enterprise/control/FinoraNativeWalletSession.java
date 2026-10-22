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

    static synchronized void clear() {
        bearerToken = null;
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
            result.put(
                "businessSessionVerified",
                verifyBusinessSession(server)
            );
        } catch (Exception ignored) {
            clear();
            return failure("NATIVE_RESPONSE_INVALID");
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

            if (connection.getResponseCode() != 200) {
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

            return response.optBoolean("ok", false)
                && "BUSINESS_RECEPTION".equals(
                    response.optString("sessionType", ""))
                && response.optBoolean("businessDataAccess", false);

        } catch (Exception ignored) {
            return false;
        } finally {
            if (connection != null) connection.disconnect();
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
            wallet.put("balanceInr", amount);
            wallet.put("currency", "INR");
            wallet.put("source", "POSTGRESQL_WALLETS");
            return wallet;

        } catch (Exception ignored) {
            return null;
        } finally {
            if (connection != null) connection.disconnect();
        }
    }
}