package com.finora.enterprise.control;

import org.json.JSONArray;
import org.json.JSONObject;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.UUID;


/**
 * Android native Portable Branch Auth enrollment authority.
 *
 * Durable state machine:
 *
 * PREPARED
 *   -> PORTABLE_WRITTEN
 *   -> CONTROL_APPLIED
 *   -> COMPLETE
 *
 * CONTROL_APPLIED is one encrypted Control Store write containing:
 * - credential append;
 * - signed enrollment authorization consumption;
 * - transaction transition.
 *
 * The signer verification evidence is retained because Portable Auth
 * recovery / future credential lifecycle authority may require it.
 */
public final class FinoraPortableBranchAuthEnrollmentAuthority {

    private static final int TRANSACTION_SCHEMA_VERSION =
        1;

    private static final String TRANSACTION_ID_PREFIX =
        "FINORA-PORTABLE-AUTH-ENROLLMENT-TRANSACTION-";

    private static final String AUTH_STATE_ID_PREFIX =
        "FINORA-PORTABLE-AUTH-STATE-";

    private static final String CREDENTIAL_ID_PREFIX =
        "FINORA-CREDENTIAL-";


    public static final class Result {

        public final boolean success;
        public final String error;
        public final String credentialId;
        public final String userId;
        public final String username;
        public final String storageMode;

        private Result(
            boolean success,
            String error,
            String credentialId,
            String userId,
            String username,
            String storageMode
        ) {
            this.success = success;
            this.error = error;
            this.credentialId = credentialId;
            this.userId = userId;
            this.username = username;
            this.storageMode = storageMode;
        }

        static Result success(
            String credentialId,
            String userId,
            String username,
            String storageMode
        ) {
            return new Result(
                true,
                null,
                credentialId,
                userId,
                username,
                storageMode
            );
        }

        static Result failure(
            String error
        ) {
            return new Result(
                false,
                error,
                null,
                null,
                null,
                null
            );
        }
    }


    private final FinoraControlStore
        controlStore;

    private final FinoraPortableBranchAuthStore
        portableStore;

    private final FinoraWalletBranchCertificationDeviceVault
        certificationVault;


    public FinoraPortableBranchAuthEnrollmentAuthority(
        FinoraControlStore controlStore,
        FinoraPortableBranchAuthStore portableStore,
        FinoraWalletBranchCertificationDeviceVault certificationVault
    ) {

        if (
            controlStore == null ||
            portableStore == null ||
            certificationVault == null
        ) {
            throw new IllegalArgumentException(
                "FINORA Portable Auth enrollment dependencies are required."
            );
        }

        this.controlStore =
            controlStore;

        this.portableStore =
            portableStore;

        this.certificationVault =
            certificationVault;
    }


    public Result enroll(
        String requestedUsername,
        String password,
        String securityCode
    ) {

        try {
            synchronized (
                FinoraControlPackageApplyLock.LOCK
            ) {
                return enrollLocked(
                    requestedUsername,
                    password,
                    securityCode
                );
            }
        }
        catch (Exception error) {
            String message =
                error.getMessage();

            if (
                message == null ||
                message.trim().isEmpty()
            ) {
                message =
                    "Unable to create FINORA secure credential.";
            }

            return Result.failure(
                message
            );
        }
    }


    private Result enrollLocked(
        String requestedUsername,
        String password,
        String securityCode
    ) throws Exception {

        String canonicalUsername =
            FinoraBranchCredentialContract
                .canonicalizeUsername(
                    requireText(
                        requestedUsername,
                        "Username"
                    )
                );


        JSONObject root =
            readRoot();

        /*
         * Crash recovery comes first.
         *
         * Once PREPARED exists, credential material has already
         * been durably committed to the journal. A retry resumes
         * that exact transaction instead of deriving a competing
         * credential.
         */
        JSONObject recoverable =
            findRecoverableTransaction(
                root,
                canonicalUsername
            );

        if (recoverable != null) {
            return advanceTransaction(
                recoverable
            );
        }


        JSONArray authorizations =
            array(
                root,
                "branchCredentialEnrollmentAuthorizations"
            );

        JSONObject authorization =
            null;

        int authorizationIndex =
            -1;

        for (
            int i = 0;
            i < authorizations.length();
            i++
        ) {

            JSONObject candidate =
                authorizations.optJSONObject(
                    i
                );

            if (candidate == null) {
                throw new IllegalStateException(
                    "FINORA credential enrollment authorization state is malformed."
                );
            }

            String candidateUsername =
                required(
                    candidate,
                    "username"
                );

            String candidateCanonical =
                FinoraBranchCredentialContract
                    .canonicalizeUsername(
                        candidateUsername
                    );

            if (
                canonicalUsername.equals(
                    candidateCanonical
                )
            ) {

                if (authorization != null) {
                    throw new IllegalStateException(
                        "FINORA credential enrollment authorization is ambiguous for this username."
                    );
                }

                authorization =
                    candidate;

                authorizationIndex =
                    i;
            }
        }

        if (
            authorization == null ||
            authorizationIndex < 0
        ) {
            throw new IllegalStateException(
                "FINORA signed credential enrollment authorization was not found for this username."
            );
        }


        validateAuthorization(
            authorization
        );


        JSONObject evidence =
            resolveVerificationEvidence(
                root,
                required(
                    authorization,
                    "authorizationId"
                )
            );


        validateActiveBranchAccess(
            root,
            authorization
        );


        ensureNoCredentialReplay(
            root,
            authorization,
            canonicalUsername
        );


        JSONObject provenance =
            root.optJSONObject(
                "branchCertificationEnrollmentProvenance"
            );

        if (provenance == null) {
            throw new IllegalStateException(
                "FINORA Branch Certification enrollment provenance is unavailable."
            );
        }

        String provenanceRequestId =
            required(
                provenance,
                "requestId"
            );

        String provenanceResponseId =
            required(
                provenance,
                "responseId"
            );

        String provenanceKeyId =
            required(
                provenance,
                "certificationKeyId"
            );


        String ownerId =
            required(
                authorization,
                "ownerId"
            );

        String businessId =
            required(
                authorization,
                "businessId"
            );

        String branchId =
            required(
                authorization,
                "branchId"
            );


        FinoraBranchCertificationCryptoValidator.Material
            certificationMaterial =
                certificationVault.read(
                    ownerId,
                    businessId,
                    branchId
                );

        if (certificationMaterial == null) {
            throw new IllegalStateException(
                "FINORA Branch Certification material is unavailable."
            );
        }

        FinoraBranchCertificationCryptoValidator
            .assertValid(
                certificationMaterial
            );

        if (
            !provenanceKeyId.equals(
                certificationMaterial.keyId
            )
        ) {
            throw new IllegalStateException(
                "FINORA Branch Certification provenance does not match current certified branch custody."
            );
        }


        String preparedAt =
            canonicalNow();

        String credentialId =
            CREDENTIAL_ID_PREFIX +
            UUID.randomUUID()
                .toString();

        String transactionId =
            TRANSACTION_ID_PREFIX +
            UUID.randomUUID()
                .toString();

        String authStateId =
            AUTH_STATE_ID_PREFIX +
            UUID.randomUUID()
                .toString();


        String userId =
            required(
                authorization,
                "userId"
            );

        String username =
            required(
                authorization,
                "username"
            );

        String fullName =
            required(
                authorization,
                "fullName"
            );

        String role =
            required(
                authorization,
                "role"
            );

        String storageMode =
            required(
                authorization,
                "storageMode"
            );

        String dataContext =
            required(
                authorization,
                "dataContext"
            );

        String demoId =
            optionalText(
                authorization,
                "demoId"
            );


        FinoraPortableBranchAuthEnrollmentMaterialFactory.Material
            material =
                FinoraPortableBranchAuthEnrollmentMaterialFactory
                    .create(
                        authStateId,
                        required(
                            authorization,
                            "authorizationId"
                        ),
                        evidence,
                        ownerId,
                        businessId,
                        branchId,
                        userId,
                        username,
                        fullName,
                        role,
                        dataContext,
                        demoId,
                        storageMode,
                        certificationMaterial,
                        FinoraBranchCredentialContract
                            .INITIAL_AUTH_GENERATION,
                        preparedAt,
                        preparedAt,
                        password,
                        securityCode
                    );


        FinoraBranchCredentialContract.Credential
            credential =
                new FinoraBranchCredentialContract
                    .Credential(
                        credentialId,
                        required(
                            authorization,
                            "authorizationId"
                        ),
                        FinoraBranchCredentialContract
                            .INITIAL_AUTH_GENERATION,
                        userId,
                        username,
                        canonicalUsername,
                        fullName,
                        role,
                        ownerId,
                        businessId,
                        branchId,
                        storageMode,
                        dataContext,
                        demoId,
                        FinoraBranchCredentialContract
                            .STATUS_ACTIVE,
                        FinoraPortableBranchAuthEnrollmentMaterialFactory
                            .toControlCredentialVerifier(
                                material.passwordVerifier
                            ),
                        FinoraPortableBranchAuthEnrollmentMaterialFactory
                            .toControlCredentialVerifier(
                                material.securityVerifier
                            ),
                        preparedAt,
                        preparedAt,
                        FinoraBranchCredentialContract
                            .SCHEMA_VERSION
                    );


        JSONObject credentialJson =
            new JSONObject(
                FinoraBranchCredentialContract
                    .serialize(
                        credential
                    )
            );


        JSONObject transaction =
            new JSONObject();

        transaction.put(
            "schemaVersion",
            TRANSACTION_SCHEMA_VERSION
        );

        transaction.put(
            "transactionId",
            transactionId
        );

        transaction.put(
            "sourceAuthorizationId",
            required(
                authorization,
                "authorizationId"
            )
        );

        transaction.put(
            "sourceAuthorizationVerificationEvidence",
            new JSONObject(
                evidence.toString()
            )
        );

        transaction.put(
            "canonicalUsername",
            canonicalUsername
        );

        transaction.put(
            "ownerId",
            ownerId
        );

        transaction.put(
            "businessId",
            businessId
        );

        transaction.put(
            "branchId",
            branchId
        );

        transaction.put(
            "storageMode",
            storageMode
        );


        JSONObject transactionProvenance =
            new JSONObject();

        transactionProvenance.put(
            "requestId",
            provenanceRequestId
        );

        transactionProvenance.put(
            "responseId",
            provenanceResponseId
        );

        transactionProvenance.put(
            "certificationKeyId",
            provenanceKeyId
        );

        transaction.put(
            "branchCertificationProvenance",
            transactionProvenance
        );


        transaction.put(
            "status",
            "PREPARED"
        );

        transaction.put(
            "credential",
            credentialJson
        );

        transaction.put(
            "portableEnvelope",
            new JSONObject(
                material.serializedEnvelope
            )
        );

        transaction.put(
            "portableEnvelopeSha256",
            sha256Hex(
                material.serializedEnvelope
            )
        );

        transaction.put(
            "createdAt",
            preparedAt
        );

        transaction.put(
            "updatedAt",
            preparedAt
        );


        JSONArray transactions =
            array(
                root,
                "portableBranchAuthEnrollmentTransactions"
            );

        for (
            int i = 0;
            i < transactions.length();
            i++
        ) {
            JSONObject existing =
                transactions.optJSONObject(
                    i
                );

            if (existing == null) {
                throw new IllegalStateException(
                    "FINORA Portable Auth enrollment transaction state is malformed."
                );
            }

            if (
                transactionId.equals(
                    existing.optString(
                        "transactionId",
                        ""
                    )
                )
            ) {
                throw new IllegalStateException(
                    "FINORA Portable Auth enrollment transaction replay detected."
                );
            }
        }

        transactions.put(
            transaction
        );

        root.put(
            "portableBranchAuthEnrollmentTransactions",
            transactions
        );

        /*
         * First durable write: PREPARED.
         *
         * Pending signed authorization is deliberately NOT
         * consumed yet.
         */
        controlStore.write(
            root.toString()
        );


        return advanceTransaction(
            transaction
        );
    }


    private Result advanceTransaction(
        JSONObject transaction
    ) throws Exception {

        String transactionId =
            required(
                transaction,
                "transactionId"
            );

        String storageMode =
            required(
                transaction,
                "storageMode"
            );

        String status =
            required(
                transaction,
                "status"
            );


        // ----------------------------------------------------
        // PREPARED -> portable file write
        // ----------------------------------------------------

        if (
            "PREPARED".equals(
                status
            )
        ) {

            JSONObject envelope =
                requiredObject(
                    transaction,
                    "portableEnvelope"
                );

            String canonicalEnvelope =
                FinoraPortableBranchAuthEnvelopeCodec
                    .serialize(
                        FinoraPortableBranchAuthEnvelopeCodec
                            .parse(
                                envelope.toString()
                            )
                    );

            String expectedDigest =
                required(
                    transaction,
                    "portableEnvelopeSha256"
                );

            if (
                !expectedDigest.equals(
                    sha256Hex(
                        canonicalEnvelope
                    )
                )
            ) {
                throw new IllegalStateException(
                    "FINORA Portable Auth enrollment envelope digest mismatch."
                );
            }

            /*
             * This is the only cross-file mutation.
             * The Portable Auth store owns its own recoverable /
             * atomic USB semantics.
             */
            portableStore.write(
                storageMode,
                canonicalEnvelope
            );


            String transitionedAt =
                canonicalNow();

            JSONObject root =
                readRoot();

            JSONObject durable =
                requireTransaction(
                    root,
                    transactionId
                );

            String durableStatus =
                required(
                    durable,
                    "status"
                );

            if (
                "PREPARED".equals(
                    durableStatus
                )
            ) {
                durable.put(
                    "status",
                    "PORTABLE_WRITTEN"
                );

                durable.put(
                    "portableWrittenAt",
                    transitionedAt
                );

                durable.put(
                    "updatedAt",
                    transitionedAt
                );

                controlStore.write(
                    root.toString()
                );
            }

            transaction =
                requireTransaction(
                    readRoot(),
                    transactionId
                );

            status =
                required(
                    transaction,
                    "status"
                );
        }


        // ----------------------------------------------------
        // PORTABLE_WRITTEN -> CONTROL_APPLIED
        //
        // Exactly one Control Store write below performs:
        // 1. credential insertion
        // 2. authorization consumption
        // 3. transaction transition
        // ----------------------------------------------------

        if (
            "PORTABLE_WRITTEN".equals(
                status
            )
        ) {

            JSONObject root =
                readRoot();

            JSONObject durable =
                requireTransaction(
                    root,
                    transactionId
                );

            String sourceAuthorizationId =
                required(
                    durable,
                    "sourceAuthorizationId"
                );

            String canonicalUsername =
                required(
                    durable,
                    "canonicalUsername"
                );

            JSONArray authorizations =
                array(
                    root,
                    "branchCredentialEnrollmentAuthorizations"
                );

            int authorizationIndex =
                -1;

            JSONObject authorization =
                null;

            for (
                int i = 0;
                i < authorizations.length();
                i++
            ) {

                JSONObject candidate =
                    authorizations.optJSONObject(
                        i
                    );

                if (
                    candidate != null &&
                    sourceAuthorizationId.equals(
                        candidate.optString(
                            "authorizationId",
                            ""
                        )
                    )
                ) {
                    authorizationIndex =
                        i;

                    authorization =
                        candidate;

                    break;
                }
            }

            if (
                authorization == null ||
                authorizationIndex < 0
            ) {
                throw new IllegalStateException(
                    "FINORA credential enrollment authorization is missing or already consumed."
                );
            }

            validateAuthorization(
                authorization
            );

            validateActiveBranchAccess(
                root,
                authorization
            );


            JSONObject credential =
                requiredObject(
                    durable,
                    "credential"
                );

            /*
             * Canonical credential contract validation before
             * committing it into authoritative Control State.
             */
            FinoraBranchCredentialContract
                .parse(
                    credential.toString()
                );


            ensureNoCredentialReplay(
                root,
                authorization,
                canonicalUsername
            );


            JSONArray credentials =
                array(
                    root,
                    "branchCredentials"
                );

            credentials.put(
                credential
            );

            root.put(
                "branchCredentials",
                credentials
            );


            JSONArray remaining =
                new JSONArray();

            for (
                int i = 0;
                i < authorizations.length();
                i++
            ) {
                if (i != authorizationIndex) {
                    remaining.put(
                        authorizations.get(
                            i
                        )
                    );
                }
            }

            root.put(
                "branchCredentialEnrollmentAuthorizations",
                remaining
            );


            String appliedAt =
                canonicalNow();

            durable.put(
                "status",
                "CONTROL_APPLIED"
            );

            durable.put(
                "controlAppliedAt",
                appliedAt
            );

            durable.put(
                "updatedAt",
                appliedAt
            );


            /*
             * SINGLE ENCRYPTED CONTROL STORE WRITE.
             *
             * No code may split the credential append,
             * authorization removal and journal transition.
             */
            controlStore.write(
                root.toString()
            );


            transaction =
                requireTransaction(
                    readRoot(),
                    transactionId
                );

            status =
                required(
                    transaction,
                    "status"
                );
        }


        // ----------------------------------------------------
        // CONTROL_APPLIED -> COMPLETE
        // ----------------------------------------------------

        if (
            "CONTROL_APPLIED".equals(
                status
            )
        ) {

            JSONObject root =
                readRoot();

            JSONObject durable =
                requireTransaction(
                    root,
                    transactionId
                );

            String completedAt =
                canonicalNow();

            durable.put(
                "status",
                "COMPLETE"
            );

            durable.put(
                "completedAt",
                completedAt
            );

            durable.put(
                "updatedAt",
                completedAt
            );

            controlStore.write(
                root.toString()
            );

            transaction =
                requireTransaction(
                    readRoot(),
                    transactionId
                );

            status =
                required(
                    transaction,
                    "status"
                );
        }


        if (
            !"COMPLETE".equals(
                status
            )
        ) {
            throw new IllegalStateException(
                "FINORA Portable Auth enrollment transaction could not reach COMPLETE state."
            );
        }


        JSONObject credential =
            requiredObject(
                transaction,
                "credential"
            );

        return Result.success(
            required(
                credential,
                "credentialId"
            ),
            required(
                credential,
                "userId"
            ),
            required(
                credential,
                "username"
            ),
            required(
                credential,
                "storageMode"
            )
        );
    }


    private JSONObject findRecoverableTransaction(
        JSONObject root,
        String canonicalUsername
    ) throws Exception {

        JSONArray transactions =
            array(
                root,
                "portableBranchAuthEnrollmentTransactions"
            );

        JSONObject match =
            null;

        for (
            int i = 0;
            i < transactions.length();
            i++
        ) {

            JSONObject candidate =
                transactions.optJSONObject(
                    i
                );

            if (candidate == null) {
                throw new IllegalStateException(
                    "FINORA Portable Auth enrollment transaction state is malformed."
                );
            }

            if (
                !canonicalUsername.equals(
                    candidate.optString(
                        "canonicalUsername",
                        ""
                    )
                )
            ) {
                continue;
            }

            String status =
                candidate.optString(
                    "status",
                    ""
                );

            if (
                "PREPARED".equals(
                    status
                ) ||
                "PORTABLE_WRITTEN".equals(
                    status
                ) ||
                "CONTROL_APPLIED".equals(
                    status
                )
            ) {

                if (match != null) {
                    throw new IllegalStateException(
                        "FINORA multiple incomplete Portable Auth enrollment transactions exist for this username."
                    );
                }

                match =
                    candidate;
            }
        }

        return match;
    }


    private void validateAuthorization(
        JSONObject authorization
    ) throws Exception {

        if (
            authorization.optInt(
                "schemaVersion",
                -1
            ) != 1
        ) {
            throw new IllegalStateException(
                "FINORA credential enrollment authorization schema is invalid."
            );
        }

        if (
            !authorization.optBoolean(
                "oneTime",
                false
            )
        ) {
            throw new IllegalStateException(
                "FINORA credential enrollment authorization must be one-time."
            );
        }

        if (
            !"SET_PASSWORD_ON_RECIPIENT".equals(
                required(
                    authorization,
                    "method"
                )
            )
        ) {
            throw new IllegalStateException(
                "FINORA credential enrollment method is invalid."
            );
        }

        String authorizationId =
            required(
                authorization,
                "authorizationId"
            );

        if (
            !authorizationId.startsWith(
                "FINORA-CREDENTIAL-ENROLLMENT-"
            )
        ) {
            throw new IllegalStateException(
                "FINORA credential enrollment authorization ID is invalid."
            );
        }

        required(
            authorization,
            "userId"
        );

        required(
            authorization,
            "username"
        );

        required(
            authorization,
            "fullName"
        );

        required(
            authorization,
            "ownerId"
        );

        required(
            authorization,
            "businessId"
        );

        required(
            authorization,
            "branchId"
        );

        String role =
            required(
                authorization,
                "role"
            );

        if (
            !"ADMIN".equals(role) &&
            !"MANAGER".equals(role) &&
            !"COLLECTOR".equals(role) &&
            !"VIEWER".equals(role)
        ) {
            throw new IllegalStateException(
                "FINORA credential enrollment role is invalid."
            );
        }

        String storageMode =
            required(
                authorization,
                "storageMode"
            );

        if (
            !"LOCAL".equals(storageMode) &&
            !"USB".equals(storageMode)
        ) {
            throw new IllegalStateException(
                "FINORA credential enrollment storage mode is invalid."
            );
        }

        String dataContext =
            required(
                authorization,
                "dataContext"
            );

        if (
            !"REAL".equals(dataContext) &&
            !"DEMO".equals(dataContext)
        ) {
            throw new IllegalStateException(
                "FINORA credential enrollment data context is invalid."
            );
        }
    }


    private JSONObject resolveVerificationEvidence(
        JSONObject root,
        String authorizationId
    ) throws Exception {

        JSONArray evidenceArray =
            array(
                root,
                "branchCredentialAuthorizationVerificationEvidence"
            );

        JSONObject match =
            null;

        for (
            int i = 0;
            i < evidenceArray.length();
            i++
        ) {

            JSONObject candidate =
                evidenceArray.optJSONObject(
                    i
                );

            if (
                candidate != null &&
                authorizationId.equals(
                    candidate.optString(
                        "authorizationId",
                        ""
                    )
                )
            ) {

                if (match != null) {
                    throw new IllegalStateException(
                        "FINORA duplicate credential authorization verification evidence exists."
                    );
                }

                match =
                    candidate;
            }
        }

        if (match == null) {
            throw new IllegalStateException(
                "FINORA signed credential authorization verification evidence is unavailable."
            );
        }

        return new JSONObject(
            match.toString()
        );
    }


    private void validateActiveBranchAccess(
        JSONObject root,
        JSONObject authorization
    ) throws Exception {

        JSONArray grants =
            array(
                root,
                "branchAccessGrants"
            );

        JSONObject match =
            null;

        for (
            int i = 0;
            i < grants.length();
            i++
        ) {

            JSONObject grant =
                grants.optJSONObject(
                    i
                );

            if (grant == null) {
                continue;
            }

            if (
                required(
                    authorization,
                    "userId"
                ).equals(
                    grant.optString(
                        "userId",
                        ""
                    )
                ) &&
                required(
                    authorization,
                    "ownerId"
                ).equals(
                    grant.optString(
                        "ownerId",
                        ""
                    )
                ) &&
                required(
                    authorization,
                    "businessId"
                ).equals(
                    grant.optString(
                        "businessId",
                        ""
                    )
                ) &&
                required(
                    authorization,
                    "branchId"
                ).equals(
                    grant.optString(
                        "branchId",
                        ""
                    )
                )
            ) {

                if (match != null) {
                    throw new IllegalStateException(
                        "FINORA multiple Branch Access grants match credential enrollment scope."
                    );
                }

                match =
                    grant;
            }
        }

        if (match == null) {
            throw new IllegalStateException(
                "FINORA credential enrollment requires the matching Branch Access grant."
            );
        }

        String expectedDataContext =
            "DEMO".equals(
                match.optString(
                    "accessType",
                    ""
                )
            )
                ? "DEMO"
                : "REAL";

        if (
            !"ACTIVE".equals(
                match.optString(
                    "administrativeStatus",
                    ""
                )
            ) ||
            !required(
                authorization,
                "storageMode"
            ).equals(
                match.optString(
                    "storageMode",
                    ""
                )
            ) ||
            !required(
                authorization,
                "dataContext"
            ).equals(
                expectedDataContext
            )
        ) {
            throw new IllegalStateException(
                "FINORA credential enrollment authorization no longer matches active Branch Access."
            );
        }

        if (
            "DEMO".equals(
                expectedDataContext
            )
        ) {

            String authorizationDemo =
                optionalText(
                    authorization,
                    "demoId"
                );

            String grantDemo =
                optionalText(
                    match,
                    "demoId"
                );

            if (
                authorizationDemo == null ||
                !authorizationDemo.equals(
                    grantDemo
                )
            ) {
                throw new IllegalStateException(
                    "FINORA DEMO credential enrollment scope does not match Branch Access."
                );
            }
        }
        else if (
            authorization.has(
                "demoId"
            ) &&
            authorization.opt(
                "demoId"
            ) != JSONObject.NULL
        ) {
            throw new IllegalStateException(
                "FINORA REAL credential enrollment cannot carry DEMO scope."
            );
        }
    }


    private void ensureNoCredentialReplay(
        JSONObject root,
        JSONObject authorization,
        String canonicalUsername
    ) throws Exception {

        JSONArray credentials =
            array(
                root,
                "branchCredentials"
            );

        for (
            int i = 0;
            i < credentials.length();
            i++
        ) {

            JSONObject existing =
                credentials.optJSONObject(
                    i
                );

            if (existing == null) {
                throw new IllegalStateException(
                    "FINORA Branch Credential state is malformed."
                );
            }

            if (
                canonicalUsername.equals(
                    existing.optString(
                        "canonicalUsername",
                        ""
                    )
                ) ||
                required(
                    authorization,
                    "userId"
                ).equals(
                    existing.optString(
                        "userId",
                        ""
                    )
                ) ||
                required(
                    authorization,
                    "authorizationId"
                ).equals(
                    existing.optString(
                        "sourceAuthorizationId",
                        ""
                    )
                )
            ) {
                throw new IllegalStateException(
                    "FINORA Branch Credential already exists for this enrollment authority."
                );
            }
        }
    }


    private JSONObject requireTransaction(
        JSONObject root,
        String transactionId
    ) throws Exception {

        JSONArray transactions =
            array(
                root,
                "portableBranchAuthEnrollmentTransactions"
            );

        JSONObject match =
            null;

        for (
            int i = 0;
            i < transactions.length();
            i++
        ) {

            JSONObject candidate =
                transactions.optJSONObject(
                    i
                );

            if (
                candidate != null &&
                transactionId.equals(
                    candidate.optString(
                        "transactionId",
                        ""
                    )
                )
            ) {

                if (match != null) {
                    throw new IllegalStateException(
                        "FINORA duplicate Portable Auth enrollment transaction ID exists."
                    );
                }

                match =
                    candidate;
            }
        }

        if (match == null) {
            throw new IllegalStateException(
                "FINORA Portable Auth enrollment transaction disappeared."
            );
        }

        return match;
    }


    private JSONObject readRoot()
        throws Exception {

        String serialized =
            controlStore.read();

        if (
            serialized == null ||
            serialized.trim().isEmpty()
        ) {
            throw new IllegalStateException(
                "FINORA Control Store is unavailable."
            );
        }

        return new JSONObject(
            serialized
        );
    }


    private static JSONArray array(
        JSONObject root,
        String key
    ) throws Exception {

        JSONArray value =
            root.optJSONArray(
                key
            );

        return value == null
            ? new JSONArray()
            : value;
    }


    private static JSONObject requiredObject(
        JSONObject object,
        String key
    ) {

        JSONObject value =
            object.optJSONObject(
                key
            );

        if (value == null) {
            throw new IllegalStateException(
                "FINORA " +
                key +
                " is required."
            );
        }

        return value;
    }


    private static String required(
        JSONObject object,
        String key
    ) {

        String value =
            object.optString(
                key,
                ""
            );

        if (
            value == null ||
            value.trim().isEmpty() ||
            !value.equals(
                value.trim()
            )
        ) {
            throw new IllegalStateException(
                "FINORA " +
                key +
                " is required."
            );
        }

        return value;
    }


    private static String optionalText(
        JSONObject object,
        String key
    ) {

        if (
            !object.has(
                key
            ) ||
            object.isNull(
                key
            )
        ) {
            return null;
        }

        String value =
            object.optString(
                key,
                null
            );

        if (
            value == null ||
            value.trim().isEmpty()
        ) {
            return null;
        }

        return value;
    }


    private static String requireText(
        String value,
        String label
    ) {

        if (
            value == null ||
            value.trim().isEmpty()
        ) {
            throw new IllegalArgumentException(
                label +
                " is required."
            );
        }

        return value.trim();
    }


    private static String canonicalNow() {

        return Instant.now()
            .toString();
    }


    private static String sha256Hex(
        String value
    ) throws Exception {

        MessageDigest digest =
            MessageDigest.getInstance(
                "SHA-256"
            );

        byte[] hash =
            digest.digest(
                value.getBytes(
                    StandardCharsets.UTF_8
                )
            );

        StringBuilder output =
            new StringBuilder(
                hash.length * 2
            );

        for (
            byte item :
                hash
        ) {
            output.append(
                Character.forDigit(
                    (item >>> 4) &
                    0x0f,
                    16
                )
            );

            output.append(
                Character.forDigit(
                    item &
                    0x0f,
                    16
                )
            );
        }

        return output.toString();
    }
}