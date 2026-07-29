import type { Collection } from "../components/collections/types";

type ReceiptLoanDetails = {
  approvedAmount: number;

  outstandingAmount: number;

  totalPaid: number;
};

type ReceiptCustomerDetails = {
  name: string;

  phone?: string;
};

export function generateReceiptHTML(
  collection: Collection,

  customer: ReceiptCustomerDetails,

  loanNumber: string,

  loanDetails: ReceiptLoanDetails,
): string {
  return `
  <html>

    <head>

      <title>
        ${collection.receiptNumber}
      </title>


      <style>

        body {
          font-family: Arial, sans-serif;
          padding: 30px;
          background: #ffffff;
        }


        .receipt {

          max-width: 550px;

          margin: auto;

          border: 1px solid #333;

          padding: 30px;

        }


        h1,
        h3 {

          text-align: center;

        }


        .line {

          border-top: 1px solid #333;

          margin: 20px 0;

        }


        .row {

          display: flex;

          justify-content: space-between;

          margin: 8px 0;

        }


        .footer {

          margin-top: 60px;

          display: flex;

          justify-content: space-between;

        }

      </style>

    </head>


    <body>


      <div class="receipt">


        <h1>
          FINORA ENTERPRISE
        </h1>


        <h3>
          Collection Receipt
        </h3>


        <div class="line"></div>


        <div class="row">
          <b>Receipt No</b>
          <span>${collection.receiptNumber}</span>
        </div>


        <div class="row">
          <b>Date</b>
          <span>${collection.collectionDate}</span>
        </div>


        <div class="line"></div>


        <h3>
          Customer Details
        </h3>


        <div class="row">
          <b>Name</b>
          <span>${customer.name}</span>
        </div>


        <div class="row">
          <b>Phone</b>
          <span>${customer.phone ?? "-"}</span>
        </div>


        <div class="row">
          <b>Loan Number</b>
          <span>${loanNumber}</span>
        </div>


        <div class="line"></div>


        <h3>
          Loan Summary
        </h3>


        <div class="row">
          <b>Approved Amount</b>

          <span>
            ₹${loanDetails.approvedAmount.toLocaleString("en-IN")}
          </span>

        </div>


        <div class="row">

          <b>Total Paid</b>

          <span>
            ₹${loanDetails.totalPaid.toLocaleString("en-IN")}
          </span>

        </div>


        <div class="row">

          <b>Outstanding</b>

          <span>
            ₹${loanDetails.outstandingAmount.toLocaleString("en-IN")}
          </span>

        </div>


        <div class="line"></div>


        <h3>
          Payment Details
        </h3>


        <div class="row">

          <b>Payment Type</b>

          <span>
            ${collection.collectionType}
          </span>

        </div>


        <div class="row">

          <b>Payment Mode</b>

          <span>
            ${collection.paymentMode}
          </span>

        </div>


        <div class="row">

          <b>Amount Paid Today</b>

          <span>
            ₹${collection.totalAmount.toLocaleString("en-IN")}
          </span>

        </div>


        <div class="row">

          <b>Collected By</b>

          <span>
            ${collection.collectedBy}
          </span>

        </div>


        <div class="footer">

          <span>
            Customer Signature
          </span>


          <span>
            Authorized Signature
          </span>

        </div>


      </div>


    </body>

  </html>
  `;
}

export function printReceipt(
  collection: Collection,

  customer: ReceiptCustomerDetails,

  loanNumber: string,

  loanDetails: ReceiptLoanDetails,
): void {
  const windowRef = window.open("", "_blank", "width=700,height=800");

  if (!windowRef) {
    return;
  }

  windowRef.document.write(
    generateReceiptHTML(collection, customer, loanNumber, loanDetails),
  );

  windowRef.document.close();

  windowRef.print();
}
