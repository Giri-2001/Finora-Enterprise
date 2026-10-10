package com.finora.enterprise.control;

import android.content.Context;
import androidx.documentfile.provider.DocumentFile;
import org.json.JSONObject;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Arrays;

/**
 * FINORA P1-097: complete a missing signed Runtime Authority.
 *
 * Never replaces either USB authentication or Runtime Authority.
 * Requires both authentication factors and a fresh pinned server result.
 * No session or Control Store mutation.
 */
public final class FinoraServerFirstLoginV2PartialEnrollmentRepair {

    public enum Status {
        WRITTEN,
        EXISTING_RUNTIME_CONFLICT,
        INVALID_AUTHORITY,
        INVALID_USB_AUTH,
        SIGNATURE_OR_SCOPE_FAILED,
        WRITE_FAILED,
        FAILED_AT_SERVER_PREFLIGHT,
        FAILED_AT_EXISTING_RUNTIME,
        FAILED_AT_USB_READ,
        FAILED_AT_PASSWORD_DECRYPT,
        FAILED_AT_SECURITY_DECRYPT,
        FAILED_AT_AUTH_CONTINUITY,
        FAILED_AT_CERTIFICATION,
        FAILED_AT_RUNTIME_BUILD,
        FAILED_AT_RUNTIME_SIGN,
        FAILED_AT_PAIR_VERIFICATION,
        FAILED_AT_USB_CONFIRMATION,
        FAILED_AT_RUNTIME_WRITE
    }

    private FinoraServerFirstLoginV2PartialEnrollmentRepair() {}

    private static void match(
        JSONObject expected,
        JSONObject actual,
        String key
    ) throws Exception {
        if (!expected.get(key).equals(actual.get(key))) {
            throw new SecurityException("Signed authorization continuity mismatch.");
        }
    }

    public static Status repair(
        Context context,
        DocumentFile account,
        FinoraServerFirstLoginClient.Result server,
        String username,
        String password,
        String securityCode
    ) {
        byte[] passwordBytes = null;
        byte[] recoveryBytes = null;
        // FINORA_P1_099_DIAGNOSTICS
        String stage099 = "SERVER_PREFLIGHT";

        try {
            if (
                context == null ||
                account == null ||
                !account.isDirectory() ||
                !account.canWrite() ||
                password == null ||
                securityCode == null
            ) {
                return Status.INVALID_AUTHORITY;
            }

            String canonical =
                FinoraPortableBranchAccountUsbRoot.canonicalUsername(username);

            FinoraServerFirstLoginEnrollmentPreflight.Result preflight =
                FinoraServerFirstLoginEnrollmentPreflight.evaluate(
                    server, canonical, account.getName()
                );

            if (!preflight.ready() || preflight.verifiedPayload == null) {
                return Status.INVALID_AUTHORITY;
            }

            stage099 = "EXISTING_RUNTIME";
            String existingRuntime =
                FinoraServerFirstLoginRuntimeAuthorityUsbStore.readExisting(
                    context.getContentResolver(), account, canonical
                );

            if (existingRuntime != null) {
                return Status.EXISTING_RUNTIME_CONFLICT;
            }

            stage099 = "USB_READ";
            FinoraPortableBranchAuthV2UsbReader.Artifact artifact =
                new FinoraPortableBranchAuthV2UsbReader(context)
                    .readExistingArtifact(canonical);

            // Both factors must decrypt identical authenticated plaintext.
            stage099 = "PASSWORD_DECRYPT";
            passwordBytes =
                FinoraPortableBranchAuthV2DecryptAuthority.decryptWithPassword(
                    artifact.serializedEnvelope, password
                );

            stage099 = "SECURITY_DECRYPT";
            recoveryBytes =
                FinoraPortableBranchAuthV2DecryptAuthority.decryptWithSecurityCode(
                    artifact.serializedEnvelope, securityCode
                );

            if (!MessageDigest.isEqual(passwordBytes, recoveryBytes)) {
                return Status.INVALID_USB_AUTH;
            }

            JSONObject payload = new JSONObject(
                new String(passwordBytes, StandardCharsets.UTF_8)
            );

            JSONObject evidence = payload.getJSONObject(
                "sourceAuthorizationVerificationEvidence"
            );

            JSONObject originalSigned =
                evidence.getJSONObject("signedBootstrap");

            FinoraServerFirstLoginEnrollmentPreflight.Result originalPreflight =
                FinoraServerFirstLoginEnrollmentPreflight.evaluateSigned(
                    originalSigned, canonical, account.getName()
                );

            if (
                !originalPreflight.ready() ||
                originalPreflight.verifiedPayload == null
            ) {
                return Status.INVALID_AUTHORITY;
            }

            stage099 = "AUTH_CONTINUITY";
            JSONObject originalServer = originalPreflight.verifiedPayload;
            JSONObject currentServer = preflight.verifiedPayload;

            // Never attach a newly issued grant to a different authorization.
            for (String field : new String[] {
                "sourceAuthorizationId",
                "authorityId",
                "credentialId",
                "activationId",
                "branchAccessGrantId",
                "storageEntitlementId",
                "ownerId",
                "businessId",
                "branchId",
                "userId",
                "username",
                "canonicalUsername",
                "fullName",
                "role",
                "storageMode",
                "dataContext",
                "accessValidFrom",
                "accessValidUntil"
            }) {
                match(originalServer, currentServer, field);
            }

            for (String field : new String[] {
                "sourceAuthorizationId",
                "ownerId",
                "businessId",
                "branchId",
                "userId",
                "username",
                "canonicalUsername",
                "fullName",
                "role",
                "storageMode",
                "dataContext"
            }) {
                match(originalServer, payload, field);
            }

            if (
                payload.getInt("authGeneration") != 1 ||
                currentServer.getInt("authGeneration") != 1 ||
                !payload.getString("sourceAuthorizationId")
                    .equals(evidence.getString("authorizationId")) ||
                Instant.now().isBefore(
                    Instant.parse(currentServer.getString("accessValidFrom"))
                ) ||
                Instant.now().isAfter(
                    Instant.parse(currentServer.getString("accessValidUntil"))
                )
            ) {
                return Status.INVALID_AUTHORITY;
            }

            stage099 = "CERTIFICATION";
            JSONObject key =
                payload.getJSONObject("branchCertificationKeyMaterial");

            FinoraBranchCertificationCryptoValidator.Material certification =
                new FinoraBranchCertificationCryptoValidator.Material(
                    key.getString("keyId"),
                    key.getString("algorithm"),
                    key.getString("publicKeyFormat"),
                    key.getString("publicKey"),
                    key.getString("fingerprintAlgorithm"),
                    key.getString("publicKeyFingerprint"),
                    key.getString("createdAt"),
                    key.getInt("schemaVersion"),
                    key.getString("privateKeyFormat"),
                    key.getString("privateKey"),
                    key.getInt("vaultSchemaVersion")
                );

            FinoraBranchCertificationCryptoValidator.assertValid(certification);

            stage099 = "RUNTIME_BUILD";
            JSONObject runtimePayload =
                FinoraServerFirstLoginRuntimePayloadBuilder.build(
                    server,
                    canonical,
                    account.getName(),
                    artifact.portableAuthFingerprint
                );

            stage099 = "RUNTIME_SIGN";
            String signedRuntime =
                FinoraServerFirstLoginRuntimeAuthoritySigner.sign(
                    runtimePayload, certification
                );

            // Verify the complete original USB/signed Runtime pair
            // BEFORE any new file is written.
            stage099 = "PAIR_VERIFICATION";
            FinoraServerFirstLoginV2RecoveryVerificationGate.VerifiedPair pair =
                FinoraServerFirstLoginV2RecoveryVerificationGate.verify(
                    artifact.serializedEnvelope,
                    canonical,
                    password,
                    securityCode,
                    signedRuntime
                );

            if (
                pair == null ||
                !artifact.portableAuthFingerprint.equals(
                    pair.portableAuthFingerprint
                )
            ) {
                return Status.SIGNATURE_OR_SCOPE_FAILED;
            }

            // Recheck the precise USB bytes before committing.
            stage099 = "USB_CONFIRMATION";
            FinoraPortableBranchAuthV2UsbReader.Artifact confirmation =
                new FinoraPortableBranchAuthV2UsbReader(context)
                    .readExistingArtifact(canonical);

            if (!MessageDigest.isEqual(
                artifact.serializedEnvelope.getBytes(StandardCharsets.UTF_8),
                confirmation.serializedEnvelope.getBytes(StandardCharsets.UTF_8)
            )) {
                return Status.INVALID_USB_AUTH;
            }

            stage099 = "RUNTIME_WRITE";
            FinoraServerFirstLoginRuntimeAuthorityUsbStore.Status written =
                FinoraServerFirstLoginRuntimeAuthorityUsbStore.writeNew(
                    context.getContentResolver(),
                    account,
                    canonical,
                    signedRuntime
                );

            if (
                written ==
                FinoraServerFirstLoginRuntimeAuthorityUsbStore.Status.CONFLICT
            ) {
                return Status.EXISTING_RUNTIME_CONFLICT;
            }

            return written ==
                FinoraServerFirstLoginRuntimeAuthorityUsbStore.Status.WRITTEN
                    ? Status.WRITTEN
                    : Status.WRITE_FAILED;

        } catch (Exception error) {
            // Return only stage identifiers; never raw exceptions or secrets.
            return Status.valueOf("FAILED_AT_" + stage099);
        } finally {
            if (passwordBytes != null) {
                Arrays.fill(passwordBytes, (byte) 0);
            }
            if (recoveryBytes != null) {
                Arrays.fill(recoveryBytes, (byte) 0);
            }
        }
    }
}