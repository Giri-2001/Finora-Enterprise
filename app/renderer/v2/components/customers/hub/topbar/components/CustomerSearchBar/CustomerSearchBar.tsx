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
     SEARCH STATE
  ========================================================= */

  const [
    search,
    setSearch,
  ] = useState(value);


  /* =========================================================
     EXTERNAL VALUE SYNC
     
     Keeps the visual input synchronized when the parent
     clears or changes the controlled search value.
  ========================================================= */

  useEffect(() => {

    setSearch(
      value,
    );

  }, [
    value,
  ]);


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
      style={
        containerStyle
      }

      data-finora-interactive="true"

    >

      {/* =====================================================
          SEARCH ICON
      ===================================================== */}

      <Search

        size={
          18
        }

        strokeWidth={
          2.2
        }

        style={
          iconStyle
        }

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