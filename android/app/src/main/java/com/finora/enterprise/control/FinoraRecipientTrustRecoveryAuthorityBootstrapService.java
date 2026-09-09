package com.finora.enterprise.control;

import java.util.regex.Pattern;

/* ============================================================
   FINORA ENTERPRISE OS™

   ANDROID RECIPIENT TRUST RECOVERY AUTHORITY BOOTSTRAP

   MODULE  : Control
   LAYER   : Native Recovery Public-Root Provisioning Authority
   VERSION : 1.0
   STATUS  : Production Foundation

   RESPONSIBILITY:

   - Accept independently supplied Recovery Authority PUBLIC root
   - Require canonical lowercase SHA-256 SPKI fingerprint
   - Validate P-256 SPKI public key
   - Derive and enforce canonical signingKeyId
   - Resolve authoritative native installation binding
   - Refuse replacement of an existing Recovery Authority root
   - Obtain provisionedAt from recipient clock high-water authority
   - Bind Recovery Authority root to exact native installation
   - Persist encrypted Recovery Authority public-root state
   - Read back and confirm the exact persisted authority

   REQUEST:

   - recoveryAuthorityId
   - signingKeyId
   - algorithm
   - format
   - publicKey
   - expectedPublicKeyFingerprint

   SUCCESS RESULT:

   - recoveryAuthorityId
   - signingKeyId
   - publicKeyFingerprint
   - installationId
   - provisionedAt

   SECURITY:

   - Fingerprint must be supplied independently from publicKey.
   - No trust-on-first-use from a signed recovery package.
   - No recovery package import.
   - No private Recovery Authority key.
   - No operational Control Center signing authority.
   - No recipient operational trust mutation.
   - No renderer / Capacitor API.
   - No caller-supplied installation target.
   - No caller-supplied provisioning time.
   - Invalid request / fingerprint / P-256 / signingKeyId checks
     complete before clock observation.
   - Existing root refusal completes before clock observation.
   - Clock rollback rejection occurs before root persistence.

   CONCURRENCY:

   - Uses the same recipient trust class monitor as transition
     mutation so recipient trust authority work is serialized
     within this Android process.
   - No cross-process compare-and-swap guarantee is claimed.
============================================================ */

public final class FinoraRecipientTrustRecoveryAuthorityBootstrapService {

    // ========================================================
    // CONTRACT
    // ========================================================

    private static final Pattern CANONICAL_SHA256 =
        Pattern.compile(
            "^[0-9a-f]{64}$"
        );

    // ========================================================
    // REQUEST
    // ========================================================

    public static final class Request {

        public final String recoveryAuthorityId;

        public final String signingKeyId;

        public final String algorithm;

        public final String format;

        public final String publicKey;

        public final String expectedPublicKeyFingerprint;

        public Request(
            String recoveryAuthorityId,
            String signingKeyId,
            String algorithm,
            String format,
            String publicKey,
            String expectedPublicKeyFingerprint
        ) {
            this.recoveryAuthorityId =
                recoveryAuthorityId;

            this.signingKeyId =
                signingKeyId;

            this.algorithm =
                algorithm;

            this.format =
                format;

            this.publicKey =
                publicKey;

            this.expectedPublicKeyFingerprint =
                expectedPublicKeyFingerprint;
        }
    }

    // ========================================================
    // SUCCESS DATA
    // ========================================================

    public static final class Data {

        public final String recoveryAuthorityId;

        public final String signingKeyId;

        public final String publicKeyFingerprint;

        public final String installationId;

        public final String provisionedAt;

        private Data(
            String recoveryAuthorityId,
            String signingKeyId,
            String publicKeyFingerprint,
            String installationId,
            String provisionedAt
        ) {
            this.recoveryAuthorityId =
                recoveryAuthorityId;

            this.signingKeyId =
                signingKeyId;

            this.publicKeyFingerprint =
                publicKeyFingerprint;

            this.installationId =
                installationId;

            this.provisionedAt =
                provisionedAt;
        }
    }

    // ========================================================
    // RESULT
    // ========================================================

    public static final class Result {

        public final boolean success;

        public final Data data;

        public final String error;

        private Result(
            boolean success,
            Data data,
            String error
        ) {
            this.success =
                success;

            this.data =
                data;

            this.error =
                error;
        }

        private static Result success(
            Data data
        ) {
            return new Result(
                true,
                data,
                null
            );
        }

        private static Result failure(
            String error
        ) {
            return new Result(
                false,
                null,
                error
            );
        }
    }

    // ========================================================
    // DEPENDENCIES
    // ========================================================

    private final FinoraRecipientTrustRecoveryAuthorityStore
        recoveryAuthorityStore;

    private final FinoraInstallationBindingService
        bindingService;

    private final FinoraClockHighWaterAuthorityService
        clockHighWaterAuthority;

    // ========================================================
    // CONSTRUCTOR
    // ========================================================

    public FinoraRecipientTrustRecoveryAuthorityBootstrapService(
        FinoraRecipientTrustRecoveryAuthorityStore recoveryAuthorityStore,
        FinoraInstallationBindingService bindingService,
        FinoraClockHighWaterAuthorityService clockHighWaterAuthority
    ) {
        if (recoveryAuthorityStore == null) {
            throw new IllegalArgumentException(
                "FINORA Recovery Authority bootstrap requires recovery-authority store."
            );
        }

        if (bindingService == null) {
            throw new IllegalArgumentException(
                "FINORA Recovery Authority bootstrap requires installation binding service."
            );
        }

        if (clockHighWaterAuthority == null) {
            throw new IllegalArgumentException(
                "FINORA Recovery Authority bootstrap requires clock high-water authority."
            );
        }

        this.recoveryAuthorityStore =
            recoveryAuthorityStore;

        this.bindingService =
            bindingService;

        this.clockHighWaterAuthority =
            clockHighWaterAuthority;
    }

    // ========================================================
    // PUBLIC BOOTSTRAP
    // ========================================================

    public Result bootstrap(
        Request request
    ) {
        synchronized (
            FinoraRecipientTrustStore.class
        ) {
            return bootstrapLocked(
                request
            );
        }
    }

    // ========================================================
    // BOOTSTRAP LOCKED
    // ========================================================

    private Result bootstrapLocked(
        Request request
    ) {

        try {
            // ------------------------------------------------
            // REQUEST STRUCTURE
            // ------------------------------------------------

            if (request == null) {
                return Result.failure(
                    "FINORA Recovery Authority bootstrap request is required."
                );
            }

            if (
                !isNonEmptyString(
                    request.recoveryAuthorityId
                ) ||
                !isNonEmptyString(
                    request.signingKeyId
                ) ||
                !FinoraRecipientTrustRecoveryAuthorityState
                    .SIGNATURE_ALGORITHM
                    .equals(
                        request.algorithm
                    ) ||
                !FinoraRecipientTrustRecoveryAuthorityState
                    .PUBLIC_KEY_FORMAT
                    .equals(
                        request.format
                    ) ||
                !isNonEmptyString(
                    request.publicKey
                )
            ) {
                return Result.failure(
                    "FINORA Recovery Authority bootstrap request structure is invalid."
                );
            }

            // ------------------------------------------------
            // INDEPENDENT FINGERPRINT CONTRACT
            //
            // Must be canonical before any authority mutation
            // or clock observation.
            // ------------------------------------------------

            if (
                request.expectedPublicKeyFingerprint ==
                    null ||
                !CANONICAL_SHA256
                    .matcher(
                        request.expectedPublicKeyFingerprint
                    )
                    .matches()
            ) {
                return Result.failure(
                    "FINORA Recovery Authority bootstrap requires a canonical lowercase SHA-256 public-key fingerprint."
                );
            }

            // ------------------------------------------------
            // P-256 SPKI + ACTUAL FINGERPRINT
            //
            // createPublicKeyFingerprint performs strict Base64
            // and P-256 SPKI validation.
            // ------------------------------------------------

            final String actualPublicKeyFingerprint;

            try {
                actualPublicKeyFingerprint =
                    FinoraRecipientTrustRecoveryAuthorityState
                        .createPublicKeyFingerprint(
                            request.publicKey
                        );
            } catch (
                Exception error
            ) {
                return Result.failure(
                    messageOrDefault(
                        error,
                        "FINORA Recovery Authority bootstrap public key is invalid."
                    )
                );
            }

            if (
                !request.expectedPublicKeyFingerprint.equals(
                    actualPublicKeyFingerprint
                )
            ) {
                return Result.failure(
                    "FINORA Recovery Authority bootstrap public-key fingerprint does not match the independently supplied fingerprint."
                );
            }

            // ------------------------------------------------
            // CANONICAL SIGNING KEY ID
            // ------------------------------------------------

            String expectedSigningKeyId =
                FinoraRecipientTrustRecoveryAuthorityState
                    .createSigningKeyId(
                        actualPublicKeyFingerprint
                    );

            if (
                !request.signingKeyId.equals(
                    expectedSigningKeyId
                )
            ) {
                return Result.failure(
                    "FINORA Recovery Authority bootstrap signingKeyId does not match the recovery public key."
                );
            }

            // ------------------------------------------------
            // AUTHORITATIVE NATIVE INSTALLATION BINDING
            //
            // No caller installation target is accepted.
            // ------------------------------------------------

            final FinoraInstallationBindingCrypto.PublicBinding
                nativeBinding;

            try {
                nativeBinding =
                    bindingService.get();
            } catch (
                Exception error
            ) {
                return Result.failure(
                    messageOrDefault(
                        error,
                        "FINORA native installation binding could not be resolved for Recovery Authority bootstrap."
                    )
                );
            }

            if (
                nativeBinding == null ||
                !isNonEmptyString(
                    nativeBinding.installationId
                ) ||
                !isNonEmptyString(
                    nativeBinding.bindingKeyId
                ) ||
                !"SHA-256".equals(
                    nativeBinding.fingerprintAlgorithm
                ) ||
                nativeBinding.publicKeyFingerprint ==
                    null ||
                !CANONICAL_SHA256
                    .matcher(
                        nativeBinding.publicKeyFingerprint
                    )
                    .matches()
            ) {
                return Result.failure(
                    "FINORA native installation binding is required before Recovery Authority bootstrap."
                );
            }

            // ------------------------------------------------
            // EXISTING ROOT = BOOTSTRAP FORBIDDEN
            //
            // This check intentionally occurs before clock
            // observation so a rejected second bootstrap causes
            // zero root and zero clock mutation.
            //
            // read() also fails closed if an existing encrypted
            // store is malformed or undecryptable.
            // ------------------------------------------------

            final String existingSerializedState;

            try {
                existingSerializedState =
                    recoveryAuthorityStore.read();
            } catch (
                Exception error
            ) {
                return Result.failure(
                    messageOrDefault(
                        error,
                        "FINORA existing Recovery Authority state could not be loaded."
                    )
                );
            }

            if (existingSerializedState != null) {
                try {
                    FinoraRecipientTrustRecoveryAuthorityState
                        .parse(
                            existingSerializedState
                        );
                } catch (
                    Exception error
                ) {
                    return Result.failure(
                        messageOrDefault(
                            error,
                            "FINORA existing Recovery Authority state is invalid."
                        )
                    );
                }

                return Result.failure(
                    "FINORA Recovery Authority is already provisioned and cannot be replaced through bootstrap."
                );
            }

            // ------------------------------------------------
            // AUTHORITATIVE CLOCK OBSERVATION
            //
            // Invalid requests and existing-root attempts never
            // reach this point.
            //
            // Clock rollback rejection therefore occurs before
            // Recovery Authority persistence.
            // ------------------------------------------------

            FinoraClockHighWaterAuthorityService.Result
                clockResult =
                    clockHighWaterAuthority.observe();

            if (
                !clockResult.success ||
                clockResult.data == null
            ) {
                return Result.failure(
                    clockResult.error != null
                        ? clockResult.error
                        : "FINORA clock authority rejected Recovery Authority bootstrap."
                );
            }

            if (
                !nativeBinding.installationId.equals(
                    clockResult.data.installationId
                )
            ) {
                return Result.failure(
                    "FINORA Recovery Authority bootstrap clock observation does not belong to the authoritative native installation."
                );
            }

            String provisionedAt =
                clockResult.data.observedAt;

            if (
                !isNonEmptyString(
                    provisionedAt
                )
            ) {
                return Result.failure(
                    "FINORA Recovery Authority bootstrap clock observation is invalid."
                );
            }

            // ------------------------------------------------
            // AUTHORITATIVE RECOVERY ROOT STATE
            // ------------------------------------------------

            FinoraRecipientTrustRecoveryAuthorityState.Installation
                installation =
                    new FinoraRecipientTrustRecoveryAuthorityState.Installation(
                        nativeBinding.installationId,
                        nativeBinding.bindingKeyId,
                        nativeBinding.fingerprintAlgorithm,
                        nativeBinding.publicKeyFingerprint
                    );

            FinoraRecipientTrustRecoveryAuthorityState.Authority
                authority =
                    new FinoraRecipientTrustRecoveryAuthorityState.Authority(
                        FinoraRecipientTrustRecoveryAuthorityState.AUTHORITY_TYPE,
                        request.recoveryAuthorityId,
                        request.signingKeyId,
                        request.algorithm,
                        request.format,
                        request.publicKey,
                        FinoraRecipientTrustRecoveryAuthorityState.FINGERPRINT_ALGORITHM,
                        actualPublicKeyFingerprint
                    );

            FinoraRecipientTrustRecoveryAuthorityState.State
                proposedState =
                    new FinoraRecipientTrustRecoveryAuthorityState.State(
                        FinoraRecipientTrustRecoveryAuthorityState.SCHEMA_VERSION,
                        installation,
                        authority,
                        provisionedAt
                    );

            final String serializedState;

            try {
                serializedState =
                    FinoraRecipientTrustRecoveryAuthorityState
                        .serialize(
                            proposedState
                        );
            } catch (
                Exception error
            ) {
                return Result.failure(
                    messageOrDefault(
                        error,
                        "FINORA Recovery Authority bootstrap state validation failed."
                    )
                );
            }

            // ------------------------------------------------
            // PERSIST ROOT
            // ------------------------------------------------

            try {
                recoveryAuthorityStore.write(
                    serializedState
                );
            } catch (
                Exception error
            ) {
                return Result.failure(
                    messageOrDefault(
                        error,
                        "FINORA Recovery Authority bootstrap state could not be persisted."
                    )
                );
            }

            // ------------------------------------------------
            // READ-BACK CONFIRMATION
            // ------------------------------------------------

            final String persistedSerializedState;

            try {
                persistedSerializedState =
                    recoveryAuthorityStore.read();
            } catch (
                Exception error
            ) {
                return Result.failure(
                    messageOrDefault(
                        error,
                        "FINORA Recovery Authority bootstrap persistence could not be confirmed."
                    )
                );
            }

            if (persistedSerializedState == null) {
                return Result.failure(
                    "FINORA Recovery Authority bootstrap persistence could not be confirmed."
                );
            }

            final FinoraRecipientTrustRecoveryAuthorityState.State
                persistedState;

            try {
                persistedState =
                    FinoraRecipientTrustRecoveryAuthorityState
                        .parse(
                            persistedSerializedState
                        );
            } catch (
                Exception error
            ) {
                return Result.failure(
                    messageOrDefault(
                        error,
                        "FINORA persisted Recovery Authority state is invalid."
                    )
                );
            }

            if (
                !persistedStateMatches(
                    persistedState,
                    nativeBinding,
                    request,
                    actualPublicKeyFingerprint,
                    provisionedAt
                )
            ) {
                return Result.failure(
                    "FINORA Recovery Authority bootstrap persisted state does not match the authorized public root."
                );
            }

            // ------------------------------------------------
            // SUCCESS
            // ------------------------------------------------

            return Result.success(
                new Data(
                    persistedState
                        .authority
                        .recoveryAuthorityId,
                    persistedState
                        .authority
                        .signingKeyId,
                    persistedState
                        .authority
                        .publicKeyFingerprint,
                    persistedState
                        .installation
                        .installationId,
                    persistedState
                        .provisionedAt
                )
            );
        } catch (
            Exception error
        ) {
            return Result.failure(
                messageOrDefault(
                    error,
                    "FINORA Recovery Authority bootstrap failed."
                )
            );
        }
    }

    // ========================================================
    // READ-BACK MATCH
    // ========================================================

    private static boolean persistedStateMatches(
        FinoraRecipientTrustRecoveryAuthorityState.State state,
        FinoraInstallationBindingCrypto.PublicBinding nativeBinding,
        Request request,
        String actualPublicKeyFingerprint,
        String provisionedAt
    ) {

        if (
            state == null ||
            state.installation == null ||
            state.authority == null ||
            nativeBinding == null ||
            request == null
        ) {
            return false;
        }

        return (
            state.schemaVersion ==
                FinoraRecipientTrustRecoveryAuthorityState.SCHEMA_VERSION &&

            nativeBinding.installationId.equals(
                state.installation.installationId
            ) &&

            nativeBinding.bindingKeyId.equals(
                state.installation.bindingKeyId
            ) &&

            nativeBinding.fingerprintAlgorithm.equals(
                state.installation.fingerprintAlgorithm
            ) &&

            nativeBinding.publicKeyFingerprint.equals(
                state.installation.publicKeyFingerprint
            ) &&

            FinoraRecipientTrustRecoveryAuthorityState.AUTHORITY_TYPE.equals(
                state.authority.type
            ) &&

            request.recoveryAuthorityId.equals(
                state.authority.recoveryAuthorityId
            ) &&

            request.signingKeyId.equals(
                state.authority.signingKeyId
            ) &&

            request.algorithm.equals(
                state.authority.algorithm
            ) &&

            request.format.equals(
                state.authority.format
            ) &&

            request.publicKey.equals(
                state.authority.publicKey
            ) &&

            FinoraRecipientTrustRecoveryAuthorityState.FINGERPRINT_ALGORITHM.equals(
                state.authority.fingerprintAlgorithm
            ) &&

            actualPublicKeyFingerprint.equals(
                state.authority.publicKeyFingerprint
            ) &&

            provisionedAt.equals(
                state.provisionedAt
            )
        );
    }

    // ========================================================
    // HELPERS
    // ========================================================

    private static boolean isNonEmptyString(
        String value
    ) {

        return (
            value != null &&
            !value.trim().isEmpty()
        );
    }

    private static String messageOrDefault(
        Exception error,
        String fallback
    ) {

        if (
            error == null ||
            error.getMessage() == null ||
            error.getMessage()
                .trim()
                .isEmpty()
        ) {
            return fallback;
        }

        return error.getMessage();
    }
}

/* ============================================================
   END
============================================================ */