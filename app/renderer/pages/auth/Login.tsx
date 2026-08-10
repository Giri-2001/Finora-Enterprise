// ============================================================
// FINORA ENTERPRISE OS™
//
// ENTERPRISE LOGIN
//
// MODULE  : Authentication
// LAYER   : Renderer / Login
// VERSION : 2.8
// STATUS  : Production Foundation
//
// RESPONSIBILITY:
//
// - Detect FINORA USB storage
// - Provide two-step USB login experience
// - Require User ID + Password before authentication
// - Preserve existing authStore authentication
// - Monitor USB connection state
//
// SECURITY:
//
// - USB presence alone NEVER authenticates a user.
// - USB detection only enables the USB login path.
// - Username + Password remain mandatory.
// - Existing login security remains inside authStore.
// - No direct filesystem access.
// - No direct Electron IPC access.
//
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import {
  useEffect,
  useState,
} from "react";

import type {
  CSSProperties,
} from "react";

import {
  login,
} from "../../store/authStore";

// ============================================================
// TYPES
// ============================================================

type LoginProps = {
  onLogin: () => void;
};

type UsbStatus = {
  availability?: string;
  storageId?: string;
  message?: string;
};

type UsbBridge = {
  isAvailable?: () => Promise<boolean>;

  getStatus?: () => Promise<UsbStatus>;
};

type FinoraWindow = {
  finora?: {
    usb?: UsbBridge;
  };
};

// ============================================================
// CONSTANTS
// ============================================================

const USB_STATUS_POLL_INTERVAL_MS = 2000;

// ============================================================
// USB BRIDGE
// ============================================================

function getUsbBridge(): UsbBridge | undefined {

  const runtimeWindow =
    window as unknown as FinoraWindow;

  return runtimeWindow.finora?.usb;
}

// ============================================================
// COMPONENT
// ============================================================

export default function Login({
  onLogin,
}: LoginProps) {

  // ==========================================================
  // ACCOUNT STATE
  // ==========================================================

  const [
    username,
    setUsername,
  ] = useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");

  // ==========================================================
  // USB STATE
  // ==========================================================

  const [
    usbChecking,
    setUsbChecking,
  ] = useState(true);

  const [
    usbAvailable,
    setUsbAvailable,
  ] = useState(false);

  const [
    usbMessage,
    setUsbMessage,
  ] = useState(
    "Checking FINORA USB...",
  );

  // ==========================================================
  // USB LOGIN STEP
  //
  // false:
  // USB detected screen
  //
  // true:
  // User ID + Password screen
  // ==========================================================

  const [
    showUsbCredentials,
    setShowUsbCredentials,
  ] = useState(false);

  // ==========================================================
  // USB STATUS MONITOR
  // ==========================================================

  useEffect(() => {

    let active = true;

    let requestRunning = false;

    async function checkUsb(
      initialCheck: boolean,
    ): Promise<void> {

      if (requestRunning) {
        return;
      }

      requestRunning = true;

      try {

        const bridge =
          getUsbBridge();

        // ----------------------------------------------------
        // BRIDGE UNAVAILABLE
        // ----------------------------------------------------

        if (!bridge) {

          if (active) {

            setUsbAvailable(false);

            setUsbMessage(
              "FINORA USB bridge is unavailable.",
            );

            if (initialCheck) {

              setUsbChecking(false);

            }

          }

          return;
        }

        // ----------------------------------------------------
        // PREFERRED STATUS API
        // ----------------------------------------------------

        if (bridge.getStatus) {

          const status =
            await bridge.getStatus();

          if (!active) {
            return;
          }

          const available =
            status.availability === "READY";

          setUsbAvailable(
            available,
          );

          setUsbMessage(
            available
              ? (
                status.message ??
                "FINORA USB detected."
              )
              : (
                status.message ??
                "FINORA USB is not connected."
              ),
          );

          if (initialCheck) {

            setUsbChecking(false);

          }

          return;
        }

        // ----------------------------------------------------
        // FALLBACK AVAILABILITY API
        // ----------------------------------------------------

        if (bridge.isAvailable) {

          const available =
            await bridge.isAvailable();

          if (!active) {
            return;
          }

          setUsbAvailable(
            available,
          );

          setUsbMessage(
            available
              ? "FINORA USB detected."
              : "FINORA USB is not connected.",
          );

          if (initialCheck) {

            setUsbChecking(false);

          }

          return;
        }

        // ----------------------------------------------------
        // NO USB API
        // ----------------------------------------------------

        if (active) {

          setUsbAvailable(false);

          setUsbMessage(
            "FINORA USB status is unavailable.",
          );

          if (initialCheck) {

            setUsbChecking(false);

          }

        }

      } catch (usbError) {

        if (active) {

          console.error(
            "FINORA USB LOGIN STATUS ERROR:",
            usbError,
          );

          setUsbAvailable(false);

          setUsbMessage(
            "Unable to determine FINORA USB status.",
          );

          if (initialCheck) {

            setUsbChecking(false);

          }

        }

      } finally {

        requestRunning = false;

      }

    }

    // ========================================================
    // INITIAL CHECK
    // ========================================================

    void checkUsb(true);

    // ========================================================
    // BACKGROUND USB MONITOR
    //
    // IMPORTANT:
    //
    // This does NOT set usbChecking back to true.
    // ========================================================

    const intervalId =
      window.setInterval(
        () => {

          void checkUsb(false);

        },
        USB_STATUS_POLL_INTERVAL_MS,
      );

    // ========================================================
    // CLEANUP
    // ========================================================

    return () => {

      active = false;

      window.clearInterval(
        intervalId,
      );

    };

  }, []);

  // ==========================================================
  // USB DISCONNECT SAFETY
  //
  // If USB disappears while the USB credential screen is
  // open, return to the normal login state.
  // ==========================================================

  useEffect(() => {

    if (
      !usbAvailable
    ) {

      setShowUsbCredentials(
        false,
      );

    }

  }, [
    usbAvailable,
  ]);

  // ==========================================================
  // ACCOUNT LOGIN
  // ==========================================================

  function handleLogin(): void {

    setError("");

    const trimmedUsername =
      username.trim();

    if (!trimmedUsername) {

      setError(
        "Enter your User ID.",
      );

      return;
    }

    if (!password) {

      setError(
        "Enter your password.",
      );

      return;
    }

    const session =
      login({
        username:
          trimmedUsername,

        password,
      });

    if (!session) {

      setError(
        "Invalid username or password",
      );

      return;
    }

    setError("");

    onLogin();
  }

  // ==========================================================
  // CONTINUE WITH USB
  // ==========================================================

  function handleContinueWithUsb(): void {

    setError("");

    if (!usbAvailable) {

      setError(
        "FINORA USB is not connected.",
      );

      return;
    }

    setUsername("");

    setPassword("");

    setShowUsbCredentials(
      true,
    );
  }

  // ==========================================================
  // BACK FROM USB CREDENTIALS
  // ==========================================================

  function handleBackFromUsbLogin(): void {

    setError("");

    setUsername("");

    setPassword("");

    setShowUsbCredentials(
      false,
    );
  }

  // ==========================================================
  // USB LOGIN SUBMIT
  //
  // IMPORTANT:
  //
  // This deliberately uses the same secure authStore login.
  //
  // USB does not bypass password authentication.
  // ==========================================================

  function handleUsbLogin(): void {

    if (!usbAvailable) {

      setError(
        "FINORA USB has been disconnected.",
      );

      setShowUsbCredentials(
        false,
      );

      return;
    }

    handleLogin();
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <div
      style={{
        width: "100vw",
        height: "100vh",

        display: "flex",
        alignItems: "center",
        justifyContent: "center",

        background:
          "#0f172a",

        color:
          "#ffffff",

        fontFamily:
          "Segoe UI, sans-serif",

        boxSizing:
          "border-box",
      }}
    >

      {/* ====================================================
          LOGIN CARD
          ==================================================== */}

      <div
        style={{
          width: 390,

          maxWidth:
            "calc(100vw - 32px)",

          padding: 30,

          background:
            "#111827",

          borderRadius: 16,

          border:
            "1px solid #334155",

          boxShadow:
            "0 20px 60px rgba(0,0,0,.35)",

          boxSizing:
            "border-box",
        }}
      >

        {/* ==================================================
            HEADER
            ================================================== */}

        <h1
          style={{
            margin: 0,

            textAlign: "center",

            letterSpacing: 1,
          }}
        >
          FINORA
        </h1>

        <p
          style={{
            textAlign: "center",

            opacity: 0.7,

            marginTop: 8,

            marginBottom: 24,
          }}
        >
          Enterprise Login
        </p>

        {/* ==================================================
            USB STATUS
            ================================================== */}

        <div
          style={{
            marginBottom: 20,

            padding: 14,

            borderRadius: 12,

            border:
              usbAvailable
                ? "1px solid rgba(34,197,94,.45)"
                : "1px solid #334155",

            background:
              usbAvailable
                ? "rgba(22,101,52,.18)"
                : "#0f172a",
          }}
        >

          <div
            style={{
              display: "flex",

              alignItems: "center",

              gap: 10,

              fontWeight: 700,

              fontSize: 13,
            }}
          >

            <span
              style={{
                width: 9,

                height: 9,

                borderRadius: "50%",

                background:
                  usbChecking
                    ? "#f59e0b"
                    : usbAvailable
                      ? "#22c55e"
                      : "#64748b",

                flexShrink: 0,
              }}
            />

            <span>

              {usbChecking
                ? "Checking FINORA USB"
                : usbAvailable
                  ? "FINORA USB Detected"
                  : "FINORA USB Not Detected"}

            </span>

          </div>

          <div
            style={{
              marginTop: 7,

              fontSize: 12,

              color: "#94a3b8",

              lineHeight: 1.5,
            }}
          >
            {usbMessage}
          </div>

        </div>

        {/* ==================================================
            USB DETECTED → CONTINUE
            ================================================== */}

        {usbAvailable &&
          !showUsbCredentials && (

          <button
            type="button"

            onClick={
              handleContinueWithUsb
            }

            disabled={
              usbChecking
            }

            style={{
              width: "100%",

              padding: "12px",

              borderRadius: 9,

              border:
                "1px solid #475569",

              background:
                "#1e293b",

              color:
                "#ffffff",

              cursor:
                "pointer",

              fontWeight: 700,

              marginBottom: 18,
            }}
          >
            Continue with FINORA USB
          </button>

        )}

        {/* ==================================================
            USB CREDENTIAL SCREEN
            ================================================== */}

        {usbAvailable &&
          showUsbCredentials && (

          <>

            <div
              style={{
                marginBottom: 16,

                fontSize: 13,

                color: "#cbd5e1",

                fontWeight: 600,
              }}
            >
              FINORA USB Owner Authentication
            </div>

            <input
              value={
                username
              }

              onChange={(
                event,
              ) => {

                setUsername(
                  event.target.value,
                );

                setError("");

              }}

              placeholder="User ID"

              autoComplete="username"

              autoFocus

              style={
                inputStyle
              }
            />

            <input
              value={
                password
              }

              onChange={(
                event,
              ) => {

                setPassword(
                  event.target.value,
                );

                setError("");

              }}

              placeholder="Password"

              type="password"

              autoComplete="current-password"

              onKeyDown={(
                event,
              ) => {

                if (
                  event.key ===
                  "Enter"
                ) {

                  handleUsbLogin();

                }

              }}

              style={
                inputStyle
              }
            />

            {error && (

              <p
                role="alert"

                style={{
                  color:
                    "#f87171",

                  fontSize: 13,

                  lineHeight: 1.5,

                  marginTop: 12,

                  marginBottom: 0,
                }}
              >
                {error}
              </p>

            )}

            <button
              type="button"

              onClick={
                handleUsbLogin
              }

              style={{
                width: "100%",

                padding: "12px",

                marginTop: 16,

                borderRadius: 9,

                border: "none",

                background:
                  "#2563eb",

                color:
                  "#ffffff",

                cursor:
                  "pointer",

                fontWeight: 700,
              }}
            >
              Login
            </button>

            <button
              type="button"

              onClick={
                handleBackFromUsbLogin
              }

              style={{
                width: "100%",

                padding: "10px",

                marginTop: 10,

                borderRadius: 9,

                border:
                  "1px solid #334155",

                background:
                  "transparent",

                color:
                  "#94a3b8",

                cursor:
                  "pointer",

                fontWeight: 600,
              }}
            >
              ← Back
            </button>

          </>

        )}

        {/* ==================================================
            NORMAL ACCOUNT LOGIN
            ================================================== */}

        {!usbAvailable && !usbChecking && (

          <>

            <div
              style={{
                display: "flex",

                alignItems: "center",

                gap: 10,

                marginBottom: 18,

                color: "#64748b",

                fontSize: 11,

                fontWeight: 700,
              }}
            >

              <div
                style={{
                  flex: 1,

                  height: 1,

                  background:
                    "#334155",
                }}
              />

              <span>
                ACCOUNT LOGIN
              </span>

              <div
                style={{
                  flex: 1,

                  height: 1,

                  background:
                    "#334155",
                }}
              />

            </div>

            <input
              value={
                username
              }

              onChange={(
                event,
              ) => {

                setUsername(
                  event.target.value,
                );

                setError("");

              }}

              placeholder="User ID"

              autoComplete="username"

              style={
                inputStyle
              }
            />

            <input
              value={
                password
              }

              onChange={(
                event,
              ) => {

                setPassword(
                  event.target.value,
                );

                setError("");

              }}

              placeholder="Password"

              type="password"

              autoComplete="current-password"

              onKeyDown={(
                event,
              ) => {

                if (
                  event.key ===
                  "Enter"
                ) {

                  handleLogin();

                }

              }}

              style={
                inputStyle
              }
            />

            {error && (

              <p
                role="alert"

                style={{
                  color:
                    "#f87171",

                  fontSize: 13,

                  lineHeight: 1.5,

                  marginTop: 12,

                  marginBottom: 0,
                }}
              >
                {error}
              </p>

            )}

            <button
              type="button"

              onClick={
                handleLogin
              }

              style={{
                width: "100%",

                padding: "12px",

                marginTop: 16,

                borderRadius: 9,

                border: "none",

                background:
                  "#2563eb",

                color:
                  "#ffffff",

                cursor:
                  "pointer",

                fontWeight: 700,
              }}
            >
              Login
            </button>

          </>

        )}

        {/* ==================================================
            INITIAL CHECK STATE
            ================================================== */}

        {usbChecking && (

          <div
            style={{
              fontSize: 12,

              color: "#64748b",

              textAlign: "center",

              paddingTop: 4,
            }}
          >
            FINORA login services are starting...
          </div>

        )}

        {/* ==================================================
            DEFAULT DEVELOPMENT ACCOUNT
            ================================================== */}

        {!usbAvailable &&
          !usbChecking && (

          <p
            style={{
              marginTop: 20,

              marginBottom: 0,

              fontSize: 12,

              opacity: 0.6,

              lineHeight: 1.5,
            }}
          >
            Default:
            <br />
            admin / admin123
          </p>

        )}

      </div>

    </div>

  );
}

// ============================================================
// INPUT STYLE
// ============================================================

const inputStyle:
  CSSProperties = {

  width: "100%",

  padding: "11px",

  marginTop: 12,

  borderRadius: 8,

  border:
    "1px solid #334155",

  background:
    "#1e293b",

  color:
    "#ffffff",

  boxSizing:
    "border-box",

  outline:
    "none",
};

// ============================================================
// END
// ============================================================
