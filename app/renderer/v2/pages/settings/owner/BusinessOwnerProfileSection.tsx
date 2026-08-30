// ============================================================
// FINORA ENTERPRISE OS™
//
// ENTERPRISE SETTINGS
// BUSINESS OWNER PROFILE SECTION
//
// RESPONSIBILITY:
//
// - Resolve the authenticated FINORA session
// - Resolve the active FINORA Business Context
// - Verify session and active business linkage
// - Load the active Business Owner Profile
// - Own editable Business Owner Profile state
// - Persist profile changes through the service boundary
// - Surface photo, loading, success and failure feedback
//
// IMPORTANT:
//
// - No inline styles.
// - No repository access.
// - No direct StorageManager access.
// - No direct localStorage access.
// - Authentication is read through authStore session API.
// - No password handling.
// - No theme values.
// - No responsive values.
// - Authenticated identity and linkage remain read-only.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

import {
  useEffect,
  useState,
} from "react";

import type {
  AuthSession,
} from "../../../components/auth/types";

import type {
  BusinessOwnerProfile,
} from "../../../types/business/business.owner.profile.types";

import {
  getSession,
} from "../../../store/authStore";

import {
  getBusinessContext,
} from "../../../services/business/businessContextService";

import {
  businessOwnerProfileService,
} from "../../../services/business/businessOwnerProfileService";

import SettingsFeedback from "../components/SettingsFeedback";

import type {
  SettingsFeedbackMessage,
} from "../components/SettingsFeedback.types";

import BusinessOwnerProfileForm from "./BusinessOwnerProfileForm";

import type {
  BusinessOwnerProfileEditableField,
} from "./BusinessOwnerProfileForm.types";

// ============================================================
// COMPONENT
// ============================================================

export default function BusinessOwnerProfileSection() {

  const [
    session,
    setSession,
  ] = useState<
    AuthSession | null
  >(null);

  const [
    profile,
    setProfile,
  ] = useState<
    BusinessOwnerProfile | null
  >(null);

  const [
    loading,
    setLoading,
  ] = useState(
    true,
  );

  const [
    saving,
    setSaving,
  ] = useState(
    false,
  );

  const [
    feedback,
    setFeedback,
  ] = useState<
    SettingsFeedbackMessage | null
  >(null);

  // ==========================================================
  // LOAD
  // ==========================================================

  useEffect(
    () => {

      let active =
        true;

      async function load():
        Promise<void> {

        setLoading(
          true,
        );

        setFeedback(
          null,
        );

        const authenticatedSession =
          getSession();

        if (
          !authenticatedSession ||
          !authenticatedSession.userId
        ) {

          if (active) {

            setFeedback({
              kind:
                "danger",

              title:
                "Authenticated User Unavailable",

              message:
                "No active FINORA authenticated user session is available.",
            });

            setLoading(
              false,
            );
          }

          return;
        }

        const context =
          getBusinessContext();

        if (
          !context?.ownerId ||
          !context.businessId ||
          !context.branchId
        ) {

          if (active) {

            setFeedback({
              kind:
                "danger",

              title:
                "Business Context Unavailable",

              message:
                "No complete FINORA owner, business and branch context is available.",
            });

            setLoading(
              false,
            );
          }

          return;
        }

        // ----------------------------------------------------
        // SESSION / ACTIVE CONTEXT INTEGRITY
        // ----------------------------------------------------

        if (
          authenticatedSession.ownerId &&
          authenticatedSession.ownerId !==
            context.ownerId
        ) {

          if (active) {

            setFeedback({
              kind:
                "danger",

              title:
                "Owner Context Mismatch",

              message:
                "The authenticated user does not match the active FINORA owner context.",
            });

            setLoading(
              false,
            );
          }

          return;
        }

        if (
          authenticatedSession.businessId &&
          authenticatedSession.businessId !==
            context.businessId
        ) {

          if (active) {

            setFeedback({
              kind:
                "danger",

              title:
                "Business Context Mismatch",

              message:
                "The authenticated user does not match the active FINORA business context.",
            });

            setLoading(
              false,
            );
          }

          return;
        }

        if (
          authenticatedSession.branchId &&
          authenticatedSession.branchId !==
            context.branchId
        ) {

          if (active) {

            setFeedback({
              kind:
                "danger",

              title:
                "Branch Context Mismatch",

              message:
                "The authenticated user does not match the active FINORA branch context.",
            });

            setLoading(
              false,
            );
          }

          return;
        }

        const profileResult =
          await businessOwnerProfileService.load(
            context.ownerId,
            context.businessId,
            context.branchId,
            authenticatedSession.userId,
          );

        if (!active) {
          return;
        }

        if (
          !profileResult.success
        ) {

          setFeedback({
            kind:
              "danger",

            title:
              "Unable to Load Owner Profile",

            message:
              profileResult.error ??
              "Business Owner Profile could not be loaded.",
          });

          setLoading(
            false,
          );

          return;
        }

        setSession(
          authenticatedSession,
        );

        setProfile(
          profileResult.data ??
          businessOwnerProfileService
            .createEmpty(
              context.ownerId,
              context.businessId,
              context.branchId,
              authenticatedSession.userId,
            ),
        );

        setLoading(
          false,
        );
      }

      void load();

      return () => {

        active =
          false;
      };
    },
    [],
  );

  // ==========================================================
  // FIELD CHANGE
  // ==========================================================

  function handleFieldChange(
    field:
      BusinessOwnerProfileEditableField,
    value:
      string,
  ): void {

    setProfile(
      (current) => {

        if (!current) {
          return current;
        }

        return {
          ...current,

          [field]:
            value,
        };
      },
    );

    if (
      feedback?.kind ===
      "success"
    ) {

      setFeedback(
        null,
      );
    }
  }

  // ==========================================================
  // PHOTO CHANGE
  // ==========================================================

  function handlePhotosChange(
    photos:
      string[],
  ): void {

    setProfile(
      (current) => {

        if (!current) {
          return current;
        }

        return {
          ...current,

          ownerPhotos:
            photos,
        };
      },
    );

    if (
      feedback?.kind ===
      "success"
    ) {

      setFeedback(
        null,
      );
    }
  }

  // ==========================================================
  // PHOTO ERROR
  // ==========================================================

  function handlePhotoError(
    message:
      string,
  ): void {

    setFeedback({
      kind:
        "warning",

      title:
        "Owner Photo Issue",

      message,
    });
  }

  // ==========================================================
  // SAVE
  // ==========================================================

  async function handleSubmit():
    Promise<void> {

    if (
      !profile ||
      saving
    ) {
      return;
    }

    setSaving(
      true,
    );

    setFeedback(
      null,
    );

    try {

      const result =
        await businessOwnerProfileService.save(
          profile,
        );

      if (!result.success) {

        setFeedback({
          kind:
            "danger",

          title:
            "Unable to Save Owner Profile",

          message:
            result.error ??
            "Business Owner Profile could not be saved.",
        });

        return;
      }

      if (result.data) {

        setProfile(
          result.data,
        );
      }

      setFeedback({
        kind:
          "success",

        title:
          "Owner Profile Saved",

        message:
          "Business Owner contact information and visual identification were saved successfully.",
      });

    } catch {

      setFeedback({
        kind:
          "danger",

        title:
          "Unable to Save Owner Profile",

        message:
          "An unexpected error occurred while saving the Business Owner Profile.",
      });

    } finally {

      setSaving(
        false,
      );
    }
  }

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {

    return (
      <section className="finora-settings-section finora-settings-owner-section">
        <SettingsFeedback
          kind="info"
          title="Loading Owner Profile"
          message="FINORA is loading the authenticated Business Owner profile."
        />
      </section>
    );
  }

  // ==========================================================
  // UNAVAILABLE
  // ==========================================================

  if (
    !session ||
    !profile
  ) {

    return (
      <section className="finora-settings-section finora-settings-owner-section">
        {feedback && (
          <SettingsFeedback
            {...feedback}
          />
        )}
      </section>
    );
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <section className="finora-settings-section finora-settings-owner-section">
      {feedback && (
        <SettingsFeedback
          {...feedback}
          dismissible
          onDismiss={() =>
            setFeedback(
              null,
            )
          }
        />
      )}

      <BusinessOwnerProfileForm
        session={session}
        profile={profile}
        saving={saving}
        onFieldChange={handleFieldChange}
        onPhotosChange={handlePhotosChange}
        onPhotoError={handlePhotoError}
        onSubmit={() => {
          void handleSubmit();
        }}
      />
    </section>
  );
}

// ============================================================
// END
// ============================================================
