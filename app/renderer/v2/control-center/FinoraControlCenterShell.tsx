import {
  useEffect,
  useState,
} from "react";

import type {
  FinoraControlCenterTrustRecordView,
} from "../../../../electron/control-center/finoraControlCenterPreload";

import type { FinoraControlCenterBranchRegistryRecord } from "../../../../electron/control-center/finoraControlCenterBranchRegistry.types";
import type { FinoraControlCenterIssuanceWorkflow } from "./FinoraControlCenterIssuanceForm.types";

import FinoraControlCenterBranchRegistryPanel from "./FinoraControlCenterBranchRegistryPanel";
import FinoraControlCenterIssuanceWorkspace from "./FinoraControlCenterIssuanceWorkspace";

/* ===========================================================
   FINORA ENTERPRISE OS™

   CONTROL CENTER
   SHELL FOUNDATION

   RESPONSIBILITY:

   - Verify the dedicated preload bridge is available
   - Load safe public Control Center trust identity
   - Display renderer readiness / trust state
   - Remain isolated from the operational FINORA application

   NOT RESPONSIBLE FOR:

   - Package issuance forms
   - Signing-key access
   - Private-key display
   - Generic signing
   - Operational application navigation
=========================================================== */

type ControlCenterLoadState =
  | "LOADING"
  | "READY"
  | "UNAVAILABLE"
  | "ERROR";

export default function FinoraControlCenterShell() {
  const [
    activeView,
    setActiveView,
  ] = useState<
    "CONTROL" | "BRANCHES"
  >(
    "CONTROL",
  );

  const [
    selectedIssuanceBranch,
    setSelectedIssuanceBranch,
  ] = useState<
    FinoraControlCenterBranchRegistryRecord | undefined
  >();

  const [
    issuanceWorkflow,
    setIssuanceWorkflow,
  ] = useState<
    FinoraControlCenterIssuanceWorkflow
  >(
    "BRANCH_ACTIVATION",
  );

  const [
    workspaceFocusRequestId,
    setWorkspaceFocusRequestId,
  ] = useState(0);
  const [
    loadState,
    setLoadState,
  ] = useState<ControlCenterLoadState>(
    "LOADING",
  );

  const [
    trustRecord,
    setTrustRecord,
  ] = useState<
    FinoraControlCenterTrustRecordView | undefined
  >();

  const [
    errorMessage,
    setErrorMessage,
  ] = useState<
    string | undefined
  >();

  useEffect(
    () => {
      let cancelled =
        false;

      async function loadTrustRecord():
        Promise<void> {

        const bridge =
          window.finoraControlCenter;

        if (!bridge) {
          if (!cancelled) {
            setLoadState(
              "UNAVAILABLE",
            );

            setErrorMessage(
              "Dedicated FINORA Control Center preload bridge is unavailable.",
            );
          }

          return;
        }

        try {
          const result =
            await bridge.getTrustRecord();

          if (cancelled) {
            return;
          }

          if (!result.success) {
            setLoadState(
              "ERROR",
            );

            setErrorMessage(
              result.error,
            );

            return;
          }

          setTrustRecord(
            result.data,
          );

          setErrorMessage(
            undefined,
          );

          setLoadState(
            "READY",
          );
        } catch (error) {
          if (cancelled) {
            return;
          }

          setLoadState(
            "ERROR",
          );

          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Unable to load FINORA Control Center trust identity.",
          );
        }
      }

      void loadTrustRecord();

      return () => {
        cancelled =
          true;
      };
    },
    [],
  );

  return (
    <main
      data-finora-control-center-shell="true"
      style={{
        height:
          "100%",
        minHeight:
          "100%",
        overflowY:
          "auto",
        overflowX:
          "hidden",
        boxSizing:
          "border-box",
        padding:
          "8px",
        fontFamily:
          "Inter, ui-sans-serif, system-ui, sans-serif",
        background:
          "#0f172a",
        color:
          "#e2e8f0",
      }}
    >
      <section
        style={{
          width:
            "100%",
          maxWidth:
            "none",
          margin:
            0,
          display:
            "flex",
          flexDirection:
            "column",
          gap:
            "8px",
          boxSizing:
            "border-box",
        }}
      >
        <header
          style={{
            position:
              "relative",
            paddingRight:
              "180px",
            marginBottom:
              0,
          }}
        >
          <div
            style={{
              fontSize:
                "12px",
              fontWeight:
                700,
              letterSpacing:
                "0.14em",
              textTransform:
                "uppercase",
              opacity:
                0.72,
              marginBottom:
                "8px",
            }}
          >
            Privileged Administration
          </div>

          <h1
            style={{
              margin:
                0,
              fontSize:
                "30px",
              lineHeight:
                1.2,
              fontWeight:
                700,
            }}
          >
            FINORA Control Center
          </h1>

          <p
            style={{
              margin:
                "10px 0 0",
              maxWidth:
                "680px",
              lineHeight:
                1.6,
              opacity:
                0.78,
            }}
          >
            Dedicated administrative renderer for signed FINORA control operations.
          </p>

          <button
            type="button"
            onClick={() => {
              setActiveView(
                (current) =>
                  current ===
                  "BRANCHES"
                    ? "CONTROL"
                    : "BRANCHES",
              );
            }}
            style={{
              position:
                "absolute",
              top:
                0,
              right:
                0,
              minHeight:
                "40px",
              padding:
                "8px 16px",
              border:
                "1px solid rgba(96, 165, 250, 0.48)",
              borderRadius:
                "10px",
              background:
                activeView ===
                "BRANCHES"
                  ? "rgba(37, 99, 235, 0.28)"
                  : "rgba(30, 64, 175, 0.18)",
              color:
                "#dbeafe",
              fontFamily:
                "Inter, ui-sans-serif, system-ui, sans-serif",
              fontSize:
                "13px",
              fontWeight:
                700,
              cursor:
                "pointer",
            }}
          >
            {activeView ===
            "BRANCHES"
              ? "Control Center"
              : "FINORA Branches"}
          </button>
        </header>

        <section
          hidden={activeView === "BRANCHES"}
          aria-live="polite"
          style={{
            border:
              "1px solid rgba(148, 163, 184, 0.22)",
            borderRadius:
              "14px",
            padding:
              "22px",
            background:
              "rgba(15, 23, 42, 0.72)",
          }}
        >
          <h2
            style={{
              margin:
                "0 0 16px",
              fontSize:
                "18px",
              fontWeight:
                650,
            }}
          >
            Signing Trust Identity
          </h2>

          {loadState ===
            "LOADING" && (
            <p
              style={{
                margin:
                  0,
                opacity:
                  0.76,
              }}
            >
              Loading Control Center trust identity…
            </p>
          )}

          {(
            loadState ===
              "UNAVAILABLE" ||
            loadState ===
              "ERROR"
          ) && (
            <div>
              <strong>
                Control Center unavailable
              </strong>

              <p
                style={{
                  margin:
                    "8px 0 0",
                  opacity:
                    0.78,
                }}
              >
                {errorMessage}
              </p>
            </div>
          )}

          {(
            loadState ===
              "READY" &&
            trustRecord
          ) && (
            <dl
              style={{
                display:
                  "grid",
                gridTemplateColumns:
                  "180px minmax(0, 1fr)",
                gap:
                  "12px 18px",
                margin:
                  0,
              }}
            >
              <dt>
                Status
              </dt>
              <dd
                style={{
                  margin:
                    0,
                  fontWeight:
                    650,
                }}
              >
                {trustRecord.status}
              </dd>

              <dt>
                Issuer ID
              </dt>
              <dd
                style={{
                  margin:
                    0,
                  overflowWrap:
                    "anywhere",
                }}
              >
                {trustRecord.issuerId}
              </dd>

              <dt>
                Signing Key ID
              </dt>
              <dd
                style={{
                  margin:
                    0,
                  overflowWrap:
                    "anywhere",
                }}
              >
                {trustRecord.signingKeyId}
              </dd>

              <dt>
                Algorithm
              </dt>
              <dd
                style={{
                  margin:
                    0,
                }}
              >
                {trustRecord.algorithm}
              </dd>

              <dt>
                Public Key Format
              </dt>
              <dd
                style={{
                  margin:
                    0,
                }}
              >
                {trustRecord.format}
              </dd>

                <dt>
                  Control Center Signing Key SHA-256 Fingerprint
                </dt>
                <dd
                  style={{
                    margin:
                      0,
                    overflowWrap:
                      "anywhere",
                    fontFamily:
                      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                  }}
                >
                  {trustRecord.publicKeyFingerprint}
                </dd>

                <dt>
                  Fingerprint Algorithm
                </dt>
                <dd
                  style={{
                    margin:
                      0,
                  }}
                >
                  {trustRecord.fingerprintAlgorithm}
                </dd>

              <dt>
                Created At
              </dt>
              <dd
                style={{
                  margin:
                    0,
                }}
              >
                {trustRecord.createdAt}
              </dd>
            </dl>
          )}
        </section>

        {(
          loadState ===
            "READY" &&
          trustRecord
        ) && (
          <>
            {activeView === "BRANCHES" && (
            <FinoraControlCenterBranchRegistryPanel
              key={activeView}
              directoryMode
              selectedBranchId={
                selectedIssuanceBranch?.identity.branchId
              }
              selectedWorkflow={
                issuanceWorkflow
              }
              onLaunchBranchWorkflow={(
                record,
                workflow,
              ) => {
                setSelectedIssuanceBranch(
                  record,
                );

                setIssuanceWorkflow(
                  workflow,
                );

                setWorkspaceFocusRequestId(
                  (current) =>
                    current + 1,
                );

                setActiveView(
                  "CONTROL",
                );
              }}
            />
            )}

            {activeView === "CONTROL" && (
            <FinoraControlCenterIssuanceWorkspace
              selectedBranch={
                selectedIssuanceBranch
              }
              workflow={
                issuanceWorkflow
              }
              workspaceFocusRequestId={
                workspaceFocusRequestId
              }
              onWorkflowChange={
                setIssuanceWorkflow
              }
              onClearSelectedBranch={() => {
                setSelectedIssuanceBranch(
                  undefined,
                );
              }}
            />
            )}
          </>
        )}
      </section>
    </main>
  );
}