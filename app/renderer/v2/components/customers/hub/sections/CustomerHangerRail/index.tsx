/* ===========================================================
   FINORA ENTERPRISE OS™
   CUSTOMER HANGER RAIL

   COMPONENT
=========================================================== */

import type {
  CustomerHangerRailProps,
} from "./types";

import {
  ACTIVE_CUSTOMERS_LABEL,
  DEFAULT_TITLE,
  DEFAULT_TOTAL_CUSTOMERS,
} from "./constants";

import {
  buildTitle,
  buildTotalCustomers,
} from "./helpers";

import {
  containerStyle,
  headerStyle,
  titleStyle,
  countStyle,
  railWrapperStyle,
  railStyle,
  hangerAreaStyle,
} from "./styles";

/* ===========================================================
   COMPONENT
=========================================================== */

export default function CustomerHangerRail({

  title = DEFAULT_TITLE,

  totalCustomers = DEFAULT_TOTAL_CUSTOMERS,

}: CustomerHangerRailProps) {

  const count =
    buildTotalCustomers(totalCustomers);

  return (

    <section style={containerStyle}>

      <div style={headerStyle}>

        <h2 style={titleStyle}>

          {buildTitle(title)}

        </h2>

        <span style={countStyle}>

          {ACTIVE_CUSTOMERS_LABEL} : {count}

        </span>

      </div>

      <div style={railWrapperStyle}>

        <div style={railStyle} />

        <div style={hangerAreaStyle}>

          {/* CustomerHanger Components */}

        </div>

      </div>

    </section>

  );

}
