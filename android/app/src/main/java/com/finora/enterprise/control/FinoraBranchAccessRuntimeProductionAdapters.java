package com.finora.enterprise.control;

import org.json.JSONArray;
import org.json.JSONObject;

public final class FinoraBranchAccessRuntimeProductionAdapters {
    private FinoraBranchAccessRuntimeProductionAdapters() {}

    public interface ValidatedControlStatePort {
        String readValidated() throws Exception;
    }

    interface ClockObservationPort {
        FinoraBranchAccessRuntimeAuthority.ClockResult observe();
    }

    public static FinoraBranchAccessRuntimeAuthority create(
        ValidatedControlStatePort controlState,
        FinoraClockHighWaterAuthorityService clockAuthority
    ) {
        if (controlState == null || clockAuthority == null) {
            throw new IllegalArgumentException(
                "FINORA Branch Access production dependencies are required."
            );
        }

        return create(
            controlState,
            new ClockObservationPort() {
                @Override
                public FinoraBranchAccessRuntimeAuthority.ClockResult observe() {
                    FinoraClockHighWaterAuthorityService.Result result =
                        clockAuthority.observe();

                    if (result == null) {
                        return FinoraBranchAccessRuntimeAuthority.ClockResult.failure(
                            null,
                            "FINORA clock high-water authority returned no result."
                        );
                    }

                    if (!result.success) {
                        return FinoraBranchAccessRuntimeAuthority.ClockResult.failure(
                            result.errorCode,
                            result.error
                        );
                    }

                    if (result.data == null) {
                        return FinoraBranchAccessRuntimeAuthority.ClockResult.failure(
                            null,
                            "FINORA clock high-water authority returned no accepted observation."
                        );
                    }

                    return FinoraBranchAccessRuntimeAuthority.ClockResult.success(
                        result.data.observedAt
                    );
                }
            }
        );
    }

    static FinoraBranchAccessRuntimeAuthority create(
        ValidatedControlStatePort controlState,
        ClockObservationPort clock
    ) {
        if (controlState == null || clock == null) {
            throw new IllegalArgumentException(
                "FINORA Branch Access adapter ports are required."
            );
        }

        return new FinoraBranchAccessRuntimeAuthority(
            new ControlStoreGrantPort(controlState),
            new FinoraBranchAccessRuntimeAuthority.ClockPort() {
                @Override
                public FinoraBranchAccessRuntimeAuthority.ClockResult observe() {
                    return clock.observe();
                }
            }
        );
    }

    private static final class ControlStoreGrantPort
        implements FinoraBranchAccessRuntimeAuthority.GrantPort {

        private final ValidatedControlStatePort controlState;

        ControlStoreGrantPort(ValidatedControlStatePort controlState) {
            this.controlState = controlState;
        }

        @Override
        public FinoraBranchAccessRuntimeEvaluator.Grant find(
            String userId,
            String ownerId,
            String businessId,
            String branchId
        ) throws Exception {
            String raw = controlState.readValidated();

            if (raw == null) {
                return null;
            }

            JSONObject root = new JSONObject(raw);
            JSONArray grants = root.optJSONArray("branchAccessGrants");

            if (grants == null) {
                return null;
            }

            JSONObject selected = null;

            for (int index = 0; index < grants.length(); index++) {
                JSONObject candidate = grants.optJSONObject(index);

                if (candidate == null) {
                    throw new IllegalStateException(
                        "FINORA Branch Access collection contains a non-object entry."
                    );
                }

                boolean matches =
                    userId.equals(candidate.getString("userId")) &&
                    ownerId.equals(candidate.getString("ownerId")) &&
                    businessId.equals(candidate.getString("businessId")) &&
                    branchId.equals(candidate.getString("branchId"));

                if (!matches) {
                    continue;
                }

                if (selected != null) {
                    throw new IllegalStateException(
                        "FINORA Branch Access collection contains multiple matching grants."
                    );
                }

                selected = candidate;
            }

            return selected == null ? null : parseGrant(selected);
        }
    }

    private static FinoraBranchAccessRuntimeEvaluator.Grant parseGrant(
        JSONObject value
    ) {
        JSONObject validity = value.optJSONObject("validity");
        String validFrom = validity == null ? null : string(validity, "validFrom");
        String validUntil = validity == null ? null : string(validity, "validUntil");
        String accessType = string(value, "accessType");

        Long registrationCycle = null;
        FinoraBranchAccessRuntimeEvaluator.RegistrationPayment payment = null;
        String demoId = null;

        if ("REGISTERED".equals(accessType)) {
            registrationCycle = longValue(value, "registrationCycle");
            JSONObject paymentValue = value.optJSONObject("registrationPayment");

            if (paymentValue != null) {
                payment = new FinoraBranchAccessRuntimeEvaluator.RegistrationPayment(
                    doubleValue(paymentValue, "amount"),
                    string(paymentValue, "currency"),
                    string(paymentValue, "paidAt"),
                    booleanValue(paymentValue, "refundable")
                );
            }
        } else if ("DEMO".equals(accessType)) {
            demoId = string(value, "demoId");
        }

        return new FinoraBranchAccessRuntimeEvaluator.Grant(
            string(value, "grantId"),
            string(value, "userId"),
            string(value, "ownerId"),
            string(value, "businessId"),
            string(value, "branchId"),
            string(value, "storageMode"),
            string(value, "administrativeStatus"),
            validFrom,
            validUntil,
            string(value, "createdAt"),
            string(value, "updatedAt"),
            integer(value, "schemaVersion"),
            accessType,
            registrationCycle,
            payment,
            demoId
        );
    }

    private static String string(JSONObject value, String key) {
        Object raw = value.opt(key);
        return raw instanceof String ? (String) raw : null;
    }

    private static Integer integer(JSONObject value, String key) {
        Object raw = value.opt(key);
        return raw instanceof Number ? ((Number) raw).intValue() : null;
    }

    private static Long longValue(JSONObject value, String key) {
        Object raw = value.opt(key);
        return raw instanceof Number ? ((Number) raw).longValue() : null;
    }

    private static double doubleValue(JSONObject value, String key) {
        Object raw = value.opt(key);
        return raw instanceof Number ? ((Number) raw).doubleValue() : Double.NaN;
    }

    private static Boolean booleanValue(JSONObject value, String key) {
        Object raw = value.opt(key);
        return raw instanceof Boolean ? (Boolean) raw : null;
    }
}
