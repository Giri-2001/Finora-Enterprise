package com.finora.enterprise.control;

import android.content.Context;

import java.nio.charset.StandardCharsets;

import java.security.MessageDigest;

import java.time.Instant;

/**
 * Production composition for Android fresh-device login recovery.
 *
 * Order:
 * 1. B2B checks local credential presence.
 * 2. B1 performs Password-only pre-auth against exact selected storage.
 * 3. Security Code decrypts authenticated Portable Branch Auth.
 * 4. Signed Branch Portability Authority proof is verified.
 * 5. Signed Runtime Authority is verified using the Branch
 *    Certification key carried by authenticated Portable Auth.
 * 6. Credential verifier state is projected.
 * 7. Current native Android P-256 binding is ensured.
 * 8. H1 writes one complete encrypted Control State atomically.
 * 9. Caller reruns the existing normal password-first authority,
 *    which performs Device Trust authorization/session work.
 */
public final class
    FinoraPortableFreshDeviceRecoveryProductionFactory {

    private static final String ERROR_SECURITY_CODE_INVALID =
        "SECURITY_CODE_INVALID";

    private static final String ERROR_PORTABILITY_AUTHORITY_INVALID =
        "PORTABILITY_AUTHORITY_INVALID";

    private static final String ERROR_RUNTIME_AUTHORITY_FAILED =
        "RUNTIME_AUTHORITY_FAILED";

    private static final String ERROR_STORAGE_MODE_MISMATCH =
        "STORAGE_MODE_MISMATCH";

    private static final String ERROR_RECOVERY_FAILED =
        "FRESH_DEVICE_RECOVERY_FAILED";

    private FinoraPortableFreshDeviceRecoveryProductionFactory() {
    }

    public static FinoraPortableFreshDeviceLoginRecoveryCoordinator
        create(
            Context context,
            final FinoraPortableBranchAuthStore portableAuthStore,
            final FinoraInstallationBindingService
                installationBindingService,
            final FinoraControlStore controlStore
        ) {

        if (
            context == null ||
            portableAuthStore == null ||
            installationBindingService == null ||
            controlStore == null
        ) {
            throw new IllegalArgumentException(
                "FINORA fresh-device recovery production dependencies are required."
            );
        }

        final Context applicationContext =
            context.getApplicationContext() == null
                ? context
                : context.getApplicationContext();

        final FinoraBranchCredentialStore credentialStore =
            new FinoraBranchCredentialStore(
                applicationContext
            );

        final FinoraPortableFreshDevicePasswordPreAuthAuthority
            preAuth =
                new FinoraPortableFreshDevicePasswordPreAuthAuthority(
                    portableAuthStore
                );

        final FinoraPortableFreshDeviceRuntimeAuthorityStore
            runtimeAuthorityStore =
                new FinoraPortableFreshDeviceRuntimeAuthorityStore(
                    applicationContext
                );

        final FinoraPortableFreshDeviceHydrationService
            hydrationService =
                new FinoraPortableFreshDeviceHydrationService(
                    new FinoraPortableFreshDeviceHydrationService
                        .ControlStatePort() {

                        @Override
                        public String read()
                            throws Exception {

                            return controlStore.read();
                        }

                        @Override
                        public void write(
                            String serialized
                        ) throws Exception {

                            controlStore.write(
                                serialized
                            );
                        }
                    }
                );

        return new FinoraPortableFreshDeviceLoginRecoveryCoordinator(
            new FinoraPortableFreshDeviceLoginRecoveryCoordinator
                .LocalCredentialPresencePort() {

                @Override
                public boolean exists(
                    String username
                ) throws Exception {

                    return credentialStore
                        .findActiveByUsername(
                            username
                        ) != null;
                }
            },
            new FinoraPortableFreshDeviceLoginRecoveryCoordinator
                .PasswordPreAuthPort() {

                @Override
                public FinoraPortableFreshDevicePasswordPreAuthAuthority
                    .Result authenticate(
                        String username,
                        String password,
                        String storageMode
                    ) throws Exception {

                    return preAuth.authenticate(
                                new FinoraPortableFreshDevicePasswordPreAuthAuthority.Request(
                                    username,
                                    password,
                                    storageMode
                                )
                            );
                }
            },
            new FinoraPortableFreshDeviceLoginRecoveryCoordinator
                .RecoveryCompletionPort() {

                @Override
                public FinoraPortableFreshDeviceLoginRecoveryCoordinator
                    .CompletionResult complete(
                        FinoraPortableFreshDeviceLoginRecoveryCoordinator
                            .Request request
                    ) {

                    return completeRecovery(
                        request,
                        portableAuthStore,
                        runtimeAuthorityStore,
                        installationBindingService,
                        hydrationService
                    );
                }
            }
        );
    }

    private static FinoraPortableFreshDeviceLoginRecoveryCoordinator
        .CompletionResult completeRecovery(
            FinoraPortableFreshDeviceLoginRecoveryCoordinator.Request
                request,
            FinoraPortableBranchAuthStore portableAuthStore,
            FinoraPortableFreshDeviceRuntimeAuthorityStore
                runtimeAuthorityStore,
            FinoraInstallationBindingService installationBindingService,
            FinoraPortableFreshDeviceHydrationService hydrationService
        ) {

        if (
            request == null ||
            isBlank(
                request.username
            ) ||
            isBlank(
                request.password
            ) ||
            isBlank(
                request.storageMode
            ) ||
            request.securityCode == null
        ) {
            return FinoraPortableFreshDeviceLoginRecoveryCoordinator
                .CompletionResult.failure(
                    ERROR_RECOVERY_FAILED,
                    "FINORA fresh-device recovery input is incomplete."
                );
        }

        try {
            String serializedPortableAuth =
                portableAuthStore.read(
                    request.storageMode
                );

            FinoraPortableBranchAuthEnvelopeCodec.Envelope envelope =
                FinoraPortableBranchAuthEnvelopeCodec
                    .parse(
                        serializedPortableAuth
                    );

            String canonicalPortableAuth =
                FinoraPortableBranchAuthEnvelopeCodec
                    .serialize(
                        envelope
                    );

            String portableAuthFingerprint =
                sha256Utf8(
                    canonicalPortableAuth
                );

            final String canonicalUsername;

            try {
                canonicalUsername =
                    FinoraBranchCredentialContract
                        .canonicalizeUsername(
                            request.username
                        );
            }
            catch (Exception error) {
                return FinoraPortableFreshDeviceLoginRecoveryCoordinator
                    .CompletionResult.failure(
                        FinoraPortableFreshDevicePasswordPreAuthAuthority
                            .INVALID_CREDENTIALS,
                        "Invalid username or password."
                    );
            }

            if (
                !canonicalUsername.equals(
                    envelope.canonicalUsername
                )
            ) {
                return FinoraPortableFreshDeviceLoginRecoveryCoordinator
                    .CompletionResult.failure(
                        FinoraPortableFreshDevicePasswordPreAuthAuthority
                            .INVALID_CREDENTIALS,
                        "Invalid username or password."
                    );
            }

            final FinoraPortableBranchAuthPayloadCodec.Payload
                portablePayload;

            try {
                portablePayload =
                    FinoraPortableBranchAuthAuthenticatedDecryptAuthority
                        .decrypt(
                            envelope,
                            request.password,
                            request.securityCode,
                            envelope.branchScope
                        );
            }
            catch (
                FinoraPortableBranchAuthDecryptAuthority.CryptoException
                    error
            ) {
                return FinoraPortableFreshDeviceLoginRecoveryCoordinator
                    .CompletionResult.failure(
                        ERROR_SECURITY_CODE_INVALID,
                        "FINORA Security Code is invalid."
                    );
            }

            if (
                portablePayload == null ||
                !canonicalUsername.equals(
                    portablePayload.canonicalUsername
                ) ||
                !request.storageMode.equals(
                    portablePayload.storageMode
                )
            ) {
                return FinoraPortableFreshDeviceLoginRecoveryCoordinator
                    .CompletionResult.failure(
                        ERROR_STORAGE_MODE_MISMATCH,
                        "FINORA Portable Branch Auth does not match the selected storage mode or authenticated user."
                    );
            }

            Instant now =
                Instant.now();

            if (
                !FinoraBranchPortabilityAuthorityVerifier
                    .verify(
                        portablePayload,
                        now
                    )
            ) {
                return FinoraPortableFreshDeviceLoginRecoveryCoordinator
                    .CompletionResult.failure(
                        ERROR_PORTABILITY_AUTHORITY_INVALID,
                        "FINORA signed Branch Portability Authority is invalid."
                    );
            }

            String serializedRuntimeAuthority =
                runtimeAuthorityStore.read(
                    request.storageMode
                );

            FinoraPortableFreshDeviceRuntimeAuthorityVerifier.Result
                runtimeResult =
                    FinoraPortableFreshDeviceRuntimeAuthorityVerifier
                        .verify(
                            serializedRuntimeAuthority,
                            portablePayload.branchCertificationKeyMaterial
                        );

            if (
                runtimeResult == null ||
                !runtimeResult.success ||
                runtimeResult.data == null
            ) {
                return FinoraPortableFreshDeviceLoginRecoveryCoordinator
                    .CompletionResult.failure(
                        runtimeResult != null &&
                            !isBlank(
                                runtimeResult.errorCode
                            )
                                ? runtimeResult.errorCode
                                : ERROR_RUNTIME_AUTHORITY_FAILED,
                        runtimeResult != null &&
                            !isBlank(
                                runtimeResult.error
                            )
                                ? runtimeResult.error
                                : "FINORA Fresh Device Runtime Authority verification failed."
                    );
            }

            FinoraBranchCredentialContract.Credential credential =
                new FinoraBranchCredentialContract.Credential(
                    runtimeResult.data.credentialId,
                    portablePayload.sourceAuthorizationId,
                    Long.valueOf(
                        portablePayload.authGeneration
                    ),
                    portablePayload.userId,
                    portablePayload.username,
                    portablePayload.canonicalUsername,
                    portablePayload.fullName,
                    portablePayload.role,
                    portablePayload.ownerId,
                    portablePayload.businessId,
                    portablePayload.branchId,
                    portablePayload.storageMode,
                    portablePayload.dataContext,
                    portablePayload.demoId,
                    FinoraBranchCredentialContract.STATUS_ACTIVE,
                    FinoraBranchCredentialContract
                        .projectPortableVerifier(
                            portablePayload.passwordVerifier
                        ),
                    FinoraBranchCredentialContract
                        .projectPortableVerifier(
                            portablePayload.securityVerifier
                        ),
                    portablePayload.createdAt,
                    portablePayload.updatedAt,
                    FinoraBranchCredentialContract.SCHEMA_VERSION
                );

            FinoraInstallationBindingCrypto.PublicBinding nativeBinding =
                installationBindingService.ensure();

            if (nativeBinding == null) {
                return FinoraPortableFreshDeviceLoginRecoveryCoordinator
                    .CompletionResult.failure(
                        ERROR_RECOVERY_FAILED,
                        "FINORA current Android installation binding is unavailable."
                    );
            }

            FinoraPortableFreshDeviceHydrationService.Result
                hydrationResult =
                    hydrationService.hydrate(
                        new FinoraPortableFreshDeviceHydrationService
                            .Request(
                                credential,
                                runtimeResult.data,
                                portableAuthFingerprint,
                                new FinoraPortableFreshDeviceHydrationService
                                    .NativeBinding(
                                        nativeBinding.installationId,
                                        nativeBinding.bindingKeyId,
                                        nativeBinding.fingerprintAlgorithm,
                                        nativeBinding.publicKeyFingerprint
                                    ),
                                now.toString()
                            )
                    );

            if (
                hydrationResult == null ||
                !hydrationResult.success
            ) {
                return FinoraPortableFreshDeviceLoginRecoveryCoordinator
                    .CompletionResult.failure(
                        hydrationResult != null &&
                            !isBlank(
                                hydrationResult.errorCode
                            )
                                ? hydrationResult.errorCode
                                : ERROR_RECOVERY_FAILED,
                        hydrationResult != null &&
                            !isBlank(
                                hydrationResult.error
                            )
                                ? hydrationResult.error
                                : "FINORA fresh-device native hydration failed."
                    );
            }

            return FinoraPortableFreshDeviceLoginRecoveryCoordinator
                .CompletionResult.success();
        }
        catch (Exception error) {
            return FinoraPortableFreshDeviceLoginRecoveryCoordinator
                .CompletionResult.failure(
                    ERROR_RECOVERY_FAILED,
                    messageOrDefault(
                        error,
                        "FINORA fresh-device recovery failed."
                    )
                );
        }
    }

    private static String sha256Utf8(
        String value
    ) throws Exception {

        MessageDigest digest =
            MessageDigest.getInstance(
                "SHA-256"
            );

        byte[] bytes =
            digest.digest(
                value.getBytes(
                    StandardCharsets.UTF_8
                )
            );

        StringBuilder result =
            new StringBuilder(
                bytes.length * 2
            );

        for (byte current : bytes) {
            result.append(
                String.format(
                    java.util.Locale.ROOT,
                    "%02x",
                    current & 0xff
                )
            );
        }

        return result.toString();
    }

    private static boolean isBlank(
        String value
    ) {
        return
            value == null ||
            value.trim().isEmpty();
    }

    private static String messageOrDefault(
        Exception error,
        String fallback
    ) {
        if (error == null) {
            return fallback;
        }

        String message =
            error.getMessage();

        return isBlank(message)
            ? fallback
            : message;
    }
}