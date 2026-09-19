import { getFinoraLoginSessionBridge } from "../../services/auth/loginSessionBridge";
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
  isAccountLocked,
  registerFailedLogin,
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
  2000;


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
    "local",
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
    credentialMode,
    setCredentialMode,
  ] = useState<
    "LOGIN" |
    "SET_PASSWORD" |
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
    showLegacySecurityCode,
    setShowLegacySecurityCode,
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

          setUsbMessage(
            available
              ? (
                status.message ??
                "FINORA USB detected."
              )
              : (
                status.message ??
                "FINORA Pendrive is not connected."
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

          setUsbAvailable(
            available,
          );

          setUsbMessage(
            available
              ? "FINORA USB detected."
              : "FINORA Pendrive is not connected.",
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

    setUsername("");

    setPassword("");


    setShowPassword(false);

    setError("");

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

      setUsbMessage(
        status.message ??
          (
            available
              ? "FINORA USB detected."
              : "FINORA USB is not ready."
          ),
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
      // 1. SUPPLEMENTAL LOCAL LOGIN LOCKOUT
      //
      // This remains renderer-local UX protection only.
      //
      // It is NOT credential or access authority.
      // ======================================================

      if (
        isAccountLocked(
          trimmedUsername,
        )
      ) {
        setError(
          "Invalid username or password",
        );

        return;
      }


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
          legacySecurityCodeLength > 128 ||
          securityCode.trim().length === 0
        ) {
          setError(
            "Security Code must contain between 8 and 128 characters.",
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

      if (
        deviceSecurityCodeRequired &&
        deviceSecurityCode.length === 0
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
            : deviceSecurityCodeRequired
              ? {
                  securityCode:
                    deviceSecurityCode,
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

          setDeviceSecurityCode("");

          setLegacySecurityCodeSetupRequired(false);
          setSecurityCode("");
          setConfirmSecurityCode("");

          registerFailedLogin(
            trimmedUsername,
          );

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
              "DEVICE_TRUST_FAILED"
              ? "Unable to authorize this device."
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
  // FIRST-TIME LOCAL CREDENTIAL ENROLLMENT
  //
  // SECURITY:
  //
  // - Renderer supplies username + password only.
  // - Signed pending authorization is resolved in Electron main.
  // - No authorization ID is exposed to this UI.
  // - Successful enrollment does NOT authenticate the user.
  // ==========================================================

  async function enrollOwnerCredential():
    Promise<void> {

    setError(
      "",
    );

    setCredentialEnrollmentMessage(
      "",
    );

    const trimmedUsername =
      username.trim();

    if (!trimmedUsername) {

      setError(
        "Enter your User ID.",
      );

      return;
    }


    const passwordLength =
      Array.from(
        password,
      ).length;


    if (
      passwordLength < 8 ||
      passwordLength > 128 ||
      password.trim().length === 0
    ) {

      setError(
        "Password must contain between 8 and 128 characters.",
      );

      return;
    }


    if (!confirmPassword) {

      setError(
        "Confirm your new password.",
      );

      return;
    }


    if (
      password !==
        confirmPassword
    ) {

      setError(
        "New Password and Confirm Password do not match.",
      );

      return;
    }


    const securityCodeLength =
      Array.from(
        securityCode,
      ).length;

    if (
      securityCodeLength <
        8 ||
      securityCodeLength >
        128 ||
      securityCode.trim().length ===
        0
    ) {
      setError(
        "Security Code must contain between 8 and 128 characters.",
      );

      return;
    }

    if (!confirmSecurityCode) {
      setError(
        "Confirm your Security Code.",
      );

      return;
    }

    if (
      securityCode !==
        confirmSecurityCode
    ) {
      setError(
        "Security Code and Confirm Security Code do not match.",
      );

      return;
    }

    const enrollCredential =
      window.finora?.credentials
        ?.enroll;


    if (
      typeof enrollCredential !==
        "function"
    ) {

      setError(
        "FINORA secure credential enrollment is unavailable in this application build.",
      );

      return;
    }


    setLoginBusy(
      true,
    );

    const processingId =
      startFinoraProcessing(
        "Creating secure FINORA password...",
      );


    try {

      const result =
        await enrollCredential({
          username:
            trimmedUsername,

          password,

          securityCode,
        });


      if (!result.success) {

        setError(
          result.error ??
            "Unable to create the FINORA password.",
        );

        return;
      }


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

      setCredentialMode(
        "LOGIN",
      );

      setCredentialEnrollmentMessage(
        "Password and Security Code created successfully. Sign in with your new password.",
      );

    } catch (enrollmentError) {

      console.error(
        "FINORA CREDENTIAL ENROLLMENT FAILED:",
        enrollmentError,
      );

      setError(
        "Unable to complete FINORA password setup.",
      );

    } finally {

      stopFinoraProcessing(
        processingId,
      );

      setLoginBusy(
        false,
      );

    }

  }


  // ==========================================================
  // CREDENTIAL MODE
  // ==========================================================

  function openSetPasswordMode(): void {

    setDeviceSecurityCodeRequired(false);

    setDeviceSecurityCode("");

    setCredentialMode(
      "SET_PASSWORD",
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


  function returnToLoginMode(): void {

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
        128 ||
      securityCode.trim().length ===
        0
    ) {

      setError(
        "Security Code must contain between 8 and 128 characters.",
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
        "SET_PASSWORD"
    ) {

      void enrollOwnerCredential();

      return;
    }


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


    if (ownerStorage === "usb") {

      showComingSoon(
        "USB Owner password recovery is coming soon.",
      );

      return;

    }



    showComingSoon(
      "Owner password recovery is coming soon.",
    );

  }


  // ==========================================================
  // INPUT KEY HANDLING
  // ==========================================================

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
      : "Local Storage";

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
                        ownerStorage === "local"
                      }
                      onClick={() => {
                        handleStorageChange("local");
                      }}
                      style={
                        ownerStorage === "local"
                          ? loginStyles.customSelectOptionActive
                          : loginStyles.customSelectOption
                      }
                    >
                      <HardDrive />
                      <span>Local Storage</span>
                    </button>


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


                  </div>

                )}

              </div>

            </div>


            {/* ==============================================
                USB STATUS — ONLY FOR USB OWNER LOGIN
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
                </div>

                {usbAvailability === "NOT_CONFIGURED" &&
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
                {credentialMode === "SET_PASSWORD"
                  ? "First-time setup • Create your secure password"
                  : ownerStorage === "usb"
                    ? "Owner authentication • FINORA Pendrive"
                    : "Owner authentication • Local storage"}
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
                    loginBusy
                  }
                  style={
                    loginStyles.input
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
                    setDeviceSecurityCodeRequired(
                      false,
                    );
                    setDeviceSecurityCode("");
                    setError("");
                  }}
                  placeholder={
                    credentialMode === "SET_PASSWORD"
                      ? "New Password"
                      : "Password"
                  }
                  aria-label={
                    credentialMode === "SET_PASSWORD"
                      ? "New Password"
                      : "Password"
                  }
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  autoComplete={
                    credentialMode === "SET_PASSWORD"
                      ? "new-password"
                      : "current-password"
                  }
                  disabled={
                    loginBusy
                  }
                  onKeyDown={
                    handlePasswordKeyDown
                  }
                  style={
                    loginStyles.input
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


              {credentialMode === "SET_PASSWORD" && (

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
                      showPassword
                        ? "text"
                        : "password"
                    }
                    autoComplete="new-password"
                    disabled={
                      loginBusy
                    }
                    onKeyDown={
                      handlePasswordKeyDown
                    }
                    style={
                      loginStyles.input
                    }
                  />

                </div>

              )}

              {credentialMode === "SET_PASSWORD" && (

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
                    aria-label="Security Code"
                    type="password"
                    autoComplete="new-password"
                    disabled={
                      loginBusy
                    }
                    onKeyDown={
                      handlePasswordKeyDown
                    }
                    style={
                      loginStyles.input
                    }
                  />

                </div>

              )}

              {credentialMode === "SET_PASSWORD" && (

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
                    type="password"
                    autoComplete="new-password"
                    disabled={
                      loginBusy
                    }
                    onKeyDown={
                      handlePasswordKeyDown
                    }
                    style={
                      loginStyles.input
                    }
                  />

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

            {credentialMode === "LOGIN" &&
              deviceSecurityCodeRequired && (
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
                  type="password"
                  autoComplete="off"
                  disabled={
                    loginBusy
                  }
                  onKeyDown={
                    handlePasswordKeyDown
                  }
                  style={
                    loginStyles.input
                  }
                />
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
                handleLogin
              }
              disabled={
                loginBusy
              }
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
                    ? credentialMode === "SET_PASSWORD"
                      ? "Creating Password..."
                      : credentialMode === "RESTORE_BACKUP"
                        ? "Restoring Backup..."
                        : "Authenticating..."
                    : credentialMode === "SET_PASSWORD"
                      ? "Set Password"
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
                        openSetPasswordMode
                      }
                      disabled={
                        loginBusy
                      }
                      style={
                        loginStyles.forgotPassword
                      }
                    >
                      Set Password
                    </button>

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
                      returnToLoginMode
                    }
                    disabled={
                      loginBusy
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
