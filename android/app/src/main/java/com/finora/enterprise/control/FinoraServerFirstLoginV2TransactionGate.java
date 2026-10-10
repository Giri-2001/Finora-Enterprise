package com.finora.enterprise.control;

/**
 * Pre-commit safety gate for FINORA server-first enrollment.
 *
 * Caller must independently establish all facts through trusted
 * native implementations; renderer flags are never authority.
 *
 * No persistence, USB I/O, authentication or sessions here.
 */
public final class FinoraServerFirstLoginV2TransactionGate {

    public enum Status {
        READY,
        INVALID_REQUEST,
        EXISTING_STATE_CONFLICT,
        AUTHORITY_INCOMPLETE,
        AUTHORITY_MISMATCH
    }

    public interface NativeEvidence {
        boolean serverSignatureVerified();
        boolean signedBootstrapSemanticsValid();
        boolean accountFolderMatches();
        boolean usbPermissionValidated();
        boolean existingPortableAuthAbsent();
        boolean existingRuntimeAuthorityAbsent();
        boolean existingControlStateAbsent();
        boolean credentialStateAbsent();
        boolean portableV2MaterialVerified();
        boolean runtimePackageSignedAndVerified();
        boolean runtimeMatchesPortableFingerprint();
        boolean runtimeScopeMatchesServer();
        boolean completeHydrationPlanVerified();
    }

    public static final class Result {
        public final Status status;

        private Result(Status status) {
            this.status = status;
        }

        public boolean ready() {
            return status == Status.READY;
        }
    }

    private FinoraServerFirstLoginV2TransactionGate() {}

    private static Result result(Status status) {
        return new Result(status);
    }

    public static Result evaluate(NativeEvidence evidence) {
        if (evidence == null) {
            return result(Status.INVALID_REQUEST);
        }

        try {
            if (
                !evidence.serverSignatureVerified() ||
                !evidence.signedBootstrapSemanticsValid() ||
                !evidence.accountFolderMatches() ||
                !evidence.usbPermissionValidated()
            ) {
                return result(Status.AUTHORITY_MISMATCH);
            }

            if (
                !evidence.existingPortableAuthAbsent() ||
                !evidence.existingRuntimeAuthorityAbsent() ||
                !evidence.existingControlStateAbsent() ||
                !evidence.credentialStateAbsent()
            ) {
                return result(Status.EXISTING_STATE_CONFLICT);
            }

            if (
                !evidence.portableV2MaterialVerified() ||
                !evidence.runtimePackageSignedAndVerified() ||
                !evidence.runtimeMatchesPortableFingerprint() ||
                !evidence.runtimeScopeMatchesServer() ||
                !evidence.completeHydrationPlanVerified()
            ) {
                return result(Status.AUTHORITY_INCOMPLETE);
            }

            return result(Status.READY);

        } catch (Exception error) {
            return result(Status.AUTHORITY_INCOMPLETE);
        }
    }
}