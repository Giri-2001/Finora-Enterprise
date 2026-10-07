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
  from "../../app/assets/finoraenterprise.png";


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

      const loginResult =
        await loginSessionBridge.login({
          username:
            trimmedUsername,

          password,

          storageMode:
            entitlementStorageMode,

          ...(legacySecurityCodeSetupRequired
            ? {
                securityCode,
              }
            : ownerStorage === "usb" &&
              deviceSecurityCode.trim().length > 0
            ? {
                securityCode:
          deviceSecurityCodeRequired
            ? deviceSecurityCode.trim()
            : undefined,
              }
            : {}),
        });

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
            "Invalid username or password",
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

  function handleLogin(): void {
if (
      credentialMode ===
        "RESTORE_BACKUP"
    ) {

      void restoreBranchBackup();

      return;
    }


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

        <div
          style={
            loginStyles.themePicker
          }
          aria-label="FINORA login themes"
        >

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
              >
                Storage
              </div>


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


            {/* ==============================================
                OWNER MODE NOTICE
            ============================================== */}

            <div
              style={
                ownerStorage === "usb"
                  ? loginStyles.modeNoticeUsb
                  : loginStyles.modeNoticeNormal
              }
            >

              <div
                style={
                  loginStyles.modeNoticeHeader
                }
              >
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
                {forgotPasswordMode && (
            <section
              aria-labelledby="finora-change-password-title"
              style={{
                width: "100%",
                marginTop: "18px",
                marginBottom: "18px",
                padding: responsive === "mobile"
                  ? "18px"
                  : "22px",
                border:
                  `1px solid ${activeLoginTheme.borderStrong}`,
                borderRadius:
                  responsive === "mobile"
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
                        responsive === "mobile"
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
                      type="password"
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
                      type="password"
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
                      type="password"
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
                      }}
                    />
                  </div>
                </label>

                {forgotPasswordError && (
                  <div
                    role="alert"
                    style={{
                      marginTop: "2px",
                      padding:
                        "10px 12px",
                      border:
                        `1px solid ${activeLoginTheme.border}`,
                      borderRadius: "10px",
                      background:
                        activeLoginTheme.surfaceSoft,
                      color:
                        activeLoginTheme.text,
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
                        `1px solid ${activeLoginTheme.borderStrong}`,
                      borderRadius: "10px",
                      background:
                        activeLoginTheme.surfaceSoft,
                      color:
                        activeLoginTheme.text,
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
                      responsive === "mobile"
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
                    ? "Owner authentication - FINORA Pendrive"
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
                      loginBusy ||
                      credentialMode === "FORCE_CREDENTIAL_CHANGE"
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


            {credentialMode === "LOGIN" &&
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



                        {/* FINORA_NEW_DEVICE_SECURITY_CHALLENGE */}
            {credentialMode === "LOGIN" &&
              deviceSecurityCodeRequired && (
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
                      loginBusy ||
                      credentialMode === "FORCE_CREDENTIAL_CHANGE"
                    }
                      style={
                        loginStyles.forgotPassword
                      }
                    >
                      Forgot Password?
                    </button>
                    <button
                      type="button"
                      onClick={
                        openRestoreBackupMode
                      }
                      disabled={
                      loginBusy ||
                      credentialMode === "FORCE_CREDENTIAL_CHANGE"
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
