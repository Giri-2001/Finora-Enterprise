package com.finora.enterprise.control;

import android.content.Context;

import java.util.Objects;

/**
 * Canonical Android Portable Branch Auth storage-mode dispatcher.
 *
 * Security boundary:
 * - storageMode is explicit and authoritative;
 * - LOCAL dispatches only to LOCAL;
 * - USB dispatches only to USB;
 * - no cross-mode fallback exists;
 * - invalid storage modes fail closed.
 *
 * This class performs persistence composition only.
 * It does not authenticate, decrypt, authorize devices,
 * request Security Code, or establish sessions.
 */
public final class FinoraPortableBranchAuthStore {

    public static final String STORAGE_MODE_LOCAL =
        "LOCAL";

    public static final String STORAGE_MODE_USB =
        "USB";

    public static final String INVALID_STORAGE_MODE =
        "INVALID_STORAGE_MODE";

    public static final String LOCAL_STORE_FAILED =
        "LOCAL_STORE_FAILED";

    interface ModeStore {

        boolean exists()
            throws StoreException;

        String read()
            throws StoreException;

        void write(
            String serialized
        )
            throws StoreException;
    }

    public static final class StoreException
        extends Exception {

        public final String code;

        StoreException(
            String code,
            String message
        ) {
            super(message);

            this.code =
                code;
        }

        StoreException(
            String code,
            String message,
            Throwable cause
        ) {
            super(
                message,
                cause
            );

            this.code =
                code;
        }
    }

    private static final class LocalModeStore
        implements ModeStore {

        private final FinoraPortableBranchAuthLocalStore
            store;

        LocalModeStore(
            Context context
        ) {
            this.store =
                new FinoraPortableBranchAuthLocalStore(
                    context
                );
        }

        @Override
        public boolean exists()
            throws StoreException {

            try {
                return store.exists();
            }
            catch (
                FinoraPortableBranchAuthLocalStore.StoreException error
            ) {
                throw new StoreException(
                    LOCAL_STORE_FAILED,
                    nonEmptyOrDefault(
                        error.getMessage(),
                        "Unable to inspect FINORA LOCAL Portable Branch Auth."
                    ),
                    error
                );
            }
        }

        @Override
        public String read()
            throws StoreException {

            try {
                return store.read();
            }
            catch (
                FinoraPortableBranchAuthLocalStore.StoreException error
            ) {
                throw new StoreException(
                    LOCAL_STORE_FAILED,
                    nonEmptyOrDefault(
                        error.getMessage(),
                        "Unable to read FINORA LOCAL Portable Branch Auth."
                    ),
                    error
                );
            }
        }

        @Override
        public void write(
            String serialized
        )
            throws StoreException {

            try {
                store.write(
                    serialized
                );
            }
            catch (
                FinoraPortableBranchAuthLocalStore.StoreException error
            ) {
                throw new StoreException(
                    LOCAL_STORE_FAILED,
                    nonEmptyOrDefault(
                        error.getMessage(),
                        "Unable to write FINORA LOCAL Portable Branch Auth."
                    ),
                    error
                );
            }
        }
    }

    private static final class UsbModeStore
        implements ModeStore {

        private final FinoraPortableBranchAuthUsbStore
            store;

        UsbModeStore(
            Context context
        ) {
            this.store =
                new FinoraPortableBranchAuthUsbStore(
                    context
                );
        }

        @Override
        public boolean exists()
            throws StoreException {

            try {
                return store.exists();
            }
            catch (
                FinoraPortableBranchAuthUsbStore.StoreException error
            ) {
                throw mapUsbError(
                    error
                );
            }
        }

        @Override
        public String read()
            throws StoreException {

            try {
                return store.read();
            }
            catch (
                FinoraPortableBranchAuthUsbStore.StoreException error
            ) {
                throw mapUsbError(
                    error
                );
            }
        }

        @Override
        public void write(
            String serialized
        )
            throws StoreException {

            try {
                store.write(
                    serialized
                );
            }
            catch (
                FinoraPortableBranchAuthUsbStore.StoreException error
            ) {
                throw mapUsbError(
                    error
                );
            }
        }

        private static StoreException mapUsbError(
            FinoraPortableBranchAuthUsbStore.StoreException error
        ) {

            String code =
                error.code;

            if (
                code == null ||
                code.length() == 0
            ) {
                code =
                    FinoraPortableBranchAuthUsbStore
                        .USB_STORE_FAILED;
            }

            return new StoreException(
                code,
                nonEmptyOrDefault(
                    error.getMessage(),
                    "Unable to access FINORA USB Portable Branch Auth."
                ),
                error
            );
        }
    }

    private final ModeStore localStore;

    private final ModeStore usbStore;

    public FinoraPortableBranchAuthStore(
        Context context
    ) {
        this(
            new LocalModeStore(
                context
            ),
            new UsbModeStore(
                context
            )
        );
    }

    FinoraPortableBranchAuthStore(
        ModeStore localStore,
        ModeStore usbStore
    ) {
        this.localStore =
            Objects.requireNonNull(
                localStore,
                "LOCAL Portable Branch Auth store is required."
            );

        this.usbStore =
            Objects.requireNonNull(
                usbStore,
                "USB Portable Branch Auth store is required."
            );
    }

    public synchronized boolean exists(
        String storageMode
    )
        throws StoreException {

        return resolveStore(
            storageMode
        ).exists();
    }

    public synchronized String read(
        String storageMode
    )
        throws StoreException {

        return resolveStore(
            storageMode
        ).read();
    }

    public synchronized void write(
        String storageMode,
        String serialized
    )
        throws StoreException {

        resolveStore(
            storageMode
        ).write(
            serialized
        );
    }

    private ModeStore resolveStore(
        String storageMode
    )
        throws StoreException {

        if (
            STORAGE_MODE_LOCAL.equals(
                storageMode
            )
        ) {
            return localStore;
        }

        if (
            STORAGE_MODE_USB.equals(
                storageMode
            )
        ) {
            return usbStore;
        }

        throw new StoreException(
            INVALID_STORAGE_MODE,
            "Portable Branch Auth storageMode must be exactly LOCAL or USB."
        );
    }

    private static String nonEmptyOrDefault(
        String value,
        String fallback
    ) {

        if (
            value != null &&
            !value.trim().isEmpty()
        ) {
            return value;
        }

        return fallback;
    }
}