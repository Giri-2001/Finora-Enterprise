package com.finora.enterprise.control;

import org.json.JSONArray;
import org.json.JSONObject;

import java.nio.charset.StandardCharsets;
import java.security.KeyFactory;
import java.security.MessageDigest;
import java.security.PublicKey;
import java.security.Signature;
import java.security.interfaces.ECPublicKey;
import java.security.spec.X509EncodedKeySpec;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;


/*
 * FINORA Portable State V1 signed-envelope verifier.
 *
 * Verification only.
 * No persistence.
 * No operational mutation.
 */
final class FinoraPortableStateEnvelopeVerifier {

    static final String FORMAT =
        "FINORA_CONTROL_CENTER_PORTABLE_STATE_V1";

    static final int SCHEMA_VERSION =
        1;

    private static final long MAX_SAFE_INTEGER =
        9007199254740991L;


    static final class VerifiedEnvelope {

        final JSONObject payload;
        final String payloadSha256;
        final long stateGeneration;
        final String parentPayloadSha256;
        final String issuerId;
        final String signingKeyId;


        VerifiedEnvelope(
            JSONObject payload,
            String payloadSha256,
            long stateGeneration,
            String parentPayloadSha256,
            String issuerId,
            String signingKeyId
        ) {

            this.payload =
                deepCloneObject(
                    payload
                );

            this.payloadSha256 =
                payloadSha256;

            this.stateGeneration =
                stateGeneration;

            this.parentPayloadSha256 =
                parentPayloadSha256;

            this.issuerId =
                issuerId;

            this.signingKeyId =
                signingKeyId;
        }
    }


    private FinoraPortableStateEnvelopeVerifier() {
    }


    static VerifiedEnvelope verify(
        String serializedEnvelope,
        String expectedIssuerId,
        String expectedSigningKeyId,
        String publicKeySpkiDerBase64
    ) throws Exception {

        requireCanonicalIdentity(
            expectedIssuerId,
            "expected issuerId"
        );

        requireCanonicalIdentity(
            expectedSigningKeyId,
            "expected signingKeyId"
        );


        if (
            serializedEnvelope == null ||
            serializedEnvelope.length() == 0
        ) {

            throw invalid(
                "serialized signed envelope is required"
            );
        }


        JSONObject envelope;

        try {

            envelope =
                new JSONObject(
                    serializedEnvelope
                );
        }
        catch (Exception error) {

            throw invalid(
                "signed envelope JSON is malformed",
                error
            );
        }


        requireExactKeys(
            envelope,
            "format",
            "schemaVersion",
            "payload",
            "payloadSha256",
            "signatureBase64"
        );


        if (
            !FORMAT.equals(
                requireString(
                    envelope,
                    "format"
                )
            ) ||
            requirePositiveSafeInteger(
                envelope,
                "schemaVersion"
            ) !=
                SCHEMA_VERSION
        ) {

            throw invalid(
                "envelope format or schemaVersion is unsupported"
            );
        }


        JSONObject payload =
            envelope.optJSONObject(
                "payload"
            );

        if (payload == null) {

            throw invalid(
                "payload is missing"
            );
        }


        if (
            !FORMAT.equals(
                requireString(
                    payload,
                    "format"
                )
            ) ||
            requirePositiveSafeInteger(
                payload,
                "schemaVersion"
            ) !=
                SCHEMA_VERSION
        ) {

            throw invalid(
                "payload format or schemaVersion is unsupported"
            );
        }


        String issuerId =
            requireCanonicalIdentity(
                requireString(
                    payload,
                    "issuerId"
                ),
                "payload issuerId"
            );


        String signingKeyId =
            requireCanonicalIdentity(
                requireString(
                    payload,
                    "signingKeyId"
                ),
                "payload signingKeyId"
            );


        if (
            !expectedIssuerId.equals(
                issuerId
            ) ||
            !expectedSigningKeyId.equals(
                signingKeyId
            )
        ) {

            throw invalid(
                "signed envelope does not match recovered Control Center authority"
            );
        }


        long stateGeneration =
            requirePositiveSafeInteger(
                payload,
                "stateGeneration"
            );


        if (
            !payload.has(
                "parentPayloadSha256"
            )
        ) {

            throw invalid(
                "parentPayloadSha256 field is required"
            );
        }


        String parentPayloadSha256 =
            null;


        if (
            !payload.isNull(
                "parentPayloadSha256"
            )
        ) {

            parentPayloadSha256 =
                requireCanonicalSha256(
                    requireString(
                        payload,
                        "parentPayloadSha256"
                    ),
                    "parentPayloadSha256"
                );
        }


        Object branchRegistryDomain =
            payload.opt(
                "branchRegistry"
            );


        if (
            branchRegistryDomain == null ||
            (
                branchRegistryDomain != JSONObject.NULL &&
                !(branchRegistryDomain instanceof JSONObject)
            ) ||
            !(payload.opt(
                "branchDirectoryMetadata"
            ) instanceof JSONObject) ||
            !(payload.opt(
                "walletHistory"
            ) instanceof JSONObject) ||
            !(payload.opt(
                "incomePricing"
            ) instanceof JSONObject) ||
            !(payload.opt(
                "branchPricing"
            ) instanceof JSONObject) ||
            !(payload.opt(
                "issuanceAuthority"
            ) instanceof JSONObject) ||
            !(payload.opt(
                "clockAuthority"
            ) instanceof JSONObject)
        ) {

            throw invalid(
                "payload root domains are missing or invalid"
            );
        }


        String claimedPayloadSha256 =
            requireCanonicalSha256(
                requireString(
                    envelope,
                    "payloadSha256"
                ),
                "payloadSha256"
            );


        Object canonicalPayloadValue =
            toCanonicalJavaValue(
                payload
            );


        String canonicalPayload =
            FinoraCanonicalJson
                .canonicalize(
                    canonicalPayloadValue
                );


        String actualPayloadSha256 =
            sha256Hex(
                canonicalPayload
            );


        if (
            !MessageDigest.isEqual(
                claimedPayloadSha256.getBytes(
                    StandardCharsets.US_ASCII
                ),
                actualPayloadSha256.getBytes(
                    StandardCharsets.US_ASCII
                )
            )
        ) {

            throw invalid(
                "payload SHA-256 digest is invalid"
            );
        }


        String signatureBase64 =
            requireString(
                envelope,
                "signatureBase64"
            );


        byte[] p1363 =
            decodeCanonicalBase64(
                signatureBase64,
                64,
                "signatureBase64"
            );


        byte[] publicKeyBytes =
            decodeCanonicalBase64(
                publicKeySpkiDerBase64,
                -1,
                "Control Center public key"
            );


        try {

            PublicKey publicKey =
                KeyFactory
                    .getInstance(
                        "EC"
                    )
                    .generatePublic(
                        new X509EncodedKeySpec(
                            publicKeyBytes
                        )
                    );


            if (
                !(publicKey instanceof ECPublicKey)
            ) {

                throw invalid(
                    "Control Center signing key is not EC"
                );
            }


            ECPublicKey ecPublicKey =
                (ECPublicKey) publicKey;


            if (
                ecPublicKey
                    .getParams()
                    .getCurve()
                    .getField()
                    .getFieldSize() !=
                        256
            ) {

                throw invalid(
                    "Control Center signing key is not P-256"
                );
            }


            Signature verifier =
                Signature
                    .getInstance(
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


            if (
                !verifier.verify(
                    ieeeP1363ToDer(
                        p1363
                    )
                )
            ) {

                throw invalid(
                    "Portable State envelope signature is invalid"
                );
            }
        }
        finally {

            java.util.Arrays.fill(
                p1363,
                (byte) 0
            );

            java.util.Arrays.fill(
                publicKeyBytes,
                (byte) 0
            );
        }


        return new VerifiedEnvelope(
            payload,
            claimedPayloadSha256,
            stateGeneration,
            parentPayloadSha256,
            issuerId,
            signingKeyId
        );
    }


    private static Object toCanonicalJavaValue(
        Object value
    ) throws Exception {

        if (
            value == null ||
            value == JSONObject.NULL
        ) {

            return null;
        }


        if (
            value instanceof JSONObject
        ) {

            JSONObject object =
                (JSONObject) value;

            Map<String, Object> map =
                new LinkedHashMap<>();

            Iterator<String> keys =
                object.keys();


            while (keys.hasNext()) {

                String key =
                    keys.next();

                map.put(
                    key,
                    toCanonicalJavaValue(
                        object.get(
                            key
                        )
                    )
                );
            }


            return map;
        }


        if (
            value instanceof JSONArray
        ) {

            JSONArray array =
                (JSONArray) value;

            List<Object> list =
                new ArrayList<>();


            for (
                int index = 0;
                index < array.length();
                index++
            ) {

                list.add(
                    toCanonicalJavaValue(
                        array.get(
                            index
                        )
                    )
                );
            }


            return list;
        }


        if (
            value instanceof String ||
            value instanceof Boolean
        ) {

            return value;
        }


        if (
            value instanceof Number
        ) {

            Number number =
                (Number) value;

            double doubleValue =
                number.doubleValue();

            long longValue =
                number.longValue();


            if (
                !Double.isFinite(
                    doubleValue
                ) ||
                doubleValue !=
                    (double) longValue ||
                Math.abs(
                    doubleValue
                ) >
                    (double) MAX_SAFE_INTEGER
            ) {

                throw invalid(
                    "payload contains a non-canonical numeric value"
                );
            }


            return Long.valueOf(
                longValue
            );
        }


        throw invalid(
            "payload contains unsupported JSON value"
        );
    }


    private static String sha256Hex(
        String value
    ) throws Exception {

        byte[] digest =
            MessageDigest
                .getInstance(
                    "SHA-256"
                )
                .digest(
                    value.getBytes(
                        StandardCharsets.UTF_8
                    )
                );


        StringBuilder output =
            new StringBuilder(
                digest.length * 2
            );


        for (byte item : digest) {

            output.append(
                String.format(
                    java.util.Locale.ROOT,
                    "%02x",
                    item & 0xff
                )
            );
        }


        return output.toString();
    }


    private static byte[] decodeCanonicalBase64(
        String value,
        int expectedBytes,
        String label
    ) {

        if (
            value == null ||
            value.length() == 0
        ) {

            throw invalid(
                label +
                " is required"
            );
        }


        final byte[] decoded;


        try {

            decoded =
                Base64
                    .getDecoder()
                    .decode(
                        value
                    );
        }
        catch (Exception error) {

            throw invalid(
                label +
                " is not valid Base64",
                error
            );
        }


        String canonical =
            Base64
                .getEncoder()
                .encodeToString(
                    decoded
                );


        if (
            decoded.length == 0 ||
            !canonical.equals(
                value
            ) ||
            (
                expectedBytes >= 0 &&
                decoded.length !=
                    expectedBytes
            )
        ) {

            java.util.Arrays.fill(
                decoded,
                (byte) 0
            );

            throw invalid(
                label +
                " is not canonical Base64"
            );
        }


        return decoded;
    }


    private static byte[] ieeeP1363ToDer(
        byte[] signature
    ) {

        if (
            signature == null ||
            signature.length !=
                64
        ) {

            throw invalid(
                "IEEE-P1363 signature must contain exactly 64 bytes"
            );
        }


        byte[] r =
            encodeDerInteger(
                signature,
                0,
                32
            );

        byte[] s =
            encodeDerInteger(
                signature,
                32,
                32
            );


        int sequenceLength =
            2 +
            r.length +
            2 +
            s.length;


        byte[] der =
            new byte[
                2 +
                sequenceLength
            ];


        int offset =
            0;

        der[offset++] =
            0x30;

        der[offset++] =
            (byte) sequenceLength;

        der[offset++] =
            0x02;

        der[offset++] =
            (byte) r.length;


        System.arraycopy(
            r,
            0,
            der,
            offset,
            r.length
        );


        offset +=
            r.length;

        der[offset++] =
            0x02;

        der[offset++] =
            (byte) s.length;


        System.arraycopy(
            s,
            0,
            der,
            offset,
            s.length
        );


        return der;
    }


    private static byte[] encodeDerInteger(
        byte[] source,
        int offset,
        int length
    ) {

        int first =
            offset;

        int end =
            offset +
            length;


        while (
            first <
                end - 1 &&
            source[first] ==
                0
        ) {

            first++;
        }


        boolean needsLeadingZero =
            (
                source[first] &
                0x80
            ) !=
                0;


        int resultLength =
            end -
            first +
            (
                needsLeadingZero
                    ? 1
                    : 0
            );


        byte[] result =
            new byte[
                resultLength
            ];


        int destination =
            0;


        if (needsLeadingZero) {

            result[destination++] =
                0;
        }


        System.arraycopy(
            source,
            first,
            result,
            destination,
            end - first
        );


        return result;
    }


    private static long requirePositiveSafeInteger(
        JSONObject object,
        String key
    ) {

        Object raw =
            object.opt(
                key
            );


        if (
            !(raw instanceof Number)
        ) {

            throw invalid(
                key +
                " must be numeric"
            );
        }


        Number number =
            (Number) raw;

        double doubleValue =
            number.doubleValue();

        long longValue =
            number.longValue();


        if (
            !Double.isFinite(
                doubleValue
            ) ||
            doubleValue !=
                (double) longValue ||
            longValue <=
                0 ||
            longValue >
                MAX_SAFE_INTEGER
        ) {

            throw invalid(
                key +
                " must be a positive safe integer"
            );
        }


        return longValue;
    }


    private static String requireCanonicalIdentity(
        String value,
        String label
    ) {

        if (
            value == null ||
            value.length() == 0 ||
            !value.equals(
                value.trim()
            )
        ) {

            throw invalid(
                label +
                " is invalid"
            );
        }


        return value;
    }


    private static String requireCanonicalSha256(
        String value,
        String label
    ) {

        if (
            value == null ||
            !value.matches(
                "^[0-9a-f]{64}$"
            )
        ) {

            throw invalid(
                label +
                " must be canonical lowercase SHA-256"
            );
        }


        return value;
    }


    private static String requireString(
        JSONObject object,
        String key
    ) {

        Object raw =
            object.opt(
                key
            );


        if (
            !(raw instanceof String) ||
            ((String) raw).length() == 0
        ) {

            throw invalid(
                key +
                " is missing or invalid"
            );
        }


        return (String) raw;
    }


    private static void requireExactKeys(
        JSONObject object,
        String... expectedKeys
    ) {

        java.util.Set<String> expected =
            new java.util.HashSet<>(
                java.util.Arrays.asList(
                    expectedKeys
                )
            );

        java.util.Set<String> actual =
            new java.util.HashSet<>();

        Iterator<String> keys =
            object.keys();


        while (keys.hasNext()) {

            actual.add(
                keys.next()
            );
        }


        if (
            !expected.equals(
                actual
            )
        ) {

            throw invalid(
                "signed envelope contains unsupported fields"
            );
        }
    }


    private static JSONObject deepCloneObject(
        JSONObject value
    ) {

        try {

            return new JSONObject(
                value.toString()
            );
        }
        catch (Exception error) {

            throw invalid(
                "verified payload clone failed",
                error
            );
        }
    }


    private static IllegalArgumentException invalid(
        String reason
    ) {

        return new IllegalArgumentException(
            "FINORA Portable State: " +
            reason +
            "."
        );
    }


    private static IllegalArgumentException invalid(
        String reason,
        Throwable cause
    ) {

        return new IllegalArgumentException(
            "FINORA Portable State: " +
            reason +
            ".",
            cause
        );
    }
}