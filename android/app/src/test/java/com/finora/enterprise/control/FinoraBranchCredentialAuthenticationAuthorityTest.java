package com.finora.enterprise.control;

import org.bouncycastle.crypto.generators.SCrypt;
import org.json.JSONObject;

import org.junit.Test;

import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Base64;

import static org.junit.Assert.assertArrayEquals;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;

public final class FinoraBranchCredentialAuthenticationAuthorityTest {

    private static final String NOW =
        "2026-09-18T10:15:30.123Z";

    private static final class FakeStore
        implements FinoraBranchCredentialAuthenticationAuthority
            .CredentialStorePort {

        FinoraBranchCredentialContract.Credential
            credential;

        Exception error;

        int calls;

        String lastUsername;

        @Override
        public FinoraBranchCredentialContract.Credential
            findActiveByUsername(
                String canonicalUsername
            )
                throws Exception {

            calls++;

            lastUsername =
                canonicalUsername;

            if (error != null) {
                throw error;
            }

            return credential;
        }
    }

    private static final class CapturingKdf
        implements FinoraBranchCredentialAuthenticationAuthority
            .KdfPort {

        int calls;

        String password;

        byte[] saltSnapshot;

        byte[] saltReference;

        byte[] outputReference;

        int keyLength;

        int N;

        int r;

        int p;

        byte[] output =
            new byte[32];

        boolean fail;

        @Override
        public byte[] derive(
            String password,
            byte[] salt,
            int keyLength,
            int N,
            int r,
            int p
        )
            throws Exception {

            calls++;

            this.password =
                password;

            this.saltSnapshot =
                Arrays.copyOf(
                    salt,
                    salt.length
                );

            this.saltReference =
                salt;

            this.keyLength =
                keyLength;

            this.N =
                N;

            this.r =
                r;

            this.p =
                p;

            if (fail) {
                throw new IllegalStateException(
                    "Synthetic KDF failure."
                );
            }

            outputReference =
                Arrays.copyOf(
                    output,
                    output.length
                );

            return outputReference;
        }
    }

    private static final class CapturingCompare
        implements FinoraBranchCredentialAuthenticationAuthority
            .ComparePort {

        int calls;

        byte[] actualSnapshot;

        byte[] expectedSnapshot;

        boolean result;

        @Override
        public boolean isEqual(
            byte[] actual,
            byte[] expected
        ) {

            calls++;

            actualSnapshot =
                Arrays.copyOf(
                    actual,
                    actual.length
                );

            expectedSnapshot =
                Arrays.copyOf(
                    expected,
                    expected.length
                );

            return result;
        }
    }

    private static final class FixedClock
        implements FinoraBranchCredentialAuthenticationAuthority
            .ClockPort {

        @Override
        public String nowIso() {
            return NOW;
        }
    }

    @Test
    public void nullRequestIsInvalidWithoutStoreOrKdf() {

        FakeStore store =
            new FakeStore();

        CapturingKdf kdf =
            new CapturingKdf();

        CapturingCompare compare =
            new CapturingCompare();

        FinoraBranchCredentialAuthenticationAuthority authority =
            authority(
                store,
                kdf,
                compare
            );

        FinoraBranchCredentialAuthenticationAuthority.Result result =
            authority.authenticate(
                null
            );

        assertFailure(
            result,
            FinoraBranchCredentialAuthenticationAuthority.INVALID_REQUEST,
            "A valid FINORA credential authentication request is required."
        );

        assertEquals(
            0,
            store.calls
        );

        assertEquals(
            0,
            kdf.calls
        );

        assertEquals(
            0,
            compare.calls
        );
    }

    @Test
    public void blankUsernameIsInvalidRequest() {

        FakeStore store =
            new FakeStore();

        CapturingKdf kdf =
            new CapturingKdf();

        CapturingCompare compare =
            new CapturingCompare();

        FinoraBranchCredentialAuthenticationAuthority authority =
            authority(
                store,
                kdf,
                compare
            );

        FinoraBranchCredentialAuthenticationAuthority.Result result =
            authority.authenticate(
                new FinoraBranchCredentialAuthenticationAuthority.Request(
                    " \u00A0\uFEFF ",
                    "Password#123"
                )
            );

        assertFailure(
            result,
            FinoraBranchCredentialAuthenticationAuthority.INVALID_REQUEST,
            "A valid FINORA credential authentication request is required."
        );

        assertEquals(
            0,
            store.calls
        );

        assertEquals(
            0,
            kdf.calls
        );
    }

    @Test
    public void nullPasswordIsInvalidRequest() {

        FakeStore store =
            new FakeStore();

        CapturingKdf kdf =
            new CapturingKdf();

        CapturingCompare compare =
            new CapturingCompare();

        FinoraBranchCredentialAuthenticationAuthority authority =
            authority(
                store,
                kdf,
                compare
            );

        FinoraBranchCredentialAuthenticationAuthority.Result result =
            authority.authenticate(
                new FinoraBranchCredentialAuthenticationAuthority.Request(
                    "owner",
                    null
                )
            );

        assertFailure(
            result,
            FinoraBranchCredentialAuthenticationAuthority.INVALID_REQUEST,
            "A valid FINORA credential authentication request is required."
        );

        assertEquals(
            0,
            store.calls
        );

        assertEquals(
            0,
            kdf.calls
        );
    }

    @Test
    public void excessivePasswordCountsUnicodeCodePoints() {

        StringBuilder password =
            new StringBuilder();

        for (
            int index = 0;
            index < 129;
            index++
        ) {
            password.appendCodePoint(
                0x1F600
            );
        }

        FakeStore store =
            new FakeStore();

        CapturingKdf kdf =
            new CapturingKdf();

        CapturingCompare compare =
            new CapturingCompare();

        FinoraBranchCredentialAuthenticationAuthority.Result result =
            authority(
                store,
                kdf,
                compare
            ).authenticate(
                new FinoraBranchCredentialAuthenticationAuthority.Request(
                    "owner",
                    password.toString()
                )
            );

        assertFailure(
            result,
            FinoraBranchCredentialAuthenticationAuthority.INVALID_CREDENTIALS,
            "Invalid username or password."
        );

        assertEquals(
            0,
            store.calls
        );

        assertEquals(
            0,
            kdf.calls
        );
    }

    @Test
    public void unknownUsernamePerformsExactDummyWork()
        throws Exception {

        FakeStore store =
            new FakeStore();

        CapturingKdf kdf =
            new CapturingKdf();

        Arrays.fill(
            kdf.output,
            (byte) 0x5A
        );

        CapturingCompare compare =
            new CapturingCompare();

        compare.result =
            true;

        FinoraBranchCredentialAuthenticationAuthority.Result result =
            authority(
                store,
                kdf,
                compare
            ).authenticate(
                new FinoraBranchCredentialAuthenticationAuthority.Request(
                    "  ＯＷＮＥＲＵＳＥＲ  ",
                    "Password#123"
                )
            );

        assertFailure(
            result,
            FinoraBranchCredentialAuthenticationAuthority.INVALID_CREDENTIALS,
            "Invalid username or password."
        );

        assertEquals(
            1,
            store.calls
        );

        assertEquals(
            "owneruser",
            store.lastUsername
        );

        assertEquals(
            1,
            kdf.calls
        );

        assertEquals(
            "Password#123",
            kdf.password
        );

        assertEquals(
            32,
            kdf.keyLength
        );

        assertEquals(
            32768,
            kdf.N
        );

        assertEquals(
            8,
            kdf.r
        );

        assertEquals(
            1,
            kdf.p
        );

        byte[] expectedSalt =
            new byte[16];

        Arrays.fill(
            expectedSalt,
            (byte) 0xA5
        );

        assertArrayEquals(
            expectedSalt,
            kdf.saltSnapshot
        );

        assertEquals(
            1,
            compare.calls
        );

        byte[] expectedDummyKey =
            new byte[32];

        Arrays.fill(
            expectedDummyKey,
            (byte) 0x5A
        );

        assertArrayEquals(
            expectedDummyKey,
            compare.expectedSnapshot
        );

        assertAllZero(
            kdf.saltReference
        );

        assertAllZero(
            kdf.outputReference
        );
    }

    @Test
    public void wrongPasswordAndUnknownUsernameHaveIdenticalFailure()
        throws Exception {

        FinoraBranchCredentialContract.Credential credential =
            credential(
                "Correct#123",
                Long.valueOf(
                    3L
                ),
                "REAL",
                null
            );

        FakeStore realStore =
            new FakeStore();

        realStore.credential =
            credential;

        FinoraBranchCredentialAuthenticationAuthority.Result wrong =
            new FinoraBranchCredentialAuthenticationAuthority(
                realStore,
                new FixedClock()
            ).authenticate(
                new FinoraBranchCredentialAuthenticationAuthority.Request(
                    "owneruser",
                    "Wrong#123"
                )
            );

        FakeStore missingStore =
            new FakeStore();

        FinoraBranchCredentialAuthenticationAuthority.Result missing =
            new FinoraBranchCredentialAuthenticationAuthority(
                missingStore,
                new FixedClock()
            ).authenticate(
                new FinoraBranchCredentialAuthenticationAuthority.Request(
                    "missing-user",
                    "Wrong#123"
                )
            );

        assertFailure(
            wrong,
            FinoraBranchCredentialAuthenticationAuthority.INVALID_CREDENTIALS,
            "Invalid username or password."
        );

        assertFailure(
            missing,
            FinoraBranchCredentialAuthenticationAuthority.INVALID_CREDENTIALS,
            "Invalid username or password."
        );

        assertEquals(
            wrong.errorCode,
            missing.errorCode
        );

        assertEquals(
            wrong.error,
            missing.error
        );
    }

    @Test
    public void validPasswordReturnsFullPrincipal()
        throws Exception {

        FinoraBranchCredentialContract.Credential credential =
            credential(
                "Correct#123",
                Long.valueOf(
                    7L
                ),
                "DEMO",
                "DEMO-1"
            );

        FakeStore store =
            new FakeStore();

        store.credential =
            credential;

        FinoraBranchCredentialAuthenticationAuthority.Result result =
            new FinoraBranchCredentialAuthenticationAuthority(
                store,
                new FixedClock()
            ).authenticate(
                new FinoraBranchCredentialAuthenticationAuthority.Request(
                    "  OWNERUSER ",
                    "Correct#123"
                )
            );

        assertTrue(
            result.success
        );

        assertNull(
            result.errorCode
        );

        assertNull(
            result.error
        );

        assertNotNull(
            result.data
        );

        assertEquals(
            "CREDENTIAL-1",
            result.data.credentialId
        );

        assertEquals(
            7L,
            result.data.authGeneration
        );

        assertEquals(
            "USER-1",
            result.data.userId
        );

        assertEquals(
            "OwnerUser",
            result.data.username
        );

        assertEquals(
            "FINORA Owner",
            result.data.fullName
        );

        assertEquals(
            "ADMIN",
            result.data.role
        );

        assertEquals(
            "OWNER-1",
            result.data.ownerId
        );

        assertEquals(
            "BUSINESS-1",
            result.data.businessId
        );

        assertEquals(
            "BRANCH-1",
            result.data.branchId
        );

        assertEquals(
            "LOCAL",
            result.data.storageMode
        );

        assertEquals(
            "DEMO",
            result.data.dataContext
        );

        assertEquals(
            "DEMO-1",
            result.data.demoId
        );

        assertEquals(
            NOW,
            result.data.authenticatedAt
        );
    }

    @Test
    public void missingAuthGenerationResolvesToInitialGeneration()
        throws Exception {

        FinoraBranchCredentialContract.Credential credential =
            credential(
                "Correct#123",
                null,
                "REAL",
                null
            );

        FakeStore store =
            new FakeStore();

        store.credential =
            credential;

        FinoraBranchCredentialAuthenticationAuthority.Result result =
            new FinoraBranchCredentialAuthenticationAuthority(
                store,
                new FixedClock()
            ).authenticate(
                new FinoraBranchCredentialAuthenticationAuthority.Request(
                    "owneruser",
                    "Correct#123"
                )
            );

        assertTrue(
            result.success
        );

        assertEquals(
            FinoraBranchCredentialContract.INITIAL_AUTH_GENERATION,
            result.data.authGeneration
        );
    }

    @Test
    public void controlStoreFailureDoesNotRunKdf() {

        FakeStore store =
            new FakeStore();

        store.error =
            new IllegalStateException(
                "Synthetic store failure."
            );

        CapturingKdf kdf =
            new CapturingKdf();

        CapturingCompare compare =
            new CapturingCompare();

        FinoraBranchCredentialAuthenticationAuthority.Result result =
            authority(
                store,
                kdf,
                compare
            ).authenticate(
                new FinoraBranchCredentialAuthenticationAuthority.Request(
                    "owneruser",
                    "Password#123"
                )
            );

        assertFailure(
            result,
            FinoraBranchCredentialAuthenticationAuthority.CONTROL_STORE_FAILED,
            "Unable to load the FINORA Control Store."
        );

        assertEquals(
            0,
            kdf.calls
        );

        assertEquals(
            0,
            compare.calls
        );
    }

    @Test
    public void kdfFailureReturnsKdfFailed()
        throws Exception {

        FakeStore store =
            new FakeStore();

        store.credential =
            credential(
                "Correct#123",
                Long.valueOf(
                    1L
                ),
                "REAL",
                null
            );

        CapturingKdf kdf =
            new CapturingKdf();

        kdf.fail =
            true;

        CapturingCompare compare =
            new CapturingCompare();

        FinoraBranchCredentialAuthenticationAuthority.Result result =
            authority(
                store,
                kdf,
                compare
            ).authenticate(
                new FinoraBranchCredentialAuthenticationAuthority.Request(
                    "owneruser",
                    "Correct#123"
                )
            );

        assertFailure(
            result,
            FinoraBranchCredentialAuthenticationAuthority.KDF_FAILED,
            "FINORA could not securely verify the local credential."
        );

        assertEquals(
            1,
            kdf.calls
        );

        assertEquals(
            0,
            compare.calls
        );

        assertAllZero(
            kdf.saltReference
        );
    }

    private static FinoraBranchCredentialAuthenticationAuthority
        authority(
            FakeStore store,
            CapturingKdf kdf,
            CapturingCompare compare
        ) {

        return new FinoraBranchCredentialAuthenticationAuthority(
            store,
            kdf,
            compare,
            new FixedClock()
        );
    }

    private static void assertFailure(
        FinoraBranchCredentialAuthenticationAuthority.Result result,
        String errorCode,
        String error
    ) {

        assertFalse(
            result.success
        );

        assertNull(
            result.data
        );

        assertEquals(
            errorCode,
            result.errorCode
        );

        assertEquals(
            error,
            result.error
        );
    }

    private static void assertAllZero(
        byte[] value
    ) {

        assertNotNull(
            value
        );

        for (byte item : value) {
            assertEquals(
                0,
                item
            );
        }
    }

    private static FinoraBranchCredentialContract.Credential
        credential(
            String password,
            Long authGeneration,
            String dataContext,
            String demoId
        )
            throws Exception {

        byte[] salt =
            new byte[16];

        Arrays.fill(
            salt,
            (byte) 0x11
        );

        byte[] passwordBytes =
            password.getBytes(
                StandardCharsets.UTF_8
            );

        byte[] derived =
            null;

        try {

            derived =
                SCrypt.generate(
                    passwordBytes,
                    salt,
                    32768,
                    8,
                    1,
                    32
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
                        derived
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

            JSONObject value =
                new JSONObject();

            value.put(
                "credentialId",
                "CREDENTIAL-1"
            );

            value.put(
                "sourceAuthorizationId",
                "AUTHORIZATION-1"
            );

            if (authGeneration != null) {
                value.put(
                    "authGeneration",
                    authGeneration.longValue()
                );
            }

            value.put(
                "userId",
                "USER-1"
            );

            value.put(
                "username",
                "OwnerUser"
            );

            value.put(
                "canonicalUsername",
                "owneruser"
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
                "OWNER-1"
            );

            value.put(
                "businessId",
                "BUSINESS-1"
            );

            value.put(
                "branchId",
                "BRANCH-1"
            );

            value.put(
                "storageMode",
                "LOCAL"
            );

            value.put(
                "dataContext",
                dataContext
            );

            if (demoId != null) {
                value.put(
                    "demoId",
                    demoId
                );
            }

            value.put(
                "status",
                "ACTIVE"
            );

            value.put(
                "verifier",
                verifier
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
        finally {

            Arrays.fill(
                passwordBytes,
                (byte) 0
            );

            Arrays.fill(
                salt,
                (byte) 0
            );

            if (derived != null) {
                Arrays.fill(
                    derived,
                    (byte) 0
                );
            }
        }
    }
}