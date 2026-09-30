package com.finora.enterprise.control;

import android.content.Context;

import org.json.JSONArray;
import org.json.JSONObject;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Arrays;
import java.util.Collections;
import java.util.Locale;
import java.util.Objects;

public final class FinoraInstallationEnrollmentImportService {

    private FinoraInstallationEnrollmentImportService() {
        throw new AssertionError("No instances.");
    }

    public static final class Result {

        public final String responseId;
        public final String requestId;
        public final String ownerId;
        public final String businessId;
        public final String branchId;
        public final String businessCode;
        public final String branchCode;
        public final String installationId;
        public final String controlCenterFingerprint;

        private Result(
            String responseId,
            String requestId,
            String ownerId,
            String businessId,
            String branchId,
            String businessCode,
            String branchCode,
            String installationId,
            String controlCenterFingerprint
        ) {
            this.responseId = responseId;
            this.requestId = requestId;
            this.ownerId = ownerId;
            this.businessId = businessId;
            this.branchId = branchId;
            this.businessCode = businessCode;
            this.branchCode = branchCode;
            this.installationId = installationId;
            this.controlCenterFingerprint =
                controlCenterFingerprint;
        }
    }

    public static synchronized Result apply(
        Context context,
        JSONObject file,
        byte[] fileBytes,
        String independentlyConfirmedFingerprint
    ) throws Exception {

        if (context == null) {
            throw new IllegalArgumentException(
                "FINORA Android context is required."
            );
        }

        if (
            file == null ||
            fileBytes == null ||
            fileBytes.length == 0
        ) {
            throw new IllegalArgumentException(
                "FINORA Installation Enrollment Response file is required."
            );
        }

        String expectedFingerprint =
            normalizeFingerprint(
                independentlyConfirmedFingerprint
            );

        Context appContext =
            context.getApplicationContext() == null
                ? context
                : context.getApplicationContext();

        FinoraControlStore controlStore =
            new FinoraControlStore(
                appContext
            );

        FinoraInstallationBindingService bindingService =
            new FinoraInstallationBindingService(
                appContext
            );

        FinoraRecipientTrustStore trustStore =
            new FinoraRecipientTrustStore(
                appContext
            );

        FinoraWalletBranchCertificationDeviceVault certificationVault =
            new FinoraWalletBranchCertificationDeviceVault(
                appContext
            );

        String serialized =
            controlStore.read();

        if (
            serialized == null ||
            serialized.trim().isEmpty()
        ) {
            throw new IllegalStateException(
                "FINORA pending Installation Enrollment state is unavailable."
            );
        }

        JSONObject controlRoot =
            new JSONObject(
                serialized
            );

        JSONObject pending =
            controlRoot.optJSONObject(
                "pendingInstallationEnrollment"
            );

        if (pending == null) {
            throw new IllegalStateException(
                "FINORA pending Installation Enrollment state is missing."
            );
        }

        if (
            pending.optInt(
                "schemaVersion",
                -1
            ) != 1
        ) {
            throw new IllegalStateException(
                "FINORA pending Installation Enrollment schema is invalid."
            );
        }

        String expectedRequestId =
            requiredText(
                pending,
                "requestId"
            );

        String pendingInstallationId =
            requiredText(
                pending,
                "installationId"
            );

        String pendingBindingKeyId =
            requiredText(
                pending,
                "bindingKeyId"
            );

        String pendingPublicKeyFingerprint =
            requiredText(
                pending,
                "publicKeyFingerprint"
            );

        JSONObject pendingCertificationJson =
            pending.optJSONObject(
                "branchCertificationKeyMaterial"
            );

        if (pendingCertificationJson == null) {
            throw new IllegalStateException(
                "FINORA pending Branch Certification material is missing."
            );
        }

        FinoraBranchCertificationCryptoValidator.Material
            pendingCertification =
                FinoraPortableBranchAuthCertificationMaterialParser.parse(
                    pendingCertificationJson
                );

        FinoraBranchCertificationCryptoValidator.assertValid(
            pendingCertification
        );

        FinoraInstallationBindingCrypto.PublicBinding binding =
            bindingService.get();

        if (binding == null) {
            throw new IllegalStateException(
                "FINORA Android native installation binding is unavailable."
            );
        }

        if (
            !pendingInstallationId.equals(
                binding.installationId
            ) ||
            !pendingBindingKeyId.equals(
                binding.bindingKeyId
            ) ||
            !pendingPublicKeyFingerprint.equals(
                binding.publicKeyFingerprint
            )
        ) {
            throw new IllegalStateException(
                "FINORA pending Enrollment state does not match the current native installation binding."
            );
        }

        String fileDigest =
            sha256Hex(
                fileBytes
            );

        JSONObject untrustedResponse =
            file.optJSONObject(
                "response"
            );

        String untrustedResponseId =
            untrustedResponse == null
                ? ""
                : untrustedResponse.optString(
                    "responseId",
                    ""
                ).trim();

        JSONObject accepted =
            pending.optJSONObject(
                "acceptedResponse"
            );

        boolean latchedRecovery =
            false;

        if (accepted != null) {

            String acceptedResponseId =
                requiredText(
                    accepted,
                    "responseId"
                );

            String acceptedFileDigest =
                requiredText(
                    accepted,
                    "fileDigest"
                );

            if (
                accepted.optInt(
                    "schemaVersion",
                    -1
                ) != 1 ||
                !acceptedResponseId.equals(
                    untrustedResponseId
                ) ||
                !acceptedFileDigest.equals(
                    fileDigest
                )
            ) {
                throw new IllegalStateException(
                    "FINORA accepted Enrollment Response recovery latch does not match this file."
                );
            }

            latchedRecovery =
                true;
        }

        FinoraInstallationEnrollmentResponseVerifier.Verified verified =
            FinoraInstallationEnrollmentResponseVerifier.verify(
                file,
                expectedFingerprint,
                expectedRequestId,
                binding,
                latchedRecovery
                    ? null
                    : Instant.now()
            );

        /*
         * First durable mutation:
         *
         * Once strict current-time cryptographic verification succeeds,
         * latch this exact response file before writing any secondary
         * authority store.
         *
         * A crash after this point can retry the exact same response
         * without granting a general expiry bypass.
         */
        if (!latchedRecovery) {

            JSONObject latch =
                new JSONObject();

            latch.put(
                "responseId",
                verified.responseId
            );

            latch.put(
                "fileDigest",
                fileDigest
            );

            latch.put(
                "acceptedAt",
                canonicalNow()
            );

            latch.put(
                "schemaVersion",
                1
            );

            pending.put(
                "acceptedResponse",
                latch
            );

            controlRoot.put(
                "pendingInstallationEnrollment",
                pending
            );

            controlStore.write(
                controlRoot.toString()
            );
        }

        // ----------------------------------------------------
        // RECIPIENT TRUST
        // ----------------------------------------------------

        FinoraRecipientTrustState.TrustedKeyRecord trustedKey =
            new FinoraRecipientTrustState.TrustedKeyRecord(
                verified.issuerId,
                verified.signingKeyId,
                "ECDSA_P256_SHA256",
                "SPKI_DER_BASE64",
                verified.controlCenterPublicKey,
                FinoraRecipientTrustState.STATUS_ACTIVE,
                verified.trustedKeyValidFrom,
                null
            );

        FinoraRecipientTrustState.State proposedTrustState =
            new FinoraRecipientTrustState.State(
                FinoraRecipientTrustState.SCHEMA_VERSION,
                Collections.singletonList(
                    trustedKey
                ),
                null,
                null,
                null,
                null
            );

        FinoraRecipientTrustState.validate(
            proposedTrustState
        );

        String proposedTrustSerialized =
            FinoraRecipientTrustState.serialize(
                proposedTrustState
            );

        if (!trustStore.exists()) {

            FinoraRecipientTrustBootstrapService.Result trustResult =
                new FinoraRecipientTrustBootstrapService(
                    trustStore
                ).bootstrap(
                    new FinoraRecipientTrustBootstrapService.Request(
                        trustedKey,
                        expectedFingerprint
                    )
                );

            if (
                trustResult == null ||
                !trustResult.success
            ) {
                throw new IllegalStateException(
                    trustResult != null &&
                    trustResult.error != null
                        ? trustResult.error
                        : "FINORA recipient trust bootstrap failed."
                );
            }

        } else {

            String existingTrustSerialized =
                trustStore.read();

            if (existingTrustSerialized == null) {
                throw new IllegalStateException(
                    "FINORA recipient trust store exists but could not be read."
                );
            }

            FinoraRecipientTrustState.State existingTrustState =
                FinoraRecipientTrustState.parse(
                    existingTrustSerialized
                );

            String normalizedExistingTrust =
                FinoraRecipientTrustState.serialize(
                    existingTrustState
                );

            if (
                !normalizedExistingTrust.equals(
                    proposedTrustSerialized
                )
            ) {
                throw new IllegalStateException(
                    "FINORA existing recipient trust does not match this verified Enrollment Response."
                );
            }
        }

        // ----------------------------------------------------
        // BRANCH CERTIFICATION DEVICE VAULT
        // ----------------------------------------------------

        FinoraBranchCertificationCryptoValidator.Material existingCertification =
            certificationVault.read(
                verified.ownerId,
                verified.businessId,
                verified.branchId
            );

        if (existingCertification == null) {

            certificationVault.write(
                verified.ownerId,
                verified.businessId,
                verified.branchId,
                pendingCertification
            );

        } else if (
            !sameCertification(
                existingCertification,
                pendingCertification
            )
        ) {

            throw new IllegalStateException(
                "FINORA existing Branch Certification material does not match the pending Enrollment authority."
            );
        }

        FinoraWalletBranchCertificationSessionAuthority.install(
            verified.ownerId,
            verified.businessId,
            verified.branchId,
            pendingCertification
        );

        // ----------------------------------------------------
        // IMMUTABLE INSTALLATION IDENTITY
        // ----------------------------------------------------

        String latestSerialized =
            controlStore.read();

        if (
            latestSerialized == null ||
            latestSerialized.trim().isEmpty()
        ) {
            throw new IllegalStateException(
                "FINORA Control Store disappeared during Enrollment import."
            );
        }

        JSONObject latestRoot =
            new JSONObject(
                latestSerialized
            );

        JSONObject latestPending =
            latestRoot.optJSONObject(
                "pendingInstallationEnrollment"
            );

        if (latestPending == null) {
            throw new IllegalStateException(
                "FINORA pending Enrollment transaction disappeared before identity commit."
            );
        }

        JSONObject installation =
            latestRoot.optJSONObject(
                "installation"
            );

        String now =
            canonicalNow();

        if (installation == null) {

            installation =
                new JSONObject();

            installation.put(
                "installationId",
                verified.installationId
            );

            installation.put(
                "bindingKeyId",
                pendingBindingKeyId
            );

            installation.put(
                "fingerprintAlgorithm",
                "SHA-256"
            );

            installation.put(
                "publicKeyFingerprint",
                pendingPublicKeyFingerprint
            );

            installation.put(
                "schemaVersion",
                1L
            );

            installation.put(
                "ownerId",
                verified.ownerId
            );

            installation.put(
                "businessId",
                verified.businessId
            );

            installation.put(
                "branchId",
                verified.branchId
            );

            installation.put(
                "businessCode",
                verified.businessCode
            );

            installation.put(
                "branchCode",
                verified.branchCode
            );

            installation.put(
                "createdAt",
                now
            );

            installation.put(
                "updatedAt",
                now
            );

            latestRoot.put(
                "installation",
                installation
            );

        } else {

            assertIdentity(
                installation,
                "installationId",
                verified.installationId
            );

            assertIdentity(
                installation,
                "ownerId",
                verified.ownerId
            );

            assertIdentity(
                installation,
                "businessId",
                verified.businessId
            );

            assertIdentity(
                installation,
                "branchId",
                verified.branchId
            );

            assertIdentity(
                installation,
                "businessCode",
                verified.businessCode
            );

            assertIdentity(
                installation,
                "branchCode",
                verified.branchCode
            );
        }

        /*
         * Ensure the fresh production Control Store has the same
         * base collections expected by later signed package apply
         * services. Existing collections are never replaced.
         */
        if (!latestRoot.has("activations")) {
            latestRoot.put(
                "activations",
                new JSONArray()
            );
        }

        if (!latestRoot.has("storageEntitlements")) {
            latestRoot.put(
                "storageEntitlements",
                new JSONArray()
            );
        }

        if (!latestRoot.has("branchAccessGrants")) {
            latestRoot.put(
                "branchAccessGrants",
                new JSONArray()
            );
        }

        if (!latestRoot.has("businessProfiles")) {
            latestRoot.put(
                "businessProfiles",
                new JSONArray()
            );
        }

        /*
         * Enrollment establishes the production Control Store root.
         * Keep it compatible with FinoraControlPlugin CONTROL_VERSION.
         */
        latestRoot.put(
            "version",
            FinoraControlPlugin.CONTROL_VERSION
        );

        latestRoot.put(
            "updatedAt",
            now
        );

        /*
         * Final atomic commit:
         *
         * installation is now immutable authority;
         * pending private material and recovery latch are removed
         * together from the encrypted main Control Store.
         */
        JSONObject branchCertificationProvenance =
            new JSONObject();

        branchCertificationProvenance.put(
            "requestId",
            verified.requestId
        );

        branchCertificationProvenance.put(
            "responseId",
            verified.responseId
        );

        FinoraWalletBranchCertificationDeviceVault
            branchCertificationDeviceVault =
                new FinoraWalletBranchCertificationDeviceVault(
                    context
                );

        FinoraBranchCertificationCryptoValidator.Material
            durableCertificationMaterial =
                branchCertificationDeviceVault.read(
                    verified.ownerId,
                    verified.businessId,
                    verified.branchId
                );

        if (durableCertificationMaterial == null) {
            throw new IllegalStateException(
                "FINORA Branch Certification material is unavailable for enrollment provenance."
            );
        }

        FinoraBranchCertificationCryptoValidator.assertValid(
            durableCertificationMaterial
        );

        branchCertificationProvenance.put(
            "certificationKeyId",
            durableCertificationMaterial.keyId
        );

        branchCertificationProvenance.put(
            "schemaVersion",
            1
        );

        latestRoot.put(
            "branchCertificationEnrollmentProvenance",
            branchCertificationProvenance
        );

        latestRoot.remove(
            "pendingInstallationEnrollment"
        );

        controlStore.write(
            latestRoot.toString()
        );

        return new Result(
            verified.responseId,
            verified.requestId,
            verified.ownerId,
            verified.businessId,
            verified.branchId,
            verified.businessCode,
            verified.branchCode,
            verified.installationId,
            verified.expectedControlCenterPublicKeyFingerprint
        );
    }

    private static void assertIdentity(
        JSONObject installation,
        String key,
        String expected
    ) {

        String actual =
            installation.optString(
                key,
                ""
            ).trim();

        if (!expected.equals(actual)) {
            throw new IllegalStateException(
                "FINORA installation identity cannot be replaced: " +
                key
            );
        }
    }

    private static boolean sameCertification(
        FinoraBranchCertificationCryptoValidator.Material a,
        FinoraBranchCertificationCryptoValidator.Material b
    ) {

        return (
            a != null &&
            b != null &&
            Objects.equals(a.keyId, b.keyId) &&
            Objects.equals(a.algorithm, b.algorithm) &&
            Objects.equals(a.publicKeyFormat, b.publicKeyFormat) &&
            Objects.equals(a.publicKey, b.publicKey) &&
            Objects.equals(a.fingerprintAlgorithm, b.fingerprintAlgorithm) &&
            Objects.equals(a.publicKeyFingerprint, b.publicKeyFingerprint) &&
            Objects.equals(a.createdAt, b.createdAt) &&
            a.schemaVersion == b.schemaVersion &&
            Objects.equals(a.privateKeyFormat, b.privateKeyFormat) &&
            Objects.equals(a.privateKey, b.privateKey) &&
            a.vaultSchemaVersion == b.vaultSchemaVersion
        );
    }

    private static String requiredText(
        JSONObject value,
        String key
    ) {

        String text =
            value.optString(
                key,
                ""
            ).trim();

        if (text.isEmpty()) {
            throw new IllegalStateException(
                "FINORA Enrollment state property is missing: " +
                key
            );
        }

        return text;
    }

    private static String normalizeFingerprint(
        String value
    ) {

        if (value == null) {
            throw new IllegalArgumentException(
                "FINORA independently confirmed Control Center fingerprint is required."
            );
        }

        String normalized =
            value
                .trim()
                .toLowerCase(
                    Locale.ROOT
                );

        if (
            !normalized.matches(
                "^[0-9a-f]{64}$"
            )
        ) {
            throw new IllegalArgumentException(
                "FINORA Control Center fingerprint must be canonical lowercase SHA-256."
            );
        }

        return normalized;
    }

    private static String canonicalNow() {

        return java.time.format.DateTimeFormatter
            .ofPattern(
                "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"
            )
            .withZone(
                java.time.ZoneOffset.UTC
            )
            .format(
                Instant.now()
            );
    }

    private static String sha256Hex(
        byte[] value
    ) throws Exception {

        byte[] digest =
            MessageDigest
                .getInstance(
                    "SHA-256"
                )
                .digest(
                    value
                );

        StringBuilder output =
            new StringBuilder(
                digest.length * 2
            );

        for (byte item : digest) {

            output.append(
                Character.forDigit(
                    (item >>> 4) & 0x0f,
                    16
                )
            );

            output.append(
                Character.forDigit(
                    item & 0x0f,
                    16
                )
            );
        }

        return output.toString();
    }
}
