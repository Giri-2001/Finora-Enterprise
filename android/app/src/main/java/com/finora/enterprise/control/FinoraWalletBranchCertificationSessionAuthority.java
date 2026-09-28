package com.finora.enterprise.control;

/**
 * Process-memory Branch Certification authority for Wallet request creation.
 *
 * SECURITY:
 * - accepts only already-validated FINORA Branch Certification key material;
 * - binds the material to one exact Owner / Business / Branch scope;
 * - never writes private material to disk;
 * - never exposes material across a different branch scope;
 * - process death clears the authority automatically.
 *
 * This is intentionally a runtime authority, not a durable credential store.
 */
final class FinoraWalletBranchCertificationSessionAuthority {

    private static Entry current;

    private FinoraWalletBranchCertificationSessionAuthority() {
    }

    static synchronized void install(
        String ownerId,
        String businessId,
        String branchId,
        FinoraBranchCertificationCryptoValidator.Material material
    ) {

        String canonicalOwnerId =
            requireText(
                ownerId,
                "ownerId"
            );

        String canonicalBusinessId =
            requireText(
                businessId,
                "businessId"
            );

        String canonicalBranchId =
            requireText(
                branchId,
                "branchId"
            );

        if (material == null) {
            throw new IllegalArgumentException(
                "FINORA Wallet Branch Certification material is required."
            );
        }

        FinoraBranchCertificationCryptoValidator.assertValid(
            material
        );

        current =
            new Entry(
                canonicalOwnerId,
                canonicalBusinessId,
                canonicalBranchId,
                material
            );
    }

    static synchronized FinoraBranchCertificationCryptoValidator.Material require(
        String ownerId,
        String businessId,
        String branchId
    ) {

        String canonicalOwnerId =
            requireText(
                ownerId,
                "ownerId"
            );

        String canonicalBusinessId =
            requireText(
                businessId,
                "businessId"
            );

        String canonicalBranchId =
            requireText(
                branchId,
                "branchId"
            );

        Entry value =
            current;

        if (
            value == null ||
            !value.ownerId.equals(
                canonicalOwnerId
            ) ||
            !value.businessId.equals(
                canonicalBusinessId
            ) ||
            !value.branchId.equals(
                canonicalBranchId
            )
        ) {
            throw new IllegalStateException(
                "FINORA Wallet Branch Certification runtime authority is unavailable for the authenticated branch."
            );
        }

        FinoraBranchCertificationCryptoValidator.assertValid(
            value.material
        );

        return value.material;
    }

    static synchronized boolean isAvailableFor(
        String ownerId,
        String businessId,
        String branchId
    ) {

        if (
            ownerId == null ||
            businessId == null ||
            branchId == null
        ) {
            return false;
        }

        Entry value =
            current;

        return (
            value != null &&
            value.ownerId.equals(
                ownerId
            ) &&
            value.businessId.equals(
                businessId
            ) &&
            value.branchId.equals(
                branchId
            )
        );
    }

    static synchronized void clear() {
        current =
            null;
    }

    private static String requireText(
        String value,
        String label
    ) {

        if (
            value == null ||
            value.isEmpty() ||
            !value.equals(
                value.trim()
            )
        ) {
            throw new IllegalArgumentException(
                "FINORA Wallet Branch Certification " +
                label +
                " is invalid."
            );
        }

        return value;
    }

    private static final class Entry {

        final String ownerId;
        final String businessId;
        final String branchId;

        final FinoraBranchCertificationCryptoValidator.Material
            material;

        Entry(
            String ownerId,
            String businessId,
            String branchId,
            FinoraBranchCertificationCryptoValidator.Material material
        ) {

            this.ownerId =
                ownerId;

            this.businessId =
                businessId;

            this.branchId =
                branchId;

            this.material =
                material;
        }
    }
}
