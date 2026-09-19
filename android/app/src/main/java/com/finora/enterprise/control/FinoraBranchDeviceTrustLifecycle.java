package com.finora.enterprise.control;

/**
 * Canonical lifecycle contract for FINORA Branch Device Trust records.
 *
 * Legacy persisted Device Trust records did not contain a status field.
 * A missing status therefore migrates logically to ACTIVE. Once a status
 * field is present it must be explicit and valid.
 *
 * REVOKED is terminal. Re-authorizing a revoked native binding must never
 * silently reactivate the same trust record.
 */
public final class FinoraBranchDeviceTrustLifecycle {

    public static final String STATUS_ACTIVE =
        "ACTIVE";

    public static final String STATUS_REVOKED =
        "REVOKED";

    private FinoraBranchDeviceTrustLifecycle() {
    }

    public static String resolvePersistedStatus(
        boolean statusPresent,
        String status
    ) {
        if (!statusPresent) {
            return STATUS_ACTIVE;
        }

        return requireStatus(
            status
        );
    }

    public static String requireStatus(
        String status
    ) {
        if (
            !STATUS_ACTIVE.equals(
                status
            ) &&
            !STATUS_REVOKED.equals(
                status
            )
        ) {
            throw new IllegalArgumentException(
                "FINORA Branch Device Trust status must be ACTIVE or REVOKED."
            );
        }

        return status;
    }

    public static void validateLifecycleState(
        String status,
        String revokedAt
    ) {
        String validatedStatus =
            requireStatus(
                status
            );

        if (
            STATUS_ACTIVE.equals(
                validatedStatus
            )
        ) {
            if (revokedAt != null) {
                throw new IllegalArgumentException(
                    "FINORA ACTIVE Device Trust record must not contain revokedAt."
                );
            }

            return;
        }

        requireNonEmpty(
            revokedAt,
            "revokedAt"
        );
    }

    public static void requireTransition(
        String currentStatus,
        String nextStatus
    ) {
        String current =
            requireStatus(
                currentStatus
            );

        String next =
            requireStatus(
                nextStatus
            );

        if (
            STATUS_REVOKED.equals(
                current
            ) &&
            !STATUS_REVOKED.equals(
                next
            )
        ) {
            throw new IllegalStateException(
                "FINORA revoked Device Trust is terminal and cannot become ACTIVE again."
            );
        }
    }

    public static boolean isActive(
        String status
    ) {
        return STATUS_ACTIVE.equals(
            requireStatus(
                status
            )
        );
    }

    public static boolean isRevoked(
        String status
    ) {
        return STATUS_REVOKED.equals(
            requireStatus(
                status
            )
        );
    }

    private static void requireNonEmpty(
        String value,
        String field
    ) {
        if (
            value == null ||
            value.trim().isEmpty()
        ) {
            throw new IllegalArgumentException(
                "FINORA Branch Device Trust " +
                field +
                " is required."
            );
        }
    }
}
