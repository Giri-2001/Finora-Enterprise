package com.finora.enterprise.control;

import android.content.Context;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.AtomicFile;

import org.json.JSONObject;

import java.io.File;
import java.io.FileOutputStream;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.KeyStore;
import java.security.SecureRandom;
import java.util.UUID;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;

/**
 * Owner-only pending recharge intent.
 *
 * No credentials, bearer tokens or wallet balances are persisted.
 * A pending intent must survive process restart and retain its UUID.
 * This class never calls the server or authorizes a wallet credit.
 */
final class FinoraOwnerRechargeIntentStore {

    private static final String KEY_ALIAS =
        "FINORA_OWNER_RECHARGE_INTENT_AES_V1";

    private static final byte[] AAD =
        "FINORA_OWNER_RECHARGE_INTENT_V1"
            .getBytes(StandardCharsets.UTF_8);

    private static final int VERSION = 1;
    private static final int IV_LENGTH = 12;
    private static final int MAX_FILE_BYTES = 4096;

    private final AtomicFile file;

    static final class Intent {
        final String walletId;
        final int amountInr;
        final String paymentMethod;
        final String idempotencyKey;

        Intent(
            String walletId,
            int amountInr,
            String paymentMethod,
            String idempotencyKey
        ) {
            this.walletId = walletId;
            this.amountInr = amountInr;
            this.paymentMethod = paymentMethod;
            this.idempotencyKey = idempotencyKey;
        }
    }

    FinoraOwnerRechargeIntentStore(Context context) {
        if (context == null) {
            throw new IllegalArgumentException("CONTEXT_REQUIRED");
        }

        File directory = new File(
            context.getApplicationContext().getNoBackupFilesDir(),
            "FINORA/owner-wallet"
        );

        if (!directory.isDirectory() && !directory.mkdirs()) {
            throw new IllegalStateException("INTENT_DIRECTORY_UNAVAILABLE");
        }

        file = new AtomicFile(
            new File(directory, "pending-recharge-v1.bin")
        );
    }

    private static void validate(Intent intent) {
        if (intent == null ||
            intent.walletId == null ||
            !intent.walletId.matches("[0-9]{8,12}") ||
            intent.amountInr < 50 ||
            intent.amountInr > 2000 ||
            (!"PHONEPE".equals(intent.paymentMethod) &&
             !"GOOGLE_PAY".equals(intent.paymentMethod)) ||
            intent.idempotencyKey == null ||
            !intent.idempotencyKey.matches(
                "(?i)[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"
            )) {
            throw new IllegalArgumentException("INVALID_RECHARGE_INTENT");
        }
    }

    private static SecretKey key(boolean create) throws Exception {
        KeyStore store = KeyStore.getInstance("AndroidKeyStore");
        store.load(null);

        if (store.containsAlias(KEY_ALIAS)) {
            java.security.Key stored = store.getKey(KEY_ALIAS, null);

            if (!(stored instanceof SecretKey)) {
                throw new IllegalStateException("INTENT_KEY_INVALID");
            }

            return (SecretKey) stored;
        }

        if (!create) {
            throw new IllegalStateException("INTENT_KEY_MISSING");
        }

        KeyGenerator generator = KeyGenerator.getInstance(
            KeyProperties.KEY_ALGORITHM_AES,
            "AndroidKeyStore"
        );

        generator.init(
            new KeyGenParameterSpec.Builder(
                KEY_ALIAS,
                KeyProperties.PURPOSE_ENCRYPT |
                    KeyProperties.PURPOSE_DECRYPT
            )
                .setKeySize(256)
                .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                .setEncryptionPaddings(
                    KeyProperties.ENCRYPTION_PADDING_NONE
                )
                .setRandomizedEncryptionRequired(true)
                .build()
        );

        return generator.generateKey();
    }

    synchronized Intent load() throws Exception {
        if (!file.getBaseFile().exists()) {
            return null;
        }

        if (file.getBaseFile().length() > MAX_FILE_BYTES) {
            throw new IllegalStateException("INTENT_FILE_TOO_LARGE");
        }

        byte[] encoded = file.readFully();

        if (encoded.length < 30 ||
            encoded.length > MAX_FILE_BYTES ||
            (encoded[0] & 0xff) != VERSION) {
            throw new IllegalStateException("INTENT_FILE_INVALID");
        }

        byte[] iv = new byte[IV_LENGTH];
        System.arraycopy(encoded, 1, iv, 0, IV_LENGTH);

        byte[] encrypted = new byte[encoded.length - 1 - IV_LENGTH];
        System.arraycopy(
            encoded,
            1 + IV_LENGTH,
            encrypted,
            0,
            encrypted.length
        );

        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");

        cipher.init(
            Cipher.DECRYPT_MODE,
            key(false),
            new GCMParameterSpec(128, iv)
        );

        cipher.updateAAD(AAD);

        JSONObject value = new JSONObject(
            new String(
                cipher.doFinal(encrypted),
                StandardCharsets.UTF_8
            )
        );

        Intent intent = new Intent(
            value.getString("walletId"),
            value.getInt("amountInr"),
            value.getString("paymentMethod"),
            value.getString("idempotencyKey")
        );

        validate(intent);

        return intent;
    }

    synchronized Intent saveIfAbsent(Intent requested) throws Exception {
        validate(requested);

        Intent existing = load();

        if (existing != null) {
            if (!existing.walletId.equals(requested.walletId) ||
                existing.amountInr != requested.amountInr ||
                !existing.paymentMethod.equals(requested.paymentMethod) ||
                !existing.idempotencyKey.equalsIgnoreCase(
                    requested.idempotencyKey
                )) {
                throw new IllegalStateException(
                    "LOCAL_RECHARGE_INTENT_CONFLICT"
                );
            }

            return existing;
        }

        JSONObject value = new JSONObject();

        value.put("walletId", requested.walletId);
        value.put("amountInr", requested.amountInr);
        value.put("paymentMethod", requested.paymentMethod);
        value.put(
            "idempotencyKey",
            requested.idempotencyKey.toLowerCase(
                java.util.Locale.ROOT
            )
        );

        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.ENCRYPT_MODE, key(true));
        cipher.updateAAD(AAD);

        byte[] iv = cipher.getIV();

        if (iv == null || iv.length != IV_LENGTH) {
            throw new IllegalStateException("INTENT_IV_INVALID");
        }

        byte[] encrypted = cipher.doFinal(
            value.toString().getBytes(StandardCharsets.UTF_8)
        );

        byte[] encoded = ByteBuffer.allocate(
            1 + iv.length + encrypted.length
        )
            .put((byte) VERSION)
            .put(iv)
            .put(encrypted)
            .array();

        if (encoded.length > MAX_FILE_BYTES) {
            throw new IllegalStateException("INTENT_TOO_LARGE");
        }

        FileOutputStream output = null;

        try {
            output = file.startWrite();
            output.write(encoded);
            file.finishWrite(output);
            output = null;
        } catch (Exception error) {
            if (output != null) {
                file.failWrite(output);
            }

            throw error;
        }

        Intent confirmed = load();

        if (confirmed == null ||
            !confirmed.walletId.equals(requested.walletId) ||
            confirmed.amountInr != requested.amountInr ||
            !confirmed.paymentMethod.equals(requested.paymentMethod) ||
            !confirmed.idempotencyKey.equalsIgnoreCase(
                requested.idempotencyKey
            )) {
            throw new IllegalStateException(
                "INTENT_PERSISTENCE_NOT_VERIFIED"
            );
        }

        return confirmed;
    }

    synchronized boolean clearIfMatches(
        String walletId,
        String idempotencyKey
    ) throws Exception {
        Intent existing = load();

        if (existing == null) {
            return false;
        }

        if (!existing.walletId.equals(walletId) ||
            !existing.idempotencyKey.equalsIgnoreCase(
                idempotencyKey == null ? "" : idempotencyKey
            )) {
            return false;
        }

        file.delete();

        if (file.getBaseFile().exists()) {
            throw new IllegalStateException("INTENT_CLEAR_NOT_VERIFIED");
        }

        return true;
    }
}
