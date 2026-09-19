package com.finora.enterprise.control;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import java.util.Arrays;
import java.util.Base64;

import org.json.JSONArray;
import org.json.JSONObject;
import org.junit.Test;

public final class FinoraBranchLoginSessionProductionAuthorizationAdapterTest {

    @Test
    public void activeRegisteredAuthorizesActiveWithLogicalEntitlement()
        throws Exception {

        FinoraBranchLoginSessionAuthority.AuthorizationResult result =
            authorize(
                credential(
                    "REAL",
                    null
                ),
                registeredGrant(),
                "2026-06-01T00:00:00Z",
                controlPackage(
                    "ACTIVE",
                    registeredGrantJson(),
                    "ACTIVE",
                    true
                ),
                "LOCAL",
                "CREDENTIAL-1"
            );

        assertTrue(result.success);
        assertEquals(
            FinoraBranchLoginSessionAuthority.ACCESS_MODE_ACTIVE,
            result.accessMode
        );
        assertNotNull(result.principal);
        assertEquals(
            "CREDENTIAL-1",
            result.principal.credentialId
        );
        assertEquals(
            1L,
            result.principal.authGeneration
        );
        assertEquals(
            "REAL",
            result.principal.dataContext
        );
    }

    @Test
    public void expiredRegisteredAuthorizesReadOnly()
        throws Exception {

        FinoraBranchLoginSessionAuthority.AuthorizationResult result =
            authorize(
                credential(
                    "REAL",
                    null
                ),
                registeredGrant(),
                "2027-01-01T00:00:00Z",
                controlPackage(
                    "ACTIVE",
                    registeredGrantJson(),
                    "ACTIVE",
                    false
                ),
                "LOCAL",
                "CREDENTIAL-1"
            );

        assertTrue(result.success);
        assertEquals(
            FinoraBranchLoginSessionAuthority
                .ACCESS_MODE_REGISTERED_EXPIRED_READ_ONLY,
            result.accessMode
        );
    }

    @Test
    public void expiredDemoIsDenied()
        throws Exception {

        FinoraBranchLoginSessionAuthority.AuthorizationResult result =
            authorize(
                credential(
                    "DEMO",
                    "DEMO-1"
                ),
                demoGrant(),
                "2026-07-01T00:00:00Z",
                controlPackage(
                    "ACTIVE",
                    demoGrantJson(),
                    "ACTIVE",
                    false
                ),
                "LOCAL",
                "CREDENTIAL-1"
            );

        assertFalse(result.success);
        assertEquals(
            FinoraBranchLoginSessionAuthority.ERROR_BRANCH_ACCESS_DENIED,
            result.errorCode
        );
    }

    @Test
    public void missingCredentialInvalidatesSession()
        throws Exception {

        FinoraBranchLoginSessionAuthority.AuthorizationResult result =
            authorize(
                credential(
                    "REAL",
                    null
                ),
                registeredGrant(),
                "2026-06-01T00:00:00Z",
                controlPackage(
                    "ACTIVE",
                    registeredGrantJson(),
                    "ACTIVE",
                    false
                ),
                "LOCAL",
                "MISSING-CREDENTIAL"
            );

        assertFalse(result.success);
        assertEquals(
            FinoraBranchLoginSessionAuthority.ERROR_SESSION_INVALID,
            result.errorCode
        );
    }

    @Test
    public void selectedStorageModeMismatchIsDenied()
        throws Exception {

        FinoraBranchLoginSessionAuthority.AuthorizationResult result =
            authorize(
                credential(
                    "REAL",
                    null
                ),
                registeredGrant(),
                "2026-06-01T00:00:00Z",
                controlPackage(
                    "ACTIVE",
                    registeredGrantJson(),
                    "ACTIVE",
                    false
                ),
                "USB",
                "CREDENTIAL-1"
            );

        assertFalse(result.success);
        assertEquals(
            FinoraBranchLoginSessionAuthority.ERROR_STORAGE_MODE_MISMATCH,
            result.errorCode
        );
    }

    @Test
    public void inactiveActivationAndEntitlementFailClosed()
        throws Exception {

        FinoraBranchLoginSessionAuthority.AuthorizationResult activationDenied =
            authorize(
                credential(
                    "REAL",
                    null
                ),
                registeredGrant(),
                "2026-06-01T00:00:00Z",
                controlPackage(
                    "SUSPENDED",
                    registeredGrantJson(),
                    "ACTIVE",
                    false
                ),
                "LOCAL",
                "CREDENTIAL-1"
            );

        assertFalse(activationDenied.success);
        assertEquals(
            FinoraBranchLoginSessionAuthority.ERROR_ACTIVATION_REQUIRED,
            activationDenied.errorCode
        );

        FinoraBranchLoginSessionAuthority.AuthorizationResult entitlementDenied =
            authorize(
                credential(
                    "REAL",
                    null
                ),
                registeredGrant(),
                "2026-06-01T00:00:00Z",
                controlPackage(
                    "ACTIVE",
                    registeredGrantJson(),
                    "REVOKED",
                    false
                ),
                "LOCAL",
                "CREDENTIAL-1"
            );

        assertFalse(entitlementDenied.success);
        assertEquals(
            FinoraBranchLoginSessionAuthority.ERROR_STORAGE_ENTITLEMENT_DENIED,
            entitlementDenied.errorCode
        );
    }

    private static FinoraBranchLoginSessionAuthority.AuthorizationResult
        authorize(
            FinoraBranchCredentialContract.Credential credential,
            FinoraBranchAccessRuntimeEvaluator.Grant grant,
            String observedAt,
            JSONObject controlPackage,
            String selectedStorageMode,
            String credentialId
        )
            throws Exception {

        FakeCredentialPort credentialPort =
            new FakeCredentialPort(
                new JSONObject()
                    .put(
                        "sentinel",
                        "preserve"
                    )
                    .toString()
            );

        FinoraBranchCredentialStore credentialStore =
            new FinoraBranchCredentialStore(
                credentialPort
            );

        credentialStore.insertNew(
            credential
        );

        FinoraBranchAccessRuntimeAuthority branchAccessAuthority =
            new FinoraBranchAccessRuntimeAuthority(
                new FixedGrantPort(
                    grant
                ),
                new FixedClockPort(
                    FinoraBranchAccessRuntimeAuthority
                        .ClockResult
                        .success(
                            observedAt
                        )
                )
            );

        FinoraBranchLoginSessionProductionAuthorizationAdapter adapter =
            new FinoraBranchLoginSessionProductionAuthorizationAdapter(
                credentialStore,
                branchAccessAuthority,
                new FixedValidatedControlStatePort(
                    controlPackage.toString()
                ),
                new FinoraBranchLoginSessionProductionAuthorizationAdapter.DeviceTrustCheckPort() {
                    @Override
                    public FinoraBranchDeviceTrustAuthority.Result check(
                        FinoraBranchDeviceTrustAuthority.Principal principal
                    ) {
                        return FinoraBranchDeviceTrustAuthority.Result.success(
                            FinoraBranchDeviceTrustAuthority.STATUS_TRUSTED,
                            null
                        );
                    }
                }
            );

        return adapter.authorize(
            credentialId,
            selectedStorageMode
        );
    }

    private static JSONObject controlPackage(
        String activationStatus,
        JSONObject grant,
        String entitlementStatus,
        boolean includeHistoricalBinding
    )
        throws Exception {

        JSONObject activation =
            new JSONObject()
                .put(
                    "ownerId",
                    "OWNER-1"
                )
                .put(
                    "businessId",
                    "BUSINESS-1"
                )
                .put(
                    "branchId",
                    "BRANCH-1"
                )
                .put(
                    "status",
                    activationStatus
                );

        JSONObject entitlement =
            new JSONObject()
                .put(
                    "userId",
                    "USER-1"
                )
                .put(
                    "ownerId",
                    "OWNER-1"
                )
                .put(
                    "businessId",
                    "BUSINESS-1"
                )
                .put(
                    "branchId",
                    "BRANCH-1"
                )
                .put(
                    "storageMode",
                    "LOCAL"
                )
                .put(
                    "status",
                    entitlementStatus
                );

        if (includeHistoricalBinding) {
            entitlement
                .put(
                    "installationId",
                    "HISTORICAL-INSTALLATION"
                )
                .put(
                    "bindingKeyId",
                    "HISTORICAL-BINDING"
                )
                .put(
                    "fingerprintAlgorithm",
                    "SHA-256"
                )
                .put(
                    "publicKeyFingerprint",
                    "HISTORICAL-FINGERPRINT"
                );
        }

        return new JSONObject()
            .put(
                "activations",
                new JSONArray()
                    .put(
                        activation
                    )
            )
            .put(
                "branchAccessGrants",
                new JSONArray()
                    .put(
                        grant
                    )
            )
            .put(
                "storageEntitlements",
                new JSONArray()
                    .put(
                        entitlement
                    )
            );
    }

    private static JSONObject registeredGrantJson()
        throws Exception {

        return new JSONObject()
            .put(
                "userId",
                "USER-1"
            )
            .put(
                "ownerId",
                "OWNER-1"
            )
            .put(
                "businessId",
                "BUSINESS-1"
            )
            .put(
                "branchId",
                "BRANCH-1"
            )
            .put(
                "storageMode",
                "LOCAL"
            )
            .put(
                "accessType",
                "REGISTERED"
            );
    }

    private static JSONObject demoGrantJson()
        throws Exception {

        return new JSONObject()
            .put(
                "userId",
                "USER-1"
            )
            .put(
                "ownerId",
                "OWNER-1"
            )
            .put(
                "businessId",
                "BUSINESS-1"
            )
            .put(
                "branchId",
                "BRANCH-1"
            )
            .put(
                "storageMode",
                "LOCAL"
            )
            .put(
                "accessType",
                "DEMO"
            )
            .put(
                "demoId",
                "DEMO-1"
            );
    }

    private static FinoraBranchAccessRuntimeEvaluator.Grant
        registeredGrant() {

        return new FinoraBranchAccessRuntimeEvaluator.Grant(
            "GRANT-1",
            "USER-1",
            "OWNER-1",
            "BUSINESS-1",
            "BRANCH-1",
            "LOCAL",
            "ACTIVE",
            "2026-01-01T00:00:00Z",
            "2027-01-01T00:00:00Z",
            "2025-12-31T23:00:00Z",
            "2025-12-31T23:30:00Z",
            1,
            "REGISTERED",
            1L,
            new FinoraBranchAccessRuntimeEvaluator.RegistrationPayment(
                2000.0d,
                "INR",
                "2025-12-31T22:00:00Z",
                false
            ),
            null
        );
    }

    private static FinoraBranchAccessRuntimeEvaluator.Grant
        demoGrant() {

        return new FinoraBranchAccessRuntimeEvaluator.Grant(
            "GRANT-DEMO-1",
            "USER-1",
            "OWNER-1",
            "BUSINESS-1",
            "BRANCH-1",
            "LOCAL",
            "ACTIVE",
            "2026-01-01T00:00:00Z",
            "2026-06-30T00:00:00Z",
            "2025-12-31T23:00:00Z",
            "2025-12-31T23:30:00Z",
            1,
            "DEMO",
            null,
            null,
            "DEMO-1"
        );
    }

    private static FinoraBranchCredentialContract.Credential
        credential(
            String dataContext,
            String demoId
        )
            throws Exception {

        JSONObject value =
            new JSONObject();

        value.put(
            "credentialId",
            "CREDENTIAL-1"
        );

        value.put(
            "sourceAuthorizationId",
            "AUTH-1"
        );

        value.put(
            "authGeneration",
            1
        );

        value.put(
            "userId",
            "USER-1"
        );

        value.put(
            "username",
            "owneruser"
        );

        value.put(
            "canonicalUsername",
            "owneruser"
        );

        value.put(
            "fullName",
            "FINORA Owner"
        );

        value.put(
            "role",
            "ADMIN"
        );

        value.put(
            "ownerId",
            "OWNER-1"
        );

        value.put(
            "businessId",
            "BUSINESS-1"
        );

        value.put(
            "branchId",
            "BRANCH-1"
        );

        value.put(
            "storageMode",
            "LOCAL"
        );

        value.put(
            "dataContext",
            dataContext
        );

        if (demoId != null) {
            value.put(
                "demoId",
                demoId
            );
        }

        value.put(
            "status",
            "ACTIVE"
        );

        value.put(
            "verifier",
            verifier(
                (byte) 1,
                (byte) 2
            )
        );

        value.put(
            "securityVerifier",
            verifier(
                (byte) 3,
                (byte) 4
            )
        );

        value.put(
            "createdAt",
            "2026-09-18T10:00:00.000Z"
        );

        value.put(
            "updatedAt",
            "2026-09-18T10:00:00.000Z"
        );

        value.put(
            "schemaVersion",
            1
        );

        return FinoraBranchCredentialContract
            .parse(
                value.toString()
            );
    }

    private static JSONObject verifier(
        byte saltValue,
        byte keyValue
    )
        throws Exception {

        byte[] salt =
            new byte[16];

        byte[] key =
            new byte[32];

        Arrays.fill(
            salt,
            saltValue
        );

        Arrays.fill(
            key,
            keyValue
        );

        JSONObject verifier =
            new JSONObject();

        verifier.put(
            "algorithm",
            "SCRYPT"
        );

        verifier.put(
            "saltEncoding",
            "BASE64"
        );

        verifier.put(
            "salt",
            Base64
                .getEncoder()
                .encodeToString(
                    salt
                )
        );

        verifier.put(
            "derivedKeyEncoding",
            "BASE64"
        );

        verifier.put(
            "derivedKey",
            Base64
                .getEncoder()
                .encodeToString(
                    key
                )
        );

        verifier.put(
            "keyLength",
            32
        );

        verifier.put(
            "N",
            32768
        );

        verifier.put(
            "r",
            8
        );

        verifier.put(
            "p",
            1
        );

        return verifier;
    }

    private static final class FakeCredentialPort
        implements FinoraBranchCredentialStore.ControlStatePort {

        String state;

        FakeCredentialPort(
            String state
        ) {
            this.state =
                state;
        }

        @Override
        public String read() {
            return state;
        }

        @Override
        public void write(
            String serialized
        ) {
            state =
                serialized;
        }
    }

    private static final class FixedValidatedControlStatePort
        implements FinoraBranchAccessRuntimeProductionAdapters
            .ValidatedControlStatePort {

        private final String state;

        FixedValidatedControlStatePort(
            String state
        ) {
            this.state =
                state;
        }

        @Override
        public String readValidated() {
            return state;
        }
    }

    private static final class FixedGrantPort
        implements FinoraBranchAccessRuntimeAuthority.GrantPort {

        private final FinoraBranchAccessRuntimeEvaluator.Grant grant;

        FixedGrantPort(
            FinoraBranchAccessRuntimeEvaluator.Grant grant
        ) {
            this.grant =
                grant;
        }

        @Override
        public FinoraBranchAccessRuntimeEvaluator.Grant find(
            String userId,
            String ownerId,
            String businessId,
            String branchId
        ) {
            return grant;
        }
    }

    private static final class FixedClockPort
        implements FinoraBranchAccessRuntimeAuthority.ClockPort {

        private final FinoraBranchAccessRuntimeAuthority.ClockResult result;

        FixedClockPort(
            FinoraBranchAccessRuntimeAuthority.ClockResult result
        ) {
            this.result =
                result;
        }

        @Override
        public FinoraBranchAccessRuntimeAuthority.ClockResult observe() {
            return result;
        }
    }
}
