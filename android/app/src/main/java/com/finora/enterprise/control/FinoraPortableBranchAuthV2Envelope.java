package com.finora.enterprise.control;

import org.json.JSONObject;
import org.json.JSONException;

import java.util.HashSet;
import java.util.Iterator;
import java.util.Set;

/**
 * Strict structural validation for FINORA Portable Branch Auth V2.
 *
 * This class never accepts V1 as V2.
 * It never performs authentication or changes persistence.
 */
public final class FinoraPortableBranchAuthV2Envelope {

    public static final int SCHEMA_VERSION = 2;

    public static final String FORMAT =
        "FINORA_PORTABLE_BRANCH_AUTH";

    private FinoraPortableBranchAuthV2Envelope() {
    }

    public static JSONObject parse(String serialized) {

        if (serialized == null || serialized.isEmpty()) {
            throw new IllegalArgumentException(
                "Portable Branch Auth V2 envelope is empty."
            );
        }

        final JSONObject root;

        try {
            root = new JSONObject(serialized);
        } catch (JSONException error) {
            throw new IllegalArgumentException(
                "Portable Branch Auth V2 JSON is invalid."
            );
        }

        requireKeys(
            root,
            "format",
            "schemaVersion",
            "canonicalUsername",
            "branchScope",
            "passwordFactor",
            "securityFactor",
            "payloadEncryption",
            "passwordWrap",
            "recoveryWrap",
            "ciphertext"
        );

        if (!FORMAT.equals(root.optString("format", ""))) {
            throw new IllegalArgumentException(
                "Portable Branch Auth V2 format is invalid."
            );
        }

        if (
            !(root.opt("schemaVersion") instanceof Integer) ||
            root.optInt("schemaVersion") != SCHEMA_VERSION
        ) {
            throw new IllegalArgumentException(
                "Portable Branch Auth V2 schemaVersion is invalid."
            );
        }

        requireNonEmptyString(root, "canonicalUsername");
        requireNonEmptyString(root, "ciphertext");

        JSONObject scope = requireObject(root, "branchScope");

        requireKeys(
            scope,
            "ownerId",
            "businessId",
            "branchId"
        );

        requireNonEmptyString(scope, "ownerId");
        requireNonEmptyString(scope, "businessId");
        requireNonEmptyString(scope, "branchId");

        validateFactor(requireObject(root, "passwordFactor"));
        validateFactor(requireObject(root, "securityFactor"));

        JSONObject encryption =
            requireObject(root, "payloadEncryption");

        requireKeys(
            encryption,
            "algorithm",
            "iv",
            "authTag"
        );

        requireAlgorithm(encryption);

        validateWrap(
            requireObject(root, "passwordWrap"),
            "FINORA-PORTABLE-BRANCH-AUTH-PASSWORD-WRAP-V2"
        );

        validateWrap(
            requireObject(root, "recoveryWrap"),
            "FINORA-PORTABLE-BRANCH-AUTH-RECOVERY-WRAP-V2"
        );

        return root;
    }

    private static void validateFactor(JSONObject factor) {

        requireKeys(
            factor,
            "algorithm",
            "salt",
            "N",
            "r",
            "p",
            "derivedKeyLength",
            "verifierLength",
            "verifier"
        );

        if (!"SCRYPT".equals(
            factor.optString("algorithm", "")
        )) {
            throw new IllegalArgumentException(
                "Portable Branch Auth V2 KDF is invalid."
            );
        }

        requireNonEmptyString(factor, "salt");
        requireNonEmptyString(factor, "verifier");

        requirePositiveInteger(factor, "N");
        requirePositiveInteger(factor, "r");
        requirePositiveInteger(factor, "p");
        requirePositiveInteger(factor, "derivedKeyLength");
        requirePositiveInteger(factor, "verifierLength");
    }

    private static void validateWrap(
        JSONObject wrap,
        String expectedDerivation
    ) {

        requireKeys(
            wrap,
            "algorithm",
            "keyDerivation",
            "iv",
            "authTag",
            "wrappedKey"
        );

        requireAlgorithm(wrap);

        if (!expectedDerivation.equals(
            wrap.optString("keyDerivation", "")
        )) {
            throw new IllegalArgumentException(
                "Portable Branch Auth V2 key wrap is invalid."
            );
        }

        requireNonEmptyString(wrap, "iv");
        requireNonEmptyString(wrap, "authTag");
        requireNonEmptyString(wrap, "wrappedKey");
    }

    private static void requireAlgorithm(JSONObject value) {
        if (!"AES-256-GCM".equals(
            value.optString("algorithm", "")
        )) {
            throw new IllegalArgumentException(
                "Portable Branch Auth V2 encryption is invalid."
            );
        }
    }

    private static void requirePositiveInteger(
        JSONObject value,
        String key
    ) {
        Object raw = value.opt(key);

        if (
            !(raw instanceof Integer) ||
            ((Integer) raw) <= 0
        ) {
            throw new IllegalArgumentException(
                "Portable Branch Auth V2 integer field is invalid."
            );
        }
    }

    private static JSONObject requireObject(
        JSONObject value,
        String key
    ) {

        JSONObject object = value.optJSONObject(key);

        if (object == null) {
            throw new IllegalArgumentException(
                "Portable Branch Auth V2 object is missing."
            );
        }

        return object;
    }

    private static void requireNonEmptyString(
        JSONObject value,
        String key
    ) {

        Object raw = value.opt(key);

        if (
            !(raw instanceof String) ||
            ((String) raw).isEmpty()
        ) {
            throw new IllegalArgumentException(
                "Portable Branch Auth V2 string field is invalid."
            );
        }
    }

    private static void requireKeys(
        JSONObject value,
        String... required
    ) {

        Set<String> expected = new HashSet<>();

        for (String key : required) {
            expected.add(key);
        }

        Set<String> actual = new HashSet<>();

        Iterator<String> keys = value.keys();

        while (keys.hasNext()) {
            actual.add(keys.next());
        }

        if (!actual.equals(expected)) {
            throw new IllegalArgumentException(
                "Portable Branch Auth V2 field set is invalid."
            );
        }
    }
}
