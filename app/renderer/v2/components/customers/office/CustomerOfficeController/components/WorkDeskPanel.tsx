/* ===========================================================
   FINORA ENTERPRISE OS™
   WORK DESK PANEL™

   COMPONENT
=========================================================== */

import CustomerOffice
  from "../../CustomerOffice";

import type {
  WorkDeskPanelProps,
} from "./WorkDeskPanel.types";

/* ===========================================================
   COMPONENT
=========================================================== */

export default function WorkDeskPanel({

  selectedCustomer,

}: WorkDeskPanelProps) {

  return (

    <CustomerOffice

      selectedCustomer={
        selectedCustomer
      }

    />

  );

}
