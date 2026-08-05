/* ===========================================================
   FINORA ENTERPRISE OS™
   CUSTOMER SEARCH BAR

   COMPONENT
=========================================================== */

import { useState } from "react";

import type {
  CustomerSearchBarProps,
} from "./types";

import {
  DEFAULT_PLACEHOLDER,
  SEARCH_ICON,
} from "./constants";

import {
  buildPlaceholder,
  sanitizeSearch,
} from "./helpers";

import {
  containerStyle,
  iconStyle,
  inputStyle,
  shortcutStyle,
} from "./styles";

/* ===========================================================
   COMPONENT
=========================================================== */

export default function CustomerSearchBar({

  value = "",

  placeholder = DEFAULT_PLACEHOLDER,

  onChange,

  onSearch,

}: CustomerSearchBarProps) {

  const [search, setSearch] =
    useState(value);

  function handleChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {

    const nextValue =
      sanitizeSearch(event.target.value);

    setSearch(nextValue);

    onChange?.(nextValue);

  }

  function handleKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>,
  ) {

    if (event.key === "Enter") {

      onSearch?.();

    }

  }

  return (

    <div style={containerStyle}>

      <span style={iconStyle}>

        {SEARCH_ICON}

      </span>

      <input
        type="text"
        value={search}
        placeholder={
          buildPlaceholder(
            placeholder,
          )
        }
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        style={inputStyle}
      />

      <span style={shortcutStyle}>

        Ctrl + K

      </span>

    </div>

  );

}
