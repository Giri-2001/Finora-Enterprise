package com.finora.enterprise.usb;

import org.junit.Test;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNull;

public final class PaisaruleAtomicPenaltyGateTest {

    private static Map<String, Object> values(
        Object... entries
    ) {
        Map<String, Object> data = new HashMap<>();

        for (int i = 0; i < entries.length; i += 2) {
            data.put((String) entries[i], entries[i + 1]);
        }

        return data;
    }

    private static final class Sample {
        final List<Map<String, Object>> before =
            new ArrayList<>();

        final List<Map<String, Object>> after =
            new ArrayList<>();

        final Map<String, Object> collection = values(
            "paymentAmount", 500,
            "penaltyAmount", 100,
            "advanceAdjustment", 0,
            "discountAmount", 0,
            "receiptDate", "2026-02-01"
        );

        Sample() {
            before.add(values(
                "installmentNumber", 1,
                "installmentAmount", 300,
                "paidAmount", 0,
                "waivedAmount", 0,
                "penaltyAmount", 100,
                "penaltyPaidAmount", 0,
                "penaltyWaivedAmount", 0,
                "status", "overdue",
                "dueDate", "2026-01-01"
            ));

            before.add(values(
                "installmentNumber", 2,
                "installmentAmount", 300,
                "paidAmount", 0,
                "waivedAmount", 0,
                "penaltyAmount", 0,
                "penaltyPaidAmount", 0,
                "penaltyWaivedAmount", 0,
                "status", "pending",
                "dueDate", "2026-03-01"
            ));

            for (Map<String, Object> row : before) {
                after.add(new HashMap<>(row));
            }

            after.get(0).put("penaltyPaidAmount", 100);
            after.get(0).put("paidAmount", 300);
            after.get(0).put("status", "overdue paid");

            after.get(1).put("paidAmount", 100);
            after.get(1).put("status", "partial");
        }

        String check() {
            return PaisaruleAtomicPenaltyGate.validate(
                before, after, collection
            );
        }
    }

    @Test
    public void penaltyFirstThenEmiCashPasses() {
        assertNull(new Sample().check());
    }

    @Test
    public void emiBeforePenaltyIsRejected() {
        Sample sample = new Sample();
        sample.after.get(0).put("penaltyPaidAmount", 0);
        sample.after.get(0).put("paidAmount", 300);

        assertEquals(
            "SETTLEMENT_PENALTY_FIRST_ORDER_MISMATCH",
            sample.check()
        );
    }

    @Test
    public void manipulatedEmiCashIsRejected() {
        Sample sample = new Sample();
        sample.after.get(1).put("paidAmount", 200);

        assertEquals(
            "SETTLEMENT_PENALTY_FIRST_ORDER_MISMATCH",
            sample.check()
        );
    }

    @Test
    public void incorrectEmiStatusIsRejected() {
        Sample sample = new Sample();
        sample.after.get(0).put("status", "partial");

        assertEquals(
            "SETTLEMENT_EMI_STATUS_MISMATCH",
            sample.check()
        );
    }

    @Test
    public void missingLegacyPenaltyEvidenceIsRejected() {
        Sample sample = new Sample();
        sample.before.get(0).remove("penaltyPaidAmount");

        assertEquals(
            "SETTLEMENT_LEGACY_PENALTY_EVIDENCE_MISSING",
            sample.check()
        );
    }

    @Test
    public void alteredSettledEmiIsRejected() {
        Sample sample = new Sample();

        sample.before.get(0).put("status", "overdue paid");
        sample.before.get(0).put("paidAmount", 300);
        sample.before.get(0).put("penaltyPaidAmount", 100);

        sample.after.get(0).put("paidAmount", 300);
        sample.after.get(0).put("penaltyPaidAmount", 100);

        assertEquals(
            "SETTLEMENT_EMI_BASELINE_CHANGED",
            sample.check()
        );
    }

    @Test
    public void unallocatedCashIsRejected() {
        Sample sample = new Sample();
        sample.collection.put("paymentAmount", 700);

        assertEquals(
            "SETTLEMENT_PENALTY_FIRST_ORDER_MISMATCH",
            sample.check()
        );
    }

    @Test
    public void principalAdjustmentRequiresSeparateValidator() {
        Sample sample = new Sample();
        sample.collection.put("advanceAdjustment", 100);

        assertEquals(
            "SETTLEMENT_CURTAILMENT_VALIDATOR_REQUIRED",
            sample.check()
        );
    }
}
