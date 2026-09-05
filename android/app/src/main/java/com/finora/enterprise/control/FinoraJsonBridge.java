package com.finora.enterprise.control;

// ============================================================
// FINORA ENTERPRISE OS™
//
// ANDROID CONTROL
// org.json -> CANONICAL JAVA VALUE BRIDGE
//
// RESPONSIBILITY:
//
// - Convert JSONObject / JSONArray into Map / List values
// - Preserve values for native canonicalization/verification
// - Keep org.json outside the pure cryptographic engine
//
// SECURITY:
//
// - No persistence.
// - No signing.
// - No private key.
// - No WebView.
// - No Business Date.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public final class FinoraJsonBridge {

    private FinoraJsonBridge() {
    }

    public static Map<String, Object> toMap(
        JSONObject value
    ) {

        if (value == null) {
            throw new IllegalArgumentException(
                "FINORA JSON object is required."
            );
        }

        Map<String, Object> output =
            new LinkedHashMap<>();

        Iterator<String> keys =
            value.keys();

        while (keys.hasNext()) {

            String key =
                keys.next();

            output.put(
                key,
                toJavaValue(
                    value.opt(
                        key
                    )
                )
            );
        }

        return output;
    }

    private static Object toJavaValue(
        Object value
    ) {

        if (
            value == null ||
            value ==
                JSONObject.NULL
        ) {
            return null;
        }

        if (value instanceof JSONObject) {
            return toMap(
                (JSONObject) value
            );
        }

        if (value instanceof JSONArray) {

            JSONArray array =
                (JSONArray) value;

            List<Object> output =
                new ArrayList<>(
                    array.length()
                );

            for (
                int index = 0;
                index < array.length();
                index++
            ) {

                output.add(
                    toJavaValue(
                        array.opt(
                            index
                        )
                    )
                );
            }

            return output;
        }

        if (
            value instanceof String ||
            value instanceof Boolean ||
            value instanceof Number
        ) {
            return value;
        }

        throw new IllegalArgumentException(
            "Unsupported FINORA JSON value: " +
            value.getClass().getName()
        );
    }

    // ========================================================
    // END
    // ========================================================
}