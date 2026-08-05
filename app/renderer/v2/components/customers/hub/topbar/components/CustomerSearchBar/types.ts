/* ===========================================================
   FINORA ENTERPRISE OS™
   CUSTOMER SEARCH BAR

   TYPES
=========================================================== */

export interface CustomerSearchBarProps {

  value?: string;

  placeholder?: string;

  onChange?: (
    value: string,
  ) => void;

  onSearch?: () => void;

}
