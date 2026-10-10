package com.finora.enterprise.control;

import static org.junit.Assert.*;

import org.json.JSONObject;
import org.junit.Test;

public final class FinoraServerFirstLoginPayloadValidatorTest {

    private static JSONObject valid() throws Exception {
        JSONObject payload = new JSONObject();

        String[] keys = {
            "kind", "authorityId", "sourceAuthorizationId",
            "credentialId", "activationId", "branchAccessGrantId",
            "storageEntitlementId", "authGeneration", "ownerId",
            "businessId", "branchId", "userId", "username",
            "canonicalUsername", "fullName", "role",
            "businessName", "branchName", "storageMode",
            "dataContext", "businessCode", "branchCode",
            "demoId", "subscriptionId", "subscriptionStatus",
            "branchAccessType", "accessMode", "accessValidFrom",
            "accessValidUntil", "activationStatus",
            "activationActivatedAt", "activationCreatedAt",
            "activationUpdatedAt", "branchAccessCreatedAt",
            "branchAccessUpdatedAt", "registrationPayment",
            "registrationCycle", "demoRemarks",
            "storageEntitlementStatus",
            "storageEntitlementActivatedAt",
            "storageEntitlementCreatedAt",
            "storageEntitlementUpdatedAt", "issuedAt",
            "mustChangePassword", "mustChangeSecurityCode",
            "branchCertificationEnrollmentPolicy", "schemaVersion"
        };

        for (String key : keys) {
            payload.put(key, "sample");
        }

        payload.put("kind", "FINORA_SERVER_FIRST_LOGIN_BOOTSTRAP");
        payload.put("authGeneration", 1);
        payload.put("schemaVersion", 1);
        payload.put("username", "testadmin");
        payload.put("canonicalUsername", "testadmin");
        payload.put("storageMode", "USB");
        payload.put("dataContext", "REAL");
        payload.put("subscriptionStatus", "ACTIVE");
        payload.put("branchAccessType", "REGISTERED");
        payload.put("accessMode", "ACTIVE");
        payload.put("activationStatus", "ACTIVE");
        payload.put("storageEntitlementStatus", "ACTIVE");
        payload.put(
            "branchCertificationEnrollmentPolicy",
            "CREATE_ON_FIRST_VERIFIED_LOGIN"
        );

        for (String key : new String[] {
            "businessCode", "branchCode", "demoId",
            "registrationPayment", "registrationCycle",
            "demoRemarks"
        }) {
            payload.put(key, JSONObject.NULL);
        }

        for (String key : new String[] {
            "accessValidFrom", "activationActivatedAt",
            "activationCreatedAt", "activationUpdatedAt",
            "branchAccessCreatedAt", "branchAccessUpdatedAt",
            "storageEntitlementActivatedAt",
            "storageEntitlementCreatedAt",
            "storageEntitlementUpdatedAt", "issuedAt"
        }) {
            payload.put(key, "2026-01-01T00:00:00.000Z");
        }

        payload.put(
            "accessValidUntil",
            "2027-01-01T00:00:00.000Z"
        );

        payload.put("mustChangePassword", true);
        payload.put("mustChangeSecurityCode", true);

        return payload;
    }

    @Test
    public void validShapePasses() throws Exception {
        assertTrue(
            FinoraServerFirstLoginPayloadValidator.validate(
                valid(), "testadmin"
            )
        );
    }

    @Test
    public void localModeCannotUseServerFirstEnrollment() throws Exception {
        JSONObject payload = valid();
        payload.put("storageMode", "LOCAL");

        assertFalse(
            FinoraServerFirstLoginPayloadValidator.validate(
                payload, "testadmin"
            )
        );
    }

    @Test
    public void unknownStorageModeIsRejected() throws Exception {
        JSONObject payload = valid();
        payload.put("storageMode", "CLOUD");

        assertFalse(
            FinoraServerFirstLoginPayloadValidator.validate(
                payload, "testadmin"
            )
        );
    }
    @Test
    public void initialEnrollmentGenerationOneIsAccepted() throws Exception {
        JSONObject payload = valid();
        payload.put("authGeneration", 1);

        assertTrue(
            FinoraServerFirstLoginPayloadValidator.validate(
                payload, "testadmin"
            )
        );
    }

    @Test
    public void rotatedGenerationCannotBecomeInitialEnrollment()
        throws Exception {

        JSONObject payload = valid();
        payload.put("authGeneration", 2);

        assertFalse(
            FinoraServerFirstLoginPayloadValidator.validate(
                payload, "testadmin"
            )
        );
    }

    @Test
    public void generationZeroCannotEnroll() throws Exception {
        JSONObject payload = valid();
        payload.put("authGeneration", 0);

        assertFalse(
            FinoraServerFirstLoginPayloadValidator.validate(
                payload, "testadmin"
            )
        );
    }
    @Test
    public void wrongUsernameFails() throws Exception {
        assertFalse(
            FinoraServerFirstLoginPayloadValidator.validate(
                valid(), "anotherowner"
            )
        );
    }

    @Test
    public void inactiveSubscriptionFails() throws Exception {
        JSONObject payload = valid();
        payload.put("subscriptionStatus", "EXPIRED");

        assertFalse(
            FinoraServerFirstLoginPayloadValidator.validate(
                payload, "testadmin"
            )
        );
    }

    @Test
    public void unexpectedFieldFails() throws Exception {
        JSONObject payload = valid();
        payload.put("unexpected", true);

        assertFalse(
            FinoraServerFirstLoginPayloadValidator.validate(
                payload, "testadmin"
            )
        );
    }

    @Test
    public void reversedAccessDatesFail() throws Exception {
        JSONObject payload = valid();
        payload.put(
            "accessValidUntil",
            "2025-01-01T00:00:00.000Z"
        );

        assertFalse(
            FinoraServerFirstLoginPayloadValidator.validate(
                payload, "testadmin"
            )
        );
    }

    @Test
    public void invalidGenerationFails() throws Exception {
        JSONObject payload = valid();
        payload.put("authGeneration", 0);

        assertFalse(
            FinoraServerFirstLoginPayloadValidator.validate(
                payload, "testadmin"
            )
        );
    }
}