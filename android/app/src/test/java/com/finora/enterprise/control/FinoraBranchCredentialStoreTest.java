package com.finora.enterprise.control;

import org.json.JSONArray;
import org.json.JSONObject;

import org.junit.Test;

import java.util.Arrays;
import java.util.Base64;
import java.util.List;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.fail;

public final class FinoraBranchCredentialStoreTest {

    // ========================================================
    // FAKE CONTROL STATE PORT
    // ========================================================

    private static final class FakePort
        implements FinoraBranchCredentialStore.ControlStatePort {

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

    // ========================================================
    // MISSING COLLECTION
    // ========================================================

    @Test
    public void missingCollectionReadsAsEmpty()
        throws Exception {

        FakePort port =
            new FakePort(
                rootWithSentinel()
                    .toString()
            );

        FinoraBranchCredentialStore store =
            new FinoraBranchCredentialStore(
                port
            );

        List<
            FinoraBranchCredentialContract.Credential
        > credentials =
            store.readAll();

        assertTrue(
            credentials.isEmpty()
        );

        assertEquals(
            0,
            port.writes
        );
    }

    // ========================================================
    // INSERT / ROOT PRESERVATION
    // ========================================================

    @Test
    public void insertPreservesUnrelatedRootState()
        throws Exception {

        JSONObject root =
            rootWithSentinel();

        String sentinelBefore =
            root
                .getJSONObject(
                    "sentinel"
                )
                .toString();

        FakePort port =
            new FakePort(
                root.toString()
            );

        FinoraBranchCredentialStore store =
            new FinoraBranchCredentialStore(
                port
            );

        FinoraBranchCredentialContract.Credential
            credential =
                credential(
                    "CREDENTIAL-1",
                    "AUTH-1",
                    "USER-1",
                    " OwnerUser ",
                    "OWNER-1",
                    "BUSINESS-1",
                    "BRANCH-1"
                );

        store.insertNew(
            credential
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

        JSONArray credentials =
            persisted.getJSONArray(
                FinoraBranchCredentialStore.ROOT_KEY
            );

        assertEquals(
            1,
            credentials.length()
        );

        FinoraBranchCredentialContract.Credential
            parsed =
                FinoraBranchCredentialContract
                    .parse(
                        credentials
                            .getJSONObject(0)
                            .toString()
                    );

        assertEquals(
            "owneruser",
            parsed.canonicalUsername
        );
    }

    // ========================================================
    // LOOKUP CANONICALIZATION
    // ========================================================

    @Test
    public void lookupCanonicalizesUsername()
        throws Exception {

        FakePort port =
            new FakePort(
                rootWithSentinel()
                    .toString()
            );

        FinoraBranchCredentialStore store =
            new FinoraBranchCredentialStore(
                port
            );

        store.insertNew(
            credential(
                "CREDENTIAL-1",
                "AUTH-1",
                "USER-1",
                "OwnerUser",
                "OWNER-1",
                "BUSINESS-1",
                "BRANCH-1"
            )
        );

        FinoraBranchCredentialContract.Credential
            found =
                store.findActiveByUsername(
                    "  OWNERUSER  "
                );

        assertNotNull(
            found
        );

        assertEquals(
            "CREDENTIAL-1",
            found.credentialId
        );

        assertNull(
            store.findActiveByUsername(
                "other-user"
            )
        );
    }

    // ========================================================
    // DUPLICATE CREDENTIAL ID
    // ========================================================

    @Test
    public void duplicateCredentialIdFailsWithoutWrite()
        throws Exception {

        assertDuplicateRejected(
            credential(
                "CREDENTIAL-1",
                "AUTH-2",
                "USER-2",
                "second-user",
                "OWNER-2",
                "BUSINESS-2",
                "BRANCH-2"
            )
        );
    }

    // ========================================================
    // DUPLICATE AUTHORIZATION ID
    // ========================================================

    @Test
    public void duplicateSourceAuthorizationIdFailsWithoutWrite()
        throws Exception {

        assertDuplicateRejected(
            credential(
                "CREDENTIAL-2",
                "AUTH-1",
                "USER-2",
                "second-user",
                "OWNER-2",
                "BUSINESS-2",
                "BRANCH-2"
            )
        );
    }

    // ========================================================
    // DUPLICATE CANONICAL USERNAME
    // ========================================================

    @Test
    public void duplicateCanonicalUsernameFailsWithoutWrite()
        throws Exception {

        assertDuplicateRejected(
            credential(
                "CREDENTIAL-2",
                "AUTH-2",
                "USER-2",
                " OWNERUSER ",
                "OWNER-2",
                "BUSINESS-2",
                "BRANCH-2"
            )
        );
    }

    // ========================================================
    // DUPLICATE SCOPE
    // ========================================================

    @Test
    public void duplicateScopeFailsWithoutWrite()
        throws Exception {

        assertDuplicateRejected(
            credential(
                "CREDENTIAL-2",
                "AUTH-2",
                "USER-1",
                "second-user",
                "OWNER-1",
                "BUSINESS-1",
                "BRANCH-1"
            )
        );
    }

    // ========================================================
    // MALFORMED EXISTING COLLECTION
    // ========================================================

    @Test
    public void malformedExistingCollectionFailsClosed()
        throws Exception {

        JSONObject root =
            rootWithSentinel();

        root.put(
            FinoraBranchCredentialStore.ROOT_KEY,
            "not-an-array"
        );

        FakePort port =
            new FakePort(
                root.toString()
            );

        FinoraBranchCredentialStore store =
            new FinoraBranchCredentialStore(
                port
            );

        try {

            store.readAll();

            fail(
                "Malformed credential collection must fail closed."
            );
        }
        catch (IllegalStateException expected) {
            // Expected.
        }

        assertEquals(
            0,
            port.writes
        );
    }

    // ========================================================
    // MISSING CONTROL ROOT ON INSERT
    // ========================================================

    @Test
    public void insertRequiresExistingControlRoot()
        throws Exception {

        FakePort port =
            new FakePort(
                null
            );

        FinoraBranchCredentialStore store =
            new FinoraBranchCredentialStore(
                port
            );

        try {

            store.insertNew(
                credential(
                    "CREDENTIAL-1",
                    "AUTH-1",
                    "USER-1",
                    "owneruser",
                    "OWNER-1",
                    "BUSINESS-1",
                    "BRANCH-1"
                )
            );

            fail(
                "Credential persistence must not invent a new Control Store root."
            );
        }
        catch (IllegalStateException expected) {
            // Expected.
        }

        assertEquals(
            0,
            port.writes
        );
    }

    // ========================================================
    // READ RESULT IMMUTABLE
    // ========================================================

    @Test
    public void readAllResultIsImmutable()
        throws Exception {

        FakePort port =
            new FakePort(
                rootWithSentinel()
                    .toString()
            );

        FinoraBranchCredentialStore store =
            new FinoraBranchCredentialStore(
                port
            );

        List<
            FinoraBranchCredentialContract.Credential
        > result =
            store.readAll();

        try {

            result.add(
                credential(
                    "CREDENTIAL-1",
                    "AUTH-1",
                    "USER-1",
                    "owneruser",
                    "OWNER-1",
                    "BUSINESS-1",
                    "BRANCH-1"
                )
            );

            fail(
                "Credential read result must be immutable."
            );
        }
        catch (UnsupportedOperationException expected) {
            // Expected.
        }
    }

    // ========================================================
    // DUPLICATE TEST HELPER
    // ========================================================

    private static void assertDuplicateRejected(
        FinoraBranchCredentialContract.Credential conflicting
    )
        throws Exception {

        FakePort port =
            new FakePort(
                rootWithSentinel()
                    .toString()
            );

        FinoraBranchCredentialStore store =
            new FinoraBranchCredentialStore(
                port
            );

        store.insertNew(
            credential(
                "CREDENTIAL-1",
                "AUTH-1",
                "USER-1",
                "OwnerUser",
                "OWNER-1",
                "BUSINESS-1",
                "BRANCH-1"
            )
        );

        assertEquals(
            1,
            port.writes
        );

        String beforeConflict =
            port.state;

        try {

            store.insertNew(
                conflicting
            );

            fail(
                "Duplicate Branch Credential identity must fail closed."
            );
        }
        catch (IllegalStateException expected) {
            // Expected.
        }

        assertEquals(
            1,
            port.writes
        );

        assertEquals(
            beforeConflict,
            port.state
        );
    }

    // ========================================================
    // ROOT FIXTURE
    // ========================================================

    private static JSONObject rootWithSentinel()
        throws Exception {

        JSONObject nested =
            new JSONObject();

        nested.put(
            "text",
            "PRESERVE-ME"
        );

        nested.put(
            "number",
            42
        );

        nested.put(
            "array",
            new JSONArray(
                Arrays.asList(
                    "A",
                    "B",
                    "C"
                )
            )
        );

        JSONObject root =
            new JSONObject();

        root.put(
            "version",
            "1"
        );

        root.put(
            "activations",
            new JSONArray()
        );

        root.put(
            "storageEntitlements",
            new JSONArray()
        );

        root.put(
            "updatedAt",
            "2026-09-18T10:00:00.000Z"
        );

        root.put(
            "sentinel",
            nested
        );

        return root;
    }

    // ========================================================
    // CREDENTIAL FIXTURE
    // ========================================================

    private static FinoraBranchCredentialContract.Credential
        credential(
            String credentialId,
            String sourceAuthorizationId,
            String userId,
            String username,
            String ownerId,
            String businessId,
            String branchId
        )
            throws Exception {

        JSONObject value =
            new JSONObject();

        value.put(
            "credentialId",
            credentialId
        );

        value.put(
            "sourceAuthorizationId",
            sourceAuthorizationId
        );

        value.put(
            "authGeneration",
            1
        );

        value.put(
            "userId",
            userId
        );

        value.put(
            "username",
            username
        );

        value.put(
            "canonicalUsername",
            FinoraBranchCredentialContract
                .canonicalizeUsername(
                    username
                )
        );

        value.put(
            "fullName",
            "FINORA Owner"
        );

        value.put(
            "role",
            "ADMIN"
        );

        value.put(
            "ownerId",
            ownerId
        );

        value.put(
            "businessId",
            businessId
        );

        value.put(
            "branchId",
            branchId
        );

        value.put(
            "storageMode",
            "LOCAL"
        );

        value.put(
            "dataContext",
            "REAL"
        );

        value.put(
            "status",
            "ACTIVE"
        );

        value.put(
            "verifier",
            verifier(
                (byte) 1,
                (byte) 2
            )
        );

        value.put(
            "securityVerifier",
            verifier(
                (byte) 3,
                (byte) 4
            )
        );

        value.put(
            "createdAt",
            "2026-09-18T10:00:00.000Z"
        );

        value.put(
            "updatedAt",
            "2026-09-18T10:00:00.000Z"
        );

        value.put(
            "schemaVersion",
            1
        );

        return FinoraBranchCredentialContract
            .parse(
                value.toString()
            );
    }

    // ========================================================
    // VERIFIER FIXTURE
    // ========================================================

    private static JSONObject verifier(
        byte saltValue,
        byte keyValue
    )
        throws Exception {

        byte[] salt =
            new byte[16];

        byte[] key =
            new byte[32];

        Arrays.fill(
            salt,
            saltValue
        );

        Arrays.fill(
            key,
            keyValue
        );

        JSONObject verifier =
            new JSONObject();

        verifier.put(
            "algorithm",
            "SCRYPT"
        );

        verifier.put(
            "saltEncoding",
            "BASE64"
        );

        verifier.put(
            "salt",
            Base64
                .getEncoder()
                .encodeToString(
                    salt
                )
        );

        verifier.put(
            "derivedKeyEncoding",
            "BASE64"
        );

        verifier.put(
            "derivedKey",
            Base64
                .getEncoder()
                .encodeToString(
                    key
                )
        );

        verifier.put(
            "keyLength",
            32
        );

        verifier.put(
            "N",
            32768
        );

        verifier.put(
            "r",
            8
        );

        verifier.put(
            "p",
            1
        );

        return verifier;
    }
}