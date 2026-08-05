/* ===========================================================
   FINORA ENTERPRISE OS™
   ADD CUSTOMER BUTTON

   COMPONENT
=========================================================== */

import type {
  AddCustomerButtonProps,
} from "./types";

import {
  BUTTON_ICON,
  BUTTON_TOOLTIP,
  DEFAULT_LABEL,
} from "./constants";

import {
  buildLabel,
  isButtonDisabled,
} from "./helpers";

import {
  buttonStyle,
  iconStyle,
  labelStyle,
} from "./styles";

/* ===========================================================
   COMPONENT
=========================================================== */

export default function AddCustomerButton({

  label = DEFAULT_LABEL,

  disabled = false,

  onClick,

}: AddCustomerButtonProps) {

  return (

    <button

      type="button"

      title={BUTTON_TOOLTIP}

      style={buttonStyle}

      disabled={
        isButtonDisabled(disabled)
      }

      onClick={onClick}

    >

      <span style={iconStyle}>

        {BUTTON_ICON}

      </span>

      <span style={labelStyle}>

        {buildLabel(label)}

      </span>

    </button>

  );

}
