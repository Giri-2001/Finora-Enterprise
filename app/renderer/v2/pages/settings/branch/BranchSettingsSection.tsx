// ============================================================
// FINORA ENTERPRISE OS™
//
// ENTERPRISE SETTINGS
// BRANCH SETTINGS SECTION
//
// RESPONSIBILITY:
//
// - Resolve the active FINORA Business Context
// - Resolve signed Business Profile identity and Branch Settings
// - Own editable Branch Settings form state
// - Persist Branch Settings through the service boundary
// - Surface photo, loading, success and failure feedback
//
// IMPORTANT:
//
// - No inline styles.
// - No repository access.
// - No direct StorageManager access.
// - No localStorage access.
// - No authentication-store access.
// - No theme values.
// - No responsive values.
// - Branch identity remains read-only.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

import {
  useEffect,
  useState,
} from "react";

import type {
  FinoraProvisionedBusinessProfileV1,
} from "../../../types/business/finoraBusinessProfileControl.types";

import type {
  BranchSettings,
} from "../../../types/business/branch.settings.types";

import {
  getBusinessContext,
} from "../../../services/business/businessContextService";

import {
  branchSettingsService,
} from "../../../services/business/branchSettingsService";

import SettingsFeedback from "../components/SettingsFeedback";

import type {
  SettingsFeedbackMessage,
} from "../components/SettingsFeedback.types";

import BranchSettingsForm from "./BranchSettingsForm";

import {
  startFinoraProcessing,
  stopFinoraProcessing,
} from "../../../components/common/feedback/finoraProcessing.service";

import type {
  BranchSettingsEditableField,
} from "./BranchSettingsForm.types";

// ============================================================
// COMPONENT
// ============================================================

export default function BranchSettingsSection() {

  const [
    identity,
    setIdentity,
  ] = useState<
      FinoraProvisionedBusinessProfileV1 | null
    >(null);

  const [
    settings,
    setSettings,
  ] = useState<
    BranchSettings | null
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
                "Branch Context Unavailable",

              message:
                "No active FINORA business and branch context is available.",
            });

            setLoading(
              false,
            );
          }

          return;
        }

        const profile =
          context.businessProfile;

        if (!profile) {

          if (active) {

            setFeedback({
              kind:
                "danger",

              title:
                "Signed Branch Profile Unavailable",

              message:
                "The authoritative FINORA Business Profile is unavailable for this branch.",
            });

            setLoading(
              false,
            );
          }

          return;
        }

        if (
          profile.ownerId !==
            context.ownerId ||
          profile.businessId !==
            context.businessId ||
          profile.branchId !==
            context.branchId
        ) {

          if (active) {

            setFeedback({
              kind:
                "danger",

              title:
                "Branch Profile Mismatch",

              message:
                "The signed FINORA Business Profile does not match the active branch context.",
            });

            setLoading(
              false,
            );
          }

          return;
        }

        const settingsResult =
          await branchSettingsService.load(
            context.businessId,
            context.branchId,
          );

        if (!active) {
          return;
        }

        if (
          !settingsResult.success
        ) {

          setFeedback({
            kind:
              "danger",

            title:
              "Unable to Load Branch Settings",

            message:
              settingsResult.error ??
              "Branch Settings could not be loaded.",
          });

          setLoading(
            false,
          );

          return;
        }

        setIdentity(
          profile,
        );

        setSettings(
          settingsResult.data ??
          branchSettingsService
            .createEmpty(
              context.businessId,
              context.branchId,
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
      BranchSettingsEditableField,
    value:
      string,
  ): void {

    setSettings(
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

    setSettings(
      (current) => {

        if (!current) {
          return current;
        }

        return {
          ...current,

          officePhotos:
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
        "Branch Photo Issue",

      message,
    });
  }

  // ==========================================================
  // SAVE
  // ==========================================================

  async function handleSubmit():
    Promise<void> {

    if (
      !settings ||
      saving
    ) {
      return;
    }

    setSaving(
      true,
    );

    const processingId =
      startFinoraProcessing(
        "Saving Branch Settings...",
      );

    setFeedback(
      null,
    );

    try {

      const result =
        await branchSettingsService.save(
          settings,
        );

      if (!result.success) {

        setFeedback({
          kind:
            "danger",

          title:
            "Unable to Save Branch Settings",

          message:
            result.error ??
            "Branch Settings could not be saved.",
        });

        return;
      }

      if (result.data) {

        setSettings(
          result.data,
        );
      }

      setFeedback({
        kind:
          "success",

        title:
          "Branch Settings Saved",

        message:
          "Branch contact information and visual identification were saved successfully.",
      });

    } finally {

      stopFinoraProcessing(
        processingId,
      );

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
      <section className="finora-settings-section finora-settings-branch-section">
        <SettingsFeedback
          kind="info"
          title="Loading Branch Settings"
          message="FINORA is loading the active branch configuration."
        />
      </section>
    );
  }

  // ==========================================================
  // UNAVAILABLE
  // ==========================================================

  if (
    !identity ||
    !settings
  ) {

    return (
      <section className="finora-settings-section finora-settings-branch-section">
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
    <section className="finora-settings-section finora-settings-branch-section">
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

      <BranchSettingsForm
        identity={identity}
        settings={settings}
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
