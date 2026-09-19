package com.finora.enterprise.control;

import org.json.JSONArray;
import org.json.JSONObject;

import org.junit.Test;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.fail;

public final class FinoraBranchDeviceTrustStoreTest {

    private static final String PORTABLE_FINGERPRINT =
        "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

    private static final String PUBLIC_KEY_FINGERPRINT =
        "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";

    private static final class FakePort
        implements FinoraBranchDeviceTrustStore.ControlStatePort {

        String state;
        int writes;

        FakePort(
            String state
        ) {

            this.state =
                state;
        }

        @Override
        public String read() {
            return state;
        }

        @Override
        public void write(
            String serialized
        ) {

            state =
                serialized;

            writes++;
        }
    }

    @Test
    public void missingCollectionReadsAsEmpty()
        throws Exception {

        FakePort port =
            new FakePort(
                rootWithSentinel()
                    .toString()
            );

        FinoraBranchDeviceTrustStore store =
            new FinoraBranchDeviceTrustStore(
                port
            );

        List<FinoraBranchDeviceTrustStore.Record> records =
            store.readAll();

        assertTrue(
            records.isEmpty()
        );

        assertEquals(
            0,
            port.writes
        );
    }

    @Test
    public void persistPreservesUnrelatedRootAndRoundTrips()
        throws Exception {

        JSONObject root =
            rootWithSentinel();

        String sentinelBefore =
            root.getJSONObject(
                "sentinel"
            ).toString();

        FakePort port =
            new FakePort(
                root.toString()
            );

        FinoraBranchDeviceTrustStore store =
            new FinoraBranchDeviceTrustStore(
                port
            );

        store.persist(
            Collections.singletonList(
                record(
                    "ANDROID"
                )
            ),
            "2026-09-18T10:00:01.000Z"
        );

        assertEquals(
            1,
            port.writes
        );

        JSONObject persisted =
            new JSONObject(
                port.state
            );

        assertEquals(
            sentinelBefore,
            persisted
                .getJSONObject(
                    "sentinel"
                )
                .toString()
        );

        JSONObject trust =
            persisted.getJSONObject(
                FinoraBranchDeviceTrustStore.ROOT_KEY
            );

        assertEquals(
            FinoraBranchDeviceTrustStore.FORMAT,
            trust.getString(
                "format"
            )
        );

        assertEquals(
            FinoraBranchDeviceTrustStore.SCHEMA_VERSION,
            trust.getInt(
                "schemaVersion"
            )
        );

        List<FinoraBranchDeviceTrustStore.Record> loaded =
            store.readAll();

        assertEquals(
            1,
            loaded.size()
        );

        FinoraBranchDeviceTrustStore.Record result =
            loaded.get(
                0
            );

        assertEquals(
            "AUTH-STATE-1",
            result.authStateId
        );

        assertEquals(
            "USER-1",
            result.userId
        );

        assertEquals(
            "owneruser",
            result.canonicalUsername
        );

        assertEquals(
            "ANDROID",
            result.platform
        );

        assertEquals(
            "INSTALLATION-1",
            result.installationId
        );

        assertEquals(
            PORTABLE_FINGERPRINT,
            result.portableAuthFingerprint
        );

        assertEquals(
            PUBLIC_KEY_FINGERPRINT,
            result.publicKeyFingerprint
        );
    }

    @Test
    public void demoRecordRoundTripsWithDemoId()
        throws Exception {

        FakePort port =
            new FakePort(
                rootWithSentinel()
                    .toString()
            );

        FinoraBranchDeviceTrustStore store =
            new FinoraBranchDeviceTrustStore(
                port
            );

        FinoraBranchDeviceTrustStore.Record source =
            new FinoraBranchDeviceTrustStore.Record(
                "AUTH-DEMO-1",
                "USER-DEMO-1",
                "demouser",
                "OWNER-1",
                "BUSINESS-1",
                "BRANCH-1",
                "LOCAL",
                "DEMO",
                "DEMO-1",
                1L,
                "SHA256",
                PORTABLE_FINGERPRINT,
                "ANDROID",
                "INSTALLATION-2",
                "BINDING-2",
                "SHA-256",
                PUBLIC_KEY_FINGERPRINT,
                "2026-09-18T10:00:00.000Z",
                "2026-09-18T10:00:00.000Z",
                FinoraBranchDeviceTrustStore.RECORD_SCHEMA_VERSION
            );

        store.persist(
            Collections.singletonList(
                source
            ),
            "2026-09-18T10:00:00.000Z"
        );

        FinoraBranchDeviceTrustStore.Record loaded =
            store.readAll()
                .get(
                    0
                );

        assertEquals(
            "DEMO",
            loaded.dataContext
        );

        assertEquals(
            "DEMO-1",
            loaded.demoId
        );
    }

    @Test
    public void realRecordRejectsDemoIdWithoutWrite()
        throws Exception {

        FakePort port =
            new FakePort(
                rootWithSentinel()
                    .toString()
            );

        FinoraBranchDeviceTrustStore store =
            new FinoraBranchDeviceTrustStore(
                port
            );

        FinoraBranchDeviceTrustStore.Record invalid =
            new FinoraBranchDeviceTrustStore.Record(
                "AUTH-STATE-1",
                "USER-1",
                "owneruser",
                "OWNER-1",
                "BUSINESS-1",
                "BRANCH-1",
                "LOCAL",
                "REAL",
                "DEMO-NOT-ALLOWED",
                1L,
                "SHA256",
                PORTABLE_FINGERPRINT,
                "ANDROID",
                "INSTALLATION-1",
                "BINDING-1",
                "SHA-256",
                PUBLIC_KEY_FINGERPRINT,
                "2026-09-18T10:00:00.000Z",
                "2026-09-18T10:00:00.000Z",
                FinoraBranchDeviceTrustStore.RECORD_SCHEMA_VERSION
            );

        try {
            store.persist(
                Collections.singletonList(
                    invalid
                ),
                "2026-09-18T10:00:01.000Z"
            );

            fail(
                "REAL record with demoId must fail."
            );
        }
        catch (IllegalArgumentException expected) {
            assertEquals(
                0,
                port.writes
            );
        }
    }

    @Test
    public void malformedPersistedRecordFailsClosed()
        throws Exception {

        JSONObject root =
            rootWithSentinel();

        JSONObject record =
            serializedRecord();

        record.put(
            "portableAuthFingerprint",
            "NOT-A-SHA256"
        );

        JSONArray records =
            new JSONArray();

        records.put(
            record
        );

        JSONObject trust =
            new JSONObject();

        trust.put(
            "format",
            FinoraBranchDeviceTrustStore.FORMAT
        );

        trust.put(
            "schemaVersion",
            FinoraBranchDeviceTrustStore.LEGACY_SCHEMA_VERSION
        );

        trust.put(
            "records",
            records
        );

        trust.put(
            "updatedAt",
            "2026-09-18T10:00:00.000Z"
        );

        root.put(
            FinoraBranchDeviceTrustStore.ROOT_KEY,
            trust
        );

        FakePort port =
            new FakePort(
                root.toString()
            );

        FinoraBranchDeviceTrustStore store =
            new FinoraBranchDeviceTrustStore(
                port
            );

        try {
            store.readAll();

            fail(
                "Malformed persisted trust must fail closed."
            );
        }
        catch (IllegalArgumentException expected) {
            assertEquals(
                0,
                port.writes
            );
        }
    }

    @Test
    public void unexpectedRecordFieldFailsClosed()
        throws Exception {

        JSONObject root =
            rootWithSentinel();

        JSONObject record =
            serializedRecord();

        record.put(
            "unexpected",
            "MUST-FAIL"
        );

        JSONArray records =
            new JSONArray();

        records.put(
            record
        );

        JSONObject trust =
            new JSONObject();

        trust.put(
            "format",
            FinoraBranchDeviceTrustStore.FORMAT
        );

        trust.put(
            "schemaVersion",
            1
        );

        trust.put(
            "records",
            records
        );

        trust.put(
            "updatedAt",
            "2026-09-18T10:00:00.000Z"
        );

        root.put(
            FinoraBranchDeviceTrustStore.ROOT_KEY,
            trust
        );

        FinoraBranchDeviceTrustStore store =
            new FinoraBranchDeviceTrustStore(
                new FakePort(
                    root.toString()
                )
            );

        try {
            store.readAll();

            fail(
                "Unexpected record field must fail closed."
            );
        }
        catch (IllegalStateException expected) {
            assertTrue(
                expected
                    .getMessage()
                    .contains(
                        "unexpected field set"
                    )
            );
        }
    }

    @Test
    public void recordLimitFailsWithoutWrite()
        throws Exception {

        FakePort port =
            new FakePort(
                rootWithSentinel()
                    .toString()
            );

        FinoraBranchDeviceTrustStore store =
            new FinoraBranchDeviceTrustStore(
                port
            );

        List<FinoraBranchDeviceTrustStore.Record> records =
            new ArrayList<>();

        for (
            int index = 0;
            index <
                FinoraBranchDeviceTrustStore.MAX_RECORDS + 1;
            index++
        ) {

            records.add(
                record(
                    "ANDROID"
                )
            );
        }

        try {
            store.persist(
                records,
                "2026-09-18T10:00:01.000Z"
            );

            fail(
                "Device Trust record overflow must fail."
            );
        }
        catch (IllegalArgumentException expected) {
            assertEquals(
                0,
                port.writes
            );
        }
    }

    @Test
    public void missingControlStoreFailsPersistenceWithoutFallback()
        throws Exception {

        FakePort port =
            new FakePort(
                null
            );

        FinoraBranchDeviceTrustStore store =
            new FinoraBranchDeviceTrustStore(
                port
            );

        try {
            store.persist(
                Collections.singletonList(
                    record(
                        "ANDROID"
                    )
                ),
                "2026-09-18T10:00:01.000Z"
            );

            fail(
                "Missing Control Store must fail Device Trust persistence."
            );
        }
        catch (IllegalStateException expected) {
            assertEquals(
                0,
                port.writes
            );
        }
    }

    @Test
    public void revokedV2RecordRoundTripsWithEvidence() throws Exception {
        FakePort port = new FakePort(rootWithSentinel().toString());
        FinoraBranchDeviceTrustStore store = new FinoraBranchDeviceTrustStore(port);
        FinoraBranchDeviceTrustStore.Record revoked = new FinoraBranchDeviceTrustStore.Record(
            "AUTH-STATE-1", "USER-1", "owneruser", "OWNER-1", "BUSINESS-1", "BRANCH-1", "LOCAL", "REAL", null, 1L, "SHA256", PORTABLE_FINGERPRINT, "ANDROID", "INSTALLATION-1", "BINDING-1", "SHA-256", PUBLIC_KEY_FINGERPRINT, FinoraBranchDeviceTrustLifecycle.STATUS_REVOKED, "2026-09-19T10:00:00.000Z", "2026-09-18T10:00:00.000Z", "2026-09-19T10:00:00.000Z", FinoraBranchDeviceTrustStore.RECORD_SCHEMA_VERSION
        );
        store.persist(Collections.singletonList(revoked), "2026-09-19T10:00:00.000Z");
        JSONObject persisted = new JSONObject(port.state).getJSONObject(FinoraBranchDeviceTrustStore.ROOT_KEY).getJSONArray("records").getJSONObject(0);
        assertEquals(FinoraBranchDeviceTrustLifecycle.STATUS_REVOKED, persisted.getString("status"));
        assertEquals("2026-09-19T10:00:00.000Z", persisted.getString("revokedAt"));
        assertEquals(FinoraBranchDeviceTrustStore.RECORD_SCHEMA_VERSION, persisted.getInt("schemaVersion"));
        FinoraBranchDeviceTrustStore.Record loaded = store.readAll().get(0);
        assertEquals(FinoraBranchDeviceTrustLifecycle.STATUS_REVOKED, loaded.status);
        assertEquals("2026-09-19T10:00:00.000Z", loaded.revokedAt);
        assertEquals(FinoraBranchDeviceTrustStore.RECORD_SCHEMA_VERSION, loaded.schemaVersion);
    }

    @Test
    public void legacyV1RecordReadsAsActiveCurrentSchema() throws Exception {
        JSONObject root = rootWithSentinel();
        JSONArray records = new JSONArray();
        records.put(serializedRecord());
        JSONObject trust = new JSONObject();
        trust.put("format", FinoraBranchDeviceTrustStore.FORMAT);
        trust.put("schemaVersion", FinoraBranchDeviceTrustStore.LEGACY_SCHEMA_VERSION);
        trust.put("records", records);
        trust.put("updatedAt", "2026-09-18T10:00:00.000Z");
        root.put(FinoraBranchDeviceTrustStore.ROOT_KEY, trust);
        FakePort port = new FakePort(root.toString());
        List<FinoraBranchDeviceTrustStore.Record> loaded = new FinoraBranchDeviceTrustStore(port).readAll();
        assertEquals(1, loaded.size());
        FinoraBranchDeviceTrustStore.Record migrated = loaded.get(0);
        assertEquals(FinoraBranchDeviceTrustLifecycle.STATUS_ACTIVE, migrated.status);
        assertEquals(null, migrated.revokedAt);
        assertEquals(FinoraBranchDeviceTrustStore.RECORD_SCHEMA_VERSION, migrated.schemaVersion);
        assertEquals(0, port.writes);
        new FinoraBranchDeviceTrustStore(port).persist(loaded, "2026-09-18T10:00:01.000Z");
        assertEquals(1, port.writes);
        JSONObject persistedTrust = new JSONObject(port.state).getJSONObject(FinoraBranchDeviceTrustStore.ROOT_KEY);
        assertEquals(FinoraBranchDeviceTrustStore.SCHEMA_VERSION, persistedTrust.getInt("schemaVersion"));
        JSONObject persistedRecord = persistedTrust.getJSONArray("records").getJSONObject(0);
        assertEquals(FinoraBranchDeviceTrustStore.RECORD_SCHEMA_VERSION, persistedRecord.getInt("schemaVersion"));
        assertEquals(FinoraBranchDeviceTrustLifecycle.STATUS_ACTIVE, persistedRecord.getString("status"));
        assertFalse(persistedRecord.has("revokedAt"));
    }

    private static FinoraBranchDeviceTrustStore.Record record(
        String platform
    ) {

        return new FinoraBranchDeviceTrustStore.Record(
            "AUTH-STATE-1",
            "USER-1",
            "owneruser",
            "OWNER-1",
            "BUSINESS-1",
            "BRANCH-1",
            "LOCAL",
            "REAL",
            null,
            1L,
            "SHA256",
            PORTABLE_FINGERPRINT,
            platform,
            "INSTALLATION-1",
            "BINDING-1",
            "SHA-256",
            PUBLIC_KEY_FINGERPRINT,
            "2026-09-18T10:00:00.000Z",
            "2026-09-18T10:00:00.000Z",
            FinoraBranchDeviceTrustStore.RECORD_SCHEMA_VERSION
        );
    }

    private static JSONObject rootWithSentinel()
        throws Exception {

        JSONObject root =
            new JSONObject();

        JSONObject sentinel =
            new JSONObject();

        sentinel.put(
            "preserve",
            "YES"
        );

        root.put(
            "sentinel",
            sentinel
        );

        return root;
    }

    private static JSONObject serializedRecord()
        throws Exception {

        JSONObject record =
            new JSONObject();

        record.put(
            "authStateId",
            "AUTH-STATE-1"
        );

        record.put(
            "userId",
            "USER-1"
        );

        record.put(
            "canonicalUsername",
            "owneruser"
        );

        record.put(
            "ownerId",
            "OWNER-1"
        );

        record.put(
            "businessId",
            "BUSINESS-1"
        );

        record.put(
            "branchId",
            "BRANCH-1"
        );

        record.put(
            "storageMode",
            "LOCAL"
        );

        record.put(
            "dataContext",
            "REAL"
        );

        record.put(
            "authGeneration",
            1
        );

        record.put(
            "portableAuthFingerprintAlgorithm",
            "SHA256"
        );

        record.put(
            "portableAuthFingerprint",
            PORTABLE_FINGERPRINT
        );

        record.put(
            "platform",
            "ANDROID"
        );

        record.put(
            "installationId",
            "INSTALLATION-1"
        );

        record.put(
            "bindingKeyId",
            "BINDING-1"
        );

        record.put(
            "fingerprintAlgorithm",
            "SHA-256"
        );

        record.put(
            "publicKeyFingerprint",
            PUBLIC_KEY_FINGERPRINT
        );

        record.put(
            "trustedAt",
            "2026-09-18T10:00:00.000Z"
        );

        record.put(
            "updatedAt",
            "2026-09-18T10:00:00.000Z"
        );

        record.put(
            "schemaVersion",
            1
        );

        return record;
    }
}