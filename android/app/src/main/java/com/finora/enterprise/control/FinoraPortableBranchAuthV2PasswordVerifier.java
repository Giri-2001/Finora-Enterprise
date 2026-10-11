package com.finora.enterprise.control;

import java.security.MessageDigest;
import java.util.Arrays;
import java.util.Base64;

import org.json.JSONObject;

/**
 * V2 Password factor verification only.
 *
 * Does not decrypt branch payloads, authorize devices,
 * create sessions, or write to stores.
 */
public final class FinoraPortableBranchAuthV2PasswordVerifier {

    private FinoraPortableBranchAuthV2PasswordVerifier() {
    }

    public static boolean verify(
        String serialized,
        String username,
        String password
    ) {

        byte[] derived = null;
        byte[] expected = null;
        byte[] actual = null;
        byte[] salt = null;

        try {
            JSONObject envelope =
                FinoraPortableBranchAuthV2Envelope.parse(
                    serialized
                );

            JSONObject factor =
                envelope.getJSONObject(
                    "passwordFactor"
                );

            salt =
                Base64.getDecoder().decode(
                    factor.getString("salt")
                );

            if (
                salt.length != 16 ||
                factor.getInt("N") != 32768 ||
                factor.getInt("r") != 8 ||
                factor.getInt("p") != 1 ||
                factor.getInt("derivedKeyLength") != 64 ||
                factor.getInt("verifierLength") != 32
            ) {
                return false;
            }

            expected =
                Base64.getDecoder().decode(
                    factor.getString("verifier")
                );

            if (
                expected.length != 32 ||
                password == null
            ) {
                return false;
            }

            derived =
                FinoraPortableBranchAuthScrypt.derive(
                    password,
                    salt
                );

            if (derived.length != 64) {
                return false;
            }

            actual =
                Arrays.copyOfRange(
                    derived,
                    0,
                    32
                );

            boolean passwordMatches =
                MessageDigest.isEqual(
                    actual,
                    expected
                );

            String canonicalUsername =
                FinoraBranchCredentialContract
                    .canonicalizeUsername(
                        username
                    );

            return (
                passwordMatches &&
                canonicalUsername.equals(
                    envelope.getString(
                        "canonicalUsername"
                    )
                )
            );

        } catch (Exception error) {
            return false;
        } finally {

            if (derived != null) {
                Arrays.fill(derived, (byte) 0);
            }

            if (expected != null) {
                Arrays.fill(expected, (byte) 0);
            }

            if (actual != null) {
                Arrays.fill(actual, (byte) 0);
            }

            if (salt != null) {
                Arrays.fill(salt, (byte) 0);
            }
        }
    }
}
