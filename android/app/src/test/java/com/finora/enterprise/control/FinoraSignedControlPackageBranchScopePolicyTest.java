package com.finora.enterprise.control;

import org.junit.Test;

import java.lang.reflect.Method;
import java.time.Instant;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

public final class FinoraSignedControlPackageBranchScopePolicyTest {

    private static final String OWNER_ID =
        "OWNER-TEST";

    private static final String BUSINESS_ID =
        "BUSINESS-TEST";

    private static final String BRANCH_ID =
        "BRANCH-TEST";

    @Test
    public void exactBranchScopeTargetMatches()
        throws Exception {

        FinoraSignedControlPackageVerifier.Target expected =
            new FinoraSignedControlPackageVerifier.Target(
                OWNER_ID,
                BUSINESS_ID,
                BRANCH_ID,
                null,
                null,
                null,
                null
            );

        Map<String, Object> actual =
            new LinkedHashMap<>();

        actual.put(
            "ownerId",
            OWNER_ID
        );

        actual.put(
            "businessId",
            BUSINESS_ID
        );

        actual.put(
            "branchId",
            BRANCH_ID
        );

        assertTrue(
            invokePolicyMatcher(
                actual,
                expected,
                true
            )
        );
    }

    @Test
    public void branchScopeRejectsExtraInstallationKey()
        throws Exception {

        FinoraSignedControlPackageVerifier.Target expected =
            new FinoraSignedControlPackageVerifier.Target(
                OWNER_ID,
                BUSINESS_ID,
                BRANCH_ID,
                null,
                null,
                null,
                null
            );

        Map<String, Object> actual =
            new LinkedHashMap<>();

        actual.put(
            "ownerId",
            OWNER_ID
        );

        actual.put(
            "businessId",
            BUSINESS_ID
        );

        actual.put(
            "branchId",
            BRANCH_ID
        );

        actual.put(
            "installationId",
            "INSTALLATION-MUST-NOT-BE-PRESENT"
        );

        assertFalse(
            invokePolicyMatcher(
                actual,
                expected,
                true
            )
        );
    }

    @Test
    public void branchScopeRejectsWrongBranch()
        throws Exception {

        FinoraSignedControlPackageVerifier.Target expected =
            new FinoraSignedControlPackageVerifier.Target(
                OWNER_ID,
                BUSINESS_ID,
                BRANCH_ID,
                null,
                null,
                null,
                null
            );

        Map<String, Object> actual =
            new LinkedHashMap<>();

        actual.put(
            "ownerId",
            OWNER_ID
        );

        actual.put(
            "businessId",
            BUSINESS_ID
        );

        actual.put(
            "branchId",
            "OTHER-BRANCH"
        );

        assertFalse(
            invokePolicyMatcher(
                actual,
                expected,
                true
            )
        );
    }

    @Test
    public void branchScopeRejectsNativeExpectedTarget()
        throws Exception {

        FinoraSignedControlPackageVerifier.Target nativeExpected =
            new FinoraSignedControlPackageVerifier.Target(
                OWNER_ID,
                BUSINESS_ID,
                BRANCH_ID,
                "INSTALLATION-1",
                "BINDING-1",
                "SHA-256",
                "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
            );

        Map<String, Object> actual =
            new LinkedHashMap<>();

        actual.put(
            "ownerId",
            OWNER_ID
        );

        actual.put(
            "businessId",
            BUSINESS_ID
        );

        actual.put(
            "branchId",
            BRANCH_ID
        );

        assertFalse(
            invokePolicyMatcher(
                actual,
                nativeExpected,
                true
            )
        );
    }

    @Test
    public void publicBranchScopeEntryUsesGenericPipeline() {

        FinoraSignedControlPackageVerifier.Result result =
            FinoraSignedControlPackageVerifier.verifyBranchScope(
                null,
                Collections.<FinoraSignedControlPackageVerifier.TrustedKey>emptyList(),
                OWNER_ID,
                BUSINESS_ID,
                BRANCH_ID,
                Instant.parse(
                    "2026-09-18T12:00:00Z"
                )
            );

        assertFalse(
            result.valid
        );

        assertEquals(
            "MALFORMED_PACKAGE",
            result.reason
        );
    }

    private static boolean invokePolicyMatcher(
        Map<String, Object> actual,
        FinoraSignedControlPackageVerifier.Target expected,
        boolean branchScope
    )
        throws Exception {

        Method method =
            FinoraSignedControlPackageVerifier.class
                .getDeclaredMethod(
                    "matchesTarget",
                    Map.class,
                    FinoraSignedControlPackageVerifier.Target.class,
                    boolean.class
                );

        method.setAccessible(
            true
        );

        return (Boolean) method.invoke(
            null,
            actual,
            expected,
            branchScope
        );
    }
}