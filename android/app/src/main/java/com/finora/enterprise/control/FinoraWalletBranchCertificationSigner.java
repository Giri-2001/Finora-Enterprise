package com.finora.enterprise.control;

import java.math.BigInteger;
import java.nio.charset.StandardCharsets;
import java.security.KeyFactory;
import java.security.PrivateKey;
import java.security.Signature;
import java.security.spec.PKCS8EncodedKeySpec;
import java.util.Arrays;
import java.util.Base64;

import org.bouncycastle.asn1.ASN1Integer;
import org.bouncycastle.asn1.ASN1Primitive;
import org.bouncycastle.asn1.ASN1Sequence;

/**
 * Canonical Android FINORA Branch Certification signer.
 *
 * Mirrors the Windows Branch Certification signature contract:
 * - ECDSA P-256 / SHA-256;
 * - PKCS8 DER private key;
 * - IEEE-P1363 64-byte signature;
 * - canonical Base64 output.
 *
 * No persistence is performed here.
 */
final class FinoraWalletBranchCertificationSigner {

    static final String ALGORITHM =
        "ECDSA_P256_SHA256";

    static final String ENCODING =
        "BASE64";

    static final String CANONICALIZATION =
        "FINORA_CANONICAL_JSON_V1";

    private FinoraWalletBranchCertificationSigner() {
    }

    static SignedValue sign(
        String canonicalValue,
        FinoraBranchCertificationCryptoValidator.Material material
    ) throws Exception {

        if (
            canonicalValue == null ||
            canonicalValue.isEmpty()
        ) {
            throw new IllegalArgumentException(
                "FINORA Wallet canonical value is required for Branch Certification signing."
            );
        }

        if (material == null) {
            throw new IllegalArgumentException(
                "FINORA Wallet Branch Certification material is required."
            );
        }

        FinoraBranchCertificationCryptoValidator.assertValid(
            material
        );

        byte[] privateKeyDer =
            Base64
                .getDecoder()
                .decode(
                    material.privateKey
                );

        try {

            PrivateKey privateKey =
                KeyFactory
                    .getInstance(
                        "EC"
                    )
                    .generatePrivate(
                        new PKCS8EncodedKeySpec(
                            privateKeyDer
                        )
                    );

            Signature signer =
                Signature.getInstance(
                    "SHA256withECDSA"
                );

            signer.initSign(
                privateKey
            );

            signer.update(
                canonicalValue.getBytes(
                    StandardCharsets.UTF_8
                )
            );

            byte[] derSignature =
                signer.sign();

            byte[] p1363 =
                derToP1363(
                    derSignature
                );

            if (p1363.length != 64) {
                throw new IllegalStateException(
                    "FINORA Branch Certification signature is not canonical IEEE-P1363."
                );
            }

            String value =
                Base64
                    .getEncoder()
                    .encodeToString(
                        p1363
                    );

            return new SignedValue(
                material.keyId,
                value
            );
        }
        finally {

            Arrays.fill(
                privateKeyDer,
                (byte) 0
            );
        }
    }

    static final class SignedValue {

        final String algorithm;
        final String encoding;
        final String canonicalization;
        final String keyId;
        final String value;

        SignedValue(
            String keyId,
            String value
        ) {

            this.algorithm =
                ALGORITHM;

            this.encoding =
                ENCODING;

            this.canonicalization =
                CANONICALIZATION;

            this.keyId =
                keyId;

            this.value =
                value;
        }
    }

    private static byte[] derToP1363(
        byte[] derSignature
    ) throws Exception {

        ASN1Sequence sequence =
            ASN1Sequence.getInstance(
                ASN1Primitive.fromByteArray(
                    derSignature
                )
            );

        if (sequence.size() != 2) {
            throw new IllegalArgumentException(
                "FINORA ECDSA DER signature shape is invalid."
            );
        }

        BigInteger r =
            ASN1Integer
                .getInstance(
                    sequence.getObjectAt(
                        0
                    )
                )
                .getPositiveValue();

        BigInteger s =
            ASN1Integer
                .getInstance(
                    sequence.getObjectAt(
                        1
                    )
                )
                .getPositiveValue();

        byte[] result =
            new byte[64];

        writeUnsigned32(
            r,
            result,
            0
        );

        writeUnsigned32(
            s,
            result,
            32
        );

        return result;
    }

    private static void writeUnsigned32(
        BigInteger value,
        byte[] output,
        int offset
    ) {

        byte[] raw =
            value.toByteArray();

        int sourceOffset =
            (
                raw.length > 32 &&
                raw[0] == 0
            )
                ? 1
                : 0;

        int length =
            raw.length -
            sourceOffset;

        if (length > 32) {
            throw new IllegalArgumentException(
                "FINORA ECDSA signature component exceeds P-256 width."
            );
        }

        Arrays.fill(
            output,
            offset,
            offset + 32,
            (byte) 0
        );

        System.arraycopy(
            raw,
            sourceOffset,
            output,
            offset + 32 - length,
            length
        );
    }
}
