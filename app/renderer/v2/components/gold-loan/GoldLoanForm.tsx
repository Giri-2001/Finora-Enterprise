/* ===========================================================
   FINORA ENTERPRISE OS™

   GOLD LOAN ENGINE™

   GOLD LOAN FORM

   MODULE  : Gold Loan
   LAYER   : Step-1 Orchestration / Presentation
   VERSION : 1.0
   STATUS  : Production Foundation

   RESPONSIBILITY:

   - Render Gold Loan Step 1
   - Reuse existing FINORA LoanCustomerCard
   - Render 30% Customer / 70% Locker workspace
   - Manage Gold Item draft state
   - Manage storage selection draft state
   - Manage Gold valuation / LTV values
   - Manage requested / sanctioned amounts
   - Manage Valuer / Appraiser information
   - Manage Bag / Packet / Seal references
   - Build exact physical custody locator
   - Validate Step-1 before continuation
   - Forward completed Step-1 data to parent
   - Connect active FINORA Theme Engine
   - Connect Gold Loan Responsive Engine

   IMPORTANT:

   - No persistence.
   - No repository access.
   - No direct StorageManager access.
   - No localStorage.
   - No responsive window calculations.
   - No native select controls.
   - No duplicate customer selector.
   - No document uploader in Step 1.
   - Step 3 existing Documents Studio remains authoritative.
   - Gold calculations come from goldCalculations.ts.
   - Storage mutation belongs to goldStorageService.ts.
   - Loan persistence belongs to goldLoanService.ts.

=========================================================== */

/* ===========================================================
   IMPORTS
=========================================================== */

import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BadgeIndianRupee,
  CalendarDays,
  FileImage,
  Gem,
  Hash,
  Landmark,
  MapPin,
  Percent,
  Scale,
  ShieldCheck,
  UserRound,
  WalletCards,
} from "lucide-react";

import { useEffect, useMemo, useState } from "react";

import type { ChangeEvent, CSSProperties } from "react";

import LoanCustomerCard from "../loans/details/LoanCustomerCard";

import type { LoanCustomerOption } from "../loans/details/LoanCustomerCard";

import {
  calculateGoldEligibleAmount,
  calculateGoldLoanItemTotals,
} from "../../services/gold-loan/goldCalculations";

import type { GoldLoanItem } from "../../types/gold-loan/goldLoan.types";

import type {
  GoldLockerId,
  GoldLockerRoomView,
  GoldLockerView,
  GoldRackId,
  GoldRackView,
  GoldRoomId,
} from "../../types/gold-loan/goldStorage.types";

import { useTheme } from "../../themes/provider";

import { getSession } from "../../store/authStore";

import {
  formatBusinessDateForDisplay,
  resolveBusinessDate,
} from "../../services/business/businessDateService";

import type { FinoraTheme } from "../../themes/core/types";

import {
  getGoldLoanModuleTokens,
  useGoldLoanResponsive,
} from "../../utils/responsive/goldloan/goldLoan.index";

import GoldItems from "./GoldItems";

import GoldLockerRoom from "./GoldLockerRoom";

import {
  getGoldLoanFieldStateStyle,
  getGoldLoanFormStyles,
  getGoldLoanLocatorStateStyle,
  getGoldLoanMoneyValueStyle,
  getGoldLoanPositiveValueStyle,
  getGoldLoanPrimaryActionStateStyle,
} from "./GoldLoanForm.styles";

/* ===========================================================
   THEME STYLE
=========================================================== */

type GoldLoanThemeStyle = CSSProperties & Record<`--${string}`, string>;

/* ===========================================================
   FINORA THEME VARIABLES

   Theme Registry remains authoritative.

   This function only exposes the active FinoraTheme through
   semantic CSS variables consumed by Gold Loan styles.
=========================================================== */

function createGoldLoanThemeVariables(theme: FinoraTheme): GoldLoanThemeStyle {
  return {
    "--finora-theme-brand-primary": theme.colors.brand.primary,

    "--finora-theme-brand-secondary": theme.colors.brand.secondary,

    "--finora-theme-brand-accent": theme.colors.brand.accent,

    "--finora-theme-brand-accent-soft": theme.colors.brand.accentSoft,

    "--finora-theme-brand-soft": theme.colors.brand.accentSoft,

    "--finora-theme-page": theme.colors.background.page,

    "--finora-theme-background-page": theme.colors.background.page,

    "--finora-theme-surface": theme.colors.background.surface,

    "--finora-theme-background-surface": theme.colors.background.surface,

    "--finora-theme-surface-muted": theme.colors.background.surfaceMuted,

    "--finora-theme-background-muted": theme.colors.background.surfaceMuted,

    "--finora-theme-background-surface-muted":
      theme.colors.background.surfaceMuted,

    "--finora-theme-surface-strong": theme.colors.background.surfaceStrong,

    "--finora-theme-text-primary": theme.colors.text.primary,

    "--finora-theme-text-secondary": theme.colors.text.secondary,

    "--finora-theme-text-body": theme.colors.text.secondary,

    "--finora-theme-text-muted": theme.colors.text.muted,

    "--finora-theme-text-inverse": theme.colors.text.inverse,

    "--finora-theme-border-default": theme.colors.border.default,

    "--finora-theme-border-strong": theme.colors.border.strong,

    "--finora-theme-border-subtle": theme.colors.border.subtle,

    "--finora-theme-focus": theme.colors.border.focus,

    "--finora-theme-success": theme.colors.status.success,

    "--finora-theme-success-soft": theme.colors.status.successSoft,

    "--finora-theme-success-border": theme.colors.border.strong,

    "--finora-theme-warning": theme.colors.status.warning,

    "--finora-theme-warning-soft": theme.colors.status.warningSoft,

    "--finora-theme-danger": theme.colors.status.danger,

    "--finora-theme-danger-soft": theme.colors.status.dangerSoft,

    "--finora-theme-info": theme.colors.status.info,

    "--finora-theme-info-soft": theme.colors.status.infoSoft,

    "--finora-theme-overlay-shadow": theme.colors.overlay.shadow,

    "--finora-theme-overlay-backdrop": theme.colors.overlay.backdrop,

    "--finora-theme-shadow-soft": theme.components.card.shadow,
  };
}

/* ===========================================================
   STEP-1 RESULT

   goldLoanService.ts will later convert this presentation
   snapshot into the persistent Gold Loan domain record.
=========================================================== */

export interface GoldLoanStepOneFormValue {
  customer: LoanCustomerOption;

  items: GoldLoanItem[];

  roomId: GoldRoomId;

  lockerId: GoldLockerId;

  rackId: GoldRackId;

  bagNumber: string;

  packetReference: string;

  sealReference: string;

  maxLtvPercentage: number;

  assessedValue: number;

  eligibleAmount: number;

  requestedAmount: number;

  sanctionedAmount: number;

  valuerName: string;

  valuerLicenseNumber: string;

  valuationDate: string;

  valuationRemarks: string;

  locationCode: string;
}

/* ===========================================================
   PROPS
=========================================================== */

export interface GoldLoanFormProps {
  customerOptions: LoanCustomerOption[];

  rooms: GoldLockerRoomView[];

  defaultMarketRatePerGram: number;

  defaultMaxLtvPercentage: number;

  initialCustomer?: LoanCustomerOption;

  onBack?: () => void;

  onContinue?: (value: GoldLoanStepOneFormValue) => void;

  onViewLocker?: (locker: GoldLockerView) => void;

  onViewRack?: (rack: GoldRackView) => void;
}

/* ===========================================================
   NUMERIC PARSER
=========================================================== */

function parsePositiveNumber(value: string): number {
  const normalized = value.replace(/,/g, "").trim();

  if (!normalized) {
    return 0;
  }

  const parsed = Number(normalized);

  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.max(0, parsed);
}

/* ===========================================================
   TODAY
=========================================================== */

function getTodayDate(): string {
  const today = new Date();

  const year = today.getFullYear();

  const month = String(today.getMonth() + 1).padStart(2, "0");

  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/* ===========================================================
   FORMAT MONEY
=========================================================== */

const GOLD_LOAN_MONEY_FORMATTER = new Intl.NumberFormat("en-IN", {
  style: "currency",

  currency: "INR",

  minimumFractionDigits: 0,

  maximumFractionDigits: 2,
});

function formatGoldLoanMoney(value: number): string {
  return GOLD_LOAN_MONEY_FORMATTER
    .format(Number.isFinite(value) ? value : 0)
    .replace("₹", "₹ ");
}

/* ===========================================================
   FORMAT WEIGHT
=========================================================== */

function formatGoldLoanWeight(value: number): string {
  return Number(value || 0).toFixed(3);
}

/* ===========================================================
   ROOM LOOKUP
=========================================================== */

function findGoldRoom(
  rooms: GoldLockerRoomView[],

  roomId: GoldRoomId | null,
): GoldLockerRoomView | null {
  if (!roomId) {
    return null;
  }

  return rooms.find((room) => room.configuration.id === roomId) ?? null;
}

/* ===========================================================
   LOCKER LOOKUP
=========================================================== */

function findGoldLocker(
  room: GoldLockerRoomView | null,

  lockerId: GoldLockerId | null,
): GoldLockerView | null {
  if (!room || !lockerId) {
    return null;
  }

  return (
    room.lockers.find((locker) => locker.configuration.id === lockerId) ?? null
  );
}

/* ===========================================================
   RACK LOOKUP
=========================================================== */

function findGoldRack(
  locker: GoldLockerView | null,

  rackId: GoldRackId | null,
): GoldRackView | null {
  if (!locker || !rackId) {
    return null;
  }

  return locker.racks.find((rack) => rack.configuration.id === rackId) ?? null;
}

/* ===========================================================
   LOCATION CODE
=========================================================== */

function buildGoldLocationCode(
  room: GoldLockerRoomView | null,

  locker: GoldLockerView | null,

  rack: GoldRackView | null,

  bagNumber: string,
): string {
  if (!room || !locker || !rack || !bagNumber.trim()) {
    return "Location incomplete";
  }

  const roomCode = `ROOM-${String(room.configuration.roomNumber).padStart(
    2,
    "0",
  )}`;

  const lockerCode = `LOCKER-${String(
    locker.configuration.lockerNumber,
  ).padStart(2, "0")}`;

  const rackCode = `RACK-${String(rack.configuration.rackNumber).padStart(
    2,
    "0",
  )}`;

  const bagCode = `BAG-${bagNumber.trim().padStart(3, "0")}`;

  return `${roomCode} → ${lockerCode} → ${rackCode} → ${bagCode}`;
}

/* ===========================================================
   VALIDATION INPUT
=========================================================== */

interface GoldStepOneValidationInput {
  customer: LoanCustomerOption | undefined;

  items: GoldLoanItem[];

  roomId: GoldRoomId | null;

  lockerId: GoldLockerId | null;

  rackId: GoldRackId | null;

  bagNumber: string;

  maxLtvPercentage: number;

  eligibleAmount: number;

  requestedAmount: number;

  sanctionedAmount: number;
}

/* ===========================================================
   STEP-1 VALIDATION

   This is presentation-level required-field validation only.

   Authoritative persistence/capacity validation will be
   repeated inside Gold services before save.
=========================================================== */

function validateGoldStepOne(input: GoldStepOneValidationInput): string[] {
  const errors: string[] = [];

  if (!input.customer?.customerId) {
    errors.push("Select a customer.");
  }

  if (input.items.length === 0) {
    errors.push("Add at least one pledged gold item.");
  }

  if (
    input.items.some(
      (item) => item.grossWeightGrams <= 0 || item.netWeightGrams <= 0,
    )
  ) {
    errors.push("Every gold item must have a valid positive gold weight.");
  }

  if (input.items.some((item) => item.marketRatePerGram <= 0)) {
    errors.push("Every gold item must have a valid fine-gold market rate.");
  }

  if (!input.roomId) {
    errors.push("Select a Gold Locker Room.");
  }

  if (!input.lockerId) {
    errors.push("Select an available Locker.");
  }

  if (!input.rackId) {
    errors.push("Select an available Rack.");
  }

  if (!input.bagNumber.trim()) {
    errors.push("Enter Bag / Packet number.");
  }

  if (input.maxLtvPercentage <= 0 || input.maxLtvPercentage > 100) {
    errors.push("Max LTV must be greater than 0 and not exceed 100%.");
  }

  if (input.eligibleAmount <= 0) {
    errors.push("Gold valuation must produce a positive eligible loan amount.");
  }

  if (input.requestedAmount <= 0) {
    errors.push("Enter the customer requested amount.");
  }

  if (input.requestedAmount > input.eligibleAmount) {
    errors.push(
      "Requested amount cannot exceed the eligible Gold Loan amount.",
    );
  }

  if (input.sanctionedAmount <= 0) {
    errors.push("Enter the sanctioned Gold Loan amount.");
  }

  if (input.sanctionedAmount > input.eligibleAmount) {
    errors.push(
      "Sanctioned amount cannot exceed the eligible Gold Loan amount.",
    );
  }

  return errors;
}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function GoldLoanForm(props: GoldLoanFormProps) {
  const {
    customerOptions,
    rooms,
    defaultMarketRatePerGram,
    defaultMaxLtvPercentage,
    initialCustomer,
    onBack,
    onContinue,
    onViewLocker,
    onViewRack,
  } = props;

  /* =========================================================
     THEME
  ========================================================= */

  const { theme } = useTheme();

  /* =========================================================
     RESPONSIVE
  ========================================================= */

  const responsive = useGoldLoanResponsive();

  const moduleTokens = getGoldLoanModuleTokens(responsive.device);

  const styles = getGoldLoanFormStyles({
    moduleTokens,

    topWorkspace: responsive.layout.topWorkspace,

    formLayout: responsive.layout.form,

    valuationLayout: responsive.layout.valuation,

    storageLayout: responsive.layout.storageAllocation,

    isMobile: responsive.isMobile,

    isTablet: responsive.isTablet,

    isLaptop: responsive.isLaptop,

    isDesktop: responsive.isDesktop,
  });

  /* =========================================================
     PAGE THEME
  ========================================================= */

  const themeVariables = createGoldLoanThemeVariables(theme);

  const themedPageStyle: GoldLoanThemeStyle = {
    ...styles.page,

    ...themeVariables,
  };

  /* =========================================================
     CUSTOMER
  ========================================================= */

  const [selectedCustomer, setSelectedCustomer] = useState<
    LoanCustomerOption | undefined
  >(initialCustomer);

  /* =========================================================
     GOLD ITEMS
  ========================================================= */

  const [items, setItems] = useState<GoldLoanItem[]>([]);

  /* =========================================================
     STORAGE SELECTION
  ========================================================= */

  const [selectedRoomId, setSelectedRoomId] = useState<GoldRoomId | null>(null);

  const [selectedLockerId, setSelectedLockerId] = useState<GoldLockerId | null>(
    null,
  );

  const [selectedRackId, setSelectedRackId] = useState<GoldRackId | null>(null);

  const [bagNumber, setBagNumber] = useState("");

  const [packetReference, setPacketReference] = useState("");

  const [sealReference, setSealReference] = useState("");

  /* =========================================================
   DEFAULT STORAGE ROOM SYNCHRONIZATION
========================================================= */

  useEffect(() => {
    if (rooms.length === 0) {
      if (selectedRoomId !== null) {
        setSelectedRoomId(null);
        setSelectedLockerId(null);
        setSelectedRackId(null);
        setBagNumber("");
      }

      return;
    }

    const selectedRoomStillExists =
      selectedRoomId !== null &&
      rooms.some((room) => room.configuration.id === selectedRoomId);

    if (selectedRoomStillExists) {
      return;
    }

    setSelectedRoomId(rooms[0].configuration.id);

    setSelectedLockerId(null);
    setSelectedRackId(null);
    setBagNumber("");
  }, [rooms, selectedRoomId]);

  /* =========================================================
     LOAN / LTV
  ========================================================= */

  const [maxLtvPercentage, setMaxLtvPercentage] = useState(
    Math.max(0, defaultMaxLtvPercentage),
  );

  const [requestedAmount, setRequestedAmount] = useState(0);

  const [sanctionedAmount, setSanctionedAmount] = useState(0);

  /* =========================================================
     VALUER
  ========================================================= */

  const [valuerName, setValuerName] = useState("");

  const [valuerLicenseNumber, setValuerLicenseNumber] = useState("");

  const authenticatedSession =
    getSession();

  const valuationDate =
    resolveBusinessDate(
      authenticatedSession?.businessDate,
    ) ?? "";

  const valuationDateDisplay =
    formatBusinessDateForDisplay(
      valuationDate,
    ) || "--";

  const [valuationRemarks, setValuationRemarks] = useState("");

  /* =========================================================
     VALIDATION DISPLAY
  ========================================================= */

  const [showValidation, setShowValidation] = useState(false);

  /* =========================================================
     GOLD TOTALS
  ========================================================= */

  const totals = useMemo(() => calculateGoldLoanItemTotals(items), [items]);

  /* =========================================================
     ELIGIBLE AMOUNT

     Formula belongs to goldCalculations.ts.
  ========================================================= */

  const eligibleAmount = useMemo(
    () =>
      calculateGoldEligibleAmount(totals.totalAssessedValue, maxLtvPercentage),
    [maxLtvPercentage, totals.totalAssessedValue],
  );

  /* =========================================================
     SELECTED STORAGE OBJECTS
  ========================================================= */

  const selectedRoom = useMemo(
    () => findGoldRoom(rooms, selectedRoomId),
    [rooms, selectedRoomId],
  );

  const selectedLocker = useMemo(
    () => findGoldLocker(selectedRoom, selectedLockerId),
    [selectedLockerId, selectedRoom],
  );

  const selectedRack = useMemo(
    () => findGoldRack(selectedLocker, selectedRackId),
    [selectedLocker, selectedRackId],
  );

  /* =========================================================
     LOCATION CODE
  ========================================================= */

  const locationCode = useMemo(
    () =>
      buildGoldLocationCode(
        selectedRoom,
        selectedLocker,
        selectedRack,
        bagNumber,
      ),
    [bagNumber, selectedLocker, selectedRack, selectedRoom],
  );

  /* =========================================================
     LOCATOR READY
  ========================================================= */

  const locatorReady = Boolean(
    selectedRoom && selectedLocker && selectedRack && bagNumber.trim(),
  );

  /* =========================================================
     VALIDATION
  ========================================================= */

  const validationErrors = useMemo(
    () =>
      validateGoldStepOne({
        customer: selectedCustomer,

        items,

        roomId: selectedRoomId,

        lockerId: selectedLockerId,

        rackId: selectedRackId,

        bagNumber,

        maxLtvPercentage,

        eligibleAmount,

        requestedAmount,

        sanctionedAmount,
      }),
    [
      bagNumber,
      eligibleAmount,
      items,
      maxLtvPercentage,
      requestedAmount,
      sanctionedAmount,
      selectedCustomer,
      selectedLockerId,
      selectedRackId,
      selectedRoomId,
    ],
  );

  /* =========================================================
     DYNAMIC PRESENTATION STATES
  ========================================================= */

  const ltvInvalid = maxLtvPercentage <= 0 || maxLtvPercentage > 100;

  const requestedInvalid =
    requestedAmount <= 0 || requestedAmount > eligibleAmount;

  const sanctionedInvalid =
    sanctionedAmount <= 0 || sanctionedAmount > eligibleAmount;

  const bagInvalid = !bagNumber.trim();

  const ltvControlStyle = {
    ...styles.controlShell,

    ...getGoldLoanFieldStateStyle({
      focused: false,

      invalid: showValidation && ltvInvalid,

      readOnly: false,
    }),
  };

  const requestedControlStyle = {
    ...styles.controlShell,

    ...getGoldLoanFieldStateStyle({
      focused: false,

      invalid: showValidation && requestedInvalid,

      readOnly: false,
    }),
  };

  const sanctionedControlStyle = {
    ...styles.controlShell,

    ...getGoldLoanFieldStateStyle({
      focused: false,

      invalid: showValidation && sanctionedInvalid,

      readOnly: false,
    }),
  };

  const bagControlStyle = {
    ...styles.controlShell,

    ...getGoldLoanFieldStateStyle({
      focused: false,

      invalid: showValidation && bagInvalid,

      readOnly: false,
    }),
  };

  const locatorStyle = {
    ...styles.locator,

    ...getGoldLoanLocatorStateStyle({
      ready: locatorReady,
    }),
  };

  const primaryActionStyle = {
    ...styles.primaryButton,

    ...getGoldLoanPrimaryActionStateStyle({
      disabled: validationErrors.length > 0,
    }),
  };
const eligibleValueStyle = {
    ...styles.amountMetricValue,

    ...getGoldLoanPositiveValueStyle(),
  };

  /* =========================================================
     ITEMS CHANGE
  ========================================================= */

  function handleItemsChange(nextItems: GoldLoanItem[]): void {
    setItems(nextItems);

    setShowValidation(false);
  }

  /* =========================================================
     ROOM SELECT
  ========================================================= */

  function handleRoomSelect(room: GoldLockerRoomView): void {
    setSelectedRoomId(room.configuration.id);

    setSelectedLockerId(null);

    setSelectedRackId(null);

    setBagNumber("");

    setShowValidation(false);
  }

  /* =========================================================
     LOCKER SELECT
  ========================================================= */

  function handleLockerSelect(locker: GoldLockerView): void {
    setSelectedRoomId(locker.configuration.roomId);

    setSelectedLockerId(locker.configuration.id);

    setSelectedRackId(null);

    setBagNumber("");

    setShowValidation(false);
  }

  /* =========================================================
     RACK SELECT

     Parent verifies hierarchy before accepting Rack selection.

     This prevents a Rack opened only through VIEW mode from
     accidentally becoming an allocation Rack belonging to a
     different selected Locker.
  ========================================================= */

  function handleRackSelect(rack: GoldRackView): void {
    if (!selectedLockerId || rack.configuration.lockerId !== selectedLockerId) {
      return;
    }

    setSelectedRackId(rack.configuration.id);

    setBagNumber("");

    setShowValidation(false);
  }

  /* =========================================================
     VIEW LOCKER
  ========================================================= */

  function handleViewLocker(locker: GoldLockerView): void {
    onViewLocker?.(locker);
  }

  /* =========================================================
     VIEW RACK
  ========================================================= */

  function handleViewRack(rack: GoldRackView): void {
    onViewRack?.(rack);
  }

  /* =========================================================
     NUMERIC FIELD
  ========================================================= */

  function handleNumericFieldChange(
    event: ChangeEvent<HTMLInputElement>,

    setter: (value: number) => void,
  ): void {
    setter(parsePositiveNumber(event.target.value));

    setShowValidation(false);
  }

  /* =========================================================
     CONTINUE
  ========================================================= */

  function handleContinue(): void {
    if (validationErrors.length > 0) {
      setShowValidation(true);

      return;
    }

    if (
      !selectedCustomer ||
      !selectedRoomId ||
      !selectedLockerId ||
      !selectedRackId
    ) {
      setShowValidation(true);

      return;
    }

    onContinue?.({
      customer: selectedCustomer,

      items,

      roomId: selectedRoomId,

      lockerId: selectedLockerId,

      rackId: selectedRackId,

      bagNumber: bagNumber.trim(),

      packetReference: packetReference.trim(),

      sealReference: sealReference.trim(),

      maxLtvPercentage,

      assessedValue: totals.totalAssessedValue,

      eligibleAmount,

      requestedAmount,

      sanctionedAmount,

      valuerName: valuerName.trim(),

      valuerLicenseNumber: valuerLicenseNumber.trim(),

      valuationDate: valuationDate.trim(),

      valuationRemarks: valuationRemarks.trim(),

      locationCode,
    });
  }

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <main style={themedPageStyle}>
      <div style={styles.pageInner}>
        {/* ===================================================
            PAGE HEADER
        =================================================== */}


        {/* ===================================================
            30 / 70 TOP WORKSPACE
        =================================================== */}

        <section style={styles.topWorkspace}>
          {/* =================================================
              EXISTING CUSTOMER SELECTOR

              IMPORTANT:
              This is the same LoanCustomerCard already used
              by production Loan Studio Step 1.
          ================================================= */}

          <div style={styles.lockerPanel}>
            <LoanCustomerCard
              customerName={selectedCustomer?.customerName ?? ""}
              customerId={selectedCustomer?.customerId ?? ""}
              phoneNumber={selectedCustomer?.phoneNumber ?? ""}
              photo={selectedCustomer?.photo}
              customers={customerOptions}
              onCustomerSelect={setSelectedCustomer}
            />
          </div>

          {/* =================================================
              GOLD LOCKER ROOM — 70%
          ================================================= */}

          <div style={styles.lockerPanel}>
            <GoldLockerRoom
              rooms={rooms}
              selectedRoomId={selectedRoomId}
              selectedLockerId={selectedLockerId}
              selectedRackId={selectedRackId}
              onSelectRoom={handleRoomSelect}
              onSelectLocker={handleLockerSelect}
              onViewLocker={handleViewLocker}
              onSelectRack={handleRackSelect}
              onViewRack={handleViewRack}
            />
          </div>
        </section>

        {/* ===================================================
            FULL WIDTH FORM
        =================================================== */}

        <div style={styles.formBody}>
          {/* =================================================
              GOLD ITEMS
          ================================================= */}

          <section style={styles.section}>
            <GoldItems
              items={items}
              defaultMarketRatePerGram={defaultMarketRatePerGram}
              onItemsChange={handleItemsChange}
            />
          </section>

          {/* =================================================
              LOAN ELIGIBILITY
          ================================================= */}

          <section style={styles.section}>
            <header style={styles.sectionHeader}>
              <div style={styles.sectionHeadingGroup}>
                <span style={styles.sectionIcon}>
                  <WalletCards size={18} strokeWidth={1.9} />
                </span>

                <div style={styles.sectionHeadingText}>
                  <h2 style={styles.sectionTitle}>Gold Loan Eligibility</h2>

                  <p style={styles.eligibilitySectionSubtitle}>
                    Configure LTV and finalize requested and sanctioned amounts.
                  </p>
                </div>
              </div>

              <span style={styles.sectionBadge}>LTV Controlled</span>
            </header>

            <div style={styles.eligibilityFieldsGrid}>
              {/* MAX LTV */}

              <div style={styles.field}>
                <div style={styles.fieldLabelRow}>
                  <span style={styles.eligibilityFieldLabel}>Max LTV</span>

                  <span style={styles.fieldRequired}>*</span>
                </div>

                <div style={ltvControlStyle}>
                  <span style={styles.controlIcon}>
                    <Percent
                      size={moduleTokens.control.inputIconSize}
                      strokeWidth={1.8}
                    />
                  </span>

                  <input
                    type="text"
                    inputMode="decimal"
                    value={maxLtvPercentage}
                    onChange={(event) => {
                      handleNumericFieldChange(event, setMaxLtvPercentage);
                    }}
                    style={styles.controlInput}
                  />

                  <span style={styles.controlSuffix}>%</span>
                </div>

                <span style={styles.eligibilityFieldHelper}>
                  Configurable maximum loan-to-value percentage.
                </span>
              </div>

              {/* ELIGIBLE */}

              <div style={styles.field}>
                <div style={styles.fieldLabelRow}>
                  <span style={styles.eligibilityFieldLabel}>Eligible Amount</span>
                </div>

                <div style={styles.readOnlyControl}>
                  <BadgeIndianRupee
                    size={moduleTokens.control.inputIconSize}
                    strokeWidth={1.8}
                  />

                  {formatGoldLoanMoney(eligibleAmount)}
                </div>

                <span style={styles.eligibilityFieldHelper}>
                  Calculated from assessed value and configured LTV.
                </span>
              </div>

              {/* REQUESTED */}

              <div style={styles.field}>
                <div style={styles.fieldLabelRow}>
                  <span style={styles.eligibilityFieldLabel}>Requested Amount</span>

                  <span style={styles.fieldRequired}>*</span>
                </div>

                <div style={requestedControlStyle}>
                  <span style={styles.controlIcon}>
                    <Landmark
                      size={moduleTokens.control.inputIconSize}
                      strokeWidth={1.8}
                    />
                  </span>

                  <input
                    type="text"
                    inputMode="decimal"
                    value={requestedAmount}
                    onChange={(event) => {
                      handleNumericFieldChange(event, setRequestedAmount);
                    }}
                    style={styles.controlInput}
                  />

                  <span style={styles.controlSuffix}>INR</span>
                </div>
              </div>

              {/* SANCTIONED */}

              <div style={styles.field}>
                <div style={styles.fieldLabelRow}>
                  <span style={styles.eligibilityFieldLabel}>Sanctioned Amount</span>

                  <span style={styles.fieldRequired}>*</span>
                </div>

                <div style={sanctionedControlStyle}>
                  <span style={styles.controlIcon}>
                    <BadgeIndianRupee
                      size={moduleTokens.control.inputIconSize}
                      strokeWidth={1.8}
                    />
                  </span>

                  <input
                    type="text"
                    inputMode="decimal"
                    value={sanctionedAmount}
                    onChange={(event) => {
                      handleNumericFieldChange(event, setSanctionedAmount);
                    }}
                    style={styles.controlInput}
                  />

                  <span style={styles.controlSuffix}>INR</span>
                </div>
              </div>
            </div>

            {/* ===============================================
                AMOUNT SUMMARY
            =============================================== */}

            <div style={styles.amountSummary}>
              <div style={styles.amountSummaryGrid}>
                <article style={styles.amountMetric}>
                  <span style={styles.amountMetricLabel}>Assessed Value</span>

                  <strong style={styles.amountMetricValue}>
                    {formatGoldLoanMoney(totals.totalAssessedValue)}
                  </strong>

                  <span style={styles.amountMetricSubtext}>
                    Total pledged gold value
                  </span>
                </article>

                <article style={styles.amountMetric}>
                  <span style={styles.amountMetricLabel}>Eligible</span>

                  <strong style={eligibleValueStyle}>
                    {formatGoldLoanMoney(eligibleAmount)}
                  </strong>

                  <span style={styles.amountMetricSubtext}>
                    At {maxLtvPercentage}% LTV
                  </span>
                </article>

                <article style={styles.amountMetric}>
                  <span style={styles.amountMetricLabel}>Sanctioned</span>

                  <strong style={styles.amountMetricValue}>
                    {formatGoldLoanMoney(sanctionedAmount)}
                  </strong>

                  <span style={styles.amountMetricSubtext}>
                    Final Step-1 principal
                  </span>
                </article>
              </div>
            </div>
          </section>

          {/* =================================================
              CUSTODY + VALUER
          ================================================= */}

          <section style={styles.section}>
            <header style={styles.sectionHeader}>
              <div style={styles.sectionHeadingGroup}>
                <span style={styles.sectionIcon}>
                  <MapPin size={18} strokeWidth={1.9} />
                </span>

                <div style={styles.sectionHeadingText}>
                  <h2 style={styles.sectionTitle}>Custody & Valuer Details</h2>

                  <p style={styles.custodySectionSubtitle}>
                    Complete physical packet identity and valuation audit
                    information.
                  </p>
                </div>
              </div>

              <span style={styles.custodySectionBadge}>Physical Custody</span>
            </header>

            <div style={styles.custodyFieldsGrid}>
              {/* BAG */}

              <div style={styles.field}>
                <div style={styles.fieldLabelRow}>
                  <span style={styles.custodyFieldLabel}>Bag / Packet No.</span>

                  <span style={styles.fieldRequired}>*</span>
                </div>

                <div style={bagControlStyle}>
                  <span style={styles.controlIcon}>
                    <Hash
                      size={moduleTokens.control.inputIconSize}
                      strokeWidth={1.8}
                    />
                  </span>

                  <input
                    type="text"
                    value={bagNumber}
                    placeholder="Ex: 31"
                    onChange={(event) => {
                      setBagNumber(event.target.value);

                      setShowValidation(false);
                    }}
                    style={styles.controlInput}
                  />
                </div>
              </div>

              {/* PACKET */}

              <div style={styles.field}>
                <div style={styles.fieldLabelRow}>
                  <span style={styles.custodyFieldLabel}>Packet Reference</span>
                </div>

                <div style={styles.controlShell}>
                  <span style={styles.controlIcon}>
                    <Hash
                      size={moduleTokens.control.inputIconSize}
                      strokeWidth={1.8}
                    />
                  </span>

                  <input
                    type="text"
                    value={packetReference}
                    placeholder="Internal packet reference"
                    onChange={(event) => {
                      setPacketReference(event.target.value);
                    }}
                    style={styles.controlInput}
                  />
                </div>
              </div>

              {/* SEAL */}

              <div style={styles.field}>
                <div style={styles.fieldLabelRow}>
                  <span style={styles.custodyFieldLabel}>Seal Reference</span>
                </div>

                <div style={styles.controlShell}>
                  <span style={styles.controlIcon}>
                    <ShieldCheck
                      size={moduleTokens.control.inputIconSize}
                      strokeWidth={1.8}
                    />
                  </span>

                  <input
                    type="text"
                    value={sealReference}
                    placeholder="Seal / tamper reference"
                    onChange={(event) => {
                      setSealReference(event.target.value);
                    }}
                    style={styles.controlInput}
                  />
                </div>
              </div>

              {/* VALUER */}

              <div style={styles.field}>
                <div style={styles.fieldLabelRow}>
                  <span style={styles.custodyFieldLabel}>Valuer / Appraiser</span>
                </div>

                <div style={styles.controlShell}>
                  <span style={styles.controlIcon}>
                    <UserRound
                      size={moduleTokens.control.inputIconSize}
                      strokeWidth={1.8}
                    />
                  </span>

                  <input
                    type="text"
                    value={valuerName}
                    placeholder="Valuer name"
                    onChange={(event) => {
                      setValuerName(event.target.value);
                    }}
                    style={styles.controlInput}
                  />
                </div>
              </div>

              {/* LICENSE */}

              <div style={styles.field}>
                <div style={styles.fieldLabelRow}>
                  <span style={styles.custodyFieldLabel}>
                    Valuer Reference / License
                  </span>
                </div>

                <div style={styles.controlShell}>
                  <span style={styles.controlIcon}>
                    <ShieldCheck
                      size={moduleTokens.control.inputIconSize}
                      strokeWidth={1.8}
                    />
                  </span>

                  <input
                    type="text"
                    value={valuerLicenseNumber}
                    placeholder="Optional reference"
                    onChange={(event) => {
                      setValuerLicenseNumber(event.target.value);
                    }}
                    style={styles.controlInput}
                  />
                </div>
              </div>

              {/* DATE */}

              <div style={styles.field}>
                <div style={styles.fieldLabelRow}>
                  <span style={styles.custodyFieldLabel}>Valuation Date</span>
                </div>

                <div style={styles.controlShell}>
                  <span style={styles.controlIcon}>
                    <CalendarDays
                      size={moduleTokens.control.inputIconSize}
                      strokeWidth={1.8}
                    />
                  </span>

                  <input
                    type="text"
                    value={valuationDateDisplay}
                    readOnly
                    aria-readonly="true"
                    aria-label="FINORA Login Valuation Date"
                    title="Valuation Date is fixed to the active FINORA Login Date."
                    style={styles.controlInput}
                  />
                </div>
              </div>

              {/* REMARKS */}

              <div style={styles.custodyRemarksField}>
                <div style={styles.fieldLabelRow}>
                  <span style={styles.custodyFieldLabel}>
                    Valuation Remarks
                  </span>
                </div>

                <div style={styles.controlShell}>
                  <input
                    type="text"
                    value={valuationRemarks}
                    placeholder="Condition, appraisal notes, verification remarks..."
                    onChange={(event) => {
                      setValuationRemarks(event.target.value);
                    }}
                    style={styles.controlInput}
                  />
                </div>
              </div>
            </div>

            {/* ===============================================
                PHYSICAL LOCATOR
            =============================================== */}

            <div style={locatorStyle}>
              <header style={styles.locatorHeader}>
                <div style={styles.locatorHeadingGroup}>
                  <span style={styles.locatorIcon}>
                    <MapPin size={17} strokeWidth={1.9} />
                  </span>

                  <div>
                    <h3 style={styles.locatorTitle}>
                      Physical Custody Locator
                    </h3>

                    <p style={styles.locatorSubtitle}>
                      Exact digital twin of the physical Gold Locker Room.
                    </p>
                  </div>
                </div>

                <span style={styles.locatorCode}>{locationCode}</span>
              </header>

              <div style={styles.locatorGrid}>
                <article style={styles.locatorCell}>
                  <span style={styles.locatorCellLabel}>Room</span>

                  <strong style={styles.locatorCellValue}>
                    {selectedRoom
                      ? `Room ${selectedRoom.configuration.roomNumber}`
                      : "--"}
                  </strong>
                </article>

                <article style={styles.locatorCell}>
                  <span style={styles.locatorCellLabel}>Locker</span>

                  <strong style={styles.locatorCellValue}>
                    {selectedLocker
                      ? `Locker ${selectedLocker.configuration.lockerNumber}`
                      : "--"}
                  </strong>
                </article>

                <article style={styles.locatorCell}>
                  <span style={styles.locatorCellLabel}>Rack</span>

                  <strong style={styles.locatorCellValue}>
                    {selectedRack
                      ? `Rack ${selectedRack.configuration.rackNumber}`
                      : "--"}
                  </strong>
                </article>

                <article style={styles.locatorCell}>
                  <span style={styles.locatorCellLabel}>Bag / Packet</span>

                  <strong style={styles.locatorCellValue}>
                    {bagNumber.trim() || "--"}
                  </strong>
                </article>
              </div>

              <p style={styles.locatorHint}>
                Final save will re-check rack capacity before this physical
                location is allocated.
              </p>
            </div>

            {/* ===============================================
                DOCUMENTS NOTICE
            =============================================== */}

            <div style={styles.documentsHint}>
              <span style={styles.documentsHintIcon}>
                <FileImage size={17} strokeWidth={1.8} />
              </span>

              <div style={styles.documentsHintBody}>
                <h3 style={styles.documentsHintTitle}>
                  Gold Photos & Documents
                </h3>

                <p style={styles.documentsHintText}>
                  Gold item photographs and all important supporting evidence
                  are mandatory and must be uploaded in the Loan Studio Step 3
                  Documents Gallery before completing the loan process.
                </p>
              </div>
            </div>
          </section>

          {/* =================================================
              VALIDATION
          ================================================= */}

          {showValidation && validationErrors.length > 0 ? (
            <section style={styles.validationBanner}>
              <span style={styles.validationIcon}>
                <AlertTriangle size={17} strokeWidth={1.9} />
              </span>

              <div style={styles.validationBody}>
                <h3 style={styles.validationTitle}>
                  Complete Gold Loan Step 1
                </h3>

                <ul style={styles.validationList}>
                  {validationErrors.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              </div>
            </section>
          ) : null}

          {/* =================================================
              STEP ACTIONS
          ================================================= */}

          <footer style={styles.actions}>
            <div style={styles.actionsLeft}>
              <span style={styles.pageStatusText}>
                Step 1 • Gold Valuation & Custody
              </span>
            </div>

            <div style={styles.actionsRight}>
              {onBack ? (
                <button
                  type="button"
                  onClick={onBack}
                  style={styles.secondaryButton}
                >
                  <ArrowLeft
                    size={moduleTokens.control.buttonIconSize}
                    strokeWidth={1.9}
                  />
                  Back
                </button>
              ) : null}

              <button
                type="button"
                onClick={handleContinue}
                style={primaryActionStyle}
              >
                <span style={styles.primaryButtonContent}>
                  Continue to Step 2
                  <ArrowRight
                    size={moduleTokens.control.buttonIconSize}
                    strokeWidth={1.9}
                  />
                </span>
              </button>
            </div>
          </footer>
        </div>
      </div>
    </main>
  );
}

/* ===========================================================
   END
=========================================================== */
