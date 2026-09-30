import {
  Capacitor,
  registerPlugin,
} from "@capacitor/core";

interface FinoraTrustExportNativeResult {
  success: boolean;
  cancelled?: boolean;
  fileName?: string;
  error?: string;
}

interface FinoraTrustExportNativeBridge {
  exportTrustRecord():
    Promise<FinoraTrustExportNativeResult>;
}

const finoraTrustExportNative =
  registerPlugin<FinoraTrustExportNativeBridge>(
    "FinoraDeveloperControlCenter",
  );
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
import FinoraPortableStateImportPanel from "./FinoraPortableStateImportPanel";
import FinoraControlCenterIssuanceWorkspace from "./FinoraControlCenterIssuanceWorkspace";
import "./FinoraControlCenterResponsive.css";

/* ===========================================================
   FINORA ENTERPRISE OSâ„¢

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

type DeveloperSecurityGateMode =
  | "CHECKING"
  | "LOCKED"
  | "UNLOCKED"
  | "SETUP_REQUIRED"
  | "ERROR";

const DEVELOPER_SECURITY_CODE_INPUT_MIN_LENGTH =
  10;

const DEVELOPER_SECURITY_CODE_INPUT_MAX_LENGTH =
  20;

const ADMIN_RECOVERY_SECURITY_CODE_INPUT_MIN_LENGTH =
  10;

const ADMIN_RECOVERY_SECURITY_CODE_INPUT_MAX_LENGTH =
  20;

export default function FinoraControlCenterShell() {
  const [
    gateMode,
    setGateMode,
  ] = useState<DeveloperSecurityGateMode>(
    "CHECKING",
  );

  const [
    securityCode,
    setSecurityCode,
  ] = useState("");

  const [
    adminRecoverySecurityCode,
    setAdminRecoverySecurityCode,
  ] = useState("");

  const [
    newDeveloperSecurityCode,
    setNewDeveloperSecurityCode,
  ] = useState("");

  const [
    showAdminRecoverySecurityCode,
    setShowAdminRecoverySecurityCode,
  ] = useState(false);

  const [
    showNewDeveloperSecurityCode,
    setShowNewDeveloperSecurityCode,
  ] = useState(false);

  const [
    securityError,
    setSecurityError,
  ] = useState<
    string | undefined
  >();

  const [
    submitting,
    setSubmitting,
  ] = useState(
    false,
  );

  const [
    retryAfterMs,
    setRetryAfterMs,
  ] = useState(
    0,
  );

  useEffect(
    () => {
      let cancelled =
        false;

      async function loadSecurityState():
        Promise<void> {

        const bridge =
          window.finoraControlCenter;

        if (!bridge) {
          if (!cancelled) {
            setSecurityError(
              "Dedicated FINORA Developer Control Center security bridge is unavailable.",
            );

            setGateMode(
              "ERROR",
            );
          }

          return;
        }

        try {
          const result =
            await bridge
              .getDeveloperSecurityState();

          if (cancelled) {
            return;
          }

          if (!result.success) {
            setSecurityError(
              result.error,
            );

            setGateMode(
              "ERROR",
            );

            return;
          }

          const securityState =
            result.data;

          if (
            securityState
              .session
              .unlocked
          ) {
            setSecurityError(
              undefined,
            );

            setGateMode(
              "UNLOCKED",
            );

            return;
          }

          if (
            securityState
              .bootstrapStatus ===
                "RECOVERY_REQUIRED" ||
            !securityState
              .authorityPresent ||
            !securityState
              .securityCodeConfigured
          ) {
            setSecurityError(
              undefined,
            );

            setGateMode(
              "SETUP_REQUIRED",
            );

            return;
          }

          setSecurityError(
            undefined,
          );

          setGateMode(
            "LOCKED",
          );
        } catch (error) {
          if (cancelled) {
            return;
          }

          setSecurityError(
            error instanceof Error
              ? error.message
              : "Unable to read FINORA Developer Control Center security state.",
          );

          setGateMode(
            "ERROR",
          );
        }
      }

      void loadSecurityState();

      return () => {
        cancelled =
          true;
      };
    },
    [],
  );

  useEffect(
    () => {
      if (
        retryAfterMs <=
        0
      ) {
        return;
      }

      const timeout =
        window.setTimeout(
          () => {
            setRetryAfterMs(
              0,
            );
          },
          retryAfterMs,
        );

      return () => {
        window.clearTimeout(
          timeout,
        );
      };
    },
    [
      retryAfterMs,
    ],
  );

  async function submitInitialDeveloperSecuritySetup():
    Promise<void> {

    if (
      gateMode !==
        "SETUP_REQUIRED" ||
      submitting
    ) {
      return;
    }

    if (
      adminRecoverySecurityCode.length <
        ADMIN_RECOVERY_SECURITY_CODE_INPUT_MIN_LENGTH ||
      adminRecoverySecurityCode.length >
        ADMIN_RECOVERY_SECURITY_CODE_INPUT_MAX_LENGTH ||
      newDeveloperSecurityCode.length <
        DEVELOPER_SECURITY_CODE_INPUT_MIN_LENGTH ||
      newDeveloperSecurityCode.length >
        DEVELOPER_SECURITY_CODE_INPUT_MAX_LENGTH
    ) {
      setSecurityError(
        "Both Security Codes must contain 12 to 128 characters.",
      );

      return;
    }

    const bridge =
      window.finoraControlCenter;

    if (!bridge) {
      setSecurityError(
        "Dedicated FINORA Developer Control Center security bridge is unavailable.",
      );

      setGateMode(
        "ERROR",
      );

      return;
    }

    setSubmitting(
      true,
    );

    setSecurityError(
      undefined,
    );

    try {
      const result =
        await bridge
          .initializeDeveloperSecurityCodeFromAdminRecovery({
            adminRecoverySecurityCode,
            newDeveloperSecurityCode,
          });

      setAdminRecoverySecurityCode(
        "",
      );

      setNewDeveloperSecurityCode(
        "",
      );

      if (!result.success) {
        setSecurityError(
          result.error,
        );

        return;
      }

      const enrollment =
        result.data;

      if (
        enrollment.success &&
        enrollment.status ===
          "CONFIGURED"
      ) {
        /*
         * First setup never grants a renderer session.
         * The newly configured code must subsequently pass
         * the normal main-process unlock authority.
         */
        setSecurityCode(
          "",
        );

        setRetryAfterMs(
          0,
        );

        setSecurityError(
          undefined,
        );

        setGateMode(
          "LOCKED",
        );

        return;
      }

      if (
        !enrollment.success &&
        enrollment.cancelled
      ) {
        setSecurityError(
          "Admin Authority Recovery file selection was cancelled.",
        );

        return;
      }

      if (
        !enrollment.success &&
        !enrollment.cancelled
      ) {
        setSecurityError(
          enrollment.error,
        );

        return;
      }

      setSecurityError(
        "FINORA Developer Security Code setup did not complete.",
      );
    } catch (error) {
      setAdminRecoverySecurityCode(
        "",
      );

      setNewDeveloperSecurityCode(
        "",
      );

      setSecurityError(
        error instanceof Error
          ? error.message
          : "Unable to configure FINORA Developer Security Code.",
      );
    } finally {
      setSubmitting(
        false,
      );
    }
  }

  async function submitSecurityCode():
    Promise<void> {

    if (
      gateMode !==
        "LOCKED" ||
      submitting ||
      retryAfterMs >
        0
    ) {
      return;
    }

    if (
      securityCode.length ===
        0 ||
      securityCode.length >
        DEVELOPER_SECURITY_CODE_INPUT_MAX_LENGTH
    ) {
      setSecurityError(
        "Enter a valid FINORA Developer Security Code.",
      );

      return;
    }

    const bridge =
      window.finoraControlCenter;

    if (!bridge) {
      setSecurityError(
        "Dedicated FINORA Developer Control Center security bridge is unavailable.",
      );

      setGateMode(
        "ERROR",
      );

      return;
    }

    setSubmitting(
      true,
    );

    setSecurityError(
      undefined,
    );

    try {
      const result =
        await bridge
          .unlockDeveloperControlCenter(
            securityCode,
          );

      if (!result.success) {
        setSecurityError(
          result.error,
        );

        return;
      }

      const unlockResult =
        result.data;

      if (
        unlockResult.success &&
        unlockResult.status ===
          "UNLOCKED" &&
        unlockResult
          .state
          .unlocked
      ) {
        setSecurityCode(
          "",
        );

        setRetryAfterMs(
          0,
        );

        setSecurityError(
          undefined,
        );

        setGateMode(
          "UNLOCKED",
        );

        return;
      }

      if (
        unlockResult.success
      ) {
        setSecurityError(
          "FINORA Developer Control Center did not enter an unlocked session.",
        );

        return;
      }

      setRetryAfterMs(
        unlockResult.retryAfterMs,
      );

      switch (
        unlockResult.errorCode
      ) {
        case "SECURITY_CODE_NOT_CONFIGURED":
          setSecurityCode(
            "",
          );

          setSecurityError(
            undefined,
          );

          setGateMode(
            "SETUP_REQUIRED",
          );
          return;

        case "RETRY_LATER":
          setSecurityError(
            "Too many attempts. Try again after the security delay.",
          );
          return;

        case "SECURITY_CODE_INVALID":
          setSecurityError(
            "Invalid Security Code.",
          );
          return;

        default:
          setSecurityError(
            "Unable to unlock FINORA Developer Control Center.",
          );
      }
    } catch (error) {
      setSecurityError(
        error instanceof Error
          ? error.message
          : "Unable to unlock FINORA Developer Control Center.",
      );
    } finally {
      setSubmitting(
        false,
      );
    }
  }

  if (
    gateMode ===
      "UNLOCKED"
  ) {
    return (
      <FinoraControlCenterPrivilegedShell />
    );
  }

  const checking =
    gateMode ===
      "CHECKING";

  const setupRequired =
    gateMode ===
      "SETUP_REQUIRED";

  const accessUnavailable =
    gateMode ===
      "ERROR";

  const retrySeconds =
    Math.max(
      1,
      Math.ceil(
        retryAfterMs /
          1_000,
      ),
    );

  return (
    <main
      data-finora-developer-security-gate="true"
      style={{
        width:
          "100%",
        minHeight:
          "100vh",
        boxSizing:
          "border-box",
        display:
          "flex",
        alignItems:
          "center",
        justifyContent:
          "center",
        padding:
          "24px",
        fontFamily:
          "Inter, ui-sans-serif, system-ui, sans-serif",
        background:
          "#0f172a",
        color:
          "#e2e8f0",
      }}
    >
      <section
        aria-live="polite"
        style={{
          width:
            "100%",
          maxWidth:
            "440px",
          boxSizing:
            "border-box",
          padding:
            "30px",
          border:
            "1px solid rgba(148, 163, 184, 0.24)",
          borderRadius:
            "18px",
          background:
            "rgba(15, 23, 42, 0.96)",
          boxShadow:
            "0 24px 70px rgba(0, 0, 0, 0.34)",
        }}
      >
        <div
          style={{
            marginBottom:
              "10px",
            fontSize:
              "17px",
            fontWeight:
              700,
            textAlign:
              "center",
            letterSpacing:
              "0.14em",
            textTransform:
              "uppercase",
            opacity:
              0.72,
          }}
        >
          FINORA Developer
        </div>

        <h1
          style={{
            margin:
              0,
            fontSize:
              setupRequired
                ? "19px"
                : "22px",
            lineHeight:
              1.35,
            fontWeight:
              700,
            whiteSpace:
              setupRequired
                ? "nowrap"
                : "normal",
          }}
        >
          {setupRequired
            ? "Developer Security Code setup required"
            : accessUnavailable
              ? "FINORA Developer Control Center unavailable"
              : "Enter your security code to access FINORA Developer Control Center"}
        </h1>

        {setupRequired ? (
          <form
            noValidate
            onSubmit={(
              event,
            ) => {
              event.preventDefault();

              const adminRecoveryLength =
                Array.from(
                  adminRecoverySecurityCode,
                ).length;

              const developerCodeLength =
                Array.from(
                  newDeveloperSecurityCode,
                ).length;

              if (
                adminRecoveryLength <
                  ADMIN_RECOVERY_SECURITY_CODE_INPUT_MIN_LENGTH ||
                adminRecoveryLength >
                  ADMIN_RECOVERY_SECURITY_CODE_INPUT_MAX_LENGTH
              ) {
                setSecurityError(
                  `Admin Recovery Security Code must be ${ADMIN_RECOVERY_SECURITY_CODE_INPUT_MIN_LENGTH}-${ADMIN_RECOVERY_SECURITY_CODE_INPUT_MAX_LENGTH} characters.`,
                );

                return;
              }

              if (
                developerCodeLength <
                  DEVELOPER_SECURITY_CODE_INPUT_MIN_LENGTH ||
                developerCodeLength >
                  DEVELOPER_SECURITY_CODE_INPUT_MAX_LENGTH
              ) {
                setSecurityError(
                  `New Developer Security Code must be ${DEVELOPER_SECURITY_CODE_INPUT_MIN_LENGTH}-${DEVELOPER_SECURITY_CODE_INPUT_MAX_LENGTH} characters.`,
                );

                return;
              }

              setSecurityError(
                undefined,
              );

              void submitInitialDeveloperSecuritySetup();
            }}
            style={{
              marginTop:
                "22px",
            }}
          >
            <p
              style={{
                margin:
                  "0 0 18px",
                lineHeight:
                  1.6,
                opacity:
                  0.78,
              }}
            >
              Use the Admin Authority Recovery package to establish or verify Developer authority, then configure the first local Developer Security Code.
            </p>

            <label
              style={{
                display:
                  "block",
                marginBottom:
                  "8px",
                fontSize:
                  "13px",
                fontWeight:
                  650,
              }}
            >
              Admin Recovery Security Code
            </label>            <div
              style={{
                position:
                  "relative",
              }}
            >
              <input
                autoFocus
                type={
                  showAdminRecoverySecurityCode
                    ? "text"
                    : "password"
                }
              autoComplete="current-password"
              spellCheck={false}
              minLength={
                ADMIN_RECOVERY_SECURITY_CODE_INPUT_MIN_LENGTH
              }
              maxLength={
                ADMIN_RECOVERY_SECURITY_CODE_INPUT_MAX_LENGTH
              }
              value={
                adminRecoverySecurityCode
              }
              disabled={
                submitting
              }
              onChange={(
                event,
              ) => {
                setAdminRecoverySecurityCode(
                  event.target.value,
                );

                if (securityError) {
                  setSecurityError(
                    undefined,
                  );
                }
              }}
              style={{
                width:
                  "100%",
                minHeight:
                  "46px",
                boxSizing:
                  "border-box",
                padding: "10px 12px 44px 10px 12px 10px 12px",
                  paddingLeft:
                    "16px",
                border:
                  "1px solid rgba(148, 163, 184, 0.38)",
                borderRadius:
                  "10px",
                outline:
                  "none",
                background:
                  "rgba(2, 6, 23, 0.72)",
                color:
                  "#f8fafc",
                fontFamily:
                  "Inter, ui-sans-serif, system-ui, sans-serif",
                fontSize:
                  "15px",
              }}
            />
              <button
                type="button"
                aria-label={
                  showAdminRecoverySecurityCode
                    ? "Hide Admin Recovery Security Code"
                    : "Show Admin Recovery Security Code"
                }
                title={
                  showAdminRecoverySecurityCode
                    ? "Hide code"
                    : "Show code"
                }
                onClick={() => {
                  setShowAdminRecoverySecurityCode(
                    (current) =>
                      !current,
                  );
                }}
                style={{
                  position:
                    "absolute",
                  top:
                    "50%",
                  right:
                    "10px",
                  transform:
                    "translateY(-50%)",
                  width:
                    "30px",
                  height:
                    "30px",
                  padding:
                    0,
                  border:
                    "none",
                  background:
                    "transparent",
                  color:
                    "#94a3b8",
                  display:
                    "grid",
                  placeItems:
                    "center",
                  cursor:
                    "pointer",
                }}
              >
                <svg
                  aria-hidden="true"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                  <circle cx="12" cy="12" r="3" />
                  {showAdminRecoverySecurityCode && (
                    <path d="M4 4l16 16" />
                  )}
                </svg>
              </button>
            </div>

            <label
              style={{
                display:
                  "block",
                marginTop:
                  "16px",
                marginBottom:
                  "8px",
                fontSize:
                  "13px",
                fontWeight:
                  650,
              }}
            >
              New Developer Security Code
            </label>            <div
              style={{
                position:
                  "relative",
              }}
            >
              <input
                type={
                  showNewDeveloperSecurityCode
                    ? "text"
                    : "password"
                }
              autoComplete="new-password"
              spellCheck={false}
              minLength={
                DEVELOPER_SECURITY_CODE_INPUT_MIN_LENGTH
              }
              maxLength={
                DEVELOPER_SECURITY_CODE_INPUT_MAX_LENGTH
              }
              value={
                newDeveloperSecurityCode
              }
              disabled={
                submitting
              }
              onChange={(
                event,
              ) => {
                setNewDeveloperSecurityCode(
                  event.target.value,
                );

                if (securityError) {
                  setSecurityError(
                    undefined,
                  );
                }
              }}
              style={{
                width:
                  "100%",
                minHeight:
                  "46px",
                boxSizing:
                  "border-box",
                padding: "10px 12px 44px 10px 12px 10px 12px",
                  paddingLeft:
                    "16px",
                border:
                  "1px solid rgba(148, 163, 184, 0.38)",
                borderRadius:
                  "10px",
                outline:
                  "none",
                background:
                  "rgba(2, 6, 23, 0.72)",
                color:
                  "#f8fafc",
                fontFamily:
                  "Inter, ui-sans-serif, system-ui, sans-serif",
                fontSize:
                  "15px",
              }}
            />
              <button
                type="button"
                aria-label={
                  showNewDeveloperSecurityCode
                    ? "Hide New Developer Security Code"
                    : "Show New Developer Security Code"
                }
                title={
                  showNewDeveloperSecurityCode
                    ? "Hide code"
                    : "Show code"
                }
                onClick={() => {
                  setShowNewDeveloperSecurityCode(
                    (current) =>
                      !current,
                  );
                }}
                style={{
                  position:
                    "absolute",
                  top:
                    "50%",
                  right:
                    "10px",
                  transform:
                    "translateY(-50%)",
                  width:
                    "30px",
                  height:
                    "30px",
                  padding:
                    0,
                  border:
                    "none",
                  background:
                    "transparent",
                  color:
                    "#94a3b8",
                  display:
                    "grid",
                  placeItems:
                    "center",
                  cursor:
                    "pointer",
                }}
              >
                <svg
                  aria-hidden="true"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                  <circle cx="12" cy="12" r="3" />
                  {showNewDeveloperSecurityCode && (
                    <path d="M4 4l16 16" />
                  )}
                </svg>
              </button>
            </div>

            {securityError && (
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
                    "#fca5a5",
                }}
              >
                {securityError}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              style={{
                width:
                  "100%",
                minHeight:
                  "46px",
                marginTop:
                  "18px",
                border:
                  "1px solid rgba(96, 165, 250, 0.5)",
                borderRadius:
                  "10px",
                background:
                  "rgba(37, 99, 235, 0.32)",
                color:
                  "#eff6ff",
                fontFamily:
                  "Inter, ui-sans-serif, system-ui, sans-serif",
                fontSize:
                  "14px",
                fontWeight:
                  700,
                cursor:
                  submitting
                    ? "not-allowed"
                    : "pointer",
                opacity:
                  submitting
                    ? 0.62
                    : 1,
              }}
            >
              {submitting
                ? "Configuringâ€¦"
                : "Configure Developer Security Code"}
            </button>

            {securityError && (
              <p
                role="alert"
                style={{
                  margin:
                    "12px 0 0",
                  fontSize:
                    "12px",
                  lineHeight:
                    1.5,
                  color:
                    "#fca5a5",
                  fontWeight:
                    650,
                  textAlign:
                    "center",
                }}
              >
                {securityError}
              </p>
            )}
          </form>
        ) : accessUnavailable ? (
          <p
            style={{
              margin:
                "14px 0 0",
              lineHeight:
                1.6,
              opacity:
                0.78,
            }}
          >
            {securityError ??
              "The Developer security authority is unavailable."}
          </p>
        ) : (
          <form
            onSubmit={(
              event,
            ) => {
              event.preventDefault();

              void submitSecurityCode();
            }}
            style={{
              marginTop:
                "22px",
            }}
          >
            <label
              style={{
                display:
                  "block",
                marginBottom:
                  "8px",
                fontSize:
                  "13px",
                fontWeight:
                  650,
              }}
            >
              Security Code
            </label>

            <input
              autoFocus
              type="password"
              autoComplete="current-password"
              spellCheck={false}
              maxLength={
                DEVELOPER_SECURITY_CODE_INPUT_MAX_LENGTH
              }
              value={
                securityCode
              }
              disabled={
                checking ||
                submitting ||
                retryAfterMs >
                  0
              }
              onChange={(
                event,
              ) => {
                setSecurityCode(
                  event.target.value,
                );

                if (
                  securityError
                ) {
                  setSecurityError(
                    undefined,
                  );
                }
              }}
              style={{
                width:
                  "100%",
                minHeight:
                  "46px",
                boxSizing:
                  "border-box",
                padding:
                  "10px 12px",
                border:
                  "1px solid rgba(148, 163, 184, 0.38)",
                borderRadius:
                  "10px",
                outline:
                  "none",
                background:
                  "rgba(2, 6, 23, 0.72)",
                color:
                  "#f8fafc",
                fontFamily:
                  "Inter, ui-sans-serif, system-ui, sans-serif",
                fontSize:
                  "15px",
              }}
            />

            {checking && (
              <p
                style={{
                  margin:
                    "10px 0 0",
                  fontSize:
                    "13px",
                  opacity:
                    0.72,
                }}
              >
                Checking Developer security stateâ€¦
              </p>
            )}

            {(
              !checking &&
              securityError
            ) && (
              <p
                role="alert"
                style={{
                  margin:
                    "10px 0 0",
                  fontSize:
                    "13px",
                  lineHeight:
                    1.5,
                  color:
                    "#fca5a5",
                }}
              >
                {securityError}
              </p>
            )}

            {retryAfterMs > 0 && (
              <p
                style={{
                  margin:
                    "10px 0 0",
                  fontSize:
                    "13px",
                  opacity:
                    0.78,
                }}
              >
                Retry available in approximately{" "}
                {retrySeconds}{" "}
                second
                {retrySeconds === 1
                  ? ""
                  : "s"}.
              </p>
            )}

            <button
              type="submit"
              disabled={
                checking ||
                submitting ||
                retryAfterMs >
                  0 ||
                securityCode.length ===
                  0
              }
              style={{
                width:
                  "100%",
                minHeight:
                  "46px",
                marginTop:
                  "18px",
                border:
                  "1px solid rgba(96, 165, 250, 0.5)",
                borderRadius:
                  "10px",
                background:
                  "rgba(37, 99, 235, 0.32)",
                color:
                  "#eff6ff",
                fontFamily:
                  "Inter, ui-sans-serif, system-ui, sans-serif",
                fontSize:
                  "14px",
                fontWeight:
                  700,
                cursor:
                  checking ||
                  submitting ||
                  retryAfterMs >
                    0 ||
                  securityCode.length ===
                    0
                    ? "not-allowed"
                    : "pointer",
                opacity:
                  checking ||
                  submitting ||
                  retryAfterMs >
                    0 ||
                  securityCode.length ===
                    0
                    ? 0.62
                    : 1,
              }}
            >
              {checking
                ? "Checking securityâ€¦"
                : submitting
                  ? "Verifyingâ€¦"
                  : "Access Control Center"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}

function FinoraControlCenterPrivilegedShell() {
  const [
    activeView,
    setActiveView,
  ] = useState<
    "CONTROL" |
    "BRANCHES" |
    "SETTINGS"
  >(
    "CONTROL",
  );

  const [
    settingsOldSecurityCode,
    setSettingsOldSecurityCode,
  ] = useState("");

  const [
    settingsNewSecurityCode,
    setSettingsNewSecurityCode,
  ] = useState("");

  const [
    settingsSecurityCodeState,
    setSettingsSecurityCodeState,
  ] = useState<
    "IDLE" |
    "SAVING" |
    "SUCCESS" |
    "ERROR"
  >(
    "IDLE",
  );


const [

  settingsOldSecurityCodeVisible,

  setSettingsOldSecurityCodeVisible,

] = useState(false);


const [

  settingsNewSecurityCodeVisible,

  setSettingsNewSecurityCodeVisible,

] = useState(false);

  const [
    settingsSecurityCodeMessage,
    setSettingsSecurityCodeMessage,
  ] = useState<
    string | undefined
  >();

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
          data-finora-developer-header="true"
          style={{
            position:
              "relative",
            paddingRight:
              "330px",
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
                "26px",
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

          <div
            data-finora-developer-header-actions="true"
            style={{
              position:
                "absolute",
              top:
                0,
              right:
                0,
              display:
                "flex",
              alignItems:
                "center",
              gap:
                "8px",
            }}
          >
            <button
              data-finora-developer-action="settings"
              type="button"
              onClick={() => {
                setActiveView(
                  (current) =>
                    current ===
                    "SETTINGS"
                      ? "CONTROL"
                      : "SETTINGS",
                );
              }}
              style={{
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
                  "SETTINGS"
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
              "SETTINGS"
                ? "Control Center"
                : "Settings"}
            </button>

            <button
              data-finora-developer-action="branches"
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
          </div>
        </header>

        <section
          hidden={activeView !== "CONTROL"}
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
              Loading Control Center trust identityâ€¦
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
            <>
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

            {(
              Capacitor.isNativePlatform() &&
              Capacitor.getPlatform() === "android"
            ) && (
              <button
                type="button"
                onClick={() => {
                  void (async () => {
                    try {
                      const result =
                        await finoraTrustExportNative
                          .exportTrustRecord();

                      if (!result.success) {
                        window.alert(
                          result.error ??
                            "Unable to export FINORA Control Center trust record.",
                        );
                        return;
                      }

                      if (!result.cancelled) {
                        window.alert(
                          `Trust record exported: ${
                            result.fileName ??
                            "FINORA-Control-Center-Trust-Record.json"
                          }`,
                        );
                      }
                    } catch (error) {
                      window.alert(
                        error instanceof Error
                          ? error.message
                          : "Unable to export FINORA Control Center trust record.",
                      );
                    }
                  })();
                }}
                style={{
                  marginTop: "16px",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  border: "1px solid rgba(148, 163, 184, 0.35)",
                  cursor: "pointer",
                }}
              >
                Export Trust Record
              </button>
            )}
            </>
          )}
        </section>

        {activeView === "SETTINGS" && (
          <section
            data-finora-developer-settings="true"
            aria-labelledby="finora-developer-settings-title"
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
              id="finora-developer-settings-title"
              style={{
                margin:
                  "0 0 6px",
                fontSize:
                  "20px",
                fontWeight:
                  700,
              }}
            >
              Settings
            </h2>

            <p
              style={{
                margin:
                  "0 0 18px",
                opacity:
                  0.78,
                lineHeight:
                  1.5,
              }}
            >
              Change Developer Security Code
            </p>

            <form
              onSubmit={(event) => {
                event.preventDefault();

                if (
                  settingsSecurityCodeState ===
                    "SAVING"
                ) {
                  return;
                }

                const oldSecurityCode =
                  settingsOldSecurityCode;

                const newDeveloperSecurityCode =
                  settingsNewSecurityCode;

                if (
                  Array.from(
                    oldSecurityCode,
                  ).length <
                    DEVELOPER_SECURITY_CODE_INPUT_MIN_LENGTH ||
                  Array.from(
                    oldSecurityCode,
                  ).length >
                    DEVELOPER_SECURITY_CODE_INPUT_MAX_LENGTH
                ) {
                  setSettingsSecurityCodeState(
                    "ERROR",
                  );
                  setSettingsSecurityCodeMessage(
                    "Enter your current Developer Security Code.",
                  );
                  return;
                }

                if (
                  Array.from(
                    newDeveloperSecurityCode,
                  ).length <
                    DEVELOPER_SECURITY_CODE_INPUT_MIN_LENGTH ||
                  Array.from(
                    newDeveloperSecurityCode,
                  ).length >
                    DEVELOPER_SECURITY_CODE_INPUT_MAX_LENGTH
                ) {
                  setSettingsSecurityCodeState(
                    "ERROR",
                  );
                  setSettingsSecurityCodeMessage(
                    "New Developer Security Code must be 12 to 128 characters.",
                  );
                  return;
                }

                const bridge =
                  window.finoraControlCenter;

                if (!bridge) {
                  setSettingsOldSecurityCode(
                    "",
                  );
                  setSettingsNewSecurityCode(
                    "",
                  );
                  setSettingsSecurityCodeState(
                    "ERROR",
                  );
                  setSettingsSecurityCodeMessage(
                    "Dedicated FINORA Control Center preload bridge is unavailable.",
                  );
                  return;
                }

                setSettingsSecurityCodeState(
                  "SAVING",
                );
                setSettingsSecurityCodeMessage(
                  undefined,
                );

                void (async () => {
                  try {
                    const result =
                      await bridge.changeDeveloperSecurityCode({
                        oldSecurityCode,
                        newDeveloperSecurityCode,
                      });

                    setSettingsOldSecurityCode(
                      "",
                    );
                    setSettingsNewSecurityCode(
                      "",
                    );

                    if (!result.success) {
                      setSettingsSecurityCodeState(
                        "ERROR",
                      );
                      setSettingsSecurityCodeMessage(
                        result.error,
                      );
                      return;
                    }

                    if (!result.data) {
                      setSettingsSecurityCodeState(
                        "ERROR",
                      );
                      setSettingsSecurityCodeMessage(
                        "Old Developer Security Code is invalid.",
                      );
                      return;
                    }

                    setSettingsSecurityCodeState(
                      "SUCCESS",
                    );
                    setSettingsSecurityCodeMessage(
                      "Developer Security Code changed successfully.",
                    );
                  } catch (error) {
                    setSettingsOldSecurityCode(
                      "",
                    );
                    setSettingsNewSecurityCode(
                      "",
                    );
                    setSettingsSecurityCodeState(
                      "ERROR",
                    );
                    setSettingsSecurityCodeMessage(
                      error instanceof Error
                        ? error.message
                        : "Unable to change Developer Security Code.",
                    );
                  }
                })();
              }}
              style={{
                display:
                  "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(220px, 1fr))",
                gap:
                  "14px",
                alignItems:
                  "end",
              }}
            >
              <label
                style={{
                  display:
                    "grid",
                  gap:
                    "7px",
                  fontSize:
                    "13px",
                  fontWeight:
                    650,
                }}
              >
                Old Security Code
                <div                   style={{                     position:                       "relative",                     width:                       "100%",                   }}                 >
                  <input
                    type={settingsOldSecurityCodeVisible ? "text" : "password"}
                    autoComplete="current-password"
                    minLength={
                      DEVELOPER_SECURITY_CODE_INPUT_MIN_LENGTH
                    }
                    maxLength={
                      DEVELOPER_SECURITY_CODE_INPUT_MAX_LENGTH
                    }
                    value={
                      settingsOldSecurityCode
                    }
                    onChange={(event) => {
                      setSettingsOldSecurityCode(
                        event.target.value,
                      );
                      setSettingsSecurityCodeState(
                        "IDLE",
                      );
                      setSettingsSecurityCodeMessage(
                        undefined,
                      );
                    }}
                    style={{
                      minHeight:
                        "42px",
                      padding:
                        "9px 11px",
                      border:
                        "1px solid rgba(148, 163, 184, 0.34)",
                      borderRadius:
                        "9px",
                      background:
                        "rgba(15, 23, 42, 0.76)",
                      color:
                        "#f8fafc",
                      fontFamily:
                        "Inter, ui-sans-serif, system-ui, sans-serif",
                      width:                       "100%",                     boxSizing:                       "border-box",                     paddingRight:                       "44px",
                    }}
                  />
                  <button                     type="button"                     aria-label={                       settingsOldSecurityCodeVisible                         ? "Hide Old Security Code"                         : "Show Old Security Code"                     }                     title={                       settingsOldSecurityCodeVisible                         ? "Hide Old Security Code"                         : "Show Old Security Code"                     }                     aria-pressed={                       settingsOldSecurityCodeVisible                     }                     onClick={() => {                       setSettingsOldSecurityCodeVisible(                         (current) =>                           !current,                       );                     }}                     onMouseDown={(event) => {                       event.preventDefault();                     }}                     style={{                       position:                         "absolute",                       top:                         "50%",                       right:                         "6px",                       transform:                         "translateY(-50%)",                       width:                         "32px",                       height:                         "32px",                       display:                         "grid",                       placeItems:                         "center",                       padding:                         0,                       border:                         "none",                       borderRadius:                         "7px",                       background:                         "transparent",                       color:                         "rgba(226, 232, 240, 0.84)",                       cursor:                         "pointer",                     }}                   >                     <svg                       viewBox="0 0 24 24"                       width="19"                       height="19"                       fill="none"                       stroke="currentColor"                       strokeWidth="1.8"                       strokeLinecap="round"                       strokeLinejoin="round"                       aria-hidden="true"                     >                       <path                         d="M2.25 12s3.5-6 9.75-6 9.75 6 9.75 6-3.5 6-9.75 6S2.25 12 2.25 12Z"                       />                       <circle                         cx="12"                         cy="12"                         r="2.5"                       />                       {settingsOldSecurityCodeVisible && (                         <path                           d="m3 3 18 18"                         />                       )}                     </svg>                   </button>                 </div>
              </label>

              <label
                style={{
                  display:
                    "grid",
                  gap:
                    "7px",
                  fontSize:
                    "13px",
                  fontWeight:
                    650,
                }}
              >
                New Security Code
                <div                   style={{                     position:                       "relative",                     width:                       "100%",                   }}                 >
                  <input
                    type={settingsNewSecurityCodeVisible ? "text" : "password"}
                    autoComplete="new-password"
                    minLength={
                      DEVELOPER_SECURITY_CODE_INPUT_MIN_LENGTH
                    }
                    maxLength={
                      DEVELOPER_SECURITY_CODE_INPUT_MAX_LENGTH
                    }
                    value={
                      settingsNewSecurityCode
                    }
                    onChange={(event) => {
                      setSettingsNewSecurityCode(
                        event.target.value,
                      );
                      setSettingsSecurityCodeState(
                        "IDLE",
                      );
                      setSettingsSecurityCodeMessage(
                        undefined,
                      );
                    }}
                    style={{
                      minHeight:
                        "42px",
                      padding:
                        "9px 11px",
                      border:
                        "1px solid rgba(148, 163, 184, 0.34)",
                      borderRadius:
                        "9px",
                      background:
                        "rgba(15, 23, 42, 0.76)",
                      color:
                        "#f8fafc",
                      fontFamily:
                        "Inter, ui-sans-serif, system-ui, sans-serif",
                      width:                       "100%",                     boxSizing:                       "border-box",                     paddingRight:                       "44px",
                    }}
                  />
                  <button                     type="button"                     aria-label={                       settingsNewSecurityCodeVisible                         ? "Hide New Security Code"                         : "Show New Security Code"                     }                     title={                       settingsNewSecurityCodeVisible                         ? "Hide New Security Code"                         : "Show New Security Code"                     }                     aria-pressed={                       settingsNewSecurityCodeVisible                     }                     onClick={() => {                       setSettingsNewSecurityCodeVisible(                         (current) =>                           !current,                       );                     }}                     onMouseDown={(event) => {                       event.preventDefault();                     }}                     style={{                       position:                         "absolute",                       top:                         "50%",                       right:                         "6px",                       transform:                         "translateY(-50%)",                       width:                         "32px",                       height:                         "32px",                       display:                         "grid",                       placeItems:                         "center",                       padding:                         0,                       border:                         "none",                       borderRadius:                         "7px",                       background:                         "transparent",                       color:                         "rgba(226, 232, 240, 0.84)",                       cursor:                         "pointer",                     }}                   >                     <svg                       viewBox="0 0 24 24"                       width="19"                       height="19"                       fill="none"                       stroke="currentColor"                       strokeWidth="1.8"                       strokeLinecap="round"                       strokeLinejoin="round"                       aria-hidden="true"                     >                       <path                         d="M2.25 12s3.5-6 9.75-6 9.75 6 9.75 6-3.5 6-9.75 6S2.25 12 2.25 12Z"                       />                       <circle                         cx="12"                         cy="12"                         r="2.5"                       />                       {settingsNewSecurityCodeVisible && (                         <path                           d="m3 3 18 18"                         />                       )}                     </svg>                   </button>                 </div>
              </label>

              <div
                style={{
                  gridColumn:
                    "1 / -1",
                  display:
                    "flex",
                  alignItems:
                    "center",
                  gap:
                    "12px",
                  flexWrap:
                    "wrap",
                }}
              >
                <button
                  type="submit"
                  disabled={
                    settingsSecurityCodeState ===
                      "SAVING"
                  }
                  style={{
                    minHeight:
                      "40px",
                    padding:
                      "8px 18px",
                    border:
                      "1px solid rgba(96, 165, 250, 0.54)",
                    borderRadius:
                      "9px",
                    background:
                      "rgba(37, 99, 235, 0.28)",
                    color:
                      "#dbeafe",
                    fontFamily:
                      "Inter, ui-sans-serif, system-ui, sans-serif",
                    fontWeight:
                      700,
                    cursor:
                      settingsSecurityCodeState ===
                        "SAVING"
                          ? "wait"
                          : "pointer",
                    opacity:
                      settingsSecurityCodeState ===
                        "SAVING"
                          ? 0.7
                          : 1,
                  }}
                >
                  {settingsSecurityCodeState ===
                  "SAVING"
                    ? "Saving..."
                    : "Save"}
                </button>

                {settingsSecurityCodeMessage && (
                  <span
                    role={
                      settingsSecurityCodeState ===
                        "ERROR"
                          ? "alert"
                          : "status"
                    }
                    style={{
                      fontSize:
                        "13px",
                      lineHeight:
                        1.45,
                    }}
                  >
                    {settingsSecurityCodeMessage}
                  </span>
                )}
              </div>
            </form>
          </section>
        )}

        {(
          loadState ===
            "READY" &&
          trustRecord
        ) && (
          <>
            {activeView === "BRANCHES" && (
              <FinoraPortableStateImportPanel />
            )}

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

            <div
              style={{
                display:
                  activeView === "CONTROL"
                    ? "block"
                    : "none",
              }}
            >
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
            </div>
          </>
        )}
      </section>
    </main>
  );
}
