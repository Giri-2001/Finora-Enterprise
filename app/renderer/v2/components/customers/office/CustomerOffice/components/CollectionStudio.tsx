/* ===========================================================
   FINORA ENTERPRISE OS™

   COLLECTION STUDIO™

   CUSTOMER WORKSPACE
=========================================================== */


import {
  useEffect,
  useState,
} from "react";

import type {
  Loan,
} from "../types";


import {
  CollectionContext,
} from "../../../../collections/context/CollectionContext";


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



/* ===========================================================
   TYPES
=========================================================== */

interface CollectionStudioProps {

  customerName?: string;

  customerId?: string;

  phoneNumber?: string;

  loans?: Loan[];

}



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
  useState<Loan | undefined>(
    loans[0],
  );


  const [reviewData, setReviewData] =


    useState({


      customerId: customerId ?? "",

      customerName: customerName ?? "",

      customerPhone: phoneNumber ?? "",


      loanId: "",

      loanNumber: "",

      loanAmount: 0,


      outstandingBalance: 0,

      todayDue: 0,

      previousDue: 0,


      paymentAmount: 0,

      paymentMethod: "",

      paymentReference: "",


      penaltyAmount: 0,

      discountAmount: 0,

      advanceAdjustment: 0,


      remarks: "",


      receiptNumber: "",

      receiptDate: "",


      status: "Draft" as "Draft" | "Approved",


      createdAt: "",

      updatedAt: "",

    });

    useEffect(() => {


  setReviewData((previous) => ({

    ...previous,

    customerId:
      customerId ?? "",

    customerName:
      customerName ?? "",

    customerPhone:
      phoneNumber ?? "",


    loanId:
      selectedLoan?.id ?? "",

    loanNumber:
  selectedLoan?.loanNumber ??
selectedLoan?.title ??
"",

    loanAmount:
      selectedLoan?.amount ?? 0,

    outstandingBalance:
      selectedLoan?.outstanding ?? 0,

  }));

}, [
  customerId,
  customerName,
  phoneNumber,
  selectedLoan,
]);


useEffect(() => {

  function resetCollectionForm() {

    setReviewData((previous) => ({

      ...previous,

      paymentAmount: 0,

      paymentMethod: "",

      paymentReference: "",

      remarks: "",

      receiptNumber: "",

      status: "Draft",

    }));

  }


  window.addEventListener(
    "FINORA_LOAN_UPDATED",
    resetCollectionForm,
  );


  return () => {

    window.removeEventListener(
      "FINORA_LOAN_UPDATED",
      resetCollectionForm,
    );

  };


}, []);


  return (

    <CollectionContext.Provider

      value={{

        reviewData,

        onReviewDataChange:

          setReviewData,

      }}

    >


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


        <CollectionHeader />

        {/* ======================================
    LOAN SELECTOR
====================================== */}

{loans.length > 1 && (

  <div
    style={{
      background: "#F8FAFC",
      border: "1px solid #E2E8F0",
      borderRadius: "12px",
      padding: "16px",
      display: "flex",
      flexDirection: "column",
      gap: "8px",
    }}
  >

    <label
      style={{
        fontWeight: 600,
        color: "#0F172A",
      }}
    >
      Select Loan
    </label>


    <select

      value={
        selectedLoan?.id ?? ""
      }


      onChange={(event) => {

        const loan =
          loans.find(

            (item) =>
              item.id === event.target.value,

          );


        setSelectedLoan(loan);

      }}

      style={{
        padding: "10px",
        borderRadius: "8px",
        border: "1px solid #CBD5E1",
      }}

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

        <section

          style={{

            display: "flex",

            flexDirection: "column",

            gap: "24px",

          }}

        >


          <CollectionStatistics />



          <div

            style={{

              display: "grid",

              gridTemplateColumns:

                "2fr 1fr",

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

              gridTemplateColumns:

                "2fr 1fr",

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

              gridTemplateColumns:

                "2fr 1fr",

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

              gridTemplateColumns:

                "2fr 1fr",

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

              gridTemplateColumns:

                "2fr 1fr",

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


    </CollectionContext.Provider>


  );


}
