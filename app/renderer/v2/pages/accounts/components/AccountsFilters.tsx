/* ===========================================================
   FINORA ENTERPRISE OS™

   ACCOUNTS ENGINE™

   ACCOUNTS FILTERS

   MODULE  : Accounts
   LAYER   : Presentation Component
   VERSION : 1.0

   RESPONSIBILITY:

   - Edit Accounts filter state
   - Render period options
   - Render conditional date / month / year controls
   - Render activity filter
   - Render loan-type filter
   - Render customer filter
   - Render payment-method filter
   - Render search
   - Expose Reset / Apply actions

   IMPORTANT:

   - No inline styles.
   - No repository access.
   - No ledger filtering here.
   - No totals calculations.
   - No date-range calculations.
   - No theme calculations.
   - No responsive calculations.

   Actual filtering remains authoritative in:
   accounts.selectors.ts
=========================================================== */

/* ===========================================================
   REACT
=========================================================== */

import type { ChangeEvent } from "react";

import { FinoraCalendar } from "../../../components/common/calendar";

/* ===========================================================
   ICONS
=========================================================== */

import {
  CalendarDays,
  Check,
  Filter,
  Gem,
  HandCoins,
  RotateCcw,
  Search,
  Users,
  WalletCards,
  X,
} from "lucide-react";

/* ===========================================================
   CONSTANTS
=========================================================== */

import {
  ACCOUNTS_ACTIVITY_LABEL,
  ACCOUNTS_ACTIVITY_OPTIONS,
  ACCOUNTS_ALL_CUSTOMERS_LABEL,
  ACCOUNTS_CUSTOMER_LABEL,
  ACCOUNTS_FILTER_APPLY_LABEL,
  ACCOUNTS_FILTER_RESET_LABEL,
  ACCOUNTS_FILTERS_SUBTITLE,
  ACCOUNTS_FILTERS_TITLE,
  ACCOUNTS_LOAN_TYPE_LABEL,
  ACCOUNTS_LOAN_TYPE_OPTIONS,
  ACCOUNTS_PAYMENT_METHOD_LABEL,
  ACCOUNTS_PAYMENT_METHOD_OPTIONS,
  ACCOUNTS_PERIOD_LABEL,
  ACCOUNTS_PERIOD_OPTIONS,
  ACCOUNTS_SEARCH_LABEL,
  ACCOUNTS_SEARCH_PLACEHOLDER,
} from "../../../constants/accounts/accounts.constants";

/* ===========================================================
   TYPES
=========================================================== */

import type {
  AccountsCustomerOption,
  AccountsFilterState,
} from "../../../types/accounts/accounts.types";

/* ===========================================================
   STYLE CONTRACT
=========================================================== */

import {
  ACCOUNTS_FILTER_ACTION_CLASSES,
  ACCOUNTS_FILTER_FIELD_CLASSES,
  ACCOUNTS_FILTER_ICON_CLASSES,
  ACCOUNTS_FILTER_SEARCH_CLASSES,
  ACCOUNTS_FILTERS_CLASSES,
  getAccountsFilterActionClassName,
  getAccountsPeriodDetailsClassName,
  resolveAccountsFilterPeriodDetailMode,
} from "./AccountsFilters.styles";

/* ===========================================================
   STYLESHEET
=========================================================== */

import "./AccountsFilters.css";

/* ===========================================================
   PROPS
=========================================================== */

export interface AccountsFiltersProps {
  filters: AccountsFilterState;

  customers: readonly AccountsCustomerOption[];

  onChange: (filters: AccountsFilterState) => void;

  onReset: () => void;

  onApply: () => void;

  disabled?: boolean;
}

/* ===========================================================
   COMPONENT
=========================================================== */

export function AccountsFilters({
  filters,
  customers,
  onChange,
  onReset,
  onApply,
  disabled = false,
}: AccountsFiltersProps) {
  /* =========================================================
     PERIOD PRESENTATION MODE
  ========================================================= */

  const periodDetailMode = resolveAccountsFilterPeriodDetailMode(
    filters.period,
  );

  const periodDetailsClassName =
    getAccountsPeriodDetailsClassName(periodDetailMode);

  /* =========================================================
     ACTION CLASSES
  ========================================================= */

  const resetButtonClassName = getAccountsFilterActionClassName(
    "RESET",
    disabled,
  );

  const applyButtonClassName = getAccountsFilterActionClassName(
    "APPLY",
    disabled,
  );

  /* =========================================================
     FIELD UPDATE HELPERS

     These only update the draft filter object.

     They do not execute selector filtering.
  ========================================================= */

  function updateFilter<Key extends keyof AccountsFilterState>(
    key: Key,

    value: AccountsFilterState[Key],
  ): void {
    onChange({
      ...filters,

      [key]: value,
    });
  }

  /* =========================================================
     PERIOD
  ========================================================= */

  function handlePeriodChange(event: ChangeEvent<HTMLSelectElement>): void {
    updateFilter(
      "period",

      event.target.value as AccountsFilterState["period"],
    );
  }

  /* =========================================================
     ACTIVITY
  ========================================================= */

  function handleActivityChange(event: ChangeEvent<HTMLSelectElement>): void {
    updateFilter(
      "activity",

      event.target.value as AccountsFilterState["activity"],
    );
  }

  /* =========================================================
     LOAN TYPE
  ========================================================= */

  function handleLoanTypeChange(event: ChangeEvent<HTMLSelectElement>): void {
    updateFilter(
      "loanType",

      event.target.value as AccountsFilterState["loanType"],
    );
  }

  /* =========================================================
     CUSTOMER
  ========================================================= */

  function handleCustomerChange(event: ChangeEvent<HTMLSelectElement>): void {
    updateFilter(
      "customerId",

      event.target.value,
    );
  }

  /* =========================================================
     PAYMENT METHOD
  ========================================================= */

  function handlePaymentMethodChange(
    event: ChangeEvent<HTMLSelectElement>,
  ): void {
    updateFilter(
      "paymentMethod",

      event.target.value as AccountsFilterState["paymentMethod"],
    );
  }

  /* =========================================================
     SEARCH
  ========================================================= */

  function handleSearchChange(event: ChangeEvent<HTMLInputElement>): void {
    updateFilter(
      "searchText",

      event.target.value,
    );
  }

  function handleClearSearch(): void {
    updateFilter("searchText", "");
  }

  /* =========================================================
     DATE DETAILS
  ========================================================= */


  function handleSelectedMonthChange(
    event: ChangeEvent<HTMLInputElement>,
  ): void {
    updateFilter(
      "selectedMonth",

      event.target.value,
    );
  }

  function handleSelectedYearChange(
    event: ChangeEvent<HTMLInputElement>,
  ): void {
    updateFilter(
      "selectedYear",

      event.target.value,
    );
  }



  /* =========================================================
     CUSTOMER DISPLAY
  ========================================================= */

  function getCustomerOptionLabel(customer: AccountsCustomerOption): string {
    if (customer.customerPhone) {
      return `${customer.customerName} • ${customer.customerPhone}`;
    }

    return customer.customerName;
  }

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <section
      className={ACCOUNTS_FILTERS_CLASSES.root}
      aria-labelledby="finora-accounts-filters-title"
    >
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className={ACCOUNTS_FILTERS_CLASSES.header}>
        <div className={ACCOUNTS_FILTERS_CLASSES.headerIdentity}>
          <span
            className={ACCOUNTS_FILTERS_CLASSES.headerIcon}
            aria-hidden="true"
          >
            <Filter
              className={ACCOUNTS_FILTER_ICON_CLASSES.filters}
              strokeWidth={1.9}
            />
          </span>

          <div className={ACCOUNTS_FILTERS_CLASSES.headingGroup}>
            <h2
              id="finora-accounts-filters-title"
              className={ACCOUNTS_FILTERS_CLASSES.title}
            >
              {ACCOUNTS_FILTERS_TITLE}
            </h2>

            <p className={ACCOUNTS_FILTERS_CLASSES.subtitle}>
              {ACCOUNTS_FILTERS_SUBTITLE}
            </p>
          </div>
        </div>
      </div>

      {/* =====================================================
          BODY
      ===================================================== */}

      <div className={ACCOUNTS_FILTERS_CLASSES.body}>
        <div className={ACCOUNTS_FILTERS_CLASSES.grid}>
          {/* =================================================
              PERIOD
          ================================================= */}

          <label className={ACCOUNTS_FILTER_FIELD_CLASSES.root}>
            <span className={ACCOUNTS_FILTER_FIELD_CLASSES.labelRow}>
              <CalendarDays
                className={ACCOUNTS_FILTER_ICON_CLASSES.period}
                strokeWidth={1.9}
                aria-hidden="true"
              />

              <span className={ACCOUNTS_FILTER_FIELD_CLASSES.label}>
                {ACCOUNTS_PERIOD_LABEL}
              </span>
            </span>

            <select
              className={ACCOUNTS_FILTER_FIELD_CLASSES.select}
              value={filters.period}
              onChange={handlePeriodChange}
              disabled={disabled}
            >
              {ACCOUNTS_PERIOD_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          {/* =================================================
              ACTIVITY
          ================================================= */}

          <label className={ACCOUNTS_FILTER_FIELD_CLASSES.root}>
            <span className={ACCOUNTS_FILTER_FIELD_CLASSES.labelRow}>
              <HandCoins
                className={ACCOUNTS_FILTER_ICON_CLASSES.activity}
                strokeWidth={1.9}
                aria-hidden="true"
              />

              <span className={ACCOUNTS_FILTER_FIELD_CLASSES.label}>
                {ACCOUNTS_ACTIVITY_LABEL}
              </span>
            </span>

            <select
              className={ACCOUNTS_FILTER_FIELD_CLASSES.select}
              value={filters.activity}
              onChange={handleActivityChange}
              disabled={disabled}
            >
              {ACCOUNTS_ACTIVITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          {/* =================================================
              LOAN TYPE
          ================================================= */}

          <label className={ACCOUNTS_FILTER_FIELD_CLASSES.root}>
            <span className={ACCOUNTS_FILTER_FIELD_CLASSES.labelRow}>
              <Gem
                className={ACCOUNTS_FILTER_ICON_CLASSES.loanType}
                strokeWidth={1.9}
                aria-hidden="true"
              />

              <span className={ACCOUNTS_FILTER_FIELD_CLASSES.label}>
                {ACCOUNTS_LOAN_TYPE_LABEL}
              </span>
            </span>

            <select
              className={ACCOUNTS_FILTER_FIELD_CLASSES.select}
              value={filters.loanType}
              onChange={handleLoanTypeChange}
              disabled={disabled}
            >
              {ACCOUNTS_LOAN_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          {/* =================================================
              CUSTOMER
          ================================================= */}

          <label className={ACCOUNTS_FILTER_FIELD_CLASSES.root}>
            <span className={ACCOUNTS_FILTER_FIELD_CLASSES.labelRow}>
              <Users
                className={ACCOUNTS_FILTER_ICON_CLASSES.customer}
                strokeWidth={1.9}
                aria-hidden="true"
              />

              <span className={ACCOUNTS_FILTER_FIELD_CLASSES.label}>
                {ACCOUNTS_CUSTOMER_LABEL}
              </span>
            </span>

            <select
              className={ACCOUNTS_FILTER_FIELD_CLASSES.select}
              value={filters.customerId}
              onChange={handleCustomerChange}
              disabled={disabled}
            >
              <option value="">{ACCOUNTS_ALL_CUSTOMERS_LABEL}</option>

              {customers.map((customer) => (
                <option key={customer.customerId} value={customer.customerId}>
                  {getCustomerOptionLabel(customer)}
                </option>
              ))}
            </select>
          </label>

          {/* =================================================
              PAYMENT METHOD
          ================================================= */}

          <label className={ACCOUNTS_FILTER_FIELD_CLASSES.root}>
            <span className={ACCOUNTS_FILTER_FIELD_CLASSES.labelRow}>
              <WalletCards
                className={ACCOUNTS_FILTER_ICON_CLASSES.paymentMethod}
                strokeWidth={1.9}
                aria-hidden="true"
              />

              <span className={ACCOUNTS_FILTER_FIELD_CLASSES.label}>
                {ACCOUNTS_PAYMENT_METHOD_LABEL}
              </span>
            </span>

            <select
              className={ACCOUNTS_FILTER_FIELD_CLASSES.select}
              value={filters.paymentMethod}
              onChange={handlePaymentMethodChange}
              disabled={disabled}
            >
              {ACCOUNTS_PAYMENT_METHOD_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          {/* =================================================
              SEARCH
          ================================================= */}

          <label className={ACCOUNTS_FILTER_FIELD_CLASSES.rootWide}>
            <span className={ACCOUNTS_FILTER_FIELD_CLASSES.labelRow}>
              <Search
                className={ACCOUNTS_FILTER_ICON_CLASSES.search}
                strokeWidth={1.9}
                aria-hidden="true"
              />

              <span className={ACCOUNTS_FILTER_FIELD_CLASSES.label}>
                {ACCOUNTS_SEARCH_LABEL}
              </span>
            </span>

            <span className={ACCOUNTS_FILTER_SEARCH_CLASSES.root}>
              <Search
                className={ACCOUNTS_FILTER_SEARCH_CLASSES.icon}
                strokeWidth={1.9}
                aria-hidden="true"
              />

              <input
                type="search"
                className={ACCOUNTS_FILTER_SEARCH_CLASSES.input}
                value={filters.searchText}
                onChange={handleSearchChange}
                placeholder={ACCOUNTS_SEARCH_PLACEHOLDER}
                disabled={disabled}
                autoComplete="off"
              />

              {filters.searchText.length > 0 && (
                <button
                  type="button"
                  className={ACCOUNTS_FILTER_SEARCH_CLASSES.clearButton}
                  onClick={handleClearSearch}
                  disabled={disabled}
                  aria-label="Clear search"
                  title="Clear search"
                >
                  <X
                    className={ACCOUNTS_FILTER_SEARCH_CLASSES.clearIcon}
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                </button>
              )}
            </span>
          </label>
        </div>

        {/* ===================================================
            PERIOD DETAILS
        =================================================== */}

        {periodDetailMode !== "NONE" && (
          <div className={periodDetailsClassName}>
            {filters.period === "SELECT_DATE" && (
              <div className={ACCOUNTS_FILTER_FIELD_CLASSES.root}>
                <span className={ACCOUNTS_FILTER_FIELD_CLASSES.label}>
                  Select Date
                </span>

                <FinoraCalendar
                  value={filters.selectedDate}
                  onChange={(nextDate) =>
                    updateFilter(
                      "selectedDate",
                      nextDate,
                    )
                  }
                  disabled={disabled}
                  allowToday
                  showRelativeDay
                  placeholder="DD/MM/YYYY"
                  ariaLabel="Select Accounts Date"
                />
              </div>
            )}

            {filters.period === "SELECT_MONTH" && (
              <label className={ACCOUNTS_FILTER_FIELD_CLASSES.root}>
                <span className={ACCOUNTS_FILTER_FIELD_CLASSES.label}>
                  Select Month
                </span>

                <input
                  type="month"
                  className={ACCOUNTS_FILTER_FIELD_CLASSES.dateInput}
                  value={filters.selectedMonth}
                  onChange={handleSelectedMonthChange}
                  disabled={disabled}
                />
              </label>
            )}

            {filters.period === "SELECT_YEAR" && (
              <label className={ACCOUNTS_FILTER_FIELD_CLASSES.root}>
                <span className={ACCOUNTS_FILTER_FIELD_CLASSES.label}>
                  Select Year
                </span>

                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  pattern="[0-9]{4}"
                  placeholder="YYYY"
                  className={ACCOUNTS_FILTER_FIELD_CLASSES.input}
                  value={filters.selectedYear}
                  onChange={handleSelectedYearChange}
                  disabled={disabled}
                  autoComplete="off"
                />
              </label>
            )}

            {filters.period === "CUSTOM_RANGE" && (
              <div className={ACCOUNTS_FILTER_FIELD_CLASSES.rootWide}>
                <FinoraCalendar
                  mode="range"
                  value={{
                    from: filters.fromDate,
                    to: filters.toDate,
                  }}
                  onChange={(nextRange) => {
                    onChange({
                      ...filters,

                      fromDate:
                        nextRange.from,

                      toDate:
                        nextRange.to,
                    });
                  }}
                  disabled={disabled}
                  fromLabel="From Date"
                  toLabel="To Date"
                  placeholder="DD/MM/YYYY"
                  ariaLabel="Accounts Custom Date Range"
                  showDuration
                />
              </div>
            )}
          </div>
        )}

        {/* ===================================================
            ACTIONS
        =================================================== */}

        <div className={ACCOUNTS_FILTERS_CLASSES.actions}>
          <button
            type="button"
            className={resetButtonClassName}
            onClick={onReset}
            disabled={disabled}
          >
            <RotateCcw
              className={ACCOUNTS_FILTER_ICON_CLASSES.reset}
              strokeWidth={1.9}
              aria-hidden="true"
            />

            <span className={ACCOUNTS_FILTER_ACTION_CLASSES.label}>
              {ACCOUNTS_FILTER_RESET_LABEL}
            </span>
          </button>

          <button
            type="button"
            className={applyButtonClassName}
            onClick={onApply}
            disabled={disabled}
          >
            <Check
              className={ACCOUNTS_FILTER_ICON_CLASSES.apply}
              strokeWidth={2}
              aria-hidden="true"
            />

            <span className={ACCOUNTS_FILTER_ACTION_CLASSES.label}>
              {ACCOUNTS_FILTER_APPLY_LABEL}
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}

/* ===========================================================
   DEFAULT EXPORT
=========================================================== */

export default AccountsFilters;

/* ===========================================================
   END
=========================================================== */
