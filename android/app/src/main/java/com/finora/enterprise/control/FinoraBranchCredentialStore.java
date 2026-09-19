package com.finora.enterprise.control;

import android.content.Context;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

// ============================================================
// FINORA ENTERPRISE OS™
//
// ANDROID CONTROL
// BRANCH CREDENTIAL STORE
//
// RESPONSIBILITY:
//
// - Persist recipient-local Branch Credential verifier state
//   inside the existing encrypted FINORA Control Store root
// - Preserve every unrelated Control Store root field
// - Serialize credential read / modify / write transactions with
//   the same lock used by signed control-package apply flows
// - Strictly validate every persisted credential through the
//   canonical FinoraBranchCredentialContract
// - Reject duplicate credential identities fail-closed
//
// SECURITY:
//
// - Password and Security Code plaintext are never accepted here.
// - Only verifier state is persisted.
// - No plaintext persistence fallback.
// - No separate credential file.
// - No USB fallback.
// - No WebView access.
// - No device-private-key persistence.
// - FinoraControlStore remains the sole encrypted physical store.
//
// VERSION : 1.0
// STATUS  : Android Portability Foundation
// ============================================================

public final class FinoraBranchCredentialStore {

    static final String ROOT_KEY =
        "branchCredentials";

    interface ControlStatePort {

        String read()
            throws Exception;

        void write(
            String serialized
        ) throws Exception;
    }

    private final ControlStatePort port;

    // ========================================================
    // PRODUCTION CONSTRUCTOR
    // ========================================================

    public FinoraBranchCredentialStore(
        Context context
    ) {

        this(
            new NativeControlStatePort(
                context
            )
        );
    }

    // Package-private for deterministic unit testing.
    FinoraBranchCredentialStore(
        ControlStatePort port
    ) {

        if (port == null) {
            throw new IllegalArgumentException(
                "FINORA Branch Credential Control State port is required."
            );
        }

        this.port =
            port;
    }

    // ========================================================
    // READ ALL
    // ========================================================

    public List<
        FinoraBranchCredentialContract.Credential
    > readAll()
        throws Exception {

        synchronized (
            FinoraControlPackageApplyLock.LOCK
        ) {

            return Collections.unmodifiableList(
                new ArrayList<>(
                    readAllLocked()
                )
            );
        }
    }

    // ========================================================
    // LOOKUP
    // ========================================================

    public FinoraBranchCredentialContract.Credential
        findActiveByUsername(
            String username
        )
            throws Exception {

        if (username == null) {
            return null;
        }

        String canonicalUsername =
            FinoraBranchCredentialContract
                .canonicalizeUsername(
                    username
                );

        synchronized (
            FinoraControlPackageApplyLock.LOCK
        ) {

            List<
                FinoraBranchCredentialContract.Credential
            > credentials =
                readAllLocked();

            for (
                FinoraBranchCredentialContract.Credential credential :
                credentials
            ) {

                if (
                    "ACTIVE".equals(
                        credential.status
                    ) &&
                    canonicalUsername.equals(
                        credential.canonicalUsername
                    )
                ) {
                    return credential;
                }
            }

            return null;
        }
    }

    // ========================================================
    // INSERT NEW
    // ========================================================

    public void insertNew(
        FinoraBranchCredentialContract.Credential credential
    )
        throws Exception {

        if (credential == null) {
            throw new IllegalArgumentException(
                "FINORA Branch Credential is required."
            );
        }

        /*
         * Re-serialize and re-parse before persistence so callers
         * cannot bypass canonical contract validation by directly
         * constructing an object.
         */
        String candidateSerialized =
            FinoraBranchCredentialContract
                .serialize(
                    credential
                );

        FinoraBranchCredentialContract.Credential
            validatedCredential =
                FinoraBranchCredentialContract
                    .parse(
                        candidateSerialized
                    );

        synchronized (
            FinoraControlPackageApplyLock.LOCK
        ) {

            String raw =
                port.read();

            if (raw == null) {
                throw new IllegalStateException(
                    "FINORA Control Store must exist before Branch Credential persistence."
                );
            }

            JSONObject root =
                parseRoot(
                    raw
                );

            List<
                FinoraBranchCredentialContract.Credential
            > credentials =
                readCollection(
                    root
                );

            credentials.add(
                validatedCredential
            );

            ensureUnique(
                credentials
            );

            JSONArray serializedCollection =
                new JSONArray();

            for (
                FinoraBranchCredentialContract.Credential item :
                credentials
            ) {

                serializedCollection.put(
                    new JSONObject(
                        FinoraBranchCredentialContract
                            .serialize(
                                item
                            )
                    )
                );
            }

            /*
             * Preserve the complete existing root document.
             * Only branchCredentials is replaced.
             */
            root.put(
                ROOT_KEY,
                serializedCollection
            );

            port.write(
                root.toString()
            );
        }
    }

    // ========================================================
    // LOCKED READ
    // ========================================================

    private List<
        FinoraBranchCredentialContract.Credential
    > readAllLocked()
        throws Exception {

        String raw =
            port.read();

        if (raw == null) {
            return new ArrayList<>();
        }

        return readCollection(
            parseRoot(
                raw
            )
        );
    }

    // ========================================================
    // ROOT PARSE
    // ========================================================

    private static JSONObject parseRoot(
        String raw
    ) {

        if (
            raw == null ||
            raw.trim().isEmpty()
        ) {
            throw new IllegalStateException(
                "FINORA Control Store root is invalid."
            );
        }

        try {
            return new JSONObject(
                raw
            );
        }
        catch (Exception error) {
            throw new IllegalStateException(
                "FINORA Control Store root JSON is invalid.",
                error
            );
        }
    }

    // ========================================================
    // COLLECTION PARSE
    // ========================================================

    private static List<
        FinoraBranchCredentialContract.Credential
    > readCollection(
        JSONObject root
    ) {

        List<
            FinoraBranchCredentialContract.Credential
        > credentials =
            new ArrayList<>();

        if (!root.has(ROOT_KEY)) {
            return credentials;
        }

        if (root.isNull(ROOT_KEY)) {
            throw new IllegalStateException(
                "FINORA Branch Credential collection cannot be null."
            );
        }

        JSONArray array =
            root.optJSONArray(
                ROOT_KEY
            );

        if (array == null) {
            throw new IllegalStateException(
                "FINORA Branch Credential collection must be a JSON array."
            );
        }

        for (
            int index = 0;
            index < array.length();
            index++
        ) {

            JSONObject item =
                array.optJSONObject(
                    index
                );

            if (item == null) {
                throw new IllegalStateException(
                    "FINORA Branch Credential collection contains a non-object entry."
                );
            }

            try {
                credentials.add(
                    FinoraBranchCredentialContract
                        .parse(
                            item.toString()
                        )
                );
            }
            catch (Exception error) {
                throw new IllegalStateException(
                    "FINORA Branch Credential collection contains an invalid credential.",
                    error
                );
            }
        }

        ensureUnique(
            credentials
        );

        return credentials;
    }

    // ========================================================
    // DUPLICATE PROTECTION
    // ========================================================

    static void ensureUnique(
        List<
            FinoraBranchCredentialContract.Credential
        > credentials
    ) {

        Set<String> credentialIds =
            new HashSet<>();

        Set<String> sourceAuthorizationIds =
            new HashSet<>();

        Set<String> canonicalUsernames =
            new HashSet<>();

        Set<String> scopes =
            new HashSet<>();

        for (
            FinoraBranchCredentialContract.Credential credential :
            credentials
        ) {

            if (
                !credentialIds.add(
                    credential.credentialId
                ) ||
                !sourceAuthorizationIds.add(
                    credential.sourceAuthorizationId
                ) ||
                !canonicalUsernames.add(
                    credential.canonicalUsername
                )
            ) {
                throw new IllegalStateException(
                    "FINORA Branch Credential collection contains duplicate identities."
                );
            }

            String scope =
                credential.userId +
                "::" +
                credential.ownerId +
                "::" +
                credential.businessId +
                "::" +
                credential.branchId;

            if (!scopes.add(scope)) {
                throw new IllegalStateException(
                    "FINORA Branch Credential collection contains a duplicate credential scope."
                );
            }
        }
    }

    // ========================================================
    // NATIVE ENCRYPTED CONTROL STORE PORT
    // ========================================================

    private static final class NativeControlStatePort
        implements ControlStatePort {

        private final FinoraControlStore controlStore;

        NativeControlStatePort(
            Context context
        ) {

            if (context == null) {
                throw new IllegalArgumentException(
                    "Android context is required."
                );
            }

            this.controlStore =
                new FinoraControlStore(
                    context
                );
        }

        @Override
        public String read()
            throws Exception {

            return controlStore.read();
        }

        @Override
        public void write(
            String serialized
        )
            throws Exception {

            controlStore.write(
                serialized
            );
        }
    }

    private FinoraBranchCredentialStore() {

        throw new AssertionError(
            "No instances."
        );
    }
}

// ============================================================
// END
// ============================================================