package com.finora.enterprise.control;

import android.content.Context;
import android.content.SharedPreferences;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;

import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.security.KeyStore;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.net.ssl.HttpsURLConnection;

/*
 * P1-758M: Developer-flavor privileged server transport.
 *
 * This class must only be exposed through the authenticated
 * Developer Control Center native plugin, not the Owner plugin.
 *
 * Admin keys are encrypted with Android Keystore AES-GCM.
 * No plaintext key is returned to the JavaScript renderer.
 * LIVE status must depend on actual server verification.
 */
final class FinoraDeveloperServerAdminClient {

    private static final String BASE =
        "https://api.finoraenterprise.com";

    private static final String KEY_ALIAS =
        "finora_developer_server_admin_aes_v1";

    private static final String PREFS =
        "finora_developer_admin_secure_v1";

    private static final String STORED_VALUE =
        "encrypted_admin_credential";

    private static final int TIMEOUT_MS = 12000;
    private static final int MAX_BODY_BYTES = 524288;

    private final Context context;

    FinoraDeveloperServerAdminClient(Context context) {
        this.context = context.getApplicationContext();
    }

    private SharedPreferences prefs() {
        return context.getSharedPreferences(
            PREFS, Context.MODE_PRIVATE
        );
    }

    synchronized boolean hasCredential() {
        return prefs().contains(STORED_VALUE);
    }

    synchronized void clearCredential() {
        if (!prefs().edit().remove(STORED_VALUE).commit()) {
            throw new IllegalStateException(
                "ADMIN_CREDENTIAL_CLEAR_FAILED"
            );
        }
    }

    private SecretKey keystoreKey() throws Exception {
        KeyStore store = KeyStore.getInstance(
            "AndroidKeyStore"
        );
        store.load(null);

        KeyStore.Entry entry = store.getEntry(
            KEY_ALIAS, null
        );

        if (entry instanceof KeyStore.SecretKeyEntry) {
            return ((KeyStore.SecretKeyEntry) entry)
                .getSecretKey();
        }

        KeyGenerator generator = KeyGenerator.getInstance(
            KeyProperties.KEY_ALGORITHM_AES,
            "AndroidKeyStore"
        );

        generator.init(
            new KeyGenParameterSpec.Builder(
                KEY_ALIAS,
                KeyProperties.PURPOSE_ENCRYPT |
                    KeyProperties.PURPOSE_DECRYPT
            )
                .setBlockModes(
                    KeyProperties.BLOCK_MODE_GCM
                )
                .setEncryptionPaddings(
                    KeyProperties.ENCRYPTION_PADDING_NONE
                )
                .setKeySize(256)
                .build()
        );

        return generator.generateKey();
    }

    private synchronized void storeCredential(
        String credential
    ) throws Exception {
        Cipher cipher = Cipher.getInstance(
            "AES/GCM/NoPadding"
        );
        cipher.init(
            Cipher.ENCRYPT_MODE,
            keystoreKey()
        );

        byte[] cipherText = cipher.doFinal(
            credential.getBytes(StandardCharsets.UTF_8)
        );

        byte[] iv = cipher.getIV();

        String protectedValue =
            Base64.encodeToString(
                iv, Base64.NO_WRAP
            )
                + ":"
                + Base64.encodeToString(
                    cipherText, Base64.NO_WRAP
                );

        if (!prefs().edit()
            .putString(STORED_VALUE, protectedValue)
            .commit()) {
            throw new IllegalStateException(
                "ADMIN_CREDENTIAL_STORAGE_FAILED"
            );
        }
    }

    private synchronized String readCredential()
        throws Exception {

        String protectedValue = prefs().getString(
            STORED_VALUE, null
        );

        if (protectedValue == null) {
            throw new IllegalStateException(
                "ADMIN_CREDENTIAL_NOT_CONFIGURED"
            );
        }

        String[] parts = protectedValue.split(":", -1);

        if (parts.length != 2) {
            throw new IllegalStateException(
                "ADMIN_CREDENTIAL_STORAGE_INVALID"
            );
        }

        byte[] iv = Base64.decode(
            parts[0], Base64.NO_WRAP
        );

        byte[] cipherText = Base64.decode(
            parts[1], Base64.NO_WRAP
        );

        if (iv.length != 12) {
            throw new IllegalStateException(
                "ADMIN_CREDENTIAL_STORAGE_INVALID"
            );
        }

        Cipher cipher = Cipher.getInstance(
            "AES/GCM/NoPadding"
        );

        cipher.init(
            Cipher.DECRYPT_MODE,
            keystoreKey(),
            new GCMParameterSpec(128, iv)
        );

        return new String(
            cipher.doFinal(cipherText),
            StandardCharsets.UTF_8
        );
    }

    private JSONObject request(
        String route,
        String credential
    ) throws Exception {

        if (credential == null ||
            credential.trim().length() < 32 ||
            credential.length() > 4096) {
            throw new IllegalArgumentException(
                "ADMIN_CREDENTIAL_INVALID"
            );
        }

        HttpsURLConnection connection = null;

        try {
            URL url = new URL(BASE + route);

            connection = (HttpsURLConnection)
                url.openConnection();

            connection.setRequestMethod("GET");
            connection.setConnectTimeout(TIMEOUT_MS);
            connection.setReadTimeout(TIMEOUT_MS);
            connection.setInstanceFollowRedirects(false);
            connection.setUseCaches(false);

            connection.setRequestProperty(
                "x-finora-admin-key",
                credential.trim()
            );
            connection.setRequestProperty(
                "Accept", "application/json"
            );
            connection.setRequestProperty(
                "Cache-Control", "no-store"
            );

            int status = connection.getResponseCode();

            if (status == 401 || status == 403) {
                throw new SecurityException(
                    "FINORA_ADMIN_ACCESS_DENIED"
                );
            }

            if (status < 200 || status >= 300) {
                throw new IllegalStateException(
                    "FINORA_ADMIN_SERVER_HTTP_" + status
                );
            }

            ByteArrayOutputStream bytes =
                new ByteArrayOutputStream();

            try (InputStream input =
                     connection.getInputStream()) {

                byte[] buffer = new byte[4096];
                int count;

                while ((count = input.read(buffer)) != -1) {
                    if (bytes.size() + count >
                        MAX_BODY_BYTES) {
                        throw new IllegalStateException(
                            "ADMIN_RESPONSE_TOO_LARGE"
                        );
                    }

                    bytes.write(buffer, 0, count);
                }
            }

            return new JSONObject(
                new String(
                    bytes.toByteArray(),
                    StandardCharsets.UTF_8
                )
            );

        } finally {
            if (connection != null) {
                connection.disconnect();
            }
        }
    }

    private void verifyCredential(
        String credential
    ) throws Exception {

        JSONObject response = request(
            "/admin/verify",
            credential
        );

        if (!response.optBoolean("ok", false) ||
            !response.optBoolean(
                "authenticated", false
            )) {
            throw new SecurityException(
                "FINORA_ADMIN_VERIFICATION_FAILED"
            );
        }
    }

    /*
     * Verify first, encrypt second.
     * Never store an unverified credential.
     */
    synchronized boolean configure(
        String credential
    ) throws Exception {

        verifyCredential(credential);
        storeCredential(credential);

        return true;
    }

    synchronized boolean verifyStored()
        throws Exception {

        String credential = readCredential();

        try {
            verifyCredential(credential);
            return true;
        } catch (SecurityException rejected) {
            clearCredential();
            throw rejected;
        }
    }

    synchronized JSONObject dashboard(
        int page,
        int size,
        String month
    ) throws Exception {

        if (page < 1 || page > 100000 ||
            size < 1 || size > 100) {
            throw new IllegalArgumentException(
                "DASHBOARD_PAGINATION_INVALID"
            );
        }

        String route =
            "/admin/control-center/dashboard" +
            "?page=" + page +
            "&size=" + size;

        if (month != null && !month.isEmpty()) {
            if (!month.matches(
                "[0-9]{4}-(0[1-9]|1[0-2])"
            )) {
                throw new IllegalArgumentException(
                    "DASHBOARD_MONTH_INVALID"
                );
            }

            route += "&month=" + month;
        }

        String credential = readCredential();

        JSONObject response;

        try {
            response = request(route, credential);
        } catch (SecurityException rejected) {
            clearCredential();
            throw rejected;
        }

        if (!response.optBoolean("ok", false) ||
            !"POSTGRESQL".equals(
                response.optString("source", "")
            ) ||
            response.optJSONObject("metrics") == null ||
            response.optJSONObject(
                "subscriptionMonitor"
            ) == null) {
            throw new IllegalStateException(
                "DASHBOARD_SERVER_RESPONSE_INVALID"
            );
        }

        return response;
    }

    // FINORA_P1_758V2_SERVER_READ_BRIDGE
    // Read-only PostgreSQL server APIs.

    private static void validatePageInput(
        int limit,
        int offset
    ) {
        if (
            limit < 1 || limit > 100 ||
            offset < 0 || offset > 10000000
        ) {
            throw new IllegalArgumentException(
                "SERVER_PAGINATION_INVALID"
            );
        }
    }

    private static JSONObject validateReadPage(
        JSONObject response,
        String expectedSource,
        String collection,
        int limit,
        int offset
    ) {
        org.json.JSONArray rows =
            response.optJSONArray(collection);

        if (
            !expectedSource.equals(
                response.optString("source", "")
            ) ||
            rows == null ||
            rows.length() > limit ||
            response.optInt("limit", -1) != limit ||
            response.optInt("offset", -1) != offset ||
            !(response.opt("hasMore") instanceof Boolean)
        ) {
            throw new IllegalStateException(
                "SERVER_READ_RESPONSE_INVALID"
            );
        }

        return response;
    }

    synchronized JSONObject serverBranchDirectory(
        String search,
        int limit,
        int offset
    ) throws Exception {
        validatePageInput(limit, offset);

        String term = search == null ? "" : search;

        if (term.length() > 100) {
            throw new IllegalArgumentException(
                "DIRECTORY_SEARCH_INVALID"
            );
        }

        String encoded = java.net.URLEncoder.encode(
            term,
            "UTF-8"
        );

        JSONObject response = request(
            "/admin/branches/directory" +
            "?limit=" + limit +
            "&offset=" + offset +
            "&search=" + encoded,
            readCredential()
        );

        return validateReadPage(
            response,
            "POSTGRESQL_BRANCH_DIRECTORY",
            "branches",
            limit,
            offset
        );
    }

    synchronized JSONObject serverPendingRecharges(
        int limit,
        int offset
    ) throws Exception {
        validatePageInput(limit, offset);

        JSONObject response = request(
            "/admin/wallet/recharges/pending" +
            "?limit=" + limit +
            "&offset=" + offset,
            readCredential()
        );

        if (!response.optBoolean("ok", false)) {
            throw new IllegalStateException(
                "PENDING_RECHARGE_SERVER_REJECTED"
            );
        }

        return validateReadPage(
            response,
            "POSTGRESQL_RECHARGE_REQUESTS",
            "requests",
            limit,
            offset
        );
    }

    synchronized JSONObject serverRechargeHistory(
        int limit,
        int offset,
        String status
    ) throws Exception {
        validatePageInput(limit, offset);

        if (
            !"ALL".equals(status) &&
            !"APPROVED".equals(status) &&
            !"DECLINED".equals(status)
        ) {
            throw new IllegalArgumentException(
                "RECHARGE_HISTORY_STATUS_INVALID"
            );
        }

        JSONObject response = request(
            "/admin/wallet/recharges/history" +
            "?limit=" + limit +
            "&offset=" + offset +
            "&status=" + status,
            readCredential()
        );

        if (
            !response.optBoolean("ok", false) ||
            !status.equals(response.optString("status"))
        ) {
            throw new IllegalStateException(
                "RECHARGE_HISTORY_RESPONSE_INVALID"
            );
        }

        return validateReadPage(
            response,
            "POSTGRESQL_RECHARGE_REQUESTS",
            "requests",
            limit,
            offset
        );
    }

    // FINORA_P1_758AB_LIVE_WALLETS
    // Read-only production PostgreSQL Wallet directory.
    synchronized JSONObject serverLiveWallets(
        int limit,
        int offset
    ) throws Exception {
        validatePageInput(limit, offset);

        JSONObject response = request(
            "/admin/wallets/live" +
            "?limit=" + limit +
            "&offset=" + offset,
            readCredential()
        );

        if (
            !response.optBoolean("ok", false) ||
            !"POSTGRESQL_WALLETS".equals(
                response.optString("source", "")
            )
        ) {
            throw new IllegalStateException(
                "LIVE_WALLET_SERVER_RESPONSE_INVALID"
            );
        }

        return response;
    }

    // FINORA_P1_758AH_PRICING_GET
    // PostgreSQL-backed global pricing. Never substitute local defaults.

    private static java.math.BigDecimal pricingAmount(
        JSONObject pricing,
        String code
    ) throws Exception {
        Object raw = pricing.opt(code);

        if (raw instanceof JSONObject) {
            JSONObject row = (JSONObject) raw;

            if (row.has("amountInr")) {
                raw = row.opt("amountInr");
            } else if (row.has("amount_inr")) {
                raw = row.opt("amount_inr");
            } else {
                raw = row.opt("amount");
            }
        }

        if (
            !(raw instanceof Number) &&
            !(raw instanceof String)
        ) {
            throw new IllegalStateException(
                "GLOBAL_PRICING_AMOUNT_INVALID"
            );
        }

        java.math.BigDecimal amount;

        try {
            amount = new java.math.BigDecimal(
                String.valueOf(raw).trim()
            ).setScale(
                2,
                java.math.RoundingMode.UNNECESSARY
            );
        } catch (Exception error) {
            throw new IllegalStateException(
                "GLOBAL_PRICING_AMOUNT_INVALID"
            );
        }

        if (
            amount.signum() < 0 ||
            amount.compareTo(
                new java.math.BigDecimal("1000000.00")
            ) > 0
        ) {
            throw new IllegalStateException(
                "GLOBAL_PRICING_AMOUNT_OUT_OF_RANGE"
            );
        }

        return amount;
    }

    synchronized JSONObject serverGlobalPricing()
        throws Exception {

        JSONObject response = request(
            "/admin/pricing/global",
            readCredential()
        );

        if (!response.optBoolean("ok", false)) {
            throw new IllegalStateException(
                "GLOBAL_PRICING_SERVER_REJECTED"
            );
        }

        JSONObject pricing = response.optJSONObject(
            "pricing"
        );

        if (pricing == null) {
            throw new IllegalStateException(
                "GLOBAL_PRICING_NOT_CONFIGURED"
            );
        }

        JSONObject result = new JSONObject();

        result.put("source", "CONTROL_CENTER");
        result.put("revision", 1);

        String[] codes = {
            "CUSTOMER_CREATE",
            "LOAN_DISBURSEMENT",
            "COLLECTION_BELOW_25000",
            "COLLECTION_25000_TO_50000",
            "COLLECTION_ABOVE_50000",
            "SUBSCRIPTION_1_MONTH",
            "SUBSCRIPTION_3_MONTH",
            "SUBSCRIPTION_6_MONTH",
            "SUBSCRIPTION_12_MONTH"
        };

        String[] fields = {
            "customerCreateFee",
            "loanDisbursementFee",
            "collectionBelow25000Fee",
            "collection25000To50000Fee",
            "collectionAbove50000Fee",
            "subscription1MonthFee",
            "subscription3MonthFee",
            "subscription6MonthFee",
            "subscription12MonthFee"
        };

        for (int i = 0; i < codes.length; i++) {
            java.math.BigDecimal amount = pricingAmount(
                pricing,
                codes[i]
            );

            if (
                i < 5 &&
                amount.signum() == 0
            ) {
                throw new IllegalStateException(
                    "GLOBAL_TRANSACTION_PRICE_INVALID"
                );
            }

            result.put(
                fields[i],
                amount
            );
        }

        JSONObject revision = response.optJSONObject(
            "revision"
        );

        if (revision != null) {
            String title = revision.optString(
                "title", ""
            );

            String message = revision.optString(
                "message", ""
            );

            String updatedAt = revision.optString(
                "createdAt", ""
            );

            if (!title.isEmpty()) {
                result.put(
                    "pricingNoticeTitle",
                    title
                );
            }

            if (!message.isEmpty()) {
                result.put(
                    "pricingNoticeMessage",
                    message
                );
            }

            if (!updatedAt.isEmpty()) {
                result.put(
                    "updatedAt",
                    updatedAt
                );
            }
        }

        return result;
    }

    // FINORA_P1_758AI_PRICING_PUT
    // Authorized production pricing write; no offline or local success.
    private static java.math.BigDecimal validatePricingInput(
        JSONObject input,
        String field,
        boolean allowZero
    ) throws Exception {
        Object raw = input.opt(field);
        if (!(raw instanceof Number)) {
            throw new IllegalArgumentException(
                "GLOBAL_PRICING_FIELD_INVALID"
            );
        }

        java.math.BigDecimal amount;
        try {
            amount = new java.math.BigDecimal(
                String.valueOf(raw)
            ).setScale(
                2,
                java.math.RoundingMode.UNNECESSARY
            );
        } catch (Exception error) {
            throw new IllegalArgumentException(
                "GLOBAL_PRICING_AMOUNT_INVALID"
            );
        }

        if (
            amount.signum() < 0 ||
            (!allowZero && amount.signum() == 0) ||
            amount.compareTo(
                new java.math.BigDecimal("1000000.00")
            ) > 0
        ) {
            throw new IllegalArgumentException(
                "GLOBAL_PRICING_AMOUNT_OUT_OF_RANGE"
            );
        }
        return amount;
    }

    synchronized JSONObject updateServerGlobalPricing(
        JSONObject input
    ) throws Exception {
        if (input == null) {
            throw new IllegalArgumentException(
                "GLOBAL_PRICING_INPUT_REQUIRED"
            );
        }

        String[] fields = {
            "customerCreateFee",
            "loanDisbursementFee",
            "collectionBelow25000Fee",
            "collection25000To50000Fee",
            "collectionAbove50000Fee",
            "subscription1MonthFee",
            "subscription3MonthFee",
            "subscription6MonthFee",
            "subscription12MonthFee"
        };

        String[] codes = {
            "CUSTOMER_CREATE",
            "LOAN_DISBURSEMENT",
            "COLLECTION_BELOW_25000",
            "COLLECTION_25000_TO_50000",
            "COLLECTION_ABOVE_50000",
            "SUBSCRIPTION_1_MONTH",
            "SUBSCRIPTION_3_MONTH",
            "SUBSCRIPTION_6_MONTH",
            "SUBSCRIPTION_12_MONTH"
        };

        JSONObject prices = new JSONObject();
        java.math.BigDecimal[] expected =
            new java.math.BigDecimal[fields.length];

        for (int i = 0; i < fields.length; i++) {
            expected[i] = validatePricingInput(
                input, fields[i], i >= 5
            );
            prices.put(codes[i], expected[i]);
        }

        JSONObject payload = new JSONObject();
        payload.put("pricing", prices);

        if (input.has("pricingNoticeTitle")) {
            Object value = input.opt("pricingNoticeTitle");
            if (
                !(value instanceof String) ||
                ((String) value).length() > 200
            ) {
                throw new IllegalArgumentException(
                    "GLOBAL_PRICING_TITLE_INVALID"
                );
            }
            payload.put("title", value);
        }

        if (input.has("pricingNoticeMessage")) {
            Object value = input.opt("pricingNoticeMessage");
            if (
                !(value instanceof String) ||
                ((String) value).length() > 2000
            ) {
                throw new IllegalArgumentException(
                    "GLOBAL_PRICING_MESSAGE_INVALID"
                );
            }
            payload.put("message", value);
        }

        String credential = readCredential();
        HttpsURLConnection connection = null;

        try {
            connection = (HttpsURLConnection)
                new URL(BASE + "/admin/pricing/global")
                    .openConnection();

            connection.setRequestMethod("PUT");
            connection.setConnectTimeout(TIMEOUT_MS);
            connection.setReadTimeout(TIMEOUT_MS);
            connection.setInstanceFollowRedirects(false);
            connection.setUseCaches(false);
            connection.setDoOutput(true);

            connection.setRequestProperty(
                "x-finora-admin-key", credential.trim()
            );
            connection.setRequestProperty(
                "Content-Type", "application/json"
            );
            connection.setRequestProperty(
                "Accept", "application/json"
            );
            connection.setRequestProperty(
                "Cache-Control", "no-store"
            );

            byte[] body = payload.toString().getBytes(
                StandardCharsets.UTF_8
            );

            if (body.length > 16384) {
                throw new IllegalArgumentException(
                    "GLOBAL_PRICING_PAYLOAD_TOO_LARGE"
                );
            }

            connection.setFixedLengthStreamingMode(body.length);

            try (java.io.OutputStream output =
                     connection.getOutputStream()) {
                output.write(body);
            }

            int status = connection.getResponseCode();

            if (status == 401 || status == 403) {
                throw new SecurityException(
                    "FINORA_ADMIN_ACCESS_DENIED"
                );
            }

            if (status < 200 || status >= 300) {
                throw new IllegalStateException(
                    "GLOBAL_PRICING_SERVER_REJECTED_HTTP_" +
                    status
                );
            }

            // A successful HTTP response alone is not enough.
            // Read the current authoritative state again.
        } finally {
            if (connection != null) {
                connection.disconnect();
            }
        }

        JSONObject confirmed = serverGlobalPricing();

        for (int i = 0; i < fields.length; i++) {
            java.math.BigDecimal actual =
                new java.math.BigDecimal(
                    String.valueOf(
                        confirmed.get(fields[i])
                    )
                );
            if (actual.compareTo(expected[i]) != 0) {
                throw new IllegalStateException(
                    "GLOBAL_PRICING_CONFIRMATION_MISMATCH"
                );
            }
        }

        return confirmed;
    }

    // FINORA_P1_758AJ_OWNER_PROVISION
    // Existing production owner API, never a local fake owner.
    synchronized JSONObject provisionServerOwner(
        JSONObject input
    ) throws Exception {
        if (input == null) {
            throw new IllegalArgumentException("OWNER_INPUT_REQUIRED");
        }

        // FINORA_P1_758BN_OWNER_KEY
        String requestKey = input.optString("requestKey", "");

        if (
            !requestKey.isEmpty() &&
            !requestKey.matches(
                "(?i)[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"
            )
        ) {
            throw new IllegalArgumentException(
                "OWNER_IDEMPOTENCY_KEY_INVALID"
            );
        }

        String[] required = {
            "ownerName", "mobile", "businessName",
            "branchName", "username", "validFrom",
            "validUntil"
        };

        for (String field : required) {
            Object value = input.opt(field);
            if (
                !(value instanceof String) ||
                ((String) value).trim().isEmpty() ||
                ((String) value).length() > 160
            ) {
                throw new IllegalArgumentException(
                    "OWNER_INPUT_FIELD_INVALID"
                );
            }
        }

        String mobile = input.getString("mobile");
        String username = input.getString("username");
        String from = input.getString("validFrom");
        String until = input.getString("validUntil");

        if (!mobile.matches("[0-9]{10}")) {
            throw new IllegalArgumentException("OWNER_MOBILE_INVALID");
        }

        if (!username.matches("[a-z0-9._-]{4,12}")) {
            throw new IllegalArgumentException("OWNER_USERNAME_INVALID");
        }

        java.time.LocalDate start;
        java.time.LocalDate end;

        try {
            start = java.time.LocalDate.parse(from);
            end = java.time.LocalDate.parse(until);
        } catch (Exception error) {
            throw new IllegalArgumentException("OWNER_DATES_INVALID");
        }

        if (!end.isAfter(start)) {
            throw new IllegalArgumentException("OWNER_DATES_INVALID");
        }

        String aadhaar = input.optString("aadhaar", "");

        if (!aadhaar.isEmpty()) {
            if (
                !aadhaar.matches("[0-9]{12}") ||
                !input.optBoolean("aadhaarConsent", false)
            ) {
                throw new IllegalArgumentException(
                    "OWNER_AADHAAR_CONSENT_INVALID"
                );
            }
        }

        Object rawBalance = input.opt("openingWalletBalance");
        if (!(rawBalance instanceof Number)) {
            throw new IllegalArgumentException(
                "OWNER_WALLET_BALANCE_INVALID"
            );
        }

        java.math.BigDecimal amount;

        try {
            amount = new java.math.BigDecimal(
                String.valueOf(rawBalance)
            ).setScale(
                2,
                java.math.RoundingMode.UNNECESSARY
            );
        } catch (Exception error) {
            throw new IllegalArgumentException(
                "OWNER_WALLET_BALANCE_INVALID"
            );
        }

        if (
            amount.signum() < 0 ||
            amount.compareTo(
                new java.math.BigDecimal("25000.00")
            ) > 0
        ) {
            throw new IllegalArgumentException(
                "OWNER_OPENING_WALLET_BALANCE_LIMIT_EXCEEDED"
            );
        }

        JSONObject payload = new JSONObject();

        for (String field : required) {
            payload.put(field, input.getString(field).trim());
        }

        payload.put("openingWalletBalance", amount);

        if (!aadhaar.isEmpty()) {
            payload.put("aadhaar", aadhaar);
            payload.put("aadhaarConsent", true);
        }

        byte[] bytes = payload.toString().getBytes(
            StandardCharsets.UTF_8
        );

        if (bytes.length > 8192) {
            throw new IllegalArgumentException(
                "OWNER_PROVISION_PAYLOAD_TOO_LARGE"
            );
        }

        String credential = readCredential();
        HttpsURLConnection connection = null;

        try {
            connection = (HttpsURLConnection)
                new URL(BASE + "/admin/provision-owner")
                    .openConnection();

            connection.setRequestMethod("POST");
            connection.setConnectTimeout(TIMEOUT_MS);
            connection.setReadTimeout(TIMEOUT_MS);
            connection.setInstanceFollowRedirects(false);
            connection.setUseCaches(false);
            connection.setDoOutput(true);

            connection.setRequestProperty(
                "x-finora-admin-key", credential.trim()
            );
            connection.setRequestProperty(
                "Content-Type", "application/json"
            );

            if (!requestKey.isEmpty()) {
                connection.setRequestProperty(
                    "Idempotency-Key", requestKey
                );
            }
            connection.setRequestProperty(
                "Accept", "application/json"
            );
            connection.setRequestProperty(
                "Cache-Control", "no-store"
            );

            connection.setFixedLengthStreamingMode(bytes.length);

            // Once transmission starts, errors may mean the
            // server created the owner. Never auto-retry.
            try (java.io.OutputStream output =
                     connection.getOutputStream()) {
                output.write(bytes);
            } catch (java.io.IOException error) {
                throw new java.io.IOException(
                    "OWNER_PROVISION_OUTCOME_UNKNOWN"
                );
            }

            int status;

            try {
                status = connection.getResponseCode();
            } catch (java.io.IOException error) {
                throw new java.io.IOException(
                    "OWNER_PROVISION_OUTCOME_UNKNOWN"
                );
            }

            if (status == 401 || status == 403) {
                throw new SecurityException(
                    "FINORA_ADMIN_ACCESS_DENIED"
                );
            }

            if (status < 200 || status >= 300) {
                throw new IllegalStateException(
                    "OWNER_PROVISION_SERVER_HTTP_" + status
                );
            }

            java.io.ByteArrayOutputStream buffer =
                new java.io.ByteArrayOutputStream();

            try (InputStream stream =
                     connection.getInputStream()) {
                byte[] chunk = new byte[4096];
                int count;

                while ((count = stream.read(chunk)) != -1) {
                    if (buffer.size() + count > MAX_BODY_BYTES) {
                        throw new IllegalStateException(
                            "OWNER_PROVISION_RESPONSE_TOO_LARGE"
                        );
                    }
                    buffer.write(chunk, 0, count);
                }
            } catch (java.io.IOException error) {
                throw new java.io.IOException(
                    "OWNER_PROVISION_OUTCOME_UNKNOWN"
                );
            }

            JSONObject result;

            try {
                result = new JSONObject(
                    new String(
                        buffer.toByteArray(),
                        StandardCharsets.UTF_8
                    )
                );
            } catch (Exception error) {
                throw new IllegalStateException(
                    "OWNER_PROVISION_OUTCOME_UNKNOWN"
                );
            }

            if (
                !result.optBoolean("ok", false) ||
                result.optJSONObject("owner") == null ||
                result.optJSONObject("business") == null ||
                result.optJSONObject("branch") == null ||
                result.optJSONObject("credentials") == null ||
                result.optJSONObject("subscription") == null ||
                result.optJSONObject("wallet") == null
            ) {
                throw new IllegalStateException(
                    "OWNER_PROVISION_OUTCOME_UNKNOWN"
                );
            }

            if (
                result.getJSONObject("owner")
                    .optString("ownerId").isEmpty() ||
                result.getJSONObject("business")
                    .optString("businessId").isEmpty() ||
                result.getJSONObject("branch")
                    .optString("branchId").isEmpty()
            ) {
                throw new IllegalStateException(
                    "OWNER_PROVISION_OUTCOME_UNKNOWN"
                );
            }

            // Contains one-time owner credentials.
            // Return only to the authorized caller; never log.
            return result;
        } finally {
            if (connection != null) {
                connection.disconnect();
            }
        }
    }

    // FINORA_P1_758AL_RECHARGE_DECISION
    // Financial decisions are executed only by the PostgreSQL server.
    synchronized JSONObject decideServerWalletRecharge(
        JSONObject input
    ) throws Exception {

        if (input == null) {
            throw new IllegalArgumentException(
                "RECHARGE_DECISION_INPUT_REQUIRED"
            );
        }

        String requestId = input.optString(
            "requestId", ""
        ).trim().toLowerCase(java.util.Locale.ROOT);

        if (!requestId.matches(
            "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"
        )) {
            throw new IllegalArgumentException(
                "INVALID_REQUEST_ID"
            );
        }

        String decision = input.optString(
            "decision", ""
        );

        JSONObject payload = new JSONObject();
        payload.put("requestId", requestId);

        if ("APPROVE".equals(decision)) {

            if (!Boolean.TRUE.equals(
                input.opt("paymentVerified")
            )) {
                throw new IllegalArgumentException(
                    "PAYMENT_VERIFICATION_REQUIRED"
                );
            }

            String reference = input.optString(
                "paymentReference", ""
            ).trim().toUpperCase(java.util.Locale.ROOT);

            if (!reference.matches("[A-Z0-9]{6,64}")) {
                throw new IllegalArgumentException(
                    "INVALID_PAYMENT_REFERENCE"
                );
            }

            payload.put("decision", "APPROVE");
            payload.put("paymentVerified", true);
            payload.put("paymentReference", reference);

        } else if ("DECLINE".equals(decision)) {

            String reason = input.optString(
                "reason", ""
            ).trim();

            if (
                reason.isEmpty() ||
                reason.length() > 1000 ||
                reason.matches("(?s).*[\\p{Cntrl}].*")
            ) {
                throw new IllegalArgumentException(
                    "INVALID_DECLINE_REASON"
                );
            }

            payload.put("decision", "DECLINE");
            payload.put("reason", reason);

        } else {
            throw new IllegalArgumentException(
                "INVALID_DECISION"
            );
        }

        // Do not forward walletId, balance, amount or
        // any untrusted extra fields from the renderer.
        byte[] bytes = payload.toString().getBytes(
            StandardCharsets.UTF_8
        );

        if (bytes.length > 4096) {
            throw new IllegalArgumentException(
                "RECHARGE_DECISION_PAYLOAD_TOO_LARGE"
            );
        }

        String credential = readCredential();
        HttpsURLConnection connection = null;
        boolean transmissionStarted = false;

        try {
            connection = (HttpsURLConnection)
                new URL(
                    BASE + "/admin/wallet/recharges/decision"
                ).openConnection();

            connection.setRequestMethod("POST");
            connection.setConnectTimeout(TIMEOUT_MS);
            connection.setReadTimeout(TIMEOUT_MS);
            connection.setInstanceFollowRedirects(false);
            connection.setUseCaches(false);
            connection.setDoOutput(true);

            connection.setRequestProperty(
                "x-finora-admin-key", credential.trim()
            );
            connection.setRequestProperty(
                "Content-Type", "application/json"
            );
            connection.setRequestProperty(
                "Accept", "application/json"
            );
            connection.setRequestProperty(
                "Cache-Control", "no-store"
            );

            connection.setFixedLengthStreamingMode(
                bytes.length
            );

            transmissionStarted = true;

            try (java.io.OutputStream stream =
                     connection.getOutputStream()) {
                stream.write(bytes);
            }

            int status = connection.getResponseCode();

            if (status == 401 || status == 403) {
                throw new SecurityException(
                    "FINORA_ADMIN_ACCESS_DENIED"
                );
            }

            if (status < 200 || status >= 300) {
                throw new IllegalStateException(
                    "RECHARGE_DECISION_SERVER_HTTP_" +
                    status
                );
            }

            java.io.ByteArrayOutputStream buffer =
                new java.io.ByteArrayOutputStream();

            try (InputStream stream =
                     connection.getInputStream()) {

                byte[] chunk = new byte[4096];
                int count;

                while ((count = stream.read(chunk)) != -1) {
                    if (
                        buffer.size() + count >
                        MAX_BODY_BYTES
                    ) {
                        throw new IllegalStateException(
                            "RECHARGE_DECISION_OUTCOME_UNKNOWN"
                        );
                    }

                    buffer.write(chunk, 0, count);
                }
            }

            JSONObject response;

            try {
                response = new JSONObject(
                    new String(
                        buffer.toByteArray(),
                        StandardCharsets.UTF_8
                    )
                );
            } catch (Exception error) {
                throw new IllegalStateException(
                    "RECHARGE_DECISION_OUTCOME_UNKNOWN"
                );
            }

            JSONObject request = response.optJSONObject(
                "request"
            );

            String expectedStatus =
                "APPROVE".equals(decision)
                    ? "APPROVED"
                    : "DECLINED";

            if (
                !response.optBoolean("ok", false) ||
                !"POSTGRESQL_RECHARGE_REQUESTS".equals(
                    response.optString("source", "")
                ) ||
                request == null ||
                !requestId.equalsIgnoreCase(
                    request.optString("requestId", "")
                ) ||
                !expectedStatus.equals(
                    request.optString("status", "")
                ) ||
                request.optString(
                    "walletId", ""
                ).isEmpty() ||
                !(request.opt("amountInr") instanceof String) ||
                !request.optString("amountInr", "").matches(
                    "(0|[1-9][0-9]{0,9})(\\.[0-9]{1,2})?"
                ) ||
                request.optString(
                    "decidedAt", ""
                ).isEmpty() ||
                !(response.opt("replayed") instanceof Boolean)
            ) {
                throw new IllegalStateException(
                    "RECHARGE_DECISION_OUTCOME_UNKNOWN"
                );
            }

            // A verified PostgreSQL decision receipt,
            // never a client-calculated Wallet credit.
            return response;

        } catch (java.io.IOException error) {
            if (transmissionStarted) {
                throw new IllegalStateException(
                    "RECHARGE_DECISION_OUTCOME_UNKNOWN"
                );
            }
            throw error;
        } finally {
            if (connection != null) {
                connection.disconnect();
            }
        }
    }
    // FINORA_C8_X42_DE_SERVER_ONLY_PRICING
    // No device-local pricing authority or offline save.

    private static String fourPlanRoute(
        String kind,
        String branchId
    ) {
        if ("GLOBAL".equals(kind) &&
            (branchId == null || branchId.isEmpty())) {
            return "/admin/pricing/plans/global";
        }

        if ("BRANCH".equals(kind) &&
            branchId != null &&
            branchId.matches("[A-Za-z0-9_-]{1,128}")) {
            return "/admin/pricing/plans/branch/" + branchId;
        }

        throw new IllegalArgumentException(
            "FINORA_PRICING_SCOPE_INVALID"
        );
    }

    synchronized JSONObject serverFourPlanPricing(
        JSONObject input
    ) throws Exception {
        if (input == null) {
            throw new IllegalArgumentException(
                "FINORA_PRICING_REQUEST_INVALID"
            );
        }

        String kind = input.optString("scope", "");
        String branchId = input.isNull("branchId")
            ? null : input.optString("branchId", null);

        String route = fourPlanRoute(kind, branchId);

        JSONObject response = request(
            route,
            readCredential()
        );

        if (!response.optBoolean("ok", false) ||
            !kind.equals(response.optString("scope", "")) ||
            response.optJSONArray("plans") == null ||
            response.optJSONArray("plans").length() != 4) {
            throw new IllegalStateException(
                "FINORA_PRICING_READBACK_INVALID"
            );
        }

        if ("BRANCH".equals(kind) &&
            !branchId.equals(response.optString("branchId", ""))) {
            throw new IllegalStateException(
                "FINORA_PRICING_BRANCH_SCOPE_MISMATCH"
            );
        }

        if ("GLOBAL".equals(kind) &&
            !response.isNull("branchId")) {
            throw new IllegalStateException(
                "FINORA_PRICING_GLOBAL_SCOPE_MISMATCH"
            );
        }

        return response;
    }

    synchronized JSONObject saveServerFourPlanPricing(
        JSONObject payload
    ) throws Exception {
        if (payload == null ||
            payload.optJSONObject("scope") == null ||
            payload.optJSONArray("plans") == null ||
            payload.optJSONArray("plans").length() != 4) {
            throw new IllegalArgumentException(
                "FINORA_PRICING_SAVE_PAYLOAD_INVALID"
            );
        }

        JSONObject scope = payload.getJSONObject("scope");
        String kind = scope.optString("kind", "");
        String branchId = scope.isNull("branchId")
            ? null : scope.optString("branchId", null);

        String route = fourPlanRoute(kind, branchId);

        org.json.JSONArray plans = payload.getJSONArray("plans");
        int[] expectedMonths = {1, 3, 6, 12};

        for (int i = 0; i < expectedMonths.length; i++) {
            JSONObject plan = plans.optJSONObject(i);

            if (plan == null ||
                plan.optInt("months", -1) != expectedMonths[i] ||
                plan.optJSONObject("fees") == null) {
                throw new IllegalArgumentException(
                    "FINORA_PRICING_SAVE_PLAN_INVALID"
                );
            }

            String[] values = {
                plan.optString("subscriptionPriceInr", ""),
                plan.getJSONObject("fees").optString("CUSTOMER_CREATE", ""),
                plan.getJSONObject("fees").optString("LOAN_DISBURSEMENT", ""),
                plan.getJSONObject("fees").optString("COLLECTION", "")
            };

            for (String value : values) {
                if (!value.matches(
                    "(?:0|[1-9][0-9]*)(?:\\.[0-9]{1,2})?"
                )) {
                    throw new IllegalArgumentException(
                        "FINORA_PRICING_SAVE_AMOUNT_INVALID"
                    );
                }

                java.math.BigDecimal amount =
                    new java.math.BigDecimal(value);

                if (amount.compareTo(
                    new java.math.BigDecimal("25000")
                ) > 0) {
                    throw new IllegalArgumentException(
                        "FINORA_PRICING_SAVE_AMOUNT_LIMIT"
                    );
                }
            }
        }

        byte[] requestBytes = payload.toString().getBytes(
            StandardCharsets.UTF_8
        );

        if (requestBytes.length > 32768) {
            throw new IllegalArgumentException(
                "FINORA_PRICING_SAVE_BODY_TOO_LARGE"
            );
        }

        HttpsURLConnection connection = null;

        try {
            connection = (HttpsURLConnection)
                new URL(BASE + route).openConnection();

            connection.setRequestMethod("PUT");
            connection.setConnectTimeout(TIMEOUT_MS);
            connection.setReadTimeout(TIMEOUT_MS);
            connection.setInstanceFollowRedirects(false);
            connection.setUseCaches(false);
            connection.setDoOutput(true);

            connection.setRequestProperty(
                "x-finora-admin-key",
                readCredential().trim()
            );
            connection.setRequestProperty(
                "Content-Type", "application/json"
            );
            connection.setRequestProperty(
                "Accept", "application/json"
            );
            connection.setRequestProperty(
                "Cache-Control", "no-store"
            );

            try (java.io.OutputStream output =
                     connection.getOutputStream()) {
                output.write(requestBytes);
            }

            int status = connection.getResponseCode();

            if (status == 401 || status == 403) {
                throw new SecurityException(
                    "FINORA_PRICING_SAVE_UNAUTHORIZED"
                );
            }

            if (status < 200 || status >= 300) {
                throw new IllegalStateException(
                    "FINORA_PRICING_SAVE_SERVER_REJECTED"
                );
            }

            String contentType = connection.getContentType();

            if (contentType == null ||
                !contentType.toLowerCase(java.util.Locale.ROOT)
                    .startsWith("application/json")) {
                throw new IllegalStateException(
                    "FINORA_PRICING_SAVE_RESPONSE_TYPE_INVALID"
                );
            }

            ByteArrayOutputStream bytes =
                new ByteArrayOutputStream();

            try (InputStream input =
                     connection.getInputStream()) {
                byte[] buffer = new byte[4096];
                int count;

                while ((count = input.read(buffer)) != -1) {
                    if (bytes.size() + count > MAX_BODY_BYTES) {
                        throw new IllegalStateException(
                            "FINORA_PRICING_SAVE_RESPONSE_TOO_LARGE"
                        );
                    }
                    bytes.write(buffer, 0, count);
                }
            }

            JSONObject response = new JSONObject(
                new String(
                    bytes.toByteArray(),
                    StandardCharsets.UTF_8
                )
            );

            if (!response.optBoolean("ok", false) ||
                response.optInt("pricesWritten", -1) != 16 ||
                !response.optString("revisionId", "")
                    .matches("[A-Za-z0-9_-]{1,64}")) {
                throw new IllegalStateException(
                    "FINORA_PRICING_SAVE_READBACK_INVALID"
                );
            }

            return response;
        } finally {
            if (connection != null) {
                connection.disconnect();
            }
        }
    }

}
