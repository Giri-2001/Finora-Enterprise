package com.finora.enterprise.control;

import android.util.Base64;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.security.KeyFactory;
import java.security.MessageDigest;
import java.security.PublicKey;
import java.security.Signature;
import java.security.interfaces.ECPublicKey;
import java.security.spec.X509EncodedKeySpec;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/*
 * FINORA Android Developer Control Center
 * Wallet Recharge Request public verifier.
 *
 * SECURITY:
 * - request filename is never authority
 * - renderer provides no branch / amount / payment authority
 * - imported Portable State Branch Registry is the trust source
 * - registry SPKI public key verifies Owner installation possession
 * - no Wallet mutation
 * - no Control Center signing
 */
final class FinoraAndroidWalletRechargeRequestVerifier {

    static final int MAX_FILE_BYTES =
        64 * 1024;

    private static final long MAX_SAFE_INTEGER =
        9007199254740991L;

    private static final String REQUEST_FILE_FORMAT =
        "FINORA_WALLET_RECHARGE_REQUEST_V1";

    private static final String REQUEST_PURPOSE =
        "WALLET_RECHARGE_REQUEST";

    private static final String SIGNATURE_ALGORITHM =
        "ECDSA_P256_SHA256";

    private static final String SIGNATURE_ENCODING =
        "IEEE_P1363";

    private static final String CANONICALIZATION =
        "FINORA_CANONICAL_JSON_V1";

    private static final String FINGERPRINT_ALGORITHM =
        "SHA-256";

    private static final String PUBLIC_KEY_FORMAT =
        "SPKI_DER_BASE64";

    private static final String CURRENCY =
        "INR";

    private static final Set<String> PAYMENT_METHODS =
        new HashSet<>(
            Arrays.asList(
                "UPI",
                "PHONEPE",
                "GOOGLE_PAY",
                "PAYTM",
                "RAZORPAY",
                "BANK_TRANSFER",
                "OTHER"
            )
        );

    private static final Set<String> PAYMENT_SOURCES =
        new HashSet<>(
            Arrays.asList(
                "PHONEPE",
                "RAZORPAY",
                "UPI",
                "GOOGLE_PAY",
                "PAYTM",
                "BANK_TRANSFER",
                "MANUAL"
            )
        );


    static final class VerifiedRequest {

        final String requestId;
        final String paymentReference;

        final String ownerId;
        final String businessId;
        final String branchId;

        final String businessCode;
        final String branchCode;

        final String installationId;
        final String bindingKeyId;
        final String publicKeyFingerprint;

        final long amountMinor;
        final String paymentMethod;
        final String paymentSource;
        final String requestedAt;
        final boolean portableV2;

        private VerifiedRequest(
            String requestId,
            String paymentReference,
            String ownerId,
            String businessId,
            String branchId,
            String businessCode,
            String branchCode,
            String installationId,
            String bindingKeyId,
            String publicKeyFingerprint,
            long amountMinor,
            String paymentMethod,
            String paymentSource,
            String requestedAt,
            boolean portableV2
        ) {

            this.requestId =
                requestId;

            this.paymentReference =
                paymentReference;

            this.ownerId =
                ownerId;

            this.businessId =
                businessId;

            this.branchId =
                branchId;

            this.businessCode =
                businessCode;

            this.branchCode =
                branchCode;

            this.installationId =
                installationId;

            this.bindingKeyId =
                bindingKeyId;

            this.publicKeyFingerprint =
                publicKeyFingerprint;

            this.amountMinor =
                amountMinor;

            this.paymentMethod =
                paymentMethod;

            this.paymentSource =
                paymentSource;

            this.requestedAt =
                requestedAt;

            this.portableV2 =
                portableV2;
        }


        JSONObject toSessionJson()
            throws Exception {

            JSONObject result =
                new JSONObject();

            result.put(
                "requestId",
                requestId
            );

            result.put(
                "paymentReference",
                paymentReference
            );

            result.put(
                "ownerId",
                ownerId
            );

            result.put(
                "businessId",
                businessId
            );

            result.put(
                "branchId",
                branchId
            );

            result.put(
                "businessCode",
                businessCode
            );

            result.put(
                "branchCode",
                branchCode
            );

            result.put(
                "installationId",
                installationId
            );

            result.put(
                "bindingKeyId",
                bindingKeyId
            );

            result.put(
                "fingerprintAlgorithm",
                FINGERPRINT_ALGORITHM
            );

            result.put(
                "publicKeyFingerprint",
                publicKeyFingerprint
            );

            result.put(
                "amountMinor",
                amountMinor
            );

            result.put(
                "currency",
                CURRENCY
            );

            result.put(
                "paymentMethod",
                paymentMethod
            );

            result.put(
                "paymentSource",
                paymentSource
            );

            result.put(
                "requestedAt",
                requestedAt
            );

            result.put(
                "schemaVersion",
                1
            );

            return result;
        }
    }


    private FinoraAndroidWalletRechargeRequestVerifier() {
    }


    static VerifiedRequest verify(
        JSONObject fileEnvelope,
        JSONObject branchRegistry
    ) throws Exception {

        if (
            fileEnvelope == null ||
            branchRegistry == null
        ) {
            throw invalid(
                "FINORA Wallet Recharge Request verification input is incomplete."
            );
        }

        requireExactKeys(
            fileEnvelope,
            "format",
            "request",
            "schemaVersion"
        );

        String requestFileFormat =
            requireText(
                fileEnvelope,
                "format",
                128
            );

        long requestFileSchemaVersion =
            requireSafeInteger(
                fileEnvelope,
                "schemaVersion"
            );

        boolean historicalV1 =
            REQUEST_FILE_FORMAT.equals(
                requestFileFormat
            ) &&
            requestFileSchemaVersion == 1L;

        boolean portableV2 =
            "FINORA_WALLET_RECHARGE_REQUEST_V2".equals(
                requestFileFormat
            ) &&
            requestFileSchemaVersion == 2L;

        if (
            !historicalV1 &&
            !portableV2
        ) {
            throw invalid(
                "FINORA Wallet Recharge Request file structure is invalid or unsupported."
            );
        }

        JSONObject request =
            fileEnvelope.optJSONObject(
                "request"
            );

        if (request == null) {
            throw invalid(
                "FINORA Wallet Recharge Request signed envelope is invalid."
            );
        }

        if (portableV2) {
            requireExactKeys(
                request,
                "payload",
                "signature",
                "branchCertificationSignature",
                "schemaVersion"
            );
        }
        else {
            requireExactKeys(
                request,
                "payload",
                "signature",
                "schemaVersion"
            );
        }

        long signedRequestSchemaVersion =
            requireSafeInteger(
                request,
                "schemaVersion"
            );

        if (
            signedRequestSchemaVersion !=
                (
                    portableV2
                        ? 2L
                        : 1L
                )
        ) {
            throw invalid(
                "FINORA Wallet Recharge Request signed envelope is invalid."
            );
        }

        JSONObject payload =
            request.optJSONObject(
                "payload"
            );

        JSONObject signature =
            request.optJSONObject(
                "signature"
            );

        JSONObject branchCertificationSignature =
            portableV2
                ? request.optJSONObject(
                    "branchCertificationSignature"
                )
                : null;

        if (
            payload == null ||
            signature == null ||
            (
                portableV2 &&
                branchCertificationSignature == null
            )
        ) {
            throw invalid(
                "FINORA Wallet Recharge Request signed envelope is invalid."
            );
        }

        requireExactKeys(
            payload,
            "purpose",
            "requestId",
            "paymentReference",
            "scope",
            "displayIdentity",
            "installation",
            "amountMinor",
            "currency",
            "paymentMethod",
            "paymentSource",
            "requestedAt",
            "schemaVersion"
        );

        String purpose =
            requireText(
                payload,
                "purpose",
                128
            );

        String requestId =
            requireText(
                payload,
                "requestId",
                128
            );

        String paymentReference =
            requireText(
                payload,
                "paymentReference",
                256
            );

        long amountMinor =
            requirePositiveSafeInteger(
                payload,
                "amountMinor"
            );

        String currency =
            requireText(
                payload,
                "currency",
                16
            );

        String paymentMethod =
            requireText(
                payload,
                "paymentMethod",
                64
            );

        String paymentSource =
            requireText(
                payload,
                "paymentSource",
                64
            );

        String requestedAt =
            requireCanonicalTimestamp(
                payload,
                "requestedAt"
            );

        if (
            !REQUEST_PURPOSE.equals(
                purpose
            ) ||
            !"INR".equals(
                currency
            ) ||
            !PAYMENT_METHODS.contains(
                paymentMethod
            ) ||
            !PAYMENT_SOURCES.contains(
                paymentSource
            ) ||
            requireSafeInteger(
                payload,
                "schemaVersion"
            ) !=
                (
                    portableV2
                        ? 2L
                        : 1L
                )
        ) {
            throw invalid(
                "FINORA Wallet Recharge Request payload is invalid."
            );
        }

        JSONObject scope =
            payload.optJSONObject(
                "scope"
            );

        JSONObject displayIdentity =
            payload.optJSONObject(
                "displayIdentity"
            );

        JSONObject installation =
            payload.optJSONObject(
                "installation"
            );

        if (
            scope == null ||
            displayIdentity == null ||
            installation == null
        ) {
            throw invalid(
                "FINORA Wallet Recharge Request payload is invalid."
            );
        }

        requireExactKeys(
            scope,
            "ownerId",
            "businessId",
            "branchId"
        );

        String ownerId =
            requireText(
                scope,
                "ownerId",
                128
            );

        String businessId =
            requireText(
                scope,
                "businessId",
                128
            );

        String branchId =
            requireText(
                scope,
                "branchId",
                128
            );

        requireExactKeys(
            displayIdentity,
            "businessCode",
            "branchCode"
        );

        String businessCode =
            requireText(
                displayIdentity,
                "businessCode",
                64
            );

        String branchCode =
            requireText(
                displayIdentity,
                "branchCode",
                64
            );

        if (portableV2) {
            requireExactKeys(
                installation,
                "installationId",
                "bindingKeyId",
                "fingerprintAlgorithm",
                "publicKeyFingerprint",
                "platform",
                "algorithm",
                "publicKeyFormat",
                "publicKey",
                "createdAt",
                "schemaVersion"
            );
        }
        else {
            requireExactKeys(
                installation,
                "installationId",
                "bindingKeyId",
                "fingerprintAlgorithm",
                "publicKeyFingerprint"
            );
        }

        String installationId =
            requireText(
                installation,
                "installationId",
                256
            );

        String bindingKeyId =
            requireText(
                installation,
                "bindingKeyId",
                128
            );

        String fingerprintAlgorithm =
            requireText(
                installation,
                "fingerprintAlgorithm",
                32
            );

        String publicKeyFingerprint =
            requireText(
                installation,
                "publicKeyFingerprint",
                64
            );

        if (
            !FINGERPRINT_ALGORITHM.equals(
                fingerprintAlgorithm
            ) ||
            !publicKeyFingerprint.matches(
                "^[0-9a-f]{64}$"
            )
        ) {
            throw invalid(
                "FINORA Wallet Recharge Request installation identity is invalid."
            );
        }

        String expectedBindingKeyId =
            "FINORA-BINDING-" +
            publicKeyFingerprint
                .substring(
                    0,
                    32
                )
                .toUpperCase(
                    java.util.Locale.ROOT
                );

        if (
            !expectedBindingKeyId.equals(
                bindingKeyId
            )
        ) {
            throw invalid(
                "FINORA Wallet Recharge Request bindingKeyId is not canonical."
            );
        }
        PublicKey portableVerificationKey =
            null;

        if (portableV2) {
            String portablePlatform =
                requireText(
                    installation,
                    "platform",
                    32
                );

            String portableAlgorithm =
                requireText(
                    installation,
                    "algorithm",
                    64
                );

            String portablePublicKeyFormat =
                requireText(
                    installation,
                    "publicKeyFormat",
                    64
                );

            String portablePublicKey =
                requireText(
                    installation,
                    "publicKey",
                    8192
                );

            requireCanonicalTimestamp(
                installation,
                "createdAt"
            );

            if (
                portablePlatform.length() == 0 ||
                !SIGNATURE_ALGORITHM.equals(
                    portableAlgorithm
                ) ||
                !PUBLIC_KEY_FORMAT.equals(
                    portablePublicKeyFormat
                ) ||
                requireSafeInteger(
                    installation,
                    "schemaVersion"
                ) != 1L
            ) {
                throw invalid(
                    "FINORA Wallet Recharge Request current-device public-key metadata is invalid."
                );
            }

            portableVerificationKey =
                decodeAndValidatePublicKey(
                    portablePublicKey,
                    publicKeyFingerprint,
                    bindingKeyId
                );
        }

        String expectedRequestId =
            createExpectedRequestId(
                ownerId,
                businessId,
                branchId,
                paymentReference
            );

        if (
            !expectedRequestId.equals(
                requestId
            )
        ) {
            throw invalid(
                "FINORA Wallet Recharge Request requestId does not match its canonical payment identity."
            );
        }

        JSONObject registryRecord =
            findRegistryRecord(
                branchRegistry,
                ownerId,
                businessId,
                branchId
            );

        JSONObject identity =
            requireObject(
                registryRecord,
                "identity"
            );

        if (
            !ownerId.equals(
                requireText(
                    identity,
                    "ownerId",
                    128
                )
            ) ||
            !businessId.equals(
                requireText(
                    identity,
                    "businessId",
                    128
                )
            ) ||
            !branchId.equals(
                requireText(
                    identity,
                    "branchId",
                    128
                )
            ) ||
            !businessCode.equals(
                requireText(
                    identity,
                    "businessCode",
                    64
                )
            ) ||
            !branchCode.equals(
                requireText(
                    identity,
                    "branchCode",
                    64
                )
            )
        ) {
            throw invalid(
                "FINORA Wallet Recharge Request does not match the provisioned Branch Registry scope."
            );
        }

        JSONObject registryInstallation =
            requireObject(
                identity,
                "installation"
            );

        String registryInstallationId =
            requireText(
                registryInstallation,
                "installationId",
                256
            );

        String registryBindingKeyId =
            requireText(
                registryInstallation,
                "bindingKeyId",
                128
            );

        String registryPlatform =
            requireText(
                registryInstallation,
                "platform",
                32
            );

        String registryAlgorithm =
            requireText(
                registryInstallation,
                "algorithm",
                64
            );

        String registryPublicKeyFormat =
            requireText(
                registryInstallation,
                "publicKeyFormat",
                64
            );

        String registryPublicKey =
            requireText(
                registryInstallation,
                "publicKey",
                8192
            );

        String registryFingerprintAlgorithm =
            requireText(
                registryInstallation,
                "fingerprintAlgorithm",
                32
            );

        String registryPublicKeyFingerprint =
            requireText(
                registryInstallation,
                "publicKeyFingerprint",
                64
            );

        requireCanonicalTimestamp(
            registryInstallation,
            "bindingCreatedAt"
        );

        if (
            !portableV2 &&
            (
                !registryInstallationId.equals(
                    installationId
                ) ||
                !registryBindingKeyId.equals(
                    bindingKeyId
                ) ||
                !registryFingerprintAlgorithm.equals(
                    fingerprintAlgorithm
                ) ||
                !registryPublicKeyFingerprint.equals(
                    publicKeyFingerprint
                )
            )
        ) {
            throw invalid(
                "FINORA Wallet Recharge Request installation identity does not match the provisioned Branch Registry."
            );
        }

        if (
            !SIGNATURE_ALGORITHM.equals(
                registryAlgorithm
            ) ||
            !PUBLIC_KEY_FORMAT.equals(
                registryPublicKeyFormat
            ) ||
            !FINGERPRINT_ALGORITHM.equals(
                registryFingerprintAlgorithm
            ) ||
            registryPlatform.length() == 0
        ) {
            throw invalid(
                "FINORA Branch Registry installation public-key metadata is invalid."
            );
        }

        PublicKey verificationKey =
            portableV2
                ? portableVerificationKey
                : decodeAndValidatePublicKey(
                    registryPublicKey,
                    registryPublicKeyFingerprint,
                    registryBindingKeyId
                );

        String expectedSignatureBindingKeyId =
            portableV2
                ? bindingKeyId
                : registryBindingKeyId;
        requireExactKeys(
            signature,
            "algorithm",
            "encoding",
            "canonicalization",
            "bindingKeyId",
            "value"
        );

        String signatureValue =
            requireText(
                signature,
                "value",
                512
            );

        if (
            !SIGNATURE_ALGORITHM.equals(
                requireText(
                    signature,
                    "algorithm",
                    64
                )
            ) ||
            !SIGNATURE_ENCODING.equals(
                requireText(
                    signature,
                    "encoding",
                    64
                )
            ) ||
            !CANONICALIZATION.equals(
                requireText(
                    signature,
                    "canonicalization",
                    64
                )
            ) ||
            !expectedSignatureBindingKeyId.equals(
                requireText(
                    signature,
                    "bindingKeyId",
                    128
                )
            )
        ) {
            throw invalid(
                "FINORA Wallet Recharge Request signature envelope is invalid."
            );
        }

        byte[] p1363 =
            decodeCanonicalBase64(
                signatureValue
            );

        if (p1363.length != 64) {
            throw invalid(
                "FINORA Wallet Recharge Request signature must be a canonical 64-byte IEEE-P1363 signature."
            );
        }

        Object canonicalPayloadValue =
            toCanonicalJavaValue(
                payload
            );

        String canonicalPayload =
            FinoraCanonicalJson
                .canonicalize(
                    canonicalPayloadValue
                );

        Signature verifier =
            Signature.getInstance(
                "SHA256withECDSA"
            );

        verifier.initVerify(
            verificationKey
        );

        verifier.update(
            canonicalPayload.getBytes(
                StandardCharsets.UTF_8
            )
        );

        if (
            !verifier.verify(
                ieeeP1363ToDer(
                    p1363
                )
            )
        ) {
            throw invalid(
                "FINORA Wallet Recharge Request installation signature verification failed."
            );
        }
        if (portableV2) {
            JSONObject certificationPublicKey =
                registryRecord.optJSONObject(
                    "branchCertificationPublicKey"
                );

            if (certificationPublicKey == null) {
                throw invalid(
                    "FINORA Wallet Recharge Request V2 requires a registry-pinned Branch Certification public key."
                );
            }

            requireExactKeys(
                certificationPublicKey,
                "keyId",
                "algorithm",
                "publicKeyFormat",
                "publicKey",
                "fingerprintAlgorithm",
                "publicKeyFingerprint",
                "createdAt",
                "schemaVersion"
            );

            String certificationKeyId =
                requireText(
                    certificationPublicKey,
                    "keyId",
                    128
                );

            String certificationAlgorithm =
                requireText(
                    certificationPublicKey,
                    "algorithm",
                    64
                );

            String certificationPublicKeyFormat =
                requireText(
                    certificationPublicKey,
                    "publicKeyFormat",
                    64
                );

            String certificationPublicKeyValue =
                requireText(
                    certificationPublicKey,
                    "publicKey",
                    8192
                );

            String certificationFingerprintAlgorithm =
                requireText(
                    certificationPublicKey,
                    "fingerprintAlgorithm",
                    32
                );

            String certificationPublicKeyFingerprint =
                requireText(
                    certificationPublicKey,
                    "publicKeyFingerprint",
                    64
                );

            requireCanonicalTimestamp(
                certificationPublicKey,
                "createdAt"
            );

            if (
                !FinoraBranchCertificationCryptoValidator
                    .ALGORITHM
                    .equals(
                        certificationAlgorithm
                    ) ||
                !FinoraBranchCertificationCryptoValidator
                    .PUBLIC_KEY_FORMAT
                    .equals(
                        certificationPublicKeyFormat
                    ) ||
                !FinoraBranchCertificationCryptoValidator
                    .FINGERPRINT_ALGORITHM
                    .equals(
                        certificationFingerprintAlgorithm
                    ) ||
                requireSafeInteger(
                    certificationPublicKey,
                    "schemaVersion"
                ) !=
                    FinoraBranchCertificationCryptoValidator
                        .SCHEMA_VERSION ||
                !certificationPublicKeyFingerprint.matches(
                    "^[0-9a-f]{64}$"
                )
            ) {
                throw invalid(
                    "FINORA Branch Registry Branch Certification public-key metadata is invalid."
                );
            }

            String expectedCertificationKeyId =
                FinoraBranchCertificationCryptoValidator
                    .KEY_ID_PREFIX +
                certificationPublicKeyFingerprint
                    .substring(
                        0,
                        32
                    )
                    .toUpperCase(
                        java.util.Locale.ROOT
                    );

            if (
                !expectedCertificationKeyId.equals(
                    certificationKeyId
                )
            ) {
                throw invalid(
                    "FINORA Branch Registry Branch Certification keyId is not canonical."
                );
            }

            /*
             * Reuse the existing strict P-256/SPKI/fingerprint decoder.
             *
             * That helper's third parameter validates the canonical
             * FINORA-BINDING-* form. The Branch Certification key has
             * its own FINORA-BRANCH-CERT-* id, so supply the equivalent
             * canonical binding-form id solely for the generic SPKI /
             * fingerprint / P-256 validation performed by that helper.
             *
             * The authoritative Branch Certification keyId itself was
             * independently checked above.
             */
            String certificationValidationBindingKeyId =
                "FINORA-BINDING-" +
                certificationPublicKeyFingerprint
                    .substring(
                        0,
                        32
                    )
                    .toUpperCase(
                        java.util.Locale.ROOT
                    );

            PublicKey certificationVerificationKey =
                decodeAndValidatePublicKey(
                    certificationPublicKeyValue,
                    certificationPublicKeyFingerprint,
                    certificationValidationBindingKeyId
                );

            requireExactKeys(
                branchCertificationSignature,
                "algorithm",
                "encoding",
                "canonicalization",
                "keyId",
                "value"
            );

            String branchCertificationSignatureValue =
                requireText(
                    branchCertificationSignature,
                    "value",
                    512
                );

            if (
                !FinoraBranchCertificationCryptoValidator
                    .ALGORITHM
                    .equals(
                        requireText(
                            branchCertificationSignature,
                            "algorithm",
                            64
                        )
                    ) ||
                !"BASE64".equals(
                    requireText(
                        branchCertificationSignature,
                        "encoding",
                        64
                    )
                ) ||
                !CANONICALIZATION.equals(
                    requireText(
                        branchCertificationSignature,
                        "canonicalization",
                        64
                    )
                ) ||
                !certificationKeyId.equals(
                    requireText(
                        branchCertificationSignature,
                        "keyId",
                        128
                    )
                )
            ) {
                throw invalid(
                    "FINORA Wallet Recharge Request Branch Certification signature envelope is invalid."
                );
            }

            byte[] branchCertificationP1363 =
                decodeCanonicalBase64(
                    branchCertificationSignatureValue
                );

            if (
                branchCertificationP1363.length !=
                    64
            ) {
                throw invalid(
                    "FINORA Wallet Recharge Request Branch Certification signature must contain exactly 64 IEEE-P1363 bytes."
                );
            }

            Signature branchCertificationVerifier =
                Signature.getInstance(
                    "SHA256withECDSA"
                );

            branchCertificationVerifier.initVerify(
                certificationVerificationKey
            );

            branchCertificationVerifier.update(
                canonicalPayload.getBytes(
                    StandardCharsets.UTF_8
                )
            );

            if (
                !branchCertificationVerifier.verify(
                    ieeeP1363ToDer(
                        branchCertificationP1363
                    )
                )
            ) {
                throw invalid(
                    "FINORA Wallet Recharge Request Branch Certification signature verification failed."
                );
            }
        }

        return new VerifiedRequest(
            requestId,
            paymentReference,
            ownerId,
            businessId,
            branchId,
            businessCode,
            branchCode,
            installationId,
            bindingKeyId,
            publicKeyFingerprint,
            amountMinor,
            paymentMethod,
            paymentSource,
            requestedAt,
            portableV2
        );
    }


    private static JSONObject findRegistryRecord(
        JSONObject branchRegistry,
        String ownerId,
        String businessId,
        String branchId
    ) throws Exception {

        JSONArray branches =
            branchRegistry.optJSONArray(
                "branches"
            );

        if (branches == null) {
            throw invalid(
                "FINORA imported Branch Registry branches are unavailable."
            );
        }

        JSONObject found =
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
                throw invalid(
                    "FINORA imported Branch Registry contains an invalid branch record."
                );
            }

            JSONObject identity =
                record.optJSONObject(
                    "identity"
                );

            if (identity == null) {
                throw invalid(
                    "FINORA imported Branch Registry identity is invalid."
                );
            }

            if (
                ownerId.equals(
                    identity.optString(
                        "ownerId",
                        ""
                    )
                ) &&
                businessId.equals(
                    identity.optString(
                        "businessId",
                        ""
                    )
                ) &&
                branchId.equals(
                    identity.optString(
                        "branchId",
                        ""
                    )
                )
            ) {

                if (found != null) {
                    throw invalid(
                        "FINORA imported Branch Registry contains duplicate branch scope."
                    );
                }

                found =
                    record;
            }
        }

        if (found == null) {
            throw invalid(
                "FINORA Wallet Recharge Request does not match a registered Control Center branch."
            );
        }

        return found;
    }


    private static String createExpectedRequestId(
        String ownerId,
        String businessId,
        String branchId,
        String paymentReference
    ) throws Exception {

        String canonicalIdentity =
            REQUEST_PURPOSE +
            "\u0000" +
            ownerId +
            "\u0000" +
            businessId +
            "\u0000" +
            branchId +
            "\u0000" +
            paymentReference;

        MessageDigest digest =
            MessageDigest.getInstance(
                "SHA-256"
            );

        byte[] hash =
            digest.digest(
                canonicalIdentity.getBytes(
                    StandardCharsets.UTF_8
                )
            );

        StringBuilder hex =
            new StringBuilder(
                hash.length * 2
            );

        for (byte value : hash) {

            hex.append(
                String.format(
                    java.util.Locale.ROOT,
                    "%02X",
                    value & 0xff
                )
            );
        }

        return "FINORA-WAL-REQ-" +
            hex.toString();
    }


    private static PublicKey decodeAndValidatePublicKey(
        String publicKeyBase64,
        String expectedFingerprint,
        String expectedBindingKeyId
    ) throws Exception {

        byte[] publicKeyBytes =
            decodeCanonicalBase64(
                publicKeyBase64
            );

        if (publicKeyBytes.length == 0) {
            throw invalid(
                "FINORA Branch Registry installation public key is empty."
            );
        }

        MessageDigest digest =
            MessageDigest.getInstance(
                "SHA-256"
            );

        byte[] fingerprintBytes =
            digest.digest(
                publicKeyBytes
            );

        StringBuilder fingerprint =
            new StringBuilder(
                fingerprintBytes.length * 2
            );

        for (byte value : fingerprintBytes) {

            fingerprint.append(
                String.format(
                    java.util.Locale.ROOT,
                    "%02x",
                    value & 0xff
                )
            );
        }

        if (
            !MessageDigest.isEqual(
                fingerprint
                    .toString()
                    .getBytes(
                        StandardCharsets.US_ASCII
                    ),
                expectedFingerprint.getBytes(
                    StandardCharsets.US_ASCII
                )
            )
        ) {
            throw invalid(
                "FINORA Branch Registry installation public-key fingerprint is invalid."
            );
        }

        String canonicalBindingKeyId =
            "FINORA-BINDING-" +
            expectedFingerprint
                .substring(
                    0,
                    32
                )
                .toUpperCase(
                    java.util.Locale.ROOT
                );

        if (
            !canonicalBindingKeyId.equals(
                expectedBindingKeyId
            )
        ) {
            throw invalid(
                "FINORA Branch Registry installation bindingKeyId is invalid."
            );
        }

        KeyFactory factory =
            KeyFactory.getInstance(
                "EC"
            );

        PublicKey publicKey =
            factory.generatePublic(
                new X509EncodedKeySpec(
                    publicKeyBytes
                )
            );

        if (
            !(publicKey instanceof ECPublicKey) ||
            (
                (ECPublicKey) publicKey
            )
                .getParams()
                .getCurve()
                .getField()
                .getFieldSize() != 256
        ) {
            throw invalid(
                "FINORA Branch Registry installation public key is not P-256."
            );
        }

        return publicKey;
    }


    private static byte[] decodeCanonicalBase64(
        String value
    ) {

        final byte[] decoded;

        try {

            decoded =
                Base64.decode(
                    value,
                    Base64.DEFAULT
                );
        }
        catch (Exception error) {

            throw invalid(
                "FINORA Wallet Recharge Request signature/key material is not valid Base64."
            );
        }

        String canonical =
            Base64.encodeToString(
                decoded,
                Base64.NO_WRAP
            );

        if (!canonical.equals(value)) {
            throw invalid(
                "FINORA Wallet Recharge Request contains non-canonical Base64."
            );
        }

        return decoded;
    }


    private static byte[] ieeeP1363ToDer(
        byte[] p1363
    ) {

        if (
            p1363 == null ||
            p1363.length != 64
        ) {
            throw invalid(
                "FINORA IEEE-P1363 signature length is invalid."
            );
        }

        byte[] r =
            Arrays.copyOfRange(
                p1363,
                0,
                32
            );

        byte[] s =
            Arrays.copyOfRange(
                p1363,
                32,
                64
            );

        byte[] derR =
            unsignedDerInteger(
                r
            );

        byte[] derS =
            unsignedDerInteger(
                s
            );

        int sequenceLength =
            2 +
            derR.length +
            2 +
            derS.length;

        ByteArrayOutputStream output =
            new ByteArrayOutputStream();

        output.write(0x30);
        output.write(sequenceLength);

        output.write(0x02);
        output.write(derR.length);
        output.write(
            derR,
            0,
            derR.length
        );

        output.write(0x02);
        output.write(derS.length);
        output.write(
            derS,
            0,
            derS.length
        );

        return output.toByteArray();
    }


    private static byte[] unsignedDerInteger(
        byte[] raw
    ) {

        int first =
            0;

        while (
            first <
                raw.length - 1 &&
            raw[first] == 0
        ) {
            first++;
        }

        int length =
            raw.length -
            first;

        boolean prefixZero =
            (
                raw[first] &
                0x80
            ) != 0;

        byte[] result =
            new byte[
                length +
                (
                    prefixZero
                        ? 1
                        : 0
                )
            ];

        int destination =
            prefixZero
                ? 1
                : 0;

        System.arraycopy(
            raw,
            first,
            result,
            destination,
            length
        );

        return result;
    }


    private static Object toCanonicalJavaValue(
        Object value
    ) throws Exception {

        if (
            value == null ||
            value == JSONObject.NULL
        ) {
            return null;
        }

        if (value instanceof JSONObject) {

            JSONObject object =
                (JSONObject) value;

            List<String> keys =
                new ArrayList<>();

            Iterator<String> iterator =
                object.keys();

            while (iterator.hasNext()) {
                keys.add(
                    iterator.next()
                );
            }

            java.util.Collections.sort(
                keys
            );

            Map<String, Object> result =
                new LinkedHashMap<>();

            for (String key : keys) {

                result.put(
                    key,
                    toCanonicalJavaValue(
                        object.get(
                            key
                        )
                    )
                );
            }

            return result;
        }

        if (value instanceof JSONArray) {

            JSONArray array =
                (JSONArray) value;

            List<Object> result =
                new ArrayList<>();

            for (
                int index = 0;
                index < array.length();
                index++
            ) {

                result.add(
                    toCanonicalJavaValue(
                        array.get(
                            index
                        )
                    )
                );
            }

            return result;
        }

        if (
            value instanceof String ||
            value instanceof Boolean
        ) {
            return value;
        }

        if (value instanceof Number) {

            Number number =
                (Number) value;

            double doubleValue =
                number.doubleValue();

            long longValue =
                number.longValue();

            if (
                !Double.isFinite(
                    doubleValue
                ) ||
                doubleValue !=
                    (double) longValue ||
                Math.abs(
                    doubleValue
                ) >
                    MAX_SAFE_INTEGER
            ) {
                throw invalid(
                    "FINORA Wallet Recharge Request contains a non-canonical numeric value."
                );
            }

            return Long.valueOf(
                longValue
            );
        }

        throw invalid(
            "FINORA Wallet Recharge Request contains an unsupported canonical value."
        );
    }


    private static JSONObject requireObject(
        JSONObject object,
        String key
    ) {

        JSONObject value =
            object.optJSONObject(
                key
            );

        if (value == null) {
            throw invalid(
                "FINORA Wallet Recharge Request/Registry object " +
                key +
                " is invalid."
            );
        }

        return value;
    }


    private static String requireText(
        JSONObject object,
        String key,
        int maxLength
    ) {

        Object raw =
            object.opt(
                key
            );

        if (!(raw instanceof String)) {
            throw invalid(
                "FINORA Wallet Recharge Request field " +
                key +
                " is invalid."
            );
        }

        String value =
            (String) raw;

        if (
            value.length() == 0 ||
            value.length() > maxLength ||
            !value.equals(
                value.trim()
            )
        ) {
            throw invalid(
                "FINORA Wallet Recharge Request field " +
                key +
                " is invalid."
            );
        }

        return value;
    }


    private static long requireSafeInteger(
        JSONObject object,
        String key
    ) {

        Object raw =
            object.opt(
                key
            );

        if (!(raw instanceof Number)) {
            throw invalid(
                "FINORA Wallet Recharge Request field " +
                key +
                " must be numeric."
            );
        }

        Number number =
            (Number) raw;

        double doubleValue =
            number.doubleValue();

        long longValue =
            number.longValue();

        if (
            !Double.isFinite(
                doubleValue
            ) ||
            doubleValue !=
                (double) longValue ||
            Math.abs(
                doubleValue
            ) >
                MAX_SAFE_INTEGER
        ) {
            throw invalid(
                "FINORA Wallet Recharge Request field " +
                key +
                " is not a safe integer."
            );
        }

        return longValue;
    }


    private static long requirePositiveSafeInteger(
        JSONObject object,
        String key
    ) {

        long value =
            requireSafeInteger(
                object,
                key
            );

        if (value <= 0) {
            throw invalid(
                "FINORA Wallet Recharge Request field " +
                key +
                " must be positive."
            );
        }

        return value;
    }


    private static String requireCanonicalTimestamp(
        JSONObject object,
        String key
    ) {

        String value =
            requireText(
                object,
                key,
                64
            );

        if (
            !value.matches(
                "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{3}Z$"
            )
        ) {
            throw invalid(
                "FINORA timestamp " +
                key +
                " is not canonical."
            );
        }

        try {
            Instant.parse(
                value
            );
        }
        catch (Exception error) {

            throw invalid(
                "FINORA timestamp " +
                key +
                " is invalid."
            );
        }

        return value;
    }


    private static void requireExactKeys(
        JSONObject object,
        String... expected
    ) {

        Set<String> actual =
            new HashSet<>();

        Iterator<String> iterator =
            object.keys();

        while (iterator.hasNext()) {
            actual.add(
                iterator.next()
            );
        }

        Set<String> wanted =
            new HashSet<>(
                Arrays.asList(
                    expected
                )
            );

        if (!actual.equals(wanted)) {
            throw invalid(
                "FINORA Wallet Recharge Request contains unexpected or missing fields."
            );
        }
    }


    private static IllegalArgumentException invalid(
        String message
    ) {

        return new IllegalArgumentException(
            message
        );
    }
}
