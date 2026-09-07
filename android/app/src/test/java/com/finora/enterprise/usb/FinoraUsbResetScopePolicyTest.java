package com.finora.enterprise.usb;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNull;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import org.junit.Test;

// ============================================================
// FINORA ENTERPRISE OS
//
// USB RESET SCOPE POLICY JVM SELF TEST
//
// RUNTIME SCOPE:
//
// - Executes the exact pure production reset policy used by
//   FinoraUsbStorage.
// - Proves logical REAL / DEMO record isolation.
// - Does NOT claim Android SAF / physical USB filesystem E2E.
//
// ============================================================

public final class FinoraUsbResetScopePolicyTest {

    // ========================================================
    // TEST RECORD
    // ========================================================

    private static final class TestRecord {

        final String id;

        final String ownerId;

        final String demoId;

        TestRecord(
            String id,
            String ownerId,
            String demoId
        ) {
            this.id =
                id;

            this.ownerId =
                ownerId;

            this.demoId =
                demoId;
        }
    }

    // ========================================================
    // LOGICAL RESET RESULT
    // ========================================================

    private static final class LogicalResetResult {

        final String error;

        final List<TestRecord> records;

        LogicalResetResult(
            String error,
            List<TestRecord> records
        ) {
            this.error =
                error;

            this.records =
                records;
        }
    }

    // ========================================================
    // FIXTURE
    // ========================================================

    private static List<TestRecord> createFixture() {
        List<TestRecord> records =
            new ArrayList<>();

        records.add(
            new TestRecord(
                "REAL-OWNER-A",
                "OWNER-A",
                null
            )
        );

        records.add(
            new TestRecord(
                "REAL-OWNER-B",
                "OWNER-B",
                null
            )
        );

        records.add(
            new TestRecord(
                "DEMO-A-OWNER-A",
                "OWNER-A",
                "DEMO-A"
            )
        );

        records.add(
            new TestRecord(
                "DEMO-B-OWNER-A",
                "OWNER-A",
                "DEMO-B"
            )
        );

        records.add(
            new TestRecord(
                "DEMO-A-OWNER-B",
                "OWNER-B",
                "DEMO-A"
            )
        );

        records.add(
            new TestRecord(
                "UNSCOPED-LEGACY",
                null,
                null
            )
        );

        return records;
    }

    // ========================================================
    // LOGICAL RESET HARNESS
    //
    // Validation and matching decisions are delegated entirely
    // to the production FinoraUsbResetScopePolicy.
    // ========================================================

    private static LogicalResetResult applyLogicalReset(
        List<TestRecord> source,
        String dataContext,
        String ownerId,
        String demoId
    ) {
        String error =
            FinoraUsbResetScopePolicy.validate(
                dataContext,
                ownerId,
                demoId
            );

        if (error != null) {
            return new LogicalResetResult(
                error,
                new ArrayList<>(
                    source
                )
            );
        }

        List<TestRecord> remaining =
            new ArrayList<>();

        for (
            TestRecord record :
            source
        ) {
            boolean matches =
                FinoraUsbResetScopePolicy.recordMatches(
                    record.ownerId,
                    record.demoId,
                    dataContext,
                    ownerId,
                    demoId
                );

            if (!matches) {
                remaining.add(
                    record
                );
            }
        }

        return new LogicalResetResult(
            null,
            remaining
        );
    }

    private static List<String> ids(
        List<TestRecord> records
    ) {
        List<String> values =
            new ArrayList<>();

        for (
            TestRecord record :
            records
        ) {
            values.add(
                record.id
            );
        }

        Collections.sort(
            values
        );

        return values;
    }

    private static List<String> sorted(
        String... values
    ) {
        List<String> result =
            new ArrayList<>();

        Collections.addAll(
            result,
            values
        );

        Collections.sort(
            result
        );

        return result;
    }

    // ========================================================
    // LOGICAL ISOLATION MATRIX
    // ========================================================

    @Test
    public void usbResetScopeLogicalIsolationMatrix() {

        List<TestRecord> fixture =
            createFixture();

        // ----------------------------------------------------
        // TEST 1 — MISSING SCOPE
        // ----------------------------------------------------

        LogicalResetResult missingScope =
            applyLogicalReset(
                fixture,
                null,
                null,
                null
            );

        assertEquals(
            "FINORA reset scope is required.",
            missingScope.error
        );

        assertEquals(
            ids(
                fixture
            ),
            ids(
                missingScope.records
            )
        );

        System.out.println(
            "PASS: Android missing reset scope rejected with zero logical mutation"
        );

        // ----------------------------------------------------
        // TEST 2 — INVALID REAL + DEMO ID
        // ----------------------------------------------------

        LogicalResetResult invalidReal =
            applyLogicalReset(
                fixture,
                "REAL",
                "OWNER-A",
                "DEMO-A"
            );

        assertEquals(
            "REAL FINORA USB reset scope must not include a Demo ID.",
            invalidReal.error
        );

        assertEquals(
            ids(
                fixture
            ),
            ids(
                invalidReal.records
            )
        );

        System.out.println(
            "PASS: Android invalid REAL + Demo ID scope rejected with zero logical mutation"
        );

        // ----------------------------------------------------
        // TEST 3 — REAL OWNER-A RESET
        // ----------------------------------------------------

        LogicalResetResult realOwnerA =
            applyLogicalReset(
                fixture,
                "REAL",
                "OWNER-A",
                null
            );

        assertNull(
            realOwnerA.error
        );

        assertEquals(
            sorted(
                "DEMO-A-OWNER-A",
                "DEMO-A-OWNER-B",
                "DEMO-B-OWNER-A",
                "REAL-OWNER-B",
                "UNSCOPED-LEGACY"
            ),
            ids(
                realOwnerA.records
            )
        );

        System.out.println(
            "PASS: Android REAL OWNER-A reset removes only OWNER-A REAL records"
        );

        System.out.println(
            "PASS: Android REAL OWNER-A reset preserves OWNER-B REAL and all Demo records"
        );

        // ----------------------------------------------------
        // TEST 4 — DEMO-A + OWNER-A RESET
        // ----------------------------------------------------

        LogicalResetResult demoAOwnerA =
            applyLogicalReset(
                fixture,
                "DEMO",
                "OWNER-A",
                "DEMO-A"
            );

        assertNull(
            demoAOwnerA.error
        );

        assertEquals(
            sorted(
                "DEMO-A-OWNER-B",
                "DEMO-B-OWNER-A",
                "REAL-OWNER-A",
                "REAL-OWNER-B",
                "UNSCOPED-LEGACY"
            ),
            ids(
                demoAOwnerA.records
            )
        );

        System.out.println(
            "PASS: Android DEMO-A OWNER-A reset removes only the exact Demo/owner boundary"
        );

        System.out.println(
            "PASS: Android DEMO-A OWNER-A reset preserves DEMO-B, OWNER-B DEMO-A, and REAL records"
        );

        // ----------------------------------------------------
        // TEST 5 — DEMO-A WITHOUT OWNER NARROWING
        // ----------------------------------------------------

        LogicalResetResult demoA =
            applyLogicalReset(
                fixture,
                "DEMO",
                null,
                "DEMO-A"
            );

        assertNull(
            demoA.error
        );

        assertEquals(
            sorted(
                "DEMO-B-OWNER-A",
                "REAL-OWNER-A",
                "REAL-OWNER-B",
                "UNSCOPED-LEGACY"
            ),
            ids(
                demoA.records
            )
        );

        System.out.println(
            "PASS: Android DEMO-A reset without owner narrowing removes only matching Demo IDs"
        );

        System.out.println(
            "PASS: Android DEMO-A reset preserves REAL records and other Demo environments"
        );

        // ----------------------------------------------------
        // TEST 6 — INVALID DEMO OWNER
        // ----------------------------------------------------

        LogicalResetResult invalidDemoOwner =
            applyLogicalReset(
                fixture,
                "DEMO",
                "   ",
                "DEMO-A"
            );

        assertEquals(
            "FINORA DEMO USB reset owner ID must be a non-empty string when supplied.",
            invalidDemoOwner.error
        );

        assertEquals(
            ids(
                fixture
            ),
            ids(
                invalidDemoOwner.records
            )
        );

        System.out.println(
            "PASS: Android invalid DEMO owner scope rejected with zero logical mutation"
        );

        System.out.println(
            "PASS: FINORA ANDROID USB RESET SCOPE LOGICAL ISOLATION SELFTEST"
        );
    }
}