// ============================================================
// FINORA ENTERPRISE OS™
//
// ENTERPRISE SETTINGS
// BRANCH SETTINGS FORM
//
// RESPONSIBILITY:
//
// - Render active Branch identity information
// - Render editable Branch operational settings
// - Reuse Branch Photo Manager for office/shop photos
// - Expose typed field and photo changes to parent orchestration
// - Expose save intent to parent orchestration
//
// IMPORTANT:
//
// - No inline styles.
// - No persistence.
// - No repository access.
// - No service calls.
// - No local form state.
// - No duplicated photo-count constants.
// - No theme values.
// - No responsive values.
// - Branch identity fields are read-only.
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

import BranchPhotoManager from "./BranchPhotoManager";

import type {
  BranchSettingsFormProps,
} from "./BranchSettingsForm.types";

// ============================================================
// COMPONENT
// ============================================================

export default function BranchSettingsForm({
  identity,
  settings,
  disabled = false,
  saving = false,
  onFieldChange,
  onPhotosChange,
  onPhotoError,
  onSubmit,
}: BranchSettingsFormProps) {

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
      className="finora-settings-form finora-settings-branch-form"
      onSubmit={handleSubmit}
    >
      <section className="finora-settings-form__section">
        <div className="finora-settings-form__section-header">
          <div className="finora-settings-form__section-heading">
            <h2 className="finora-settings-form__section-title">
              Branch Identity
            </h2>

            <p className="finora-settings-form__section-subtitle">
              Active FINORA business and branch identity for this workspace.
            </p>
          </div>
        </div>

        <div className="finora-settings-form__grid">
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
              Branch ID
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
              Branch Name
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
              Branch Contact
            </h2>

            <p className="finora-settings-form__section-subtitle">
              Configure the active branch address and contact information.
            </p>
          </div>
        </div>

        <div className="finora-settings-form__grid">
          <label className="finora-settings-form__field finora-settings-form__field--full">
            <span className="finora-settings-form__label">
              Branch Address
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
              Branch Phone
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
              Branch Email
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
        </div>
      </section>

      <section className="finora-settings-form__section">
        <div className="finora-settings-form__section-header">
          <div className="finora-settings-form__section-heading">
            <h2 className="finora-settings-form__section-title">
              Branch Visual Identification
            </h2>

            <p className="finora-settings-form__section-subtitle">
              Maintain clear shop or office photos for branch identification.
            </p>
          </div>
        </div>

        <BranchPhotoManager
          photos={settings.officePhotos}
          disabled={controlsDisabled}
          onChange={onPhotosChange}
          onError={onPhotoError}
        />
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
              : "Save Branch Settings"}
          </span>
        </button>
      </div>
    </form>
  );
}

// ============================================================
// END
// ============================================================
