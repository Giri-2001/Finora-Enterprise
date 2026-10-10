package com.finora.enterprise.control;

import android.content.Context;

import androidx.documentfile.provider.DocumentFile;

import com.finora.enterprise.usb.FinoraUsbStorage;

import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.ByteBuffer;
import java.nio.charset.CharacterCodingException;
import java.nio.charset.CodingErrorAction;
import java.nio.charset.StandardCharsets;
import java.util.Objects;

/**
 * Read-only account-scoped Portable Branch Auth V2 USB reader.
 *
 * USB_ROOT/<canonicalUsername>/FINORA/auth/finora-branch-auth.bin
 *
 * No write, repair, fallback to another owner or authentication.
 */
public final class FinoraPortableBranchAuthV2UsbReader {

    private static final int MAX_BYTES = 128 * 1024;

    /**
     * Validated, account-scoped V2 USB artifact.
     *
     * serializedEnvelope is the exact original UTF-8 text read
     * from USB. Never regenerate it using JSONObject.toString()
     * for fingerprint verification.
     */
    public static final class Artifact {
        public final JSONObject envelope;
        public final String serializedEnvelope;
        public final String portableAuthFingerprint;

        private Artifact(
            JSONObject envelope,
            String serializedEnvelope,
            String portableAuthFingerprint
        ) {
            this.envelope = envelope;
            this.serializedEnvelope = serializedEnvelope;
            this.portableAuthFingerprint = portableAuthFingerprint;
        }
    }

    private final Context context;

    public FinoraPortableBranchAuthV2UsbReader(
        Context context
    ) {
        this.context = Objects.requireNonNull(
            context,
            "Android context is required."
        ).getApplicationContext();
    }

    public JSONObject readExisting(
        String username
    ) throws IOException {
        return readExistingArtifact(username).envelope;
    }

    public Artifact readExistingArtifact(
        String username
    ) throws IOException {

        String canonical =
            FinoraPortableBranchAccountUsbRoot
                .canonicalUsername(username);

        FinoraUsbStorage.PortableAuthRoot authority =
            new FinoraUsbStorage(context)
                .resolvePortableAuthRoot();

        if (
            authority == null ||
            !authority.isReady() ||
            authority.root == null
        ) {
            throw new IOException(
                "FINORA USB root authorization is unavailable."
            );
        }

        DocumentFile accountRoot =
            FinoraPortableBranchAccountUsbRoot
                .resolveExisting(
                    authority.root,
                    canonical
                );

        if (accountRoot == null) {
            throw new IOException(
                "FINORA account USB directory is unavailable."
            );
        }

        DocumentFile finora =
            requiredDirectory(
                accountRoot,
                "FINORA"
            );

        DocumentFile auth =
            requiredDirectory(
                finora,
                "auth"
            );

        DocumentFile file =
            auth.findFile(
                "finora-branch-auth.bin"
            );

        if (
            file == null ||
            !file.isFile()
        ) {
            throw new IOException(
                "FINORA account V2 authentication is unavailable."
            );
        }

        long length = file.length();

        if (length > MAX_BYTES) {
            throw new IOException(
                "FINORA V2 authentication file is too large."
            );
        }

        byte[] bytes = readBounded(file);

        final String serialized;

        try {
            serialized =
                StandardCharsets.UTF_8
                    .newDecoder()
                    .onMalformedInput(
                        CodingErrorAction.REPORT
                    )
                    .onUnmappableCharacter(
                        CodingErrorAction.REPORT
                    )
                    .decode(
                        ByteBuffer.wrap(bytes)
                    )
                    .toString();
        }
        catch (CharacterCodingException error) {
            throw new IOException(
                "FINORA V2 authentication encoding is invalid.",
                error
            );
        }
        finally {
            java.util.Arrays.fill(
                bytes,
                (byte) 0
            );
        }

        final JSONObject envelope;

        try {
            envelope =
                FinoraPortableBranchAuthV2Envelope
                    .parse(serialized);
        }
        catch (IllegalArgumentException error) {
            throw new IOException(
                "FINORA account V2 authentication format is invalid.",
                error
            );
        }

        if (
            !canonical.equals(
                envelope.optString(
                    "canonicalUsername",
                    ""
                )
            )
        ) {
            throw new IOException(
                "FINORA account authentication scope mismatch."
            );
        }

        final String fingerprint;

        try {
            fingerprint =
                FinoraPortableBranchAuthV2EnvelopeFingerprint
                    .sha256ExactSerialized(serialized);
        }
        catch (Exception error) {
            throw new IOException(
                "FINORA V2 envelope fingerprint failed.",
                error
            );
        }

        return new Artifact(
            envelope,
            serialized,
            fingerprint
        );
    }

    private static DocumentFile requiredDirectory(
        DocumentFile parent,
        String name
    ) throws IOException {

        DocumentFile child =
            parent.findFile(name);

        if (
            child == null ||
            !child.isDirectory()
        ) {
            throw new IOException(
                "FINORA account authentication directory is unavailable."
            );
        }

        return child;
    }

    private byte[] readBounded(
        DocumentFile file
    ) throws IOException {

        try (
            InputStream input =
                context.getContentResolver()
                    .openInputStream(file.getUri());

            ByteArrayOutputStream output =
                new ByteArrayOutputStream()
        ) {
            if (input == null) {
                throw new IOException(
                    "FINORA USB authentication stream is unavailable."
                );
            }

            byte[] buffer = new byte[4096];
            int total = 0;
            int count;

            while (
                (count = input.read(buffer)) != -1
            ) {
                total += count;

                if (total > MAX_BYTES) {
                    throw new IOException(
                        "FINORA USB authentication exceeds the size limit."
                    );
                }

                output.write(
                    buffer,
                    0,
                    count
                );
            }

            if (total == 0) {
                throw new IOException(
                    "FINORA USB authentication file is empty."
                );
            }

            return output.toByteArray();
        }
    }
}