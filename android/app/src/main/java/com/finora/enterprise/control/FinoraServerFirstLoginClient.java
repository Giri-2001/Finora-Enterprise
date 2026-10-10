package com.finora.enterprise.control;

import android.content.Context;

import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.text.Normalizer;
import java.util.Locale;
import javax.net.ssl.HttpsURLConnection;

/**
 * FINORA Android server-first verification transport.
 *
 * HTTPS only, fixed production endpoint, no redirects,
 * bounded responses, no credential logging.
 *
 * Does NOT create sessions, trust devices or persist credentials.
 * Full signed payload semantics and enrollment remain mandatory.
 */
public final class FinoraServerFirstLoginClient {

    private static final String ENDPOINT =
        "https://api.finoraenterprise.com/owner/first-login/verify";

    private static final int TIMEOUT_MS = 15000;
    private static final int MAX_RESPONSE_BYTES = 256 * 1024;

    public static final class Result {

        public final boolean success;
        public final String errorCode;
        public final JSONObject signedBootstrap;

        private Result(
            boolean success,
            String errorCode,
            JSONObject signedBootstrap
        ) {
            this.success = success;
            this.errorCode = errorCode;
            this.signedBootstrap = signedBootstrap;
        }

        static Result failure(String code) {
            return new Result(false, code, null);
        }

        static Result verified(JSONObject signed) {
            return new Result(true, null, signed);
        }
    }

    private FinoraServerFirstLoginClient() {
    }

    public static Result verify(
        String username,
        String password,
        String securityCode
    ) {
        if (
            username == null ||
            password == null ||
            securityCode == null ||
            username.trim().isEmpty() ||
            password.isEmpty() ||
            securityCode.trim().isEmpty()
        ) {
            return Result.failure("INVALID_REQUEST");
        }

        String canonicalUsername =
            Normalizer.normalize(
                username.trim(),
                Normalizer.Form.NFKC
            ).toLowerCase(Locale.ROOT);

        HttpsURLConnection connection = null;

        try {
            URL url = new URL(ENDPOINT);

            if (
                !"https".equalsIgnoreCase(url.getProtocol()) ||
                !"api.finoraenterprise.com".equalsIgnoreCase(
                    url.getHost()
                )
            ) {
                return Result.failure("INVALID_ENDPOINT");
            }

            connection =
                (HttpsURLConnection) url.openConnection();

            connection.setRequestMethod("POST");
            connection.setConnectTimeout(TIMEOUT_MS);
            connection.setReadTimeout(TIMEOUT_MS);
            connection.setInstanceFollowRedirects(false);
            connection.setUseCaches(false);
            connection.setDoOutput(true);

            connection.setRequestProperty(
                "Content-Type",
                "application/json; charset=utf-8"
            );

            connection.setRequestProperty(
                "Accept",
                "application/json"
            );

            JSONObject body = new JSONObject();

            body.put("username", username.trim());
            body.put("password", password);
            body.put("securityCode", securityCode);

            byte[] requestBytes =
                body.toString().getBytes(StandardCharsets.UTF_8);

            connection.setFixedLengthStreamingMode(
                requestBytes.length
            );

            try (OutputStream output =
                connection.getOutputStream()) {

                output.write(requestBytes);
                output.flush();
            }
            finally {
                java.util.Arrays.fill(
                    requestBytes,
                    (byte) 0
                );
            }

            int status = connection.getResponseCode();

            if (status != 200) {
                if (status >= 300 && status < 400) {
                    return Result.failure("SERVER_REDIRECT_REJECTED");
                }

                return Result.failure(
                    status >= 400 && status < 500
                        ? "SERVER_REJECTED"
                        : "SERVER_UNAVAILABLE"
                );
            }

            byte[] responseBytes;

            try (
                InputStream input = connection.getInputStream();
                ByteArrayOutputStream output =
                    new ByteArrayOutputStream()
            ) {
                byte[] buffer = new byte[4096];
                int total = 0;
                int count;

                while ((count = input.read(buffer)) != -1) {
                    total += count;

                    if (total > MAX_RESPONSE_BYTES) {
                        return Result.failure(
                            "RESPONSE_TOO_LARGE"
                        );
                    }

                    output.write(buffer, 0, count);
                }

                responseBytes = output.toByteArray();
            }

            JSONObject response;

            try {
                response = new JSONObject(
                    new String(
                        responseBytes,
                        StandardCharsets.UTF_8
                    )
                );
            }
            finally {
                java.util.Arrays.fill(
                    responseBytes,
                    (byte) 0
                );
            }

            JSONObject signed =
                response.optJSONObject("signedBootstrap");

            if (signed == null) {
                return Result.failure(
                    "INVALID_SERVER_RESPONSE"
                );
            }

            if (
                !FinoraServerFirstLoginSignatureVerifier
                    .verify(signed)
            ) {
                return Result.failure(
                    "SIGNATURE_VERIFICATION_FAILED"
                );
            }

            JSONObject payload =
                signed.optJSONObject("payload");

            if (
                !FinoraServerFirstLoginPayloadValidator.validate(
                    payload,
                    canonicalUsername
                )
            ) {
                return Result.failure(
                    "BOOTSTRAP_SCOPE_MISMATCH"
                );
            }

            // Verification result only, not login authorization.
            return Result.verified(signed);

        }
        catch (Exception error) {
            // Never log credential-bearing exceptions or bodies.
            return Result.failure("SERVER_UNAVAILABLE");
        }
        finally {
            if (connection != null) {
                connection.disconnect();
            }
        }
    }
}