package com.finora.enterprise.control;

import android.content.ContentResolver;

import androidx.documentfile.provider.DocumentFile;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.ByteBuffer;
import java.nio.charset.CodingErrorAction;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Arrays;

/**
 * Account-scoped server-first Runtime Authority SAF store.
 *
 * <selected account folder>/FINORA/auth/
 *     finora-fresh-device-runtime-authority.json
 *
 * No legacy root fallback, overwrite, rename, or deletion.
 *
 * Caller must have independently verified the matching V2
 * authentication fingerprint and signed runtime authority.
 *
 * This class is NOT connected to production login.
 */
public final class FinoraServerFirstLoginRuntimeAuthorityUsbStore {

    public static final String FILE_NAME =
        "finora-fresh-device-runtime-authority.json";

    private static final int MAX_BYTES = 128 * 1024;
    private static final Object WRITE_LOCK = new Object();

    public enum Status {
        WRITTEN,
        CONFLICT,
        INVALID_REQUEST,
        IO_FAILED
    }

    private FinoraServerFirstLoginRuntimeAuthorityUsbStore() {}

    public static boolean accountMatches(
        String folderName,
        String canonicalUsername
    ) {
        return FinoraPortableBranchAuthV2UsbWriter
            .accountFolderMatches(
                folderName,
                canonicalUsername
            );
    }

    private static DocumentFile existingAuthDirectory(
        DocumentFile accountFolder
    ) {
        if (
            accountFolder == null ||
            !accountFolder.isDirectory()
        ) {
            return null;
        }

        DocumentFile finora = accountFolder.findFile("FINORA");

        if (finora == null || !finora.isDirectory()) {
            return null;
        }

        DocumentFile auth = finora.findFile("auth");

        return auth != null && auth.isDirectory()
            ? auth
            : null;
    }

    /**
     * Read only. Returns null when the file does not exist.
     * Corrupt, malformed or inaccessible authority fails closed.
     */
    public static String readExisting(
        ContentResolver resolver,
        DocumentFile accountFolder,
        String canonicalUsername
    ) throws Exception {

        if (
            resolver == null ||
            accountFolder == null ||
            !accountMatches(
                accountFolder.getName(),
                canonicalUsername
            )
        ) {
            throw new SecurityException(
                "FINORA Runtime Authority account scope invalid."
            );
        }

        DocumentFile auth = existingAuthDirectory(
            accountFolder
        );

        if (auth == null) {
            // The caller must separately check for conflicting
            // non-directory FINORA/auth paths.
            DocumentFile finora = accountFolder.findFile("FINORA");

            if (finora != null) {
                if (!finora.isDirectory()) {
                    throw new SecurityException(
                        "FINORA path conflict."
                    );
                }

                if (finora.findFile("auth") != null) {
                    throw new SecurityException(
                        "FINORA auth directory conflict."
                    );
                }
            }

            return null;
        }

        DocumentFile authority = auth.findFile(FILE_NAME);

        if (authority == null) {
            return null;
        }

        if (
            !authority.isFile() ||
            authority.length() > MAX_BYTES
        ) {
            throw new SecurityException(
                "FINORA existing Runtime Authority is invalid."
            );
        }

        byte[] bytes = null;

        try (
            InputStream input =
                resolver.openInputStream(authority.getUri());
            ByteArrayOutputStream output =
                new ByteArrayOutputStream()
        ) {
            if (input == null) {
                throw new SecurityException(
                    "FINORA Runtime Authority cannot be read."
                );
            }

            byte[] buffer = new byte[4096];
            int count;

            while ((count = input.read(buffer)) != -1) {
                if (output.size() + count > MAX_BYTES) {
                    throw new SecurityException(
                        "FINORA Runtime Authority exceeds size limit."
                    );
                }

                output.write(buffer, 0, count);
            }

            bytes = output.toByteArray();

            if (bytes.length == 0) {
                throw new SecurityException(
                    "FINORA Runtime Authority is empty."
                );
            }

            String serialized = StandardCharsets.UTF_8
                .newDecoder()
                .onMalformedInput(CodingErrorAction.REPORT)
                .onUnmappableCharacter(CodingErrorAction.REPORT)
                .decode(ByteBuffer.wrap(bytes))
                .toString();

            FinoraPortableFreshDeviceRuntimeAuthorityContract
                .parse(serialized);

            return serialized;

        } finally {
            if (bytes != null) {
                Arrays.fill(bytes, (byte) 0);
            }
        }
    }

    public static Status writeNew(
        ContentResolver resolver,
        DocumentFile accountFolder,
        String canonicalUsername,
        String signedRuntimePackage
    ) {

        if (
            resolver == null ||
            accountFolder == null ||
            !accountFolder.isDirectory() ||
            !accountFolder.canWrite() ||
            !accountMatches(
                accountFolder.getName(),
                canonicalUsername
            ) ||
            signedRuntimePackage == null
        ) {
            return Status.INVALID_REQUEST;
        }

        byte[] bytes = signedRuntimePackage.getBytes(
            StandardCharsets.UTF_8
        );

        try {
            if (
                bytes.length == 0 ||
                bytes.length > MAX_BYTES
            ) {
                return Status.INVALID_REQUEST;
            }

            // Strict package shape. Cryptographic verification against
            // the correct Branch Certification public key remains
            // mandatory at the caller's trusted boundary.
            FinoraPortableFreshDeviceRuntimeAuthorityContract
                .parse(signedRuntimePackage);

            synchronized (WRITE_LOCK) {
                DocumentFile finora =
                    accountFolder.findFile("FINORA");

                if (finora == null) {
                    finora = accountFolder.createDirectory("FINORA");
                }

                if (finora == null || !finora.isDirectory()) {
                    return Status.CONFLICT;
                }

                DocumentFile auth = finora.findFile("auth");

                if (auth == null) {
                    auth = finora.createDirectory("auth");
                }

                if (auth == null || !auth.isDirectory()) {
                    return Status.CONFLICT;
                }

                if (auth.findFile(FILE_NAME) != null) {
                    return Status.CONFLICT;
                }

                // SAF DocumentFile is not an atomic transaction.
                // Any failed/partial create remains a conflict,
                // never automatically deleted or overwritten.
                DocumentFile created = auth.createFile(
                    "application/json",
                    FILE_NAME
                );

                if (
                    created == null ||
                    !created.isFile() ||
                    !FILE_NAME.equals(created.getName())
                ) {
                    return Status.IO_FAILED;
                }

                try (
                    OutputStream output =
                        resolver.openOutputStream(created.getUri(), "w")
                ) {
                    if (output == null) {
                        return Status.IO_FAILED;
                    }

                    output.write(bytes);
                    output.flush();
                }

                byte[] readBack = null;

                try (
                    InputStream input =
                        resolver.openInputStream(created.getUri());
                    ByteArrayOutputStream output =
                        new ByteArrayOutputStream()
                ) {
                    if (input == null) {
                        return Status.IO_FAILED;
                    }

                    byte[] buffer = new byte[4096];
                    int count;

                    while ((count = input.read(buffer)) != -1) {
                        if (output.size() + count > MAX_BYTES) {
                            return Status.IO_FAILED;
                        }

                        output.write(buffer, 0, count);
                    }

                    readBack = output.toByteArray();

                    if (!MessageDigest.isEqual(bytes, readBack)) {
                        return Status.IO_FAILED;
                    }

                    return Status.WRITTEN;

                } finally {
                    if (readBack != null) {
                        Arrays.fill(readBack, (byte) 0);
                    }
                }
            }

        } catch (Exception error) {
            return Status.IO_FAILED;
        } finally {
            Arrays.fill(bytes, (byte) 0);
        }
    }
}