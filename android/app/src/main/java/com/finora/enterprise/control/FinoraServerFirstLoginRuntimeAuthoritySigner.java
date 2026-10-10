package com.finora.enterprise.control;

import org.json.JSONObject;

import org.bouncycastle.asn1.ASN1Integer;
import org.bouncycastle.asn1.ASN1Primitive;
import org.bouncycastle.asn1.ASN1Sequence;

import java.math.BigInteger;
import java.nio.charset.StandardCharsets;
import java.security.KeyFactory;
import java.security.PrivateKey;
import java.security.Signature;
import java.security.spec.PKCS8EncodedKeySpec;
import java.util.Arrays;
import java.util.Base64;

/**
 * Windows-compatible FINORA Fresh Device Runtime Authority signer.
 *
 * Caller must independently prove server-first authorization,
 * matching Portable Auth V2 fingerprint, and absence of conflicts.
 *
 * No USB I/O, no hydration, no login/session authorization.
 */
public final class FinoraServerFirstLoginRuntimeAuthoritySigner {

    private FinoraServerFirstLoginRuntimeAuthoritySigner() {
    }

    public static String sign(
        JSONObject proposedPayload,
        FinoraBranchCertificationCryptoValidator.Material keyMaterial
    ) throws Exception {

        if (proposedPayload == null || keyMaterial == null) {
            throw new IllegalArgumentException(
                "Runtime Authority payload and certification are required."
            );
        }

        FinoraBranchCertificationCryptoValidator.assertValid(
            keyMaterial
        );

        // Build a parseable candidate to reuse the strict existing
        // production runtime payload contract, including field types.
        JSONObject signatureMetadata = new JSONObject();

        signatureMetadata.put(
            "algorithm",
            FinoraPortableFreshDeviceRuntimeAuthorityContract
                .SIGNATURE_ALGORITHM
        );

        signatureMetadata.put(
            "encoding",
            FinoraPortableFreshDeviceRuntimeAuthorityContract
                .SIGNATURE_ENCODING
        );

        signatureMetadata.put(
            "canonicalization",
            FinoraPortableFreshDeviceRuntimeAuthorityContract
                .SIGNATURE_CANONICALIZATION
        );

        signatureMetadata.put("keyId", keyMaterial.keyId);

        signatureMetadata.put(
            "value",
            Base64.getEncoder().encodeToString(new byte[64])
        );

        JSONObject root = new JSONObject();

        root.put(
            "format",
            FinoraPortableFreshDeviceRuntimeAuthorityContract.FORMAT
        );

        root.put(
            "schemaVersion",
            FinoraPortableFreshDeviceRuntimeAuthorityContract.SCHEMA_VERSION
        );

        root.put(
            "payload",
            new JSONObject(proposedPayload.toString())
        );

        root.put("signature", signatureMetadata);

        FinoraPortableFreshDeviceRuntimeAuthorityContract.PackageValue
            parsed =
                FinoraPortableFreshDeviceRuntimeAuthorityContract.parse(
                    root.toString()
                );

        String canonical =
            FinoraPortableFreshDeviceRuntimeAuthorityContract
                .canonicalizePayload(parsed.payload);

        byte[] privateBytes = null;

        try {
            privateBytes = Base64.getDecoder().decode(
                keyMaterial.privateKey
            );

            PrivateKey privateKey =
                KeyFactory.getInstance("EC").generatePrivate(
                    new PKCS8EncodedKeySpec(privateBytes)
                );

            Signature signer =
                Signature.getInstance("SHA256withECDSA");

            signer.initSign(privateKey);

            signer.update(
                canonical.getBytes(StandardCharsets.UTF_8)
            );

            byte[] derSignature = signer.sign();

            byte[] p1363Signature =
                derToP1363(derSignature);

            try {
                signatureMetadata.put(
                    "value",
                    Base64.getEncoder().encodeToString(
                        p1363Signature
                    )
                );

                // Validate the generated package's exact structure.
                String serialized = root.toString();

                FinoraPortableFreshDeviceRuntimeAuthorityContract
                    .parse(serialized);

                // Independent existing production signature verifier.
                FinoraPortableFreshDeviceRuntimeAuthorityVerifier.Result
                    verified =
                        FinoraPortableFreshDeviceRuntimeAuthorityVerifier
                            .verify(serialized, keyMaterial);

                if (
                    verified == null ||
                    !verified.success ||
                    verified.data == null
                ) {
                    throw new SecurityException(
                        "Generated Runtime Authority signature verification failed."
                    );
                }

                if (
                    !canonical.equals(
                        FinoraPortableFreshDeviceRuntimeAuthorityContract
                            .canonicalizePayload(verified.data)
                    )
                ) {
                    throw new SecurityException(
                        "Runtime Authority canonical payload changed."
                    );
                }

                return serialized;

            } finally {
                Arrays.fill(p1363Signature, (byte) 0);
            }

        } finally {
            if (privateBytes != null) {
                Arrays.fill(privateBytes, (byte) 0);
            }
        }
    }

    private static byte[] derToP1363(
        byte[] der
    ) throws Exception {

        ASN1Sequence sequence =
            ASN1Sequence.getInstance(
                ASN1Primitive.fromByteArray(der)
            );

        if (sequence.size() != 2) {
            throw new SecurityException(
                "Unexpected ECDSA signature structure."
            );
        }

        BigInteger r =
            ASN1Integer.getInstance(
                sequence.getObjectAt(0)
            ).getPositiveValue();

        BigInteger s =
            ASN1Integer.getInstance(
                sequence.getObjectAt(1)
            ).getPositiveValue();

        byte[] output = new byte[64];

        copyUnsigned32(r, output, 0);
        copyUnsigned32(s, output, 32);

        return output;
    }

    private static void copyUnsigned32(
        BigInteger number,
        byte[] target,
        int offset
    ) {

        if (
            number == null ||
            number.signum() <= 0 ||
            number.bitLength() > 256
        ) {
            throw new SecurityException(
                "ECDSA signature integer is invalid."
            );
        }

        byte[] source = number.toByteArray();

        try {
            int start =
                source.length == 33 &&
                source[0] == 0
                    ? 1
                    : 0;

            int length = source.length - start;

            if (length < 1 || length > 32) {
                throw new SecurityException(
                    "ECDSA signature integer exceeds P-256."
                );
            }

            System.arraycopy(
                source,
                start,
                target,
                offset + 32 - length,
                length
            );

        } finally {
            Arrays.fill(source, (byte) 0);
        }
    }
}