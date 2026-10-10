package com.finora.enterprise.control;

import static org.junit.Assert.*;

import org.junit.Test;

public final class FinoraServerFirstLoginV2TransactionGateTest {

    private static class Evidence implements
        FinoraServerFirstLoginV2TransactionGate.NativeEvidence {

        boolean validServer = true;
        boolean accountMatches = true;
        boolean usbPermission = true;
        boolean noAuth = true;
        boolean noRuntime = true;
        boolean noControl = true;
        boolean noCredential = true;
        boolean materialVerified = true;
        boolean runtimeReady = true;
        boolean fingerprintMatches = true;
        boolean scopeMatches = true;
        boolean hydrationReady = true;

        @Override public boolean serverSignatureVerified() {
            return validServer;
        }

        @Override public boolean signedBootstrapSemanticsValid() {
            return validServer;
        }

        @Override public boolean accountFolderMatches() {
            return accountMatches;
        }

        @Override public boolean usbPermissionValidated() {
            return usbPermission;
        }

        @Override public boolean existingPortableAuthAbsent() {
            return noAuth;
        }

        @Override public boolean existingRuntimeAuthorityAbsent() {
            return noRuntime;
        }

        @Override public boolean existingControlStateAbsent() {
            return noControl;
        }

        @Override public boolean credentialStateAbsent() {
            return noCredential;
        }

        @Override public boolean portableV2MaterialVerified() {
            return materialVerified;
        }

        @Override public boolean runtimePackageSignedAndVerified() {
            return runtimeReady;
        }

        @Override public boolean runtimeMatchesPortableFingerprint() {
            return fingerprintMatches;
        }

        @Override public boolean runtimeScopeMatchesServer() {
            return scopeMatches;
        }

        @Override public boolean completeHydrationPlanVerified() {
            return hydrationReady;
        }
    }

    @Test
    public void absentEvidenceRejected() {
        assertFalse(
            FinoraServerFirstLoginV2TransactionGate
                .evaluate(null)
                .ready()
        );
    }

    @Test
    public void missingRuntimeSignerBlocksCommit() {
        Evidence evidence = new Evidence();
        evidence.runtimeReady = false;

        assertEquals(
            FinoraServerFirstLoginV2TransactionGate.Status
                .AUTHORITY_INCOMPLETE,
            FinoraServerFirstLoginV2TransactionGate
                .evaluate(evidence)
                .status
        );
    }

    @Test
    public void existingPortableAuthBlocksCommit() {
        Evidence evidence = new Evidence();
        evidence.noAuth = false;

        assertEquals(
            FinoraServerFirstLoginV2TransactionGate.Status
                .EXISTING_STATE_CONFLICT,
            FinoraServerFirstLoginV2TransactionGate
                .evaluate(evidence)
                .status
        );
    }

    @Test
    public void existingControlStateBlocksCommit() {
        Evidence evidence = new Evidence();
        evidence.noControl = false;

        assertFalse(
            FinoraServerFirstLoginV2TransactionGate
                .evaluate(evidence)
                .ready()
        );
    }

    @Test
    public void otherAccountFolderRejected() {
        Evidence evidence = new Evidence();
        evidence.accountMatches = false;

        assertFalse(
            FinoraServerFirstLoginV2TransactionGate
                .evaluate(evidence)
                .ready()
        );
    }

    @Test
    public void fingerprintMismatchRejected() {
        Evidence evidence = new Evidence();
        evidence.fingerprintMatches = false;

        assertFalse(
            FinoraServerFirstLoginV2TransactionGate
                .evaluate(evidence)
                .ready()
        );
    }

    @Test
    public void completeTrustedEvidenceAllowsPreparation() {
        Evidence evidence = new Evidence();

        assertEquals(
            FinoraServerFirstLoginV2TransactionGate.Status.READY,
            FinoraServerFirstLoginV2TransactionGate
                .evaluate(evidence)
                .status
        );
    }
}