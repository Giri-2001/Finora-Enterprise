package com.finora.enterprise.control;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;

import org.junit.Test;

public final class
    FinoraBranchPasswordFirstLoginStorageModePropagationTest {

    @Test
    public void selectedUsbStorageModeReachesPasswordAuthenticationPort() {

        final String[] observedStorageMode =
            new String[] {
                null
            };

        FinoraBranchPasswordFirstLoginAuthority
            authority =
                new FinoraBranchPasswordFirstLoginAuthority(
                    new FinoraBranchPasswordFirstLoginAuthority
                        .PasswordAuthenticationPort() {

                        @Override
                        public FinoraBranchPasswordFirstLoginAuthority
                            .PasswordAuthenticationResult authenticate(
                                String username,
                                String password
                            ) {

                            return FinoraBranchPasswordFirstLoginAuthority
                                .PasswordAuthenticationResult.failure(
                                    "LEGACY_PASSWORD_PATH_USED",
                                    "Legacy Password path must not be selected by this test."
                                );
                        }

                        @Override
                        public FinoraBranchPasswordFirstLoginAuthority
                            .PasswordAuthenticationResult authenticate(
                                String username,
                                String password,
                                String storageMode
                            ) {

                            observedStorageMode[0] =
                                storageMode;

                            return FinoraBranchPasswordFirstLoginAuthority
                                .PasswordAuthenticationResult.failure(
                                    "STORAGE_MODE_CAPTURED",
                                    "Selected storage mode was captured."
                                );
                        }
                    },
                    new FinoraBranchPasswordFirstLoginAuthority
                        .DeviceTrustCheckPort() {

                        @Override
                        public FinoraBranchDeviceTrustAuthority.Result check(
                            FinoraBranchDeviceTrustAuthority.Principal principal
                        ) {
                            return null;
                        }
                    },
                    new FinoraBranchPasswordFirstLoginAuthority
                        .DeviceTrustAuthorizationPort() {

                        @Override
                        public FinoraBranchDeviceTrustAuthorizationAuthority
                            .Result authorize(
                                FinoraBranchDeviceTrustAuthorizationAuthority
                                    .Principal principal,
                                String password,
                                String securityCode
                            ) {
                            return null;
                        }
                    }
                );

        FinoraBranchPasswordFirstLoginAuthority.Result
            result =
                authority.login(
                    new FinoraBranchPasswordFirstLoginAuthority
                        .Request(
                            "Admin",
                            "Correct-Password-01",
                            "USB",
                            null
                        )
                );

        assertFalse(
            result.success
        );

        assertEquals(
            "STORAGE_MODE_CAPTURED",
            result.errorCode
        );

        assertEquals(
            "USB",
            observedStorageMode[0]
        );
    }

    @Test
    public void legacyRequestRemainsSourceCompatibleWithNullStorageMode() {

        final String[] observedStorageMode =
            new String[] {
                "UNSET"
            };

        FinoraBranchPasswordFirstLoginAuthority
            authority =
                new FinoraBranchPasswordFirstLoginAuthority(
                    new FinoraBranchPasswordFirstLoginAuthority
                        .PasswordAuthenticationPort() {

                        @Override
                        public FinoraBranchPasswordFirstLoginAuthority
                            .PasswordAuthenticationResult authenticate(
                                String username,
                                String password
                            ) {
                            return FinoraBranchPasswordFirstLoginAuthority
                                .PasswordAuthenticationResult.failure(
                                    "LEGACY_OK",
                                    "Legacy request path preserved."
                                );
                        }

                        @Override
                        public FinoraBranchPasswordFirstLoginAuthority
                            .PasswordAuthenticationResult authenticate(
                                String username,
                                String password,
                                String storageMode
                            ) {

                            observedStorageMode[0] =
                                storageMode;

                            return FinoraBranchPasswordFirstLoginAuthority
                                .PasswordAuthenticationResult.failure(
                                    "LEGACY_OK",
                                    "Legacy request path preserved."
                                );
                        }
                    },
                    new FinoraBranchPasswordFirstLoginAuthority
                        .DeviceTrustCheckPort() {

                        @Override
                        public FinoraBranchDeviceTrustAuthority.Result check(
                            FinoraBranchDeviceTrustAuthority.Principal principal
                        ) {
                            return null;
                        }
                    },
                    new FinoraBranchPasswordFirstLoginAuthority
                        .DeviceTrustAuthorizationPort() {

                        @Override
                        public FinoraBranchDeviceTrustAuthorizationAuthority
                            .Result authorize(
                                FinoraBranchDeviceTrustAuthorizationAuthority
                                    .Principal principal,
                                String password,
                                String securityCode
                            ) {
                            return null;
                        }
                    }
                );

        authority.login(
            new FinoraBranchPasswordFirstLoginAuthority
                .Request(
                    "Admin",
                    "Correct-Password-01",
                    null
                )
        );

        assertEquals(
            null,
            observedStorageMode[0]
        );
    }
}