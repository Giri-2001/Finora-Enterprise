// ============================================================
// FINORA ENTERPRISE OS™
//
// ENTERPRISE SETTINGS
// NUMBERING & SERIES SETTINGS SECTION
//
// RESPONSIBILITY:
//
// - Load Customer Series configuration
// - Coordinate pre-lock Customer Series preview
// - Lock the owner-selected starting Customer number once
// - Load the next Customer number preview after lock
// - Surface loading, success and failure feedback
//
// IMPORTANT:
//
// - No inline styles.
// - No repository access.
// - No direct StorageManager access.
// - No localStorage access.
// - No secure-control access from the UI.
// - Business / Branch numbering codes come through the
//   Numbering Service only.
// - Preview operations never consume Customer numbers.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

import {
  useEffect,
  useState,
} from "react";

import type {
  CustomerNumberPreview,
  CustomerSeriesConfiguration,
  CustomerSeriesSetupPreview,
} from "../../../types/numbering/numbering.types";

import {
  loadCustomerSeriesConfiguration,
  lockCustomerSeries,
  previewCustomerSeriesSetup,
  previewNextCustomerNumber,
} from "../../../services/numbering/customerSeriesService";

// FINORA_P1_730D_SERVER_SETTINGS_READ
import { resolveFinoraNumberingScope } from "../../../services/numbering/finoraNumberingScopeService";
import { readFinoraServerNumbering } from "../../../services/numbering/finoraServerNumberingRead";
import type { ServerNumberingSnapshot } from "../../../services/numbering/finoraServerNumberingRead";
import SettingsFeedback from "../components/SettingsFeedback";

import type {
  SettingsFeedbackMessage,
} from "../components/SettingsFeedback.types";

import NumberingSeriesSettingsForm from "./NumberingSeriesSettingsForm";

import {
  startFinoraProcessing,
  stopFinoraProcessing,
} from "../../../components/common/feedback/finoraProcessing.service";

// ============================================================
// COMPONENT
// ============================================================

export default function NumberingSeriesSettingsSection() {

  // FINORA_P1_730D_SERVER_SETTINGS_READ
  const [serverNumbering, setServerNumbering] = useState<ServerNumberingSnapshot | null>(null);
  const [serverNumberingLoading, setServerNumberingLoading] = useState(true);
  const [serverNumberingError, setServerNumberingError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function loadServerNumbering(): Promise<void> {
      try {
        const scope = await resolveFinoraNumberingScope();
        if (!active) return;
        if (!scope.success || !scope.data) {
          setServerNumberingError("AUTHORIZED_NUMBERING_SCOPE_UNAVAILABLE");
          return;
        }
        const result = await readFinoraServerNumbering({
          ownerId: scope.data.ownerId,
          businessId: scope.data.businessId,
          branchId: scope.data.branchId,
        });
        if (!active) return;
        if (!result.success) {
          setServerNumberingError(result.errorCode);
          return;
        }
        setServerNumbering(result.data);
        setServerNumberingError(null);
      } catch {
        if (active) setServerNumberingError("SERVER_NUMBERING_READ_FAILED");
      } finally {
        if (active) setServerNumberingLoading(false);
      }
    }
    void loadServerNumbering();
    return () => { active = false; };
  }, []);


  // FINORA_P1_730B_MIGRATION_GATE
  // Server migration is incomplete. Never create a second series.
  // Do not present a USB-only next number as globally available.
  const centralNumberingMigrationPending = true;

  const [
    configuration,
    setConfiguration,
  ] = useState<
    CustomerSeriesConfiguration | null
  >(
    null,
  );

  const [
    setupPreview,
    setSetupPreview,
  ] = useState<
    CustomerSeriesSetupPreview | null
  >(
    null,
  );

  const [
    nextPreview,
    setNextPreview,
  ] = useState<
    CustomerNumberPreview | null
  >(
    null,
  );

  const [
    startingCustomerNumber,
    setStartingCustomerNumber,
  ] = useState(
    "",
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
  >(
    null,
  );

  // ==========================================================
  // LOAD CONFIGURATION
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

        const configurationResult =
          await loadCustomerSeriesConfiguration();

        if (!active) {
          return;
        }

        if (!configurationResult.success) {

          setFeedback({
            kind:
              "danger",

            title:
              "Numbering Configuration Unavailable",

            message:
              configurationResult.error ??
              "Unable to load the Customer Series configuration.",
          });

          setLoading(
            false,
          );

          return;
        }

        const loadedConfiguration =
          configurationResult.data;

        if (!loadedConfiguration) {

          setConfiguration(
            null,
          );

          setNextPreview(
            null,
          );

          setStartingCustomerNumber(
            "",
          );

          setLoading(
            false,
          );

          return;
        }

        if (
          loadedConfiguration.status !==
          "LOCKED"
        ) {

          setConfiguration(
            loadedConfiguration,
          );

          setFeedback({
            kind:
              "danger",

            title:
              "Unsupported Customer Series State",

            message:
              "The persisted Customer Series is not in the required locked state.",
          });

          setLoading(
            false,
          );

          return;
        }

        setConfiguration(
          loadedConfiguration,
        );

        setStartingCustomerNumber(
          String(
            loadedConfiguration.startingCustomerNumber,
          ),
        );

        const previewResult =
          await previewNextCustomerNumber();

        if (!active) {
          return;
        }

        if (
          !previewResult.success ||
          !previewResult.data
        ) {

          setNextPreview(
            null,
          );

          setFeedback({
            kind:
              "warning",

            title:
              "Customer Series Loaded",

            message:
              previewResult.error ??
              "The Customer Series is locked, but the next Customer preview is unavailable.",
          });

          setLoading(
            false,
          );

          return;
        }

        setNextPreview(
          previewResult.data,
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
  // PRE-LOCK SETUP PREVIEW
  // ==========================================================

  useEffect(
    () => {

      if (
        loading ||
        configuration?.status ===
          "LOCKED"
      ) {

        setSetupPreview(
          null,
        );

        return;
      }

      const normalizedInput =
        startingCustomerNumber.trim();

      if (
        !normalizedInput ||
        !/^[0-9]+$/.test(
          normalizedInput,
        )
      ) {

        setSetupPreview(
          null,
        );

        return;
      }

      const numericValue =
        Number(
          normalizedInput,
        );

      if (
        !Number.isSafeInteger(
          numericValue,
        )
      ) {

        setSetupPreview(
          null,
        );

        return;
      }

      let active =
        true;

      async function loadSetupPreview():
        Promise<void> {

        const result =
          await previewCustomerSeriesSetup({
            startingCustomerNumber:
              numericValue,
          });

        if (!active) {
          return;
        }

        if (
          !result.success ||
          !result.data
        ) {

          setSetupPreview(
            null,
          );

          setFeedback({
            kind:
              "danger",

            title:
              "Customer Series Preview Unavailable",

            message:
              result.error ??
              "Unable to preview the Customer Series.",
          });

          return;
        }

        setSetupPreview(
          result.data,
        );

        setFeedback(
          null,
        );
      }

      void loadSetupPreview();

      return () => {

        active =
          false;

      };

    },
    [
      configuration,
      loading,
      startingCustomerNumber,
    ],
  );

  // ==========================================================
  // STARTING CUSTOMER NUMBER
  // ==========================================================

  function handleStartingCustomerNumberChange(
    value:
      string,
  ): void {

    setStartingCustomerNumber(
      value,
    );

    setSetupPreview(
      null,
    );
  }

  // ==========================================================
  // LOCK CUSTOMER SERIES
  // ==========================================================

  async function handleSubmit():
    Promise<void> {

    if (
      centralNumberingMigrationPending ||
      saving ||
      configuration?.status ===
        "LOCKED"
    ) {
      return;
    }

    const normalizedInput =
      startingCustomerNumber.trim();

    if (
      !normalizedInput ||
      !/^[0-9]+$/.test(
        normalizedInput,
      )
    ) {

      setFeedback({
        kind:
          "danger",

        title:
          "Invalid Starting Customer Number",

        message:
          "Enter a whole-number starting Customer number before locking the series.",
      });

      return;
    }

    const numericValue =
      Number(
        normalizedInput,
      );

    if (
      !Number.isSafeInteger(
        numericValue,
      )
    ) {

      setFeedback({
        kind:
          "danger",

        title:
          "Invalid Starting Customer Number",

        message:
          "Starting Customer number must be a safe whole number.",
      });

      return;
    }

    setSaving(
      true,
    );

    const processingId =
      startFinoraProcessing(
        "Locking Customer Series...",
      );

    setFeedback(
      null,
    );

    try {

      const lockResult =
        await lockCustomerSeries({
          startingCustomerNumber:
            numericValue,
        });

      if (
        !lockResult.success ||
        !lockResult.data
      ) {

        setFeedback({
          kind:
            "danger",

          title:
            "Customer Series Not Locked",

          message:
            lockResult.error ??
            "Unable to lock the Customer Series.",
        });

        return;
      }

      const lockedConfiguration =
        lockResult.data;

      setConfiguration(
        lockedConfiguration,
      );

      setStartingCustomerNumber(
        String(
          lockedConfiguration.startingCustomerNumber,
        ),
      );

      setSetupPreview(
        null,
      );

      const previewResult =
        await previewNextCustomerNumber();

      if (
        !previewResult.success ||
        !previewResult.data
      ) {

        setNextPreview(
          null,
        );

        setFeedback({
          kind:
            "warning",

          title:
            "Customer Series Locked",

          message:
            previewResult.error ??
            "The Customer Series was locked successfully, but the next Customer preview is unavailable.",
        });

        return;
      }

      setNextPreview(
        previewResult.data,
      );

      setFeedback({
        kind:
          "success",

        title:
          "Customer Series Locked",

        message:
          "The starting Customer number is now permanently locked for this branch.",
      });

    } catch (error) {

      setFeedback({
        kind:
          "danger",

        title:
          "Customer Series Error",

        message:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred while locking the Customer Series.",
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

  // FINORA_P1_730D_SERVER_SETTINGS_READ
  // Prevent the USB-only form from presenting a global counter.
  // No duplicate Series Lock is possible in this view.
  if (centralNumberingMigrationPending) {
    return (
      <div className="finora-settings-form">
        {serverNumberingLoading ? (
          <SettingsFeedback kind="info" title="Checking Central Customer Numbering" message="Reading verified PostgreSQL branch numbering." />
        ) : serverNumbering ? (
          <>
            <SettingsFeedback kind="info" title="Server Customer Series — Read Only" message="Central series is visible. Customer Registration server reservation is not yet enabled." />
            <div>Series Status: {serverNumbering.status}</div>
            <div>Starting Customer Number: {serverNumbering.startingCustomerNumber}</div>
            <div>Last Issued Customer Number: {serverNumbering.lastIssuedCustomerNumber === null ? "None" : serverNumbering.lastIssuedCustomerNumber}</div>
            <div>Next Customer Number (Preview Only): {serverNumbering.nextCustomerNumber === null ? "Series Exhausted" : serverNumbering.nextCustomerNumber}</div>
            <div>Business Code: {serverNumbering.businessCode}</div>
            <div>Branch Code: {serverNumbering.branchCode}</div>
          </>
        ) : (
          <SettingsFeedback
            kind="warning"
            title="Central Numbering Migration Required"
            message={`Central numbering is not verified (${serverNumberingError ?? "SERVER_NOT_READY"}). Existing USB series remains preserved. Do not create a new series or issue a number from another device.`}
          />
        )}
      </div>
    );
  }
  if (loading) {

    return (
      <div className="finora-settings-form">
        <SettingsFeedback
          kind="info"
          title="Loading Numbering & Series"
          message="Loading the Customer Series configuration for the active branch."
        />
      </div>
    );
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <>
      {/* FINORA_P1_730B_MIGRATION_GATE */}
      {centralNumberingMigrationPending && (
        <SettingsFeedback
          kind="warning"
          title="Central Numbering Migration Required"
          message="Existing branch Customer Series is preserved. Cross-device numbering is not active yet. New Series Lock and Customer Number allocation must remain disabled until PostgreSQL migration and verification are complete."
        />
      )}
      {feedback && (
        <SettingsFeedback
          kind={feedback.kind}
          title={feedback.title}
          message={feedback.message}
          dismissible
          onDismiss={() =>
            setFeedback(
              null,
            )
          }
        />
      )}

      <NumberingSeriesSettingsForm
        configuration={
          configuration
        }
        setupPreview={
          setupPreview
        }
        nextPreview={centralNumberingMigrationPending ? null : nextPreview}
        startingCustomerNumber={
          startingCustomerNumber
        }
        disabled={saving || centralNumberingMigrationPending}
        saving={
          saving
        }
        onStartingCustomerNumberChange={
          handleStartingCustomerNumberChange
        }
        onSubmit={() => {
          void handleSubmit();
        }}
      />
    </>
  );
}

// ============================================================
// END
// ============================================================
