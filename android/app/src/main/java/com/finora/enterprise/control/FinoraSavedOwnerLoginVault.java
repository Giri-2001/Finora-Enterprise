package com.finora.enterprise.control;

import android.content.Context;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.AtomicFile;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.File;
import java.io.FileOutputStream;
import java.nio.charset.StandardCharsets;
import java.security.KeyStore;
import java.security.SecureRandom;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;

/**
 * FINORA C80 Android Saved Owner Login Vault.
 *
 * Device-local, Android Keystore-backed AES-256-GCM storage.
 * Never store passwords in WebView storage or on branch USB.
 *
 * Caller must independently verify successful authenticated
 * Owner Reception before invoking save().
 */
public final class FinoraSavedOwnerLoginVault {
    private static final String KEY_ALIAS =
        "FINORA_SAVED_OWNER_LOGIN_AES_V1";

    private static final String CIPHER =
        "AES/GCM/NoPadding";

    private static final int MAX_ACCOUNTS = 50;
    private static final int MAX_FILE_BYTES = 262144;

    private final AtomicFile file;

    public FinoraSavedOwnerLoginVault(Context context) {
        if (context == null) {
            throw new IllegalArgumentException("Context required");
        }

        File directory = new File(
            new File(context.getApplicationContext().getFilesDir(), "FINORA"),
            "saved-owner-logins"
        );

        if (!directory.exists() && !directory.mkdirs()) {
            throw new IllegalStateException("Vault directory unavailable");
        }

        file = new AtomicFile(
            new File(directory, "saved-owner-logins-v1.bin")
        );
    }

    private SecretKey key() throws Exception {
        KeyStore store = KeyStore.getInstance("AndroidKeyStore");
        store.load(null);

        KeyStore.Entry entry = store.getEntry(KEY_ALIAS, null);

        if (entry instanceof KeyStore.SecretKeyEntry) {
            return ((KeyStore.SecretKeyEntry) entry).getSecretKey();
        }

        // Never replace a missing key if encrypted data exists.
        if (file.getBaseFile().exists()) {
            throw new IllegalStateException("VAULT_KEY_UNAVAILABLE");
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

    private JSONArray read() throws Exception {
        if (!file.getBaseFile().exists()) {
            return new JSONArray();
        }

        byte[] encrypted = file.readFully();

        if (
            encrypted.length < 29 ||
            encrypted.length > MAX_FILE_BYTES ||
            encrypted[0] != 1
        ) {
            throw new IllegalStateException("VAULT_FORMAT_INVALID");
        }

        byte[] iv = new byte[12];
        System.arraycopy(encrypted, 1, iv, 0, 12);

        byte[] cipherText = new byte[encrypted.length - 13];
        System.arraycopy(
            encrypted, 13, cipherText, 0, cipherText.length
        );

        Cipher cipher = Cipher.getInstance(CIPHER);
        cipher.init(
            Cipher.DECRYPT_MODE,
            key(),
            new GCMParameterSpec(128, iv)
        );

        byte[] plain = cipher.doFinal(cipherText);

        JSONArray entries = new JSONArray(
            new String(plain, StandardCharsets.UTF_8)
        );

        if (entries.length() > MAX_ACCOUNTS) {
            throw new IllegalStateException("VAULT_LIMIT_INVALID");
        }

        return entries;
    }

    private void write(JSONArray entries) throws Exception {
        if (entries.length() > MAX_ACCOUNTS) {
            throw new IllegalStateException("VAULT_LIMIT_REACHED");
        }

        byte[] plain = entries.toString().getBytes(
            StandardCharsets.UTF_8
        );

        // FINORA_C80_AUTH_R164_KEYSTORE_GENERATED_GCM_IV
        // Android Keystore requires a provider-generated IV
        // when randomized encryption is enabled.
        Cipher cipher = Cipher.getInstance(CIPHER);

        cipher.init(
            Cipher.ENCRYPT_MODE,
            key()
        );

        byte[] iv = cipher.getIV();

        // Existing V1 envelope stores exactly 12 IV bytes.
        // Never write an incompatible encrypted payload.
        if (iv == null || iv.length != 12) {
            throw new java.security.GeneralSecurityException(
                "KEYSTORE_GCM_IV_INVALID"
            );
        }

        byte[] cipherText = cipher.doFinal(plain);

        byte[] envelope = new byte[13 + cipherText.length];
        envelope[0] = 1;
        System.arraycopy(iv, 0, envelope, 1, 12);
        System.arraycopy(
            cipherText, 0, envelope, 13, cipherText.length
        );

        if (envelope.length > MAX_FILE_BYTES) {
            throw new IllegalStateException("VAULT_SIZE_LIMIT");
        }

        FileOutputStream stream = null;

        try {
            stream = file.startWrite();
            stream.write(envelope);
            file.finishWrite(stream);
        } catch (Exception error) {
            if (stream != null) {
                file.failWrite(stream);
            }
            throw error;
        }
    }

    public synchronized JSONArray list() throws Exception {
        JSONArray records = read();
        JSONArray publicRecords = new JSONArray();

        for (int i = 0; i < records.length(); i++) {
            JSONObject record = records.getJSONObject(i);
            JSONObject summary = new JSONObject();

            summary.put("id", record.getString("id"));
            summary.put("branchId", record.getString("branchId"));
            summary.put("ownerId", record.getString("ownerId"));
            summary.put("username", record.getString("username"));
            summary.put("branchLabel", record.getString("branchLabel"));
            summary.put("savedAt", record.getString("savedAt"));

            publicRecords.put(summary);
        }

        return publicRecords;
    }

    public synchronized JSONObject select(String id) throws Exception {
        JSONArray records = read();

        for (int i = 0; i < records.length(); i++) {
            JSONObject record = records.getJSONObject(i);

            if (record.getString("id").equals(id)) {
                return new JSONObject(record.toString());
            }
        }

        throw new IllegalArgumentException("SAVED_ACCOUNT_NOT_FOUND");
    }

    public synchronized JSONObject save(
        String id,
        String branchId,
        String ownerId,
        String username,
        String password,
        String branchLabel
    ) throws Exception {
        if (
            id == null || id.isEmpty() ||
            branchId == null || branchId.isEmpty() ||
            ownerId == null || ownerId.isEmpty() ||
            username == null || username.isEmpty() ||
            password == null || password.isEmpty()
        ) {
            throw new IllegalArgumentException("INVALID_ACCOUNT_RECORD");
        }

        JSONArray records = read();
        JSONArray updated = new JSONArray();

        for (int i = 0; i < records.length(); i++) {
            JSONObject existing = records.getJSONObject(i);

            if (!id.equals(existing.getString("id"))) {
                updated.put(existing);
            }
        }

        JSONObject record = new JSONObject();
        record.put("id", id);
        record.put("branchId", branchId);
        record.put("ownerId", ownerId);
        record.put("username", username);
        record.put("password", password);
        record.put(
            "branchLabel",
            branchLabel == null ? branchId : branchLabel
        );
        record.put(
            "savedAt",
            java.time.Instant.now().toString()
        );

        updated.put(record);
        write(updated);

        return record;
    }

    // FINORA_C81_A16_ANDROID_LABEL_ONLY
    // Caller MUST verify the Owner/Branch with PostgreSQL first.
    // This method only checks exact saved-account scope.
    // It never changes password, savedAt or account identity.
    public synchronized JSONObject updateBusinessLabel(
        String id,
        String branchId,
        String ownerId,
        String username,
        String businessName
    ) throws Exception {
        if (id == null ||
            !id.matches("^[a-f0-9]{64}$") ||
            branchId == null || branchId.trim().isEmpty() ||
            ownerId == null || ownerId.trim().isEmpty() ||
            username == null || username.trim().isEmpty() ||
            businessName == null ||
            businessName.trim().isEmpty() ||
            businessName.trim().length() > 256) {
            throw new IllegalArgumentException(
                "INVALID_BUSINESS_LABEL_REQUEST");
        }

        JSONArray records = read();

        for (int i = 0; i < records.length(); i++) {
            JSONObject record = records.getJSONObject(i);

            if (!id.equals(record.optString("id", ""))) {
                continue;
            }

            if (!branchId.equals(record.optString("branchId", "")) ||
                !ownerId.equals(record.optString("ownerId", "")) ||
                !username.equals(record.optString("username", ""))) {
                throw new IllegalStateException(
                    "SAVED_LOGIN_SCOPE_MISMATCH");
            }

            String label = businessName.trim();

            if (!label.equals(record.optString("branchLabel", ""))) {
                record.put("branchLabel", label);
                write(records);
            }

            JSONObject summary = new JSONObject();
            summary.put("id", record.getString("id"));
            summary.put("branchId", record.getString("branchId"));
            summary.put("ownerId", record.getString("ownerId"));
            summary.put("username", record.getString("username"));
            summary.put("branchLabel", record.getString("branchLabel"));
            summary.put("savedAt", record.getString("savedAt"));

            return summary;
        }

        return null;
    }
    public synchronized boolean remove(String id) throws Exception {
        JSONArray records = read();
        JSONArray updated = new JSONArray();
        boolean removed = false;

        for (int i = 0; i < records.length(); i++) {
            JSONObject record = records.getJSONObject(i);

            if (record.getString("id").equals(id)) {
                removed = true;
            } else {
                updated.put(record);
            }
        }

        if (removed) {
            write(updated);
        }

        return removed;
    }
}