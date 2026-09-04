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

import { useEffect, useMemo, useState } from "react";

import Loans from "./Loans";

import LoanStudio from "../../components/customers/office/CustomerOffice/components/LoanStudio";

import GoldLoanForm from "../../components/gold-loan/GoldLoanForm";

import type { GoldLoanStepOneFormValue } from "../../components/gold-loan/GoldLoanForm";

import type { LoanCustomerOption } from "../../components/loans/details/LoanCustomerCard";

import {
  loadActiveLoanWorkspaceDraft,
  loadLoanWorkspaceDraft,
  saveLoanWorkspaceDraft,
} from "../../components/customers/office/CustomerOffice/components/loanWorkspaceDraft";

import type {
  LoanWorkspaceDraft,
} from "../../components/customers/office/CustomerOffice/components/loanWorkspaceDraft";

import {
  clearCustomerCache,
  hydrateCustomersFromStorage,
} from "../../store/customers/customer.store";

import { buildGoldStorageRoomViews } from "../../services/gold-loan/goldStorageService";

import { loadPersistedGoldStorageState } from "../../services/gold-loan/goldCustodyPersistenceService";

import type { GoldStorageState } from "../../services/gold-loan/goldStorageService";

import { prepareGoldLoanStepTwoHandoff } from "../../services/gold-loan/goldLoanService";

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

function readGoldLoanHandoffFromDraft(
  draft: LoanWorkspaceDraft | null,
): GoldLoanStudioStepTwoHandoff | null {
  if (
    !draft ||
    draft.mode !== "GOLD"
  ) {
    return null;
  }

  const value =
    draft.payload.goldLoanHandoff;

  if (
    typeof value !== "object" ||
    value === null
  ) {
    return null;
  }

  const handoff =
    value as Partial<GoldLoanStudioStepTwoHandoff>;

  if (
    handoff.entryMode !== "GOLD" ||
    handoff.targetStep !== 2 ||
    typeof handoff.loanAmount !== "number" ||
    !Number.isFinite(handoff.loanAmount) ||
    typeof handoff.customer !== "object" ||
    handoff.customer === null ||
    typeof handoff.goldStepOne !== "object" ||
    handoff.goldStepOne === null
  ) {
    return null;
  }

  const customer =
    handoff.customer as unknown as Record<string, unknown>;

  if (
    typeof customer.customerId !== "string" ||
    !customer.customerId.trim() ||
    typeof customer.customerName !== "string" ||
    !customer.customerName.trim()
  ) {
    return null;
  }

  return handoff as GoldLoanStudioStepTwoHandoff;
}

function resolveInitialLoansWorkspace(
  draft: LoanWorkspaceDraft | null,
  goldHandoff: GoldLoanStudioStepTwoHandoff | null,
): LoansWorkspace {
  if (!draft) {
    return "LOANS_OFFICE";
  }

  if (draft.mode === "STANDARD") {
    return "STANDARD_LOAN";
  }

  if (
    draft.mode === "GOLD" &&
    draft.step === 1
  ) {
    return "GOLD_LOAN_STEP_ONE";
  }

  if (
    draft.mode === "GOLD" &&
    draft.step >= 2 &&
    goldHandoff
  ) {
    return "GOLD_LOAN_STUDIO";
  }

  return "LOANS_OFFICE";
}

// ============================================================
// EVENTS
// ============================================================

const OPEN_STANDARD_LOAN_EVENT = "FINORA_V2_OPEN_LOAN_STUDIO";

const OPEN_GOLD_LOAN_EVENT = "FINORA_V2_OPEN_GOLD_LOAN_STUDIO";

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
      customerId: value.customer.customerId,

      customerName: value.customer.customerName,

      phoneNumber: value.customer.phoneNumber ?? "",

      photo: value.customer.photo,
    },

    items: value.items,

    roomId: value.roomId,

    lockerId: value.lockerId,

    rackId: value.rackId,

    bagNumber: value.bagNumber,

    packetReference: value.packetReference,

    sealReference: value.sealReference,

    maxLtvPercentage: value.maxLtvPercentage,

    requestedAmount: value.requestedAmount,

    sanctionedAmount: value.sanctionedAmount,

    valuerName: value.valuerName,

    valuerLicenseNumber: value.valuerLicenseNumber,

    valuationDate: value.valuationDate,

    valuationRemarks: value.valuationRemarks,
  };
}

// ============================================================
// COMPONENT
// ============================================================

export default function LoansPage() {
  // ==========================================================
  // ACTIVE WORKSPACE
  // ==========================================================

  const initialActiveLoanDraft =
    useMemo(
      () =>
        loadActiveLoanWorkspaceDraft(),
      [],
    );

  const initialGoldLoanHandoff =
    useMemo(
      () =>
        readGoldLoanHandoffFromDraft(
          initialActiveLoanDraft,
        ),
      [initialActiveLoanDraft],
    );

  const [workspace, setWorkspace] =
    useState<LoansWorkspace>(
      () =>
        resolveInitialLoansWorkspace(
          initialActiveLoanDraft,
          initialGoldLoanHandoff,
        ),
    );

  // ==========================================================
  // GOLD CUSTOMER OPTIONS
  // ==========================================================

  const [goldCustomerOptions, setGoldCustomerOptions] = useState<
    LoanCustomerOption[]
  >([]);

  // ==========================================================
  // GOLD STEP-2 HANDOFF
  //
  // This state exists only between:
  //
  // Gold Step 1
  //       ↓
  // shared Loan Studio Step 2–6
  // ==========================================================

  const [goldLoanHandoff, setGoldLoanHandoff] =
    useState<GoldLoanStudioStepTwoHandoff | null>(
      initialGoldLoanHandoff,
    );

  // ==========================================================
  // GOLD STORAGE STATE
  //
  // Gold Storage state is loaded from authoritative persistence
  // whenever Gold Step 1 opens.
  //
  // State includes:
  //
  // - persisted Storage Settings
  // - custody allocations
  // - relocation audits
  //
  // Rack occupancy is therefore derived from real persisted
  // OCCUPIED allocations rather than temporary empty arrays.
  // ==========================================================

  const [goldStorageState, setGoldStorageState] = useState<GoldStorageState>(
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
  // ==========================================================

  useEffect(() => {
    function handleOpenStandardLoanStudio(): void {
      /*
       * Clear any previous Gold launch snapshot before opening
       * the independent Standard Loan workflow.
       */
      setGoldLoanHandoff(null);

      setWorkspace("STANDARD_LOAN");
    }

    function handleOpenGoldLoanStudio(): void {
      /*
       * Every new Gold Loan starts from dedicated Gold Step 1.
       */
      setGoldLoanHandoff(null);

      setWorkspace("GOLD_LOAN_STEP_ONE");
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
  // LOAD GOLD STEP-1 WORKSPACE DATA
  //
  // Gold Step 1 requires:
  //
  // - authoritative Customer Hub customers
  // - persisted Gold Storage Settings
  //
  // IMPORTANT:
  //
  // Customer hydration restores the authenticated Storage Mode
  // first. Gold Storage Settings are loaded only after that
  // storage boundary is ready.
  //
  // Allocations and relocation audits remain empty until
  // persistent custody is introduced in Step 27.
  // ==========================================================

  useEffect(() => {
    if (workspace !== "GOLD_LOAN_STEP_ONE") {
      return;
    }


    let cancelled = false;

    async function hydrateGoldLoanWorkspace(): Promise<void> {
      try {
        // ------------------------------------------------------
        // 1. RESTORE STORAGE MODE + LOAD CUSTOMERS
        // ------------------------------------------------------

        const customerOptions = await loadGoldLoanCustomers();

        if (cancelled) {
          return;
        }

        setGoldCustomerOptions(customerOptions);

        // ------------------------------------------------------
        // 2. LOAD AUTHORITATIVE PERSISTED GOLD STORAGE STATE
        //
        // Includes:
        //
        // - Storage Settings
        // - Custody Allocations
        // - Relocation Audits
        //
        // Customer hydration above executes first so the active
        // FINORA storage boundary is already ready.
        // ------------------------------------------------------

        const storageStateResult = await loadPersistedGoldStorageState();

        if (cancelled) {
          return;
        }

        if (!storageStateResult.success || !storageStateResult.state) {
          console.error(
            "FINORA GOLD STORAGE STATE HYDRATION ERROR:",
            storageStateResult.error,
          );

          setGoldStorageState(createEmptyGoldStorageState());

          alert(
            storageStateResult.error ??
              "Unable to load Gold Storage custody state.",
          );

          return;
        }

        // ------------------------------------------------------
        // 3. AUTHORITATIVE PERSISTED STORAGE STATE
        //
        // No physical geometry is invented here.
        //
        // If Gold Storage has never been configured, the
        // persistence service returns an empty settings state.
        //
        // Existing persisted allocations and relocation audits
        // are hydrated through the same service.
        // ------------------------------------------------------

        setGoldStorageState(storageStateResult.state);
      } catch (error) {
        console.error("FINORA GOLD LOAN WORKSPACE HYDRATION ERROR:", error);

        if (cancelled) {
          return;
        }

        setGoldCustomerOptions([]);

        setGoldStorageState(createEmptyGoldStorageState());

        alert(
          error instanceof Error
            ? error.message
            : "Unable to prepare Gold Loan Step 1.",
        );
      }
    }

    void hydrateGoldLoanWorkspace();

    return () => {
      cancelled = true;
    };
  }, [workspace, goldLoanHandoff]);

  // ==========================================================
  // BACK TO LOANS OFFICE
  // ==========================================================

  function handleCloseGoldLoan(): void {
    setGoldLoanHandoff(null);

    setWorkspace("LOANS_OFFICE");
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

  function handleGoldStepOneComplete(value: GoldLoanStepOneFormValue): void {
    const serviceInput = buildGoldStepOneServiceInput(value);

    const result = prepareGoldLoanStepTwoHandoff(serviceInput);

    // --------------------------------------------------------
    // DOMAIN VALIDATION FAILED
    // --------------------------------------------------------

    if (!result.success || !result.handoff) {
      console.error("FINORA GOLD LOAN STEP-1 HANDOFF ERROR:", {
        error: result.error,

        validation: result.preparation.validation,
      });

      alert(
        result.error ??
          "Unable to continue Gold Loan. Please review Gold Step 1.",
      );

      return;
    }

    // --------------------------------------------------------
    // AUTHORITATIVE HANDOFF
    // --------------------------------------------------------

    const existingGoldDraft =
      loadLoanWorkspaceDraft(
        "GOLD",
      );

    saveLoanWorkspaceDraft({
      version: 1,

      mode: "GOLD",

      step: 2,

      savedAt:
        new Date().toISOString(),

      payload: {
        ...(existingGoldDraft?.payload ?? {}),

        goldLoanHandoff:
          result.handoff,
      },
    });

    setGoldLoanHandoff(
      result.handoff,
    );

    setWorkspace(
      "GOLD_LOAN_STUDIO",
    );
  }

  // ==========================================================
  // RETURN TO GOLD STEP 1
  //
  // Keep the authoritative handoff alive while reopening
  // GoldLoanForm so the completed Step-1 data remains editable.
  // ==========================================================

  function handleEditGoldStepOne(): void {
    if (!goldLoanHandoff) {
      return;
    }

    setWorkspace("GOLD_LOAN_STEP_ONE");
  }

  const goldStepOneInitialCustomer: LoanCustomerOption | undefined =
    goldLoanHandoff
      ? (
          goldCustomerOptions.find(
            (customer) =>
              customer.customerId ===
              goldLoanHandoff.goldStepOne.customer.customerId,
          ) ?? {
            customerId:
              goldLoanHandoff.customer.customerId,

            customerName:
              goldLoanHandoff.customer.customerName,

            phoneNumber:
              goldLoanHandoff.customer.phoneNumber,
          }
        )
      : undefined;

  const goldStepOneInitialValue: GoldLoanStepOneFormValue | undefined =
    goldLoanHandoff && goldStepOneInitialCustomer
      ? {
          customer: goldStepOneInitialCustomer,

          items: goldLoanHandoff.goldStepOne.items,

          roomId: goldLoanHandoff.goldStepOne.custody.roomId,

          lockerId: goldLoanHandoff.goldStepOne.custody.lockerId,

          rackId: goldLoanHandoff.goldStepOne.custody.rackId,

          bagNumber: String(
            goldLoanHandoff.goldStepOne.custody.bagNumber,
          ),

          packetReference:
            goldLoanHandoff.goldStepOne.custody.packetReference,

          sealReference:
            goldLoanHandoff.goldStepOne.custody.sealReference,

          maxLtvPercentage:
            goldLoanHandoff.goldStepOne.valuation.maxLtvPercentage,

          assessedValue:
            goldLoanHandoff.goldStepOne.valuation.assessedValue,

          eligibleAmount:
            goldLoanHandoff.goldStepOne.valuation.eligibleAmount,

          requestedAmount:
            goldLoanHandoff.goldStepOne.amounts.requestedAmount,

          sanctionedAmount:
            goldLoanHandoff.goldStepOne.amounts.sanctionedAmount,

          valuerName:
            goldLoanHandoff.goldStepOne.valuer.name,

          valuerLicenseNumber:
            goldLoanHandoff.goldStepOne.valuer.licenseNumber,

          valuationDate:
            goldLoanHandoff.goldStepOne.valuer.valuationDate,

          valuationRemarks:
            goldLoanHandoff.goldStepOne.valuer.remarks,

          locationCode: "",
        }
      : undefined;

  // ==========================================================
  // STANDARD LOAN STUDIO
  //
  // Existing production workflow remains unchanged.
  // ==========================================================

  if (workspace === "STANDARD_LOAN") {
    return <LoanStudio />;
  }

  // ==========================================================
  // GOLD LOAN — KEEP-ALIVE STEP 1 ↔ STEP 2–6
  //
  // LoanStudio remains mounted after the first Gold handoff.
  // Step-1 editing only hides it, preserving all Step 2–6 data.
  // ==========================================================

  if (
    goldLoanHandoff &&
    (
      workspace === "GOLD_LOAN_STUDIO" ||
      workspace === "GOLD_LOAN_STEP_ONE"
    )
  ) {
    return (
      <>
        <div
          style={{
            display:
              workspace === "GOLD_LOAN_STUDIO"
                ? "contents"
                : "none",
          }}
        >
          <LoanStudio
            entryMode={goldLoanHandoff.entryMode}
            initialStep={goldLoanHandoff.targetStep}
            customerId={goldLoanHandoff.customer.customerId}
            customerName={goldLoanHandoff.customer.customerName}
            phoneNumber={goldLoanHandoff.customer.phoneNumber}
            initialLoanAmount={goldLoanHandoff.loanAmount}
            goldStepOne={goldLoanHandoff.goldStepOne}
            onGoldStepOneDetails={handleEditGoldStepOne}
          />
        </div>

        {workspace === "GOLD_LOAN_STEP_ONE" ? (
          <GoldLoanForm
            customerOptions={goldCustomerOptions}
            rooms={goldRooms}
            defaultMarketRatePerGram={GOLD_DEFAULT_MARKET_RATE_PER_GRAM}
            defaultMaxLtvPercentage={GOLD_DEFAULT_MAX_LTV_PERCENTAGE}
            initialValue={goldStepOneInitialValue}
            onBack={handleCloseGoldLoan}
            onContinue={handleGoldStepOneComplete}
          />
        ) : null}
      </>
    );
  }

  // ==========================================================
  // GOLD LOAN — INITIAL STEP 1
  //
  // First launch only. No LoanStudio draft exists yet.
  // ==========================================================

  if (workspace === "GOLD_LOAN_STEP_ONE") {
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
  // DEFENSIVE GOLD HANDOFF FALLBACK
  //
  // GOLD_LOAN_STUDIO should never exist without its handoff.
  // If state ever becomes inconsistent, return safely to
  // Loans Office rather than mounting an incomplete LoanStudio.
  // ==========================================================

  if (workspace === "GOLD_LOAN_STUDIO") {
    return <Loans />;
  }

  // ==========================================================
  // LOANS OFFICE
  // ==========================================================

  return <Loans />;
}

// ============================================================
// END
// ============================================================
