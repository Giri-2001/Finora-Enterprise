// ============================================================
// FINORA ENTERPRISE OS™
// LOAN STUDIO™
// PRESENTATION VIEW
//
// RESPONSIBILITY:
// - Render Loan Studio UI only.
// - Consume state/business view-model from useLoanStudio.
// - Consume the active FINORA Theme Engine theme.
// - Resolve shared presentation styles from Responsive Engine + Theme.
// - Step 1 geometry is resolved by step1Details Responsive Engine.
// - Step 5 geometry is resolved by Loan Studio Responsive Engine.
// - Step 6 geometry is resolved by Loan Studio Responsive Engine.
// - No business calculations.
// - No storage/service access.
// - No inline responsive logic.
// ============================================================

import { GlobalLoadingOverlay } from "../../../../common";
import { formatIndianDate } from "./LoanStudio.helpers";

import { useResponsive } from "../../../../../utils/responsive";

import { useTheme } from "../../../../../themes/provider/ThemeProvider";

import { createLoanStudioStyles } from "./LoanStudio.styles";

import {
  createLoanStudioStep2Layout,
  createLoanStudioStep5Layout,
  createLoanStudioStep6Layout,
} from "./LoanStudio.layout";

/* ============================================================
   STEP 1 RESPONSIVE ENGINE
============================================================ */

import { getStep1DetailsTokens } from "../../../../../utils/responsive/step1Details/step1Details.tokens";

import {
  createStep1DetailsWorkspaceStyle,
  createStep1DetailsTopStyle,
  createStep1DetailsCustomerStyle,
  createStep1DetailsOverviewStyle,
  createStep1DetailsMainStyle,
  createStep1DetailsFormStyle,
  createStep1DetailsPreviewStyle,
} from "../../../../../utils/responsive/step1Details/step1Details.layout";

/* ============================================================
   LOAN MODULES
============================================================ */

import LoanCustomerCard from "../../../../loans/details/LoanCustomerCard";

import LoanPreviewCard from "../../../../loans/details/LoanPreviewCard";

import LoanForm from "../../../../loans/details/LoanForm";

import LoanStatistics from "../../../../loans/details/LoanStatistics";

import DocumentsStudio from "../../../../loans/documents/DocumentsStudio";

import GuarantorHeader from "../../../../loans/guarantor/GuarantorHeader";

import GuarantorForm from "../../../../loans/guarantor/GuarantorForm";

import GuarantorVerification from "../../../../loans/guarantor/GuarantorVerification";

import GuarantorPreviewCard from "../../../../loans/guarantor/GuarantorPreviewCard";

import RepaymentSummary from "../../../../loans/repayment/RepaymentSummary";

import RepaymentPreviewCard from "../../../../loans/repayment/RepaymentPreviewCard";

import LoanScheduleTable from "../../../../loans/schedule/LoanScheduleTable";

import DisbursementHeader from "../../../../loans/disbursement/DisbursementHeader";

import DisbursementForm from "../../../../loans/disbursement/DisbursementForm";

import PaymentModeCard from "../../../../loans/disbursement/PaymentModeCard";

import DisbursementReceipt from "../../../../loans/disbursement/DisbursementReceipt";

import DisbursementPreviewCard from "../../../../loans/disbursement/DisbursementPreviewCard";

import ReviewHeader from "../../../../loans/review/ReviewHeader";

import ValidationChecklist from "../../../../loans/review/ValidationChecklist";

import ApprovalActions from "../../../../loans/review/ApprovalActions";

import ReviewPreviewCard from "../../../../loans/review/ReviewPreviewCard";

import { useLoanStudio } from "./useLoanStudio";

type LoanStudioViewModel = ReturnType<typeof useLoanStudio>;

/* ============================================================
   WIZARD STEPS
============================================================ */

const STEP_ITEMS = [
  {
    title: "Details",
    subtitle: "Basic Information",
  },

  {
    title: "Repayment",
    subtitle: "Repayment Setup",
  },

  {
    title: "Documents",
    subtitle: "Upload & Verify",
  },

  {
    title: "Guarantor",
    subtitle: "Guarantor Details",
  },

  {
    title: "Review",
    subtitle: "Review & Approve",
  },

  {
    title: "Disbursement",
    subtitle: "Disburse Loan",
  },
] as const;

/* ============================================================
   HELPERS
============================================================ */


function getDisbursementAmount(value: number): number {
  return Math.max(
    0,

    Number.isFinite(value) ? value : 0,
  );
}

/* ============================================================
   VIEW
============================================================ */

export default function LoanStudioView(props: LoanStudioViewModel) {
  /* ==========================================================
     FINORA RESPONSIVE ENGINE
  ========================================================== */

  const { tokens } = useResponsive();

  /* ==========================================================
     FINORA THEME ENGINE
  ========================================================== */

  const { theme } = useTheme();

  /* ==========================================================
     STEP 2 RESPONSIVE LAYOUT
  ========================================================== */

  const step2Layout = createLoanStudioStep2Layout(tokens);

  const {
    step2WorkspaceStyle,
    step2GridStyle,
    step2LeftColumnStyle,
    step2SummaryWrapperStyle,
    step2PreviewDraftStackStyle,
    step2PreviewWrapperStyle,
    step2ScheduleWrapperStyle,
  } = step2Layout;

  /* ==========================================================
     STEP 5 RESPONSIVE LAYOUT
  ========================================================== */

  const step5Layout = createLoanStudioStep5Layout(tokens);

  const {
    step5WorkspaceStyle,
    step5BottomStyle,
    step5ChecklistColumnStyle,
    step5PreviewColumnStyle,
  } = step5Layout;

  /* ==========================================================
     STEP 6 RESPONSIVE LAYOUT
  ========================================================== */

  const step6Layout = createLoanStudioStep6Layout(tokens);

  const {
    step6WorkspaceStyle,
    step6BottomStyle,
    step6FormStyle,
    step6DisbursementWrapperStyle,
    step6PaymentModeWrapperStyle,
    step6ApprovalActionsWrapperStyle,
    step6PreviewColumnStyle,
    step6ReceiptWrapperStyle,
    step6PreviewCardWrapperStyle,
  } = step6Layout;

  /* ==========================================================
     SHARED LOAN STUDIO PRESENTATION STYLES
  ========================================================== */

  const {
    shellStyle,
    contentStyle,
    footerStyle,
    stepListStyle,
    stepItemStyle,
    activeStepNumberStyle,
    activeStepTitleStyle,
    completedStepNumberStyle,
    completedStepTitleStyle,
    pendingStepNumberStyle,
    pendingStepTitleStyle,
    stepSubtitleStyle,
    stepTextStyle,
    navigationStyle,
    navigationButtonStyle,
    disabledNavigationButtonStyle,
    primaryNavigationButtonStyle,
    step6FormStyle: baseStep6FormStyle,
  } = createLoanStudioStyles(tokens, theme);

  /*
   * Step 6 uses CSS Grid Areas.
   *
   * The outer responsive grid must receive each card as a direct
   * grid participant. Therefore the legacy form/preview wrappers
   * are converted to display: contents by the responsive layout.
   *
   * Keep the shared style available, but let the responsive engine
   * own the actual Step 6 geometry.
   */
  const resolvedStep6FormStyle = {
    ...baseStep6FormStyle,
    ...step6FormStyle,
  };

  /* ==========================================================
     STEP 1 RESPONSIVE TOKENS
  ========================================================== */

  const step1DetailsTokens = getStep1DetailsTokens(tokens.meta.viewport);

  /* ==========================================================
     STEP 1 RESPONSIVE STYLES
  ========================================================== */

  const step1WorkspaceStyle =
    createStep1DetailsWorkspaceStyle(step1DetailsTokens);

  const step1TopStyle = createStep1DetailsTopStyle(step1DetailsTokens);

  const step1CustomerStyle =
    createStep1DetailsCustomerStyle(step1DetailsTokens);

  const step1OverviewStyle =
    createStep1DetailsOverviewStyle(step1DetailsTokens);

  const step1BottomStyle = createStep1DetailsMainStyle(step1DetailsTokens);

  const step1FormStyle = createStep1DetailsFormStyle(step1DetailsTokens);

  const step1PreviewStyle = createStep1DetailsPreviewStyle(step1DetailsTokens);

  /* ==========================================================
     BUSINESS / VIEW MODEL
  ========================================================== */

  const {
    isGoldLoan,
    customerName,
    selectedCustomer,
    setSelectedCustomer,
    documents,
    setDocuments,
    loanCustomerOptions,

    activeCustomerId,
    activeCustomerName,
    activeCustomerPhone,

    loanNumberPreview,

    step,
    setStep,

    loanAmount,
    setLoanAmount,
    interest,
    setInterest,
    processingFee,
    setProcessingFee,
    advanceDeduction,
    setAdvanceDeduction,
    lateFee,
    setLateFee,

    emiCalculation,
    setEMICalculation,
    repaymentType,
    setRepaymentType,
    duration,
    setDuration,
    durationType,
    setDurationType,

    purpose,
    setPurpose,
    remarks,
    setRemarks,

    guarantorName,
    setGuarantorName,
    guarantorPhone,
    setGuarantorPhone,
    guarantorOccupation,
    setGuarantorOccupation,
    guarantorAddress,
    setGuarantorAddress,

    guarantorVerificationStatus,
    setGuarantorVerificationStatus,

    guarantorIdentityVerification,
    setGuarantorIdentityVerification,

    loanApproved,

    disbursementDate,
    paymentMode,
    setPaymentMode,
    transactionStatus,
    setTransactionStatus,
    disbursementReceiptNumber,

    loanStatistics,
    refreshLoanStatistics,

    principal,
    totalInstallments,
    loanDate,
    maturityDate,
    schedule,
    totalInterest,
    totalPayable,
    installmentAmount,
    loanTypeLabel,
    netDisbursement,

    reviewData,

    handleSaveDraft,
    handleRejectLoan,
    handleApproveLoan,

    isLoanProcessing,
    resetLoanWorkspace,
  } = props;

  const safeDisbursementAmount = getDisbursementAmount(netDisbursement);

  const previousNavigationDisabled = step === 1 || (isGoldLoan && step === 2);

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <section style={shellStyle}>
      <div style={contentStyle}>
        {/* ====================================================
            STEP 1 — LOAN DETAILS
        ==================================================== */}

        {step === 1 && (
          <section style={step1WorkspaceStyle}>
            <div style={step1TopStyle}>
              <div style={step1CustomerStyle}>
                <LoanCustomerCard
                  customerName={activeCustomerName}
                  customerId={activeCustomerId}
                  phoneNumber={activeCustomerPhone}
                  photo={selectedCustomer?.photo}
                  customers={loanCustomerOptions}
                  onCustomerSelect={setSelectedCustomer}
                />
              </div>

              <div style={step1OverviewStyle}>
                <LoanStatistics
                  totalLoans={loanStatistics.totalLoans}
                  activeLoans={loanStatistics.activeLoans}
                  totalDisbursed={loanStatistics.totalDisbursed}
                />
              </div>
            </div>

            <div style={step1BottomStyle}>
              <div style={step1FormStyle}>
                <LoanForm
                  loanNumberPreview={loanNumberPreview}
                  loanAmount={loanAmount}
                  emiCalculation={emiCalculation}
                  interest={interest}
                  processingFee={processingFee}
                  advanceDeduction={advanceDeduction}
                  lateFee={lateFee}
                  repaymentType={repaymentType}
                  duration={duration}
                  durationType={durationType}
                  purpose={purpose}
                  remarks={remarks}
                  onLoanAmountChange={setLoanAmount}
                  onEMICalculationChange={setEMICalculation}
                  onInterestChange={setInterest}
                  onProcessingFeeChange={setProcessingFee}
                  onAdvanceDeductionChange={setAdvanceDeduction}
                  onLateFeeChange={setLateFee}
                  onRepaymentTypeChange={setRepaymentType}
                  onDurationChange={setDuration}
                  onDurationTypeChange={setDurationType}
                  onPurposeChange={setPurpose}
                  onRemarksChange={setRemarks}
                />
              </div>

              <div style={step1PreviewStyle}>
                <LoanPreviewCard
                  customerName={activeCustomerName}
                  loanAmount={Number(loanAmount || 0)}
                  loanType={loanTypeLabel}
                  loanStatus="--"
                  interest={Number(interest || 0)}
                  totalInterest={totalInterest}
                  totalPayable={totalPayable}
                  installmentAmount={installmentAmount}
                  loanDate={formatIndianDate(loanDate)}
                  maturityDate={formatIndianDate(maturityDate)}
                  processingFee={Number(processingFee || 0)}
                  advanceDeduction={Number(advanceDeduction || 0)}
                  netDisbursement={
                    Number(loanAmount || 0) -
                    Number(processingFee || 0) -
                    Number(advanceDeduction || 0)
                  }
                  lateFee={Number(lateFee || 0)}
                  repaymentType={
                    repaymentType ? repaymentType.toUpperCase() : "--"
                  }
                />
              </div>
            </div>
          </section>
        )}

        {/* ====================================================
            STEP 2 — REPAYMENT
        ==================================================== */}

        {step === 2 && (
          <section style={step2WorkspaceStyle}>
            {/* ==================================================
        GOLD LOAN — REPAYMENT TERMS

        Gold Step 1 already owns:
        - Customer
        - Gold valuation
        - Eligible amount
        - Requested amount
        - Sanctioned principal
        - Custody location

        Shared Step 2 owns:
        - EMI method
        - Interest
        - Fees
        - Advance deduction
        - Duration
        - Purpose / remarks

        Sanctioned principal remains read-only.
    ================================================== */}

            {isGoldLoan && (
              <LoanForm
                loanNumberPreview={loanNumberPreview}
                loanAmount={loanAmount}
                loanAmountReadOnly
                emiCalculation={emiCalculation}
                interest={interest}
                processingFee={processingFee}
                advanceDeduction={advanceDeduction}
                lateFee={lateFee}
                repaymentType={repaymentType}
                duration={duration}
                durationType={durationType}
                purpose={purpose}
                remarks={remarks}
                onLoanAmountChange={setLoanAmount}
                onEMICalculationChange={setEMICalculation}
                onInterestChange={setInterest}
                onProcessingFeeChange={setProcessingFee}
                onAdvanceDeductionChange={setAdvanceDeduction}
                onLateFeeChange={setLateFee}
                onRepaymentTypeChange={setRepaymentType}
                onDurationChange={setDuration}
                onDurationTypeChange={setDurationType}
                onPurposeChange={setPurpose}
                onRemarksChange={setRemarks}
              />
            )}

            {/* ==================================================
        REPAYMENT PREVIEW / SCHEDULE

        STANDARD:
        Terms were entered in Standard Step 1.

        GOLD:
        Terms are entered immediately above in Gold Step 2.
    ================================================== */}

            <div style={step2GridStyle}>
              <div style={step2LeftColumnStyle}>
                <div style={step2SummaryWrapperStyle}>
                  <RepaymentSummary
                    loanAmount={principal}
                    totalInterest={totalInterest}
                    installmentAmount={installmentAmount}
                    totalInstallments={totalInstallments}
                    totalRepayable={totalPayable}
                    repaymentMethod={emiCalculation}
                    repaymentFrequency={repaymentType.toLowerCase()}
                  />
                </div>

                <div style={step2PreviewDraftStackStyle}>
                  <div style={step2PreviewWrapperStyle}>
                    <RepaymentPreviewCard
                      frequency={
                        repaymentType ? repaymentType.toUpperCase() : "--"
                      }
                      repaymentMethod={emiCalculation}
                      installmentAmount={installmentAmount}
                      totalInstallments={totalInstallments}
                      totalRepayable={totalPayable}
                      firstInstallmentDate={
                        schedule.length
                          ? formatIndianDate(new Date(schedule[0].dueDate))
                          : "--"
                      }
                      lastInstallmentDate={
                        schedule.length
                          ? formatIndianDate(
                              new Date(schedule[schedule.length - 1].dueDate),
                            )
                          : "--"
                      }
                    />
                  </div>
                </div>
              </div>

              <div style={step2ScheduleWrapperStyle}>
                <LoanScheduleTable schedule={schedule} />
              </div>
            </div>
          </section>
        )}

        {/* ====================================================
            STEP 3 — DOCUMENTS
        ==================================================== */}

        {step === 3 && (
          <section style={step1WorkspaceStyle}>
            <DocumentsStudio
              customerName={
                activeCustomerName ||
                selectedCustomer?.customerName ||
                customerName ||
                "Customer"
              }
              customerPhoto={selectedCustomer?.photo}
              items={documents}
              onDocumentsChange={setDocuments}
            />
          </section>
        )}

        {/* ====================================================
            STEP 4 — GUARANTOR
        ==================================================== */}

        {step === 4 && (
          <section style={step1WorkspaceStyle}>
            <GuarantorHeader />

            <div style={step1BottomStyle}>
              <div style={step1FormStyle}>
                <GuarantorForm
                  guarantorName={guarantorName}
                  guarantorPhone={guarantorPhone}
                  occupation={guarantorOccupation}
                  address={guarantorAddress}
                  onGuarantorNameChange={setGuarantorName}
                  onGuarantorPhoneChange={setGuarantorPhone}
                  onOccupationChange={setGuarantorOccupation}
                  onAddressChange={setGuarantorAddress}
                />

                <GuarantorVerification
                  verificationStatus={guarantorVerificationStatus}
                  identityVerification={guarantorIdentityVerification}
                  onVerificationStatusChange={setGuarantorVerificationStatus}
                  onIdentityVerificationChange={
                    setGuarantorIdentityVerification
                  }
                />
              </div>

              <div style={step1PreviewStyle}>
                <GuarantorPreviewCard
                  guarantorName={guarantorName}
                  mobileNumber={guarantorPhone}
                  occupation={guarantorOccupation}
                  address={guarantorAddress}
                />
              </div>
            </div>
          </section>
        )}

        {/* ====================================================
            STEP 5 — REVIEW
        ==================================================== */}

        {step === 5 && (
          <section style={step5WorkspaceStyle}>
            <ReviewHeader />

            <div style={step5BottomStyle}>
              <div style={step5ChecklistColumnStyle}>
                <ValidationChecklist review={reviewData} />
              </div>

              <div style={step5PreviewColumnStyle}>
                <ReviewPreviewCard review={reviewData} />
              </div>
            </div>
          </section>
        )}

        {/* ====================================================
            STEP 6 — DISBURSEMENT
           
            MOBILE:
              1. Disbursement Mode
              2. Payment Mode
              3. Receipt
              4. Preview
              5. Approval Actions
           
            TABLET / LAPTOP / DESKTOP:
              Mode      | Receipt
              Payment   | Preview
              Approval Actions — full width
           
            IMPORTANT:
            Approval Actions are intentionally rendered LAST
            in the grid contract.
        ==================================================== */}

        {step === 6 && (
          <section style={step6WorkspaceStyle}>
            <DisbursementHeader />

            <div style={step6BottomStyle}>
              {/* =================================================
                  FORM GROUP
                 
                  Responsive Engine converts this wrapper to
                  display: contents so each card participates
                  directly in the Step 6 grid.
              ================================================= */}

              <div style={resolvedStep6FormStyle}>
                {/* =================================================
                    1. DISBURSEMENT MODE
                ================================================= */}

                <div style={step6DisbursementWrapperStyle}>
                  <DisbursementForm
                    disbursementDate={disbursementDate}
                    netDisbursement={netDisbursement}
                  />
                </div>

                {/* =================================================
                    2. PAYMENT MODE
                ================================================= */}

                <div style={step6PaymentModeWrapperStyle}>
                  <PaymentModeCard
                    paymentMode={paymentMode}
                    transactionStatus={transactionStatus}
                    onPaymentModeChange={setPaymentMode}
                    onTransactionStatusChange={(value) => {
                      setTransactionStatus(value);
                    }}
                  />
                </div>

                {/* =================================================
                    5. APPROVAL ACTIONS — FINAL
                ================================================= */}

                <div style={step6ApprovalActionsWrapperStyle}>
                  <ApprovalActions
                    onSaveDraft={handleSaveDraft}
                    onApproveLoan={handleApproveLoan}
                    onRejectLoan={handleRejectLoan}
                  />
                </div>
              </div>

              {/* =================================================
                  RECEIPT + PREVIEW GROUP
                 
                  Responsive Engine converts this wrapper to
                  display: contents.
              ================================================= */}

              <div style={step6PreviewColumnStyle}>
                {/* =================================================
                    3. DISBURSEMENT RECEIPT
                ================================================= */}

                <div style={step6ReceiptWrapperStyle}>
                  <DisbursementReceipt
                    receiptNumber={disbursementReceiptNumber}
                    customerName={activeCustomerName || "--"}
                    amount={safeDisbursementAmount}
                    paymentMode={paymentMode}
                  />
                </div>

                {/* =================================================
                    4. DISBURSEMENT PREVIEW
                ================================================= */}

                <div style={step6PreviewCardWrapperStyle}>
                  <DisbursementPreviewCard
                    disbursementDate={
                      disbursementDate
                        ? formatIndianDate(
                            new Date(`${disbursementDate}T00:00:00`),
                          )
                        : "--"
                    }
                    amount={safeDisbursementAmount}
                    paymentMode={paymentMode}
                    transactionStatus={transactionStatus}
                  />
                </div>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* ========================================================
          WIZARD FOOTER
      ======================================================== */}

      {isLoanProcessing && (
        <GlobalLoadingOverlay
          message="Creating Loan..."
        />
      )}

      <footer style={footerStyle}>
        <div style={stepListStyle}>
          {STEP_ITEMS.map((item, index) => {
            const current = index + 1;

            const active = current === step;

            const completed = current < step;

            return (
              <div
                key={item.title}
                style={stepItemStyle}
                onClick={() => {
                  /*
                   * Gold Step 1 belongs to GoldLoanForm.
                   *
                   * Never allow the shared Loan Studio to expose the
                   * Standard Loan Details page for a Gold Loan.
                   */
                  if (isGoldLoan && current === 1) {
                    props.onGoldStepOneDetails?.();

                    return;
                  }

                  if (current === 6) {
                    setStep(6);

                    return;
                  }

                  if (
                    step === 4 &&
                    current > 4 &&
                    guarantorVerificationStatus.trim().toLowerCase() !==
                      "verified"
                  ) {
                    alert(
                      "Guarantor verification must be Verified before proceeding to Review.",
                    );

                    return;
                  }

                  setStep(current);
                }}
              >
                <div
                  style={
                    active
                      ? activeStepNumberStyle
                      : completed
                        ? completedStepNumberStyle
                        : pendingStepNumberStyle
                  }
                >
                  {current}
                </div>

                <div style={stepTextStyle}>
                  <span
                    style={
                      active
                        ? activeStepTitleStyle
                        : completed
                          ? completedStepTitleStyle
                          : pendingStepTitleStyle
                    }
                  >
                    {item.title}
                  </span>

                  <span style={stepSubtitleStyle}>{item.subtitle}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div style={navigationStyle}>
          <button
            type="button"
            disabled={previousNavigationDisabled}
            onClick={() => {
              if (previousNavigationDisabled) {
                return;
              }

              if (step > 1) {
                setStep(step - 1);
              }
            }}
            style={
              previousNavigationDisabled
                ? disabledNavigationButtonStyle
                : navigationButtonStyle
            }
          >
            ← Previous
          </button>

          <button
            type="button"
            style={primaryNavigationButtonStyle}
            onClick={async () => {
              if (step < 6) {
                if (
                  step === 4 &&
                  guarantorVerificationStatus.trim().toLowerCase() !==
                    "verified"
                ) {
                  alert(
                    "Guarantor verification must be Verified before proceeding to Review.",
                  );

                  return;
                }

                setStep(step + 1);

                return;
              }

              if (!loanApproved) {
                alert("Please Approve Loan before completing Disbursement");

                return;
              }

              await refreshLoanStatistics();

              alert("Loan Disbursement Workflow Completed Successfully");

              resetLoanWorkspace();
            }}
          >
            {step === 6 ? "Finish Review" : "Next →"}
          </button>
        </div>
      </footer>
    </section>
  );
}

/* ============================================================
   END
============================================================ */
