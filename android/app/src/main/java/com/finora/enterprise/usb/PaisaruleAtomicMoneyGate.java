package com.finora.enterprise.usb;

import java.math.BigDecimal;
import java.util.Map;

/**
 * PAISARULE C126-R130-R26
 *
 * Independent, fail-closed money-input preflight.
 *
 * NOT a complete settlement validator.
 * NOT authorized to publish any financial record.
 *
 * Future native reconciliation must independently verify:
 * EMI-by-EMI penalty allocation, interest curtailment,
 * settled-row integrity and receipt schedule evidence.
 */
public final class PaisaruleAtomicMoneyGate {

    private PaisaruleAtomicMoneyGate() {
    }

    private static Long cents(Object value) {
        if (!(value instanceof Number)) {
            return null;
        }

        try {
            double numeric = ((Number) value).doubleValue();

            if (!Double.isFinite(numeric) || numeric < 0) {
                return null;
            }

            BigDecimal exact =
                new BigDecimal(value.toString());

            return exact.movePointRight(2).longValueExact();
        } catch (Exception error) {
            return null;
        }
    }

    private static Long field(
        Map<String, Object> data,
        String name
    ) {
        return data == null
            ? null
            : cents(data.get(name));
    }

    public static String validate(
        Map<String, Object> originalLoan,
        Map<String, Object> nextLoan,
        Map<String, Object> collection,
        Map<String, Object> receiptSnapshot
    ) {
        if (
            originalLoan == null ||
            nextLoan == null ||
            collection == null ||
            receiptSnapshot == null
        ) {
            return "SETTLEMENT_FINANCIAL_RECONCILIATION_FAILED";
        }

        Long cash = field(collection, "paymentAmount");
        Long penalty = field(collection, "penaltyAmount");
        Long discount = field(collection, "discountAmount");
        Long principal = field(collection, "advanceAdjustment");

        Long previous = field(originalLoan, "outstanding");
        Long remaining = field(nextLoan, "outstanding");
        Long recordedRemaining =
            field(collection, "outstandingBalance");

        if (
            cash == null ||
            penalty == null ||
            discount == null ||
            principal == null ||
            previous == null ||
            remaining == null ||
            recordedRemaining == null ||
            cash <= 0 ||
            penalty > cash ||
            principal > cash - penalty ||
            previous < remaining ||
            !remaining.equals(recordedRemaining)
        ) {
            return "SETTLEMENT_FINANCIAL_RECONCILIATION_FAILED";
        }

        if (
            !previous.equals(
                field(receiptSnapshot, "previousOutstanding")
            ) ||
            !remaining.equals(
                field(receiptSnapshot, "remainingOutstanding")
            ) ||
            !cash.equals(
                field(receiptSnapshot, "amountReceived")
            ) ||
            !penalty.equals(
                field(receiptSnapshot, "penaltyReceived")
            ) ||
            !discount.equals(
                field(receiptSnapshot, "discountAmount")
            )
        ) {
            return "SETTLEMENT_RECEIPT_TOTALS_MISMATCH";
        }

        // Match Windows strict manual-settlement scope.
        if (discount != 0L) {
            return "SETTLEMENT_DISCOUNT_NATIVE_SUPPORT_PENDING";
        }

        // This is ONLY the initial money/receipt gate.
        // Full independent EMI reconciliation must follow
        // before any native financial write is permitted.
        return null;
    }
}
