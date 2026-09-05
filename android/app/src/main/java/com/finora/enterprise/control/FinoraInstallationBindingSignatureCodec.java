package com.finora.enterprise.control;

/* ===========================================================
   FINORA ENTERPRISE OS™

   ECDSA SIGNATURE CODEC

   RESPONSIBILITY:

   - Convert Android/JCA DER ECDSA signatures to FINORA
     IEEE-P1363 fixed-width r||s
   - Convert FINORA IEEE-P1363 signatures back to DER

   SECURITY:

   - Pure Java.
   - No key material.
   - No Android APIs.
=========================================================== */

import java.io.ByteArrayOutputStream;
import java.util.Arrays;

public final class FinoraInstallationBindingSignatureCodec {

    private FinoraInstallationBindingSignatureCodec() {
    }

    // ========================================================
    // DER -> IEEE-P1363
    // ========================================================

    public static byte[] derToP1363(
        byte[] derSignature,
        int componentLength
    ) {

        if (
            derSignature == null ||
            componentLength <= 0
        ) {
            throw new IllegalArgumentException(
                "Valid DER signature and component length are required."
            );
        }

        int[] cursor = {
            0
        };

        requireByte(
            derSignature,
            cursor,
            0x30
        );

        int sequenceLength =
            readLength(
                derSignature,
                cursor
            );

        if (
            sequenceLength !=
                derSignature.length -
                    cursor[0]
        ) {
            throw new IllegalArgumentException(
                "Invalid ECDSA DER sequence length."
            );
        }

        byte[] r =
            readInteger(
                derSignature,
                cursor
            );

        byte[] s =
            readInteger(
                derSignature,
                cursor
            );

        if (
            cursor[0] !=
                derSignature.length
        ) {
            throw new IllegalArgumentException(
                "Unexpected trailing ECDSA DER data."
            );
        }

        byte[] result =
            new byte[
                componentLength * 2
            ];

        copyUnsignedComponent(
            r,
            result,
            0,
            componentLength
        );

        copyUnsignedComponent(
            s,
            result,
            componentLength,
            componentLength
        );

        return result;
    }

    // ========================================================
    // IEEE-P1363 -> DER
    // ========================================================

    public static byte[] p1363ToDer(
        byte[] signature
    ) {

        if (
            signature == null ||
            signature.length == 0 ||
            signature.length % 2 != 0
        ) {
            throw new IllegalArgumentException(
                "Valid IEEE-P1363 signature is required."
            );
        }

        int componentLength =
            signature.length / 2;

        byte[] r =
            Arrays.copyOfRange(
                signature,
                0,
                componentLength
            );

        byte[] s =
            Arrays.copyOfRange(
                signature,
                componentLength,
                signature.length
            );

        byte[] rDer =
            encodePositiveInteger(
                r
            );

        byte[] sDer =
            encodePositiveInteger(
                s
            );

        ByteArrayOutputStream body =
            new ByteArrayOutputStream();

        body.write(
            0x02
        );

        writeLength(
            body,
            rDer.length
        );

        body.write(
            rDer,
            0,
            rDer.length
        );

        body.write(
            0x02
        );

        writeLength(
            body,
            sDer.length
        );

        body.write(
            sDer,
            0,
            sDer.length
        );

        byte[] bodyBytes =
            body.toByteArray();

        ByteArrayOutputStream sequence =
            new ByteArrayOutputStream();

        sequence.write(
            0x30
        );

        writeLength(
            sequence,
            bodyBytes.length
        );

        sequence.write(
            bodyBytes,
            0,
            bodyBytes.length
        );

        return sequence.toByteArray();
    }

    // ========================================================
    // DER PARSING
    // ========================================================

    private static byte[] readInteger(
        byte[] source,
        int[] cursor
    ) {

        requireByte(
            source,
            cursor,
            0x02
        );

        int length =
            readLength(
                source,
                cursor
            );

        if (
            length <= 0 ||
            cursor[0] + length >
                source.length
        ) {
            throw new IllegalArgumentException(
                "Invalid ECDSA DER integer length."
            );
        }

        byte[] value =
            Arrays.copyOfRange(
                source,
                cursor[0],
                cursor[0] + length
            );

        cursor[0] +=
            length;

        /*
         * ECDSA r/s must be positive ASN.1 INTEGER values.
         */
        if (
            (value[0] & 0x80) != 0
        ) {
            throw new IllegalArgumentException(
                "ECDSA DER integer is negative."
            );
        }

        return value;
    }

    private static int readLength(
        byte[] source,
        int[] cursor
    ) {

        if (
            cursor[0] >=
                source.length
        ) {
            throw new IllegalArgumentException(
                "Missing DER length."
            );
        }

        int first =
            source[
                cursor[0]++
            ] & 0xff;

        if (
            (first & 0x80) == 0
        ) {
            return first;
        }

        int count =
            first & 0x7f;

        if (
            count <= 0 ||
            count > 4 ||
            cursor[0] + count >
                source.length
        ) {
            throw new IllegalArgumentException(
                "Invalid DER long-form length."
            );
        }

        int result =
            0;

        for (
            int index = 0;
            index < count;
            index++
        ) {

            result =
                (result << 8) |
                (
                    source[
                        cursor[0]++
                    ] & 0xff
                );
        }

        return result;
    }

    private static void requireByte(
        byte[] source,
        int[] cursor,
        int expected
    ) {

        if (
            cursor[0] >=
                source.length ||
            (
                source[
                    cursor[0]++
                ] & 0xff
            ) != expected
        ) {
            throw new IllegalArgumentException(
                "Invalid ECDSA DER structure."
            );
        }
    }

    // ========================================================
    // COMPONENT NORMALIZATION
    // ========================================================

    private static void copyUnsignedComponent(
        byte[] source,
        byte[] destination,
        int destinationOffset,
        int componentLength
    ) {

        int sourceOffset =
            0;

        while (
            sourceOffset <
                source.length - 1 &&
            source[sourceOffset] == 0
        ) {
            sourceOffset++;
        }

        int meaningfulLength =
            source.length -
            sourceOffset;

        if (
            meaningfulLength >
                componentLength
        ) {
            throw new IllegalArgumentException(
                "ECDSA component exceeds the expected P-256 width."
            );
        }

        System.arraycopy(
            source,
            sourceOffset,
            destination,
            destinationOffset +
                componentLength -
                meaningfulLength,
            meaningfulLength
        );
    }

    private static byte[] encodePositiveInteger(
        byte[] component
    ) {

        int offset =
            0;

        while (
            offset <
                component.length - 1 &&
            component[offset] == 0
        ) {
            offset++;
        }

        int meaningfulLength =
            component.length -
            offset;

        boolean needsLeadingZero =
            (
                component[offset] &
                0x80
            ) != 0;

        byte[] result =
            new byte[
                meaningfulLength +
                (
                    needsLeadingZero
                        ? 1
                        : 0
                )
            ];

        int destinationOffset =
            needsLeadingZero
                ? 1
                : 0;

        System.arraycopy(
            component,
            offset,
            result,
            destinationOffset,
            meaningfulLength
        );

        return result;
    }

    // ========================================================
    // DER LENGTH ENCODING
    // ========================================================

    private static void writeLength(
        ByteArrayOutputStream output,
        int length
    ) {

        if (
            length < 0
        ) {
            throw new IllegalArgumentException(
                "DER length cannot be negative."
            );
        }

        if (
            length < 128
        ) {
            output.write(
                length
            );

            return;
        }

        int bytesRequired =
            0;

        int value =
            length;

        while (
            value > 0
        ) {
            bytesRequired++;
            value >>>=
                8;
        }

        output.write(
            0x80 |
            bytesRequired
        );

        for (
            int shift =
                (
                    bytesRequired - 1
                ) * 8;
            shift >= 0;
            shift -= 8
        ) {
            output.write(
                (
                    length >>> shift
                ) & 0xff
            );
        }
    }
}