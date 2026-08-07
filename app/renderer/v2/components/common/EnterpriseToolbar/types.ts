/* ===========================================================
   FINORA ENTERPRISE OS™
   ENTERPRISE TOOLBAR™

   TYPES
=========================================================== */

import type {
  ReactNode,
} from "react";

/* ===========================================================
   PROPS
=========================================================== */

export interface EnterpriseToolbarProps {

  /* Left */

  actionLabel: string;

  onActionClick?: () => void;

  actionIcon?: ReactNode;

  /* Center */

  searchPlaceholder: string;

  searchValue?: string;

  onSearchChange?: (
    value: string,
  ) => void;

  searchComponent?: ReactNode;

  /* Right */

  counterLabel: string;

  counterValue: number | string;

}
