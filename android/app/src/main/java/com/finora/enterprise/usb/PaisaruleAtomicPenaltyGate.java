package com.finora.enterprise.usb;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeSet;

/**
 * PAISARULE C126-R130-R28.
 *
 * Isolated penalty-first EMI reconciliation.
 *
 * STRICT SCOPE:
 * - Manual Collection only
 * - No principal adjustment
 * - No discount
 * - No financial persistence
 *
 * A separate native authority must verify future-interest
 * curtailment and receipt evidence before any USB commit.
 */
public final class PaisaruleAtomicPenaltyGate {

    private PaisaruleAtomicPenaltyGate() {
    }

    private static Long cents(Object input) {
        if (!(input instanceof Number)) {
            return null;
        }

        try {
            double value = ((Number) input).doubleValue();

            if (!Double.isFinite(value) || value < 0) {
                return null;
            }

            return new BigDecimal(input.toString())
                .movePointRight(2)
                .longValueExact();
        } catch (Exception error) {
            return null;
        }
    }

    private static Long amount(
        Map<String, Object> row,
        String name,
        boolean zeroDefault
    ) {
        if (row == null) {
            return null;
        }

        Object value = row.get(name);

        if (value == null && zeroDefault) {
            return 0L;
        }

        return cents(value);
    }

    private static String value(
        Map<String, Object> row,
        String name
    ) {
        Object input = row.get(name);

        return input instanceof String
            ? ((String) input).trim().toLowerCase()
            : "";
    }

    private static Integer number(
        Map<String, Object> row
    ) {
        Object input = row.get("installmentNumber");

        if (!(input instanceof Number)) {
            return null;
        }

        double numeric = ((Number) input).doubleValue();

        if (
            !Double.isFinite(numeric) ||
            numeric <= 0 ||
            numeric > Integer.MAX_VALUE ||
            numeric != Math.floor(numeric)
        ) {
            return null;
        }

        return (int) numeric;
    }

    private static Map<Integer, Map<String, Object>> index(
        List<Map<String, Object>> rows
    ) {
        if (rows == null || rows.isEmpty()) {
            return null;
        }

        Map<Integer, Map<String, Object>> result =
            new HashMap<>();

        for (Map<String, Object> row : rows) {
            if (row == null) {
                return null;
            }

            Integer id = number(row);

            if (id == null || result.put(id, row) != null) {
                return null;
            }
        }

        return result;
    }

    public static String validate(
        List<Map<String, Object>> previous,
        List<Map<String, Object>> next,
        Map<String, Object> collection
    ) {
        if (collection == null) {
            return "SETTLEMENT_FINANCIAL_RECONCILIATION_FAILED";
        }

        Long cash = amount(
            collection, "paymentAmount", false
        );

        Long penalty = amount(
            collection, "penaltyAmount", false
        );

        Long principal = amount(
            collection, "advanceAdjustment", false
        );

        Long discount = amount(
            collection, "discountAmount", false
        );

        if (
            cash == null || cash <= 0 ||
            penalty == null || penalty > cash ||
            principal == null || discount == null
        ) {
            return "SETTLEMENT_FINANCIAL_RECONCILIATION_FAILED";
        }

        if (principal != 0L) {
            return "SETTLEMENT_CURTAILMENT_VALIDATOR_REQUIRED";
        }

        if (discount != 0L) {
            return "SETTLEMENT_DISCOUNT_NATIVE_SUPPORT_PENDING";
        }

        Map<Integer, Map<String, Object>> beforeById =
            index(previous);

        Map<Integer, Map<String, Object>> afterById =
            index(next);

        if (
            beforeById == null ||
            afterById == null ||
            !beforeById.keySet().equals(afterById.keySet())
        ) {
            return "SETTLEMENT_EMI_ID_CHANGED";
        }

        long available = cash;
        long verifiedPenalty = 0L;
        long verifiedEmi = 0L;

        for (Integer id : new TreeSet<>(beforeById.keySet())) {
            Map<String, Object> before = beforeById.get(id);
            Map<String, Object> after = afterById.get(id);

            Long required = amount(
                before, "installmentAmount", false
            );

            Long nextRequired = amount(
                after, "installmentAmount", false
            );

            Long oldPaid = amount(
                before, "paidAmount", true
            );

            Long newPaid = amount(
                after, "paidAmount", true
            );

            Long oldWaived = amount(
                before, "waivedAmount", true
            );

            Long newWaived = amount(
                after, "waivedAmount", true
            );

            Long assessed = amount(
                before, "penaltyAmount", true
            );

            Long nextAssessed = amount(
                after, "penaltyAmount", true
            );

            if (
                assessed != null && assessed > 0 &&
                (
                    !before.containsKey("penaltyPaidAmount") ||
                    !before.containsKey("penaltyWaivedAmount")
                )
            ) {
                return "SETTLEMENT_LEGACY_PENALTY_EVIDENCE_MISSING";
            }

            Long oldPenaltyPaid = amount(
                before, "penaltyPaidAmount", true
            );

            Long newPenaltyPaid = amount(
                after, "penaltyPaidAmount", true
            );

            Long oldPenaltyWaived = amount(
                before, "penaltyWaivedAmount", true
            );

            Long newPenaltyWaived = amount(
                after, "penaltyWaivedAmount", true
            );

            Long[] checked = {
                required, nextRequired,
                oldPaid, newPaid,
                oldWaived, newWaived,
                assessed, nextAssessed,
                oldPenaltyPaid, newPenaltyPaid,
                oldPenaltyWaived, newPenaltyWaived
            };

            for (Long entry : checked) {
                if (entry == null) {
                    return "SETTLEMENT_EMI_AMOUNT_INVALID";
                }
            }

            if (
                !required.equals(nextRequired) ||
                !assessed.equals(nextAssessed) ||
                !oldWaived.equals(newWaived) ||
                !oldPenaltyWaived.equals(newPenaltyWaived) ||
                oldPaid + oldWaived > required ||
                oldPenaltyPaid + oldPenaltyWaived > assessed ||
                newPaid < oldPaid ||
                newPenaltyPaid < oldPenaltyPaid
            ) {
                return "SETTLEMENT_EMI_BASELINE_CHANGED";
            }

            long penaltyDue =
                assessed - oldPenaltyPaid - oldPenaltyWaived;

            long emiDue =
                required - oldPaid - oldWaived;

            long expectedPenalty =
                Math.min(available, penaltyDue);

            available -= expectedPenalty;

            long expectedEmi =
                expectedPenalty == penaltyDue
                    ? Math.min(available, emiDue)
                    : 0L;

            available -= expectedEmi;

            if (
                newPenaltyPaid - oldPenaltyPaid != expectedPenalty ||
                newPaid - oldPaid != expectedEmi
            ) {
                return "SETTLEMENT_PENALTY_FIRST_ORDER_MISMATCH";
            }

            String previousStatus = value(before, "status");
            String nextStatus = value(after, "status");

            boolean alreadySettled =
                previousStatus.equals("paid") ||
                previousStatus.equals("overdue paid") ||
                previousStatus.equals("preclosed");

            if (
                alreadySettled &&
                (
                    !newPaid.equals(oldPaid) ||
                    !newPenaltyPaid.equals(oldPenaltyPaid) ||
                    !nextStatus.equals(previousStatus)
                )
            ) {
                return "SETTLEMENT_SETTLED_EMI_CHANGED";
            }

            boolean paymentChanged =
                !newPaid.equals(oldPaid) ||
                !newPenaltyPaid.equals(oldPenaltyPaid);

            if (paymentChanged) {
                String dueDate = value(before, "dueDate");
                String paidDate = value(collection, "receiptDate");

                if (
                    dueDate.length() < 10 ||
                    paidDate.length() < 10 ||
                    !dueDate.substring(0, 10).matches("\\d{4}-\\d{2}-\\d{2}") ||
                    !paidDate.substring(0, 10).matches("\\d{4}-\\d{2}-\\d{2}")
                ) {
                    return "SETTLEMENT_EMI_DATE_INVALID";
                }

                boolean settled =
                    newPaid + oldWaived == required &&
                    newPenaltyPaid + oldPenaltyWaived == assessed;

                boolean overdue =
                    previousStatus.equals("overdue") ||
                    previousStatus.equals("overdue paid") ||
                    dueDate.substring(0, 10)
                        .compareTo(paidDate.substring(0, 10)) < 0;

                String expectedStatus = settled
                    ? (overdue ? "overdue paid" : "paid")
                    : "partial";

                if (!nextStatus.equals(expectedStatus)) {
                    return "SETTLEMENT_EMI_STATUS_MISMATCH";
                }
            } else if (!nextStatus.equals(previousStatus)) {
                return "SETTLEMENT_UNPAID_EMI_STATUS_CHANGED";
            }

            try {
                verifiedPenalty =
                    Math.addExact(verifiedPenalty, expectedPenalty);

                verifiedEmi =
                    Math.addExact(verifiedEmi, expectedEmi);
            } catch (ArithmeticException error) {
                return "SETTLEMENT_EMI_AMOUNT_INVALID";
            }
        }

        if (
            available != 0L ||
            verifiedPenalty != penalty ||
            verifiedPenalty + verifiedEmi != cash
        ) {
            return "SETTLEMENT_EMI_CASH_RECONCILIATION_FAILED";
        }

        return null;
    }
}
