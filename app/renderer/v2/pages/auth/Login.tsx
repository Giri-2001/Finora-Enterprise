import { finoraControlShared } from "../../services/finoraControlShared";
import { getFinoraServerWalletBridge } from "../../services/wallet/finoraServerWalletBridge";
import { getFinoraAndroidServerFirstV2Recovery } from "../../services/auth/loginSessionBridge";
import { Capacitor as FinoraP1075Capacitor } from "@capacitor/core";
import {
} from "../../services/auth/credentialEnrollmentBridge";
import { getFinoraLoginSessionBridge } from "../../services/auth/loginSessionBridge";
// ============================================================
// FINORA ENTERPRISE OS
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
// - Provide one clean authenticated Owner login surface
// - Owner selects one ERP Login Date
// - Owner selects Local / USB storage
// - USB Login requires a detected FINORA Pendrive
// - Local / USB Login uses main-process secure login-session authority
// - Forgot Password entry points are prepared for Owner storage paths
// - Preserve existing storage mode activation and USB monitoring
// - Consume the FINORA Responsive Engine
// - Use the installed Lucide icon system
// - Provide five compact premium login theme selectors
// - Keep theme switching local to the Login surface for now
//
// SECURITY:
//
// - USB presence alone NEVER authenticates a user.
// - USB Owner Login requires USB + User ID + Password.
// - Local Owner Login does not require USB.
// - USB Login selects StorageMode.USB.
// - Local Login selects StorageMode.LOCAL.
//
// RESPONSIVE RULE:
//
// - No responsive dimensions live in this component.
// - No inline responsive CSS is allowed.
// - All presentation comes from Login.styles.ts.
// - Responsive values come from the central Responsive Engine.
//
// ============================================================


// ============================================================
// IMPORTS
// ============================================================

import type {
  FocusEvent as ReactFocusEvent,
  KeyboardEvent as ReactKeyboardEvent,
} from "react";

import {
  startFinoraProcessing,
  stopFinoraProcessing,
} from "../../components/common/feedback/finoraProcessing.service";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  ChevronDown,
  Eye,
  EyeOff,
  Info,
  KeyRound,
  LockKeyhole,
  UserRound,
  Usb,
  HardDrive,
} from "lucide-react";

import {
  commitLoginSession,
} from "../../store/authStore";
import {
  resetLoginAttempts,
} from "../../store/loginSecurityStore";

import {
  getCurrentLocalBusinessDate,
  resolveBusinessDate,
} from "../../services/business/businessDateService";

import { FinoraCalendar } from "../../components/common/calendar";

import {
  storageManager,
} from "../../storage/storageManager";

import {
  getFinoraUsbBridge,
} from "../../storage/usbBridge";

import {
  StorageMode,
} from "../../storage/storage.types";

import {
  clearCustomerCache,
} from "../../store/customers/customer.store";

import useResponsive from "../../utils/responsive/useResponsive";

import {
  useTheme,
} from "../../themes/provider";

import type {
  ThemeId,
} from "../../themes/core/types";
import {
  getLoginStyles,
  getUsbStatusStyle,
  getUsbStatusIndicatorStyle,
  getLoginTheme,
  LOGIN_THEME_OPTIONS,
  type LoginThemeId,
  getLoginThemeSwatchStyle,
} from "./Login.styles";

import finoraLogo
  from "../../app/assets/finoraenterprise.png?url";


// ============================================================
// TYPES
// ============================================================

type LoginProps = {

  onLogin:
    () => void;

};


type OwnerStorage =
  | "local"
  | "usb";


// ============================================================
// CONSTANTS
// ============================================================

const USB_STATUS_POLL_INTERVAL_MS =
  500;


// ============================================================
// STORAGE MODE ACTIVATION
// ============================================================

async function activateStorageMode(
  mode: StorageMode,
):
  Promise<boolean> {

  try {

    const result =
      await storageManager
        .selectStorageMode(
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

// FINORA_P1_678R_ACCOUNT_LOGIN_UI
// Account/Wallet authentication is separate from Business Login.
// The Account token is never exposed to this Renderer.
type FinoraAccountLoginResponse = {
  success: boolean;
  errorCode?: string;
  sessionType?: "ACCOUNT_WALLET_ONLY";
  businessDataAccess: false;
};

async function authenticateFinoraAccountOnly(
  username: string,
  password: string,
): Promise<FinoraAccountLoginResponse> {
  const host = window as Window & {
    finoraAccountLogin?: {
      login: (input: {
        username: string;
        password: string;
      }) => Promise<FinoraAccountLoginResponse>;
    };
  };

  if (!host.finoraAccountLogin?.login) {
    return {
      success: false,
      errorCode: "ACCOUNT_LOGIN_BRIDGE_UNAVAILABLE",
      businessDataAccess: false,
    };
  }

  const result = await host.finoraAccountLogin.login({
    username,
    password,
  });

  if (
    result.success !== true ||
    result.sessionType !== "ACCOUNT_WALLET_ONLY" ||
    result.businessDataAccess !== false
  ) {
    return {
      success: false,
      errorCode: result.errorCode ?? "ACCOUNT_LOGIN_FAILED",
      businessDataAccess: false,
    };
  }

  return {
    success: true,
    sessionType: "ACCOUNT_WALLET_ONLY",
    businessDataAccess: false,
  };
}
export default function Login({
  onLogin,
}: LoginProps) {

  const { setTheme } = useTheme();


  // ==========================================================
  // RESPONSIVE ENGINE
  // ==========================================================

  const responsive =
    useResponsive();


  // ==========================================================
  // LOGIN THEME STATE
  // ==========================================================

  const [
    loginThemeId,
    setLoginThemeId,
  ] = useState<LoginThemeId>(
    "imperial-gold",
  );


  const activeLoginTheme =
    getLoginTheme(
      loginThemeId,
    );


  const loginStyles =
    getLoginStyles(
      responsive,
      activeLoginTheme,
    );

  const loginCredentialInputStyle = {
    ...loginStyles.input,

    fontSize:
      typeof loginStyles.input.fontSize === "number"
        ? loginStyles.input.fontSize + 1
        : `calc(${loginStyles.input.fontSize} + 1px)`,

    fontWeight:
      550,
  };

  const loginPrimaryCredentialInputStyle = {
    ...loginCredentialInputStyle,

    fontSize:
      responsive.isMobile
        ? typeof loginStyles.input.fontSize === "number"
          ? loginStyles.input.fontSize + 2
          : `calc(${loginStyles.input.fontSize} + 2px)`
        : loginCredentialInputStyle.fontSize,
  };


  // ==========================================================
  // ERP BUSINESS DATE STATE
  // ==========================================================

  const [
    businessDate,
    setBusinessDate,
  ] = useState<string>(
    getCurrentLocalBusinessDate,
  );


  // ==========================================================
  // OWNER STORAGE STATE
  // ==========================================================

  const [
    ownerStorage,
    setOwnerStorage,
  ] = useState<OwnerStorage>(
    "usb",
  );


  // ==========================================================
  // DROPDOWN STATE
  // ==========================================================

  const [
    openDropdown,
    setOpenDropdown,
  ] = useState<
    "storage" | null
  >(null);

  const dropdownRef =
    useRef<HTMLDivElement>(null);


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


    // FINORA_P1_579NM_WALLET_ACTIVATION
  // Explicit one-time enrollment only; never persisted.
  const [activateWalletOnce, setActivateWalletOnce] = useState(false);
  const [walletEnrollmentCode, setWalletEnrollmentCode] = useState("");

const [
    forgotConfirmNewPassword,
    setForgotConfirmNewPassword,
  ] = useState<string>("");

  const [
    forgotNewPassword,
    setForgotNewPassword,
  ] = useState<string>("");

  const [
    forgotSecurityCode,
    setForgotSecurityCode,
  ] = useState<string>("");

  // FINORA_P1_578IR_RESET_UI
  const [
    showForgotConfirmNewPassword,
    setShowForgotConfirmNewPassword,
  ] = useState<boolean>(false);

  const [
    showForgotNewPassword,
    setShowForgotNewPassword,
  ] = useState<boolean>(false);

  const [
    showForgotSecurityCode,
    setShowForgotSecurityCode,
  ] = useState<boolean>(false);

  const [
    forgotPasswordMode,
    setForgotPasswordMode,
  ] = useState<boolean>(false);

  const [
    forgotPasswordBusy,
    setForgotPasswordBusy,
  ] = useState<boolean>(false);

  const [
    forgotPasswordError,
    setForgotPasswordError,
  ] = useState<string | undefined>();

  const [
    forgotPasswordSuccess,
    setForgotPasswordSuccess,
  ] = useState<string | undefined>();

  // One UUID per logical Forgot Password request.
  // Preserve it across uncertain retries; never persist it.
  const forgotPasswordRecoveryRequestIdRef =
    useRef<string | null>(null);

  // FINORA_P1_578MA_SECURITY_CODE_RECOVERY_UI
  const [securityCodeRecoveryMode, setSecurityCodeRecoveryMode] = useState(false);
  const [securityCodeRecoveryPassword, setSecurityCodeRecoveryPassword] = useState("");
  const [securityCodeRecoveryNewCode, setSecurityCodeRecoveryNewCode] = useState("");
  const [securityCodeRecoveryConfirmCode, setSecurityCodeRecoveryConfirmCode] = useState("");

  // FINORA_P1_578NQ_SECURITY_RECOVERY_EYE_TOGGLES
  const [
    showSecurityCodeRecoveryPassword,
    setShowSecurityCodeRecoveryPassword,
  ] = useState(false);

  const [
    showSecurityCodeRecoveryNewCode,
    setShowSecurityCodeRecoveryNewCode,
  ] = useState(false);

  const [
    showSecurityCodeRecoveryConfirmCode,
    setShowSecurityCodeRecoveryConfirmCode,
  ] = useState(false);
  const [securityCodeRecoveryBusy, setSecurityCodeRecoveryBusy] = useState(false);
  const [securityCodeRecoveryError, setSecurityCodeRecoveryError] = useState<string | undefined>();
  const [securityCodeRecoverySuccess, setSecurityCodeRecoverySuccess] = useState<string | undefined>();
  const securityCodeRecoveryRequestIdRef = useRef<string | null>(null);

  const [
    credentialMode,
    setCredentialMode,
  ] = useState<
    "LOGIN" |
    "FORCE_CREDENTIAL_CHANGE" |
    "RESTORE_BACKUP"
  >(
    "LOGIN",
  );


  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [
    securityCode,
    setSecurityCode,
  ] = useState("");

  const [
    confirmSecurityCode,
    setConfirmSecurityCode,
  ] = useState("");
  // First-login temporary credentials stay in renderer memory only.
  // Never persist or log these values.

  const firstLoginCurrentPasswordRef =
    useRef<string | null>(null);

  const firstLoginCurrentSecurityCodeRef =
    useRef<string | null>(null);
  // One UUID per logical rotation submission.
  // Retained across uncertain retries until success/reset.
  const firstLoginRotationRequestIdRef =
    useRef<string | null>(null);


  const [
    credentialEnrollmentMessage,
    setCredentialEnrollmentMessage,
  ] = useState("");


  const [
    error,
    setError,
  ] = useState("");


  // ==========================================================
  // PASSWORD VISIBILITY
  // ==========================================================

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    showConfirmPermanentPassword,
    setShowConfirmPermanentPassword,
  ] = useState(false);

  const [
    showPermanentSecurityCode,
    setShowPermanentSecurityCode,
  ] = useState(false);

  const [
    showConfirmPermanentSecurityCode,
    setShowConfirmPermanentSecurityCode,
  ] = useState(false);

  const [
    showLegacySecurityCode,
    setShowLegacySecurityCode,
  ] = useState(false);

  const [
    showDeviceSecurityCode,
    setShowDeviceSecurityCode,
  ] = useState(false);


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

  const [
    usbAvailability,
    setUsbAvailability,
  ] = useState<string | null>(null);

  const [
    usbStoragePath,
    setUsbStoragePath,
  ] = useState("");

  const [
    usbAccessBusy,
    setUsbAccessBusy,
  ] = useState(false);


  // ==========================================================
  // USB STATUS MONITOR
  // ==========================================================

  useEffect(() => {

    let active =
      true;

    let requestRunning =
      false;


    async function checkUsb(
      initialCheck: boolean,
    ): Promise<void> {

      if (requestRunning) {

        return;

      }

      requestRunning =
        true;


      try {

        const bridge =
          getFinoraUsbBridge();


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

          const status =
            await bridge.getStatus();

          if (!active) {

            return;

          }

          const available =
            status.availability === "READY";

          setUsbAvailability(
            status.availability ?? null,
          );

          setUsbAvailable(
            available,
          );

          setUsbStoragePath(
            available
              ? (status.storagePath ?? status.storageId ?? "")
              : "",
          );

          setUsbMessage(
            available
              ? "FINORA USB detected."
              : "No USB detected.",
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

          setUsbAvailable(
            available,
          );

          setUsbStoragePath(
            available
              ? (typeof status === "string" ? status : "")
              : "",
          );

          setUsbMessage(
            available
              ? "FINORA USB detected."
              : "No USB detected.",
          );

          if (initialCheck) {

            setUsbChecking(false);

          }

          return;

        }


        if (active) {

          setUsbAvailable(false);

          setUsbMessage(
            "FINORA USB status service is unavailable.",
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

        requestRunning =
          false;

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

      active =
        false;

      window.clearInterval(
        intervalId,
      );

    };

  }, []);


  // ==========================================================
  // CLOSE DROPDOWNS ON OUTSIDE CLICK / ESCAPE
  // ==========================================================

  useEffect(() => {

    function handlePointerDown(
      event: MouseEvent,
    ): void {

      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(
          event.target as Node,
        )
      ) {

        setOpenDropdown(null);

      }

    }


    function handleKeyDown(
      event: globalThis.KeyboardEvent,
    ): void {

      if (event.key === "Escape") {

        setOpenDropdown(null);

      }

    }


    document.addEventListener(
      "mousedown",
      handlePointerDown,
    );

    document.addEventListener(
      "keydown",
      handleKeyDown,
    );


    return () => {

      document.removeEventListener(
        "mousedown",
        handlePointerDown,
      );

      document.removeEventListener(
        "keydown",
        handleKeyDown,
      );

    };

  }, []);


  // ==========================================================
  // RESET CREDENTIALS
  // ==========================================================

  function resetCredentials(): void {

    /*
     * Preserve entered credentials across storage/USB state refreshes.
     */
    setShowPassword(false);

    setLoginBusy(false);

  }


  // ==========================================================
  // STORAGE CHANGE
  // ==========================================================

  function handleStorageChange(
    storage: OwnerStorage,
  ): void {

    setOwnerStorage(storage);

    setDeviceSecurityCodeRequired(false);

    setDeviceSecurityCode("");

    setLegacySecurityCodeSetupRequired(false);

    setSecurityCode("");

    setConfirmSecurityCode("");

    setOpenDropdown(null);

    resetCredentials();

  }


  // ==========================================================
  // USB ACCESS SELECTION
  // ==========================================================

  async function handleRequestUsbAccess(): Promise<void> {

    setError("");

    const bridge =
      getFinoraUsbBridge();

    if (!bridge?.requestAccess) {

      setUsbMessage(
        "FINORA USB access selection is unavailable.",
      );

      return;

    }

    setUsbAccessBusy(true);

    const processingId =
      startFinoraProcessing(
        "Requesting USB Storage Access...",
      );

    try {

      const result =
        await bridge.requestAccess();

      if (!result.success) {

        setUsbMessage(
          result.error ??
            "Unable to select FINORA USB storage.",
        );

        return;

      }

      const status =
        result.data;

      if (!status) {

        setUsbAvailable(false);

        setUsbAvailability("ERROR");

        setUsbMessage(
          "FINORA USB access returned no storage status.",
        );

        return;

      }

      const available =
        status.availability === "READY";

      setUsbAvailability(
        status.availability ?? null,
      );

      setUsbAvailable(
        available,
      );

      setUsbStoragePath(
        available
          ? (status.storagePath ?? status.storageId ?? "")
          : "",
      );

      setUsbMessage(
        available
          ? "FINORA USB detected."
          : "No USB detected.",
      );

    } catch (usbAccessError) {

      console.error(
        "FINORA USB ACCESS ERROR:",
        usbAccessError,
      );

      setUsbAvailable(false);

      setUsbAvailability("ERROR");

      setUsbMessage(
        "Unable to request FINORA USB access.",
      );

    } finally {

      stopFinoraProcessing(
        processingId,
      );

      setUsbAccessBusy(false);

    }

  }


  // ==========================================================
  // USB DISCONNECT SAFETY
  // ==========================================================

  useEffect(() => {

    if (
      ownerStorage === "usb" &&
      !usbAvailable &&
      !usbChecking
    ) {

      setError("");

    }

  }, [
    usbAvailable,
    usbChecking,
    ownerStorage,
  ]);


  // ==========================================================
  // COMMON COMING SOON MESSAGE
  // ==========================================================

  function showComingSoon(
    message: string,
  ): void {

    setError(message);

  }


  // ==========================================================
  // UNKNOWN-DEVICE LOGIN CHALLENGE
  //
  // Separate from first-time credential-enrollment Security
  // Code state. This value exists only in renderer memory and
  // is sent only after main explicitly returns
  // SECURITY_CODE_REQUIRED.
  // ==========================================================

  const [
    deviceSecurityCodeRequired,
    setDeviceSecurityCodeRequired,
  ] = useState(false);

  const [
    deviceSecurityCode,
    setDeviceSecurityCode,
  ] = useState("");



  const [
    legacySecurityCodeSetupRequired,
    setLegacySecurityCodeSetupRequired,
  ] = useState(false);


  // ==========================================================
  // OWNER AUTHENTICATION
  // ==========================================================

  async function completeRequiredCredentialChange(): Promise<void> {

    setError("");

    const currentPassword =
      firstLoginCurrentPasswordRef.current;

    const currentSecurityCode =
      firstLoginCurrentSecurityCodeRef.current;
    if (
      !currentPassword ||
      !currentSecurityCode
    ) {
      setError(
        "Temporary FINORA credential context is unavailable. Sign in again.",
      );
      return;
    }

    if (
      Array.from(password).length < 8 ||
      Array.from(password).length > 128 ||
      password.trim().length === 0
    ) {
      setError(
        "Permanent Password must contain between 8 and 128 characters.",
      );
      return;
    }

    if (password !== confirmPassword) {
      setError(
        "Permanent Password and Confirm Password do not match.",
      );
      return;
    }

    if (
      Array.from(securityCode).length < 8 ||
      Array.from(securityCode).length > 15 ||
      securityCode.trim().length === 0
    ) {
      setError(
        "Permanent Security Code must contain between 8 and 15 characters.",
      );
      return;
    }

    if (securityCode !== confirmSecurityCode) {
      setError(
        "Permanent Security Code and Confirm Security Code do not match.",
      );
      return;
    }

    const credentialBridge =
      window.finora?.credentials;

    if (!credentialBridge?.completeFirstLoginV2) {
      setError(
        "FINORA secure first-login credential completion is unavailable in this application build.",
      );
      return;
    }

    if (!firstLoginRotationRequestIdRef.current) {

      if (
        typeof crypto === "undefined" ||
        typeof crypto.randomUUID !== "function"
      ) {
        setError(
          "Secure request identifier generation is unavailable.",
        );
        return;
      }

      firstLoginRotationRequestIdRef.current =
        crypto.randomUUID();
    }

    setLoginBusy(true);

    try {

      const result =
        await credentialBridge.completeFirstLoginV2({
          rotationRequestId:
            firstLoginRotationRequestIdRef.current,

          username:
            username.trim(),

          currentPassword,
          currentSecurityCode,

          newPassword:
            password,

          newSecurityCode:
            securityCode,
        });

      if (!result.success) {
        setError(
          result.error ??
            "Unable to save permanent FINORA credentials.",
        );
        return;
      }

      // Server + Portable Auth + Control credential replacement is durable here.
      // The temporary authenticated session must never be reused.

      firstLoginCurrentPasswordRef.current =
        null;

      firstLoginCurrentSecurityCodeRef.current =
        null;
      firstLoginRotationRequestIdRef.current =
        null;

      setPassword("");
      setConfirmPassword("");
      setSecurityCode("");
      setConfirmSecurityCode("");

      setDeviceSecurityCodeRequired(false);
      setDeviceSecurityCode("");

      setLegacySecurityCodeSetupRequired(false);

      setCredentialMode("LOGIN");

      setCredentialEnrollmentMessage(
        "Permanent credentials saved. Sign in with your new Password.",
      );

      setError("");
    }
    catch {

      // Preserve rotationRequestId for exact server/local retry.
      setError(
        "Unable to confirm the permanent credential update. Retry the same submission.",
      );
    }
    finally {
      setLoginBusy(false);
    }
  }

  async function authenticateOwner(): Promise<void> {

    setError("");

    const trimmedUsername =
      username.trim();

    const resolvedBusinessDate =
      resolveBusinessDate(
        businessDate,
      );


    // --------------------------------------------------------
    // ERP BUSINESS DATE VALIDATION
    // --------------------------------------------------------

    if (!resolvedBusinessDate) {
      setError(
        "Choose a valid FINORA Login Date.",
      );

      return;
    }


    // --------------------------------------------------------
    // CREDENTIAL INPUT VALIDATION
    // --------------------------------------------------------

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
    // USB PHYSICAL AVAILABILITY
    // --------------------------------------------------------

    if (
      ownerStorage === "usb" &&
      !usbAvailable
    ) {

      setError(
        "FINORA USB is not connected.",
      );

      return;

    }


    setLoginBusy(true);

    const processingId =
      startFinoraProcessing(
        "Signing in to FINORA...",
      );


    let issuedSessionId:
      string |
      undefined;

    let loginCompleted =
      false;

    try {
      // ======================================================
      // AUTHORITATIVE OWNER LOGIN
      //
      // Renderer does not make account-lock decisions.
      // Authentication / provisioning authority is Electron + server.
      // ======================================================

// ======================================================
      // 2. MAIN-PROCESS SECURE LOGIN AUTHORITY
      //
      // Main process owns:
      //
      // - SCRYPT credential verification
      // - authoritative Branch Activation
      // - signed Branch Access evaluation
      // - exact credential/access context agreement
      // - ACTIVE logical storage entitlement after current Device Trust
      // - cryptographic login session creation
      //
      // Renderer supplies only user-entered login inputs:
      //
      // - username
      // - password
      // - selected LOCAL / USB mode
      // - Security Code only after main returns
      //   SECURITY_CODE_REQUIRED
      //
      // Renderer never supplies identity, scope, binding,
      // signer, portability proof or trust authority.
      // ======================================================

      const entitlementStorageMode =
        ownerStorage === "usb"
          ? "USB"
          : "LOCAL";

      if (legacySecurityCodeSetupRequired) {
        const legacySecurityCodeLength =
          Array.from(securityCode).length;

        if (
          legacySecurityCodeLength < 8 ||
          legacySecurityCodeLength > 15 ||
          securityCode.trim().length === 0
        ) {
          setError(
            "Security Code must contain between 8 and 15 characters.",
          );
          return;
        }

        if (!confirmSecurityCode) {
          setError(
            "Confirm your Security Code.",
          );
          return;
        }

        if (securityCode !== confirmSecurityCode) {
          setError(
            "Security Code and Confirm Security Code do not match.",
          );
          return;
        }
      }


          /*
     * FINORA_NEW_DEVICE_SECURITY_VALIDATION
     *
     * Known device:
     *   User ID + Password.
     *
     * New / untrusted device:
     *   Electron main first returns SECURITY_CODE_REQUIRED.
     *   Only then is Security Code required and displayed.
     */
    if (
      deviceSecurityCodeRequired &&
      deviceSecurityCode.trim().length === 0
    ) {
      setError(
        "Enter your Security Code to authorize this device.",
      );
      return;
    }
const loginSessionBridge =
        getFinoraLoginSessionBridge();

      if (
        !loginSessionBridge?.login
      ) {
        setError(
          "FINORA secure login authority is unavailable in this application build.",
        );

        return;
      }

      if (activateWalletOnce && !walletEnrollmentCode.trim()) {
        setError("Enter your Security Code to activate Server Wallet.");
        return;
      }
      let loginResult =
        await loginSessionBridge.login({
          username:
            trimmedUsername,

          password,

          storageMode:
            entitlementStorageMode,
          ...(activateWalletOnce && walletEnrollmentCode.trim()
            ? { walletSecurityCode: walletEnrollmentCode.trim() }
            : {}),

          ...(legacySecurityCodeSetupRequired
            ? {
                securityCode,
              }
            : ownerStorage === "usb" &&
              deviceSecurityCode.trim().length > 0
            ? {
                securityCode: deviceSecurityCode.trim(),
              }
            : {}),
        });

      /*
       * FINORA_P1_075_ANDROID_V2_RECOVERY
       *
       * Android USB only.
       * Existing native login runs first.
       * No V2 enrollment or login-session fabrication.
       */
      if (
        !loginResult.success &&
        entitlementStorageMode === "USB" &&
        FinoraP1075Capacitor.isNativePlatform() &&
        FinoraP1075Capacitor.getPlatform() === "android" &&
        loginResult.errorCode === "INVALID_CREDENTIALS"
      ) {
        const v2Recovery =
          getFinoraAndroidServerFirstV2Recovery();

        if (v2Recovery) {
          const eligibility =
            await v2Recovery.checkServerFirstV2RecoveryEligibility({
              username: trimmedUsername,
            });

          if (!eligibility.eligible) {
            setError(
              eligibility.errorCode === "LOCAL_CREDENTIAL_EXISTS"
                ? "Invalid username or password"
                : "Unable to verify first-device recovery eligibility.",
            );
            return;
          }

          const recoverySecurityCode =
            deviceSecurityCode.trim();

          if (!recoverySecurityCode) {
            setLegacySecurityCodeSetupRequired(false);
            setDeviceSecurityCodeRequired(true);
            setDeviceSecurityCode("");
            setError(
              "For first-time Android USB access, enter your Security Code and try again.",
            );
            return;
          }

          // FINORA_P1_083_SERVER_ENROLLMENT
          // First try recovery from existing signed V2 USB.
          let recovered =
            await v2Recovery.recoverServerFirstLoginV2({
              username: trimmedUsername,
              password,
              securityCode: recoverySecurityCode,
            });

          // A genuinely new USB has no signed V2 auth files.
          // Native enrollment MUST verify the signed server
          // response before it creates any account files.
          if (
            !recovered.success &&
            (
              recovered.errorCode ===
                "V2_VERIFICATION_OR_RECOVERY_FAILED" ||
              recovered.errorCode ===
                "V2_FAILED_V2_USB_AUTH_VERIFICATION"
            )
          ) {
            const enrollment =
              await v2Recovery.enrollServerFirstLoginV2({
                username: trimmedUsername,
                password,
                securityCode: recoverySecurityCode,
              });

            if (!enrollment.success) {
              setError(
                "Server-first enrollment failed: " +
                (
                  enrollment.errorCode ??
                  enrollment.enrollmentStatus ??
                  "UNKNOWN_ENROLLMENT_ERROR"
                ),
              );
              return;
            }

            // Enrollment is NOT an authenticated login.
            // The newly written V2 USB authority must
            // pass full verification and hydration.
            recovered =
              await v2Recovery.recoverServerFirstLoginV2({
                username: trimmedUsername,
                password,
                securityCode: recoverySecurityCode,
              });
          }

          if (
            recovered.success &&
            recovered.status === "RECOVERED"
          ) {
            // Existing authority must independently issue the session.
            loginResult = await loginSessionBridge.login({
              username: trimmedUsername,
              password,
              storageMode: entitlementStorageMode,
              securityCode: recoverySecurityCode,
            });
          } else {
            const recoveryCode =
              recovered.success
                ? "RECOVERY_INCOMPLETE"
                : recovered.errorCode;

            if (
              recoveryCode === "EXISTING_LOCAL_CONTROL_STATE"
            ) {
              setError(
                "This device already has FINORA local branch state. Use the authorized branch restore or switch process.",
              );
            } else {
              // FINORA_P1_086_SAFE_FAILURE_CODE
              // Show only the native diagnostic stage/code.
              // Never display credentials or raw exception details.
              setError(
                "FINORA first-device verification failed [" +
                (
                  recoveryCode &&
                  /^[A-Z0-9_]+$/.test(recoveryCode)
                    ? recoveryCode
                    : "UNKNOWN"
                ) +
                "].",
              );
            }
            return;
          }
        }
      }

      if (!loginResult.success) {
        if (
          loginResult.errorCode ===
            "SECURITY_CODE_SETUP_REQUIRED"
        ) {
          setLegacySecurityCodeSetupRequired(
            true,
          );

          setShowLegacySecurityCode(
            false,
          );

          setDeviceSecurityCodeRequired(
            false,
          );

          setDeviceSecurityCode("");
          setSecurityCode("");
          setConfirmSecurityCode("");

          setCredentialEnrollmentMessage(
            "This existing FINORA credential needs a Branch Security Code upgrade. Create and confirm your Security Code, then continue.",
          );

          setError("");
          return;
        }

        if (
          loginResult.errorCode ===
            "SECURITY_CODE_REQUIRED"
        ) {
          setLegacySecurityCodeSetupRequired(
            false,
          );

          setSecurityCode("");
          setConfirmSecurityCode("");

          setDeviceSecurityCodeRequired(
            true,
          );

          setDeviceSecurityCode("");

          setError(
            "Enter your Security Code to authorize this device.",
          );

          return;
        }

        if (
          loginResult.errorCode ===
            "SECURITY_CODE_INVALID"
        ) {
          setLegacySecurityCodeSetupRequired(
            false,
          );

          setSecurityCode("");
          setConfirmSecurityCode("");

          setDeviceSecurityCodeRequired(
            true,
          );

          setDeviceSecurityCode("");

          setError(
            "Invalid Security Code",
          );

          return;
        }

        if (
          loginResult.errorCode ===
            "INVALID_CREDENTIALS"
        ) {
          setDeviceSecurityCodeRequired(
            false,
          );

          setLegacySecurityCodeSetupRequired(false);
setError(
            "Invalid username or password [" + loginResult.errorCode + "]",
          );
        }
        else {
          setDeviceSecurityCodeRequired(
            false,
          );

          setDeviceSecurityCode("");

          setError(
            loginResult.errorCode ===
              "SYSTEM_CLOCK_INVALID"
              ? "System date/time is incorrect. Correct it and try again."
              : loginResult.errorCode ===
                  "SERVER_TIME_UNAVAILABLE"
                ? "Unable to verify the current date/time. Check your internet connection and try again."
                : loginResult.errorCode ===
                    "DEVICE_TRUST_FAILED"
? (
                      loginResult.error ??
                      "Unable to authorize this device."
                    )
                  : loginResult.error ??
                    "Unable to authorize this FINORA login.",
          );
        }

        return;
      }

      setDeviceSecurityCodeRequired(
        false,
      );

      setDeviceSecurityCode("");

      setLegacySecurityCodeSetupRequired(false);
      setSecurityCode("");
      setConfirmSecurityCode("");
      setCredentialEnrollmentMessage("");

      resetLoginAttempts(
        trimmedUsername,
      );

      const authoritativeSession =
        loginResult.data;

      issuedSessionId =
        authoritativeSession.sessionId;



      if (
        authoritativeSession.credentialChangeRequired ===
          true
      ) {

        const submittedSecurityCode =
          deviceSecurityCodeRequired
            ? deviceSecurityCode
            : securityCode;

        if (!submittedSecurityCode) {
          setError(
            "Security Code is required to replace temporary FINORA credentials.",
          );
          return;
        }

        firstLoginCurrentPasswordRef.current =
          password;

        firstLoginCurrentSecurityCodeRef.current =
          submittedSecurityCode;
        firstLoginRotationRequestIdRef.current =
          null;

        /*
         * The temporary authenticated session is intentionally
         * NOT committed to renderer application state.
         *
         * issuedSessionId deliberately remains populated so
         * authenticateOwner's existing finally-path invalidates
         * this temporary authenticated session.
         */
        setPassword("");
        setConfirmPassword("");
        setSecurityCode("");
        setConfirmSecurityCode("");

        setDeviceSecurityCodeRequired(false);
        setDeviceSecurityCode("");

        setLegacySecurityCodeSetupRequired(false);

        setCredentialMode(
          "FORCE_CREDENTIAL_CHANGE",
        );

        setCredentialEnrollmentMessage(
          "Create your permanent Password and permanent Security Code to continue.",
        );

        setError("");

        return;
      }
// ======================================================
      // 3. BUILD RENDERER SESSION SNAPSHOT
      //
      // SECURITY:
      //
      // Every identity / role / scope / context field below
      // originates from the authoritative main-process result.
      //
      // sessionId is the opaque 256-bit main-process bearer
      // token. Renderer does not generate it.
      // ======================================================

      if (
        !authoritativeSession.userId ||
        !authoritativeSession.ownerId ||
        !authoritativeSession.businessId ||
        !authoritativeSession.branchId ||
        authoritativeSession.storageMode !==
          entitlementStorageMode
      ) {
        setError(
          "The secure FINORA login authority returned an invalid session identity.",
        );

        return;
      }

      const session = {
        userId:
          authoritativeSession.userId,

        username:
          authoritativeSession.username,

        fullName:
          authoritativeSession.fullName,

        role:
          authoritativeSession.role,

        loginTime:
          authoritativeSession.loginTime,

        sessionId:
          authoritativeSession.sessionId,

        lastActivity:
          authoritativeSession.lastActivity,

        ownerId:
          authoritativeSession.ownerId,

        businessId:
          authoritativeSession.businessId,

        branchId:
          authoritativeSession.branchId,

        dataContext:
          authoritativeSession.dataContext,

        ...(
          authoritativeSession.demoId ===
            undefined
            ? {}
            : {
                demoId:
                  authoritativeSession.demoId,
              }
        ),
      };


      // ======================================================      // 4. ACTIVATE SELECTED OPERATIONAL STORAGE
      // ======================================================

      const storageMode =
        ownerStorage === "usb"
          ? StorageMode.USB
          : StorageMode.LOCAL;


      const storageActivated =
        await activateStorageMode(
          storageMode,
        );


      if (!storageActivated) {

        setError(
          ownerStorage === "usb"
            ? "Unable to activate FINORA USB storage."
            : "Unable to activate local FINORA storage.",
        );

        return;

      }


      // ======================================================
      // 5. PRESERVE AUTHENTICATED STORAGE MODE
      // ======================================================

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


      // ======================================================
      // 6. COMMIT AUTHENTICATED SESSION
      //
      // Only now:
      // - Persist finora_session
      // - Create successful LOGIN audit
      // ======================================================

      commitLoginSession(
        session,

        resolvedBusinessDate,
      );

      loginCompleted =
        true;


      clearCustomerCache();

      setError("");

      onLogin();

    } catch (loginError) {

      console.error(
        "FINORA OWNER LOGIN FAILED:",
        loginError,
      );

      setError(
        "Unable to complete FINORA login.",
      );

    } finally {

      if (
        issuedSessionId &&
        !loginCompleted
      ) {
        try {
          await getFinoraLoginSessionBridge()
            ?.invalidate({
              sessionId:
                issuedSessionId,
            });
        }
        catch {
          // Best-effort cleanup only.
          //
          // The renderer never treats invalidation failure as
          // authorization. Electron process termination also
          // destroys the in-memory session authority.
        }
      }

      stopFinoraProcessing(
        processingId,
      );

      setLoginBusy(false);

    }

  }


  // ==========================================================
  // CREDENTIAL MODE
  // ==========================================================

  function returnToLoginMode(): void {

    // FINORA_P1_579CK_RETURN_FROM_PASSWORD_RESET
    // Close Forgot Password UI before restoring normal LOGIN credential mode.
    setForgotPasswordMode(false);
    setForgotPasswordError(undefined);
    setForgotPasswordSuccess(undefined);
    setForgotConfirmNewPassword("");
    setForgotNewPassword("");
    setForgotSecurityCode("");
    forgotPasswordRecoveryRequestIdRef.current =
      null;

    // Clear verified temporary first-login secrets when leaving this page.
    firstLoginCurrentPasswordRef.current =
      null;

    firstLoginCurrentSecurityCodeRef.current =
      null;

    firstLoginRotationRequestIdRef.current =
      null;

    setDeviceSecurityCodeRequired(false);

    setDeviceSecurityCode("");

    setLegacySecurityCodeSetupRequired(false);

    setCredentialMode(
      "LOGIN",
    );

    setPassword(
      "",
    );

    setConfirmPassword(
      "",
    );

    setSecurityCode(
      "",
    );

    setConfirmSecurityCode(
      "",
    );

    setShowPassword(
      false,
    );

    setCredentialEnrollmentMessage(
      "",
    );

    setError(
      "",
    );

  }


  // ==========================================================
  // BRANCH BACKUP RESTORE MODE
  //
  // This path is intentionally sessionless.
  //
  // Renderer authority is limited to:
  // - Username
  // - Password
  // - Security Code
  //
  // Backup file selection, scope, storage mode, generation and
  // destination remain privileged Electron-main authorities.
  // ==========================================================

  function openRestoreBackupMode(): void {

    setDeviceSecurityCodeRequired(
      false,
    );

    setDeviceSecurityCode(
      "",
    );

    setCredentialMode(
      "RESTORE_BACKUP",
    );

    setPassword(
      "",
    );

    setConfirmPassword(
      "",
    );

    setSecurityCode(
      "",
    );

    setConfirmSecurityCode(
      "",
    );

    setShowPassword(
      false,
    );

    setCredentialEnrollmentMessage(
      "Restore mode: enter your User ID, Password and Security Code, then select the FINORA backup.",
    );

    setError(
      "",
    );

  }


  async function restoreBranchBackup():
    Promise<void> {

    const trimmedUsername =
      username.trim();

    if (
      trimmedUsername.length ===
        0
    ) {

      setError(
        "Enter your User ID.",
      );

      return;

    }


    if (
      password.length ===
        0
    ) {

      setError(
        "Enter your Password.",
      );

      return;

    }


    if (
      securityCode.length <
        8 ||
      securityCode.length >
        15 ||
      securityCode.trim().length ===
        0
    ) {

      setError(
        "Security Code must contain between 8 and 15 characters.",
      );

      return;

    }


    const restoreBridge =
      window.finora
        ?.portableBranchAuthRestore;

    if (
      !restoreBridge ||
      typeof restoreBridge.restoreBackup !==
        "function"
    ) {

      setError(
        "FINORA Branch Backup Restore is unavailable in this application build.",
      );

      return;

    }


    setLoginBusy(
      true,
    );

    setError(
      "",
    );


    try {

      const result =
        await restoreBridge.restoreBackup({
          username:
            trimmedUsername,

          password,

          securityCode,
        });


      if (!result.success) {

        if (
          result.errorCode ===
            "CREDENTIAL_AUTHENTICATION_FAILED"
        ) {

          setError(
            "Invalid username or password",
          );

          return;

        }


        if (
          result.errorCode ===
            "BACKUP_AUTHENTICATION_FAILED"
        ) {

          setError(
            "Unable to authenticate this backup with the supplied Password and Security Code.",
          );

          return;

        }


        setError(
          result.error ||
            "Unable to restore the FINORA Branch Backup.",
        );

        return;

      }


      if (result.cancelled) {

        setCredentialEnrollmentMessage(
          "Restore cancelled. No changes were made.",
        );

        return;

      }


      setUsername(
        "",
      );

      setDeviceSecurityCodeRequired(
        false,
      );

      setDeviceSecurityCode(
        "",
      );

      setConfirmPassword(
        "",
      );

      setConfirmSecurityCode(
        "",
      );

      setCredentialMode(
        "LOGIN",
      );

      setCredentialEnrollmentMessage(
        "Branch backup restored successfully. Sign in to continue.",
      );

      setError(
        "",
      );

    } catch {

      setError(
        "Unable to restore the FINORA Branch Backup.",
      );

    } finally {

      // Sensitive authentication factors must not remain in UI
      // state after a native Restore attempt.

      setPassword(
        "",
      );

      setSecurityCode(
        "",
      );

      setShowPassword(
        false,
      );

      setLoginBusy(
        false,
      );

    }

  }

  // ==========================================================
  // LOGIN / SET PASSWORD CLICK
  // ==========================================================

    // FINORA_P1_679O_SUBSCRIPTION_DASHBOARD
  const [accountSubscriptionPlans, setAccountSubscriptionPlans] =
    useState<Array<{
      months: number;
      regularPriceInr: string;
      offerPriceInr: string;
    }>>([]);

  const [accountSubscription, setAccountSubscription] =
    useState<{
      status: string;
      expiresAt: string | null;
      daysRemaining: number | null;
    } | null>(null);

  const [accountPricingStatus, setAccountPricingStatus] =
    useState<string>("NOT_LOADED");

  // FINORA_P1_679B_ACCOUNT_DASHBOARD
  // Account/Wallet state only. Never authorizes Reception.
  const [accountWalletBalance, setAccountWalletBalance] =
    useState<string | null>(null);

  const [accountWalletStatus, setAccountWalletStatus] =
    useState<string>("NOT_AUTHENTICATED");
    // FINORA_P1_678U_ACCOUNT_LOGIN_ACTION
  // Server-authenticated Account/Wallet login.
  // Never creates or commits a Business/Reception session.
  async function handleAccountPasswordLogin(): Promise<void> {
    if (loginBusy) return;

    const accountUsername = username.trim();

    if (!accountUsername || !password) {
      setError("Enter User ID and Password.");
      return;
    }

    setLoginBusy(true);
    setError("");

    try {
      // P1-684Y: Android uses its native HTTPS account authority.
      // Windows retains Electron's main-process account authority.
      const result =
        FinoraP1075Capacitor.isNativePlatform() &&
        FinoraP1075Capacitor.getPlatform() === "android"
          ? await (finoraControlShared as {
              accountPasswordLogin: (request: {
                username: string;
                password: string;
              }) => Promise<{
                success: boolean;
                errorCode?: string;
              }>;
            }).accountPasswordLogin({
              username: accountUsername,
              password,
            })
          : await authenticateFinoraAccountOnly(
              accountUsername,
              password,
            );

      if (!result.success) {
        setError(
          "Account Login failed [" +
          (result.errorCode ?? "UNKNOWN") +
          "].",
        );
        return;
      }

      setError("");
      // FINORA_P1_679C_LIVE_BALANCE
      setAccountWalletStatus("AUTHENTICATED");
      setAccountWalletBalance(null);

      const walletHost = window as Window & {
        finoraAccountWallet?: {
          balance: () => Promise<{
            success: boolean;
            errorCode?: string;
            wallet?: {
              balanceInr?: string;
              currency?: string;
              source?: string;
            };
          }>;
        };
      };

      if (walletHost.finoraAccountWallet?.balance) {
        try {
          const balanceResult =
            await walletHost.finoraAccountWallet.balance();

          const wallet = balanceResult.wallet;

          if (
            balanceResult.success &&
            wallet?.currency === "INR" &&
            wallet.source === "POSTGRESQL_WALLETS" &&
            typeof wallet.balanceInr === "string" &&
            /^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(wallet.balanceInr)
          ) {
            setAccountWalletBalance(wallet.balanceInr);
            setAccountWalletStatus("WALLET_BALANCE_VERIFIED");
          } else {
            setAccountWalletStatus("WALLET_BALANCE_UNAVAILABLE");
          }
        } catch {
          setAccountWalletStatus("WALLET_BALANCE_UNAVAILABLE");
        }
      } else {
                // FINORA_P1_695E_NATIVE_WALLET
        // Android native already verified this balance with its
        // private server bearer. No token reaches the renderer.
        const nativeWallet = (
          result as {
            wallet?: {
              balanceInr?: string;
              currency?: string;
              source?: string;
            };
          }
        ).wallet;

        if (
          FinoraP1075Capacitor.isNativePlatform() &&
          FinoraP1075Capacitor.getPlatform() === "android" &&
          nativeWallet?.source === "POSTGRESQL_WALLETS" &&
          nativeWallet.currency === "INR" &&
          typeof nativeWallet.balanceInr === "string" &&
          /^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(
            nativeWallet.balanceInr
          )
        ) {
          setAccountWalletBalance(nativeWallet.balanceInr);
          setAccountWalletStatus("WALLET_BALANCE_VERIFIED");
        } else {
          setAccountWalletStatus("WALLET_BRIDGE_UNAVAILABLE");
        }
      }

      // FINORA_P1_679O_READ_ONLY_PRICING_FETCH
      setAccountSubscriptionPlans([]);
      setAccountSubscription(null);
      setAccountPricingStatus("LOADING");

      const pricingHost = window as Window & {
        finoraAccountPricing?: {
          get: () => Promise<{
            success: boolean;
            pricing?: {
              source?: string;
              plans?: Array<{
                months: number;
                regularPriceInr: string;
                offerPriceInr: string;
              }>;
              currentSubscription?: {
                status: string;
                expiresAt: string | null;
                daysRemaining: number | null;
              } | null;
            };
          }>;
        };
      };

      try {
        if (!pricingHost.finoraAccountPricing?.get) {
          setAccountPricingStatus("BRIDGE_UNAVAILABLE");
        } else {
          const result = await pricingHost.finoraAccountPricing.get();
          const pricing = result.pricing;

          if (
            result.success &&
            pricing?.source === "FINORA_POSTGRESQL_PRICING" &&
            Array.isArray(pricing.plans) &&
            pricing.plans.length === 4 &&
            new Set(pricing.plans.map(p => p.months)).size === 4 &&
            pricing.plans.every(p =>
              [1, 3, 6, 12].includes(p.months) &&
              /^(?:0|[1-9]\d{0,9})\.\d{2}$/.test(p.regularPriceInr) &&
              /^(?:0|[1-9]\d{0,9})\.\d{2}$/.test(p.offerPriceInr)
            )
          ) {
            setAccountSubscriptionPlans(pricing.plans);
            setAccountSubscription(
              pricing.currentSubscription ?? null
            );
            setAccountPricingStatus("VERIFIED");
          } else {
            setAccountPricingStatus("UNAVAILABLE");
          }
        }
      } catch {
        setAccountPricingStatus("UNAVAILABLE");
      }
      // FINORA_P1_696I_AUTO_BUSINESS_VERIFY
      // One user action, no second credentials prompt.
      // Business authority is independently checked by Electron Main.
      // This DOES NOT create local operational authority or enter Reception.
      if (
        !FinoraP1075Capacitor.isNativePlatform()
      ) {
        const businessVerified =
          await verifyServerBusinessLogin();

        if (!businessVerified) {
          setCredentialEnrollmentMessage(
            "Account/Wallet authenticated; Reception authorization unavailable.",
          );
          return;
        }
      }

      setCredentialEnrollmentMessage(
        "Account Login verified. Wallet status: check Account Dashboard. Reception authorization pending.",
      );
    } catch {
      setError("Account Login service is unavailable.");
    } finally {
      setLoginBusy(false);
    }
  }
  // FINORA_P1_687Z_SERVER_BUSINESS_AUTHENTICATION
  // This verifies the Server Business Session but deliberately
  // does not grant a local Reception session.
  async function verifyServerBusinessLogin(): Promise<boolean> {
    const bridge = (
      window as Window & {
        finoraBusinessLogin?: {
          login: (input: {
            username: string;
            password: string;
          }) => Promise<{
            success: boolean;
            errorCode?: string;
            sessionType?: string;
            businessDataAccess: boolean;
          }>;
        };
      }
    ).finoraBusinessLogin;

    if (!bridge?.login) {
      setError("FINORA Server Business Login is unavailable.");
      return false;
    }

    try {
      const result = await bridge.login({
        username: username.trim(),
        password,
      });

      if (
        result.success !== true ||
        result.sessionType !== "BUSINESS_RECEPTION"
      ) {
        setError(
          `FINORA Server Login: ${
            result.errorCode ?? "BUSINESS_AUTHORIZATION_FAILED"
          }`,
        );
        return false;
      }

      // FINORA_P1_688J_SERVER_SESSION_REVALIDATION
      // Never grant Reception from a success flag alone.
      const sessionBridge = (
        window as Window & {
          finoraBusinessSession?: {
            validate: () => Promise<{
              success: boolean;
              sessionType?: string;
              businessDataAccess: boolean;
              errorCode?: string;
            }>;
          };
        }
      ).finoraBusinessSession;

      if (!sessionBridge?.validate) {
        setError("FINORA Business Session authority is unavailable.");
        return false;
      }

      const verification = await sessionBridge.validate();

      if (
        verification.success !== true ||
        verification.sessionType !== "BUSINESS_RECEPTION"
      ) {
        setError(
          `Business Session verification failed: ${
            verification.errorCode ?? "NOT_AUTHORIZED"
          }`,
        );
        return false;
      }

      // Server identity/subscription verified.
      // Operational authorization and Reception handoff pending.
      setError(
        "Server Business Session verified. Reception operational authorization pending.",
      );

      return true;
    } catch {
      setError("Unable to contact FINORA Business Login Server.");
      return false;
    }
  }
function handleLogin(): void {
if (
      credentialMode ===
        "RESTORE_BACKUP"
    ) {

      void restoreBranchBackup();

      return;
    }
    // FINORA_P1_694S_SERVER_FIRST
    // Normal login requires server-verified Username + Password.
    // No Security Code, device recovery, or local-only Reception grant.
    // Wallet authentication does not imply Business/Reception access.
    if (credentialMode === "LOGIN") {
      void handleAccountPasswordLogin();
      return;
    }

    // Non-login credential management remains unchanged until
    // its separate server authorization migration is completed.
    void authenticateOwner();

  }

  // ==========================================================
  // FORGOT PASSWORD
  // ==========================================================


  function handleForgotPassword(): void {
    setForgotPasswordMode(true);
    setForgotPasswordError(undefined);
    setForgotPasswordSuccess(undefined);
    setForgotConfirmNewPassword("");
    setForgotNewPassword("");
    setForgotSecurityCode("");
    forgotPasswordRecoveryRequestIdRef.current =
      null;
  }

  async function submitForgotPasswordRecovery(): Promise<void> {
    if (forgotPasswordBusy) {
      return;
    }

    setForgotPasswordError(undefined);
    setForgotPasswordSuccess(undefined);

    const trimmedUsername =
      username.trim();

    if (!trimmedUsername) {
      setForgotPasswordError(
        "Enter your User ID.",
      );
      return;
    }

    if (!forgotSecurityCode) {
      setForgotPasswordError(
        "Enter your current Security Code.",
      );
      return;
    }

    if (
      Array.from(forgotNewPassword).length < 8 ||
      Array.from(forgotNewPassword).length > 128 ||
      forgotNewPassword.trim().length === 0
    ) {
      setForgotPasswordError(
        "New Password must contain between 8 and 128 characters.",
      );
      return;
    }

    if (!forgotConfirmNewPassword) {
      setForgotPasswordError(
        "Confirm your new Password.",
      );
      return;
    }

    if (
      forgotNewPassword !==
      forgotConfirmNewPassword
    ) {
      setForgotPasswordError(
        "New Password and Confirm New Password do not match.",
      );
      return;
    }

    const bridge =
      window.finora?.credentials;

    if (
      !bridge ||
      typeof bridge.resetPasswordV2 !==
        "function"
    ) {
      setForgotPasswordError(
        "FINORA secure Password recovery is unavailable in this application build.",
      );
      return;
    }

    if (!forgotPasswordRecoveryRequestIdRef.current) {
      if (
        typeof crypto === "undefined" ||
        typeof crypto.randomUUID !==
          "function"
      ) {
        setForgotPasswordError(
          "Secure request identifier generation is unavailable.",
        );
        return;
      }

      forgotPasswordRecoveryRequestIdRef.current =
        crypto.randomUUID();
    }

    setForgotPasswordBusy(true);

    try {
      const result =
        await bridge.resetPasswordV2({
          recoveryRequestId:
            forgotPasswordRecoveryRequestIdRef.current,

          username:
            trimmedUsername,

          currentSecurityCode:
            forgotSecurityCode,

          newPassword:
            forgotNewPassword,
        });

      if (!result.success) {
        throw new Error(
          result.error ??
            "FINORA Password recovery failed.",
        );
      }

      setForgotPasswordSuccess(
        "Password reset successfully. Please log in with the new Password.",
      );

      setPassword("");
      setConfirmPassword("");
      setSecurityCode("");
      setConfirmSecurityCode("");

      setForgotConfirmNewPassword("");
      setForgotNewPassword("");
      setForgotSecurityCode("");

      forgotPasswordRecoveryRequestIdRef.current =
        null;
    }
    catch (error) {
      // Preserve recoveryRequestId across an uncertain retry.
      setForgotPasswordError(
        error instanceof Error
          ? error.message
          : "Unable to reset the FINORA Password.",
      );
    }
    finally {
      setForgotPasswordBusy(false);
    }
  }

  function openSecurityCodeRecoveryMode(): void {
    if (loginBusy || forgotPasswordBusy || securityCodeRecoveryBusy) return;
    setForgotPasswordMode(false);
    setSecurityCodeRecoveryMode(true);
    setSecurityCodeRecoveryPassword("");
    setSecurityCodeRecoveryNewCode("");
    setSecurityCodeRecoveryConfirmCode("");
    setSecurityCodeRecoveryError(undefined);
    setSecurityCodeRecoverySuccess(undefined);
    securityCodeRecoveryRequestIdRef.current = null;
  }

  function closeSecurityCodeRecoveryMode(): void {
    if (securityCodeRecoveryBusy) return;
    setSecurityCodeRecoveryMode(false);
    setSecurityCodeRecoveryPassword("");
    setSecurityCodeRecoveryNewCode("");
    setSecurityCodeRecoveryConfirmCode("");
    setSecurityCodeRecoveryError(undefined);
    setSecurityCodeRecoverySuccess(undefined);
    securityCodeRecoveryRequestIdRef.current = null;
  }

  async function submitSecurityCodeRecovery(): Promise<void> {
    if (securityCodeRecoveryBusy) return;

    setSecurityCodeRecoveryError(undefined);
    setSecurityCodeRecoverySuccess(undefined);
    const trimmedUsername = username.trim();

    if (!trimmedUsername) {
      setSecurityCodeRecoveryError("Enter your User ID.");
      return;
    }

    if (!securityCodeRecoveryPassword) {
      setSecurityCodeRecoveryError("Enter your current Password.");
      return;
    }

    if (!securityCodeRecoveryNewCode) {
      setSecurityCodeRecoveryError("Enter a new Security Code.");
      return;
    }

    if (!securityCodeRecoveryConfirmCode) {
      setSecurityCodeRecoveryError("Confirm your new Security Code.");
      return;
    }

    if (securityCodeRecoveryNewCode !== securityCodeRecoveryConfirmCode) {
      setSecurityCodeRecoveryError("New Security Code and confirmation do not match.");
      return;
    }

    // FINORA_P1_578PD_RECOVERY_EYE_LAYOUT
    // FINORA_P1_578OU_RECONVERGENCE_UI
    const bridge = window.finora?.credentials;

    if (!bridge || typeof bridge.reconvergeSecurityCodeV2 !== "function") {
      setSecurityCodeRecoveryError("FINORA secure Security Code recovery is unavailable in this build.");
      return;
    }

    if (!securityCodeRecoveryRequestIdRef.current) {
      if (typeof crypto === "undefined" || typeof crypto.randomUUID !== "function") {
        setSecurityCodeRecoveryError("Secure request identifier generation is unavailable.");
        return;
      }
      securityCodeRecoveryRequestIdRef.current = crypto.randomUUID();
    }

    setSecurityCodeRecoveryBusy(true);

    try {
      const result = await bridge.reconvergeSecurityCodeV2({
        rotationRequestId: securityCodeRecoveryRequestIdRef.current,
        username: trimmedUsername,
        currentPassword: securityCodeRecoveryPassword,
        newSecurityCode: securityCodeRecoveryNewCode,
      });

      if (!result.success) {
        throw new Error(result.error ?? "FINORA Security Code recovery failed.");
      }

      setSecurityCodeRecoverySuccess("Local Security Code recovered successfully.");
      setSecurityCodeRecoveryPassword("");
      setSecurityCodeRecoveryNewCode("");
      setSecurityCodeRecoveryConfirmCode("");
      securityCodeRecoveryRequestIdRef.current = null;
    } catch (error) {
      setSecurityCodeRecoveryError(
        error instanceof Error
          ? error.message
          : "Unable to recover the FINORA Security Code.",
      );
    } finally {
      setSecurityCodeRecoveryBusy(false);
    }
  }

  function closeForgotPasswordMode(): void {
    if (forgotPasswordBusy) {
      return;
    }

    setForgotPasswordMode(false);
    setForgotPasswordError(undefined);
    setForgotPasswordSuccess(undefined);
    setForgotConfirmNewPassword("");
    setForgotNewPassword("");
    setForgotSecurityCode("");
    forgotPasswordRecoveryRequestIdRef.current =
      null;
  }

  // ==========================================================
  // INPUT KEY HANDLING
  // ==========================================================

  // ==========================================================
  // MOBILE KEYBOARD FOCUSED INPUT REVEAL
  // ==========================================================

  function handleLoginInputFocus(
    event: ReactFocusEvent<HTMLInputElement>,
  ): void {

    const target =
      event.currentTarget;

    const coarsePointer =
      window.matchMedia(
        "(pointer: coarse)",
      ).matches;

    const compactViewport =
      window.innerWidth <= 900;

    if (
      !coarsePointer &&
      !compactViewport
    ) {

      return;

    }

    const reveal =
      (): void => {

        if (
          document.activeElement !==
          target
        ) {

          return;

        }

        target.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "nearest",
        });

      };

    window.requestAnimationFrame(
      reveal,
    );

    window.setTimeout(
      reveal,
      180,
    );

    window.setTimeout(
      reveal,
      420,
    );

  }


  function handlePasswordKeyDown(
    event: ReactKeyboardEvent<HTMLInputElement>,
  ): void {

    if (event.key === "Enter") {

      handleLogin();

    }

  }


  // ==========================================================
  // DROPDOWN HELPERS
  // ==========================================================

  const storageLabel =
    ownerStorage === "usb"
      ? "USB Storage"
      : "USB Storage";

  const storageIcon =
    ownerStorage === "usb"
      ? <Usb />
      : <HardDrive />;

  // ==========================================================
  // FINORA_P1_685H_LIVE_STATUS
  // API and PostgreSQL reachability only, never authorization.
  const [finoraLiveStatus, setFinoraLiveStatus] =
    useState<"CHECKING" | "LOGIN NOT READY" | "OFFLINE">("CHECKING");

  useEffect(() => {
    let mounted = true;
    let controller: AbortController | null = null;

    const checkServer = async () => {
      controller?.abort();
      const current = new AbortController();
      controller = current;

      try {
        const host = window as Window & {
          finoraLoginHealth?: {
            check: () => Promise<{ live: boolean }>;
          };
        };

        let live = false;

        if (host.finoraLoginHealth?.check) {
          // Windows Electron: Main Process avoids browser CORS.
          const result = await host.finoraLoginHealth.check();
          live = result.live === true;
        } else {
                    // FINORA_P1_693T_ANDROID_HEALTH
          // Native HTTPS avoids Android WebView CORS.
          // LIVE requires genuine HTTP 200 from both health endpoints.
          const { Capacitor, registerPlugin } =
            await import("@capacitor/core");

          if (
            Capacitor.isNativePlatform() &&
            Capacitor.getPlatform() === "android"
          ) {
            const healthPlugin = registerPlugin<{
              checkServerHealth: () => Promise<{ live: boolean }>;
            }>("FinoraControl");

            const result = await healthPlugin.checkServerHealth();
            live = result?.live === true;
          } else {
            const responses = await Promise.all(
              ["/health", "/db-health"].map((endpoint) =>
                fetch(
                  `https://api.finoraenterprise.com${endpoint}`,
                  {
                    method: "GET",
                    cache: "no-store",
                    signal: current.signal,
                  },
                ),
              ),
            );
            live = responses.every((response) => response.ok);
          }
        }

        if (mounted && controller === current) {
          setFinoraLiveStatus(live ? "LOGIN NOT READY" : "OFFLINE");
        }
      } catch {
        if (mounted && controller === current) {
          setFinoraLiveStatus("OFFLINE");
        }
      }
    };

    void checkServer();

    const interval = window.setInterval(() => {
      void checkServer();
    }, 15000);

    return () => {
      mounted = false;
      window.clearInterval(interval);
      controller?.abort();
    };
  }, []);
  // LOGIN THEME SELECTION
  // ==========================================================

  function handleLoginThemeChange(
    themeId:
      LoginThemeId,
  ): void {

    setLoginThemeId(
      themeId,
    );

    setTheme(
      themeId as ThemeId,
    );

    setOpenDropdown(
      null,
    );

    setError(
      "",
    );

  }


  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <div
      style={
        loginStyles.container
      }
    >

      {/* ====================================================
          LOGIN CARD
      ==================================================== */}

      <div
        style={
          loginStyles.card
        }
        ref={dropdownRef}
      >

        {/* ==================================================
            HEADER
        ================================================== */}

        <div
          style={
            loginStyles.header
          }
        >

           {/* ==================================================
            FINORA LOGIN THEME PICKER
        ================================================== */}

        <div style={{ ...loginStyles.themePicker, position: "relative", width: "100%", justifyContent: "center", alignItems: "center" }} aria-label="FINORA login themes">

          {LOGIN_THEME_OPTIONS.map(
            option => {

              const isActive =
                loginThemeId ===
                option.id;

              return (

                <button
                  key={
                    option.id
                  }

                  type="button"

                  aria-label={
                    `Use ${option.name} theme`
                  }

                  aria-pressed={
                    isActive
                  }

                  title={
                    option.name
                  }

                  onClick={() => {
                    handleLoginThemeChange(
                      option.id,
                    );
                  }}

                  style={
                    isActive
                      ? loginStyles.themeOptionActive
                      : loginStyles.themeOption
                  }
                >

                  <span
                    style={
                      getLoginThemeSwatchStyle(
                        option.swatch,
                        isActive,
                        activeLoginTheme,
                      )
                    }
                  />

                  <span
                    style={
                      loginStyles.themeOptionLabel
                    }
                  >
                    {option.name}
                  </span>

                </button>

              );

            },
          )}

                  {/* FINORA_P1_685H_THEME_STATUS */}
          <span
            role="status"
            aria-live="polite"
            title="FINORA API and PostgreSQL connectivity"
            style={{
              ...loginStyles.themeOptionActive,
              position: "absolute",
              right: 0,
              top: "50%",
              transform: "translateY(-50%)",
              marginLeft: 0,
              display: "inline-flex",
              flexDirection: "row",
              flexWrap: "nowrap",
              alignItems: "center",
              justifyContent: "center",
              gap: 5,
              padding: "5px 9px",
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 700,
              whiteSpace: "nowrap",
              lineHeight: 1,
              color:
                false
                  ? "#16844b"
                  : finoraLiveStatus === "OFFLINE"
                    ? "#dc3545"
                    : "#727b86",
              borderColor:
                false
                  ? "#16844b"
                  : finoraLiveStatus === "OFFLINE"
                    ? "#dc3545"
                    : "#727b86",
            }}
          >
            <span aria-hidden="true" style={{ fontSize: 15, lineHeight: 1 }}>●</span>
            {finoraLiveStatus}
          </span>
</div>

          <div
            style={
              loginStyles.logo
            }
          >

            <img
              src={
                finoraLogo
              }
              alt="FINORA Enterprise"
              style={
                loginStyles.logoImage
              }
            />

          </div>

        </div>

        {/* ==================================================
            ERP BUSINESS DATE
            Hidden from Login UI; backend Business Date remains active.
        ================================================== */}

        <div
          aria-hidden="true"
          style={{
            ...loginStyles.fieldSection,
            display: "none",
          }}
        >

          <div
            style={
              loginStyles.fieldLabel
            }
          >
            Choose Login Date
          </div>


          <div
            className="finora-login-business-date"
            style={
              loginStyles.inputWrapper
            }
          >
            <FinoraCalendar
              value={
                businessDate
              }
              onChange={(
                nextDate,
              ) => {
                setBusinessDate(
                  nextDate,
                );

                setError("");
              }}
              max={
                getCurrentLocalBusinessDate()
              }
              allowClear={
                false
              }
              allowToday
              showRelativeDay
              placeholder="DD/MM/YYYY"
              ariaLabel="Choose Login Date"
              themeOverride={{
                page:
                  activeLoginTheme.background,

                surface:
                  activeLoginTheme.surface,

                surfaceMuted:
                  activeLoginTheme.surfaceSoft,

                textPrimary:
                  activeLoginTheme.text,

                textSecondary:
                  activeLoginTheme.textSoft,

                textMuted:
                  activeLoginTheme.textFaint,

                brand:
                  activeLoginTheme.primary,

                border:
                  activeLoginTheme.border,

                borderStrong:
                  activeLoginTheme.borderStrong,

                shadow:
                  activeLoginTheme.shadow,
              }}
            />
          </div>

        </div>




        {/* ==================================================
            OWNER LOGIN
        ================================================== */}


            <div
              style={
                loginStyles.fieldSection
              }
            >

              <div
                style={
                  loginStyles.fieldLabel
                }
              >Storage <span style={{ marginLeft: 6, fontSize: "inherit", fontWeight: "inherit" }}> - Owner authentication - FINORA Pendrive</span></div>


              <div
                style={
                  loginStyles.customSelect
                }
              >

                <button
                  type="button"
                  aria-haspopup="listbox"
                  aria-expanded={
                    openDropdown === "storage"
                  }
                  onClick={() => {
                    setOpenDropdown(
                      current =>
                        current === "storage"
                          ? null
                          : "storage",
                    );
                  }}
                  style={
                    loginStyles.customSelectButton
                  }
                >

                  <span
                    style={
                      loginStyles.customSelectValue
                    }
                  >
                    <span
                      style={
                        loginStyles.customSelectIcon
                      }
                    >
                      {storageIcon}
                    </span>
                    <span>
                      {storageLabel}
                    </span>
                  </span>

                  <span
                    style={
                      loginStyles.customSelectChevron
                    }
                  >
                    <ChevronDown />
                  </span>

                </button>


                {openDropdown === "storage" && (

                  <div
                    role="listbox"
                    style={
                      loginStyles.customSelectMenu
                    }
                  >

                    <button
                      type="button"
                      role="option"
                      aria-selected={
                        ownerStorage === "usb"
                      }
                      onClick={() => {
                        handleStorageChange("usb");
                      }}
                      style={
                        ownerStorage === "usb"
                          ? loginStyles.customSelectOptionActive
                          : loginStyles.customSelectOption
                      }
                    >
                      <Usb />
                      <span>USB Storage</span>
                    </button>


                    <button
                      type="button"
                      role="option"
                      aria-selected={false}
                      onClick={() => {
                        /*
                         * Multi-branch owner flow:
                         * keep USB mode, clear any typed credentials, then
                         * reuse the existing native FINORA USB/folder picker.
                         *
                         * LOCAL support remains available in the backend for
                         * a future release; it is intentionally hidden here.
                         */
                        handleStorageChange("usb");
                        void handleRequestUsbAccess();
                      }}
                      style={
                        loginStyles.customSelectOption
                      }
                    >
                      <HardDrive />
                      <span>Change USB Storage</span>
                    </button>


                  </div>

                )}

              </div>

            </div>


            {/* ==============================================
                USB STATUS
            ============================================== */}

            {!usbChecking &&
              ownerStorage === "usb" && (

              <div
                style={
                  {
                    ...loginStyles.usbStatus,
                    ...getUsbStatusStyle(
                      usbAvailable,
                      activeLoginTheme,
                    ),
                  }
                }
              >

                <div
                  style={
                    loginStyles.usbStatusRow
                  }
                >

                  <span
                    style={
                      getUsbStatusIndicatorStyle(
                        usbChecking,
                        usbAvailable,
                        activeLoginTheme,
                      )
                    }
                  />

                  <span
                    style={
                      loginStyles.usbStatusText
                    }
                  >
                    {usbAvailable
                      ? "FINORA USB Detected"
                      : "FINORA USB Not Detected"}
                  </span>

                </div>

                <div
                  style={
                    loginStyles.usbMessage
                  }
                >
                  {usbMessage}
                  {usbAvailable && usbStoragePath && (
                    <div style={{ marginTop: "4px", fontSize: "12px", opacity: 0.78, wordBreak: "break-all" }}>
                      USB Storage: {usbStoragePath}
                    </div>
                  )}
                </div>

                {(
                  usbAvailability === "NOT_CONFIGURED" ||
                  usbAvailability === "DISCONNECTED"
                ) &&
                  getFinoraUsbBridge()?.requestAccess && (

                  <button
                    type="button"
                    onClick={() => {
                      void handleRequestUsbAccess();
                    }}
                    disabled={
                      usbAccessBusy
                    }
                    style={
                      loginStyles.secondaryButton
                    }
                  >

                    <span
                      style={
                        loginStyles.secondaryButtonContent
                      }
                    >
                      <Usb />
                      <span>
                        {usbAccessBusy
                          ? "Opening USB Picker..."
                          : usbAvailability === "DISCONNECTED"
                            ? "Reconnect USB Storage"
                            : "Select USB Storage"}
                      </span>
                    </span>

                  </button>

                )}

              </div>

            )}


            {/* FINORA_P1_679D_WALLET_DISPLAY */}
            {accountWalletStatus !== "NOT_AUTHENTICATED" && (
              <section
                aria-label="FINORA Account Wallet"
                style={{
                  padding: "16px",
                  margin: "14px 0",
                  borderRadius: "12px",
                  border: `1px solid ${activeLoginTheme.borderStrong}`,
                  background: activeLoginTheme.surface,
                  color: activeLoginTheme.text,
                }}
              >
                <strong>FINORA Account Dashboard</strong>
                <p>Account Status: Authenticated</p>
                <p>
                  Wallet Balance: {
                    accountWalletBalance !== null
                      ? `₹${accountWalletBalance}`
                      : "Unavailable"
                  }
                </p>
                <p>
                  Wallet Status: {accountWalletStatus}
                </p>
                <small>
                  Server Account/Wallet access only.
                  Business records require separate authorization.
                </small>
                              {/* FINORA_P1_679O_SUBSCRIPTION_DISPLAY */}
                <div>
                  <strong>Subscription Plans</strong>
                  <p>Pricing Status: {accountPricingStatus}</p>
                  {accountPricingStatus === "VERIFIED" && (
                    <>
                      {accountSubscriptionPlans.map(plan => (
                        <p key={plan.months}>
                          {plan.months} Month(s):
                          {" ₹"}{plan.offerPriceInr}
                        </p>
                      ))}
                      <p>
                        Current Subscription: {
                          accountSubscription?.status ?? "NONE"
                        }
                      </p>
                      <p>
                        Expiry: {
                          accountSubscription?.expiresAt ?? "Not available"
                        }
                      </p>
                      <p>
                        Days Remaining: {
                          accountSubscription?.daysRemaining ?? "N/A"
                        }
                      </p>
                    </>
                  )}
                </div>
</section>
            )}
            {/* ==============================================
                OWNER MODE NOTICE
            ============================================== */}

            <div
              style={{
                display: "contents",
              }}
            >

              <div style={{ display: "none" }}>
                {ownerStorage === "usb"
                  ? <Usb />
                  : <HardDrive />}

                <span>
                  {ownerStorage === "usb"
                    ? "USB Owner Login"
                    : "Local Owner Login"}
                </span>
              </div>


              <div
                style={
                  loginStyles.modeNoticeSubtext
                }
              >
                {securityCodeRecoveryMode && (
                  <section
                    aria-labelledby="finora-security-code-recovery-title"
                    style={{
              // P1-685U: Modal position only; preserve existing form styles.
              position: "fixed",
              zIndex: 10000,
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              maxWidth: "calc(100vw - 32px)",
              maxHeight: "calc(100dvh - 32px)",
              overflowY: "auto",
              margin: 0,
                      width: "min(420px, calc(100vw - 32px))",
                      marginTop: "18px",
                      marginBottom: "18px",
                      padding: responsive.isMobile ? "18px" : "22px",
                      border: `1px solid ${activeLoginTheme.borderStrong}`,
                      borderRadius: responsive.isMobile ? "14px" : "16px",
                      background: activeLoginTheme.surface,
                      color: activeLoginTheme.text,
                      boxSizing: "border-box",
                    }}
                  >
                    <h2 id="finora-security-code-recovery-title" style={{ margin: 0 }}>
                      Recover Security Code
                    </h2>
                    <p style={{ margin: "7px 0 18px", color: activeLoginTheme.textSoft }}>
                      Verify your current Password, then create a new local Security Code.
                    </p>

                    <div style={{ display: "grid", gap: "12px" }}>
                      <input
                        type="text"
                        value={username}
                        onChange={(event) => {
                          setUsername(event.target.value);
                          securityCodeRecoveryRequestIdRef.current = null;
                          setSecurityCodeRecoveryError(undefined);
                          setSecurityCodeRecoverySuccess(undefined);
                        }}
                        placeholder="User ID"
                        autoComplete="username"
                        disabled={securityCodeRecoveryBusy}
                        style={loginCredentialInputStyle}
                      />

                      <div style={loginStyles.inputWrapper}>
                      <input
                        type={showSecurityCodeRecoveryPassword ? "text" : "password"}
                        value={securityCodeRecoveryPassword}
                        onChange={(event) => {
                          setSecurityCodeRecoveryPassword(event.target.value);
                          securityCodeRecoveryRequestIdRef.current = null;
                          setSecurityCodeRecoveryError(undefined);
                          setSecurityCodeRecoverySuccess(undefined);
                        }}
                        placeholder="Current Password"
                        autoComplete="current-password"
                        disabled={securityCodeRecoveryBusy}
                        style={{ ...(loginCredentialInputStyle), paddingRight: "48px" }}
                      />
                    <button
                      type="button"
                      style={loginStyles.passwordToggle}
                      onClick={() =>
                        setShowSecurityCodeRecoveryPassword((visible) => !visible)
                      }
                      aria-label={showSecurityCodeRecoveryPassword ? "Hide Current Password" : "Show Current Password"}
                    >
                      {showSecurityCodeRecoveryPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                      </div>

                      <div style={loginStyles.inputWrapper}>
                      <input
                        type={showSecurityCodeRecoveryNewCode ? "text" : "password"}
                        value={securityCodeRecoveryNewCode}
                        onChange={(event) => {
                          setSecurityCodeRecoveryNewCode(event.target.value);
                          securityCodeRecoveryRequestIdRef.current = null;
                          setSecurityCodeRecoveryError(undefined);
                          setSecurityCodeRecoverySuccess(undefined);
                        }}
                        placeholder="New Security Code"
                        disabled={securityCodeRecoveryBusy}
                        style={{ ...(loginCredentialInputStyle), paddingRight: "48px" }}
                      />
                    <button
                      type="button"
                      style={loginStyles.passwordToggle}
                      onClick={() =>
                        setShowSecurityCodeRecoveryNewCode((visible) => !visible)
                      }
                      aria-label={showSecurityCodeRecoveryNewCode ? "Hide New Security Code" : "Show New Security Code"}
                    >
                      {showSecurityCodeRecoveryNewCode ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                      </div>

                      <div style={loginStyles.inputWrapper}>
                      <input
                        type={showSecurityCodeRecoveryConfirmCode ? "text" : "password"}
                        value={securityCodeRecoveryConfirmCode}
                        onChange={(event) => {
                          setSecurityCodeRecoveryConfirmCode(event.target.value);
                          securityCodeRecoveryRequestIdRef.current = null;
                          setSecurityCodeRecoveryError(undefined);
                          setSecurityCodeRecoverySuccess(undefined);
                        }}
                        placeholder="Confirm New Security Code"
                        disabled={securityCodeRecoveryBusy}
                        style={{ ...(loginCredentialInputStyle), paddingRight: "48px" }}
                      />
                    <button
                      type="button"
                      style={loginStyles.passwordToggle}
                      onClick={() =>
                        setShowSecurityCodeRecoveryConfirmCode((visible) => !visible)
                      }
                      aria-label={showSecurityCodeRecoveryConfirmCode ? "Hide Confirm New Security Code" : "Show Confirm New Security Code"}
                    >
                      {showSecurityCodeRecoveryConfirmCode ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                      </div>

                      {securityCodeRecoveryError && (
                        <div role="alert">{securityCodeRecoveryError}</div>
                      )}

                      {securityCodeRecoverySuccess && (
                        <div role="status">{securityCodeRecoverySuccess}</div>
                      )}

                      <button
                        type="button"
                        onClick={() => void submitSecurityCodeRecovery()}
                        disabled={securityCodeRecoveryBusy}
                        style={loginStyles.primaryButton}
                      >
                        {securityCodeRecoveryBusy ? "Recovering..." : "Recover Security Code"}
                      </button>

                      <button
                        type="button"
                        onClick={closeSecurityCodeRecoveryMode}
                        disabled={securityCodeRecoveryBusy}
                        style={loginStyles.forgotPassword}
                      >
                        Back to Login
                      </button>
                    </div>
                  </section>
                )}

                {forgotPasswordMode && (
            <section
              aria-labelledby="finora-change-password-title"
              style={{
              // P1-685U: Modal position only; preserve existing form styles.
              position: "fixed",
              zIndex: 10000,
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              maxWidth: "calc(100vw - 32px)",
              maxHeight: "calc(100dvh - 32px)",
              overflowY: "auto",
              margin: 0,
                width: "min(420px, calc(100vw - 32px))",
                marginTop: "18px",
                marginBottom: "18px",
                padding: responsive.isMobile
                  ? "18px"
                  : "22px",
                border:
                  `1px solid ${activeLoginTheme.borderStrong}`,
                borderRadius:
                  responsive.isMobile
                    ? "14px"
                    : "16px",
                background:
                  activeLoginTheme.surface,
                color:
                  activeLoginTheme.text,
                boxShadow:
                  `0 18px 42px ${activeLoginTheme.shadow}`,
                boxSizing: "border-box",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: "14px",
                  marginBottom: "18px",
                }}
              >
                <div
                  style={{
                    minWidth: 0,
                  }}
                >
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "7px",
                    }}
                  >
                    <KeyRound
                      size={18}
                      strokeWidth={2}
                      color={
                        activeLoginTheme.primary
                      }
                      aria-hidden="true"
                    />

                    <span
                      style={{
                        color:
                          activeLoginTheme.primary,
                        fontSize: "10px",
                        fontWeight: 800,
                        letterSpacing:
                          "0.1em",
                        textTransform:
                          "uppercase",
                      }}
                    >
                      Account Security
                    </span>
                  </div>

                  <h2
                    id="finora-change-password-title"
                    style={{
                      margin: 0,
                      color:
                        activeLoginTheme.text,
                      fontSize:
                        responsive.isMobile
                          ? "18px"
                          : "20px",
                      fontWeight: 800,
                      letterSpacing:
                        "-0.02em",
                      lineHeight: 1.2,
                    }}
                  >
                    Reset Password
                  </h2>

                  <p
                    style={{
                      margin:
                        "7px 0 0",
                      maxWidth: "52ch",
                      color:
                        activeLoginTheme.textSoft,
                      fontSize: "12px",
                      fontWeight: 500,
                      lineHeight: 1.55,
                    }}
                  >
                    Verify your current Security Code, then create a new Password.
                  </p>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gap: "12px",
                }}
              >
                <label
                  style={{
                    display: "grid",
                    gap: "7px",
                  }}
                >
                  <span
                    style={{
                      color:
                        activeLoginTheme.textSoft,
                      fontSize: "10px",
                      fontWeight: 750,
                      letterSpacing:
                        "0.08em",
                      textTransform:
                        "uppercase",
                    }}
                  >
                    User ID
                  </span>

                  <div
                    style={{
                      ...loginStyles.inputWrapper,
                      border:
                        `1px solid ${activeLoginTheme.border}`,
                      borderRadius: "12px",
                      background:
                        activeLoginTheme.surfaceSoft,
                    }}
                  >
                    <span style={loginStyles.inputIcon}>
                      <UserRound />
                    </span>

                    <input
                      type="text"
                      value={username}
                      onChange={(event) => {
                        setUsername(event.target.value);
                        forgotPasswordRecoveryRequestIdRef.current =
                          null;
                        setForgotPasswordError(
                          undefined,
                        );
                        setForgotPasswordSuccess(
                          undefined,
                        );
                      }}
                      placeholder="Enter User ID"
                      aria-label="Reset Password User ID"
                      autoComplete="username"
                      disabled={
                        forgotPasswordBusy
                      }
                      style={{
                        ...loginCredentialInputStyle,
                        width: "100%",
                        minHeight: "46px",
                        border: "none",
                        background:
                          "transparent",
                        color:
                          activeLoginTheme.text,
                        boxShadow: "none",
                      }}
                    />
                  </div>
                </label>

                <label
                  style={{
                    display: "grid",
                    gap: "7px",
                  }}
                >
                  <span
                    style={{
                      color:
                        activeLoginTheme.textSoft,
                      fontSize: "10px",
                      fontWeight: 750,
                      letterSpacing:
                        "0.08em",
                      textTransform:
                        "uppercase",
                    }}
                  >
                    Confirm New Password
                  </span>

                  <div
                    style={{
                      ...loginStyles.inputWrapper,
                      border:
                        `1px solid ${activeLoginTheme.border}`,
                      borderRadius: "12px",
                      background:
                        activeLoginTheme.surfaceSoft,
                    }}
                  >
                    <input
                      type={showForgotConfirmNewPassword ? "text" : "password"}
                      value={
                        forgotConfirmNewPassword
                      }
                      onChange={(event) => {
                        setForgotConfirmNewPassword(
                          event.target.value,
                        );
                        forgotPasswordRecoveryRequestIdRef.current =
                          null;
                        setForgotPasswordError(
                          undefined,
                        );
                        setForgotPasswordSuccess(
                          undefined,
                        );
                      }}
                      placeholder="Confirm new password"
                      aria-label="Confirm New Password"
                      autoComplete="new-password"
                      disabled={
                        forgotPasswordBusy
                      }
                      style={{
                        ...loginCredentialInputStyle,
                        width: "100%",
                        minHeight: "46px",
                        border: "none",
                        background:
                          "transparent",
                        color:
                          activeLoginTheme.text,
                        boxShadow: "none",
                        paddingRight: "48px",
                      }}
                    />
                    <button
                      type="button"
                      aria-label={showForgotConfirmNewPassword ? "Hide Confirm New Password" : "Show Confirm New Password"}
                      onClick={() => {
                        setShowForgotConfirmNewPassword(
                          (current) => !current,
                        );
                      }}
                      onMouseDown={(event) => {
                        event.preventDefault();
                      }}
                      style={loginStyles.passwordToggle}
                    >
                      {showForgotConfirmNewPassword
                        ? <EyeOff />
                        : <Eye />}
                    </button>
                  </div>
                </label>

                <label
                  style={{
                    display: "grid",
                    gap: "7px",
                  }}
                >
                  <span
                    style={{
                      color:
                        activeLoginTheme.textSoft,
                      fontSize: "10px",
                      fontWeight: 750,
                      letterSpacing:
                        "0.08em",
                      textTransform:
                        "uppercase",
                    }}
                  >
                    New Password
                  </span>

                  <div
                    style={{
                      ...loginStyles.inputWrapper,
                      border:
                        `1px solid ${activeLoginTheme.border}`,
                      borderRadius: "12px",
                      background:
                        activeLoginTheme.surfaceSoft,
                    }}
                  >
                    <input
                      type={showForgotNewPassword ? "text" : "password"}
                      value={
                        forgotNewPassword
                      }
                      onChange={(event) => {
                        setForgotNewPassword(
                          event.target.value,
                        );
                        forgotPasswordRecoveryRequestIdRef.current =
                          null;
                        setForgotPasswordError(
                          undefined,
                        );
                        setForgotPasswordSuccess(
                          undefined,
                        );
                      }}
                      placeholder="Enter new password"
                      aria-label="New Password"
                      autoComplete="new-password"
                      disabled={
                        forgotPasswordBusy
                      }
                      style={{
                        ...loginCredentialInputStyle,
                        width: "100%",
                        minHeight: "46px",
                        border: "none",
                        background:
                          "transparent",
                        color:
                          activeLoginTheme.text,
                        boxShadow: "none",
                        paddingRight: "48px",
                      }}
                    />
                    <button
                      type="button"
                      aria-label={showForgotNewPassword ? "Hide New Password" : "Show New Password"}
                      onClick={() => {
                        setShowForgotNewPassword(
                          (current) => !current,
                        );
                      }}
                      onMouseDown={(event) => {
                        event.preventDefault();
                      }}
                      style={loginStyles.passwordToggle}
                    >
                      {showForgotNewPassword
                        ? <EyeOff />
                        : <Eye />}
                    </button>
                  </div>
                </label>

                <label
                  style={{
                    display: "grid",
                    gap: "7px",
                  }}
                >
                  <span
                    style={{
                      color:
                        activeLoginTheme.textSoft,
                      fontSize: "10px",
                      fontWeight: 750,
                      letterSpacing:
                        "0.08em",
                      textTransform:
                        "uppercase",
                    }}
                  >
                    Security Code
                  </span>

                  <div
                    style={{
                      ...loginStyles.inputWrapper,
                      border:
                        `1px solid ${activeLoginTheme.border}`,
                      borderRadius: "12px",
                      background:
                        activeLoginTheme.surfaceSoft,
                    }}
                  >
                    <input
                      type={showForgotSecurityCode ? "text" : "password"}
                      value={
                        forgotSecurityCode
                      }
                      onChange={(event) => {
                        setForgotSecurityCode(
                          event.target.value,
                        );
                        forgotPasswordRecoveryRequestIdRef.current =
                          null;
                        setForgotPasswordError(
                          undefined,
                        );
                        setForgotPasswordSuccess(
                          undefined,
                        );
                      }}
                      placeholder="Enter Security Code"
                      aria-label="Security Code"
                      autoComplete="off"
                      disabled={
                        forgotPasswordBusy
                      }
                      style={{
                        ...loginCredentialInputStyle,
                        width: "100%",
                        minHeight: "46px",
                        border: "none",
                        background:
                          "transparent",
                        color:
                          activeLoginTheme.text,
                        boxShadow: "none",
                        paddingRight: "48px",
                      }}
                    />
                    <button
                      type="button"
                      aria-label={showForgotSecurityCode ? "Hide Security Code" : "Show Security Code"}
                      onClick={() => {
                        setShowForgotSecurityCode(
                          (current) => !current,
                        );
                      }}
                      onMouseDown={(event) => {
                        event.preventDefault();
                      }}
                      style={loginStyles.passwordToggle}
                    >
                      {showForgotSecurityCode
                        ? <EyeOff />
                        : <Eye />}
                    </button>
                  </div>
                </label>

                {/* FINORA_P1_579BN_RESET_STATUS_COLORS */}
                {forgotPasswordError && (
                  <div
                    role="alert"
                    style={{
                      marginTop: "2px",
                      padding:
                        "10px 12px",
                      border:
                        "1px solid #ef4444",
                      borderRadius: "10px",
                      background:
                        "color-mix(in srgb, #ef4444 14%, " + activeLoginTheme.surfaceSoft + ")",
                      color:
                        "#f87171",
                      fontSize: "12px",
                      lineHeight: 1.5,
                    }}
                  >
                    {forgotPasswordError}
                  </div>
                )}

                {forgotPasswordSuccess && (
                  <div
                    role="status"
                    style={{
                      marginTop: "2px",
                      padding:
                        "10px 12px",
                      border:
                        "1px solid #22c55e",
                      borderRadius: "10px",
                      background:
                        "color-mix(in srgb, #22c55e 14%, " + activeLoginTheme.surfaceSoft + ")",
                      color:
                        "#4ade80",
                      fontSize: "12px",
                      lineHeight: 1.5,
                    }}
                  >
                    {forgotPasswordSuccess}
                  </div>
                )}

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      responsive.isMobile
                        ? "1fr"
                        : "minmax(0, 1.15fr) minmax(0, 0.85fr)",
                    gap: "10px",
                    marginTop: "4px",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      void submitForgotPasswordRecovery();
                    }}
                    disabled={
                      forgotPasswordBusy
                    }
                    style={{
                      minHeight: "46px",
                      padding:
                        "0 18px",
                      border:
                        `1px solid ${activeLoginTheme.borderStrong}`,
                      borderRadius: "12px",
                      background:
                        activeLoginTheme.primary,
                      color:
                        "#FFFFFF",
                      font: "inherit",
                      fontSize: "12px",
                      fontWeight: 800,
                      letterSpacing:
                        "0.01em",
                      cursor:
                        forgotPasswordBusy
                          ? "wait"
                          : "pointer",
                      boxShadow:
                        `0 8px 20px ${activeLoginTheme.shadow}`,
                    }}
                  >
                    {forgotPasswordBusy
                      ? "Updating..."
                      : "Reset Password"}
                  </button>

                  <button
                    type="button"
                    onClick={returnToLoginMode}
                    disabled={loginBusy}
                    style={{
                      minHeight: "46px",
                      padding:
                        "0 18px",
                      border:
                        `1px solid ${activeLoginTheme.border}`,
                      borderRadius: "12px",
                      background:
                        activeLoginTheme.surfaceSoft,
                      color:
                        activeLoginTheme.text,
                      font: "inherit",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor:
                        forgotPasswordBusy
                          ? "not-allowed"
                          : "pointer",
                    }}
                  >
                    Back to Login
                  </button>
                </div>
              </div>
            </section>
          )}
          {ownerStorage === "usb"
                    ? ""
                    : "Owner authentication - Local storage"}
              </div>

            </div>


            {/* ==============================================
                OWNER CREDENTIALS
            ============================================== */}

            <div
              style={
                loginStyles.inputGroup
              }
            >

              <div
                style={
                  loginStyles.inputWrapper
                }
              >

                <span
                  style={
                    loginStyles.inputIcon
                  }
                >
                  <UserRound />
                </span>

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

                    if (forgotPasswordMode) {
                      forgotPasswordRecoveryRequestIdRef.current =
                        null;
                    }
                    setDeviceSecurityCodeRequired(
                      false,
                    );
                    setDeviceSecurityCode("");
                    setError("");
                  }}
                  placeholder="User ID"
                  aria-label="User ID"
                  autoComplete="username"
                  autoFocus
                  disabled={
                      loginBusy ||
                      credentialMode === "FORCE_CREDENTIAL_CHANGE"
                    }
                  onFocus={
                    handleLoginInputFocus
                  }
                  style={
                    loginPrimaryCredentialInputStyle
                  }
                />

              </div>


              <div
                style={
                  loginStyles.inputWrapper
                }
              >

                <span
                  style={
                    loginStyles.inputIcon
                  }
                >
                  <LockKeyhole />
                </span>

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

                    if (
                      credentialMode ===
                        "FORCE_CREDENTIAL_CHANGE"
                    ) {
                      firstLoginRotationRequestIdRef.current =
                        null;
                    }

                    setDeviceSecurityCodeRequired(
                      false,
                    );
                    setDeviceSecurityCode("");
                    setError("");
                  }}
                  placeholder={
                    credentialMode === "FORCE_CREDENTIAL_CHANGE"
                      ? "New Password"
                      : "Password"
                  }
                  aria-label={
                    credentialMode === "FORCE_CREDENTIAL_CHANGE"
                      ? "New Password"
                      : "Password"
                  }
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  autoComplete={
                    credentialMode === "FORCE_CREDENTIAL_CHANGE"
                      ? "new-password"
                      : "current-password"
                  }
                  disabled={loginBusy}
                  onKeyDown={
                    handlePasswordKeyDown
                  }
                  onFocus={
                    handleLoginInputFocus
                  }
                  style={
                    loginPrimaryCredentialInputStyle
                  }
                />


                <button
                  type="button"
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                  onClick={() => {
                    setShowPassword(
                      current =>
                        !current,
                    );
                  }}
                  onMouseDown={(
                    event,
                  ) => {
                    event.preventDefault();
                  }}                  style={
                    loginStyles.passwordToggle
                  }
                >
                  {showPassword
                    ? <EyeOff />
                    : <Eye />}
                </button>

              </div>


              {credentialMode === "FORCE_CREDENTIAL_CHANGE" && (

                <div
                  style={
                    loginStyles.inputWrapper
                  }
                >

                  <span
                    style={
                      loginStyles.inputIcon
                    }
                  >
                    <LockKeyhole />
                  </span>

                  <input
                    value={
                      confirmPassword
                    }
                    onChange={(
                      event,
                    ) => {
                      setConfirmPassword(
                        event.target.value,
                      );
                      setError("");
                    }}
                    placeholder="Confirm Password"
                    aria-label="Confirm Password"
                    type={
                      showConfirmPermanentPassword
                        ? "text"
                        : "password"
                    }
                    autoComplete="new-password"
                    disabled={loginBusy}
                    onKeyDown={
                      handlePasswordKeyDown
                    }
                    onFocus={
                      handleLoginInputFocus
                    }
                    style={
                      loginStyles.input
                    }
                  />

                  <button
                    type="button"
                    aria-label={
                      showConfirmPermanentPassword
                        ? "Hide Confirm Password"
                        : "Show Confirm Password"
                    }
                    onClick={() => {
                      setShowConfirmPermanentPassword(
                        current =>
                          !current,
                      );
                    }}
                    onMouseDown={(event) => {
                      event.preventDefault();
                    }}
                    style={
                      loginStyles.passwordToggle
                    }
                  >
                    {showConfirmPermanentPassword
                      ? <EyeOff />
                      : <Eye />}
                  </button>

                </div>

              )}

              {credentialMode === "FORCE_CREDENTIAL_CHANGE" && (

                <div
                  style={
                    loginStyles.inputWrapper
                  }
                >

                  <span
                    style={
                      loginStyles.inputIcon
                    }
                  >
                    <LockKeyhole />
                  </span>

                  <input
                    value={
                      securityCode
                    }
                    onChange={(
                      event,
                    ) => {
                      setSecurityCode(
                        event.target.value,
                      );

                      firstLoginRotationRequestIdRef.current =
                        null;

                      setError("");
                    }}
                    placeholder="Security Code"
                    aria-label="Security Code"
                    type={
                      showPermanentSecurityCode
                        ? "text"
                        : "password"
                    }
                    autoComplete="new-password"
                    disabled={loginBusy}
                    onKeyDown={
                      handlePasswordKeyDown
                    }
                    onFocus={
                      handleLoginInputFocus
                    }
                    style={
                      loginStyles.input
                    }
                  />

                  <button
                    type="button"
                    aria-label={
                      showPermanentSecurityCode
                        ? "Hide Security Code"
                        : "Show Security Code"
                    }
                    onClick={() => {
                      setShowPermanentSecurityCode(
                        current =>
                          !current,
                      );
                    }}
                    onMouseDown={(event) => {
                      event.preventDefault();
                    }}
                    style={
                      loginStyles.passwordToggle
                    }
                  >
                    {showPermanentSecurityCode
                      ? <EyeOff />
                      : <Eye />}
                  </button>

                </div>

              )}

              {credentialMode === "FORCE_CREDENTIAL_CHANGE" && (

                <div
                  style={
                    loginStyles.inputWrapper
                  }
                >

                  <span
                    style={
                      loginStyles.inputIcon
                    }
                  >
                    <LockKeyhole />
                  </span>

                  <input
                    value={
                      confirmSecurityCode
                    }
                    onChange={(
                      event,
                    ) => {
                      setConfirmSecurityCode(
                        event.target.value,
                      );
                      setError("");
                    }}
                    placeholder="Confirm Security Code"
                    aria-label="Confirm Security Code"
                    type={
                      showConfirmPermanentSecurityCode
                        ? "text"
                        : "password"
                    }
                    autoComplete="new-password"
                    disabled={loginBusy}
                    onKeyDown={
                      handlePasswordKeyDown
                    }
                    onFocus={
                      handleLoginInputFocus
                    }
                    style={
                      loginStyles.input
                    }
                  />

                  <button
                    type="button"
                    aria-label={
                      showConfirmPermanentSecurityCode
                        ? "Hide Confirm Security Code"
                        : "Show Confirm Security Code"
                    }
                    onClick={() => {
                      setShowConfirmPermanentSecurityCode(
                        current =>
                          !current,
                      );
                    }}
                    onMouseDown={(event) => {
                      event.preventDefault();
                    }}
                    style={
                      loginStyles.passwordToggle
                    }
                  >
                    {showConfirmPermanentSecurityCode
                      ? <EyeOff />
                      : <Eye />}
                  </button>

                </div>

              )}

              {credentialMode === "RESTORE_BACKUP" && (

                <div
                  style={
                    loginStyles.inputWrapper
                  }
                >

                  <span
                    style={
                      loginStyles.inputIcon
                    }
                  >
                    <LockKeyhole />
                  </span>

                  <input
                    value={
                      securityCode
                    }
                    onChange={(
                      event,
                    ) => {
                      setSecurityCode(
                        event.target.value,
                      );
                      setError("");
                    }}
                    placeholder="Security Code"
                    aria-label="Restore Security Code"
                    type="password"
                    autoComplete="off"
                    disabled={
                      loginBusy

                    }
                    onKeyDown={
                      handlePasswordKeyDown
                    }
                    onFocus={
                      handleLoginInputFocus
                    }
                    style={
                      loginStyles.input
                    }
                  />

                </div>

              )}

            </div>


            {false && credentialMode === "LOGIN" &&
              legacySecurityCodeSetupRequired && (
                <>
                  <div
                    style={
                      loginStyles.inputWrapper
                    }
                  >
                    <input
                      value={securityCode}
                      onChange={(event) => {
                        setSecurityCode(event.target.value);
                        setError("");
                      }}
                      placeholder="Create Security Code"
                      aria-label="Create Branch Security Code"
                      type={
                        showLegacySecurityCode
                          ? "text"
                          : "password"
                      }
                      autoComplete="new-password"
                      disabled={loginBusy}
                      onKeyDown={handlePasswordKeyDown}
                      style={loginStyles.input}
                    />

                    <button
                      type="button"
                      aria-label={
                        showLegacySecurityCode
                          ? "Hide Security Code"
                          : "Show Security Code"
                      }
                      onClick={() => {
                        setShowLegacySecurityCode(
                          current =>
                            !current,
                        );
                      }}
                      onMouseDown={(event) => {
                        event.preventDefault();
                      }}
                      style={
                        loginStyles.passwordToggle
                      }
                    >
                      {showLegacySecurityCode
                        ? <EyeOff />
                        : <Eye />}
                    </button>
                  </div>

                  <input
                    value={confirmSecurityCode}
                    onChange={(event) => {
                      setConfirmSecurityCode(event.target.value);
                      setError("");
                    }}
                    placeholder="Confirm Security Code"
                    aria-label="Confirm Branch Security Code"
                    type="password"
                    autoComplete="new-password"
                    disabled={loginBusy}
                    onKeyDown={handlePasswordKeyDown}
                    style={loginStyles.input}
                  />
                </>
              )}



{/* FINORA_P1_579NM_WALLET_ACTIVATION */}
{false && credentialMode === "LOGIN" &&
  !legacySecurityCodeSetupRequired &&
  getFinoraServerWalletBridge() !== null && (
    <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
      <label style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <input
          type="checkbox"
          checked={activateWalletOnce}
          onChange={(event) => {
            setActivateWalletOnce(event.target.checked);
            if (!event.target.checked) setWalletEnrollmentCode("");
            setError("");
          }}
          disabled={loginBusy}
        />
        Activate Server Wallet (Owner - first time only)
      </label>
      {activateWalletOnce && (
        <>
          <input
            type="password"
            value={walletEnrollmentCode}
            onChange={(event) => {
              setWalletEnrollmentCode(event.target.value);
              setError("");
            }}
            placeholder="Wallet activation Security Code"
            aria-label="Wallet activation Security Code"
            autoComplete="off"
            maxLength={128}
            disabled={loginBusy}
            onKeyDown={handlePasswordKeyDown}
            style={loginStyles.input}
          />
          <span style={{ fontSize: 12 }}>
            One-time server verification. Normal future logins do not require this code.
          </span>
        </>
      )}
    </div>
  )}

{/* FINORA_NEW_DEVICE_SECURITY_CHALLENGE */}

{credentialMode === "LOGIN" && deviceSecurityCodeRequired && (
                <div
                  style={
                    loginStyles.inputWrapper
                  }
                >
                  <span
                    style={
                      loginStyles.inputIcon
                    }
                  >
                    <LockKeyhole />
                  </span>

                  <input
                    value={
                      deviceSecurityCode
                    }
                    onChange={(
                      event,
                    ) => {
                      setDeviceSecurityCode(
                        event.target.value,
                      );
                      setError("");
                    }}
                    placeholder="Security Code"
                    aria-label="Device Security Code"
                    type={
                      showDeviceSecurityCode
                        ? "text"
                        : "password"
                    }
                    autoComplete="off"
                    disabled={loginBusy}
                    onKeyDown={
                      handlePasswordKeyDown
                    }
                    onFocus={
                      handleLoginInputFocus
                    }
                    style={
                      loginCredentialInputStyle
                    }
                  />

                  <button
                    type="button"
                    aria-label={
                      showDeviceSecurityCode
                        ? "Hide Security Code"
                        : "Show Security Code"
                    }
                    onClick={() => {
                      setShowDeviceSecurityCode(
                        current =>
                          !current,
                      );
                    }}
                    onMouseDown={(
                      event,
                    ) => {
                      event.preventDefault();
                    }}
                    style={
                      loginStyles.passwordToggle
                    }
                  >
                    {showDeviceSecurityCode
                      ? <EyeOff />
                      : <Eye />}
                  </button>
                </div>
              )}
{credentialEnrollmentMessage && (

              <p
                role="status"
                style={
                  loginStyles.modeNoticeSubtext
                }
              >
                {credentialEnrollmentMessage}
              </p>

            )}


            {error && (

              <p
                role="alert"
                style={
                  loginStyles.error
                }
              >
                {error}
              </p>

            )}


            <button
              type="button"
              onClick={
                credentialMode === "FORCE_CREDENTIAL_CHANGE"
                  ? completeRequiredCredentialChange
                  : handleLogin
              }
              disabled={loginBusy}
              style={
                loginStyles.primaryButton
              }
            >

              <span
                style={
                  loginStyles.primaryButtonContent
                }
              >
                <KeyRound />
                <span>
                  {loginBusy
                    ? credentialMode === "FORCE_CREDENTIAL_CHANGE"
                      ? "Saving Permanent Credentials..."
                      : credentialMode === "RESTORE_BACKUP"
                        ? "Restoring Backup..."
                        : "Authenticating..."
                    : credentialMode === "FORCE_CREDENTIAL_CHANGE"
                      ? "Save Permanent Credentials"
                      : credentialMode === "RESTORE_BACKUP"
                        ? "Restore Branch Backup"
                        : "Login"}
                </span>
              </span>

            </button>


            {credentialMode === "LOGIN"
              ? (
                  <>



                    <button
                      type="button"
                      onClick={
                        handleForgotPassword
                      }
                      disabled={
                      loginBusy

                    }
                      style={
                        loginStyles.forgotPassword
                      }
                    >
                      Forgot Password?
                    </button>
                    <button
                      type="button"
                      onClick={openSecurityCodeRecoveryMode}
                      disabled={loginBusy || securityCodeRecoveryBusy}
                      style={loginStyles.forgotPassword}
                    >
                      Recover Security Code
                    </button>
                    <button
                      type="button"
                      onClick={
                        openRestoreBackupMode
                      }
                      disabled={
                      loginBusy

                    }
                      style={
                        loginStyles.forgotPassword
                      }
                    >
                      Restore Branch Backup
                    </button>

                  </>
                )
              : (
                  <button
                    type="button"
                    onClick={
                      credentialMode === "FORCE_CREDENTIAL_CHANGE"
                        ? undefined
                        : returnToLoginMode
                    }
                    disabled={
                      loginBusy ||
                      credentialMode === "FORCE_CREDENTIAL_CHANGE"
                    }
                    style={
                      loginStyles.forgotPassword
                    }
                  >
                    Back to Login
                  </button>
                )}




      </div>

    </div>

  );

}


// ============================================================
// END
// ============================================================
