/* ===========================================================
   FINORA ENTERPRISE V2
   REPORTS ENGINE
   EXPORT & ANALYTICS STUDIO
   EXPORT PREVIEW CARD
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface ExportPreviewCardProps {

  reportName?: string;

  exportFormat?: string;

  generatedAt?: string;

  fileSize?: string;

  exportStatus?: string;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function ExportPreviewCard({

  reportName = "--",

  exportFormat = "PDF",

  generatedAt = "--",

  fileSize = "--",

  exportStatus = "--",

}: ExportPreviewCardProps) {

  return (

    <SummaryCard title="Export Preview">

      <span>

        Report :
        <strong> {reportName}</strong>

      </span>

      <span>

        Format :
        <strong> {exportFormat}</strong>

      </span>

      <span>

        Generated :
        <strong> {generatedAt}</strong>

      </span>

      <span>

        File Size :
        <strong> {fileSize}</strong>

      </span>

      <span>

        Status :
        <strong> {exportStatus}</strong>

      </span>

    </SummaryCard>

  );

}
