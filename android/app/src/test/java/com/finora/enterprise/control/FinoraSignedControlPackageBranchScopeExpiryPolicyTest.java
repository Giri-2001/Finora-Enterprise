package com.finora.enterprise.control;

import org.junit.Test;

import java.lang.reflect.Method;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertNotNull;

public final class FinoraSignedControlPackageBranchScopeExpiryPolicyTest {

    @Test
    public void absentTopLevelExpiryRemainsValid()
        throws Exception {

        Map<String, Object> controlPackage =
            new LinkedHashMap<>();

        FinoraSignedControlPackageVerifier.Result result =
            invokeExpiryPolicy(
                controlPackage,
                Instant.parse(
                    "2026-09-18T12:00:00Z"
                )
            );

        assertNull(
            result
        );
    }

    @Test
    public void exactExpiryInstantRemainsValid()
        throws Exception {

        Map<String, Object> controlPackage =
            new LinkedHashMap<>();

        controlPackage.put(
            "expiresAt",
            "2026-09-18T12:00:00Z"
        );

        FinoraSignedControlPackageVerifier.Result result =
            invokeExpiryPolicy(
                controlPackage,
                Instant.parse(
                    "2026-09-18T12:00:00Z"
                )
            );

        assertNull(
            result
        );
    }

    @Test
    public void instantAfterExpiryFailsClosed()
        throws Exception {

        Map<String, Object> controlPackage =
            new LinkedHashMap<>();

        controlPackage.put(
            "expiresAt",
            "2026-09-18T12:00:00Z"
        );

        FinoraSignedControlPackageVerifier.Result result =
            invokeExpiryPolicy(
                controlPackage,
                Instant.parse(
                    "2026-09-18T12:00:00.001Z"
                )
            );

        assertNotNull(
            result
        );

        assertEquals(
            "PACKAGE_EXPIRED",
            result.reason
        );
    }

    @Test
    public void malformedTopLevelExpiryFailsClosed()
        throws Exception {

        Map<String, Object> controlPackage =
            new LinkedHashMap<>();

        controlPackage.put(
            "expiresAt",
            "not-a-timestamp"
        );

        FinoraSignedControlPackageVerifier.Result result =
            invokeExpiryPolicy(
                controlPackage,
                Instant.parse(
                    "2026-09-18T12:00:00Z"
                )
            );

        assertNotNull(
            result
        );

        assertEquals(
            "MALFORMED_PACKAGE",
            result.reason
        );
    }

    private static FinoraSignedControlPackageVerifier.Result
        invokeExpiryPolicy(
            Map<String, Object> controlPackage,
            Instant now
        )
            throws Exception {

        Method method =
            FinoraSignedControlPackageVerifier.class
                .getDeclaredMethod(
                    "branchScopeTopLevelExpiryFailure",
                    Map.class,
                    Instant.class
                );

        method.setAccessible(
            true
        );

        return (
            FinoraSignedControlPackageVerifier.Result
        ) method.invoke(
            null,
            controlPackage,
            now
        );
    }
}