import {
  useState,
} from "react";


type OperationState =
  | "IDLE"
  | "WORKING"
  | "SUCCESS"
  | "ERROR";


function createPortableStateTransferCode():
  string {

  /*
   * 20 random bytes = 160 bits of entropy.
   *
   * Hex keeps the code portable across Windows/Android,
   * contains no whitespace/control characters, and satisfies
   * the existing 12..128 character Transfer Code contract.
   */
  const bytes =
    new Uint8Array(
      20,
    );


  globalThis.crypto.getRandomValues(
    bytes,
  );


  return Array.from(
    bytes,
  )
    .map(
      (value) =>
        value
          .toString(
            16,
          )
          .padStart(
            2,
            "0",
          ),
    )
    .join(
      "",
    );
}


export default function FinoraPortableStateImportPanel() {

  const bridge =
    window.finoraControlCenter;


  const importerAvailable =
    Boolean(
      bridge?.importPortableState,
    );


  const exporterAvailable =
    Boolean(
      bridge?.exportPortableState,
    );


  const [
    transferCode,
    setTransferCode,
  ] = useState(
    "",
  );


  const [
    operationState,
    setOperationState,
  ] = useState<OperationState>(
    "IDLE",
  );


  const [
    message,
    setMessage,
  ] = useState<
    string | undefined
  >();


  if (
    !importerAvailable &&
    !exporterAvailable
  ) {

    return null;
  }


  function generateTransferCode():
    void {

    try {

      setTransferCode(
        createPortableStateTransferCode(),
      );

      setOperationState(
        "IDLE",
      );

      setMessage(
        undefined,
      );
    }
    catch (error) {

      setTransferCode(
        "",
      );

      setOperationState(
        "ERROR",
      );

      setMessage(
        error instanceof Error
          ? error.message
          : "A secure Portable State Transfer Code could not be generated.",
      );
    }
  }


  async function exportStateFile():
    Promise<void> {

    const activeExporter =
      window
        .finoraControlCenter
        ?.exportPortableState;


    if (!activeExporter) {

      setOperationState(
        "ERROR",
      );

      setMessage(
        "FINORA Portable State export is unavailable on this device.",
      );

      return;
    }


    const code =
      transferCode;


    if (
      code.length < 12 ||
      code.length > 128 ||
      code.trim() !==
        code
    ) {

      setOperationState(
        "ERROR",
      );

      setMessage(
        "Generate a Portable State Transfer Code before export.",
      );

      return;
    }


    setOperationState(
      "WORKING",
    );

    setMessage(
      undefined,
    );


    try {

      const result =
        await activeExporter({
          transferCode:
            code,
        });


      if (!result.success) {

        setOperationState(
          "ERROR",
        );

        setMessage(
          result.error,
        );

        return;
      }


      if (
        result.data.status ===
          "CANCELLED"
      ) {

        setOperationState(
          "IDLE",
        );

        setMessage(
          "Portable State export cancelled.",
        );

        return;
      }


      setOperationState(
        "SUCCESS",
      );


      setMessage(
        `Portable State generation ${result.data.stateGeneration} exported. Keep this Transfer Code visible until the Android import succeeds.`,
      );
    }
    catch (error) {

      setOperationState(
        "ERROR",
      );

      setMessage(
        error instanceof Error
          ? error.message
          : "FINORA Portable State export failed.",
      );
    }
  }


  async function importStateFile():
    Promise<void> {

    const activeImporter =
      window
        .finoraControlCenter
        ?.importPortableState;


    if (!activeImporter) {

      setOperationState(
        "ERROR",
      );

      setMessage(
        "FINORA Portable State import is unavailable on this device.",
      );

      return;
    }


    const code =
      transferCode;


    if (
      code.length < 12 ||
      code.length > 128 ||
      code.trim() !==
        code
    ) {

      setOperationState(
        "ERROR",
      );

      setMessage(
        "Enter the exact Portable State Transfer Code.",
      );

      return;
    }


    setOperationState(
      "WORKING",
    );

    setMessage(
      undefined,
    );


    /*
     * The Android native invocation receives its own local
     * argument. Clear the React state before file selection.
     */
    setTransferCode(
      "",
    );


    try {

      const result =
        await activeImporter({
          transferCode:
            code,
        });


      if (!result.success) {

        setOperationState(
          "ERROR",
        );

        setMessage(
          result.error,
        );

        return;
      }


      if (
        result.data.status ===
          "CANCELLED"
      ) {

        setOperationState(
          "IDLE",
        );

        setMessage(
          "Portable State import cancelled.",
        );

        return;
      }


      setOperationState(
        "SUCCESS",
      );


      const generation =
        result.data.stateGeneration;


      setMessage(
        generation
          ? `Portable State generation ${generation} imported. Use Refresh in Branch Registry to load the imported branches.`
          : "Portable State imported. Use Refresh in Branch Registry to load the imported branches.",
      );
    }
    catch (error) {

      setOperationState(
        "ERROR",
      );

      setMessage(
        error instanceof Error
          ? error.message
          : "FINORA Portable State import failed.",
      );
    }
  }


  const isWorking =
    operationState ===
      "WORKING";


  return (
    <section
      data-finora-portable-state-handoff="true"
      style={{
        border:
          "1px solid rgba(148, 163, 184, 0.22)",
        borderRadius:
          "14px",
        padding:
          "16px",
        display:
          "grid",
        gap:
          "12px",
        fontFamily:
          "Inter, ui-sans-serif, system-ui, sans-serif",
      }}
    >
      <div>
        <div
          style={{
            fontSize:
              "16px",
            fontWeight:
              650,
          }}
        >
          Portable State Handoff
        </div>

        <div
          style={{
            marginTop:
              "4px",
            fontSize:
              "12px",
            lineHeight:
              1.5,
            opacity:
              0.72,
          }}
        >
          {exporterAvailable && importerAvailable
            ? "Export or import the signed FINORA Control Center Portable State between authorized Control Center devices."
            : exporterAvailable
              ? "Export the current signed Control Center state for another authorized FINORA Control Center device."
              : "Import an encrypted FINORA Portable State file from another authorized Control Center device."}
        </div>
      </div>

      {exporterAvailable && (
        <>
          <div
            style={{
              display:
                "grid",
              gap:
                "8px",
            }}
          >
            <div
              style={{
                fontSize:
                  "12px",
                fontWeight:
                  650,
              }}
            >
              Portable State Transfer Code
            </div>

            <input
              type="text"
              readOnly
              value={transferCode}
              spellCheck={false}
              placeholder="Generate a new Transfer Code"
              aria-label="Portable State Transfer Code"
              style={{
                width:
                  "100%",
                boxSizing:
                  "border-box",
                border:
                  "1px solid rgba(148, 163, 184, 0.30)",
                borderRadius:
                  "10px",
                padding:
                  "11px 12px",
                fontFamily:
                  "Inter, ui-sans-serif, system-ui, sans-serif",
                fontSize:
                  "13px",
                fontWeight:
                  600,
                letterSpacing:
                  "0.04em",
                background:
                  "rgba(15, 23, 42, 0.18)",
                color:
                  "inherit",
                outline:
                  "none",
              }}
            />

            <div
              style={{
                fontSize:
                  "11px",
                lineHeight:
                  1.5,
                opacity:
                  0.68,
              }}
            >
              This Transfer Code is generated locally and is not saved by FINORA. Keep it until the receiving Android device completes import.
            </div>
          </div>

          <div
            style={{
              display:
                "flex",
              flexWrap:
                "wrap",
              gap:
                "10px",
            }}
          >
            <button
              type="button"
              disabled={isWorking}
              onClick={
                generateTransferCode
              }
              style={{
                minHeight:
                  "40px",
                border:
                  "1px solid rgba(148, 163, 184, 0.30)",
                borderRadius:
                  "10px",
                padding:
                  "0 14px",
                fontFamily:
                  "Inter, ui-sans-serif, system-ui, sans-serif",
                fontSize:
                  "13px",
                fontWeight:
                  650,
                cursor:
                  isWorking
                    ? "wait"
                    : "pointer",
              }}
            >
              {transferCode
                ? "Regenerate Code"
                : "Generate Code"}
            </button>

            <button
              type="button"
              disabled={
                isWorking ||
                transferCode.length ===
                  0
              }
              onClick={() => {
                void exportStateFile();
              }}
              style={{
                minHeight:
                  "40px",
                border:
                  "1px solid rgba(96, 165, 250, 0.42)",
                borderRadius:
                  "10px",
                padding:
                  "0 14px",
                fontFamily:
                  "Inter, ui-sans-serif, system-ui, sans-serif",
                fontSize:
                  "13px",
                fontWeight:
                  650,
                cursor:
                  isWorking
                    ? "wait"
                    : "pointer",
              }}
            >
              {isWorking
                ? "Exporting..."
                : "Export .finora"}
            </button>
          </div>
        </>
      )}

      {importerAvailable && (
        <div
          style={{
            display:
              "grid",
            gridTemplateColumns:
              "minmax(0, 1fr) auto",
            gap:
              "10px",
            alignItems:
              "center",
          }}
        >
          <input
            type="password"
            value={transferCode}
            autoComplete="new-password"
            spellCheck={false}
            placeholder="Portable State Transfer Code"
            disabled={isWorking}
            onChange={(event) => {
              setTransferCode(
                event.target.value,
              );
            }}
            style={{
              width:
                "100%",
              minWidth:
                0,
              boxSizing:
                "border-box",
              border:
                "1px solid rgba(148, 163, 184, 0.30)",
              borderRadius:
                "10px",
              padding:
                "11px 12px",
              fontFamily:
                "Inter, ui-sans-serif, system-ui, sans-serif",
              fontSize:
                "13px",
              fontWeight:
                500,
              background:
                "rgba(15, 23, 42, 0.18)",
              color:
                "inherit",
              outline:
                "none",
            }}
          />

          <button
            type="button"
            disabled={isWorking}
            onClick={() => {
              void importStateFile();
            }}
            style={{
              minHeight:
                "40px",
              border:
                "1px solid rgba(96, 165, 250, 0.42)",
              borderRadius:
                "10px",
              padding:
                "0 14px",
              fontFamily:
                "Inter, ui-sans-serif, system-ui, sans-serif",
              fontSize:
                "13px",
              fontWeight:
                650,
              cursor:
                isWorking
                  ? "wait"
                  : "pointer",
            }}
          >
            {isWorking
              ? "Importing..."
              : "Import .finora"}
          </button>
        </div>
      )}

      {message && (
        <div
          role={
            operationState ===
              "ERROR"
              ? "alert"
              : "status"
          }
          style={{
            fontSize:
              "12px",
            lineHeight:
              1.5,
            fontWeight:
              500,
            overflowWrap:
              "anywhere",
          }}
        >
          {message}
        </div>
      )}
    </section>
  );
}