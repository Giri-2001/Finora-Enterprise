package com.finora.enterprise.control;

import android.content.Context;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.AtomicFile;
import android.util.Base64;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.nio.charset.StandardCharsets;
import java.security.AlgorithmParameters;
import java.security.KeyFactory;
import java.security.KeyStore;
import java.security.MessageDigest;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.Signature;
import java.security.interfaces.ECPrivateKey;
import java.security.interfaces.ECPublicKey;
import java.security.spec.ECGenParameterSpec;
import java.security.spec.ECParameterSpec;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Iterator;
import java.util.List;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;

/*
 * FINORA DEVELOPER CONTROL CENTER
 * ANDROID SIGNING KEY VAULT
 *
 * SECURITY:
 * - Exact recovered Control Center authority only.
 * - EC prime256v1 / secp256r1 / P-256 only.
 * - PKCS8 private key + SPKI public key must form one key pair.
 * - signingKeyId = SHA-256(SPKI DER), first 24 hex chars, uppercase.
 * - All retained signing keys receive the same validation.
 * - Complete portable authority is encrypted at rest using a
 *   non-exportable AndroidKeyStore AES-256-GCM key.
 * - Ciphertext replacement uses Android AtomicFile.
 * - No renderer receives private signing material.
 * - Existing different authority is never overwritten.
 */
public final class FinoraDeveloperControlCenterKeyVaultStore {

    private static final String KEYSTORE_PROVIDER =
        "AndroidKeyStore";

    private static final String KEY_ALIAS =
        "finora_developer_control_center_key_vault_aes_v1";

    private static final String CIPHER_ALGORITHM =
        "AES/GCM/NoPadding";

    private static final String VAULT_FILE_NAME =
        "finora_developer_control_center_key_vault_v1.enc";

    private static final String ENVELOPE_ALGORITHM =
        "ANDROID_KEYSTORE_AES_256_GCM";

    private static final int ENVELOPE_SCHEMA_VERSION =
        1;

    private static final int GCM_TAG_BITS =
        128;

    private static final int MAX_ENCRYPTED_BYTES =
        1024 * 1024;

    private static final byte[] AAD =
        "FINORA-DEVELOPER-CONTROL-CENTER-KEY-VAULT-V1"
            .getBytes(StandardCharsets.UTF_8);

    private static final byte[] KEYPAIR_PROBE =
        "FINORA-CONTROL-CENTER-KEYPAIR-VALIDATION-V1"
            .getBytes(StandardCharsets.UTF_8);

    private final AtomicFile atomicFile;

    public FinoraDeveloperControlCenterKeyVaultStore(
        Context context
    ) {

        Context applicationContext =
            context.getApplicationContext();

        File directory =
            new File(
                applicationContext.getFilesDir(),
                "finora-developer-control-center"
            );

        if (
            !directory.exists() &&
            !directory.mkdirs() &&
            !directory.exists()
        ) {
            throw new IllegalStateException(
                "FINORA Developer Control Center secure storage directory could not be created."
            );
        }

        this.atomicFile =
            new AtomicFile(
                new File(
                    directory,
                    VAULT_FILE_NAME
                )
            );
    }

    public synchronized JSONObject restoreOrMatch(
        JSONObject recoveredVault
    ) throws Exception {

        validateVault(
            recoveredVault
        );

        JSONObject existing =
            read();

        if (existing != null) {

            validateVault(
                existing
            );

            if (
                !canonicalJson(
                    existing
                ).equals(
                    canonicalJson(
                        recoveredVault
                    )
                )
            ) {
                throw new IllegalStateException(
                    "FINORA Control Center key-vault already contains a different signing authority."
                );
            }

            return existing;
        }

        write(
            recoveredVault
        );

        JSONObject restored =
            read();

        if (
            restored == null ||
            !canonicalJson(
                restored
            ).equals(
                canonicalJson(
                    recoveredVault
                )
            )
        ) {
            throw new IllegalStateException(
                "FINORA Control Center key-vault bootstrap restore read-back verification failed."
            );
        }

        validateVault(
            restored
        );

        return restored;
    }

    public synchronized JSONObject read()
        throws Exception {

        if (
            !atomicFile
                .getBaseFile()
                .exists()
        ) {
            return null;
        }

        byte[] serialized;

        try (
            FileInputStream input =
                atomicFile.openRead()
        ) {

            ByteArrayOutputStream output =
                new ByteArrayOutputStream();

            byte[] buffer =
                new byte[8192];

            int total =
                0;

            while (true) {

                int read =
                    input.read(
                        buffer
                    );

                if (read < 0) {
                    break;
                }

                total +=
                    read;

                if (
                    total >
                    MAX_ENCRYPTED_BYTES
                ) {
                    throw new IllegalStateException(
                        "FINORA Developer Control Center encrypted key-vault exceeds the maximum size."
                    );
                }

                output.write(
                    buffer,
                    0,
                    read
                );
            }

            serialized =
                output.toByteArray();
        }

        if (
            serialized.length == 0
        ) {
            throw new IllegalStateException(
                "FINORA Developer Control Center encrypted key-vault is empty."
            );
        }

        JSONObject envelope =
            new JSONObject(
                new String(
                    serialized,
                    StandardCharsets.UTF_8
                )
            );

        if (
            envelope.optInt(
                "schemaVersion",
                -1
            ) !=
                ENVELOPE_SCHEMA_VERSION ||
            !ENVELOPE_ALGORITHM.equals(
                envelope.optString(
                    "algorithm",
                    ""
                )
            )
        ) {
            throw new IllegalStateException(
                "FINORA Developer Control Center encrypted key-vault envelope is invalid."
            );
        }

        byte[] iv =
            decodeCanonicalBase64(
                envelope.getString(
                    "iv"
                )
            );

        byte[] ciphertext =
            decodeCanonicalBase64(
                envelope.getString(
                    "ciphertext"
                )
            );

        if (
            iv.length != 12 ||
            ciphertext.length == 0
        ) {
            throw new IllegalStateException(
                "FINORA Developer Control Center encrypted key-vault payload is invalid."
            );
        }

        Cipher cipher =
            Cipher.getInstance(
                CIPHER_ALGORITHM
            );

        cipher.init(
            Cipher.DECRYPT_MODE,
            getExistingSecretKey(),
            new GCMParameterSpec(
                GCM_TAG_BITS,
                iv
            )
        );

        cipher.updateAAD(
            AAD
        );

        final byte[] plaintext;

        try {

            plaintext =
                cipher.doFinal(
                    ciphertext
                );

        } catch (Exception error) {

            throw new IllegalStateException(
                "FINORA Developer Control Center key-vault authentication failed."
            );
        }

        JSONObject vault =
            new JSONObject(
                new String(
                    plaintext,
                    StandardCharsets.UTF_8
                )
            );

        validateVault(
            vault
        );

        return vault;
    }

    private synchronized void write(
        JSONObject vault
    ) throws Exception {

        validateVault(
            vault
        );

        SecretKey secretKey =
            getOrCreateSecretKey();

        Cipher cipher =
            Cipher.getInstance(
                CIPHER_ALGORITHM
            );

        cipher.init(
            Cipher.ENCRYPT_MODE,
            secretKey
        );

        cipher.updateAAD(
            AAD
        );

        byte[] iv =
            cipher.getIV();

        if (
            iv == null ||
            iv.length != 12
        ) {
            throw new IllegalStateException(
                "FINORA Developer Control Center key-vault encryption IV is invalid."
            );
        }

        byte[] plaintext =
            vault.toString()
                .getBytes(
                    StandardCharsets.UTF_8
                );

        byte[] ciphertext =
            cipher.doFinal(
                plaintext
            );

        JSONObject envelope =
            new JSONObject();

        envelope.put(
            "schemaVersion",
            ENVELOPE_SCHEMA_VERSION
        );

        envelope.put(
            "algorithm",
            ENVELOPE_ALGORITHM
        );

        envelope.put(
            "iv",
            Base64.encodeToString(
                iv,
                Base64.NO_WRAP
            )
        );

        envelope.put(
            "ciphertext",
            Base64.encodeToString(
                ciphertext,
                Base64.NO_WRAP
            )
        );

        byte[] serialized =
            envelope.toString()
                .getBytes(
                    StandardCharsets.UTF_8
                );

        FileOutputStream output =
            null;

        try {

            output =
                atomicFile.startWrite();

            output.write(
                serialized
            );

            output.flush();

            atomicFile.finishWrite(
                output
            );

            output =
                null;

        } catch (Exception error) {

            if (output != null) {
                atomicFile.failWrite(
                    output
                );
            }

            throw error;
        }
    }

    private static SecretKey getOrCreateSecretKey()
        throws Exception {

        KeyStore keyStore =
            KeyStore.getInstance(
                KEYSTORE_PROVIDER
            );

        keyStore.load(
            null
        );

        if (
            keyStore.containsAlias(
                KEY_ALIAS
            )
        ) {
            return readSecretKey(
                keyStore
            );
        }

        KeyGenerator generator =
            KeyGenerator.getInstance(
                KeyProperties.KEY_ALGORITHM_AES,
                KEYSTORE_PROVIDER
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
                .setKeySize(
                    256
                )
                .setRandomizedEncryptionRequired(
                    true
                )
                .build()
        );

        generator.generateKey();

        keyStore.load(
            null
        );

        return readSecretKey(
            keyStore
        );
    }

    private static SecretKey getExistingSecretKey()
        throws Exception {

        KeyStore keyStore =
            KeyStore.getInstance(
                KEYSTORE_PROVIDER
            );

        keyStore.load(
            null
        );

        if (
            !keyStore.containsAlias(
                KEY_ALIAS
            )
        ) {
            throw new IllegalStateException(
                "FINORA Developer Control Center AndroidKeyStore key is unavailable."
            );
        }

        return readSecretKey(
            keyStore
        );
    }

    private static SecretKey readSecretKey(
        KeyStore keyStore
    ) throws Exception {

        KeyStore.Entry entry =
            keyStore.getEntry(
                KEY_ALIAS,
                null
            );

        if (
            !(entry instanceof
                KeyStore.SecretKeyEntry)
        ) {
            throw new IllegalStateException(
                "FINORA Developer Control Center AndroidKeyStore entry has an invalid type."
            );
        }

        return (
            (KeyStore.SecretKeyEntry) entry
        ).getSecretKey();
    }

    private static void validateVault(
        JSONObject vault
    ) throws Exception {

        requireExactTopLevelFields(
            vault
        );

        if (
            vault.getInt(
                "schemaVersion"
            ) !=
                1
        ) {
            throw new IllegalStateException(
                "FINORA Control Center key-vault schema version is invalid."
            );
        }

        requireText(
            vault,
            "issuerId"
        );

        requireText(
            vault,
            "signingKeyId"
        );

        requireText(
            vault,
            "privateKeyPkcs8DerBase64"
        );

        requireText(
            vault,
            "publicKeySpkiDerBase64"
        );

        requireText(
            vault,
            "createdAt"
        );

        validateSigningMaterial(
            vault.getString(
                "signingKeyId"
            ),
            vault.getString(
                "privateKeyPkcs8DerBase64"
            ),
            vault.getString(
                "publicKeySpkiDerBase64"
            )
        );

        List<String> signingKeyIds =
            new ArrayList<>();

        signingKeyIds.add(
            vault.getString(
                "signingKeyId"
            )
        );

        JSONArray retained =
            vault.optJSONArray(
                "retainedSigningKeys"
            );

        if (
            vault.has(
                "retainedSigningKeys"
            ) &&
            !vault.isNull(
                "retainedSigningKeys"
            ) &&
            retained == null
        ) {
            throw new IllegalStateException(
                "FINORA Control Center retained signing-key history is invalid."
            );
        }

        if (retained == null) {
            return;
        }

        for (
            int index = 0;
            index < retained.length();
            index++
        ) {

            JSONObject key =
                retained.getJSONObject(
                    index
                );

            requireExactRetainedFields(
                key
            );

            requireText(
                key,
                "signingKeyId"
            );

            requireText(
                key,
                "privateKeyPkcs8DerBase64"
            );

            requireText(
                key,
                "publicKeySpkiDerBase64"
            );

            requireText(
                key,
                "createdAt"
            );

            requireText(
                key,
                "retiredAt"
            );

            String signingKeyId =
                key.getString(
                    "signingKeyId"
                );

            if (
                signingKeyIds.contains(
                    signingKeyId
                )
            ) {
                throw new IllegalStateException(
                    "FINORA Control Center key vault contains a duplicate current/retained signingKeyId."
                );
            }

            validateSigningMaterial(
                signingKeyId,
                key.getString(
                    "privateKeyPkcs8DerBase64"
                ),
                key.getString(
                    "publicKeySpkiDerBase64"
                )
            );

            signingKeyIds.add(
                signingKeyId
            );
        }
    }

    private static void validateSigningMaterial(
        String signingKeyId,
        String privateKeyPkcs8DerBase64,
        String publicKeySpkiDerBase64
    ) throws Exception {

        byte[] privateDer =
            decodeCanonicalBase64(
                privateKeyPkcs8DerBase64
            );

        byte[] publicDer =
            decodeCanonicalBase64(
                publicKeySpkiDerBase64
            );

        KeyFactory factory =
            KeyFactory.getInstance(
                "EC"
            );

        PrivateKey privateKey =
            factory.generatePrivate(
                new PKCS8EncodedKeySpec(
                    privateDer
                )
            );

        PublicKey publicKey =
            factory.generatePublic(
                new X509EncodedKeySpec(
                    publicDer
                )
            );

        if (
            !(privateKey instanceof ECPrivateKey) ||
            !(publicKey instanceof ECPublicKey)
        ) {
            throw new IllegalStateException(
                "FINORA Control Center signing material is not an EC key pair."
            );
        }

        ECParameterSpec expected =
            expectedP256Parameters();

        ECParameterSpec privateParams =
            ((ECPrivateKey) privateKey)
                .getParams();

        ECParameterSpec publicParams =
            ((ECPublicKey) publicKey)
                .getParams();

        if (
            !sameEcParameters(
                expected,
                privateParams
            ) ||
            !sameEcParameters(
                expected,
                publicParams
            )
        ) {
            throw new IllegalStateException(
                "FINORA Control Center signing material must use prime256v1/P-256."
            );
        }

        String expectedSigningKeyId =
            createSigningKeyId(
                publicDer
            );

        if (
            !expectedSigningKeyId.equals(
                signingKeyId
            )
        ) {
            throw new IllegalStateException(
                "FINORA Control Center signingKeyId does not match the SPKI public-key fingerprint."
            );
        }

        /*
         * JCA does not need to export/derive the public key from
         * the private key here. A sign/verify proof demonstrates
         * that the imported PKCS8 and SPKI form the same key pair.
         */
        Signature signer =
            Signature.getInstance(
                "SHA256withECDSA"
            );

        signer.initSign(
            privateKey
        );

        signer.update(
            KEYPAIR_PROBE
        );

        byte[] signature =
            signer.sign();

        Signature verifier =
            Signature.getInstance(
                "SHA256withECDSA"
            );

        verifier.initVerify(
            publicKey
        );

        verifier.update(
            KEYPAIR_PROBE
        );

        if (
            !verifier.verify(
                signature
            )
        ) {
            throw new IllegalStateException(
                "FINORA Control Center PKCS8/SPKI signing material does not form one key pair."
            );
        }
    }

    private static ECParameterSpec expectedP256Parameters()
        throws Exception {

        AlgorithmParameters parameters =
            AlgorithmParameters.getInstance(
                "EC"
            );

        parameters.init(
            new ECGenParameterSpec(
                "secp256r1"
            )
        );

        return parameters.getParameterSpec(
            ECParameterSpec.class
        );
    }

    private static boolean sameEcParameters(
        ECParameterSpec left,
        ECParameterSpec right
    ) {

        return (
            left != null &&
            right != null &&
            left.getCurve().equals(
                right.getCurve()
            ) &&
            left.getGenerator().equals(
                right.getGenerator()
            ) &&
            left.getOrder().equals(
                right.getOrder()
            ) &&
            left.getCofactor() ==
                right.getCofactor()
        );
    }

    private static String createSigningKeyId(
        byte[] publicKeyDer
    ) throws Exception {

        byte[] digest =
            MessageDigest.getInstance(
                "SHA-256"
            ).digest(
                publicKeyDer
            );

        StringBuilder hex =
            new StringBuilder(
                digest.length * 2
            );

        for (byte value : digest) {
            hex.append(
                String.format(
                    "%02x",
                    value & 0xff
                )
            );
        }

        return "FINORA-KEY-" +
            hex.substring(
                0,
                24
            ).toUpperCase();
    }

    private static byte[] decodeCanonicalBase64(
        String value
    ) {

        if (
            value == null ||
            value.isEmpty()
        ) {
            throw new IllegalStateException(
                "FINORA Control Center signing material contains invalid base64."
            );
        }

        final byte[] decoded;

        try {

            decoded =
                Base64.decode(
                    value,
                    Base64.DEFAULT
                );

        } catch (Exception error) {

            throw new IllegalStateException(
                "FINORA Control Center signing material contains invalid base64."
            );
        }

        String canonical =
            Base64.encodeToString(
                decoded,
                Base64.NO_WRAP
            );

        if (
            !canonical.equals(
                value
            )
        ) {
            throw new IllegalStateException(
                "FINORA Control Center signing material base64 is not canonical."
            );
        }

        return decoded;
    }

    private static void requireExactTopLevelFields(
        JSONObject value
    ) {

        List<String> actual =
            jsonKeys(
                value
            );

        List<String> withoutRetained =
            new ArrayList<>();

        Collections.addAll(
            withoutRetained,
            "createdAt",
            "issuerId",
            "privateKeyPkcs8DerBase64",
            "publicKeySpkiDerBase64",
            "schemaVersion",
            "signingKeyId"
        );

        Collections.sort(
            withoutRetained
        );

        List<String> withRetained =
            new ArrayList<>(
                withoutRetained
            );

        withRetained.add(
            "retainedSigningKeys"
        );

        Collections.sort(
            withRetained
        );

        if (
            !actual.equals(
                withoutRetained
            ) &&
            !actual.equals(
                withRetained
            )
        ) {
            throw new IllegalStateException(
                "FINORA Control Center key-vault contains unsupported fields."
            );
        }
    }

    private static void requireExactRetainedFields(
        JSONObject value
    ) {

        List<String> actual =
            jsonKeys(
                value
            );

        List<String> expected =
            new ArrayList<>();

        Collections.addAll(
            expected,
            "createdAt",
            "privateKeyPkcs8DerBase64",
            "publicKeySpkiDerBase64",
            "retiredAt",
            "signingKeyId"
        );

        Collections.sort(
            expected
        );

        if (
            !actual.equals(
                expected
            )
        ) {
            throw new IllegalStateException(
                "FINORA Control Center retained signing-key record contains unsupported fields."
            );
        }
    }

    private static List<String> jsonKeys(
        JSONObject value
    ) {

        List<String> keys =
            new ArrayList<>();

        Iterator<String> iterator =
            value.keys();

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

        return keys;
    }

    private static void requireText(
        JSONObject object,
        String field
    ) throws Exception {

        if (
            !object.has(
                field
            ) ||
            object.isNull(
                field
            ) ||
            object.getString(
                field
            ).isEmpty()
        ) {
            throw new IllegalStateException(
                "FINORA Control Center key-vault field is invalid: " +
                field
            );
        }
    }

    private static String canonicalJson(
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
                jsonKeys(
                    object
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
                    JSONObject.quote(
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

        if (
            value instanceof String
        ) {
            return JSONObject.quote(
                (String) value
            );
        }

        return String.valueOf(
            value
        );
    }
}