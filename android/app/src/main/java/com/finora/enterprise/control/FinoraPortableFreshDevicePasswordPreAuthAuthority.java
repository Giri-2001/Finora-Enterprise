package com.finora.enterprise.control;

/**
 * Password-only pre-authentication boundary for a fresh FINORA device.
 *
 * Security ordering:
 *
 * 1. Use only the explicitly selected provisioned storage mode.
 * 2. Read Portable Branch Auth from that exact store.
 * 3. Verify Username + Password against the outer envelope only.
 * 4. Wrong Username and wrong Password are indistinguishable.
 * 5. Security Code is neither requested nor consumed here.
 * 6. Portable Auth payload is not decrypted here.
 * 7. No Control Store or Device Trust state is mutated here.
 *
 * A successful result means only that the caller may present the
 * Security Code challenge. It is not a login session and it is not
 * device authorization.
 */
public final class
    FinoraPortableFreshDevicePasswordPreAuthAuthority {

    public static final String
        STATUS_SECURITY_CODE_REQUIRED =
            "SECURITY_CODE_REQUIRED";

    public static final String
        INVALID_REQUEST =
            "INVALID_REQUEST";

    public static final String
        INVALID_CREDENTIALS =
            "INVALID_CREDENTIALS";

    public static final String
        PORTABLE_AUTH_FAILED =
            "PORTABLE_AUTH_FAILED";

    interface StoreReader {

        String read(
            String storageMode
        ) throws Exception;
    }

    interface PasswordProbe {

        boolean verify(
            String serialized,
            String username,
            String password
        ) throws Exception;
    }

    public static final class Request {

        public final String username;
        public final String password;
        public final String storageMode;

        public Request(
            String username,
            String password,
            String storageMode
        ) {
            this.username =
                username;

            this.password =
                password;

            this.storageMode =
                storageMode;
        }
    }

    public static final class Result {

        public final boolean success;
        public final String status;
        public final String errorCode;
        public final String error;

        private Result(
            boolean success,
            String status,
            String errorCode,
            String error
        ) {
            this.success =
                success;

            this.status =
                status;

            this.errorCode =
                errorCode;

            this.error =
                error;
        }

        static Result securityCodeRequired() {
            return new Result(
                true,
                STATUS_SECURITY_CODE_REQUIRED,
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

    private static final class NativeStoreReader
        implements StoreReader {

        private final FinoraPortableBranchAuthStore store;

        NativeStoreReader(
            FinoraPortableBranchAuthStore store
        ) {
            if (store == null) {
                throw new IllegalArgumentException(
                    "FINORA Portable Branch Auth Store is required."
                );
            }

            this.store =
                store;
        }

        @Override
        public String read(
            String storageMode
        ) throws Exception {
            return store.read(
                storageMode
            );
        }
    }

    private static final class NativePasswordProbe
        implements PasswordProbe {

        @Override
        public boolean verify(
            String serialized,
            String username,
            String password
        ) {
            FinoraPortableBranchAuthEnvelopeCodec.Envelope
                envelope =
                    FinoraPortableBranchAuthEnvelopeCodec
                        .parse(
                            serialized
                        );

            /*
             * IMPORTANT:
             * Password verification is performed even when the supplied
             * Username is wrong. This keeps wrong Username and wrong
             * Password on the same externally visible result path.
             */
            boolean passwordMatches =
                FinoraPortableBranchAuthPasswordAuthority
                    .verifyPassword(
                        envelope,
                        password
                    );

            String canonicalUsername =
                FinoraBranchCredentialContract
                    .canonicalizeUsername(
                        username
                    );

            return
                passwordMatches &&
                canonicalUsername.equals(
                    envelope.canonicalUsername
                );
        }
    }

    private final StoreReader storeReader;
    private final PasswordProbe passwordProbe;

    public FinoraPortableFreshDevicePasswordPreAuthAuthority(
        FinoraPortableBranchAuthStore store
    ) {
        this(
            new NativeStoreReader(
                store
            ),
            new NativePasswordProbe()
        );
    }

    FinoraPortableFreshDevicePasswordPreAuthAuthority(
        StoreReader storeReader,
        PasswordProbe passwordProbe
    ) {
        if (
            storeReader == null ||
            passwordProbe == null
        ) {
            throw new IllegalArgumentException(
                "FINORA fresh-device Password pre-authentication dependencies are required."
            );
        }

        this.storeReader =
            storeReader;

        this.passwordProbe =
            passwordProbe;
    }

    public Result authenticate(
        Request request
    ) {
        if (
            request == null ||
            !isStorageMode(
                request.storageMode
            )
        ) {
            return Result.failure(
                INVALID_REQUEST,
                "A valid FINORA fresh-device Password request is required."
            );
        }

        final String serialized;

        try {
            serialized =
                storeReader.read(
                    request.storageMode
                );
        }
        catch (Exception error) {
            return Result.failure(
                PORTABLE_AUTH_FAILED,
                "FINORA Portable Branch Auth could not be read."
            );
        }

        if (
            serialized == null ||
            serialized.length() == 0
        ) {
            return Result.failure(
                PORTABLE_AUTH_FAILED,
                "FINORA Portable Branch Auth is unavailable."
            );
        }

        final boolean authenticated;

        try {
            authenticated =
                passwordProbe.verify(
                    serialized,
                    request.username,
                    request.password
                );
        }
        catch (IllegalArgumentException error) {
            /*
             * Invalid Username/Password shape remains generic so the
             * Password-first boundary does not reveal account existence.
             */
            return Result.failure(
                INVALID_CREDENTIALS,
                "Invalid username or password."
            );
        }
        catch (Exception error) {
            return Result.failure(
                PORTABLE_AUTH_FAILED,
                "FINORA Portable Branch Auth could not be verified."
            );
        }

        if (!authenticated) {
            return Result.failure(
                INVALID_CREDENTIALS,
                "Invalid username or password."
            );
        }

        return Result.securityCodeRequired();
    }

    private static boolean isStorageMode(
        String value
    ) {
        return
            FinoraPortableBranchAuthStore
                .STORAGE_MODE_LOCAL
                .equals(
                    value
                ) ||
            FinoraPortableBranchAuthStore
                .STORAGE_MODE_USB
                .equals(
                    value
                );
    }
}