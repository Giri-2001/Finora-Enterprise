package com.finora.enterprise.control;

import android.content.Context;

import java.util.Objects;

/**
 * Native composition authority for reading Portable Branch Auth
 * from its explicit storage mode and returning only the fully
 * authenticated inner payload.
 *
 * Composition order:
 * 1. validate trusted expected branch scope input;
 * 2. read only the explicitly requested LOCAL or USB store;
 * 3. missing auth returns null;
 * 4. parse the serialized outer envelope;
 * 5. call the four-argument authenticated decrypt authority with
 *    the explicit expected owner/business/branch scope;
 * 6. return only the authenticated payload.
 *
 * Password and Security Code semantics are intentionally NOT
 * duplicated here. Their ordering remains owned by the closed
 * decrypt authorities.
 *
 * This is not the Password-first login authority and does not
 * establish device trust or a login session.
 */
public final class
    FinoraPortableBranchAuthAuthenticatedStoreAuthority {

    interface StoreReader {

        String read(
            String storageMode
        )
            throws FinoraPortableBranchAuthStore.StoreException;
    }

    interface SerializedAuthenticator {

        FinoraPortableBranchAuthPayloadCodec.Payload authenticate(
            String serialized,
            String password,
            String securityCode,
            FinoraPortableBranchAuthEnvelopeCodec.Scope expectedScope
        )
            throws FinoraPortableBranchAuthDecryptAuthority.CryptoException;
    }

    private static final class NativeStoreReader
        implements StoreReader {

        private final FinoraPortableBranchAuthStore store;

        NativeStoreReader(
            Context context
        ) {
            this.store =
                new FinoraPortableBranchAuthStore(
                    context
                );
        }

        @Override
        public String read(
            String storageMode
        )
            throws FinoraPortableBranchAuthStore.StoreException {

            return store.read(
                storageMode
            );
        }
    }

    private static final class NativeSerializedAuthenticator
        implements SerializedAuthenticator {

        @Override
        public FinoraPortableBranchAuthPayloadCodec.Payload authenticate(
            String serialized,
            String password,
            String securityCode,
            FinoraPortableBranchAuthEnvelopeCodec.Scope expectedScope
        )
            throws FinoraPortableBranchAuthDecryptAuthority.CryptoException {

            return authenticateSerialized(
                serialized,
                password,
                securityCode,
                expectedScope
            );
        }
    }

    private final StoreReader storeReader;

    private final SerializedAuthenticator authenticator;

    public FinoraPortableBranchAuthAuthenticatedStoreAuthority(
        Context context
    ) {
        this(
            new NativeStoreReader(
                context
            ),
            new NativeSerializedAuthenticator()
        );
    }

    FinoraPortableBranchAuthAuthenticatedStoreAuthority(
        StoreReader storeReader,
        SerializedAuthenticator authenticator
    ) {

        this.storeReader =
            Objects.requireNonNull(
                storeReader,
                "Portable Branch Auth store reader is required."
            );

        this.authenticator =
            Objects.requireNonNull(
                authenticator,
                "Portable Branch Auth authenticator is required."
            );
    }

    public FinoraPortableBranchAuthPayloadCodec.Payload
        readAndAuthenticate(
            String storageMode,
            String password,
            String securityCode,
            String ownerId,
            String businessId,
            String branchId
        )
            throws FinoraPortableBranchAuthStore.StoreException,
            FinoraPortableBranchAuthDecryptAuthority.CryptoException {

        FinoraPortableBranchAuthEnvelopeCodec.Scope expectedScope =
            buildExpectedScope(
                ownerId,
                businessId,
                branchId
            );

        String serialized =
            storeReader.read(
                storageMode
            );

        if (serialized == null) {
            return null;
        }

        return authenticator.authenticate(
            serialized,
            password,
            securityCode,
            expectedScope
        );
    }

    static FinoraPortableBranchAuthPayloadCodec.Payload
        authenticateSerialized(
            String serialized,
            String password,
            String securityCode,
            FinoraPortableBranchAuthEnvelopeCodec.Scope expectedScope
        )
            throws FinoraPortableBranchAuthDecryptAuthority.CryptoException {

        FinoraPortableBranchAuthEnvelopeCodec.Envelope envelope =
            FinoraPortableBranchAuthEnvelopeCodec.parse(
                serialized
            );

        return FinoraPortableBranchAuthAuthenticatedDecryptAuthority.decrypt(
            envelope,
            password,
            securityCode,
            expectedScope
        );
    }

    static FinoraPortableBranchAuthEnvelopeCodec.Scope buildExpectedScope(
        String ownerId,
        String businessId,
        String branchId
    ) {

        requireScopeId(
            ownerId,
            "ownerId"
        );

        requireScopeId(
            businessId,
            "businessId"
        );

        requireScopeId(
            branchId,
            "branchId"
        );

        return new FinoraPortableBranchAuthEnvelopeCodec.Scope(
            ownerId,
            businessId,
            branchId
        );
    }

    private static void requireScopeId(
        String value,
        String fieldName
    ) {

        if (
            value == null ||
            value.trim().isEmpty()
        ) {
            throw new IllegalArgumentException(
                "Portable Branch Auth expected " +
                fieldName +
                " is required."
            );
        }
    }
}