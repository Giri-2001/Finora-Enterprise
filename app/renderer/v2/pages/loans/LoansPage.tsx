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
// - Keep Loans Office / Standard Studio / Gold Studio separate
//
// IMPORTANT:
// - NEVER import ../../../pages/loans/Loans
// - NEVER use the V1 Loans page
// - Loans.tsx owns the Loans Office UI
// - LoanStudio owns Standard Loan creation workflow
// - GoldLoanForm owns Gold Loan Step 1
// - Existing Loan Studio Steps 2–6 remain production-owned
// - No hardcoded Gold locker/rack capacities
// - No hardcoded Gold storage geometry
//
// VERSION : 2.1
// STATUS  : Gold Loan Route Foundation
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import { useEffect, useMemo, useState } from "react";

import Loans from "./Loans";

import LoanStudio from "../../components/customers/office/CustomerOffice/components/LoanStudio";

import GoldLoanForm from "../../components/gold-loan/GoldLoanForm";

import type { GoldLoanStepOneFormValue } from "../../components/gold-loan/GoldLoanForm";

import type { LoanCustomerOption } from "../../components/loans/details/LoanCustomerCard";

import {
  clearCustomerCache,
  hydrateCustomersFromStorage,
} from "../../store/customers/customer.store";

import { storageManager } from "../../storage/storageManager";

import { StorageMode } from "../../storage/storage.types";

import { buildGoldStorageRoomViews } from "../../services/gold-loan/goldStorageService";

import type { GoldStorageState } from "../../services/gold-loan/goldStorageService";

// ============================================================
// WORKSPACE
// ============================================================

type LoansWorkspace = "LOANS_OFFICE" | "STANDARD_LOAN" | "GOLD_LOAN";

// ============================================================
// EVENTS
// ============================================================

const OPEN_STANDARD_LOAN_EVENT = "FINORA_V2_OPEN_LOAN_STUDIO";

const OPEN_GOLD_LOAN_EVENT = "FINORA_V2_OPEN_GOLD_LOAN_STUDIO";

// ============================================================
// STORAGE MODE SESSION KEY
// ============================================================

const STORAGE_MODE_SESSION_KEY = "FINORA_STORAGE_MODE";

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
    const storedMode = window.sessionStorage.getItem(STORAGE_MODE_SESSION_KEY);

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
// Therefore FINORA never invents a physical location.
//
// Gold Settings will later become the authoritative geometry
// source without changing GoldLoanForm.
// ============================================================

function createEmptyGoldStorageState(): GoldStorageState {
  const now = new Date().toISOString();

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

async function loadGoldLoanCustomers(): Promise<LoanCustomerOption[]> {
  const storageMode = getAuthenticatedStorageMode();

  // ----------------------------------------------------------
  // RESTORE AUTHENTICATED FINORA STORAGE
  // ----------------------------------------------------------

  const storageActivated = await storageManager.selectStorageMode(storageMode);

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

  const customers = await hydrateCustomersFromStorage();

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
      (customer): LoanCustomerOption => ({
        customerId: customer.identity.customerId,

        customerName: customer.basic.fullName,

        phoneNumber: customer.basic.mobileNumber,

        photo: customer.photo,
      }),
    );
}

// ============================================================
// COMPONENT
// ============================================================

export default function LoansPage() {
  // ==========================================================
  // ACTIVE WORKSPACE
  // ==========================================================

  const [workspace, setWorkspace] = useState<LoansWorkspace>("LOANS_OFFICE");

  // ==========================================================
  // GOLD CUSTOMER OPTIONS
  // ==========================================================

  const [goldCustomerOptions, setGoldCustomerOptions] = useState<
    LoanCustomerOption[]
  >([]);

  // ==========================================================
  // GOLD STORAGE STATE
  //
  // File 19 domain service owns occupancy derivation.
  //
  // Physical persistence/configuration is intentionally not
  // invented at this route boundary.
  // ==========================================================

  const [goldStorageState] = useState<GoldStorageState>(
    createEmptyGoldStorageState,
  );

  // ==========================================================
  // GOLD ROOM DIGITAL TWIN
  // ==========================================================

  const goldRooms = useMemo(
    () =>
      buildGoldStorageRoomViews(
        goldStorageState.settings,
        goldStorageState.allocations,
      ),
    [goldStorageState],
  );

  // ==========================================================
  // OPEN WORKSPACE EVENTS
  //
  // STANDARD:
  // FINORA_V2_OPEN_LOAN_STUDIO
  //
  // GOLD:
  // FINORA_V2_OPEN_GOLD_LOAN_STUDIO
  // ==========================================================

  useEffect(() => {
    function handleOpenStandardLoanStudio(): void {
      setWorkspace("STANDARD_LOAN");
    }

    function handleOpenGoldLoanStudio(): void {
      setWorkspace("GOLD_LOAN");
    }

    window.addEventListener(
      OPEN_STANDARD_LOAN_EVENT,
      handleOpenStandardLoanStudio,
    );

    window.addEventListener(OPEN_GOLD_LOAN_EVENT, handleOpenGoldLoanStudio);

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
  // Only Gold workspace needs this route-level customer list.
  //
  // Standard Loan Studio continues using its existing customer
  // hydration engine unchanged.
  // ==========================================================

  useEffect(() => {
    if (workspace !== "GOLD_LOAN") {
      return;
    }

    let cancelled = false;

    async function hydrateGoldLoanCustomers(): Promise<void> {
      try {
        const options = await loadGoldLoanCustomers();

        if (cancelled) {
          return;
        }

        setGoldCustomerOptions(options);
      } catch (error) {
        console.error("FINORA GOLD LOAN CUSTOMER HYDRATION ERROR:", error);

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

  function handleCloseGoldLoan(): void {
    setWorkspace("LOANS_OFFICE");
  }

  // ==========================================================
  // GOLD STEP-1 COMPLETE
  //
  // File 23 will replace this handoff boundary with:
  //
  // Gold Step 1
  //      ↓
  // prepareGoldLoanStepTwoHandoff()
  //      ↓
  // Existing Loan Studio Step 2
  //
  // We intentionally do NOT fake Step-2 navigation here.
  // ==========================================================

  function handleGoldStepOneComplete(value: GoldLoanStepOneFormValue): void {
    console.info("FINORA GOLD LOAN STEP 1 READY", value);
  }

  // ==========================================================
  // STANDARD LOAN STUDIO
  //
  // Existing production workflow remains exactly the same.
  // ==========================================================

  if (workspace === "STANDARD_LOAN") {
    return <LoanStudio />;
  }

  // ==========================================================
  // GOLD LOAN STEP 1
  // ==========================================================

  if (workspace === "GOLD_LOAN") {
    return (
      <GoldLoanForm
        customerOptions={goldCustomerOptions}
        rooms={goldRooms}
        defaultMarketRatePerGram={GOLD_DEFAULT_MARKET_RATE_PER_GRAM}
        defaultMaxLtvPercentage={GOLD_DEFAULT_MAX_LTV_PERCENTAGE}
        onBack={handleCloseGoldLoan}
        onContinue={handleGoldStepOneComplete}
      />
    );
  }

  // ==========================================================
  // LOANS OFFICE
  // ==========================================================

  return <Loans />;
}

// ============================================================
// END
// ============================================================
