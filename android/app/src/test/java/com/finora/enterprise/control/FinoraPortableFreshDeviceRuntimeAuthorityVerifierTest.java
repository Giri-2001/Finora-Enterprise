package com.finora.enterprise.control;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import java.math.BigInteger;
import java.nio.charset.StandardCharsets;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.MessageDigest;
import java.security.Signature;
import java.security.interfaces.ECPrivateKey;
import java.security.interfaces.ECPublicKey;
import java.security.spec.ECGenParameterSpec;
import java.util.Base64;

import org.json.JSONObject;
import org.junit.Test;

public final class
    FinoraPortableFreshDeviceRuntimeAuthorityVerifierTest {

    @Test
    public void canonicalPayloadMatchesExactWindowsInsertionOrder()
        throws Exception {

        JSONObject payload =
            registeredPayload();

        String serialized =
            packageJson(
                payload,
                signatureObject(
                    "AA=="
                )
            );

        FinoraPortableFreshDeviceRuntimeAuthorityContract
            .PackageValue parsed =
                FinoraPortableFreshDeviceRuntimeAuthorityContract
                    .parse(
                        serialized
                    );

        String canonical =
            FinoraPortableFreshDeviceRuntimeAuthorityContract
                .canonicalizePayload(
                    parsed.payload
                );

        assertTrue(
            canonical.startsWith(
                "{\"schemaVersion\":1,\"purpose\":\"FRESH_DEVICE_RUNTIME_AUTHORITY\",\"authorityId\":\"AUTH-1\",\"sourceAuthorizationId\":\"AUTHZ-1\",\"credentialId\":\"CRED-1\""
            )
        );

        assertTrue(
            canonical.contains(
                "\"activationStatus\":\"ACTIVE\",\"activationActivatedAt\":\"2026-09-10T10:00:00.000Z\",\"activationCreatedAt\":\"2026-09-10T10:00:00.000Z\""
            )
        );

        assertTrue(
            canonical.contains(
                "\"registrationPayment\":{\"amount\":2000,\"currency\":\"INR\",\"paymentMode\":\"CASH\",\"paidAt\":\"2026-09-10T10:00:00.000Z\",\"reference\":\"REF-1\",\"remarks\":\"OK\",\"refundable\":false}"
            )
        );

        assertTrue(
            canonical.endsWith(
                "\"portableAuthFingerprint\":\"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa\",\"issuedAt\":\"2026-09-10T10:00:00.000Z\"}"
            )
        );

        assertTrue(
            canonical.indexOf(
                "\"branchId\""
            ) <
            canonical.indexOf(
                "\"businessCode\""
            )
        );

        assertTrue(
            canonical.indexOf(
                "\"role\""
            ) <
            canonical.indexOf(
                "\"storageMode\""
            )
        );

        assertTrue(
            canonical.indexOf(
                "\"registrationCycle\""
            ) <
            canonical.indexOf(
                "\"accessMode\""
            )
        );
    }

    @Test
    public void validP1363Base64SignatureVerifies()
        throws Exception {

        KeyPair keyPair =
            generateP256();

        FinoraBranchCertificationCryptoValidator.Material material =
            material(
                keyPair
            );

        JSONObject payload =
            registeredPayload();

        String unsigned =
            FinoraPortableFreshDeviceRuntimeAuthorityContract
                .canonicalizePayload(
                    FinoraPortableFreshDeviceRuntimeAuthorityContract
                        .parse(
                            packageJson(
                                payload,
                                signatureObject(
                                    "AA=="
                                )
                            )
                        )
                        .payload
                );

        String signature =
            signP1363Base64(
                keyPair,
                unsigned
            );

        FinoraPortableFreshDeviceRuntimeAuthorityVerifier.Result
            result =
                FinoraPortableFreshDeviceRuntimeAuthorityVerifier
                    .verify(
                        packageJson(
                            payload,
                            signatureObject(
                                signature
                            )
                        ),
                        material
                    );

        assertTrue(
            result.success
        );

        assertNotNull(
            result.data
        );

        assertEquals(
            "BRANCH-1",
            result.data.branchId
        );

        assertEquals(
            "USB",
            result.data.storageMode
        );
    }

    @Test
    public void tamperedPayloadFailsSignatureVerification()
        throws Exception {

        KeyPair keyPair =
            generateP256();

        FinoraBranchCertificationCryptoValidator.Material material =
            material(
                keyPair
            );

        JSONObject originalPayload =
            registeredPayload();

        String canonical =
            FinoraPortableFreshDeviceRuntimeAuthorityContract
                .canonicalizePayload(
                    FinoraPortableFreshDeviceRuntimeAuthorityContract
                        .parse(
                            packageJson(
                                originalPayload,
                                signatureObject(
                                    "AA=="
                                )
                            )
                        )
                        .payload
                );

        String signature =
            signP1363Base64(
                keyPair,
                canonical
            );

        JSONObject tampered =
            registeredPayload();

        tampered.put(
            "fullName",
            "Tampered Owner"
        );

        FinoraPortableFreshDeviceRuntimeAuthorityVerifier.Result
            result =
                FinoraPortableFreshDeviceRuntimeAuthorityVerifier
                    .verify(
                        packageJson(
                            tampered,
                            signatureObject(
                                signature
                            )
                        ),
                        material
                    );

        assertFalse(
            result.success
        );

        assertEquals(
            "INVALID_RUNTIME_AUTHORITY_SIGNATURE",
            result.errorCode
        );
    }

    @Test
    public void windowsEncodingMetadataIsBase64NotIeeeP1363()
        throws Exception {

        JSONObject signature =
            signatureObject(
                "AA=="
            );

        signature.put(
            "encoding",
            "IEEE_P1363"
        );

        boolean failed =
            false;

        try {
            FinoraPortableFreshDeviceRuntimeAuthorityContract
                .parse(
                    packageJson(
                        registeredPayload(),
                        signature
                    )
                );
        }
        catch (IllegalArgumentException expected) {
            failed =
                true;
        }

        assertTrue(
            failed
        );
    }

    private static JSONObject registeredPayload()
        throws Exception {

        JSONObject payment =
            new JSONObject();

        payment.put(
            "amount",
            2000
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
            "2026-09-10T10:00:00.000Z"
        );

        payment.put(
            "reference",
            "REF-1"
        );

        payment.put(
            "remarks",
            "OK"
        );

        payment.put(
            "refundable",
            false
        );

        JSONObject payload =
            new JSONObject();

        payload.put(
            "schemaVersion",
            1
        );

        payload.put(
            "purpose",
            "FRESH_DEVICE_RUNTIME_AUTHORITY"
        );

        payload.put(
            "authorityId",
            "AUTH-1"
        );

        payload.put(
            "sourceAuthorizationId",
            "AUTHZ-1"
        );

        payload.put(
            "credentialId",
            "CRED-1"
        );

        payload.put(
            "activationId",
            "ACT-1"
        );

        payload.put(
            "branchAccessGrantId",
            "GRANT-1"
        );

        payload.put(
            "storageEntitlementId",
            "ENT-1"
        );

        payload.put(
            "ownerId",
            "OWNER-1"
        );

        payload.put(
            "businessId",
            "BUSINESS-1"
        );

        payload.put(
            "branchId",
            "BRANCH-1"
        );

        payload.put(
            "businessCode",
            JSONObject.NULL
        );

        payload.put(
            "branchCode",
            JSONObject.NULL
        );

        payload.put(
            "userId",
            "USER-1"
        );

        payload.put(
            "username",
            "Admin"
        );

        payload.put(
            "canonicalUsername",
            "admin"
        );

        payload.put(
            "fullName",
            "Owner"
        );

        payload.put(
            "role",
            "OWNER"
        );

        payload.put(
            "storageMode",
            "USB"
        );

        payload.put(
            "dataContext",
            "REAL"
        );

        payload.put(
            "demoId",
            JSONObject.NULL
        );

        payload.put(
            "authGeneration",
            1
        );

        payload.put(
            "activationStatus",
            "ACTIVE"
        );

        payload.put(
            "activationActivatedAt",
            "2026-09-10T10:00:00.000Z"
        );

        payload.put(
            "activationCreatedAt",
            "2026-09-10T10:00:00.000Z"
        );

        payload.put(
            "activationUpdatedAt",
            "2026-09-10T10:00:00.000Z"
        );

        payload.put(
            "branchAccessType",
            "REGISTERED"
        );

        payload.put(
            "registrationPayment",
            payment
        );

        payload.put(
            "registrationCycle",
            1
        );

        payload.put(
            "demoRemarks",
            JSONObject.NULL
        );

        payload.put(
            "accessMode",
            "ACTIVE"
        );

        payload.put(
            "accessValidFrom",
            "2026-09-10T10:00:00.000Z"
        );

        payload.put(
            "accessValidUntil",
            "2027-09-10T10:00:00.000Z"
        );

        payload.put(
            "branchAccessCreatedAt",
            "2026-09-10T10:00:00.000Z"
        );

        payload.put(
            "branchAccessUpdatedAt",
            "2026-09-10T10:00:00.000Z"
        );

        payload.put(
            "storageEntitlementStatus",
            "ACTIVE"
        );

        payload.put(
            "storageEntitlementActivatedAt",
            "2026-09-10T10:00:00.000Z"
        );

        payload.put(
            "storageEntitlementCreatedAt",
            "2026-09-10T10:00:00.000Z"
        );

        payload.put(
            "storageEntitlementUpdatedAt",
            "2026-09-10T10:00:00.000Z"
        );

        payload.put(
            "portableAuthFingerprint",
            "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
        );

        payload.put(
            "issuedAt",
            "2026-09-10T10:00:00.000Z"
        );

        return payload;
    }

    private static JSONObject signatureObject(
        String value
    ) throws Exception {

        JSONObject signature =
            new JSONObject();

        signature.put(
            "algorithm",
            "ECDSA_P256_SHA256"
        );

        signature.put(
            "encoding",
            "BASE64"
        );

        signature.put(
            "canonicalization",
            "FINORA_CANONICAL_JSON_V1"
        );

        signature.put(
            "keyId",
            "FINORA-BRANCH-CERT-TEST"
        );

        signature.put(
            "value",
            value
        );

        return signature;
    }

    private static String packageJson(
        JSONObject payload,
        JSONObject signature
    ) throws Exception {

        JSONObject root =
            new JSONObject();

        root.put(
            "format",
            "FINORA_PORTABLE_FRESH_DEVICE_RUNTIME_AUTHORITY"
        );

        root.put(
            "schemaVersion",
            1
        );

        root.put(
            "payload",
            payload
        );

        root.put(
            "signature",
            signature
        );

        return root.toString();
    }

    private static KeyPair generateP256()
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

    private static FinoraBranchCertificationCryptoValidator.Material
        material(
            KeyPair pair
        ) throws Exception {

        String publicKey =
            Base64
                .getEncoder()
                .encodeToString(
                    pair
                        .getPublic()
                        .getEncoded()
                );

        String privateKey =
            Base64
                .getEncoder()
                .encodeToString(
                    pair
                        .getPrivate()
                        .getEncoded()
                );

        String fingerprint =
            sha256Hex(
                pair
                    .getPublic()
                    .getEncoded()
            );

        return new FinoraBranchCertificationCryptoValidator.Material(
            "FINORA-BRANCH-CERT-TEST",
            "ECDSA_P256_SHA256",
            "SPKI_DER_BASE64",
            publicKey,
            "SHA-256",
            fingerprint,
            "2026-09-10T10:00:00.000Z",
            1,
            "PKCS8_DER_BASE64",
            privateKey,
            1
        );
    }

    private static String signP1363Base64(
        KeyPair pair,
        String canonical
    ) throws Exception {

        Signature signer =
            Signature.getInstance(
                "SHA256withECDSA"
            );

        signer.initSign(
            pair.getPrivate()
        );

        signer.update(
            canonical.getBytes(
                StandardCharsets.UTF_8
            )
        );

        byte[] der =
            signer.sign();

        return Base64
            .getEncoder()
            .encodeToString(
                derToP1363(
                    der
                )
            );
    }

    private static byte[] derToP1363(
        byte[] der
    ) {
        if (
            der == null ||
            der.length < 8 ||
            der[0] != 0x30
        ) {
            throw new IllegalArgumentException(
                "Invalid DER ECDSA signature."
            );
        }

        int offset =
            2;

        if (
            der[offset++] !=
                0x02
        ) {
            throw new IllegalArgumentException(
                "Invalid DER ECDSA R value."
            );
        }

        int rLength =
            der[offset++] &
            0xff;

        byte[] r =
            new byte[
                rLength
            ];

        System.arraycopy(
            der,
            offset,
            r,
            0,
            rLength
        );

        offset +=
            rLength;

        if (
            der[offset++] !=
                0x02
        ) {
            throw new IllegalArgumentException(
                "Invalid DER ECDSA S value."
            );
        }

        int sLength =
            der[offset++] &
            0xff;

        byte[] s =
            new byte[
                sLength
            ];

        System.arraycopy(
            der,
            offset,
            s,
            0,
            sLength
        );

        byte[] output =
            new byte[64];

        copyInteger(
            r,
            output,
            0
        );

        copyInteger(
            s,
            output,
            32
        );

        return output;
    }

    private static void copyInteger(
        byte[] source,
        byte[] target,
        int targetOffset
    ) {
        BigInteger value =
            new BigInteger(
                1,
                source
            );

        byte[] normalized =
            value.toByteArray();

        int sourceOffset =
            normalized.length > 32
                ? normalized.length - 32
                : 0;

        int length =
            Math.min(
                normalized.length,
                32
            );

        System.arraycopy(
            normalized,
            sourceOffset,
            target,
            targetOffset +
                32 -
                length,
            length
        );
    }

    private static String sha256Hex(
        byte[] value
    ) throws Exception {

        byte[] digest =
            MessageDigest
                .getInstance(
                    "SHA-256"
                )
                .digest(
                    value
                );

        StringBuilder output =
            new StringBuilder();

        for (byte item : digest) {
            output.append(
                String.format(
                    "%02x",
                    item &
                    0xff
                )
            );
        }

        return output.toString();
    }
}