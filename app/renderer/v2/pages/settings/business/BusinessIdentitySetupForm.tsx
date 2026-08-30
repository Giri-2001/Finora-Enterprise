// ============================================================
// FINORA ENTERPRISE OS™
//
// ENTERPRISE SETTINGS
// BUSINESS IDENTITY SETUP FORM
//
// RESPONSIBILITY:
//
// - Render first-time Business Identity setup
// - Keep Owner / Business / Branch identifiers read-only
// - Allow Business Name and Branch Name entry
// - Expose typed field changes to parent orchestration
// - Expose create intent to parent orchestration
//
// IMPORTANT:
//
// - No inline styles.
// - No persistence.
// - No repository access.
// - No service calls.
// - No local form state.
// - No authentication logic.
// - No theme values.
// - No responsive values.
// - FINORA identifiers remain read-only.
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

import type {
  BusinessIdentitySetupFormProps,
} from "./BusinessIdentitySetupForm.types";

// ============================================================
// COMPONENT
// ============================================================

export default function BusinessIdentitySetupForm({
  identity,
  disabled = false,
  saving = false,
  onFieldChange,
  onSubmit,
}: BusinessIdentitySetupFormProps) {

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
      className="finora-settings-form finora-settings-business-identity-setup-form"
      onSubmit={handleSubmit}
    >
      <section className="finora-settings-form__section">
        <div className="finora-settings-form__section-header">
          <div className="finora-settings-form__section-heading">
            <h2 className="finora-settings-form__section-title">
              Business Identity Setup
            </h2>

            <p className="finora-settings-form__section-subtitle">
              Complete the registered business and active branch identity before configuring Business Settings.
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
              className="finora-settings-form__input"
              type="text"
              value={identity.businessName}
              disabled={controlsDisabled}
              required
              autoComplete="organization"
              onChange={(event) =>
                onFieldChange(
                  "businessName",
                  event.currentTarget.value,
                )
              }
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
              className="finora-settings-form__input"
              type="text"
              value={identity.branchName}
              disabled={controlsDisabled}
              required
              autoComplete="off"
              onChange={(event) =>
                onFieldChange(
                  "branchName",
                  event.currentTarget.value,
                )
              }
            />
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
              ? "Creating..."
              : "Create Business Identity"}
          </span>
        </button>
      </div>
    </form>
  );
}

// ============================================================
// END
// ============================================================
