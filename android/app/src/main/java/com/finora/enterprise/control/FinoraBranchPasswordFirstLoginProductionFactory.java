package com.finora.enterprise.control;

import android.content.Context;

/**
 * Production composition root for Android password-first branch
 * login.
 *
 * Composition:
 * - Branch Credential Password Authority;
 * - check-only Device Trust Authority;
 * - fresh-device Device Trust Authorization Authority;
 * - password-first orchestration authority.
 *
 * This factory does not expose a Capacitor Plugin method and
 * does not create or persist a renderer/login session.
 */
public final class FinoraBranchPasswordFirstLoginProductionFactory {

    private FinoraBranchPasswordFirstLoginProductionFactory() {
    }

    public static FinoraBranchPasswordFirstLoginAuthority create(
        Context context,
        FinoraPortableBranchAuthStore portableAuthStore,
        FinoraInstallationBindingService installationBindingService,
        FinoraBranchDeviceTrustStore deviceTrustStore
    ) {

        if (context == null) {
            throw new IllegalArgumentException(
                "FINORA Android Context is required."
            );
        }

        if (portableAuthStore == null) {
            throw new IllegalArgumentException(
                "FINORA Portable Branch Auth Store is required."
            );
        }

        if (installationBindingService == null) {
            throw new IllegalArgumentException(
                "FINORA Installation Binding Service is required."
            );
        }

        if (deviceTrustStore == null) {
            throw new IllegalArgumentException(
                "FINORA Branch Device Trust Store is required."
            );
        }

        FinoraBranchCredentialAuthenticationAuthority passwordAuthority =
            new FinoraBranchCredentialAuthenticationAuthority(
                context
            );

        FinoraBranchDeviceTrustAuthority deviceTrust =
            FinoraBranchDeviceTrustProductionAdapters.create(
                portableAuthStore,
                installationBindingService,
                deviceTrustStore
            );

        FinoraBranchDeviceTrustAuthorizationAuthority
            deviceAuthorization =
                FinoraBranchDeviceTrustAuthorizationProductionAdapters
                    .create(
                        portableAuthStore,
                        installationBindingService,
                        deviceTrustStore
                    );

        return composeDeviceAgnostic(
            passwordAuthority
        );
    }

    static FinoraBranchPasswordFirstLoginAuthority
        composeDeviceAgnostic(
            final FinoraBranchCredentialAuthenticationAuthority
                passwordAuthority
        ) {

        if (passwordAuthority == null) {
            throw new IllegalArgumentException(
                "FINORA Password Authority is required."
            );
        }

        return new FinoraBranchPasswordFirstLoginAuthority(
            new FinoraBranchPasswordFirstLoginAuthority
                .PasswordAuthenticationPort() {

                @Override
                public FinoraBranchPasswordFirstLoginAuthority
                    .PasswordAuthenticationResult authenticate(
                        String username,
                        String password
                    ) {

                    FinoraBranchCredentialAuthenticationAuthority.Result
                        result =
                            passwordAuthority.authenticate(
                                new FinoraBranchCredentialAuthenticationAuthority
                                    .Request(
                                        username,
                                        password
                                    )
                            );

                    return mapPasswordResult(
                        result
                    );
                }
            },
            new FinoraBranchPasswordFirstLoginAuthority
                .DeviceTrustCheckPort() {

                @Override
                public FinoraBranchDeviceTrustAuthority.Result check(
                    FinoraBranchDeviceTrustAuthority.Principal principal
                ) {
                    throw new IllegalStateException(
                        "Device Trust is disabled for simple portability login."
                    );
                }
            },
            new FinoraBranchPasswordFirstLoginAuthority
                .DeviceTrustAuthorizationPort() {

                @Override
                public FinoraBranchDeviceTrustAuthorizationAuthority.Result
                    authorize(
                        FinoraBranchDeviceTrustAuthorizationAuthority
                            .Principal principal,
                        String password,
                        String securityCode
                    ) {
                    throw new IllegalStateException(
                        "Device authorization is disabled for simple portability login."
                    );
                }
            },
            false
        );
    }

    static FinoraBranchPasswordFirstLoginAuthority compose(
        final FinoraBranchCredentialAuthenticationAuthority passwordAuthority,
        final FinoraBranchDeviceTrustAuthority deviceTrust,
        final FinoraBranchDeviceTrustAuthorizationAuthority deviceAuthorization
    ) {

        if (
            passwordAuthority == null ||
            deviceTrust == null ||
            deviceAuthorization == null
        ) {
            throw new IllegalArgumentException(
                "FINORA password-first production authorities are required."
            );
        }

        return new FinoraBranchPasswordFirstLoginAuthority(
            new FinoraBranchPasswordFirstLoginAuthority
                .PasswordAuthenticationPort() {

                @Override
                public FinoraBranchPasswordFirstLoginAuthority
                    .PasswordAuthenticationResult authenticate(
                        String username,
                        String password
                    ) {

                    FinoraBranchCredentialAuthenticationAuthority.Result result =
                        passwordAuthority.authenticate(
                            new FinoraBranchCredentialAuthenticationAuthority
                                .Request(
                                    username,
                                    password
                                )
                        );

                    return mapPasswordResult(
                        result
                    );
                }
            },
            new FinoraBranchPasswordFirstLoginAuthority
                .DeviceTrustCheckPort() {

                @Override
                public FinoraBranchDeviceTrustAuthority.Result check(
                    FinoraBranchDeviceTrustAuthority.Principal principal
                ) {

                    return deviceTrust.check(
                        principal
                    );
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

                    return deviceAuthorization.authorize(
                        principal,
                        password,
                        securityCode
                    );
                }
            }
        );
    }

    static FinoraBranchPasswordFirstLoginAuthority
        .PasswordAuthenticationResult mapPasswordResult(
            FinoraBranchCredentialAuthenticationAuthority.Result result
        ) {

        if (result == null) {
            return FinoraBranchPasswordFirstLoginAuthority
                .PasswordAuthenticationResult.failure(
                    FinoraBranchPasswordFirstLoginAuthority
                        .ERROR_PASSWORD_AUTHENTICATION_FAILED,
                    "FINORA Password authentication could not be completed."
                );
        }

        if (!result.success) {
            return FinoraBranchPasswordFirstLoginAuthority
                .PasswordAuthenticationResult.failure(
                    result.errorCode,
                    result.error
                );
        }

        if (result.data == null) {
            return FinoraBranchPasswordFirstLoginAuthority
                .PasswordAuthenticationResult.failure(
                    FinoraBranchPasswordFirstLoginAuthority
                        .ERROR_PASSWORD_AUTHENTICATION_FAILED,
                    "FINORA Password authentication returned invalid state."
                );
        }

        FinoraBranchCredentialAuthenticationAuthority.Success data =
            result.data;

        return FinoraBranchPasswordFirstLoginAuthority
            .PasswordAuthenticationResult.success(
                new FinoraBranchPasswordFirstLoginAuthority
                    .AuthenticatedIdentity(
                        data.credentialId,
                        data.authGeneration,
                        data.userId,
                        data.username,
                        data.fullName,
                        data.role,
                        data.ownerId,
                        data.businessId,
                        data.branchId,
                        data.storageMode,
                        data.dataContext,
                        data.demoId,
                        data.authenticatedAt
                    )
            );
    }
}