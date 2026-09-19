package com.finora.enterprise.control;

import org.junit.Test;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;

public final class
    FinoraBranchPasswordFirstLoginBridgeContractTest {

    @Test
    public void securityCodeRequiredIsChallengeNotLoginSuccess() {

        FinoraBranchPasswordFirstLoginAuthority.Result source =
            FinoraBranchPasswordFirstLoginAuthority
                .Result.success(
                    FinoraBranchDeviceTrustAuthority
                        .STATUS_SECURITY_CODE_REQUIRED,
                    identity()
                );

        FinoraBranchPasswordFirstLoginBridgeContract.Response result =
            FinoraBranchPasswordFirstLoginBridgeContract
                .fromAuthorityResult(
                    source
                );

        assertFalse(
            result.success
        );

        assertEquals(
            FinoraBranchPasswordFirstLoginBridgeContract
                .SECURITY_CODE_REQUIRED,
            result.errorCode
        );

        assertEquals(
            "Security Code is required to authorize this device.",
            result.error
        );

        assertNull(
            result.data
        );
    }

    @Test
    public void wrongSecurityCodeNormalizesToSecurityCodeInvalid() {

        FinoraBranchPasswordFirstLoginAuthority.Result source =
            FinoraBranchPasswordFirstLoginAuthority
                .Result.failure(
                    FinoraBranchDeviceTrustAuthorizationAuthority
                        .ERROR_PORTABLE_AUTH_AUTHENTICATION_FAILED,
                    "FINORA Portable Branch Auth authentication failed."
                );

        FinoraBranchPasswordFirstLoginBridgeContract.Response result =
            FinoraBranchPasswordFirstLoginBridgeContract
                .fromAuthorityResult(
                    source
                );

        assertFalse(
            result.success
        );

        assertEquals(
            FinoraBranchPasswordFirstLoginBridgeContract
                .SECURITY_CODE_INVALID,
            result.errorCode
        );

        assertEquals(
            "Invalid Security Code.",
            result.error
        );

        assertNull(
            result.data
        );
    }

    @Test
    public void invalidCredentialsRemainExact() {

        FinoraBranchPasswordFirstLoginAuthority.Result source =
            FinoraBranchPasswordFirstLoginAuthority
                .Result.failure(
                    FinoraBranchCredentialAuthenticationAuthority
                        .INVALID_CREDENTIALS,
                    "Invalid username or password."
                );

        FinoraBranchPasswordFirstLoginBridgeContract.Response result =
            FinoraBranchPasswordFirstLoginBridgeContract
                .fromAuthorityResult(
                    source
                );

        assertFalse(
            result.success
        );

        assertEquals(
            FinoraBranchCredentialAuthenticationAuthority
                .INVALID_CREDENTIALS,
            result.errorCode
        );

        assertEquals(
            "Invalid username or password.",
            result.error
        );
    }

    @Test
    public void trustedDeviceReturnsExactAuthenticatedIdentity() {

        FinoraBranchPasswordFirstLoginAuthority.Result source =
            FinoraBranchPasswordFirstLoginAuthority
                .Result.success(
                    FinoraBranchDeviceTrustAuthority
                        .STATUS_TRUSTED,
                    identity()
                );

        FinoraBranchPasswordFirstLoginBridgeContract.Response result =
            FinoraBranchPasswordFirstLoginBridgeContract
                .fromAuthorityResult(
                    source
                );

        assertTrue(
            result.success
        );

        assertEquals(
            FinoraBranchDeviceTrustAuthority
                .STATUS_TRUSTED,
            result.status
        );

        assertNull(
            result.errorCode
        );

        assertEquals(
            "CREDENTIAL-1",
            result.data.credentialId
        );

        assertEquals(
            7L,
            result.data.authGeneration
        );

        assertEquals(
            "USER-1",
            result.data.userId
        );

        assertEquals(
            "owner",
            result.data.username
        );

        assertEquals(
            "Owner Name",
            result.data.fullName
        );

        assertEquals(
            "ADMIN",
            result.data.role
        );

        assertEquals(
            "OWNER-1",
            result.data.ownerId
        );

        assertEquals(
            "BUSINESS-1",
            result.data.businessId
        );

        assertEquals(
            "BRANCH-1",
            result.data.branchId
        );

        assertEquals(
            "USB",
            result.data.storageMode
        );

        assertEquals(
            "REAL",
            result.data.dataContext
        );

        assertEquals(
            "2026-09-18T13:00:00Z",
            result.data.authenticatedAt
        );
    }

    @Test
    public void authorizedDeviceReturnsExactAuthenticatedIdentity() {

        FinoraBranchPasswordFirstLoginAuthority.Result source =
            FinoraBranchPasswordFirstLoginAuthority
                .Result.success(
                    FinoraBranchDeviceTrustAuthorizationAuthority
                        .STATUS_AUTHORIZED,
                    identity()
                );

        FinoraBranchPasswordFirstLoginBridgeContract.Response result =
            FinoraBranchPasswordFirstLoginBridgeContract
                .fromAuthorityResult(
                    source
                );

        assertTrue(
            result.success
        );

        assertEquals(
            FinoraBranchDeviceTrustAuthorizationAuthority
                .STATUS_AUTHORIZED,
            result.status
        );

        assertEquals(
            "USER-1",
            result.data.userId
        );
    }

    @Test
    public void nullResultFailsClosed() {

        FinoraBranchPasswordFirstLoginBridgeContract.Response result =
            FinoraBranchPasswordFirstLoginBridgeContract
                .fromAuthorityResult(
                    null
                );

        assertFalse(
            result.success
        );

        assertEquals(
            FinoraBranchPasswordFirstLoginBridgeContract
                .PASSWORD_FIRST_LOGIN_FAILED,
            result.errorCode
        );

        assertNull(
            result.data
        );
    }

    private static FinoraBranchPasswordFirstLoginAuthority
        .AuthenticatedIdentity identity() {

        return new FinoraBranchPasswordFirstLoginAuthority
            .AuthenticatedIdentity(
                "CREDENTIAL-1",
                7L,
                "USER-1",
                "owner",
                "Owner Name",
                "ADMIN",
                "OWNER-1",
                "BUSINESS-1",
                "BRANCH-1",
                "USB",
                "REAL",
                null,
                "2026-09-18T13:00:00Z"
            );
    }
}