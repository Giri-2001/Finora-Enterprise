package com.finora.enterprise.control;

import android.content.Context;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.AtomicFile;

import org.json.JSONObject;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.DataInputStream;
import java.io.DataOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.nio.charset.StandardCharsets;
import java.security.KeyStore;
import java.security.MessageDigest;
import java.util.Arrays;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;

public final class FinoraWalletBranchCertificationDeviceVault {

    private static final String KEYSTORE_PROVIDER =
        "AndroidKeyStore";

    private static final String KEY_ALIAS =
        "FINORA_WALLET_BRANCH_CERT_DEVICE_VAULT_AES_V1";

    private static final String CIPHER =
        "AES/GCM/NoPadding";

    private static final String AAD_DOMAIN =
        "FINORA_WALLET_BRANCH_CERT_DEVICE_VAULT_V1";

    private static final int MAGIC =
        0x46574331;

    private static final int VERSION =
        1;

    private static final int IV_BYTES =
        12;

    private static final int GCM_TAG_BITS =
        128;

    private static final int MAX_FILE_BYTES =
        131072;

    private final Context context;

    public FinoraWalletBranchCertificationDeviceVault(
        Context context
    ) {
        if (context == null) {
            throw new IllegalArgumentException(
                "FINORA Wallet Branch Certification vault requires Android context."
            );
        }

        Context applicationContext =
            context.getApplicationContext();

        this.context =
            applicationContext == null
                ? context
                : applicationContext;
    }

    public synchronized FinoraBranchCertificationCryptoValidator.Material read(
        String ownerId,
        String businessId,
        String branchId
    ) throws Exception {

        Scope scope =
            scope(
                ownerId,
                businessId,
                branchId
            );

        AtomicFile file =
            atomicFile(
                scope
            );

        if (!file.getBaseFile().isFile()) {
            return null;
        }

        byte[] envelope =
            readBounded(
                file
            );

        byte[] plaintext =
            null;

        try {
            plaintext =
                decrypt(
                    envelope,
                    scope
                );

            JSONObject root =
                new JSONObject(
                    new String(
                        plaintext,
                        StandardCharsets.UTF_8
                    )
                );

            if (
                root.optInt(
                    "schemaVersion",
                    -1
                ) != 1
            ) {
                throw new IllegalStateException(
                    "FINORA Wallet Branch Certification vault schema is invalid."
                );
            }

            if (
                !scope.ownerId.equals(
                    root.optString(
                        "ownerId",
                        ""
                    )
                ) ||
                !scope.businessId.equals(
                    root.optString(
                        "businessId",
                        ""
                    )
                ) ||
                !scope.branchId.equals(
                    root.optString(
                        "branchId",
                        ""
                    )
                )
            ) {
                throw new IllegalStateException(
                    "FINORA Wallet Branch Certification vault scope mismatch."
                );
            }

            JSONObject materialJson =
                root.optJSONObject(
                    "material"
                );

            if (materialJson == null) {
                throw new IllegalStateException(
                    "FINORA Wallet Branch Certification vault material is missing."
                );
            }

            FinoraBranchCertificationCryptoValidator.Material material =
                FinoraPortableBranchAuthCertificationMaterialParser.parse(
                    materialJson
                );

            FinoraBranchCertificationCryptoValidator.assertValid(
                material
            );

            return material;
        }
        finally {
            Arrays.fill(
                envelope,
                (byte) 0
            );

            if (plaintext != null) {
                Arrays.fill(
                    plaintext,
                    (byte) 0
                );
            }
        }
    }

    public synchronized void write(
        String ownerId,
        String businessId,
        String branchId,
        FinoraBranchCertificationCryptoValidator.Material material
    ) throws Exception {

        Scope scope =
            scope(
                ownerId,
                businessId,
                branchId
            );

        if (material == null) {
            throw new IllegalArgumentException(
                "FINORA Wallet Branch Certification material is required."
            );
        }

        FinoraBranchCertificationCryptoValidator.assertValid(
            material
        );

        JSONObject root =
            new JSONObject();

        root.put(
            "schemaVersion",
            1
        );

        root.put(
            "ownerId",
            scope.ownerId
        );

        root.put(
            "businessId",
            scope.businessId
        );

        root.put(
            "branchId",
            scope.branchId
        );

        root.put(
            "material",
            materialToJson(
                material
            )
        );

        byte[] plaintext =
            root.toString().getBytes(
                StandardCharsets.UTF_8
            );

        byte[] envelope =
            null;

        try {
            envelope =
                encrypt(
                    plaintext,
                    scope
                );

            AtomicFile file =
                atomicFile(
                    scope
                );

            FileOutputStream output =
                null;

            try {
                output =
                    file.startWrite();

                output.write(
                    envelope
                );

                output.flush();

                file.finishWrite(
                    output
                );

                output =
                    null;
            }
            catch (Exception error) {
                if (output != null) {
                    file.failWrite(
                        output
                    );
                }

                throw error;
            }
        }
        finally {
            Arrays.fill(
                plaintext,
                (byte) 0
            );

            if (envelope != null) {
                Arrays.fill(
                    envelope,
                    (byte) 0
                );
            }
        }
    }

    private AtomicFile atomicFile(
        Scope scope
    ) throws Exception {

        File finora =
            new File(
                context.getFilesDir(),
                "FINORA"
            );

        File wallet =
            new File(
                finora,
                "wallet"
            );

        if (
            !wallet.isDirectory() &&
            !wallet.mkdirs() &&
            !wallet.isDirectory()
        ) {
            throw new IllegalStateException(
                "Unable to create FINORA Wallet secure storage."
            );
        }

        String fileName =
            "finora-wallet-branch-cert-" +
            scopeDigest(
                scope
            ) +
            ".bin";

        return new AtomicFile(
            new File(
                wallet,
                fileName
            )
        );
    }

    private static byte[] readBounded(
        AtomicFile file
    ) throws Exception {

        FileInputStream input =
            file.openRead();

        try {
            ByteArrayOutputStream output =
                new ByteArrayOutputStream();

            byte[] buffer =
                new byte[4096];

            int total = 0;

            while (true) {
                int read =
                    input.read(
                        buffer
                    );

                if (read < 0) {
                    break;
                }

                total += read;

                if (total > MAX_FILE_BYTES) {
                    throw new IllegalStateException(
                        "FINORA Wallet Branch Certification vault is too large."
                    );
                }

                output.write(
                    buffer,
                    0,
                    read
                );
            }

            return output.toByteArray();
        }
        finally {
            input.close();
        }
    }

    private static byte[] encrypt(
        byte[] plaintext,
        Scope scope
    ) throws Exception {

        Cipher cipher =
            Cipher.getInstance(
                CIPHER
            );

        cipher.init(
            Cipher.ENCRYPT_MODE,
            getOrCreateKey()
        );

        cipher.updateAAD(
            aad(
                scope
            )
        );

        byte[] ciphertext =
            cipher.doFinal(
                plaintext
            );

        byte[] iv =
            cipher.getIV();

        if (
            iv == null ||
            iv.length != IV_BYTES
        ) {
            throw new IllegalStateException(
                "FINORA Wallet Branch Certification vault IV is invalid."
            );
        }

        ByteArrayOutputStream bytes =
            new ByteArrayOutputStream();

        DataOutputStream output =
            new DataOutputStream(
                bytes
            );

        output.writeInt(
            MAGIC
        );

        output.writeInt(
            VERSION
        );

        output.writeInt(
            iv.length
        );

        output.write(
            iv
        );

        output.writeInt(
            ciphertext.length
        );

        output.write(
            ciphertext
        );

        output.flush();

        Arrays.fill(
            ciphertext,
            (byte) 0
        );

        return bytes.toByteArray();
    }

    private static byte[] decrypt(
        byte[] envelope,
        Scope scope
    ) throws Exception {

        if (
            envelope == null ||
            envelope.length == 0 ||
            envelope.length > MAX_FILE_BYTES
        ) {
            throw new IllegalStateException(
                "FINORA Wallet Branch Certification vault envelope is invalid."
            );
        }

        DataInputStream input =
            new DataInputStream(
                new ByteArrayInputStream(
                    envelope
                )
            );

        if (
            input.readInt() != MAGIC ||
            input.readInt() != VERSION
        ) {
            throw new IllegalStateException(
                "FINORA Wallet Branch Certification vault envelope header is invalid."
            );
        }

        int ivLength =
            input.readInt();

        if (ivLength != IV_BYTES) {
            throw new IllegalStateException(
                "FINORA Wallet Branch Certification vault IV length is invalid."
            );
        }

        byte[] iv =
            new byte[
                ivLength
            ];

        input.readFully(
            iv
        );

        int ciphertextLength =
            input.readInt();

        if (
            ciphertextLength <= 0 ||
            ciphertextLength > MAX_FILE_BYTES
        ) {
            throw new IllegalStateException(
                "FINORA Wallet Branch Certification vault ciphertext is invalid."
            );
        }

        byte[] ciphertext =
            new byte[
                ciphertextLength
            ];

        input.readFully(
            ciphertext
        );

        if (input.available() != 0) {
            throw new IllegalStateException(
                "FINORA Wallet Branch Certification vault has trailing bytes."
            );
        }

        try {
            Cipher cipher =
                Cipher.getInstance(
                    CIPHER
                );

            cipher.init(
                Cipher.DECRYPT_MODE,
                getOrCreateKey(),
                new GCMParameterSpec(
                    GCM_TAG_BITS,
                    iv
                )
            );

            cipher.updateAAD(
                aad(
                    scope
                )
            );

            return cipher.doFinal(
                ciphertext
            );
        }
        finally {
            Arrays.fill(
                iv,
                (byte) 0
            );

            Arrays.fill(
                ciphertext,
                (byte) 0
            );
        }
    }

    private static SecretKey getOrCreateKey()
        throws Exception {

        KeyStore store =
            KeyStore.getInstance(
                KEYSTORE_PROVIDER
            );

        store.load(
            null
        );

        if (
            store.containsAlias(
                KEY_ALIAS
            )
        ) {
            java.security.Key existing =
                store.getKey(
                    KEY_ALIAS,
                    null
                );

            if (!(existing instanceof SecretKey)) {
                throw new IllegalStateException(
                    "FINORA Wallet Branch Certification vault key is invalid."
                );
            }

            return (SecretKey) existing;
        }

        KeyGenerator generator =
            KeyGenerator.getInstance(
                KeyProperties.KEY_ALGORITHM_AES,
                KEYSTORE_PROVIDER
            );

        KeyGenParameterSpec specification =
            new KeyGenParameterSpec.Builder(
                KEY_ALIAS,
                KeyProperties.PURPOSE_ENCRYPT |
                    KeyProperties.PURPOSE_DECRYPT
            )
                .setKeySize(
                    256
                )
                .setBlockModes(
                    KeyProperties.BLOCK_MODE_GCM
                )
                .setEncryptionPaddings(
                    KeyProperties.ENCRYPTION_PADDING_NONE
                )
                .setRandomizedEncryptionRequired(
                    true
                )
                .build();

        generator.init(
            specification
        );

        return generator.generateKey();
    }

    private static JSONObject materialToJson(
        FinoraBranchCertificationCryptoValidator.Material material
    ) throws Exception {

        JSONObject value =
            new JSONObject();

        value.put(
            "keyId",
            material.keyId
        );

        value.put(
            "algorithm",
            material.algorithm
        );

        value.put(
            "publicKeyFormat",
            material.publicKeyFormat
        );

        value.put(
            "publicKey",
            material.publicKey
        );

        value.put(
            "fingerprintAlgorithm",
            material.fingerprintAlgorithm
        );

        value.put(
            "publicKeyFingerprint",
            material.publicKeyFingerprint
        );

        value.put(
            "createdAt",
            material.createdAt
        );

        value.put(
            "schemaVersion",
            material.schemaVersion
        );

        value.put(
            "privateKeyFormat",
            material.privateKeyFormat
        );

        value.put(
            "privateKey",
            material.privateKey
        );

        value.put(
            "vaultSchemaVersion",
            material.vaultSchemaVersion
        );

        return value;
    }

    private static byte[] aad(
        Scope scope
    ) {
        String value =
            AAD_DOMAIN +
            "|" +
            canonicalScope(
                scope
            );

        return value.getBytes(
            StandardCharsets.UTF_8
        );
    }

    private static String scopeDigest(
        Scope scope
    ) throws Exception {

        MessageDigest digest =
            MessageDigest.getInstance(
                "SHA-256"
            );

        byte[] bytes =
            digest.digest(
                canonicalScope(
                    scope
                ).getBytes(
                    StandardCharsets.UTF_8
                )
            );

        try {
            char[] hex =
                new char[
                    bytes.length * 2
                ];

            char[] alphabet =
                "0123456789abcdef".toCharArray();

            for (
                int index = 0;
                index < bytes.length;
                index += 1
            ) {
                int value =
                    bytes[index] & 0xff;

                hex[index * 2] =
                    alphabet[
                        value >>> 4
                    ];

                hex[index * 2 + 1] =
                    alphabet[
                        value & 0x0f
                    ];
            }

            return new String(
                hex
            );
        }
        finally {
            Arrays.fill(
                bytes,
                (byte) 0
            );
        }
    }

    private static String canonicalScope(
        Scope scope
    ) {
        return (
            scope.ownerId.length() +
            ":" +
            scope.ownerId +
            "|" +
            scope.businessId.length() +
            ":" +
            scope.businessId +
            "|" +
            scope.branchId.length() +
            ":" +
            scope.branchId
        );
    }

    private static Scope scope(
        String ownerId,
        String businessId,
        String branchId
    ) {
        return new Scope(
            required(
                ownerId,
                "ownerId"
            ),
            required(
                businessId,
                "businessId"
            ),
            required(
                branchId,
                "branchId"
            )
        );
    }

    private static String required(
        String value,
        String label
    ) {
        if (
            value == null ||
            value.trim().length() == 0
        ) {
            throw new IllegalArgumentException(
                "FINORA Wallet Branch Certification " +
                label +
                " is required."
            );
        }

        return value.trim();
    }

    private static final class Scope {

        final String ownerId;
        final String businessId;
        final String branchId;

        Scope(
            String ownerId,
            String businessId,
            String branchId
        ) {
            this.ownerId = ownerId;
            this.businessId = businessId;
            this.branchId = branchId;
        }
    }
}