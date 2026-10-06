package com.finora.enterprise.control;

import android.content.Context;
import android.util.AtomicFile;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.nio.charset.StandardCharsets;

/*
 * FINORA DEVELOPER CONTROL CENTER
 * ANDROID BRANCH RESTORE BIN V1
 *
 * IMPORTANT:
 *
 * - This does NOT mutate the imported signed Portable State.
 * - Delete means UI/registry visibility tombstone only.
 * - Original branch identity, subscription, wallet/recharge,
 *   pricing, entitlement and signed authorities stay untouched.
 * - Restore removes the tombstone and exposes the exact original
 *   signed branch record again.
 */
public final class FinoraDeveloperBranchRestoreBinStore {

    private static final String FORMAT =
        "FINORA_ANDROID_BRANCH_RESTORE_BIN_V1";

    private static final int SCHEMA_VERSION =
        1;

    private static final String FILE_NAME =
        "finora-developer-branch-restore-bin.json";

    private final AtomicFile atomicFile;

    public FinoraDeveloperBranchRestoreBinStore(
        Context context
    ) {

        File file =
            new File(
                context.getFilesDir(),
                FILE_NAME
            );

        atomicFile =
            new AtomicFile(
                file
            );
    }

    public synchronized JSONArray readDeletedBranches()
        throws Exception {

        return cloneArray(
            readState().getJSONArray(
                "entries"
            )
        );
    }

    public synchronized void deleteBranch(
        JSONObject branchRecord,
        int originalIndex
    ) throws Exception {

        if (branchRecord == null) {
            throw new IllegalArgumentException(
                "FINORA deleted Branch record is required."
            );
        }

        JSONObject identity =
            branchRecord.optJSONObject(
                "identity"
            );

        if (identity == null) {
            throw new IllegalArgumentException(
                "FINORA deleted Branch identity is missing."
            );
        }

        String ownerId =
            identity.optString(
                "ownerId",
                ""
            );

        String businessId =
            identity.optString(
                "businessId",
                ""
            );

        String branchId =
            identity.optString(
                "branchId",
                ""
            );

        assertIdentity(
            ownerId,
            businessId,
            branchId
        );

        JSONObject state =
            readState();

        JSONArray entries =
            state.getJSONArray(
                "entries"
            );

        for (
            int index = 0;
            index < entries.length();
            index++
        ) {

            JSONObject existing =
                entries.getJSONObject(
                    index
                );

            if (
                identityMatches(
                    existing.getJSONObject(
                        "record"
                    ),
                    ownerId,
                    businessId,
                    branchId
                )
            ) {
                throw new IllegalStateException(
                    "FINORA Branch already exists in the Android Restore Bin."
                );
            }
        }

        JSONObject entry =
            new JSONObject();

        entry.put(
            "deletedAt",
            new java.util.Date().toInstant().toString()
        );

        entry.put(
            "originalIndex",
            Math.max(
                0,
                originalIndex
            )
        );

        entry.put(
            "record",
            new JSONObject(
                branchRecord.toString()
            )
        );

        entries.put(
            entry
        );

        writeState(
            state
        );
    }

    public synchronized JSONObject restoreBranch(
        String ownerId,
        String businessId,
        String branchId
    ) throws Exception {

        assertIdentity(
            ownerId,
            businessId,
            branchId
        );

        JSONObject state =
            readState();

        JSONArray entries =
            state.getJSONArray(
                "entries"
            );

        JSONArray nextEntries =
            new JSONArray();

        JSONObject restored =
            null;

        for (
            int index = 0;
            index < entries.length();
            index++
        ) {

            JSONObject entry =
                entries.getJSONObject(
                    index
                );

            JSONObject record =
                entry.getJSONObject(
                    "record"
                );

            if (
                identityMatches(
                    record,
                    ownerId,
                    businessId,
                    branchId
                )
            ) {

                if (restored != null) {
                    throw new IllegalStateException(
                        "FINORA Android Restore Bin contains duplicate Branch identity."
                    );
                }

                restored =
                    new JSONObject(
                        entry.toString()
                    );

                continue;
            }

            nextEntries.put(
                entry
            );
        }

        if (restored == null) {
            throw new IllegalStateException(
                "FINORA deleted Branch was not found in the Android Restore Bin."
            );
        }

        state.put(
            "entries",
            nextEntries
        );

        writeState(
            state
        );

        return restored;
    }

    public synchronized boolean isDeleted(
        String ownerId,
        String businessId,
        String branchId
    ) throws Exception {

        assertIdentity(
            ownerId,
            businessId,
            branchId
        );

        JSONArray entries =
            readState().getJSONArray(
                "entries"
            );

        for (
            int index = 0;
            index < entries.length();
            index++
        ) {

            JSONObject record =
                entries
                    .getJSONObject(
                        index
                    )
                    .getJSONObject(
                        "record"
                    );

            if (
                identityMatches(
                    record,
                    ownerId,
                    businessId,
                    branchId
                )
            ) {
                return true;
            }
        }

        return false;
    }

    private JSONObject readState()
        throws Exception {

        if (
            !atomicFile
                .getBaseFile()
                .exists()
        ) {
            return emptyState();
        }

        byte[] bytes =
            readAll();

        try {

            JSONObject state =
                new JSONObject(
                    new String(
                        bytes,
                        StandardCharsets.UTF_8
                    )
                );

            if (
                !FORMAT.equals(
                    state.optString(
                        "format",
                        ""
                    )
                ) ||
                state.optInt(
                    "schemaVersion",
                    -1
                ) !=
                    SCHEMA_VERSION ||
                state.optJSONArray(
                    "entries"
                ) ==
                    null
            ) {
                throw new IllegalStateException(
                    "FINORA Android Branch Restore Bin format is invalid."
                );
            }

            return state;

        } finally {

            java.util.Arrays.fill(
                bytes,
                (byte) 0
            );
        }
    }

    private void writeState(
        JSONObject state
    ) throws Exception {

        byte[] bytes =
            state
                .toString()
                .getBytes(
                    StandardCharsets.UTF_8
                );

        FileOutputStream stream =
            null;

        try {

            stream =
                atomicFile.startWrite();

            stream.write(
                bytes
            );

            stream.flush();

            atomicFile.finishWrite(
                stream
            );

            stream =
                null;

        } finally {

            if (stream != null) {
                atomicFile.failWrite(
                    stream
                );
            }

            java.util.Arrays.fill(
                bytes,
                (byte) 0
            );
        }
    }

    private byte[] readAll()
        throws Exception {

        FileInputStream input =
            atomicFile.openRead();

        try {

            ByteArrayOutputStream output =
                new ByteArrayOutputStream();

            byte[] buffer =
                new byte[8192];

            int read;

            while (
                (
                    read =
                        input.read(
                            buffer
                        )
                ) !=
                    -1
            ) {

                output.write(
                    buffer,
                    0,
                    read
                );

                if (
                    output.size() >
                    8 * 1024 * 1024
                ) {
                    throw new IllegalStateException(
                        "FINORA Android Branch Restore Bin exceeds supported size."
                    );
                }
            }

            return output.toByteArray();

        } finally {

            input.close();
        }
    }

    private static JSONObject emptyState()
        throws Exception {

        JSONObject state =
            new JSONObject();

        state.put(
            "format",
            FORMAT
        );

        state.put(
            "schemaVersion",
            SCHEMA_VERSION
        );

        state.put(
            "entries",
            new JSONArray()
        );

        return state;
    }

    private static void assertIdentity(
        String ownerId,
        String businessId,
        String branchId
    ) {

        if (
            ownerId == null ||
            ownerId.trim().isEmpty() ||
            businessId == null ||
            businessId.trim().isEmpty() ||
            branchId == null ||
            branchId.trim().isEmpty()
        ) {
            throw new IllegalArgumentException(
                "FINORA Branch identity is incomplete."
            );
        }
    }

    private static boolean identityMatches(
        JSONObject record,
        String ownerId,
        String businessId,
        String branchId
    ) {

        JSONObject identity =
            record.optJSONObject(
                "identity"
            );

        return (
            identity != null &&
            ownerId.equals(
                identity.optString(
                    "ownerId",
                    ""
                )
            ) &&
            businessId.equals(
                identity.optString(
                    "businessId",
                    ""
                )
            ) &&
            branchId.equals(
                identity.optString(
                    "branchId",
                    ""
                )
            )
        );
    }

    private static JSONArray cloneArray(
        JSONArray input
    ) throws Exception {

        return new JSONArray(
            input.toString()
        );
    }
}