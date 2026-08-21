/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER SEARCH BAR™

   PREMIUM CUSTOMER IDENTIFIER SEARCH

   APPROVED SEARCH VALUES:

   1. Customer ID
   2. Mobile Number
   3. Aadhaar Last 6
   4. ID Card Last 6

   IMPORTANT:
   - Customer name is NOT searchable.
   - Search filtering remains in filterCustomers selector.
   - This component only handles search input presentation
     and input delivery.
   - Theme visual wiring comes from FINORA Theme Engine.
=========================================================== */


/* ===========================================================
   IMPORTS
=========================================================== */

import {
  useEffect,
  useState,
} from "react";

import {
  Search,
} from "lucide-react";

import {
  useTheme,
} from "../../../../../../themes/provider/ThemeProvider";

import type {
  CustomerSearchBarProps,
} from "./types";

import {
  DEFAULT_PLACEHOLDER,
} from "./constants";

import {
  buildPlaceholder,
  sanitizeSearch,
} from "./helpers";

import {
  containerStyle,
  iconStyle,
  inputStyle,
} from "./styles";


/* ===========================================================
   COMPONENT
=========================================================== */

export default function CustomerSearchBar({

  value = "",

  placeholder =
    DEFAULT_PLACEHOLDER,

  onChange,

  onSearch,

}: CustomerSearchBarProps) {


  /* =========================================================
     THEME ENGINE

     Theme controls:

     - Search surface
     - Search border
     - Search shadow
     - Search icon
     - Search text
     - Search placeholder
  ========================================================= */

  const {
    theme,
  } = useTheme();


  /* =========================================================
     SEARCH STATE
  ========================================================= */

  const [
    search,
    setSearch,
  ] = useState(value);


  /* =========================================================
     EXTERNAL VALUE SYNC
  ========================================================= */

  useEffect(() => {

    setSearch(
      value,
    );

  }, [
    value,
  ]);


  /* =========================================================
     THEME CSS VARIABLES

     FINORA Theme Engine
          ↓
     CSS Variables
          ↓
     Customer Search Bar
  ========================================================= */

  const themeVariables = {

    "--finora-theme-surface":
      theme.colors.background.surface,

    "--finora-theme-background-surface":
      theme.colors.background.surface,

    "--finora-theme-surface-muted":
      theme.colors.background.surfaceMuted,

    "--finora-theme-background-surface-muted":
      theme.colors.background.surfaceMuted,

    "--finora-theme-brand-accent":
      theme.colors.brand.accent,

    "--finora-theme-brand-primary":
      theme.colors.brand.primary,

    "--finora-theme-text-primary":
      theme.colors.text.primary,

    "--finora-theme-text-muted":
      theme.colors.text.muted,

    /* -------------------------------------------------------
       SEARCH PLACEHOLDER

       IMPORTANT:

       Placeholder must follow the active theme's
       primary readable text colour.

       Light theme:
         dark text

       Dark theme:
         light text
    ------------------------------------------------------- */

    "--finora-theme-search-placeholder":
      theme.colors.text.primary,

    "--finora-theme-border-default":
      theme.colors.border.default,

    "--finora-theme-border-strong":
      theme.colors.border.strong,

    "--finora-theme-border-subtle":
      theme.colors.border.subtle,

    "--finora-theme-overlay-shadow":
      theme.colors.overlay.shadow,

  } as React.CSSProperties;


  /* =========================================================
     INPUT CHANGE
  ========================================================= */

  function handleChange(
    event:
      React.ChangeEvent<HTMLInputElement>,
  ): void {

    const nextValue =
      sanitizeSearch(
        event.target.value,
      );

    setSearch(
      nextValue,
    );

    onChange?.(
      nextValue,
    );

  }


  /* =========================================================
     KEYBOARD SEARCH
  ========================================================= */

  function handleKeyDown(
    event:
      React.KeyboardEvent<HTMLInputElement>,
  ): void {

    if (
      event.key ===
      "Enter"
    ) {

      onSearch?.();

    }

  }


  /* =========================================================
     RENDER
  ========================================================= */

  return (

    <div

      style={{
        ...containerStyle,
        ...themeVariables,
      }}

      data-finora-interactive="true"

    >

      {/* =====================================================
          PLACEHOLDER THEME CONTROL

          Native input placeholder styling cannot be controlled
          through CSSProperties directly.

          Therefore the active FINORA theme variable is applied
          through this scoped CSS rule.

          This keeps placeholder colour fully theme-aware.
      ===================================================== */}

      <style>
  {`
    input[data-finora-customer-search="true"]::placeholder {
      color: var(--finora-theme-search-placeholder);
      opacity: 1;
    }
  `}
</style>


      {/* =====================================================
          SEARCH ICON

          Theme-aware.
      ===================================================== */}

      <Search

        size={
          18
        }

        strokeWidth={
          2.2
        }

        style={{
          ...iconStyle,

          color:
            theme.colors.brand.accent,
        }}

        aria-hidden="true"

      />


      {/* =====================================================
          SEARCH INPUT
      ===================================================== */}

      <input

        type="text"

        value={
          search
        }

        placeholder={
          buildPlaceholder(
            placeholder,
          )
        }

        onChange={
          handleChange
        }

        onKeyDown={
          handleKeyDown
        }

        aria-label={
          "Search customers by Customer ID, Mobile Number, Aadhaar last 6 digits, or ID Card last 6 digits"
        }

        data-finora-customer-search="true"

        style={
          inputStyle
        }

      />

    </div>

  );

}


/* ===========================================================
   END
=========================================================== */