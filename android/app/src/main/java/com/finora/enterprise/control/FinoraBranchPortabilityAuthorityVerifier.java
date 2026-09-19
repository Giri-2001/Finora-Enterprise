package com.finora.enterprise.control;

import java.time.Instant;
import java.util.Collections;
import java.util.Map;

/**
 * Current-time verifier for the signed Branch Portability
 * Authority proof carried inside authenticated Portable Branch
 * Auth state.
 *
 * Security boundary:
 * - input must already come from authenticated Portable Branch
 *   Auth decryption/parsing;
 * - portabilityAuthorityProof is mandatory for fresh-device
 *   authorization;
 * - the exact Control Center signer embedded in the authenticated
 *   evidence is the only trusted key supplied to the generic
 *   signed-package verifier;
 * - exact user / branch / storage / data-context lineage is
 *   required;
 * - no secret-factor handling;
 * - no storage or Device Trust mutation.
 */
public final class FinoraBranchPortabilityAuthorityVerifier {

    private static final String
        SOURCE_AUTHORIZATION_METHOD =
            "SET_PASSWORD_ON_RECIPIENT";

    private FinoraBranchPortabilityAuthorityVerifier() {
    }

    public static boolean verify(
        FinoraPortableBranchAuthPayloadCodec.Payload portablePayload,
        Instant now
    ) {

        if (portablePayload == null) {
            return false;
        }

        return verifyValues(
            portablePayload.schemaVersion,
            portablePayload.sourceAuthorizationId,
            portablePayload.sourceAuthorizationVerificationEvidence,
            portablePayload.userId,
            portablePayload.username,
            portablePayload.role,
            portablePayload.ownerId,
            portablePayload.businessId,
            portablePayload.branchId,
            portablePayload.storageMode,
            portablePayload.dataContext,
            portablePayload.demoId,
            now
        );
    }

    public static boolean verify(
        FinoraBranchDeviceTrustAuthorizationAuthority
            .AuthenticatedPortableState state,
        Instant now
    ) {

        if (state == null) {
            return false;
        }

        return verifyValues(
            state.portableAuthSchemaVersion,
            state.sourceAuthorizationId,
            state.sourceAuthorizationVerificationEvidence,
            state.userId,
            state.username,
            state.role,
            state.ownerId,
            state.businessId,
            state.branchId,
            state.storageMode,
            state.dataContext,
            state.demoId,
            now
        );
    }

    private static boolean verifyValues(
        int portableAuthSchemaVersion,
        String sourceAuthorizationId,
        FinoraPortableBranchAuthPayloadCodec
            .SourceAuthorizationEvidence sourceEvidence,
        String userId,
        String username,
        String role,
        String ownerId,
        String businessId,
        String branchId,
        String storageMode,
        String dataContext,
        String demoId,
        Instant now
    ) {

        if (
            now == null ||
            sourceEvidence == null ||
            sourceEvidence.portabilityAuthorityProof == null
        ) {
            return false;
        }

        try {

            FinoraPortableBranchAuthPayloadCodec
                .PortabilityAuthorityProof proof =
                    sourceEvidence
                        .portabilityAuthorityProof;

            FinoraPortableBranchAuthPayloadCodec
                .SignedPortabilityAuthorityPackage signedPackage =
                    proof
                        .signedPortabilityAuthorityPackage;

            FinoraPortableBranchAuthPayloadCodec
                .VerifiedControlSigner sourceSigner =
                    sourceEvidence
                        .verifiedControlSigner;

            FinoraPortableBranchAuthPayloadCodec
                .VerifiedControlSigner pinnedSigner =
                    proof
                        .verifiedControlSigner;

            if (
                signedPackage == null ||
                signedPackage.issuer == null ||
                signedPackage.target == null ||
                signedPackage.payload == null ||
                signedPackage.payloadDigest == null ||
                signedPackage.signature == null ||
                sourceSigner == null ||
                pinnedSigner == null
            ) {
                return false;
            }

            if (
                portableAuthSchemaVersion != 1 ||
                sourceEvidence.schemaVersion != 1 ||
                proof.schemaVersion != 1 ||
                signedPackage.schemaVersion != 1 ||
                signedPackage.payloadVersion != 1 ||
                signedPackage.payload.schemaVersion != 1
            ) {
                return false;
            }

            if (
                !sameSigner(
                    sourceSigner,
                    pinnedSigner
                )
            ) {
                return false;
            }

            if (
                !same(
                    sourceAuthorizationId,
                    sourceEvidence.authorizationId
                ) ||
                !same(
                    sourceEvidence.authorizationId,
                    proof.sourceAuthorizationId
                ) ||
                !same(
                    proof.sourceAuthorizationId,
                    signedPackage
                        .payload
                        .sourceAuthorizationId
                )
            ) {
                return false;
            }

            if (
                !same(
                    sourceEvidence.issuerId,
                    sourceSigner.issuerId
                ) ||
                !same(
                    sourceSigner.issuerId,
                    signedPackage.issuer.issuerId
                ) ||
                !same(
                    sourceSigner.signingKeyId,
                    signedPackage.issuer.signingKeyId
                ) ||
                !same(
                    sourceSigner.signingKeyId,
                    signedPackage.signature.signingKeyId
                )
            ) {
                return false;
            }

            if (
                !same(
                    sourceEvidence.verifiedAt,
                    proof.verifiedAt
                )
            ) {
                return false;
            }

            FinoraPortableBranchAuthPayloadCodec.PortabilityPayload
                authorityPayload =
                    signedPackage.payload;

            if (
                !same(
                    userId,
                    authorityPayload.userId
                ) ||
                !same(
                    username,
                    authorityPayload.username
                ) ||
                !same(
                    role,
                    authorityPayload.role
                ) ||
                !same(
                    ownerId,
                    authorityPayload.ownerId
                ) ||
                !same(
                    businessId,
                    authorityPayload.businessId
                ) ||
                !same(
                    branchId,
                    authorityPayload.branchId
                ) ||
                !same(
                    storageMode,
                    authorityPayload.storageMode
                ) ||
                !same(
                    dataContext,
                    authorityPayload.dataContext
                ) ||
                !sameNullable(
                    demoId,
                    authorityPayload.demoId
                ) ||
                !SOURCE_AUTHORIZATION_METHOD.equals(
                    authorityPayload.sourceAuthorizationMethod
                )
            ) {
                return false;
            }

            if (
                !same(
                    ownerId,
                    signedPackage.target.ownerId
                ) ||
                !same(
                    businessId,
                    signedPackage.target.businessId
                ) ||
                !same(
                    branchId,
                    signedPackage.target.branchId
                )
            ) {
                return false;
            }

            Map<String, Object> controlPackage =
                FinoraBranchPortabilityAuthorityBridge
                    .toControlPackage(
                        signedPackage
                    );

            FinoraSignedControlPackageVerifier.TrustedKey
                trustedKey =
                    FinoraBranchPortabilityAuthorityBridge
                        .toTrustedKey(
                            pinnedSigner
                        );

            FinoraSignedControlPackageVerifier.Result result =
                FinoraSignedControlPackageVerifier
                    .verifyBranchScope(
                        controlPackage,
                        Collections.singletonList(
                            trustedKey
                        ),
                        ownerId,
                        businessId,
                        branchId,
                        now
                    );

            return (
                result != null &&
                result.valid
            );

        } catch (RuntimeException error) {

            return false;
        }
    }

    private static boolean sameSigner(
        FinoraPortableBranchAuthPayloadCodec.VerifiedControlSigner left,
        FinoraPortableBranchAuthPayloadCodec.VerifiedControlSigner right
    ) {

        if (
            left == null ||
            right == null
        ) {
            return false;
        }

        return (
            same(
                left.issuerId,
                right.issuerId
            ) &&
            same(
                left.signingKeyId,
                right.signingKeyId
            ) &&
            same(
                left.algorithm,
                right.algorithm
            ) &&
            same(
                left.format,
                right.format
            ) &&
            same(
                left.publicKey,
                right.publicKey
            ) &&
            same(
                left.status,
                right.status
            ) &&
            same(
                left.validFrom,
                right.validFrom
            ) &&
            sameNullable(
                left.validUntil,
                right.validUntil
            )
        );
    }

    private static boolean same(
        String left,
        String right
    ) {

        return (
            left != null &&
            right != null &&
            left.equals(
                right
            )
        );
    }

    private static boolean sameNullable(
        String left,
        String right
    ) {

        if (left == null) {
            return right == null;
        }

        return left.equals(
            right
        );
    }
}