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
// - Provide one clean login surface for Owner and Customer
// - Owner selects Local / USB storage
// - Customer selects Customer ID / Mobile OTP login
// - USB Login requires a detected FINORA Pendrive
// - Local Owner Login uses the existing authStore authentication
// - Customer flow is prepared as a non-editable placeholder
// - Forgot Password entry points are prepared for every login path
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
// - Customer Login is UI-ready only until customer authentication is enabled.
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
  MessageCircle,
  ShieldCheck,
  Smartphone,
  UserRound,
  UsersRound,
  Usb,
  HardDrive,
} from "lucide-react";

import {
  authenticateLogin,
  commitLoginSession,
} from "../../store/authStore";

import {
  hasActiveFinoraStorageEntitlement,
} from "../../services/activation/activationService";

import {
  storageManager,
} from "../../storage/storageManager";

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


type LoginRole =
  | "owner"
  | "customer";


type OwnerStorage =
  | "local"
  | "usb";


type CustomerLoginMethod =
  | "customerId"
  | "mobile";


type UsbStatus = {

  availability?:
    string;

  storageId?:
    string;

  message?:
    string;

};


type UsbBridge = {

  isAvailable?:
    () => Promise<boolean>;

  getStatus?:
    () => Promise<UsbStatus>;

};


type FinoraWindow = {

  finora?: {

    usb?:
      UsbBridge;

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

  return runtimeWindow
    .finora
    ?.usb;

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
  // ROLE STATE
  // ==========================================================

  const [
    loginRole,
    setLoginRole,
  ] = useState<LoginRole>(
    "owner",
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
  // CUSTOMER LOGIN METHOD
  // ==========================================================

  const [
    customerLoginMethod,
    setCustomerLoginMethod,
  ] = useState<CustomerLoginMethod>(
    "customerId",
  );


  // ==========================================================
  // DROPDOWN STATE
  // ==========================================================

  const [
    openDropdown,
    setOpenDropdown,
  ] = useState<
    "role" | "storage" | "customerMethod" | null
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
    mobileNumber,
    setMobileNumber,
  ] = useState("");

  const [
    otp,
    setOtp,
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
          getUsbBridge();


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

    setMobileNumber("");

    setOtp("");

    setShowPassword(false);

    setError("");

    setLoginBusy(false);

  }


  // ==========================================================
  // ROLE CHANGE
  // ==========================================================

  function handleRoleChange(
    role: LoginRole,
  ): void {

    setLoginRole(role);

    setOpenDropdown(null);

    resetCredentials();

    if (role === "customer") {

      setCustomerLoginMethod("customerId");

    }

  }


  // ==========================================================
  // STORAGE CHANGE
  // ==========================================================

  function handleStorageChange(
    storage: OwnerStorage,
  ): void {

    setOwnerStorage(storage);

    setOpenDropdown(null);

    resetCredentials();

  }


  // ==========================================================
  // CUSTOMER METHOD CHANGE
  // ==========================================================

  function handleCustomerMethodChange(
    method: CustomerLoginMethod,
  ): void {

    setCustomerLoginMethod(method);

    setOpenDropdown(null);

    resetCredentials();

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
  // OWNER AUTHENTICATION
  // ==========================================================

  async function authenticateOwner(): Promise<void> {

    setError("");

    const trimmedUsername =
      username.trim();



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


    try {

      // ======================================================
      // 1. VERIFY CREDENTIALS
      //
      // This creates a candidate session only.
      //
      // No authenticated session is persisted yet.
      // ======================================================

      const session =
        authenticateLogin({
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


      // ======================================================
      // 2. VALIDATE BUSINESS ACCESS IDENTITY
      // ======================================================

      if (
        !session.userId ||
        !session.ownerId ||
        !session.businessId ||
        !session.branchId
      ) {

        setError(
          "This FINORA login does not have a complete business access identity.",
        );

        return;

      }


      // ======================================================
      // 3. RESOLVE COMMERCIAL STORAGE ENTITLEMENT MODE
      //
      // Entitlement modes deliberately support LOCAL / USB
      // only.
      // ======================================================

      const entitlementStorageMode =
        ownerStorage === "usb"
          ? "USB"
          : "LOCAL";


      // ======================================================
      // 4. VERIFY PER-LOGIN STORAGE ENTITLEMENT
      // ======================================================

      const entitlementResult =
        await hasActiveFinoraStorageEntitlement(
          session.userId,
          session.ownerId,
          session.businessId,
          session.branchId,
          entitlementStorageMode,
        );


      if (!entitlementResult.success) {

        setError(
          entitlementResult.error ??
            "Unable to verify FINORA storage entitlement.",
        );

        return;

      }


      if (entitlementResult.data !== true) {

        setError(
          ownerStorage === "usb"
            ? "This FINORA login does not have an active USB Storage entitlement."
            : "This FINORA login does not have an active Local Storage entitlement.",
        );

        return;

      }


      // ======================================================
      // 5. ACTIVATE SELECTED OPERATIONAL STORAGE
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
      // 6. PRESERVE AUTHENTICATED STORAGE MODE
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
      // 7. COMMIT AUTHENTICATED SESSION
      //
      // Only now:
      // - Persist finora_session
      // - Create successful LOGIN audit
      // ======================================================

      commitLoginSession(
        session,
      );


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

      setLoginBusy(false);

    }

  }

  // ==========================================================
  // LOGIN CLICK
  // ==========================================================

  function handleLogin(): void {

    if (loginRole === "customer") {

      showComingSoon(
        "Customer Login is coming soon. Customer authentication wiring will be enabled here.",
      );

      return;

    }


    void authenticateOwner();

  }


  // ==========================================================
  // FORGOT PASSWORD
  // ==========================================================

  function handleForgotPassword(): void {

    if (loginRole === "customer") {

      showComingSoon(
        "Customer password recovery is coming soon.",
      );

      return;

    }


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

  const roleLabel =
    loginRole === "owner"
      ? "Owner"
      : "Customer";

  const roleIcon =
    loginRole === "owner"
      ? <ShieldCheck />
      : <UsersRound />;

  const storageLabel =
    ownerStorage === "usb"
      ? "USB Storage"
      : "Local Storage";

  const storageIcon =
    ownerStorage === "usb"
      ? <Usb />
      : <HardDrive />;

  const customerMethodLabel =
    customerLoginMethod === "customerId"
      ? "Customer ID"
      : "Mobile Number";

  const customerMethodIcon =
    customerLoginMethod === "customerId"
      ? <UserRound />
      : <Smartphone />;


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
            LOGIN ROLE
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
            Login As
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
                openDropdown === "role"
              }
              onClick={() => {
                setOpenDropdown(
                  current =>
                    current === "role"
                      ? null
                      : "role",
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
                  {roleIcon}
                </span>

                <span>
                  {roleLabel}
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


            {openDropdown === "role" && (

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
                    loginRole === "owner"
                  }
                  onClick={() => {
                    handleRoleChange("owner");
                  }}
                  style={
                    loginRole === "owner"
                      ? loginStyles.customSelectOptionActive
                      : loginStyles.customSelectOption
                  }
                >
                  <ShieldCheck />
                  <span>Owner</span>
                </button>


                <button
                  type="button"
                  role="option"
                  aria-selected={
                    loginRole === "customer"
                  }
                  onClick={() => {
                    handleRoleChange("customer");
                  }}
                  style={
                    loginRole === "customer"
                      ? loginStyles.customSelectOptionActive
                      : loginStyles.customSelectOption
                  }
                >
                  <UsersRound />
                  <span>Customer</span>
                </button>

              </div>

            )}

          </div>

        </div>


        {/* ==================================================
            OWNER LOGIN
        ================================================== */}

        {loginRole === "owner" && (

          <>

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
                {ownerStorage === "usb"
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
                    setError("");
                  }}
                  placeholder="Password"
                  aria-label="Password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  autoComplete="current-password"
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

            </div>


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
                    ? "Authenticating..."
                    : "Login"}
                </span>
              </span>

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

          </>

        )}


        {/* ==================================================
            CUSTOMER LOGIN
        ================================================== */}

        {loginRole === "customer" && (

          <>

            <div
              style={
                loginStyles.modeNoticeNormal
              }
            >

              <div
                style={
                  loginStyles.modeNoticeHeader
                }
              >
                <UsersRound />
                <span>
                  Customer Login
                </span>
              </div>

              <div
                style={
                  loginStyles.modeNoticeSubtext
                }
              >
                Secure customer access • Authentication ready
              </div>

            </div>


            {/* ==============================================
                CUSTOMER LOGIN METHOD
            ============================================== */}

            <div
              style={
                loginStyles.fieldSectionCompact
              }
            >

              <div
                style={
                  loginStyles.fieldLabel
                }
              >
                Login Method
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
                    openDropdown === "customerMethod"
                  }
                  onClick={() => {
                    setOpenDropdown(
                      current =>
                        current === "customerMethod"
                          ? null
                          : "customerMethod",
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
                      {customerMethodIcon}
                    </span>
                    <span>
                      {customerMethodLabel}
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


                {openDropdown === "customerMethod" && (

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
                        customerLoginMethod === "customerId"
                      }
                      onClick={() => {
                        handleCustomerMethodChange("customerId");
                      }}
                      style={
                        customerLoginMethod === "customerId"
                          ? loginStyles.customSelectOptionActive
                          : loginStyles.customSelectOption
                      }
                    >
                      <UserRound />
                      <span>Customer ID</span>
                    </button>


                    <button
                      type="button"
                      role="option"
                      aria-selected={
                        customerLoginMethod === "mobile"
                      }
                      onClick={() => {
                        handleCustomerMethodChange("mobile");
                      }}
                      style={
                        customerLoginMethod === "mobile"
                          ? loginStyles.customSelectOptionActive
                          : loginStyles.customSelectOption
                      }
                    >
                      <Smartphone />
                      <span>Mobile Number</span>
                    </button>

                  </div>

                )}

              </div>

            </div>


            {/* ==============================================
                CUSTOMER ID LOGIN
            ============================================== */}

            {customerLoginMethod === "customerId" && (

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
                    value=""
                    placeholder="Customer ID"
                    aria-label="Customer ID"
                    disabled
                    style={
                      loginStyles.inputDisabled
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
                    value=""
                    placeholder="Password"
                    aria-label="Password"
                    type="password"
                    disabled
                    style={
                      loginStyles.inputDisabled
                    }
                  />

                  <Eye
                    style={
                      loginStyles.disabledPasswordIcon
                    }
                  />
                </div>

              </div>

            )}


            {/* ==============================================
                CUSTOMER MOBILE OTP LOGIN
            ============================================== */}

            {customerLoginMethod === "mobile" && (

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
                    <Smartphone />
                  </span>

                  <input
                    value={mobileNumber}
                    onChange={(
                      event,
                    ) => {
                      setMobileNumber(
                        event.target.value,
                      );
                      setError("");
                    }}
                    placeholder="Mobile Number"
                    aria-label="Mobile Number"
                    inputMode="numeric"
                    disabled
                    style={
                      loginStyles.inputDisabled
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
                    <MessageCircle />
                  </span>

                  <input
                    value={otp}
                    onChange={(
                      event,
                    ) => {
                      setOtp(
                        event.target.value,
                      );
                      setError("");
                    }}
                    placeholder="OTP"
                    aria-label="OTP"
                    inputMode="numeric"
                    disabled
                    style={
                      loginStyles.inputDisabled
                    }
                  />
                </div>

              </div>

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
                  Login
                </span>
              </span>

            </button>


            <button
              type="button"
              onClick={
                handleForgotPassword
              }
              style={
                loginStyles.forgotPassword
              }
            >
              Forgot Password?
            </button>

          </>

        )}


      </div>

    </div>

  );

}


// ============================================================
// END
// ============================================================