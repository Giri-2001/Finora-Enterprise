// ============================================================
// FINORA ENTERPRISE OS™
//
// ENTERPRISE SETTINGS
// BUSINESS SETTINGS SECTION
//
// RESPONSIBILITY:
//
// - Resolve the active FINORA Business Context
// - Load Business Identity and Business Settings
// - Coordinate first-time Business Identity setup
// - Own editable Business Settings form state
// - Persist Business Identity and Business Settings through services
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
  BusinessIdentity,
} from "../../../types/business/business.identity.types";

import type {
  BusinessSettings,
} from "../../../types/business/business.settings.types";

import {
  getBusinessContext,
} from "../../../services/business/businessContextService";

import {
  businessIdentityService,
  businessSettingsService,
} from "../../../services/business/businessService";

import SettingsFeedback from "../components/SettingsFeedback";

import type {
  SettingsFeedbackMessage,
} from "../components/SettingsFeedback.types";

import BusinessIdentitySetupForm from "./BusinessIdentitySetupForm";

import type {
  BusinessIdentitySetupEditableField,
} from "./BusinessIdentitySetupForm.types";

import BusinessSettingsForm from "./BusinessSettingsForm";

import type {
  BusinessSettingsEditableField,
} from "./BusinessSettingsForm.types";

// ============================================================
// COMPONENT
// ============================================================

export default function BusinessSettingsSection() {

  const [
    identity,
    setIdentity,
  ] = useState<
    BusinessIdentity | null
  >(null);

  const [
    settings,
    setSettings,
  ] = useState<
    BusinessSettings | null
  >(null);

  const [
    identitySetupRequired,
    setIdentitySetupRequired,
  ] = useState(
    false,
  );

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

        setIdentitySetupRequired(
          false,
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

        const [
          identityResult,
          settingsResult,
        ] = await Promise.all([
          businessIdentityService.load(
            context.businessId,
          ),

          businessSettingsService.load(
            context.businessId,
          ),
        ]);

        if (!active) {
          return;
        }

        if (
          !identityResult.success
        ) {

          setFeedback({
            kind:
              "danger",

            title:
              "Unable to Load Business",

            message:
              identityResult.error ??
              "Business Identity could not be loaded.",
          });

          setLoading(
            false,
          );

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

        if (
          !identityResult.data
        ) {

          setIdentity(
            businessIdentityService
              .createEmpty(
                context.ownerId,
                context.businessId,
                context.branchId,
              ),
          );

          setSettings(
            resolvedSettings,
          );

          setIdentitySetupRequired(
            true,
          );

          setFeedback({
            kind:
              "info",

            title:
              "Complete Business Identity",

            message:
              "Enter the registered Business Name and active Branch Name to complete first-time setup.",
          });

          setLoading(
            false,
          );

          return;
        }

        setIdentity(
          identityResult.data,
        );

        setSettings(
          resolvedSettings,
        );

        setIdentitySetupRequired(
          false,
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
  // BUSINESS IDENTITY FIELD CHANGE
  // ==========================================================

  function handleIdentityFieldChange(
    field:
      BusinessIdentitySetupEditableField,
    value:
      string,
  ): void {

    setIdentity(
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
  }

  // ==========================================================
  // CREATE BUSINESS IDENTITY
  // ==========================================================

  async function handleIdentitySubmit():
    Promise<void> {

    if (
      !identity ||
      !identitySetupRequired ||
      saving
    ) {
      return;
    }

    const context =
      getBusinessContext();

    if (
      !context?.ownerId ||
      !context.businessId ||
      !context.branchId
    ) {

      setFeedback({
        kind:
          "danger",

        title:
          "Business Context Unavailable",

        message:
          "The active FINORA Business Context is incomplete.",
      });

      return;
    }

    setSaving(
      true,
    );

    setFeedback(
      null,
    );

    try {

      const prepared:
        BusinessIdentity = {

        ...identity,

        ownerId:
          context.ownerId,

        businessId:
          context.businessId,

        branchId:
          context.branchId,
      };

      const result =
        await businessIdentityService.create(
          prepared,
        );

      if (
        !result.success ||
        !result.data
      ) {

        setFeedback({
          kind:
            "danger",

          title:
            "Unable to Create Business Identity",

          message:
            result.error ??
            "Business Identity could not be created.",
        });

        return;
      }

      const createdBusinessId =
        result.data.businessId;

      setIdentity(
        result.data,
      );

      setSettings(
        (current) =>
          current ??
          businessSettingsService
            .createEmpty(
              createdBusinessId,
            ),
      );

      setIdentitySetupRequired(
        false,
      );

      setFeedback({
        kind:
          "success",

        title:
          "Business Identity Created",

        message:
          "Business and active branch identity were created successfully.",
      });

    } catch {

      setFeedback({
        kind:
          "danger",

        title:
          "Unable to Create Business Identity",

        message:
          "An unexpected error occurred while creating Business Identity.",
      });

    } finally {

      setSaving(
        false,
      );
    }
  }

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

      setFeedback({
        kind:
          "success",

        title:
          "Business Settings Saved",

        message:
          "Business contact, tax and currency settings were saved successfully.",
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
  // FIRST-TIME BUSINESS IDENTITY SETUP
  // ==========================================================

  if (
    identitySetupRequired &&
    identity
  ) {

    return (
      <section className="finora-settings-section finora-settings-business-section">
        {feedback && (
          <SettingsFeedback
            {...feedback}
          />
        )}

        <BusinessIdentitySetupForm
          identity={identity}
          saving={saving}
          onFieldChange={handleIdentityFieldChange}
          onSubmit={() => {
            void handleIdentitySubmit();
          }}
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
