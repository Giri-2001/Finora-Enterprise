// ============================================================
// FINORA ENTERPRISE OS™
//
// ENTERPRISE SETTINGS
// BUSINESS OWNER PROFILE FORM
//
// RESPONSIBILITY:
//
// - Render authenticated Business Owner identity
// - Render Business Owner profile linkage
// - Render editable owner contact information
// - Reuse Business Owner Photo Manager
// - Expose typed changes and save intent to parent orchestration
//
// IMPORTANT:
//
// - No inline styles.
// - No persistence.
// - No repository access.
// - No service calls.
// - No local form state.
// - No password field.
// - No duplicated photo-count constants.
// - No theme values.
// - No responsive values.
// - Authentication and linkage fields are read-only.
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

import BusinessOwnerPhotoManager from "./BusinessOwnerPhotoManager";

import type {
  BusinessOwnerProfileFormProps,
} from "./BusinessOwnerProfileForm.types";

// ============================================================
// COMPONENT
// ============================================================

export default function BusinessOwnerProfileForm({
  session,
  profile,
  disabled = false,
  saving = false,
  onFieldChange,
  onPhotosChange,
  onPhotoError,
  onSubmit,
}: BusinessOwnerProfileFormProps) {

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
      className="finora-settings-form finora-settings-owner-form"
      onSubmit={handleSubmit}
    >
      <section className="finora-settings-form__section finora-settings-owner-identity-section">
        <div className="finora-settings-form__section-header">
          <div className="finora-settings-form__section-heading">
            <h2 className="finora-settings-form__section-title">
              Business Owner Identity
            </h2>

            <p className="finora-settings-form__section-subtitle">
              Authenticated FINORA user identity for the active Business Owner profile.
            </p>
          </div>
        </div>

        <div className="finora-settings-form__grid">
          <label className="finora-settings-form__field">
            <span className="finora-settings-form__label">
              User ID
            </span>

            <input
              className="finora-settings-form__input finora-settings-form__input--readonly"
              type="text"
              value={session.userId}
              readOnly
              aria-readonly="true"
            />
          </label>

          <label className="finora-settings-form__field">
            <span className="finora-settings-form__label">
              Username
            </span>

            <input
              className="finora-settings-form__input finora-settings-form__input--readonly"
              type="text"
              value={session.username}
              readOnly
              aria-readonly="true"
            />
          </label>

          <label className="finora-settings-form__field">
            <span className="finora-settings-form__label">
              Full Name
            </span>

            <input
              className="finora-settings-form__input finora-settings-form__input--readonly"
              type="text"
              value={session.fullName}
              readOnly
              aria-readonly="true"
            />
          </label>

          <label className="finora-settings-form__field">
            <span className="finora-settings-form__label">
              Role
            </span>

            <input
              className="finora-settings-form__input finora-settings-form__input--readonly"
              type="text"
              value={
                session.role === "ADMIN"
                  ? "Business Owner"
                  : session.role
              }
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
              Business Linkage
            </h2>

            <p className="finora-settings-form__section-subtitle">
              Owner, business and branch identifiers linked to this profile.
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
              value={profile.ownerId}
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
              value={profile.businessId}
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
              value={profile.branchId}
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
              Owner Contact
            </h2>

            <p className="finora-settings-form__section-subtitle">
              Configure Business Owner phone and email information.
            </p>
          </div>
        </div>

        <div className="finora-settings-form__grid">
          <label className="finora-settings-form__field">
            <span className="finora-settings-form__label">
              Owner Phone
            </span>

            <input
              className="finora-settings-form__input"
              type="tel"
              value={profile.phone}
              disabled={controlsDisabled}
              required
              autoComplete="tel"
              inputMode="numeric"
              maxLength={10}
              pattern="[0-9]{10}"
              onChange={(event) => {
                const value = event.currentTarget.value
                  .replace(/\D/g, "")
                  .slice(0, 10);

                onFieldChange(
                  "phone",
                  value,
                );
              }}
            />
          </label>

          <label className="finora-settings-form__field">
            <span className="finora-settings-form__label">
              Owner Email
            </span>

            <input
              className="finora-settings-form__input"
              type="email"
              value={profile.email}
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
              Owner Visual Identification
            </h2>

            <p className="finora-settings-form__section-subtitle">
              Maintain clear Business Owner photos for visual identification.
            </p>
          </div>
        </div>

        <BusinessOwnerPhotoManager
          photos={profile.ownerPhotos}
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
              : "Save Owner Profile"}
          </span>
        </button>
      </div>
    </form>
  );
}

// ============================================================
// END
// ============================================================
