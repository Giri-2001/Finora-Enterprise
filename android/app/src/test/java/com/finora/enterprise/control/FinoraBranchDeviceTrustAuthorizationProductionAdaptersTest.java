package com.finora.enterprise.control;

import org.junit.Test;

import java.lang.reflect.Constructor;
import java.time.Instant;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertSame;
import static org.junit.Assert.assertTrue;

public final class
    FinoraBranchDeviceTrustAuthorizationProductionAdaptersTest {

    @Test
    public void authenticatedPayloadMapsToReducedStateExactly()
        throws Exception {

        FinoraPortableBranchAuthPayloadCodec
            .SourceAuthorizationEvidence evidence =
                construct(
                    FinoraPortableBranchAuthPayloadCodec
                        .SourceAuthorizationEvidence.class,
                    new Class<?>[] {
                        String.class,
                        String.class,
                        String.class,
                        long.class,
                        FinoraPortableBranchAuthPayloadCodec
                            .VerifiedControlSigner.class,
                        FinoraPortableBranchAuthPayloadCodec
                            .PortabilityAuthorityProof.class,
                        String.class,
                        int.class
                    },
                    new Object[] {
                        "FINORA-CREDENTIAL-ENROLLMENT-STATE-1",
                        "SOURCE-PACKAGE-1",
                        "ISSUER-1",
                        1L,
                        null,
                        null,
                        "2026-09-18T10:00:00Z",
                        1
                    }
                );

        FinoraPortableBranchAuthPayloadCodec.Payload payload =
            construct(
                FinoraPortableBranchAuthPayloadCodec.Payload.class,
                new Class<?>[] {
                    int.class,
                    String.class,
                    String.class,
                    FinoraPortableBranchAuthPayloadCodec
                        .SourceAuthorizationEvidence.class,
                    String.class,
                    String.class,
                    String.class,
                    String.class,
                    String.class,
                    String.class,
                    String.class,
                    String.class,
                    String.class,
                    String.class,
                    String.class,
                    FinoraPortableBranchAuthPayloadCodec.Verifier.class,
                    FinoraPortableBranchAuthPayloadCodec.Verifier.class,
                    long.class,
                    String.class,
                    String.class,
                    FinoraBranchCertificationCryptoValidator.Material.class
                },
                new Object[] {
                    1,
                    "AUTH-STATE-1",
                    "FINORA-CREDENTIAL-ENROLLMENT-STATE-1",
                    evidence,
                    "OWNER-1",
                    "BUSINESS-1",
                    "BRANCH-1",
                    "USER-1",
                    "Owner",
                    "owner",
                    "Owner Name",
                    "ADMIN",
                    "REAL",
                    null,
                    "USB",
                    null,
                    null,
                    7L,
                    "2026-09-18T10:00:00Z",
                    "2026-09-18T10:00:00Z",
                    null
                }
            );

        String fingerprint =
            "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" +
            "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

        FinoraBranchDeviceTrustAuthorizationAuthority
            .AuthenticatedPortableState state =
                FinoraBranchDeviceTrustAuthorizationProductionAdapters
                    .authenticatedStateFromPayload(
                        payload,
                        fingerprint
                    );

        assertEquals(
            "AUTH-STATE-1",
            state.authStateId
        );

        assertEquals(
            7L,
            state.authGeneration
        );

        assertEquals(
            "USER-1",
            state.userId
        );

        assertEquals(
            "Owner",
            state.username
        );

        assertEquals(
            "owner",
            state.canonicalUsername
        );

        assertEquals(
            "OWNER-1",
            state.ownerId
        );

        assertEquals(
            "BUSINESS-1",
            state.businessId
        );

        assertEquals(
            "BRANCH-1",
            state.branchId
        );

        assertEquals(
            "USB",
            state.storageMode
        );

        assertEquals(
            fingerprint,
            state.portableAuthFingerprint
        );

        assertEquals(
            1,
            state.portableAuthSchemaVersion
        );

        assertEquals(
            "FINORA-CREDENTIAL-ENROLLMENT-STATE-1",
            state.sourceAuthorizationId
        );

        assertSame(
            evidence,
            state.sourceAuthorizationVerificationEvidence
        );
    }

    @Test
    public void portabilityVerificationUsesExactInjectedInstantAndState()
        throws Exception {

        final Instant expected =
            Instant.parse(
                "2026-09-18T11:22:33Z"
            );

        final FinoraBranchDeviceTrustAuthorizationAuthority
            .AuthenticatedPortableState state =
                new FinoraBranchDeviceTrustAuthorizationAuthority
                    .AuthenticatedPortableState(
                        "AUTH-1",
                        1L,
                        "USER-1",
                        "Owner",
                        "owner",
                        "Owner Name",
                        "ADMIN",
                        "OWNER-1",
                        "BUSINESS-1",
                        "BRANCH-1",
                        "LOCAL",
                        "REAL",
                        null,
                        "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb" +
                            "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
                        1,
                        "SOURCE-1",
                        null
                    );

        final Instant[] observedInstant =
            new Instant[1];

        final FinoraBranchDeviceTrustAuthorizationAuthority
            .AuthenticatedPortableState[] observedState =
                new FinoraBranchDeviceTrustAuthorizationAuthority
                    .AuthenticatedPortableState[1];

        FinoraBranchDeviceTrustAuthorizationAuthority
            .PortabilityVerificationPort port =
                FinoraBranchDeviceTrustAuthorizationProductionAdapters
                    .portabilityVerificationFromSources(
                        new FinoraBranchDeviceTrustAuthorizationProductionAdapters
                            .CurrentInstantSource() {

                            @Override
                            public Instant now() {
                                return expected;
                            }
                        },
                        new FinoraBranchDeviceTrustAuthorizationProductionAdapters
                            .PortabilityVerifierSource() {

                            @Override
                            public boolean verify(
                                FinoraBranchDeviceTrustAuthorizationAuthority
                                    .AuthenticatedPortableState candidate,
                                Instant now
                            ) {

                                observedState[0] =
                                    candidate;

                                observedInstant[0] =
                                    now;

                                return true;
                            }
                        }
                    );

        assertTrue(
            port.verify(
                state
            )
        );

        assertSame(
            state,
            observedState[0]
        );

        assertEquals(
            expected,
            observedInstant[0]
        );
    }

    @SuppressWarnings("unchecked")
    private static <T> T construct(
        Class<T> type,
        Class<?>[] parameterTypes,
        Object[] arguments
    )
        throws Exception {

        Constructor<T> constructor =
            type.getDeclaredConstructor(
                parameterTypes
            );

        constructor.setAccessible(
            true
        );

        return constructor.newInstance(
            arguments
        );
    }
}