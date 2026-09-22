package com.finora.enterprise.control;

import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeFormatterBuilder;
import java.util.HashSet;
import java.util.Iterator;
import java.util.Locale;
import java.util.Set;

import org.json.JSONObject;

/**
 * Android parity contract for the Windows
 * FinoraPortableFreshDeviceRuntimeAuthorityPackageV1.
 *
 * IMPORTANT:
 *
 * Windows signs the payload returned by JSON.stringify() over an
 * explicitly constructed object. Therefore signature verification
 * MUST preserve the exact Windows insertion order. It must not use
 * FinoraCanonicalJson, because that utility sorts object keys.
 */
public final class
    FinoraPortableFreshDeviceRuntimeAuthorityContract {

    public static final String FORMAT =
        "FINORA_PORTABLE_FRESH_DEVICE_RUNTIME_AUTHORITY";

    public static final int SCHEMA_VERSION =
        1;

    public static final String PURPOSE =
        "FRESH_DEVICE_RUNTIME_AUTHORITY";

    public static final String SIGNATURE_ALGORITHM =
        "ECDSA_P256_SHA256";

    /*
     * Windows calls this BASE64 because the signature VALUE is
     * Base64 text. The decoded 64 bytes themselves are IEEE-P1363.
     */
    public static final String SIGNATURE_ENCODING =
        "BASE64";

    public static final String SIGNATURE_CANONICALIZATION =
        "FINORA_CANONICAL_JSON_V1";

    private static final long MAX_SAFE_INTEGER =
        9007199254740991L;

    private static final DateTimeFormatter CANONICAL_TIMESTAMP =
        new DateTimeFormatterBuilder()
            .appendInstant(3)
            .toFormatter(
                Locale.ROOT
            );

    private static final String[] PACKAGE_KEYS = {
        "format",
        "schemaVersion",
        "payload",
        "signature"
    };

    private static final String[] PAYLOAD_REQUIRED_KEYS = {
        "schemaVersion",
        "purpose",
        "authorityId",
        "sourceAuthorizationId",
        "credentialId",
        "activationId",
        "branchAccessGrantId",
        "storageEntitlementId",
        "ownerId",
        "businessId",
        "branchId",
        "businessCode",
        "branchCode",
        "userId",
        "username",
        "canonicalUsername",
        "fullName",
        "role",
        "storageMode",
        "dataContext",
        "demoId",
        "authGeneration",
        "activationStatus",
        "activationCreatedAt",
        "activationUpdatedAt",
        "branchAccessType",
        "registrationPayment",
        "registrationCycle",
        "demoRemarks",
        "accessMode",
        "accessValidFrom",
        "accessValidUntil",
        "branchAccessCreatedAt",
        "branchAccessUpdatedAt",
        "storageEntitlementStatus",
        "storageEntitlementActivatedAt",
        "storageEntitlementCreatedAt",
        "storageEntitlementUpdatedAt",
        "portableAuthFingerprint",
        "issuedAt"
    };

    private static final String PAYLOAD_OPTIONAL_KEY =
        "activationActivatedAt";

    private static final String
        PAYLOAD_OPTIONAL_BUSINESS_PROFILE_KEY =
            "businessProfile";

    private static final String[] SIGNATURE_KEYS = {
        "algorithm",
        "encoding",
        "canonicalization",
        "keyId",
        "value"
    };

    private static final String[] PAYMENT_REQUIRED_KEYS = {
        "amount",
        "currency",
        "paymentMode",
        "paidAt",
        "refundable"
    };

    private static final String PAYMENT_OPTIONAL_REFERENCE =
        "reference";

    private static final String PAYMENT_OPTIONAL_REMARKS =
        "remarks";

    private static final String[] BUSINESS_PROFILE_KEYS = {
        "profileId",
        "ownerId",
        "businessId",
        "branchId",
        "businessCode",
        "branchCode",
        "businessName",
        "branchName",
        "installationId",
        "bindingKeyId",
        "fingerprintAlgorithm",
        "publicKeyFingerprint",
        "createdAt",
        "updatedAt",
        "schemaVersion"
    };
    private FinoraPortableFreshDeviceRuntimeAuthorityContract() {
    }

    public static final class RegistrationPayment {

        public final long amount;
        public final String currency;
        public final String paymentMode;
        public final String paidAt;
        public final String reference;
        public final String remarks;
        public final boolean refundable;

        private RegistrationPayment(
            long amount,
            String currency,
            String paymentMode,
            String paidAt,
            String reference,
            String remarks,
            boolean refundable
        ) {
            this.amount =
                amount;

            this.currency =
                currency;

            this.paymentMode =
                paymentMode;

            this.paidAt =
                paidAt;

            this.reference =
                reference;

            this.remarks =
                remarks;

            this.refundable =
                refundable;
        }
    }

    public static final class BusinessProfile {

        public final String profileId;
        public final String ownerId;
        public final String businessId;
        public final String branchId;
        public final String businessCode;
        public final String branchCode;
        public final String businessName;
        public final String branchName;
        public final String installationId;
        public final String bindingKeyId;
        public final String fingerprintAlgorithm;
        public final String publicKeyFingerprint;
        public final String createdAt;
        public final String updatedAt;
        public final int schemaVersion;

        private BusinessProfile(
            String profileId,
            String ownerId,
            String businessId,
            String branchId,
            String businessCode,
            String branchCode,
            String businessName,
            String branchName,
            String installationId,
            String bindingKeyId,
            String fingerprintAlgorithm,
            String publicKeyFingerprint,
            String createdAt,
            String updatedAt,
            int schemaVersion
        ) {
            this.profileId =
                profileId;

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

            this.businessName =
                businessName;

            this.branchName =
                branchName;

            this.installationId =
                installationId;

            this.bindingKeyId =
                bindingKeyId;

            this.fingerprintAlgorithm =
                fingerprintAlgorithm;

            this.publicKeyFingerprint =
                publicKeyFingerprint;

            this.createdAt =
                createdAt;

            this.updatedAt =
                updatedAt;

            this.schemaVersion =
                schemaVersion;
        }
    }
    public static final class Payload {

        public final int schemaVersion;
        public final String purpose;
        public final String authorityId;
        public final String sourceAuthorizationId;
        public final String credentialId;
        public final String activationId;
        public final String branchAccessGrantId;
        public final String storageEntitlementId;
        public final String ownerId;
        public final String businessId;
        public final String branchId;
        public final String businessCode;
        public final String branchCode;
        public final BusinessProfile businessProfile;
        public final String userId;
        public final String username;
        public final String canonicalUsername;
        public final String fullName;
        public final String role;
        public final String storageMode;
        public final String dataContext;
        public final String demoId;
        public final long authGeneration;
        public final String activationStatus;
        public final String activationActivatedAt;
        public final String activationCreatedAt;
        public final String activationUpdatedAt;
        public final String branchAccessType;
        public final RegistrationPayment registrationPayment;
        public final Long registrationCycle;
        public final String demoRemarks;
        public final String accessMode;
        public final String accessValidFrom;
        public final String accessValidUntil;
        public final String branchAccessCreatedAt;
        public final String branchAccessUpdatedAt;
        public final String storageEntitlementStatus;
        public final String storageEntitlementActivatedAt;
        public final String storageEntitlementCreatedAt;
        public final String storageEntitlementUpdatedAt;
        public final String portableAuthFingerprint;
        public final String issuedAt;

        private Payload(
            int schemaVersion,
            String purpose,
            String authorityId,
            String sourceAuthorizationId,
            String credentialId,
            String activationId,
            String branchAccessGrantId,
            String storageEntitlementId,
            String ownerId,
            String businessId,
            String branchId,
            String businessCode,
            String branchCode,
            BusinessProfile businessProfile,
            String userId,
            String username,
            String canonicalUsername,
            String fullName,
            String role,
            String storageMode,
            String dataContext,
            String demoId,
            long authGeneration,
            String activationStatus,
            String activationActivatedAt,
            String activationCreatedAt,
            String activationUpdatedAt,
            String branchAccessType,
            RegistrationPayment registrationPayment,
            Long registrationCycle,
            String demoRemarks,
            String accessMode,
            String accessValidFrom,
            String accessValidUntil,
            String branchAccessCreatedAt,
            String branchAccessUpdatedAt,
            String storageEntitlementStatus,
            String storageEntitlementActivatedAt,
            String storageEntitlementCreatedAt,
            String storageEntitlementUpdatedAt,
            String portableAuthFingerprint,
            String issuedAt
        ) {
            this.schemaVersion =
                schemaVersion;

            this.purpose =
                purpose;

            this.authorityId =
                authorityId;

            this.sourceAuthorizationId =
                sourceAuthorizationId;

            this.credentialId =
                credentialId;

            this.activationId =
                activationId;

            this.branchAccessGrantId =
                branchAccessGrantId;

            this.storageEntitlementId =
                storageEntitlementId;

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

            this.businessProfile =
                businessProfile;

            this.userId =
                userId;

            this.username =
                username;

            this.canonicalUsername =
                canonicalUsername;

            this.fullName =
                fullName;

            this.role =
                role;

            this.storageMode =
                storageMode;

            this.dataContext =
                dataContext;

            this.demoId =
                demoId;

            this.authGeneration =
                authGeneration;

            this.activationStatus =
                activationStatus;

            this.activationActivatedAt =
                activationActivatedAt;

            this.activationCreatedAt =
                activationCreatedAt;

            this.activationUpdatedAt =
                activationUpdatedAt;

            this.branchAccessType =
                branchAccessType;

            this.registrationPayment =
                registrationPayment;

            this.registrationCycle =
                registrationCycle;

            this.demoRemarks =
                demoRemarks;

            this.accessMode =
                accessMode;

            this.accessValidFrom =
                accessValidFrom;

            this.accessValidUntil =
                accessValidUntil;

            this.branchAccessCreatedAt =
                branchAccessCreatedAt;

            this.branchAccessUpdatedAt =
                branchAccessUpdatedAt;

            this.storageEntitlementStatus =
                storageEntitlementStatus;

            this.storageEntitlementActivatedAt =
                storageEntitlementActivatedAt;

            this.storageEntitlementCreatedAt =
                storageEntitlementCreatedAt;

            this.storageEntitlementUpdatedAt =
                storageEntitlementUpdatedAt;

            this.portableAuthFingerprint =
                portableAuthFingerprint;

            this.issuedAt =
                issuedAt;
        }
    }

    public static final class SignatureValue {

        public final String algorithm;
        public final String encoding;
        public final String canonicalization;
        public final String keyId;
        public final String value;

        private SignatureValue(
            String algorithm,
            String encoding,
            String canonicalization,
            String keyId,
            String value
        ) {
            this.algorithm =
                algorithm;

            this.encoding =
                encoding;

            this.canonicalization =
                canonicalization;

            this.keyId =
                keyId;

            this.value =
                value;
        }
    }

    public static final class PackageValue {

        public final String format;
        public final int schemaVersion;
        public final Payload payload;
        public final SignatureValue signature;

        private PackageValue(
            String format,
            int schemaVersion,
            Payload payload,
            SignatureValue signature
        ) {
            this.format =
                format;

            this.schemaVersion =
                schemaVersion;

            this.payload =
                payload;

            this.signature =
                signature;
        }
    }

    public static PackageValue parse(
        String serialized
    ) {
        try {
            if (
                serialized == null ||
                serialized.length() == 0
            ) {
                throw invalid(
                    "Runtime Authority package is required."
                );
            }

            JSONObject root =
                new JSONObject(
                    serialized
                );

            assertExactKeys(
                root,
                PACKAGE_KEYS,
                null,
                null,
                "Runtime Authority package"
            );

            if (
                !FORMAT.equals(
                    requiredString(
                        root,
                        "format"
                    )
                ) ||
                requiredPositiveInteger(
                    root,
                    "schemaVersion"
                ) != SCHEMA_VERSION
            ) {
                throw invalid(
                    "Runtime Authority package header is invalid."
                );
            }

            JSONObject payloadObject =
                requiredObject(
                    root,
                    "payload"
                );

            JSONObject signatureObject =
                requiredObject(
                    root,
                    "signature"
                );

            Payload payload =
                parsePayload(
                    payloadObject
                );

            SignatureValue signature =
                parseSignature(
                    signatureObject
                );

            return new PackageValue(
                FORMAT,
                SCHEMA_VERSION,
                payload,
                signature
            );
        }
        catch (IllegalArgumentException error) {
            throw error;
        }
        catch (Exception error) {
            throw invalid(
                "Runtime Authority package is malformed."
            );
        }
    }

    public static String canonicalizePayload(
        Payload payload
    ) {
        if (payload == null) {
            throw invalid(
                "Runtime Authority payload is required."
            );
        }

        StringBuilder output =
            new StringBuilder();

        output.append('{');

        appendNumberField(
            output,
            "schemaVersion",
            payload.schemaVersion,
            true
        );

        appendStringField(
            output,
            "purpose",
            payload.purpose,
            false
        );

        appendStringField(
            output,
            "authorityId",
            payload.authorityId,
            false
        );

        appendStringField(
            output,
            "sourceAuthorizationId",
            payload.sourceAuthorizationId,
            false
        );

        appendStringField(
            output,
            "credentialId",
            payload.credentialId,
            false
        );

        appendStringField(
            output,
            "activationId",
            payload.activationId,
            false
        );

        appendStringField(
            output,
            "branchAccessGrantId",
            payload.branchAccessGrantId,
            false
        );

        appendStringField(
            output,
            "storageEntitlementId",
            payload.storageEntitlementId,
            false
        );

        appendStringField(
            output,
            "ownerId",
            payload.ownerId,
            false
        );

        appendStringField(
            output,
            "businessId",
            payload.businessId,
            false
        );

        appendStringField(
            output,
            "branchId",
            payload.branchId,
            false
        );

        appendNullableStringField(
            output,
            "businessCode",
            payload.businessCode,
            false
        );

        appendNullableStringField(
            output,
            "branchCode",
            payload.branchCode,
            false
        );

        if (payload.businessProfile != null) {
            output.append(
                ",\"businessProfile\":"
            );

            appendBusinessProfile(
                output,
                payload.businessProfile
            );
        }

        appendStringField(
            output,
            "userId",
            payload.userId,
            false
        );

        appendStringField(
            output,
            "username",
            payload.username,
            false
        );

        appendStringField(
            output,
            "canonicalUsername",
            payload.canonicalUsername,
            false
        );

        appendStringField(
            output,
            "fullName",
            payload.fullName,
            false
        );

        appendStringField(
            output,
            "role",
            payload.role,
            false
        );

        appendStringField(
            output,
            "storageMode",
            payload.storageMode,
            false
        );

        appendStringField(
            output,
            "dataContext",
            payload.dataContext,
            false
        );

        appendNullableStringField(
            output,
            "demoId",
            payload.demoId,
            false
        );

        appendNumberField(
            output,
            "authGeneration",
            payload.authGeneration,
            false
        );

        appendStringField(
            output,
            "activationStatus",
            payload.activationStatus,
            false
        );

        if (payload.activationActivatedAt != null) {
            appendStringField(
                output,
                "activationActivatedAt",
                payload.activationActivatedAt,
                false
            );
        }

        appendStringField(
            output,
            "activationCreatedAt",
            payload.activationCreatedAt,
            false
        );

        appendStringField(
            output,
            "activationUpdatedAt",
            payload.activationUpdatedAt,
            false
        );

        appendStringField(
            output,
            "branchAccessType",
            payload.branchAccessType,
            false
        );

        appendPaymentField(
            output,
            payload.registrationPayment
        );

        appendNullableNumberField(
            output,
            "registrationCycle",
            payload.registrationCycle,
            false
        );

        appendNullableStringField(
            output,
            "demoRemarks",
            payload.demoRemarks,
            false
        );

        appendStringField(
            output,
            "accessMode",
            payload.accessMode,
            false
        );

        appendStringField(
            output,
            "accessValidFrom",
            payload.accessValidFrom,
            false
        );

        appendNullableStringField(
            output,
            "accessValidUntil",
            payload.accessValidUntil,
            false
        );

        appendStringField(
            output,
            "branchAccessCreatedAt",
            payload.branchAccessCreatedAt,
            false
        );

        appendStringField(
            output,
            "branchAccessUpdatedAt",
            payload.branchAccessUpdatedAt,
            false
        );

        appendStringField(
            output,
            "storageEntitlementStatus",
            payload.storageEntitlementStatus,
            false
        );

        appendStringField(
            output,
            "storageEntitlementActivatedAt",
            payload.storageEntitlementActivatedAt,
            false
        );

        appendStringField(
            output,
            "storageEntitlementCreatedAt",
            payload.storageEntitlementCreatedAt,
            false
        );

        appendStringField(
            output,
            "storageEntitlementUpdatedAt",
            payload.storageEntitlementUpdatedAt,
            false
        );

        appendStringField(
            output,
            "portableAuthFingerprint",
            payload.portableAuthFingerprint,
            false
        );

        appendStringField(
            output,
            "issuedAt",
            payload.issuedAt,
            false
        );

        output.append('}');

        return output.toString();
    }

    private static void appendBusinessProfile(
        StringBuilder output,
        BusinessProfile profile
    ) {
        output.append('{');

        appendStringField(
            output,
            "profileId",
            profile.profileId,
            true
        );

        appendStringField(
            output,
            "ownerId",
            profile.ownerId,
            false
        );

        appendStringField(
            output,
            "businessId",
            profile.businessId,
            false
        );

        appendStringField(
            output,
            "branchId",
            profile.branchId,
            false
        );

        appendStringField(
            output,
            "businessCode",
            profile.businessCode,
            false
        );

        appendStringField(
            output,
            "branchCode",
            profile.branchCode,
            false
        );

        appendStringField(
            output,
            "businessName",
            profile.businessName,
            false
        );

        appendStringField(
            output,
            "branchName",
            profile.branchName,
            false
        );

        appendStringField(
            output,
            "installationId",
            profile.installationId,
            false
        );

        appendStringField(
            output,
            "bindingKeyId",
            profile.bindingKeyId,
            false
        );

        appendStringField(
            output,
            "fingerprintAlgorithm",
            profile.fingerprintAlgorithm,
            false
        );

        appendStringField(
            output,
            "publicKeyFingerprint",
            profile.publicKeyFingerprint,
            false
        );

        appendStringField(
            output,
            "createdAt",
            profile.createdAt,
            false
        );

        appendStringField(
            output,
            "updatedAt",
            profile.updatedAt,
            false
        );

        appendNumberField(
            output,
            "schemaVersion",
            profile.schemaVersion,
            false
        );

        output.append('}');
    }
    private static Payload parsePayload(
        JSONObject payload
    ) {
        assertExactKeys(
            payload,
            PAYLOAD_REQUIRED_KEYS,
            PAYLOAD_OPTIONAL_KEY,
            PAYLOAD_OPTIONAL_BUSINESS_PROFILE_KEY,
            "Runtime Authority payload"
        );

        int schemaVersion =
            (int) requiredPositiveInteger(
                payload,
                "schemaVersion"
            );

        if (schemaVersion != SCHEMA_VERSION) {
            throw invalid(
                "Runtime Authority payload schemaVersion is unsupported."
            );
        }

        String purpose =
            requiredString(
                payload,
                "purpose"
            );

        if (!PURPOSE.equals(purpose)) {
            throw invalid(
                "Runtime Authority purpose is invalid."
            );
        }

        String authorityId =
            requiredString(
                payload,
                "authorityId"
            );

        String sourceAuthorizationId =
            requiredString(
                payload,
                "sourceAuthorizationId"
            );

        String credentialId =
            requiredString(
                payload,
                "credentialId"
            );

        String activationId =
            requiredString(
                payload,
                "activationId"
            );

        String branchAccessGrantId =
            requiredString(
                payload,
                "branchAccessGrantId"
            );

        String storageEntitlementId =
            requiredString(
                payload,
                "storageEntitlementId"
            );

        String ownerId =
            requiredString(
                payload,
                "ownerId"
            );

        String businessId =
            requiredString(
                payload,
                "businessId"
            );

        String branchId =
            requiredString(
                payload,
                "branchId"
            );

        String businessCode =
            nullableString(
                payload,
                "businessCode"
            );

        String branchCode =
            nullableString(
                payload,
                "branchCode"
            );

        String userId =
            requiredString(
                payload,
                "userId"
            );

        String username =
            requiredString(
                payload,
                "username"
            );

        String canonicalUsername =
            requiredString(
                payload,
                "canonicalUsername"
            );

        if (
            !FinoraBranchCredentialContract
                .canonicalizeUsername(
                    username
                )
                .equals(
                    canonicalUsername
                )
        ) {
            throw invalid(
                "Runtime Authority canonical Username is invalid."
            );
        }

        String fullName =
            requiredString(
                payload,
                "fullName"
            );

        String role =
            requiredString(
                payload,
                "role"
            );

        String storageMode =
            requiredString(
                payload,
                "storageMode"
            );

        if (
            !"LOCAL".equals(storageMode) &&
            !"USB".equals(storageMode)
        ) {
            throw invalid(
                "Runtime Authority storageMode is invalid."
            );
        }

        String dataContext =
            requiredString(
                payload,
                "dataContext"
            );

        if (
            !"REAL".equals(dataContext) &&
            !"DEMO".equals(dataContext)
        ) {
            throw invalid(
                "Runtime Authority dataContext is invalid."
            );
        }

        String demoId =
            nullableString(
                payload,
                "demoId"
            );

        long authGeneration =
            requiredPositiveInteger(
                payload,
                "authGeneration"
            );

        String activationStatus =
            requiredString(
                payload,
                "activationStatus"
            );

        if (!"ACTIVE".equals(activationStatus)) {
            throw invalid(
                "Runtime Authority activationStatus must be ACTIVE."
            );
        }

        String activationActivatedAt =
            payload.has(
                PAYLOAD_OPTIONAL_KEY
            )
                ? requiredTimestamp(
                    payload,
                    PAYLOAD_OPTIONAL_KEY
                )
                : null;

        String activationCreatedAt =
            requiredTimestamp(
                payload,
                "activationCreatedAt"
            );

        String activationUpdatedAt =
            requiredTimestamp(
                payload,
                "activationUpdatedAt"
            );

        String branchAccessType =
            requiredString(
                payload,
                "branchAccessType"
            );

        if (
            !"REGISTERED".equals(branchAccessType) &&
            !"DEMO".equals(branchAccessType)
        ) {
            throw invalid(
                "Runtime Authority branchAccessType is invalid."
            );
        }

        RegistrationPayment registrationPayment =
            parseNullablePayment(
                payload
            );

        Long registrationCycle =
            nullablePositiveInteger(
                payload,
                "registrationCycle"
            );

        String demoRemarks =
            nullableString(
                payload,
                "demoRemarks"
            );

        String accessMode =
            requiredString(
                payload,
                "accessMode"
            );

        if (
            !"ACTIVE".equals(accessMode) &&
            !"REGISTERED_EXPIRED_READ_ONLY".equals(
                accessMode
            )
        ) {
            throw invalid(
                "Runtime Authority accessMode is invalid."
            );
        }

        String accessValidFrom =
            requiredTimestamp(
                payload,
                "accessValidFrom"
            );

        String accessValidUntil =
            nullableTimestamp(
                payload,
                "accessValidUntil"
            );

        if (
            accessValidUntil != null &&
            Instant.parse(accessValidUntil).isBefore(
                Instant.parse(accessValidFrom)
            )
        ) {
            throw invalid(
                "Runtime Authority access validity window is invalid."
            );
        }

        String branchAccessCreatedAt =
            requiredTimestamp(
                payload,
                "branchAccessCreatedAt"
            );

        String branchAccessUpdatedAt =
            requiredTimestamp(
                payload,
                "branchAccessUpdatedAt"
            );

        String storageEntitlementStatus =
            requiredString(
                payload,
                "storageEntitlementStatus"
            );

        if (
            !"ACTIVE".equals(
                storageEntitlementStatus
            )
        ) {
            throw invalid(
                "Runtime Authority storage entitlement must be ACTIVE."
            );
        }

        String storageEntitlementActivatedAt =
            requiredTimestamp(
                payload,
                "storageEntitlementActivatedAt"
            );

        String storageEntitlementCreatedAt =
            requiredTimestamp(
                payload,
                "storageEntitlementCreatedAt"
            );

        String storageEntitlementUpdatedAt =
            requiredTimestamp(
                payload,
                "storageEntitlementUpdatedAt"
            );

        String portableAuthFingerprint =
            requiredString(
                payload,
                "portableAuthFingerprint"
            );

        if (
            !portableAuthFingerprint.matches(
                "^[0-9a-f]{64}$"
            )
        ) {
            throw invalid(
                "Runtime Authority Portable Auth fingerprint is invalid."
            );
        }

        String issuedAt =
            requiredTimestamp(
                payload,
                "issuedAt"
            );

        if ("REGISTERED".equals(branchAccessType)) {
            if (
                registrationPayment == null ||
                registrationCycle == null
            ) {
                throw invalid(
                    "REGISTERED Runtime Authority access metadata is invalid."
                );
            }
        }
        else if (
            registrationPayment != null ||
            registrationCycle != null
        ) {
            throw invalid(
                "DEMO Runtime Authority cannot carry registration metadata."
            );
        }

        if ("REAL".equals(dataContext)) {
            if (
                demoId != null ||
                !"REGISTERED".equals(
                    branchAccessType
                )
            ) {
                throw invalid(
                    "REAL Runtime Authority must use REGISTERED access without demoId."
                );
            }
        }
        else {
            if (
                demoId == null ||
                demoId.trim().length() == 0 ||
                !"DEMO".equals(
                    branchAccessType
                ) ||
                !"ACTIVE".equals(
                    accessMode
                )
            ) {
                throw invalid(
                    "DEMO Runtime Authority scope is invalid."
                );
            }
        }

        if (
            "REGISTERED_EXPIRED_READ_ONLY".equals(
                accessMode
            ) &&
            !"REGISTERED".equals(
                branchAccessType
            )
        ) {
            throw invalid(
                "Expired Runtime Authority must be REGISTERED."
            );
        }

        BusinessProfile businessProfile =
            parseOptionalBusinessProfile(
                payload
            );

        if (
            businessProfile != null &&
            (
                !businessProfile.ownerId.equals(
                    ownerId
                ) ||
                !businessProfile.businessId.equals(
                    businessId
                ) ||
                !businessProfile.branchId.equals(
                    branchId
                ) ||
                businessCode == null ||
                branchCode == null ||
                !businessProfile.businessCode.equals(
                    businessCode
                ) ||
                !businessProfile.branchCode.equals(
                    branchCode
                )
            )
        ) {
            throw invalid(
                "Runtime Authority Business Profile does not match its signed branch scope."
            );
        }
        return new Payload(
            schemaVersion,
            purpose,
            authorityId,
            sourceAuthorizationId,
            credentialId,
            activationId,
            branchAccessGrantId,
            storageEntitlementId,
            ownerId,
            businessId,
            branchId,
            businessCode,
            branchCode,
            businessProfile,
            userId,
            username,
            canonicalUsername,
            fullName,
            role,
            storageMode,
            dataContext,
            demoId,
            authGeneration,
            activationStatus,
            activationActivatedAt,
            activationCreatedAt,
            activationUpdatedAt,
            branchAccessType,
            registrationPayment,
            registrationCycle,
            demoRemarks,
            accessMode,
            accessValidFrom,
            accessValidUntil,
            branchAccessCreatedAt,
            branchAccessUpdatedAt,
            storageEntitlementStatus,
            storageEntitlementActivatedAt,
            storageEntitlementCreatedAt,
            storageEntitlementUpdatedAt,
            portableAuthFingerprint,
            issuedAt
        );
    }

    private static BusinessProfile parseOptionalBusinessProfile(
        JSONObject payload
    ) {
        Object raw =
            payload.opt(
                "businessProfile"
            );

        if (
            raw == null ||
            raw == JSONObject.NULL
        ) {
            return null;
        }

        if (!(raw instanceof JSONObject)) {
            throw invalid(
                "Runtime Authority businessProfile is invalid."
            );
        }

        JSONObject profile =
            (JSONObject) raw;

        assertExactKeys(
            profile,
            BUSINESS_PROFILE_KEYS,
            null,
            null,
            "Runtime Authority businessProfile"
        );

        String profileId =
            requiredString(
                profile,
                "profileId"
            );

        String ownerId =
            requiredString(
                profile,
                "ownerId"
            );

        String businessId =
            requiredString(
                profile,
                "businessId"
            );

        String branchId =
            requiredString(
                profile,
                "branchId"
            );

        String businessCode =
            requiredString(
                profile,
                "businessCode"
            );

        String branchCode =
            requiredString(
                profile,
                "branchCode"
            );

        String businessName =
            requiredString(
                profile,
                "businessName"
            );

        String branchName =
            requiredString(
                profile,
                "branchName"
            );

        String installationId =
            requiredString(
                profile,
                "installationId"
            );

        String bindingKeyId =
            requiredString(
                profile,
                "bindingKeyId"
            );

        String fingerprintAlgorithm =
            requiredString(
                profile,
                "fingerprintAlgorithm"
            );

        String publicKeyFingerprint =
            requiredString(
                profile,
                "publicKeyFingerprint"
            );

        String createdAt =
            requiredString(
                profile,
                "createdAt"
            );

        String updatedAt =
            requiredString(
                profile,
                "updatedAt"
            );

        long schemaVersion =
            requiredPositiveInteger(
                profile,
                "schemaVersion"
            );

        if (
            !"SHA-256".equals(
                fingerprintAlgorithm
            ) ||
            !publicKeyFingerprint.matches(
                "^[0-9a-f]{64}$"
            ) ||
            schemaVersion != 1L
        ) {
            throw invalid(
                "Runtime Authority businessProfile identity metadata is invalid."
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
                    Locale.ROOT
                );

        if (
            !expectedBindingKeyId.equals(
                bindingKeyId
            )
        ) {
            throw invalid(
                "Runtime Authority businessProfile bindingKeyId is invalid."
            );
        }

        final Instant createdInstant;
        final Instant updatedInstant;

        try {
            createdInstant =
                Instant.parse(
                    createdAt
                );

            updatedInstant =
                Instant.parse(
                    updatedAt
                );
        }
        catch (Exception error) {
            throw invalid(
                "Runtime Authority businessProfile timestamp is invalid."
            );
        }

        if (
            !CANONICAL_TIMESTAMP
                .format(
                    createdInstant
                )
                .equals(
                    createdAt
                ) ||
            !CANONICAL_TIMESTAMP
                .format(
                    updatedInstant
                )
                .equals(
                    updatedAt
                ) ||
            updatedInstant.isBefore(
                createdInstant
            )
        ) {
            throw invalid(
                "Runtime Authority businessProfile timestamp is not canonical."
            );
        }

        return new BusinessProfile(
            profileId,
            ownerId,
            businessId,
            branchId,
            businessCode,
            branchCode,
            businessName,
            branchName,
            installationId,
            bindingKeyId,
            fingerprintAlgorithm,
            publicKeyFingerprint,
            createdAt,
            updatedAt,
            1
        );
    }
    private static SignatureValue parseSignature(
        JSONObject value
    ) {
        assertExactKeys(
            value,
            SIGNATURE_KEYS,
            null,
            null,
            "Runtime Authority signature"
        );

        String algorithm =
            requiredString(
                value,
                "algorithm"
            );

        String encoding =
            requiredString(
                value,
                "encoding"
            );

        String canonicalization =
            requiredString(
                value,
                "canonicalization"
            );

        String keyId =
            requiredString(
                value,
                "keyId"
            );

        String signatureValue =
            requiredString(
                value,
                "value"
            );

        if (
            !SIGNATURE_ALGORITHM.equals(
                algorithm
            ) ||
            !SIGNATURE_ENCODING.equals(
                encoding
            ) ||
            !SIGNATURE_CANONICALIZATION.equals(
                canonicalization
            )
        ) {
            throw invalid(
                "Runtime Authority signature metadata is unsupported."
            );
        }

        return new SignatureValue(
            algorithm,
            encoding,
            canonicalization,
            keyId,
            signatureValue
        );
    }

    private static RegistrationPayment parseNullablePayment(
        JSONObject payload
    ) {
        Object raw =
            payload.opt(
                "registrationPayment"
            );

        if (
            raw == null ||
            raw == JSONObject.NULL
        ) {
            return null;
        }

        if (!(raw instanceof JSONObject)) {
            throw invalid(
                "Runtime Authority registrationPayment is invalid."
            );
        }

        JSONObject payment =
            (JSONObject) raw;

        assertExactKeys(
            payment,
            PAYMENT_REQUIRED_KEYS,
            PAYMENT_OPTIONAL_REFERENCE,
            PAYMENT_OPTIONAL_REMARKS,
            "Runtime Authority registrationPayment"
        );

        long amount =
            requiredPositiveInteger(
                payment,
                "amount"
            );

        String currency =
            requiredString(
                payment,
                "currency"
            );

        String paymentMode =
            requiredString(
                payment,
                "paymentMode"
            );

        String paidAt =
            requiredTimestamp(
                payment,
                "paidAt"
            );

        String reference =
            payment.has(
                PAYMENT_OPTIONAL_REFERENCE
            )
                ? requiredStringAllowEmpty(
                    payment,
                    PAYMENT_OPTIONAL_REFERENCE
                )
                : null;

        String remarks =
            payment.has(
                PAYMENT_OPTIONAL_REMARKS
            )
                ? requiredStringAllowEmpty(
                    payment,
                    PAYMENT_OPTIONAL_REMARKS
                )
                : null;

        Object refundableValue =
            payment.opt(
                "refundable"
            );

        if (
            amount != 2000L ||
            !"INR".equals(currency) ||
            !(
                "CASH".equals(paymentMode) ||
                "UPI".equals(paymentMode) ||
                "BANK_TRANSFER".equals(paymentMode) ||
                "OTHER".equals(paymentMode)
            ) ||
            !(refundableValue instanceof Boolean) ||
            ((Boolean) refundableValue).booleanValue()
        ) {
            throw invalid(
                "Runtime Authority registrationPayment is invalid."
            );
        }

        return new RegistrationPayment(
            amount,
            currency,
            paymentMode,
            paidAt,
            reference,
            remarks,
            false
        );
    }

    private static void assertExactKeys(
        JSONObject value,
        String[] required,
        String optionalOne,
        String optionalTwo,
        String label
    ) {
        Set<String> allowed =
            new HashSet<>();

        for (String key : required) {
            allowed.add(
                key
            );

            if (!value.has(key)) {
                throw invalid(
                    label +
                    " is missing " +
                    key +
                    "."
                );
            }
        }

        if (optionalOne != null) {
            allowed.add(
                optionalOne
            );
        }

        if (optionalTwo != null) {
            allowed.add(
                optionalTwo
            );
        }

        Iterator<String> keys =
            value.keys();

        while (keys.hasNext()) {
            String key =
                keys.next();

            if (!allowed.contains(key)) {
                throw invalid(
                    label +
                    " contains unsupported field " +
                    key +
                    "."
                );
            }
        }
    }

    private static JSONObject requiredObject(
        JSONObject value,
        String key
    ) {
        Object raw =
            value.opt(
                key
            );

        if (!(raw instanceof JSONObject)) {
            throw invalid(
                key +
                " must be an object."
            );
        }

        return (JSONObject) raw;
    }

    private static String requiredString(
        JSONObject value,
        String key
    ) {
        Object raw =
            value.opt(
                key
            );

        if (!(raw instanceof String)) {
            throw invalid(
                key +
                " must be a non-empty string."
            );
        }

        String result =
            (String) raw;

        if (result.trim().length() == 0) {
            throw invalid(
                key +
                " must be a non-empty string."
            );
        }

        return result;
    }

    private static String requiredStringAllowEmpty(
        JSONObject value,
        String key
    ) {
        Object raw =
            value.opt(
                key
            );

        if (!(raw instanceof String)) {
            throw invalid(
                key +
                " must be a string."
            );
        }

        return (String) raw;
    }

    private static String nullableString(
        JSONObject value,
        String key
    ) {
        Object raw =
            value.opt(
                key
            );

        if (
            raw == null ||
            raw == JSONObject.NULL
        ) {
            return null;
        }

        if (!(raw instanceof String)) {
            throw invalid(
                key +
                " must be a string or null."
            );
        }

        return (String) raw;
    }

    private static long requiredPositiveInteger(
        JSONObject value,
        String key
    ) {
        Object raw =
            value.opt(
                key
            );

        if (!(raw instanceof Number)) {
            throw invalid(
                key +
                " must be a positive safe integer."
            );
        }

        double number =
            ((Number) raw)
                .doubleValue();

        if (
            !Double.isFinite(number) ||
            number <= 0d ||
            number >
                (double) MAX_SAFE_INTEGER ||
            Math.rint(number) != number
        ) {
            throw invalid(
                key +
                " must be a positive safe integer."
            );
        }

        return (long) number;
    }

    private static Long nullablePositiveInteger(
        JSONObject value,
        String key
    ) {
        Object raw =
            value.opt(
                key
            );

        if (
            raw == null ||
            raw == JSONObject.NULL
        ) {
            return null;
        }

        return Long.valueOf(
            requiredPositiveInteger(
                value,
                key
            )
        );
    }

    private static String requiredTimestamp(
        JSONObject value,
        String key
    ) {
        String result =
            requiredString(
                value,
                key
            );

        assertCanonicalTimestamp(
            result,
            key
        );

        return result;
    }

    private static String nullableTimestamp(
        JSONObject value,
        String key
    ) {
        Object raw =
            value.opt(
                key
            );

        if (
            raw == null ||
            raw == JSONObject.NULL
        ) {
            return null;
        }

        if (!(raw instanceof String)) {
            throw invalid(
                key +
                " must be a timestamp or null."
            );
        }

        String result =
            (String) raw;

        assertCanonicalTimestamp(
            result,
            key
        );

        return result;
    }

    private static void assertCanonicalTimestamp(
        String value,
        String label
    ) {
        try {
            Instant instant =
                Instant.parse(
                    value
                );

            if (
                !CANONICAL_TIMESTAMP
                    .format(
                        instant
                    )
                    .equals(
                        value
                    )
            ) {
                throw invalid(
                    label +
                    " must be a canonical ISO timestamp."
                );
            }
        }
        catch (IllegalArgumentException error) {
            throw error;
        }
        catch (Exception error) {
            throw invalid(
                label +
                " must be a canonical ISO timestamp."
            );
        }
    }

    private static void appendPaymentField(
        StringBuilder output,
        RegistrationPayment payment
    ) {
        appendKey(
            output,
            "registrationPayment",
            false
        );

        if (payment == null) {
            output.append(
                "null"
            );

            return;
        }

        output.append('{');

        appendNumberField(
            output,
            "amount",
            payment.amount,
            true
        );

        appendStringField(
            output,
            "currency",
            payment.currency,
            false
        );

        appendStringField(
            output,
            "paymentMode",
            payment.paymentMode,
            false
        );

        appendStringField(
            output,
            "paidAt",
            payment.paidAt,
            false
        );

        if (payment.reference != null) {
            appendStringField(
                output,
                "reference",
                payment.reference,
                false
            );
        }

        if (payment.remarks != null) {
            appendStringField(
                output,
                "remarks",
                payment.remarks,
                false
            );
        }

        appendBooleanField(
            output,
            "refundable",
            false,
            false
        );

        output.append('}');
    }

    private static void appendStringField(
        StringBuilder output,
        String key,
        String value,
        boolean first
    ) {
        appendKey(
            output,
            key,
            first
        );

        appendJsonString(
            output,
            value
        );
    }

    private static void appendNullableStringField(
        StringBuilder output,
        String key,
        String value,
        boolean first
    ) {
        appendKey(
            output,
            key,
            first
        );

        if (value == null) {
            output.append(
                "null"
            );
        }
        else {
            appendJsonString(
                output,
                value
            );
        }
    }

    private static void appendNumberField(
        StringBuilder output,
        String key,
        long value,
        boolean first
    ) {
        appendKey(
            output,
            key,
            first
        );

        output.append(
            value
        );
    }

    private static void appendNullableNumberField(
        StringBuilder output,
        String key,
        Long value,
        boolean first
    ) {
        appendKey(
            output,
            key,
            first
        );

        if (value == null) {
            output.append(
                "null"
            );
        }
        else {
            output.append(
                value.longValue()
            );
        }
    }

    private static void appendBooleanField(
        StringBuilder output,
        String key,
        boolean value,
        boolean first
    ) {
        appendKey(
            output,
            key,
            first
        );

        output.append(
            value
                ? "true"
                : "false"
        );
    }

    private static void appendKey(
        StringBuilder output,
        String key,
        boolean first
    ) {
        if (!first) {
            output.append(',');
        }

        appendJsonString(
            output,
            key
        );

        output.append(':');
    }

    /*
     * Well-formed JSON.stringify compatible string escaping.
     *
     * Deliberately does NOT escape '/' and does not reorder any
     * code point. Lone UTF-16 surrogates use the JSON unicode escape form.
     */
    private static void appendJsonString(
        StringBuilder output,
        String value
    ) {
        if (value == null) {
            throw invalid(
                "Canonical JSON string value is required."
            );
        }

        output.append('"');

        for (
            int index = 0;
            index < value.length();
            index++
        ) {
            char character =
                value.charAt(
                    index
                );

            switch (character) {
                case '"':
                    output.append(
                        "\\\""
                    );
                    break;

                case '\\':
                    output.append(
                        "\\\\"
                    );
                    break;

                case '\b':
                    output.append(
                        "\\b"
                    );
                    break;

                case '\f':
                    output.append(
                        "\\f"
                    );
                    break;

                case '\n':
                    output.append(
                        "\\n"
                    );
                    break;

                case '\r':
                    output.append(
                        "\\r"
                    );
                    break;

                case '\t':
                    output.append(
                        "\\t"
                    );
                    break;

                default:
                    if (character <= 0x001f) {
                        appendUnicodeEscape(
                            output,
                            character
                        );
                    }
                    else if (
                        Character.isHighSurrogate(
                            character
                        )
                    ) {
                        if (
                            index + 1 <
                                value.length() &&
                            Character.isLowSurrogate(
                                value.charAt(
                                    index + 1
                                )
                            )
                        ) {
                            output.append(
                                character
                            );

                            index++;

                            output.append(
                                value.charAt(
                                    index
                                )
                            );
                        }
                        else {
                            appendUnicodeEscape(
                                output,
                                character
                            );
                        }
                    }
                    else if (
                        Character.isLowSurrogate(
                            character
                        )
                    ) {
                        appendUnicodeEscape(
                            output,
                            character
                        );
                    }
                    else {
                        output.append(
                            character
                        );
                    }

                    break;
            }
        }

        output.append('"');
    }

    private static void appendUnicodeEscape(
        StringBuilder output,
        char value
    ) {
        output.append(
            "\\u"
        );

        String hex =
            Integer.toHexString(
                value
            );

        for (
            int index = hex.length();
            index < 4;
            index++
        ) {
            output.append('0');
        }

        output.append(
            hex
        );
    }

    private static IllegalArgumentException invalid(
        String message
    ) {
        return new IllegalArgumentException(
            "FINORA " +
            message
        );
    }
}