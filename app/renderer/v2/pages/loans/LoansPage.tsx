// ============================================================
// FINORA ENTERPRISE OS™
//
// V2 LOANS OFFICE™
//
// ROUTE ENTRY
//
// RESPONSIBILITY:
// - Open the V2 Loans Office
// - Listen for Standard Loan Studio event
// - Listen for Gold Loan Studio event
// - Keep Standard Loan workflow untouched
// - Open dedicated Gold Loan Step 1
// - Load authoritative Customer Hub customers for Gold Loan
// - Prepare Gold Storage view boundary
// - Validate / normalize Gold Step 1 through Gold Loan Service
// - Hand Gold Loan into existing Loan Studio at Step 2
//
// IMPORTANT:
// - NEVER import ../../../pages/loans/Loans
// - NEVER use the V1 Loans page
// - Loans.tsx owns the Loans Office UI
// - LoanStudio owns Standard Loan creation workflow
// - GoldLoanForm owns Gold Loan Step 1
// - Gold Loan Service owns authoritative Gold Step-1 preparation
// - Existing Loan Studio Steps 2–6 remain production-owned
// - No hardcoded Gold locker/rack capacities
// - No hardcoded Gold storage geometry
// - UI assessed / eligible values are NOT trusted here
//
// VERSION : 2.2
// STATUS  : Gold Loan Step-2 Handoff
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Loans from "./Loans";

import LoanStudio from "../../components/customers/office/CustomerOffice/components/LoanStudio";

import GoldLoanForm from "../../components/gold-loan/GoldLoanForm";

import type {
  GoldLoanStepOneFormValue,
} from "../../components/gold-loan/GoldLoanForm";

import type {
  LoanCustomerOption,
} from "../../components/loans/details/LoanCustomerCard";

import {
  clearCustomerCache,
  hydrateCustomersFromStorage,
} from "../../store/customers/customer.store";

import {
  storageManager,
} from "../../storage/storageManager";

import {
  StorageMode,
} from "../../storage/storage.types";

import {
  buildGoldStorageRoomViews,
} from "../../services/gold-loan/goldStorageService";

import type {
  GoldStorageState,
} from "../../services/gold-loan/goldStorageService";

import {
  prepareGoldLoanStepTwoHandoff,
} from "../../services/gold-loan/goldLoanService";

import type {
  GoldLoanStepOneServiceInput,
  GoldLoanStudioStepTwoHandoff,
} from "../../services/gold-loan/goldLoanService";

// ============================================================
// WORKSPACE
// ============================================================

type LoansWorkspace =
  | "LOANS_OFFICE"
  | "STANDARD_LOAN"
  | "GOLD_LOAN_STEP_ONE"
  | "GOLD_LOAN_STUDIO";

// ============================================================
// EVENTS
// ============================================================

const OPEN_STANDARD_LOAN_EVENT =
  "FINORA_V2_OPEN_LOAN_STUDIO";

const OPEN_GOLD_LOAN_EVENT =
  "FINORA_V2_OPEN_GOLD_LOAN_STUDIO";

// ============================================================
// STORAGE MODE SESSION KEY
// ============================================================

const STORAGE_MODE_SESSION_KEY =
  "FINORA_STORAGE_MODE";

// ============================================================
// GOLD CONFIGURATION DEFAULTS
//
// IMPORTANT:
//
// 0 intentionally means:
//
// - Do not invent current Gold market rate.
// - Do not hardcode an LTV policy.
//
// User enters the value until Gold Settings becomes the
// authoritative configuration source.
// ============================================================

const GOLD_DEFAULT_MARKET_RATE_PER_GRAM = 0;

const GOLD_DEFAULT_MAX_LTV_PERCENTAGE = 0;

// ============================================================
// AUTHENTICATED STORAGE MODE
// ============================================================

function getAuthenticatedStorageMode(): StorageMode {
  try {
    const storedMode =
      window.sessionStorage.getItem(
        STORAGE_MODE_SESSION_KEY,
      );

    if (storedMode === StorageMode.USB) {
      return StorageMode.USB;
    }

    if (storedMode === StorageMode.CLOUD) {
      return StorageMode.CLOUD;
    }

    return StorageMode.LOCAL;
  } catch {
    return StorageMode.LOCAL;
  }
}

// ============================================================
// EMPTY GOLD STORAGE STATE
//
// IMPORTANT:
//
// This is NOT a hardcoded physical Locker Room.
//
// Until Gold Storage Settings is configured:
//
// rooms   = []
// lockers = []
// racks   = []
//
// FINORA therefore never invents a physical location.
//
// Gold Settings / persistence becomes authoritative later
// without changing GoldLoanForm.
// ============================================================

function createEmptyGoldStorageState(): GoldStorageState {
  const now =
    new Date().toISOString();

  return {
    settings: {
      rooms: [],

      lockers: [],

      racks: [],

      updatedAt: now,

      updatedBy: "SYSTEM",
    },

    allocations: [],

    relocationAudits: [],
  };
}

// ============================================================
// CUSTOMER OPTIONS
// ============================================================

async function loadGoldLoanCustomers():
  Promise<LoanCustomerOption[]> {
  const storageMode =
    getAuthenticatedStorageMode();

  // ----------------------------------------------------------
  // RESTORE AUTHENTICATED FINORA STORAGE
  // ----------------------------------------------------------

  const storageActivated =
    await storageManager.selectStorageMode(
      storageMode,
    );

  if (!storageActivated.success) {
    throw new Error(
      storageActivated.error ??
        `Unable to restore FINORA ${storageMode} storage.`,
    );
  }

  // ----------------------------------------------------------
  // FORCE AUTHORITATIVE CUSTOMER REFRESH
  // ----------------------------------------------------------

  clearCustomerCache();

  const customers =
    await hydrateCustomersFromStorage();

  // ----------------------------------------------------------
  // SAME CUSTOMER FILTER / MAPPING USED BY LOAN STUDIO
  // ----------------------------------------------------------

  return customers
    .filter(
      (customer) =>
        customer.identity.isDeleted !== true &&
        customer.internal.isArchived !== true,
    )
    .map(
      (
        customer,
      ): LoanCustomerOption => ({
        customerId:
          customer.identity.customerId,

        customerName:
          customer.basic.fullName,

        phoneNumber:
          customer.basic.mobileNumber,

        photo:
          customer.photo,
      }),
    );
}

// ============================================================
// GOLD FORM → DOMAIN SERVICE INPUT
//
// IMPORTANT:
//
// GoldLoanForm contains display values such as:
//
// assessed
// eligible
// locationCode
//
// Those values are intentionally NOT forwarded.
//
// goldLoanService recalculates:
//
// - item valuation
// - assessed value
// - eligible amount
// - LTV validation
//
// before creating the Step-2 handoff.
// ============================================================

function buildGoldStepOneServiceInput(
  value: GoldLoanStepOneFormValue,
): GoldLoanStepOneServiceInput {
  return {
    customer: {
      customerId:
        value.customer.customerId,

      customerName:
        value.customer.customerName,

      phoneNumber:
        value.customer.phoneNumber ?? "",

      photo:
        value.customer.photo,
    },

    items:
      value.items,

    roomId:
      value.roomId,

    lockerId:
      value.lockerId,

    rackId:
      value.rackId,

    bagNumber:
      value.bagNumber,

    packetReference:
  value.packetReference,

sealReference:
  value.sealReference,

maxLtvPercentage:
  value.maxLtvPercentage,

requestedAmount:
  value.requestedAmount,

sanctionedAmount:
  value.sanctionedAmount,

valuerName:
  value.valuerName,

valuerLicenseNumber:
  value.valuerLicenseNumber,

valuationDate:
  value.valuationDate,

valuationRemarks:
  value.valuationRemarks,
  };
}

// ============================================================
// COMPONENT
// ============================================================

export default function LoansPage() {
  // ==========================================================
  // ACTIVE WORKSPACE
  // ==========================================================

  const [
    workspace,
    setWorkspace,
  ] = useState<LoansWorkspace>(
    "LOANS_OFFICE",
  );

  // ==========================================================
  // GOLD CUSTOMER OPTIONS
  // ==========================================================

  const [
    goldCustomerOptions,
    setGoldCustomerOptions,
  ] = useState<LoanCustomerOption[]>(
    [],
  );

  // ==========================================================
  // GOLD STEP-2 HANDOFF
  //
  // This state exists only between:
  //
  // Gold Step 1
  //       ↓
  // shared Loan Studio Step 2–6
  // ==========================================================

  const [
    goldLoanHandoff,
    setGoldLoanHandoff,
  ] = useState<
    GoldLoanStudioStepTwoHandoff | null
  >(null);

  // ==========================================================
  // GOLD STORAGE STATE
  //
  // Physical persistence/configuration is intentionally not
  // invented at this route boundary.
  // ==========================================================

  const [
    goldStorageState,
  ] = useState<GoldStorageState>(
    createEmptyGoldStorageState,
  );

  // ==========================================================
  // GOLD ROOM DIGITAL TWIN
  // ==========================================================

  const goldRooms =
    useMemo(
      () =>
        buildGoldStorageRoomViews(
          goldStorageState.settings,

          goldStorageState.allocations,
        ),
      [goldStorageState],
    );

  // ==========================================================
  // OPEN WORKSPACE EVENTS
  // ==========================================================

  useEffect(() => {
    function handleOpenStandardLoanStudio():
      void {
      /*
       * Clear any previous Gold launch snapshot before opening
       * the independent Standard Loan workflow.
       */
      setGoldLoanHandoff(null);

      setWorkspace(
        "STANDARD_LOAN",
      );
    }

    function handleOpenGoldLoanStudio():
      void {
      /*
       * Every new Gold Loan starts from dedicated Gold Step 1.
       */
      setGoldLoanHandoff(null);

      setWorkspace(
        "GOLD_LOAN_STEP_ONE",
      );
    }

    window.addEventListener(
      OPEN_STANDARD_LOAN_EVENT,

      handleOpenStandardLoanStudio,
    );

    window.addEventListener(
      OPEN_GOLD_LOAN_EVENT,

      handleOpenGoldLoanStudio,
    );

    return () => {
      window.removeEventListener(
        OPEN_STANDARD_LOAN_EVENT,

        handleOpenStandardLoanStudio,
      );

      window.removeEventListener(
        OPEN_GOLD_LOAN_EVENT,

        handleOpenGoldLoanStudio,
      );
    };
  }, []);

  // ==========================================================
  // LOAD GOLD LOAN CUSTOMERS
  //
  // Customer list is required only while dedicated Gold
  // Step 1 is active.
  //
  // Shared Loan Studio performs its own existing hydration.
  // ==========================================================

  useEffect(() => {
    if (
      workspace !==
      "GOLD_LOAN_STEP_ONE"
    ) {
      return;
    }

    let cancelled = false;

    async function hydrateGoldLoanCustomers():
      Promise<void> {
      try {
        const options =
          await loadGoldLoanCustomers();

        if (cancelled) {
          return;
        }

        setGoldCustomerOptions(
          options,
        );
      } catch (error) {
        console.error(
          "FINORA GOLD LOAN CUSTOMER HYDRATION ERROR:",
          error,
        );

        if (!cancelled) {
          setGoldCustomerOptions([]);
        }
      }
    }

    void hydrateGoldLoanCustomers();

    return () => {
      cancelled = true;
    };
  }, [workspace]);

  // ==========================================================
  // BACK TO LOANS OFFICE
  // ==========================================================

  function handleCloseGoldLoan():
    void {
    setGoldLoanHandoff(null);

    setWorkspace(
      "LOANS_OFFICE",
    );
  }

  // ==========================================================
  // GOLD STEP-1 COMPLETE
  //
  // GoldLoanForm
  //      ↓
  // map UI form → domain service input
  //      ↓
  // authoritative recalculation + validation
  //      ↓
  // GoldLoanStudioStepTwoHandoff
  //      ↓
  // existing Loan Studio Step 2
  // ==========================================================

  function handleGoldStepOneComplete(
    value: GoldLoanStepOneFormValue,
  ): void {
    const serviceInput =
      buildGoldStepOneServiceInput(
        value,
      );

    const result =
      prepareGoldLoanStepTwoHandoff(
        serviceInput,
      );

    // --------------------------------------------------------
    // DOMAIN VALIDATION FAILED
    // --------------------------------------------------------

    if (
      !result.success ||
      !result.handoff
    ) {
      console.error(
        "FINORA GOLD LOAN STEP-1 HANDOFF ERROR:",
        {
          error:
            result.error,

          validation:
            result.preparation.validation,
        },
      );

      alert(
        result.error ??
          "Unable to continue Gold Loan. Please review Gold Step 1.",
      );

      return;
    }

    // --------------------------------------------------------
    // AUTHORITATIVE HANDOFF
    // --------------------------------------------------------

    setGoldLoanHandoff(
      result.handoff,
    );

    setWorkspace(
      "GOLD_LOAN_STUDIO",
    );
  }

  // ==========================================================
  // STANDARD LOAN STUDIO
  //
  // Existing production workflow remains unchanged.
  // ==========================================================

  if (
    workspace ===
    "STANDARD_LOAN"
  ) {
    return (
      <LoanStudio />
    );
  }

  // ==========================================================
  // GOLD LOAN — SHARED STEP 2–6
  // ==========================================================

  if (
    workspace ===
      "GOLD_LOAN_STUDIO" &&
    goldLoanHandoff
  ) {
    return (
      <LoanStudio
        entryMode={
          goldLoanHandoff.entryMode
        }
        initialStep={
          goldLoanHandoff.targetStep
        }
        customerId={
          goldLoanHandoff.customer
            .customerId
        }
        customerName={
          goldLoanHandoff.customer
            .customerName
        }
        phoneNumber={
          goldLoanHandoff.customer
            .phoneNumber
        }
        initialLoanAmount={
          goldLoanHandoff.loanAmount
        }
        goldStepOne={
          goldLoanHandoff.goldStepOne
        }
      />
    );
  }

  // ==========================================================
  // GOLD LOAN — STEP 1
  // ==========================================================

  if (
    workspace ===
    "GOLD_LOAN_STEP_ONE"
  ) {
    return (
      <GoldLoanForm
        customerOptions={
          goldCustomerOptions
        }
        rooms={
          goldRooms
        }
        defaultMarketRatePerGram={
          GOLD_DEFAULT_MARKET_RATE_PER_GRAM
        }
        defaultMaxLtvPercentage={
          GOLD_DEFAULT_MAX_LTV_PERCENTAGE
        }
        onBack={
          handleCloseGoldLoan
        }
        onContinue={
          handleGoldStepOneComplete
        }
      />
    );
  }

  // ==========================================================
  // DEFENSIVE GOLD HANDOFF FALLBACK
  //
  // GOLD_LOAN_STUDIO should never exist without its handoff.
  // If state ever becomes inconsistent, return safely to
  // Loans Office rather than mounting an incomplete LoanStudio.
  // ==========================================================

  if (
    workspace ===
    "GOLD_LOAN_STUDIO"
  ) {
    return (
      <Loans />
    );
  }

  // ==========================================================
  // LOANS OFFICE
  // ==========================================================

  return (
    <Loans />
  );
}

// ============================================================
// END
// ============================================================