import Card from "../../components/ui/Card";

import ExportButtons from "../../components/reports/ExportButtons";

import ReportDashboard from "../../components/reports/ReportDashboard";

import {
  getCollectionReport,
  getCustomerReport,
  getLoanReport,
} from "../../store/reportStore";

import {
  generateGoldReport,
  generateLockerReport,
  generatePaymentReport,
} from "../../utils/reportGenerator";

import { exportReportToPDF } from "../../utils/pdfExport";

import { exportReportToExcel } from "../../utils/excelExport";

export default function Reports() {
  const loanReports = getLoanReport();

  const collectionReports = getCollectionReport();

  const customerReports = getCustomerReport();

  const paymentReports = generatePaymentReport();

  const goldReports = generateGoldReport();

  const lockerReports = generateLockerReport();

  const totalOutstanding = loanReports.reduce(
    (sum, loan) => sum + loan.outstandingAmount,

    0,
  );

  const totalCollected = collectionReports.reduce(
    (sum, collection) => sum + collection.amount,

    0,
  );

  return (
    <div>
      <h1>Reports</h1>

      <p>FINORA business reports and analytics.</p>

      <ReportDashboard
        loanCount={loanReports.length}
        collectionCount={collectionReports.length}
        paymentCount={paymentReports.length}
        customerCount={customerReports.length}
        goldCount={goldReports.length}
        lockerCount={lockerReports.length}
      />

      <Card title="Export Reports">
        <ExportButtons
          onExportPDF={() =>
            exportReportToPDF("FINORA Loan Report", loanReports)
          }
          onExportExcel={() =>
            exportReportToExcel("FINORA_Loan_Report", loanReports)
          }
        />

        <ExportButtons
          onExportPDF={() =>
            exportReportToPDF("FINORA Collection Report", collectionReports)
          }
          onExportExcel={() =>
            exportReportToExcel("FINORA_Collection_Report", collectionReports)
          }
        />

        <ExportButtons
          onExportPDF={() =>
            exportReportToPDF("FINORA Payment Report", paymentReports)
          }
          onExportExcel={() =>
            exportReportToExcel("FINORA_Payment_Report", paymentReports)
          }
        />

        <ExportButtons
          onExportPDF={() =>
            exportReportToPDF("FINORA Gold Report", goldReports)
          }
          onExportExcel={() =>
            exportReportToExcel("FINORA_Gold_Report", goldReports)
          }
        />

        <ExportButtons
          onExportPDF={() =>
            exportReportToPDF("FINORA Locker Report", lockerReports)
          }
          onExportExcel={() =>
            exportReportToExcel("FINORA_Locker_Report", lockerReports)
          }
        />
      </Card>

      <div
        style={{
          display: "grid",

          gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",

          gap: 20,

          marginTop: 20,
        }}
      >
        <Card title="Outstanding Amount">
          <h2>₹{totalOutstanding.toLocaleString("en-IN")}</h2>
        </Card>

        <Card title="Total Collected">
          <h2>₹{totalCollected.toLocaleString("en-IN")}</h2>
        </Card>
      </div>

      <Card title="Loan Report">
        {loanReports.map((loan) => (
          <div key={loan.loanId} style={rowStyle}>
            <p>Loan: {loan.loanId}</p>

            <p>Customer: {loan.customerName}</p>

            <p>Balance: ₹{loan.outstandingAmount.toLocaleString("en-IN")}</p>

            <p>Status: {loan.status}</p>
          </div>
        ))}
      </Card>

      <Card title="Payment Report">
        {paymentReports.map((payment) => (
          <div key={payment.paymentId} style={rowStyle}>
            <p>Payment: {payment.paymentId}</p>

            <p>Amount: ₹{payment.amount.toLocaleString("en-IN")}</p>
          </div>
        ))}
      </Card>

      <Card title="Gold Report">
        {goldReports.map((gold) => (
          <div key={gold.loanId} style={rowStyle}>
            <p>Locker: {gold.lockerNumber}</p>

            <p>Bag: {gold.bagNumber}</p>

            <p>Status: {gold.status}</p>
          </div>
        ))}
      </Card>

      <Card title="Locker Report">
        {lockerReports.map((locker) => (
          <div key={locker.lockerNumber} style={rowStyle}>
            <p>Locker: {locker.lockerNumber}</p>

            <p>Status: {locker.status}</p>
          </div>
        ))}
      </Card>
    </div>
  );
}

const rowStyle = {
  padding: 12,

  borderBottom: "1px solid #334155",
};
