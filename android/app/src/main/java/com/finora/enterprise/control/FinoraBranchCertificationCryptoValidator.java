package com.finora.enterprise.control;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeFormatterBuilder;
import java.util.Arrays;
import java.util.Base64;
import java.util.Locale;

import org.bouncycastle.asn1.ASN1ObjectIdentifier;
import org.bouncycastle.asn1.ASN1Primitive;
import org.bouncycastle.asn1.pkcs.PrivateKeyInfo;
import org.bouncycastle.asn1.x509.SubjectPublicKeyInfo;
import org.bouncycastle.asn1.x9.X9ObjectIdentifiers;
import org.bouncycastle.crypto.params.AsymmetricKeyParameter;
import org.bouncycastle.crypto.params.ECDomainParameters;
import org.bouncycastle.crypto.params.ECPrivateKeyParameters;
import org.bouncycastle.crypto.params.ECPublicKeyParameters;
import org.bouncycastle.crypto.util.PrivateKeyFactory;
import org.bouncycastle.crypto.util.PublicKeyFactory;
import org.bouncycastle.math.ec.ECPoint;

/**
 * FINORA Branch Certification cryptographic validator.
 *
 * Mirrors the Windows Branch Certification authority contract:
 * - ECDSA P-256 / SHA-256;
 * - SPKI DER canonical Base64 public key;
 * - PKCS8 DER canonical Base64 private key;
 * - SHA-256 public-key fingerprint;
 * - canonical FINORA Branch Certification key id;
 * - canonical ISO timestamp;
 * - exact public/private P-256 keypair relationship.
 *
 * This class performs no persistence, IPC, session, renderer,
 * Android Keystore, or signing operation.
 */
public final class FinoraBranchCertificationCryptoValidator {

    public static final String ALGORITHM =
        "ECDSA_P256_SHA256";

    public static final String PUBLIC_KEY_FORMAT =
        "SPKI_DER_BASE64";

    public static final String PRIVATE_KEY_FORMAT =
        "PKCS8_DER_BASE64";

    public static final String FINGERPRINT_ALGORITHM =
        "SHA-256";

    public static final String KEY_ID_PREFIX =
        "FINORA-BRANCH-CERT-";

    public static final int SCHEMA_VERSION =
        1;

    public static final int VAULT_SCHEMA_VERSION =
        1;

    private static final DateTimeFormatter CANONICAL_TIMESTAMP_FORMATTER =
        new DateTimeFormatterBuilder()
            .appendInstant(3)
            .toFormatter(
                Locale.ROOT
            );

    private FinoraBranchCertificationCryptoValidator() {
    }

    public static final class Material {

        public final String keyId;
        public final String algorithm;
        public final String publicKeyFormat;
        public final String publicKey;
        public final String fingerprintAlgorithm;
        public final String publicKeyFingerprint;
        public final String createdAt;
        public final int schemaVersion;
        public final String privateKeyFormat;
        public final String privateKey;
        public final int vaultSchemaVersion;

        public Material(
            String keyId,
            String algorithm,
            String publicKeyFormat,
            String publicKey,
            String fingerprintAlgorithm,
            String publicKeyFingerprint,
            String createdAt,
            int schemaVersion,
            String privateKeyFormat,
            String privateKey,
            int vaultSchemaVersion
        ) {
            this.keyId =
                keyId;

            this.algorithm =
                algorithm;

            this.publicKeyFormat =
                publicKeyFormat;

            this.publicKey =
                publicKey;

            this.fingerprintAlgorithm =
                fingerprintAlgorithm;

            this.publicKeyFingerprint =
                publicKeyFingerprint;

            this.createdAt =
                createdAt;

            this.schemaVersion =
                schemaVersion;

            this.privateKeyFormat =
                privateKeyFormat;

            this.privateKey =
                privateKey;

            this.vaultSchemaVersion =
                vaultSchemaVersion;
        }
    }

    public static void assertValid(
        Material value
    ) {

        if (value == null) {
            throw invalid(
                "key material is required"
            );
        }

        if (
            !ALGORITHM.equals(
                value.algorithm
            ) ||
            !PUBLIC_KEY_FORMAT.equals(
                value.publicKeyFormat
            ) ||
            !FINGERPRINT_ALGORITHM.equals(
                value.fingerprintAlgorithm
            ) ||
            value.schemaVersion !=
                SCHEMA_VERSION
        ) {
            throw invalid(
                "public-key metadata is invalid"
            );
        }

        assertCanonicalTimestamp(
            value.createdAt
        );

        byte[] publicKeyDer =
            decodeStrictBase64(
                value.publicKey,
                "public key"
            );

        ECPublicKeyParameters publicKey =
            parseP256PublicKey(
                publicKeyDer
            );

        String expectedFingerprint =
            sha256Hex(
                publicKeyDer
            );

        if (
            !expectedFingerprint.equals(
                value.publicKeyFingerprint
            )
        ) {
            throw invalid(
                "fingerprint does not match public key"
            );
        }

        String expectedKeyId =
            createKeyId(
                expectedFingerprint
            );

        if (
            !expectedKeyId.equals(
                value.keyId
            )
        ) {
            throw invalid(
                "keyId is not canonical"
            );
        }

        if (
            !PRIVATE_KEY_FORMAT.equals(
                value.privateKeyFormat
            ) ||
            value.vaultSchemaVersion !=
                VAULT_SCHEMA_VERSION
        ) {
            throw invalid(
                "private-key metadata is invalid"
            );
        }

        byte[] privateKeyDer =
            decodeStrictBase64(
                value.privateKey,
                "private key"
            );

        try {

            ECPrivateKeyParameters privateKey =
                parseP256PrivateKey(
                    privateKeyDer
                );

            assertKeyPairMatches(
                publicKey,
                privateKey
            );
        }
        finally {

            Arrays.fill(
                privateKeyDer,
                (byte) 0
            );
        }
    }

    public static String createFingerprint(
        String publicKeySpkiDerBase64
    ) {

        byte[] publicKeyDer =
            decodeStrictBase64(
                publicKeySpkiDerBase64,
                "public key"
            );

        parseP256PublicKey(
            publicKeyDer
        );

        return sha256Hex(
            publicKeyDer
        );
    }

    public static String createKeyId(
        String publicKeyFingerprint
    ) {

        if (
            publicKeyFingerprint == null ||
            !publicKeyFingerprint.matches(
                "^[0-9a-f]{64}$"
            )
        ) {
            throw invalid(
                "public-key fingerprint is invalid"
            );
        }

        return (
            KEY_ID_PREFIX +
            publicKeyFingerprint
                .substring(
                    0,
                    32
                )
                .toUpperCase(
                    Locale.ROOT
                )
        );
    }

    private static byte[] decodeStrictBase64(
        String value,
        String field
    ) {

        if (
            value == null ||
            value.length() == 0 ||
            !value.trim().equals(
                value
            )
        ) {
            throw invalid(
                field +
                " Base64 data is invalid"
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
        catch (
            IllegalArgumentException error
        ) {
            throw invalid(
                field +
                " Base64 data is invalid"
            );
        }

        if (
            decoded.length == 0 ||
            !Base64
                .getEncoder()
                .encodeToString(
                    decoded
                )
                .equals(
                    value
                )
        ) {
            throw invalid(
                field +
                " Base64 data is not canonical"
            );
        }

        return decoded;
    }

    private static void assertCanonicalTimestamp(
        String value
    ) {

        if (
            value == null ||
            value.length() == 0
        ) {
            throw invalid(
                "createdAt is invalid"
            );
        }

        final Instant instant;

        try {

            instant =
                Instant.parse(
                    value
                );
        }
        catch (
            RuntimeException error
        ) {
            throw invalid(
                "createdAt is not canonical"
            );
        }

        String canonical =
            CANONICAL_TIMESTAMP_FORMATTER.format(
                instant
            );

        if (
            !canonical.equals(
                value
            )
        ) {
            throw invalid(
                "createdAt is not canonical"
            );
        }
    }

    private static ECPublicKeyParameters parseP256PublicKey(
        byte[] publicKeyDer
    ) {

        final SubjectPublicKeyInfo subjectPublicKeyInfo;

        try {

            subjectPublicKeyInfo =
                SubjectPublicKeyInfo.getInstance(
                    ASN1Primitive.fromByteArray(
                        publicKeyDer
                    )
                );
        }
        catch (
            Exception error
        ) {
            throw invalid(
                "public key is invalid SPKI DER"
            );
        }

        assertP256AlgorithmIdentifier(
            subjectPublicKeyInfo
                .getAlgorithm()
                .getAlgorithm(),
            subjectPublicKeyInfo
                .getAlgorithm()
                .getParameters(),
            "public key"
        );

        final AsymmetricKeyParameter parsed;

        try {

            parsed =
                PublicKeyFactory.createKey(
                    subjectPublicKeyInfo
                );
        }
        catch (
            Exception error
        ) {
            throw invalid(
                "public key is invalid SPKI DER"
            );
        }

        if (
            !(parsed instanceof ECPublicKeyParameters)
        ) {
            throw invalid(
                "public key must be EC"
            );
        }

        ECPublicKeyParameters publicKey =
            (ECPublicKeyParameters) parsed;

        try {

            publicKey
                .getQ()
                .normalize()
                .getEncoded(
                    false
                );
        }
        catch (
            RuntimeException error
        ) {
            throw invalid(
                "public key EC point is invalid"
            );
        }

        return publicKey;
    }

    private static ECPrivateKeyParameters parseP256PrivateKey(
        byte[] privateKeyDer
    ) {

        final PrivateKeyInfo privateKeyInfo;

        try {

            privateKeyInfo =
                PrivateKeyInfo.getInstance(
                    ASN1Primitive.fromByteArray(
                        privateKeyDer
                    )
                );
        }
        catch (
            Exception error
        ) {
            throw invalid(
                "private key is invalid PKCS8 DER"
            );
        }

        assertP256AlgorithmIdentifier(
            privateKeyInfo
                .getPrivateKeyAlgorithm()
                .getAlgorithm(),
            privateKeyInfo
                .getPrivateKeyAlgorithm()
                .getParameters(),
            "private key"
        );

        final AsymmetricKeyParameter parsed;

        try {

            parsed =
                PrivateKeyFactory.createKey(
                    privateKeyInfo
                );
        }
        catch (
            Exception error
        ) {
            throw invalid(
                "private key is invalid PKCS8 DER"
            );
        }

        if (
            !(parsed instanceof ECPrivateKeyParameters)
        ) {
            throw invalid(
                "private key is not EC"
            );
        }

        ECPrivateKeyParameters privateKey =
            (ECPrivateKeyParameters) parsed;

        if (
            privateKey.getD() == null ||
            privateKey.getD().signum() <= 0
        ) {
            throw invalid(
                "private key scalar is invalid"
            );
        }

        return privateKey;
    }

    private static void assertP256AlgorithmIdentifier(
        ASN1ObjectIdentifier algorithm,
        org.bouncycastle.asn1.ASN1Encodable parameters,
        String field
    ) {

        if (
            !X9ObjectIdentifiers
                .id_ecPublicKey
                .equals(
                    algorithm
                )
        ) {
            throw invalid(
                field +
                " is not EC"
            );
        }

        final ASN1ObjectIdentifier curve;

        try {

            curve =
                ASN1ObjectIdentifier.getInstance(
                    parameters
                );
        }
        catch (
            RuntimeException error
        ) {
            throw invalid(
                field +
                " must use named P-256"
            );
        }

        if (
            !X9ObjectIdentifiers
                .prime256v1
                .equals(
                    curve
                )
        ) {
            throw invalid(
                field +
                " must use P-256"
            );
        }
    }

    private static void assertKeyPairMatches(
        ECPublicKeyParameters publicKey,
        ECPrivateKeyParameters privateKey
    ) {

        ECDomainParameters domain =
            privateKey.getParameters();

        if (domain == null) {
            throw invalid(
                "private key P-256 domain is missing"
            );
        }

        ECPoint derivedPublicPoint =
            domain
                .getG()
                .multiply(
                    privateKey.getD()
                )
                .normalize();

        byte[] expectedPoint =
            publicKey
                .getQ()
                .normalize()
                .getEncoded(
                    false
                );

        byte[] derivedPoint =
            derivedPublicPoint
                .getEncoded(
                    false
                );

        if (
            !MessageDigest.isEqual(
                expectedPoint,
                derivedPoint
            )
        ) {
            throw invalid(
                "public/private keypair does not match"
            );
        }
    }

    private static String sha256Hex(
        byte[] value
    ) {

        final byte[] digest;

        try {

            digest =
                MessageDigest
                    .getInstance(
                        "SHA-256"
                    )
                    .digest(
                        value
                    );
        }
        catch (
            Exception error
        ) {
            throw new IllegalStateException(
                "SHA-256 is unavailable.",
                error
            );
        }

        StringBuilder hex =
            new StringBuilder(
                digest.length * 2
            );

        for (
            byte item :
            digest
        ) {

            hex.append(
                String.format(
                    Locale.ROOT,
                    "%02x",
                    item & 0xff
                )
            );
        }

        return hex.toString();
    }

    private static IllegalArgumentException invalid(
        String detail
    ) {

        return new IllegalArgumentException(
            "FINORA Branch Certification " +
            detail +
            "."
        );
    }
}