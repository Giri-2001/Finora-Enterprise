/* ===========================================================
   FINORA ENTERPRISE OS™
   COLLECTION STUDIO™

   COMPONENT
=========================================================== */

import {
  useState,
} from "react";

import type {
  Loan,
} from "../../types";

import type {
  CollectionStudioProps,
} from "./types";

import {
  COLLECTION_STUDIO_LABELS,
} from "./constants";

import {
  getInitialReviewData,
} from "./helpers";

import {
  useCollectionReset,
  useLoanSynchronization,
} from "./hooks";

import {
  containerStyle,
  contentGridStyle,
  loanSelectorInputStyle,
  loanSelectorLabelStyle,
  loanSelectorStyle,
  mainColumnStyle,
  sidebarStyle,
  studioSectionStyle,
} from "./styles";

import {
  CollectionContext,
} from "../../../../../collections/context/CollectionContext";

import CollectionHeader
  from "../../../../../collections/details/CollectionHeader";

import CollectionStatistics
  from "../../../../../collections/details/CollectionStatistics";

import CollectionForm
  from "../../../../../collections/details/CollectionForm";

import CustomerLoanCard
  from "../../../../../collections/details/CustomerLoanCard";

import CollectionPreviewCard
  from "../../../../../collections/details/CollectionPreviewCard";

import CollectionDraftStatus
  from "../../../../../collections/details/CollectionDraftStatus";

import PaymentHeader
  from "../../../../../collections/payment/PaymentHeader";

import PaymentMethodCard
  from "../../../../../collections/payment/PaymentMethodCard";

import PaymentReference
  from "../../../../../collections/payment/PaymentReference";

import PaymentSummary
  from "../../../../../collections/payment/PaymentSummary";

import PaymentPreviewCard
  from "../../../../../collections/payment/PaymentPreviewCard";

import PaymentDraftStatus
  from "../../../../../collections/payment/PaymentDraftStatus";

import ReceiptHeader
  from "../../../../../collections/receipt/ReceiptHeader";

import ReceiptCustomerCard
  from "../../../../../collections/receipt/ReceiptCustomerCard";

import ReceiptDetails
  from "../../../../../collections/receipt/ReceiptDetails";

import ReceiptActions
  from "../../../../../collections/receipt/ReceiptActions";

import ReceiptPreviewCard
  from "../../../../../collections/receipt/ReceiptPreviewCard";

import ReceiptDraftStatus
  from "../../../../../collections/receipt/ReceiptDraftStatus";

import SettlementHeader
  from "../../../../../collections/settlement/SettlementHeader";

import BalanceAdjustment
  from "../../../../../collections/settlement/BalanceAdjustment";

import SettlementSummary
  from "../../../../../collections/settlement/SettlementSummary";

import SettlementActions
  from "../../../../../collections/settlement/SettlementActions";

import SettlementPreviewCard
  from "../../../../../collections/settlement/SettlementPreviewCard";

import SettlementDraftStatus
  from "../../../../../collections/settlement/SettlementDraftStatus";

import ReviewHeader
  from "../../../../../collections/review/ReviewHeader";

import CollectionSummary
  from "../../../../../collections/review/CollectionSummary";

import ValidationChecklist
  from "../../../../../collections/review/ValidationChecklist";

import ReviewActions
  from "../../../../../collections/review/ReviewActions";

import ReviewPreviewCard
  from "../../../../../collections/review/ReviewPreviewCard";

import ReviewDraftStatus
  from "../../../../../collections/review/ReviewDraftStatus";

/* ===========================================================
   COMPONENT
=========================================================== */

export default function CollectionStudio({
  customerName,
  customerId,
  phoneNumber,
  loans = [],
}: CollectionStudioProps) {

  const [selectedLoan, setSelectedLoan] =
    useState<Loan | undefined>(loans[0]);

  const [reviewData, setReviewData] =
    useState<any>({
      ...getInitialReviewData(
        customerId,
        customerName,
        phoneNumber,
      ),
      loanInterestRate: 0,
      loanDate: "",
    });

  useLoanSynchronization(
    customerId,
    customerName,
    phoneNumber,
    selectedLoan,
    setReviewData,
  );

  useCollectionReset(
    setReviewData,
  );

  return (
    <CollectionContext.Provider
      value={{
        reviewData,
        onReviewDataChange: setReviewData,
      }}
    >
      <section style={containerStyle}>

        <CollectionHeader />

        {loans.length > 1 && (

          <div style={loanSelectorStyle}>

            <label style={loanSelectorLabelStyle}>
              {COLLECTION_STUDIO_LABELS.SELECT_LOAN}
            </label>

            <select
              value={selectedLoan?.id ?? ""}
              onChange={(event) => {

                const loan = loans.find(
                  (item) =>
                    item.id === event.target.value,
                );

                setSelectedLoan(loan);

              }}
              style={loanSelectorInputStyle}
            >

              {loans.map((loan) => (

                <option
                  key={loan.id}
                  value={loan.id}
                >
                  {loan.loanNumber ?? loan.title}
                  {" - ₹"}
                  {loan.amount}
                </option>

              ))}

            </select>

          </div>

        )}

        <section style={studioSectionStyle}>

          <CollectionStatistics />

          <div style={contentGridStyle}>

            <CollectionForm />

            <div style={sidebarStyle}>

              <CustomerLoanCard />

              <CollectionPreviewCard />

              <CollectionDraftStatus />

            </div>

          </div>

        </section>

                {/* ======================================
            PAYMENT STUDIO
        ====================================== */}

        <section style={studioSectionStyle}>

          <PaymentHeader />

          <div style={contentGridStyle}>

            <div style={mainColumnStyle}>

              <PaymentMethodCard />

              <PaymentReference />

              <PaymentSummary />

            </div>

            <div style={sidebarStyle}>

              <PaymentPreviewCard />

              <PaymentDraftStatus />

            </div>

          </div>

        </section>

        {/* ======================================
            RECEIPT STUDIO
        ====================================== */}

        <section style={studioSectionStyle}>

          <ReceiptHeader />

          <div style={contentGridStyle}>

            <div style={mainColumnStyle}>

              <ReceiptCustomerCard />

              <ReceiptDetails />

              <ReceiptActions />

            </div>

            <div style={sidebarStyle}>

              <ReceiptPreviewCard />

              <ReceiptDraftStatus />

            </div>

          </div>

        </section>

        {/* ======================================
            SETTLEMENT STUDIO
        ====================================== */}

        <section style={studioSectionStyle}>

          <SettlementHeader />

          <div style={contentGridStyle}>

            <div style={mainColumnStyle}>

              <BalanceAdjustment />

              <SettlementSummary />

              <SettlementActions />

            </div>

            <div style={sidebarStyle}>

              <SettlementPreviewCard />

              <SettlementDraftStatus />

            </div>

          </div>

        </section>

        {/* ======================================
            REVIEW STUDIO
        ====================================== */}

        <section style={studioSectionStyle}>

          <ReviewHeader />

          <div style={contentGridStyle}>

            <div style={mainColumnStyle}>

              <CollectionSummary />

              <ValidationChecklist />

              <ReviewActions />

            </div>

            <div style={sidebarStyle}>

              <ReviewPreviewCard />

              <ReviewDraftStatus />

            </div>

          </div>

        </section>

      </section>

    </CollectionContext.Provider>

  );

}
