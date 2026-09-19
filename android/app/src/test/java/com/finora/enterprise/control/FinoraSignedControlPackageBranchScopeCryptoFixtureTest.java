package com.finora.enterprise.control;

import org.junit.Test;

import java.nio.charset.StandardCharsets;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.Signature;
import java.security.spec.ECGenParameterSpec;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertSame;
import static org.junit.Assert.assertTrue;

public final class
    FinoraSignedControlPackageBranchScopeCryptoFixtureTest {

    private static final String OWNER_ID =
        "OWNER-CRYPTO-1";

    private static final String BUSINESS_ID =
        "BUSINESS-CRYPTO-1";

    private static final String BRANCH_ID =
        "BRANCH-CRYPTO-1";

    private static final String ISSUER_ID =
        "FINORA-CONTROL-CENTER-CRYPTO-1";

    private static final String SIGNING_KEY_ID =
        "CONTROL-SIGNING-KEY-CRYPTO-1";

    private static final String ISSUED_AT =
        "2026-09-18T12:00:00Z";

    private static final String EXPIRES_AT =
        "2026-09-19T12:00:00Z";

    @Test
    public void realSignedBranchScopePackageVerifies()
        throws Exception {

        Fixture fixture =
            createFixture(
                EXPIRES_AT
            );

        FinoraSignedControlPackageVerifier.Result result =
            FinoraSignedControlPackageVerifier
                .verifyBranchScope(
                    fixture.controlPackage,
                    fixture.trustedKeys,
                    OWNER_ID,
                    BUSINESS_ID,
                    BRANCH_ID,
                    Instant.parse(
                        "2026-09-18T12:30:00Z"
                    )
                );

        assertTrue(
            result.error,
            result.valid
        );

        assertNull(
            result.reason
        );

        assertNull(
            result.error
        );

        assertSame(
            fixture.controlPackage,
            result.controlPackage
        );
    }

    @Test
    public void tamperedRealSignatureFailsClosed()
        throws Exception {

        Fixture fixture =
            createFixture(
                EXPIRES_AT
            );

        @SuppressWarnings("unchecked")
        Map<String, Object> originalSignature =
            (Map<String, Object>)
                fixture.controlPackage.get(
                    "signature"
                );

        byte[] signatureBytes =
            Base64.getDecoder().decode(
                (String) originalSignature.get(
                    "value"
                )
            );

        signatureBytes[
            signatureBytes.length - 1
        ] ^= 0x01;

        Map<String, Object> tamperedSignature =
            new LinkedHashMap<>(
                originalSignature
            );

        tamperedSignature.put(
            "value",
            Base64.getEncoder().encodeToString(
                signatureBytes
            )
        );

        Map<String, Object> tamperedPackage =
            new LinkedHashMap<>(
                fixture.controlPackage
            );

        tamperedPackage.put(
            "signature",
            tamperedSignature
        );

        FinoraSignedControlPackageVerifier.Result result =
            FinoraSignedControlPackageVerifier
                .verifyBranchScope(
                    tamperedPackage,
                    fixture.trustedKeys,
                    OWNER_ID,
                    BUSINESS_ID,
                    BRANCH_ID,
                    Instant.parse(
                        "2026-09-18T12:30:00Z"
                    )
                );

        assertFalse(
            result.valid
        );

        assertEquals(
            "INVALID_SIGNATURE",
            result.reason
        );
    }

    @Test
    public void signedTopLevelExpiryFailsAfterExactBoundary()
        throws Exception {

        Fixture fixture =
            createFixture(
                "2026-09-18T12:30:00Z"
            );

        FinoraSignedControlPackageVerifier.Result
            exactBoundary =
                FinoraSignedControlPackageVerifier
                    .verifyBranchScope(
                        fixture.controlPackage,
                        fixture.trustedKeys,
                        OWNER_ID,
                        BUSINESS_ID,
                        BRANCH_ID,
                        Instant.parse(
                            "2026-09-18T12:30:00Z"
                        )
                    );

        assertTrue(
            exactBoundary.error,
            exactBoundary.valid
        );

        FinoraSignedControlPackageVerifier.Result
            afterBoundary =
                FinoraSignedControlPackageVerifier
                    .verifyBranchScope(
                        fixture.controlPackage,
                        fixture.trustedKeys,
                        OWNER_ID,
                        BUSINESS_ID,
                        BRANCH_ID,
                        Instant.parse(
                            "2026-09-18T12:30:00.001Z"
                        )
                    );

        assertFalse(
            afterBoundary.valid
        );

        assertEquals(
            "PACKAGE_EXPIRED",
            afterBoundary.reason
        );
    }

    private static Fixture createFixture(
        String expiresAt
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

        Map<String, Object> issuer =
            new LinkedHashMap<>();

        issuer.put(
            "type",
            "FINORA_CONTROL_CENTER"
        );

        issuer.put(
            "issuerId",
            ISSUER_ID
        );

        issuer.put(
            "signingKeyId",
            SIGNING_KEY_ID
        );

        Map<String, Object> target =
            new LinkedHashMap<>();

        target.put(
            "ownerId",
            OWNER_ID
        );

        target.put(
            "businessId",
            BUSINESS_ID
        );

        target.put(
            "branchId",
            BRANCH_ID
        );

        Map<String, Object> payload =
            new LinkedHashMap<>();

        payload.put(
            "sourceAuthorizationId",
            "FINORA-CREDENTIAL-ENROLLMENT-CRYPTO-1"
        );

        payload.put(
            "userId",
            "USER-CRYPTO-1"
        );

        payload.put(
            "username",
            "owner"
        );

        payload.put(
            "role",
            "ADMIN"
        );

        payload.put(
            "ownerId",
            OWNER_ID
        );

        payload.put(
            "businessId",
            BUSINESS_ID
        );

        payload.put(
            "branchId",
            BRANCH_ID
        );

        payload.put(
            "storageMode",
            "LOCAL"
        );

        payload.put(
            "dataContext",
            "REAL"
        );

        payload.put(
            "sourceAuthorizationMethod",
            "SET_PASSWORD_ON_RECIPIENT"
        );

        payload.put(
            "schemaVersion",
            Integer.valueOf(
                1
            )
        );

        String canonicalPayload =
            FinoraCanonicalJson.canonicalize(
                payload
            );

        String payloadDigestValue =
            FinoraSignedControlPackageVerifier
                .sha256Hex(
                    canonicalPayload
                );

        Map<String, Object> payloadDigest =
            new LinkedHashMap<>();

        payloadDigest.put(
            "algorithm",
            "SHA-256"
        );

        payloadDigest.put(
            "value",
            payloadDigestValue
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
            "FINORA-BRANCH-PORTABILITY-CRYPTO-1"
        );

        unsignedPackage.put(
            "purpose",
            "BRANCH_PORTABILITY_AUTHORITY"
        );

        unsignedPackage.put(
            "issuer",
            issuer
        );

        unsignedPackage.put(
            "target",
            target
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
            payload
        );

        unsignedPackage.put(
            "payloadDigest",
            payloadDigest
        );

        String canonicalUnsignedPackage =
            FinoraCanonicalJson.canonicalize(
                unsignedPackage
            );

        Signature signer =
            Signature.getInstance(
                "SHA256withECDSA"
            );

        signer.initSign(
            keyPair.getPrivate()
        );

        signer.update(
            canonicalUnsignedPackage.getBytes(
                StandardCharsets.UTF_8
            )
        );

        byte[] derSignature =
            signer.sign();

        byte[] p1363Signature =
            FinoraInstallationBindingSignatureCodec
                .derToP1363(
                    derSignature,
                    32
                );

        assertEquals(
            64,
            p1363Signature.length
        );

        Map<String, Object> signature =
            new LinkedHashMap<>();

        signature.put(
            "algorithm",
            "ECDSA_P256_SHA256"
        );

        signature.put(
            "encoding",
            "IEEE_P1363"
        );

        signature.put(
            "canonicalization",
            "FINORA_CANONICAL_JSON_V1"
        );

        signature.put(
            "signingKeyId",
            SIGNING_KEY_ID
        );

        signature.put(
            "value",
            Base64.getEncoder().encodeToString(
                p1363Signature
            )
        );

        Map<String, Object> signedPackage =
            new LinkedHashMap<>(
                unsignedPackage
            );

        signedPackage.put(
            "signature",
            signature
        );

        FinoraSignedControlPackageVerifier.TrustedKey
            trustedKey =
                new FinoraSignedControlPackageVerifier
                    .TrustedKey(
                        ISSUER_ID,
                        SIGNING_KEY_ID,
                        "ECDSA_P256_SHA256",
                        "SPKI_DER_BASE64",
                        Base64.getEncoder().encodeToString(
                            keyPair
                                .getPublic()
                                .getEncoded()
                        ),
                        "ACTIVE",
                        "2026-01-01T00:00:00Z",
                        null
                    );

        List<
            FinoraSignedControlPackageVerifier.TrustedKey
        > trustedKeys =
            new ArrayList<>();

        trustedKeys.add(
            trustedKey
        );

        return new Fixture(
            signedPackage,
            trustedKeys
        );
    }

    private static final class Fixture {

        final Map<String, Object>
            controlPackage;

        final List<
            FinoraSignedControlPackageVerifier.TrustedKey
        > trustedKeys;

        Fixture(
            Map<String, Object> controlPackage,
            List<
                FinoraSignedControlPackageVerifier.TrustedKey
            > trustedKeys
        ) {
            this.controlPackage =
                controlPackage;

            this.trustedKeys =
                trustedKeys;
        }
    }
}