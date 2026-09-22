package com.finora.enterprise.control;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import java.util.Base64;

import org.json.JSONArray;
import org.json.JSONObject;
import org.junit.Test;

public final class
    FinoraPortableFreshDeviceHydrationServiceTest {

    @Test
    public void verifiedAuthoritiesHydrateOneCompleteRoot()
        throws Exception {

        RecordingPort port =
            new RecordingPort();

        FinoraPortableFreshDeviceHydrationService service =
            new FinoraPortableFreshDeviceHydrationService(
                port
            );

        FinoraPortableFreshDeviceHydrationService.Result result =
            service.hydrate(
                new FinoraPortableFreshDeviceHydrationService.Request(
                    credential(),
                    runtimePayload(
                        fingerprint()
                    ),
                    fingerprint(),
                    binding(),
                    "2026-09-22T05:00:00.000Z"
                )
            );

        assertTrue(
            result.success
        );

        assertEquals(
            "HYDRATED",
            result.status
        );

        assertEquals(
            1,
            port.writeCount
        );

        assertNotNull(
            port.value
        );

        JSONObject root =
            new JSONObject(
                port.value
            );

        assertEquals(
            "1.0",
            root.getString(
                "version"
            )
        );

        JSONObject installation =
            root.getJSONObject(
                "installation"
            );

        assertEquals(
            "ANDROID-INSTALL-1",
            installation.getString(
                "installationId"
            )
        );

        assertEquals(
            "BRANCH-1",
            installation.getString(
                "branchId"
            )
        );

        JSONArray activations =
            root.getJSONArray(
                "activations"
            );

        assertEquals(
            1,
            activations.length()
        );

        assertEquals(
            "ACT-1",
            activations
                .getJSONObject(0)
                .getString(
                    "activationId"
                )
        );

        JSONArray grants =
            root.getJSONArray(
                "branchAccessGrants"
            );

        assertEquals(
            "GRANT-1",
            grants
                .getJSONObject(0)
                .getString(
                    "grantId"
                )
        );

        JSONArray entitlements =
            root.getJSONArray(
                "storageEntitlements"
            );

        JSONObject entitlement =
            entitlements.getJSONObject(0);

        assertEquals(
            "ANDROID-BIND-1",
            entitlement.getString(
                "bindingKeyId"
            )
        );

        assertEquals(
            "USB",
            entitlement.getString(
                "storageMode"
            )
        );

        JSONArray credentials =
            root.getJSONArray(
                "branchCredentials"
            );

        assertEquals(
            1,
            credentials.length()
        );

        assertEquals(
            "CRED-1",
            credentials
                .getJSONObject(0)
                .getString(
                    "credentialId"
                )
        );

        assertEquals(
            0,
            root
                .getJSONArray(
                    "businessProfiles"
                )
                .length()
        );

        assertEquals(
            fingerprint(),
            root
                .getJSONObject(
                    "freshDeviceHydrationEvidence"
                )
                .getString(
                    "portableAuthFingerprint"
                )
        );
    }

    @Test
    public void existingControlStateIsNeverReplaced()
        throws Exception {

        RecordingPort port =
            new RecordingPort();

        port.value =
            "{\"version\":\"1.0\"}";

        FinoraPortableFreshDeviceHydrationService service =
            new FinoraPortableFreshDeviceHydrationService(
                port
            );

        FinoraPortableFreshDeviceHydrationService.Result result =
            service.hydrate(
                new FinoraPortableFreshDeviceHydrationService.Request(
                    credential(),
                    runtimePayload(
                        fingerprint()
                    ),
                    fingerprint(),
                    binding(),
                    "2026-09-22T05:00:00.000Z"
                )
            );

        assertFalse(
            result.success
        );

        assertEquals(
            "CONTROL_STATE_ALREADY_EXISTS",
            result.errorCode
        );

        assertEquals(
            0,
            port.writeCount
        );
    }

    @Test
    public void fingerprintMismatchFailsBeforeWrite()
        throws Exception {

        RecordingPort port =
            new RecordingPort();

        FinoraPortableFreshDeviceHydrationService service =
            new FinoraPortableFreshDeviceHydrationService(
                port
            );

        FinoraPortableFreshDeviceHydrationService.Result result =
            service.hydrate(
                new FinoraPortableFreshDeviceHydrationService.Request(
                    credential(),
                    runtimePayload(
                        repeat(
                            'b',
                            64
                        )
                    ),
                    fingerprint(),
                    binding(),
                    "2026-09-22T05:00:00.000Z"
                )
            );

        assertFalse(
            result.success
        );

        assertEquals(
            "RUNTIME_AUTHORITY_MISMATCH",
            result.errorCode
        );

        assertEquals(
            0,
            port.writeCount
        );
    }

    private static final class RecordingPort
        implements
            FinoraPortableFreshDeviceHydrationService.ControlStatePort {

        String value;
        int writeCount;

        @Override
        public String read() {
            return value;
        }

        @Override
        public void write(
            String serialized
        ) {
            writeCount++;

            value =
                serialized;
        }
    }

    private static FinoraPortableFreshDeviceHydrationService.NativeBinding
        binding() {

        return new FinoraPortableFreshDeviceHydrationService.NativeBinding(
            "ANDROID-INSTALL-1",
            "ANDROID-BIND-1",
            "SHA-256",
            repeat(
                'c',
                64
            )
        );
    }

    private static FinoraBranchCredentialContract.Credential
        credential() {

        FinoraBranchCredentialContract.Verifier passwordVerifier =
            FinoraBranchCredentialContract
                .projectPortableVerifierValues(
                    FinoraPortableBranchAuthContract
                        .KDF_ALGORITHM,
                    base64Bytes(
                        FinoraPortableBranchAuthContract
                            .SCRYPT_SALT_BYTES,
                        (byte) 1
                    ),
                    FinoraPortableBranchAuthContract
                        .SCRYPT_N,
                    FinoraPortableBranchAuthContract
                        .SCRYPT_R,
                    FinoraPortableBranchAuthContract
                        .SCRYPT_P,
                    FinoraPortableBranchAuthContract
                        .SCRYPT_DERIVED_KEY_BYTES,
                    FinoraPortableBranchAuthContract
                        .VERIFIER_BYTES,
                    base64Bytes(
                        FinoraPortableBranchAuthContract
                            .VERIFIER_BYTES,
                        (byte) 2
                    )
                );

        FinoraBranchCredentialContract.Verifier securityVerifier =
            FinoraBranchCredentialContract
                .projectPortableVerifierValues(
                    FinoraPortableBranchAuthContract
                        .KDF_ALGORITHM,
                    base64Bytes(
                        FinoraPortableBranchAuthContract
                            .SCRYPT_SALT_BYTES,
                        (byte) 3
                    ),
                    FinoraPortableBranchAuthContract
                        .SCRYPT_N,
                    FinoraPortableBranchAuthContract
                        .SCRYPT_R,
                    FinoraPortableBranchAuthContract
                        .SCRYPT_P,
                    FinoraPortableBranchAuthContract
                        .SCRYPT_DERIVED_KEY_BYTES,
                    FinoraPortableBranchAuthContract
                        .VERIFIER_BYTES,
                    base64Bytes(
                        FinoraPortableBranchAuthContract
                            .VERIFIER_BYTES,
                        (byte) 4
                    )
                );

        return new FinoraBranchCredentialContract.Credential(
            "CRED-1",
            "AUTHZ-1",
            Long.valueOf(
                1L
            ),
            "USER-1",
            "Admin",
            "admin",
            "Owner",
            "ADMIN",
            "OWNER-1",
            "BUSINESS-1",
            "BRANCH-1",
            "USB",
            "REAL",
            null,
            "ACTIVE",
            passwordVerifier,
            securityVerifier,
            "2026-09-10T10:00:00.000Z",
            "2026-09-10T10:00:00.000Z",
            1
        );
    }

    private static FinoraPortableFreshDeviceRuntimeAuthorityContract.Payload
        runtimePayload(
            String portableAuthFingerprint
        ) throws Exception {

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
            "Registration"
        );

        payment.put(
            "refundable",
            false
        );

        JSONObject payload =
            new JSONObject();

        payload.put("schemaVersion", 1);
        payload.put("purpose", "FRESH_DEVICE_RUNTIME_AUTHORITY");
        payload.put("authorityId", "RUNTIME-1");
        payload.put("sourceAuthorizationId", "AUTHZ-1");
        payload.put("credentialId", "CRED-1");
        payload.put("activationId", "ACT-1");
        payload.put("branchAccessGrantId", "GRANT-1");
        payload.put("storageEntitlementId", "ENT-1");
        payload.put("ownerId", "OWNER-1");
        payload.put("businessId", "BUSINESS-1");
        payload.put("branchId", "BRANCH-1");
        payload.put("businessCode", "BUS-001");
        payload.put("branchCode", "BR-001");
        payload.put("userId", "USER-1");
        payload.put("username", "Admin");
        payload.put("canonicalUsername", "admin");
        payload.put("fullName", "Owner");
        payload.put("role", "ADMIN");
        payload.put("storageMode", "USB");
        payload.put("dataContext", "REAL");
        payload.put("demoId", JSONObject.NULL);
        payload.put("authGeneration", 1);
        payload.put("activationStatus", "ACTIVE");
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
        payload.put("branchAccessType", "REGISTERED");
        payload.put("registrationPayment", payment);
        payload.put("registrationCycle", 1);
        payload.put("demoRemarks", JSONObject.NULL);
        payload.put("accessMode", "ACTIVE");
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
            portableAuthFingerprint
        );
        payload.put(
            "issuedAt",
            "2026-09-10T10:00:00.000Z"
        );

        JSONObject signature =
            new JSONObject();

        signature.put("algorithm", "ECDSA_P256_SHA256");
        signature.put("encoding", "BASE64");
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
            "AA=="
        );

        JSONObject packageValue =
            new JSONObject();

        packageValue.put(
            "format",
            "FINORA_PORTABLE_FRESH_DEVICE_RUNTIME_AUTHORITY"
        );

        packageValue.put(
            "schemaVersion",
            1
        );

        packageValue.put(
            "payload",
            payload
        );

        packageValue.put(
            "signature",
            signature
        );

        return FinoraPortableFreshDeviceRuntimeAuthorityContract
            .parse(
                packageValue.toString()
            )
            .payload;
    }

    private static String fingerprint() {
        return repeat(
            'a',
            64
        );
    }

    private static String repeat(
        char value,
        int count
    ) {
        StringBuilder result =
            new StringBuilder(
                count
            );

        for (
            int index = 0;
            index < count;
            index++
        ) {
            result.append(
                value
            );
        }

        return result.toString();
    }

    private static String base64Bytes(
        int length,
        byte value
    ) {
        byte[] bytes =
            new byte[
                length
            ];

        for (
            int index = 0;
            index < bytes.length;
            index++
        ) {
            bytes[index] =
                value;
        }

        return Base64
            .getEncoder()
            .encodeToString(
                bytes
            );
    }
}