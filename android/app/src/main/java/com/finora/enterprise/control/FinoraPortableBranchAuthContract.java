package com.finora.enterprise.control;

/**
 * FINORA ENTERPRISE OS
 * PORTABLE BRANCH AUTH V1 CONTRACT
 *
 * Canonical Android constants mirrored from the authoritative
 * Portable Branch Auth TypeScript contract.
 *
 * This class contains contract constants only.
 * It performs no persistence, encryption, authentication or IPC.
 */
public final class FinoraPortableBranchAuthContract {

    public static final String FORMAT =
        "FINORA_PORTABLE_BRANCH_AUTH";

    public static final int SCHEMA_VERSION =
        1;

    public static final String KDF_ALGORITHM =
        "SCRYPT";

    public static final int SCRYPT_N =
        32768;

    public static final int SCRYPT_R =
        8;

    public static final int SCRYPT_P =
        1;

    public static final int SCRYPT_SALT_BYTES =
        16;

    public static final int SCRYPT_DERIVED_KEY_BYTES =
        64;

    public static final int VERIFIER_BYTES =
        32;

    public static final int SECRET_FACTOR_BYTES =
        32;

    public static final String ENCRYPTION_ALGORITHM =
        "AES-256-GCM";

    public static final String KEY_DERIVATION =
        "FINORA-PORTABLE-BRANCH-AUTH-COMBINE-V1";

    public static final int IV_BYTES =
        12;

    public static final int TAG_BYTES =
        16;

    public static final int MAX_CIPHERTEXT_BYTES =
        64 * 1024;

    private FinoraPortableBranchAuthContract() {
    }
}