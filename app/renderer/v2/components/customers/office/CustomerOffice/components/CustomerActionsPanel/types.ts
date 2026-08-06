/* ===========================================================
   FINORA ENTERPRISE OS™
   CUSTOMER ACTIONS PANEL™

   TYPES
=========================================================== */

export interface CustomerActionItem {
  title: string;
  icon: string;
}

export interface CustomerActionsPanelProps {
  onApplyLoan?: () => void;
  onCollectPayment?: () => void;
  onDocuments?: () => void;
  onTimeline?: () => void;
  onReports?: () => void;
}
