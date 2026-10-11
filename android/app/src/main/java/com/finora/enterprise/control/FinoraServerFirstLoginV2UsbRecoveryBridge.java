package com.finora.enterprise.control;

import android.content.Context;

import androidx.documentfile.provider.DocumentFile;

import com.finora.enterprise.usb.FinoraUsbStorage;

import java.security.MessageDigest;
import java.nio.charset.StandardCharsets;

/**
 * Production-facing READ-ONLY bridge for account-scoped USB V2.
 *
 * A verified result is not a login session and must not itself
 * authorize Control Store hydration or a branch-access grant.
 *
 * No legacy USB root fallback, USB write, or automatic repair.
 */
public final class FinoraServerFirstLoginV2UsbRecoveryBridge {

    private final Context context;
    private final FinoraPortableBranchAuthV2UsbReader reader;

    public FinoraServerFirstLoginV2UsbRecoveryBridge(
        Context context
    ) {
        if (context == null) {
            throw new IllegalArgumentException(
                "FINORA Android Context is required."
            );
        }

        Context application = context.getApplicationContext();
        this.context = application == null ? context : application;
        this.reader =
            new FinoraPortableBranchAuthV2UsbReader(this.context);
    }

    public FinoraServerFirstLoginV2RecoveryVerificationGate
        .VerifiedPair verifyExisting(
            String username,
            String password,
            String securityCode
        ) throws Exception {

        if (
            username == null ||
            password == null ||
            securityCode == null ||
            password.isEmpty() ||
            securityCode.isEmpty()
        ) {
            throw new SecurityException(
                "FINORA V2 recovery factors are incomplete."
            );
        }

        String canonical =
            FinoraPortableBranchAccountUsbRoot
                .canonicalUsername(username);

        FinoraUsbStorage.PortableAuthRoot usb =
            new FinoraUsbStorage(context)
                .resolvePortableAuthRoot();

        if (
            usb == null ||
            !usb.isReady() ||
            usb.root == null
        ) {
            throw new SecurityException(
                "FINORA USB authorization is unavailable."
            );
        }

        DocumentFile account =
            FinoraPortableBranchAccountUsbRoot
                .resolveExisting(
                    usb.root,
                    canonical
                );

        if (
            account == null ||
            !account.isDirectory() ||
            !FinoraServerFirstLoginRuntimeAuthorityUsbStore
                .accountMatches(account.getName(), canonical)
        ) {
            throw new SecurityException(
                "FINORA USB account scope invalid."
            );
        }

        String signedRuntime =
            FinoraServerFirstLoginRuntimeAuthorityUsbStore
                .readExisting(
                    context.getContentResolver(),
                    account,
                    canonical
                );

        if (
            signedRuntime == null ||
            signedRuntime.isEmpty()
        ) {
            throw new SecurityException(
                "FINORA account-scoped Runtime Authority is missing."
            );
        }

        FinoraPortableBranchAuthV2UsbReader.Artifact
            portable = reader.readExistingArtifact(canonical);

        // A second read catches ordinary concurrent changes or
        // replacement between credential/authority file reads.
        // This is a consistency check, not an atomic SAF snapshot.
        FinoraPortableBranchAuthV2UsbReader.Artifact
            confirmation = reader.readExistingArtifact(canonical);

        if (
            !MessageDigest.isEqual(
                portable.serializedEnvelope.getBytes(
                    StandardCharsets.UTF_8
                ),
                confirmation.serializedEnvelope.getBytes(
                    StandardCharsets.UTF_8
                )
            ) ||
            !portable.portableAuthFingerprint.equals(
                confirmation.portableAuthFingerprint
            )
        ) {
            throw new SecurityException(
                "FINORA V2 USB authentication changed during verification."
            );
        }

        return FinoraServerFirstLoginV2RecoveryVerificationGate
            .verify(
                portable.serializedEnvelope,
                canonical,
                password,
                securityCode,
                signedRuntime
            );
    }
}