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

public final class FinoraWalletRechargeApplyCoordinatorTest {

    private static final String OWNER_ID =
        "FINORA-ANDROID-RECHARGE-OWNER";

    private static final String BUSINESS_ID =
        "FINORA-ANDROID-RECHARGE-BUSINESS";

    private static final String BRANCH_ID =
        "FINORA-ANDROID-RECHARGE-BRANCH";

    private static final String INSTALLATION_ID =
        "FINORA-ANDROID-RECHARGE-INSTALLATION";

    private static final String ISSUER_ID =
        "FINORA-CONTROL-CENTER-SELFTEST";

    private static final String SIGNING_KEY_ID =
        "FINORA-CONTROL-KEY-SELFTEST";

    private static final String PUBLIC_KEY_FINGERPRINT =
        "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

    private static final String BINDING_KEY_ID =
        "FINORA-BINDING-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

    private static final Instant NOW =
        Instant.parse(
            "2026-09-06T04:30:00Z"
        );

    private static final String ISSUED_AT =
        "2026-09-06T04:30:00Z";

    private static final String KEY_VALID_FROM =
        "2026-01-01T00:00:00Z";


    @Test
    public void signedWalletRechargeProofMatrix()
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

        // =====================================================
        // VALID APPLY
        // =====================================================

        Harness validHarness =
            new Harness();

        String paymentReference =
            "FINORA-ANDROID-RECHARGE-PAYMENT-001";

        Map<String, Object> validPackage =
            createSignedPackage(
                signingKeyPair,
                "FINORA-ANDROID-RECHARGE-PACKAGE-001",
                "WALLET_RECHARGE",
                1L,
                createTarget(
                    BRANCH_ID
                ),
                ISSUED_AT,
                createPayload(
                    paymentReference,
                    100000L,
                    "INR",
                    ISSUED_AT,
                    INSTALLATION_ID
                )
            );

        FinoraWalletRechargeApplyCoordinator.Result
            validResult =
                validHarness
                    .coordinator
                    .apply(
                        validPackage,
                        trustedKeys,
                        NOW
                    );

        assertTrue(
            validResult.error,
            validResult.success
        );

        assertEquals(
            "FINORA-ANDROID-RECHARGE-PACKAGE-001",
            validResult.packageId
        );

        assertEquals(
            Long.valueOf(
                1L
            ),
            validResult.sequence
        );

        assertEquals(
            1,
            validHarness.statePort.writeCount
        );

        List<Map<String, Object>> authorizations =
            readMapList(
                validHarness.statePort.state,
                "walletRechargeAuthorizations"
            );

        assertEquals(
            1,
            authorizations.size()
        );

        Map<String, Object> authorization =
            authorizations.get(
                0
            );

        assertEquals(
            paymentReference,
            authorization.get(
                "paymentReference"
            )
        );

        assertEquals(
            Long.valueOf(
                100000L
            ),
            authorization.get(
                "amountMinor"
            )
        );

        assertEquals(
            "INR",
            authorization.get(
                "currency"
            )
        );

        assertEquals(
            NOW.toString(),
            authorization.get(
                "verifiedAt"
            )
        );

        // =====================================================
        // REPLAY — NO SECOND WRITE
        // =====================================================

        FinoraWalletRechargeApplyCoordinator.Result
            replayResult =
                validHarness
                    .coordinator
                    .apply(
                        validPackage,
                        trustedKeys,
                        NOW
                    );

        assertFalse(
            replayResult.success
        );

        assertEquals(
            1,
            validHarness.statePort.writeCount
        );

        // =====================================================
        // STALE / EQUAL SEQUENCE — NO WRITE
        // =====================================================

        Map<String, Object> staleSequencePackage =
            createSignedPackage(
                signingKeyPair,
                "FINORA-ANDROID-RECHARGE-PACKAGE-STALE",
                "WALLET_RECHARGE",
                1L,
                createTarget(
                    BRANCH_ID
                ),
                ISSUED_AT,
                createPayload(
                    "FINORA-ANDROID-RECHARGE-PAYMENT-STALE",
                    100000L,
                    "INR",
                    ISSUED_AT,
                    INSTALLATION_ID
                )
            );

        FinoraWalletRechargeApplyCoordinator.Result
            staleSequenceResult =
                validHarness
                    .coordinator
                    .apply(
                        staleSequencePackage,
                        trustedKeys,
                        NOW
                    );

        assertFalse(
            staleSequenceResult.success
        );

        assertEquals(
            1,
            validHarness.statePort.writeCount
        );

        // =====================================================
        // DUPLICATE PAYMENT REFERENCE — NO WRITE
        // =====================================================

        Map<String, Object> duplicateReferencePackage =
            createSignedPackage(
                signingKeyPair,
                "FINORA-ANDROID-RECHARGE-PACKAGE-DUPLICATE",
                "WALLET_RECHARGE",
                2L,
                createTarget(
                    BRANCH_ID
                ),
                ISSUED_AT,
                createPayload(
                    paymentReference,
                    100000L,
                    "INR",
                    ISSUED_AT,
                    INSTALLATION_ID
                )
            );

        FinoraWalletRechargeApplyCoordinator.Result
            duplicateReferenceResult =
                validHarness
                    .coordinator
                    .apply(
                        duplicateReferencePackage,
                        trustedKeys,
                        NOW
                    );

        assertFalse(
            duplicateReferenceResult.success
        );

        assertEquals(
            1,
            validHarness.statePort.writeCount
        );

        // =====================================================
        // WRONG PURPOSE
        // =====================================================

        assertRejectedWithoutWrite(
            signingKeyPair,
            trustedKeys,
            createSignedPackage(
                signingKeyPair,
                "FINORA-ANDROID-RECHARGE-WRONG-PURPOSE",
                "PRICING_POLICY",
                1L,
                createTarget(
                    BRANCH_ID
                ),
                ISSUED_AT,
                createPayload(
                    "FINORA-ANDROID-RECHARGE-WRONG-PURPOSE-PAYMENT",
                    100000L,
                    "INR",
                    ISSUED_AT,
                    INSTALLATION_ID
                )
            )
        );

        // =====================================================
        // WRONG SIGNED TARGET
        // =====================================================

        assertRejectedWithoutWrite(
            signingKeyPair,
            trustedKeys,
            createSignedPackage(
                signingKeyPair,
                "FINORA-ANDROID-RECHARGE-WRONG-TARGET",
                "WALLET_RECHARGE",
                1L,
                createTarget(
                    "FINORA-WRONG-BRANCH"
                ),
                ISSUED_AT,
                createPayload(
                    "FINORA-ANDROID-RECHARGE-WRONG-TARGET-PAYMENT",
                    100000L,
                    "INR",
                    ISSUED_AT,
                    INSTALLATION_ID
                )
            )
        );

        // =====================================================
        // WRONG PAYLOAD INSTALLATION BINDING
        // =====================================================

        assertRejectedWithoutWrite(
            signingKeyPair,
            trustedKeys,
            createSignedPackage(
                signingKeyPair,
                "FINORA-ANDROID-RECHARGE-WRONG-BINDING",
                "WALLET_RECHARGE",
                1L,
                createTarget(
                    BRANCH_ID
                ),
                ISSUED_AT,
                createPayload(
                    "FINORA-ANDROID-RECHARGE-WRONG-BINDING-PAYMENT",
                    100000L,
                    "INR",
                    ISSUED_AT,
                    "FINORA-WRONG-INSTALLATION"
                )
            )
        );

        // =====================================================
        // ZERO AMOUNT MINOR
        // =====================================================

        assertRejectedWithoutWrite(
            signingKeyPair,
            trustedKeys,
            createSignedPackage(
                signingKeyPair,
                "FINORA-ANDROID-RECHARGE-ZERO-AMOUNT",
                "WALLET_RECHARGE",
                1L,
                createTarget(
                    BRANCH_ID
                ),
                ISSUED_AT,
                createPayload(
                    "FINORA-ANDROID-RECHARGE-ZERO-AMOUNT-PAYMENT",
                    0L,
                    "INR",
                    ISSUED_AT,
                    INSTALLATION_ID
                )
            )
        );

        // =====================================================
        // NON-INR
        // =====================================================

        assertRejectedWithoutWrite(
            signingKeyPair,
            trustedKeys,
            createSignedPackage(
                signingKeyPair,
                "FINORA-ANDROID-RECHARGE-NON-INR",
                "WALLET_RECHARGE",
                1L,
                createTarget(
                    BRANCH_ID
                ),
                ISSUED_AT,
                createPayload(
                    "FINORA-ANDROID-RECHARGE-NON-INR-PAYMENT",
                    100000L,
                    "USD",
                    ISSUED_AT,
                    INSTALLATION_ID
                )
            )
        );

        // =====================================================
        // PAYLOAD / PACKAGE ISSUED-AT MISMATCH
        // =====================================================

        assertRejectedWithoutWrite(
            signingKeyPair,
            trustedKeys,
            createSignedPackage(
                signingKeyPair,
                "FINORA-ANDROID-RECHARGE-ISSUEDAT-MISMATCH",
                "WALLET_RECHARGE",
                1L,
                createTarget(
                    BRANCH_ID
                ),
                ISSUED_AT,
                createPayload(
                    "FINORA-ANDROID-RECHARGE-ISSUEDAT-MISMATCH-PAYMENT",
                    100000L,
                    "INR",
                    "2026-09-06T04:29:59Z",
                    INSTALLATION_ID
                )
            )
        );

        // =====================================================
        // CRYPTOGRAPHIC PAYLOAD TAMPER
        // =====================================================

        Map<String, Object> tamperedPackage =
            deepCopyMap(
                createSignedPackage(
                    signingKeyPair,
                    "FINORA-ANDROID-RECHARGE-TAMPER",
                    "WALLET_RECHARGE",
                    1L,
                    createTarget(
                        BRANCH_ID
                    ),
                    ISSUED_AT,
                    createPayload(
                        "FINORA-ANDROID-RECHARGE-TAMPER-PAYMENT",
                        100000L,
                        "INR",
                        ISSUED_AT,
                        INSTALLATION_ID
                    )
                )
            );

        requireMap(
            tamperedPackage.get(
                "payload"
            )
        ).put(
            "amountMinor",
            Long.valueOf(
                100001L
            )
        );

        assertRejectedWithoutWrite(
            signingKeyPair,
            trustedKeys,
            tamperedPackage
        );

        // =====================================================
        // UNSAFE INTEGER PAYLOAD
        //
        // Deliberately mutate after signing. Production
        // canonicalization must reject this before acceptance.
        // =====================================================

        Map<String, Object> unsafeAmountPackage =
            deepCopyMap(
                createSignedPackage(
                    signingKeyPair,
                    "FINORA-ANDROID-RECHARGE-UNSAFE-AMOUNT",
                    "WALLET_RECHARGE",
                    1L,
                    createTarget(
                        BRANCH_ID
                    ),
                    ISSUED_AT,
                    createPayload(
                        "FINORA-ANDROID-RECHARGE-UNSAFE-AMOUNT-PAYMENT",
                        100000L,
                        "INR",
                        ISSUED_AT,
                        INSTALLATION_ID
                    )
                )
            );

        requireMap(
            unsafeAmountPackage.get(
                "payload"
            )
        ).put(
            "amountMinor",
            Long.valueOf(
                9007199254740992L
            )
        );

        assertRejectedWithoutWrite(
            signingKeyPair,
            trustedKeys,
            unsafeAmountPackage
        );

        // =====================================================
        // INVALID SIGNATURE
        // =====================================================

        Map<String, Object> invalidSignaturePackage =
            deepCopyMap(
                createSignedPackage(
                    signingKeyPair,
                    "FINORA-ANDROID-RECHARGE-BAD-SIGNATURE",
                    "WALLET_RECHARGE",
                    1L,
                    createTarget(
                        BRANCH_ID
                    ),
                    ISSUED_AT,
                    createPayload(
                        "FINORA-ANDROID-RECHARGE-BAD-SIGNATURE-PAYMENT",
                        100000L,
                        "INR",
                        ISSUED_AT,
                        INSTALLATION_ID
                    )
                )
            );

        requireMap(
            invalidSignaturePackage.get(
                "signature"
            )
        ).put(
            "value",
            Base64
                .getEncoder()
                .encodeToString(
                    new byte[64]
                )
        );

        assertRejectedWithoutWrite(
            signingKeyPair,
            trustedKeys,
            invalidSignaturePackage
        );
    }


    private static void assertRejectedWithoutWrite(
        KeyPair unusedSigningKeyPair,
        List<
            FinoraSignedControlPackageVerifier.TrustedKey
        > trustedKeys,
        Map<String, Object> signedPackage
    ) {

        assertNotNull(
            unusedSigningKeyPair
        );

        Harness harness =
            new Harness();

        FinoraWalletRechargeApplyCoordinator.Result
            result =
                harness
                    .coordinator
                    .apply(
                        signedPackage,
                        trustedKeys,
                        NOW
                    );

        assertFalse(
            result.success
        );

        assertEquals(
            0,
            harness.statePort.writeCount
        );
    }


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


    private static Map<String, Object> createTarget(
        String branchId
    ) {

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
            branchId
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


    private static Map<String, Object> createPayload(
        String paymentReference,
        long amountMinor,
        String currency,
        String issuedAt,
        String payloadInstallationId
    ) {

        Map<String, Object> scope =
            new LinkedHashMap<>();

        scope.put(
            "ownerId",
            OWNER_ID
        );

        scope.put(
            "businessId",
            BUSINESS_ID
        );

        scope.put(
            "branchId",
            BRANCH_ID
        );

        Map<String, Object> installationBinding =
            new LinkedHashMap<>();

        installationBinding.put(
            "installationId",
            payloadInstallationId
        );

        installationBinding.put(
            "bindingKeyId",
            BINDING_KEY_ID
        );

        installationBinding.put(
            "fingerprintAlgorithm",
            "SHA-256"
        );

        installationBinding.put(
            "publicKeyFingerprint",
            PUBLIC_KEY_FINGERPRINT
        );

        installationBinding.put(
            "schemaVersion",
            Long.valueOf(
                1L
            )
        );

        Map<String, Object> payload =
            new LinkedHashMap<>();

        payload.put(
            "scope",
            scope
        );

        payload.put(
            "installationBinding",
            installationBinding
        );

        payload.put(
            "paymentReference",
            paymentReference
        );

        payload.put(
            "amountMinor",
            Long.valueOf(
                amountMinor
            )
        );

        payload.put(
            "currency",
            currency
        );

        payload.put(
            "paymentMethod",
            "UPI"
        );

        payload.put(
            "paymentSource",
            "UPI"
        );

        payload.put(
            "providerOrderId",
            "FINORA-ANDROID-RECHARGE-ORDER"
        );

        payload.put(
            "providerTransactionId",
            "FINORA-ANDROID-RECHARGE-TRANSACTION"
        );

        payload.put(
            "issuedAt",
            issuedAt
        );

        payload.put(
            "schemaVersion",
            Long.valueOf(
                1L
            )
        );

        return payload;
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
                "Invalid ECDSA DER sequence length."
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


    @SuppressWarnings("unchecked")
    private static Map<String, Object> requireMap(
        Object value
    ) {

        if (!(value instanceof Map)) {
            throw new IllegalArgumentException(
                "Expected map."
            );
        }

        return (Map<String, Object>) value;
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

        Map<String, Object> state =
            new LinkedHashMap<>();

        state.put(
            "installation",
            installation
        );

        state.put(
            "walletRechargeAuthorizations",
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


    private static final class MemoryStatePort
        implements
            FinoraWalletRechargeApplyCoordinator.ControlStatePort {

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

        private final FinoraWalletRechargeApplyCoordinator
            coordinator =
                new FinoraWalletRechargeApplyCoordinator(
                    statePort,
                    () ->
                        new FinoraWalletRechargeApplyCoordinator.NativeBinding(
                            INSTALLATION_ID,
                            BINDING_KEY_ID,
                            "SHA-256",
                            PUBLIC_KEY_FINGERPRINT
                        )
                );
    }
}