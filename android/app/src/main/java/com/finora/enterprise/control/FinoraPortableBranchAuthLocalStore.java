package com.finora.enterprise.control;

import android.content.Context;
import android.util.AtomicFile;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.CharBuffer;
import java.nio.charset.CharacterCodingException;
import java.nio.charset.CodingErrorAction;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Objects;

/**
 * Native Android LOCAL persistence for Portable Branch Auth V1.
 *
 * Physical contract:
 *   <filesDir>/FINORA/auth/finora-branch-auth.bin
 *
 * Security/storage boundary:
 * - LOCAL only.
 * - No USB selection or fallback exists in this authority.
 * - Serialized bytes are bounded to 128 KiB.
 * - UTF-8 decoding is strict.
 * - Writes use Android AtomicFile.
 * - Missing auth returns null.
 *
 * This class performs persistence only. It does not authenticate,
 * decrypt, establish sessions, or authorize devices.
 */
public final class FinoraPortableBranchAuthLocalStore {

    public static final String DIRECTORY_NAME =
        "FINORA";

    public static final String AUTH_SUBDIRECTORY =
        "auth";

    public static final String FILE_NAME =
        "finora-branch-auth.bin";

    public static final int MAX_SERIALIZED_BYTES =
        128 * 1024;

    interface StoreIo {

        boolean exists()
            throws IOException;

        byte[] readBounded(
            int maximumBytes
        )
            throws IOException;

        void writeAtomically(
            byte[] bytes
        )
            throws IOException;
    }

    public static final class StoreException
        extends Exception {

        StoreException(
            String message
        ) {
            super(message);
        }

        StoreException(
            String message,
            Throwable cause
        ) {
            super(
                message,
                cause
            );
        }
    }

    private static final class AndroidAtomicFileIo
        implements StoreIo {

        private final AtomicFile atomicFile;

        AndroidAtomicFileIo(
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

            File filesRoot =
                applicationContext.getFilesDir();

            if (filesRoot == null) {
                throw new IllegalStateException(
                    "FINORA LOCAL files root is unavailable."
                );
            }

            File finoraDirectory =
                new File(
                    filesRoot,
                    DIRECTORY_NAME
                );

            File authDirectory =
                new File(
                    finoraDirectory,
                    AUTH_SUBDIRECTORY
                );

            if (
                !authDirectory.isDirectory() &&
                !authDirectory.mkdirs() &&
                !authDirectory.isDirectory()
            ) {
                throw new IllegalStateException(
                    "Unable to create FINORA Portable Branch Auth directory."
                );
            }

            this.atomicFile =
                new AtomicFile(
                    new File(
                        authDirectory,
                        FILE_NAME
                    )
                );
        }

        @Override
        public boolean exists() {
            return atomicFile
                .getBaseFile()
                .isFile();
        }

        @Override
        public byte[] readBounded(
            int maximumBytes
        )
            throws IOException {

            FileInputStream input =
                atomicFile.openRead();

            try {

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
                        throw new IOException(
                            "FINORA Portable Branch Auth exceeds the maximum serialized size."
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
            finally {
                input.close();
            }
        }

        @Override
        public void writeAtomically(
            byte[] bytes
        )
            throws IOException {

            FileOutputStream output =
                null;

            try {

                output =
                    atomicFile.startWrite();

                output.write(
                    bytes
                );

                output.flush();

                atomicFile.finishWrite(
                    output
                );

                output =
                    null;
            }
            catch (IOException error) {

                if (output != null) {

                    try {
                        atomicFile.failWrite(
                            output
                        );
                    }
                    catch (RuntimeException ignored) {
                        // Preserve original write failure.
                    }

                    output =
                        null;
                }

                throw error;
            }
            finally {

                if (output != null) {

                    try {
                        atomicFile.failWrite(
                            output
                        );
                    }
                    catch (RuntimeException ignored) {
                        // Best-effort rollback.
                    }
                }
            }
        }
    }

    private final StoreIo io;

    public FinoraPortableBranchAuthLocalStore(
        Context context
    ) {
        this(
            new AndroidAtomicFileIo(
                context
            )
        );
    }

    FinoraPortableBranchAuthLocalStore(
        StoreIo io
    ) {
        this.io =
            Objects.requireNonNull(
                io,
                "Portable Branch Auth store I/O is required."
            );
    }

    public synchronized boolean exists()
        throws StoreException {

        try {
            return io.exists();
        }
        catch (IOException error) {
            throw new StoreException(
                "Unable to inspect FINORA LOCAL Portable Branch Auth.",
                error
            );
        }
    }

    public synchronized String read()
        throws StoreException {

        final boolean present;

        try {
            present =
                io.exists();
        }
        catch (IOException error) {
            throw new StoreException(
                "Unable to inspect FINORA LOCAL Portable Branch Auth.",
                error
            );
        }

        if (!present) {
            return null;
        }

        final byte[] serializedBytes;

        try {
            serializedBytes =
                io.readBounded(
                    MAX_SERIALIZED_BYTES
                );
        }
        catch (IOException error) {
            throw new StoreException(
                "Unable to read FINORA LOCAL Portable Branch Auth.",
                error
            );
        }

        try {

            if (
                serializedBytes.length == 0 ||
                serializedBytes.length >
                    MAX_SERIALIZED_BYTES
            ) {
                throw new StoreException(
                    "FINORA LOCAL Portable Branch Auth serialized data is invalid."
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
                "FINORA LOCAL Portable Branch Auth serialized data is required."
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
                    "FINORA LOCAL Portable Branch Auth exceeds the maximum serialized size."
                );
            }

            try {
                io.writeAtomically(
                    serializedBytes
                );
            }
            catch (IOException error) {
                throw new StoreException(
                    "Unable to write FINORA LOCAL Portable Branch Auth.",
                    error
                );
            }
        }
        finally {
            Arrays.fill(
                serializedBytes,
                (byte) 0
            );
        }
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
                "FINORA LOCAL Portable Branch Auth is not valid UTF-8.",
                error
            );
        }
    }
}