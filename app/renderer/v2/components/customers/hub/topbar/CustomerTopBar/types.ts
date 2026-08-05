/* ===========================================================
   FINORA ENTERPRISE V2
   CUSTOMER TOP BAR

   TYPES
=========================================================== */

/* ===========================================================
   PROPERTIES
=========================================================== */

export interface CustomerTopBarProps {
  title?: string;

  subtitle?: string;

  customerCount?: number;

  onSearch?: (value: string) => void;

  onAddCustomer?: () => void;

  onNotifications?: () => void;

  onProfile?: () => void;
}
