package com.finora.enterprise.control;

// ============================================================
// FINORA ENTERPRISE OS™
//
// ANDROID CONTROL
// CANONICAL JSON V1
//
// RESPONSIBILITY:
//
// - Reproduce FINORA_CANONICAL_JSON_V1 on Android
// - Sort object keys lexicographically
// - Preserve array order
// - Produce deterministic UTF-8 signing input
// - Reject unsupported/non-deterministic values
//
// CURRENT BRANCH_ACTIVATION NUMERIC CONTRACT:
//
// Signed Branch Activation packages contain safe integers only.
//
// This implementation deliberately rejects fractional numbers.
// Pricing/package domains that later require decimals must add
// an explicitly cross-runtime-tested numeric canonicalization
// extension rather than silently changing this contract.
//
// SECURITY:
//
// - Pure Java.
// - No Android Context.
// - No private key.
// - No signing.
// - No persistence.
// - No Business Date.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

public final class FinoraCanonicalJson {

    private static final double MAX_SAFE_INTEGER =
        9007199254740991.0d;

    private FinoraCanonicalJson() {
    }

    // ========================================================
    // PUBLIC API
    // ========================================================

    public static String canonicalize(
        Object value
    ) {
        StringBuilder output =
            new StringBuilder();

        appendCanonicalValue(
            value,
            output
        );

        return output.toString();
    }

    // ========================================================
    // VALUES
    // ========================================================

    private static void appendCanonicalValue(
        Object value,
        StringBuilder output
    ) {

        if (value == null) {
            output.append(
                "null"
            );

            return;
        }

        if (value instanceof String) {
            appendQuotedString(
                (String) value,
                output
            );

            return;
        }

        if (value instanceof Boolean) {
            output.append(
                ((Boolean) value)
                    .booleanValue()
                    ? "true"
                    : "false"
            );

            return;
        }

        if (value instanceof Number) {
            appendCanonicalNumber(
                (Number) value,
                output
            );

            return;
        }

        if (value instanceof Map) {
            appendCanonicalObject(
                (Map<?, ?>) value,
                output
            );

            return;
        }

        if (value instanceof List) {
            appendCanonicalArray(
                (List<?>) value,
                output
            );

            return;
        }

        throw new IllegalArgumentException(
            "Unsupported FINORA canonical JSON value: " +
            value.getClass().getName()
        );
    }

    // ========================================================
    // OBJECT
    // ========================================================

    private static void appendCanonicalObject(
        Map<?, ?> value,
        StringBuilder output
    ) {

        List<String> keys =
            new ArrayList<>();

        for (Object rawKey : value.keySet()) {

            if (!(rawKey instanceof String)) {
                throw new IllegalArgumentException(
                    "FINORA canonical object keys must be strings."
                );
            }

            keys.add(
                (String) rawKey
            );
        }

        Collections.sort(
            keys
        );

        output.append(
            '{'
        );

        boolean first =
            true;

        for (String key : keys) {

            if (!first) {
                output.append(
                    ','
                );
            }

            first =
                false;

            appendQuotedString(
                key,
                output
            );

            output.append(
                ':'
            );

            appendCanonicalValue(
                value.get(key),
                output
            );
        }

        output.append(
            '}'
        );
    }

    // ========================================================
    // ARRAY
    // ========================================================

    private static void appendCanonicalArray(
        List<?> value,
        StringBuilder output
    ) {

        output.append(
            '['
        );

        for (
            int index = 0;
            index < value.size();
            index++
        ) {

            if (index > 0) {
                output.append(
                    ','
                );
            }

            appendCanonicalValue(
                value.get(index),
                output
            );
        }

        output.append(
            ']'
        );
    }

    // ========================================================
    // NUMBER
    // ========================================================

    private static void appendCanonicalNumber(
        Number value,
        StringBuilder output
    ) {

        double number =
            value.doubleValue();

        if (
            Double.isNaN(number) ||
            Double.isInfinite(number)
        ) {
            throw new IllegalArgumentException(
                "FINORA canonical JSON rejects non-finite numbers."
            );
        }

        /*
         * Match FINORA canonical -0 normalization.
         */
        if (number == 0.0d) {
            output.append(
                '0'
            );

            return;
        }

        /*
         * Branch Activation V1 uses only integers:
         *
         * - schemaVersion
         * - payloadVersion
         * - sequence
         * - registrationCycle
         * - registration amount
         *
         * Reject fractional values instead of introducing a
         * Java/ECMAScript floating-point formatting mismatch.
         */
        if (
            Math.rint(number) !=
                number
        ) {
            throw new IllegalArgumentException(
                "FINORA Branch Activation canonical JSON accepts safe integers only."
            );
        }

        if (
            Math.abs(number) >
                MAX_SAFE_INTEGER
        ) {
            throw new IllegalArgumentException(
                "FINORA canonical integer exceeds JavaScript safe-integer range."
            );
        }

        long integer =
            value.longValue();

        if (
            ((double) integer) !=
                number
        ) {
            throw new IllegalArgumentException(
                "FINORA canonical integer cannot be represented exactly."
            );
        }

        output.append(
            Long.toString(
                integer
            )
        );
    }

    // ========================================================
    // STRING
    // ========================================================

    private static void appendQuotedString(
        String value,
        StringBuilder output
    ) {

        output.append(
            '"'
        );

        for (
            int index = 0;
            index < value.length();
            index++
        ) {

            char character =
                value.charAt(
                    index
                );

            switch (character) {

                case '"':
                    output.append(
                        "\\\""
                    );
                    break;

                case '\\':
                    output.append(
                        "\\\\"
                    );
                    break;

                case '\b':
                    output.append(
                        "\\b"
                    );
                    break;

                case '\f':
                    output.append(
                        "\\f"
                    );
                    break;

                case '\n':
                    output.append(
                        "\\n"
                    );
                    break;

                case '\r':
                    output.append(
                        "\\r"
                    );
                    break;

                case '\t':
                    output.append(
                        "\\t"
                    );
                    break;

                default:

                    if (
                        character <
                            0x20
                    ) {

                        appendUnicodeEscape(
                            character,
                            output
                        );

                        break;
                    }

                    if (
                        Character.isHighSurrogate(
                            character
                        )
                    ) {

                        if (
                            index + 1 <
                                value.length() &&
                            Character.isLowSurrogate(
                                value.charAt(
                                    index + 1
                                )
                            )
                        ) {

                            output.append(
                                character
                            );

                            output.append(
                                value.charAt(
                                    index + 1
                                )
                            );

                            index++;

                        } else {

                            /*
                             * Well-formed JSON.stringify semantics:
                             * unpaired surrogate is escaped.
                             */
                            appendUnicodeEscape(
                                character,
                                output
                            );
                        }

                        break;
                    }

                    if (
                        Character.isLowSurrogate(
                            character
                        )
                    ) {

                        appendUnicodeEscape(
                            character,
                            output
                        );

                        break;
                    }

                    output.append(
                        character
                    );
                    break;
            }
        }

        output.append(
            '"'
        );
    }

    private static void appendUnicodeEscape(
        char value,
        StringBuilder output
    ) {

        final char[] hex =
            "0123456789abcdef"
                .toCharArray();

        output.append(
            "\\u"
        );

        output.append(
            hex[
                (value >>> 12) &
                0x0f
            ]
        );

        output.append(
            hex[
                (value >>> 8) &
                0x0f
            ]
        );

        output.append(
            hex[
                (value >>> 4) &
                0x0f
            ]
        );

        output.append(
            hex[
                value &
                0x0f
            ]
        );
    }

    // ========================================================
    // END
    // ========================================================
}