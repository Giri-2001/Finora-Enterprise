package com.finora.enterprise.control;

import org.json.JSONArray;
import org.json.JSONObject;

import java.math.BigInteger;
import java.nio.charset.StandardCharsets;
import java.security.AlgorithmParameters;
import java.security.KeyFactory;
import java.security.MessageDigest;
import java.security.PublicKey;
import java.security.Signature;
import java.security.interfaces.ECPublicKey;
import java.security.spec.ECGenParameterSpec;
import java.security.spec.ECParameterSpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Collections;
import java.util.Iterator;
import java.util.List;
import java.util.Locale;

/**
 * FINORA server-first signed bootstrap cryptographic verifier.
 *
 * Security boundary:
 * - Pinned production signing-key fingerprint.
 * - ECDSA P-256 SHA-256.
 * - P1363 64-byte signature converted to DER for Android JCA.
 * - Canonical JSON with recursively sorted object keys.
 * - No network access, persistence or login-session creation.
 *
 * IMPORTANT:
 * This only validates the cryptographic signature and authority.
 * Full bootstrap payload semantics and device enrollment must be
 * checked separately before authentication can succeed.
 */
public final class FinoraServerFirstLoginSignatureVerifier {

    private static final String ISSUER =
        "FINORA-SERVER-FIRST-LOGIN";

    private static final String FINGERPRINT =
        "fbd63b2cc51f75e976507921738426768ce649f1a442bf55c80ecb4815e6b207";

    private static final String SIGNING_KEY =
        "FINORA-BOOTSTRAP-FBD63B2CC51F75E97650792173842676";

    private static final String ALGORITHM =
        "ECDSA_P256_SHA256";

    private FinoraServerFirstLoginSignatureVerifier() {
    }

    public static boolean verify(
        JSONObject signed
    ) {
        if (signed == null) {
            return false;
        }

        try {
            if (signed.optInt("schemaVersion", -1) != 1) {
                return false;
            }

            JSONObject issuer = signed.optJSONObject("issuer");
            JSONObject signature = signed.optJSONObject("signature");
            JSONObject authority =
                signed.optJSONObject("publicAuthority");

            JSONObject payload = signed.optJSONObject("payload");

            if (
                issuer == null ||
                signature == null ||
                authority == null ||
                payload == null
            ) {
                return false;
            }

            if (
                !ISSUER.equals(issuer.optString("issuerId", "")) ||
                !SIGNING_KEY.equals(
                    issuer.optString("signingKeyId", "")
                ) ||
                !ISSUER.equals(
                    authority.optString("issuerId", "")
                ) ||
                !SIGNING_KEY.equals(
                    authority.optString("signingKeyId", "")
                ) ||
                !ALGORITHM.equals(
                    authority.optString("algorithm", "")
                ) ||
                !"SPKI_DER_BASE64".equals(
                    authority.optString("format", "")
                ) ||
                !FINGERPRINT.equals(
                    authority.optString("publicKeyFingerprint", "")
                ) ||
                !ALGORITHM.equals(
                    signature.optString("algorithm", "")
                ) ||
                !"BASE64".equals(
                    signature.optString("encoding", "")
                )
            ) {
                return false;
            }

            byte[] keyBytes = strictBase64(
                authority.optString("publicKey", "")
            );

            byte[] signatureBytes = strictBase64(
                signature.optString("value", "")
            );

            if (
                keyBytes == null ||
                signatureBytes == null ||
                signatureBytes.length != 64
            ) {
                return false;
            }

            byte[] digest =
                MessageDigest.getInstance("SHA-256")
                    .digest(keyBytes);

            StringBuilder fingerprint = new StringBuilder();

            for (byte b : digest) {
                fingerprint.append(
                    String.format(
                        Locale.ROOT,
                        "%02x",
                        b & 0xff
                    )
                );
            }

            if (!FINGERPRINT.equals(fingerprint.toString())) {
                return false;
            }

            String expectedKeyId =
                "FINORA-BOOTSTRAP-" +
                fingerprint.substring(0, 32)
                    .toUpperCase(Locale.ROOT);

            if (!SIGNING_KEY.equals(expectedKeyId)) {
                return false;
            }

            PublicKey publicKey =
                KeyFactory.getInstance("EC").generatePublic(
                    new X509EncodedKeySpec(keyBytes)
                );

            if (!(publicKey instanceof ECPublicKey)) {
                return false;
            }

            AlgorithmParameters parameters =
                AlgorithmParameters.getInstance("EC");

            parameters.init(
                new ECGenParameterSpec("secp256r1")
            );

            ECParameterSpec requiredCurve =
                parameters.getParameterSpec(ECParameterSpec.class);

            ECParameterSpec actualCurve =
                ((ECPublicKey) publicKey).getParams();

            if (
                actualCurve == null ||
                !actualCurve.getCurve().equals(
                    requiredCurve.getCurve()
                ) ||
                !actualCurve.getGenerator().equals(
                    requiredCurve.getGenerator()
                ) ||
                !actualCurve.getOrder().equals(
                    requiredCurve.getOrder()
                ) ||
                actualCurve.getCofactor() !=
                    requiredCurve.getCofactor()
            ) {
                return false;
            }

            String canonical = canonicalJson(payload);

            Signature verifier =
                Signature.getInstance("SHA256withECDSA");

            verifier.initVerify(publicKey);

            verifier.update(
                canonical.getBytes(StandardCharsets.UTF_8)
            );

            return verifier.verify(
                p1363ToDer(signatureBytes)
            );

        } catch (Exception error) {
            return false;
        }
    }

    private static byte[] strictBase64(
        String value
    ) {
        if (
            value == null ||
            value.isEmpty() ||
            value.length() % 4 != 0 ||
            !value.matches(
                "[A-Za-z0-9+/]+={0,2}"
            )
        ) {
            return null;
        }

        try {
            byte[] decoded =
                Base64.getDecoder().decode(value);

            if (!Base64.getEncoder()
                .encodeToString(decoded).equals(value)) {
                return null;
            }

            return decoded;
        } catch (IllegalArgumentException error) {
            return null;
        }
    }

    private static String canonicalJson(
        Object value
    ) {
        if (
            value == null ||
            value == JSONObject.NULL
        ) {
            return "null";
        }

        if (value instanceof String) {
            return JSONObject.quote((String) value);
        }

        if (value instanceof Boolean) {
            return value.toString();
        }

        if (value instanceof Number) {
            double number = ((Number) value).doubleValue();

            if (!Double.isFinite(number)) {
                throw new IllegalArgumentException(
                    "Non-finite JSON number."
                );
            }

            // Fail closed for unsafe numeric representations.
            if (
                value instanceof Double ||
                value instanceof Float
            ) {
                throw new IllegalArgumentException(
                    "Floating point canonicalization requires parity validation."
                );
            }

            return value.toString();
        }

        if (value instanceof JSONArray) {
            JSONArray array = (JSONArray) value;
            StringBuilder result = new StringBuilder("[");

            for (int i = 0; i < array.length(); i++) {
                if (i > 0) {
                    result.append(",");
                }

                result.append(
                    canonicalJson(array.opt(i))
                );
            }

            return result.append("]").toString();
        }

        if (value instanceof JSONObject) {
            JSONObject object = (JSONObject) value;

            List<String> keys = new ArrayList<>();
            Iterator<String> iterator = object.keys();

            while (iterator.hasNext()) {
                keys.add(iterator.next());
            }

            Collections.sort(keys);

            StringBuilder result = new StringBuilder("{");

            for (int i = 0; i < keys.size(); i++) {
                if (i > 0) {
                    result.append(",");
                }

                String key = keys.get(i);

                result.append(JSONObject.quote(key))
                    .append(":")
                    .append(canonicalJson(object.opt(key)));
            }

            return result.append("}").toString();
        }

        throw new IllegalArgumentException(
            "Unsupported canonical JSON value."
        );
    }

    private static byte[] p1363ToDer(
        byte[] signature
    ) {
        if (signature.length != 64) {
            throw new IllegalArgumentException(
                "Invalid P1363 signature size."
            );
        }

        byte[] r = new byte[32];
        byte[] s = new byte[32];

        System.arraycopy(signature, 0, r, 0, 32);
        System.arraycopy(signature, 32, s, 0, 32);

        byte[] rDer = new BigInteger(1, r).toByteArray();
        byte[] sDer = new BigInteger(1, s).toByteArray();

        int length = 2 + rDer.length + 2 + sDer.length;

        if (length > 127) {
            throw new IllegalArgumentException(
                "Unexpected DER signature size."
            );
        }

        byte[] der = new byte[length + 2];

        int offset = 0;

        der[offset++] = 0x30;
        der[offset++] = (byte) length;
        der[offset++] = 0x02;
        der[offset++] = (byte) rDer.length;

        System.arraycopy(rDer, 0, der, offset, rDer.length);
        offset += rDer.length;

        der[offset++] = 0x02;
        der[offset++] = (byte) sDer.length;

        System.arraycopy(sDer, 0, der, offset, sDer.length);

        return der;
    }
}