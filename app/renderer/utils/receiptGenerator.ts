import type { Collection } from "../components/collections/types";

export function generateReceiptHTML(
  collection: Collection,
  customerName: string,
  loanNumber: string,
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
        }


        .receipt {
          max-width: 500px;
          margin: auto;
          border: 1px solid #333;
          padding: 25px;
        }


        h1,
        h3 {
          text-align: center;
        }


        .line {
          border-top: 1px solid #333;
          margin: 20px 0;
        }


        .footer {
          margin-top: 50px;
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


        <p>
          <b>Receipt No:</b>
          ${collection.receiptNumber}
        </p>


        <p>
          <b>Date:</b>
          ${collection.collectionDate}
        </p>


        <p>
          <b>Customer:</b>
          ${customerName}
        </p>


        <p>
          <b>Loan ID:</b>
          ${loanNumber}
        </p>


        <div class="line"></div>


        <p>
          <b>Payment Type:</b>
          ${collection.collectionType}
        </p>


        <p>
          <b>Payment Mode:</b>
          ${collection.paymentMode}
        </p>


        <p>
          <b>Amount Paid:</b>
          ₹${collection.totalAmount.toLocaleString("en-IN")}
        </p>


        <p>
          <b>Collected By:</b>
          ${collection.collectedBy}
        </p>


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
  customerName: string,
  loanNumber: string,
): void {
  const windowRef = window.open("", "_blank", "width=700,height=800");

  if (!windowRef) {
    return;
  }

  windowRef.document.write(
    generateReceiptHTML(collection, customerName, loanNumber),
  );

  windowRef.document.close();

  windowRef.print();
}
