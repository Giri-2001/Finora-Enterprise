package com.finora.enterprise.control;

import android.content.ContentResolver;
import android.content.Context;

import androidx.documentfile.provider.DocumentFile;

import com.finora.enterprise.usb.FinoraUsbStorage;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;

import java.nio.ByteBuffer;
import java.nio.charset.CodingErrorAction;
import java.nio.charset.StandardCharsets;

/**
 * Exact-storage reader for the signed Fresh Device Runtime Authority.
 *
 * LOCAL:
 *   <filesDir>/FINORA/auth/finora-fresh-device-runtime-authority.json
 *
 * USB:
 *   <USB_ROOT>/FINORA/auth/finora-fresh-device-runtime-authority.json
 *
 * No cross-mode fallback is allowed.
 */
public final class FinoraPortableFreshDeviceRuntimeAuthorityStore {

    public static final String FILE_NAME =
        "finora-fresh-device-runtime-authority.json";

    private static final String DIRECTORY_FINORA =
        "FINORA";

    private static final String DIRECTORY_AUTH =
        "auth";

    private static final int MAX_BYTES =
        512 * 1024;

    private final Context context;
    private final FinoraUsbStorage usbStorage;

    public FinoraPortableFreshDeviceRuntimeAuthorityStore(
        Context context
    ) {
        if (context == null) {
            throw new IllegalArgumentException(
                "Android Context is required for FINORA Runtime Authority storage."
            );
        }

        Context applicationContext =
            context.getApplicationContext();

        this.context =
            applicationContext == null
                ? context
                : applicationContext;

        this.usbStorage =
            new FinoraUsbStorage(
                this.context
            );
    }

    public String read(
        String storageMode
    ) throws Exception {

        if (
            FinoraPortableBranchAuthStore
                .STORAGE_MODE_LOCAL
                .equals(
                    storageMode
                )
        ) {
            return readLocal();
        }

        if (
            FinoraPortableBranchAuthStore
                .STORAGE_MODE_USB
                .equals(
                    storageMode
                )
        ) {
            return readUsb();
        }

        throw new IllegalArgumentException(
            "FINORA Runtime Authority storageMode must be exactly LOCAL or USB."
        );
    }

    private String readLocal()
        throws Exception {

        File file =
            new File(
                new File(
                    new File(
                        context.getFilesDir(),
                        DIRECTORY_FINORA
                    ),
                    DIRECTORY_AUTH
                ),
                FILE_NAME
            );

        if (!file.isFile()) {
            throw new IllegalStateException(
                "FINORA Fresh Device Runtime Authority is unavailable in LOCAL auth storage."
            );
        }

        try (
            InputStream input =
                new FileInputStream(
                    file
                )
        ) {
            return readStrictUtf8(
                input
            );
        }
    }

    private String readUsb()
        throws Exception {

        FinoraUsbStorage.PortableAuthRoot authorityRoot =
            usbStorage.resolvePortableAuthRoot();

        if (
            authorityRoot == null ||
            !authorityRoot.isReady() ||
            authorityRoot.root == null
        ) {
            throw new IllegalStateException(
                authorityRoot != null &&
                authorityRoot.message != null &&
                !authorityRoot.message.trim().isEmpty()
                    ? authorityRoot.message
                    : "FINORA Portable Auth USB root is unavailable."
            );
        }

        DocumentFile finoraDirectory =
            authorityRoot.root.findFile(
                DIRECTORY_FINORA
            );

        if (
            finoraDirectory == null ||
            !finoraDirectory.isDirectory()
        ) {
            throw new IllegalStateException(
                "FINORA directory is unavailable on the selected USB."
            );
        }

        DocumentFile authDirectory =
            finoraDirectory.findFile(
                DIRECTORY_AUTH
            );

        if (
            authDirectory == null ||
            !authDirectory.isDirectory()
        ) {
            throw new IllegalStateException(
                "FINORA auth directory is unavailable on the selected USB."
            );
        }

        DocumentFile authorityFile =
            authDirectory.findFile(
                FILE_NAME
            );

        if (
            authorityFile == null ||
            !authorityFile.isFile()
        ) {
            throw new IllegalStateException(
                "FINORA Fresh Device Runtime Authority is unavailable on the selected USB."
            );
        }

        ContentResolver resolver =
            context.getContentResolver();

        InputStream input =
            resolver.openInputStream(
                authorityFile.getUri()
            );

        if (input == null) {
            throw new IllegalStateException(
                "Unable to open FINORA Fresh Device Runtime Authority."
            );
        }

        try (InputStream closeable = input) {
            return readStrictUtf8(
                closeable
            );
        }
    }

    private static String readStrictUtf8(
        InputStream input
    ) throws Exception {

        ByteArrayOutputStream output =
            new ByteArrayOutputStream();

        byte[] buffer =
            new byte[
                4096
            ];

        int total =
            0;

        while (true) {
            int count =
                input.read(
                    buffer
                );

            if (count < 0) {
                break;
            }

            total +=
                count;

            if (total > MAX_BYTES) {
                throw new IllegalStateException(
                    "FINORA Fresh Device Runtime Authority exceeds the maximum supported size."
                );
            }

            output.write(
                buffer,
                0,
                count
            );
        }

        byte[] bytes =
            output.toByteArray();

        if (bytes.length == 0) {
            throw new IllegalStateException(
                "FINORA Fresh Device Runtime Authority is empty."
            );
        }

        return StandardCharsets.UTF_8
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
            )
            .toString();
    }
}