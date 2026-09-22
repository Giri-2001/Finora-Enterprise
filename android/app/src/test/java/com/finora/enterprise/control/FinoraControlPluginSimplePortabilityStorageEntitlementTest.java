package com.finora.enterprise.control;

import org.json.JSONObject;
import org.junit.Test;

import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

public final class FinoraControlPluginSimplePortabilityStorageEntitlementTest {

    @Test
    public void historicalBindingMismatchDoesNotGateLogicalActiveEntitlement()
        throws Exception {

        JSONObject entitlement =
            entitlement(
                "USER-1",
                "OWNER-1",
                "BUSINESS-1",
                "BRANCH-1",
                "USB",
                "ACTIVE"
            );

        /*
         * These fields intentionally represent historical evidence
         * from another installation/device.
         *
         * Simple portability must not compare them with the current
         * Android Keystore binding during ordinary login/session
         * entitlement revalidation.
         */
        entitlement.put(
            "installationId",
            "HISTORICAL-INSTALLATION"
        );

        entitlement.put(
            "bindingKeyId",
            "FINORA-BINDING-HISTORICAL"
        );

        entitlement.put(
            "fingerprintAlgorithm",
            "SHA-256"
        );

        entitlement.put(
            "publicKeyFingerprint",
            repeat(
                "A",
                64
            )
        );

        assertTrue(
            FinoraControlPlugin
                .matchesLogicalStorageEntitlementIdentity(
                    entitlement,
                    "USER-1",
                    "OWNER-1",
                    "BUSINESS-1",
                    "BRANCH-1",
                    "USB"
                )
        );

        assertTrue(
            FinoraControlPlugin
                .isActiveLogicalStorageEntitlement(
                    entitlement
                )
        );
    }

    @Test
    public void wrongBranchFailsClosed()
        throws Exception {

        JSONObject entitlement =
            entitlement(
                "USER-1",
                "OWNER-1",
                "BUSINESS-1",
                "BRANCH-OTHER",
                "USB",
                "ACTIVE"
            );

        assertFalse(
            FinoraControlPlugin
                .matchesLogicalStorageEntitlementIdentity(
                    entitlement,
                    "USER-1",
                    "OWNER-1",
                    "BUSINESS-1",
                    "BRANCH-1",
                    "USB"
                )
        );
    }

    @Test
    public void wrongStorageModeFailsClosed()
        throws Exception {

        JSONObject entitlement =
            entitlement(
                "USER-1",
                "OWNER-1",
                "BUSINESS-1",
                "BRANCH-1",
                "LOCAL",
                "ACTIVE"
            );

        assertFalse(
            FinoraControlPlugin
                .matchesLogicalStorageEntitlementIdentity(
                    entitlement,
                    "USER-1",
                    "OWNER-1",
                    "BUSINESS-1",
                    "BRANCH-1",
                    "USB"
                )
        );
    }

    @Test
    public void inactiveEntitlementFailsClosed()
        throws Exception {

        JSONObject entitlement =
            entitlement(
                "USER-1",
                "OWNER-1",
                "BUSINESS-1",
                "BRANCH-1",
                "USB",
                "REVOKED"
            );

        assertTrue(
            FinoraControlPlugin
                .matchesLogicalStorageEntitlementIdentity(
                    entitlement,
                    "USER-1",
                    "OWNER-1",
                    "BUSINESS-1",
                    "BRANCH-1",
                    "USB"
                )
        );

        assertFalse(
            FinoraControlPlugin
                .isActiveLogicalStorageEntitlement(
                    entitlement
                )
        );
    }

    private static JSONObject entitlement(
        String userId,
        String ownerId,
        String businessId,
        String branchId,
        String storageMode,
        String status
    ) throws Exception {

        return new JSONObject()
            .put(
                "userId",
                userId
            )
            .put(
                "ownerId",
                ownerId
            )
            .put(
                "businessId",
                businessId
            )
            .put(
                "branchId",
                branchId
            )
            .put(
                "storageMode",
                storageMode
            )
            .put(
                "status",
                status
            );
    }

    private static String repeat(
        String value,
        int count
    ) {
        StringBuilder builder =
            new StringBuilder();

        for (
            int index = 0;
            index < count;
            index++
        ) {
            builder.append(
                value
            );
        }

        return builder.toString();
    }
}