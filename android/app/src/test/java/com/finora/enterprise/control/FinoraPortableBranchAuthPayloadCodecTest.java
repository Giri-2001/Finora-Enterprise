package com.finora.enterprise.control;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertThrows;

import java.nio.charset.StandardCharsets;

import org.junit.Test;

public final class FinoraPortableBranchAuthPayloadCodecTest {

    @Test
    public void parsesStrictRealCorePayload() {

        FinoraPortableBranchAuthPayloadCodec.Payload payload =
            parse(
                realPayload()
            );

        assertEquals(
            1,
            payload.schemaVersion
        );

        assertEquals(
            "FINORA-PORTABLE-AUTH-STATE-0001",
            payload.authStateId
        );

        assertEquals(
            "AUTH-0001",
            payload.sourceAuthorizationId
        );

        assertEquals(
            "AUTH-0001",
            payload
                .sourceAuthorizationVerificationEvidence
                .authorizationId
        );

        assertEquals(
            7L,
            payload
                .sourceAuthorizationVerificationEvidence
                .sequence
        );

        assertEquals(
            "ISSUER-01",
            payload
                .sourceAuthorizationVerificationEvidence
                .verifiedControlSigner
                .issuerId
        );

        assertEquals(
            "admin",
            payload.canonicalUsername
        );

        assertEquals(
            "REAL",
            payload.dataContext
        );

        assertNull(
            payload.demoId
        );

        assertEquals(
            "USB",
            payload.storageMode
        );

        assertEquals(
            1L,
            payload.authGeneration
        );
    }

    @Test
    public void parsesStrictDemoCorePayload() {

        String json =
            realPayload()
                .replace(
                    "\"dataContext\":\"REAL\",",
                    "\"dataContext\":\"DEMO\",\"demoId\":\"DEMO-0001\","
                );

        FinoraPortableBranchAuthPayloadCodec.Payload payload =
            parse(
                json
            );

        assertEquals(
            "DEMO",
            payload.dataContext
        );

        assertEquals(
            "DEMO-0001",
            payload.demoId
        );
    }

    @Test
    public void rejectsUnknownTopLevelField() {

        String json =
            realPayload()
                .replace(
                    "\"updatedAt\":\"2026-09-18T05:00:00.000Z\"}",
                    "\"updatedAt\":\"2026-09-18T05:00:00.000Z\",\"unexpected\":true}"
                );

        assertThrows(
            IllegalArgumentException.class,
            () ->
                parse(
                    json
                )
        );
    }

    @Test
    public void rejectsRealPayloadWithDemoId() {

        String json =
            realPayload()
                .replace(
                    "\"storageMode\":\"USB\",",
                    "\"demoId\":\"DEMO-NOT-ALLOWED\",\"storageMode\":\"USB\","
                );

        assertThrows(
            IllegalArgumentException.class,
            () ->
                parse(
                    json
                )
        );
    }

    @Test
    public void rejectsNonCanonicalUsername() {

        String json =
            realPayload()
                .replace(
                    "\"canonicalUsername\":\"admin\"",
                    "\"canonicalUsername\":\"Admin\""
                );

        assertThrows(
            IllegalArgumentException.class,
            () ->
                parse(
                    json
                )
        );
    }

    @Test
    public void rejectsSourceAuthorizationMismatch() {

        String json =
            realPayload()
                .replace(
                    "\"authorizationId\":\"AUTH-0001\"",
                    "\"authorizationId\":\"AUTH-OTHER\""
                );

        assertThrows(
            IllegalArgumentException.class,
            () ->
                parse(
                    json
                )
        );
    }

    @Test
    public void rejectsSignerIssuerMismatch() {

        String json =
            realPayload()
                .replace(
                    "\"verifiedControlSigner\":{\"issuerId\":\"ISSUER-01\"",
                    "\"verifiedControlSigner\":{\"issuerId\":\"ISSUER-OTHER\""
                );

        assertThrows(
            IllegalArgumentException.class,
            () ->
                parse(
                    json
                )
        );
    }

    @Test
    public void rejectsZeroSequence() {

        String json =
            realPayload()
                .replace(
                    "\"sequence\":7",
                    "\"sequence\":0"
                );

        assertThrows(
            IllegalArgumentException.class,
            () ->
                parse(
                    json
                )
        );
    }

    @Test
    public void rejectsZeroAuthGeneration() {

        String json =
            realPayload()
                .replace(
                    "\"authGeneration\":1",
                    "\"authGeneration\":0"
                );

        assertThrows(
            IllegalArgumentException.class,
            () ->
                parse(
                    json
                )
        );
    }

    @Test
    public void rejectsNonCanonicalTimestamp() {

        String json =
            realPayload()
                .replace(
                    "2026-09-18T05:00:00.000Z",
                    "2026-09-18T05:00:00Z"
                );

        assertThrows(
            IllegalArgumentException.class,
            () ->
                parse(
                    json
                )
        );
    }

    @Test
    public void rejectsUpdatedAtBeforeCreatedAt() {

        String json =
            realPayload()
                .replace(
                    "\"updatedAt\":\"2026-09-18T05:00:00.000Z\"",
                    "\"updatedAt\":\"2026-09-17T05:00:00.000Z\""
                );

        assertThrows(
            IllegalArgumentException.class,
            () ->
                parse(
                    json
                )
        );
    }

    @Test
    public void rejectsUnsupportedPortabilityAuthorityUntilDedicatedValidatorExists() {

        String json =
            realPayload()
                .replace(
                    "\"verifiedAt\":\"2026-09-18T04:00:00.000Z\",",
                    "\"portabilityAuthorityProof\":{},\"verifiedAt\":\"2026-09-18T04:00:00.000Z\","
                );

        assertThrows(
            IllegalArgumentException.class,
            () ->
                parse(
                    json
                )
        );
    }

    @Test
    public void parsesValidatedBranchCertificationKeyMaterial()
        throws Exception {

        FinoraPortableBranchAuthPayloadCodec.Payload payload =
            parse(
                realPayloadWithBranchCertificationMaterial(
                    "PKCS8_DER_BASE64"
                )
            );

        org.junit.Assert.assertNotNull(
            payload.branchCertificationKeyMaterial
        );

        org.junit.Assert.assertEquals(
            "ECDSA_P256_SHA256",
            payload
                .branchCertificationKeyMaterial
                .algorithm
        );

        org.junit.Assert.assertEquals(
            "SPKI_DER_BASE64",
            payload
                .branchCertificationKeyMaterial
                .publicKeyFormat
        );

        org.junit.Assert.assertEquals(
            "PKCS8_DER_BASE64",
            payload
                .branchCertificationKeyMaterial
                .privateKeyFormat
        );
    }

    @Test
    public void keepsBranchCertificationOptionalWhenAbsent() {

        FinoraPortableBranchAuthPayloadCodec.Payload payload =
            parse(
                realPayload()
            );

        org.junit.Assert.assertNull(
            payload.branchCertificationKeyMaterial
        );
    }

    @Test
    public void rejectsCryptographicallyInvalidBranchCertificationMaterial()
        throws Exception {

        String json =
            realPayloadWithBranchCertificationMaterial(
                "WRONG_FORMAT"
            );

        assertThrows(
            IllegalArgumentException.class,
            () ->
                parse(
                    json
                )
        );
    }

    @Test
    public void parsesValidPortabilityAuthorityProof() {

        FinoraPortableBranchAuthPayloadCodec.Payload payload =
            parse(
                realPayloadWithPortabilityProof()
            );

        assertEquals(
            "FINORA-CREDENTIAL-ENROLLMENT-0001",
            payload
                .sourceAuthorizationVerificationEvidence
                .portabilityAuthorityProof
                .sourceAuthorizationId
        );

        assertEquals(
            "BRANCH_PORTABILITY_AUTHORITY",
            payload
                .sourceAuthorizationVerificationEvidence
                .portabilityAuthorityProof
                .signedPortabilityAuthorityPackage
                .purpose
        );

        assertEquals(
            "ADMIN",
            payload
                .sourceAuthorizationVerificationEvidence
                .portabilityAuthorityProof
                .signedPortabilityAuthorityPackage
                .payload
                .role
        );

        assertEquals(
            "SET_PASSWORD_ON_RECIPIENT",
            payload
                .sourceAuthorizationVerificationEvidence
                .portabilityAuthorityProof
                .signedPortabilityAuthorityPackage
                .payload
                .sourceAuthorizationMethod
        );
    }

    @Test
    public void acceptsWindowsCompatibleExtraSignedPackageField() {

        FinoraPortableBranchAuthPayloadCodec.Payload payload =
            parse(
                realPayloadWithPortabilityProof()
            );

        assertEquals(
            "FINORA-BRANCH-PORTABILITY-0001",
            payload
                .sourceAuthorizationVerificationEvidence
                .portabilityAuthorityProof
                .signedPortabilityAuthorityPackage
                .packageId
        );
    }

    @Test
    public void rejectsPortabilityAuthorityLineageMismatch() {

        String json =
            realPayloadWithPortabilityProof()
                .replace(
                    "\"portabilityAuthorityProof\":{\"sourceAuthorizationId\":\"FINORA-CREDENTIAL-ENROLLMENT-0001\"",
                    "\"portabilityAuthorityProof\":{\"sourceAuthorizationId\":\"FINORA-CREDENTIAL-ENROLLMENT-OTHER\""
                );

        assertThrows(
            IllegalArgumentException.class,
            () ->
                parse(
                    json
                )
        );
    }

    @Test
    public void rejectsInvalidPortabilityPayloadRole() {

        String json =
            realPayloadWithPortabilityProof()
                .replace(
                    "\"role\":\"ADMIN\"",
                    "\"role\":\"OWNER\""
                );

        assertThrows(
            IllegalArgumentException.class,
            () ->
                parse(
                    json
                )
        );
    }

    @Test
    public void rejectsPortabilityTargetPayloadMismatch() {

        String json =
            realPayloadWithPortabilityProof()
                .replace(
                    "\"target\":{\"ownerId\":\"OWNER-01\",\"businessId\":\"BUSINESS-01\",\"branchId\":\"BRANCH-01\"}",
                    "\"target\":{\"ownerId\":\"OWNER-01\",\"businessId\":\"BUSINESS-01\",\"branchId\":\"BRANCH-OTHER\"}"
                );

        assertThrows(
            IllegalArgumentException.class,
            () ->
                parse(
                    json
                )
        );
    }

    private static String realPayloadWithPortabilityProof() {

        String base =
            realPayload()
                .replace(
                    "AUTH-0001",
                    "FINORA-CREDENTIAL-ENROLLMENT-0001"
                );

        String portabilityProof =
            "\"portabilityAuthorityProof\":{" +
                "\"sourceAuthorizationId\":\"FINORA-CREDENTIAL-ENROLLMENT-0001\"," +
                "\"signedPortabilityAuthorityPackage\":{" +
                    "\"packageId\":\"FINORA-BRANCH-PORTABILITY-0001\"," +
                    "\"purpose\":\"BRANCH_PORTABILITY_AUTHORITY\"," +
                    "\"issuer\":{" +
                        "\"type\":\"FINORA_CONTROL_CENTER\"," +
                        "\"issuerId\":\"ISSUER-01\"," +
                        "\"signingKeyId\":\"SIGNING-KEY-01\"" +
                    "}," +
                    "\"target\":{" +
                        "\"ownerId\":\"OWNER-01\"," +
                        "\"businessId\":\"BUSINESS-01\"," +
                        "\"branchId\":\"BRANCH-01\"" +
                    "}," +
                    "\"issuedAt\":\"2026-09-18T03:00:00.000Z\"," +
                    "\"expiresAt\":\"2027-09-18T03:00:00.000Z\"," +
                    "\"sequence\":8," +
                    "\"payloadVersion\":1," +
                    "\"payload\":{" +
                        "\"sourceAuthorizationId\":\"FINORA-CREDENTIAL-ENROLLMENT-0001\"," +
                        "\"userId\":\"USER-01\"," +
                        "\"username\":\"admin\"," +
                        "\"role\":\"ADMIN\"," +
                        "\"ownerId\":\"OWNER-01\"," +
                        "\"businessId\":\"BUSINESS-01\"," +
                        "\"branchId\":\"BRANCH-01\"," +
                        "\"storageMode\":\"USB\"," +
                        "\"dataContext\":\"REAL\"," +
                        "\"sourceAuthorizationMethod\":\"SET_PASSWORD_ON_RECIPIENT\"," +
                        "\"schemaVersion\":1" +
                    "}," +
                    "\"payloadDigest\":{" +
                        "\"algorithm\":\"SHA-256\"," +
                        "\"value\":\"0000000000000000000000000000000000000000000000000000000000000000\"" +
                    "}," +
                    "\"signature\":{" +
                        "\"algorithm\":\"ECDSA_P256_SHA256\"," +
                        "\"encoding\":\"IEEE_P1363\"," +
                        "\"signingKeyId\":\"SIGNING-KEY-01\"," +
                        "\"value\":\"SIGNATURE-EVIDENCE\"" +
                    "}," +
                    "\"schemaVersion\":1," +
                    "\"extensionField\":\"WINDOWS_VALIDATOR_ALLOWS_TOP_LEVEL_EXTENSION\"" +
                "}," +
                "\"verifiedControlSigner\":{" +
                    "\"issuerId\":\"ISSUER-01\"," +
                    "\"signingKeyId\":\"SIGNING-KEY-01\"," +
                    "\"algorithm\":\"ECDSA_P256_SHA256\"," +
                    "\"format\":\"SPKI_DER_BASE64\"," +
                    "\"publicKey\":\"PUBLIC-KEY-EVIDENCE\"," +
                    "\"status\":\"ACTIVE\"," +
                    "\"validFrom\":\"2026-01-01T00:00:00.000Z\"" +
                "}," +
                "\"verifiedAt\":\"2026-09-18T04:00:00.000Z\"," +
                "\"schemaVersion\":1" +
            "},";

        return base.replace(
            "\"verifiedAt\":\"2026-09-18T04:00:00.000Z\",",
            portabilityProof +
            "\"verifiedAt\":\"2026-09-18T04:00:00.000Z\","
        );
    }
    private static String realPayloadWithBranchCertificationMaterial(
        String privateKeyFormat
    ) throws Exception {

        java.security.KeyPairGenerator generator =
            java.security.KeyPairGenerator.getInstance(
                "EC"
            );

        generator.initialize(
            new java.security.spec.ECGenParameterSpec(
                "secp256r1"
            )
        );

        java.security.KeyPair pair =
            generator.generateKeyPair();

        byte[] publicDer =
            pair
                .getPublic()
                .getEncoded();

        String publicKey =
            java.util.Base64
                .getEncoder()
                .encodeToString(
                    publicDer
                );

        byte[] digest =
            java.security.MessageDigest
                .getInstance(
                    "SHA-256"
                )
                .digest(
                    publicDer
                );

        StringBuilder fingerprintBuilder =
            new StringBuilder(
                digest.length * 2
            );

        for (
            byte value :
            digest
        ) {

            fingerprintBuilder.append(
                String.format(
                    java.util.Locale.ROOT,
                    "%02x",
                    value & 0xff
                )
            );
        }

        String fingerprint =
            fingerprintBuilder.toString();

        String keyId =
            "FINORA-BRANCH-CERT-" +
            fingerprint
                .substring(
                    0,
                    32
                )
                .toUpperCase(
                    java.util.Locale.ROOT
                );

        String privateKey =
            java.util.Base64
                .getEncoder()
                .encodeToString(
                    pair
                        .getPrivate()
                        .getEncoded()
                );

        org.json.JSONObject certification =
            new org.json.JSONObject();

        certification.put(
            "keyId",
            keyId
        );

        certification.put(
            "algorithm",
            "ECDSA_P256_SHA256"
        );

        certification.put(
            "publicKeyFormat",
            "SPKI_DER_BASE64"
        );

        certification.put(
            "publicKey",
            publicKey
        );

        certification.put(
            "fingerprintAlgorithm",
            "SHA-256"
        );

        certification.put(
            "publicKeyFingerprint",
            fingerprint
        );

        certification.put(
            "createdAt",
            "2026-09-18T08:00:00.000Z"
        );

        certification.put(
            "schemaVersion",
            1
        );

        certification.put(
            "privateKeyFormat",
            privateKeyFormat
        );

        certification.put(
            "privateKey",
            privateKey
        );

        certification.put(
            "vaultSchemaVersion",
            1
        );

        certification.put(
            "futureExtension",
            "WINDOWS_COMPATIBLE"
        );

        return realPayload()
            .replace(
                "\"ownerId\":\"OWNER-01\"",
                "\"branchCertificationKeyMaterial\":" +
                    certification.toString() +
                    ",\"ownerId\":\"OWNER-01\""
            );
    }

    private static FinoraPortableBranchAuthPayloadCodec.Payload parse(
        String value
    ) {
        return FinoraPortableBranchAuthPayloadCodec.parseCorePayload(
            value.getBytes(
                StandardCharsets.UTF_8
            )
        );
    }

    private static String realPayload() {

        return "{" +
            "\"schemaVersion\":1," +
            "\"authStateId\":\"FINORA-PORTABLE-AUTH-STATE-0001\"," +
            "\"sourceAuthorizationId\":\"AUTH-0001\"," +
            "\"sourceAuthorizationVerificationEvidence\":{" +
                "\"authorizationId\":\"AUTH-0001\"," +
                "\"packageId\":\"PACKAGE-0001\"," +
                "\"issuerId\":\"ISSUER-01\"," +
                "\"sequence\":7," +
                "\"verifiedControlSigner\":{" +
                    "\"issuerId\":\"ISSUER-01\"," +
                    "\"signingKeyId\":\"SIGNING-KEY-01\"," +
                    "\"algorithm\":\"ECDSA_P256_SHA256\"," +
                    "\"format\":\"SPKI_DER_BASE64\"," +
                    "\"publicKey\":\"PUBLIC-KEY-EVIDENCE\"," +
                    "\"status\":\"ACTIVE\"," +
                    "\"validFrom\":\"2026-01-01T00:00:00.000Z\"" +
                "}," +
                "\"verifiedAt\":\"2026-09-18T04:00:00.000Z\"," +
                "\"schemaVersion\":1" +
            "}," +
            "\"ownerId\":\"OWNER-01\"," +
            "\"businessId\":\"BUSINESS-01\"," +
            "\"branchId\":\"BRANCH-01\"," +
            "\"userId\":\"USER-01\"," +
            "\"username\":\"admin\"," +
            "\"canonicalUsername\":\"admin\"," +
            "\"fullName\":\"FINORA Owner\"," +
            "\"role\":\"OWNER\"," +
            "\"dataContext\":\"REAL\"," +
            "\"storageMode\":\"USB\"," +
            "\"passwordVerifier\":{" +
                "\"algorithm\":\"SCRYPT\"," +
                "\"salt\":\"AAECAwQFBgcICQoLDA0ODw==\"," +
                "\"N\":32768," +
                "\"r\":8," +
                "\"p\":1," +
                "\"derivedKeyLength\":64," +
                "\"verifierLength\":32," +
                "\"verifier\":\"QEFCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaW1xdXl8=\"" +
            "}," +
            "\"securityVerifier\":{" +
                "\"algorithm\":\"SCRYPT\"," +
                "\"salt\":\"EBESExQVFhcYGRobHB0eHw==\"," +
                "\"N\":32768," +
                "\"r\":8," +
                "\"p\":1," +
                "\"derivedKeyLength\":64," +
                "\"verifierLength\":32," +
                "\"verifier\":\"ICEiIyQlJicoKSorLC0uLzAxMjM0NTY3ODk6Ozw9Pj8=\"" +
            "}," +
            "\"authGeneration\":1," +
            "\"createdAt\":\"2026-09-18T04:00:00.000Z\"," +
            "\"updatedAt\":\"2026-09-18T05:00:00.000Z\"" +
        "}";
    }
}