package com.finora.enterprise.control;

import androidx.documentfile.provider.DocumentFile;

import java.text.Normalizer;
import java.util.Locale;

/**
 * Read-only account-scoped USB root resolver.
 *
 * Physical layout:
 *   <USB_ROOT>/<canonicalUsername>/FINORA/
 *
 * No directories are created here.
 * No legacy root authentication is replaced.
 * No fallback to another owner's auth is permitted.
 */
public final class FinoraPortableBranchAccountUsbRoot {

    private FinoraPortableBranchAccountUsbRoot() {
    }

    public static String canonicalUsername(
        String username
    ) {
        if (username == null) {
            throw new IllegalArgumentException(
                "FINORA username is required."
            );
        }

        String canonical = Normalizer.normalize(
            username.trim(),
            Normalizer.Form.NFKC
        ).toLowerCase(Locale.ROOT);

        if (
            canonical.length() == 0 ||
            canonical.length() > 128 ||
            ".".equals(canonical) ||
            "..".equals(canonical) ||
            !canonical.matches("[a-z0-9][a-z0-9._-]*")
        ) {
            throw new IllegalArgumentException(
                "FINORA username cannot be used as a USB folder."
            );
        }

        return canonical;
    }

    public static DocumentFile resolveExisting(
        DocumentFile selectedRoot,
        String username
    ) {
        if (
            selectedRoot == null ||
            !selectedRoot.isDirectory()
        ) {
            return null;
        }

        String canonical = canonicalUsername(username);

        String selectedName = selectedRoot.getName();

        if (
            selectedName != null &&
            canonical.equals(
                Normalizer.normalize(
                    selectedName,
                    Normalizer.Form.NFKC
                ).toLowerCase(Locale.ROOT)
            )
        ) {
            return selectedRoot;
        }

        DocumentFile accountRoot = selectedRoot.findFile(
            canonical
        );

        if (
            accountRoot == null ||
            !accountRoot.isDirectory()
        ) {
            return null;
        }

        return accountRoot;
    }
}