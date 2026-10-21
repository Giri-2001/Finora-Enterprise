package com.finora.enterprise.control;

import android.os.Looper;
import org.json.JSONObject;
import javax.net.ssl.HttpsURLConnection;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.URL;
import java.nio.charset.StandardCharsets;

public final class FinoraAccountPasswordLoginClient {
    private static final String ENDPOINT =
        "https://api.finoraenterprise.com/owner/account/session";

    private static final int TIMEOUT_MS = 15000;
    private static final int MAX_RESPONSE_BYTES = 65536;

    private FinoraAccountPasswordLoginClient() {}

    public static JSONObject login(String username, String password) {
        HttpsURLConnection connection = null;

        try {
            if (Looper.myLooper() == Looper.getMainLooper()) {
                return failure("BACKGROUND_THREAD_REQUIRED");
            }

            if (username == null || username.trim().isEmpty()
                    || password == null || password.isEmpty()) {
                return failure("INVALID_CREDENTIALS_INPUT");
            }

            URL url = new URL(ENDPOINT);
            connection = (HttpsURLConnection) url.openConnection();
            connection.setRequestMethod("POST");
            connection.setConnectTimeout(TIMEOUT_MS);
            connection.setReadTimeout(TIMEOUT_MS);
            connection.setDoOutput(true);
            connection.setInstanceFollowRedirects(false);
            connection.setRequestProperty("Content-Type", "application/json");
            connection.setRequestProperty("Accept", "application/json");
            connection.setRequestProperty("Cache-Control", "no-store");

            JSONObject request = new JSONObject();
            request.put("username", username.trim());
            request.put("password", password);

            byte[] body = request.toString().getBytes(StandardCharsets.UTF_8);

            try (OutputStream output = connection.getOutputStream()) {
                output.write(body);
            }

            int status = connection.getResponseCode();

            if (status == 404) {
                return failure("LOGIN_ENDPOINT_NOT_DEPLOYED");
            }

            if (status >= 300 && status < 400) {
                return failure("UNEXPECTED_REDIRECT");
            }

            InputStream stream = status >= 400
                ? connection.getErrorStream()
                : connection.getInputStream();

            if (stream == null) {
                return failure("EMPTY_SERVER_RESPONSE");
            }

            ByteArrayOutputStream buffer = new ByteArrayOutputStream();
            try (InputStream input = stream) {
                byte[] chunk = new byte[4096];
                int count;
                while ((count = input.read(chunk)) != -1) {
                    if (buffer.size() + count > MAX_RESPONSE_BYTES) {
                        return failure("RESPONSE_TOO_LARGE");
                    }
                    buffer.write(chunk, 0, count);
                }
            }

            JSONObject response = new JSONObject(
                new String(buffer.toByteArray(), StandardCharsets.UTF_8)
            );

            if (status < 200 || status >= 300) {
                return failure("SERVER_REJECTED_LOGIN");
            }

            if (!response.optBoolean("success", false)
                    || !"ACCOUNT_WALLET_ONLY".equals(
                        response.optString("sessionType", ""))
                    || response.optBoolean("businessDataAccess", true)
                    || response.optString("accessToken", "").isEmpty()) {
                return failure("INVALID_SERVER_SESSION");
            }

            return response;
        } catch (Exception ignored) {
            return failure("SERVER_UNAVAILABLE");
        } finally {
            if (connection != null) {
                connection.disconnect();
            }
        }
    }

    private static JSONObject failure(String code) {
        JSONObject result = new JSONObject();
        try {
            result.put("success", false);
            result.put("errorCode", code);
        } catch (Exception ignored) {}
        return result;
    }
}