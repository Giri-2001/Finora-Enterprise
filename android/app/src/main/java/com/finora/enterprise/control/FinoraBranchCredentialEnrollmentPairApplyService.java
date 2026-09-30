package com.finora.enterprise.control;

import org.json.JSONObject;

import java.lang.reflect.Field;

import java.time.Instant;

import java.util.List;
import java.util.Map;

/**
 * FINORA one-file Branch Credential Enrollment pair apply.
 *
 * Security:
 * - BRANCH_ACCESS is verified against the exact installation target.
 * - BRANCH_PORTABILITY_AUTHORITY is verified against branch scope only.
 * - both children must resolve to the exact same trusted Control Center key.
 * - source authorization / user / branch / storage lineage must match.
 * - no proof is synthesized.
 * - only after all verification succeeds is Branch Access applied once,
 *   with the verified portability proof persisted in the same Control Store
 *   mutation.
 */
final class FinoraBranchCredentialEnrollmentPairApplyService {

    static final class Result {

        final boolean success;
        final String error;
        final String packageId;
        final Long sequence;

        private Result(
            boolean success,
            String error,
            String packageId,
            Long sequence
        ) {
            this.success = success;
            this.error = error;
            this.packageId = packageId;
            this.sequence = sequence;
        }

        static Result success(
            String packageId,
            Long sequence
        ) {
            return new Result(
                true,
                null,
                packageId,
                sequence
            );
        }

        static Result failure(
            String error
        ) {
            return new Result(
                false,
                error,
                null,
                null
            );
        }
    }

    private final FinoraBranchAccessPackageApplyService
        branchAccessService;

    FinoraBranchCredentialEnrollmentPairApplyService(
        FinoraBranchAccessPackageApplyService branchAccessService
    ) {

        if (branchAccessService == null) {
            throw new IllegalArgumentException(
                "FINORA Branch Access apply service is required."
            );
        }

        this.branchAccessService =
            branchAccessService;
    }

    Result apply(
        JSONObject branchAccessPackage,
        JSONObject portabilityAuthorityPackage,
        List<FinoraSignedControlPackageVerifier.TrustedKey> trustedKeys,
        FinoraSignedControlPackageVerifier.Target exactTarget,
        Instant now
    ) {

        if (
            branchAccessPackage == null ||
            portabilityAuthorityPackage == null ||
            trustedKeys == null ||
            exactTarget == null ||
            now == null
        ) {
            return Result.failure(
                "FINORA credential enrollment pair input is incomplete."
            );
        }

        try {

            Map<String, Object> branchMap =
                FinoraJsonBridge.toMap(
                    branchAccessPackage
                );

            FinoraSignedControlPackageVerifier.Result
                branchVerification =
                    FinoraSignedControlPackageVerifier.verify(
                        branchMap,
                        trustedKeys,
                        exactTarget,
                        now
                    );

            if (
                branchVerification == null ||
                !branchVerification.valid
            ) {
                return Result.failure(
                    "FINORA BRANCH_ACCESS verification failed: " +
                    verificationError(
                        branchVerification
                    )
                );
            }

            if (
                !"BRANCH_ACCESS".equals(
                    branchAccessPackage.optString(
                        "purpose",
                        null
                    )
                )
            ) {
                return Result.failure(
                    "FINORA credential enrollment pair Branch Access purpose is invalid."
                );
            }

            Map<String, Object> portabilityMap =
                FinoraJsonBridge.toMap(
                    portabilityAuthorityPackage
                );

            FinoraSignedControlPackageVerifier.Result
                portabilityVerification =
                    FinoraSignedControlPackageVerifier
                        .verifyBranchScope(
                            portabilityMap,
                            trustedKeys,
                            exactTarget.ownerId,
                            exactTarget.businessId,
                            exactTarget.branchId,
                            now
                        );

            if (
                portabilityVerification == null ||
                !portabilityVerification.valid
            ) {
                return Result.failure(
                    "FINORA BRANCH_PORTABILITY_AUTHORITY verification failed: " +
                    verificationError(
                        portabilityVerification
                    )
                );
            }

            JSONObject branchIssuer =
                branchAccessPackage.optJSONObject(
                    "issuer"
                );

            JSONObject portabilityIssuer =
                portabilityAuthorityPackage.optJSONObject(
                    "issuer"
                );

            if (
                branchIssuer == null ||
                portabilityIssuer == null
            ) {
                return Result.failure(
                    "FINORA credential enrollment pair issuer evidence is missing."
                );
            }

            String branchIssuerId =
                required(
                    branchIssuer,
                    "issuerId"
                );

            String branchSigningKeyId =
                required(
                    branchIssuer,
                    "signingKeyId"
                );

            String portabilityIssuerId =
                required(
                    portabilityIssuer,
                    "issuerId"
                );

            String portabilitySigningKeyId =
                required(
                    portabilityIssuer,
                    "signingKeyId"
                );

            if (
                !branchIssuerId.equals(
                    portabilityIssuerId
                ) ||
                !branchSigningKeyId.equals(
                    portabilitySigningKeyId
                )
            ) {
                return Result.failure(
                    "FINORA credential enrollment pair children were not issued by the same Control Center signing key."
                );
            }

            FinoraSignedControlPackageVerifier.TrustedKey
                verifiedSigner =
                    findTrustedKey(
                        trustedKeys,
                        branchIssuerId,
                        branchSigningKeyId
                    );

            if (verifiedSigner == null) {
                return Result.failure(
                    "FINORA credential enrollment pair verified signer evidence is unavailable."
                );
            }

            JSONObject verifiedSignerJson =
                trustedKeyJson(
                    verifiedSigner
                );

            if (verifiedSignerJson == null) {
                return Result.failure(
                    "FINORA credential enrollment pair verified signer evidence is invalid."
                );
            }

            JSONObject branchPayload =
                branchAccessPackage.optJSONObject(
                    "payload"
                );

            JSONObject portabilityPayload =
                portabilityAuthorityPackage.optJSONObject(
                    "payload"
                );

            if (
                branchPayload == null ||
                portabilityPayload == null
            ) {
                return Result.failure(
                    "FINORA credential enrollment pair payload is missing."
                );
            }

            JSONObject credentialEnrollment =
                branchPayload.optJSONObject(
                    "credentialEnrollment"
                );

            if (credentialEnrollment == null) {
                return Result.failure(
                    "FINORA BRANCH_ACCESS credential enrollment authorization is missing."
                );
            }

            String authorizationId =
                required(
                    credentialEnrollment,
                    "authorizationId"
                );

            String portabilityAuthorizationId =
                required(
                    portabilityPayload,
                    "sourceAuthorizationId"
                );

            if (
                !authorizationId.equals(
                    portabilityAuthorizationId
                )
            ) {
                return Result.failure(
                    "FINORA credential enrollment pair source authorization does not match."
                );
            }

            if (
                !"SET_PASSWORD_ON_RECIPIENT".equals(
                    credentialEnrollment.optString(
                        "method",
                        null
                    )
                ) ||
                !"SET_PASSWORD_ON_RECIPIENT".equals(
                    portabilityPayload.optString(
                        "sourceAuthorizationMethod",
                        null
                    )
                )
            ) {
                return Result.failure(
                    "FINORA credential enrollment pair authorization method is invalid."
                );
            }

            if (
                !same(
                    credentialEnrollment,
                    portabilityPayload,
                    "userId"
                ) ||
                !same(
                    credentialEnrollment,
                    portabilityPayload,
                    "username"
                ) ||
                !same(
                    credentialEnrollment,
                    portabilityPayload,
                    "role"
                ) ||
                !same(
                    credentialEnrollment,
                    portabilityPayload,
                    "ownerId"
                ) ||
                !same(
                    credentialEnrollment,
                    portabilityPayload,
                    "businessId"
                ) ||
                !same(
                    credentialEnrollment,
                    portabilityPayload,
                    "branchId"
                ) ||
                !same(
                    credentialEnrollment,
                    portabilityPayload,
                    "storageMode"
                ) ||
                !same(
                    credentialEnrollment,
                    portabilityPayload,
                    "dataContext"
                )
            ) {
                return Result.failure(
                    "FINORA credential enrollment pair identity or scope does not match."
                );
            }

            if (
                !exactTarget.ownerId.equals(
                    credentialEnrollment.optString(
                        "ownerId",
                        null
                    )
                ) ||
                !exactTarget.businessId.equals(
                    credentialEnrollment.optString(
                        "businessId",
                        null
                    )
                ) ||
                !exactTarget.branchId.equals(
                    credentialEnrollment.optString(
                        "branchId",
                        null
                    )
                )
            ) {
                return Result.failure(
                    "FINORA credential enrollment pair does not match the installed branch scope."
                );
            }

            JSONObject portabilityProof =
                new JSONObject();

            portabilityProof.put(
                "sourceAuthorizationId",
                authorizationId
            );

            portabilityProof.put(
                "signedPortabilityAuthorityPackage",
                new JSONObject(
                    portabilityAuthorityPackage.toString()
                )
            );

            portabilityProof.put(
                "verifiedControlSigner",
                verifiedSignerJson
            );

            portabilityProof.put(
                "verifiedAt",
                now.toString()
            );

            portabilityProof.put(
                "schemaVersion",
                1
            );

            FinoraBranchAccessPackageApplyService.ApplyResult
                applyResult =
                    branchAccessService
                        .applyWithVerifiedPortabilityAuthority(
                            branchAccessPackage,
                            trustedKeys,
                            now,
                            portabilityProof
                        );

            if (
                applyResult == null ||
                !applyResult.success
            ) {
                return Result.failure(
                    applyResult != null &&
                    applyResult.error != null
                        ? applyResult.error
                        : "FINORA credential enrollment Branch Access apply failed."
                );
            }

            return Result.success(
                applyResult.packageId,
                applyResult.sequence
            );

        } catch (Exception error) {

            return Result.failure(
                error.getMessage() != null
                    ? error.getMessage()
                    : "FINORA credential enrollment pair apply failed."
            );
        }
    }

    private static boolean same(
        JSONObject left,
        JSONObject right,
        String key
    ) throws Exception {

        return required(
            left,
            key
        ).equals(
            required(
                right,
                key
            )
        );
    }

    private static String required(
        JSONObject object,
        String key
    ) throws Exception {

        if (
            object == null ||
            key == null
        ) {
            throw new IllegalArgumentException(
                "FINORA required credential enrollment property is missing."
            );
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
            throw new IllegalArgumentException(
                "FINORA required credential enrollment property is invalid: " +
                key
            );
        }

        return value;
    }

    private static FinoraSignedControlPackageVerifier.TrustedKey
        findTrustedKey(
            List<FinoraSignedControlPackageVerifier.TrustedKey> keys,
            String issuerId,
            String signingKeyId
        ) {

        if (
            keys == null ||
            issuerId == null ||
            signingKeyId == null
        ) {
            return null;
        }

        for (
            FinoraSignedControlPackageVerifier.TrustedKey key :
            keys
        ) {

            if (
                issuerId.equals(
                    reflectedString(
                        key,
                        "issuerId"
                    )
                ) &&
                signingKeyId.equals(
                    reflectedString(
                        key,
                        "signingKeyId"
                    )
                )
            ) {
                return key;
            }
        }

        return null;
    }

    private static JSONObject trustedKeyJson(
        Object trustedKey
    ) {

        try {

            JSONObject result =
                new JSONObject();

            String[] requiredFields = {
                "issuerId",
                "signingKeyId",
                "algorithm",
                "format",
                "publicKey",
                "status",
                "validFrom"
            };

            for (
                String field :
                requiredFields
            ) {

                String value =
                    reflectedString(
                        trustedKey,
                        field
                    );

                if (
                    value == null ||
                    value.trim().isEmpty()
                ) {
                    return null;
                }

                result.put(
                    field,
                    value
                );
            }

            String validUntil =
                reflectedString(
                    trustedKey,
                    "validUntil"
                );

            if (
                validUntil != null &&
                !validUntil.trim().isEmpty()
            ) {
                result.put(
                    "validUntil",
                    validUntil
                );
            }

            return result;

        } catch (Exception error) {
            return null;
        }
    }

    private static String reflectedString(
        Object object,
        String fieldName
    ) {

        if (object == null) {
            return null;
        }

        try {

            Field field =
                object
                    .getClass()
                    .getDeclaredField(
                        fieldName
                    );

            field.setAccessible(
                true
            );

            Object value =
                field.get(
                    object
                );

            return value instanceof String
                ? (String) value
                : null;

        } catch (Exception error) {
            return null;
        }
    }

    private static String verificationError(
        FinoraSignedControlPackageVerifier.Result result
    ) {

        if (result == null) {
            return "VERIFICATION_FAILED: no verification result.";
        }

        return (
            (
                result.reason != null
                    ? result.reason
                    : "VERIFICATION_FAILED"
            ) +
            ": " +
            (
                result.error != null
                    ? result.error
                    : "FINORA signed package verification failed."
            )
        );
    }
}
