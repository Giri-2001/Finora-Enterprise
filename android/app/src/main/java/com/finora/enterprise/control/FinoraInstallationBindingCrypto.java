package com.finora.enterprise.control;

/* ===========================================================
   FINORA ENTERPRISE OS™

   ANDROID INSTALLATION BINDING CRYPTO

   MODULE  : Native Control
   LAYER   : Android Native
   VERSION : 1.0
   STATUS  : Production Foundation

   RESPONSIBILITY:

   - Generate one P-256 installation possession key
   - Keep private key non-exportable in Android Keystore
   - Encode installationId in the Keystore alias
   - Recover installationId from the native alias
   - Export public SPKI metadata only
   - Derive SHA-256 public-key fingerprint
   - Sign canonical enrollment payloads
   - Emit FINORA IEEE-P1363 signatures

   SECURITY:

   - Android Keystore private key only.
   - No private-key serialization.
   - No WebView.
   - No PluginMethod.
   - No Control Center signing authority.
   - No Business Date.
=========================================================== */

import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;

import java.nio.charset.StandardCharsets;
import java.security.KeyPairGenerator;
import java.security.KeyStore;
import java.security.MessageDigest;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.Signature;
import java.security.interfaces.ECPublicKey;
import java.security.spec.ECGenParameterSpec;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Date;
import java.util.Enumeration;
import java.util.List;
import java.util.Locale;

public final class FinoraInstallationBindingCrypto {

    // ========================================================
    // CONTRACT
    // ========================================================

    public static final String PLATFORM =
        "ANDROID";

    public static final String ALGORITHM =
        "ECDSA_P256_SHA256";

    public static final String PUBLIC_KEY_FORMAT =
        "SPKI_DER_BASE64";

    public static final String FINGERPRINT_ALGORITHM =
        "SHA-256";

    public static final String SIGNATURE_ENCODING =
        "IEEE_P1363";

    public static final String CANONICALIZATION =
        "FINORA_CANONICAL_JSON_V1";

    private static final String ANDROID_KEYSTORE =
        "AndroidKeyStore";

    private static final String KEY_ALIAS_PREFIX =
        "FINORA_ENTERPRISE_INSTALLATION_BINDING_P256_V1_";

    private static final int P256_COMPONENT_BYTES =
        32;

    private static final Object LOCK =
        new Object();

    private FinoraInstallationBindingCrypto() {
    }

    // ========================================================
    // PUBLIC BINDING
    // ========================================================

    public static final class PublicBinding {

        public final String installationId;

        public final String bindingKeyId;

        public final String platform;

        public final String algorithm;

        public final String publicKeyFormat;

        public final String publicKey;

        public final String fingerprintAlgorithm;

        public final String publicKeyFingerprint;

        public final String createdAt;

        public final int schemaVersion;

        private PublicBinding(
            String installationId,
            String bindingKeyId,
            String publicKey,
            String publicKeyFingerprint,
            String createdAt
        ) {
            this.installationId =
                installationId;

            this.bindingKeyId =
                bindingKeyId;

            this.platform =
                PLATFORM;

            this.algorithm =
                ALGORITHM;

            this.publicKeyFormat =
                PUBLIC_KEY_FORMAT;

            this.publicKey =
                publicKey;

            this.fingerprintAlgorithm =
                FINGERPRINT_ALGORITHM;

            this.publicKeyFingerprint =
                publicKeyFingerprint;

            this.createdAt =
                createdAt;

            this.schemaVersion =
                1;
        }
    }

    // ========================================================
    // EXISTING BINDING
    // ========================================================

    public static PublicBinding loadExisting()
        throws Exception {

        synchronized (LOCK) {

            KeyStore keyStore =
                loadKeyStore();

            List<String> aliases =
                findBindingAliases(
                    keyStore
                );

            if (aliases.isEmpty()) {
                return null;
            }

            if (
                aliases.size() != 1
            ) {
                throw new IllegalStateException(
                    "FINORA Android installation contains multiple native binding keys."
                );
            }

            return publicBindingFromAlias(
                keyStore,
                aliases.get(
                    0
                )
            );
        }
    }

    // ========================================================
    // GENERATE
    // ========================================================

    public static PublicBinding generate(
        String installationId
    ) throws Exception {

        String normalizedInstallationId =
            requireInstallationId(
                installationId
            );

        synchronized (LOCK) {

            KeyStore keyStore =
                loadKeyStore();

            List<String> existingAliases =
                findBindingAliases(
                    keyStore
                );

            if (
                !existingAliases.isEmpty()
            ) {

                if (
                    existingAliases.size() != 1
                ) {
                    throw new IllegalStateException(
                        "FINORA Android installation contains multiple native binding keys."
                    );
                }

                PublicBinding existing =
                    publicBindingFromAlias(
                        keyStore,
                        existingAliases.get(
                            0
                        )
                    );

                if (
                    !normalizedInstallationId.equals(
                        existing.installationId
                    )
                ) {
                    throw new IllegalStateException(
                        "FINORA Android installation binding identity cannot be replaced."
                    );
                }

                return existing;
            }

            String alias =
                createAlias(
                    normalizedInstallationId
                );

            KeyPairGenerator generator =
                KeyPairGenerator.getInstance(
                    KeyProperties.KEY_ALGORITHM_EC,
                    ANDROID_KEYSTORE
                );

            KeyGenParameterSpec specification =
                new KeyGenParameterSpec.Builder(
                    alias,
                    KeyProperties.PURPOSE_SIGN |
                        KeyProperties.PURPOSE_VERIFY
                )
                    .setAlgorithmParameterSpec(
                        new ECGenParameterSpec(
                            "secp256r1"
                        )
                    )
                    .setDigests(
                        KeyProperties.DIGEST_SHA256
                    )
                    .build();

            generator.initialize(
                specification
            );

            generator.generateKeyPair();

            keyStore =
                loadKeyStore();

            if (
                !keyStore.containsAlias(
                    alias
                )
            ) {
                throw new IllegalStateException(
                    "FINORA Android installation binding key was not persisted by Android Keystore."
                );
            }

            return publicBindingFromAlias(
                keyStore,
                alias
            );
        }
    }

    // ========================================================
    // SIGN CANONICAL ENROLLMENT
    // ========================================================

    public static String signCanonicalEnrollment(
        String canonicalPayload
    ) throws Exception {

        if (
            canonicalPayload == null ||
            canonicalPayload.isEmpty()
        ) {
            throw new IllegalArgumentException(
                "Canonical FINORA installation enrollment payload is required."
            );
        }

        synchronized (LOCK) {

            KeyStore keyStore =
                loadKeyStore();

            List<String> aliases =
                findBindingAliases(
                    keyStore
                );

            if (
                aliases.size() != 1
            ) {
                throw new IllegalStateException(
                    "Exactly one FINORA Android installation binding key is required."
                );
            }

            String alias =
                aliases.get(
                    0
                );

            KeyStore.Entry entry =
                keyStore.getEntry(
                    alias,
                    null
                );

            if (
                !(entry instanceof
                    KeyStore.PrivateKeyEntry)
            ) {
                throw new IllegalStateException(
                    "FINORA Android installation binding alias is not a private-key entry."
                );
            }

            PrivateKey privateKey =
                (
                    (KeyStore.PrivateKeyEntry) entry
                ).getPrivateKey();

            if (
                privateKey == null
            ) {
                throw new IllegalStateException(
                    "FINORA Android installation binding private key is unavailable."
                );
            }

            Signature signer =
                Signature.getInstance(
                    "SHA256withECDSA"
                );

            signer.initSign(
                privateKey
            );

            signer.update(
                canonicalPayload.getBytes(
                    StandardCharsets.UTF_8
                )
            );

            byte[] derSignature =
                signer.sign();

            byte[] p1363Signature =
                FinoraInstallationBindingSignatureCodec
                    .derToP1363(
                        derSignature,
                        P256_COMPONENT_BYTES
                    );

            if (
                p1363Signature.length != 64
            ) {
                throw new IllegalStateException(
                    "FINORA Android installation signature must contain exactly 64 IEEE-P1363 bytes."
                );
            }

            return Base64
                .getEncoder()
                .encodeToString(
                    p1363Signature
                );
        }
    }

    // ========================================================
    // PUBLIC VERIFY
    // ========================================================

    public static boolean verifyCanonicalEnrollment(
        String canonicalPayload,
        String signatureBase64
    ) {

        if (
            canonicalPayload == null ||
            canonicalPayload.isEmpty() ||
            signatureBase64 == null ||
            signatureBase64.isEmpty()
        ) {
            return false;
        }

        try {

            PublicBinding binding =
                loadExisting();

            if (binding == null) {
                return false;
            }

            KeyStore keyStore =
                loadKeyStore();

            String alias =
                createAlias(
                    binding.installationId
                );

            PublicKey publicKey =
                requireP256PublicKey(
                    keyStore,
                    alias
                );

            byte[] p1363 =
                Base64
                    .getDecoder()
                    .decode(
                        signatureBase64
                    );

            if (
                p1363.length != 64
            ) {
                return false;
            }

            byte[] der =
                FinoraInstallationBindingSignatureCodec
                    .p1363ToDer(
                        p1363
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

            return verifier.verify(
                der
            );

        } catch (Exception error) {
            return false;
        }
    }

    // ========================================================
    // PUBLIC BINDING FROM KEYSTORE
    // ========================================================

    private static PublicBinding publicBindingFromAlias(
        KeyStore keyStore,
        String alias
    ) throws Exception {

        String installationId =
            installationIdFromAlias(
                alias
            );

        PublicKey publicKey =
            requireP256PublicKey(
                keyStore,
                alias
            );

        byte[] encoded =
            publicKey.getEncoded();

        if (
            encoded == null ||
            encoded.length == 0
        ) {
            throw new IllegalStateException(
                "FINORA Android installation public key is not exportable."
            );
        }

        String publicKeyBase64 =
            Base64
                .getEncoder()
                .encodeToString(
                    encoded
                );

        String fingerprint =
            toLowerHex(
                MessageDigest
                    .getInstance(
                        "SHA-256"
                    )
                    .digest(
                        encoded
                    )
            );

        String bindingKeyId =
            "FINORA-BINDING-" +
            fingerprint
                .substring(
                    0,
                    32
                )
                .toUpperCase(
                    Locale.ROOT
                );

        Date created =
            keyStore.getCreationDate(
                alias
            );

        if (created == null) {
            throw new IllegalStateException(
                "FINORA Android installation binding creation timestamp is unavailable."
            );
        }

        String createdAt =
            java.time.Instant
                .ofEpochMilli(
                    created.getTime()
                )
                .toString();

        return new PublicBinding(
            installationId,
            bindingKeyId,
            publicKeyBase64,
            fingerprint,
            createdAt
        );
    }

    // ========================================================
    // P-256 PUBLIC KEY
    // ========================================================

    private static PublicKey requireP256PublicKey(
        KeyStore keyStore,
        String alias
    ) throws Exception {

        java.security.cert.Certificate certificate =
            keyStore.getCertificate(
                alias
            );

        if (certificate == null) {
            throw new IllegalStateException(
                "FINORA Android installation binding certificate is missing."
            );
        }

        PublicKey publicKey =
            certificate.getPublicKey();

        if (
            !(publicKey instanceof
                ECPublicKey)
        ) {
            throw new IllegalStateException(
                "FINORA Android installation binding key is not EC."
            );
        }

        ECPublicKey ecPublicKey =
            (ECPublicKey) publicKey;

        if (
            ecPublicKey
                .getParams()
                .getCurve()
                .getField()
                .getFieldSize() != 256
        ) {
            throw new IllegalStateException(
                "FINORA Android installation binding key is not P-256."
            );
        }

        return publicKey;
    }

    // ========================================================
    // KEYSTORE
    // ========================================================

    private static KeyStore loadKeyStore()
        throws Exception {

        KeyStore keyStore =
            KeyStore.getInstance(
                ANDROID_KEYSTORE
            );

        keyStore.load(
            null
        );

        return keyStore;
    }

    private static List<String> findBindingAliases(
        KeyStore keyStore
    ) throws Exception {

        List<String> result =
            new ArrayList<>();

        Enumeration<String> aliases =
            keyStore.aliases();

        while (
            aliases.hasMoreElements()
        ) {

            String alias =
                aliases.nextElement();

            if (
                alias != null &&
                alias.startsWith(
                    KEY_ALIAS_PREFIX
                )
            ) {
                result.add(
                    alias
                );
            }
        }

        return result;
    }

    // ========================================================
    // ALIAS <-> INSTALLATION ID
    // ========================================================

    private static String createAlias(
        String installationId
    ) {

        String encoded =
            Base64
                .getUrlEncoder()
                .withoutPadding()
                .encodeToString(
                    requireInstallationId(
                        installationId
                    ).getBytes(
                        StandardCharsets.UTF_8
                    )
                );

        return KEY_ALIAS_PREFIX +
            encoded;
    }

    private static String installationIdFromAlias(
        String alias
    ) {

        if (
            alias == null ||
            !alias.startsWith(
                KEY_ALIAS_PREFIX
            )
        ) {
            throw new IllegalArgumentException(
                "Invalid FINORA Android installation binding alias."
            );
        }

        String encoded =
            alias.substring(
                KEY_ALIAS_PREFIX.length()
            );

        if (
            encoded.isEmpty()
        ) {
            throw new IllegalArgumentException(
                "FINORA Android installation binding alias is incomplete."
            );
        }

        byte[] decoded;

        try {

            decoded =
                Base64
                    .getUrlDecoder()
                    .decode(
                        encoded
                    );

        } catch (
            IllegalArgumentException error
        ) {

            throw new IllegalArgumentException(
                "FINORA Android installation binding alias is invalid.",
                error
            );
        }

        String installationId =
            new String(
                decoded,
                StandardCharsets.UTF_8
            );

        installationId =
            requireInstallationId(
                installationId
            );

        String canonicalEncoded =
            Base64
                .getUrlEncoder()
                .withoutPadding()
                .encodeToString(
                    installationId.getBytes(
                        StandardCharsets.UTF_8
                    )
                );

        if (
            !canonicalEncoded.equals(
                encoded
            )
        ) {
            throw new IllegalArgumentException(
                "FINORA Android installation binding alias is not canonical."
            );
        }

        return installationId;
    }

    // ========================================================
    // VALUE HELPERS
    // ========================================================

    private static String requireInstallationId(
        String value
    ) {

        if (value == null) {
            throw new IllegalArgumentException(
                "FINORA Android installationId is required."
            );
        }

        String normalized =
            value.trim();

        if (normalized.isEmpty()) {
            throw new IllegalArgumentException(
                "FINORA Android installationId is required."
            );
        }

        return normalized;
    }

    private static String toLowerHex(
        byte[] bytes
    ) {

        StringBuilder builder =
            new StringBuilder(
                bytes.length * 2
            );

        for (
            byte value :
            bytes
        ) {

            builder.append(
                String.format(
                    Locale.ROOT,
                    "%02x",
                    value & 0xff
                )
            );
        }

        return builder.toString();
    }
}