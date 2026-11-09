package com.finora.enterprise.usb;

import org.junit.Test;

import java.util.HashMap;
import java.util.Map;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNull;

public final class PaisaruleAtomicMoneyGateTest {

    private static Map<String, Object> values(
        Object... entries
    ) {
        Map<String, Object> result = new HashMap<>();

        for (int i = 0; i < entries.length; i += 2) {
            result.put(
                (String) entries[i],
                entries[i + 1]
            );
        }

        return result;
    }

    private static final class Sample {
        final Map<String, Object> original = values(
            "outstanding", 20000
        );

        final Map<String, Object> next = values(
            "outstanding", 19180
        );

        final Map<String, Object> collection = values(
            "paymentAmount", 900,
            "penaltyAmount", 100,
            "discountAmount", 0,
            "advanceAdjustment", 500,
            "outstandingBalance", 19180
        );

        final Map<String, Object> snapshot = values(
            "previousOutstanding", 20000,
            "remainingOutstanding", 19180,
            "amountReceived", 900,
            "penaltyReceived", 100,
            "discountAmount", 0
        );

        String check() {
            return PaisaruleAtomicMoneyGate.validate(
                original,
                next,
                collection,
                snapshot
            );
        }
    }

    @Test
    public void validMoneyAndReceiptEnvelopePasses() {
        assertNull(new Sample().check());
    }

    @Test
    public void penaltyCannotExceedCash() {
        Sample sample = new Sample();

        sample.collection.put("penaltyAmount", 901);

        assertEquals(
            "SETTLEMENT_FINANCIAL_RECONCILIATION_FAILED",
            sample.check()
        );
    }

    @Test
    public void principalCannotExceedCashAfterPenalty() {
        Sample sample = new Sample();

        sample.collection.put("advanceAdjustment", 801);

        assertEquals(
            "SETTLEMENT_FINANCIAL_RECONCILIATION_FAILED",
            sample.check()
        );
    }

    @Test
    public void invalidFractionalPaiseAreRejected() {
        Sample sample = new Sample();

        sample.collection.put("paymentAmount", 900.001);

        assertEquals(
            "SETTLEMENT_FINANCIAL_RECONCILIATION_FAILED",
            sample.check()
        );
    }

    @Test
    public void manipulatedReceiptTotalIsRejected() {
        Sample sample = new Sample();

        sample.snapshot.put("amountReceived", 899);

        assertEquals(
            "SETTLEMENT_RECEIPT_TOTALS_MISMATCH",
            sample.check()
        );
    }

    @Test
    public void discountRemainsUnsupported() {
        Sample sample = new Sample();

        sample.collection.put("discountAmount", 10);
        sample.snapshot.put("discountAmount", 10);

        assertEquals(
            "SETTLEMENT_DISCOUNT_NATIVE_SUPPORT_PENDING",
            sample.check()
        );
    }

    @Test
    public void negativeAndMissingMoneyAreRejected() {
        Sample sample = new Sample();

        sample.collection.put("paymentAmount", -1);

        assertEquals(
            "SETTLEMENT_FINANCIAL_RECONCILIATION_FAILED",
            sample.check()
        );

        sample.collection.remove("paymentAmount");

        assertEquals(
            "SETTLEMENT_FINANCIAL_RECONCILIATION_FAILED",
            sample.check()
        );
    }
}
