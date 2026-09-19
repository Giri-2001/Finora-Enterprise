package com.finora.enterprise.control;

import android.content.Context;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeFormatterBuilder;
import java.util.Arrays;
import java.util.Base64;

import org.bouncycastle.crypto.generators.SCrypt;

/**
 * Password-first native Branch Credential authentication authority.
 *
 * Security boundary:
 *
 * 1. Validate only Username + Password request shape.
 * 2. Reject excessive Password length generically.
 * 3. Canonicalize Username before credential lookup.
 * 4. Missing Username still performs one SCRYPT derivation and
 *    one timing-safe comparison using fixed non-secret material.
 * 5. Wrong Username and wrong Password are indistinguishable.
 * 6. Only native Branch Credential verifier state is consulted.
 *
 * This authority intentionally does NOT:
 *
 * - request or validate Security Code;
 * - decrypt Portable Branch Auth;
 * - inspect or mutate Device Trust;
 * - create a login session;
 * - persist any plaintext secret;
 * - touch USB Portable Auth storage.
 */
public final class FinoraBranchCredentialAuthenticationAuthority {

    public static final String INVALID_REQUEST =
        "INVALID_REQUEST";

    public static final String INVALID_CREDENTIALS =
        "INVALID_CREDENTIALS";

    public static final String CONTROL_STORE_FAILED =
        "CONTROL_STORE_FAILED";

    public static final String KDF_FAILED =
        "KDF_FAILED";

    static final int PASSWORD_MAX_CODE_POINTS =
        128;

    static final int DUMMY_SALT_BYTES =
        16;

    static final byte DUMMY_SALT_VALUE =
        (byte) 0xA5;

    static final int DUMMY_DERIVED_KEY_BYTES =
        32;

    static final byte DUMMY_DERIVED_KEY_VALUE =
        (byte) 0x5A;

    static final int DUMMY_N =
        32768;

    static final int DUMMY_R =
        8;

    static final int DUMMY_P =
        1;

    private static final String INVALID_REQUEST_ERROR =
        "A valid FINORA credential authentication request is required.";

    private static final String INVALID_CREDENTIALS_ERROR =
        "Invalid username or password.";

    private static final String CONTROL_STORE_ERROR =
        "Unable to load the FINORA Control Store.";

    private static final String KDF_ERROR =
        "FINORA could not securely verify the local credential.";

    private static final DateTimeFormatter
        AUTHENTICATED_AT_FORMATTER =
            new DateTimeFormatterBuilder()
                .appendInstant(
                    3
                )
                .toFormatter();

    interface CredentialStorePort {

        FinoraBranchCredentialContract.Credential
            findActiveByUsername(
                String canonicalUsername
            )
                throws Exception;
    }

    interface KdfPort {

        byte[] derive(
            String password,
            byte[] salt,
            int keyLength,
            int N,
            int r,
            int p
        )
            throws Exception;
    }

    interface ComparePort {

        boolean isEqual(
            byte[] actual,
            byte[] expected
        );
    }

    interface ClockPort {

        String nowIso();
    }

    private final CredentialStorePort
        credentialStore;

    private final KdfPort
        kdf;

    private final ComparePort
        compare;

    private final ClockPort
        clock;

    // ========================================================
    // REQUEST
    // ========================================================

    public static final class Request {

        public final String username;

        public final String password;

        public Request(
            String username,
            String password
        ) {

            this.username =
                username;

            this.password =
                password;
        }
    }

    // ========================================================
    // SUCCESS DATA
    // ========================================================

    public static final class Success {

        public final String credentialId;

        public final long authGeneration;

        public final String userId;

        public final String username;

        public final String fullName;

        public final String role;

        public final String ownerId;

        public final String businessId;

        public final String branchId;

        public final String storageMode;

        public final String dataContext;

        public final String demoId;

        public final String authenticatedAt;

        private Success(
            String credentialId,
            long authGeneration,
            String userId,
            String username,
            String fullName,
            String role,
            String ownerId,
            String businessId,
            String branchId,
            String storageMode,
            String dataContext,
            String demoId,
            String authenticatedAt
        ) {

            this.credentialId =
                credentialId;

            this.authGeneration =
                authGeneration;

            this.userId =
                userId;

            this.username =
                username;

            this.fullName =
                fullName;

            this.role =
                role;

            this.ownerId =
                ownerId;

            this.businessId =
                businessId;

            this.branchId =
                branchId;

            this.storageMode =
                storageMode;

            this.dataContext =
                dataContext;

            this.demoId =
                demoId;

            this.authenticatedAt =
                authenticatedAt;
        }
    }

    // ========================================================
    // RESULT
    // ========================================================

    public static final class Result {

        public final boolean success;

        public final Success data;

        public final String errorCode;

        public final String error;

        private Result(
            boolean success,
            Success data,
            String errorCode,
            String error
        ) {

            this.success =
                success;

            this.data =
                data;

            this.errorCode =
                errorCode;

            this.error =
                error;
        }

        static Result success(
            Success data
        ) {

            return new Result(
                true,
                data,
                null,
                null
            );
        }

        static Result failure(
            String errorCode,
            String error
        ) {

            return new Result(
                false,
                null,
                errorCode,
                error
            );
        }
    }

    // ========================================================
    // PRODUCTION CONSTRUCTOR
    // ========================================================

    public FinoraBranchCredentialAuthenticationAuthority(
        Context context
    ) {

        this(
            new NativeCredentialStorePort(
                context
            ),
            new NativeKdfPort(),
            new NativeComparePort(),
            new SystemClockPort()
        );
    }

    // Package-private real-crypto seam for unit tests.
    FinoraBranchCredentialAuthenticationAuthority(
        CredentialStorePort credentialStore,
        ClockPort clock
    ) {

        this(
            credentialStore,
            new NativeKdfPort(),
            new NativeComparePort(),
            clock
        );
    }

    // Package-private deterministic seam for unit tests.
    FinoraBranchCredentialAuthenticationAuthority(
        CredentialStorePort credentialStore,
        KdfPort kdf,
        ComparePort compare,
        ClockPort clock
    ) {

        if (
            credentialStore == null ||
            kdf == null ||
            compare == null ||
            clock == null
        ) {
            throw new IllegalArgumentException(
                "FINORA Branch Credential authentication dependencies are required."
            );
        }

        this.credentialStore =
            credentialStore;

        this.kdf =
            kdf;

        this.compare =
            compare;

        this.clock =
            clock;
    }

    // ========================================================
    // AUTHENTICATE
    // ========================================================

    public Result authenticate(
        Request request
    ) {

        if (
            request == null ||
            !isNonEmptyEcmaTrimmed(
                request.username
            ) ||
            request.password == null
        ) {
            return Result.failure(
                INVALID_REQUEST,
                INVALID_REQUEST_ERROR
            );
        }

        int passwordCodePoints =
            request.password.codePointCount(
                0,
                request.password.length()
            );

        if (
            passwordCodePoints >
            PASSWORD_MAX_CODE_POINTS
        ) {
            return Result.failure(
                INVALID_CREDENTIALS,
                INVALID_CREDENTIALS_ERROR
            );
        }

        final String canonicalUsername;

        try {
            canonicalUsername =
                FinoraBranchCredentialContract
                    .canonicalizeUsername(
                        request.username
                    );
        }
        catch (Exception error) {
            return Result.failure(
                INVALID_REQUEST,
                INVALID_REQUEST_ERROR
            );
        }

        final FinoraBranchCredentialContract.Credential
            credential;

        try {
            credential =
                credentialStore
                    .findActiveByUsername(
                        canonicalUsername
                    );
        }
        catch (Exception error) {
            return Result.failure(
                CONTROL_STORE_FAILED,
                CONTROL_STORE_ERROR
            );
        }

        byte[] salt =
            null;

        byte[] expectedDerivedKey =
            null;

        byte[] actualDerivedKey =
            null;

        try {

            final int keyLength;
            final int N;
            final int r;
            final int p;

            if (credential != null) {

                salt =
                    Base64
                        .getDecoder()
                        .decode(
                            credential
                                .verifier
                                .salt
                        );

                expectedDerivedKey =
                    Base64
                        .getDecoder()
                        .decode(
                            credential
                                .verifier
                                .derivedKey
                        );

                keyLength =
                    credential
                        .verifier
                        .keyLength;

                N =
                    credential
                        .verifier
                        .N;

                r =
                    credential
                        .verifier
                        .r;

                p =
                    credential
                        .verifier
                        .p;
            }
            else {

                salt =
                    new byte[
                        DUMMY_SALT_BYTES
                    ];

                Arrays.fill(
                    salt,
                    DUMMY_SALT_VALUE
                );

                expectedDerivedKey =
                    new byte[
                        DUMMY_DERIVED_KEY_BYTES
                    ];

                Arrays.fill(
                    expectedDerivedKey,
                    DUMMY_DERIVED_KEY_VALUE
                );

                keyLength =
                    DUMMY_DERIVED_KEY_BYTES;

                N =
                    DUMMY_N;

                r =
                    DUMMY_R;

                p =
                    DUMMY_P;
            }

            actualDerivedKey =
                kdf.derive(
                    request.password,
                    salt,
                    keyLength,
                    N,
                    r,
                    p
                );

            if (
                actualDerivedKey == null ||
                expectedDerivedKey == null ||
                actualDerivedKey.length !=
                    expectedDerivedKey.length
            ) {
                throw new IllegalStateException(
                    "FINORA Branch Credential KDF result length is invalid."
                );
            }

            boolean passwordMatches =
                compare.isEqual(
                    actualDerivedKey,
                    expectedDerivedKey
                );

            if (
                credential == null ||
                !passwordMatches
            ) {
                return Result.failure(
                    INVALID_CREDENTIALS,
                    INVALID_CREDENTIALS_ERROR
                );
            }

            long authGeneration =
                credential.authGeneration == null
                    ? FinoraBranchCredentialContract
                        .INITIAL_AUTH_GENERATION
                    : credential
                        .authGeneration
                        .longValue();

            Success success =
                new Success(
                    credential.credentialId,
                    authGeneration,
                    credential.userId,
                    credential.username,
                    credential.fullName,
                    credential.role,
                    credential.ownerId,
                    credential.businessId,
                    credential.branchId,
                    credential.storageMode,
                    credential.dataContext,
                    credential.demoId,
                    clock.nowIso()
                );

            return Result.success(
                success
            );
        }
        catch (Exception error) {

            return Result.failure(
                KDF_FAILED,
                KDF_ERROR
            );
        }
        finally {

            if (actualDerivedKey != null) {
                Arrays.fill(
                    actualDerivedKey,
                    (byte) 0
                );
            }

            if (expectedDerivedKey != null) {
                Arrays.fill(
                    expectedDerivedKey,
                    (byte) 0
                );
            }

            if (salt != null) {
                Arrays.fill(
                    salt,
                    (byte) 0
                );
            }
        }
    }

    // ========================================================
    // REQUEST WHITESPACE
    // ========================================================

    private static boolean isNonEmptyEcmaTrimmed(
        String value
    ) {

        if (value == null) {
            return false;
        }

        int start =
            0;

        int end =
            value.length();

        while (start < end) {

            int codePoint =
                value.codePointAt(
                    start
                );

            if (
                !isEcmaTrimWhitespace(
                    codePoint
                )
            ) {
                break;
            }

            start +=
                Character.charCount(
                    codePoint
                );
        }

        while (end > start) {

            int codePoint =
                value.codePointBefore(
                    end
                );

            if (
                !isEcmaTrimWhitespace(
                    codePoint
                )
            ) {
                break;
            }

            end -=
                Character.charCount(
                    codePoint
                );
        }

        return end > start;
    }

    private static boolean isEcmaTrimWhitespace(
        int codePoint
    ) {

        return (
            Character.isWhitespace(
                codePoint
            ) ||
            Character.isSpaceChar(
                codePoint
            ) ||
            codePoint == 0xFEFF
        );
    }

    // ========================================================
    // PRODUCTION STORE PORT
    // ========================================================

    private static final class NativeCredentialStorePort
        implements CredentialStorePort {

        private final FinoraBranchCredentialStore
            store;

        NativeCredentialStorePort(
            Context context
        ) {

            if (context == null) {
                throw new IllegalArgumentException(
                    "Android context is required."
                );
            }

            this.store =
                new FinoraBranchCredentialStore(
                    context
                );
        }

        @Override
        public FinoraBranchCredentialContract.Credential
            findActiveByUsername(
                String canonicalUsername
            )
                throws Exception {

            return store.findActiveByUsername(
                canonicalUsername
            );
        }
    }

    // ========================================================
    // PRODUCTION CREDENTIAL-SPECIFIC SCRYPT
    // ========================================================

    private static final class NativeKdfPort
        implements KdfPort {

        @Override
        public byte[] derive(
            String password,
            byte[] salt,
            int keyLength,
            int N,
            int r,
            int p
        ) {

            if (
                password == null ||
                salt == null ||
                keyLength <= 0 ||
                N <= 1 ||
                r <= 0 ||
                p <= 0
            ) {
                throw new IllegalArgumentException(
                    "FINORA Branch Credential KDF input is invalid."
                );
            }

            byte[] passwordBytes =
                password.getBytes(
                    StandardCharsets.UTF_8
                );

            try {

                return SCrypt.generate(
                    passwordBytes,
                    salt,
                    N,
                    r,
                    p,
                    keyLength
                );
            }
            finally {

                Arrays.fill(
                    passwordBytes,
                    (byte) 0
                );
            }
        }
    }

    // ========================================================
    // PRODUCTION TIMING-SAFE COMPARISON
    // ========================================================

    private static final class NativeComparePort
        implements ComparePort {

        @Override
        public boolean isEqual(
            byte[] actual,
            byte[] expected
        ) {

            return MessageDigest.isEqual(
                actual,
                expected
            );
        }
    }

    // ========================================================
    // PRODUCTION CLOCK
    // ========================================================

    private static final class SystemClockPort
        implements ClockPort {

        @Override
        public String nowIso() {

            return AUTHENTICATED_AT_FORMATTER
                .format(
                    Instant.now()
                );
        }
    }
}