package com.finora.enterprise.control;

import org.json.JSONException;
import org.json.JSONObject;

/**
 * Parses Branch Certification material carried inside the
 * Password + Security Code authenticated Portable Auth payload.
 *
 * Object-level extension fields are intentionally tolerated to
 * mirror the Windows Branch Certification validator.
 *
 * Cryptographic validity is delegated to the canonical Android
 * Branch Certification validator.
 */
public final class FinoraPortableBranchAuthCertificationMaterialParser {

    private FinoraPortableBranchAuthCertificationMaterialParser() {
    }

    public static FinoraBranchCertificationCryptoValidator.Material parse(
        JSONObject value
    ) {

        if (value == null) {
            throw invalid(
                "material is required"
            );
        }

        FinoraBranchCertificationCryptoValidator.Material material =
            new FinoraBranchCertificationCryptoValidator.Material(
                requireString(
                    value,
                    "keyId"
                ),
                requireString(
                    value,
                    "algorithm"
                ),
                requireString(
                    value,
                    "publicKeyFormat"
                ),
                requireString(
                    value,
                    "publicKey"
                ),
                requireString(
                    value,
                    "fingerprintAlgorithm"
                ),
                requireString(
                    value,
                    "publicKeyFingerprint"
                ),
                requireString(
                    value,
                    "createdAt"
                ),
                requireExactInt(
                    value,
                    "schemaVersion"
                ),
                requireString(
                    value,
                    "privateKeyFormat"
                ),
                requireString(
                    value,
                    "privateKey"
                ),
                requireExactInt(
                    value,
                    "vaultSchemaVersion"
                )
            );

        FinoraBranchCertificationCryptoValidator.assertValid(
            material
        );

        return material;
    }

    private static String requireString(
        JSONObject object,
        String key
    ) {

        Object value =
            requireValue(
                object,
                key
            );

        if (
            !(value instanceof String)
        ) {
            throw invalid(
                key +
                " must be a string"
            );
        }

        return (String) value;
    }

    private static int requireExactInt(
        JSONObject object,
        String key
    ) {

        Object value =
            requireValue(
                object,
                key
            );

        if (
            !(value instanceof Number)
        ) {
            throw invalid(
                key +
                " must be a number"
            );
        }

        Number number =
            (Number) value;

        double doubleValue =
            number.doubleValue();

        if (
            !Double.isFinite(
                doubleValue
            ) ||
            doubleValue !=
                Math.rint(
                    doubleValue
                ) ||
            doubleValue <
                Integer.MIN_VALUE ||
            doubleValue >
                Integer.MAX_VALUE
        ) {
            throw invalid(
                key +
                " must be an exact integer"
            );
        }

        return (int) doubleValue;
    }

    private static Object requireValue(
        JSONObject object,
        String key
    ) {

        if (
            !object.has(
                key
            ) ||
            object.isNull(
                key
            )
        ) {
            throw invalid(
                key +
                " is required"
            );
        }

        try {

            return object.get(
                key
            );
        }
        catch (
            JSONException error
        ) {
            throw invalid(
                key +
                " could not be read"
            );
        }
    }

    private static IllegalArgumentException invalid(
        String detail
    ) {

        return new IllegalArgumentException(
            "FINORA Portable Branch Auth Branch Certification " +
            detail +
            "."
        );
    }
}