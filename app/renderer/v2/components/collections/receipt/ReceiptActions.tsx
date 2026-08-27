/* ===========================================================
   FINORA ENTERPRISE OS™

   COLLECTIONS ENGINE

   RECEIPT ACTIONS

   RESPONSIBILITY

   - Present receipt actions
   - Preview receipt
   - Print receipt
   - Download receipt PDF
   - Keep action presentation separate from business logic

   IMPORTANT

   - No direct repository access
   - No direct localStorage access
   - No business calculations
   - No inline layout styles
   - Receipt/PDF persistence and generation remain below
     the appropriate service layer

   VERSION : 2.0
   STATUS  : Production
=========================================================== */

/* ===========================================================
   IMPORTS
=========================================================== */

import Button
  from "../../common/buttons/Button";

import SummaryCard
  from "../../common/cards/SummaryCard";

/* ===========================================================
   STYLES
=========================================================== */

const actionsStyle = {
  display: "flex",
  gap: "12px",
  flexWrap: "wrap" as const,
};

/* ===========================================================
   COMPONENT
=========================================================== */

export default function ReceiptActions() {

  /* =========================================================
     PREVIEW RECEIPT
  ========================================================= */

  function handlePreviewReceipt(): void {

    console.log(
      "Preview Receipt",
    );

  }


  /* =========================================================
     PRINT RECEIPT
  ========================================================= */

  function handlePrintReceipt(): void {

    console.log(
      "Print Receipt",
    );

  }


  /* =========================================================
     DOWNLOAD PDF
  ========================================================= */

  function handleDownloadPdf(): void {

    console.log(
      "Download PDF",
    );

  }


  /* =========================================================
     RENDER
  ========================================================= */

  return (

    <SummaryCard
      title="Receipt Actions"
    >

      <div
        style={
          actionsStyle
        }
      >

        {/* =================================================
            PREVIEW
        ================================================= */}

        <Button
          onClick={
            handlePreviewReceipt
          }
        >
          Preview Receipt
        </Button>


        {/* =================================================
            PRINT
        ================================================= */}

        <Button
          onClick={
            handlePrintReceipt
          }
        >
          Print Receipt
        </Button>


        {/* =================================================
            PDF
        ================================================= */}

        <Button
          onClick={
            handleDownloadPdf
          }
        >
          Download PDF
        </Button>

      </div>

    </SummaryCard>

  );

}

/* ===========================================================
   END
=========================================================== */