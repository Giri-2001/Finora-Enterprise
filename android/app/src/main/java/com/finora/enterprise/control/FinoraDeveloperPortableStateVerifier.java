package com.finora.enterprise.control;

import android.util.Base64;

import org.json.JSONArray;
import org.json.JSONObject;

import java.nio.charset.StandardCharsets;
import java.security.KeyFactory;
import java.security.MessageDigest;
import java.security.PublicKey;
import java.security.Signature;
import java.security.spec.X509EncodedKeySpec;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Iterator;
import java.util.List;

/*
 * FINORA DEVELOPER CONTROL CENTER
 * SIGNED PORTABLE STATE VERIFIER
 *
 * Verifies the exact decrypted Windows Portable State envelope
 * against the already-restored Android Control Center authority.
 */
public final class FinoraDeveloperPortableStateVerifier {

    private static final String FORMAT =
        "FINORA_CONTROL_CENTER_PORTABLE_STATE_V1";

    private static final int SCHEMA_VERSION =
        1;

    private FinoraDeveloperPortableStateVerifier() {
    }

    public static JSONObject verify(
        JSONObject envelope,
        JSONObject keyVault
    ) throws Exception {

        if (
            envelope == null ||
            keyVault == null
        ) {
            throw new IllegalStateException(
                "FINORA Portable State verification authority is unavailable."
            );
        }

        if (
            !FORMAT.equals(
                envelope.optString(
                    "format",
                    ""
                )
            ) ||
            envelope.optInt(
                "schemaVersion",
                -1
            ) != SCHEMA_VERSION
        ) {
            throw new IllegalStateException(
                "FINORA Portable State envelope format or schemaVersion is invalid."
            );
        }

        JSONObject payload =
            envelope.optJSONObject(
                "payload"
            );

        if (payload == null) {
            throw new IllegalStateException(
                "FINORA Portable State payload is missing."
            );
        }

        if (
            !FORMAT.equals(
                payload.optString(
                    "format",
                    ""
                )
            ) ||
            payload.optInt(
                "schemaVersion",
                -1
            ) != SCHEMA_VERSION
        ) {
            throw new IllegalStateException(
                "FINORA Portable State payload format or schemaVersion is invalid."
            );
        }

        String vaultIssuerId =
            keyVault.optString(
                "issuerId",
                ""
            );

        String vaultSigningKeyId =
            keyVault.optString(
                "signingKeyId",
                ""
            );

        String publicKeyBase64 =
            keyVault.optString(
                "publicKeySpkiDerBase64",
                ""
            );

        if (
            vaultIssuerId.isEmpty() ||
            vaultSigningKeyId.isEmpty() ||
            publicKeyBase64.isEmpty()
        ) {
            throw new IllegalStateException(
                "FINORA Control Center restored signing authority is incomplete."
            );
        }

        if (
            !vaultIssuerId.equals(
                payload.optString(
                    "issuerId",
                    ""
                )
            ) ||
            !vaultSigningKeyId.equals(
                payload.optString(
                    "signingKeyId",
                    ""
                )
            )
        ) {
            throw new IllegalStateException(
                "FINORA Portable State envelope does not match the current signing authority."
            );
        }

        String canonicalPayload =
            canonicalJson(
                payload
            );

        String expectedSha256 =
            sha256Hex(
                canonicalPayload
            );

        String suppliedSha256 =
            envelope.optString(
                "payloadSha256",
                ""
            );

        if (
            suppliedSha256.isEmpty() ||
            !suppliedSha256.equals(
                expectedSha256
            )
        ) {
            throw new IllegalStateException(
                "FINORA Portable State envelope payload digest is invalid. " +
                "FILE DIGEST=" +
                (
                    suppliedSha256.length() >= 16
                        ? suppliedSha256.substring(0, 16)
                        : suppliedSha256
                ) +
                " | ANDROID DIGEST=" +
                (
                    expectedSha256.length() >= 16
                        ? expectedSha256.substring(0, 16)
                        : expectedSha256
                ) +
                " | CANONICAL UTF8 BYTES=" +
                canonicalPayload.getBytes(
                    StandardCharsets.UTF_8
                ).length
            );
        }

        String signatureBase64 =
            envelope.optString(
                "signatureBase64",
                ""
            );

        if (signatureBase64.isEmpty()) {
            throw new IllegalStateException(
                "FINORA Portable State envelope signature is missing."
            );
        }

        byte[] publicKeyBytes =
            decodeCanonicalBase64(
                publicKeyBase64,
                "public key"
            );

        byte[] signatureBytes =
            decodeCanonicalBase64(
                signatureBase64,
                "signature"
            );

        try {

            KeyFactory keyFactory =
                KeyFactory.getInstance(
                    "EC"
                );

            PublicKey publicKey =
                keyFactory.generatePublic(
                    new X509EncodedKeySpec(
                        publicKeyBytes
                    )
                );

            Signature verifier =
                Signature.getInstance(
                    "SHA256withECDSA"
                );

            verifier.initVerify(
                publicKey
            );

            verifier.update(
                canonicalPayload.getBytes(
                    StandardCharsets.UTF_8
                )
            );

            byte[] derSignature =
                ieeeP1363SignatureToDer(
                    signatureBytes
                );

            try {

                if (
                    !verifier.verify(
                        derSignature
                    )
                ) {
                    throw new IllegalStateException(
                        "FINORA Portable State envelope signature is invalid."
                    );
                }

            } finally {

                java.util.Arrays.fill(
                    derSignature,
                    (byte) 0
                );
            }

        } finally {

            java.util.Arrays.fill(
                publicKeyBytes,
                (byte) 0
            );

            java.util.Arrays.fill(
                signatureBytes,
                (byte) 0
            );
        }

        long generation =
            payload.optLong(
                "stateGeneration",
                -1
            );

        if (generation < 1) {
            throw new IllegalStateException(
                "FINORA Portable State generation is invalid."
            );
        }

        return payload;
    }

    /*
     * FINORA Windows signs P-256 canonical payloads using
     * Node dsaEncoding="ieee-p1363".
     *
     * Windows signature:
     *   64 bytes = R(32) || S(32)
     *
     * Java SHA256withECDSA verifier expects ASN.1 DER:
     *   SEQUENCE(INTEGER R, INTEGER S)
     *
     * Conversion is representation-only.
     * Signed bytes / digest / public key remain unchanged.
     */
    private static byte[] ieeeP1363SignatureToDer(
        byte[] signature
    ) {

        if (
            signature == null ||
            signature.length != 64
        ) {
            throw new IllegalStateException(
                "FINORA P-256 signature must contain exactly 64 IEEE-P1363 bytes."
            );
        }

        byte[] rRaw =
            java.util.Arrays.copyOfRange(
                signature,
                0,
                32
            );

        byte[] sRaw =
            java.util.Arrays.copyOfRange(
                signature,
                32,
                64
            );

        byte[] rDer = null;
        byte[] sDer = null;

        try {

            rDer =
                new java.math.BigInteger(
                    1,
                    rRaw
                ).toByteArray();

            sDer =
                new java.math.BigInteger(
                    1,
                    sRaw
                ).toByteArray();

            int sequenceLength =
                2 +
                rDer.length +
                2 +
                sDer.length;

            if (sequenceLength >= 128) {
                throw new IllegalStateException(
                    "FINORA P-256 DER signature length is invalid."
                );
            }

            byte[] der =
                new byte[
                    2 +
                    sequenceLength
                ];

            int offset = 0;

            der[offset++] =
                0x30;

            der[offset++] =
                (byte) sequenceLength;

            der[offset++] =
                0x02;

            der[offset++] =
                (byte) rDer.length;

            System.arraycopy(
                rDer,
                0,
                der,
                offset,
                rDer.length
            );

            offset +=
                rDer.length;

            der[offset++] =
                0x02;

            der[offset++] =
                (byte) sDer.length;

            System.arraycopy(
                sDer,
                0,
                der,
                offset,
                sDer.length
            );

            return der;

        } finally {

            java.util.Arrays.fill(
                rRaw,
                (byte) 0
            );

            java.util.Arrays.fill(
                sRaw,
                (byte) 0
            );

            if (rDer != null) {
                java.util.Arrays.fill(
                    rDer,
                    (byte) 0
                );
            }

            if (sDer != null) {
                java.util.Arrays.fill(
                    sDer,
                    (byte) 0
                );
            }
        }
    }

    private static byte[] decodeCanonicalBase64(
        String value,
        String label
    ) {

        byte[] decoded;

        try {
            decoded =
                Base64.decode(
                    value,
                    Base64.NO_WRAP
                );
        } catch (Exception error) {
            throw new IllegalStateException(
                "FINORA Portable State " +
                label +
                " base64 is invalid.",
                error
            );
        }

        String canonical =
            Base64.encodeToString(
                decoded,
                Base64.NO_WRAP
            );

        if (
            decoded.length == 0 ||
            !canonical.equals(
                value
            )
        ) {
            java.util.Arrays.fill(
                decoded,
                (byte) 0
            );

            throw new IllegalStateException(
                "FINORA Portable State " +
                label +
                " base64 is not canonical."
            );
        }

        return decoded;
    }

    private static String sha256Hex(
        String value
    ) throws Exception {

        MessageDigest digest =
            MessageDigest.getInstance(
                "SHA-256"
            );

        byte[] hash =
            digest.digest(
                value.getBytes(
                    StandardCharsets.UTF_8
                )
            );

        try {

            StringBuilder output =
                new StringBuilder(
                    hash.length * 2
                );

            for (byte current : hash) {
                output.append(
                    String.format(
                        "%02x",
                        current & 0xff
                    )
                );
            }

            return output.toString();

        } finally {

            java.util.Arrays.fill(
                hash,
                (byte) 0
            );
        }
    }

    private static String canonicalJsonStringWindowsCompatible(
        String value
    ) {

        StringBuilder output =
            new StringBuilder(
                value.length() + 2
            );

        output.append('"');

        for (
            int index = 0;
            index < value.length();
            index++
        ) {

            char current =
                value.charAt(index);

            switch (current) {

                case '"':
                    output.append("\\\"");
                    break;

                case '\\':
                    output.append("\\\\");
                    break;

                case '\b':
                    output.append("\\b");
                    break;

                case '\f':
                    output.append("\\f");
                    break;

                case '\n':
                    output.append("\\n");
                    break;

                case '\r':
                    output.append("\\r");
                    break;

                case '\t':
                    output.append("\\t");
                    break;

                default:

                    if (current < 0x20) {

                        output.append(
                            String.format(
                                "\\u%04x",
                                (int) current
                            )
                        );

                        break;
                    }

                    if (
                        Character.isHighSurrogate(current)
                    ) {

                        if (
                            index + 1 <
                                value.length() &&
                            Character.isLowSurrogate(
                                value.charAt(
                                    index + 1
                                )
                            )
                        ) {

                            output.append(
                                current
                            );

                            output.append(
                                value.charAt(
                                    ++index
                                )
                            );

                            break;
                        }

                        output.append(
                            String.format(
                                "\\u%04x",
                                (int) current
                            )
                        );

                        break;
                    }

                    if (
                        Character.isLowSurrogate(current)
                    ) {

                        output.append(
                            String.format(
                                "\\u%04x",
                                (int) current
                            )
                        );

                        break;
                    }

                    output.append(
                        current
                    );

                    break;
            }
        }

        output.append('"');

        return output.toString();
    }


    private static String canonicalJsonNumberWindowsCompatible(
        Number value
    ) {

        if (
            value instanceof Byte ||
            value instanceof Short ||
            value instanceof Integer ||
            value instanceof Long
        ) {
            return value.toString();
        }

        double numeric =
            value.doubleValue();

        if (
            Double.isNaN(
                numeric
            ) ||
            Double.isInfinite(
                numeric
            )
        ) {
            throw new IllegalStateException(
                "FINORA canonical JSON does not allow NaN or infinite numbers."
            );
        }

        if (
            Double.doubleToRawLongBits(
                numeric
            ) ==
            Double.doubleToRawLongBits(
                -0.0d
            )
        ) {
            return "0";
        }

        double absolute =
            Math.abs(
                numeric
            );

        java.math.BigDecimal decimal =
            java.math.BigDecimal
                .valueOf(
                    numeric
                )
                .stripTrailingZeros();

        /*
         * Match JSON.stringify number formatting used by
         * FINORA_CANONICAL_JSON_V1 on Windows:
         *
         * - decimal notation for [1e-6, 1e21)
         * - scientific notation outside that range
         * - lowercase "e"
         * - no redundant trailing ".0"
         */
        if (
            absolute == 0.0d ||
            (
                absolute >= 1.0e-6d &&
                absolute < 1.0e21d
            )
        ) {
            return decimal.toPlainString();
        }

        String scientific =
            decimal
                .toString()
                .replace(
                    'E',
                    'e'
                );

        int exponentIndex =
            scientific.indexOf(
                'e'
            );

        if (
            exponentIndex >= 0 &&
            exponentIndex + 1 <
                scientific.length()
        ) {

            String mantissa =
                scientific.substring(
                    0,
                    exponentIndex
                );

            String exponent =
                scientific.substring(
                    exponentIndex + 1
                );

            boolean negative =
                exponent.startsWith(
                    "-"
                );

            boolean positive =
                exponent.startsWith(
                    "+"
                );

            if (
                negative ||
                positive
            ) {
                exponent =
                    exponent.substring(
                        1
                    );
            }

            int zeroIndex = 0;

            while (
                zeroIndex <
                    exponent.length() - 1 &&
                exponent.charAt(
                    zeroIndex
                ) == '0'
            ) {
                zeroIndex++;
            }

            exponent =
                exponent.substring(
                    zeroIndex
                );

            scientific =
                mantissa +
                "e" +
                (
                    negative
                        ? "-"
                        : "+"
                ) +
                exponent;
        }

        return scientific;
    }


    public static String canonicalJson(
        Object value
    ) throws Exception {

        if (
            value == null ||
            value == JSONObject.NULL
        ) {
            return "null";
        }

        if (
            value instanceof JSONObject
        ) {

            JSONObject object =
                (JSONObject) value;

            List<String> keys =
                new ArrayList<>();

            Iterator<String> iterator =
                object.keys();

            while (
                iterator.hasNext()
            ) {
                keys.add(
                    iterator.next()
                );
            }

            Collections.sort(
                keys
            );

            StringBuilder output =
                new StringBuilder();

            output.append(
                '{'
            );

            for (
                int index = 0;
                index < keys.size();
                index++
            ) {

                if (index > 0) {
                    output.append(
                        ','
                    );
                }

                String key =
                    keys.get(
                        index
                    );

                output.append(
                    canonicalJsonStringWindowsCompatible(
                        key
                    )
                );

                output.append(
                    ':'
                );

                output.append(
                    canonicalJson(
                        object.get(
                            key
                        )
                    )
                );
            }

            output.append(
                '}'
            );

            return output.toString();
        }

        if (
            value instanceof JSONArray
        ) {

            JSONArray array =
                (JSONArray) value;

            StringBuilder output =
                new StringBuilder();

            output.append(
                '['
            );

            for (
                int index = 0;
                index < array.length();
                index++
            ) {

                if (index > 0) {
                    output.append(
                        ','
                    );
                }

                output.append(
                    canonicalJson(
                        array.get(
                            index
                        )
                    )
                );
            }

            output.append(
                ']'
            );

            return output.toString();
        }

        if (value instanceof String) {
            return canonicalJsonStringWindowsCompatible(
                (String) value
            );
        }

        if (value instanceof Boolean) {
            return (
                (Boolean) value
            )
                ? "true"
                : "false";
        }

        if (value instanceof Number) {
            return canonicalJsonNumberWindowsCompatible(
                (Number) value
            );
        }

        throw new IllegalStateException(
            "FINORA canonical JSON encountered an unsupported value."
        );
    }
}