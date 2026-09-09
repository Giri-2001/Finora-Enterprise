package com.finora.enterprise.control;

import android.util.Base64;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;

/* ============================================================
   FINORA ENTERPRISE OS™

   ANDROID RECIPIENT TRUST BOOTSTRAP SERVICE

   MODULE  : Control
   LAYER   : Native Recipient Authority
   VERSION : 1.0
   STATUS  : Production Foundation

   RESPONSIBILITY:

   - Establish the first Android recipient operational trust key
   - Require an independently supplied SHA-256 SPKI fingerprint
   - Verify the supplied public key against that fingerprint
   - Verify the canonical FINORA Control Center signingKeyId
   - Require one initial ACTIVE signing key
   - Refuse bootstrap when recipient trust already exists
   - Persist exactly one validated initial operational key
   - Confirm the persisted authority through read-back validation

   TRUST MODEL:

   publicKeyFingerprint =
     lowercase_hex(
       SHA-256(
         decoded canonical SPKI DER bytes
       )
     )

   signingKeyId =
     "FINORA-KEY-" +
     first 24 fingerprint hex characters uppercased

   SECURITY:

   - Native recipient authority only.
   - No environment-variable bootstrap.
   - No filesystem path input.
   - No signed-package trust-on-first-use.
   - No package-provided authority.
   - No wall-clock authority.
   - No private signing material.
   - No renderer or Capacitor API.
   - Existing trust is never replaced through bootstrap.

   CONCURRENCY:

   - Bootstrap is serialized by one process-local authority lock.
   - No cross-process compare-and-swap guarantee is claimed.
============================================================ */

public final class FinoraRecipientTrustBootstrapService {

    // ========================================================
    // CONSTANTS
    // ========================================================

    private static final Pattern CANONICAL_SHA256_FINGERPRINT =
        Pattern.compile(
            "^[0-9a-f]{64}$"
        );

    private static final String SIGNING_KEY_ID_PREFIX =
        "FINORA-KEY-";

    private static final int SIGNING_KEY_ID_FINGERPRINT_LENGTH =
        24;

    private static final Object AUTHORITY_LOCK =
        new Object();

    // ========================================================
    // REQUEST
    // ========================================================

    public static final class Request {

        public final FinoraRecipientTrustState.TrustedKeyRecord
            trustedKey;

        public final String
            expectedPublicKeyFingerprint;

        public Request(
            FinoraRecipientTrustState.TrustedKeyRecord trustedKey,
            String expectedPublicKeyFingerprint
        ) {
            this.trustedKey =
                trustedKey;

            this.expectedPublicKeyFingerprint =
                expectedPublicKeyFingerprint;
        }
    }

    // ========================================================
    // RESULT DATA
    // ========================================================

    public static final class ResultData {

        public final String issuerId;

        public final String signingKeyId;

        public final String publicKeyFingerprint;

        private ResultData(
            String issuerId,
            String signingKeyId,
            String publicKeyFingerprint
        ) {
            this.issuerId =
                issuerId;

            this.signingKeyId =
                signingKeyId;

            this.publicKeyFingerprint =
                publicKeyFingerprint;
        }
    }

    // ========================================================
    // RESULT
    // ========================================================

    public static final class Result {

        public final boolean success;

        public final ResultData data;

        public final String error;

        private Result(
            boolean success,
            ResultData data,
            String error
        ) {
            this.success =
                success;

            this.data =
                data;

            this.error =
                error;
        }

        public static Result success(
            ResultData data
        ) {
            return new Result(
                true,
                data,
                null
            );
        }

        public static Result failure(
            String error
        ) {
            return new Result(
                false,
                null,
                error
            );
        }
    }

    // ========================================================
    // STATE
    // ========================================================

    private final FinoraRecipientTrustStore trustStore;

    // ========================================================
    // CONSTRUCTOR
    // ========================================================

    public FinoraRecipientTrustBootstrapService(
        FinoraRecipientTrustStore trustStore
    ) {
        if (trustStore == null) {
            throw new IllegalArgumentException(
                "FINORA recipient trust bootstrap requires a trust store."
            );
        }

        this.trustStore =
            trustStore;
    }

    // ========================================================
    // BOOTSTRAP
    // ========================================================

    public Result bootstrap(
        Request request
    ) {

        synchronized (
            AUTHORITY_LOCK
        ) {
            return bootstrapInternal(
                request
            );
        }
    }

    // ========================================================
    // INTERNAL BOOTSTRAP
    // ========================================================

    private Result bootstrapInternal(
        Request request
    ) {

        try {
            if (
                request == null ||
                request.trustedKey == null
            ) {
                return Result.failure(
                    "FINORA recipient trust bootstrap request is invalid."
                );
            }

            // ------------------------------------------------
            // INDEPENDENT FINGERPRINT CONTRACT
            // ------------------------------------------------

            if (
                !isCanonicalSha256Fingerprint(
                    request.expectedPublicKeyFingerprint
                )
            ) {
                return Result.failure(
                    "FINORA recipient trust bootstrap requires a canonical lowercase SHA-256 public-key fingerprint."
                );
            }

            // ------------------------------------------------
            // INITIAL KEY POLICY
            // ------------------------------------------------

            if (
                !FinoraRecipientTrustState.STATUS_ACTIVE.equals(
                    request.trustedKey.status
                )
            ) {
                return Result.failure(
                    "FINORA recipient trust bootstrap requires one ACTIVE initial signing key."
                );
            }

            if (
                request.trustedKey.validUntil !=
                    null
            ) {
                return Result.failure(
                    "FINORA initial ACTIVE recipient signing key must not define validUntil."
                );
            }

            // ------------------------------------------------
            // COMPLETE TRUST RECORD VALIDATION
            //
            // This validates:
            //
            // - exact operational algorithm
            // - exact SPKI format
            // - strict canonical Base64
            // - parseable SPKI DER
            // - EC public key
            // - P-256 curve
            // - canonical validity timestamps
            // - single ACTIVE key invariant
            // ------------------------------------------------

            FinoraRecipientTrustState.State proposedState =
                new FinoraRecipientTrustState.State(
                    FinoraRecipientTrustState.SCHEMA_VERSION,
                    Collections.singletonList(
                        request.trustedKey
                    ),
                    null,
                    null,
                    null,
                    null
                );

            FinoraRecipientTrustState.validate(
                proposedState
            );

            // ------------------------------------------------
            // DERIVE ACTUAL SPKI SHA-256 FINGERPRINT
            // ------------------------------------------------

            String actualPublicKeyFingerprint =
                createPublicKeyFingerprint(
                    request.trustedKey.publicKey
                );

            if (
                !fingerprintsMatch(
                    request.expectedPublicKeyFingerprint,
                    actualPublicKeyFingerprint
                )
            ) {
                return Result.failure(
                    "FINORA recipient trust bootstrap public-key fingerprint does not match the independently supplied fingerprint."
                );
            }

            // ------------------------------------------------
            // CANONICAL CONTROL CENTER SIGNING KEY ID
            // ------------------------------------------------

            String expectedSigningKeyId =
                createSigningKeyId(
                    actualPublicKeyFingerprint
                );

            if (
                !expectedSigningKeyId.equals(
                    request.trustedKey.signingKeyId
                )
            ) {
                return Result.failure(
                    "FINORA recipient trust bootstrap signingKeyId does not match the trusted public key."
                );
            }

            // ------------------------------------------------
            // EXISTING TRUST = BOOTSTRAP FORBIDDEN
            //
            // If a file exists, bootstrap never overwrites it.
            //
            // The existing file is also read and parsed so a
            // corrupt/undecryptable established trust file
            // fails closed rather than being treated as absent.
            // ------------------------------------------------

            if (
                trustStore.exists()
            ) {
                String existingSerialized =
                    trustStore.read();

                if (
                    existingSerialized ==
                        null
                ) {
                    return Result.failure(
                        "FINORA recipient trust store exists but could not be read."
                    );
                }

                FinoraRecipientTrustState.parse(
                    existingSerialized
                );

                return Result.failure(
                    "FINORA recipient trust is already bootstrapped and cannot be replaced through bootstrap."
                );
            }

            // ------------------------------------------------
            // SERIALIZE VALIDATED INITIAL AUTHORITY
            // ------------------------------------------------

            String serialized =
                FinoraRecipientTrustState.serialize(
                    proposedState
                );

            // ------------------------------------------------
            // PERSIST INITIAL AUTHORITY
            // ------------------------------------------------

            trustStore.write(
                serialized
            );

            // ------------------------------------------------
            // READ-BACK CONFIRMATION
            // ------------------------------------------------

            String persistedSerialized =
                trustStore.read();

            if (
                persistedSerialized ==
                    null
            ) {
                return Result.failure(
                    "FINORA recipient trust bootstrap persistence could not be confirmed."
                );
            }

            FinoraRecipientTrustState.State persistedState =
                FinoraRecipientTrustState.parse(
                    persistedSerialized
                );

            if (
                persistedState.trustedKeys.size() !=
                    1
            ) {
                return Result.failure(
                    "FINORA recipient trust bootstrap persisted an unexpected trusted-key count."
                );
            }

            if (
                persistedState.appliedTrustTransitions !=
                    null ||
                persistedState.trustTransitionSequences !=
                    null ||
                persistedState.appliedTrustRecoveries !=
                    null ||
                persistedState.trustRecoverySequences !=
                    null
            ) {
                return Result.failure(
                    "FINORA recipient trust bootstrap persisted unexpected transition or recovery metadata."
                );
            }

            FinoraRecipientTrustState.TrustedKeyRecord
                persistedKey =
                    persistedState.trustedKeys.get(
                        0
                    );

            if (
                !sameTrustedKey(
                    persistedKey,
                    request.trustedKey
                )
            ) {
                return Result.failure(
                    "FINORA recipient trust bootstrap persisted state does not match the authorized initial key."
                );
            }

            return Result.success(
                new ResultData(
                    persistedKey.issuerId,
                    persistedKey.signingKeyId,
                    actualPublicKeyFingerprint
                )
            );
        } catch (
            Exception error
        ) {
            String message =
                error.getMessage();

            if (
                message == null ||
                message.trim().isEmpty()
            ) {
                message =
                    "FINORA recipient trust bootstrap failed.";
            }

            return Result.failure(
                message
            );
        }
    }

    // ========================================================
    // EXPECTED FINGERPRINT
    // ========================================================

    private static boolean isCanonicalSha256Fingerprint(
        String value
    ) {
        return (
            value !=
                null &&
            CANONICAL_SHA256_FINGERPRINT
                .matcher(
                    value
                )
                .matches()
        );
    }

    // ========================================================
    // FINGERPRINT COMPARISON
    // ========================================================

    private static boolean fingerprintsMatch(
        String expected,
        String actual
    ) {
        if (
            expected == null ||
            actual == null
        ) {
            return false;
        }

        byte[] expectedBytes =
            expected.getBytes(
                StandardCharsets.US_ASCII
            );

        byte[] actualBytes =
            actual.getBytes(
                StandardCharsets.US_ASCII
            );

        return MessageDigest.isEqual(
            expectedBytes,
            actualBytes
        );
    }

    // ========================================================
    // SPKI SHA-256 FINGERPRINT
    // ========================================================

    private static String createPublicKeyFingerprint(
        String publicKeySpkiDerBase64
    ) throws Exception {

        if (
            publicKeySpkiDerBase64 ==
                null
        ) {
            throw new IllegalArgumentException(
                "FINORA recipient trust public key is required."
            );
        }

        byte[] publicKeyDer =
            Base64.decode(
                publicKeySpkiDerBase64,
                Base64.NO_WRAP
            );

        if (
            publicKeyDer.length ==
                0
        ) {
            throw new IllegalArgumentException(
                "FINORA recipient trust public key is empty."
            );
        }

        MessageDigest digest =
            MessageDigest.getInstance(
                "SHA-256"
            );

        return toLowerHex(
            digest.digest(
                publicKeyDer
            )
        );
    }

    // ========================================================
    // CANONICAL SIGNING KEY ID
    // ========================================================

    private static String createSigningKeyId(
        String publicKeyFingerprint
    ) {

        if (
            !isCanonicalSha256Fingerprint(
                publicKeyFingerprint
            )
        ) {
            throw new IllegalArgumentException(
                "FINORA recipient trust signing-key fingerprint is invalid."
            );
        }

        return (
            SIGNING_KEY_ID_PREFIX +
            publicKeyFingerprint
                .substring(
                    0,
                    SIGNING_KEY_ID_FINGERPRINT_LENGTH
                )
                .toUpperCase(
                    Locale.ROOT
                )
        );
    }

    // ========================================================
    // LOWERCASE HEX
    // ========================================================

    private static String toLowerHex(
        byte[] bytes
    ) {

        StringBuilder builder =
            new StringBuilder(
                bytes.length * 2
            );

        for (
            byte value :
            bytes
        ) {
            builder.append(
                Character.forDigit(
                    (value >>> 4) &
                    0x0f,
                    16
                )
            );

            builder.append(
                Character.forDigit(
                    value &
                    0x0f,
                    16
                )
            );
        }

        return builder.toString();
    }

    // ========================================================
    // TRUSTED KEY EQUALITY
    // ========================================================

    private static boolean sameTrustedKey(
        FinoraRecipientTrustState.TrustedKeyRecord left,
        FinoraRecipientTrustState.TrustedKeyRecord right
    ) {

        if (
            left == null ||
            right == null
        ) {
            return false;
        }

        return (
            equal(
                left.issuerId,
                right.issuerId
            ) &&
            equal(
                left.signingKeyId,
                right.signingKeyId
            ) &&
            equal(
                left.algorithm,
                right.algorithm
            ) &&
            equal(
                left.format,
                right.format
            ) &&
            equal(
                left.publicKey,
                right.publicKey
            ) &&
            equal(
                left.status,
                right.status
            ) &&
            equal(
                left.validFrom,
                right.validFrom
            ) &&
            equal(
                left.validUntil,
                right.validUntil
            )
        );
    }

    private static boolean equal(
        String left,
        String right
    ) {
        if (
            left ==
                null
        ) {
            return right ==
                null;
        }

        return left.equals(
            right
        );
    }
}

/* ============================================================
   END
============================================================ */