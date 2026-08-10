// ============================================================
// FINORA ENTERPRISE OS™
//
// ENTERPRISE LOGIN
//
// MODULE  : Authentication
// LAYER   : Renderer / Login
// VERSION : 3.0
// STATUS  : Production
//
// RESPONSIBILITY:
//
// - Provide two completely separate login paths
// - USB Login requires a detected FINORA Pendrive
// - Normal Login does not require a USB
// - Select the correct V2 storage mode before opening the app
// - Require User ID + Password in both paths
// - Preserve existing authStore authentication
// - Monitor USB connection state
//
// SECURITY:
//
// - USB presence alone NEVER authenticates a user.
// - USB Login requires USB + User ID + Password.
// - Normal Login does not require USB.
// - USB Login selects StorageMode.USB.
// - Normal Login selects StorageMode.LOCAL.
// - USB data is not intentionally exposed through Normal Login.
// - Normal/local data is not intentionally exposed through USB Login.
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

import {
  storageManager,
} from "../../v2/storage/storageManager";

import {
  StorageMode,
} from "../../v2/storage/storage.types";

import {
  clearCustomerCache,
} from "../../v2/store/customers/customer.store";

// ============================================================
// TYPES
// ============================================================

type LoginProps = {
  onLogin: () => void;
};

type LoginMode =
  | "chooser"
  | "usb"
  | "normal";

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

const USB_STATUS_POLL_INTERVAL_MS =
  2000;

// ============================================================
// USB BRIDGE
// ============================================================

function getUsbBridge():
  UsbBridge | undefined {

  const runtimeWindow =
    window as unknown as FinoraWindow;

  return runtimeWindow.finora?.usb;
}

// ============================================================
// STORAGE MODE ACTIVATION
// ============================================================

async function activateStorageMode(
  mode: StorageMode,
):
  Promise<boolean> {

  try {

    const result =
      await storageManager.selectStorageMode(
        mode,
      );

    if (!result.success) {

      console.error(
        "FINORA STORAGE MODE ACTIVATION FAILED:",
        result.error,
      );

      return false;
    }

    return true;

  } catch (storageError) {

    console.error(
      "FINORA STORAGE MODE ACTIVATION ERROR:",
      storageError,
    );

    return false;
  }
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
  // LOGIN MODE
  // ==========================================================

  const [
    loginMode,
    setLoginMode,
  ] = useState<LoginMode>(
    "chooser",
  );

  // ==========================================================
  // LOGIN BUSY STATE
  // ==========================================================

  const [
    loginBusy,
    setLoginBusy,
  ] = useState(false);

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
    // This does not restart the visible checking state.
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
  // If USB disappears while the USB login form is open,
  // immediately return to the login chooser.
  // ==========================================================

  useEffect(() => {

    if (
      !usbAvailable &&
      loginMode === "usb"
    ) {

      setLoginMode(
        "chooser",
      );

      setUsername("");

      setPassword("");

      setError("");

    }

  }, [
    usbAvailable,
    loginMode,
  ]);

  // ==========================================================
  // RESET LOGIN FORM
  // ==========================================================

  function resetCredentials(): void {

    setUsername("");

    setPassword("");

    setError("");

    setLoginBusy(false);

  }

  // ==========================================================
  // OPEN USB LOGIN
  // ==========================================================

  function handleOpenUsbLogin(): void {

    setError("");

    if (!usbAvailable) {

      setError(
        "FINORA USB is not connected.",
      );

      return;
    }

    resetCredentials();

    setLoginMode(
      "usb",
    );

  }

  // ==========================================================
  // OPEN NORMAL LOGIN
  // ==========================================================

  function handleOpenNormalLogin(): void {

    setError("");

    resetCredentials();

    setLoginMode(
      "normal",
    );

  }

  // ==========================================================
  // BACK TO LOGIN CHOOSER
  // ==========================================================

  function handleBackToChooser(): void {

    resetCredentials();

    setLoginMode(
      "chooser",
    );

  }

  // ==========================================================
  // COMMON AUTHENTICATION
  // ==========================================================

  async function authenticate(
    mode: "USB" | "LOCAL",
  ): Promise<void> {

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

    // --------------------------------------------------------
    // USB SECURITY CHECK
    // --------------------------------------------------------

    if (
      mode === "USB" &&
      !usbAvailable
    ) {

      setError(
        "FINORA USB is not connected.",
      );

      setLoginMode(
        "chooser",
      );

      return;
    }

    setLoginBusy(true);

    try {

      // ------------------------------------------------------
      // AUTHENTICATE FIRST
      //
      // Storage mode is selected only after credentials pass.
      // ------------------------------------------------------

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

      // ------------------------------------------------------
      // SELECT PHYSICAL STORAGE MODE
      //
      // USB LOGIN  -> USB
      // NORMAL     -> LOCAL
      // ------------------------------------------------------

      const storageMode =
        mode === "USB"
          ? StorageMode.USB
          : StorageMode.LOCAL;

      const storageActivated =
        await activateStorageMode(
          storageMode,
        );

      if (!storageActivated) {

        setError(
          mode === "USB"
            ? "Unable to activate FINORA USB storage."
            : "Unable to activate local FINORA storage.",
        );

        return;
      }

      // ------------------------------------------------------
      // PERSIST AUTHENTICATED STORAGE MODE
      //
      // sessionStorage survives renderer reloads such as
      // Ctrl + R, but does not become permanent application
      // data. The authenticated login selects the authoritative
      // storage source for the current renderer session.
      //
      // USB  -> FINORA_STORAGE_MODE = "USB"
      // LOCAL -> FINORA_STORAGE_MODE = "LOCAL"
      // ------------------------------------------------------

      try {

        window.sessionStorage.setItem(
          "FINORA_STORAGE_MODE",
          storageMode,
        );

      } catch (sessionError) {

        console.error(
          "FINORA STORAGE MODE SESSION PERSISTENCE FAILED:",
          sessionError,
        );

        setError(
          "Unable to preserve FINORA storage mode for this session.",
        );

        return;
      }

      // ------------------------------------------------------
      // CLEAR PREVIOUS CUSTOMER RAM CACHE
      //
      // This does NOT delete persistent customer records.
      // It only prevents the previous login's in-memory
      // Customer data from appearing after switching between
      // LOCAL and USB sessions.
      // ------------------------------------------------------

      clearCustomerCache();

      // ------------------------------------------------------
      // COMPLETE LOGIN
      // ------------------------------------------------------

      setError("");

      onLogin();

    } finally {

      setLoginBusy(false);

    }

  }

  // ==========================================================
  // USB LOGIN SUBMIT
  // ==========================================================

  function handleUsbLogin(): void {

    void authenticate(
      "USB",
    );

  }

  // ==========================================================
  // NORMAL LOGIN SUBMIT
  // ==========================================================

  function handleNormalLogin(): void {

    void authenticate(
      "LOCAL",
    );

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
          width: 410,

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
            INITIAL USB CHECK
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
            LOGIN CHOOSER
            ================================================== */}

        {!usbChecking &&
          loginMode === "chooser" && (

          <>

            {/* ==============================================
                USB LOGIN
                ============================================== */}

            <button
              type="button"

              onClick={
                handleOpenUsbLogin
              }

              disabled={
                !usbAvailable ||
                loginBusy
              }

              style={{
                width: "100%",

                padding: "13px 14px",

                borderRadius: 10,

                border:
                  usbAvailable
                    ? "1px solid rgba(34,197,94,.55)"
                    : "1px solid #334155",

                background:
                  usbAvailable
                    ? "#14532d"
                    : "#1e293b",

                color:
                  "#ffffff",

                cursor:
                  usbAvailable
                    ? "pointer"
                    : "not-allowed",

                fontWeight: 800,

                marginBottom: 12,

                opacity:
                  usbAvailable
                    ? 1
                    : 0.65,
              }}
            >
              🔐 Continue with FINORA USB
            </button>

            <div
              style={{
                textAlign: "center",

                fontSize: 11,

                color: "#64748b",

                marginBottom: 14,
              }}
            >
              USB required • Owner authentication
            </div>

            {/* ==============================================
                NORMAL LOGIN
                ============================================== */}

            <button
              type="button"

              onClick={
                handleOpenNormalLogin
              }

              disabled={
                loginBusy
              }

              style={{
                width: "100%",

                padding: "13px 14px",

                borderRadius: 10,

                border:
                  "1px solid #475569",

                background:
                  "#1e293b",

                color:
                  "#ffffff",

                cursor:
                  "pointer",

                fontWeight: 800,

                marginBottom: 12,
              }}
            >
              👤 Continue with Normal Login
            </button>

            <div
              style={{
                textAlign: "center",

                fontSize: 11,

                color: "#64748b",
              }}
            >
              USB not required • Local storage
            </div>

            {error && (

              <p
                role="alert"

                style={{
                  color:
                    "#f87171",

                  fontSize: 13,

                  lineHeight: 1.5,

                  marginTop: 14,

                  marginBottom: 0,

                  textAlign: "center",
                }}
              >
                {error}
              </p>

            )}

          </>

        )}

        {/* ==================================================
            USB LOGIN FORM
            ================================================== */}

        {!usbChecking &&
          loginMode === "usb" && (

          <>

            <div
              style={{
                padding: 12,

                marginBottom: 14,

                borderRadius: 10,

                background:
                  "rgba(22,101,52,.18)",

                border:
                  "1px solid rgba(34,197,94,.35)",

                fontSize: 12,

                color: "#bbf7d0",

                fontWeight: 700,
              }}
            >
              FINORA USB Owner Login
              <div
                style={{
                  marginTop: 4,

                  color: "#94a3b8",

                  fontWeight: 500,
                }}
              >
                Storage Mode: USB • FINORA Pendrive
              </div>
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

              placeholder="USB Owner ID"

              autoComplete="username"

              autoFocus

              disabled={
                loginBusy
              }

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

              placeholder="USB Owner Password"

              type="password"

              autoComplete="current-password"

              disabled={
                loginBusy
              }

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

                style={
                  errorStyle
                }
              >
                {error}
              </p>

            )}

            <button
              type="button"

              onClick={
                handleUsbLogin
              }

              disabled={
                loginBusy
              }

              style={
                primaryButtonStyle
              }
            >
              {loginBusy
                ? "Authenticating..."
                : "Login to FINORA USB"}
            </button>

            <button
              type="button"

              onClick={
                handleBackToChooser
              }

              disabled={
                loginBusy
              }

              style={
                secondaryButtonStyle
              }
            >
              ← Back to Login Options
            </button>

          </>

        )}

        {/* ==================================================
            NORMAL LOGIN FORM
            ================================================== */}

        {!usbChecking &&
          loginMode === "normal" && (

          <>

            <div
              style={{
                padding: 12,

                marginBottom: 14,

                borderRadius: 10,

                background:
                  "#0f172a",

                border:
                  "1px solid #334155",

                fontSize: 12,

                color: "#cbd5e1",

                fontWeight: 700,
              }}
            >
              Normal Account Login
              <div
                style={{
                  marginTop: 4,

                  color: "#64748b",

                  fontWeight: 500,
                }}
              >
                Storage Mode: LOCAL • USB not required
              </div>
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

              disabled={
                loginBusy
              }

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

              disabled={
                loginBusy
              }

              onKeyDown={(
                event,
              ) => {

                if (
                  event.key ===
                  "Enter"
                ) {

                  handleNormalLogin();

                }

              }}

              style={
                inputStyle
              }
            />

            {error && (

              <p
                role="alert"

                style={
                  errorStyle
                }
              >
                {error}
              </p>

            )}

            <button
              type="button"

              onClick={
                handleNormalLogin
              }

              disabled={
                loginBusy
              }

              style={
                primaryButtonStyle
              }
            >
              {loginBusy
                ? "Authenticating..."
                : "Login"}
            </button>

            <button
              type="button"

              onClick={
                handleBackToChooser
              }

              disabled={
                loginBusy
              }

              style={
                secondaryButtonStyle
              }
            >
              ← Back to Login Options
            </button>

          </>

        )}

        {/* ==================================================
            DEVELOPMENT ACCOUNT
            ================================================== */}

        {!usbChecking &&
          loginMode !== "usb" && (

          <p
            style={{
              marginTop: 20,

              marginBottom: 0,

              fontSize: 12,

              opacity: 0.6,

              lineHeight: 1.5,

              textAlign: "center",
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
// SHARED INPUT STYLE
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
// SHARED ERROR STYLE
// ============================================================

const errorStyle:
  CSSProperties = {

  color:
    "#f87171",

  fontSize: 13,

  lineHeight: 1.5,

  marginTop: 12,

  marginBottom: 0,
};

// ============================================================
// PRIMARY BUTTON STYLE
// ============================================================

const primaryButtonStyle:
  CSSProperties = {

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
};

// ============================================================
// SECONDARY BUTTON STYLE
// ============================================================

const secondaryButtonStyle:
  CSSProperties = {

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
};

// ============================================================
// END
// ============================================================
