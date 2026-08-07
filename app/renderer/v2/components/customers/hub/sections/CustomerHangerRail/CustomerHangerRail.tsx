/* ===========================================================
   FINORA ENTERPRISE OS™
   CUSTOMER HANGER RAIL™

   COMPONENT
=========================================================== */

import {
  useState,
} from "react";

import EnterpriseCardGrid
  from "../../../../common/EnterpriseCardGrid";

import CustomerHanger
  from "../../cards/CustomerHanger";

import type {
  CustomerHangerRailProps,
} from "./types";

import {
  containerStyle,
  railWrapperStyle,
  railStyle,
} from "./styles";

/* ===========================================================
   COMPONENT
=========================================================== */

export default function CustomerHangerRail({

  customers,

  selectedCustomerId,

  onCustomerSelect,

}: CustomerHangerRailProps) {

  const [
    activeCardId,
    setActiveCardId,
  ] = useState<string | null>(null);

  return (

    <section style={containerStyle}>

      {/* ==========================================
          RAIL
      ========================================== */}

      <div style={railWrapperStyle}>

        <div style={railStyle} />

        <EnterpriseCardGrid>

          {customers.map((customer) => (

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

        </EnterpriseCardGrid>

      </div>

    </section>

  );

}
