package com.finora.enterprise.control;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import java.nio.charset.StandardCharsets;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.Signature;
import java.security.spec.ECGenParameterSpec;

import java.time.Instant;

import java.util.ArrayList;
import java.util.Base64;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.junit.Test;

public final class FinoraBranchActivationApplyCoordinatorTest {

    private static final String OWNER_ID =
        "FINORA-ANDROID-STATUS-OWNER";

    private static final String BUSINESS_ID =
        "FINORA-ANDROID-STATUS-BUSINESS";

    private static final String BRANCH_ID =
        "FINORA-ANDROID-STATUS-BRANCH";

    private static final String INSTALLATION_ID =
        "FINORA-ANDROID-STATUS-INSTALLATION";

    private static final String ISSUER_ID =
        "FINORA-STATUS-CONTROL-CENTER-SELFTEST";

    private static final String SIGNING_KEY_ID =
        "FINORA-STATUS-CONTROL-KEY-SELFTEST";

    private static final String PUBLIC_KEY_FINGERPRINT =
        "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";

    private static final String BINDING_KEY_ID =
        "FINORA-BINDING-BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB";

    private static final Instant NOW =
        Instant.parse(
            "2026-09-06T05:00:00Z"
        );

    private static final String BASE_TIME =
        "2026-09-06T04:00:00Z";

    private static final String KEY_VALID_FROM =
        "2026-01-01T00:00:00Z";


    @Test
    public void signedBranchStatusProofMatrix()
        throws Exception {

        KeyPair signingKeyPair =
            createSigningKeyPair();

        List<
            FinoraSignedControlPackageVerifier.TrustedKey
        > trustedKeys =
            Collections.singletonList(
                new FinoraSignedControlPackageVerifier.TrustedKey(
                    ISSUER_ID,
                    SIGNING_KEY_ID,
                    "ECDSA_P256_SHA256",
                    "SPKI_DER_BASE64",
                    Base64
                        .getEncoder()
                        .encodeToString(
                            signingKeyPair
                                .getPublic()
                                .getEncoded()
                        ),
                    "ACTIVE",
                    KEY_VALID_FROM,
                    null
                )
            );

        Harness harness =
            new Harness();

        Map<String, Object> activation =
            createActivation();

        // =====================================================
        // ISSUE ACTIVE
        // =====================================================

        Map<String, Object> lifecycleInitial =
            createRegisteredGrant(
                "USER-STATUS-LIFECYCLE",
                "ACTIVE",
                BASE_TIME
            );

        Map<String, Object> issuePackage =
            createSignedActivationPackage(
                signingKeyPair,
                "FINORA-ANDROID-STATUS-ISSUE-1",
                1L,
                "ISSUE",
                activation,
                lifecycleInitial
            );

        FinoraBranchActivationApplyCoordinator.Result issueResult =
            harness.coordinator.apply(
                issuePackage,
                trustedKeys,
                NOW
            );

        assertSuccess(
            "signed ISSUE ACTIVE",
            issueResult
        );

        assertEquals(
            1,
            harness.statePort.writeCount
        );

        assertPersistedStatus(
            harness,
            "USER-STATUS-LIFECYCLE",
            "ACTIVE"
        );


        // =====================================================
        // ACTIVE -> SUSPENDED
        // =====================================================

        Map<String, Object> suspended =
            withStatus(
                lifecycleInitial,
                "SUSPENDED",
                "2026-09-06T04:01:00Z"
            );

        FinoraBranchActivationApplyCoordinator.Result suspendResult =
            harness.coordinator.apply(
                createSignedActivationPackage(
                    signingKeyPair,
                    "FINORA-ANDROID-STATUS-SUSPEND-2",
                    2L,
                    "SUSPEND",
                    activation,
                    suspended
                ),
                trustedKeys,
                NOW
            );

        assertSuccess(
            "ACTIVE -> SUSPENDED",
            suspendResult
        );

        assertEquals(
            2,
            harness.statePort.writeCount
        );

        assertPersistedStatus(
            harness,
            "USER-STATUS-LIFECYCLE",
            "SUSPENDED"
        );


        // =====================================================
        // SUSPENDED -> ACTIVE
        // =====================================================

        Map<String, Object> resumed =
            withStatus(
                suspended,
                "ACTIVE",
                "2026-09-06T04:02:00Z"
            );

        FinoraBranchActivationApplyCoordinator.Result resumeResult =
            harness.coordinator.apply(
                createSignedActivationPackage(
                    signingKeyPair,
                    "FINORA-ANDROID-STATUS-RESUME-3",
                    3L,
                    "RESUME",
                    activation,
                    resumed
                ),
                trustedKeys,
                NOW
            );

        assertSuccess(
            "SUSPENDED -> ACTIVE",
            resumeResult
        );

        assertEquals(
            3,
            harness.statePort.writeCount
        );

        assertPersistedStatus(
            harness,
            "USER-STATUS-LIFECYCLE",
            "ACTIVE"
        );


        // =====================================================
        // ACTIVE -> SUSPENDED -> REVOKED
        // =====================================================

        Map<String, Object> suspendedAgain =
            withStatus(
                resumed,
                "SUSPENDED",
                "2026-09-06T04:03:00Z"
            );

        assertSuccess(
            "ACTIVE -> SUSPENDED second transition",
            harness.coordinator.apply(
                createSignedActivationPackage(
                    signingKeyPair,
                    "FINORA-ANDROID-STATUS-SUSPEND-4",
                    4L,
                    "SUSPEND",
                    activation,
                    suspendedAgain
                ),
                trustedKeys,
                NOW
            )
        );

        assertEquals(
            4,
            harness.statePort.writeCount
        );

        Map<String, Object> revoked =
            withStatus(
                suspendedAgain,
                "REVOKED",
                "2026-09-06T04:04:00Z"
            );

        assertSuccess(
            "SUSPENDED -> REVOKED",
            harness.coordinator.apply(
                createSignedActivationPackage(
                    signingKeyPair,
                    "FINORA-ANDROID-STATUS-REVOKE-5",
                    5L,
                    "REVOKE",
                    activation,
                    revoked
                ),
                trustedKeys,
                NOW
            )
        );

        assertEquals(
            5,
            harness.statePort.writeCount
        );

        assertPersistedStatus(
            harness,
            "USER-STATUS-LIFECYCLE",
            "REVOKED"
        );


        // =====================================================
        // REVOKED IS TERMINAL
        // =====================================================

        Map<String, Object> illegalResume =
            withStatus(
                revoked,
                "ACTIVE",
                "2026-09-06T04:05:00Z"
            );

        assertRejectedWithoutWrite(
            "REVOKED -> ACTIVE terminal rejection",
            harness,
            createSignedActivationPackage(
                signingKeyPair,
                "FINORA-ANDROID-STATUS-TERMINAL-6",
                6L,
                "RESUME",
                activation,
                illegalResume
            ),
            trustedKeys,
            5,
            "terminal"
        );

        assertPersistedStatus(
            harness,
            "USER-STATUS-LIFECYCLE",
            "REVOKED"
        );


        // =====================================================
        // REPLAY
        // =====================================================

        assertRejectedWithoutWrite(
            "same signed ISSUE package replay",
            harness,
            issuePackage,
            trustedKeys,
            5,
            null
        );


        // =====================================================
        // STALE / EQUAL SEQUENCE
        // =====================================================

        assertRejectedWithoutWrite(
            "stale/equal sequence",
            harness,
            createSignedActivationPackage(
                signingKeyPair,
                "FINORA-ANDROID-STATUS-STALE-5",
                5L,
                "REVOKE",
                activation,
                revoked
            ),
            trustedKeys,
            5,
            null
        );


        // =====================================================
        // METADATA TAMPER
        // =====================================================

        Map<String, Object> metadataInitial =
            createRegisteredGrant(
                "USER-STATUS-METADATA",
                "ACTIVE",
                BASE_TIME
            );

        assertSuccess(
            "metadata lineage ISSUE",
            harness.coordinator.apply(
                createSignedActivationPackage(
                    signingKeyPair,
                    "FINORA-ANDROID-STATUS-METADATA-ISSUE-6",
                    6L,
                    "ISSUE",
                    activation,
                    metadataInitial
                ),
                trustedKeys,
                NOW
            )
        );

        assertEquals(
            6,
            harness.statePort.writeCount
        );

        Map<String, Object> metadataTampered =
            withStatus(
                metadataInitial,
                "SUSPENDED",
                "2026-09-06T04:06:00Z"
            );

        metadataTampered.put(
            "storageMode",
            "USB"
        );

        assertRejectedWithoutWrite(
            "status action metadata tamper",
            harness,
            createSignedActivationPackage(
                signingKeyPair,
                "FINORA-ANDROID-STATUS-METADATA-TAMPER-7",
                7L,
                "SUSPEND",
                activation,
                metadataTampered
            ),
            trustedKeys,
            6,
            "cannot modify grant metadata"
        );

        assertPersistedStatus(
            harness,
            "USER-STATUS-METADATA",
            "ACTIVE"
        );


        // =====================================================
        // ACTIVATION TAMPER
        // =====================================================

        Map<String, Object> mutatedActivation =
            deepCopyMap(
                activation
            );

        mutatedActivation.put(
            "updatedAt",
            "2026-09-06T04:07:00Z"
        );

        Map<String, Object> activationTamperGrant =
            withStatus(
                metadataInitial,
                "SUSPENDED",
                "2026-09-06T04:07:00Z"
            );

        assertRejectedWithoutWrite(
            "status action activation mutation",
            harness,
            createSignedActivationPackage(
                signingKeyPair,
                "FINORA-ANDROID-STATUS-ACTIVATION-TAMPER-7",
                7L,
                "SUSPEND",
                mutatedActivation,
                activationTamperGrant
            ),
            trustedKeys,
            6,
            "cannot modify the Branch Activation record"
        );


        // =====================================================
        // RENEW STATUS BYPASS
        // =====================================================

        Map<String, Object> renewInitial =
            createRegisteredGrant(
                "USER-STATUS-RENEW",
                "ACTIVE",
                BASE_TIME
            );

        assertSuccess(
            "RENEW lineage ISSUE",
            harness.coordinator.apply(
                createSignedActivationPackage(
                    signingKeyPair,
                    "FINORA-ANDROID-STATUS-RENEW-ISSUE-7",
                    7L,
                    "ISSUE",
                    activation,
                    renewInitial
                ),
                trustedKeys,
                NOW
            )
        );

        assertEquals(
            7,
            harness.statePort.writeCount
        );

        Map<String, Object> renewBypass =
            withStatus(
                renewInitial,
                "SUSPENDED",
                "2026-09-06T04:08:00Z"
            );

        assertRejectedWithoutWrite(
            "RENEW status-change bypass",
            harness,
            createSignedActivationPackage(
                signingKeyPair,
                "FINORA-ANDROID-STATUS-RENEW-BYPASS-8",
                8L,
                "RENEW",
                activation,
                renewBypass
            ),
            trustedKeys,
            7,
            "transition is invalid"
        );


        // =====================================================
        // REPLACE STATUS BYPASS
        // =====================================================

        assertRejectedWithoutWrite(
            "REPLACE status-change bypass",
            harness,
            createSignedActivationPackage(
                signingKeyPair,
                "FINORA-ANDROID-STATUS-REPLACE-BYPASS-8",
                8L,
                "REPLACE",
                activation,
                renewBypass
            ),
            trustedKeys,
            7,
            "transition is invalid"
        );

        assertPersistedStatus(
            harness,
            "USER-STATUS-RENEW",
            "ACTIVE"
        );


        // =====================================================
        // INVALID ACTIVE -> ACTIVE RESUME
        // =====================================================

        Map<String, Object> directInitial =
            createRegisteredGrant(
                "USER-STATUS-DIRECT",
                "ACTIVE",
                BASE_TIME
            );

        assertSuccess(
            "direct lineage ISSUE",
            harness.coordinator.apply(
                createSignedActivationPackage(
                    signingKeyPair,
                    "FINORA-ANDROID-STATUS-DIRECT-ISSUE-8",
                    8L,
                    "ISSUE",
                    activation,
                    directInitial
                ),
                trustedKeys,
                NOW
            )
        );

        assertEquals(
            8,
            harness.statePort.writeCount
        );

        Map<String, Object> invalidResume =
            withStatus(
                directInitial,
                "ACTIVE",
                "2026-09-06T04:09:00Z"
            );

        assertRejectedWithoutWrite(
            "ACTIVE -> ACTIVE RESUME",
            harness,
            createSignedActivationPackage(
                signingKeyPair,
                "FINORA-ANDROID-STATUS-INVALID-RESUME-9",
                9L,
                "RESUME",
                activation,
                invalidResume
            ),
            trustedKeys,
            8,
            "transition is invalid"
        );


        // =====================================================
        // ACTIVE -> REVOKED
        // =====================================================

        Map<String, Object> directRevoked =
            withStatus(
                directInitial,
                "REVOKED",
                "2026-09-06T04:10:00Z"
            );

        assertSuccess(
            "ACTIVE -> REVOKED",
            harness.coordinator.apply(
                createSignedActivationPackage(
                    signingKeyPair,
                    "FINORA-ANDROID-STATUS-DIRECT-REVOKE-9",
                    9L,
                    "REVOKE",
                    activation,
                    directRevoked
                ),
                trustedKeys,
                NOW
            )
        );

        assertEquals(
            9,
            harness.statePort.writeCount
        );

        assertPersistedStatus(
            harness,
            "USER-STATUS-DIRECT",
            "REVOKED"
        );

        assertTrue(
            hasAppliedPackage(
                harness.statePort.state,
                "FINORA-ANDROID-STATUS-DIRECT-REVOKE-9"
            )
        );
    }


    // =========================================================
    // ASSERTIONS
    // =========================================================

    private static void assertSuccess(
        String label,
        FinoraBranchActivationApplyCoordinator.Result result
    ) {

        assertTrue(
            label + ": " + result.error,
            result.success
        );

        assertNotNull(
            result.packageId
        );

        assertNotNull(
            result.sequence
        );
    }


    private static void assertRejectedWithoutWrite(
        String label,
        Harness harness,
        Map<String, Object> signedPackage,
        List<
            FinoraSignedControlPackageVerifier.TrustedKey
        > trustedKeys,
        int expectedWriteCount,
        String expectedErrorFragment
    ) {

        FinoraBranchActivationApplyCoordinator.Result result =
            harness.coordinator.apply(
                signedPackage,
                trustedKeys,
                NOW
            );

        assertFalse(
            label + ": expected rejection",
            result.success
        );

        assertEquals(
            label + ": rejected package mutated state",
            expectedWriteCount,
            harness.statePort.writeCount
        );

        if (expectedErrorFragment != null) {

            assertNotNull(
                label + ": missing rejection error",
                result.error
            );

            assertTrue(
                label +
                    ": expected error fragment [" +
                    expectedErrorFragment +
                    "] but got [" +
                    result.error +
                    "]",
                result.error
                    .toLowerCase()
                    .contains(
                        expectedErrorFragment
                            .toLowerCase()
                    )
            );
        }
    }


    private static void assertPersistedStatus(
        Harness harness,
        String userId,
        String expectedStatus
    ) {

        Map<String, Object> grant =
            findGrant(
                harness.statePort.state,
                userId
            );

        assertNotNull(
            "Missing persisted grant for " + userId,
            grant
        );

        assertEquals(
            expectedStatus,
            grant.get(
                "administrativeStatus"
            )
        );
    }


    // =========================================================
    // DOMAIN BUILDERS
    // =========================================================

    private static Map<String, Object> createActivation() {

        Map<String, Object> activation =
            new LinkedHashMap<>();

        activation.put(
            "activationId",
            "FINORA-ANDROID-STATUS-ACTIVATION"
        );

        activation.put(
            "ownerId",
            OWNER_ID
        );

        activation.put(
            "businessId",
            BUSINESS_ID
        );

        activation.put(
            "branchId",
            BRANCH_ID
        );

        activation.put(
            "status",
            "ACTIVE"
        );

        activation.put(
            "activatedAt",
            BASE_TIME
        );

        activation.put(
            "createdAt",
            BASE_TIME
        );

        activation.put(
            "updatedAt",
            BASE_TIME
        );

        activation.put(
            "schemaVersion",
            Long.valueOf(
                1L
            )
        );

        return activation;
    }


    private static Map<String, Object> createRegisteredGrant(
        String userId,
        String administrativeStatus,
        String createdAt
    ) {

        Map<String, Object> validity =
            new LinkedHashMap<>();

        validity.put(
            "validFrom",
            createdAt
        );

        validity.put(
            "validUntil",
            Instant
                .parse(
                    createdAt
                )
                .plusSeconds(
                    365L *
                    24L *
                    60L *
                    60L
                )
                .toString()
        );

        Map<String, Object> payment =
            new LinkedHashMap<>();

        payment.put(
            "amount",
            Long.valueOf(
                2000L
            )
        );

        payment.put(
            "currency",
            "INR"
        );

        payment.put(
            "paymentMode",
            "CASH"
        );

        payment.put(
            "paidAt",
            createdAt
        );

        payment.put(
            "reference",
            "SELFTEST-" + userId
        );

        payment.put(
            "remarks",
            "Phase 10 Android Signed Status selftest"
        );

        payment.put(
            "refundable",
            Boolean.FALSE
        );

        Map<String, Object> grant =
            new LinkedHashMap<>();

        grant.put(
            "grantId",
            "FINORA-GRANT-" + userId
        );

        grant.put(
            "userId",
            userId
        );

        grant.put(
            "ownerId",
            OWNER_ID
        );

        grant.put(
            "businessId",
            BUSINESS_ID
        );

        grant.put(
            "branchId",
            BRANCH_ID
        );

        grant.put(
            "storageMode",
            "LOCAL"
        );

        grant.put(
            "accessType",
            "REGISTERED"
        );

        grant.put(
            "administrativeStatus",
            administrativeStatus
        );

        grant.put(
            "validity",
            validity
        );

        grant.put(
            "registrationPayment",
            payment
        );

        grant.put(
            "registrationCycle",
            Long.valueOf(
                1L
            )
        );

        grant.put(
            "createdAt",
            createdAt
        );

        grant.put(
            "updatedAt",
            createdAt
        );

        grant.put(
            "schemaVersion",
            Long.valueOf(
                1L
            )
        );

        return grant;
    }


    private static Map<String, Object> withStatus(
        Map<String, Object> source,
        String status,
        String updatedAt
    ) {

        Map<String, Object> copy =
            deepCopyMap(
                source
            );

        copy.put(
            "administrativeStatus",
            status
        );

        copy.put(
            "updatedAt",
            updatedAt
        );

        return copy;
    }


    private static Map<String, Object> createPayload(
        String action,
        Map<String, Object> activation,
        Map<String, Object> accessGrant
    ) {

        Map<String, Object> binding =
            new LinkedHashMap<>();

        binding.put(
            "installationId",
            INSTALLATION_ID
        );

        binding.put(
            "bindingKeyId",
            BINDING_KEY_ID
        );

        binding.put(
            "fingerprintAlgorithm",
            "SHA-256"
        );

        binding.put(
            "publicKeyFingerprint",
            PUBLIC_KEY_FINGERPRINT
        );

        binding.put(
            "schemaVersion",
            Long.valueOf(
                1L
            )
        );

        Map<String, Object> payload =
            new LinkedHashMap<>();

        payload.put(
            "action",
            action
        );

        payload.put(
            "activation",
            deepCopyMap(
                activation
            )
        );

        payload.put(
            "accessGrant",
            deepCopyMap(
                accessGrant
            )
        );

        payload.put(
            "installationBinding",
            binding
        );

        payload.put(
            "issuedAt",
            NOW.toString()
        );

        payload.put(
            "schemaVersion",
            Long.valueOf(
                1L
            )
        );

        return payload;
    }


    // =========================================================
    // SIGNED CONTROL PACKAGE
    // =========================================================

    private static Map<String, Object> createTarget() {

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

        target.put(
            "installationId",
            INSTALLATION_ID
        );

        target.put(
            "bindingKeyId",
            BINDING_KEY_ID
        );

        target.put(
            "fingerprintAlgorithm",
            "SHA-256"
        );

        target.put(
            "publicKeyFingerprint",
            PUBLIC_KEY_FINGERPRINT
        );

        return target;
    }


    private static Map<String, Object> createSignedActivationPackage(
        KeyPair signingKeyPair,
        String packageId,
        long sequence,
        String action,
        Map<String, Object> activation,
        Map<String, Object> accessGrant
    )
        throws Exception {

        return createSignedPackage(
            signingKeyPair,
            packageId,
            "BRANCH_ACTIVATION",
            sequence,
            createTarget(),
            NOW.toString(),
            createPayload(
                action,
                activation,
                accessGrant
            )
        );
    }


    private static Map<String, Object> createSignedPackage(
        KeyPair signingKeyPair,
        String packageId,
        String purpose,
        long sequence,
        Map<String, Object> target,
        String issuedAt,
        Map<String, Object> payload
    )
        throws Exception {

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

        Map<String, Object> payloadDigest =
            new LinkedHashMap<>();

        payloadDigest.put(
            "algorithm",
            "SHA-256"
        );

        payloadDigest.put(
            "value",
            FinoraSignedControlPackageVerifier
                .sha256Hex(
                    FinoraCanonicalJson
                        .canonicalize(
                            payload
                        )
                )
        );

        Map<String, Object> unsignedPackage =
            new LinkedHashMap<>();

        unsignedPackage.put(
            "schemaVersion",
            Long.valueOf(
                1L
            )
        );

        unsignedPackage.put(
            "packageId",
            packageId
        );

        unsignedPackage.put(
            "purpose",
            purpose
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
            issuedAt
        );

        unsignedPackage.put(
            "sequence",
            Long.valueOf(
                sequence
            )
        );

        unsignedPackage.put(
            "payloadVersion",
            Long.valueOf(
                1L
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

        String canonicalPackage =
            FinoraCanonicalJson
                .canonicalize(
                    unsignedPackage
                );

        Signature signer =
            Signature.getInstance(
                "SHA256withECDSA"
            );

        signer.initSign(
            signingKeyPair
                .getPrivate()
        );

        signer.update(
            canonicalPackage.getBytes(
                StandardCharsets.UTF_8
            )
        );

        byte[] p1363 =
            derToP1363(
                signer.sign()
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
            Base64
                .getEncoder()
                .encodeToString(
                    p1363
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

        return signedPackage;
    }


    // =========================================================
    // CRYPTO HELPERS
    // =========================================================

    private static KeyPair createSigningKeyPair()
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

        return generator.generateKeyPair();
    }


    private static byte[] derToP1363(
        byte[] der
    ) {

        int[] offset = {
            0
        };

        requireTag(
            der,
            offset,
            0x30
        );

        int sequenceLength =
            readDerLength(
                der,
                offset
            );

        if (
            sequenceLength !=
                der.length -
                offset[0]
        ) {
            throw new IllegalArgumentException(
                "Unexpected ECDSA DER sequence length."
            );
        }

        byte[] r =
            readDerInteger(
                der,
                offset
            );

        byte[] s =
            readDerInteger(
                der,
                offset
            );

        if (
            offset[0] !=
                der.length
        ) {
            throw new IllegalArgumentException(
                "Unexpected ECDSA DER trailing bytes."
            );
        }

        byte[] output =
            new byte[64];

        copyUnsignedInteger(
            r,
            output,
            0
        );

        copyUnsignedInteger(
            s,
            output,
            32
        );

        return output;
    }


    private static byte[] readDerInteger(
        byte[] der,
        int[] offset
    ) {

        requireTag(
            der,
            offset,
            0x02
        );

        int length =
            readDerLength(
                der,
                offset
            );

        if (
            length <= 0 ||
            offset[0] + length >
                der.length
        ) {
            throw new IllegalArgumentException(
                "Invalid ECDSA DER integer."
            );
        }

        byte[] value =
            new byte[length];

        System.arraycopy(
            der,
            offset[0],
            value,
            0,
            length
        );

        offset[0] +=
            length;

        return value;
    }


    private static void copyUnsignedInteger(
        byte[] source,
        byte[] destination,
        int destinationOffset
    ) {

        int sourceOffset =
            0;

        while (
            sourceOffset <
                source.length - 1 &&
            source[sourceOffset] ==
                0
        ) {
            sourceOffset++;
        }

        int length =
            source.length -
            sourceOffset;

        if (length > 32) {
            throw new IllegalArgumentException(
                "ECDSA integer exceeds P-256 width."
            );
        }

        System.arraycopy(
            source,
            sourceOffset,
            destination,
            destinationOffset +
                (32 - length),
            length
        );
    }


    private static int readDerLength(
        byte[] source,
        int[] offset
    ) {

        if (
            offset[0] >=
                source.length
        ) {
            throw new IllegalArgumentException(
                "Missing DER length."
            );
        }

        int first =
            source[
                offset[0]++
            ] &
            0xff;

        if ((first & 0x80) == 0) {
            return first;
        }

        int bytes =
            first &
            0x7f;

        if (
            bytes <= 0 ||
            bytes > 4 ||
            offset[0] + bytes >
                source.length
        ) {
            throw new IllegalArgumentException(
                "Invalid DER length."
            );
        }

        int value =
            0;

        for (
            int index = 0;
            index < bytes;
            index++
        ) {

            value =
                (value << 8) |
                (
                    source[
                        offset[0]++
                    ] &
                    0xff
                );
        }

        return value;
    }


    private static void requireTag(
        byte[] source,
        int[] offset,
        int expectedTag
    ) {

        if (
            offset[0] >=
                source.length ||
            (
                source[
                    offset[0]++
                ] &
                0xff
            ) !=
                expectedTag
        ) {
            throw new IllegalArgumentException(
                "Unexpected DER tag."
            );
        }
    }


    // =========================================================
    // STATE HELPERS
    // =========================================================

    private static Map<String, Object> createInitialState() {

        Map<String, Object> installation =
            new LinkedHashMap<>();

        installation.put(
            "installationId",
            INSTALLATION_ID
        );

        installation.put(
            "ownerId",
            OWNER_ID
        );

        installation.put(
            "businessId",
            BUSINESS_ID
        );

        installation.put(
            "branchId",
            BRANCH_ID
        );

        installation.put(
            "schemaVersion",
            Long.valueOf(
                1L
            )
        );

        Map<String, Object> state =
            new LinkedHashMap<>();

        state.put(
            "version",
            "1.0"
        );

        state.put(
            "installation",
            installation
        );

        state.put(
            "activations",
            new ArrayList<Map<String, Object>>()
        );

        state.put(
            "storageEntitlements",
            new ArrayList<Map<String, Object>>()
        );

        state.put(
            "branchAccessGrants",
            new ArrayList<Map<String, Object>>()
        );

        state.put(
            "appliedControlPackages",
            new ArrayList<Map<String, Object>>()
        );

        state.put(
            "controlSequences",
            new ArrayList<Map<String, Object>>()
        );

        return state;
    }


    private static boolean hasAppliedPackage(
        Map<String, Object> state,
        String packageId
    ) {

        List<Map<String, Object>> values =
            readMapList(
                state,
                "appliedControlPackages"
            );

        for (
            Map<String, Object> value :
            values
        ) {

            if (
                packageId.equals(
                    value.get(
                        "packageId"
                    )
                )
            ) {
                return true;
            }
        }

        return false;
    }


    private static Map<String, Object> findGrant(
        Map<String, Object> state,
        String userId
    ) {

        List<Map<String, Object>> grants =
            readMapList(
                state,
                "branchAccessGrants"
            );

        for (
            Map<String, Object> grant :
            grants
        ) {

            if (
                userId.equals(
                    grant.get(
                        "userId"
                    )
                )
            ) {
                return grant;
            }
        }

        return null;
    }


    @SuppressWarnings("unchecked")
    private static List<Map<String, Object>> readMapList(
        Map<String, Object> state,
        String key
    ) {

        Object value =
            state.get(
                key
            );

        assertTrue(
            key + " must be a List",
            value instanceof List
        );

        return (List<Map<String, Object>>) value;
    }


    private static Map<String, Object> deepCopyMap(
        Map<String, Object> source
    ) {

        Map<String, Object> copy =
            new LinkedHashMap<>();

        for (
            Map.Entry<String, Object> entry :
            source.entrySet()
        ) {

            copy.put(
                entry.getKey(),
                deepCopyValue(
                    entry.getValue()
                )
            );
        }

        return copy;
    }


    private static Object deepCopyValue(
        Object value
    ) {

        if (value instanceof Map) {

            @SuppressWarnings("unchecked")
            Map<String, Object> map =
                (Map<String, Object>) value;

            return deepCopyMap(
                map
            );
        }

        if (value instanceof List) {

            List<?> list =
                (List<?>) value;

            List<Object> copy =
                new ArrayList<>();

            for (Object item : list) {

                copy.add(
                    deepCopyValue(
                        item
                    )
                );
            }

            return copy;
        }

        return value;
    }


    // =========================================================
    // MEMORY HARNESS
    // =========================================================

    private static final class MemoryStatePort
        implements
            FinoraBranchActivationApplyCoordinator.ControlStatePort {

        private Map<String, Object> state =
            createInitialState();

        private int writeCount =
            0;


        @Override
        public Map<String, Object> read() {
            return state;
        }


        @Override
        public void write(
            Map<String, Object> nextState
        ) {

            state =
                nextState;

            writeCount++;
        }
    }


    private static final class Harness {

        private final MemoryStatePort statePort =
            new MemoryStatePort();

        private final FinoraBranchActivationApplyCoordinator
            coordinator =
                new FinoraBranchActivationApplyCoordinator(
                    statePort,
                    () ->
                        new FinoraBranchActivationApplyCoordinator.NativeBinding(
                            INSTALLATION_ID,
                            BINDING_KEY_ID,
                            "SHA-256",
                            PUBLIC_KEY_FINGERPRINT
                        )
                );
    }
}