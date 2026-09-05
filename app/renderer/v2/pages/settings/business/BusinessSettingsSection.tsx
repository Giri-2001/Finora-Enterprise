// ============================================================
// FINORA ENTERPRISE OS™
//
// ENTERPRISE SETTINGS
// BUSINESS SETTINGS SECTION
//
// RESPONSIBILITY:
//
// - Resolve the active FINORA Business Context
// - Resolve signed Business Profile identity and Business Settings
// - Present signed Business / Branch identity as read-only
// - Own editable Business Settings form state
// - Persist operational Business Settings through services
// - Surface loading, success and failure feedback
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
// - FINORA identifiers come from the active Business Context.
//
// VERSION : 1.1
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
  BusinessSettings,
} from "../../../types/business/business.settings.types";

import {
  getBusinessContext,
} from "../../../services/business/businessContextService";

import {
  businessSettingsService,
} from "../../../services/business/businessService";

import SettingsFeedback from "../components/SettingsFeedback";

import type {
  SettingsFeedbackMessage,
} from "../components/SettingsFeedback.types";

import BusinessSettingsForm from "./BusinessSettingsForm";

import {
  startFinoraProcessing,
  stopFinoraProcessing,
} from "../../../components/common/feedback/finoraProcessing.service";

import type {
  BusinessSettingsEditableField,
} from "./BusinessSettingsForm.types";

import {
  scheduledLoanNotificationSchedulerLifecycle,
} from "../../../services/notifications/scheduler/scheduledLoanNotificationSchedulerLifecycle";

// ============================================================
// COMPONENT
// ============================================================

export default function BusinessSettingsSection() {

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
    BusinessSettings | null
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
                "Business Context Unavailable",

              message:
                "No complete active FINORA Business Context is available.",
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
                "Signed Business Profile Unavailable",

              message:
                "The authoritative FINORA Business Profile is unavailable for this workspace.",
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
                "Business Profile Mismatch",

              message:
                "The signed FINORA Business Profile does not match the active Business Context.",
            });

            setLoading(
              false,
            );
          }

          return;
        }

        const settingsResult =
          await businessSettingsService.load(
            context.businessId,
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
              "Unable to Load Settings",

            message:
              settingsResult.error ??
              "Business Settings could not be loaded.",
          });

          setLoading(
            false,
          );

          return;
        }

        const resolvedSettings =
          settingsResult.data ??
          businessSettingsService
            .createEmpty(
              context.businessId,
            );

        setIdentity(
          profile,
        );

        setSettings(
          resolvedSettings,
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
  // BUSINESS SETTINGS FIELD CHANGE
  // ==========================================================

  function handleFieldChange(
    field:
      BusinessSettingsEditableField,
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
  // SAVE BUSINESS SETTINGS
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
        "Saving Business Settings...",
      );

    setFeedback(
      null,
    );

    try {

      const result =
        await businessSettingsService.save(
          settings,
        );

      if (!result.success) {

        setFeedback({
          kind:
            "danger",

          title:
            "Unable to Save Settings",

          message:
            result.error ??
            "Business Settings could not be saved.",
        });

        return;
      }

      if (result.data) {

        setSettings(
          result.data,
        );
      }

      /**
       * Business time zone is scheduler authority.
       *
       * Re-plan immediately after persisted Business Settings
       * change so an already-armed scheduler timer cannot keep
       * using the previous time zone.
       */
      scheduledLoanNotificationSchedulerLifecycle.refresh();

      setFeedback({
        kind:
          "success",

        title:
          "Business Settings Saved",

        message:
          "Business contact, tax and currency settings were saved successfully.",
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
      <section className="finora-settings-section finora-settings-business-section">
        <SettingsFeedback
          kind="info"
          title="Loading Business Settings"
          message="FINORA is loading the active business configuration."
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
      <section className="finora-settings-section finora-settings-business-section">
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
    <section className="finora-settings-section finora-settings-business-section">
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

      <BusinessSettingsForm
        identity={identity}
        settings={settings}
        saving={saving}
        onFieldChange={handleFieldChange}
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
