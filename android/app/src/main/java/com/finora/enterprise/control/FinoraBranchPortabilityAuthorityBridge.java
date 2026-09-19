package com.finora.enterprise.control;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Bridges the Password + Security Code authenticated typed
 * Branch Portability Authority evidence into the canonical
 * generic signed-control verifier representation.
 *
 * This class does not verify trust by itself.
 * It does not read storage, persist state, or access secrets.
 */
public final class FinoraBranchPortabilityAuthorityBridge {

    private static final String
        CANONICALIZATION =
            "FINORA_CANONICAL_JSON_V1";

    private FinoraBranchPortabilityAuthorityBridge() {
    }

    public static Map<String, Object> toControlPackage(
        FinoraPortableBranchAuthPayloadCodec
            .SignedPortabilityAuthorityPackage value
    ) {

        if (value == null) {
            throw new IllegalArgumentException(
                "FINORA Branch Portability Authority package is required."
            );
        }

        Map<String, Object> issuer =
            new LinkedHashMap<>();

        issuer.put(
            "type",
            value.issuer.type
        );

        issuer.put(
            "issuerId",
            value.issuer.issuerId
        );

        issuer.put(
            "signingKeyId",
            value.issuer.signingKeyId
        );

        Map<String, Object> target =
            new LinkedHashMap<>();

        target.put(
            "ownerId",
            value.target.ownerId
        );

        target.put(
            "businessId",
            value.target.businessId
        );

        target.put(
            "branchId",
            value.target.branchId
        );

        Map<String, Object> payload =
            new LinkedHashMap<>();

        payload.put(
            "sourceAuthorizationId",
            value.payload.sourceAuthorizationId
        );

        payload.put(
            "userId",
            value.payload.userId
        );

        payload.put(
            "username",
            value.payload.username
        );

        payload.put(
            "role",
            value.payload.role
        );

        payload.put(
            "ownerId",
            value.payload.ownerId
        );

        payload.put(
            "businessId",
            value.payload.businessId
        );

        payload.put(
            "branchId",
            value.payload.branchId
        );

        payload.put(
            "storageMode",
            value.payload.storageMode
        );

        payload.put(
            "dataContext",
            value.payload.dataContext
        );

        if (value.payload.demoId != null) {
            payload.put(
                "demoId",
                value.payload.demoId
            );
        }

        payload.put(
            "sourceAuthorizationMethod",
            value.payload.sourceAuthorizationMethod
        );

        payload.put(
            "schemaVersion",
            value.payload.schemaVersion
        );

        Map<String, Object> payloadDigest =
            new LinkedHashMap<>();

        payloadDigest.put(
            "algorithm",
            value.payloadDigest.algorithm
        );

        payloadDigest.put(
            "value",
            value.payloadDigest.value
        );

        Map<String, Object> signature =
            new LinkedHashMap<>();

        signature.put(
            "algorithm",
            value.signature.algorithm
        );

        signature.put(
            "encoding",
            value.signature.encoding
        );

        signature.put(
            "canonicalization",
            CANONICALIZATION
        );

        signature.put(
            "signingKeyId",
            value.signature.signingKeyId
        );

        signature.put(
            "value",
            value.signature.value
        );

        Map<String, Object> controlPackage =
            new LinkedHashMap<>();

        controlPackage.put(
            "schemaVersion",
            value.schemaVersion
        );

        controlPackage.put(
            "packageId",
            value.packageId
        );

        controlPackage.put(
            "purpose",
            value.purpose
        );

        controlPackage.put(
            "issuer",
            Collections.unmodifiableMap(
                issuer
            )
        );

        controlPackage.put(
            "target",
            Collections.unmodifiableMap(
                target
            )
        );

        controlPackage.put(
            "issuedAt",
            value.issuedAt
        );

        if (value.expiresAt != null) {
            controlPackage.put(
                "expiresAt",
                value.expiresAt
            );
        }

        controlPackage.put(
            "sequence",
            value.sequence
        );

        controlPackage.put(
            "payloadVersion",
            value.payloadVersion
        );

        controlPackage.put(
            "payload",
            Collections.unmodifiableMap(
                payload
            )
        );

        controlPackage.put(
            "payloadDigest",
            Collections.unmodifiableMap(
                payloadDigest
            )
        );

        controlPackage.put(
            "signature",
            Collections.unmodifiableMap(
                signature
            )
        );

        return Collections.unmodifiableMap(
            controlPackage
        );
    }

    public static FinoraSignedControlPackageVerifier.TrustedKey
        toTrustedKey(
            FinoraPortableBranchAuthPayloadCodec
                .VerifiedControlSigner signer
        ) {

        if (signer == null) {
            throw new IllegalArgumentException(
                "FINORA verified Control Center signer is required."
            );
        }

        return new FinoraSignedControlPackageVerifier.TrustedKey(
            signer.issuerId,
            signer.signingKeyId,
            signer.algorithm,
            signer.format,
            signer.publicKey,
            signer.status,
            signer.validFrom,
            signer.validUntil
        );
    }
}