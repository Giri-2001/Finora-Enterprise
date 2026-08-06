/* ===========================================================
   FINORA ENTERPRISE OS™
   CUSTOMER ACTIONS PANEL™

   COMPONENT
=========================================================== */

import {
  CUSTOMER_ACTIONS_TITLE,
} from "./constants";

import {
  buildCustomerActions,
} from "./helpers";

import {
  buttonStyle,
  containerStyle,
  gridStyle,
  headerStyle,
} from "./styles";

import type {
  CustomerActionsPanelProps,
} from "./types";

/* ===========================================================
   COMPONENT
=========================================================== */

export default function CustomerActionsPanel(
  props: CustomerActionsPanelProps,
) {
  const actions = buildCustomerActions(props);

  return (
    <section style={containerStyle}>
      <div style={headerStyle}>
        {CUSTOMER_ACTIONS_TITLE}
      </div>

      <div style={gridStyle}>
        {actions.map((action) => (
          <button
            key={action.title}
            onClick={action.onClick}
            style={buttonStyle}
          >
            <span>{action.icon}</span>

            <span>{action.title}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
