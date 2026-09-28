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
import java.security.KeyStore;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Iterator;
import java.util.Set;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;


/*
 * ============================================================
 * FINORA ANDROID PORTABLE STATE AUTHORITY STORE
 * ============================================================
 *
 * One encrypted AtomicFile owns:
 * - verified imported Portable State payload
 * - accepted lineage generation
 * - accepted payload SHA-256
 * - imported parent digest
 * - issuer/signing-key binding
 *
 * Existing OperationalStore V1 remains untouched.
 *
 * Encryption:
 * - AndroidKeyStore AES-256
 * - GCM / NoPadding
 * - provider-generated IV
 * - exact local AAD
 *
 * Import semantics:
 * - fresh receiver may adopt any positive verified generation
 * - exact same generation/digest is idempotent
 * - same generation/different digest rejects
 * - stale generation rejects
 * - foreign issuer/signing key rejects
 * - forward import requires exact current-head parent
 * ============================================================
 */
final class FinoraPortableStateAuthorityStore {

    private static final Object LOCK =
        new Object();

    private static final String STORE_FORMAT =
        "FINORA_ANDROID_PORTABLE_STATE_AUTHORITY_V1";

    private static final int STORE_SCHEMA_VERSION =
        1;

    private static final String DIRECTORY_NAME =
        "finora-control-center";

    private static final String FILE_NAME =
        "finora-portable-state-authority.bin";

    private static final String ANDROID_KEYSTORE =
        "AndroidKeyStore";

    private static final String KEY_ALIAS =
        "FINORA_CONTROL_CENTER_PORTABLE_STATE_AUTHORITY_AES_V1";

    private static final String CIPHER_TRANSFORMATION =
        "AES/GCM/NoPadding";

    private static final int GCM_TAG_BITS =
        128;

    private static final int IV_BYTES =
        12;

    private static final int MAX_ENCRYPTED_FILE_BYTES =
        48 * 1024 * 1024;

    private static final int MAX_PLAINTEXT_BYTES =
        32 * 1024 * 1024;

    private static final long MAX_SAFE_INTEGER =
        9007199254740991L;


    enum AdoptionStatus {
        ADOPTED,
        ALREADY_ADOPTED
    }


    static final class Snapshot {

        final String issuerId;
        final String signingKeyId;
        final long headGeneration;
        final String headPayloadSha256;
        final String importedParentPayloadSha256;
        final JSONObject payload;


        Snapshot(
            String issuerId,
            String signingKeyId,
            long headGeneration,
            String headPayloadSha256,
            String importedParentPayloadSha256,
            JSONObject payload
        ) {

            this.issuerId =
                issuerId;

            this.signingKeyId =
                signingKeyId;

            this.headGeneration =
                headGeneration;

            this.headPayloadSha256 =
                headPayloadSha256;

            this.importedParentPayloadSha256 =
                importedParentPayloadSha256;

            this.payload =
                cloneObject(
                    payload
                );
        }
    }


    static final class AdoptionResult {

        final AdoptionStatus status;
        final Snapshot snapshot;


        AdoptionResult(
            AdoptionStatus status,
            Snapshot snapshot
        ) {

            this.status =
                status;

            this.snapshot =
                snapshot;
        }
    }


    private final AtomicFile atomicFile;


    FinoraPortableStateAuthorityStore(
        Context context
    ) {

        if (context == null) {

            throw new IllegalArgumentException(
                "FINORA Portable State context is required."
            );
        }


        File directory =
            new File(
                context.getFilesDir(),
                DIRECTORY_NAME
            );


        if (
            !directory.exists() &&
            !directory.mkdirs() &&
            !directory.isDirectory()
        ) {

            throw new IllegalStateException(
                "FINORA Portable State authority directory could not be created."
            );
        }


        this.atomicFile =
            new AtomicFile(
                new File(
                    directory,
                    FILE_NAME
                )
            );
    }


    Snapshot load()
        throws Exception {

        synchronized (LOCK) {

            return readSnapshot();
        }
    }


    AdoptionResult adoptVerifiedEnvelope(
        FinoraPortableStateEnvelopeVerifier.VerifiedEnvelope verified
    ) throws Exception {

        if (verified == null) {

            throw new IllegalArgumentException(
                "FINORA verified Portable State envelope is required."
            );
        }


        synchronized (LOCK) {

            Snapshot incoming =
                snapshotFromVerified(
                    verified
                );


            Snapshot current =
                readSnapshot();


            if (current == null) {

                writeSnapshot(
                    incoming
                );


                Snapshot persisted =
                    requirePersistedExact(
                        incoming
                    );


                return new AdoptionResult(
                    AdoptionStatus.ADOPTED,
                    persisted
                );
            }


            if (
                !current.issuerId.equals(
                    incoming.issuerId
                ) ||
                !current.signingKeyId.equals(
                    incoming.signingKeyId
                )
            ) {

                throw new IllegalStateException(
                    "FINORA Portable State authority is bound to another recovered signing authority."
                );
            }


            if (
                incoming.headGeneration ==
                    current.headGeneration
            ) {

                if (
                    incoming.headPayloadSha256.equals(
                        current.headPayloadSha256
                    )
                ) {

                    return new AdoptionResult(
                        AdoptionStatus.ALREADY_ADOPTED,
                        current
                    );
                }


                throw new IllegalStateException(
                    "FINORA Portable State divergent payload exists at the current generation."
                );
            }


            if (
                incoming.headGeneration <
                    current.headGeneration
            ) {

                throw new IllegalStateException(
                    "FINORA Portable State imported generation is stale."
                );
            }


            if (
                incoming.importedParentPayloadSha256 == null ||
                !incoming.importedParentPayloadSha256.equals(
                    current.headPayloadSha256
                )
            ) {

                throw new IllegalStateException(
                    "FINORA Portable State imported parent does not match the current Android head."
                );
            }


            writeSnapshot(
                incoming
            );


            Snapshot persisted =
                requirePersistedExact(
                    incoming
                );


            return new AdoptionResult(
                AdoptionStatus.ADOPTED,
                persisted
            );
        }
    }


    private Snapshot snapshotFromVerified(
        FinoraPortableStateEnvelopeVerifier.VerifiedEnvelope verified
    ) {

        Snapshot snapshot =
            new Snapshot(
                requireCanonicalIdentity(
                    verified.issuerId,
                    "issuerId"
                ),

                requireCanonicalIdentity(
                    verified.signingKeyId,
                    "signingKeyId"
                ),

                requirePositiveSafeInteger(
                    verified.stateGeneration,
                    "stateGeneration"
                ),

                requireCanonicalSha256(
                    verified.payloadSha256,
                    "payloadSha256"
                ),

                verified.parentPayloadSha256 == null
                    ? null
                    : requireCanonicalSha256(
                        verified.parentPayloadSha256,
                        "parentPayloadSha256"
                    ),

                verified.payload
            );


        validateSnapshotPayloadConsistency(
            snapshot
        );


        return snapshot;
    }


    private Snapshot requirePersistedExact(
        Snapshot expected
    ) throws Exception {

        Snapshot actual =
            readSnapshot();


        if (
            actual == null ||
            !actual.issuerId.equals(
                expected.issuerId
            ) ||
            !actual.signingKeyId.equals(
                expected.signingKeyId
            ) ||
            actual.headGeneration !=
                expected.headGeneration ||
            !actual.headPayloadSha256.equals(
                expected.headPayloadSha256
            ) ||
            !equalNullable(
                actual.importedParentPayloadSha256,
                expected.importedParentPayloadSha256
            ) ||
            !actual.payload.toString().equals(
                expected.payload.toString()
            )
        ) {

            throw new IllegalStateException(
                "FINORA Portable State authority did not persist exactly."
            );
        }


        return actual;
    }


    private Snapshot readSnapshot()
        throws Exception {

        File base =
            atomicFile.getBaseFile();


        if (!base.exists()) {

            return null;
        }


        byte[] encryptedFile =
            readBoundedFile();


        JSONObject outer;

        try {

            outer =
                new JSONObject(
                    new String(
                        encryptedFile,
                        StandardCharsets.UTF_8
                    )
                );
        }
        finally {

            Arrays.fill(
                encryptedFile,
                (byte) 0
            );
        }


        requireExactKeys(
            outer,
            "format",
            "schemaVersion",
            "keyAlias",
            "iv",
            "ciphertext"
        );


        if (
            !STORE_FORMAT.equals(
                requireString(
                    outer,
                    "format"
                )
            ) ||
            requirePositiveSafeInteger(
                outer,
                "schemaVersion"
            ) !=
                STORE_SCHEMA_VERSION ||
            !KEY_ALIAS.equals(
                requireString(
                    outer,
                    "keyAlias"
                )
            )
        ) {

            throw new IllegalStateException(
                "FINORA Portable State authority envelope is invalid."
            );
        }


        byte[] iv =
            decodeCanonicalBase64(
                requireString(
                    outer,
                    "iv"
                ),
                IV_BYTES,
                "authority IV"
            );

        byte[] ciphertext =
            decodeCanonicalBase64(
                requireString(
                    outer,
                    "ciphertext"
                ),
                -1,
                "authority ciphertext"
            );


        byte[] plaintext =
            null;


        try {

            if (
                ciphertext.length <= 0 ||
                ciphertext.length >
                    MAX_ENCRYPTED_FILE_BYTES
            ) {

                throw new IllegalStateException(
                    "FINORA Portable State authority ciphertext size is invalid."
                );
            }


            Cipher cipher =
                Cipher.getInstance(
                    CIPHER_TRANSFORMATION
                );


            cipher.init(
                Cipher.DECRYPT_MODE,
                requireSecretKey(),
                new GCMParameterSpec(
                    GCM_TAG_BITS,
                    iv
                )
            );


            byte[] aad =
                createAad();


            try {

                cipher.updateAAD(
                    aad
                );

                plaintext =
                    cipher.doFinal(
                        ciphertext
                    );
            }
            finally {

                Arrays.fill(
                    aad,
                    (byte) 0
                );
            }


            if (
                plaintext.length <= 0 ||
                plaintext.length >
                    MAX_PLAINTEXT_BYTES
            ) {

                throw new IllegalStateException(
                    "FINORA Portable State authority plaintext size is invalid."
                );
            }


            JSONObject root =
                new JSONObject(
                    new String(
                        plaintext,
                        StandardCharsets.UTF_8
                    )
                );


            return parseSnapshot(
                root
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


            if (plaintext != null) {

                Arrays.fill(
                    plaintext,
                    (byte) 0
                );
            }
        }
    }


    private void writeSnapshot(
        Snapshot snapshot
    ) throws Exception {

        validateSnapshotPayloadConsistency(
            snapshot
        );


        JSONObject root =
            serializeSnapshot(
                snapshot
            );


        byte[] plaintext =
            root
                .toString()
                .getBytes(
                    StandardCharsets.UTF_8
                );


        if (
            plaintext.length <= 0 ||
            plaintext.length >
                MAX_PLAINTEXT_BYTES
        ) {

            Arrays.fill(
                plaintext,
                (byte) 0
            );

            throw new IllegalStateException(
                "FINORA Portable State authority plaintext size is invalid."
            );
        }


        byte[] iv =
            null;

        byte[] ciphertext =
            null;


        try {

            Cipher cipher =
                Cipher.getInstance(
                    CIPHER_TRANSFORMATION
                );


            /*
             * AndroidKeyStore requires provider-generated GCM IVs
             * for encryption. Never supply a caller-created IV.
             */
            cipher.init(
                Cipher.ENCRYPT_MODE,
                requireSecretKey()
            );


            iv =
                cipher.getIV();


            if (
                iv == null ||
                iv.length !=
                    IV_BYTES
            ) {

                throw new IllegalStateException(
                    "FINORA Portable State authority IV is invalid."
                );
            }


            byte[] aad =
                createAad();


            try {

                cipher.updateAAD(
                    aad
                );

                ciphertext =
                    cipher.doFinal(
                        plaintext
                    );
            }
            finally {

                Arrays.fill(
                    aad,
                    (byte) 0
                );
            }


            JSONObject outer =
                new JSONObject();

            outer.put(
                "format",
                STORE_FORMAT
            );

            outer.put(
                "schemaVersion",
                STORE_SCHEMA_VERSION
            );

            outer.put(
                "keyAlias",
                KEY_ALIAS
            );

            outer.put(
                "iv",
                Base64.encodeToString(
                    iv,
                    Base64.NO_WRAP
                )
            );

            outer.put(
                "ciphertext",
                Base64.encodeToString(
                    ciphertext,
                    Base64.NO_WRAP
                )
            );


            byte[] encoded =
                outer
                    .toString()
                    .getBytes(
                        StandardCharsets.UTF_8
                    );


            if (
                encoded.length <= 0 ||
                encoded.length >
                    MAX_ENCRYPTED_FILE_BYTES
            ) {

                Arrays.fill(
                    encoded,
                    (byte) 0
                );

                throw new IllegalStateException(
                    "FINORA Portable State authority encrypted file size is invalid."
                );
            }


            FileOutputStream stream =
                null;


            try {

                stream =
                    atomicFile.startWrite();

                stream.write(
                    encoded
                );

                stream.flush();

                atomicFile.finishWrite(
                    stream
                );

                stream =
                    null;
            }
            catch (Exception error) {

                if (stream != null) {

                    atomicFile.failWrite(
                        stream
                    );

                    stream =
                        null;
                }


                throw error;
            }
            finally {

                Arrays.fill(
                    encoded,
                    (byte) 0
                );
            }
        }
        finally {

            Arrays.fill(
                plaintext,
                (byte) 0
            );


            if (iv != null) {

                Arrays.fill(
                    iv,
                    (byte) 0
                );
            }


            if (ciphertext != null) {

                Arrays.fill(
                    ciphertext,
                    (byte) 0
                );
            }
        }
    }


    private SecretKey requireSecretKey()
        throws Exception {

        KeyStore keyStore =
            KeyStore.getInstance(
                ANDROID_KEYSTORE
            );

        keyStore.load(
            null
        );


        if (
            !keyStore.containsAlias(
                KEY_ALIAS
            )
        ) {

            KeyGenerator generator =
                KeyGenerator.getInstance(
                    KeyProperties.KEY_ALGORITHM_AES,
                    ANDROID_KEYSTORE
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

            generator.generateKey();


            keyStore =
                KeyStore.getInstance(
                    ANDROID_KEYSTORE
                );

            keyStore.load(
                null
            );
        }


        KeyStore.Entry entry =
            keyStore.getEntry(
                KEY_ALIAS,
                null
            );


        if (
            !(entry instanceof KeyStore.SecretKeyEntry)
        ) {

            throw new IllegalStateException(
                "FINORA Portable State authority key alias is invalid."
            );
        }


        SecretKey key =
            (
                (KeyStore.SecretKeyEntry) entry
            ).getSecretKey();


        if (key == null) {

            throw new IllegalStateException(
                "FINORA Portable State authority key is unavailable."
            );
        }


        return key;
    }


    private byte[] readBoundedFile()
        throws Exception {

        FileInputStream input =
            atomicFile.openRead();


        try {

            ByteArrayOutputStream output =
                new ByteArrayOutputStream();

            byte[] buffer =
                new byte[
                    16 * 1024
                ];

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
                        MAX_ENCRYPTED_FILE_BYTES
                ) {

                    throw new IllegalStateException(
                        "FINORA Portable State authority file is too large."
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


    private static byte[] createAad() {

        JSONArray aad =
            new JSONArray();

        aad.put(
            STORE_FORMAT
        );

        aad.put(
            STORE_SCHEMA_VERSION
        );

        aad.put(
            KEY_ALIAS
        );


        return aad
            .toString()
            .getBytes(
                StandardCharsets.UTF_8
            );
    }


    private static JSONObject serializeSnapshot(
        Snapshot snapshot
    ) throws Exception {

        JSONObject root =
            new JSONObject();

        root.put(
            "format",
            STORE_FORMAT
        );

        root.put(
            "schemaVersion",
            STORE_SCHEMA_VERSION
        );

        root.put(
            "issuerId",
            snapshot.issuerId
        );

        root.put(
            "signingKeyId",
            snapshot.signingKeyId
        );

        root.put(
            "headGeneration",
            snapshot.headGeneration
        );

        root.put(
            "headPayloadSha256",
            snapshot.headPayloadSha256
        );

        root.put(
            "importedParentPayloadSha256",
            snapshot.importedParentPayloadSha256 ==
                null
                ? JSONObject.NULL
                : snapshot.importedParentPayloadSha256
        );

        root.put(
            "payload",
            cloneObject(
                snapshot.payload
            )
        );


        return root;
    }


    private static Snapshot parseSnapshot(
        JSONObject root
    ) throws Exception {

        requireExactKeys(
            root,
            "format",
            "schemaVersion",
            "issuerId",
            "signingKeyId",
            "headGeneration",
            "headPayloadSha256",
            "importedParentPayloadSha256",
            "payload"
        );


        if (
            !STORE_FORMAT.equals(
                requireString(
                    root,
                    "format"
                )
            ) ||
            requirePositiveSafeInteger(
                root,
                "schemaVersion"
            ) !=
                STORE_SCHEMA_VERSION
        ) {

            throw new IllegalStateException(
                "FINORA Portable State authority state format is invalid."
            );
        }


        JSONObject payload =
            root.optJSONObject(
                "payload"
            );


        if (payload == null) {

            throw new IllegalStateException(
                "FINORA Portable State authority payload is missing."
            );
        }


        String parent =
            null;


        if (
            !root.isNull(
                "importedParentPayloadSha256"
            )
        ) {

            parent =
                requireCanonicalSha256(
                    requireString(
                        root,
                        "importedParentPayloadSha256"
                    ),
                    "importedParentPayloadSha256"
                );
        }


        Snapshot snapshot =
            new Snapshot(
                requireCanonicalIdentity(
                    requireString(
                        root,
                        "issuerId"
                    ),
                    "issuerId"
                ),

                requireCanonicalIdentity(
                    requireString(
                        root,
                        "signingKeyId"
                    ),
                    "signingKeyId"
                ),

                requirePositiveSafeInteger(
                    root,
                    "headGeneration"
                ),

                requireCanonicalSha256(
                    requireString(
                        root,
                        "headPayloadSha256"
                    ),
                    "headPayloadSha256"
                ),

                parent,

                payload
            );


        validateSnapshotPayloadConsistency(
            snapshot
        );


        return snapshot;
    }


    private static void validateSnapshotPayloadConsistency(
        Snapshot snapshot
    ) {

        JSONObject payload =
            snapshot.payload;


        if (
            !FinoraPortableStateEnvelopeVerifier.FORMAT.equals(
                payload.optString(
                    "format",
                    ""
                )
            ) ||
            payload.optInt(
                "schemaVersion",
                -1
            ) !=
                FinoraPortableStateEnvelopeVerifier.SCHEMA_VERSION
        ) {

            throw new IllegalStateException(
                "FINORA Portable State authority payload format is invalid."
            );
        }


        if (
            !snapshot.issuerId.equals(
                payload.optString(
                    "issuerId",
                    ""
                )
            ) ||
            !snapshot.signingKeyId.equals(
                payload.optString(
                    "signingKeyId",
                    ""
                )
            )
        ) {

            throw new IllegalStateException(
                "FINORA Portable State authority payload identity does not match metadata."
            );
        }


        Object generationRaw =
            payload.opt(
                "stateGeneration"
            );


        if (
            !(generationRaw instanceof Number) ||
            requirePositiveSafeInteger(
                ((Number) generationRaw).longValue(),
                "payload stateGeneration"
            ) !=
                snapshot.headGeneration
        ) {

            throw new IllegalStateException(
                "FINORA Portable State authority payload generation does not match metadata."
            );
        }


        if (
            !payload.has(
                "parentPayloadSha256"
            )
        ) {

            throw new IllegalStateException(
                "FINORA Portable State authority payload parent field is missing."
            );
        }


        String payloadParent =
            null;


        if (
            !payload.isNull(
                "parentPayloadSha256"
            )
        ) {

            payloadParent =
                requireCanonicalSha256(
                    payload.optString(
                        "parentPayloadSha256",
                        ""
                    ),
                    "payload parentPayloadSha256"
                );
        }


        if (
            !equalNullable(
                payloadParent,
                snapshot.importedParentPayloadSha256
            )
        ) {

            throw new IllegalStateException(
                "FINORA Portable State authority payload parent does not match metadata."
            );
        }


        Object branchRegistryDomain =
            payload.opt(
                "branchRegistry"
            );


        if (
            branchRegistryDomain == null ||
            (
                branchRegistryDomain != JSONObject.NULL &&
                !(branchRegistryDomain instanceof JSONObject)
            ) ||
            !(payload.opt(
                "branchDirectoryMetadata"
            ) instanceof JSONObject) ||
            !(payload.opt(
                "walletHistory"
            ) instanceof JSONObject) ||
            !(payload.opt(
                "incomePricing"
            ) instanceof JSONObject) ||
            !(payload.opt(
                "branchPricing"
            ) instanceof JSONObject) ||
            !(payload.opt(
                "issuanceAuthority"
            ) instanceof JSONObject) ||
            !(payload.opt(
                "clockAuthority"
            ) instanceof JSONObject)
        ) {

            throw new IllegalStateException(
                "FINORA Portable State authority payload root domains are invalid."
            );
        }
    }


    private static long requirePositiveSafeInteger(
        JSONObject object,
        String key
    ) {

        Object raw =
            object.opt(
                key
            );


        if (!(raw instanceof Number)) {

            throw new IllegalStateException(
                "FINORA Portable State " +
                key +
                " must be numeric."
            );
        }


        Number value =
            (Number) raw;

        double doubleValue =
            value.doubleValue();

        long longValue =
            value.longValue();


        if (
            !Double.isFinite(
                doubleValue
            ) ||
            doubleValue !=
                (double) longValue
        ) {

            throw new IllegalStateException(
                "FINORA Portable State " +
                key +
                " must be an integer."
            );
        }


        return requirePositiveSafeInteger(
            longValue,
            key
        );
    }


    private static long requirePositiveSafeInteger(
        long value,
        String label
    ) {

        if (
            value <= 0 ||
            value >
                MAX_SAFE_INTEGER
        ) {

            throw new IllegalStateException(
                "FINORA Portable State " +
                label +
                " must be a positive safe integer."
            );
        }


        return value;
    }


    private static String requireCanonicalIdentity(
        String value,
        String label
    ) {

        if (
            value == null ||
            value.length() == 0 ||
            !value.equals(
                value.trim()
            )
        ) {

            throw new IllegalStateException(
                "FINORA Portable State " +
                label +
                " is invalid."
            );
        }


        return value;
    }


    private static String requireCanonicalSha256(
        String value,
        String label
    ) {

        if (
            value == null ||
            !value.matches(
                "^[0-9a-f]{64}$"
            )
        ) {

            throw new IllegalStateException(
                "FINORA Portable State " +
                label +
                " must be canonical lowercase SHA-256."
            );
        }


        return value;
    }


    private static String requireString(
        JSONObject object,
        String key
    ) {

        Object value =
            object.opt(
                key
            );


        if (
            !(value instanceof String) ||
            ((String) value).length() == 0
        ) {

            throw new IllegalStateException(
                "FINORA Portable State " +
                key +
                " is invalid."
            );
        }


        return (String) value;
    }


    private static byte[] decodeCanonicalBase64(
        String value,
        int expectedBytes,
        String label
    ) {

        byte[] decoded;


        try {

            decoded =
                Base64.decode(
                    value,
                    Base64.DEFAULT
                );
        }
        catch (Exception error) {

            throw new IllegalStateException(
                "FINORA Portable State " +
                label +
                " is invalid Base64.",
                error
            );
        }


        String canonical =
            Base64.encodeToString(
                decoded,
                Base64.NO_WRAP
            );


        if (
            decoded.length == 0 ||
            !canonical.equals(
                value
            ) ||
            (
                expectedBytes >= 0 &&
                decoded.length !=
                    expectedBytes
            )
        ) {

            Arrays.fill(
                decoded,
                (byte) 0
            );

            throw new IllegalStateException(
                "FINORA Portable State " +
                label +
                " is not canonical Base64."
            );
        }


        return decoded;
    }


    private static void requireExactKeys(
        JSONObject object,
        String... expectedKeys
    ) {

        Set<String> expected =
            new HashSet<>(
                Arrays.asList(
                    expectedKeys
                )
            );

        Set<String> actual =
            new HashSet<>();

        Iterator<String> keys =
            object.keys();


        while (keys.hasNext()) {

            actual.add(
                keys.next()
            );
        }


        if (
            !expected.equals(
                actual
            )
        ) {

            throw new IllegalStateException(
                "FINORA Portable State authority contains unsupported fields."
            );
        }
    }


    private static boolean equalNullable(
        String left,
        String right
    ) {

        if (left == null) {

            return right == null;
        }


        return left.equals(
            right
        );
    }


    private static JSONObject cloneObject(
        JSONObject value
    ) {

        if (value == null) {

            throw new IllegalArgumentException(
                "FINORA Portable State payload is required."
            );
        }


        try {

            return new JSONObject(
                value.toString()
            );
        }
        catch (Exception error) {

            throw new IllegalStateException(
                "FINORA Portable State payload clone failed.",
                error
            );
        }
    }
}