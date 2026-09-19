package com.finora.enterprise.control;

import java.nio.charset.StandardCharsets;
import java.util.Arrays;

import org.bouncycastle.crypto.generators.SCrypt;

/**
 * FINORA ENTERPRISE OS
 * PORTABLE BRANCH AUTH SCRYPT PRIMITIVE
 *
 * Byte-compatible SCRYPT primitive for the canonical
 * Portable Branch Auth V1 contract.
 *
 * This class intentionally does not:
 * - persist credentials;
 * - make authentication decisions;
 * - implement AES-GCM;
 * - access Branch Certification material;
 * - access Android Keystore;
 * - expose secrets to the renderer.
 */
public final class FinoraPortableBranchAuthScrypt {

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

    private FinoraPortableBranchAuthScrypt() {
    }

    public static byte[] derive(
        String secret,
        byte[] salt
    ) {
        if (secret == null) {
            throw new IllegalArgumentException(
                "Portable Branch Auth secret is required."
            );
        }

        if (
            salt == null ||
            salt.length != SCRYPT_SALT_BYTES
        ) {
            throw new IllegalArgumentException(
                "Portable Branch Auth SCRYPT salt must contain exactly 16 bytes."
            );
        }

        byte[] secretBytes =
            secret.getBytes(
                StandardCharsets.UTF_8
            );

        try {
            return SCrypt.generate(
                secretBytes,
                salt,
                SCRYPT_N,
                SCRYPT_R,
                SCRYPT_P,
                SCRYPT_DERIVED_KEY_BYTES
            );
        }
        finally {
            Arrays.fill(
                secretBytes,
                (byte) 0
            );
        }
    }
}