package com.finora.enterprise.control;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertThrows;
import static org.junit.Assert.assertTrue;

import java.lang.reflect.InvocationTargetException;
import java.time.Instant;
import java.lang.reflect.Method;

import org.json.JSONObject;
import org.junit.Test;

public final class
    FinoraPortableBranchAuthLegacyEvidenceCompatibilityTest {

    @Test
    public void acceptsCanonicalLegacyMigrationEvidence()
        throws Exception {

        String fingerprint =
            "0123456789abcdef0123456789abcdef" +
            "0123456789abcdef0123456789abcdef";

        JSONObject evidence =
            buildLegacyEvidence(
                fingerprint,
                "FINORA-BINDING-" +
                    fingerprint
                        .substring(
                            0,
                            32
                        )
                        .toUpperCase(
                            java.util.Locale.ROOT
                        )
            );

        FinoraPortableBranchAuthPayloadCodec
            .SourceAuthorizationEvidence parsed =
                parseEvidence(
                    evidence
                );

        assertEquals(
            "FINORA-CREDENTIAL-ENROLLMENT-LEGACY-01",
            parsed.authorizationId
        );

        assertNotNull(
            parsed.legacyNativeBoundMigrationEvidence
        );

        assertEquals(
            "PASSWORD_AND_ACTIVE_NATIVE_STORAGE_ENTITLEMENT",
            parsed
                .legacyNativeBoundMigrationEvidence
                .migrationMethod
        );

        assertEquals(
            "USB",
            parsed
                .legacyNativeBoundMigrationEvidence
                .storageMode
        );

        /*
         * Legacy hardware identity is retained only as historical evidence.
         * It is not projected into signed/current-device evidence fields.
         */
        assertNull(
            parsed.packageId
        );

        assertNull(
            parsed.issuerId
        );

        assertNull(
            parsed.verifiedControlSigner
        );

        assertNull(
            parsed.portabilityAuthorityProof
        );

        assertNull(
            parsed.verifiedAt
        );

        assertEquals(
            0L,
            parsed.sequence
        );
    }

    @Test
    public void rejectsLegacyBindingKeyThatDoesNotMatchFingerprint()
        throws Exception {

        String fingerprint =
            "0123456789abcdef0123456789abcdef" +
            "0123456789abcdef0123456789abcdef";

        JSONObject evidence =
            buildLegacyEvidence(
                fingerprint,
                "FINORA-BINDING-FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"
            );

        assertThrows(
            IllegalArgumentException.class,
            () ->
                parseEvidence(
                    evidence
                )
        );
    }

    @Test
    public void legacyEvidencePassesFreshDevicePortabilityVerification()
        throws Exception {

        String fingerprint =
            "0123456789abcdef0123456789abcdef" +
            "0123456789abcdef0123456789abcdef";

        FinoraPortableBranchAuthPayloadCodec
            .SourceAuthorizationEvidence evidence =
                parseEvidence(
                    buildLegacyEvidence(
                        fingerprint,
                        "FINORA-BINDING-" +
                            fingerprint
                                .substring(
                                    0,
                                    32
                                )
                                .toUpperCase(
                                    java.util.Locale.ROOT
                                )
                    )
                );

        assertTrue(
            FinoraBranchPortabilityAuthorityVerifier
                .verifyLegacyValues(
                    1,
                    "FINORA-CREDENTIAL-ENROLLMENT-LEGACY-01",
                    evidence,
                    "USER-01",
                    "owner",
                    "OWNER-01",
                    "BUSINESS-01",
                    "BRANCH-01",
                    "USB",
                    1L,
                    Instant.parse(
                        "2026-09-22T00:00:00Z"
                    )
                )
        );
    }

    @Test
    public void legacyEvidenceBranchMismatchFailsClosed()
        throws Exception {

        String fingerprint =
            "0123456789abcdef0123456789abcdef" +
            "0123456789abcdef0123456789abcdef";

        FinoraPortableBranchAuthPayloadCodec
            .SourceAuthorizationEvidence evidence =
                parseEvidence(
                    buildLegacyEvidence(
                        fingerprint,
                        "FINORA-BINDING-" +
                            fingerprint
                                .substring(
                                    0,
                                    32
                                )
                                .toUpperCase(
                                    java.util.Locale.ROOT
                                )
                    )
                );

        assertFalse(
            FinoraBranchPortabilityAuthorityVerifier
                .verifyLegacyValues(
                    1,
                    "FINORA-CREDENTIAL-ENROLLMENT-LEGACY-01",
                    evidence,
                    "USER-01",
                    "owner",
                    "OWNER-01",
                    "BUSINESS-01",
                    "OTHER-BRANCH",
                    "USB",
                    1L,
                    Instant.parse(
                        "2026-09-22T00:00:00Z"
                    )
                )
        );
    }

    @Test
    public void legacyHistoricalBindingIsNotCurrentDeviceGate()
        throws Exception {

        String fingerprint =
            "0123456789abcdef0123456789abcdef" +
            "0123456789abcdef0123456789abcdef";

        FinoraPortableBranchAuthPayloadCodec
            .SourceAuthorizationEvidence evidence =
                parseEvidence(
                    buildLegacyEvidence(
                        fingerprint,
                        "FINORA-BINDING-" +
                            fingerprint
                                .substring(
                                    0,
                                    32
                                )
                                .toUpperCase(
                                    java.util.Locale.ROOT
                                )
                    )
                );

        /*
         * No current installationId, bindingKeyId or fingerprint is
         * supplied to verifyLegacyValues(). Historical binding data
         * therefore cannot become an ordinary fresh-device gate.
         */
        assertTrue(
            FinoraBranchPortabilityAuthorityVerifier
                .verifyLegacyValues(
                    1,
                    "FINORA-CREDENTIAL-ENROLLMENT-LEGACY-01",
                    evidence,
                    "USER-01",
                    "owner",
                    "OWNER-01",
                    "BUSINESS-01",
                    "BRANCH-01",
                    "USB",
                    1L,
                    Instant.parse(
                        "2026-09-22T00:00:00Z"
                    )
                )
        );
    }
    private static FinoraPortableBranchAuthPayloadCodec
        .SourceAuthorizationEvidence parseEvidence(
            JSONObject evidence
        )
            throws Exception {

        Method method =
            FinoraPortableBranchAuthPayloadCodec.class
                .getDeclaredMethod(
                    "parseSourceAuthorizationEvidence",
                    JSONObject.class
                );

        method.setAccessible(
            true
        );

        try {
            return (
                FinoraPortableBranchAuthPayloadCodec
                    .SourceAuthorizationEvidence
            ) method.invoke(
                null,
                evidence
            );
        }
        catch (InvocationTargetException error) {

            Throwable cause =
                error.getCause();

            if (
                cause instanceof
                    IllegalArgumentException
            ) {
                throw (
                    IllegalArgumentException
                ) cause;
            }

            if (
                cause instanceof
                    Exception
            ) {
                throw (
                    Exception
                ) cause;
            }

            throw error;
        }
    }

    private static JSONObject buildLegacyEvidence(
        String fingerprint,
        String bindingKeyId
    )
        throws Exception {

        JSONObject migration =
            new JSONObject();

        migration.put(
            "schemaVersion",
            1
        );

        migration.put(
            "migrationMethod",
            "PASSWORD_AND_ACTIVE_NATIVE_STORAGE_ENTITLEMENT"
        );

        migration.put(
            "sourceAuthorizationId",
            "FINORA-CREDENTIAL-ENROLLMENT-LEGACY-01"
        );

        migration.put(
            "ownerId",
            "OWNER-01"
        );

        migration.put(
            "businessId",
            "BUSINESS-01"
        );

        migration.put(
            "branchId",
            "BRANCH-01"
        );

        migration.put(
            "userId",
            "USER-01"
        );

        migration.put(
            "username",
            "owner"
        );

        migration.put(
            "storageMode",
            "USB"
        );

        migration.put(
            "authGeneration",
            1
        );

        migration.put(
            "installationId",
            "INSTALLATION-LEGACY-01"
        );

        migration.put(
            "bindingKeyId",
            bindingKeyId
        );

        migration.put(
            "fingerprintAlgorithm",
            "SHA-256"
        );

        migration.put(
            "publicKeyFingerprint",
            fingerprint
        );

        migration.put(
            "migratedAt",
            "2026-01-01T00:00:00.000Z"
        );

        JSONObject evidence =
            new JSONObject();

        evidence.put(
            "authorizationId",
            "FINORA-CREDENTIAL-ENROLLMENT-LEGACY-01"
        );

        evidence.put(
            "legacyNativeBoundMigrationEvidence",
            migration
        );

        evidence.put(
            "schemaVersion",
            1
        );

        return evidence;
    }
}