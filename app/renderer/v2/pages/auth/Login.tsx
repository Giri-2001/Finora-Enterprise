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
// - Use the existing FINORA Responsive Engine
//
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import {
  useEffect,
  useState,
} from "react";

import { login } from "../../store/authStore";
import { storageManager } from "../../storage/storageManager";
import { StorageMode } from "../../storage/storage.types";
import { clearCustomerCache } from "../../store/customers/customer.store";

import useResponsive from "../../utils/responsive/useResponsive";

import {
  getLoginStyles,
  getUsbStatusStyle,
  getUsbStatusIndicatorStyle,
} from "./Login.styles";

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
// STORAGE MODE ACTIVATION
// ============================================================

async function activateStorageMode(
  mode: StorageMode,
): Promise<boolean> {
  try {
    const result =
      await storageManager.selectStorageMode(mode);

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
  // RESPONSIVE ENGINE
  // ==========================================================

  const responsive = useResponsive();

  const loginStyles =
    getLoginStyles(responsive);

  // ==========================================================
  // ACCOUNT STATE
  // ==========================================================

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // ==========================================================
  // LOGIN MODE
  // ==========================================================

  const [loginMode, setLoginMode] =
    useState<LoginMode>("chooser");

  // ==========================================================
  // LOGIN BUSY STATE
  // ==========================================================

  const [loginBusy, setLoginBusy] = useState(false);

  // ==========================================================
  // USB STATE
  // ==========================================================

  const [usbChecking, setUsbChecking] = useState(true);
  const [usbAvailable, setUsbAvailable] = useState(false);

  const [usbMessage, setUsbMessage] =
    useState("Checking FINORA USB...");

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
        const bridge = getUsbBridge();

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

        if (bridge.getStatus) {
          const status = await bridge.getStatus();

          if (!active) {
            return;
          }

          const available =
            status.availability === "READY";

          setUsbAvailable(available);

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

        if (bridge.isAvailable) {
          const available =
            await bridge.isAvailable();

          if (!active) {
            return;
          }

          setUsbAvailable(available);

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

    void checkUsb(true);

    const intervalId =
      window.setInterval(
        () => {
          void checkUsb(false);
        },
        USB_STATUS_POLL_INTERVAL_MS,
      );

    return () => {
      active = false;

      window.clearInterval(intervalId);
    };
  }, []);

  // ==========================================================
  // USB DISCONNECT SAFETY
  // ==========================================================

  useEffect(() => {
    if (
      !usbAvailable &&
      loginMode === "usb"
    ) {
      setLoginMode("chooser");
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

    setLoginMode("usb");
  }

  // ==========================================================
  // OPEN NORMAL LOGIN
  // ==========================================================

  function handleOpenNormalLogin(): void {
    setError("");
    resetCredentials();
    setLoginMode("normal");
  }

  // ==========================================================
  // BACK TO LOGIN CHOOSER
  // ==========================================================

  function handleBackToChooser(): void {
    resetCredentials();
    setLoginMode("chooser");
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
      setError("Enter your User ID.");
      return;
    }

    if (!password) {
      setError("Enter your password.");
      return;
    }

    if (
      mode === "USB" &&
      !usbAvailable
    ) {
      setError(
        "FINORA USB is not connected.",
      );

      setLoginMode("chooser");
      return;
    }

    setLoginBusy(true);

    try {
      const session = login({
        username: trimmedUsername,
        password,
      });

      if (!session) {
        setError(
          "Invalid username or password",
        );

        return;
      }

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

      clearCustomerCache();

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
    void authenticate("USB");
  }

  // ==========================================================
  // NORMAL LOGIN SUBMIT
  // ==========================================================

  function handleNormalLogin(): void {
    void authenticate("LOCAL");
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div style={loginStyles.container}>
      {/* ====================================================
          LOGIN CARD
          ==================================================== */}

      <div style={loginStyles.card}>
        {/* ==================================================
            HEADER
            ================================================== */}

        <h1 style={loginStyles.title}>
          FINORA
        </h1>

        <p style={loginStyles.subtitle}>
          Enterprise Login
        </p>

        {/* ==================================================
            USB STATUS
            ================================================== */}

        <div
          style={getUsbStatusStyle(usbAvailable)}
        >
          <div style={loginStyles.usbStatusRow}>
            <span
              style={getUsbStatusIndicatorStyle(
                usbChecking,
                usbAvailable,
              )}
            />

            <span>
              {usbChecking
                ? "Checking FINORA USB"
                : usbAvailable
                  ? "FINORA USB Detected"
                  : "FINORA USB Not Detected"}
            </span>
          </div>

          <div style={loginStyles.usbMessage}>
            {usbMessage}
          </div>
        </div>

        {/* ==================================================
            INITIAL USB CHECK
            ================================================== */}

        {usbChecking && (
          <div style={loginStyles.startupMessage}>
            FINORA login services are starting...
          </div>
        )}

        {/* ==================================================
            LOGIN CHOOSER
            ================================================== */}

        {!usbChecking &&
          loginMode === "chooser" && (
            <>
              <button
                type="button"
                onClick={handleOpenUsbLogin}
                disabled={
                  !usbAvailable ||
                  loginBusy
                }
                style={{
                  ...loginStyles.usbLoginButton,
                  ...(usbAvailable
                    ? loginStyles.enabledButton
                    : loginStyles.disabledButton),
                }}
              >
                🔐 Continue with FINORA USB
              </button>

              <div
                style={loginStyles.helperTextWithMargin}
              >
                USB required • Owner authentication
              </div>

              <button
                type="button"
                onClick={handleOpenNormalLogin}
                disabled={loginBusy}
                style={loginStyles.normalLoginButton}
              >
                👤 Continue with Normal Login
              </button>

              <div style={loginStyles.helperText}>
                USB not required • Local storage
              </div>

              {error && (
                <p
                  role="alert"
                  style={loginStyles.chooserError}
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
              <div style={loginStyles.loginModePanelUsb}>
                FINORA USB Owner Login

                <div style={loginStyles.loginModePanelSubtext}>
                  Storage Mode: USB • FINORA Pendrive
                </div>
              </div>

              <input
                value={username}
                onChange={(event) => {
                  setUsername(event.target.value);
                  setError("");
                }}
                placeholder="USB Owner ID"
                autoComplete="username"
                autoFocus
                disabled={loginBusy}
                style={loginStyles.input}
              />

              <input
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setError("");
                }}
                placeholder="USB Owner Password"
                type="password"
                autoComplete="current-password"
                disabled={loginBusy}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    handleUsbLogin();
                  }
                }}
                style={loginStyles.input}
              />

              {error && (
                <p
                  role="alert"
                  style={loginStyles.error}
                >
                  {error}
                </p>
              )}

              <button
                type="button"
                onClick={handleUsbLogin}
                disabled={loginBusy}
                style={loginStyles.primaryButton}
              >
                {loginBusy
                  ? "Authenticating..."
                  : "Login to FINORA USB"}
              </button>

              <button
                type="button"
                onClick={handleBackToChooser}
                disabled={loginBusy}
                style={loginStyles.secondaryButton}
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
              <div style={loginStyles.loginModePanelNormal}>
                Normal Account Login

                <div style={loginStyles.loginModePanelSubtext}>
                  Storage Mode: LOCAL • USB not required
                </div>
              </div>

              <input
                value={username}
                onChange={(event) => {
                  setUsername(event.target.value);
                  setError("");
                }}
                placeholder="User ID"
                autoComplete="username"
                autoFocus
                disabled={loginBusy}
                style={loginStyles.input}
              />

              <input
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setError("");
                }}
                placeholder="Password"
                type="password"
                autoComplete="current-password"
                disabled={loginBusy}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    handleNormalLogin();
                  }
                }}
                style={loginStyles.input}
              />

              {error && (
                <p
                  role="alert"
                  style={loginStyles.error}
                >
                  {error}
                </p>
              )}

              <button
                type="button"
                onClick={handleNormalLogin}
                disabled={loginBusy}
                style={loginStyles.primaryButton}
              >
                {loginBusy
                  ? "Authenticating..."
                  : "Login"}
              </button>

              <button
                type="button"
                onClick={handleBackToChooser}
                disabled={loginBusy}
                style={loginStyles.secondaryButton}
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
            <p style={loginStyles.developmentAccount}>
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
// END
// ============================================================