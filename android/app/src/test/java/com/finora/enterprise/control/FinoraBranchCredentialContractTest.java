package com.finora.enterprise.control;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.fail;

import java.util.Base64;

import org.json.JSONObject;
import org.junit.Test;

public final class FinoraBranchCredentialContractTest {

    private static String base64Bytes(
        int length,
        int seed
    ) {

        byte[] value =
            new byte[length];

        for (
            int index = 0;
            index < value.length;
            index += 1
        ) {
            value[index] =
                (byte) (
                    seed +
                    index
                );
        }

        return Base64
            .getEncoder()
            .encodeToString(
                value
            );
    }

    private static FinoraBranchCredentialContract.Verifier
        verifier(
            int seed
        ) {

        return FinoraBranchCredentialContract
            .projectPortableVerifierValues(
                FinoraPortableBranchAuthContract.KDF_ALGORITHM,
                base64Bytes(
                    FinoraPortableBranchAuthContract.SCRYPT_SALT_BYTES,
                    seed
                ),
                FinoraPortableBranchAuthContract.SCRYPT_N,
                FinoraPortableBranchAuthContract.SCRYPT_R,
                FinoraPortableBranchAuthContract.SCRYPT_P,
                FinoraPortableBranchAuthContract.SCRYPT_DERIVED_KEY_BYTES,
                FinoraPortableBranchAuthContract.VERIFIER_BYTES,
                base64Bytes(
                    FinoraPortableBranchAuthContract.VERIFIER_BYTES,
                    seed + 40
                )
            );
    }

    private static FinoraBranchCredentialContract.Credential
        modernCredential() {

        return new FinoraBranchCredentialContract.Credential(
            "FINORA-CREDENTIAL-1",
            "FINORA-AUTHORIZATION-1",
            Long.valueOf(1L),
            "USER-1",
            "OwnerUser",
            "owneruser",
            "Owner User",
            "ADMIN",
            "OWNER-1",
            "BUSINESS-1",
            "BRANCH-1",
            "USB",
            "REAL",
            null,
            "ACTIVE",
            verifier(1),
            verifier(90),
            "2026-09-18T10:00:00.000Z",
            "2026-09-18T10:00:00.000Z",
            1
        );
    }

    @Test
    public void portableVerifierProjectsOnlyVerifierBytes() {

        String expectedVerifier =
            base64Bytes(
                FinoraPortableBranchAuthContract.VERIFIER_BYTES,
                50
            );

        FinoraBranchCredentialContract.Verifier result =
            FinoraBranchCredentialContract
                .projectPortableVerifierValues(
                    FinoraPortableBranchAuthContract.KDF_ALGORITHM,
                    base64Bytes(
                        FinoraPortableBranchAuthContract.SCRYPT_SALT_BYTES,
                        1
                    ),
                    FinoraPortableBranchAuthContract.SCRYPT_N,
                    FinoraPortableBranchAuthContract.SCRYPT_R,
                    FinoraPortableBranchAuthContract.SCRYPT_P,
                    FinoraPortableBranchAuthContract.SCRYPT_DERIVED_KEY_BYTES,
                    FinoraPortableBranchAuthContract.VERIFIER_BYTES,
                    expectedVerifier
                );

        assertEquals(
            expectedVerifier,
            result.derivedKey
        );

        assertEquals(
            FinoraPortableBranchAuthContract.VERIFIER_BYTES,
            result.keyLength
        );

        assertEquals(
            "BASE64",
            result.derivedKeyEncoding
        );
    }

    @Test
    public void portableFullDerivedKeyLengthIsNotCredentialKeyLength() {

        FinoraBranchCredentialContract.Verifier result =
            verifier(
                3
            );

        assertEquals(
            FinoraPortableBranchAuthContract.VERIFIER_BYTES,
            result.keyLength
        );

        if (
            FinoraPortableBranchAuthContract.SCRYPT_DERIVED_KEY_BYTES ==
            FinoraPortableBranchAuthContract.VERIFIER_BYTES
        ) {
            fail(
                "Portable KDF material and credential verifier lengths unexpectedly collapsed."
            );
        }
    }

    @Test
    public void modernCredentialRoundTripsExactly() {

        FinoraBranchCredentialContract.Credential original =
            modernCredential();

        String serialized =
            FinoraBranchCredentialContract.serialize(
                original
            );

        FinoraBranchCredentialContract.Credential parsed =
            FinoraBranchCredentialContract.parse(
                serialized
            );

        assertEquals(
            original.credentialId,
            parsed.credentialId
        );

        assertEquals(
            original.sourceAuthorizationId,
            parsed.sourceAuthorizationId
        );

        assertEquals(
            Long.valueOf(1L),
            parsed.authGeneration
        );

        assertEquals(
            original.userId,
            parsed.userId
        );

        assertEquals(
            original.username,
            parsed.username
        );

        assertEquals(
            original.canonicalUsername,
            parsed.canonicalUsername
        );

        assertEquals(
            original.ownerId,
            parsed.ownerId
        );

        assertEquals(
            original.businessId,
            parsed.businessId
        );

        assertEquals(
            original.branchId,
            parsed.branchId
        );

        assertEquals(
            original.storageMode,
            parsed.storageMode
        );

        assertEquals(
            original.verifier.derivedKey,
            parsed.verifier.derivedKey
        );

        assertEquals(
            original.securityVerifier.derivedKey,
            parsed.securityVerifier.derivedKey
        );
    }

    @Test
    public void historicalMissingGenerationResolvesToInitialGeneration() {

        FinoraBranchCredentialContract.Credential modern =
            modernCredential();

        FinoraBranchCredentialContract.Credential historical =
            new FinoraBranchCredentialContract.Credential(
                modern.credentialId,
                modern.sourceAuthorizationId,
                null,
                modern.userId,
                modern.username,
                modern.canonicalUsername,
                modern.fullName,
                modern.role,
                modern.ownerId,
                modern.businessId,
                modern.branchId,
                modern.storageMode,
                modern.dataContext,
                modern.demoId,
                modern.status,
                modern.verifier,
                null,
                modern.createdAt,
                modern.updatedAt,
                modern.schemaVersion
            );

        String serialized =
            FinoraBranchCredentialContract.serialize(
                historical
            );

        FinoraBranchCredentialContract.Credential parsed =
            FinoraBranchCredentialContract.parse(
                serialized
            );

        assertNull(
            parsed.authGeneration
        );

        assertNull(
            parsed.securityVerifier
        );

        assertEquals(
            1L,
            FinoraBranchCredentialContract.resolveAuthGeneration(
                parsed
            )
        );
    }

    @Test
    public void plaintextPasswordFieldIsRejectedByExactSchema()
        throws Exception {

        JSONObject object =
            new JSONObject(
                FinoraBranchCredentialContract.serialize(
                    modernCredential()
                )
            );

        object.put(
            "password",
            "must-never-persist"
        );

        try {

            FinoraBranchCredentialContract.parse(
                object.toString()
            );

            fail(
                "Unexpected plaintext credential field must be rejected."
            );
        }
        catch (IllegalArgumentException expected) {
            // Expected.
        }
    }

    @Test
    public void plaintextSecurityCodeFieldIsRejectedByExactSchema()
        throws Exception {

        JSONObject object =
            new JSONObject(
                FinoraBranchCredentialContract.serialize(
                    modernCredential()
                )
            );

        object.put(
            "securityCode",
            "must-never-persist"
        );

        try {

            FinoraBranchCredentialContract.parse(
                object.toString()
            );

            fail(
                "Unexpected plaintext Security Code field must be rejected."
            );
        }
        catch (IllegalArgumentException expected) {
            // Expected.
        }
    }

    @Test
    public void nonCanonicalUsernameFailsClosed() {

        FinoraBranchCredentialContract.Credential original =
            modernCredential();

        FinoraBranchCredentialContract.Credential invalid =
            new FinoraBranchCredentialContract.Credential(
                original.credentialId,
                original.sourceAuthorizationId,
                original.authGeneration,
                original.userId,
                original.username,
                "OwnerUser",
                original.fullName,
                original.role,
                original.ownerId,
                original.businessId,
                original.branchId,
                original.storageMode,
                original.dataContext,
                original.demoId,
                original.status,
                original.verifier,
                original.securityVerifier,
                original.createdAt,
                original.updatedAt,
                original.schemaVersion
            );

        try {

            FinoraBranchCredentialContract.serialize(
                invalid
            );

            fail(
                "Non-canonical username must fail."
            );
        }
        catch (IllegalArgumentException expected) {
            // Expected.
        }
    }

    @Test
    public void canonicalUsernameUsesTrimNfkcAndLowerCase()
        throws Exception {

        JSONObject object =
            new JSONObject(
                FinoraBranchCredentialContract.serialize(
                    modernCredential()
                )
            );

        object.put(
            "username",
            "  \uFF2F\uFF57\uFF4E\uFF45\uFF52\uFF35\uFF53\uFF45\uFF52  "
        );

        object.put(
            "canonicalUsername",
            "owneruser"
        );

        FinoraBranchCredentialContract.Credential parsed =
            FinoraBranchCredentialContract.parse(
                object.toString()
            );

        assertEquals(
            "owneruser",
            parsed.canonicalUsername
        );

        assertEquals(
            "owneruser",
            FinoraBranchCredentialContract.canonicalizeUsername(
                parsed.username
            )
        );
    }

    @Test
    public void nonMatchingCanonicalUsernameFailsClosed()
        throws Exception {

        JSONObject object =
            new JSONObject(
                FinoraBranchCredentialContract.serialize(
                    modernCredential()
                )
            );

        object.put(
            "username",
            " OwnerUser "
        );

        object.put(
            "canonicalUsername",
            "different-user"
        );

        try {

            FinoraBranchCredentialContract.parse(
                object.toString()
            );

            fail(
                "canonicalUsername must equal canonicalized username."
            );
        }
        catch (IllegalArgumentException expected) {
            // Expected.
        }
    }

    @Test
    public void realCredentialForbidsDemoId()
        throws Exception {

        JSONObject object =
            new JSONObject(
                FinoraBranchCredentialContract.serialize(
                    modernCredential()
                )
            );

        object.put(
            "demoId",
            "DEMO-1"
        );

        try {

            FinoraBranchCredentialContract.parse(
                object.toString()
            );

            fail(
                "REAL Branch Credential must reject demoId."
            );
        }
        catch (IllegalArgumentException expected) {
            // Expected.
        }
    }

    @Test
    public void demoCredentialRequiresDemoId()
        throws Exception {

        JSONObject object =
            new JSONObject(
                FinoraBranchCredentialContract.serialize(
                    modernCredential()
                )
            );

        object.put(
            "dataContext",
            "DEMO"
        );

        object.remove(
            "demoId"
        );

        try {

            FinoraBranchCredentialContract.parse(
                object.toString()
            );

            fail(
                "DEMO Branch Credential must require demoId."
            );
        }
        catch (IllegalArgumentException expected) {
            // Expected.
        }
    }

    @Test
    public void demoCredentialWithDemoIdIsAccepted()
        throws Exception {

        JSONObject object =
            new JSONObject(
                FinoraBranchCredentialContract.serialize(
                    modernCredential()
                )
            );

        object.put(
            "dataContext",
            "DEMO"
        );

        object.put(
            "demoId",
            "DEMO-1"
        );

        FinoraBranchCredentialContract.Credential parsed =
            FinoraBranchCredentialContract.parse(
                object.toString()
            );

        assertEquals(
            "DEMO",
            parsed.dataContext
        );

        assertEquals(
            "DEMO-1",
            parsed.demoId
        );
    }

    @Test
    public void invalidCreatedAtFailsClosed()
        throws Exception {

        JSONObject object =
            new JSONObject(
                FinoraBranchCredentialContract.serialize(
                    modernCredential()
                )
            );

        object.put(
            "createdAt",
            "definitely-not-a-timestamp"
        );

        try {

            FinoraBranchCredentialContract.parse(
                object.toString()
            );

            fail(
                "Invalid createdAt must fail."
            );
        }
        catch (IllegalArgumentException expected) {
            // Expected.
        }
    }

    @Test
    public void invalidUpdatedAtFailsClosed()
        throws Exception {

        JSONObject object =
            new JSONObject(
                FinoraBranchCredentialContract.serialize(
                    modernCredential()
                )
            );

        object.put(
            "updatedAt",
            "not-a-date"
        );

        try {

            FinoraBranchCredentialContract.parse(
                object.toString()
            );

            fail(
                "Invalid updatedAt must fail."
            );
        }
        catch (IllegalArgumentException expected) {
            // Expected.
        }
    }

    @Test
    public void controlTimestampAcceptsFinoraIsoTimestamp() {

        if (
            !FinoraBranchCredentialContract.isControlTimestamp(
                "2026-09-18T10:00:00.000Z"
            )
        ) {
            fail(
                "FINORA ISO timestamp must be accepted."
            );
        }
    }

    @Test
    public void invalidPortableVerifierMetadataFailsClosed() {

        try {

            FinoraBranchCredentialContract
                .projectPortableVerifierValues(
                    FinoraPortableBranchAuthContract.KDF_ALGORITHM,
                    base64Bytes(
                        FinoraPortableBranchAuthContract.SCRYPT_SALT_BYTES,
                        1
                    ),
                    FinoraPortableBranchAuthContract.SCRYPT_N,
                    FinoraPortableBranchAuthContract.SCRYPT_R,
                    FinoraPortableBranchAuthContract.SCRYPT_P,
                    FinoraPortableBranchAuthContract.VERIFIER_BYTES,
                    FinoraPortableBranchAuthContract.VERIFIER_BYTES,
                    base64Bytes(
                        FinoraPortableBranchAuthContract.VERIFIER_BYTES,
                        60
                    )
                );

            fail(
                "Collapsed Portable Auth KDF length must fail."
            );
        }
        catch (IllegalArgumentException expected) {
            // Expected.
        }
    }
}