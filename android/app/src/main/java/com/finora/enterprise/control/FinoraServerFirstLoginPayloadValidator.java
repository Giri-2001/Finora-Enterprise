package com.finora.enterprise.control;

import org.json.JSONObject;

import java.math.BigDecimal;
import java.text.Normalizer;
import java.time.Instant;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Iterator;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * Validates the Windows-compatible server-first bootstrap payload.
 *
 * Not standalone login authorization.
 * A verified signature and separate runtime enrollment are required.
 */
public final class FinoraServerFirstLoginPayloadValidator {

    private static final String[] KEYS = {
        "kind", "authorityId", "sourceAuthorizationId",
        "credentialId", "activationId", "branchAccessGrantId",
        "storageEntitlementId", "authGeneration", "ownerId",
        "businessId", "branchId", "userId", "username",
        "canonicalUsername", "fullName", "role", "businessName",
        "branchName", "storageMode", "dataContext",
        "businessCode", "branchCode", "demoId",
        "subscriptionId", "subscriptionStatus",
        "branchAccessType", "accessMode", "accessValidFrom",
        "accessValidUntil", "activationStatus",
        "activationActivatedAt", "activationCreatedAt",
        "activationUpdatedAt", "branchAccessCreatedAt",
        "branchAccessUpdatedAt", "registrationPayment",
        "registrationCycle", "demoRemarks",
        "storageEntitlementStatus",
        "storageEntitlementActivatedAt",
        "storageEntitlementCreatedAt",
        "storageEntitlementUpdatedAt", "issuedAt",
        "mustChangePassword", "mustChangeSecurityCode",
        "branchCertificationEnrollmentPolicy", "schemaVersion"
    };

    private static final String[] REQUIRED = {
        "authorityId", "sourceAuthorizationId", "credentialId",
        "activationId", "branchAccessGrantId",
        "storageEntitlementId", "ownerId", "businessId",
        "branchId", "userId", "username",
        "canonicalUsername", "fullName", "role",
        "businessName", "branchName", "storageMode",
        "subscriptionId", "accessValidFrom", "accessValidUntil",
        "activationActivatedAt", "activationCreatedAt",
        "activationUpdatedAt", "branchAccessCreatedAt",
        "branchAccessUpdatedAt",
        "storageEntitlementActivatedAt",
        "storageEntitlementCreatedAt",
        "storageEntitlementUpdatedAt", "issuedAt"
    };

    private static final String[] DATES = {
        "accessValidFrom", "accessValidUntil",
        "activationActivatedAt", "activationCreatedAt",
        "activationUpdatedAt", "branchAccessCreatedAt",
        "branchAccessUpdatedAt",
        "storageEntitlementActivatedAt",
        "storageEntitlementCreatedAt",
        "storageEntitlementUpdatedAt", "issuedAt"
    };

    private static final Pattern DATE_PATTERN =
        Pattern.compile(
            "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{3}Z$"
        );

    private FinoraServerFirstLoginPayloadValidator() {}

    public static boolean validate(
        JSONObject payload,
        String expectedCanonicalUsername
    ) {
        if (payload == null || expectedCanonicalUsername == null) {
            return false;
        }

        try {
            Set<String> expected = new HashSet<>(
                Arrays.asList(KEYS)
            );

            Set<String> actual = new HashSet<>();
            Iterator<String> keys = payload.keys();

            while (keys.hasNext()) {
                actual.add(keys.next());
            }

            if (!actual.equals(expected)) {
                return false;
            }

            for (String key : REQUIRED) {
                Object value = payload.opt(key);

                if (
                    !(value instanceof String) ||
                    ((String) value).trim().isEmpty()
                ) {
                    return false;
                }
            }

            for (String key : DATES) {
                String value = payload.getString(key);

                if (!DATE_PATTERN.matcher(value).matches()) {
                    return false;
                }

                Instant.parse(value);
            }

            if (
                !equalsValue(payload, "kind",
                    "FINORA_SERVER_FIRST_LOGIN_BOOTSTRAP") ||
                !equalsValue(payload, "dataContext", "REAL") ||
                !equalsValue(payload, "subscriptionStatus", "ACTIVE") ||
                !equalsValue(payload, "branchAccessType", "REGISTERED") ||
                !equalsValue(payload, "accessMode", "ACTIVE") ||
                !equalsValue(payload, "activationStatus", "ACTIVE") ||
                !equalsValue(payload, "storageEntitlementStatus", "ACTIVE") ||
                !equalsValue(
                    payload,
                    "branchCertificationEnrollmentPolicy",
                    "CREATE_ON_FIRST_VERIFIED_LOGIN"
                )
            ) {
                return false;
            }

            // Server-first enrollment is PORTABLE_USB only.
            // LOCAL must never receive server-first USB authority.
            if (
                !equalsValue(payload, "storageMode", "USB")
            ) {
                return false;
            }

            for (String key : new String[] {
                "businessCode", "branchCode", "demoId",
                "registrationPayment", "registrationCycle",
                "demoRemarks"
            }) {
                if (payload.opt(key) != JSONObject.NULL) {
                    return false;
                }
            }

            Object version = payload.opt("schemaVersion");

            if (
                !(version instanceof Number) ||
                new BigDecimal(version.toString())
                    .compareTo(BigDecimal.ONE) != 0
            ) {
                return false;
            }

            Object generation = payload.opt("authGeneration");

            if (!(generation instanceof Number)) {
                return false;
            }

            BigDecimal value =
                new BigDecimal(generation.toString());

            if (
                value.compareTo(BigDecimal.ONE) != 0
            ) {
                return false;
            }

            if (
                !(payload.opt("mustChangePassword") instanceof Boolean) ||
                !(payload.opt("mustChangeSecurityCode") instanceof Boolean)
            ) {
                return false;
            }

            String username =
                Normalizer.normalize(
                    payload.getString("username").trim(),
                    Normalizer.Form.NFKC
                ).toLowerCase(Locale.ROOT);

            if (
                !username.equals(
                    payload.getString("canonicalUsername")
                ) ||
                !username.equals(expectedCanonicalUsername)
            ) {
                return false;
            }

            Instant from =
                Instant.parse(payload.getString("accessValidFrom"));

            Instant until =
                Instant.parse(payload.getString("accessValidUntil"));

            return !until.isBefore(from);

        } catch (Exception error) {
            return false;
        }
    }

    private static boolean equalsValue(
        JSONObject object,
        String key,
        String expected
    ) {
        Object value = object.opt(key);

        return value instanceof String && expected.equals(value);
    }
}