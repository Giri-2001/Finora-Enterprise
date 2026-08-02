/* ===========================================================
   FINORA ENTERPRISE V2
   REPORTS ENGINE
   EXPORT & ANALYTICS STUDIO
   EXPORT FORMATS
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface ExportFormatsProps {

  pdfEnabled?: boolean;

  excelEnabled?: boolean;

  csvEnabled?: boolean;

  printEnabled?: boolean;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function ExportFormats({

  pdfEnabled = true,

  excelEnabled = true,

  csvEnabled = true,

  printEnabled = true,

}: ExportFormatsProps) {

  return (

    <SummaryCard title="Export Formats">

      <span>
        PDF :
        <strong> {pdfEnabled ? "Enabled" : "Disabled"}</strong>
      </span>

      <span>
        Excel :
        <strong> {excelEnabled ? "Enabled" : "Disabled"}</strong>
      </span>

      <span>
        CSV :
        <strong> {csvEnabled ? "Enabled" : "Disabled"}</strong>
      </span>

      <span>
        Print :
        <strong> {printEnabled ? "Enabled" : "Disabled"}</strong>
      </span>

    </SummaryCard>

  );

}
