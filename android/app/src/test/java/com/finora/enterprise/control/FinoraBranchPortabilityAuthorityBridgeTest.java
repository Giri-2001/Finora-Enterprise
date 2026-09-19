package com.finora.enterprise.control;

import org.junit.Test;

import java.lang.reflect.Constructor;
import java.util.Map;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;

public final class FinoraBranchPortabilityAuthorityBridgeTest {

    @Test
    public void typedPackageMapsToExactGenericShape()
        throws Exception {

        FinoraPortableBranchAuthPayloadCodec
            .SignedPortabilityAuthorityPackage typed =
                createPackage(
                    null,
                    null
                );

        Map<String, Object> mapped =
            FinoraBranchPortabilityAuthorityBridge
                .toControlPackage(
                    typed
                );

        assertEquals(
            11,
            mapped.size()
        );

        assertEquals(
            1,
            mapped.get(
                "schemaVersion"
            )
        );

        assertEquals(
            "FINORA-BRANCH-PORTABILITY-TEST",
            mapped.get(
                "packageId"
            )
        );

        assertEquals(
            "BRANCH_PORTABILITY_AUTHORITY",
            mapped.get(
                "purpose"
            )
        );

        assertFalse(
            mapped.containsKey(
                "expiresAt"
            )
        );

        @SuppressWarnings("unchecked")
        Map<String, Object> issuer =
            (Map<String, Object>) mapped.get(
                "issuer"
            );

        assertEquals(
            3,
            issuer.size()
        );

        assertEquals(
            "FINORA_CONTROL_CENTER",
            issuer.get(
                "type"
            )
        );

        @SuppressWarnings("unchecked")
        Map<String, Object> target =
            (Map<String, Object>) mapped.get(
                "target"
            );

        assertEquals(
            3,
            target.size()
        );

        assertEquals(
            "OWNER-1",
            target.get(
                "ownerId"
            )
        );

        assertEquals(
            "BUSINESS-1",
            target.get(
                "businessId"
            )
        );

        assertEquals(
            "BRANCH-1",
            target.get(
                "branchId"
            )
        );

        @SuppressWarnings("unchecked")
        Map<String, Object> payload =
            (Map<String, Object>) mapped.get(
                "payload"
            );

        assertEquals(
            11,
            payload.size()
        );

        assertFalse(
            payload.containsKey(
                "demoId"
            )
        );

        assertEquals(
            "FINORA-CREDENTIAL-ENROLLMENT-TEST",
            payload.get(
                "sourceAuthorizationId"
            )
        );

        assertEquals(
            "LOCAL",
            payload.get(
                "storageMode"
            )
        );

        assertEquals(
            "REAL",
            payload.get(
                "dataContext"
            )
        );

        @SuppressWarnings("unchecked")
        Map<String, Object> digest =
            (Map<String, Object>) mapped.get(
                "payloadDigest"
            );

        assertEquals(
            2,
            digest.size()
        );

        assertEquals(
            "SHA-256",
            digest.get(
                "algorithm"
            )
        );

        @SuppressWarnings("unchecked")
        Map<String, Object> signature =
            (Map<String, Object>) mapped.get(
                "signature"
            );

        assertEquals(
            5,
            signature.size()
        );

        assertEquals(
            "ECDSA_P256_SHA256",
            signature.get(
                "algorithm"
            )
        );

        assertEquals(
            "IEEE_P1363",
            signature.get(
                "encoding"
            )
        );

        assertEquals(
            "FINORA_CANONICAL_JSON_V1",
            signature.get(
                "canonicalization"
            )
        );
    }

    @Test
    public void optionalExpiresAtAndDemoIdArePreserved()
        throws Exception {

        FinoraPortableBranchAuthPayloadCodec
            .SignedPortabilityAuthorityPackage typed =
                createPackage(
                    "2026-12-31T23:59:59Z",
                    "DEMO-1"
                );

        Map<String, Object> mapped =
            FinoraBranchPortabilityAuthorityBridge
                .toControlPackage(
                    typed
                );

        assertEquals(
            "2026-12-31T23:59:59Z",
            mapped.get(
                "expiresAt"
            )
        );

        @SuppressWarnings("unchecked")
        Map<String, Object> payload =
            (Map<String, Object>) mapped.get(
                "payload"
            );

        assertEquals(
            "DEMO-1",
            payload.get(
                "demoId"
            )
        );
    }

    @Test
    public void verifiedSignerMapsExactlyToTrustedKey()
        throws Exception {

        FinoraPortableBranchAuthPayloadCodec.VerifiedControlSigner signer =
            createSigner();

        FinoraSignedControlPackageVerifier.TrustedKey trusted =
            FinoraBranchPortabilityAuthorityBridge
                .toTrustedKey(
                    signer
                );

        assertEquals(
            signer.issuerId,
            trusted.issuerId
        );

        assertEquals(
            signer.signingKeyId,
            trusted.signingKeyId
        );

        assertEquals(
            signer.algorithm,
            trusted.algorithm
        );

        assertEquals(
            signer.format,
            trusted.format
        );

        assertEquals(
            signer.publicKey,
            trusted.publicKey
        );

        assertEquals(
            signer.status,
            trusted.status
        );

        assertEquals(
            signer.validFrom,
            trusted.validFrom
        );

        assertNull(
            trusted.validUntil
        );
    }

    private static FinoraPortableBranchAuthPayloadCodec
        .SignedPortabilityAuthorityPackage createPackage(
            String expiresAt,
            String demoId
        )
            throws Exception {

        FinoraPortableBranchAuthPayloadCodec.PackageIssuer issuer =
            construct(
                FinoraPortableBranchAuthPayloadCodec
                    .PackageIssuer.class,
                new Class<?>[] {
                    String.class,
                    String.class,
                    String.class
                },
                new Object[] {
                    "FINORA_CONTROL_CENTER",
                    "ISSUER-1",
                    "SIGNING-KEY-1"
                }
            );

        FinoraPortableBranchAuthPayloadCodec.BranchTarget target =
            construct(
                FinoraPortableBranchAuthPayloadCodec
                    .BranchTarget.class,
                new Class<?>[] {
                    String.class,
                    String.class,
                    String.class
                },
                new Object[] {
                    "OWNER-1",
                    "BUSINESS-1",
                    "BRANCH-1"
                }
            );

        FinoraPortableBranchAuthPayloadCodec.PortabilityPayload payload =
            construct(
                FinoraPortableBranchAuthPayloadCodec
                    .PortabilityPayload.class,
                new Class<?>[] {
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
                    int.class
                },
                new Object[] {
                    "FINORA-CREDENTIAL-ENROLLMENT-TEST",
                    "USER-1",
                    "owner",
                    "ADMIN",
                    "OWNER-1",
                    "BUSINESS-1",
                    "BRANCH-1",
                    "LOCAL",
                    demoId == null
                        ? "REAL"
                        : "DEMO",
                    demoId,
                    "BRANCH_ACCESS_CREDENTIAL_ENROLLMENT",
                    1
                }
            );

        FinoraPortableBranchAuthPayloadCodec.PayloadDigest digest =
            construct(
                FinoraPortableBranchAuthPayloadCodec
                    .PayloadDigest.class,
                new Class<?>[] {
                    String.class,
                    String.class
                },
                new Object[] {
                    "SHA-256",
                    "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
                }
            );

        FinoraPortableBranchAuthPayloadCodec.PackageSignature signature =
            construct(
                FinoraPortableBranchAuthPayloadCodec
                    .PackageSignature.class,
                new Class<?>[] {
                    String.class,
                    String.class,
                    String.class,
                    String.class
                },
                new Object[] {
                    "ECDSA_P256_SHA256",
                    "IEEE_P1363",
                    "SIGNING-KEY-1",
                    "TEST-SIGNATURE"
                }
            );

        return construct(
            FinoraPortableBranchAuthPayloadCodec
                .SignedPortabilityAuthorityPackage.class,
            new Class<?>[] {
                String.class,
                String.class,
                FinoraPortableBranchAuthPayloadCodec.PackageIssuer.class,
                FinoraPortableBranchAuthPayloadCodec.BranchTarget.class,
                String.class,
                String.class,
                long.class,
                int.class,
                FinoraPortableBranchAuthPayloadCodec.PortabilityPayload.class,
                FinoraPortableBranchAuthPayloadCodec.PayloadDigest.class,
                FinoraPortableBranchAuthPayloadCodec.PackageSignature.class,
                int.class
            },
            new Object[] {
                "FINORA-BRANCH-PORTABILITY-TEST",
                "BRANCH_PORTABILITY_AUTHORITY",
                issuer,
                target,
                "2026-09-18T12:00:00Z",
                expiresAt,
                1L,
                1,
                payload,
                digest,
                signature,
                1
            }
        );
    }

    private static FinoraPortableBranchAuthPayloadCodec
        .VerifiedControlSigner createSigner()
            throws Exception {

        return construct(
            FinoraPortableBranchAuthPayloadCodec
                .VerifiedControlSigner.class,
            new Class<?>[] {
                String.class,
                String.class,
                String.class,
                String.class,
                String.class,
                String.class,
                String.class,
                String.class
            },
            new Object[] {
                "ISSUER-1",
                "SIGNING-KEY-1",
                "ECDSA_P256_SHA256",
                "SPKI_DER_BASE64",
                "PUBLIC-KEY",
                "ACTIVE",
                "2026-01-01T00:00:00Z",
                null
            }
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