package com.finora.enterprise.control;

import org.json.JSONObject;

import java.text.Normalizer;
import java.util.Locale;

/**
 * Signed server-first enrollment preflight.
 *
 * This class:
 * - accepts only a cryptographically verified server bootstrap;
 * - checks exact initial-enrollment semantics;
 * - binds the selected account directory to canonicalUsername;
 * - does not trust a renderer-supplied authorization flag.
 *
 * This class NEVER writes USB files, creates credentials,
 * authorizes devices, hydrates Control Store or issues sessions.
 */
public final class FinoraServerFirstLoginEnrollmentPreflight {

    public enum Status {
        READY,
        INVALID_SERVER_AUTHORITY,
        INVALID_ACCOUNT_FOLDER,
        INVALID_REQUEST
    }

    public static final class Result {
        public final Status status;
        public final JSONObject verifiedPayload;

        private Result(
            Status status,
            JSONObject verifiedPayload
        ) {
            this.status = status;
            this.verifiedPayload = verifiedPayload;
        }

        public boolean ready() {
            return status == Status.READY;
        }
    }

    private FinoraServerFirstLoginEnrollmentPreflight() {}

    private static Result failure(Status status) {
        return new Result(status, null);
    }

    public static Result evaluate(
        FinoraServerFirstLoginClient.Result serverResult,
        String requestedUsername,
        String selectedAccountFolderName
    ) {
        if (
            serverResult == null ||
            requestedUsername == null ||
            requestedUsername.trim().isEmpty() ||
            selectedAccountFolderName == null
        ) {
            return failure(Status.INVALID_REQUEST);
        }

        if (
            !serverResult.success ||
            serverResult.signedBootstrap == null
        ) {
            return failure(Status.INVALID_SERVER_AUTHORITY);
        }

        return evaluateSigned(
            serverResult.signedBootstrap,
            requestedUsername,
            selectedAccountFolderName
        );
    }

    /**
     * Always re-verifies the signature: a caller-provided JSON object
     * is never accepted merely because it is labelled "signed".
     */
    public static Result evaluateSigned(
        JSONObject signedBootstrap,
        String requestedUsername,
        String selectedAccountFolderName
    ) {
        if (
            signedBootstrap == null ||
            requestedUsername == null ||
            selectedAccountFolderName == null
        ) {
            return failure(Status.INVALID_REQUEST);
        }

        final String canonicalUsername;

        try {
            canonicalUsername =
                FinoraPortableBranchAccountUsbRoot
                    .canonicalUsername(requestedUsername);
        } catch (Exception error) {
            return failure(Status.INVALID_REQUEST);
        }

        try {
            if (
                !FinoraServerFirstLoginSignatureVerifier
                    .verify(signedBootstrap)
            ) {
                return failure(Status.INVALID_SERVER_AUTHORITY);
            }

            JSONObject payload =
                signedBootstrap.optJSONObject("payload");

            if (
                !FinoraServerFirstLoginPayloadValidator
                    .validate(payload, canonicalUsername)
            ) {
                return failure(Status.INVALID_SERVER_AUTHORITY);
            }

            // Do not let an old/rotated credential be enrolled as new.
            if (
                payload.getInt("authGeneration") != 1 ||
                !"USB".equals(payload.getString("storageMode")) ||
                !"REAL".equals(payload.getString("dataContext"))
            ) {
                return failure(Status.INVALID_SERVER_AUTHORITY);
            }

            String selectedFolder = Normalizer.normalize(
                selectedAccountFolderName,
                Normalizer.Form.NFKC
            ).toLowerCase(Locale.ROOT);

            if (
                !canonicalUsername.equals(selectedFolder) ||
                !FinoraPortableBranchAuthV2UsbWriter
                    .accountFolderMatches(
                        selectedAccountFolderName,
                        canonicalUsername
                    )
            ) {
                return failure(Status.INVALID_ACCOUNT_FOLDER);
            }

            // Snapshot the verified payload; never return the caller's
            // mutable JSONObject directly.
            return new Result(
                Status.READY,
                new JSONObject(payload.toString())
            );
        } catch (Exception error) {
            return failure(Status.INVALID_SERVER_AUTHORITY);
        }
    }
}