package com.finora.enterprise.control;

import android.content.ContentResolver;
import android.content.Context;

import androidx.documentfile.provider.DocumentFile;

import com.finora.enterprise.usb.FinoraUsbStorage;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.ByteBuffer;
import java.nio.CharBuffer;
import java.nio.charset.CharacterCodingException;
import java.nio.charset.CodingErrorAction;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Objects;

/**
 * Native Android USB persistence for Portable Branch Auth V1.
 *
 * Physical contract:
 *   <USB_ROOT>/FINORA/auth/finora-branch-auth.bin
 *
 * Security/storage boundary:
 * - USB only.
 * - Uses the existing FinoraUsbStorage configured-tree authority.
 * - Requires removable USB ROOT authority.
 * - Legacy FINORA/storage selection returns REAUTHORIZATION_REQUIRED.
 * - No LOCAL fallback exists.
 * - Serialized bytes are bounded to 128 KiB.
 * - UTF-8 decoding is strict.
 * - Replacement uses temp + backup recovery semantics.
 *
 * This class performs persistence only. It does not authenticate,
 * decrypt, authorize devices, or establish sessions.
 */
public final class FinoraPortableBranchAuthUsbStore {

    public static final String DIRECTORY_NAME =
        "FINORA";

    public static final String AUTH_SUBDIRECTORY =
        "auth";

    public static final String FILE_NAME =
        "finora-branch-auth.bin";

    public static final String TEMP_FILE_NAME =
        "finora-branch-auth.tmp.bin";

    public static final String BACKUP_FILE_NAME =
        "finora-branch-auth.backup.bin";

    public static final int MAX_SERIALIZED_BYTES =
        128 * 1024;

    public static final String REAUTHORIZATION_REQUIRED =
        "REAUTHORIZATION_REQUIRED";

    public static final String USB_NOT_CONFIGURED =
        "USB_NOT_CONFIGURED";

    public static final String USB_UNAVAILABLE =
        "USB_UNAVAILABLE";

    public static final String USB_STORE_FAILED =
        "USB_STORE_FAILED";

    public static final String INVALID_SERIALIZED =
        "INVALID_SERIALIZED";

    private static final String BINARY_MIME_TYPE =
        "application/octet-stream";

    interface StoreIo {

        boolean exists()
            throws StoreException;

        byte[] readBounded(
            int maximumBytes
        )
            throws StoreException;

        void writeRecoverably(
            byte[] bytes
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

    private static final class AndroidDocumentStoreIo
        implements StoreIo {

        private final ContentResolver contentResolver;

        private final FinoraUsbStorage usbStorage;

        AndroidDocumentStoreIo(
            Context context
        ) {

            Objects.requireNonNull(
                context,
                "Android context is required."
            );

            Context applicationContext =
                context.getApplicationContext();

            if (applicationContext == null) {
                applicationContext =
                    context;
            }

            this.contentResolver =
                applicationContext
                    .getContentResolver();

            this.usbStorage =
                new FinoraUsbStorage(
                    applicationContext
                );
        }

        @Override
        public boolean exists()
            throws StoreException {

            DocumentFile root =
                resolvePortableAuthRoot();

            DocumentFile authDirectory =
                resolveAuthDirectory(
                    root,
                    false
                );

            if (authDirectory == null) {
                return false;
            }

            return resolveRecoverableFile(
                authDirectory
            ) != null;
        }

        @Override
        public byte[] readBounded(
            int maximumBytes
        )
            throws StoreException {

            DocumentFile root =
                resolvePortableAuthRoot();

            DocumentFile authDirectory =
                resolveAuthDirectory(
                    root,
                    false
                );

            if (authDirectory == null) {
                throw new StoreException(
                    USB_STORE_FAILED,
                    "FINORA USB Portable Branch Auth is missing."
                );
            }

            DocumentFile file =
                resolveRecoverableFile(
                    authDirectory
                );

            if (file == null) {
                throw new StoreException(
                    USB_STORE_FAILED,
                    "FINORA USB Portable Branch Auth is missing."
                );
            }

            return readBoundedFile(
                file,
                maximumBytes
            );
        }

        @Override
        public void writeRecoverably(
            byte[] bytes
        )
            throws StoreException {

            DocumentFile root =
                resolvePortableAuthRoot();

            DocumentFile authDirectory =
                resolveAuthDirectory(
                    root,
                    true
                );

            DocumentFile currentFile =
                resolveRecoverableFile(
                    authDirectory
                );

            deleteIfPresent(
                authDirectory,
                TEMP_FILE_NAME
            );

            DocumentFile tempFile =
                authDirectory.createFile(
                    BINARY_MIME_TYPE,
                    TEMP_FILE_NAME
                );

            if (tempFile == null) {
                throw new StoreException(
                    USB_STORE_FAILED,
                    "Unable to create FINORA USB Portable Branch Auth temporary file."
                );
            }

            try {
                writeFile(
                    tempFile,
                    bytes
                );
            }
            catch (StoreException error) {

                tempFile.delete();

                throw error;
            }

            deleteIfPresent(
                authDirectory,
                BACKUP_FILE_NAME
            );

            if (currentFile == null) {

                try {
                    promoteTempToFinal(
                        authDirectory,
                        tempFile,
                        bytes
                    );

                    return;
                }
                catch (StoreException error) {

                    deleteIfPresent(
                        authDirectory,
                        TEMP_FILE_NAME
                    );

                    throw error;
                }
            }

            if (
                !currentFile.renameTo(
                    BACKUP_FILE_NAME
                )
            ) {

                tempFile.delete();

                throw new StoreException(
                    USB_STORE_FAILED,
                    "Unable to preserve the previous FINORA USB Portable Branch Auth."
                );
            }

            try {

                promoteTempToFinal(
                    authDirectory,
                    tempFile,
                    bytes
                );

                deleteIfPresent(
                    authDirectory,
                    BACKUP_FILE_NAME
                );
            }
            catch (StoreException error) {

                deleteIfPresent(
                    authDirectory,
                    FILE_NAME
                );

                DocumentFile backupFile =
                    authDirectory.findFile(
                        BACKUP_FILE_NAME
                    );

                if (backupFile != null) {
                    backupFile.renameTo(
                        FILE_NAME
                    );
                }

                deleteIfPresent(
                    authDirectory,
                    TEMP_FILE_NAME
                );

                throw error;
            }
        }

        private DocumentFile resolvePortableAuthRoot()
            throws StoreException {

            final FinoraUsbStorage.PortableAuthRoot result;

            try {
                result =
                    usbStorage
                        .resolvePortableAuthRoot();
            }
            catch (Exception error) {
                throw new StoreException(
                    USB_UNAVAILABLE,
                    "Unable to resolve FINORA Portable Branch Auth USB root.",
                    error
                );
            }

            if (result == null) {
                throw new StoreException(
                    USB_UNAVAILABLE,
                    "FINORA Portable Branch Auth USB root authority returned no result."
                );
            }

            if (!result.isReady()) {

                throw new StoreException(
                    errorCodeForRootAvailability(
                        result.availability
                    ),
                    nonEmptyOrDefault(
                        result.message,
                        "FINORA Portable Branch Auth USB root is unavailable."
                    )
                );
            }

            if (result.root == null) {
                throw new StoreException(
                    USB_UNAVAILABLE,
                    "FINORA Portable Branch Auth USB root is unavailable."
                );
            }

            return result.root;
        }

        private DocumentFile resolveAuthDirectory(
            DocumentFile usbRoot,
            boolean create
        )
            throws StoreException {

            DocumentFile finoraDirectory =
                usbRoot.findFile(
                    DIRECTORY_NAME
                );

            if (finoraDirectory == null) {

                if (!create) {
                    return null;
                }

                finoraDirectory =
                    usbRoot.createDirectory(
                        DIRECTORY_NAME
                    );

                if (finoraDirectory == null) {
                    throw new StoreException(
                        USB_STORE_FAILED,
                        "Unable to create FINORA directory on the selected USB."
                    );
                }
            }
            else if (!finoraDirectory.isDirectory()) {
                throw new StoreException(
                    USB_STORE_FAILED,
                    "FINORA USB path conflicts with an existing file: FINORA"
                );
            }

            DocumentFile authDirectory =
                finoraDirectory.findFile(
                    AUTH_SUBDIRECTORY
                );

            if (authDirectory == null) {

                if (!create) {
                    return null;
                }

                authDirectory =
                    finoraDirectory.createDirectory(
                        AUTH_SUBDIRECTORY
                    );

                if (authDirectory == null) {
                    throw new StoreException(
                        USB_STORE_FAILED,
                        "Unable to create FINORA/auth directory on the selected USB."
                    );
                }
            }
            else if (!authDirectory.isDirectory()) {
                throw new StoreException(
                    USB_STORE_FAILED,
                    "FINORA USB path conflicts with an existing file: auth"
                );
            }

            return authDirectory;
        }

        private DocumentFile resolveRecoverableFile(
            DocumentFile directory
        )
            throws StoreException {

            DocumentFile finalFile =
                directory.findFile(
                    FILE_NAME
                );

            if (finalFile != null) {

                if (finalFile.isDirectory()) {
                    throw new StoreException(
                        USB_STORE_FAILED,
                        "FINORA USB Portable Branch Auth path conflicts with a directory."
                    );
                }

                return finalFile;
            }

            DocumentFile backupFile =
                directory.findFile(
                    BACKUP_FILE_NAME
                );

            if (backupFile != null) {

                if (backupFile.isDirectory()) {
                    throw new StoreException(
                        USB_STORE_FAILED,
                        "FINORA USB Portable Branch Auth backup path is invalid."
                    );
                }

                backupFile.renameTo(
                    FILE_NAME
                );

                return backupFile;
            }

            /*
             * A lone temp file is never promoted automatically.
             * It may represent an interrupted first write.
             * Fail-safe behavior is to discard it rather than make
             * potentially partial bytes authoritative.
             */
            deleteIfPresent(
                directory,
                TEMP_FILE_NAME
            );

            return null;
        }

        private byte[] readBoundedFile(
            DocumentFile file,
            int maximumBytes
        )
            throws StoreException {

            InputStream input =
                null;

            try {

                input =
                    contentResolver
                        .openInputStream(
                            file.getUri()
                        );

                if (input == null) {
                    throw new StoreException(
                        USB_STORE_FAILED,
                        "Unable to open FINORA USB Portable Branch Auth for reading."
                    );
                }

                ByteArrayOutputStream output =
                    new ByteArrayOutputStream();

                byte[] buffer =
                    new byte[8192];

                int total =
                    0;

                while (true) {

                    int read =
                        input.read(
                            buffer
                        );

                    if (read < 0) {
                        break;
                    }

                    total += read;

                    if (total > maximumBytes) {
                        throw new StoreException(
                            INVALID_SERIALIZED,
                            "FINORA USB Portable Branch Auth exceeds the maximum serialized size."
                        );
                    }

                    output.write(
                        buffer,
                        0,
                        read
                    );
                }

                return output.toByteArray();
            }
            catch (StoreException error) {
                throw error;
            }
            catch (Exception error) {
                throw new StoreException(
                    USB_STORE_FAILED,
                    "Unable to read FINORA USB Portable Branch Auth.",
                    error
                );
            }
            finally {

                if (input != null) {

                    try {
                        input.close();
                    }
                    catch (Exception ignored) {
                        // Best-effort close.
                    }
                }
            }
        }

        private void promoteTempToFinal(
            DocumentFile directory,
            DocumentFile tempFile,
            byte[] bytes
        )
            throws StoreException {

            if (
                tempFile.renameTo(
                    FILE_NAME
                )
            ) {
                return;
            }

            DocumentFile finalFile =
                directory.createFile(
                    BINARY_MIME_TYPE,
                    FILE_NAME
                );

            if (finalFile == null) {
                throw new StoreException(
                    USB_STORE_FAILED,
                    "Unable to create FINORA USB Portable Branch Auth file."
                );
            }

            try {

                writeFile(
                    finalFile,
                    bytes
                );

                tempFile.delete();
            }
            catch (StoreException error) {

                finalFile.delete();

                throw error;
            }
        }

        private void writeFile(
            DocumentFile file,
            byte[] bytes
        )
            throws StoreException {

            OutputStream output =
                null;

            try {

                output =
                    contentResolver
                        .openOutputStream(
                            file.getUri(),
                            "wt"
                        );

                if (output == null) {
                    throw new StoreException(
                        USB_STORE_FAILED,
                        "Unable to open FINORA USB Portable Branch Auth for writing."
                    );
                }

                output.write(
                    bytes
                );

                output.flush();
            }
            catch (StoreException error) {
                throw error;
            }
            catch (Exception error) {
                throw new StoreException(
                    USB_STORE_FAILED,
                    "Unable to write FINORA USB Portable Branch Auth.",
                    error
                );
            }
            finally {

                if (output != null) {

                    try {
                        output.close();
                    }
                    catch (Exception ignored) {
                        // Best-effort close.
                    }
                }
            }
        }

        private void deleteIfPresent(
            DocumentFile directory,
            String name
        )
            throws StoreException {

            DocumentFile existing =
                directory.findFile(
                    name
                );

            if (
                existing != null &&
                !existing.delete()
            ) {
                throw new StoreException(
                    USB_STORE_FAILED,
                    "Unable to remove stale FINORA USB Portable Branch Auth artifact: " +
                    name
                );
            }
        }
    }

    private final StoreIo io;

    public FinoraPortableBranchAuthUsbStore(
        Context context
    ) {
        this(
            new AndroidDocumentStoreIo(
                context
            )
        );
    }

    FinoraPortableBranchAuthUsbStore(
        StoreIo io
    ) {
        this.io =
            Objects.requireNonNull(
                io,
                "Portable Branch Auth USB store I/O is required."
            );
    }

    public synchronized boolean exists()
        throws StoreException {

        return io.exists();
    }

    public synchronized String read()
        throws StoreException {

        if (!io.exists()) {
            return null;
        }

        byte[] serializedBytes =
            io.readBounded(
                MAX_SERIALIZED_BYTES
            );

        try {

            if (
                serializedBytes.length == 0 ||
                serializedBytes.length >
                    MAX_SERIALIZED_BYTES
            ) {
                throw new StoreException(
                    INVALID_SERIALIZED,
                    "FINORA USB Portable Branch Auth serialized data is invalid."
                );
            }

            return decodeStrictUtf8(
                serializedBytes
            );
        }
        finally {

            Arrays.fill(
                serializedBytes,
                (byte) 0
            );
        }
    }

    public synchronized void write(
        String serialized
    )
        throws StoreException {

        if (
            serialized == null ||
            serialized.length() == 0
        ) {
            throw new StoreException(
                INVALID_SERIALIZED,
                "FINORA USB Portable Branch Auth serialized data is required."
            );
        }

        byte[] serializedBytes =
            serialized.getBytes(
                StandardCharsets.UTF_8
            );

        try {

            if (
                serializedBytes.length == 0 ||
                serializedBytes.length >
                    MAX_SERIALIZED_BYTES
            ) {
                throw new StoreException(
                    INVALID_SERIALIZED,
                    "FINORA USB Portable Branch Auth exceeds the maximum serialized size."
                );
            }

            io.writeRecoverably(
                serializedBytes
            );
        }
        finally {

            Arrays.fill(
                serializedBytes,
                (byte) 0
            );
        }
    }

    static String errorCodeForRootAvailability(
        String availability
    ) {

        if (
            REAUTHORIZATION_REQUIRED.equals(
                availability
            )
        ) {
            return REAUTHORIZATION_REQUIRED;
        }

        if (
            "NOT_CONFIGURED".equals(
                availability
            )
        ) {
            return USB_NOT_CONFIGURED;
        }

        return USB_UNAVAILABLE;
    }

    private static String decodeStrictUtf8(
        byte[] bytes
    )
        throws StoreException {

        try {

            CharBuffer decoded =
                StandardCharsets.UTF_8
                    .newDecoder()
                    .onMalformedInput(
                        CodingErrorAction.REPORT
                    )
                    .onUnmappableCharacter(
                        CodingErrorAction.REPORT
                    )
                    .decode(
                        ByteBuffer.wrap(
                            bytes
                        )
                    );

            return decoded.toString();
        }
        catch (CharacterCodingException error) {
            throw new StoreException(
                INVALID_SERIALIZED,
                "FINORA USB Portable Branch Auth is not valid UTF-8.",
                error
            );
        }
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