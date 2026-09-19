package com.finora.enterprise.control;

import org.junit.Test;

import java.lang.reflect.Constructor;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;

public final class
    FinoraBranchPasswordFirstLoginProductionFactoryTest {

    @Test
    public void successfulPasswordResultMapsExactIdentity()
        throws Exception {

        FinoraBranchCredentialAuthenticationAuthority.Success success =
            construct(
                FinoraBranchCredentialAuthenticationAuthority
                    .Success.class,
                new Class<?>[] {
                    String.class,
                    long.class,
                    String.class,
                    String.class,
                    String.class,
                    String.class,
                    String.class,
                    String.class,
                    String.class,
                    String.class,
                    String.class,
                    String.class,
                    String.class
                },
                new Object[] {
                    "CREDENTIAL-1",
                    9L,
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
                }
            );

        FinoraBranchCredentialAuthenticationAuthority.Result source =
            FinoraBranchCredentialAuthenticationAuthority
                .Result.success(
                    success
                );

        FinoraBranchPasswordFirstLoginAuthority
            .PasswordAuthenticationResult mapped =
                FinoraBranchPasswordFirstLoginProductionFactory
                    .mapPasswordResult(
                        source
                    );

        assertTrue(
            mapped.success
        );

        assertNull(
            mapped.errorCode
        );

        assertEquals(
            "CREDENTIAL-1",
            mapped.data.credentialId
        );

        assertEquals(
            9L,
            mapped.data.authGeneration
        );

        assertEquals(
            "USER-1",
            mapped.data.userId
        );

        assertEquals(
            "owner",
            mapped.data.username
        );

        assertEquals(
            "Owner Name",
            mapped.data.fullName
        );

        assertEquals(
            "ADMIN",
            mapped.data.role
        );

        assertEquals(
            "OWNER-1",
            mapped.data.ownerId
        );

        assertEquals(
            "BUSINESS-1",
            mapped.data.businessId
        );

        assertEquals(
            "BRANCH-1",
            mapped.data.branchId
        );

        assertEquals(
            "USB",
            mapped.data.storageMode
        );

        assertEquals(
            "REAL",
            mapped.data.dataContext
        );

        assertEquals(
            "2026-09-18T13:00:00Z",
            mapped.data.authenticatedAt
        );
    }

    @Test
    public void invalidCredentialsRemainExactAndDoNotBecomeGenericFailure() {

        FinoraBranchCredentialAuthenticationAuthority.Result source =
            FinoraBranchCredentialAuthenticationAuthority
                .Result.failure(
                    FinoraBranchCredentialAuthenticationAuthority
                        .INVALID_CREDENTIALS,
                    "Invalid username or password."
                );

        FinoraBranchPasswordFirstLoginAuthority
            .PasswordAuthenticationResult mapped =
                FinoraBranchPasswordFirstLoginProductionFactory
                    .mapPasswordResult(
                        source
                    );

        assertFalse(
            mapped.success
        );

        assertEquals(
            FinoraBranchCredentialAuthenticationAuthority
                .INVALID_CREDENTIALS,
            mapped.errorCode
        );

        assertEquals(
            "Invalid username or password.",
            mapped.error
        );

        assertNull(
            mapped.data
        );
    }

    @Test
    public void nullPasswordAuthorityResultFailsClosed() {

        FinoraBranchPasswordFirstLoginAuthority
            .PasswordAuthenticationResult mapped =
                FinoraBranchPasswordFirstLoginProductionFactory
                    .mapPasswordResult(
                        null
                    );

        assertFalse(
            mapped.success
        );

        assertEquals(
            FinoraBranchPasswordFirstLoginAuthority
                .ERROR_PASSWORD_AUTHENTICATION_FAILED,
            mapped.errorCode
        );

        assertNull(
            mapped.data
        );
    }

    @SuppressWarnings("unchecked")
    private static <T> T construct(
        Class<T> type,
        Class<?>[] parameterTypes,
        Object[] arguments
    )
        throws Exception {

        Constructor<T> constructor =
            type.getDeclaredConstructor(
                parameterTypes
            );

        constructor.setAccessible(
            true
        );

        return constructor.newInstance(
            arguments
        );
    }
}