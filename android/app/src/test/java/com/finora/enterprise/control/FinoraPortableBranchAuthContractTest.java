package com.finora.enterprise.control;

import static org.junit.Assert.assertEquals;

import org.junit.Test;

public final class FinoraPortableBranchAuthContractTest {

    @Test
    public void freezesCanonicalPortableAuthV1Contract() {

        assertEquals(
            "FINORA_PORTABLE_BRANCH_AUTH",
            FinoraPortableBranchAuthContract.FORMAT
        );

        assertEquals(
            1,
            FinoraPortableBranchAuthContract.SCHEMA_VERSION
        );

        assertEquals(
            "SCRYPT",
            FinoraPortableBranchAuthContract.KDF_ALGORITHM
        );

        assertEquals(
            32768,
            FinoraPortableBranchAuthContract.SCRYPT_N
        );

        assertEquals(
            8,
            FinoraPortableBranchAuthContract.SCRYPT_R
        );

        assertEquals(
            1,
            FinoraPortableBranchAuthContract.SCRYPT_P
        );

        assertEquals(
            16,
            FinoraPortableBranchAuthContract.SCRYPT_SALT_BYTES
        );

        assertEquals(
            64,
            FinoraPortableBranchAuthContract.SCRYPT_DERIVED_KEY_BYTES
        );

        assertEquals(
            32,
            FinoraPortableBranchAuthContract.VERIFIER_BYTES
        );

        assertEquals(
            32,
            FinoraPortableBranchAuthContract.SECRET_FACTOR_BYTES
        );

        assertEquals(
            "AES-256-GCM",
            FinoraPortableBranchAuthContract.ENCRYPTION_ALGORITHM
        );

        assertEquals(
            "FINORA-PORTABLE-BRANCH-AUTH-COMBINE-V1",
            FinoraPortableBranchAuthContract.KEY_DERIVATION
        );

        assertEquals(
            12,
            FinoraPortableBranchAuthContract.IV_BYTES
        );

        assertEquals(
            16,
            FinoraPortableBranchAuthContract.TAG_BYTES
        );

        assertEquals(
            64 * 1024,
            FinoraPortableBranchAuthContract.MAX_CIPHERTEXT_BYTES
        );
    }

    @Test
    public void scryptPrimitiveMatchesCanonicalContract() {

        assertEquals(
            FinoraPortableBranchAuthContract.SCRYPT_N,
            FinoraPortableBranchAuthScrypt.SCRYPT_N
        );

        assertEquals(
            FinoraPortableBranchAuthContract.SCRYPT_R,
            FinoraPortableBranchAuthScrypt.SCRYPT_R
        );

        assertEquals(
            FinoraPortableBranchAuthContract.SCRYPT_P,
            FinoraPortableBranchAuthScrypt.SCRYPT_P
        );

        assertEquals(
            FinoraPortableBranchAuthContract.SCRYPT_SALT_BYTES,
            FinoraPortableBranchAuthScrypt.SCRYPT_SALT_BYTES
        );

        assertEquals(
            FinoraPortableBranchAuthContract.SCRYPT_DERIVED_KEY_BYTES,
            FinoraPortableBranchAuthScrypt.SCRYPT_DERIVED_KEY_BYTES
        );

        assertEquals(
            FinoraPortableBranchAuthContract.VERIFIER_BYTES,
            FinoraPortableBranchAuthScrypt.VERIFIER_BYTES
        );
    }
}