package com.finora.enterprise.control;

import java.time.Instant;

/**
 * Production adapters for fresh-device Device Trust
 * authorization.
 *
 * Ordering:
 * 1. read only the explicitly selected Portable Auth store;
 * 2. strictly parse and canonically serialize the envelope;
 * 3. derive the canonical Portable Auth fingerprint;
 * 4. authenticate Password + Security Code and exact branch
 *    scope through the authenticated decrypt authority;
 * 5. map only identity/context + signed-source evidence into
 *    the reduced Device Trust authorization state;
 * 6. verify current-time signed portability authority through
 *    the dedicated PortabilityVerificationPort.
 *
 * This class does not persist Device Trust and does not read a
 * native private key.
 */
public final class
    FinoraBranchDeviceTrustAuthorizationProductionAdapters {

    interface CurrentInstantSource {

        Instant now();
    }

    interface PortabilityVerifierSource {

        boolean verify(
            FinoraBranchDeviceTrustAuthorizationAuthority
                .AuthenticatedPortableState state,
            Instant now
        );
    }

    private FinoraBranchDeviceTrustAuthorizationProductionAdapters() {
    }

    static FinoraBranchDeviceTrustAuthorizationAuthority
        .AuthenticatedPortableAuthPort authenticatedPortableAuth(
            final FinoraPortableBranchAuthStore store
        ) {

        if (store == null) {
            throw new IllegalArgumentException(
                "FINORA Portable Branch Auth Store is required."
            );
        }

        return new FinoraBranchDeviceTrustAuthorizationAuthority
            .AuthenticatedPortableAuthPort() {

            @Override
            public FinoraBranchDeviceTrustAuthorizationAuthority
                .AuthenticatedPortableState authenticate(
                    FinoraBranchDeviceTrustAuthorizationAuthority
                        .Principal principal,
                    String password,
                    String securityCode
                )
                    throws Exception {

                if (principal == null) {
                    throw new IllegalArgumentException(
                        "FINORA password-authenticated principal is required."
                    );
                }

                String serialized =
                    store.read(
                        principal.storageMode
                    );

                FinoraPortableBranchAuthEnvelopeCodec.Envelope
                    envelope =
                        FinoraPortableBranchAuthEnvelopeCodec
                            .parse(
                                serialized
                            );

                String canonicalSerialized =
                    FinoraPortableBranchAuthEnvelopeCodec
                        .serialize(
                            envelope
                        );

                String portableAuthFingerprint =
                    FinoraBranchDeviceTrustProductionAdapters
                        .sha256Utf8(
                            canonicalSerialized
                        );

                FinoraPortableBranchAuthEnvelopeCodec.Scope
                    expectedScope =
                        new FinoraPortableBranchAuthEnvelopeCodec
                            .Scope(
                                principal.ownerId,
                                principal.businessId,
                                principal.branchId
                            );

                FinoraPortableBranchAuthPayloadCodec.Payload payload =
                    FinoraPortableBranchAuthAuthenticatedDecryptAuthority
                        .decrypt(
                            envelope,
                            password,
                            securityCode,
                            expectedScope
                        );

                return authenticatedStateFromPayload(
                    payload,
                    portableAuthFingerprint
                );
            }
        };
    }

    static FinoraBranchDeviceTrustAuthorizationAuthority
        .AuthenticatedPortableState authenticatedStateFromPayload(
            FinoraPortableBranchAuthPayloadCodec.Payload payload,
            String portableAuthFingerprint
        ) {

        if (
            payload == null ||
            portableAuthFingerprint == null
        ) {
            throw new IllegalArgumentException(
                "FINORA authenticated Portable Auth state is required."
            );
        }

        return new FinoraBranchDeviceTrustAuthorizationAuthority
            .AuthenticatedPortableState(
                payload.authStateId,
                payload.authGeneration,
                payload.userId,
                payload.username,
                payload.canonicalUsername,
                payload.fullName,
                payload.role,
                payload.ownerId,
                payload.businessId,
                payload.branchId,
                payload.storageMode,
                payload.dataContext,
                payload.demoId,
                portableAuthFingerprint,
                payload.schemaVersion,
                payload.sourceAuthorizationId,
                payload.sourceAuthorizationVerificationEvidence
            );
    }

    static FinoraBranchDeviceTrustAuthorizationAuthority
        .PortabilityVerificationPort portabilityVerification() {

        return portabilityVerificationFromSources(
            new CurrentInstantSource() {

                @Override
                public Instant now() {
                    return Instant.now();
                }
            },
            new PortabilityVerifierSource() {

                @Override
                public boolean verify(
                    FinoraBranchDeviceTrustAuthorizationAuthority
                        .AuthenticatedPortableState state,
                    Instant now
                ) {

                    return FinoraBranchPortabilityAuthorityVerifier
                        .verify(
                            state,
                            now
                        );
                }
            }
        );
    }

    static FinoraBranchDeviceTrustAuthorizationAuthority
        .PortabilityVerificationPort
            portabilityVerificationFromSources(
                final CurrentInstantSource clock,
                final PortabilityVerifierSource verifier
            ) {

        if (
            clock == null ||
            verifier == null
        ) {
            throw new IllegalArgumentException(
                "FINORA portability verification dependencies are required."
            );
        }

        return new FinoraBranchDeviceTrustAuthorizationAuthority
            .PortabilityVerificationPort() {

            @Override
            public boolean verify(
                FinoraBranchDeviceTrustAuthorizationAuthority
                    .AuthenticatedPortableState state
            )
                throws Exception {

                if (state == null) {
                    return false;
                }

                Instant now =
                    clock.now();

                if (now == null) {
                    return false;
                }

                return verifier.verify(
                    state,
                    now
                );
            }
        };
    }

    // ========================================================
    // PRODUCTION AUTHORIZATION FACTORY
    // ========================================================

    public static FinoraBranchDeviceTrustAuthorizationAuthority
        create(
            FinoraPortableBranchAuthStore portableAuthStore,
            FinoraInstallationBindingService installationBindingService,
            FinoraBranchDeviceTrustStore deviceTrustStore
        ) {

        if (portableAuthStore == null) {
            throw new IllegalArgumentException(
                "FINORA Portable Branch Auth Store is required."
            );
        }

        if (installationBindingService == null) {
            throw new IllegalArgumentException(
                "FINORA Installation Binding Service is required."
            );
        }

        if (deviceTrustStore == null) {
            throw new IllegalArgumentException(
                "FINORA Branch Device Trust Store is required."
            );
        }

        return new FinoraBranchDeviceTrustAuthorizationAuthority(
            authenticatedPortableAuth(
                portableAuthStore
            ),
            portabilityVerification(),
            nativeBinding(
                installationBindingService
            ),
            deviceTrustStore(
                deviceTrustStore
            ),
            systemClock()
        );
    }

    static FinoraBranchDeviceTrustAuthorizationAuthority
        .NativeBindingPort nativeBinding(
            final FinoraInstallationBindingService service
        ) {

        if (service == null) {
            throw new IllegalArgumentException(
                "FINORA Installation Binding Service is required."
            );
        }

        return new FinoraBranchDeviceTrustAuthorizationAuthority
            .NativeBindingPort() {

            @Override
            public FinoraBranchDeviceTrustAuthorizationAuthority
                .NativeBinding get()
                    throws Exception {

                FinoraInstallationBindingCrypto.PublicBinding binding =
                    service.get();

                if (binding == null) {
                    return null;
                }

                return new FinoraBranchDeviceTrustAuthorizationAuthority
                    .NativeBinding(
                        binding.installationId,
                        binding.bindingKeyId,
                        binding.fingerprintAlgorithm,
                        binding.publicKeyFingerprint
                    );
            }
        };
    }

    static FinoraBranchDeviceTrustAuthorizationAuthority
        .DeviceTrustStorePort deviceTrustStore(
            final FinoraBranchDeviceTrustStore store
        ) {

        if (store == null) {
            throw new IllegalArgumentException(
                "FINORA Branch Device Trust Store is required."
            );
        }

        return new FinoraBranchDeviceTrustAuthorizationAuthority
            .DeviceTrustStorePort() {

            @Override
            public java.util.List<
                FinoraBranchDeviceTrustStore.Record
            > readAll()
                throws Exception {

                return store.readAll();
            }

            @Override
            public void persist(
                java.util.List<
                    FinoraBranchDeviceTrustStore.Record
                > records,
                String updatedAt
            )
                throws Exception {

                store.persist(
                    records,
                    updatedAt
                );
            }
        };
    }

    static FinoraBranchDeviceTrustAuthorizationAuthority
        .ClockPort systemClock() {

        return new FinoraBranchDeviceTrustAuthorizationAuthority
            .ClockPort() {

            @Override
            public String nowIso() {
                return Instant.now().toString();
            }
        };
    }
}