/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER ADDRESS FORM

   Version     : 3.0
   Phase       : Phase 2
   Architecture: Enterprise
   Status      : Production

   RESPONSIBILITY:

   - Render the six customer address fields
   - Consume Address Responsive Engine geometry
   - Consume FINORA Theme Engine colours
   - Use Lucide icons only
   - Preserve the existing controlled AddressForm contract

   REMOVED:

   - Address Proof
   - Address Map / GIS
   - Location Verification
   - Verification badges
   - Emoji-based field icons
   - State dropdown chevron

   IMPORTANT:

   - No local breakpoints
   - No viewport detection
   - No media queries
   - No local responsive calculations
   - Responsive geometry comes from Address Responsive Engine
=========================================================== */


/* ===========================================================
   IMPORTS
=========================================================== */

import type {
  CSSProperties,
} from "react";


import {
  Building2,
  Hash,
  House,
  Map,
  MapPin,
} from "lucide-react";


import {
  useResponsive,
} from "../../../utils/responsive";


import {
  useTheme,
} from "../../../themes/provider";


import {
  getAddressTokens,
} from "../../../utils/responsive/customers/address/address.tokens";


import {
  createAddressGridStyle,
  createAddressFieldStyle,
  createAddressFieldIconStyle,
  createAddressInputStyle,
  createAddressInputWrapperStyle,
  createAddressLabelStyle,
  createAddressLongInputStyle,
  createFullAddressFieldStyle,
} from "../../../utils/responsive/customers/address/address.layout";


/* ===========================================================
   TYPES
=========================================================== */

export interface AddressFormData {

  currentAddress:
    string;

  permanentAddress:
    string;

  city:
    string;

  district:
    string;

  state:
    string;

  pinCode:
    string;

}


interface AddressFormProps {

  value:
    AddressFormData;

  onChange: (
    field:
      keyof AddressFormData,
    value:
      string,
  ) => void;

}


/* ===========================================================
   THEME STYLE TYPE
=========================================================== */

type AddressThemeStyle =
  CSSProperties &
  Record<
    `--${string}`,
    string
  >;


/* ===========================================================
   FIELD
=========================================================== */

function Field({

  label,

  value,

  placeholder,

  icon:

  Icon,

  onChange,

  long = false,

  inputMode,

}: {

  label:
    string;

  value:
    string;

  placeholder:
    string;

  icon:
    typeof House;

  onChange:
    (
      value:
        string,
    ) => void;

  long?:
    boolean;

  inputMode?:
    "text"
    | "numeric"
    | "tel";

}) {

  const {
    tokens,
  } =
    useResponsive();


  const addressTokens =
    getAddressTokens(
      tokens.meta.viewport,
    );


  const fieldStyle =
    createAddressFieldStyle(
      addressTokens,
    );


  const labelStyle =
    createAddressLabelStyle(
      addressTokens,
    );


  const inputWrapperStyle =
    createAddressInputWrapperStyle(
      addressTokens,
    );


  const iconStyle =
    createAddressFieldIconStyle(
      addressTokens,
    );


  const inputStyle =
    long
      ? createAddressLongInputStyle(
          addressTokens,
        )
      : createAddressInputStyle(
          addressTokens,
        );


  return (

    <div
      style={
        fieldStyle
      }
    >

      <label
        style={
          labelStyle
        }
      >
        {label}
      </label>


      <div
        style={
          inputWrapperStyle
        }
      >

        <Icon
          style={
            iconStyle
          }

          strokeWidth={
            1.9
          }

          aria-hidden="true"
        />


        <input

          style={
            inputStyle
          }

          value={
            value
          }

          placeholder={
            placeholder
          }

          inputMode={
            inputMode
          }

          onChange={(
            event,
          ) =>
            onChange(
              event.target.value,
            )
          }

          aria-label={
            label
          }

          className="finora-address-input"

        />

      </div>

    </div>

  );

}


/* ===========================================================
   STATE FIELD
=========================================================== */

function StateField({

  value,

  onChange,

}: {

  value:
    string;

  onChange:
    (
      value:
        string,
    ) => void;

}) {

  const {
    tokens,
  } =
    useResponsive();


  const addressTokens =
    getAddressTokens(
      tokens.meta.viewport,
    );


  const fieldStyle =
    createAddressFieldStyle(
      addressTokens,
    );


  const labelStyle =
    createAddressLabelStyle(
      addressTokens,
    );


  const inputWrapperStyle =
    createAddressInputWrapperStyle(
      addressTokens,
    );


  const iconStyle =
    createAddressFieldIconStyle(
      addressTokens,
    );


  const inputStyle =
    createAddressInputStyle(
      addressTokens,
    );


  return (

    <div
      style={
        fieldStyle
      }
    >

      <label
        style={
          labelStyle
        }
      >
        State
      </label>


      <div
        style={
          inputWrapperStyle
        }
      >

        <Map
          style={
            iconStyle
          }

          strokeWidth={
            1.9
          }

          aria-hidden="true"
        />


        {/* =================================================
            STATE INPUT

            Dropdown chevron intentionally removed.

            State is now a normal controlled text field.
        ================================================= */}

        <input

          style={
            inputStyle
          }

          value={
            value
          }

          placeholder="Enter state"

          onChange={(
            event,
          ) =>
            onChange(
              event.target.value,
            )
          }

          aria-label="State"

          className="finora-address-input"

        />

      </div>

    </div>

  );

}


/* ===========================================================
   COMPONENT
=========================================================== */

export default function AddressForm({

  value,

  onChange,

}: AddressFormProps) {

  const {
    tokens,
  } =
    useResponsive();


  const {
    theme,
  } =
    useTheme();


  const addressTokens =
    getAddressTokens(
      tokens.meta.viewport,
    );


  const gridStyle =
    createAddressGridStyle(
      addressTokens,
    );


  const themeVariables:
    AddressThemeStyle = {

    "--finora-theme-brand-primary":
      theme.colors.brand.primary,

    "--finora-theme-brand-secondary":
      theme.colors.brand.secondary,

    "--finora-theme-brand-accent":
      theme.colors.brand.accent,

    "--finora-theme-brand-accent-soft":
      theme.colors.brand.accentSoft,

    "--finora-theme-surface":
      theme.colors.background.surface,

    "--finora-theme-surface-muted":
      theme.colors.background.surfaceMuted,

    "--finora-theme-text-primary":
      theme.colors.text.primary,

    "--finora-theme-text-secondary":
      theme.colors.text.secondary,

    "--finora-theme-text-muted":
      theme.colors.text.muted,

    "--finora-theme-text-inverse":
      theme.colors.text.inverse,

    "--finora-theme-border-default":
      theme.colors.border.default,

    "--finora-theme-border-strong":
      theme.colors.border.strong,

    "--finora-theme-border-subtle":
      theme.colors.border.subtle,

    "--finora-theme-overlay-shadow":
      theme.colors.overlay.shadow,

  };


  return (

    <div
      style={{
        ...themeVariables,

        width:
          "100%",

        minWidth:
          addressTokens.minWidth,

        boxSizing:
          "border-box",

      }}
    >

      <div
        style={
          gridStyle
        }
      >

        {/* =================================================
            CURRENT ADDRESS
        ================================================= */}

        <div
          style={
            createFullAddressFieldStyle(
              addressTokens,
            )
          }
        >

          <Field

            label="Current Address"

            value={
              value.currentAddress
            }

            placeholder="Enter current residential address"

            icon={
              House
            }

            long

            onChange={(
              nextValue,
            ) =>
              onChange(
                "currentAddress",
                nextValue,
              )
            }

          />

        </div>


        {/* =================================================
            PERMANENT ADDRESS
        ================================================= */}

        <div
          style={
            createFullAddressFieldStyle(
              addressTokens,
            )
          }
        >

          <Field

            label="Permanent Address"

            value={
              value.permanentAddress
            }

            placeholder="Enter permanent residential address"

            icon={
              House
            }

            long

            onChange={(
              nextValue,
            ) =>
              onChange(
                "permanentAddress",
                nextValue,
              )
            }

          />

        </div>


        {/* =================================================
            CITY / VILLAGE
        ================================================= */}

        <Field

          label="City / Village"

          value={
            value.city
          }

          placeholder="Enter city or village"

          icon={
            MapPin
          }

          onChange={(
            nextValue,
          ) =>
            onChange(
              "city",
              nextValue,
            )
          }

        />


        {/* =================================================
            DISTRICT
        ================================================= */}

        <Field

          label="District"

          value={
            value.district
          }

          placeholder="Enter district"

          icon={
            Building2
          }

          onChange={(
            nextValue,
          ) =>
            onChange(
              "district",
              nextValue,
            )
          }

        />


        {/* =================================================
            STATE
        ================================================= */}

        <StateField

          value={
            value.state
          }

          onChange={(
            nextValue,
          ) =>
            onChange(
              "state",
              nextValue,
            )
          }

        />


        {/* =================================================
            PIN CODE
        ================================================= */}

        <Field

          label="PIN Code"

          value={
            value.pinCode
          }

          placeholder="Enter 6-digit PIN code"

          icon={
            Hash
          }

          inputMode="numeric"

          onChange={(
            nextValue,
          ) =>
            onChange(
              "pinCode",
              nextValue,
            )
          }

        />

      </div>

    </div>

  );

}


/* ===========================================================
   END
=========================================================== */