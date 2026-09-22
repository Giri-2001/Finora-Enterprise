package com.finora.enterprise.control;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

public final class
    FinoraPortableFreshDeviceLoginRecoveryCoordinatorTest {

    @Test
    public void localCredentialShortCircuitsFreshRecovery() {

        FakePresence presence =
            new FakePresence(
                true
            );

        FakePreAuth preAuth =
            new FakePreAuth(
                challenge()
            );

        FakeCompletion completion =
            new FakeCompletion(
                FinoraPortableFreshDeviceLoginRecoveryCoordinator
                    .CompletionResult
                    .success()
            );

        FinoraPortableFreshDeviceLoginRecoveryCoordinator
            coordinator =
                coordinator(
                    presence,
                    preAuth,
                    completion
                );

        FinoraPortableFreshDeviceLoginRecoveryCoordinator.Result
            result =
                coordinator.recover(
                    request(
                        null
                    )
                );

        assertTrue(
            result.success
        );

        assertEquals(
            "NOT_APPLICABLE",
            result.status
        );

        assertEquals(
            1,
            presence.calls
        );

        assertEquals(
            0,
            preAuth.calls
        );

        assertEquals(
            0,
            completion.calls
        );
    }

    @Test
    public void correctPortablePasswordWithoutSecurityCodeChallenges() {

        FakePresence presence =
            new FakePresence(
                false
            );

        FakePreAuth preAuth =
            new FakePreAuth(
                challenge()
            );

        FakeCompletion completion =
            new FakeCompletion(
                FinoraPortableFreshDeviceLoginRecoveryCoordinator
                    .CompletionResult
                    .success()
            );

        FinoraPortableFreshDeviceLoginRecoveryCoordinator
            coordinator =
                coordinator(
                    presence,
                    preAuth,
                    completion
                );

        FinoraPortableFreshDeviceLoginRecoveryCoordinator.Result
            result =
                coordinator.recover(
                    request(
                        null
                    )
                );

        assertTrue(
            result.success
        );

        assertEquals(
            "SECURITY_CODE_REQUIRED",
            result.status
        );

        assertEquals(
            "USB",
            preAuth.lastStorageMode
        );

        assertEquals(
            1,
            preAuth.calls
        );

        assertEquals(
            0,
            completion.calls
        );
    }

    @Test
    public void wrongPortablePasswordFailsBeforeSecurityCodeCompletion() {

        FakePresence presence =
            new FakePresence(
                false
            );

        FakePreAuth preAuth =
            new FakePreAuth(
                FinoraPortableFreshDevicePasswordPreAuthAuthority
                    .Result
                    .failure(
                        "INVALID_CREDENTIALS",
                        "Invalid username or password."
                    )
            );

        FakeCompletion completion =
            new FakeCompletion(
                FinoraPortableFreshDeviceLoginRecoveryCoordinator
                    .CompletionResult
                    .success()
            );

        FinoraPortableFreshDeviceLoginRecoveryCoordinator.Result
            result =
                coordinator(
                    presence,
                    preAuth,
                    completion
                ).recover(
                    request(
                        null
                    )
                );

        assertFalse(
            result.success
        );

        assertNull(
            result.status
        );

        assertEquals(
            "INVALID_CREDENTIALS",
            result.errorCode
        );

        assertEquals(
            0,
            completion.calls
        );
    }

    @Test
    public void securityCodePresentRunsCompletionOnlyAfterPasswordProof() {

        FakePresence presence =
            new FakePresence(
                false
            );

        FakePreAuth preAuth =
            new FakePreAuth(
                challenge()
            );

        FakeCompletion completion =
            new FakeCompletion(
                FinoraPortableFreshDeviceLoginRecoveryCoordinator
                    .CompletionResult
                    .success()
            );

        FinoraPortableFreshDeviceLoginRecoveryCoordinator.Result
            result =
                coordinator(
                    presence,
                    preAuth,
                    completion
                ).recover(
                    request(
                        "Branch-Security-Code-01"
                    )
                );

        assertTrue(
            result.success
        );

        assertEquals(
            "RECOVERED",
            result.status
        );

        assertEquals(
            1,
            preAuth.calls
        );

        assertEquals(
            1,
            completion.calls
        );

        assertEquals(
            "USB",
            completion.lastRequest.storageMode
        );

        assertEquals(
            "Branch-Security-Code-01",
            completion.lastRequest.securityCode
        );
    }

    @Test
    public void completionFailureIsPreserved() {

        FakePresence presence =
            new FakePresence(
                false
            );

        FakePreAuth preAuth =
            new FakePreAuth(
                challenge()
            );

        FakeCompletion completion =
            new FakeCompletion(
                FinoraPortableFreshDeviceLoginRecoveryCoordinator
                    .CompletionResult
                    .failure(
                        "SECURITY_CODE_INVALID",
                        "Invalid Security Code"
                    )
            );

        FinoraPortableFreshDeviceLoginRecoveryCoordinator.Result
            result =
                coordinator(
                    presence,
                    preAuth,
                    completion
                ).recover(
                    request(
                        "Wrong-Code"
                    )
                );

        assertFalse(
            result.success
        );

        assertEquals(
            "SECURITY_CODE_INVALID",
            result.errorCode
        );

        assertEquals(
            1,
            completion.calls
        );
    }

    @Test
    public void exactSelectedStorageModeFlowsToPreAuthAndCompletion() {

        FakePresence presence =
            new FakePresence(
                false
            );

        FakePreAuth preAuth =
            new FakePreAuth(
                challenge()
            );

        FakeCompletion completion =
            new FakeCompletion(
                FinoraPortableFreshDeviceLoginRecoveryCoordinator
                    .CompletionResult
                    .success()
            );

        FinoraPortableFreshDeviceLoginRecoveryCoordinator
            coordinator =
                coordinator(
                    presence,
                    preAuth,
                    completion
                );

        FinoraPortableFreshDeviceLoginRecoveryCoordinator.Result
            result =
                coordinator.recover(
                    new FinoraPortableFreshDeviceLoginRecoveryCoordinator
                        .Request(
                            "Admin",
                            "Correct-Password-01",
                            "LOCAL",
                            "Branch-Security-Code-01"
                        )
                );

        assertTrue(
            result.success
        );

        assertEquals(
            "LOCAL",
            preAuth.lastStorageMode
        );

        assertEquals(
            "LOCAL",
            completion.lastRequest.storageMode
        );
    }

    private static FinoraPortableFreshDeviceLoginRecoveryCoordinator
        coordinator(
            FakePresence presence,
            FakePreAuth preAuth,
            FakeCompletion completion
        ) {

        return new FinoraPortableFreshDeviceLoginRecoveryCoordinator(
            presence,
            preAuth,
            completion
        );
    }

    private static FinoraPortableFreshDeviceLoginRecoveryCoordinator
        .Request request(
            String securityCode
        ) {

        return new FinoraPortableFreshDeviceLoginRecoveryCoordinator
            .Request(
                "Admin",
                "Correct-Password-01",
                "USB",
                securityCode
            );
    }

    private static FinoraPortableFreshDevicePasswordPreAuthAuthority
        .Result challenge() {

        return FinoraPortableFreshDevicePasswordPreAuthAuthority
            .Result
            .securityCodeRequired();
    }

    private static final class FakePresence
        implements FinoraPortableFreshDeviceLoginRecoveryCoordinator
            .LocalCredentialPresencePort {

        private final boolean exists;

        int calls;

        FakePresence(
            boolean exists
        ) {
            this.exists =
                exists;
        }

        @Override
        public boolean exists(
            String username
        ) {
            calls++;

            return exists;
        }
    }

    private static final class FakePreAuth
        implements FinoraPortableFreshDeviceLoginRecoveryCoordinator
            .PasswordPreAuthPort {

        private final FinoraPortableFreshDevicePasswordPreAuthAuthority
            .Result result;

        int calls;
        String lastStorageMode;

        FakePreAuth(
            FinoraPortableFreshDevicePasswordPreAuthAuthority.Result result
        ) {
            this.result =
                result;
        }

        @Override
        public FinoraPortableFreshDevicePasswordPreAuthAuthority.Result
            authenticate(
                String username,
                String password,
                String storageMode
            ) {

            calls++;
            lastStorageMode =
                storageMode;

            return result;
        }
    }

    private static final class FakeCompletion
        implements FinoraPortableFreshDeviceLoginRecoveryCoordinator
            .RecoveryCompletionPort {

        private final FinoraPortableFreshDeviceLoginRecoveryCoordinator
            .CompletionResult result;

        int calls;

        FinoraPortableFreshDeviceLoginRecoveryCoordinator
            .Request lastRequest;

        FakeCompletion(
            FinoraPortableFreshDeviceLoginRecoveryCoordinator
                .CompletionResult result
        ) {
            this.result =
                result;
        }

        @Override
        public FinoraPortableFreshDeviceLoginRecoveryCoordinator
            .CompletionResult complete(
                FinoraPortableFreshDeviceLoginRecoveryCoordinator
                    .Request request
            ) {

            calls++;
            lastRequest =
                request;

            return result;
        }
    }
}