package com.finora.enterprise.control;

import android.content.Context;
import android.util.Base64;

import org.json.JSONArray;
import org.json.JSONObject;

import java.nio.charset.StandardCharsets;
import java.security.KeyFactory;
import java.security.MessageDigest;
import java.security.PrivateKey;
import java.security.Signature;
import java.security.interfaces.ECPrivateKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.text.SimpleDateFormat;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Date;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.TimeZone;


final class FinoraAndroidPortableStateExporter {

    private static final String FORMAT =
        "FINORA_CONTROL_CENTER_PORTABLE_STATE_V1";

    private static final int SCHEMA_VERSION =
        1;

    private static final long MAX_SAFE_INTEGER =
        9_007_199_254_740_991L;


    static final class Result {

        final byte[] transferBytes;
        final String serializedEnvelope;
        final long stateGeneration;
        final String payloadSha256;
        final String parentPayloadSha256;
        final String transferBundleSha256;
        final String suggestedFileName;

        Result(
            byte[] transferBytes,
            String serializedEnvelope,
            long stateGeneration,
            String payloadSha256,
            String parentPayloadSha256,
            String transferBundleSha256,
            String suggestedFileName
        ) {

            this.transferBytes =
                transferBytes;

            this.serializedEnvelope =
                serializedEnvelope;

            this.stateGeneration =
                stateGeneration;

            this.payloadSha256 =
                payloadSha256;

            this.parentPayloadSha256 =
                parentPayloadSha256;

            this.transferBundleSha256 =
                transferBundleSha256;

            this.suggestedFileName =
                suggestedFileName;
        }
    }


    private FinoraAndroidPortableStateExporter() {
    }


    static Result create(
        Context context,
        FinoraPortableStateAuthorityStore.Snapshot snapshot,
        JSONObject vault,
        String transferCode
    ) throws Exception {

        if (
            context == null ||
            snapshot == null ||
            vault == null
        ) {
            throw new IllegalArgumentException(
                "FINORA Android Portable State export authority is incomplete."
            );
        }


        if (
            snapshot.headGeneration <= 0L ||
            snapshot.headGeneration >=
                MAX_SAFE_INTEGER
        ) {
            throw new IllegalStateException(
                "FINORA Portable State generation cannot be advanced."
            );
        }


        String issuerId =
            requireText(
                vault.optString(
                    "issuerId",
                    null
                ),
                "issuerId"
            );

        String signingKeyId =
            requireText(
                vault.optString(
                    "signingKeyId",
                    null
                ),
                "signingKeyId"
            );

        String privateKeyBase64 =
            requireText(
                vault.optString(
                    "privateKeyPkcs8DerBase64",
                    null
                ),
                "privateKeyPkcs8DerBase64"
            );

        String publicKeyBase64 =
            requireText(
                vault.optString(
                    "publicKeySpkiDerBase64",
                    null
                ),
                "publicKeySpkiDerBase64"
            );


        if (
            !issuerId.equals(
                snapshot.issuerId
            ) ||
            !signingKeyId.equals(
                snapshot.signingKeyId
            )
        ) {
            throw new IllegalStateException(
                "FINORA Portable State export authority does not match the Android imported lineage."
            );
        }


        JSONObject payload =
            new JSONObject(
                snapshot.payload.toString()
            );


        long nextGeneration =
            snapshot.headGeneration +
                1L;

        String exportedAt =
            canonicalNow();


        payload.put(
            "format",
            FORMAT
        );

        payload.put(
            "schemaVersion",
            SCHEMA_VERSION
        );

        payload.put(
            "stateGeneration",
            nextGeneration
        );

        payload.put(
            "parentPayloadSha256",
            snapshot.headPayloadSha256
        );

        payload.put(
            "issuerId",
            issuerId
        );

        payload.put(
            "signingKeyId",
            signingKeyId
        );

        payload.put(
            "exportedAt",
            exportedAt
        );

        payload.put(
            "sourcePlatform",
            "ANDROID"
        );


        FinoraDeveloperControlCenterOperationalStore operationalStore =
            new FinoraDeveloperControlCenterOperationalStore(
                context
            );

        JSONObject walletHistory =
            new JSONObject();

        walletHistory.put(
            "records",
            operationalStore.getWalletHistory()
        );

        payload.put(
            "walletHistory",
            walletHistory
        );


        FinoraAndroidControlCenterIssuanceAuthorityStore issuanceStore =
            new FinoraAndroidControlCenterIssuanceAuthorityStore(
                context
            );

        JSONObject localIssuance =
            issuanceStore.loadSnapshot();


        if (localIssuance != null) {

            String localIssuer =
                requireText(
                    localIssuance.optString(
                        "issuerId",
                        null
                    ),
                    "local issuance issuerId"
                );

            if (!issuerId.equals(localIssuer)) {
                throw new IllegalStateException(
                    "FINORA Android local issuance authority belongs to another issuer."
                );
            }


            mergeGeneralIssuanceAuthority(
                payload,
                localIssuance
            );

            mergeClockAuthority(
                payload,
                localIssuance,
                issuerId
            );
        }


        String canonicalPayload =
            FinoraCanonicalJson.canonicalize(
                toCanonicalJavaValue(
                    payload
                )
            );


        String payloadSha256 =
            sha256Hex(
                canonicalPayload.getBytes(
                    StandardCharsets.UTF_8
                )
            );


        PrivateKey privateKey =
            decodePrivateKey(
                privateKeyBase64
            );


        Signature signer =
            Signature.getInstance(
                "SHA256withECDSA"
            );

        signer.initSign(
            privateKey
        );

        signer.update(
            canonicalPayload.getBytes(
                StandardCharsets.UTF_8
            )
        );


        byte[] derSignature =
            signer.sign();

        byte[] p1363 =
            FinoraInstallationBindingSignatureCodec
                .derToP1363(
                    derSignature,
                    32
                );


        if (p1363.length != 64) {
            throw new IllegalStateException(
                "FINORA Portable State P-256 signature must be 64-byte IEEE-P1363."
            );
        }


        String signatureBase64 =
            Base64.encodeToString(
                p1363,
                Base64.NO_WRAP
            );


        JSONObject envelope =
            new JSONObject();

        envelope.put(
            "format",
            FORMAT
        );

        envelope.put(
            "schemaVersion",
            SCHEMA_VERSION
        );

        envelope.put(
            "payload",
            payload
        );

        envelope.put(
            "payloadSha256",
            payloadSha256
        );

        envelope.put(
            "signatureBase64",
            signatureBase64
        );


        String serializedEnvelope =
            envelope.toString();


        /*
         * Mandatory self-verification before encryption/export.
         */
        FinoraPortableStateEnvelopeVerifier.verify(
            serializedEnvelope,
            issuerId,
            signingKeyId,
            publicKeyBase64
        );


        String serializedTransfer =
            FinoraPortableStateTransferCrypto
                .encryptSerializedSignedEnvelope(
                    serializedEnvelope,
                    transferCode
                );


        byte[] transferBytes =
            serializedTransfer.getBytes(
                StandardCharsets.UTF_8
            );


        String transferBundleSha256 =
            sha256Hex(
                transferBytes
            );


        return new Result(
            transferBytes,
            serializedEnvelope,
            nextGeneration,
            payloadSha256,
            snapshot.headPayloadSha256,
            transferBundleSha256,
            suggestedFileName()
        );
    }


    private static void mergeGeneralIssuanceAuthority(
        JSONObject payload,
        JSONObject local
    ) throws Exception {

        JSONObject issuanceAuthority =
            payload.getJSONObject(
                "issuanceAuthority"
            );

        JSONObject importedGeneral =
            issuanceAuthority.optJSONObject(
                "general"
            );


        JSONArray merged =
            new JSONArray();


        String createdAt =
            local.getString(
                "createdAt"
            );

        String updatedAt =
            local.getString(
                "updatedAt"
            );


        if (importedGeneral != null) {

            JSONArray imported =
                importedGeneral.getJSONArray(
                    "sequences"
                );

            for (
                int index = 0;
                index < imported.length();
                index++
            ) {
                merged.put(
                    new JSONObject(
                        imported
                            .getJSONObject(index)
                            .toString()
                    )
                );
            }


            String importedCreatedAt =
                importedGeneral.optString(
                    "createdAt",
                    null
                );

            if (
                importedCreatedAt != null &&
                !importedCreatedAt.trim().isEmpty()
            ) {

                createdAt =
                    earlierTimestamp(
                        createdAt,
                        importedCreatedAt
                    );
            }

            String importedUpdatedAt =
                importedGeneral.optString(
                    "updatedAt",
                    null
                );

            if (
                importedUpdatedAt != null &&
                !importedUpdatedAt.trim().isEmpty()
            ) {

                updatedAt =
                    laterTimestamp(
                        updatedAt,
                        importedUpdatedAt
                    );
            }
        }


        JSONArray localSequences =
            local.getJSONArray(
                "sequences"
            );


        for (
            int index = 0;
            index < localSequences.length();
            index++
        ) {

            JSONObject localRecord =
                localSequences.getJSONObject(
                    index
                );

            JSONObject existing =
                findGeneralRecord(
                    merged,
                    localRecord
                );


            if (existing == null) {

                merged.put(
                    new JSONObject(
                        localRecord.toString()
                    )
                );

                continue;
            }


            long localSequence =
                localRecord.getLong(
                    "lastReservedSequence"
                );

            long existingSequence =
                existing.getLong(
                    "lastReservedSequence"
                );


            if (
                localSequence >
                    existingSequence
            ) {

                existing.put(
                    "lastReservedSequence",
                    localSequence
                );

                existing.put(
                    "updatedAt",
                    localRecord.getString(
                        "updatedAt"
                    )
                );
            }
            else if (
                localSequence ==
                    existingSequence
            ) {

                existing.put(
                    "updatedAt",
                    laterTimestamp(
                        existing.getString(
                            "updatedAt"
                        ),
                        localRecord.getString(
                            "updatedAt"
                        )
                    )
                );
            }
        }


        JSONObject general =
            new JSONObject();

        general.put(
            "schemaVersion",
            1
        );

        general.put(
            "sequences",
            merged
        );

        general.put(
            "createdAt",
            createdAt
        );

        general.put(
            "updatedAt",
            updatedAt
        );


        issuanceAuthority.put(
            "general",
            general
        );
    }


    private static void mergeClockAuthority(
        JSONObject payload,
        JSONObject local,
        String issuerId
    ) throws Exception {

        JSONObject clockAuthority =
            payload.getJSONObject(
                "clockAuthority"
            );

        JSONObject state =
            clockAuthority.optJSONObject(
                "state"
            );


        String localHighWater =
            local.getString(
                "clockHighWaterAt"
            );

        String localCreatedAt =
            local.getString(
                "createdAt"
            );

        String localUpdatedAt =
            local.getString(
                "updatedAt"
            );


        if (state == null) {

            state =
                new JSONObject();

            state.put(
                "schemaVersion",
                1
            );

            state.put(
                "issuerId",
                issuerId
            );

            state.put(
                "highWaterAt",
                localHighWater
            );

            state.put(
                "createdAt",
                localCreatedAt
            );

            state.put(
                "updatedAt",
                localUpdatedAt
            );

            clockAuthority.put(
                "state",
                state
            );

            return;
        }


        String stateIssuer =
            requireText(
                state.optString(
                    "issuerId",
                    null
                ),
                "clock issuerId"
            );


        if (!issuerId.equals(stateIssuer)) {
            throw new IllegalStateException(
                "FINORA Portable State clock authority belongs to another issuer."
            );
        }


        state.put(
            "highWaterAt",
            laterTimestamp(
                state.getString(
                    "highWaterAt"
                ),
                localHighWater
            )
        );

        String stateCreatedAt =
            state.optString(
                "createdAt",
                null
            );

        if (
            stateCreatedAt == null ||
            stateCreatedAt.trim().isEmpty()
        ) {

            stateCreatedAt =
                localCreatedAt;
        }

        String stateUpdatedAt =
            state.optString(
                "updatedAt",
                null
            );

        if (
            stateUpdatedAt == null ||
            stateUpdatedAt.trim().isEmpty()
        ) {

            stateUpdatedAt =
                localUpdatedAt;
        }

        state.put(
            "createdAt",
            earlierTimestamp(
                stateCreatedAt,
                localCreatedAt
            )
        );

        state.put(
            "updatedAt",
            laterTimestamp(
                stateUpdatedAt,
                localUpdatedAt
            )
        );
    }


    private static JSONObject findGeneralRecord(
        JSONArray records,
        JSONObject candidate
    ) throws Exception {

        String[] keys = {
            "issuerId",
            "purpose",
            "ownerId",
            "businessId",
            "branchId",
            "installationId"
        };


        for (
            int index = 0;
            index < records.length();
            index++
        ) {

            JSONObject record =
                records.getJSONObject(
                    index
                );

            boolean matches =
                true;

            for (String key : keys) {

                if (
                    !candidate.getString(key)
                        .equals(
                            record.getString(key)
                        )
                ) {

                    matches =
                        false;

                    break;
                }
            }


            if (matches) {
                return record;
            }
        }


        return null;
    }


    private static Object toCanonicalJavaValue(
        Object value
    ) throws Exception {

        if (
            value == null ||
            value == JSONObject.NULL
        ) {
            return null;
        }


        if (value instanceof JSONObject) {

            JSONObject object =
                (JSONObject) value;

            Map<String, Object> result =
                new LinkedHashMap<>();

            Iterator<String> keys =
                object.keys();

            while (keys.hasNext()) {

                String key =
                    keys.next();

                result.put(
                    key,
                    toCanonicalJavaValue(
                        object.get(key)
                    )
                );
            }

            return result;
        }


        if (value instanceof JSONArray) {

            JSONArray array =
                (JSONArray) value;

            List<Object> result =
                new ArrayList<>();

            for (
                int index = 0;
                index < array.length();
                index++
            ) {
                result.add(
                    toCanonicalJavaValue(
                        array.get(index)
                    )
                );
            }

            return result;
        }


        return value;
    }


    private static PrivateKey decodePrivateKey(
        String value
    ) throws Exception {

        byte[] encoded =
            Base64.decode(
                value,
                Base64.DEFAULT
            );


        String canonical =
            Base64.encodeToString(
                encoded,
                Base64.NO_WRAP
            );


        if (
            encoded.length == 0 ||
            !canonical.equals(value)
        ) {
            throw new IllegalStateException(
                "FINORA Portable State private signing key is not canonical Base64."
            );
        }


        PrivateKey privateKey =
            KeyFactory.getInstance(
                "EC"
            ).generatePrivate(
                new PKCS8EncodedKeySpec(
                    encoded
                )
            );


        if (
            !(privateKey instanceof ECPrivateKey) ||
            ((ECPrivateKey) privateKey)
                .getParams()
                .getCurve()
                .getField()
                .getFieldSize() != 256
        ) {
            throw new IllegalStateException(
                "FINORA Portable State private signing key is not P-256."
            );
        }


        return privateKey;
    }


    private static String canonicalNow() {

        SimpleDateFormat formatter =
            new SimpleDateFormat(
                "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
                Locale.US
            );

        formatter.setTimeZone(
            TimeZone.getTimeZone(
                "UTC"
            )
        );

        return formatter.format(
            new Date()
        );
    }


    private static String suggestedFileName() {

        SimpleDateFormat formatter =
            new SimpleDateFormat(
                "dd-MM-yyyy_HH-mm",
                Locale.US
            );

        return
            "FINORA_Developer_Android_to_Laptop_" +
            formatter.format(
                new Date()
            ) +
            ".finora";
    }


    private static String earlierTimestamp(
        String left,
        String right
    ) {

        return Instant.parse(left)
            .compareTo(
                Instant.parse(right)
            ) <= 0
            ? left
            : right;
    }


    private static String laterTimestamp(
        String left,
        String right
    ) {

        return Instant.parse(left)
            .compareTo(
                Instant.parse(right)
            ) >= 0
            ? left
            : right;
    }


    private static String sha256Hex(
        byte[] value
    ) throws Exception {

        byte[] digest =
            MessageDigest.getInstance(
                "SHA-256"
            ).digest(
                value
            );

        StringBuilder result =
            new StringBuilder(
                digest.length * 2
            );

        for (byte item : digest) {
            result.append(
                String.format(
                    Locale.US,
                    "%02x",
                    item & 0xff
                )
            );
        }

        return result.toString();
    }


    private static String requireText(
        String value,
        String label
    ) {

        if (
            value == null ||
            value.trim().isEmpty() ||
            !value.equals(
                value.trim()
            )
        ) {
            throw new IllegalArgumentException(
                "FINORA Portable State " +
                label +
                " is invalid."
            );
        }

        return value;
    }
}