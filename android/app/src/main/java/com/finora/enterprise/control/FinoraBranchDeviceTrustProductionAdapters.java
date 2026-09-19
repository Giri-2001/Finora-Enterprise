package com.finora.enterprise.control;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.List;

// ============================================================
// FINORA ENTERPRISE OS
//
// ANDROID CONTROL
// BRANCH DEVICE TRUST PRODUCTION ADAPTERS
//
// RESPONSIBILITY:
//
// - Adapt selected LOCAL/USB Portable Auth persistence into the
//   check-only Device Trust authority.
// - Strictly parse the Portable Auth outer envelope.
// - Re-serialize the parsed envelope canonically.
// - Compute canonical UTF-8 SHA-256 Portable Auth fingerprint.
// - Adapt current Android Keystore public installation binding.
// - Adapt encrypted Android Device Trust record persistence.
// - Create the production check-only Device Trust authority.
//
// SECURITY:
//
// - No Security Code accepted here.
// - No Portable Auth decrypt occurs here.
// - No Device Trust mutation occurs here.
// - No private key is read or persisted.
// - USB remains explicit; no LOCAL fallback.
// - Invalid persisted/envelope state propagates fail-closed to
//   FinoraBranchDeviceTrustAuthority.
//
// VERSION : 1.0
// ============================================================

public final class FinoraBranchDeviceTrustProductionAdapters {

    private static final char[] HEX =
        "0123456789abcdef"
            .toCharArray();

    private FinoraBranchDeviceTrustProductionAdapters() {
    }

    // ========================================================
    // TESTABLE SOURCE PORTS
    // ========================================================

    interface SerializedPortableAuthSource {

        String read(
            String storageMode
        ) throws Exception;
    }

    interface PublicBindingSource {

        FinoraInstallationBindingCrypto.PublicBinding get()
            throws Exception;
    }

    interface TrustRecordsSource {

        List<
            FinoraBranchDeviceTrustStore.Record
        > readAll()
            throws Exception;
    }

    // ========================================================
    // PRODUCTION AUTHORITY FACTORY
    // ========================================================

    public static FinoraBranchDeviceTrustAuthority create(
        FinoraPortableBranchAuthStore portableAuthStore,
        FinoraInstallationBindingService installationBindingService,
        FinoraBranchDeviceTrustStore deviceTrustStore
    ) {

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

        return new FinoraBranchDeviceTrustAuthority(
            portableAuth(
                portableAuthStore
            ),
            nativeBinding(
                installationBindingService
            ),
            deviceTrustStore(
                deviceTrustStore
            )
        );
    }

    // ========================================================
    // PORTABLE AUTH PRODUCTION ADAPTER
    // ========================================================

    public static FinoraBranchDeviceTrustAuthority.PortableAuthPort
        portableAuth(
            final FinoraPortableBranchAuthStore store
        ) {

        if (store == null) {
            throw new IllegalArgumentException(
                "FINORA Portable Branch Auth Store is required."
            );
        }

        return portableAuthFromSource(
            new SerializedPortableAuthSource() {

                @Override
                public String read(
                    String storageMode
                ) throws Exception {

                    return store.read(
                        storageMode
                    );
                }
            }
        );
    }

    static FinoraBranchDeviceTrustAuthority.PortableAuthPort
        portableAuthFromSource(
            final SerializedPortableAuthSource source
        ) {

        if (source == null) {
            throw new IllegalArgumentException(
                "FINORA serialized Portable Auth source is required."
            );
        }

        return new FinoraBranchDeviceTrustAuthority.PortableAuthPort() {

            @Override
            public FinoraBranchDeviceTrustAuthority.PortableAuthIdentity
                read(
                    String storageMode
                ) throws Exception {

                String serialized =
                    source.read(
                        storageMode
                    );

                if (serialized == null) {
                    return null;
                }

                return portableIdentityFromSerialized(
                    serialized
                );
            }
        };
    }

    // ========================================================
    // CANONICAL PORTABLE AUTH IDENTITY
    // ========================================================

    static FinoraBranchDeviceTrustAuthority.PortableAuthIdentity
        portableIdentityFromSerialized(
            String serialized
        ) throws Exception {

        if (
            serialized == null ||
            serialized.isEmpty()
        ) {
            throw new IllegalArgumentException(
                "FINORA Portable Branch Auth serialized state is required."
            );
        }

        FinoraPortableBranchAuthEnvelopeCodec.Envelope envelope =
            FinoraPortableBranchAuthEnvelopeCodec.parse(
                serialized
            );

        String canonical =
            FinoraPortableBranchAuthEnvelopeCodec.serialize(
                envelope
            );

        return portableIdentityFromEnvelope(
            envelope,
            canonical
        );
    }

    static FinoraBranchDeviceTrustAuthority.PortableAuthIdentity
        portableIdentityFromEnvelope(
            FinoraPortableBranchAuthEnvelopeCodec.Envelope envelope,
            String canonicalSerialized
        ) throws Exception {

        if (
            envelope == null ||
            envelope.branchScope == null
        ) {
            throw new IllegalArgumentException(
                "FINORA Portable Branch Auth envelope identity is required."
            );
        }

        return new FinoraBranchDeviceTrustAuthority
            .PortableAuthIdentity(
                envelope.canonicalUsername,
                envelope.branchScope.ownerId,
                envelope.branchScope.businessId,
                envelope.branchScope.branchId,
                sha256Utf8(
                    canonicalSerialized
                )
            );
    }

    static String sha256Utf8(
        String value
    ) throws Exception {

        if (value == null) {
            throw new IllegalArgumentException(
                "FINORA canonical Portable Auth serialization is required."
            );
        }

        MessageDigest digest =
            MessageDigest.getInstance(
                "SHA-256"
            );

        byte[] hash =
            digest.digest(
                value.getBytes(
                    StandardCharsets.UTF_8
                )
            );

        char[] encoded =
            new char[
                hash.length * 2
            ];

        for (
            int index = 0;
            index < hash.length;
            index++
        ) {

            int valueByte =
                hash[index] & 0xff;

            encoded[index * 2] =
                HEX[
                    valueByte >>> 4
                ];

            encoded[
                index * 2 + 1
            ] =
                HEX[
                    valueByte & 0x0f
                ];
        }

        return new String(
            encoded
        );
    }

    // ========================================================
    // NATIVE BINDING PRODUCTION ADAPTER
    // ========================================================

    public static FinoraBranchDeviceTrustAuthority.NativeBindingPort
        nativeBinding(
            final FinoraInstallationBindingService service
        ) {

        if (service == null) {
            throw new IllegalArgumentException(
                "FINORA Installation Binding Service is required."
            );
        }

        return nativeBindingFromSource(
            new PublicBindingSource() {

                @Override
                public FinoraInstallationBindingCrypto.PublicBinding
                    get()
                        throws Exception {

                    return service.get();
                }
            }
        );
    }

    static FinoraBranchDeviceTrustAuthority.NativeBindingPort
        nativeBindingFromSource(
            final PublicBindingSource source
        ) {

        if (source == null) {
            throw new IllegalArgumentException(
                "FINORA native binding source is required."
            );
        }

        return new FinoraBranchDeviceTrustAuthority.NativeBindingPort() {

            @Override
            public FinoraBranchDeviceTrustAuthority.NativeBinding get()
                throws Exception {

                FinoraInstallationBindingCrypto.PublicBinding binding =
                    source.get();

                if (binding == null) {
                    return null;
                }

                return nativeBindingFromValues(
                    binding.installationId,
                    binding.bindingKeyId,
                    binding.fingerprintAlgorithm,
                    binding.publicKeyFingerprint
                );
            }
        };
    }

    static FinoraBranchDeviceTrustAuthority.NativeBinding
        nativeBindingFromValues(
            String installationId,
            String bindingKeyId,
            String fingerprintAlgorithm,
            String publicKeyFingerprint
        ) {

        return new FinoraBranchDeviceTrustAuthority.NativeBinding(
            installationId,
            bindingKeyId,
            fingerprintAlgorithm,
            publicKeyFingerprint
        );
    }

    // ========================================================
    // DEVICE TRUST STORE PRODUCTION ADAPTER
    // ========================================================

    public static FinoraBranchDeviceTrustAuthority.DeviceTrustStorePort
        deviceTrustStore(
            final FinoraBranchDeviceTrustStore store
        ) {

        if (store == null) {
            throw new IllegalArgumentException(
                "FINORA Branch Device Trust Store is required."
            );
        }

        return deviceTrustStoreFromSource(
            new TrustRecordsSource() {

                @Override
                public List<
                    FinoraBranchDeviceTrustStore.Record
                > readAll()
                    throws Exception {

                    return store.readAll();
                }
            }
        );
    }

    static FinoraBranchDeviceTrustAuthority.DeviceTrustStorePort
        deviceTrustStoreFromSource(
            final TrustRecordsSource source
        ) {

        if (source == null) {
            throw new IllegalArgumentException(
                "FINORA Device Trust record source is required."
            );
        }

        return new FinoraBranchDeviceTrustAuthority.DeviceTrustStorePort() {

            @Override
            public List<
                FinoraBranchDeviceTrustStore.Record
            > readAll()
                throws Exception {

                return source.readAll();
            }
        };
    }
}