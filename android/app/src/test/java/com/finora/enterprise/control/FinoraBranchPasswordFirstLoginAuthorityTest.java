package com.finora.enterprise.control;

import org.junit.Test;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertSame;
import static org.junit.Assert.assertTrue;

public final class FinoraBranchPasswordFirstLoginAuthorityTest {

    private static final String PASSWORD =
        "correct-password";

    private static final String SECURITY_CODE =
        "correct-security-code";

    @Test
    public void wrongPasswordStopsBeforeDeviceTrustEvenWhenSecurityCodeWasSupplied() {

        FakePasswordPort password =
            new FakePasswordPort();

        password.result =
            FinoraBranchPasswordFirstLoginAuthority
                .PasswordAuthenticationResult.failure(
                    FinoraBranchCredentialAuthenticationAuthority
                        .INVALID_CREDENTIALS,
                    "Invalid username or password."
                );

        FakeCheckPort check =
            new FakeCheckPort();

        FakeAuthorizationPort authorize =
            new FakeAuthorizationPort();

        FinoraBranchPasswordFirstLoginAuthority.Result result =
            authority(
                password,
                check,
                authorize
            ).login(
                new FinoraBranchPasswordFirstLoginAuthority
                    .Request(
                        "owner",
                        "wrong-password",
                        SECURITY_CODE
                    )
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
            1,
            password.calls
        );

        assertEquals(
            0,
            check.calls
        );

        assertEquals(
            0,
            authorize.calls
        );

        assertNull(
            authorize.observedSecurityCode
        );
    }

    @Test
    public void trustedDeviceCompletesWithoutSecurityCodeAuthorization() {

        FakePasswordPort password =
            successfulPassword();

        FakeCheckPort check =
            new FakeCheckPort();

        check.result =
            FinoraBranchDeviceTrustAuthority.Result.success(
                FinoraBranchDeviceTrustAuthority
                    .STATUS_TRUSTED,
                fingerprint()
            );

        FakeAuthorizationPort authorize =
            new FakeAuthorizationPort();

        FinoraBranchPasswordFirstLoginAuthority.Result result =
            authority(
                password,
                check,
                authorize
            ).login(
                new FinoraBranchPasswordFirstLoginAuthority
                    .Request(
                        "owner",
                        PASSWORD,
                        null
                    )
            );

        assertTrue(
            result.success
        );

        assertEquals(
            FinoraBranchDeviceTrustAuthority
                .STATUS_TRUSTED,
            result.status
        );

        assertEquals(
            1,
            password.calls
        );

        assertEquals(
            1,
            check.calls
        );

        assertEquals(
            0,
            authorize.calls
        );

        assertEquals(
            "USER-1",
            result.data.userId
        );
    }

    @Test
    public void unknownDeviceWithoutSecurityCodeReturnsChallengeOnly() {

        FakePasswordPort password =
            successfulPassword();

        FakeCheckPort check =
            unknownDeviceCheck();

        FakeAuthorizationPort authorize =
            new FakeAuthorizationPort();

        FinoraBranchPasswordFirstLoginAuthority.Result result =
            authority(
                password,
                check,
                authorize
            ).login(
                new FinoraBranchPasswordFirstLoginAuthority
                    .Request(
                        "owner",
                        PASSWORD,
                        null
                    )
            );

        assertTrue(
            result.success
        );

        assertEquals(
            FinoraBranchDeviceTrustAuthority
                .STATUS_SECURITY_CODE_REQUIRED,
            result.status
        );

        assertEquals(
            1,
            password.calls
        );

        assertEquals(
            1,
            check.calls
        );

        assertEquals(
            0,
            authorize.calls
        );
    }

    @Test
    public void unknownDeviceWithSecurityCodeAuthorizesExactAuthenticatedPrincipal() {

        FakePasswordPort password =
            successfulPassword();

        FakeCheckPort check =
            unknownDeviceCheck();

        FakeAuthorizationPort authorize =
            new FakeAuthorizationPort();

        authorize.result =
            FinoraBranchDeviceTrustAuthorizationAuthority
                .Result.success(
                    FinoraBranchDeviceTrustAuthorizationAuthority
                        .STATUS_AUTHORIZED,
                    null
                );

        FinoraBranchPasswordFirstLoginAuthority.Result result =
            authority(
                password,
                check,
                authorize
            ).login(
                new FinoraBranchPasswordFirstLoginAuthority
                    .Request(
                        "owner",
                        PASSWORD,
                        SECURITY_CODE
                    )
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
            1,
            password.calls
        );

        assertEquals(
            1,
            check.calls
        );

        assertEquals(
            1,
            authorize.calls
        );

        assertEquals(
            PASSWORD,
            authorize.observedPassword
        );

        assertEquals(
            SECURITY_CODE,
            authorize.observedSecurityCode
        );

        assertEquals(
            7L,
            authorize.observedPrincipal.authGeneration
        );

        assertEquals(
            "USER-1",
            authorize.observedPrincipal.userId
        );

        assertEquals(
            "Owner Name",
            authorize.observedPrincipal.fullName
        );

        assertEquals(
            "ADMIN",
            authorize.observedPrincipal.role
        );

        assertEquals(
            "OWNER-1",
            authorize.observedPrincipal.ownerId
        );

        assertEquals(
            "BUSINESS-1",
            authorize.observedPrincipal.businessId
        );

        assertEquals(
            "BRANCH-1",
            authorize.observedPrincipal.branchId
        );

        assertEquals(
            "USB",
            authorize.observedPrincipal.storageMode
        );
    }

    @Test
    public void authorizationFailurePropagatesWithoutFalseLoginSuccess() {

        FakePasswordPort password =
            successfulPassword();

        FakeCheckPort check =
            unknownDeviceCheck();

        FakeAuthorizationPort authorize =
            new FakeAuthorizationPort();

        authorize.result =
            FinoraBranchDeviceTrustAuthorizationAuthority
                .Result.failure(
                    FinoraBranchDeviceTrustAuthorizationAuthority
                        .ERROR_PORTABLE_AUTH_AUTHENTICATION_FAILED,
                    "FINORA Portable Branch Auth authentication failed."
                );

        FinoraBranchPasswordFirstLoginAuthority.Result result =
            authority(
                password,
                check,
                authorize
            ).login(
                new FinoraBranchPasswordFirstLoginAuthority
                    .Request(
                        "owner",
                        PASSWORD,
                        "wrong-security-code"
                    )
            );

        assertFalse(
            result.success
        );

        assertEquals(
            FinoraBranchDeviceTrustAuthorizationAuthority
                .ERROR_PORTABLE_AUTH_AUTHENTICATION_FAILED,
            result.errorCode
        );

        assertEquals(
            1,
            authorize.calls
        );
    }

    @Test
    public void deviceTrustFailureStopsBeforeFreshAuthorization() {

        FakePasswordPort password =
            successfulPassword();

        FakeCheckPort check =
            new FakeCheckPort();

        check.result =
            FinoraBranchDeviceTrustAuthority.Result.failure(
                FinoraBranchDeviceTrustAuthority
                    .ERROR_PORTABLE_AUTH_UNAVAILABLE,
                "FINORA Portable Branch Auth state is unavailable."
            );

        FakeAuthorizationPort authorize =
            new FakeAuthorizationPort();

        FinoraBranchPasswordFirstLoginAuthority.Result result =
            authority(
                password,
                check,
                authorize
            ).login(
                new FinoraBranchPasswordFirstLoginAuthority
                    .Request(
                        "owner",
                        PASSWORD,
                        SECURITY_CODE
                    )
            );

        assertFalse(
            result.success
        );

        assertEquals(
            FinoraBranchDeviceTrustAuthority
                .ERROR_PORTABLE_AUTH_UNAVAILABLE,
            result.errorCode
        );

        assertEquals(
            0,
            authorize.calls
        );
    }

    private static FinoraBranchPasswordFirstLoginAuthority
        authority(
            FakePasswordPort password,
            FakeCheckPort check,
            FakeAuthorizationPort authorize
        ) {

        return new FinoraBranchPasswordFirstLoginAuthority(
            password,
            check,
            authorize
        );
    }

    private static FakePasswordPort successfulPassword() {

        FakePasswordPort port =
            new FakePasswordPort();

        port.result =
            FinoraBranchPasswordFirstLoginAuthority
                .PasswordAuthenticationResult.success(
                    identity()
                );

        return port;
    }

    private static FakeCheckPort unknownDeviceCheck() {

        FakeCheckPort port =
            new FakeCheckPort();

        port.result =
            FinoraBranchDeviceTrustAuthority.Result.success(
                FinoraBranchDeviceTrustAuthority
                    .STATUS_SECURITY_CODE_REQUIRED,
                fingerprint()
            );

        return port;
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
                "2026-09-18T13:00:00.000Z"
            );
    }

    private static String fingerprint() {

        return (
            "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" +
            "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
        );
    }

    private static final class FakePasswordPort
        implements FinoraBranchPasswordFirstLoginAuthority
            .PasswordAuthenticationPort {

        int calls;

        String observedUsername;
        String observedPassword;

        FinoraBranchPasswordFirstLoginAuthority
            .PasswordAuthenticationResult result;

        @Override
        public FinoraBranchPasswordFirstLoginAuthority
            .PasswordAuthenticationResult authenticate(
                String username,
                String password
            ) {

            calls++;

            observedUsername =
                username;

            observedPassword =
                password;

            return result;
        }
    }

    private static final class FakeCheckPort
        implements FinoraBranchPasswordFirstLoginAuthority
            .DeviceTrustCheckPort {

        int calls;

        FinoraBranchDeviceTrustAuthority.Principal
            observedPrincipal;

        FinoraBranchDeviceTrustAuthority.Result
            result;

        @Override
        public FinoraBranchDeviceTrustAuthority.Result check(
            FinoraBranchDeviceTrustAuthority.Principal principal
        ) {

            calls++;

            observedPrincipal =
                principal;

            return result;
        }
    }

    private static final class FakeAuthorizationPort
        implements FinoraBranchPasswordFirstLoginAuthority
            .DeviceTrustAuthorizationPort {

        int calls;

        FinoraBranchDeviceTrustAuthorizationAuthority
            .Principal observedPrincipal;

        String observedPassword;
        String observedSecurityCode;

        FinoraBranchDeviceTrustAuthorizationAuthority
            .Result result;

        @Override
        public FinoraBranchDeviceTrustAuthorizationAuthority.Result
            authorize(
                FinoraBranchDeviceTrustAuthorizationAuthority
                    .Principal principal,
                String password,
                String securityCode
            ) {

            calls++;

            observedPrincipal =
                principal;

            observedPassword =
                password;

            observedSecurityCode =
                securityCode;

            return result;
        }
    }
}