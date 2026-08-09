// ============================================================
// FINORA ENTERPRISE OS™
//
// LOAN STUDIO™
//
// CUSTOMER WORKSPACE
//
// MODULE  : Loan
// LAYER   : UI / Customer Office
// VERSION : 2.0
// STATUS  : Production
//
// RESPONSIBILITY:
//
// - Render the complete Loan Studio workflow
// - Collect Loan configuration
// - Calculate finance values
// - Generate repayment schedule
// - Build Loan domain record
// - Delegate Loan persistence to LoanService
// - Prevent duplicate Loan creation through LoanService
//
// IMPORTANT:
//
// - No direct localStorage access.
// - No filesystem access.
// - No Electron IPC.
// - No direct LoanRepository access.
// - Loan persistence remains below the Service layer.
// - Existing Loan workflow and calculations are preserved.
//
// ============================================================


// ============================================================
// LOAN DETAILS
// ============================================================

import LoanHeader
  from "../../../../loans/details/LoanHeader";

import LoanForm
  from "../../../../loans/details/LoanForm";

import LoanCustomerCard
  from "../../../../loans/details/LoanCustomerCard";

import LoanPreviewCard
  from "../../../../loans/details/LoanPreviewCard";

import LoanStatistics
  from "../../../../loans/details/LoanStatistics";


// ============================================================
// FINANCE
// ============================================================

import FinanceHeader
  from "../../../../loans/finance/FinanceHeader";

import InterestConfiguration
  from "../../../../loans/finance/InterestConfiguration";

import ProcessingFeeCard
  from "../../../../loans/finance/ProcessingFeeCard";

import PenaltyConfiguration
  from "../../../../loans/finance/PenaltyConfiguration";

import FinancePreviewCard
  from "../../../../loans/finance/FinancePreviewCard";

import FinanceDraftStatus
  from "../../../../loans/finance/FinanceDraftStatus";


// ============================================================
// GUARANTOR
// ============================================================

import GuarantorHeader
  from "../../../../loans/guarantor/GuarantorHeader";

import GuarantorForm
  from "../../../../loans/guarantor/GuarantorForm";

import RelationshipCard
  from "../../../../loans/guarantor/RelationshipCard";

import GuarantorVerification
  from "../../../../loans/guarantor/GuarantorVerification";

import GuarantorPreviewCard
  from "../../../../loans/guarantor/GuarantorPreviewCard";

import GuarantorDraftStatus
  from "../../../../loans/guarantor/GuarantorDraftStatus";


// ============================================================
// REPAYMENT
// ============================================================

import RepaymentHeader
  from "../../../../loans/repayment/RepaymentHeader";

import EMIConfiguration
  from "../../../../loans/repayment/EMIConfiguration";

import ScheduleConfiguration
  from "../../../../loans/repayment/ScheduleConfiguration";

import RepaymentSummary
  from "../../../../loans/repayment/RepaymentSummary";

import RepaymentPreviewCard
  from "../../../../loans/repayment/RepaymentPreviewCard";

import RepaymentDraftStatus
  from "../../../../loans/repayment/RepaymentDraftStatus";


// ============================================================
// DISBURSEMENT
// ============================================================

import DisbursementHeader
  from "../../../../loans/disbursement/DisbursementHeader";

import DisbursementForm
  from "../../../../loans/disbursement/DisbursementForm";

import PaymentModeCard
  from "../../../../loans/disbursement/PaymentModeCard";

import DisbursementReceipt
  from "../../../../loans/disbursement/DisbursementReceipt";

import DisbursementPreviewCard
  from "../../../../loans/disbursement/DisbursementPreviewCard";

import DisbursementDraftStatus
  from "../../../../loans/disbursement/DisbursementDraftStatus";


// ============================================================
// REVIEW
// ============================================================

import ReviewHeader
  from "../../../../loans/review/ReviewHeader";

import LoanSummary
  from "../../../../loans/review/LoanSummary";

import ValidationChecklist
  from "../../../../loans/review/ValidationChecklist";

import ApprovalActions
  from "../../../../loans/review/ApprovalActions";

import ReviewPreviewCard
  from "../../../../loans/review/ReviewPreviewCard";

import ReviewDraftStatus
  from "../../../../loans/review/ReviewDraftStatus";


// ============================================================
// SCHEDULE
// ============================================================

import LoanScheduleTable
  from "../../../../loans/schedule/LoanScheduleTable";

import {
  generateSchedule,
} from "../../../../loans/schedule/schedule.helpers";


// ============================================================
// LOAN SERVICES
// ============================================================

import {
  buildLoan,
} from "../../../../../services/loan/loanBuilder";

import {
  createLoan,
  hasExistingLoan,
} from "../../../../../services/loan/loanService";


// ============================================================
// TYPES
// ============================================================

import type {
  LoanReviewData,
} from "../../../../loans/review/types";


// ============================================================
// REACT
// ============================================================

import {
  useState,
} from "react";


// ============================================================
// PROPS
// ============================================================

interface LoanStudioProps {

  customerName?: string;

  customerId?: string;

  phoneNumber?: string;

}


// ============================================================
// COMPONENT
// ============================================================

export default function LoanStudio({

  customerName,

  customerId,

  phoneNumber,

}: LoanStudioProps) {


  // ==========================================================
  // WIZARD
  // ==========================================================

  const [
    step,
    setStep,
  ] = useState(1);


  // ==========================================================
  // LOAN
  // ==========================================================

  const [
    loanAmount,
    setLoanAmount,
  ] = useState("0");

  const [
    loanType,
    setLoanType,
  ] = useState("");

  const [
    loanStatus,
    setLoanStatus,
  ] = useState("Pending Approval");


  // ==========================================================
  // FINANCE
  // ==========================================================

  const [
    interest,
    setInterest,
  ] = useState("0");

  const [
    interestType,
    setInterestType,
  ] = useState("Flat Interest");

  const [
    processingFee,
    setProcessingFee,
  ] = useState("0");

  const [
    advanceDeduction,
    setAdvanceDeduction,
  ] = useState("0");


  // ==========================================================
  // PENALTY
  // ==========================================================

  const [
    penaltyType,
    setPenaltyType,
  ] = useState("Fixed Amount");

  const [
    penaltyValue,
    setPenaltyValue,
  ] = useState("0");

  const [
    lateFee,
    setLateFee,
  ] = useState("0");


  // ==========================================================
  // REPAYMENT
  // ==========================================================

  const [
    repaymentType,
    setRepaymentType,
  ] = useState("DAILY");

  const [
    duration,
    setDuration,
  ] = useState("12");

  const [
    durationType,
    setDurationType,
  ] = useState("months");


  // ==========================================================
  // GUARANTOR
  // ==========================================================

  const [
    guarantorName,
    setGuarantorName,
  ] = useState("");

  const [
    guarantorPhone,
    setGuarantorPhone,
  ] = useState("");

  const [
    guarantorOccupation,
    setGuarantorOccupation,
  ] = useState("");

  const [
    guarantorAddress,
    setGuarantorAddress,
  ] = useState("");


  // ==========================================================
  // NOTES
  // ==========================================================

  const [
    purpose,
    setPurpose,
  ] = useState("");

  const [
    remarks,
    setRemarks,
  ] = useState("");


  // ==========================================================
  // APPROVAL
  // ==========================================================

  const [
    loanApproved,
    setLoanApproved,
  ] = useState(false);


  // ==========================================================
  // FINANCE CALCULATIONS
  // ==========================================================

  const principal =
    Number(loanAmount || 0);

  const interestRate =
    Number(interest || 0);

  const durationValue =
    Number(duration || 0);


  // ==========================================================
  // INTEREST ENGINE
  //
  // FINORA RULE:
  //
  // Interest rate always monthly basis.
  //
  // ==========================================================

  const normalizedRepayment =
    repaymentType.toUpperCase();


  const monthlyInterestAmount =
    (
      principal *
      interestRate
    ) / 100;


  // ==========================================================
  // FLAT INTEREST CALCULATION
  // ==========================================================

  const totalInterest =
    Math.round(

      repaymentType.toUpperCase() ===
      "MONTHLY"

        ? monthlyInterestAmount *
          durationValue

        : repaymentType.toUpperCase() ===
          "WEEKLY"

        ? (
            monthlyInterestAmount /
            4.33
          ) *
          durationValue

        : repaymentType.toUpperCase() ===
          "DAILY"

        ? (
            monthlyInterestAmount /
            30
          ) *
          durationValue

        : monthlyInterestAmount,

    );


  const totalPayable =
    Math.round(

      principal +
      totalInterest,

    );


  const installmentAmount =
    durationValue > 0

      ? Math.round(
          totalPayable /
          durationValue,
        )

      : 0;


  // ==========================================================
  // DATES
  // ==========================================================

  const loanDate =
    new Date();


  const maturityDate =
    new Date(
      loanDate,
    );


  // ==========================================================
  // REPAYMENT SCHEDULE
  // ==========================================================

  const schedule =
    generateSchedule(

      durationValue,

      loanDate,

      repaymentType.toLowerCase() as
        | "daily"
        | "weekly"
        | "monthly",

      totalPayable,

      totalInterest,

    );


  // ==========================================================
  // MATURITY DATE
  // ==========================================================

  switch (
    durationType
  ) {

    case "days":

      maturityDate.setDate(

        maturityDate.getDate() +
        durationValue,

      );

      break;


    case "weeks":

      maturityDate.setDate(

        maturityDate.getDate() +
        (
          durationValue *
          7
        ),

      );

      break;


    case "months":

      maturityDate.setMonth(

        maturityDate.getMonth() +
        durationValue,

      );

      break;


    case "years":

      maturityDate.setFullYear(

        maturityDate.getFullYear() +
        durationValue,

      );

      break;

  }


  // ==========================================================
  // NET DISBURSEMENT
  // ==========================================================

  const netDisbursement =
    principal -
    Number(processingFee) -
    Number(advanceDeduction);


  // ==========================================================
  // REVIEW DATA
  // ==========================================================

  const reviewData:
    LoanReviewData = {

    customerId,

    customerName:
      customerName ??
      "--",

    phoneNumber,

    loanAmount:
      Number(loanAmount),

    loanType,

    interestType,

    interestRate:
      Number(interest),

    repaymentType,

    duration:
      `${duration} ${durationType}`,

    processingFee:
      Number(processingFee),

    advanceDeduction:
      Number(advanceDeduction),

    netDisbursement,

    penaltyType,

    penaltyValue:
      Number(penaltyValue),

    guarantorName,

    guarantorPhone,

    guarantorOccupation,

    totalInstallments:
      schedule.length,

    loanStatus,

  };


  // ==========================================================
  // APPROVAL WORKFLOW
  // ==========================================================

  function handleSaveDraft(): void {

    console.log(
      "Save Draft",
    );

  }


  function handleRejectLoan(): void {

    console.log(
      "Reject Loan",
    );

  }


  // ==========================================================
  // APPROVE LOAN
  // ==========================================================

  async function handleApproveLoan(): Promise<void> {

    // --------------------------------------------------------
    // ALREADY APPROVED
    // --------------------------------------------------------

    if (
      loanApproved
    ) {

      alert(
        "Loan already created",
      );

      return;

    }


    // --------------------------------------------------------
    // LOAN TYPE VALIDATION
    // --------------------------------------------------------

    if (
      !loanType
    ) {

      alert(
        "Please select Loan Type",
      );

      return;

    }


    // --------------------------------------------------------
    // NORMALIZE LOAN VALUES
    // --------------------------------------------------------

    const normalizedLoanType =
      loanType.toUpperCase();


    const normalizedRepaymentType =
      repaymentType.toUpperCase();


    // --------------------------------------------------------
    // BUILD PERSISTENT LOAN TITLE
    // --------------------------------------------------------

    const loanTitle =
      normalizedLoanType ===
      "DAILY"

        ? "Daily Loan"

        : normalizedLoanType ===
          "WEEKLY"

        ? "Weekly Loan"

        : normalizedLoanType ===
          "MONTHLY"

        ? "Monthly Loan"

        : "Loan";


    // --------------------------------------------------------
    // DUPLICATE LOAN CHECK
    //
    // Persistence lookup is delegated to LoanService.
    // No direct localStorage access is allowed here.
    // --------------------------------------------------------

    const alreadyExists =
      await hasExistingLoan(
        customerId,
        loanTitle,
        principal,
      );


    if (
      alreadyExists
    ) {

      alert(
        "Loan already created",
      );

      setLoanApproved(
        true,
      );

      return;

    }


    // --------------------------------------------------------
    // DEBUG VALUES
    // --------------------------------------------------------

    console.log(
      "APPROVE LOAN VALUES",
      {
        principal,
        totalPayable,
        interestRate,
        durationValue,
        loanType,
        schedule,
      },
    );


    // --------------------------------------------------------
    // BUILD LOAN
    // --------------------------------------------------------

    const loan =
      buildLoan({

        id:
          crypto.randomUUID(),

        title:
          loanTitle,

        amount:
          principal,

        outstanding:
          totalPayable,

        interest:
          interestRate,

        processingFee:
          Number(processingFee),

        lateFee:
          Number(lateFee),

        loanDate:
          loanDate.toISOString(),

        dueDate:
          maturityDate.toISOString(),

        guarantor:
          guarantorName,

        customerId,

        customerName,

        phoneNumber,

        loanType:
          normalizedLoanType,

        repaymentType:
          normalizedRepaymentType,

        duration:
          durationValue,

        durationType,

        advanceDeduction:
          Number(advanceDeduction),

        netDisbursement,

        purpose,

        remarks,

        schedule,

      });


    // --------------------------------------------------------
    // CREATE LOAN
    //
    // Loan persistence remains behind LoanService.
    // --------------------------------------------------------

    const createResult =
      await createLoan(
        loan,
      );


    // --------------------------------------------------------
    // PERSISTENCE RESULT
    // --------------------------------------------------------

    if (
      !createResult.success
    ) {

      console.error(
        "LOAN CREATE ERROR:",
        createResult.error,
      );

      alert(
        createResult.error ??
        "Unable to create loan.",
      );

      return;

    }


    // --------------------------------------------------------
    // APPROVAL STATE
    // --------------------------------------------------------

    setLoanApproved(
      true,
    );


    alert(
      "Loan Created Successfully",
    );

  }


  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <section

      style={{

        background:
          "#FFFFFF",

        border:
          "1px solid #E2E8F0",

        borderRadius:
          "20px",

        padding:
          "28px",

        minHeight:
          "720px",

        boxShadow:
          "0 8px 24px rgba(15,23,42,.06)",

        display:
          "flex",

        flexDirection:
          "column",

        gap:
          "28px",

      }}

    >

      {/* =====================================================
          HEADER
          ===================================================== */}

      <div>

        <h2

          style={{

            margin:
              0,

            fontSize:
              "26px",

            fontWeight:
              700,

            color:
              "#0F172A",

          }}

        >

          Loan Studio™

        </h2>


        <p

          style={{

            marginTop:
              "8px",

            color:
              "#64748B",

            fontSize:
              "15px",

          }}

        >

          Create and manage customer loans using the
          complete Finora Enterprise workflow.

        </p>

      </div>


      {/* =====================================================
          LOAN PROGRESS
          ===================================================== */}

      <div

        style={{

          display:
            "flex",

          justifyContent:
            "space-between",

          alignItems:
            "center",

          marginTop:
            "10px",

          marginBottom:
            "20px",

          gap:
            "12px",

        }}

      >

        {[
          "Loan",
          "Finance",
          "Guarantor",
          "Repayment",
          "Disbursement",
          "Review",
        ].map(
          (
            label,
            index,
          ) => {

            const current =
              index + 1;


            return (

              <div

                key={
                  label
                }

                onClick={() =>
                  setStep(
                    current,
                  )
                }

                style={{

                  flex:
                    1,

                  textAlign:
                    "center",

                  cursor:
                    "pointer",

                }}

              >

                <div

                  style={{

                    width:
                      "42px",

                    height:
                      "42px",

                    margin:
                      "0 auto",

                    borderRadius:
                      "50%",

                    display:
                      "flex",

                    alignItems:
                      "center",

                    justifyContent:
                      "center",

                    fontWeight:
                      700,

                    color:
                      "#FFFFFF",

                    background:

                      current < step

                        ? "#16A34A"

                        : current === step

                        ? "#B8860B"

                        : "#CBD5E1",

                  }}

                >

                  {
                    current
                  }

                </div>


                <div

                  style={{

                    marginTop:
                      "8px",

                    fontSize:
                      "12px",

                    fontWeight:
                      600,

                    color:

                      current === step

                        ? "#6F4A23"

                        : "#64748B",

                  }}

                >

                  {
                    label
                  }

                </div>

              </div>

            );

          },
        )}

      </div>


      {/* =====================================================
          STEP 1 — LOAN DETAILS
          ===================================================== */}

      {step === 1 && (

        <section

          style={{

            display:
              "flex",

            flexDirection:
              "column",

            gap:
              "24px",

          }}

        >

          <LoanHeader />


          <LoanStatistics

            totalLoans={
              0
            }

            activeLoans={
              0
            }

            totalDisbursed={
              0
            }

          />


          <div

            style={{

              display:
                "grid",

              gridTemplateColumns:
                "2fr 1fr",

              gap:
                "24px",

              alignItems:
                "start",

            }}

          >

            <LoanForm

              loanAmount={
                loanAmount
              }

              loanType={
                loanType
              }

              interest={
                interest
              }

              processingFee={
                processingFee
              }

              advanceDeduction={
                advanceDeduction
              }

              lateFee={
                lateFee
              }

              repaymentType={
                repaymentType
              }

              duration={
                duration
              }

              durationType={
                durationType
              }

              purpose={
                purpose
              }

              remarks={
                remarks
              }

              onLoanAmountChange={
                setLoanAmount
              }

              onLoanTypeChange={
                setLoanType
              }

              onInterestChange={
                setInterest
              }

              onProcessingFeeChange={
                setProcessingFee
              }

              onAdvanceDeductionChange={
                setAdvanceDeduction
              }

              onLateFeeChange={
                setLateFee
              }

              onRepaymentTypeChange={
                setRepaymentType
              }

              onDurationChange={
                setDuration
              }

              onDurationTypeChange={
                setDurationType
              }

              onPurposeChange={
                setPurpose
              }

              onRemarksChange={
                setRemarks
              }

              loanStatus={
                loanStatus
              }

              onLoanStatusChange={
                setLoanStatus
              }

            />


            <div

              style={{

                display:
                  "flex",

                flexDirection:
                  "column",

                gap:
                  "18px",

              }}

            >

              <LoanCustomerCard

                customerName={
                  customerName
                }

                customerId={
                  customerId
                }

                phoneNumber={
                  phoneNumber
                }

              />


              <LoanPreviewCard

                customerName={
                  customerName
                }

                loanAmount={
                  Number(
                    loanAmount ||
                    0,
                  )
                }

                loanType={

                  loanType ===
                  "DAILY"

                    ? "Daily Loan"

                    : loanType ===
                      "WEEKLY"

                    ? "Weekly Loan"

                    : loanType ===
                      "MONTHLY"

                    ? "Monthly Loan"

                    : "--"

                }

                interest={
                  Number(
                    interest ||
                    0,
                  )
                }

                totalInterest={
                  totalInterest
                }

                totalPayable={
                  totalPayable
                }

                installmentAmount={
                  installmentAmount
                }

                loanDate={
                  loanDate.toLocaleDateString()
                }

                maturityDate={
                  maturityDate.toLocaleDateString()
                }

                processingFee={
                  Number(
                    processingFee ||
                    0,
                  )
                }

                advanceDeduction={
                  Number(
                    advanceDeduction ||
                    0,
                  )
                }

                netDisbursement={

                  Number(
                    loanAmount ||
                    0,
                  ) -

                  Number(
                    processingFee ||
                    0,
                  ) -

                  Number(
                    advanceDeduction ||
                    0,
                  )

                }

                lateFee={
                  Number(
                    lateFee ||
                    0,
                  )
                }

                repaymentType={
                  repaymentType
                }

              />


              <LoanScheduleTable

                schedule={
                  schedule
                }

              />

            </div>

          </div>

        </section>

      )}


      {/* =====================================================
          STEP 2 — FINANCE STUDIO
          ===================================================== */}

      {step === 2 && (

        <section

          style={{

            display:
              "flex",

            flexDirection:
              "column",

            gap:
              "24px",

          }}

        >

          <FinanceHeader />


          <div

            style={{

              display:
                "grid",

              gridTemplateColumns:
                "2fr 1fr",

              gap:
                "24px",

              alignItems:
                "start",

            }}

          >

            <div

              style={{

                display:
                  "flex",

                flexDirection:
                  "column",

                gap:
                  "24px",

              }}

            >

              <InterestConfiguration

                interestType={
                  interestType
                }

                interestRate={
                  interest
                }

                onInterestTypeChange={
                  setInterestType
                }

                onInterestRateChange={
                  setInterest
                }

              />


              <ProcessingFeeCard

                processingFee={
                  processingFee
                }

                onProcessingFeeChange={
                  setProcessingFee
                }

              />


              <PenaltyConfiguration

                penaltyType={
                  penaltyType
                }

                penaltyValue={
                  penaltyValue
                }

                onPenaltyTypeChange={
                  setPenaltyType
                }

                onPenaltyValueChange={
                  setPenaltyValue
                }

              />

            </div>


            <div

              style={{

                display:
                  "flex",

                flexDirection:
                  "column",

                gap:
                  "18px",

              }}

            >

              <FinancePreviewCard

                interestType={
                  interestType
                }

                interestRate={
                  interestRate
                }

                processingFee={
                  Number(
                    processingFee,
                  )
                }

                penaltyValue={
                  Number(
                    lateFee,
                  )
                }

              />


              <FinanceDraftStatus />

            </div>

          </div>

        </section>

      )}


      {/* =====================================================
          STEP 3 — GUARANTOR STUDIO
          ===================================================== */}

      {step === 3 && (

        <section

          style={{

            display:
              "flex",

            flexDirection:
              "column",

            gap:
              "24px",

          }}

        >

          <GuarantorHeader />


          <div

            style={{

              display:
                "grid",

              gridTemplateColumns:
                "2fr 1fr",

              gap:
                "24px",

              alignItems:
                "start",

            }}

          >

            <div

              style={{

                display:
                  "flex",

                flexDirection:
                  "column",

                gap:
                  "24px",

              }}

            >

              <GuarantorForm

                guarantorName={
                  guarantorName
                }

                guarantorPhone={
                  guarantorPhone
                }

                occupation={
                  guarantorOccupation
                }

                address={
                  guarantorAddress
                }

                onGuarantorNameChange={
                  setGuarantorName
                }

                onGuarantorPhoneChange={
                  setGuarantorPhone
                }

                onOccupationChange={
                  setGuarantorOccupation
                }

                onAddressChange={
                  setGuarantorAddress
                }

              />


              <RelationshipCard />


              <GuarantorVerification />

            </div>


            <div

              style={{

                display:
                  "flex",

                flexDirection:
                  "column",

                gap:
                  "18px",

              }}

            >

              <GuarantorPreviewCard

                guarantorName={
                  guarantorName
                }

                relationship={
                  "--"
                }

                mobileNumber={
                  guarantorPhone
                }

                occupation={
                  guarantorOccupation
                }

                address={
                  guarantorAddress
                }

              />


              <GuarantorDraftStatus />

            </div>

          </div>

        </section>

      )}


      {/* =====================================================
          STEP 4 — REPAYMENT STUDIO
          ===================================================== */}

      {step === 4 && (

        <section

          style={{

            display:
              "flex",

            flexDirection:
              "column",

            gap:
              "24px",

          }}

        >

          <RepaymentHeader />


          <div

            style={{

              display:
                "grid",

              gridTemplateColumns:
                "2fr 1fr",

              gap:
                "24px",

              alignItems:
                "start",

            }}

          >

            <div

              style={{

                display:
                  "flex",

                flexDirection:
                  "column",

                gap:
                  "24px",

              }}

            >

              <EMIConfiguration />

              <ScheduleConfiguration />

              <RepaymentSummary />

            </div>


            <div

              style={{

                display:
                  "flex",

                flexDirection:
                  "column",

                gap:
                  "18px",

              }}

            >

              <RepaymentPreviewCard />

              <RepaymentDraftStatus />

            </div>

          </div>

        </section>

      )}


      {/* =====================================================
          STEP 5 — DISBURSEMENT STUDIO
          ===================================================== */}

      {step === 5 && (

        <section

          style={{

            display:
              "flex",

            flexDirection:
              "column",

            gap:
              "24px",

          }}

        >

          <DisbursementHeader />


          <div

            style={{

              display:
                "grid",

              gridTemplateColumns:
                "2fr 1fr",

              gap:
                "24px",

              alignItems:
                "start",

            }}

          >

            <div

              style={{

                display:
                  "flex",

                flexDirection:
                  "column",

                gap:
                  "24px",

              }}

            >

              <DisbursementForm />

              <PaymentModeCard />

              <DisbursementReceipt />

            </div>


            <div

              style={{

                display:
                  "flex",

                flexDirection:
                  "column",

                gap:
                  "18px",

              }}

            >

              <DisbursementPreviewCard />

              <DisbursementDraftStatus />

            </div>

          </div>

        </section>

      )}


      {/* =====================================================
          STEP 6 — REVIEW STUDIO
          ===================================================== */}

      {step === 6 && (

        <section

          style={{

            display:
              "flex",

            flexDirection:
              "column",

            gap:
              "24px",

          }}

        >

          <ReviewHeader />


          <div

            style={{

              display:
                "grid",

              gridTemplateColumns:
                "2fr 1fr",

              gap:
                "24px",

              alignItems:
                "start",

            }}

          >

            <div

              style={{

                display:
                  "flex",

                flexDirection:
                  "column",

                gap:
                  "24px",

              }}

            >

              <LoanSummary

                review={
                  reviewData
                }

              />


              <ValidationChecklist

                review={
                  reviewData
                }

              />


              <ApprovalActions

                onSaveDraft={
                  handleSaveDraft
                }

                onApproveLoan={
                  handleApproveLoan
                }

                onRejectLoan={
                  handleRejectLoan
                }

              />

            </div>


            <div

              style={{

                display:
                  "flex",

                flexDirection:
                  "column",

                gap:
                  "18px",

              }}

            >

              <ReviewPreviewCard

                review={
                  reviewData
                }

              />


              <ReviewDraftStatus />

            </div>

          </div>

        </section>

      )}


      {/* =====================================================
          WIZARD NAVIGATION
          ===================================================== */}

      <div

        style={{

          display:
            "flex",

          justifyContent:
            "space-between",

          alignItems:
            "center",

          marginTop:
            "24px",

          paddingTop:
            "20px",

          borderTop:
            "1px solid #E2E8F0",

        }}

      >

        <button

          disabled={
            step === 1
          }

          onClick={() =>
            setStep(
              step - 1,
            )
          }

          style={{

            padding:
              "10px 20px",

            borderRadius:
              "10px",

            border:
              "1px solid #D4AF37",

            background:

              step === 1

                ? "#F8FAFC"

                : "#FFFFFF",

            cursor:

              step === 1

                ? "not-allowed"

                : "pointer",

          }}

        >

          ← Back

        </button>


        <span

          style={{

            fontWeight:
              700,

            color:
              "#6F4A23",

          }}

        >

          Step {step} of 6

        </span>


        <button

          disabled={
            false
          }

          onClick={() => {

            if (
              step < 6
            ) {

              setStep(
                step + 1,
              );

              return;

            }


            if (
              !loanApproved
            ) {

              alert(
                "Please Approve Loan before finishing review",
              );

              return;

            }


            alert(
              "Loan Review Completed Successfully",
            );


            setStep(
              1,
            );

          }}

          style={{

            padding:
              "10px 20px",

            borderRadius:
              "10px",

            border:
              "1px solid #D4AF37",

            background:
              "linear-gradient(180deg,#8A6135,#6F4A23)",

            color:
              "#FFF7E3",

            cursor:
              "pointer",

          }}

        >

          {
            step === 6
              ? "Finish Review"
              : "Next →"
          }

        </button>

      </div>

    </section>

  );

}


// ============================================================
// END
// ============================================================
