package com.finora.enterprise.usb;

// ============================================================
// FINORA ENTERPRISE OS
//
// USB STORAGE
// REAL / DEMO RESET SCOPE POLICY
//
// RESPONSIBILITY:
//
// - Validate the logical FINORA USB reset scope.
// - Match persisted record identity against a validated scope.
// - Keep REAL and DEMO reset boundaries deterministic.
//
// IMPORTANT:
//
// - Pure Java policy only.
// - No Android Context dependency.
// - No SAF dependency.
// - No JSONObject dependency.
// - No Capacitor dependency.
// - No filesystem access.
// - No mutation.
// - No filesystem path / drive authority.
//
// RESET RULES:
//
// REAL:
// - ownerId is mandatory.
// - demoId must be absent.
// - Only records for that owner with no demoId match.
//
// DEMO:
// - demoId is mandatory.
// - ownerId is optional.
// - When ownerId is supplied it further narrows the match.
//
// ============================================================

public final class FinoraUsbResetScopePolicy {

    private FinoraUsbResetScopePolicy() {
        // Pure static policy.
    }

    // ========================================================
    // RESET SCOPE VALIDATION
    // ========================================================

    public static String validate(
        String dataContext,
        String ownerId,
        String demoId
    ) {
        if (
            "REAL".equals(
                dataContext
            )
        ) {
            if (
                ownerId == null ||
                ownerId.trim().isEmpty()
            ) {
                return "A valid owner ID is required to reset REAL FINORA USB data.";
            }

            if (demoId != null) {
                return "REAL FINORA USB reset scope must not include a Demo ID.";
            }

            return null;
        }

        if (
            "DEMO".equals(
                dataContext
            )
        ) {
            if (
                demoId == null ||
                demoId.trim().isEmpty()
            ) {
                return "A valid Demo ID is required to reset DEMO FINORA USB data.";
            }

            if (
                ownerId != null &&
                ownerId.trim().isEmpty()
            ) {
                return "FINORA DEMO USB reset owner ID must be a non-empty string when supplied.";
            }

            return null;
        }

        if (dataContext == null) {
            return "FINORA reset scope is required.";
        }

        return "Unsupported FINORA data context for USB reset.";
    }

    // ========================================================
    // RESET SCOPE RECORD MATCHING
    // ========================================================

    public static boolean recordMatches(
        String recordOwnerId,
        String recordDemoId,
        String dataContext,
        String scopeOwnerId,
        String scopeDemoId
    ) {
        if (
            "REAL".equals(
                dataContext
            )
        ) {
            return (
                nullableEquals(
                    recordOwnerId,
                    scopeOwnerId
                ) &&
                recordDemoId == null
            );
        }

        if (
            "DEMO".equals(
                dataContext
            )
        ) {
            if (
                !nullableEquals(
                    recordDemoId,
                    scopeDemoId
                )
            ) {
                return false;
            }

            if (
                scopeOwnerId != null &&
                !nullableEquals(
                    recordOwnerId,
                    scopeOwnerId
                )
            ) {
                return false;
            }

            return true;
        }

        return false;
    }

    // ========================================================
    // NULLABLE EQUALITY
    // ========================================================

    private static boolean nullableEquals(
        String first,
        String second
    ) {
        if (first == null) {
            return second == null;
        }

        return first.equals(
            second
        );
    }
}

// ============================================================
// END
// ============================================================