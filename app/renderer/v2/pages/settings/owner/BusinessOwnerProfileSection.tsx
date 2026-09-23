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

import {
  Eye,
  EyeOff,
} from "lucide-react";

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


import {
  startFinoraProcessing,
  stopFinoraProcessing,
} from "../../../components/common/feedback/finoraProcessing.service";

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

  const [
    backupPassword,
    setBackupPassword,
  ] = useState("");

  const [
    backupSecurityCode,
    setBackupSecurityCode,
  ] = useState("");

  const [
    showBackupPassword,
    setShowBackupPassword,
  ] = useState(
    false,
  );

  const [
    showBackupSecurityCode,
    setShowBackupSecurityCode,
  ] = useState(
    false,
  );

  const [
    backupBusy,
    setBackupBusy,
  ] = useState(
    false,
  );

  const [
    prepareDeviceBusy,
    setPrepareDeviceBusy,
  ] = useState(
    false,
  );

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

    const processingId =
      startFinoraProcessing(
        "Saving Owner Profile...",
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

      stopFinoraProcessing(
        processingId,
      );

      setSaving(
        false,
      );
    }
  }

  // ==========================================================
  // PORTABLE BRANCH AUTH BACKUP
  //
  // Renderer supplies current opaque sessionId plus fresh
  // Password + Security Code only. Branch/storage/filesystem
  // authority remains Electron-main-owned.
  // ==========================================================

  async function handleBranchBackup():
    Promise<void> {

    if (backupBusy || prepareDeviceBusy) {
      return;
    }

    const currentSession =
      getSession();

    const sessionId =
      String(
        currentSession?.sessionId ??
        "",
      ).trim();

    if (!sessionId) {
      setFeedback({
        kind:
          "danger",

        title:
          "Authenticated Session Required",

        message:
          "Sign in again before creating a FINORA Branch Backup.",
      });

      return;
    }

    if (
      backupPassword.trim().length ===
        0 ||
      backupSecurityCode.trim().length ===
        0
    ) {
      setFeedback({
        kind:
          "danger",

        title:
          "Backup Authentication Required",

        message:
          "Enter your current Password and Security Code to create the Branch Backup.",
      });

      return;
    }

    const bridge =
      window.finora
        ?.portableBranchAuthBackup;

    if (
      !bridge ||
      typeof bridge.exportBackup !==
        "function"
    ) {
      setFeedback({
        kind:
          "danger",

        title:
          "Branch Backup Unavailable",

        message:
          "FINORA Branch Backup is not available in this application build.",
      });

      return;
    }

    setBackupBusy(
      true,
    );

    setFeedback(
      null,
    );

    const processingId =
      startFinoraProcessing(
        "Preparing FINORA Branch Backup...",
      );

    try {
      const result =
        await bridge.exportBackup({
          sessionId,

          password:
            backupPassword,

          securityCode:
            backupSecurityCode,
        });

      if (!result.success) {
        setFeedback({
          kind:
            "danger",

          title:
            "Branch Backup Failed",

          message:
            result.error,
        });

        return;
      }

      if (result.cancelled) {
        setFeedback({
          kind:
            "info",

          title:
            "Branch Backup Cancelled",

          message:
            "No backup file was written.",
        });

        return;
      }

      setFeedback({
        kind:
          "success",

        title:
          "Branch Backup Created",

        message:
          (
            "FINORA saved " +
            result.data.fileName +
            ". Store this backup securely. It contains encrypted branch recovery authority."
          ),
      });
    }
    catch {
      setFeedback({
        kind:
          "danger",

        title:
          "Branch Backup Failed",

        message:
          "FINORA could not complete the Branch Backup request.",
      });
    }
    finally {
      setBackupPassword(
        "",
      );

      setBackupSecurityCode(
        "",
      );

      stopFinoraProcessing(
        processingId,
      );

      setBackupBusy(
        false,
      );
    }
  }

  // ==========================================================
  // PREPARE NEW DEVICE
  //
  // Explicit authenticated portability action.
  //
  // Normal trusted-device login remains Password-only.
  // Security Code is requested here only when the owner chooses
  // to prepare the authoritative branch storage for a new device.
  // ==========================================================

  async function handlePrepareNewDevice():
    Promise<void> {

    if (
      prepareDeviceBusy ||
      backupBusy
    ) {
      return;
    }

    const currentSession =
      getSession();

    const sessionId =
      String(
        currentSession?.sessionId ??
        "",
      ).trim();

    if (!sessionId) {
      setFeedback({
        kind:
          "danger",

        title:
          "Authenticated Session Required",

        message:
          "Sign in again before preparing this FINORA branch for a new device.",
      });

      return;
    }

    if (
      backupPassword.trim().length ===
        0 ||
      backupSecurityCode.trim().length ===
        0
    ) {
      setFeedback({
        kind:
          "danger",

        title:
          "New Device Authentication Required",

        message:
          "Enter your current Password and Security Code before preparing a new device.",
      });

      return;
    }

    const freshDeviceBridge =
      window.finora
        ?.freshDeviceRuntimeAuthority;

    if (
      !freshDeviceBridge ||
      typeof freshDeviceBridge.seed !==
        "function"
    ) {
      setFeedback({
        kind:
          "danger",

        title:
          "New Device Preparation Unavailable",

        message:
          "FINORA fresh-device preparation is not available in this application build.",
      });

      return;
    }

    setPrepareDeviceBusy(
      true,
    );

    setFeedback(
      null,
    );

    const processingId =
      startFinoraProcessing(
        "Preparing FINORA for a new device...",
      );

    try {
      const result =
        await freshDeviceBridge.seed({
          sessionId,

          password:
            backupPassword,

          securityCode:
            backupSecurityCode,
        });

      if (
        result.success
      ) {
        setFeedback({
          kind:
            "success",

          title:
            "New Device Ready",

          message:
            "FINORA wrote the signed fresh-device authority to this branch's authoritative storage. You can now continue secure login on a new device.",
        });

        return;
      }

      const resultRecord =
        result as unknown as Record<
          string,
          unknown
        >;

      const certificationAuthorityMissing =
        result.error ===
          "CERTIFICATION_AUTHORITY_MISSING" ||
        result.error.includes(
          "CERTIFICATION_AUTHORITY_MISSING",
        ) ||
        result.error.includes(
          "FINORA Branch Certification bootstrap custody is unavailable for this legacy branch.",
        ) ||
        resultRecord.errorCode ===
          "CERTIFICATION_AUTHORITY_MISSING";

      if (
        !certificationAuthorityMissing
      ) {
        setFeedback({
          kind:
            "danger",

          title:
            "New Device Preparation Failed",

          message:
            result.error,
        });

        return;
      }

      const controlBridge =
        window.finora
          ?.control;

      if (
        !controlBridge ||
        typeof controlBridge.prepareBranchCertificationRotation !==
          "function" ||
        typeof controlBridge.exportBranchCertificationRotationRequest !==
          "function"
      ) {
        setFeedback({
          kind:
            "danger",

          title:
            "Certification Recovery Unavailable",

          message:
            "This branch needs Branch Certification recovery, but this application build does not provide the recovery bridge.",
        });

        return;
      }

      const prepareResult =
        await controlBridge.prepareBranchCertificationRotation({
          sessionId,

          password:
            backupPassword,

          securityCode:
            backupSecurityCode,
        });

      if (
        !prepareResult.success
      ) {
        setFeedback({
          kind:
            "danger",

          title:
            "Certification Recovery Preparation Failed",

          message:
            prepareResult.error,
        });

        return;
      }

      const exportResult =
        await controlBridge.exportBranchCertificationRotationRequest();

      if (
        !exportResult.success
      ) {
        setFeedback({
          kind:
            "danger",

          title:
            "Recovery Request Export Failed",

          message:
            exportResult.error,
        });

        return;
      }

      if (
        exportResult.cancelled
      ) {
        setFeedback({
          kind:
            "info",

          title:
            "Recovery Request Not Saved",

          message:
            "No Branch Certification recovery request file was written. Run Prepare New Device again when you are ready to save the request.",
        });

        return;
      }

      setFeedback({
        kind:
          "success",

        title:
          "Recovery Request Ready",

        message:
          (
            "FINORA saved " +
            exportResult.fileName +
            ". Approve this request in Control Center, return with the signed authority file, enter your Password and Security Code again, then choose Apply Recovery Authority."
          ),
      });
    }
    catch {
      setFeedback({
        kind:
          "danger",

        title:
          "New Device Preparation Failed",

        message:
          "FINORA could not prepare this branch for a new device.",
      });
    }
    finally {
      setBackupPassword(
        "",
      );

      setBackupSecurityCode(
        "",
      );

      stopFinoraProcessing(
        processingId,
      );

      setPrepareDeviceBusy(
        false,
      );
    }
  }

  async function handleApplyBranchCertificationRecovery():
    Promise<void> {

    if (
      prepareDeviceBusy ||
      backupBusy
    ) {
      return;
    }

    const currentSession =
      getSession();

    const sessionId =
      String(
        currentSession?.sessionId ??
        "",
      ).trim();

    if (!sessionId) {
      setFeedback({
        kind:
          "danger",

        title:
          "Authenticated Session Required",

        message:
          "Sign in again before applying Branch Certification recovery.",
      });

      return;
    }

    if (
      backupPassword.trim().length ===
        0 ||
      backupSecurityCode.trim().length ===
        0
    ) {
      setFeedback({
        kind:
          "danger",

        title:
          "Recovery Authentication Required",

        message:
          "Enter your current Password and Security Code before applying the signed recovery authority.",
      });

      return;
    }

    const controlBridge =
      window.finora
        ?.control;

    const freshDeviceBridge =
      window.finora
        ?.freshDeviceRuntimeAuthority;

    if (
      !controlBridge ||
      typeof controlBridge.importApplyBranchCertificationRotationAuthority !==
        "function" ||
      !freshDeviceBridge ||
      typeof freshDeviceBridge.seed !==
        "function"
    ) {
      setFeedback({
        kind:
          "danger",

        title:
          "Certification Recovery Unavailable",

        message:
          "FINORA Branch Certification recovery is not available in this application build.",
      });

      return;
    }

    setPrepareDeviceBusy(
      true,
    );

    setFeedback(
      null,
    );

    const processingId =
      startFinoraProcessing(
        "Applying FINORA Branch Certification recovery...",
      );

    try {
      const applyResult =
        await controlBridge.importApplyBranchCertificationRotationAuthority({
          sessionId,

          password:
            backupPassword,

          securityCode:
            backupSecurityCode,
        });

      if (
        !applyResult.success
      ) {
        setFeedback({
          kind:
            "danger",

          title:
            "Certification Recovery Failed",

          message:
            applyResult.error,
        });

        return;
      }

      if (
        applyResult.cancelled
      ) {
        setFeedback({
          kind:
            "info",

          title:
            "Recovery Authority Not Selected",

          message:
            "No signed Branch Certification Rotation authority file was selected.",
        });

        return;
      }

      /*
       * Certification rotation is now durable and pending private
       * key custody has been destroyed. Re-run the original
       * fresh-device seed immediately with the same authenticated
       * factors so the owner finishes with one action.
       */
      const seedResult =
        await freshDeviceBridge.seed({
          sessionId,

          password:
            backupPassword,

          securityCode:
            backupSecurityCode,
        });

      if (
        !seedResult.success
      ) {
        setFeedback({
          kind:
            "danger",

          title:
            "Certification Recovered — New Device Preparation Failed",

          message:
            seedResult.error,
        });

        return;
      }

      setFeedback({
        kind:
          "success",

        title:
          "New Device Ready",

        message:
          "Branch Certification recovery was applied successfully and FINORA wrote the signed fresh-device authority to the authoritative branch storage. You can now continue secure login on a new device.",
      });
    }
    catch {
      setFeedback({
        kind:
          "danger",

        title:
          "Certification Recovery Failed",

        message:
          "FINORA could not apply the signed Branch Certification recovery authority.",
      });
    }
    finally {
      setBackupPassword(
        "",
      );

      setBackupSecurityCode(
        "",
      );

      stopFinoraProcessing(
        processingId,
      );

      setPrepareDeviceBusy(
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

      <section
        aria-labelledby="finora-branch-backup-title"
        style={{
          marginTop:
            "8px",

          padding:
            "20px",

          border:
            "1px solid rgba(148, 163, 184, 0.28)",

          borderRadius:
            "12px",

          background:
            "var(--finora-theme-background-surface)",
        }}
      >
        <h3
          id="finora-branch-backup-title"
          style={{
            margin:
              "0 0 8px",
          }}
        >
          Branch Backup
        </h3>

        <p
          style={{
            margin:
              "0 0 18px",

            opacity:
              0.78,

            lineHeight:
              1.5,
          }}
        >
          Create an encrypted recovery backup for this FINORA branch.
          Keep the exported .finora file in a secure location.
        </p>

        <div
          style={{
            display:
              "grid",

            gridTemplateColumns:
              "repeat(auto-fit, minmax(220px, 1fr))",

            gap:
              "12px",

            marginBottom:
              "14px",
          }}
        >
          <label>
            <span
              style={{
                display:
                  "block",

                marginBottom:
                  "6px",

                fontWeight:
                  600,
              }}
            >
              Current Password
            </span>

            <div
              style={{
                position:
                  "relative",
              }}
            >
              <input
                type={
                  showBackupPassword
                    ? "text"
                    : "password"
                }
                autoComplete="current-password"
                value={backupPassword}
                disabled={backupBusy || prepareDeviceBusy}
                onChange={(event) => {
                  setBackupPassword(
                    event.target.value,
                  );
                }}
                aria-label="Current Password for Branch Backup"
                className="finora-settings-form__input"
                style={{
                  paddingRight:
                    "42px",
                }}
              />

              <button
                type="button"
                aria-label={
                  showBackupPassword
                    ? "Hide current password"
                    : "Show current password"
                }
                disabled={backupBusy || prepareDeviceBusy}
                onClick={() => {
                  setShowBackupPassword(
                    current =>
                      !current,
                  );
                }}
                style={{
                  position:
                    "absolute",

                  top:
                    "50%",

                  right:
                    "10px",

                  transform:
                    "translateY(-50%)",

                  display:
                    "inline-flex",

                  alignItems:
                    "center",

                  justifyContent:
                    "center",

                  padding:
                    0,

                  border:
                    0,

                  background:
                    "transparent",

                  color:
                    "var(--finora-theme-input-text)",

                  cursor:
                    "pointer",
                }}
              >
                {showBackupPassword
                  ? <EyeOff size={18} />
                  : <Eye size={18} />}
              </button>
            </div>
          </label>

          <label>
            <span
              style={{
                display:
                  "block",

                marginBottom:
                  "6px",

                fontWeight:
                  600,
              }}
            >
              Security Code
            </span>

            <div
              style={{
                position:
                  "relative",
              }}
            >
              <input
                type={
                  showBackupSecurityCode
                    ? "text"
                    : "password"
                }
                autoComplete="off"
                value={backupSecurityCode}
                disabled={backupBusy || prepareDeviceBusy}
                onChange={(event) => {
                  setBackupSecurityCode(
                    event.target.value,
                  );
                }}
                aria-label="Security Code for Branch Backup"
                className="finora-settings-form__input"
                style={{
                  paddingRight:
                    "42px",
                }}
              />

              <button
                type="button"
                aria-label={
                  showBackupSecurityCode
                    ? "Hide Security Code"
                    : "Show Security Code"
                }
                disabled={backupBusy || prepareDeviceBusy}
                onClick={() => {
                  setShowBackupSecurityCode(
                    current =>
                      !current,
                  );
                }}
                style={{
                  position:
                    "absolute",

                  top:
                    "50%",

                  right:
                    "10px",

                  transform:
                    "translateY(-50%)",

                  display:
                    "inline-flex",

                  alignItems:
                    "center",

                  justifyContent:
                    "center",

                  padding:
                    0,

                  border:
                    0,

                  background:
                    "transparent",

                  color:
                    "var(--finora-theme-input-text)",

                  cursor:
                    "pointer",
                }}
              >
                {showBackupSecurityCode
                  ? <EyeOff size={18} />
                  : <Eye size={18} />}
              </button>
            </div>
          </label>
        </div>

        <p
          style={{
            margin:
              "0 0 14px",

            opacity:
              0.78,

            lineHeight:
              1.5,
          }}
        >
          Before using this branch on a new device, prepare the current
          authoritative storage once with the signed fresh-device authority.
          Older branches may first require Branch Certification recovery:
          export the recovery request, approve it in Control Center, then
          apply the signed recovery authority here.
        </p>

        <button
          type="button"
          disabled={
            prepareDeviceBusy ||
            backupBusy ||
            backupPassword.trim().length ===
              0 ||
            backupSecurityCode.trim().length ===
              0
          }
          onClick={() => {
            void handlePrepareNewDevice();
          }}
          style={{
            minHeight:
              "40px",

            padding:
              "0 16px",

            marginRight:
              "10px",

            marginBottom:
              "10px",

            border:
              0,

            borderRadius:
              "8px",

            cursor:
              (
                prepareDeviceBusy ||
                backupBusy
              )
                ? "not-allowed"
                : "pointer",

            font:
              "inherit",

            fontWeight:
              600,
          }}
        >
          {prepareDeviceBusy
            ? "Preparing New Device..."
            : "Prepare New Device"}
        </button>

        <button
          type="button"
          disabled={
            prepareDeviceBusy ||
            backupBusy ||
            backupPassword.trim().length ===
              0 ||
            backupSecurityCode.trim().length ===
              0
          }
          onClick={() => {
            void handleApplyBranchCertificationRecovery();
          }}
          style={{
            minHeight:
              "40px",

            padding:
              "0 16px",

            marginRight:
              "10px",

            marginBottom:
              "10px",

            border:
              0,

            borderRadius:
              "8px",

            cursor:
              (
                prepareDeviceBusy ||
                backupBusy
              )
                ? "not-allowed"
                : "pointer",

            font:
              "inherit",

            fontWeight:
              600,
          }}
        >
          {prepareDeviceBusy
            ? "Processing Recovery..."
            : "Apply Recovery Authority"}
        </button>

        <button
          type="button"
          disabled={
            prepareDeviceBusy ||
            backupBusy ||
            backupPassword.trim().length ===
              0 ||
            backupSecurityCode.trim().length ===
              0
          }
          onClick={() => {
            void handleBranchBackup();
          }}
          style={{
            minHeight:
              "40px",

            padding:
              "0 16px",

            border:
              0,

            borderRadius:
              "8px",

            cursor:
              backupBusy
                ? "not-allowed"
                : "pointer",

            font:
              "inherit",

            fontWeight:
              600,
          }}
        >
          {backupBusy
            ? "Creating Backup..."
            : "Create Branch Backup"}
        </button>
      </section>
    </section>
  );
}

// ============================================================
// END
// ============================================================
