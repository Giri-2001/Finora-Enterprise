package com.finora.enterprise.control;

import android.app.Activity;
import android.content.ContentResolver;
import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.provider.OpenableColumns;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.AtomicFile;
import android.util.Base64;

import androidx.activity.result.ActivityResult;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.bouncycastle.crypto.generators.SCrypt;
import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;

import java.nio.charset.StandardCharsets;

import java.security.KeyFactory;
import java.security.KeyStore;
import java.security.MessageDigest;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.SecureRandom;
import java.security.Signature;

import java.security.interfaces.ECPublicKey;

import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;

import java.text.SimpleDateFormat;

import java.util.Arrays;
import java.util.Date;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;
import java.util.TimeZone;

import javax.crypto.AEADBadTagException;
import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;


/**
 * FINORA ENTERPRISE OS
 *
 * Dedicated Android Developer Control Center bridge.
 *
 * SECURITY BOUNDARIES:
 *
 * - Normal Owner APK does not register this plugin.
 * - Admin Recovery Security Code is never persisted.
 * - Developer Security Code is never persisted.
 * - Full signing authority is encrypted with AndroidKeyStore AES-GCM.
 * - Wrong Admin Recovery code creates no local authority.
 * - Renderer never receives private signing material.
 * - Unlocked state is process-memory only.
 */
@CapacitorPlugin(
    name = "FinoraDeveloperControlCenter"
)
public final class FinoraDeveloperControlCenterPlugin
    extends Plugin {

    // ========================================================
    // RECOVERY CONTRACT
    // ========================================================

    private static final String RECOVERY_FORMAT =
        "FINORA_CONTROL_CENTER_ADMIN_AUTHORITY_RECOVERY";

    private static final int RECOVERY_SCHEMA_VERSION =
        1;

    private static final int SCRYPT_N =
        32768;

    private static final int SCRYPT_R =
        8;

    private static final int SCRYPT_P =
        1;

    private static final int RECOVERY_SALT_BYTES =
        16;

    private static final int RECOVERY_DERIVED_KEY_BYTES =
        32;

    private static final int RECOVERY_IV_BYTES =
        12;

    private static final int RECOVERY_TAG_BYTES =
        16;

    private static final int MAX_RECOVERY_CIPHERTEXT_BYTES =
        512 * 1024;

    private static final int MAX_RECOVERY_FILE_BYTES =
        1024 * 1024;

    private static final String RECOVERY_EXTENSION =
        ".finora-admin-recovery";

    private static final int ADMIN_CODE_MIN_LENGTH =
        12;

    private static final int ADMIN_CODE_MAX_LENGTH =
        128;


    // ========================================================
    // DEVELOPER SECURITY CODE CONTRACT
    // ========================================================

    private static final int DEVELOPER_CODE_MIN_LENGTH =
        10;

    private static final int DEVELOPER_CODE_MAX_LENGTH =
        20;

    private static final int DEVELOPER_SALT_BYTES =
        16;

    private static final int DEVELOPER_VERIFIER_BYTES =
        32;


    // ========================================================
    // COOLDOWN
    // ========================================================

    private static final long BACKOFF_BASE_MS =
        1000L;

    private static final long BACKOFF_MAX_MS =
        60000L;


    // ========================================================
    // ANDROID SECURE STORE
    // ========================================================

    private static final String STORE_DIRECTORY =
        "FINORA/developer-control-center";

    private static final String STORE_FILE =
        "finora-developer-control-center.bin";

    private static final int STORE_SCHEMA_VERSION =
        1;

    private static final String KEYSTORE_PROVIDER =
        "AndroidKeyStore";

    private static final String STORE_KEY_ALIAS =
        "FINORA_DEVELOPER_CONTROL_CENTER_STORE_KEY_V1";

    private static final String STORE_CIPHER =
        "AES/GCM/NoPadding";

    private static final int STORE_IV_BYTES =
        12;

    private static final int STORE_TAG_BITS =
        128;

    private static final byte[] STORE_AAD =
        "FINORA_DEVELOPER_CONTROL_CENTER_STORE_V1"
            .getBytes(
                StandardCharsets.UTF_8
            );


    // ========================================================
    // PROCESS SESSION
    // ========================================================

    private volatile boolean unlocked =
        false;


    // ========================================================
    // INTERNAL TYPES
    // ========================================================

    private static final class InvalidRecoveryBundleException
        extends Exception {

        InvalidRecoveryBundleException(
            String message
        ) {
            super(message);
        }
    }


    private static final class RecoveryAuthenticationException
        extends Exception {

        RecoveryAuthenticationException(
            String message
        ) {
            super(message);
        }
    }


    private static final class RecoveryAuthorityMismatchException
        extends Exception {

        RecoveryAuthorityMismatchException(
            String message
        ) {
            super(message);
        }
    }


    // ========================================================
    // GENERIC RESULTS
    // ========================================================

    private void resolveSuccess(
        PluginCall call,
        Object data
    ) {

        JSObject response =
            new JSObject();

        response.put(
            "success",
            true
        );

        response.put(
            "data",
            data
        );

        call.resolve(
            response
        );
    }


    private void resolveFailure(
        PluginCall call,
        String error
    ) {

        JSObject response =
            new JSObject();

        response.put(
            "success",
            false
        );

        response.put(
            "error",
            error
        );

        call.resolve(
            response
        );
    }


    // ========================================================
    // STRING / TIME HELPERS
    // ========================================================

    private static boolean isBlank(
        String value
    ) {

        if (
            value == null ||
            value.isEmpty()
        ) {
            return true;
        }

        int index =
            0;

        while (
            index <
            value.length()
        ) {

            int codePoint =
                value.codePointAt(
                    index
                );

            if (
                !Character.isWhitespace(
                    codePoint
                ) &&
                !Character.isSpaceChar(
                    codePoint
                )
            ) {
                return false;
            }

            index +=
                Character.charCount(
                    codePoint
                );
        }

        return true;
    }


    /*
     * Accept both native Capacitor payload shapes:
     *
     *   { field: value }
     *
     * and:
     *
     *   { request: { field: value } }
     */
    private static String readRecoveryRequestString(
        PluginCall call,
        String key
    ) {

        if (
            call == null ||
            key == null
        ) {
            return null;
        }

        String direct =
            call.getString(
                key
            );

        if (direct != null) {
            return direct;
        }

        JSObject nested =
            call.getObject(
                "request"
            );

        if (nested == null) {
            return null;
        }

        Object value =
            nested.opt(
                key
            );

        if (!(value instanceof String)) {
            return null;
        }

        return (String) value;
    }

    private static int codePointLength(
        String value
    ) {

        if (value == null) {
            return 0;
        }

        return value.codePointCount(
            0,
            value.length()
        );
    }


    private static void assertAdminCode(
        String securityCode
    ) {

        if (securityCode == null) {

            throw new IllegalArgumentException(
                "FINORA Control Center Admin Security Code is invalid."
            );
        }

        int length =
            securityCode.codePointCount(
                0,
                securityCode.length()
            );

        /*
         * Exact Windows Admin Authority Recovery contract:
         * minimum 10 code points
         * maximum 20 code points
         *
         * This is input-shape validation only.
         * SCRYPT + AES-256-GCM still authenticates correctness.
         */
        if (
            length < 10 ||
            length > 20 ||
            securityCode.trim().length() == 0
        ) {

            throw new IllegalArgumentException(
                "FINORA Control Center Admin Security Code is invalid."
            );
        }
    }


    private static void assertDeveloperCode(
        String securityCode
    ) {

        int length =
            codePointLength(
                securityCode
            );

        if (
            length <
                DEVELOPER_CODE_MIN_LENGTH ||
            length >
                DEVELOPER_CODE_MAX_LENGTH ||
            isBlank(
                securityCode
            )
        ) {

            throw new IllegalArgumentException(
                "FINORA Developer Security Code must contain between 10 and 20 characters and cannot be whitespace-only."
            );
        }
    }


    private static String nowIso() {

        SimpleDateFormat format =
            new SimpleDateFormat(
                "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
                Locale.US
            );

        format.setTimeZone(
            TimeZone.getTimeZone(
                "UTC"
            )
        );

        return format.format(
            new Date()
        );
    }


    // ========================================================
    // CANONICAL BASE64
    // ========================================================

    private static byte[] decodeCanonicalBase64(
        String value,
        int expectedBytes
    ) throws InvalidRecoveryBundleException {

        if (
            value == null ||
            value.isEmpty()
        ) {

            throw new InvalidRecoveryBundleException(
                "FINORA Admin Recovery Bundle contains invalid Base64."
            );
        }

        final byte[] decoded;

        try {

            decoded =
                Base64.decode(
                    value,
                    Base64.DEFAULT
                );
        }
        catch (
            IllegalArgumentException error
        ) {

            throw new InvalidRecoveryBundleException(
                "FINORA Admin Recovery Bundle contains invalid Base64."
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
            ) ||
            (
                expectedBytes >=
                    0 &&
                decoded.length !=
                    expectedBytes
            )
        ) {

            throw new InvalidRecoveryBundleException(
                "FINORA Admin Recovery Bundle contains non-canonical Base64."
            );
        }

        return decoded;
    }


    private static byte[] decodeCanonicalBase64(
        String value
    ) throws InvalidRecoveryBundleException {

        return decodeCanonicalBase64(
            value,
            -1
        );
    }


    // ========================================================
    // SCRYPT
    // ========================================================

    private static byte[] deriveScrypt(
        String secret,
        byte[] salt,
        int outputBytes
    ) {

        byte[] secretBytes =
            secret.getBytes(
                StandardCharsets.UTF_8
            );

        try {

            return SCrypt.generate(
                secretBytes,
                salt,
                SCRYPT_N,
                SCRYPT_R,
                SCRYPT_P,
                outputBytes
            );
        }
        finally {

            Arrays.fill(
                secretBytes,
                (byte) 0
            );
        }
    }


    // ========================================================
    // RECOVERY BUNDLE VALIDATION
    // ========================================================

    private static JSONObject parseRecoveryBundle(
        byte[] bytes
    ) throws Exception {

        if (
            bytes == null ||
            bytes.length ==
                0 ||
            bytes.length >
                MAX_RECOVERY_FILE_BYTES
        ) {

            throw new InvalidRecoveryBundleException(
                "FINORA Admin Recovery file size is invalid."
            );
        }

        String serialized =
            new String(
                bytes,
                StandardCharsets.UTF_8
            );

        if (
            !Arrays.equals(
                serialized.getBytes(
                    StandardCharsets.UTF_8
                ),
                bytes
            )
        ) {

            throw new InvalidRecoveryBundleException(
                "FINORA Admin Recovery file is not valid UTF-8."
            );
        }

        final JSONObject bundle;

        try {

            bundle =
                new JSONObject(
                    serialized
                );
        }
        catch (Exception error) {

            throw new InvalidRecoveryBundleException(
                "FINORA Admin Recovery Bundle JSON is invalid."
            );
        }

        validateRecoveryBundle(
            bundle
        );

        return bundle;
    }


    private static void validateRecoveryBundle(
        JSONObject bundle
    ) throws Exception {

        if (
            bundle == null ||
            bundle.length() !=
                9
        ) {

            throw new InvalidRecoveryBundleException(
                "FINORA Admin Recovery Bundle structure is invalid."
            );
        }

        if (
            !RECOVERY_FORMAT.equals(
                bundle.optString(
                    "format",
                    null
                )
            ) ||
            bundle.optInt(
                "schemaVersion",
                -1
            ) !=
                RECOVERY_SCHEMA_VERSION
        ) {

            throw new InvalidRecoveryBundleException(
                "FINORA Admin Recovery Bundle format is invalid."
            );
        }

        String bundleId =
            bundle.optString(
                "bundleId",
                null
            );

        String issuerId =
            bundle.optString(
                "issuerId",
                null
            );

        String signingKeyId =
            bundle.optString(
                "signingKeyId",
                null
            );

        String createdAt =
            bundle.optString(
                "createdAt",
                null
            );

        if (
            isBlank(bundleId) ||
            isBlank(issuerId) ||
            isBlank(signingKeyId) ||
            isBlank(createdAt)
        ) {

            throw new InvalidRecoveryBundleException(
                "FINORA Admin Recovery Bundle metadata is invalid."
            );
        }

        JSONObject kdf =
            bundle.optJSONObject(
                "kdf"
            );

        JSONObject encryption =
            bundle.optJSONObject(
                "encryption"
            );

        if (
            kdf == null ||
            kdf.length() !=
                6 ||
            encryption == null ||
            encryption.length() !=
                3
        ) {

            throw new InvalidRecoveryBundleException(
                "FINORA Admin Recovery Bundle crypto metadata is invalid."
            );
        }

        if (
            !"SCRYPT".equals(
                kdf.optString(
                    "algorithm",
                    null
                )
            ) ||
            kdf.optInt(
                "N",
                -1
            ) !=
                SCRYPT_N ||
            kdf.optInt(
                "r",
                -1
            ) !=
                SCRYPT_R ||
            kdf.optInt(
                "p",
                -1
            ) !=
                SCRYPT_P ||
            kdf.optInt(
                "derivedKeyBytes",
                -1
            ) !=
                RECOVERY_DERIVED_KEY_BYTES
        ) {

            throw new InvalidRecoveryBundleException(
                "FINORA Admin Recovery Bundle SCRYPT parameters are invalid."
            );
        }

        decodeCanonicalBase64(
            kdf.optString(
                "salt",
                null
            ),
            RECOVERY_SALT_BYTES
        );

        if (
            !"AES-256-GCM".equals(
                encryption.optString(
                    "algorithm",
                    null
                )
            )
        ) {

            throw new InvalidRecoveryBundleException(
                "FINORA Admin Recovery Bundle encryption algorithm is invalid."
            );
        }

        decodeCanonicalBase64(
            encryption.optString(
                "iv",
                null
            ),
            RECOVERY_IV_BYTES
        );

        decodeCanonicalBase64(
            encryption.optString(
                "authTag",
                null
            ),
            RECOVERY_TAG_BYTES
        );

        byte[] ciphertext =
            decodeCanonicalBase64(
                bundle.optString(
                    "ciphertext",
                    null
                )
            );

        if (
            ciphertext.length ==
                0 ||
            ciphertext.length >
                MAX_RECOVERY_CIPHERTEXT_BYTES
        ) {

            throw new InvalidRecoveryBundleException(
                "FINORA Admin Recovery Bundle ciphertext size is invalid."
            );
        }
    }


    // ========================================================
    // EXACT WINDOWS-COMPATIBLE RECOVERY AAD
    // ========================================================

    private static byte[] buildRecoveryAad(
        JSONObject bundle
    ) throws Exception {

        JSONObject kdf =
            bundle.getJSONObject(
                "kdf"
            );

        JSONObject encryption =
            bundle.getJSONObject(
                "encryption"
            );

        /*
         * EXACT WINDOWS ADMIN RECOVERY AAD CONTRACT:
         *
         * JSON.stringify([
         *   format,
         *   schemaVersion,
         *   bundleId,
         *   issuerId,
         *   signingKeyId,
         *   createdAt,
         *   kdf.algorithm,
         *   kdf.N,
         *   kdf.r,
         *   kdf.p,
         *   kdf.salt,
         *   kdf.derivedKeyBytes,
         *   encryption.algorithm,
         *   encryption.iv
         * ])
         *
         * org.json.JSONArray.toString() emits compact JSON
         * without spaces, matching JSON.stringify(array).
         */
        JSONArray aad =
            new JSONArray();

        aad.put(
            bundle.getString(
                "format"
            )
        );

        aad.put(
            bundle.getInt(
                "schemaVersion"
            )
        );

        aad.put(
            bundle.getString(
                "bundleId"
            )
        );

        aad.put(
            bundle.getString(
                "issuerId"
            )
        );

        aad.put(
            bundle.getString(
                "signingKeyId"
            )
        );

        aad.put(
            bundle.getString(
                "createdAt"
            )
        );

        aad.put(
            kdf.getString(
                "algorithm"
            )
        );

        aad.put(
            kdf.getInt(
                "N"
            )
        );

        aad.put(
            kdf.getInt(
                "r"
            )
        );

        aad.put(
            kdf.getInt(
                "p"
            )
        );

        aad.put(
            kdf.getString(
                "salt"
            )
        );

        aad.put(
            kdf.getInt(
                "derivedKeyBytes"
            )
        );

        aad.put(
            encryption.getString(
                "algorithm"
            )
        );

        aad.put(
            encryption.getString(
                "iv"
            )
        );

        return aad
            .toString()
            .getBytes(
                StandardCharsets.UTF_8
            );
    }


    // ========================================================
    // CONTROL CENTER KEY VAULT VALIDATION
    // ========================================================

    private static byte[] canonicalKeyBase64(
        String value
    ) throws RecoveryAuthorityMismatchException {

        if (
            value == null ||
            value.isEmpty()
        ) {

            throw new RecoveryAuthorityMismatchException(
                "FINORA recovered signing authority is invalid."
            );
        }

        final byte[] decoded;

        try {

            decoded =
                Base64.decode(
                    value,
                    Base64.DEFAULT
                );
        }
        catch (
            IllegalArgumentException error
        ) {

            throw new RecoveryAuthorityMismatchException(
                "FINORA recovered signing authority contains invalid key material."
            );
        }

        if (
            decoded.length ==
                0 ||
            !Base64.encodeToString(
                decoded,
                Base64.NO_WRAP
            ).equals(
                value
            )
        ) {

            throw new RecoveryAuthorityMismatchException(
                "FINORA recovered signing authority contains non-canonical key material."
            );
        }

        return decoded;
    }


    private static void validateSigningPair(
        String privateKeyBase64,
        String publicKeyBase64
    ) throws Exception {

        byte[] privateBytes =
            canonicalKeyBase64(
                privateKeyBase64
            );

        byte[] publicBytes =
            canonicalKeyBase64(
                publicKeyBase64
            );

        try {

            KeyFactory factory =
                KeyFactory.getInstance(
                    "EC"
                );

            PrivateKey privateKey =
                factory.generatePrivate(
                    new PKCS8EncodedKeySpec(
                        privateBytes
                    )
                );

            PublicKey publicKey =
                factory.generatePublic(
                    new X509EncodedKeySpec(
                        publicBytes
                    )
                );

            if (
                !(publicKey instanceof ECPublicKey) ||
                (
                    (ECPublicKey) publicKey
                )
                    .getParams()
                    .getCurve()
                    .getField()
                    .getFieldSize() !=
                        256
            ) {

                throw new RecoveryAuthorityMismatchException(
                    "FINORA recovered signing authority is not P-256."
                );
            }

            byte[] challenge =
                "FINORA_CONTROL_CENTER_AUTHORITY_PAIR_CHECK_V1"
                    .getBytes(
                        StandardCharsets.UTF_8
                    );

            Signature signer =
                Signature.getInstance(
                    "SHA256withECDSA"
                );

            signer.initSign(
                privateKey
            );

            signer.update(
                challenge
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
                challenge
            );

            if (
                !verifier.verify(
                    signature
                )
            ) {

                throw new RecoveryAuthorityMismatchException(
                    "FINORA recovered private/public signing keys do not match."
                );
            }
        }
        finally {

            Arrays.fill(
                privateBytes,
                (byte) 0
            );

            Arrays.fill(
                publicBytes,
                (byte) 0
            );
        }
    }


    private static void validateVault(
        JSONObject vault,
        JSONObject outerBundle
    ) throws Exception {

        if (
            vault == null
        ) {

            throw new RecoveryAuthorityMismatchException(
                "FINORA recovered key vault is invalid."
            );
        }

        boolean hasRetained =
            vault.has(
                "retainedSigningKeys"
            );

        int expectedFields =
            hasRetained
                ? 7
                : 6;

        if (
            vault.length() !=
                expectedFields ||
            vault.optInt(
                "schemaVersion",
                -1
            ) !=
                1
        ) {

            throw new RecoveryAuthorityMismatchException(
                "FINORA recovered key vault schema is invalid."
            );
        }

        String issuerId =
            vault.optString(
                "issuerId",
                null
            );

        String signingKeyId =
            vault.optString(
                "signingKeyId",
                null
            );

        String privateKey =
            vault.optString(
                "privateKeyPkcs8DerBase64",
                null
            );

        String publicKey =
            vault.optString(
                "publicKeySpkiDerBase64",
                null
            );

        String createdAt =
            vault.optString(
                "createdAt",
                null
            );

        if (
            isBlank(issuerId) ||
            isBlank(signingKeyId) ||
            isBlank(privateKey) ||
            isBlank(publicKey) ||
            isBlank(createdAt)
        ) {

            throw new RecoveryAuthorityMismatchException(
                "FINORA recovered key vault fields are invalid."
            );
        }

        if (
            !issuerId.equals(
                outerBundle.getString(
                    "issuerId"
                )
            ) ||
            !signingKeyId.equals(
                outerBundle.getString(
                    "signingKeyId"
                )
            )
        ) {

            throw new RecoveryAuthorityMismatchException(
                "FINORA recovered authority identity does not match the authenticated Recovery Bundle."
            );
        }

        validateSigningPair(
            privateKey,
            publicKey
        );

        if (hasRetained) {

            JSONArray retained =
                vault.optJSONArray(
                    "retainedSigningKeys"
                );

            if (retained == null) {

                throw new RecoveryAuthorityMismatchException(
                    "FINORA retained signing-key state is invalid."
                );
            }

            Set<String> ids =
                new HashSet<>();

            ids.add(
                signingKeyId
            );

            for (
                int index = 0;
                index < retained.length();
                index++
            ) {

                JSONObject key =
                    retained.optJSONObject(
                        index
                    );

                if (
                    key == null ||
                    key.length() !=
                        5
                ) {

                    throw new RecoveryAuthorityMismatchException(
                        "FINORA retained signing-key record is invalid."
                    );
                }

                String retainedId =
                    key.optString(
                        "signingKeyId",
                        null
                    );

                String retainedPrivate =
                    key.optString(
                        "privateKeyPkcs8DerBase64",
                        null
                    );

                String retainedPublic =
                    key.optString(
                        "publicKeySpkiDerBase64",
                        null
                    );

                String retainedCreated =
                    key.optString(
                        "createdAt",
                        null
                    );

                String retiredAt =
                    key.optString(
                        "retiredAt",
                        null
                    );

                if (
                    isBlank(retainedId) ||
                    isBlank(retainedPrivate) ||
                    isBlank(retainedPublic) ||
                    isBlank(retainedCreated) ||
                    isBlank(retiredAt) ||
                    !ids.add(
                        retainedId
                    )
                ) {

                    throw new RecoveryAuthorityMismatchException(
                        "FINORA retained signing-key record is invalid."
                    );
                }

                validateSigningPair(
                    retainedPrivate,
                    retainedPublic
                );
            }
        }
    }


    // ========================================================
    // RECOVERY DECRYPT
    // ========================================================

    private static JSONObject decryptRecoveryBundle(
        JSONObject bundle,
        String adminSecurityCode
    ) throws Exception {

        assertAdminCode(
            adminSecurityCode
        );

        JSONObject kdf =
            bundle.getJSONObject(
                "kdf"
            );

        JSONObject encryption =
            bundle.getJSONObject(
                "encryption"
            );

        byte[] salt =
            decodeCanonicalBase64(
                kdf.getString(
                    "salt"
                ),
                RECOVERY_SALT_BYTES
            );

        byte[] iv =
            decodeCanonicalBase64(
                encryption.getString(
                    "iv"
                ),
                RECOVERY_IV_BYTES
            );

        byte[] authTag =
            decodeCanonicalBase64(
                encryption.getString(
                    "authTag"
                ),
                RECOVERY_TAG_BYTES
            );

        byte[] ciphertext =
            decodeCanonicalBase64(
                bundle.getString(
                    "ciphertext"
                )
            );

        byte[] key =
            deriveScrypt(
                adminSecurityCode,
                salt,
                RECOVERY_DERIVED_KEY_BYTES
            );

        try {

            Cipher cipher =
                Cipher.getInstance(
                    STORE_CIPHER
                );

            cipher.init(
                Cipher.DECRYPT_MODE,
                new javax.crypto.spec.SecretKeySpec(
                    key,
                    "AES"
                ),
                new GCMParameterSpec(
                    128,
                    iv
                )
            );

            cipher.updateAAD(
                buildRecoveryAad(
                    bundle
                )
            );

            byte[] combined =
                new byte[
                    ciphertext.length +
                    authTag.length
                ];

            System.arraycopy(
                ciphertext,
                0,
                combined,
                0,
                ciphertext.length
            );

            System.arraycopy(
                authTag,
                0,
                combined,
                ciphertext.length,
                authTag.length
            );

            final byte[] plaintext;

            try {

                plaintext =
                    cipher.doFinal(
                        combined
                    );
            }
            catch (
                AEADBadTagException error
            ) {

                throw new RecoveryAuthenticationException(
                    "FINORA Admin Recovery Bundle authentication failed."
                );
            }
            catch (
                javax.crypto.BadPaddingException error
            ) {

                throw new RecoveryAuthenticationException(
                    "FINORA Admin Recovery Bundle authentication failed."
                );
            }

            final JSONObject vault;

            try {

                vault =
                    new JSONObject(
                        new String(
                            plaintext,
                            StandardCharsets.UTF_8
                        )
                    );
            }
            catch (Exception error) {

                throw new RecoveryAuthorityMismatchException(
                    "FINORA Admin Recovery Bundle plaintext is invalid."
                );
            }
            finally {

                Arrays.fill(
                    plaintext,
                    (byte) 0
                );
            }

            validateVault(
                vault,
                bundle
            );

            return vault;
        }
        finally {

            Arrays.fill(
                key,
                (byte) 0
            );
        }
    }


    // ========================================================
    // DEVELOPER VERIFIER
    // ========================================================

    private static JSONObject createDeveloperVerifier(
        String securityCode
    ) throws Exception {

        assertDeveloperCode(
            securityCode
        );

        byte[] salt =
            new byte[
                DEVELOPER_SALT_BYTES
            ];

        new SecureRandom()
            .nextBytes(
                salt
            );

        byte[] verifier =
            deriveScrypt(
                securityCode,
                salt,
                DEVELOPER_VERIFIER_BYTES
            );

        try {

            JSONObject result =
                new JSONObject();

            result.put(
                "algorithm",
                "SCRYPT"
            );

            result.put(
                "saltEncoding",
                "BASE64"
            );

            result.put(
                "verifierEncoding",
                "BASE64"
            );

            result.put(
                "salt",
                Base64.encodeToString(
                    salt,
                    Base64.NO_WRAP
                )
            );

            result.put(
                "verifier",
                Base64.encodeToString(
                    verifier,
                    Base64.NO_WRAP
                )
            );

            result.put(
                "N",
                SCRYPT_N
            );

            result.put(
                "r",
                SCRYPT_R
            );

            result.put(
                "p",
                SCRYPT_P
            );

            result.put(
                "keyLength",
                DEVELOPER_VERIFIER_BYTES
            );

            return result;
        }
        finally {

            Arrays.fill(
                salt,
                (byte) 0
            );

            Arrays.fill(
                verifier,
                (byte) 0
            );
        }
    }


    private static boolean verifyDeveloperCode(
        String candidate,
        JSONObject verifier
    ) {

        try {

            assertDeveloperCode(
                candidate
            );

            if (
                verifier == null ||
                verifier.length() !=
                    9 ||
                !"SCRYPT".equals(
                    verifier.optString(
                        "algorithm",
                        null
                    )
                ) ||
                !"BASE64".equals(
                    verifier.optString(
                        "saltEncoding",
                        null
                    )
                ) ||
                !"BASE64".equals(
                    verifier.optString(
                        "verifierEncoding",
                        null
                    )
                ) ||
                verifier.optInt(
                    "N",
                    -1
                ) !=
                    SCRYPT_N ||
                verifier.optInt(
                    "r",
                    -1
                ) !=
                    SCRYPT_R ||
                verifier.optInt(
                    "p",
                    -1
                ) !=
                    SCRYPT_P ||
                verifier.optInt(
                    "keyLength",
                    -1
                ) !=
                    DEVELOPER_VERIFIER_BYTES
            ) {

                return false;
            }

            byte[] salt =
                Base64.decode(
                    verifier.getString(
                        "salt"
                    ),
                    Base64.DEFAULT
                );

            byte[] expected =
                Base64.decode(
                    verifier.getString(
                        "verifier"
                    ),
                    Base64.DEFAULT
                );

            if (
                salt.length !=
                    DEVELOPER_SALT_BYTES ||
                expected.length !=
                    DEVELOPER_VERIFIER_BYTES ||
                !Base64.encodeToString(
                    salt,
                    Base64.NO_WRAP
                ).equals(
                    verifier.getString(
                        "salt"
                    )
                ) ||
                !Base64.encodeToString(
                    expected,
                    Base64.NO_WRAP
                ).equals(
                    verifier.getString(
                        "verifier"
                    )
                )
            ) {

                Arrays.fill(
                    salt,
                    (byte) 0
                );

                Arrays.fill(
                    expected,
                    (byte) 0
                );

                return false;
            }

            byte[] actual =
                deriveScrypt(
                    candidate,
                    salt,
                    DEVELOPER_VERIFIER_BYTES
                );

            try {

                return MessageDigest.isEqual(
                    actual,
                    expected
                );
            }
            finally {

                Arrays.fill(
                    salt,
                    (byte) 0
                );

                Arrays.fill(
                    expected,
                    (byte) 0
                );

                Arrays.fill(
                    actual,
                    (byte) 0
                );
            }
        }
        catch (Exception error) {

            return false;
        }
    }


    // ========================================================
    // ANDROID KEYSTORE
    // ========================================================

    private SecretKey getOrCreateStoreKey()
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
                STORE_KEY_ALIAS
            )
        ) {

            KeyStore.SecretKeyEntry entry =
                (
                    KeyStore.SecretKeyEntry
                )
                    keyStore.getEntry(
                        STORE_KEY_ALIAS,
                        null
                    );

            if (
                entry == null
            ) {

                throw new IllegalStateException(
                    "FINORA Developer secure-store key is unavailable."
                );
            }

            return entry
                .getSecretKey();
        }

        KeyGenerator generator =
            KeyGenerator.getInstance(
                KeyProperties.KEY_ALGORITHM_AES,
                KEYSTORE_PROVIDER
            );

        generator.init(
            new KeyGenParameterSpec.Builder(
                STORE_KEY_ALIAS,
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
                .build()
        );

        return generator
            .generateKey();
    }


    private AtomicFile getStoreFile() {

        File directory =
            new File(
                getContext()
                    .getFilesDir(),
                STORE_DIRECTORY
            );

        if (
            !directory.exists() &&
            !directory.mkdirs() &&
            !directory.isDirectory()
        ) {

            throw new IllegalStateException(
                "FINORA Developer secure-store directory could not be created."
            );
        }

        return new AtomicFile(
            new File(
                directory,
                STORE_FILE
            )
        );
    }


    private JSONObject encryptStoreEnvelope(
        JSONObject record
    ) throws Exception {

        Cipher cipher =
            Cipher.getInstance(
                STORE_CIPHER
            );

        /*
         * AndroidKeyStore owns GCM IV generation for encryption.
         *
         * Do not provide a caller-generated IV here. The provider
         * generates a fresh randomized IV when ENCRYPT_MODE is
         * initialized, and that exact IV is persisted in the
         * authenticated secure-store envelope for later decryption.
         */
        cipher.init(
            Cipher.ENCRYPT_MODE,
            getOrCreateStoreKey()
        );

        byte[] iv =
            cipher.getIV();

        if (
            iv == null ||
            iv.length !=
                STORE_IV_BYTES
        ) {

            throw new IllegalStateException(
                "FINORA Developer secure-store generated IV is invalid."
            );
        }

        cipher.updateAAD(
            STORE_AAD
        );

        byte[] plaintext =
            record
                .toString()
                .getBytes(
                    StandardCharsets.UTF_8
                );

        try {

            byte[] ciphertext =
                cipher.doFinal(
                    plaintext
                );

            JSONObject envelope =
                new JSONObject();

            envelope.put(
                "schemaVersion",
                STORE_SCHEMA_VERSION
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

            return envelope;
        }
        finally {

            Arrays.fill(
                plaintext,
                (byte) 0
            );

            Arrays.fill(
                iv,
                (byte) 0
            );
        }
    }


    private JSONObject decryptStoreEnvelope(
        JSONObject envelope
    ) throws Exception {

        if (
            envelope == null ||
            envelope.length() !=
                3 ||
            envelope.optInt(
                "schemaVersion",
                -1
            ) !=
                STORE_SCHEMA_VERSION
        ) {

            throw new IllegalStateException(
                "FINORA Developer secure-store envelope is invalid."
            );
        }

        byte[] iv =
            Base64.decode(
                envelope.getString(
                    "iv"
                ),
                Base64.DEFAULT
            );

        byte[] ciphertext =
            Base64.decode(
                envelope.getString(
                    "ciphertext"
                ),
                Base64.DEFAULT
            );

        if (
            iv.length !=
                STORE_IV_BYTES ||
            ciphertext.length <=
                16
        ) {

            throw new IllegalStateException(
                "FINORA Developer secure-store ciphertext is invalid."
            );
        }

        Cipher cipher =
            Cipher.getInstance(
                STORE_CIPHER
            );

        cipher.init(
            Cipher.DECRYPT_MODE,
            getOrCreateStoreKey(),
            new GCMParameterSpec(
                STORE_TAG_BITS,
                iv
            )
        );

        cipher.updateAAD(
            STORE_AAD
        );

        byte[] plaintext =
            cipher.doFinal(
                ciphertext
            );

        try {

            return new JSONObject(
                new String(
                    plaintext,
                    StandardCharsets.UTF_8
                )
            );
        }
        finally {

            Arrays.fill(
                plaintext,
                (byte) 0
            );

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


    private synchronized JSONObject readStore()
        throws Exception {

        AtomicFile atomicFile =
            getStoreFile();

        File base =
            atomicFile.getBaseFile();

        if (!base.exists()) {
            return null;
        }

        byte[] raw;

        try (
            FileInputStream input =
                atomicFile.openRead();

            ByteArrayOutputStream output =
                new ByteArrayOutputStream()
        ) {

            byte[] buffer =
                new byte[
                    8192
                ];

            int read;

            int total =
                0;

            while (
                (
                    read =
                        input.read(
                            buffer
                        )
                ) !=
                    -1
            ) {

                total +=
                    read;

                if (
                    total >
                        MAX_RECOVERY_FILE_BYTES
                ) {

                    throw new IllegalStateException(
                        "FINORA Developer secure-store file is oversized."
                    );
                }

                output.write(
                    buffer,
                    0,
                    read
                );
            }

            raw =
                output.toByteArray();
        }

        if (
            raw.length ==
                0
        ) {

            throw new IllegalStateException(
                "FINORA Developer secure-store file is empty."
            );
        }

        JSONObject envelope =
            new JSONObject(
                new String(
                    raw,
                    StandardCharsets.UTF_8
                )
            );

        JSONObject record =
            decryptStoreEnvelope(
                envelope
            );

        validateStoreRecord(
            record
        );

        return record;
    }


    private synchronized void writeStore(
        JSONObject record
    ) throws Exception {

        validateStoreRecord(
            record
        );

        JSONObject envelope =
            encryptStoreEnvelope(
                record
            );

        byte[] bytes =
            envelope
                .toString()
                .getBytes(
                    StandardCharsets.UTF_8
                );

        AtomicFile atomicFile =
            getStoreFile();

        FileOutputStream output =
            null;

        try {

            output =
                atomicFile.startWrite();

            output.write(
                bytes
            );

            output.flush();

            atomicFile.finishWrite(
                output
            );

            output =
                null;
        }
        catch (Exception error) {

            if (output != null) {

                atomicFile.failWrite(
                    output
                );
            }

            throw error;
        }
        finally {

            Arrays.fill(
                bytes,
                (byte) 0
            );
        }
    }


    private static void validateStoreRecord(
        JSONObject record
    ) throws Exception {

        if (
            record == null ||
            record.length() !=
                9 ||
            record.optInt(
                "schemaVersion",
                -1
            ) !=
                STORE_SCHEMA_VERSION
        ) {

            throw new IllegalStateException(
                "FINORA Developer secure-store record is invalid."
            );
        }

        if (
            isBlank(
                record.optString(
                    "issuerId",
                    null
                )
            ) ||
            isBlank(
                record.optString(
                    "signingKeyId",
                    null
                )
            ) ||
            isBlank(
                record.optString(
                    "createdAt",
                    null
                )
            ) ||
            isBlank(
                record.optString(
                    "updatedAt",
                    null
                )
            ) ||
            record.optJSONObject(
                "vault"
            ) ==
                null ||
            record.optJSONObject(
                "verifier"
            ) ==
                null
        ) {

            throw new IllegalStateException(
                "FINORA Developer secure-store record fields are invalid."
            );
        }

        int failedAttempts =
            record.optInt(
                "failedAttempts",
                -1
            );

        long blockedUntil =
            record.optLong(
                "blockedUntil",
                -1L
            );

        if (
            failedAttempts <
                0 ||
            blockedUntil <
                0L
        ) {

            throw new IllegalStateException(
                "FINORA Developer secure-store throttle state is invalid."
            );
        }

        JSONObject vault =
            record.getJSONObject(
                "vault"
            );

        if (
            !record.getString(
                "issuerId"
            ).equals(
                vault.optString(
                    "issuerId",
                    null
                )
            ) ||
            !record.getString(
                "signingKeyId"
            ).equals(
                vault.optString(
                    "signingKeyId",
                    null
                )
            )
        ) {

            throw new IllegalStateException(
                "FINORA Developer secure-store authority binding is invalid."
            );
        }
    }


    // ========================================================
    // SESSION STATE
    // ========================================================

    private static long computeBackoffMs(
        int failedAttempts
    ) {

        int exponent =
            Math.min(
                Math.max(
                    failedAttempts - 1,
                    0
                ),
                6
            );

        long delay =
            BACKOFF_BASE_MS *
            (
                1L <<
                exponent
            );

        return Math.min(
            BACKOFF_MAX_MS,
            delay
        );
    }


    private JSObject createSessionState(
        JSONObject record
    ) {

        int failedAttempts =
            record == null
                ? 0
                : record.optInt(
                    "failedAttempts",
                    0
                );

        long blockedUntil =
            record == null
                ? 0L
                : record.optLong(
                    "blockedUntil",
                    0L
                );

        long retryAfter =
            Math.max(
                0L,
                blockedUntil -
                    System.currentTimeMillis()
            );

        JSObject state =
            new JSObject();

        state.put(
            "unlocked",
            unlocked
        );

        state.put(
            "failedAttempts",
            failedAttempts
        );

        state.put(
            "retryAfterMs",
            retryAfter
        );

        return state;
    }


    // ========================================================
    // SECURITY STATE
    // ========================================================

    @PluginMethod
    public void getDeveloperSecurityState(
        PluginCall call
    ) {

        try {

            JSONObject record =
                readStore();

            JSObject data =
                new JSObject();

            if (record == null) {

                data.put(
                    "bootstrapStatus",
                    "RECOVERY_REQUIRED"
                );

                data.put(
                    "authorityPresent",
                    false
                );

                data.put(
                    "securityCodeConfigured",
                    false
                );
            }
            else {

                data.put(
                    "bootstrapStatus",
                    "READY_WITH_EXISTING_AUTHORITY"
                );

                data.put(
                    "authorityPresent",
                    true
                );

                data.put(
                    "securityCodeConfigured",
                    true
                );
            }

            data.put(
                "session",
                createSessionState(
                    record
                )
            );

            resolveSuccess(
                call,
                data
            );
        }
        catch (Exception error) {

            unlocked =
                false;

            resolveFailure(
                call,
                messageOrDefault(
                    error,
                    "FINORA Android Developer security state could not be read."
                )
            );
        }
    }


    // ========================================================
    // FIRST SETUP — PICK AUTHENTICATED RECOVERY FILE
    // ========================================================

    @PluginMethod
    public void initializeDeveloperSecurityCodeFromAdminRecovery(
        PluginCall call
    ) {

        try {

            String adminCode =
                readRecoveryRequestString(call, "adminRecoverySecurityCode");

            String developerCode =
                readRecoveryRequestString(call, "newDeveloperSecurityCode");

            try {

                assertDeveloperCode(
                    developerCode
                );
            }
            catch (Exception error) {

                resolveEnrollmentFailure(
                    call,
                    "INVALID_DEVELOPER_SECURITY_CODE",
                    error.getMessage()
                );

                return;
            }
            /*
             * Match Desktop recovery UX:
             *
             * Open native file picker first.
             * The selected Recovery Bundle then authenticates
             * the Admin Recovery Security Code during decrypt.
             */

            if (
                readStore() !=
                    null
            ) {

                resolveEnrollmentFailure(
                    call,
                    "SECURITY_CODE_ALREADY_CONFIGURED",
                    "FINORA Developer Security Code is already configured."
                );

                return;
            }

            Intent intent =
                new Intent(
                    Intent.ACTION_OPEN_DOCUMENT
                );

            intent.addCategory(
                Intent.CATEGORY_OPENABLE
            );

            intent.setType(
                "*/*"
            );

            intent.addFlags(
                Intent.FLAG_GRANT_READ_URI_PERMISSION
            );

            startActivityForResult(
                call,
                intent,
                "adminRecoverySelected"
            );
        }
        catch (Exception error) {

            resolveEnrollmentFailure(
                call,
                "RECOVERY_FILE_IMPORT_FAILED",
                messageOrDefault(
                    error,
                    "FINORA Admin Authority Recovery file picker could not be opened."
                )
            );
        }
    }


    @ActivityCallback
    private void adminRecoverySelected(
        PluginCall call,
        ActivityResult result
    ) {

        if (call == null) {
            return;
        }

        if (
            result == null ||
            result.getResultCode() !=
                Activity.RESULT_OK
        ) {

            JSObject cancelled =
                new JSObject();

            cancelled.put(
                "success",
                false
            );

            cancelled.put(
                "cancelled",
                true
            );

            resolveSuccess(
                call,
                cancelled
            );

            return;
        }

        Intent data =
            result.getData();

        if (
            data == null ||
            data.getData() ==
                null
        ) {

            resolveEnrollmentFailure(
                call,
                "RECOVERY_FILE_IMPORT_FAILED",
                "Android did not return a FINORA Admin Authority Recovery file."
            );

            return;
        }

        Uri uri =
            data.getData();

        String adminCode =
            readRecoveryRequestString(call, "adminRecoverySecurityCode");

        String developerCode =
            readRecoveryRequestString(call, "newDeveloperSecurityCode");

        try {

            if (
                readStore() !=
                    null
            ) {

                resolveEnrollmentFailure(
                    call,
                    "SECURITY_CODE_ALREADY_CONFIGURED",
                    "FINORA Developer Security Code is already configured."
                );

                return;
            }

            String fileName =
                readDisplayName(
                    uri
                );

            if (
                fileName == null ||
                !fileName
                    .toLowerCase(
                        Locale.ROOT
                    )
                    .endsWith(
                        RECOVERY_EXTENSION
                    )
            ) {

                resolveEnrollmentFailure(
                    call,
                    "RECOVERY_FILE_IMPORT_FAILED",
                    "FINORA Admin Recovery file extension is invalid."
                );

                return;
            }

            byte[] fileBytes =
                readBoundedFile(
                    uri
                );

            final JSONObject bundle;

            try {

                bundle =
                    parseRecoveryBundle(
                        fileBytes
                    );
            }
            catch (
                InvalidRecoveryBundleException error
            ) {

                resolveEnrollmentFailure(
                    call,
                    "INVALID_RECOVERY_BUNDLE",
                    error.getMessage()
                );

                return;
            }
            finally {

                Arrays.fill(
                    fileBytes,
                    (byte) 0
                );
            }

            final JSONObject vault;

            try {

                vault =
                    decryptRecoveryBundle(
                        bundle,
                        adminCode
                    );
            }
            catch (
                RecoveryAuthenticationException error
            ) {

                resolveEnrollmentFailure(
                    call,
                    "RECOVERY_AUTHENTICATION_FAILED",
                    error.getMessage()
                );

                return;
            }
            catch (
                RecoveryAuthorityMismatchException error
            ) {

                resolveEnrollmentFailure(
                    call,
                    "RECOVERY_AUTHORITY_MISMATCH",
                    error.getMessage()
                );

                return;
            }

            final JSONObject verifier;

            try {

                verifier =
                    createDeveloperVerifier(
                        developerCode
                    );
            }
            catch (Exception error) {

                resolveEnrollmentFailure(
                    call,
                    "SECURITY_CODE_CONFIGURATION_FAILED",
                    messageOrDefault(
                        error,
                        "FINORA Developer Security Code could not be configured."
                    )
                );

                return;
            }

            String now =
                nowIso();

            JSONObject record =
                new JSONObject();

            record.put(
                "schemaVersion",
                STORE_SCHEMA_VERSION
            );

            record.put(
                "issuerId",
                vault.getString(
                    "issuerId"
                )
            );

            record.put(
                "signingKeyId",
                vault.getString(
                    "signingKeyId"
                )
            );

            record.put(
                "vault",
                vault
            );

            record.put(
                "verifier",
                verifier
            );

            record.put(
                "failedAttempts",
                0
            );

            record.put(
                "blockedUntil",
                0L
            );

            record.put(
                "createdAt",
                now
            );

            record.put(
                "updatedAt",
                now
            );

            try {

                writeStore(
                    record
                );
            }
            catch (Exception error) {
    String errorClass = error.getClass().getSimpleName();
    String errorMessage = error.getMessage();

    if (errorMessage == null || errorMessage.trim().isEmpty()) {
        errorMessage = "NO_MESSAGE";
    } else {
        errorMessage = errorMessage
            .replace('\r', ' ')
            .replace('\n', ' ')
            .replaceAll("[A-Za-z0-9+/=_-]{16,}", "[REDACTED]")
            .replaceAll("[^A-Za-z0-9 .,_:/()\\[\\]-]", "?")
            .trim();

        if (errorMessage.length() > 180) {
            errorMessage = errorMessage.substring(0, 180);
        }
    }

    resolveEnrollmentFailure(
        call,
        "RECOVERY_RESTORE_FAILED",
        "STORE_WRITE:" + errorClass + ":" + errorMessage
    );

    return;
}

            /*
             * Setup never auto-unlocks.
             */
            unlocked =
                false;

            JSObject enrollment =
                new JSObject();

            enrollment.put(
                "success",
                true
            );

            enrollment.put(
                "cancelled",
                false
            );

            enrollment.put(
                "status",
                "CONFIGURED"
            );

            enrollment.put(
                "issuerId",
                vault.getString(
                    "issuerId"
                )
            );

            enrollment.put(
                "authorityRestored",
                true
            );

            enrollment.put(
                "fileName",
                fileName
            );

            resolveSuccess(
                call,
                enrollment
            );
        }
        catch (Exception error) {

            resolveEnrollmentFailure(
                call,
                "RECOVERY_RESTORE_FAILED",
                messageOrDefault(
                    error,
                    "FINORA Control Center signing authority could not be restored."
                )
            );
        }
    }


    // ========================================================
    // UNLOCK
    // ========================================================

    @PluginMethod
    public void unlockDeveloperControlCenter(
        PluginCall call
    ) {

        try {

            JSONObject record =
                readStore();

            if (record == null) {

                JSObject failure =
                    unlockFailure(
                        "SECURITY_CODE_NOT_CONFIGURED",
                        0L,
                        null
                    );

                resolveSuccess(
                    call,
                    failure
                );

                return;
            }

            if (unlocked) {

                JSObject success =
                    new JSObject();

                success.put(
                    "success",
                    true
                );

                success.put(
                    "status",
                    "UNLOCKED"
                );

                success.put(
                    "state",
                    createSessionState(
                        record
                    )
                );

                resolveSuccess(
                    call,
                    success
                );

                return;
            }

            long now =
                System.currentTimeMillis();

            long blockedUntil =
                record.optLong(
                    "blockedUntil",
                    0L
                );

            long retryAfter =
                Math.max(
                    0L,
                    blockedUntil -
                        now
                );

            if (
                retryAfter >
                    0L
            ) {

                JSObject failure =
                    unlockFailure(
                        "RETRY_LATER",
                        retryAfter,
                        record
                    );

                resolveSuccess(
                    call,
                    failure
                );

                return;
            }

            String securityCode =
                call.getString(
                    "securityCode"
                );

            boolean verified =
                verifyDeveloperCode(
                    securityCode,
                    record.getJSONObject(
                        "verifier"
                    )
                );

            if (!verified) {

                int failedAttempts =
                    record.optInt(
                        "failedAttempts",
                        0
                    ) +
                    1;

                long backoff =
                    computeBackoffMs(
                        failedAttempts
                    );

                record.put(
                    "failedAttempts",
                    failedAttempts
                );

                record.put(
                    "blockedUntil",
                    now +
                        backoff
                );

                record.put(
                    "updatedAt",
                    nowIso()
                );

                writeStore(
                    record
                );

                JSObject failure =
                    unlockFailure(
                        "SECURITY_CODE_INVALID",
                        backoff,
                        record
                    );

                resolveSuccess(
                    call,
                    failure
                );

                return;
            }

            record.put(
                "failedAttempts",
                0
            );

            record.put(
                "blockedUntil",
                0L
            );

            record.put(
                "updatedAt",
                nowIso()
            );

            writeStore(
                record
            );

            unlocked =
                true;

            JSObject success =
                new JSObject();

            success.put(
                "success",
                true
            );

            success.put(
                "status",
                "UNLOCKED"
            );

            success.put(
                "state",
                createSessionState(
                    record
                )
            );

            resolveSuccess(
                call,
                success
            );
        }
        catch (Exception error) {

            unlocked =
                false;

            resolveFailure(
                call,
                messageOrDefault(
                    error,
                    "FINORA Developer Control Center unlock failed."
                )
            );
        }
    }


    // ========================================================
    // LOCK
    // ========================================================

    @PluginMethod
    public void lockDeveloperControlCenter(
        PluginCall call
    ) {

        unlocked =
            false;

        try {

            JSONObject record =
                readStore();

            JSObject data =
                new JSObject();

            data.put(
                "locked",
                true
            );

            data.put(
                "session",
                createSessionState(
                    record
                )
            );

            resolveSuccess(
                call,
                data
            );
        }
        catch (Exception error) {

            resolveFailure(
                call,
                messageOrDefault(
                    error,
                    "FINORA Developer Control Center lock state could not be read."
                )
            );
        }
    }


    // ========================================================
    // CHANGE DEVELOPER SECURITY CODE
    // ========================================================

    @PluginMethod
    public void changeDeveloperSecurityCode(
        PluginCall call
    ) {

        try {

            JSONObject record =
                readStore();

            if (record == null) {

                resolveSuccess(
                    call,
                    false
                );

                return;
            }

            String oldCode =
                call.getString(
                    "oldSecurityCode"
                );

            String newCode =
                call.getString(
                    "newDeveloperSecurityCode"
                );

            if (
                !verifyDeveloperCode(
                    oldCode,
                    record.getJSONObject(
                        "verifier"
                    )
                )
            ) {

                resolveSuccess(
                    call,
                    false
                );

                return;
            }

            JSONObject replacement =
                createDeveloperVerifier(
                    newCode
                );

            record.put(
                "verifier",
                replacement
            );

            record.put(
                "updatedAt",
                nowIso()
            );

            writeStore(
                record
            );

            resolveSuccess(
                call,
                true
            );
        }
        catch (Exception error) {

            resolveFailure(
                call,
                messageOrDefault(
                    error,
                    "FINORA Developer Security Code could not be changed."
                )
            );
        }
    }


    // ========================================================
    // RESULT HELPERS
    // ========================================================

    private JSObject unlockFailure(
        String errorCode,
        long retryAfterMs,
        JSONObject record
    ) {

        JSObject failure =
            new JSObject();

        failure.put(
            "success",
            false
        );

        failure.put(
            "errorCode",
            errorCode
        );

        failure.put(
            "retryAfterMs",
            retryAfterMs
        );

        failure.put(
            "state",
            createSessionState(
                record
            )
        );

        return failure;
    }


    private void resolveEnrollmentFailure(
        PluginCall call,
        String errorCode,
        String error
    ) {

        JSObject result =
            new JSObject();

        result.put(
            "success",
            false
        );

        result.put(
            "cancelled",
            false
        );

        result.put(
            "errorCode",
            errorCode
        );

        result.put(
            "error",
            error
        );

        resolveSuccess(
            call,
            result
        );
    }


    private static String messageOrDefault(
        Throwable error,
        String fallback
    ) {

        if (
            error != null &&
            error.getMessage() !=
                null &&
            !error.getMessage()
                .trim()
                .isEmpty()
        ) {

            return error.getMessage();
        }

        return fallback;
    }


    // ========================================================
    // NATIVE FILE PICKER HELPERS
    // ========================================================

    private String readDisplayName(
        Uri uri
    ) {

        ContentResolver resolver =
            getContext()
                .getContentResolver();

        try (
            Cursor cursor =
                resolver.query(
                    uri,
                    new String[] {
                        OpenableColumns.DISPLAY_NAME
                    },
                    null,
                    null,
                    null
                )
        ) {

            if (
                cursor != null &&
                cursor.moveToFirst()
            ) {

                int index =
                    cursor.getColumnIndex(
                        OpenableColumns.DISPLAY_NAME
                    );

                if (index >= 0) {

                    return cursor.getString(
                        index
                    );
                }
            }
        }

        return null;
    }


    private byte[] readBoundedFile(
        Uri uri
    ) throws Exception {

        ContentResolver resolver =
            getContext()
                .getContentResolver();

        try (
            InputStream input =
                resolver.openInputStream(
                    uri
                );

            ByteArrayOutputStream output =
                new ByteArrayOutputStream()
        ) {

            if (input == null) {

                throw new IllegalStateException(
                    "FINORA Admin Recovery file could not be opened."
                );
            }

            byte[] buffer =
                new byte[
                    8192
                ];

            int total =
                0;

            int read;

            while (
                (
                    read =
                        input.read(
                            buffer
                        )
                ) !=
                    -1
            ) {

                total +=
                    read;

                if (
                    total >
                        MAX_RECOVERY_FILE_BYTES
                ) {

                    throw new IllegalStateException(
                        "FINORA Admin Recovery file size is invalid."
                    );
                }

                output.write(
                    buffer,
                    0,
                    read
                );
            }

            return output
                .toByteArray();
        }
    }


    // ========================================================
    // PRIVILEGED OPERATIONAL SURFACE
    //
    // Security authority is implemented in 04B1.
    // Domain signing/registry/wallet operations remain locked
    // until their Android authority adapters are implemented.
    // ========================================================

    // ========================================================
    // CONTROL CENTER PUBLIC TRUST RECORD
    //
    // Must remain byte-compatible with Windows:
    //
    // SHA-256(SPKI DER)
    // -> canonical lowercase 64-char hex
    //
    // signingKeyId:
    // FINORA-KEY- +
    // first 24 fingerprint chars uppercased
    //
    // Private key never leaves this native boundary.
    // ========================================================

    private static String
    createControlCenterPublicKeyFingerprint(
        String publicKeySpkiDerBase64
    ) throws Exception {

        if (
            publicKeySpkiDerBase64 == null ||
            publicKeySpkiDerBase64.isEmpty()
        ) {

            throw new IllegalStateException(
                "FINORA Control Center public signing key is unavailable."
            );
        }

        final byte[] publicKeyBytes;

        try {

            publicKeyBytes =
                Base64.decode(
                    publicKeySpkiDerBase64,
                    Base64.DEFAULT
                );
        }
        catch (
            IllegalArgumentException error
        ) {

            throw new IllegalStateException(
                "FINORA Control Center public signing key is invalid."
            );
        }

        try {

            if (
                publicKeyBytes.length == 0 ||
                !Base64.encodeToString(
                    publicKeyBytes,
                    Base64.NO_WRAP
                ).equals(
                    publicKeySpkiDerBase64
                )
            ) {

                throw new IllegalStateException(
                    "FINORA Control Center public signing key is not canonical Base64."
                );
            }

            MessageDigest digest =
                MessageDigest.getInstance(
                    "SHA-256"
                );

            byte[] fingerprintBytes =
                digest.digest(
                    publicKeyBytes
                );

            try {

                final char[] hex =
                    "0123456789abcdef"
                        .toCharArray();

                char[] output =
                    new char[
                        fingerprintBytes.length *
                        2
                    ];

                for (
                    int index = 0;
                    index < fingerprintBytes.length;
                    index++
                ) {

                    int value =
                        fingerprintBytes[index] &
                        0xff;

                    output[
                        index * 2
                    ] =
                        hex[
                            value >>> 4
                        ];

                    output[
                        index * 2 + 1
                    ] =
                        hex[
                            value & 0x0f
                        ];
                }

                String fingerprint =
                    new String(
                        output
                    );

                if (
                    !fingerprint.matches(
                        "^[0-9a-f]{64}$"
                    )
                ) {

                    throw new IllegalStateException(
                        "FINORA Control Center public-key fingerprint is invalid."
                    );
                }

                return fingerprint;
            }
            finally {

                Arrays.fill(
                    fingerprintBytes,
                    (byte) 0
                );
            }
        }
        finally {

            Arrays.fill(
                publicKeyBytes,
                (byte) 0
            );
        }
    }


    private static String
    createControlCenterSigningKeyId(
        String publicKeyFingerprint
    ) {

        if (
            publicKeyFingerprint == null ||
            !publicKeyFingerprint.matches(
                "^[0-9a-f]{64}$"
            )
        ) {

            throw new IllegalStateException(
                "FINORA Control Center signing-key fingerprint is invalid."
            );
        }

        return (
            "FINORA-KEY-" +
            publicKeyFingerprint
                .substring(
                    0,
                    24
                )
                .toUpperCase(
                    Locale.ROOT
                )
        );
    }


    private JSObject createControlCenterTrustRecord()
        throws Exception {

        JSONObject record =
            readStore();

        if (record == null) {

            throw new IllegalStateException(
                "FINORA Developer Control Center authority is not configured."
            );
        }

        JSONObject vault =
            record.getJSONObject(
                "vault"
            );

        String privateKey =
            vault.getString(
                "privateKeyPkcs8DerBase64"
            );

        String publicKey =
            vault.getString(
                "publicKeySpkiDerBase64"
            );

        /*
         * Re-prove that the currently stored public identity belongs
         * to the exact encrypted private signing authority.
         */
        validateSigningPair(
            privateKey,
            publicKey
        );

        String fingerprint =
            createControlCenterPublicKeyFingerprint(
                publicKey
            );

        String expectedSigningKeyId =
            createControlCenterSigningKeyId(
                fingerprint
            );

        String actualSigningKeyId =
            vault.getString(
                "signingKeyId"
            );

        if (
            !expectedSigningKeyId.equals(
                actualSigningKeyId
            )
        ) {

            throw new IllegalStateException(
                "FINORA Control Center trust-record signingKeyId does not match the active public key."
            );
        }

        String issuerId =
            vault.getString(
                "issuerId"
            );

        String createdAt =
            vault.getString(
                "createdAt"
            );

        JSObject result =
            new JSObject();

        result.put(
            "issuerId",
            issuerId
        );

        result.put(
            "signingKeyId",
            actualSigningKeyId
        );

        result.put(
            "algorithm",
            "ECDSA_P256_SHA256"
        );

        result.put(
            "format",
            "SPKI_DER_BASE64"
        );

        result.put(
            "publicKey",
            publicKey
        );

        result.put(
            "fingerprintAlgorithm",
            "SHA-256"
        );

        result.put(
            "publicKeyFingerprint",
            fingerprint
        );

        result.put(
            "status",
            "ACTIVE"
        );

        result.put(
            "validFrom",
            createdAt
        );

        result.put(
            "createdAt",
            createdAt
        );

        result.put(
            "schemaVersion",
            1
        );

        return result;
    }

    private void resolvePrivilegedUnavailable(
        PluginCall call
    ) {

        if (!unlocked) {

            resolveFailure(
                call,
                "FINORA Developer Control Center privileged authority is locked."
            );

            return;
        }

        resolveFailure(
            call,
            "FINORA Android Developer operational authority is not initialized yet."
        );
    }


    private static final int PORTABLE_STATE_TRANSFER_MAX_BYTES =
        48 * 1024 * 1024;


    @PluginMethod
    public void exportPortableState(
        PluginCall call
    ) {

        if (!unlocked) {

            resolveFailure(
                call,
                "FINORA Developer Control Center privileged authority is locked."
            );

            return;
        }


        String transferCode =
            call.getString(
                "transferCode"
            );


        if (
            transferCode == null ||
            transferCode.length() < 12 ||
            transferCode.length() > 128 ||
            !transferCode.equals(
                transferCode.trim()
            )
        ) {

            resolveFailure(
                call,
                "FINORA Portable State Transfer Code is invalid."
            );

            return;
        }


        try {

            FinoraPortableStateAuthorityStore authorityStore =
                new FinoraPortableStateAuthorityStore(
                    getContext()
                );

            FinoraPortableStateAuthorityStore.Snapshot snapshot =
                authorityStore.load();


            if (snapshot == null) {

                throw new IllegalStateException(
                    "Import a verified FINORA Portable State before Android export."
                );
            }


            JSONObject controlCenterRecord =
                readStore();


            if (controlCenterRecord == null) {

                throw new IllegalStateException(
                    "FINORA Developer Control Center signing authority is unavailable."
                );
            }


            JSONObject vault =
                controlCenterRecord.getJSONObject(
                    "vault"
                );


            FinoraAndroidPortableStateExporter.Result preview =
                FinoraAndroidPortableStateExporter.create(
                    getContext(),
                    snapshot,
                    vault,
                    transferCode
                );


            android.content.Intent intent =
                new android.content.Intent(
                    android.content.Intent.ACTION_CREATE_DOCUMENT
                );

            intent.addCategory(
                android.content.Intent.CATEGORY_OPENABLE
            );

            intent.setType(
                "application/octet-stream"
            );

            intent.putExtra(
                android.content.Intent.EXTRA_TITLE,
                preview.suggestedFileName
            );

            intent.addFlags(
                android.content.Intent.FLAG_GRANT_READ_URI_PERMISSION |
                android.content.Intent.FLAG_GRANT_WRITE_URI_PERMISSION
            );


            startActivityForResult(
                call,
                intent,
                "portableStateExportSelected"
            );
        }
        catch (Exception error) {

            resolveFailure(
                call,
                messageOrDefault(
                    error,
                    "FINORA Portable State export could not be prepared."
                )
            );
        }
    }


    @com.getcapacitor.annotation.ActivityCallback
    private void portableStateExportSelected(
        PluginCall call,
        androidx.activity.result.ActivityResult result
    ) {

        if (call == null) {
            return;
        }


        if (
            result == null ||
            result.getResultCode() !=
                android.app.Activity.RESULT_OK
        ) {

            JSObject cancelled =
                new JSObject();

            cancelled.put(
                "status",
                "CANCELLED"
            );

            resolveSuccess(
                call,
                cancelled
            );

            return;
        }


        try {

            android.content.Intent data =
                result.getData();

            android.net.Uri uri =
                data == null
                    ? null
                    : data.getData();


            if (uri == null) {

                throw new IllegalStateException(
                    "FINORA Portable State export returned no destination file."
                );
            }


            String transferCode =
                call.getString(
                    "transferCode"
                );


            FinoraPortableStateAuthorityStore authorityStore =
                new FinoraPortableStateAuthorityStore(
                    getContext()
                );

            FinoraPortableStateAuthorityStore.Snapshot snapshot =
                authorityStore.load();


            if (snapshot == null) {

                throw new IllegalStateException(
                    "FINORA Portable State authority disappeared before export."
                );
            }


            JSONObject controlCenterRecord =
                readStore();


            if (controlCenterRecord == null) {

                throw new IllegalStateException(
                    "FINORA Developer Control Center signing authority is unavailable."
                );
            }


            JSONObject vault =
                controlCenterRecord.getJSONObject(
                    "vault"
                );


            FinoraAndroidPortableStateExporter.Result exported =
                FinoraAndroidPortableStateExporter.create(
                    getContext(),
                    snapshot,
                    vault,
                    transferCode
                );


            java.io.OutputStream output =
                getContext()
                    .getContentResolver()
                    .openOutputStream(
                        uri,
                        "wt"
                    );


            if (output == null) {

                throw new IllegalStateException(
                    "FINORA Portable State destination could not be opened."
                );
            }


            try {

                output.write(
                    exported.transferBytes
                );

                output.flush();
            }
            finally {

                output.close();
            }


            /*
             * Durability boundary:
             * only after the .finora bytes are externalized do we
             * advance the Android Portable State lineage head.
             */
            JSONObject trustRecord =
                createControlCenterTrustRecord();

            FinoraPortableStateEnvelopeVerifier.VerifiedEnvelope verified =
                FinoraPortableStateEnvelopeVerifier.verify(
                    exported.serializedEnvelope,
                    trustRecord.getString(
                        "issuerId"
                    ),
                    trustRecord.getString(
                        "signingKeyId"
                    ),
                    trustRecord.getString(
                        "publicKey"
                    )
                );


            authorityStore.adoptVerifiedEnvelope(
                verified
            );


            JSObject response =
                new JSObject();

            response.put(
                "status",
                "EXPORTED"
            );

            response.put(
                "bytes",
                exported.transferBytes.length
            );

            response.put(
                "stateGeneration",
                exported.stateGeneration
            );

            response.put(
                "payloadSha256",
                exported.payloadSha256
            );

            response.put(
                "parentPayloadSha256",
                exported.parentPayloadSha256
            );

            response.put(
                "transferBundleSha256",
                exported.transferBundleSha256
            );


            resolveSuccess(
                call,
                response
            );
        }
        catch (Exception error) {

            resolveFailure(
                call,
                messageOrDefault(
                    error,
                    "FINORA Portable State export failed."
                )
            );
        }
    }


    @PluginMethod
    public void importPortableState(
        PluginCall call
    ) {

        if (!unlocked) {

            resolveFailure(
                call,
                "FINORA Developer Control Center privileged authority is locked."
            );

            return;
        }


        String transferCode =
            call.getString(
                "transferCode"
            );


        if (
            transferCode == null ||
            transferCode.length() < 12 ||
            transferCode.length() > 128 ||
            !transferCode.equals(
                transferCode.trim()
            )
        ) {

            resolveFailure(
                call,
                "FINORA Portable State Transfer Code is invalid."
            );

            return;
        }


        try {

            android.content.Intent intent =
                new android.content.Intent(
                    android.content.Intent.ACTION_OPEN_DOCUMENT
                );

            intent.addCategory(
                android.content.Intent.CATEGORY_OPENABLE
            );

            intent.setType(
                "*/*"
            );

            intent.addFlags(
                android.content.Intent.FLAG_GRANT_READ_URI_PERMISSION
            );


            startActivityForResult(
                call,
                intent,
                "portableStateSelected"
            );
        }
        catch (Exception error) {

            resolveFailure(
                call,
                messageOrDefault(
                    error,
                    "FINORA Portable State file picker could not be opened."
                )
            );
        }
    }


    @com.getcapacitor.annotation.ActivityCallback
    private void portableStateSelected(
        PluginCall call,
        androidx.activity.result.ActivityResult result
    ) {

        if (call == null) {
            return;
        }


        if (
            result == null ||
            result.getResultCode() !=
                android.app.Activity.RESULT_OK
        ) {

            JSObject cancelled =
                new JSObject();

            cancelled.put(
                "status",
                "CANCELLED"
            );

            resolveSuccess(
                call,
                cancelled
            );

            return;
        }


        android.content.Intent data =
            result.getData();

        android.net.Uri uri =
            data == null
                ? null
                : data.getData();


        if (uri == null) {

            resolveFailure(
                call,
                "FINORA Portable State file selection is invalid."
            );

            return;
        }


        String transferCode =
            call.getString(
                "transferCode"
            );


        try {

            String serializedTransfer =
                readPortableStateTransferFile(
                    uri
                );


            String serializedEnvelope =
                FinoraPortableStateTransferCrypto
                    .decryptSerializedSignedEnvelope(
                        serializedTransfer,
                        transferCode
                    );


            JSObject trustRecord =
                createControlCenterTrustRecord();


            String issuerId =
                trustRecord.getString(
                    "issuerId"
                );

            String signingKeyId =
                trustRecord.getString(
                    "signingKeyId"
                );

            String publicKey =
                trustRecord.getString(
                    "publicKey"
                );


            FinoraPortableStateEnvelopeVerifier.VerifiedEnvelope verified =
                FinoraPortableStateEnvelopeVerifier.verify(
                    serializedEnvelope,
                    issuerId,
                    signingKeyId,
                    publicKey
                );


            FinoraPortableStateAuthorityStore authorityStore =
                new FinoraPortableStateAuthorityStore(
                    getContext()
                );


            FinoraPortableStateAuthorityStore.AdoptionResult adoption =
                authorityStore.adoptVerifiedEnvelope(
                    verified
                );


            JSONObject verifiedWalletHistory =
                verified.payload.optJSONObject(
                    "walletHistory"
                );

            if (verifiedWalletHistory == null) {

                throw new IllegalStateException(
                    "FINORA verified Portable State Wallet History domain is missing."
                );
            }


            org.json.JSONArray verifiedWalletHistoryRecords =
                verifiedWalletHistory.optJSONArray(
                    "records"
                );

            if (verifiedWalletHistoryRecords == null) {

                throw new IllegalStateException(
                    "FINORA verified Portable State Wallet History records are missing."
                );
            }


            FinoraDeveloperControlCenterOperationalStore operationalStore =
                new FinoraDeveloperControlCenterOperationalStore(
                    getContext()
                );

            operationalStore.mergeWalletHistory(
                verifiedWalletHistoryRecords
            );


            FinoraPortableStateAuthorityStore.Snapshot persisted =
                authorityStore.load();


            if (persisted == null) {

                throw new IllegalStateException(
                    "FINORA Portable State adoption did not persist."
                );
            }


            JSObject response =
                new JSObject();


            response.put(
                "status",
                String.valueOf(
                    adoption.status
                )
            );


            response.put(
                "stateGeneration",
                persisted.headGeneration
            );


            response.put(
                "payloadSha256",
                persisted.headPayloadSha256
            );


            if (
                persisted.importedParentPayloadSha256 !=
                    null
            ) {

                response.put(
                    "parentPayloadSha256",
                    persisted.importedParentPayloadSha256
                );
            }


            resolveSuccess(
                call,
                response
            );
        }
        catch (Exception error) {

            resolveFailure(
                call,
                messageOrDefault(
                    error,
                    "FINORA Portable State import failed."
                )
            );
        }
    }


    private String readPortableStateTransferFile(
        android.net.Uri uri
    ) throws Exception {

        android.content.ContentResolver resolver =
            getContext()
                .getContentResolver();


        java.io.InputStream input =
            resolver.openInputStream(
                uri
            );


        if (input == null) {

            throw new IllegalStateException(
                "FINORA Portable State file could not be opened."
            );
        }


        java.io.ByteArrayOutputStream output =
            new java.io.ByteArrayOutputStream();

        byte[] buffer =
            new byte[
                16 * 1024
            ];

        byte[] bytes =
            null;


        try {

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
                        PORTABLE_STATE_TRANSFER_MAX_BYTES
                ) {

                    throw new IllegalStateException(
                        "FINORA Portable State transfer file is too large."
                    );
                }


                output.write(
                    buffer,
                    0,
                    read
                );
            }


            bytes =
                output.toByteArray();


            if (
                bytes.length <= 0 ||
                bytes.length >
                    PORTABLE_STATE_TRANSFER_MAX_BYTES
            ) {

                throw new IllegalStateException(
                    "FINORA Portable State transfer file size is invalid."
                );
            }


            return new String(
                bytes,
                java.nio.charset.StandardCharsets.UTF_8
            );
        }
        finally {

            try {

                input.close();
            }
            finally {

                output.close();

                java.util.Arrays.fill(
                    buffer,
                    (byte) 0
                );


                if (bytes != null) {

                    java.util.Arrays.fill(
                        bytes,
                        (byte) 0
                    );
                }
            }
        }
    }

    @PluginMethod
    public void getTrustRecord(
        PluginCall call
    ) {

        if (!unlocked) {

            resolveFailure(
                call,
                "FINORA Developer Control Center privileged authority is locked."
            );

            return;
        }

        try {

            resolveSuccess(
                call,
                createControlCenterTrustRecord()
            );
        }
        catch (Exception error) {

            resolveFailure(
                call,
                messageOrDefault(
                    error,
                    "FINORA Control Center trust identity could not be loaded."
                )
            );
        }
    }

    @PluginMethod
    public void exportTrustRecord(
        PluginCall call
    ) {

        if (!unlocked) {
            resolveFailure(
                call,
                "FINORA Developer Control Center privileged authority is locked."
            );
            return;
        }

        try {
            android.content.Intent intent =
                new android.content.Intent(
                    android.content.Intent.ACTION_CREATE_DOCUMENT
                );

            intent.addCategory(
                android.content.Intent.CATEGORY_OPENABLE
            );

            intent.setType(
                "application/json"
            );

            intent.putExtra(
                android.content.Intent.EXTRA_TITLE,
                "FINORA-Control-Center-Trust-Record.json"
            );

            intent.addFlags(
                android.content.Intent.FLAG_GRANT_READ_URI_PERMISSION |
                android.content.Intent.FLAG_GRANT_WRITE_URI_PERMISSION
            );

            startActivityForResult(
                call,
                intent,
                "trustRecordExportSelected"
            );
        }
        catch (Exception error) {
            resolveFailure(
                call,
                messageOrDefault(
                    error,
                    "Unable to prepare the FINORA Control Center trust-record export."
                )
            );
        }
    }


    @com.getcapacitor.annotation.ActivityCallback
    private void trustRecordExportSelected(
        PluginCall call,
        androidx.activity.result.ActivityResult result
    ) {

        if (call == null) {
            return;
        }

        if (
            result == null ||
            result.getResultCode() !=
                android.app.Activity.RESULT_OK
        ) {
            JSObject cancelled =
                new JSObject();

            cancelled.put(
                "cancelled",
                true
            );

            resolveSuccess(
                call,
                cancelled
            );

            return;
        }

        if (!unlocked) {
            resolveFailure(
                call,
                "FINORA Developer Control Center privileged authority is locked."
            );
            return;
        }

        byte[] bytes =
            null;

        try {
            android.content.Intent resultData =
                result.getData();

            android.net.Uri resultUri =
                resultData == null
                    ? null
                    : resultData.getData();

            if (resultUri == null) {
                throw new IllegalStateException(
                    "FINORA trust-record export returned no destination file."
                );
            }

            JSONObject trustRecord =
                createControlCenterTrustRecord();

            bytes =
                trustRecord
                    .toString(2)
                    .getBytes(
                        java.nio.charset.StandardCharsets.UTF_8
                    );

            java.io.OutputStream output =
                getContext()
                    .getContentResolver()
                    .openOutputStream(
                        resultUri,
                        "wt"
                    );

            if (output == null) {
                throw new IllegalStateException(
                    "FINORA trust-record destination could not be opened."
                );
            }

            try {
                output.write(
                    bytes
                );

                output.flush();
            }
            finally {
                output.close();
            }

            JSObject response =
                new JSObject();

            response.put(
                "cancelled",
                false
            );

            response.put(
                "fileName",
                "FINORA-Control-Center-Trust-Record.json"
            );

            response.put(
                "bytesWritten",
                bytes.length
            );

            resolveSuccess(
                call,
                response
            );
        }
        catch (Exception error) {
            resolveFailure(
                call,
                messageOrDefault(
                    error,
                    "Unable to export the FINORA Control Center trust record."
                )
            );
        }
        finally {
            if (bytes != null) {
                java.util.Arrays.fill(
                    bytes,
                    (byte) 0
                );
            }
        }
    }

    @PluginMethod
    public void getBranchRegistry(
        PluginCall call
    ) {

        if (!unlocked) {

            resolveFailure(
                call,
                "FINORA Developer Control Center privileged authority is locked."
            );

            return;
        }


        try {

            FinoraPortableStateAuthorityStore store =
                new FinoraPortableStateAuthorityStore(
                    getContext()
                );

            FinoraPortableStateAuthorityStore.Snapshot snapshot =
                store.load();


            /*
             * No imported Portable State yet:
             * preserve the truthful pre-portability behavior.
             */
            if (snapshot == null) {

                resolveSuccess(
                    call,
                    null
                );

                return;
            }


            Object importedRegistry =
                snapshot.payload.opt(
                    "branchRegistry"
                );


            if (
                importedRegistry == null ||
                importedRegistry == JSONObject.NULL
            ) {

                resolveSuccess(
                    call,
                    null
                );

                return;
            }


            if (
                !(importedRegistry instanceof JSONObject)
            ) {

                throw new IllegalStateException(
                    "FINORA imported Branch Registry domain is invalid."
                );
            }


            resolveSuccess(
                call,
                new JSONObject(
                    importedRegistry.toString()
                )
            );
        }
        catch (Exception error) {

            resolveFailure(
                call,
                messageOrDefault(
                    error,
                    "FINORA imported Branch Registry could not be loaded."
                )
            );
        }
    }

@PluginMethod
    public void getBranchDirectoryMetadata(
        PluginCall call
    ) {

        if (!unlocked) {

            resolveFailure(
                call,
                "FINORA Developer Control Center privileged authority is locked."
            );

            return;
        }


        try {

            FinoraPortableStateAuthorityStore store =
                new FinoraPortableStateAuthorityStore(
                    getContext()
                );

            FinoraPortableStateAuthorityStore.Snapshot snapshot =
                store.load();


            /*
             * No imported Portable State yet:
             * preserve the truthful pre-portability behavior.
             */
            if (snapshot == null) {

                resolveSuccess(
                    call,
                    new JSONArray()
                );

                return;
            }


            Object importedDirectoryDomain =
                snapshot.payload.opt(
                    "branchDirectoryMetadata"
                );


            Object importedDirectory =
                importedDirectoryDomain instanceof JSONObject
                    ? ((JSONObject) importedDirectoryDomain).opt(
                        "records"
                    )
                    : importedDirectoryDomain;


            if (
                importedDirectory == null ||
                importedDirectory == JSONObject.NULL
            ) {

                resolveSuccess(
                    call,
                    new JSONArray()
                );

                return;
            }


            if (
                !(importedDirectory instanceof JSONArray)
            ) {

                throw new IllegalStateException(
                    "FINORA imported Branch Directory domain is invalid."
                );
            }


            resolveSuccess(
                call,
                new JSONArray(
                    importedDirectory.toString()
                )
            );
        }
        catch (Exception error) {

            resolveFailure(
                call,
                messageOrDefault(
                    error,
                    "FINORA imported Branch Directory Metadata could not be loaded."
                )
            );
        }
    }

@PluginMethod
    public void getFinoraIncomePricing(
        PluginCall call
    ) {

        if (!unlocked) {

            resolveFailure(
                call,
                "FINORA Developer Control Center privileged authority is locked."
            );

            return;
        }

        try {

            FinoraDeveloperControlCenterOperationalStore store =
                new FinoraDeveloperControlCenterOperationalStore(
                    getContext()
                );

            resolveSuccess(
                call,
                store.getIncomePricing()
            );
        }
        catch (Exception error) {

            resolveFailure(
                call,
                messageOrDefault(
                    error,
                    "FINORA Income Pricing could not be loaded."
                )
            );
        }
    }

    @PluginMethod
    public void updateFinoraIncomePricing(
        PluginCall call
    ) {

        if (!unlocked) {

            resolveFailure(
                call,
                "FINORA Developer Control Center privileged authority is locked."
            );

            return;
        }

        try {

            FinoraDeveloperControlCenterOperationalStore store =
                new FinoraDeveloperControlCenterOperationalStore(
                    getContext()
                );

            resolveSuccess(
                call,
                store.updateIncomePricing(
                    call.getData()
                )
            );
        }
        catch (Exception error) {

            resolveFailure(
                call,
                messageOrDefault(
                    error,
                    "FINORA Income Pricing could not be updated."
                )
            );
        }
    }

    @PluginMethod
    public void getFinoraBranchPricing(
        PluginCall call
    ) {

        if (!unlocked) {

            resolveFailure(
                call,
                "FINORA Developer Control Center privileged authority is locked."
            );

            return;
        }

        try {

            FinoraDeveloperControlCenterOperationalStore store =
                new FinoraDeveloperControlCenterOperationalStore(
                    getContext()
                );

            resolveSuccess(
                call,
                store.getBranchPricing(
                    call.getData()
                )
            );
        }
        catch (Exception error) {

            resolveFailure(
                call,
                messageOrDefault(
                    error,
                    "FINORA Branch Pricing could not be loaded."
                )
            );
        }
    }

    @PluginMethod
    public void updateFinoraBranchPricing(
        PluginCall call
    ) {

        if (!unlocked) {

            resolveFailure(
                call,
                "FINORA Developer Control Center privileged authority is locked."
            );

            return;
        }

        try {

            FinoraDeveloperControlCenterOperationalStore store =
                new FinoraDeveloperControlCenterOperationalStore(
                    getContext()
                );

            resolveSuccess(
                call,
                store.updateBranchPricing(
                    call.getData()
                )
            );
        }
        catch (Exception error) {

            resolveFailure(
                call,
                messageOrDefault(
                    error,
                    "FINORA Branch Pricing could not be updated."
                )
            );
        }
    }

    @PluginMethod
    public void getWalletHistory(
        PluginCall call
    ) {

        if (!unlocked) {

            resolveFailure(
                call,
                "FINORA Developer Control Center privileged authority is locked."
            );

            return;
        }

        try {

            FinoraDeveloperControlCenterOperationalStore store =
                new FinoraDeveloperControlCenterOperationalStore(
                    getContext()
                );

            resolveSuccess(
                call,
                store.getWalletHistory()
            );
        }
        catch (Exception error) {

            resolveFailure(
                call,
                messageOrDefault(
                    error,
                    "FINORA Wallet History could not be loaded."
                )
            );
        }
    }

    @PluginMethod
    public void backfillHistoricalEnrollmentBranch(PluginCall call) {
        resolvePrivilegedUnavailable(call);
    }

    @PluginMethod
    public void openBranchCertificationRotationRequest(PluginCall call) {
        resolvePrivilegedUnavailable(call);
    }

    @PluginMethod
    public void issueAndExportBranchCertificationRotation(PluginCall call) {
        resolvePrivilegedUnavailable(call);
    }

    @PluginMethod
    public void openInstallationEnrollmentRequest(PluginCall call) {
        resolvePrivilegedUnavailable(call);
    }

    // ========================================================
    // VERIFIED WALLET RECHARGE REQUEST SESSION
    // ========================================================

    private FinoraAndroidWalletRechargeRequestVerifier.VerifiedRequest
        verifiedWalletRechargeRequestSession;

    private String
        verifiedWalletRechargeRequestFileName;

    private String
        verifiedWalletRechargeRequestUri;

    private int
        verifiedWalletRechargeRequestBytesRead;


    @PluginMethod
    public void openWalletRechargeRequest(
        PluginCall call
    ) {

        if (!unlocked) {

            resolveFailure(
                call,
                "FINORA Developer Control Center privileged authority is locked."
            );

            return;
        }

        try {

            android.content.Intent intent =
                new android.content.Intent(
                    android.content.Intent.ACTION_OPEN_DOCUMENT
                );

            intent.addCategory(
                android.content.Intent.CATEGORY_OPENABLE
            );

            intent.setType(
                "*/*"
            );

            intent.addFlags(
                android.content.Intent.FLAG_GRANT_READ_URI_PERMISSION
            );

            startActivityForResult(
                call,
                intent,
                "walletRechargeRequestSelected"
            );
        }
        catch (Exception error) {

            resolveFailure(
                call,
                messageOrDefault(
                    error,
                    "FINORA Wallet Recharge Request file picker could not be opened."
                )
            );
        }
    }


    @com.getcapacitor.annotation.ActivityCallback
    private void walletRechargeRequestSelected(
        PluginCall call,
        androidx.activity.result.ActivityResult result
    ) {

        if (call == null) {
            return;
        }

        if (
            result == null ||
            result.getResultCode() !=
                android.app.Activity.RESULT_OK
        ) {

            try {

                JSObject cancelled =
                    new JSObject();

                cancelled.put(
                    "cancelled",
                    true
                );

                resolveSuccess(
                    call,
                    cancelled
                );
            }
            catch (Exception error) {

                resolveFailure(
                    call,
                    messageOrDefault(
                        error,
                        "FINORA Wallet Recharge Request cancellation could not be returned."
                    )
                );
            }

            return;
        }

        try {

            android.content.Intent data =
                result.getData();

            android.net.Uri uri =
                data != null
                    ? data.getData()
                    : null;

            if (uri == null) {
                throw new IllegalStateException(
                    "FINORA Wallet Recharge Request selection returned no file."
                );
            }

            String fileName =
                readWalletRechargeRequestFileName(
                    uri
                );

            byte[] bytes =
                readWalletRechargeRequestBytes(
                    uri
                );

            if (
                bytes.length <= 0 ||
                bytes.length >
                    FinoraAndroidWalletRechargeRequestVerifier
                        .MAX_FILE_BYTES
            ) {
                throw new IllegalStateException(
                    "FINORA Wallet Recharge Request file size is invalid."
                );
            }

            JSONObject envelope =
                new JSONObject(
                    new String(
                        bytes,
                        StandardCharsets.UTF_8
                    )
                );

            FinoraPortableStateAuthorityStore store =
                new FinoraPortableStateAuthorityStore(
                    getContext()
                );

            FinoraPortableStateAuthorityStore.Snapshot snapshot =
                store.load();

            if (snapshot == null) {
                throw new IllegalStateException(
                    "Import verified FINORA Portable State before opening Wallet Recharge Requests."
                );
            }

            Object registryValue =
                snapshot.payload.opt(
                    "branchRegistry"
                );

            if (
                !(registryValue instanceof JSONObject)
            ) {
                throw new IllegalStateException(
                    "FINORA imported Branch Registry authority is unavailable."
                );
            }

            JSONObject registry =
                new JSONObject(
                    registryValue.toString()
                );

            FinoraAndroidWalletRechargeRequestVerifier.VerifiedRequest
                verified =
                    FinoraAndroidWalletRechargeRequestVerifier
                        .verify(
                            envelope,
                            registry
                        );

            /*
             * Replace the previous session only after complete
             * cryptographic verification succeeds.
             */
            verifiedWalletRechargeRequestSession =
                verified;

            verifiedWalletRechargeRequestFileName =
                fileName;

            verifiedWalletRechargeRequestUri =
                uri.toString();

            verifiedWalletRechargeRequestBytesRead =
                bytes.length;

            JSObject response =
                new JSObject();

            response.put(
                "cancelled",
                false
            );

            response.put(
                "fileName",
                fileName
            );

            response.put(
                "bytesRead",
                bytes.length
            );

            response.put(
                "requestId",
                verified.requestId
            );

            response.put(
                "paymentReference",
                verified.paymentReference
            );

            response.put(
                "ownerId",
                verified.ownerId
            );

            response.put(
                "businessId",
                verified.businessId
            );

            response.put(
                "branchId",
                verified.branchId
            );

            response.put(
                "businessCode",
                verified.businessCode
            );

            response.put(
                "branchCode",
                verified.branchCode
            );

            response.put(
                "installationId",
                verified.installationId
            );

            response.put(
                "bindingKeyId",
                verified.bindingKeyId
            );

            response.put(
                "fingerprintAlgorithm",
                "SHA-256"
            );

            response.put(
                "publicKeyFingerprint",
                verified.publicKeyFingerprint
            );

            response.put(
                "amountMinor",
                verified.amountMinor
            );

            response.put(
                "currency",
                "INR"
            );

            response.put(
                "paymentMethod",
                verified.paymentMethod
            );

            response.put(
                "paymentSource",
                verified.paymentSource
            );

            response.put(
                "requestedAt",
                verified.requestedAt
            );

            resolveSuccess(
                call,
                response
            );
        }
        catch (Exception error) {

            resolveFailure(
                call,
                messageOrDefault(
                    error,
                    "Unable to open and verify the FINORA Wallet Recharge Request."
                )
            );
        }
    }


    private byte[] readWalletRechargeRequestBytes(
        android.net.Uri uri
    ) throws Exception {

        ContentResolver resolver =
            getContext()
                .getContentResolver();

        try (
            InputStream input =
                resolver.openInputStream(
                    uri
                );

            ByteArrayOutputStream output =
                new ByteArrayOutputStream()
        ) {

            if (input == null) {
                throw new IllegalStateException(
                    "FINORA Wallet Recharge Request file could not be opened."
                );
            }

            byte[] buffer =
                new byte[
                    8192
                ];

            int total =
                0;

            int read;

            while (
                (
                    read =
                        input.read(
                            buffer
                        )
                ) != -1
            ) {

                total +=
                    read;

                if (
                    total >
                        FinoraAndroidWalletRechargeRequestVerifier
                            .MAX_FILE_BYTES
                ) {
                    throw new IllegalStateException(
                        "FINORA Wallet Recharge Request exceeds the supported 64 KiB file size limit."
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
    }


    private String readWalletRechargeRequestFileName(
        android.net.Uri uri
    ) {

        ContentResolver resolver =
            getContext()
                .getContentResolver();

        android.database.Cursor cursor =
            null;

        try {

            cursor =
                resolver.query(
                    uri,
                    new String[] {
                        android.provider.OpenableColumns.DISPLAY_NAME
                    },
                    null,
                    null,
                    null
                );

            if (
                cursor != null &&
                cursor.moveToFirst()
            ) {

                int index =
                    cursor.getColumnIndex(
                        android.provider.OpenableColumns.DISPLAY_NAME
                    );

                if (index >= 0) {

                    String value =
                        cursor.getString(
                            index
                        );

                    if (
                        value != null &&
                        !value.trim().isEmpty()
                    ) {
                        return value;
                    }
                }
            }
        }
        catch (Exception ignored) {
        }
        finally {

            if (cursor != null) {
                cursor.close();
            }
        }

        String fallback =
            uri.getLastPathSegment();

        if (
            fallback == null ||
            fallback.trim().isEmpty()
        ) {
            return "FINORA-WAL-REQ.finora";
        }

        return fallback;
    }

    private static final class PendingWalletRechargeApprovalExport {

        final FinoraAndroidWalletRechargeRequestVerifier.VerifiedRequest
            request;

        final String
            importedRequestFileName;

        final String
            importedRequestUri;

        final int
            importedRequestBytesRead;

        final String
            suggestedFileName;

        final FinoraAndroidWalletRechargeApprovalIssuer.ApprovalResult
            approval;

        PendingWalletRechargeApprovalExport(
            FinoraAndroidWalletRechargeRequestVerifier.VerifiedRequest request,
            String importedRequestFileName,
            String importedRequestUri,
            int importedRequestBytesRead,
            String suggestedFileName,
            FinoraAndroidWalletRechargeApprovalIssuer.ApprovalResult approval
        ) {

            this.request =
                request;

            this.importedRequestFileName =
                importedRequestFileName;

            this.importedRequestUri =
                importedRequestUri;

            this.importedRequestBytesRead =
                importedRequestBytesRead;

            this.suggestedFileName =
                suggestedFileName;

            this.approval =
                approval;
        }
    }


    private PendingWalletRechargeApprovalExport
        pendingWalletRechargeApprovalExport;


    @PluginMethod
    public void approveAndExportWalletRechargeRequest(
        PluginCall call
    ) {

        if (!unlocked) {

            resolveFailure(
                call,
                "FINORA Developer Control Center privileged authority is locked."
            );

            return;
        }


        if (
            pendingWalletRechargeApprovalExport != null ||
            pendingWalletRechargeDeclineExport != null
        ) {

            resolveFailure(
                call,
                "A FINORA Wallet Recharge decision export is already in progress."
            );

            return;
        }


        FinoraAndroidWalletRechargeRequestVerifier.VerifiedRequest request =
            verifiedWalletRechargeRequestSession;

        String importedFileName =
            verifiedWalletRechargeRequestFileName;

        String importedUri =
            verifiedWalletRechargeRequestUri;

        int importedBytesRead =
            verifiedWalletRechargeRequestBytesRead;


        if (
            request == null ||
            importedFileName == null ||
            importedFileName.trim().isEmpty() ||
            importedUri == null ||
            importedUri.trim().isEmpty() ||
            importedBytesRead <= 0
        ) {

            resolveFailure(
                call,
                "Import and cryptographically verify a FINORA Wallet Recharge Request before approval."
            );

            return;
        }


        verifiedWalletRechargeRequestSession =
            null;

        verifiedWalletRechargeRequestFileName =
            null;

        verifiedWalletRechargeRequestUri =
            null;

        verifiedWalletRechargeRequestBytesRead =
            0;


        try {

            FinoraPortableStateAuthorityStore portableStore =
                new FinoraPortableStateAuthorityStore(
                    getContext()
                );

            FinoraPortableStateAuthorityStore.Snapshot snapshot =
                portableStore.load();

            if (snapshot == null) {
                throw new IllegalStateException(
                    "Verified FINORA Portable State is required before Wallet Recharge approval."
                );
            }


            createControlCenterTrustRecord();


            JSONObject controlCenterRecord =
                readStore();

            if (controlCenterRecord == null) {
                throw new IllegalStateException(
                    "FINORA Developer Control Center signing authority is unavailable."
                );
            }


            JSONObject vault =
                controlCenterRecord.getJSONObject(
                    "vault"
                );


            FinoraAndroidWalletRechargeApprovalIssuer.ApprovalResult approval =
                FinoraAndroidWalletRechargeApprovalIssuer.issue(
                    getContext(),
                    request,
                    snapshot,
                    vault.getString(
                        "issuerId"
                    ),
                    vault.getString(
                        "signingKeyId"
                    ),
                    vault.getString(
                        "privateKeyPkcs8DerBase64"
                    )
                );


            String suggestedFileName =
                createWalletRechargeDecisionFileName(
                    request,
                    "DONE"
                );


            pendingWalletRechargeApprovalExport =
                new PendingWalletRechargeApprovalExport(
                    request,
                    importedFileName,
                    importedUri,
                    importedBytesRead,
                    suggestedFileName,
                    approval
                );


            android.content.Intent intent =
                new android.content.Intent(
                    android.content.Intent.ACTION_CREATE_DOCUMENT
                );

            intent.addCategory(
                android.content.Intent.CATEGORY_OPENABLE
            );

            intent.setType(
                "application/octet-stream"
            );

            intent.putExtra(
                android.content.Intent.EXTRA_TITLE,
                suggestedFileName
            );

            intent.addFlags(
                android.content.Intent.FLAG_GRANT_READ_URI_PERMISSION |
                android.content.Intent.FLAG_GRANT_WRITE_URI_PERMISSION
            );


            startActivityForResult(
                call,
                intent,
                "walletRechargeApprovalExportSelected"
            );
        }
        catch (Exception error) {

            pendingWalletRechargeApprovalExport =
                null;

            restoreVerifiedWalletRechargeRequestIfVacant(
                request,
                importedFileName,
                importedUri,
                importedBytesRead
            );

            resolveFailure(
                call,
                messageOrDefault(
                    error,
                    "Unable to prepare the signed FINORA Wallet Recharge approval."
                )
            );
        }
    }


    @com.getcapacitor.annotation.ActivityCallback
    private void walletRechargeApprovalExportSelected(
        PluginCall call,
        androidx.activity.result.ActivityResult result
    ) {

        if (call == null) {
            return;
        }


        PendingWalletRechargeApprovalExport pending =
            pendingWalletRechargeApprovalExport;


        if (pending == null) {

            resolveFailure(
                call,
                "FINORA Wallet Recharge approval export session is unavailable."
            );

            return;
        }


        if (
            result == null ||
            result.getResultCode() !=
                android.app.Activity.RESULT_OK
        ) {

            pendingWalletRechargeApprovalExport =
                null;

            restoreVerifiedWalletRechargeRequestIfVacant(
                pending.request,
                pending.importedRequestFileName,
                pending.importedRequestUri,
                pending.importedRequestBytesRead
            );


            JSObject cancelled =
                new JSObject();

            cancelled.put(
                "cancelled",
                true
            );

            resolveSuccess(
                call,
                cancelled
            );

            return;
        }


        boolean resultExternalized =
            false;


        try {

            android.content.Intent resultData =
                result.getData();

            android.net.Uri resultUri =
                resultData == null
                    ? null
                    : resultData.getData();


            if (resultUri == null) {
                throw new IllegalStateException(
                    "FINORA Wallet Recharge approval export returned no destination file."
                );
            }


            java.io.OutputStream output =
                getContext()
                    .getContentResolver()
                    .openOutputStream(
                        resultUri,
                        "wt"
                    );


            if (output == null) {
                throw new IllegalStateException(
                    "FINORA Wallet Recharge approval destination could not be opened."
                );
            }


            try {

                output.write(
                    pending.approval.serializedBytes
                );

                output.flush();
            }
            finally {

                output.close();
            }


            resultExternalized =
                true;


            String actualFileName =
                readWalletRechargeExportFileName(
                    resultUri,
                    pending.suggestedFileName
                );

            String resultUriText =
                resultUri.toString();


            JSONObject history =
                new JSONObject();

            history.put(
                "historyId",
                "FINORA-WALLET-HISTORY-" +
                    pending.approval.controlBundlePackageId
            );

            history.put(
                "decision",
                "APPROVED"
            );

            history.put(
                "ownerId",
                pending.request.ownerId
            );

            history.put(
                "businessId",
                pending.request.businessId
            );

            history.put(
                "branchId",
                pending.request.branchId
            );

            history.put(
                "businessCode",
                pending.request.businessCode
            );

            history.put(
                "branchCode",
                pending.request.branchCode
            );

            history.put(
                "installationId",
                pending.request.installationId
            );

            history.put(
                "bindingKeyId",
                pending.request.bindingKeyId
            );

            history.put(
                "fingerprintAlgorithm",
                "SHA-256"
            );

            history.put(
                "publicKeyFingerprint",
                pending.request.publicKeyFingerprint
            );

            history.put(
                "requestId",
                pending.request.requestId
            );

            history.put(
                "paymentReference",
                pending.request.paymentReference
            );

            history.put(
                "amountMinor",
                pending.request.amountMinor
            );

            history.put(
                "currency",
                "INR"
            );

            history.put(
                "paymentMethod",
                pending.request.paymentMethod
            );

            history.put(
                "paymentSource",
                pending.request.paymentSource
            );

            history.put(
                "requestedAt",
                pending.request.requestedAt
            );

            history.put(
                "decisionAt",
                pending.approval.decisionAt
            );

            history.put(
                "recordedAt",
                FinoraAndroidControlCenterIssuanceAuthorityStore
                    .canonicalNow()
            );

            history.put(
                "controlBundlePackageId",
                pending.approval.controlBundlePackageId
            );

            history.put(
                "importedRequestFileName",
                pending.importedRequestFileName
            );

            history.put(
                "importedRequestFilePath",
                pending.importedRequestUri
            );

            history.put(
                "exportedResultFileName",
                actualFileName
            );

            history.put(
                "exportedResultFilePath",
                resultUriText
            );

            history.put(
                "schemaVersion",
                1
            );


            FinoraDeveloperControlCenterOperationalStore operationalStore =
                new FinoraDeveloperControlCenterOperationalStore(
                    getContext()
                );

            operationalStore.appendWalletHistory(
                history
            );


            pendingWalletRechargeApprovalExport =
                null;


            JSObject response =
                new JSObject();

            response.put(
                "cancelled",
                false
            );

            response.put(
                "fileName",
                actualFileName
            );

            response.put(
                "bytesWritten",
                pending.approval.serializedBytes.length
            );

            response.put(
                "requestId",
                pending.request.requestId
            );

            response.put(
                "paymentReference",
                pending.request.paymentReference
            );

            response.put(
                "controlBundlePackageId",
                pending.approval.controlBundlePackageId
            );


            resolveSuccess(
                call,
                response
            );
        }
        catch (Exception error) {

            pendingWalletRechargeApprovalExport =
                null;


            if (!resultExternalized) {

                restoreVerifiedWalletRechargeRequestIfVacant(
                    pending.request,
                    pending.importedRequestFileName,
                    pending.importedRequestUri,
                    pending.importedRequestBytesRead
                );
            }


            String fallback =
                resultExternalized
                    ? (
                        "The signed FINORA Wallet Recharge approval file was exported, " +
                        "but local Wallet History persistence failed. " +
                        "Do not approve this Request again."
                    )
                    : "Unable to export the signed FINORA Wallet Recharge approval.";


            resolveFailure(
                call,
                messageOrDefault(
                    error,
                    fallback
                )
            );
        }
    }


    private void restoreVerifiedWalletRechargeRequestIfVacant(
        FinoraAndroidWalletRechargeRequestVerifier.VerifiedRequest request,
        String fileName,
        String uri,
        int bytesRead
    ) {

        if (verifiedWalletRechargeRequestSession != null) {
            return;
        }

        verifiedWalletRechargeRequestSession =
            request;

        verifiedWalletRechargeRequestFileName =
            fileName;

        verifiedWalletRechargeRequestUri =
            uri;

        verifiedWalletRechargeRequestBytesRead =
            bytesRead;
    }


    private String readWalletRechargeExportFileName(
        android.net.Uri uri,
        String fallback
    ) {

        android.database.Cursor cursor =
            null;

        try {

            cursor =
                getContext()
                    .getContentResolver()
                    .query(
                        uri,
                        new String[] {
                            android.provider.OpenableColumns.DISPLAY_NAME
                        },
                        null,
                        null,
                        null
                    );

            if (
                cursor != null &&
                cursor.moveToFirst()
            ) {

                int index =
                    cursor.getColumnIndex(
                        android.provider.OpenableColumns.DISPLAY_NAME
                    );

                if (index >= 0) {

                    String value =
                        cursor.getString(
                            index
                        );

                    if (
                        value != null &&
                        !value.trim().isEmpty()
                    ) {
                        return value;
                    }
                }
            }
        }
        catch (Exception ignored) {
        }
        finally {

            if (cursor != null) {
                cursor.close();
            }
        }

        return fallback;
    }


    private String createWalletRechargeDecisionFileName(
        FinoraAndroidWalletRechargeRequestVerifier.VerifiedRequest request,
        String outcome
    ) {

        if (
            !"DONE".equals(outcome) &&
            !"NOT".equals(outcome)
        ) {
            throw new IllegalArgumentException(
                "FINORA Wallet Recharge decision outcome is invalid."
            );
        }


        String businessToken =
            walletRechargeBusinessCodeToken(
                request.businessCode
            );

        String branchToken =
            walletRechargeBranchCodeToken(
                request.branchCode
            );

        String paymentToken =
            walletRechargePaymentMethodToken(
                request.paymentMethod
            );


        if (
            request.amountMinor <= 0L ||
            request.amountMinor > 9_007_199_254_740_991L
        ) {
            throw new IllegalArgumentException(
                "FINORA Wallet Recharge amount is invalid for filename generation."
            );
        }


        long wholeRupees =
            request.amountMinor /
            100L;

        long paise =
            request.amountMinor %
            100L;


        String amountToken =
            paise == 0L
                ? Long.toString(
                    wholeRupees
                )
                : (
                    Long.toString(
                        wholeRupees
                    ) +
                    "P" +
                    String.format(
                        java.util.Locale.ROOT,
                        "%02d",
                        paise
                    )
                );


        String prefix =
            "FINORA-WAL-REQ-";

        String digest =
            request.requestId.startsWith(
                prefix
            )
                ? request.requestId.substring(
                    prefix.length()
                )
                : request.requestId;


        String requestToken =
            digest
                .toUpperCase(
                    java.util.Locale.ROOT
                )
                .replaceAll(
                    "[^A-F0-9]",
                    ""
                );


        if (requestToken.length() < 6) {
            throw new IllegalArgumentException(
                "FINORA Wallet Recharge Request ID cannot produce a safe short result token."
            );
        }


        return (
            "FIN-WAL-" +
            outcome +
            "-" +
            businessToken +
            "-" +
            branchToken +
            "-" +
            paymentToken +
            "-" +
            amountToken +
            "-" +
            requestToken.substring(
                0,
                6
            ) +
            "_" +
            new java.text.SimpleDateFormat(
                "dd-MM-yyyy_HH-mm",
                java.util.Locale.US
            ).format(
                new java.util.Date()
            ) +
            ".finora"
        );
    }


    private String walletRechargeBusinessCodeToken(
        String value
    ) {

        String token =
            value == null
                ? ""
                : value
                    .trim()
                    .toUpperCase(
                        java.util.Locale.ROOT
                    )
                    .replaceAll(
                        "[^A-Z0-9]",
                        ""
                    );


        if (token.length() > 16) {

            token =
                token.substring(
                    0,
                    16
                );
        }


        return token.isEmpty()
            ? "BUS"
            : token;
    }


    private String walletRechargeBranchCodeToken(
        String value
    ) {

        String normalized =
            value == null
                ? ""
                : value
                    .trim()
                    .toUpperCase(
                        java.util.Locale.ROOT
                    );


        String numericPart =
            normalized.replaceAll(
                "[^0-9]",
                ""
            );


        if (!numericPart.isEmpty()) {

            while (numericPart.length() < 3) {

                numericPart =
                    "0" +
                    numericPart;
            }


            String numericToken =
                "BR" +
                numericPart;


            return numericToken.length() > 18
                ? numericToken.substring(
                    0,
                    18
                )
                : numericToken;
        }


        String fallback =
            normalized.replaceAll(
                "[^A-Z0-9]",
                ""
            );


        if (fallback.length() > 16) {

            fallback =
                fallback.substring(
                    0,
                    16
                );
        }


        return fallback.isEmpty()
            ? "BRANCH"
            : fallback;
    }


    private String walletRechargePaymentMethodToken(
        String value
    ) {

        String token =
            value == null
                ? ""
                : value
                    .trim()
                    .toUpperCase(
                        java.util.Locale.ROOT
                    )
                    .replaceAll(
                        "[^A-Z0-9]",
                        ""
                    );


        return token.length() > 20
            ? token.substring(
                0,
                20
            )
            : token;
    }


    private static final class PendingWalletRechargeDeclineExport {

        final FinoraAndroidWalletRechargeRequestVerifier.VerifiedRequest
            request;

        final String
            importedRequestFileName;

        final String
            importedRequestUri;

        final int
            importedRequestBytesRead;

        final String
            suggestedFileName;

        final FinoraAndroidWalletRechargeApprovalIssuer.DeclineResult
            decline;

        PendingWalletRechargeDeclineExport(
            FinoraAndroidWalletRechargeRequestVerifier.VerifiedRequest request,
            String importedRequestFileName,
            String importedRequestUri,
            int importedRequestBytesRead,
            String suggestedFileName,
            FinoraAndroidWalletRechargeApprovalIssuer.DeclineResult decline
        ) {

            this.request =
                request;

            this.importedRequestFileName =
                importedRequestFileName;

            this.importedRequestUri =
                importedRequestUri;

            this.importedRequestBytesRead =
                importedRequestBytesRead;

            this.suggestedFileName =
                suggestedFileName;

            this.decline =
                decline;
        }
    }


    private PendingWalletRechargeDeclineExport
        pendingWalletRechargeDeclineExport;


    @PluginMethod
    public void declineAndExportWalletRechargeRequest(
        PluginCall call
    ) {

        if (!unlocked) {

            resolveFailure(
                call,
                "FINORA Developer Control Center privileged authority is locked."
            );

            return;
        }


        if (
            pendingWalletRechargeApprovalExport != null ||
            pendingWalletRechargeDeclineExport != null
        ) {

            resolveFailure(
                call,
                "A FINORA Wallet Recharge decision export is already in progress."
            );

            return;
        }


        FinoraAndroidWalletRechargeRequestVerifier.VerifiedRequest request =
            verifiedWalletRechargeRequestSession;

        String importedFileName =
            verifiedWalletRechargeRequestFileName;

        String importedUri =
            verifiedWalletRechargeRequestUri;

        int importedBytesRead =
            verifiedWalletRechargeRequestBytesRead;


        if (
            request == null ||
            importedFileName == null ||
            importedFileName.trim().isEmpty() ||
            importedUri == null ||
            importedUri.trim().isEmpty() ||
            importedBytesRead <= 0
        ) {

            resolveFailure(
                call,
                "Import and cryptographically verify a FINORA Wallet Recharge Request before decline."
            );

            return;
        }


        /*
         * Atomically take the exact verified request before async
         * decline issuance/export. Cancellation or pre-export failure
         * may restore it only if a newer verified request has not
         * already occupied the session.
         */
        verifiedWalletRechargeRequestSession =
            null;

        verifiedWalletRechargeRequestFileName =
            null;

        verifiedWalletRechargeRequestUri =
            null;

        verifiedWalletRechargeRequestBytesRead =
            0;


        try {

            FinoraPortableStateAuthorityStore portableStore =
                new FinoraPortableStateAuthorityStore(
                    getContext()
                );

            FinoraPortableStateAuthorityStore.Snapshot snapshot =
                portableStore.load();

            if (snapshot == null) {
                throw new IllegalStateException(
                    "Verified FINORA Portable State is required before Wallet Recharge decline."
                );
            }


            /*
             * Re-prove the encrypted private/public signing authority.
             */
            createControlCenterTrustRecord();


            JSONObject controlCenterRecord =
                readStore();

            if (controlCenterRecord == null) {
                throw new IllegalStateException(
                    "FINORA Developer Control Center signing authority is unavailable."
                );
            }


            JSONObject vault =
                controlCenterRecord.getJSONObject(
                    "vault"
                );


            FinoraAndroidWalletRechargeApprovalIssuer.DeclineResult decline =
                FinoraAndroidWalletRechargeApprovalIssuer.issueDecline(
                    getContext(),
                    request,
                    snapshot,
                    vault.getString(
                        "issuerId"
                    ),
                    vault.getString(
                        "signingKeyId"
                    ),
                    vault.getString(
                        "privateKeyPkcs8DerBase64"
                    )
                );


            String suggestedFileName =
                createWalletRechargeDecisionFileName(
                    request,
                    "NOT"
                );


            pendingWalletRechargeDeclineExport =
                new PendingWalletRechargeDeclineExport(
                    request,
                    importedFileName,
                    importedUri,
                    importedBytesRead,
                    suggestedFileName,
                    decline
                );


            android.content.Intent intent =
                new android.content.Intent(
                    android.content.Intent.ACTION_CREATE_DOCUMENT
                );

            intent.addCategory(
                android.content.Intent.CATEGORY_OPENABLE
            );

            intent.setType(
                "application/octet-stream"
            );

            intent.putExtra(
                android.content.Intent.EXTRA_TITLE,
                suggestedFileName
            );

            intent.addFlags(
                android.content.Intent.FLAG_GRANT_READ_URI_PERMISSION |
                android.content.Intent.FLAG_GRANT_WRITE_URI_PERMISSION
            );


            startActivityForResult(
                call,
                intent,
                "walletRechargeDeclineExportSelected"
            );
        }
        catch (Exception error) {

            pendingWalletRechargeDeclineExport =
                null;

            restoreVerifiedWalletRechargeRequestIfVacant(
                request,
                importedFileName,
                importedUri,
                importedBytesRead
            );

            resolveFailure(
                call,
                messageOrDefault(
                    error,
                    "Unable to prepare the signed FINORA Wallet Recharge decline."
                )
            );
        }
    }


    @com.getcapacitor.annotation.ActivityCallback
    private void walletRechargeDeclineExportSelected(
        PluginCall call,
        androidx.activity.result.ActivityResult result
    ) {

        if (call == null) {
            return;
        }


        PendingWalletRechargeDeclineExport pending =
            pendingWalletRechargeDeclineExport;


        if (pending == null) {

            resolveFailure(
                call,
                "FINORA Wallet Recharge decline export session is unavailable."
            );

            return;
        }


        if (
            result == null ||
            result.getResultCode() !=
                android.app.Activity.RESULT_OK
        ) {

            pendingWalletRechargeDeclineExport =
                null;

            restoreVerifiedWalletRechargeRequestIfVacant(
                pending.request,
                pending.importedRequestFileName,
                pending.importedRequestUri,
                pending.importedRequestBytesRead
            );


            JSObject cancelled =
                new JSObject();

            cancelled.put(
                "cancelled",
                true
            );

            resolveSuccess(
                call,
                cancelled
            );

            return;
        }


        boolean resultExternalized =
            false;


        try {

            android.content.Intent resultData =
                result.getData();

            android.net.Uri resultUri =
                resultData == null
                    ? null
                    : resultData.getData();


            if (resultUri == null) {
                throw new IllegalStateException(
                    "FINORA Wallet Recharge decline export returned no destination file."
                );
            }


            java.io.OutputStream output =
                getContext()
                    .getContentResolver()
                    .openOutputStream(
                        resultUri,
                        "wt"
                    );


            if (output == null) {
                throw new IllegalStateException(
                    "FINORA Wallet Recharge decline destination could not be opened."
                );
            }


            try {

                output.write(
                    pending.decline.serializedBytes
                );

                output.flush();
            }
            finally {

                output.close();
            }


            /*
             * The signed NOT result now exists outside Control Center.
             * Never restore the original Request after this point merely
             * because local Wallet History persistence fails.
             */
            resultExternalized =
                true;


            String actualFileName =
                readWalletRechargeExportFileName(
                    resultUri,
                    pending.suggestedFileName
                );

            String resultUriText =
                resultUri.toString();


            JSONObject history =
                new JSONObject();

            history.put(
                "historyId",
                "FINORA-WALLET-HISTORY-" +
                    pending.decline.controlBundlePackageId
            );

            history.put(
                "decision",
                "DECLINED"
            );

            history.put(
                "ownerId",
                pending.request.ownerId
            );

            history.put(
                "businessId",
                pending.request.businessId
            );

            history.put(
                "branchId",
                pending.request.branchId
            );

            history.put(
                "businessCode",
                pending.request.businessCode
            );

            history.put(
                "branchCode",
                pending.request.branchCode
            );

            history.put(
                "installationId",
                pending.request.installationId
            );

            history.put(
                "bindingKeyId",
                pending.request.bindingKeyId
            );

            history.put(
                "fingerprintAlgorithm",
                "SHA-256"
            );

            history.put(
                "publicKeyFingerprint",
                pending.request.publicKeyFingerprint
            );

            history.put(
                "requestId",
                pending.request.requestId
            );

            history.put(
                "paymentReference",
                pending.request.paymentReference
            );

            history.put(
                "amountMinor",
                pending.request.amountMinor
            );

            history.put(
                "currency",
                "INR"
            );

            history.put(
                "paymentMethod",
                pending.request.paymentMethod
            );

            history.put(
                "paymentSource",
                pending.request.paymentSource
            );

            history.put(
                "requestedAt",
                pending.request.requestedAt
            );

            history.put(
                "decisionAt",
                pending.decline.decisionAt
            );

            history.put(
                "recordedAt",
                FinoraAndroidControlCenterIssuanceAuthorityStore
                    .canonicalNow()
            );

            history.put(
                "controlBundlePackageId",
                pending.decline.controlBundlePackageId
            );

            history.put(
                "importedRequestFileName",
                pending.importedRequestFileName
            );

            history.put(
                "importedRequestFilePath",
                pending.importedRequestUri
            );

            history.put(
                "exportedResultFileName",
                actualFileName
            );

            history.put(
                "exportedResultFilePath",
                resultUriText
            );

            history.put(
                "schemaVersion",
                1
            );


            FinoraDeveloperControlCenterOperationalStore operationalStore =
                new FinoraDeveloperControlCenterOperationalStore(
                    getContext()
                );

            operationalStore.appendWalletHistory(
                history
            );


            pendingWalletRechargeDeclineExport =
                null;


            JSObject response =
                new JSObject();

            response.put(
                "cancelled",
                false
            );

            response.put(
                "fileName",
                actualFileName
            );

            response.put(
                "bytesWritten",
                pending.decline.serializedBytes.length
            );

            response.put(
                "requestId",
                pending.request.requestId
            );

            response.put(
                "paymentReference",
                pending.request.paymentReference
            );

            response.put(
                "controlBundlePackageId",
                pending.decline.controlBundlePackageId
            );


            resolveSuccess(
                call,
                response
            );
        }
        catch (Exception error) {

            pendingWalletRechargeDeclineExport =
                null;


            if (!resultExternalized) {

                restoreVerifiedWalletRechargeRequestIfVacant(
                    pending.request,
                    pending.importedRequestFileName,
                    pending.importedRequestUri,
                    pending.importedRequestBytesRead
                );
            }


            String fallback =
                resultExternalized
                    ? (
                        "The signed FINORA Wallet Recharge decline file was exported, " +
                        "but local Wallet History persistence failed. " +
                        "Do not process this Request again."
                    )
                    : "Unable to export the signed FINORA Wallet Recharge decline.";


            resolveFailure(
                call,
                messageOrDefault(
                    error,
                    fallback
                )
            );
        }
    }

    @PluginMethod
    public void issueAndExportInstallationEnrollmentResponse(PluginCall call) {
        resolvePrivilegedUnavailable(call);
    }

    @PluginMethod
    public void issueBranchActivation(PluginCall call) {
        resolvePrivilegedUnavailable(call);
    }

    @PluginMethod
    public void issueBranchAccess(PluginCall call) {
        resolvePrivilegedUnavailable(call);
    }

    @PluginMethod
    public void issueBranchDeviceRevocation(PluginCall call) {
        resolvePrivilegedUnavailable(call);
    }

    @PluginMethod
    public void issueStorageEntitlement(PluginCall call) {
        resolvePrivilegedUnavailable(call);
    }

    @PluginMethod
    public void issuePortableStorageEntitlement(PluginCall call) {
        resolvePrivilegedUnavailable(call);
    }

    @PluginMethod
    public void issueBusinessProfile(PluginCall call) {
        resolvePrivilegedUnavailable(call);
    }

    @PluginMethod
    public void issuePricingPolicy(PluginCall call) {
        resolvePrivilegedUnavailable(call);
    }

    @PluginMethod
    public void issueWalletRecharge(PluginCall call) {
        resolvePrivilegedUnavailable(call);
    }

    @PluginMethod
    public void issueAndExportControlBundle(PluginCall call) {
        resolvePrivilegedUnavailable(call);
    }

    @PluginMethod
    public void exportAdminAuthorityRecovery(PluginCall call) {
        resolvePrivilegedUnavailable(call);
    }

    @PluginMethod
    public void importAndRecoverAdminAuthority(PluginCall call) {
        resolvePrivilegedUnavailable(call);
    }
}