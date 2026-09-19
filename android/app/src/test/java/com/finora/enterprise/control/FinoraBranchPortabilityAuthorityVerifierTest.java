package com.finora.enterprise.control;

import org.junit.Test;

import java.lang.reflect.Constructor;
import java.nio.charset.StandardCharsets;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.Signature;
import java.security.spec.ECGenParameterSpec;
import java.time.Instant;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;

import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

public final class FinoraBranchPortabilityAuthorityVerifierTest {

    private static final String SOURCE_AUTHORIZATION_ID =
        "FINORA-CREDENTIAL-ENROLLMENT-PORTABILITY-1";

    private static final String OWNER_ID =
        "OWNER-PORTABILITY-1";

    private static final String BUSINESS_ID =
        "BUSINESS-PORTABILITY-1";

    private static final String BRANCH_ID =
        "BRANCH-PORTABILITY-1";

    private static final String USER_ID =
        "USER-PORTABILITY-1";

    private static final String USERNAME =
        "owner";

    private static final String ROLE =
        "ADMIN";

    private static final String ISSUER_ID =
        "FINORA-CONTROL-CENTER-PORTABILITY-1";

    private static final String SIGNING_KEY_ID =
        "CONTROL-SIGNING-KEY-PORTABILITY-1";

    private static final String ISSUED_AT =
        "2026-09-18T12:00:00Z";

    private static final String VERIFIED_AT =
        "2026-09-18T12:01:00Z";

    @Test
    public void exactRealCryptographicLineageVerifies()
        throws Exception {

        Fixture fixture =
            createFixture(
                USER_ID,
                USER_ID,
                "SET_PASSWORD_ON_RECIPIENT",
                "2026-09-19T12:00:00Z",
                true,
                false
            );

        assertTrue(
            FinoraBranchPortabilityAuthorityVerifier
                .verify(
                    fixture.payload,
                    Instant.parse(
                        "2026-09-18T13:00:00Z"
                    )
                )
        );
    }

    @Test
    public void missingPortabilityProofFailsClosed()
        throws Exception {

        Fixture fixture =
            createFixture(
                USER_ID,
                USER_ID,
                "SET_PASSWORD_ON_RECIPIENT",
                "2026-09-19T12:00:00Z",
                false,
                false
            );

        assertFalse(
            FinoraBranchPortabilityAuthorityVerifier
                .verify(
                    fixture.payload,
                    Instant.parse(
                        "2026-09-18T13:00:00Z"
                    )
                )
        );
    }

    @Test
    public void mismatchedUserLineageFailsClosed()
        throws Exception {

        Fixture fixture =
            createFixture(
                "OTHER-USER",
                USER_ID,
                "SET_PASSWORD_ON_RECIPIENT",
                "2026-09-19T12:00:00Z",
                true,
                false
            );

        assertFalse(
            FinoraBranchPortabilityAuthorityVerifier
                .verify(
                    fixture.payload,
                    Instant.parse(
                        "2026-09-18T13:00:00Z"
                    )
                )
        );
    }

    @Test
    public void wrongSourceAuthorizationMethodFailsClosed()
        throws Exception {

        Fixture fixture =
            createFixture(
                USER_ID,
                USER_ID,
                "WRONG_METHOD",
                "2026-09-19T12:00:00Z",
                true,
                false
            );

        assertFalse(
            FinoraBranchPortabilityAuthorityVerifier
                .verify(
                    fixture.payload,
                    Instant.parse(
                        "2026-09-18T13:00:00Z"
                    )
                )
        );
    }

    @Test
    public void tamperedSignatureFailsClosed()
        throws Exception {

        Fixture fixture =
            createFixture(
                USER_ID,
                USER_ID,
                "SET_PASSWORD_ON_RECIPIENT",
                "2026-09-19T12:00:00Z",
                true,
                true
            );

        assertFalse(
            FinoraBranchPortabilityAuthorityVerifier
                .verify(
                    fixture.payload,
                    Instant.parse(
                        "2026-09-18T13:00:00Z"
                    )
                )
        );
    }

    @Test
    public void expiredSignedAuthorityFailsClosed()
        throws Exception {

        Fixture fixture =
            createFixture(
                USER_ID,
                USER_ID,
                "SET_PASSWORD_ON_RECIPIENT",
                "2026-09-18T12:30:00Z",
                true,
                false
            );

        assertFalse(
            FinoraBranchPortabilityAuthorityVerifier
                .verify(
                    fixture.payload,
                    Instant.parse(
                        "2026-09-18T12:30:00.001Z"
                    )
                )
        );
    }

    @Test
    public void exactRealCryptographicReducedStateLineageVerifies()
        throws Exception {

        Fixture fixture =
            createFixture(
                USER_ID,
                USER_ID,
                "SET_PASSWORD_ON_RECIPIENT",
                "2026-09-19T12:00:00Z",
                true,
                false
            );

        FinoraPortableBranchAuthPayloadCodec.Payload payload =
            fixture.payload;

        FinoraBranchDeviceTrustAuthorizationAuthority
            .AuthenticatedPortableState state =
                new FinoraBranchDeviceTrustAuthorizationAuthority
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
                        "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" +
                            "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
                        payload.schemaVersion,
                        payload.sourceAuthorizationId,
                        payload.sourceAuthorizationVerificationEvidence
                    );

        assertTrue(
            FinoraBranchPortabilityAuthorityVerifier
                .verify(
                    state,
                    Instant.parse(
                        "2026-09-18T13:00:00Z"
                    )
                )
        );
    }
    private static Fixture createFixture(
        String topLevelUserId,
        String signedUserId,
        String sourceAuthorizationMethod,
        String expiresAt,
        boolean includeProof,
        boolean tamperSignature
    )
        throws Exception {

        KeyPairGenerator generator =
            KeyPairGenerator.getInstance(
                "EC"
            );

        generator.initialize(
            new ECGenParameterSpec(
                "secp256r1"
            )
        );

        KeyPair keyPair =
            generator.generateKeyPair();

        String publicKey =
            Base64.getEncoder().encodeToString(
                keyPair
                    .getPublic()
                    .getEncoded()
            );

        FinoraPortableBranchAuthPayloadCodec
            .VerifiedControlSigner signer =
                construct(
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
                        ISSUER_ID,
                        SIGNING_KEY_ID,
                        "ECDSA_P256_SHA256",
                        "SPKI_DER_BASE64",
                        publicKey,
                        "ACTIVE",
                        "2026-01-01T00:00:00Z",
                        null
                    }
                );

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
                    ISSUER_ID,
                    SIGNING_KEY_ID
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
                    OWNER_ID,
                    BUSINESS_ID,
                    BRANCH_ID
                }
            );

        FinoraPortableBranchAuthPayloadCodec.PortabilityPayload
            portabilityPayload =
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
                        SOURCE_AUTHORIZATION_ID,
                        signedUserId,
                        USERNAME,
                        ROLE,
                        OWNER_ID,
                        BUSINESS_ID,
                        BRANCH_ID,
                        "LOCAL",
                        "REAL",
                        null,
                        sourceAuthorizationMethod,
                        1
                    }
                );

        Map<String, Object> payloadMap =
            new LinkedHashMap<>();

        payloadMap.put(
            "sourceAuthorizationId",
            SOURCE_AUTHORIZATION_ID
        );

        payloadMap.put(
            "userId",
            signedUserId
        );

        payloadMap.put(
            "username",
            USERNAME
        );

        payloadMap.put(
            "role",
            ROLE
        );

        payloadMap.put(
            "ownerId",
            OWNER_ID
        );

        payloadMap.put(
            "businessId",
            BUSINESS_ID
        );

        payloadMap.put(
            "branchId",
            BRANCH_ID
        );

        payloadMap.put(
            "storageMode",
            "LOCAL"
        );

        payloadMap.put(
            "dataContext",
            "REAL"
        );

        payloadMap.put(
            "sourceAuthorizationMethod",
            sourceAuthorizationMethod
        );

        payloadMap.put(
            "schemaVersion",
            Integer.valueOf(
                1
            )
        );

        String canonicalPayload =
            FinoraCanonicalJson.canonicalize(
                payloadMap
            );

        String digestValue =
            FinoraSignedControlPackageVerifier
                .sha256Hex(
                    canonicalPayload
                );

        FinoraPortableBranchAuthPayloadCodec.PayloadDigest
            payloadDigest =
                construct(
                    FinoraPortableBranchAuthPayloadCodec
                        .PayloadDigest.class,
                    new Class<?>[] {
                        String.class,
                        String.class
                    },
                    new Object[] {
                        "SHA-256",
                        digestValue
                    }
                );

        Map<String, Object> issuerMap =
            new LinkedHashMap<>();

        issuerMap.put(
            "type",
            "FINORA_CONTROL_CENTER"
        );

        issuerMap.put(
            "issuerId",
            ISSUER_ID
        );

        issuerMap.put(
            "signingKeyId",
            SIGNING_KEY_ID
        );

        Map<String, Object> targetMap =
            new LinkedHashMap<>();

        targetMap.put(
            "ownerId",
            OWNER_ID
        );

        targetMap.put(
            "businessId",
            BUSINESS_ID
        );

        targetMap.put(
            "branchId",
            BRANCH_ID
        );

        Map<String, Object> digestMap =
            new LinkedHashMap<>();

        digestMap.put(
            "algorithm",
            "SHA-256"
        );

        digestMap.put(
            "value",
            digestValue
        );

        Map<String, Object> unsignedPackage =
            new LinkedHashMap<>();

        unsignedPackage.put(
            "schemaVersion",
            Integer.valueOf(
                1
            )
        );

        unsignedPackage.put(
            "packageId",
            "FINORA-BRANCH-PORTABILITY-AUTHORITY-1"
        );

        unsignedPackage.put(
            "purpose",
            "BRANCH_PORTABILITY_AUTHORITY"
        );

        unsignedPackage.put(
            "issuer",
            issuerMap
        );

        unsignedPackage.put(
            "target",
            targetMap
        );

        unsignedPackage.put(
            "issuedAt",
            ISSUED_AT
        );

        unsignedPackage.put(
            "expiresAt",
            expiresAt
        );

        unsignedPackage.put(
            "sequence",
            Long.valueOf(
                1L
            )
        );

        unsignedPackage.put(
            "payloadVersion",
            Integer.valueOf(
                1
            )
        );

        unsignedPackage.put(
            "payload",
            payloadMap
        );

        unsignedPackage.put(
            "payloadDigest",
            digestMap
        );

        String canonicalUnsignedPackage =
            FinoraCanonicalJson.canonicalize(
                unsignedPackage
            );

        Signature signatureEngine =
            Signature.getInstance(
                "SHA256withECDSA"
            );

        signatureEngine.initSign(
            keyPair.getPrivate()
        );

        signatureEngine.update(
            canonicalUnsignedPackage.getBytes(
                StandardCharsets.UTF_8
            )
        );

        byte[] p1363 =
            FinoraInstallationBindingSignatureCodec
                .derToP1363(
                    signatureEngine.sign(),
                    32
                );

        if (tamperSignature) {
            p1363[
                p1363.length - 1
            ] ^= 0x01;
        }

        String signatureValue =
            Base64.getEncoder().encodeToString(
                p1363
            );

        FinoraPortableBranchAuthPayloadCodec.PackageSignature
            signature =
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
                        SIGNING_KEY_ID,
                        signatureValue
                    }
                );

        FinoraPortableBranchAuthPayloadCodec
            .SignedPortabilityAuthorityPackage signedPackage =
                construct(
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
                        "FINORA-BRANCH-PORTABILITY-AUTHORITY-1",
                        "BRANCH_PORTABILITY_AUTHORITY",
                        issuer,
                        target,
                        ISSUED_AT,
                        expiresAt,
                        1L,
                        1,
                        portabilityPayload,
                        payloadDigest,
                        signature,
                        1
                    }
                );

        FinoraPortableBranchAuthPayloadCodec
            .PortabilityAuthorityProof proof =
                includeProof
                    ? construct(
                        FinoraPortableBranchAuthPayloadCodec
                            .PortabilityAuthorityProof.class,
                        new Class<?>[] {
                            String.class,
                            FinoraPortableBranchAuthPayloadCodec
                                .SignedPortabilityAuthorityPackage.class,
                            FinoraPortableBranchAuthPayloadCodec
                                .VerifiedControlSigner.class,
                            String.class,
                            int.class
                        },
                        new Object[] {
                            SOURCE_AUTHORIZATION_ID,
                            signedPackage,
                            signer,
                            VERIFIED_AT,
                            1
                        }
                    )
                    : null;

        FinoraPortableBranchAuthPayloadCodec
            .SourceAuthorizationEvidence sourceEvidence =
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
                        SOURCE_AUTHORIZATION_ID,
                        "FINORA-BRANCH-ACCESS-AUTHORIZATION-1",
                        ISSUER_ID,
                        1L,
                        signer,
                        proof,
                        VERIFIED_AT,
                        1
                    }
                );

        FinoraPortableBranchAuthPayloadCodec.Payload payload =
            construct(
                FinoraPortableBranchAuthPayloadCodec
                    .Payload.class,
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
                    "AUTH-STATE-PORTABILITY-1",
                    SOURCE_AUTHORIZATION_ID,
                    sourceEvidence,
                    OWNER_ID,
                    BUSINESS_ID,
                    BRANCH_ID,
                    topLevelUserId,
                    USERNAME,
                    USERNAME,
                    "Owner",
                    ROLE,
                    "REAL",
                    null,
                    "LOCAL",
                    null,
                    null,
                    1L,
                    "2026-09-18T12:02:00Z",
                    "2026-09-18T12:02:00Z",
                    null
                }
            );

        return new Fixture(
            payload
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

    private static final class Fixture {

        final FinoraPortableBranchAuthPayloadCodec.Payload
            payload;

        Fixture(
            FinoraPortableBranchAuthPayloadCodec.Payload payload
        ) {
            this.payload =
                payload;
        }
    }
}