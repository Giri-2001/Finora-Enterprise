package com.finora.enterprise.control;

import org.junit.Test;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.fail;

public final class FinoraBranchDeviceTrustLifecycleTest {

    @Test
    public void legacyMissingStatusDefaultsToActive() {
        assertEquals(
            FinoraBranchDeviceTrustLifecycle.STATUS_ACTIVE,
            FinoraBranchDeviceTrustLifecycle.resolvePersistedStatus(
                false,
                null
            )
        );
    }

    @Test
    public void explicitStatusMustBeCanonical() {
        assertEquals(
            FinoraBranchDeviceTrustLifecycle.STATUS_ACTIVE,
            FinoraBranchDeviceTrustLifecycle.resolvePersistedStatus(
                true,
                "ACTIVE"
            )
        );

        assertThrowsIllegalArgument(
            new ThrowingRunnable() {
                @Override
                public void run() {
                    FinoraBranchDeviceTrustLifecycle.resolvePersistedStatus(
                        true,
                        ""
                    );
                }
            }
        );

        assertThrowsIllegalArgument(
            new ThrowingRunnable() {
                @Override
                public void run() {
                    FinoraBranchDeviceTrustLifecycle.requireStatus(
                        "SUSPENDED"
                    );
                }
            }
        );
    }

    @Test
    public void activeStateCannotCarryRevocationEvidence() {
        FinoraBranchDeviceTrustLifecycle.validateLifecycleState(
            "ACTIVE",
            null
        );

        assertThrowsIllegalArgument(
            new ThrowingRunnable() {
                @Override
                public void run() {
                    FinoraBranchDeviceTrustLifecycle.validateLifecycleState(
                        "ACTIVE",
                        "2026-09-19T00:00:00.000Z"
                    );
                }
            }
        );
    }

    @Test
    public void revokedStateRequiresRevocationEvidence() {
        FinoraBranchDeviceTrustLifecycle.validateLifecycleState(
            "REVOKED",
            "2026-09-19T00:00:00.000Z"
        );

        assertThrowsIllegalArgument(
            new ThrowingRunnable() {
                @Override
                public void run() {
                    FinoraBranchDeviceTrustLifecycle.validateLifecycleState(
                        "REVOKED",
                        null
                    );
                }
            }
        );

        assertThrowsIllegalArgument(
            new ThrowingRunnable() {
                @Override
                public void run() {
                    FinoraBranchDeviceTrustLifecycle.validateLifecycleState(
                        "REVOKED",
                        "   "
                    );
                }
            }
        );
    }

    @Test
    public void revokedLifecycleIsTerminal() {
        FinoraBranchDeviceTrustLifecycle.requireTransition(
            "ACTIVE",
            "ACTIVE"
        );

        FinoraBranchDeviceTrustLifecycle.requireTransition(
            "ACTIVE",
            "REVOKED"
        );

        FinoraBranchDeviceTrustLifecycle.requireTransition(
            "REVOKED",
            "REVOKED"
        );

        try {
            FinoraBranchDeviceTrustLifecycle.requireTransition(
                "REVOKED",
                "ACTIVE"
            );

            fail(
                "REVOKED -> ACTIVE must fail closed."
            );
        }
        catch (
            IllegalStateException expected
        ) {
            assertEquals(
                "FINORA revoked Device Trust is terminal and cannot become ACTIVE again.",
                expected.getMessage()
            );
        }
    }

    @Test
    public void statusHelpersAreExact() {
        assertTrue(
            FinoraBranchDeviceTrustLifecycle.isActive(
                "ACTIVE"
            )
        );

        assertFalse(
            FinoraBranchDeviceTrustLifecycle.isActive(
                "REVOKED"
            )
        );

        assertTrue(
            FinoraBranchDeviceTrustLifecycle.isRevoked(
                "REVOKED"
            )
        );

        assertFalse(
            FinoraBranchDeviceTrustLifecycle.isRevoked(
                "ACTIVE"
            )
        );
    }

    private static void assertThrowsIllegalArgument(
        ThrowingRunnable runnable
    ) {
        try {
            runnable.run();

            fail(
                "Expected IllegalArgumentException."
            );
        }
        catch (
            IllegalArgumentException expected
        ) {
            // Expected.
        }
    }

    private interface ThrowingRunnable {
        void run();
    }
}
