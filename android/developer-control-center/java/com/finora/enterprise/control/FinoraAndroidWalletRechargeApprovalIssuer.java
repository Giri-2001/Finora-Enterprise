package com.finora.enterprise.control;

import android.util.Base64;

import org.json.JSONArray;
import org.json.JSONObject;

import java.nio.charset.StandardCharsets;
import java.security.KeyFactory;
import java.security.MessageDigest;
import java.security.PrivateKey;
import java.security.Signature;
import java.security.interfaces.ECPrivateKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;


/**
 * FINORA Android Developer Control Center
 * verified Wallet Recharge approval issuer.
 *
 * SECURITY:
 * - no renderer target / amount / payment authority
 * - exact Branch Registry target is re-authorized at signing time
 * - child and outer package reservations persist before signing
 * - Control Center private key remains native-only
 * - signed child and signed outer bundle use independent sequence lanes
 */
final class FinoraAndroidWalletRechargeApprovalIssuer {

    static final class ApprovalResult {

        final JSONObject signedBundle;
        final byte[] serializedBytes;
        final String controlBundlePackageId;
        final String decisionAt;

        ApprovalResult(
            JSONObject signedBundle,
            byte[] serializedBytes,
            String controlBundlePackageId,
            String decisionAt
        ) {

            this.signedBundle =
                signedBundle;

            this.serializedBytes =
                serializedBytes;

            this.controlBundlePackageId =
                controlBundlePackageId;

            this.decisionAt =
                decisionAt;
        }
    }


    static final class DeclineResult {

        final JSONObject signedBundle;
        final byte[] serializedBytes;
        final String controlBundlePackageId;
        final String decisionAt;

        DeclineResult(
            JSONObject signedBundle,
            byte[] serializedBytes,
            String controlBundlePackageId,
            String decisionAt
        ) {

            this.signedBundle =
                signedBundle;

            this.serializedBytes =
                serializedBytes;

            this.controlBundlePackageId =
                controlBundlePackageId;

            this.decisionAt =
                decisionAt;
        }
    }

    private static final String SIGNATURE_ALGORITHM =
        "ECDSA_P256_SHA256";

    private static final String SIGNATURE_ENCODING =
        "IEEE_P1363";

    private static final String CANONICALIZATION =
        "FINORA_CANONICAL_JSON_V1";


    private FinoraAndroidWalletRechargeApprovalIssuer() {
    }


    static ApprovalResult issue(
        android.content.Context context,
        FinoraAndroidWalletRechargeRequestVerifier.VerifiedRequest request,
        FinoraPortableStateAuthorityStore.Snapshot portableSnapshot,
        String issuerId,
        String signingKeyId,
        String privateKeyPkcs8DerBase64
    ) throws Exception {

        if (
            context == null ||
            request == null ||
            portableSnapshot == null
        ) {
            throw new IllegalArgumentException(
                "FINORA Wallet Recharge approval authority is incomplete."
            );
        }

        requireText(
            issuerId,
            "issuerId"
        );

        requireText(
            signingKeyId,
            "signingKeyId"
        );

        requireText(
            privateKeyPkcs8DerBase64,
            "private signing key"
        );


        reauthorizeCurrentRegistryTarget(
            request,
            portableSnapshot,
            request.portableV2
        );


        FinoraAndroidControlCenterIssuanceAuthorityStore issuanceStore =
            new FinoraAndroidControlCenterIssuanceAuthorityStore(
                context
            );


        Map<String, Object> target =
            createTarget(
                request
            );


        // ====================================================
        // WALLET_RECHARGE CHILD
        // ====================================================

        FinoraAndroidControlCenterIssuanceAuthorityStore.Reservation
            walletReservation =
                issuanceStore.reserve(
                    issuerId,
                    "WALLET_RECHARGE",
                    request.ownerId,
                    request.businessId,
                    request.branchId,
                    request.installationId,
                    portableSnapshot
                );


        Map<String, Object> scope =
            new LinkedHashMap<>();

        scope.put(
            "ownerId",
            request.ownerId
        );

        scope.put(
            "businessId",
            request.businessId
        );

        scope.put(
            "branchId",
            request.branchId
        );


        Map<String, Object> installationBinding =
            new LinkedHashMap<>();

        installationBinding.put(
            "installationId",
            request.installationId
        );

        installationBinding.put(
            "bindingKeyId",
            request.bindingKeyId
        );

        installationBinding.put(
            "fingerprintAlgorithm",
            "SHA-256"
        );

        installationBinding.put(
            "publicKeyFingerprint",
            request.publicKeyFingerprint
        );

        installationBinding.put(
            "schemaVersion",
            1L
        );


        Map<String, Object> walletPayload =
            new LinkedHashMap<>();

        walletPayload.put(
            "scope",
            scope
        );

        walletPayload.put(
            "installationBinding",
            installationBinding
        );

        walletPayload.put(
            "paymentReference",
            request.paymentReference
        );

        walletPayload.put(
            "amountMinor",
            request.amountMinor
        );

        walletPayload.put(
            "currency",
            "INR"
        );

        walletPayload.put(
            "paymentMethod",
            request.paymentMethod
        );

        walletPayload.put(
            "paymentSource",
            request.paymentSource
        );

        walletPayload.put(
            "issuedAt",
            walletReservation.issuedAt
        );

        walletPayload.put(
            "schemaVersion",
            1L
        );


        Map<String, Object> signedWalletRecharge =
            signPackage(
                walletReservation.packageId,
                "WALLET_RECHARGE",
                target,
                walletReservation.issuedAt,
                walletReservation.sequence,
                walletPayload,
                issuerId,
                signingKeyId,
                privateKeyPkcs8DerBase64
            );


        // ====================================================
        // CONTROL_BUNDLE OUTER
        // ====================================================

        FinoraAndroidControlCenterIssuanceAuthorityStore.Reservation
            bundleReservation =
                issuanceStore.reserve(
                    issuerId,
                    "CONTROL_BUNDLE",
                    request.ownerId,
                    request.businessId,
                    request.branchId,
                    request.installationId,
                    portableSnapshot
                );


        List<Object> packages =
            new ArrayList<>();

        packages.add(
            signedWalletRecharge
        );


        Map<String, Object> bundlePayload =
            new LinkedHashMap<>();

        bundlePayload.put(
            "bundleFormat",
            "FINORA_CONTROL_BUNDLE_V1"
        );

        bundlePayload.put(
            "packages",
            packages
        );

        bundlePayload.put(
            "issuedAt",
            bundleReservation.issuedAt
        );

        bundlePayload.put(
            "schemaVersion",
            1L
        );


        Map<String, Object> signedBundleMap =
            signPackage(
                bundleReservation.packageId,
                "CONTROL_BUNDLE",
                target,
                bundleReservation.issuedAt,
                bundleReservation.sequence,
                bundlePayload,
                issuerId,
                signingKeyId,
                privateKeyPkcs8DerBase64
            );


        JSONObject signedBundle =
            new JSONObject(
                signedBundleMap
            );

        byte[] serializedBytes =
            signedBundle
                .toString()
                .getBytes(
                    StandardCharsets.UTF_8
                );

        if (serializedBytes.length == 0) {
            throw new IllegalStateException(
                "FINORA signed Control Bundle serialization produced no bytes."
            );
        }


        return new ApprovalResult(
            signedBundle,
            serializedBytes,
            bundleReservation.packageId,
            bundleReservation.issuedAt
        );
    }


    // ========================================================
    // VERIFIED WALLET RECHARGE DECLINE
    // ========================================================

    static DeclineResult issueDecline(
        android.content.Context context,
        FinoraAndroidWalletRechargeRequestVerifier.VerifiedRequest request,
        FinoraPortableStateAuthorityStore.Snapshot portableSnapshot,
        String issuerId,
        String signingKeyId,
        String privateKeyPkcs8DerBase64
    ) throws Exception {

        if (
            context == null ||
            request == null ||
            portableSnapshot == null
        ) {
            throw new IllegalArgumentException(
                "FINORA Wallet Recharge decline authority is incomplete."
            );
        }


        requireText(
            issuerId,
            "issuerId"
        );

        requireText(
            signingKeyId,
            "signingKeyId"
        );

        requireText(
            privateKeyPkcs8DerBase64,
            "private signing key"
        );


        reauthorizeCurrentRegistryTarget(
            request,
            portableSnapshot,
            false
        );


        FinoraAndroidControlCenterIssuanceAuthorityStore issuanceStore =
            new FinoraAndroidControlCenterIssuanceAuthorityStore(
                context
            );


        Map<String, Object> target =
            createTarget(
                request
            );


        FinoraAndroidControlCenterIssuanceAuthorityStore.Reservation
            declineReservation =
                issuanceStore.reserve(
                    issuerId,
                    "WALLET_RECHARGE_DECLINE",
                    request.ownerId,
                    request.businessId,
                    request.branchId,
                    request.installationId,
                    portableSnapshot
                );


        Map<String, Object> scope =
            new LinkedHashMap<>();

        scope.put(
            "ownerId",
            request.ownerId
        );

        scope.put(
            "businessId",
            request.businessId
        );

        scope.put(
            "branchId",
            request.branchId
        );


        Map<String, Object> installationBinding =
            new LinkedHashMap<>();

        installationBinding.put(
            "installationId",
            request.installationId
        );

        installationBinding.put(
            "bindingKeyId",
            request.bindingKeyId
        );

        installationBinding.put(
            "fingerprintAlgorithm",
            "SHA-256"
        );

        installationBinding.put(
            "publicKeyFingerprint",
            request.publicKeyFingerprint
        );

        installationBinding.put(
            "schemaVersion",
            1L
        );


        Map<String, Object> declinePayload =
            new LinkedHashMap<>();

        declinePayload.put(
            "schemaVersion",
            1L
        );

        declinePayload.put(
            "outcome",
            "DECLINED"
        );

        declinePayload.put(
            "requestId",
            request.requestId
        );

        declinePayload.put(
            "paymentReference",
            request.paymentReference
        );

        declinePayload.put(
            "amountMinor",
            request.amountMinor
        );

        declinePayload.put(
            "currency",
            "INR"
        );

        declinePayload.put(
            "paymentMethod",
            request.paymentMethod
        );

        declinePayload.put(
            "paymentSource",
            request.paymentSource
        );

        declinePayload.put(
            "requestedAt",
            request.requestedAt
        );

        declinePayload.put(
            "scope",
            scope
        );

        declinePayload.put(
            "installationBinding",
            installationBinding
        );

        declinePayload.put(
            "issuedAt",
            declineReservation.issuedAt
        );


        Map<String, Object> signedDecline =
            signPackage(
                declineReservation.packageId,
                "WALLET_RECHARGE_DECLINE",
                target,
                declineReservation.issuedAt,
                declineReservation.sequence,
                declinePayload,
                issuerId,
                signingKeyId,
                privateKeyPkcs8DerBase64
            );


        FinoraAndroidControlCenterIssuanceAuthorityStore.Reservation
            bundleReservation =
                issuanceStore.reserve(
                    issuerId,
                    "CONTROL_BUNDLE",
                    request.ownerId,
                    request.businessId,
                    request.branchId,
                    request.installationId,
                    portableSnapshot
                );


        List<Object> packages =
            new ArrayList<>();

        packages.add(
            signedDecline
        );


        Map<String, Object> bundlePayload =
            new LinkedHashMap<>();

        bundlePayload.put(
            "bundleFormat",
            "FINORA_CONTROL_BUNDLE_V1"
        );

        bundlePayload.put(
            "packages",
            packages
        );

        bundlePayload.put(
            "issuedAt",
            bundleReservation.issuedAt
        );

        bundlePayload.put(
            "schemaVersion",
            1L
        );


        Map<String, Object> signedBundleMap =
            signPackage(
                bundleReservation.packageId,
                "CONTROL_BUNDLE",
                target,
                bundleReservation.issuedAt,
                bundleReservation.sequence,
                bundlePayload,
                issuerId,
                signingKeyId,
                privateKeyPkcs8DerBase64
            );


        JSONObject signedBundle =
            new JSONObject(
                signedBundleMap
            );


        byte[] serializedBytes =
            signedBundle
                .toString()
                .getBytes(
                    StandardCharsets.UTF_8
                );


        if (serializedBytes.length == 0) {
            throw new IllegalStateException(
                "FINORA signed Wallet Recharge decline Control Bundle serialization produced no bytes."
            );
        }


        return new DeclineResult(
            signedBundle,
            serializedBytes,
            bundleReservation.packageId,
            bundleReservation.issuedAt
        );
    }

    // ========================================================
    // CURRENT BRANCH REGISTRY RE-AUTHORIZATION
    // ========================================================

    private static void reauthorizeCurrentRegistryTarget(
        FinoraAndroidWalletRechargeRequestVerifier.VerifiedRequest request,
        FinoraPortableStateAuthorityStore.Snapshot portableSnapshot,
        boolean allowPortableV2CurrentDevice
    ) throws Exception {

        Object registryValue =
            portableSnapshot.payload.opt(
                "branchRegistry"
            );

        if (!(registryValue instanceof JSONObject)) {
            throw new IllegalStateException(
                "FINORA Control Center refused Wallet approval because the authoritative Branch Registry is unavailable."
            );
        }


        JSONObject registry =
            (JSONObject) registryValue;

        JSONArray branches =
            registry.optJSONArray(
                "branches"
            );

        if (branches == null) {
            throw new IllegalStateException(
                "FINORA Control Center refused Wallet approval because Branch Registry records are unavailable."
            );
        }


        JSONObject matchedIdentity =
            null;


        for (
            int index = 0;
            index < branches.length();
            index++
        ) {

            JSONObject record =
                branches.optJSONObject(
                    index
                );

            if (record == null) {
                throw new IllegalStateException(
                    "FINORA Branch Registry contains an invalid branch record."
                );
            }


            JSONObject identity =
                record.optJSONObject(
                    "identity"
                );

            if (identity == null) {
                throw new IllegalStateException(
                    "FINORA Branch Registry contains an invalid branch identity."
                );
            }


            if (
                request.ownerId.equals(
                    identity.optString(
                        "ownerId",
                        null
                    )
                ) &&
                request.businessId.equals(
                    identity.optString(
                        "businessId",
                        null
                    )
                ) &&
                request.branchId.equals(
                    identity.optString(
                        "branchId",
                        null
                    )
                )
            ) {

                if (matchedIdentity != null) {
                    throw new IllegalStateException(
                        "FINORA Branch Registry contains duplicate Wallet approval scope."
                    );
                }

                matchedIdentity =
                    identity;
            }
        }


        if (matchedIdentity == null) {
            throw new IllegalStateException(
                "FINORA Control Center refused signed Wallet approval because the target branch is not registered."
            );
        }


        JSONObject installation =
            matchedIdentity.optJSONObject(
                "installation"
            );

        if (installation == null) {
            throw new IllegalStateException(
                "FINORA registered installation identity is unavailable."
            );
        }


        if (
            !request.ownerId.equals(
                matchedIdentity.optString(
                    "ownerId",
                    null
                )
            ) ||
            !request.businessId.equals(
                matchedIdentity.optString(
                    "businessId",
                    null
                )
            ) ||
            !request.branchId.equals(
                matchedIdentity.optString(
                    "branchId",
                    null
                )
            ) ||
            (
                !allowPortableV2CurrentDevice &&
                (
            !request.installationId.equals(
                installation.optString(
                    "installationId",
                    null
                )
            ) ||
            !request.bindingKeyId.equals(
                installation.optString(
                    "bindingKeyId",
                    null
                )
            ) ||
            !"SHA-256".equals(
                installation.optString(
                    "fingerprintAlgorithm",
                    null
                )
            ) ||
            !request.publicKeyFingerprint.equals(
                installation.optString(
                    "publicKeyFingerprint",
                    null
                )
            )
                )
            )
        ) {
            throw new IllegalStateException(
                "FINORA Control Center refused signed Wallet approval because the target no longer exactly matches the authoritative Branch Registry identity."
            );
        }
    }


    // ========================================================
    // GENERIC SIGNED CONTROL PACKAGE
    // ========================================================

    private static Map<String, Object> signPackage(
        String packageId,
        String purpose,
        Map<String, Object> target,
        String issuedAt,
        long sequence,
        Map<String, Object> payload,
        String issuerId,
        String signingKeyId,
        String privateKeyPkcs8DerBase64
    ) throws Exception {

        requireText(
            packageId,
            "packageId"
        );

        requireText(
            purpose,
            "purpose"
        );

        requireText(
            issuedAt,
            "issuedAt"
        );

        if (sequence <= 0L) {
            throw new IllegalArgumentException(
                "FINORA Control Package sequence must be positive."
            );
        }


        String canonicalPayload =
            FinoraCanonicalJson.canonicalize(
                payload
            );


        MessageDigest digest =
            MessageDigest.getInstance(
                "SHA-256"
            );

        String payloadDigest =
            lowerHex(
                digest.digest(
                    canonicalPayload.getBytes(
                        StandardCharsets.UTF_8
                    )
                )
            );


        Map<String, Object> issuer =
            new LinkedHashMap<>();

        issuer.put(
            "type",
            "FINORA_CONTROL_CENTER"
        );

        issuer.put(
            "issuerId",
            issuerId
        );

        issuer.put(
            "signingKeyId",
            signingKeyId
        );


        Map<String, Object> digestRecord =
            new LinkedHashMap<>();

        digestRecord.put(
            "algorithm",
            "SHA-256"
        );

        digestRecord.put(
            "value",
            payloadDigest
        );


        Map<String, Object> unsignedPackage =
            new LinkedHashMap<>();

        unsignedPackage.put(
            "packageId",
            packageId
        );

        unsignedPackage.put(
            "purpose",
            purpose
        );

        unsignedPackage.put(
            "issuer",
            issuer
        );

        unsignedPackage.put(
            "target",
            target
        );

        unsignedPackage.put(
            "issuedAt",
            issuedAt
        );

        unsignedPackage.put(
            "sequence",
            sequence
        );

        unsignedPackage.put(
            "payloadVersion",
            1L
        );

        unsignedPackage.put(
            "payload",
            payload
        );

        unsignedPackage.put(
            "payloadDigest",
            digestRecord
        );

        unsignedPackage.put(
            "schemaVersion",
            1L
        );


        String canonicalUnsigned =
            FinoraCanonicalJson.canonicalize(
                unsignedPackage
            );


        PrivateKey privateKey =
            decodePrivateKey(
                privateKeyPkcs8DerBase64
            );


        Signature signer =
            Signature.getInstance(
                "SHA256withECDSA"
            );

        signer.initSign(
            privateKey
        );

        signer.update(
            canonicalUnsigned.getBytes(
                StandardCharsets.UTF_8
            )
        );


        byte[] derSignature =
            signer.sign();

        byte[] p1363 =
            FinoraInstallationBindingSignatureCodec
                .derToP1363(
                    derSignature,
                    32
                );


        if (p1363.length != 64) {
            throw new IllegalStateException(
                "FINORA Control Center P-256 signature did not produce a canonical 64-byte IEEE-P1363 value."
            );
        }


        Map<String, Object> signature =
            new LinkedHashMap<>();

        signature.put(
            "algorithm",
            SIGNATURE_ALGORITHM
        );

        signature.put(
            "encoding",
            SIGNATURE_ENCODING
        );

        signature.put(
            "canonicalization",
            CANONICALIZATION
        );

        signature.put(
            "signingKeyId",
            signingKeyId
        );

        signature.put(
            "value",
            Base64.encodeToString(
                p1363,
                Base64.NO_WRAP
            )
        );


        Map<String, Object> signedPackage =
            new LinkedHashMap<>(
                unsignedPackage
            );

        signedPackage.put(
            "signature",
            signature
        );

        return signedPackage;
    }


    private static PrivateKey decodePrivateKey(
        String privateKeyPkcs8DerBase64
    ) throws Exception {

        byte[] encoded;

        try {

            encoded =
                Base64.decode(
                    privateKeyPkcs8DerBase64,
                    Base64.DEFAULT
                );
        }
        catch (Exception error) {

            throw new IllegalStateException(
                "FINORA Control Center private signing key is not valid Base64."
            );
        }


        String canonical =
            Base64.encodeToString(
                encoded,
                Base64.NO_WRAP
            );


        if (
            encoded.length == 0 ||
            !canonical.equals(
                privateKeyPkcs8DerBase64
            )
        ) {
            throw new IllegalStateException(
                "FINORA Control Center private signing key is not canonical Base64."
            );
        }


        PrivateKey privateKey =
            KeyFactory.getInstance(
                "EC"
            ).generatePrivate(
                new PKCS8EncodedKeySpec(
                    encoded
                )
            );


        if (
            !(privateKey instanceof ECPrivateKey) ||
            (
                (ECPrivateKey) privateKey
            )
                .getParams()
                .getCurve()
                .getField()
                .getFieldSize() != 256
        ) {
            throw new IllegalStateException(
                "FINORA Control Center private signing key is not P-256."
            );
        }

        return privateKey;
    }


    private static Map<String, Object> createTarget(
        FinoraAndroidWalletRechargeRequestVerifier.VerifiedRequest request
    ) {

        Map<String, Object> target =
            new LinkedHashMap<>();

        target.put(
            "ownerId",
            request.ownerId
        );

        target.put(
            "businessId",
            request.businessId
        );

        target.put(
            "branchId",
            request.branchId
        );

        target.put(
            "installationId",
            request.installationId
        );

        target.put(
            "bindingKeyId",
            request.bindingKeyId
        );

        target.put(
            "fingerprintAlgorithm",
            "SHA-256"
        );

        target.put(
            "publicKeyFingerprint",
            request.publicKeyFingerprint
        );

        return target;
    }


    private static String lowerHex(
        byte[] bytes
    ) {

        final char[] alphabet =
            "0123456789abcdef"
                .toCharArray();

        char[] output =
            new char[
                bytes.length * 2
            ];

        for (
            int index = 0;
            index < bytes.length;
            index++
        ) {

            int value =
                bytes[index] &
                0xff;

            output[
                index * 2
            ] =
                alphabet[
                    value >>> 4
                ];

            output[
                index * 2 + 1
            ] =
                alphabet[
                    value & 0x0f
                ];
        }

        return new String(
            output
        );
    }


    private static void requireText(
        String value,
        String label
    ) {

        if (
            value == null ||
            value.trim().isEmpty() ||
            !value.equals(
                value.trim()
            )
        ) {
            throw new IllegalArgumentException(
                "FINORA Wallet Recharge approval " +
                label +
                " is required."
            );
        }
    }
}
