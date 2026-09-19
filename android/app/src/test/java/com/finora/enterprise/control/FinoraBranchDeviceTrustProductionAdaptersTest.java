package com.finora.enterprise.control;

import org.junit.Test;

import java.util.Collections;
import java.util.List;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;

public final class FinoraBranchDeviceTrustProductionAdaptersTest {

    private static final String PUBLIC_KEY_FINGERPRINT =
        "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";

    @Test
    public void sha256Utf8IsCanonicalLowercaseHex()
        throws Exception {

        String actual =
            FinoraBranchDeviceTrustProductionAdapters
                .sha256Utf8(
                    "abc"
                );

        assertEquals(
            "ba7816bf8f01cfea414140de5dae2223" +
            "b00361a396177a9cb410ff61f20015ad",
            actual
        );

        assertTrue(
            actual.matches(
                "^[a-f0-9]{64}$"
            )
        );
    }

    @Test
    public void portableSourceReceivesExactStorageMode()
        throws Exception {

        final String[] observed =
            new String[1];

        FinoraBranchDeviceTrustAuthority.PortableAuthPort port =
            FinoraBranchDeviceTrustProductionAdapters
                .portableAuthFromSource(
                    new FinoraBranchDeviceTrustProductionAdapters
                        .SerializedPortableAuthSource() {

                        @Override
                        public String read(
                            String storageMode
                        ) {

                            observed[0] =
                                storageMode;

                            return null;
                        }
                    }
                );

        assertNull(
            port.read(
                "USB"
            )
        );

        assertEquals(
            "USB",
            observed[0]
        );
    }

    @Test
    public void portableSourceFailurePropagatesFailClosed()
        throws Exception {

        FinoraBranchDeviceTrustAuthority.PortableAuthPort port =
            FinoraBranchDeviceTrustProductionAdapters
                .portableAuthFromSource(
                    new FinoraBranchDeviceTrustProductionAdapters
                        .SerializedPortableAuthSource() {

                        @Override
                        public String read(
                            String storageMode
                        ) throws Exception {

                            throw new Exception(
                                "STORE-FAILED"
                            );
                        }
                    }
                );

        boolean failed =
            false;

        try {
            port.read(
                "LOCAL"
            );
        }
        catch (Exception expected) {
            failed =
                true;

            assertEquals(
                "STORE-FAILED",
                expected.getMessage()
            );
        }

        assertTrue(
            failed
        );
    }

    @Test
    public void envelopeIdentityUsesCanonicalSerializationFingerprint()
        throws Exception {

        FinoraPortableBranchAuthEnvelopeCodec.Envelope envelope =
            new FinoraPortableBranchAuthEnvelopeCodec.Envelope(
                "UNUSED-BY-MAPPING-TEST",
                1,
                "owneruser",
                new FinoraPortableBranchAuthEnvelopeCodec.Scope(
                    "OWNER-1",
                    "BUSINESS-1",
                    "BRANCH-1"
                ),
                null,
                null,
                null,
                "UNUSED"
            );

        String canonical =
            "CANONICAL-PORTABLE-AUTH-FIXTURE";

        FinoraBranchDeviceTrustAuthority.PortableAuthIdentity identity =
            FinoraBranchDeviceTrustProductionAdapters
                .portableIdentityFromEnvelope(
                    envelope,
                    canonical
                );

        assertEquals(
            "owneruser",
            identity.canonicalUsername
        );

        assertEquals(
            "OWNER-1",
            identity.ownerId
        );

        assertEquals(
            "BUSINESS-1",
            identity.businessId
        );

        assertEquals(
            "BRANCH-1",
            identity.branchId
        );

        assertEquals(
            FinoraBranchDeviceTrustProductionAdapters
                .sha256Utf8(
                    canonical
                ),
            identity.portableAuthFingerprint
        );
    }

    @Test
    public void nativeBindingMappingPreservesExactPublicIdentity()
        throws Exception {

        FinoraBranchDeviceTrustAuthority.NativeBinding binding =
            FinoraBranchDeviceTrustProductionAdapters
                .nativeBindingFromValues(
                    "INSTALLATION-1",
                    "BINDING-1",
                    "SHA-256",
                    PUBLIC_KEY_FINGERPRINT
                );

        assertEquals(
            "INSTALLATION-1",
            binding.installationId
        );

        assertEquals(
            "BINDING-1",
            binding.bindingKeyId
        );

        assertEquals(
            "SHA-256",
            binding.fingerprintAlgorithm
        );

        assertEquals(
            PUBLIC_KEY_FINGERPRINT,
            binding.publicKeyFingerprint
        );
    }

    @Test
    public void missingNativeBindingPropagatesAsNull()
        throws Exception {

        FinoraBranchDeviceTrustAuthority.NativeBindingPort port =
            FinoraBranchDeviceTrustProductionAdapters
                .nativeBindingFromSource(
                    new FinoraBranchDeviceTrustProductionAdapters
                        .PublicBindingSource() {

                        @Override
                        public FinoraInstallationBindingCrypto.PublicBinding
                            get() {

                            return null;
                        }
                    }
                );

        assertNull(
            port.get()
        );
    }

    @Test
    public void trustStoreAdapterReturnsExactRecords()
        throws Exception {

        final List<
            FinoraBranchDeviceTrustStore.Record
        > expected =
            Collections.emptyList();

        FinoraBranchDeviceTrustAuthority.DeviceTrustStorePort port =
            FinoraBranchDeviceTrustProductionAdapters
                .deviceTrustStoreFromSource(
                    new FinoraBranchDeviceTrustProductionAdapters
                        .TrustRecordsSource() {

                        @Override
                        public List<
                            FinoraBranchDeviceTrustStore.Record
                        > readAll() {

                            return expected;
                        }
                    }
                );

        assertTrue(
            port.readAll() ==
            expected
        );
    }
}