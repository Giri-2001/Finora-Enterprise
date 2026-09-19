package com.finora.enterprise.control;

import java.math.BigDecimal;
import java.math.BigInteger;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeFormatterBuilder;
import java.util.Arrays;
import java.util.Base64;
import java.util.Collections;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;

import org.json.JSONException;
import org.json.JSONObject;

/**
 * FINORA ENTERPRISE OS
 * PORTABLE BRANCH AUTH V1 CORE PAYLOAD CODEC
 *
 * Bounded P1E-I1A scope:
 *
 * - exact top-level payload keys;
 * - canonical scalar strings;
 * - canonical username;
 * - REAL / DEMO contract;
 * - LOCAL / USB contract;
 * - Password + Security verifier structure;
 * - source authorization evidence;
 * - verified Control signer;
 * - positive safe integer sequence/generation;
 * - canonical ISO timestamps.
 *
 * Deliberately NOT accepted yet:
 *
 * - portabilityAuthorityProof;
 * - branchCertificationKeyMaterial.
 *
 * Those optional authorities require their own exact Android
 * validators and are added in the next bounded P1E slice.
 *
 * This class is not wired to login/store/IPC yet.
 */
public final class FinoraPortableBranchAuthPayloadCodec {

    private static final long MAX_SAFE_INTEGER =
        9007199254740991L;

    private static final DateTimeFormatter CANONICAL_ISO =
        new DateTimeFormatterBuilder()
            .appendInstant(3)
            .toFormatter();

    private static final Set<String> PAYLOAD_REQUIRED_KEYS =
        immutableSet(
            "schemaVersion",
            "authStateId",
            "sourceAuthorizationId",
            "sourceAuthorizationVerificationEvidence",
            "ownerId",
            "businessId",
            "branchId",
            "userId",
            "username",
            "canonicalUsername",
            "fullName",
            "role",
            "dataContext",
            "storageMode",
            "passwordVerifier",
            "securityVerifier",
            "authGeneration",
            "createdAt",
            "updatedAt"
        );

    private static final Set<String> PAYLOAD_OPTIONAL_KEYS =
        immutableSet(
            "demoId",
            "branchCertificationKeyMaterial"
        );

    private static final Set<String> VERIFIER_KEYS =
        immutableSet(
            "algorithm",
            "salt",
            "N",
            "r",
            "p",
            "derivedKeyLength",
            "verifierLength",
            "verifier"
        );

    private static final Set<String> SOURCE_EVIDENCE_REQUIRED_KEYS =
        immutableSet(
            "authorizationId",
            "packageId",
            "issuerId",
            "sequence",
            "verifiedControlSigner",
            "verifiedAt",
            "schemaVersion"
        );

    private static final Set<String> SOURCE_EVIDENCE_OPTIONAL_KEYS =
        immutableSet(
            "portabilityAuthorityProof"
        );

    private static final Set<String> VERIFIED_SIGNER_REQUIRED_KEYS =
        immutableSet(
            "issuerId",
            "signingKeyId",
            "algorithm",
            "format",
            "publicKey",
            "status",
            "validFrom"
        );

    private static final Set<String> VERIFIED_SIGNER_OPTIONAL_KEYS =
        immutableSet(
            "validUntil"
        );

    private static final Set<String> PORTABILITY_PROVENANCE_KEYS =
        immutableSet(
            "sourceAuthorizationId",
            "signedPortabilityAuthorityPackage",
            "verifiedControlSigner",
            "verifiedAt",
            "schemaVersion"
        );

    private static final Set<String> PORTABILITY_TARGET_KEYS =
        immutableSet(
            "ownerId",
            "businessId",
            "branchId"
        );

    private static final Set<String> PORTABILITY_PAYLOAD_REQUIRED_KEYS =
        immutableSet(
            "sourceAuthorizationId",
            "userId",
            "username",
            "role",
            "ownerId",
            "businessId",
            "branchId",
            "storageMode",
            "dataContext",
            "sourceAuthorizationMethod",
            "schemaVersion"
        );

    private static final Set<String> PORTABILITY_PAYLOAD_OPTIONAL_KEYS =
        immutableSet(
            "demoId"
        );
    private FinoraPortableBranchAuthPayloadCodec() {
    }

    public static final class Payload {

        public final int schemaVersion;
        public final String authStateId;
        public final String sourceAuthorizationId;
        public final SourceAuthorizationEvidence sourceAuthorizationVerificationEvidence;
        public final String ownerId;
        public final String businessId;
        public final String branchId;
        public final String userId;
        public final String username;
        public final String canonicalUsername;
        public final String fullName;
        public final String role;
        public final String dataContext;
        public final String demoId;
        public final String storageMode;
        public final Verifier passwordVerifier;
        public final Verifier securityVerifier;
        public final long authGeneration;
        public final String createdAt;
        public final String updatedAt;
        public final FinoraBranchCertificationCryptoValidator.Material branchCertificationKeyMaterial;

        private Payload(
            int schemaVersion,
            String authStateId,
            String sourceAuthorizationId,
            SourceAuthorizationEvidence sourceAuthorizationVerificationEvidence,
            String ownerId,
            String businessId,
            String branchId,
            String userId,
            String username,
            String canonicalUsername,
            String fullName,
            String role,
            String dataContext,
            String demoId,
            String storageMode,
            Verifier passwordVerifier,
            Verifier securityVerifier,
            long authGeneration,
            String createdAt,
            String updatedAt,
            FinoraBranchCertificationCryptoValidator.Material branchCertificationKeyMaterial
        ) {
            this.schemaVersion =
                schemaVersion;

            this.authStateId =
                authStateId;

            this.sourceAuthorizationId =
                sourceAuthorizationId;

            this.sourceAuthorizationVerificationEvidence =
                sourceAuthorizationVerificationEvidence;

            this.ownerId =
                ownerId;

            this.businessId =
                businessId;

            this.branchId =
                branchId;

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

            this.dataContext =
                dataContext;

            this.demoId =
                demoId;

            this.storageMode =
                storageMode;

            this.passwordVerifier =
                passwordVerifier;

            this.securityVerifier =
                securityVerifier;

            this.authGeneration =
                authGeneration;

            this.createdAt =
                createdAt;

            this.updatedAt =
                updatedAt;

            this.branchCertificationKeyMaterial =
                branchCertificationKeyMaterial;
        }
    }

    public static final class Verifier {

        public final String algorithm;
        public final String salt;
        public final int N;
        public final int r;
        public final int p;
        public final int derivedKeyLength;
        public final int verifierLength;
        public final String verifier;

        private Verifier(
            String algorithm,
            String salt,
            int N,
            int r,
            int p,
            int derivedKeyLength,
            int verifierLength,
            String verifier
        ) {
            this.algorithm =
                algorithm;

            this.salt =
                salt;

            this.N =
                N;

            this.r =
                r;

            this.p =
                p;

            this.derivedKeyLength =
                derivedKeyLength;

            this.verifierLength =
                verifierLength;

            this.verifier =
                verifier;
        }
    }

    public static final class VerifiedControlSigner {

        public final String issuerId;
        public final String signingKeyId;
        public final String algorithm;
        public final String format;
        public final String publicKey;
        public final String status;
        public final String validFrom;
        public final String validUntil;

        private VerifiedControlSigner(
            String issuerId,
            String signingKeyId,
            String algorithm,
            String format,
            String publicKey,
            String status,
            String validFrom,
            String validUntil
        ) {
            this.issuerId =
                issuerId;

            this.signingKeyId =
                signingKeyId;

            this.algorithm =
                algorithm;

            this.format =
                format;

            this.publicKey =
                publicKey;

            this.status =
                status;

            this.validFrom =
                validFrom;

            this.validUntil =
                validUntil;
        }
    }

    public static final class PackageIssuer {

        public final String type;
        public final String issuerId;
        public final String signingKeyId;

        private PackageIssuer(
            String type,
            String issuerId,
            String signingKeyId
        ) {
            this.type =
                type;

            this.issuerId =
                issuerId;

            this.signingKeyId =
                signingKeyId;
        }
    }

    public static final class BranchTarget {

        public final String ownerId;
        public final String businessId;
        public final String branchId;

        private BranchTarget(
            String ownerId,
            String businessId,
            String branchId
        ) {
            this.ownerId =
                ownerId;

            this.businessId =
                businessId;

            this.branchId =
                branchId;
        }
    }

    public static final class PortabilityPayload {

        public final String sourceAuthorizationId;
        public final String userId;
        public final String username;
        public final String role;
        public final String ownerId;
        public final String businessId;
        public final String branchId;
        public final String storageMode;
        public final String dataContext;
        public final String demoId;
        public final String sourceAuthorizationMethod;
        public final int schemaVersion;

        private PortabilityPayload(
            String sourceAuthorizationId,
            String userId,
            String username,
            String role,
            String ownerId,
            String businessId,
            String branchId,
            String storageMode,
            String dataContext,
            String demoId,
            String sourceAuthorizationMethod,
            int schemaVersion
        ) {
            this.sourceAuthorizationId =
                sourceAuthorizationId;

            this.userId =
                userId;

            this.username =
                username;

            this.role =
                role;

            this.ownerId =
                ownerId;

            this.businessId =
                businessId;

            this.branchId =
                branchId;

            this.storageMode =
                storageMode;

            this.dataContext =
                dataContext;

            this.demoId =
                demoId;

            this.sourceAuthorizationMethod =
                sourceAuthorizationMethod;

            this.schemaVersion =
                schemaVersion;
        }
    }

    public static final class PayloadDigest {

        public final String algorithm;
        public final String value;

        private PayloadDigest(
            String algorithm,
            String value
        ) {
            this.algorithm =
                algorithm;

            this.value =
                value;
        }
    }

    public static final class PackageSignature {

        public final String algorithm;
        public final String encoding;
        public final String signingKeyId;
        public final String value;

        private PackageSignature(
            String algorithm,
            String encoding,
            String signingKeyId,
            String value
        ) {
            this.algorithm =
                algorithm;

            this.encoding =
                encoding;

            this.signingKeyId =
                signingKeyId;

            this.value =
                value;
        }
    }

    public static final class SignedPortabilityAuthorityPackage {

        public final String packageId;
        public final String purpose;
        public final PackageIssuer issuer;
        public final BranchTarget target;
        public final String issuedAt;
        public final String expiresAt;
        public final long sequence;
        public final int payloadVersion;
        public final PortabilityPayload payload;
        public final PayloadDigest payloadDigest;
        public final PackageSignature signature;
        public final int schemaVersion;

        private SignedPortabilityAuthorityPackage(
            String packageId,
            String purpose,
            PackageIssuer issuer,
            BranchTarget target,
            String issuedAt,
            String expiresAt,
            long sequence,
            int payloadVersion,
            PortabilityPayload payload,
            PayloadDigest payloadDigest,
            PackageSignature signature,
            int schemaVersion
        ) {
            this.packageId =
                packageId;

            this.purpose =
                purpose;

            this.issuer =
                issuer;

            this.target =
                target;

            this.issuedAt =
                issuedAt;

            this.expiresAt =
                expiresAt;

            this.sequence =
                sequence;

            this.payloadVersion =
                payloadVersion;

            this.payload =
                payload;

            this.payloadDigest =
                payloadDigest;

            this.signature =
                signature;

            this.schemaVersion =
                schemaVersion;
        }
    }

    public static final class PortabilityAuthorityProof {

        public final String sourceAuthorizationId;
        public final SignedPortabilityAuthorityPackage signedPortabilityAuthorityPackage;
        public final VerifiedControlSigner verifiedControlSigner;
        public final String verifiedAt;
        public final int schemaVersion;

        private PortabilityAuthorityProof(
            String sourceAuthorizationId,
            SignedPortabilityAuthorityPackage signedPortabilityAuthorityPackage,
            VerifiedControlSigner verifiedControlSigner,
            String verifiedAt,
            int schemaVersion
        ) {
            this.sourceAuthorizationId =
                sourceAuthorizationId;

            this.signedPortabilityAuthorityPackage =
                signedPortabilityAuthorityPackage;

            this.verifiedControlSigner =
                verifiedControlSigner;

            this.verifiedAt =
                verifiedAt;

            this.schemaVersion =
                schemaVersion;
        }
    }
    public static final class SourceAuthorizationEvidence {

        public final String authorizationId;
        public final String packageId;
        public final String issuerId;
        public final long sequence;
        public final VerifiedControlSigner verifiedControlSigner;
        public final PortabilityAuthorityProof portabilityAuthorityProof;
        public final String verifiedAt;
        public final int schemaVersion;

        private SourceAuthorizationEvidence(
            String authorizationId,
            String packageId,
            String issuerId,
            long sequence,
            VerifiedControlSigner verifiedControlSigner,
            PortabilityAuthorityProof portabilityAuthorityProof,
            String verifiedAt,
            int schemaVersion
        ) {
            this.authorizationId =
                authorizationId;

            this.packageId =
                packageId;

            this.issuerId =
                issuerId;

            this.sequence =
                sequence;

            this.verifiedControlSigner =
                verifiedControlSigner;

            this.portabilityAuthorityProof =
                portabilityAuthorityProof;

            this.verifiedAt =
                verifiedAt;

            this.schemaVersion =
                schemaVersion;
        }
    }
    public static Payload parseCorePayload(
        byte[] plaintext
    ) {
        if (
            plaintext == null ||
            plaintext.length == 0
        ) {
            throw new IllegalArgumentException(
                "Portable Branch Auth payload is empty."
            );
        }

        final JSONObject root;

        try {
            root =
                new JSONObject(
                    new String(
                        plaintext,
                        StandardCharsets.UTF_8
                    )
                );
        }
        catch (JSONException error) {
            throw new IllegalArgumentException(
                "Portable Branch Auth payload is not valid JSON.",
                error
            );
        }

        assertExactKeys(
            root,
            PAYLOAD_REQUIRED_KEYS,
            PAYLOAD_OPTIONAL_KEYS,
            "payload"
        );

        FinoraBranchCertificationCryptoValidator.Material branchCertificationKeyMaterial =
            null;

        if (
            root.has(
                "branchCertificationKeyMaterial"
            )
        ) {
            branchCertificationKeyMaterial =
                FinoraPortableBranchAuthCertificationMaterialParser.parse(
                    requireObject(
                        root,
                        "branchCertificationKeyMaterial"
                    )
                );
        }

        int schemaVersion =
            requireExactInt(
                root,
                "schemaVersion"
            );

        if (
            schemaVersion !=
            1
        ) {
            throw new IllegalArgumentException(
                "Portable Branch Auth payload schemaVersion is unsupported."
            );
        }

        String authStateId =
            requireCanonicalString(
                root,
                "authStateId",
                512
            );

        String sourceAuthorizationId =
            requireCanonicalString(
                root,
                "sourceAuthorizationId",
                512
            );

        SourceAuthorizationEvidence evidence =
            parseSourceAuthorizationEvidence(
                requireObject(
                    root,
                    "sourceAuthorizationVerificationEvidence"
                )
            );

        if (
            evidence.authorizationId.equals(
                sourceAuthorizationId
            ) == false
        ) {
            throw new IllegalArgumentException(
                "Portable Branch Auth source authorization verification evidence does not match sourceAuthorizationId."
            );
        }

        String ownerId =
            requireCanonicalString(
                root,
                "ownerId",
                256
            );

        String businessId =
            requireCanonicalString(
                root,
                "businessId",
                256
            );

        String branchId =
            requireCanonicalString(
                root,
                "branchId",
                256
            );

        String userId =
            requireCanonicalString(
                root,
                "userId",
                256
            );

        String username =
            requireCanonicalString(
                root,
                "username",
                256
            );

        String canonicalUsername =
            requireCanonicalString(
                root,
                "canonicalUsername",
                256
            );

        if (
            canonicalUsername.equals(
                canonicalUsername.toLowerCase(
                    Locale.ROOT
                )
            ) == false
        ) {
            throw new IllegalArgumentException(
                "canonicalUsername must be lower-case canonical form."
            );
        }

        String fullName =
            requireCanonicalString(
                root,
                "fullName",
                512
            );

        String role =
            requireCanonicalString(
                root,
                "role",
                128
            );

        String dataContext =
            requireString(
                root,
                "dataContext"
            );

        if (
            !"REAL".equals(
                dataContext
            ) &&
            !"DEMO".equals(
                dataContext
            )
        ) {
            throw new IllegalArgumentException(
                "dataContext is invalid."
            );
        }

        String demoId =
            null;

        if (
            "DEMO".equals(
                dataContext
            )
        ) {
            demoId =
                requireCanonicalString(
                    root,
                    "demoId",
                    256
                );
        }
        else if (
            root.has(
                "demoId"
            )
        ) {
            throw new IllegalArgumentException(
                "demoId is not allowed for REAL data context."
            );
        }

        String storageMode =
            requireString(
                root,
                "storageMode"
            );

        if (
            !"LOCAL".equals(
                storageMode
            ) &&
            !"USB".equals(
                storageMode
            )
        ) {
            throw new IllegalArgumentException(
                "storageMode is invalid."
            );
        }

        Verifier passwordVerifier =
            parseVerifier(
                requireObject(
                    root,
                    "passwordVerifier"
                ),
                "passwordVerifier"
            );

        Verifier securityVerifier =
            parseVerifier(
                requireObject(
                    root,
                    "securityVerifier"
                ),
                "securityVerifier"
            );

        long authGeneration =
            requirePositiveSafeInteger(
                root,
                "authGeneration"
            );

        String createdAt =
            requireCanonicalTimestamp(
                root,
                "createdAt"
            );

        String updatedAt =
            requireCanonicalTimestamp(
                root,
                "updatedAt"
            );

        if (
            Instant.parse(
                updatedAt
            ).isBefore(
                Instant.parse(
                    createdAt
                )
            )
        ) {
            throw new IllegalArgumentException(
                "updatedAt cannot precede createdAt."
            );
        }

        return new Payload(
            schemaVersion,
            authStateId,
            sourceAuthorizationId,
            evidence,
            ownerId,
            businessId,
            branchId,
            userId,
            username,
            canonicalUsername,
            fullName,
            role,
            dataContext,
            demoId,
            storageMode,
            passwordVerifier,
            securityVerifier,
            authGeneration,
            createdAt,
            updatedAt,
            branchCertificationKeyMaterial
        );
    }

    private static SourceAuthorizationEvidence parseSourceAuthorizationEvidence(
        JSONObject evidence
    ) {
        assertExactKeys(
            evidence,
            SOURCE_EVIDENCE_REQUIRED_KEYS,
            SOURCE_EVIDENCE_OPTIONAL_KEYS,
            "sourceAuthorizationVerificationEvidence"
        );

        String authorizationId =
            requireCanonicalString(
                evidence,
                "authorizationId",
                512
            );

        String packageId =
            requireCanonicalString(
                evidence,
                "packageId",
                512
            );

        String issuerId =
            requireCanonicalString(
                evidence,
                "issuerId",
                512
            );

        long sequence =
            requirePositiveSafeInteger(
                evidence,
                "sequence"
            );

        VerifiedControlSigner signer =
            parseVerifiedControlSigner(
                requireObject(
                    evidence,
                    "verifiedControlSigner"
                )
            );

        if (
            !signer.issuerId.equals(
                issuerId
            )
        ) {
            throw new IllegalArgumentException(
                "Portable Branch Auth source authorization signer issuer does not match evidence issuer."
            );
        }
        PortabilityAuthorityProof portabilityAuthorityProof =
            null;

        if (
            evidence.has(
                "portabilityAuthorityProof"
            )
        ) {
            portabilityAuthorityProof =
                parsePortabilityAuthorityProof(
                    requireObject(
                        evidence,
                        "portabilityAuthorityProof"
                    )
                );
        }

        String verifiedAt =
            requireCanonicalTimestamp(
                evidence,
                "verifiedAt"
            );

        int schemaVersion =
            requireExactInt(
                evidence,
                "schemaVersion"
            );

        if (
            schemaVersion !=
            1
        ) {
            throw new IllegalArgumentException(
                "Portable Branch Auth source authorization verification evidence schemaVersion is unsupported."
            );
        }

        if (
            portabilityAuthorityProof !=
            null
        ) {
            SignedPortabilityAuthorityPackage signedPackage =
                portabilityAuthorityProof
                    .signedPortabilityAuthorityPackage;

            VerifiedControlSigner portabilitySigner =
                portabilityAuthorityProof
                    .verifiedControlSigner;

            if (
                !portabilityAuthorityProof
                    .sourceAuthorizationId
                    .equals(
                        authorizationId
                    ) ||
                !signedPackage
                    .payload
                    .sourceAuthorizationId
                    .equals(
                        authorizationId
                    ) ||
                !signedPackage
                    .issuer
                    .issuerId
                    .equals(
                        issuerId
                    ) ||
                !signedPackage
                    .issuer
                    .signingKeyId
                    .equals(
                        signer.signingKeyId
                    ) ||
                !sameVerifiedControlSigner(
                    portabilitySigner,
                    signer
                ) ||
                !portabilityAuthorityProof
                    .verifiedAt
                    .equals(
                        verifiedAt
                    )
            ) {
                throw new IllegalArgumentException(
                    "Portable Branch Auth portability authority proof does not match the exact source authorization lineage and verified Control Center signer."
                );
            }
        }

        return new SourceAuthorizationEvidence(
            authorizationId,
            packageId,
            issuerId,
            sequence,
            signer,
            portabilityAuthorityProof,
            verifiedAt,
            schemaVersion
        );
    }

    private static PortabilityAuthorityProof parsePortabilityAuthorityProof(
        JSONObject proof
    ) {
        assertExactKeys(
            proof,
            PORTABILITY_PROVENANCE_KEYS,
            Collections.<String>emptySet(),
            "portabilityAuthorityProof"
        );

        String sourceAuthorizationId =
            requireText(
                proof,
                "sourceAuthorizationId",
                256
            );

        if (
            !sourceAuthorizationId.startsWith(
                "FINORA-CREDENTIAL-ENROLLMENT-"
            )
        ) {
            throw new IllegalArgumentException(
                "Portable Branch Auth portability authority sourceAuthorizationId is invalid."
            );
        }

        SignedPortabilityAuthorityPackage signedPackage =
            parseSignedPortabilityAuthorityPackage(
                requireObject(
                    proof,
                    "signedPortabilityAuthorityPackage"
                )
            );

        VerifiedControlSigner verifiedSigner =
            parseVerifiedControlSigner(
                requireObject(
                    proof,
                    "verifiedControlSigner"
                )
            );

        String verifiedAt =
            requireCanonicalTimestamp(
                proof,
                "verifiedAt"
            );

        int schemaVersion =
            requireExactInt(
                proof,
                "schemaVersion"
            );

        if (
            schemaVersion !=
            1
        ) {
            throw new IllegalArgumentException(
                "Portable Branch Auth portability authority proof schemaVersion is unsupported."
            );
        }

        if (
            !signedPackage
                .payload
                .sourceAuthorizationId
                .equals(
                    sourceAuthorizationId
                ) ||
            !signedPackage
                .issuer
                .issuerId
                .equals(
                    verifiedSigner.issuerId
                ) ||
            !signedPackage
                .issuer
                .signingKeyId
                .equals(
                    verifiedSigner.signingKeyId
                )
        ) {
            throw new IllegalArgumentException(
                "Portable Branch Auth portability authority provenance is invalid."
            );
        }

        return new PortabilityAuthorityProof(
            sourceAuthorizationId,
            signedPackage,
            verifiedSigner,
            verifiedAt,
            schemaVersion
        );
    }

    private static SignedPortabilityAuthorityPackage parseSignedPortabilityAuthorityPackage(
        JSONObject signedPackage
    ) {
        String packageId =
            requireText(
                signedPackage,
                "packageId",
                256
            );

        if (
            !packageId.startsWith(
                "FINORA-BRANCH-PORTABILITY-"
            )
        ) {
            throw new IllegalArgumentException(
                "Portable Branch Auth portability packageId is invalid."
            );
        }

        String purpose =
            requireString(
                signedPackage,
                "purpose"
            );

        if (
            !"BRANCH_PORTABILITY_AUTHORITY".equals(
                purpose
            )
        ) {
            throw new IllegalArgumentException(
                "Portable Branch Auth portability purpose is invalid."
            );
        }

        JSONObject issuerObject =
            requireObject(
                signedPackage,
                "issuer"
            );

        String issuerType =
            requireString(
                issuerObject,
                "type"
            );

        if (
            !"FINORA_CONTROL_CENTER".equals(
                issuerType
            )
        ) {
            throw new IllegalArgumentException(
                "Portable Branch Auth portability issuer type is invalid."
            );
        }

        PackageIssuer issuer =
            new PackageIssuer(
                issuerType,
                requireText(
                    issuerObject,
                    "issuerId",
                    256
                ),
                requireText(
                    issuerObject,
                    "signingKeyId",
                    256
                )
            );

        BranchTarget target =
            parseBranchTarget(
                requireObject(
                    signedPackage,
                    "target"
                )
            );

        String issuedAt =
            requireCanonicalTimestamp(
                signedPackage,
                "issuedAt"
            );

        String expiresAt =
            null;

        if (
            signedPackage.has(
                "expiresAt"
            )
        ) {
            expiresAt =
                requireCanonicalTimestamp(
                    signedPackage,
                    "expiresAt"
                );

            if (
                Instant.parse(
                    expiresAt
                ).isBefore(
                    Instant.parse(
                        issuedAt
                    )
                )
            ) {
                throw new IllegalArgumentException(
                    "Portable Branch Auth portability package validity window is invalid."
                );
            }
        }

        long sequence =
            requirePositiveSafeInteger(
                signedPackage,
                "sequence"
            );

        int payloadVersion =
            requireExactInt(
                signedPackage,
                "payloadVersion"
            );

        if (
            payloadVersion !=
            1
        ) {
            throw new IllegalArgumentException(
                "Portable Branch Auth portability payloadVersion is unsupported."
            );
        }

        PortabilityPayload payload =
            parsePortabilityPayload(
                requireObject(
                    signedPackage,
                    "payload"
                )
            );

        PayloadDigest payloadDigest =
            parsePayloadDigest(
                requireObject(
                    signedPackage,
                    "payloadDigest"
                )
            );

        PackageSignature signature =
            parsePackageSignature(
                requireObject(
                    signedPackage,
                    "signature"
                )
            );

        if (
            !signature
                .signingKeyId
                .equals(
                    issuer.signingKeyId
                )
        ) {
            throw new IllegalArgumentException(
                "Portable Branch Auth portability package signature key does not match issuer."
            );
        }

        int schemaVersion =
            requireExactInt(
                signedPackage,
                "schemaVersion"
            );

        if (
            schemaVersion !=
            1
        ) {
            throw new IllegalArgumentException(
                "Portable Branch Auth portability package schemaVersion is unsupported."
            );
        }

        if (
            !payload.ownerId.equals(
                target.ownerId
            ) ||
            !payload.businessId.equals(
                target.businessId
            ) ||
            !payload.branchId.equals(
                target.branchId
            )
        ) {
            throw new IllegalArgumentException(
                "Portable Branch Auth portability package payload does not match branch target."
            );
        }

        return new SignedPortabilityAuthorityPackage(
            packageId,
            purpose,
            issuer,
            target,
            issuedAt,
            expiresAt,
            sequence,
            payloadVersion,
            payload,
            payloadDigest,
            signature,
            schemaVersion
        );
    }

    private static BranchTarget parseBranchTarget(
        JSONObject target
    ) {
        assertExactKeys(
            target,
            PORTABILITY_TARGET_KEYS,
            Collections.<String>emptySet(),
            "portabilityAuthorityProof.signedPortabilityAuthorityPackage.target"
        );

        return new BranchTarget(
            requireText(
                target,
                "ownerId",
                256
            ),
            requireText(
                target,
                "businessId",
                256
            ),
            requireText(
                target,
                "branchId",
                256
            )
        );
    }

    private static PortabilityPayload parsePortabilityPayload(
        JSONObject payload
    ) {
        assertExactKeys(
            payload,
            PORTABILITY_PAYLOAD_REQUIRED_KEYS,
            PORTABILITY_PAYLOAD_OPTIONAL_KEYS,
            "portabilityAuthorityProof.signedPortabilityAuthorityPackage.payload"
        );

        String sourceAuthorizationId =
            requireText(
                payload,
                "sourceAuthorizationId",
                256
            );

        if (
            !sourceAuthorizationId.startsWith(
                "FINORA-CREDENTIAL-ENROLLMENT-"
            )
        ) {
            throw new IllegalArgumentException(
                "Portable Branch Auth portability payload sourceAuthorizationId is invalid."
            );
        }

        String userId =
            requireText(
                payload,
                "userId",
                256
            );

        String username =
            requireText(
                payload,
                "username",
                128
            );

        String role =
            requireString(
                payload,
                "role"
            );

        if (
            !"ADMIN".equals(role) &&
            !"MANAGER".equals(role) &&
            !"COLLECTOR".equals(role) &&
            !"VIEWER".equals(role)
        ) {
            throw new IllegalArgumentException(
                "Portable Branch Auth portability payload role is invalid."
            );
        }

        String ownerId =
            requireText(
                payload,
                "ownerId",
                256
            );

        String businessId =
            requireText(
                payload,
                "businessId",
                256
            );

        String branchId =
            requireText(
                payload,
                "branchId",
                256
            );

        String storageMode =
            requireString(
                payload,
                "storageMode"
            );

        if (
            !"LOCAL".equals(storageMode) &&
            !"USB".equals(storageMode)
        ) {
            throw new IllegalArgumentException(
                "Portable Branch Auth portability payload storageMode is invalid."
            );
        }

        String dataContext =
            requireString(
                payload,
                "dataContext"
            );

        if (
            !"REAL".equals(dataContext) &&
            !"DEMO".equals(dataContext)
        ) {
            throw new IllegalArgumentException(
                "Portable Branch Auth portability payload dataContext is invalid."
            );
        }

        String demoId =
            null;

        if (
            "DEMO".equals(
                dataContext
            )
        ) {
            demoId =
                requireText(
                    payload,
                    "demoId",
                    256
                );
        }
        else if (
            payload.has(
                "demoId"
            )
        ) {
            throw new IllegalArgumentException(
                "Portable Branch Auth portability payload demoId is not allowed for REAL data."
            );
        }

        String sourceAuthorizationMethod =
            requireString(
                payload,
                "sourceAuthorizationMethod"
            );

        if (
            !"SET_PASSWORD_ON_RECIPIENT".equals(
                sourceAuthorizationMethod
            )
        ) {
            throw new IllegalArgumentException(
                "Portable Branch Auth portability source authorization method is invalid."
            );
        }

        int schemaVersion =
            requireExactInt(
                payload,
                "schemaVersion"
            );

        if (
            schemaVersion !=
            1
        ) {
            throw new IllegalArgumentException(
                "Portable Branch Auth portability payload schemaVersion is unsupported."
            );
        }

        return new PortabilityPayload(
            sourceAuthorizationId,
            userId,
            username,
            role,
            ownerId,
            businessId,
            branchId,
            storageMode,
            dataContext,
            demoId,
            sourceAuthorizationMethod,
            schemaVersion
        );
    }

    private static PayloadDigest parsePayloadDigest(
        JSONObject digest
    ) {
        String algorithm =
            requireString(
                digest,
                "algorithm"
            );

        if (
            !"SHA-256".equals(
                algorithm
            )
        ) {
            throw new IllegalArgumentException(
                "Portable Branch Auth portability payload digest algorithm is invalid."
            );
        }

        String value =
            requireString(
                digest,
                "value"
            );

        if (
            !value.matches(
                "^[0-9a-f]{64}$"
            )
        ) {
            throw new IllegalArgumentException(
                "Portable Branch Auth portability payload digest value is invalid."
            );
        }

        return new PayloadDigest(
            algorithm,
            value
        );
    }

    private static PackageSignature parsePackageSignature(
        JSONObject signature
    ) {
        String algorithm =
            requireString(
                signature,
                "algorithm"
            );

        if (
            !"ECDSA_P256_SHA256".equals(
                algorithm
            )
        ) {
            throw new IllegalArgumentException(
                "Portable Branch Auth portability signature algorithm is invalid."
            );
        }

        String encoding =
            requireString(
                signature,
                "encoding"
            );

        if (
            !"IEEE_P1363".equals(
                encoding
            )
        ) {
            throw new IllegalArgumentException(
                "Portable Branch Auth portability signature encoding is invalid."
            );
        }

        String signingKeyId =
            requireText(
                signature,
                "signingKeyId",
                256
            );

        String value =
            requireText(
                signature,
                "value",
                65536
            );

        return new PackageSignature(
            algorithm,
            encoding,
            signingKeyId,
            value
        );
    }

    private static boolean sameVerifiedControlSigner(
        VerifiedControlSigner left,
        VerifiedControlSigner right
    ) {
        return (
            left.issuerId.equals(
                right.issuerId
            ) &&
            left.signingKeyId.equals(
                right.signingKeyId
            ) &&
            left.algorithm.equals(
                right.algorithm
            ) &&
            left.format.equals(
                right.format
            ) &&
            left.publicKey.equals(
                right.publicKey
            ) &&
            left.status.equals(
                right.status
            ) &&
            left.validFrom.equals(
                right.validFrom
            ) &&
            sameNullableString(
                left.validUntil,
                right.validUntil
            )
        );
    }

    private static boolean sameNullableString(
        String left,
        String right
    ) {
        return (
            left == null
                ? right == null
                : left.equals(
                    right
                )
        );
    }

    private static String requireText(
        JSONObject object,
        String key,
        int maximumLength
    ) {
        String value =
            requireString(
                object,
                key
            );

        if (
            ecmaTrim(
                value
            ).length() == 0 ||
            value.length() >
                maximumLength
        ) {
            throw new IllegalArgumentException(
                key +
                " must contain text within the allowed length."
            );
        }

        return value;
    }
    private static VerifiedControlSigner parseVerifiedControlSigner(
        JSONObject signer
    ) {
        assertExactKeys(
            signer,
            VERIFIED_SIGNER_REQUIRED_KEYS,
            VERIFIED_SIGNER_OPTIONAL_KEYS,
            "sourceAuthorizationVerificationEvidence.verifiedControlSigner"
        );

        String issuerId =
            requireCanonicalString(
                signer,
                "issuerId",
                512
            );

        String signingKeyId =
            requireCanonicalString(
                signer,
                "signingKeyId",
                512
            );

        String algorithm =
            requireString(
                signer,
                "algorithm"
            );

        if (
            !"ECDSA_P256_SHA256".equals(
                algorithm
            )
        ) {
            throw new IllegalArgumentException(
                "Portable Branch Auth verified Control signer algorithm is invalid."
            );
        }

        String format =
            requireString(
                signer,
                "format"
            );

        if (
            !"SPKI_DER_BASE64".equals(
                format
            )
        ) {
            throw new IllegalArgumentException(
                "Portable Branch Auth verified Control signer format is invalid."
            );
        }

        String publicKey =
            requireCanonicalString(
                signer,
                "publicKey",
                512
            );

        String status =
            requireString(
                signer,
                "status"
            );

        if (
            !"ACTIVE".equals(
                status
            ) &&
            !"RETIRED".equals(
                status
            )
        ) {
            throw new IllegalArgumentException(
                "Portable Branch Auth verified Control signer status is invalid."
            );
        }

        String validFrom =
            requireCanonicalTimestamp(
                signer,
                "validFrom"
            );

        String validUntil =
            null;

        if (
            signer.has(
                "validUntil"
            )
        ) {
            validUntil =
                requireCanonicalTimestamp(
                    signer,
                    "validUntil"
                );

            if (
                Instant.parse(
                    validUntil
                ).isBefore(
                    Instant.parse(
                        validFrom
                    )
                )
            ) {
                throw new IllegalArgumentException(
                    "Portable Branch Auth verified Control signer validity window is invalid."
                );
            }
        }

        return new VerifiedControlSigner(
            issuerId,
            signingKeyId,
            algorithm,
            format,
            publicKey,
            status,
            validFrom,
            validUntil
        );
    }

    private static Verifier parseVerifier(
        JSONObject verifier,
        String label
    ) {
        assertExactKeys(
            verifier,
            VERIFIER_KEYS,
            Collections.<String>emptySet(),
            label
        );

        String algorithm =
            requireString(
                verifier,
                "algorithm"
            );

        if (
            !FinoraPortableBranchAuthContract.KDF_ALGORITHM.equals(
                algorithm
            )
        ) {
            throw new IllegalArgumentException(
                label +
                ".algorithm is invalid."
            );
        }

        String salt =
            requireCanonicalBase64Length(
                verifier,
                "salt",
                FinoraPortableBranchAuthContract.SCRYPT_SALT_BYTES
            );

        int N =
            requireExactInt(
                verifier,
                "N"
            );

        int r =
            requireExactInt(
                verifier,
                "r"
            );

        int p =
            requireExactInt(
                verifier,
                "p"
            );

        int derivedKeyLength =
            requireExactInt(
                verifier,
                "derivedKeyLength"
            );

        int verifierLength =
            requireExactInt(
                verifier,
                "verifierLength"
            );

        if (
            N !=
                FinoraPortableBranchAuthContract.SCRYPT_N ||
            r !=
                FinoraPortableBranchAuthContract.SCRYPT_R ||
            p !=
                FinoraPortableBranchAuthContract.SCRYPT_P ||
            derivedKeyLength !=
                FinoraPortableBranchAuthContract.SCRYPT_DERIVED_KEY_BYTES ||
            verifierLength !=
                FinoraPortableBranchAuthContract.VERIFIER_BYTES
        ) {
            throw new IllegalArgumentException(
                label +
                " contains unsupported SCRYPT parameters."
            );
        }

        String verifierValue =
            requireCanonicalBase64Length(
                verifier,
                "verifier",
                FinoraPortableBranchAuthContract.VERIFIER_BYTES
            );

        return new Verifier(
            algorithm,
            salt,
            N,
            r,
            p,
            derivedKeyLength,
            verifierLength,
            verifierValue
        );
    }

    private static JSONObject requireObject(
        JSONObject parent,
        String key
    ) {
        Object value;

        try {
            value =
                parent.get(
                    key
                );
        }
        catch (JSONException error) {
            throw new IllegalArgumentException(
                key +
                " is missing.",
                error
            );
        }

        if (
            !(value instanceof JSONObject)
        ) {
            throw new IllegalArgumentException(
                key +
                " must be an object."
            );
        }

        return (JSONObject) value;
    }

    private static void assertExactKeys(
        JSONObject value,
        Set<String> required,
        Set<String> optional,
        String label
    ) {
        for (String requiredKey : required) {

            if (
                !value.has(
                    requiredKey
                )
            ) {
                throw new IllegalArgumentException(
                    label +
                    " is missing " +
                    requiredKey +
                    "."
                );
            }
        }

        java.util.Iterator<String> actualKeys =
            value.keys();

        while (
            actualKeys.hasNext()
        ) {
            String actualKey =
                actualKeys.next();

            if (
                !required.contains(
                    actualKey
                ) &&
                !optional.contains(
                    actualKey
                )
            ) {
                throw new IllegalArgumentException(
                    label +
                    " contains unsupported field " +
                    actualKey +
                    "."
                );
            }
        }
    }

    private static String requireCanonicalString(
        JSONObject object,
        String key,
        int maximumLength
    ) {
        String value =
            requireString(
                object,
                key
            );

        if (
            value.length() == 0 ||
            value.length() >
                maximumLength ||
            !ecmaTrim(
                value
            ).equals(
                value
            )
        ) {
            throw new IllegalArgumentException(
                key +
                " must be a non-empty canonical string."
            );
        }

        return value;
    }

    private static String requireString(
        JSONObject object,
        String key
    ) {
        Object raw;

        try {
            raw =
                object.get(
                    key
                );
        }
        catch (JSONException error) {
            throw new IllegalArgumentException(
                key +
                " is missing.",
                error
            );
        }

        if (
            !(raw instanceof String)
        ) {
            throw new IllegalArgumentException(
                key +
                " must be a string."
            );
        }

        return (String) raw;
    }

    private static int requireExactInt(
        JSONObject object,
        String key
    ) {
        Object raw;

        try {
            raw =
                object.get(
                    key
                );
        }
        catch (JSONException error) {
            throw new IllegalArgumentException(
                key +
                " is missing.",
                error
            );
        }

        if (
            raw instanceof Integer
        ) {
            return (Integer) raw;
        }

        if (
            raw instanceof Long
        ) {
            long value =
                (Long) raw;

            if (
                value >=
                    Integer.MIN_VALUE &&
                value <=
                    Integer.MAX_VALUE
            ) {
                return (int) value;
            }
        }

        throw new IllegalArgumentException(
            key +
            " must be an integer."
        );
    }

    private static long requirePositiveSafeInteger(
        JSONObject object,
        String key
    ) {
        final Object raw;

        try {
            raw =
                object.get(
                    key
                );
        }
        catch (JSONException error) {
            throw new IllegalArgumentException(
                key +
                " is missing.",
                error
            );
        }

        if (
            !(raw instanceof Number)
        ) {
            throw new IllegalArgumentException(
                key +
                " must be a positive safe integer."
            );
        }

        final BigDecimal decimal;

        try {
            decimal =
                new BigDecimal(
                    raw.toString()
                );
        }
        catch (NumberFormatException error) {
            throw new IllegalArgumentException(
                key +
                " must be a positive safe integer.",
                error
            );
        }

        BigDecimal normalized =
            decimal.stripTrailingZeros();

        if (
            normalized.scale() >
            0
        ) {
            throw new IllegalArgumentException(
                key +
                " must be a positive safe integer."
            );
        }

        BigInteger integer;

        try {
            integer =
                normalized.toBigIntegerExact();
        }
        catch (ArithmeticException error) {
            throw new IllegalArgumentException(
                key +
                " must be a positive safe integer.",
                error
            );
        }

        if (
            integer.signum() <=
                0 ||
            integer.compareTo(
                BigInteger.valueOf(
                    MAX_SAFE_INTEGER
                )
            ) >
                0
        ) {
            throw new IllegalArgumentException(
                key +
                " must be a positive safe integer."
            );
        }

        return integer.longValueExact();
    }

    private static String requireCanonicalTimestamp(
        JSONObject object,
        String key
    ) {
        String value =
            requireString(
                object,
                key
            );

        final Instant parsed;

        try {
            parsed =
                Instant.parse(
                    value
                );
        }
        catch (RuntimeException error) {
            throw new IllegalArgumentException(
                key +
                " must be an ISO timestamp.",
                error
            );
        }

        String canonical =
            CANONICAL_ISO.format(
                parsed
            );

        if (
            !canonical.equals(
                value
            )
        ) {
            throw new IllegalArgumentException(
                key +
                " must be a canonical ISO timestamp."
            );
        }

        return value;
    }

    private static String requireCanonicalBase64Length(
        JSONObject object,
        String key,
        int expectedLength
    ) {
        String value =
            requireString(
                object,
                key
            );

        if (
            value.length() == 0 ||
            !value.matches(
                "^[A-Za-z0-9+/]+={0,2}$"
            )
        ) {
            throw new IllegalArgumentException(
                key +
                " must be canonical base64."
            );
        }

        final byte[] decoded;

        try {
            decoded =
                Base64.getDecoder().decode(
                    value
                );
        }
        catch (IllegalArgumentException error) {
            throw new IllegalArgumentException(
                key +
                " must be canonical base64.",
                error
            );
        }

        try {
            if (
                decoded.length !=
                    expectedLength ||
                !Base64.getEncoder()
                    .encodeToString(
                        decoded
                    )
                    .equals(
                        value
                    )
            ) {
                throw new IllegalArgumentException(
                    key +
                    " has invalid byte length or non-canonical base64."
                );
            }
        }
        finally {
            Arrays.fill(
                decoded,
                (byte) 0
            );
        }

        return value;
    }

    private static String ecmaTrim(
        String value
    ) {
        int start =
            0;

        int end =
            value.length();

        while (
            start <
            end
        ) {
            int codePoint =
                value.codePointAt(
                    start
                );

            if (
                !isEcmaTrimWhitespace(
                    codePoint
                )
            ) {
                break;
            }

            start +=
                Character.charCount(
                    codePoint
                );
        }

        while (
            end >
            start
        ) {
            int codePoint =
                value.codePointBefore(
                    end
                );

            if (
                !isEcmaTrimWhitespace(
                    codePoint
                )
            ) {
                break;
            }

            end -=
                Character.charCount(
                    codePoint
                );
        }

        return value.substring(
            start,
            end
        );
    }

    private static boolean isEcmaTrimWhitespace(
        int codePoint
    ) {
        switch (codePoint) {

            case 0x0009:
            case 0x000A:
            case 0x000B:
            case 0x000C:
            case 0x000D:
            case 0x0020:
            case 0x00A0:
            case 0x1680:
            case 0x2028:
            case 0x2029:
            case 0x202F:
            case 0x205F:
            case 0x3000:
            case 0xFEFF:
                return true;

            default:
                return (
                    codePoint >=
                        0x2000 &&
                    codePoint <=
                        0x200A
                );
        }
    }

    private static Set<String> immutableSet(
        String... values
    ) {
        return Collections.unmodifiableSet(
            new HashSet<String>(
                Arrays.asList(
                    values
                )
            )
        );
    }
}