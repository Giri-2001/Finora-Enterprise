// ============================================================
// FINORA ENTERPRISE OS™
//
// ENTERPRISE SETTINGS
// NUMBERING & SERIES SETTINGS FORM
//
// RESPONSIBILITY:
//
// - Render Customer Series configuration
// - Render immutable Business / Branch numbering codes
// - Render Customer number preview
// - Render read-only Loan / Collection / Receipt numbering rules
// - Expose Customer Series setup intent to parent orchestration
//
// IMPORTANT:
//
// - No inline styles.
// - No persistence.
// - No repository access.
// - No service calls.
// - No local form state.
// - No theme values.
// - No responsive values.
// - Owner controls only the starting Customer number.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

import type {
  FormEvent,
} from "react";

import {
  LockKeyhole,
  Save,
} from "lucide-react";

import {
  CUSTOMER_NUMBER_MAX,
  CUSTOMER_NUMBER_MIN,
} from "../../../constants/numbering/numbering.constants";

import {
  formatCollectionNumber,
  formatLoanNumber,
  formatReceiptNumber,
} from "../../../utils/numbering/numbering.formatter";

import type {
  NumberingSeriesSettingsFormProps,
} from "./NumberingSeriesSettingsForm.types";

// ============================================================
// COMPONENT
// ============================================================

export default function NumberingSeriesSettingsForm({
  configuration,
  setupPreview,
  nextPreview,
  startingCustomerNumber,
  disabled = false,
  saving = false,
  onStartingCustomerNumberChange,
  onSubmit,
}: NumberingSeriesSettingsFormProps) {

  const locked =
    configuration?.status ===
    "LOCKED";

  const controlsDisabled =
    disabled ||
    saving ||
    locked;

  const businessCode =
    configuration?.businessCode ??
    setupPreview?.businessCode ??
    "";

  const branchCode =
    configuration?.branchCode ??
    setupPreview?.branchCode ??
    "";

  const referenceCustomerNumber =
    configuration?.startingCustomerNumber ??
    setupPreview?.customerNumber ??
    null;

  let loanExample =
    "";

  let collectionExample =
    "";

  let receiptExample =
    "";

  if (
    businessCode &&
    branchCode &&
    referenceCustomerNumber !== null
  ) {

    loanExample =
      formatLoanNumber(
        businessCode,
        branchCode,
        referenceCustomerNumber,
        1,
      );

    collectionExample =
      formatCollectionNumber(
        businessCode,
        branchCode,
        referenceCustomerNumber,
        1,
        1,
      );

    receiptExample =
      formatReceiptNumber(
        businessCode,
        branchCode,
        referenceCustomerNumber,
        1,
        1,
      );
  }

  const customerPreview =
    locked
      ? nextPreview?.customerId ?? ""
      : setupPreview?.customerId ?? "";

  const statusLabel =
    locked
      ? "Locked"
      : "Not Configured";

  // ==========================================================
  // SUBMIT
  // ==========================================================

  function handleSubmit(
    event:
      FormEvent<HTMLFormElement>,
  ): void {

    event.preventDefault();

    if (controlsDisabled) {
      return;
    }

    onSubmit();
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <form
      className="finora-settings-form finora-settings-numbering-form"
      onSubmit={handleSubmit}
    >
      <section className="finora-settings-form__section finora-settings-customer-series-section">
        <div className="finora-settings-form__section-header">
          <div className="finora-settings-form__section-heading">
            <h2 className="finora-settings-form__section-title">
              Customer Series
            </h2>

            <p className="finora-settings-form__section-subtitle">
              Set the starting Customer number once for this provisioned branch.
              After confirmation, the series becomes permanently locked.
            </p>
          </div>
        </div>

        <div className="finora-settings-form__grid">
          <label className="finora-settings-form__field">
            <span className="finora-settings-form__label">
              Business Code
            </span>

            <input
              className="finora-settings-form__input finora-settings-form__input--readonly"
              type="text"
              value={businessCode}
              readOnly
              aria-readonly="true"
              placeholder="Provisioned by FINORA"
            />

            <span className="finora-settings-form__helper">
              Immutable code assigned during FINORA business provisioning.
            </span>
          </label>

          <label className="finora-settings-form__field">
            <span className="finora-settings-form__label">
              Branch Code
            </span>

            <input
              className="finora-settings-form__input finora-settings-form__input--readonly"
              type="text"
              value={branchCode}
              readOnly
              aria-readonly="true"
              placeholder="Provisioned by FINORA"
            />

            <span className="finora-settings-form__helper">
              Immutable code assigned during FINORA branch provisioning.
            </span>
          </label>

          <label className="finora-settings-form__field">
            <span className="finora-settings-form__label">
              Starting Customer Number
            </span>

            <input
              className={
                locked
                  ? "finora-settings-form__input finora-settings-form__input--readonly"
                  : "finora-settings-form__input"
              }
              type="number"
              min={CUSTOMER_NUMBER_MIN}
              max={CUSTOMER_NUMBER_MAX}
              step={1}
              inputMode="numeric"
              value={
                locked
                  ? String(
                      configuration.startingCustomerNumber,
                    )
                  : startingCustomerNumber
              }
              readOnly={locked}
              disabled={disabled || saving}
              aria-readonly={locked}
              required={!locked}
              onChange={(event) =>
                onStartingCustomerNumberChange(
                  event.currentTarget.value,
                )
              }
            />

            <span className="finora-settings-form__helper">
              Choose once. Normal Settings cannot change this value after lock.
            </span>
          </label>

          <label className="finora-settings-form__field">
            <span className="finora-settings-form__label">
              Status
            </span>

            <input
              className="finora-settings-form__input finora-settings-form__input--readonly"
              type="text"
              value={statusLabel}
              readOnly
              aria-readonly="true"
            />

            <span className="finora-settings-form__helper">
              {
                locked
                  ? "Customer Series is permanently locked for this branch."
                  : "Customer Series must be configured before Customer IDs can be issued."
              }
            </span>
          </label>

          <label className="finora-settings-form__field finora-settings-form__field--full">
            <span className="finora-settings-form__label">
              {
                locked
                  ? "Next Customer Preview"
                  : "Customer ID Preview"
              }
            </span>

            <input
              className="finora-settings-form__input finora-settings-form__input--readonly"
              type="text"
              value={customerPreview}
              readOnly
              aria-readonly="true"
              placeholder="Enter a valid starting Customer number to preview"
            />

            <span className="finora-settings-form__helper">
              Previewing does not reserve or consume a Customer number.
            </span>
          </label>
        </div>

        {!locked && (
          <div className="finora-settings-form__actions">
            <button
              type="submit"
              className="finora-settings-form__submit"
              disabled={
                controlsDisabled ||
                !setupPreview
              }
            >
              <Save
                className="finora-settings-form__submit-icon"
                aria-hidden="true"
              />

              <span className="finora-settings-form__submit-label">
                {
                  saving
                    ? "Setting Customer Series..."
                    : "Set Customer Series"
                }
              </span>
            </button>
          </div>
        )}
      </section>

      <section className="finora-settings-form__section finora-settings-system-numbering-section">
        <div className="finora-settings-form__section-header">
          <div className="finora-settings-form__section-heading">
            <h2 className="finora-settings-form__section-title">
              System Numbering Rules
            </h2>

            <p className="finora-settings-form__section-subtitle">
              Loan, Collection and Receipt numbers are generated automatically.
              These subordinate sequences are not owner-configurable.
            </p>
          </div>
        </div>

        <div className="finora-settings-form__grid">
          <label className="finora-settings-form__field finora-settings-form__field--full">
            <span className="finora-settings-form__label">
              First Loan Example
            </span>

            <input
              className="finora-settings-form__input finora-settings-form__input--readonly"
              type="text"
              value={loanExample}
              readOnly
              aria-readonly="true"
              placeholder="Available after numbering codes resolve"
            />

            <span className="finora-settings-form__helper">
              Loan sequence starts at 001 independently for each Customer.
            </span>
          </label>

          <label className="finora-settings-form__field finora-settings-form__field--full">
            <span className="finora-settings-form__label">
              First Collection Example
            </span>

            <input
              className="finora-settings-form__input finora-settings-form__input--readonly"
              type="text"
              value={collectionExample}
              readOnly
              aria-readonly="true"
              placeholder="Available after numbering codes resolve"
            />

            <span className="finora-settings-form__helper">
              Collection sequence starts at 001 independently for each Loan.
            </span>
          </label>

          <label className="finora-settings-form__field finora-settings-form__field--full">
            <span className="finora-settings-form__label">
              Matching Receipt Example
            </span>

            <input
              className="finora-settings-form__input finora-settings-form__input--readonly"
              type="text"
              value={receiptExample}
              readOnly
              aria-readonly="true"
              placeholder="Available after numbering codes resolve"
            />

            <span className="finora-settings-form__helper">
              Receipt mirrors the exact Collection transaction sequence.
            </span>
          </label>
        </div>
      </section>
    </form>
  );
}

// ============================================================
// END
// ============================================================
