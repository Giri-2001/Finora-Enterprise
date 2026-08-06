/* ===========================================================
   FINORA ENTERPRISE OS™
   Collections Engine

   COLLECTION WIZARD
=========================================================== */

import { useState } from "react";

import {
  useCollection,
} from "./context/CollectionContext";

/* ===========================================================
   DETAILS
=========================================================== */

import CollectionHeader from "./details/CollectionHeader";
import CollectionForm from "./details/CollectionForm";
import CustomerLoanCard from "./details/CustomerLoanCard";
import CollectionStatistics from "./details/CollectionStatistics";
import CollectionPreviewCard from "./details/CollectionPreviewCard";
import CollectionDraftStatus from "./details/CollectionDraftStatus";

/* ===========================================================
   PAYMENT
=========================================================== */

import PaymentHeader from "./payment/PaymentHeader";
import PaymentMethodCard from "./payment/PaymentMethodCard";
import PaymentReference from "./payment/PaymentReference";
import PaymentSummary from "./payment/PaymentSummary";
import PaymentPreviewCard from "./payment/PaymentPreviewCard";
import PaymentDraftStatus from "./payment/PaymentDraftStatus";

/* ===========================================================
   SETTLEMENT
=========================================================== */

import SettlementHeader from "./settlement/SettlementHeader";
import BalanceAdjustment from "./settlement/BalanceAdjustment";
import SettlementSummary from "./settlement/SettlementSummary";
import SettlementPreviewCard from "./settlement/SettlementPreviewCard";
import SettlementActions from "./settlement/SettlementActions";
import SettlementDraftStatus from "./settlement/SettlementDraftStatus";

/* ===========================================================
   RECEIPT
=========================================================== */

import ReceiptHeader from "./receipt/ReceiptHeader";
import ReceiptDetails from "./receipt/ReceiptDetails";
import ReceiptCustomerCard from "./receipt/ReceiptCustomerCard";
import ReceiptPreviewCard from "./receipt/ReceiptPreviewCard";
import ReceiptActions from "./receipt/ReceiptActions";
import ReceiptDraftStatus from "./receipt/ReceiptDraftStatus";

/* ===========================================================
   REVIEW
=========================================================== */

import ReviewHeader from "./review/ReviewHeader";
import CollectionSummary from "./review/CollectionSummary";
import ValidationChecklist from "./review/ValidationChecklist";
import ReviewPreviewCard from "./review/ReviewPreviewCard";
import ReviewActions from "./review/ReviewActions";
import ReviewDraftStatus from "./review/ReviewDraftStatus";

/* ===========================================================
   TYPES
=========================================================== */

export type CollectionWizardStep =
  | "details"
  | "payment"
  | "settlement"
  | "receipt"
  | "review";

/* ===========================================================
   COLLECTION WIZARD
=========================================================== */

export default function CollectionWizard() {
  const {
    reviewData,
    onReviewDataChange,
  } = useCollection();

  void reviewData;
  void onReviewDataChange;

  const [step] =
    useState<CollectionWizardStep>("details");

  switch (step) {
    case "details":
      return (
        <>
          <CollectionHeader />
          <CollectionForm />
          <CustomerLoanCard />
          <CollectionStatistics />
          <CollectionPreviewCard />
          <CollectionDraftStatus />
        </>
      );

    case "payment":
      return (
        <>
          <PaymentHeader />
          <PaymentMethodCard />
          <PaymentReference />
          <PaymentSummary />
          <PaymentPreviewCard />
          <PaymentDraftStatus />
        </>
      );

    case "settlement":
      return (
        <>
          <SettlementHeader />
          <BalanceAdjustment />
          <SettlementSummary />
          <SettlementPreviewCard />
          <SettlementActions />
          <SettlementDraftStatus />
        </>
      );

    case "receipt":
      return (
        <>
          <ReceiptHeader />
          <ReceiptDetails />
          <ReceiptCustomerCard />
          <ReceiptPreviewCard />
          <ReceiptActions />
          <ReceiptDraftStatus />
        </>
      );

    case "review":
      return (
        <>
          <ReviewHeader />
          <CollectionSummary />
          <ValidationChecklist />
          <ReviewPreviewCard />
          <ReviewActions />
          <ReviewDraftStatus />
        </>
      );

    default:
      return null;
  }
}
