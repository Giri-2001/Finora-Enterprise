/* ===========================================================
   FINORA ENTERPRISE OS™
   COLLECTION STUDIO™

   CUSTOMER WORKSPACE
=========================================================== */

import CollectionHeader
  from "../../../../collections/details/CollectionHeader";

import CollectionStatistics
  from "../../../../collections/details/CollectionStatistics";

import CollectionForm
  from "../../../../collections/details/CollectionForm";

import CustomerLoanCard
  from "../../../../collections/details/CustomerLoanCard";

import CollectionPreviewCard
  from "../../../../collections/details/CollectionPreviewCard";

import CollectionDraftStatus
  from "../../../../collections/details/CollectionDraftStatus";


  import PaymentHeader
  from "../../../../collections/payment/PaymentHeader";

import PaymentMethodCard
  from "../../../../collections/payment/PaymentMethodCard";

import PaymentReference
  from "../../../../collections/payment/PaymentReference";

import PaymentSummary
  from "../../../../collections/payment/PaymentSummary";

import PaymentPreviewCard
  from "../../../../collections/payment/PaymentPreviewCard";

import PaymentDraftStatus
  from "../../../../collections/payment/PaymentDraftStatus";


  import ReceiptHeader
  from "../../../../collections/receipt/ReceiptHeader";

import ReceiptCustomerCard
  from "../../../../collections/receipt/ReceiptCustomerCard";

import ReceiptDetails
  from "../../../../collections/receipt/ReceiptDetails";

import ReceiptActions
  from "../../../../collections/receipt/ReceiptActions";

import ReceiptPreviewCard
  from "../../../../collections/receipt/ReceiptPreviewCard";

import ReceiptDraftStatus
  from "../../../../collections/receipt/ReceiptDraftStatus";


  import SettlementHeader
  from "../../../../collections/settlement/SettlementHeader";

import BalanceAdjustment
  from "../../../../collections/settlement/BalanceAdjustment";

import SettlementSummary
  from "../../../../collections/settlement/SettlementSummary";

import SettlementActions
  from "../../../../collections/settlement/SettlementActions";

import SettlementPreviewCard
  from "../../../../collections/settlement/SettlementPreviewCard";

import SettlementDraftStatus
  from "../../../../collections/settlement/SettlementDraftStatus";


  import ReviewHeader
  from "../../../../collections/review/ReviewHeader";

import CollectionSummary
  from "../../../../collections/review/CollectionSummary";

import ValidationChecklist
  from "../../../../collections/review/ValidationChecklist";

import ReviewActions
  from "../../../../collections/review/ReviewActions";

import ReviewPreviewCard
  from "../../../../collections/review/ReviewPreviewCard";

import ReviewDraftStatus
  from "../../../../collections/review/ReviewDraftStatus";

export default function CollectionStudio() {

  return (

    <section

      style={{

        background: "#FFFFFF",

        border: "1px solid #E2E8F0",

        borderRadius: "20px",

        padding: "28px",

        minHeight: "720px",

        boxShadow:
          "0 8px 24px rgba(15,23,42,.06)",

        display: "flex",

        flexDirection: "column",

        gap: "28px",

      }}

    >

      {/* ======================================
          HEADER
      ====================================== */}

      <div>

        <h2

          style={{

            margin: 0,

            fontSize: "26px",

            fontWeight: 700,

            color: "#0F172A",

          }}

        >

          Collection Studio™

        </h2>

        <p

          style={{

            marginTop: "8px",

            color: "#64748B",

            fontSize: "15px",

          }}

        >

          Record customer collections, receipts,
          settlements and payment reviews.

        </p>

      </div>

      {/* ======================================
          STEP 1
      ====================================== */}

      {/* ======================================
    COLLECTION DETAILS
====================================== */}

<section
  style={{
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  }}
>

  <CollectionHeader />

  <CollectionStatistics

  totalCollected={0}

  outstandingAmount={0}

  collectionCount={0}

  lastCollectionDate="--"

/>

  <div
    style={{
      display: "grid",
      gridTemplateColumns: "2fr 1fr",
      gap: "24px",
      alignItems: "start",
    }}
  >

    <CollectionForm />

    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "18px",
      }}
    >

      <CustomerLoanCard />

      <CollectionPreviewCard />

      <CollectionDraftStatus />

    </div>

  </div>

</section>

      {/* ======================================
          STEP 2
      ====================================== */}

      {/* ======================================
    PAYMENT STUDIO
====================================== */}

<section
  style={{
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  }}
>

  <PaymentHeader />

  <div
    style={{
      display: "grid",
      gridTemplateColumns: "2fr 1fr",
      gap: "24px",
      alignItems: "start",
    }}
  >

    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "24px",
      }}
    >

      <PaymentMethodCard />

      <PaymentReference />

      <PaymentSummary />

    </div>

    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "18px",
      }}
    >

      <PaymentPreviewCard />

      <PaymentDraftStatus />

    </div>

  </div>

</section>

      {/* ======================================
          STEP 3
      ====================================== */}

      {/* ======================================
    RECEIPT STUDIO
====================================== */}

<section
  style={{
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  }}
>

  <ReceiptHeader />

  <div
    style={{
      display: "grid",
      gridTemplateColumns: "2fr 1fr",
      gap: "24px",
      alignItems: "start",
    }}
  >

    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "24px",
      }}
    >

      <ReceiptCustomerCard />

      <ReceiptDetails />

      <ReceiptActions />

    </div>

    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "18px",
      }}
    >

      <ReceiptPreviewCard />

      <ReceiptDraftStatus />

    </div>

  </div>

</section>

      {/* ======================================
          STEP 4
      ====================================== */}

      {/* ======================================
    SETTLEMENT STUDIO
====================================== */}

<section
  style={{
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  }}
>

  <SettlementHeader />

  <div
    style={{
      display: "grid",
      gridTemplateColumns: "2fr 1fr",
      gap: "24px",
      alignItems: "start",
    }}
  >

    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "24px",
      }}
    >

      <BalanceAdjustment />

      <SettlementSummary />

      <SettlementActions />

    </div>

    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "18px",
      }}
    >

      <SettlementPreviewCard />

      <SettlementDraftStatus />

    </div>

  </div>

</section>

      {/* ======================================
          STEP 5
      ====================================== */}

      {/* ======================================
    REVIEW STUDIO
====================================== */}

<section
  style={{
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  }}
>

  <ReviewHeader />

  <div
    style={{
      display: "grid",
      gridTemplateColumns: "2fr 1fr",
      gap: "24px",
      alignItems: "start",
    }}
  >

    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "24px",
      }}
    >

      <CollectionSummary />

      <ValidationChecklist />

      <ReviewActions />

    </div>

    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "18px",
      }}
    >

      <ReviewPreviewCard />

      <ReviewDraftStatus />

    </div>

  </div>

</section>
    </section>

  );

}
