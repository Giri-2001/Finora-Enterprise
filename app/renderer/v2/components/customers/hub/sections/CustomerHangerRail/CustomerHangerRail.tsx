/* ===========================================================
   FINORA ENTERPRISE OS™
   CUSTOMER HANGER RAIL™

   COMPONENT
=========================================================== */

import {
  useState,
} from "react";

import CustomerHanger from "../../cards/CustomerHanger";

import type {

  CustomerHangerRailProps,

} from "./types";

import {

  containerStyle,

  railWrapperStyle,

  railStyle,

  hangerAreaStyle,

} from "./styles";

/* ===========================================================
   COMPONENT
=========================================================== */

export default function CustomerHangerRail({

  customers,

  selectedCustomerId,

  onCustomerSelect,

}: CustomerHangerRailProps) {


  const [activeCardId, setActiveCardId] =
    useState<string | null>(null);

  return (

    <section style={containerStyle}>

      {/* ==========================================
          HEADER
      ========================================== */}


      {/* ==========================================
          RAIL
      ========================================== */}

      <div style={railWrapperStyle}>

        <div style={railStyle} />

        <div style={hangerAreaStyle}>

          {customers
  .slice(0, 7)
  .map((customer) => (

            <CustomerHanger

  key={customer.id}

  customer={customer}

  flipped={
    activeCardId === customer.id
  }

  onFlip={() => {

    setActiveCardId(

      activeCardId === customer.id

        ? null

        : customer.id,

    );

  }}

  onClick={(selected) => {

    onCustomerSelect?.(

      selected,

    );

  }}

/>

          ))}

        </div>

      </div>

    </section>

  );

}
