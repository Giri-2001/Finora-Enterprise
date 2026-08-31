// ============================================================
// FINORA ENTERPRISE OS™
//
// ENTERPRISE SETTINGS
// BUSINESS SETTINGS FORM
//
// RESPONSIBILITY:
//
// - Render Business identity information
// - Render editable Business Settings fields
// - Expose typed field changes to parent orchestration
// - Expose save intent to parent orchestration
// - Reuse authoritative supported Business currencies
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
// - Business identity fields are read-only.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

import type {
  FormEvent,
} from "react";

import {
  Save,
} from "lucide-react";

import {
  SUPPORTED_BUSINESS_CURRENCIES,
} from "../../../constants/business/businessCurrency.constants";

import {
  BUSINESS_TIME_ZONE_OPTIONS,
} from "../../../constants/business/businessTimeZone.constants";

import type {
  BusinessSettingsFormProps,
} from "./BusinessSettingsForm.types";

// ============================================================
// BUSINESS TIME ZONES
// ============================================================

const BUSINESS_TIME_ZONES =
  BUSINESS_TIME_ZONE_OPTIONS;

// ============================================================
// COMPONENT
// ============================================================

export default function BusinessSettingsForm({
  identity,
  settings,
  disabled = false,
  saving = false,
  onFieldChange,
  onSubmit,
}: BusinessSettingsFormProps) {

  const controlsDisabled =
    disabled ||
    saving;

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
      className="finora-settings-form finora-settings-business-form"
      onSubmit={handleSubmit}
    >
      <section className="finora-settings-form__section">
        <div className="finora-settings-form__section-header">
          <div className="finora-settings-form__section-heading">
            <h2 className="finora-settings-form__section-title">
              Business Identity
            </h2>

            <p className="finora-settings-form__section-subtitle">
              Registered FINORA ownership, business and active branch identity.
            </p>
          </div>
        </div>

        <div className="finora-settings-form__grid">
          <label className="finora-settings-form__field">
            <span className="finora-settings-form__label">
              Owner ID
            </span>

            <input
              className="finora-settings-form__input finora-settings-form__input--readonly"
              type="text"
              value={identity.ownerId}
              readOnly
              aria-readonly="true"
            />
          </label>

          <label className="finora-settings-form__field">
            <span className="finora-settings-form__label">
              Business ID
            </span>

            <input
              className="finora-settings-form__input finora-settings-form__input--readonly"
              type="text"
              value={identity.businessId}
              readOnly
              aria-readonly="true"
            />
          </label>

          <label className="finora-settings-form__field">
            <span className="finora-settings-form__label">
              Business Name
            </span>

            <input
              className="finora-settings-form__input finora-settings-form__input--readonly"
              type="text"
              value={identity.businessName}
              readOnly
              aria-readonly="true"
            />
          </label>

          <label className="finora-settings-form__field">
            <span className="finora-settings-form__label">
              Active Branch ID
            </span>

            <input
              className="finora-settings-form__input finora-settings-form__input--readonly"
              type="text"
              value={identity.branchId}
              readOnly
              aria-readonly="true"
            />
          </label>

          <label className="finora-settings-form__field">
            <span className="finora-settings-form__label">
              Active Branch Name
            </span>

            <input
              className="finora-settings-form__input finora-settings-form__input--readonly"
              type="text"
              value={identity.branchName}
              readOnly
              aria-readonly="true"
            />
          </label>
        </div>
      </section>

      <section className="finora-settings-form__section">
        <div className="finora-settings-form__section-header">
          <div className="finora-settings-form__section-heading">
            <h2 className="finora-settings-form__section-title">
              Business Contact & Operations
            </h2>

            <p className="finora-settings-form__section-subtitle">
              Configure the registered business contact, tax and currency settings.
            </p>
          </div>
        </div>

        <div className="finora-settings-form__grid">
          <label className="finora-settings-form__field finora-settings-form__field--full">
            <span className="finora-settings-form__label">
              Business Address
            </span>

            <textarea
              className="finora-settings-form__textarea"
              value={settings.address}
              disabled={controlsDisabled}
              required
              autoComplete="street-address"
              onChange={(event) =>
                onFieldChange(
                  "address",
                  event.currentTarget.value,
                )
              }
            />
          </label>

          <label className="finora-settings-form__field">
            <span className="finora-settings-form__label">
              Business Phone
            </span>

            <input
              className="finora-settings-form__input"
              type="tel"
              value={settings.phone}
              disabled={controlsDisabled}
              required
              autoComplete="tel"
              onChange={(event) =>
                onFieldChange(
                  "phone",
                  event.currentTarget.value,
                )
              }
            />
          </label>

          <label className="finora-settings-form__field">
            <span className="finora-settings-form__label">
              Business Email
            </span>

            <input
              className="finora-settings-form__input"
              type="email"
              value={settings.email}
              disabled={controlsDisabled}
              required
              autoComplete="email"
              onChange={(event) =>
                onFieldChange(
                  "email",
                  event.currentTarget.value,
                )
              }
            />
          </label>

          <label className="finora-settings-form__field">
            <span className="finora-settings-form__label">
              GST / Tax ID
            </span>

            <input
              className="finora-settings-form__input"
              type="text"
              value={settings.gst ?? ""}
              disabled={controlsDisabled}
              autoComplete="off"
              onChange={(event) =>
                onFieldChange(
                  "gst",
                  event.currentTarget.value,
                )
              }
            />

            <span className="finora-settings-form__helper">
              Optional
            </span>
          </label>

          <label className="finora-settings-form__field">
            <span className="finora-settings-form__label">
              Currency
            </span>

            <select
              className="finora-settings-form__select"
              value={settings.currency}
              disabled={controlsDisabled}
              required
              onChange={(event) =>
                onFieldChange(
                  "currency",
                  event.currentTarget.value,
                )
              }
            >
              {SUPPORTED_BUSINESS_CURRENCIES.map(
                (currency) => (
                  <option
                    key={currency}
                    value={currency}
                  >
                    {currency}
                  </option>
                ),
              )}
            </select>
          </label>

          <label className="finora-settings-form__field">
            <span className="finora-settings-form__label">
              Business Time Zone
            </span>

            <select
              className="finora-settings-form__select"
              value={settings.timeZone ?? ""}
              disabled={controlsDisabled}
              required
              onChange={(event) =>
                onFieldChange(
                  "timeZone",
                  event.currentTarget.value,
                )
              }
            >
              <option
                value=""
                disabled
              >
                Select business time zone
              </option>

              {settings.timeZone &&
                !BUSINESS_TIME_ZONES.some(
                  (option) =>
                    option.value ===
                    settings.timeZone,
                ) && (
                  <option
                    value={settings.timeZone}
                  >
                    Current - {settings.timeZone}
                  </option>
                )}

              {BUSINESS_TIME_ZONES.map(
                (option) => (
                  <option
                    key={option.value}
                    value={option.value}
                  >
                    {option.label} - {option.value}
                  </option>
                ),
              )}
            </select>

            <span className="finora-settings-form__helper">
              Used for scheduled notifications and business-local calendar time.
            </span>
          </label>
        </div>
      </section>

      <div className="finora-settings-form__actions">
        <button
          className="finora-settings-form__submit"
          type="submit"
          disabled={controlsDisabled}
        >
          <Save
            className="finora-settings-form__submit-icon"
            aria-hidden="true"
          />

          <span className="finora-settings-form__submit-label">
            {saving
              ? "Saving..."
              : "Save Business Settings"}
          </span>
        </button>
      </div>
    </form>
  );
}

// ============================================================
// END
// ============================================================
