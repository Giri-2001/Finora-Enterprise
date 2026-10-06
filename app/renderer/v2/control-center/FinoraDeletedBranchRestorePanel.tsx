import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  RotateCcw,
} from "lucide-react";

import type {
  FinoraControlCenterBranchRegistryView,
} from "../../../../electron/control-center/finoraControlCenterPreload";

type DeletedBranchEntry = {
  deletedAt:
    string;

  originalIndex:
    number;

  record:
    FinoraControlCenterBranchRegistryView["branches"][number];
};

type LoadState =
  | "LOADING"
  | "READY"
  | "ERROR";

export default function FinoraDeletedBranchRestorePanel() {

  const [
    entries,
    setEntries,
  ] = useState<DeletedBranchEntry[]>(
    [],
  );

  const [
    loadState,
    setLoadState,
  ] = useState<LoadState>(
    "LOADING",
  );

  const [
    error,
    setError,
  ] = useState<string | undefined>();

  const [
    restoringBranchId,
    setRestoringBranchId,
  ] = useState<string | undefined>();

  const loadEntries =
    useCallback(
      async () => {

        const bridge =
          window.finoraControlCenter;

        if (!bridge) {

          setLoadState(
            "ERROR",
          );

          setError(
            "FINORA Developer Control Center bridge is unavailable.",
          );

          return;
        }

        setLoadState(
          "LOADING",
        );

        setError(
          undefined,
        );

        const result =
          await bridge.getDeletedBranchRestoreBin();

        if (!result.success) {

          setLoadState(
            "ERROR",
          );

          setError(
            result.error ??
              "Unable to load deleted FINORA branches.",
          );

          return;
        }

        setEntries(
          result.data ?? [],
        );

        setLoadState(
          "READY",
        );
      },
      [],
    );

  useEffect(
    () => {

      void loadEntries();

    },
    [
      loadEntries,
    ],
  );

  async function restoreEntry(
    entry:
      DeletedBranchEntry,
  ) {

    const bridge =
      window.finoraControlCenter;

    if (!bridge) {

      setError(
        "FINORA Developer Control Center bridge is unavailable.",
      );

      return;
    }

    const identity =
      entry.record.identity;

    setRestoringBranchId(
      identity.branchId,
    );

    setError(
      undefined,
    );

    try {

      const result =
        await bridge.restoreBranchRegistryRecord({
          ownerId:
            identity.ownerId,

          businessId:
            identity.businessId,

          branchId:
            identity.branchId,
        });

      if (!result.success) {

        setError(
          result.error ??
            "Unable to restore FINORA Branch.",
        );

        return;
      }

      /*
       * Reload Restore Bin after successful restoration.
       *
       * Exact branch identity is restored by native/main authority.
       * Subscription/recharge/pricing stores are not recreated here.
       */
      await loadEntries();

    } finally {

      setRestoringBranchId(
        undefined,
      );
    }
  }

  return (
    <section
      data-finora-deleted-branches="true"
      style={{
        marginTop:
          "20px",
        padding:
          "18px",
        border:
          "1px solid rgba(148, 163, 184, 0.22)",
        borderRadius:
          "12px",
        background:
          "rgba(15, 23, 42, 0.5)",
      }}
    >
      <div
        style={{
          display:
            "flex",
          alignItems:
            "center",
          justifyContent:
            "space-between",
          gap:
            "12px",
          marginBottom:
            "8px",
        }}
      >
        <div>
          <h3
            style={{
              margin:
                0,
              fontSize:
                "17px",
              fontWeight:
                700,
            }}
          >
            Deleted Branches
          </h3>

          <p
            style={{
              margin:
                "6px 0 0",
              fontSize:
                "13px",
              lineHeight:
                1.5,
              opacity:
                0.76,
            }}
          >
            Restore a deleted branch with its original FINORA identity and position.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            void loadEntries();
          }}
          disabled={
            loadState ===
              "LOADING"
          }
          style={{
            minHeight:
              "36px",
            padding:
              "7px 11px",
            border:
              "1px solid rgba(148, 163, 184, 0.32)",
            borderRadius:
              "8px",
            background:
              "rgba(30, 41, 59, 0.78)",
            color:
              "#f8fafc",
            cursor:
              loadState === "LOADING"
                ? "default"
                : "pointer",
          }}
        >
          Refresh
        </button>
      </div>

      {loadState ===
        "LOADING" && (
        <p
          style={{
            margin:
              "14px 0 0",
            fontSize:
              "13px",
            opacity:
              0.74,
          }}
        >
          Loading deleted branches...
        </p>
      )}

      {loadState ===
        "READY" &&
        entries.length ===
          0 && (
        <p
          style={{
            margin:
              "14px 0 0",
            fontSize:
              "13px",
            opacity:
              0.74,
          }}
        >
          No deleted branches.
        </p>
      )}

      {entries.length >
        0 && (
        <div
          style={{
            display:
              "grid",
            gap:
              "10px",
            marginTop:
              "14px",
          }}
        >
          {entries.map(
            (
              entry,
            ) => {

              const identity =
                entry.record.identity;

              const restoring =
                restoringBranchId ===
                  identity.branchId;

              return (
                <div
                  data-finora-deleted-entry-row="true"
                  key={
                    `${identity.ownerId}:${identity.businessId}:${identity.branchId}`
                  }
                  style={{
                    display:
                      "grid",
                    gridTemplateColumns:
                      "minmax(0, 1fr) auto",
                    alignItems:
                      "center",
                    gap:
                      "14px",
                    padding:
                      "13px",
                    border:
                      "1px solid rgba(148, 163, 184, 0.18)",
                    borderRadius:
                      "10px",
                    background:
                      "rgba(2, 6, 23, 0.38)",
                  }}
                >
                  <div
                    style={{
                      minWidth:
                        0,
                    }}
                  >
                    <div
                      style={{
                        fontSize:
                          "14px",
                        fontWeight:
                          700,
                        overflowWrap:
                          "anywhere",
                      }}
                    >
                      {identity.branchId}
                    </div>

                    <div
                      style={{
                        marginTop:
                          "5px",
                        fontSize:
                          "12px",
                        lineHeight:
                          1.5,
                        opacity:
                          0.72,
                        overflowWrap:
                          "anywhere",
                      }}
                    >
                      Owner: {identity.ownerId}
                      <br />
                      Business: {identity.businessId}
                      <br />
                      Deleted: {new Date(
                        entry.deletedAt,
                      ).toLocaleString(
                        "en-GB",
                        {
                          day:
                            "2-digit",
                          month:
                            "2-digit",
                          year:
                            "numeric",
                          hour:
                            "2-digit",
                          minute:
                            "2-digit",
                          second:
                            "2-digit",
                          hour12:
                            true,
                        },
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={
                      restoring
                    }
                    onClick={() => {
                      void restoreEntry(
                        entry,
                      );
                    }}
                    style={{
                      minHeight:
                        "38px",
                      display:
                        "inline-flex",
                      alignItems:
                        "center",
                      justifyContent:
                        "center",
                      gap:
                        "7px",
                      padding:
                        "8px 12px",
                      border:
                        "1px solid rgba(96, 165, 250, 0.42)",
                      borderRadius:
                        "8px",
                      background:
                        "rgba(30, 64, 175, 0.22)",
                      color:
                        "#dbeafe",
                      cursor:
                        restoring
                          ? "default"
                          : "pointer",
                      whiteSpace:
                        "nowrap",
                    }}
                  >
                    <RotateCcw
                      size={16}
                      aria-hidden="true"
                    />

                    {restoring
                      ? "Restoring..."
                      : "Restore"}
                  </button>
                </div>
              );
            },
          )}
        </div>
      )}

      {error && (
        <p
          role="alert"
          style={{
            margin:
              "12px 0 0",
            fontSize:
              "13px",
            lineHeight:
              1.5,
            color:
              "#fecaca",
          }}
        >
          {error}
        </p>
      )}
    </section>
  );
}
