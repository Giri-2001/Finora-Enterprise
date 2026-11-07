import { useEffect as usePaisaruleRestoreProgressEffect } from "react";
import GlobalLoadingOverlay from "../../../../components/common/feedback/GlobalLoadingOverlay";
import { getFinoraUsbBridge } from "../../../../storage/usbBridge";
// PAISARULE_R175_C33_NATIVE_BRIDGE
type PaisaruleRestoreSelectionResult = {
  selected?: boolean;
  fileName?: string;
};

type PaisaruleRestoreVerificationResult = {
  verified?: boolean;
  restoreWritten?: boolean;
};

function getPaisaruleOwnerRestoreErrorMessage(
  errorCode: string | null | undefined
): string {
  const code = String(errorCode ?? "").trim().toUpperCase();

  if (
    code.includes("EXISTING_BUSINESS_DATA") ||
    code.includes("DESTINATION_NOT_EMPTY")
  ) {
    return "This USB already contains business records. To keep your data safe, restoring another backup here is not allowed.";
  }

  if (
    code.includes("LOGIN_CHANGED") ||
    code.includes("SESSION") ||
    code.includes("AUTHORIZATION") ||
    code.includes("UNAUTHORIZED")
  ) {
    return "Your login could not be verified. Please sign in again before restoring your backup.";
  }

  if (
    code.includes("SCOPE") ||
    code.includes("BRANCH_MISMATCH") ||
    code.includes("OWNER_MISMATCH") ||
    code.includes("BUSINESS_MISMATCH")
  ) {
    return "This backup does not match your current business or branch. Please select the correct backup.";
  }

  if (
    code.includes("USB") ||
    code.includes("FOLDER") ||
    code.includes("DRIVE") ||
    code.includes("DEVICE_CHANGED")
  ) {
    return "Your selected USB or business folder could not be verified. Please reconnect the correct USB and try again.";
  }

  if (
    code.includes("WALLET") ||
    code.includes("MERGE") ||
    code.includes("DUPLICATE")
  ) {
    return "This backup contains records that need additional safety checks. Restore was stopped to protect your business and wallet data.";
  }

  if (
    code.includes("BACKUP") ||
    code.includes("ARCHIVE") ||
    code.includes("FILE") ||
    code.includes("CRYPTO") ||
    code.includes("DECRYPT")
  ) {
    return "We could not verify the selected backup file. Please select a valid PAISARULE business backup.";
  }

  if (
    code.includes("RECOVERY") ||
    code.includes("ROLLBACK") ||
    code.includes("INSTALL") ||
    code.includes("COMMIT") ||
    code.includes("WRITE")
  ) {
    return "Restore could not be completed safely. Keep your USB connected and contact support before trying again.";
  }

  return "We could not complete this backup operation. Your business data is protected. Please contact support if the problem continues.";
}
type PaisaruleRestoreCommitResult = {
  success?: boolean;
  restoreWritten?: boolean;
};

interface PaisaruleRestoreUsbBridge {
  requestPaisaruleRestoreBackup():
    Promise<PaisaruleRestoreSelectionResult>;

  requestPaisaruleRestoreUsb():
    Promise<PaisaruleRestoreSelectionResult>;

  verifyPaisaruleRestoreSelection():
    Promise<PaisaruleRestoreVerificationResult>;

  commitPaisaruleRestoreToNewUsb(
    input: { confirmation: "RESTORE_TO_NEW_EMPTY_USB" }
  ): Promise<PaisaruleRestoreCommitResult>;
}

const paisaruleRestoreUsbBridge =
  registerPlugin<PaisaruleRestoreUsbBridge>("FinoraUsb");
import { useContext, useEffect, useState } from "react";
import PaisaruleRestorePremiumDialog from "./PaisaruleRestorePremiumDialog";
import { Capacitor, registerPlugin } from "@capacitor/core";
import { finoraControlShared } from "../../../../services/finoraControlShared";
import { Clock3, Download, History, Info, CheckCircle2 } from "lucide-react";
import { PaisaruleSessionExpiryContext } from "../../../../components/auth/SessionGuard";

/* ===========================================================
   FINORA ENTERPRISE
   RECEPTION FOOTER
=========================================================== */

import {
  Database,
} from "lucide-react";

import {
  version as packageVersion,
} from "../../../../../../../package.json";

import {
  useResponsive,
} from "../../../../utils/responsive";

import {
  useTheme,
} from "../../../../themes/hooks";

import {
  getSession,
} from "../../../../store/authStore";

import {
  getBusinessContext,
} from "../../../../services/business/businessContextService";

import {
  createReceptionFooterStyles,
} from "./styles";


type FooterStorageMode =
  | "USB"
  | "LOCAL"
  | "—";

type StorageModeCarrier = {
  storageMode?: unknown;
};


function normalizeStorageMode(
  value: unknown,
): FooterStorageMode | undefined {

  const normalized =
    String(value ?? "")
      .trim()
      .toUpperCase();

  if (
    normalized === "USB" ||
    normalized === "LOCAL"
  ) {
    return normalized;
  }

  return undefined;
}


function resolveFooterStorageMode():
  FooterStorageMode {

  const businessContext =
    getBusinessContext() as
      | StorageModeCarrier
      | null
      | undefined;

  const session =
    getSession() as
      | StorageModeCarrier
      | null
      | undefined;

  let sessionStorageMode:
    string | null = null;

  try {
    sessionStorageMode =
      window.sessionStorage.getItem(
        "FINORA_STORAGE_MODE",
      );
  } catch {
    sessionStorageMode = null;
  }

  const candidates = [
    businessContext?.storageMode,
    session?.storageMode,
    sessionStorageMode,
  ];

  for (const candidate of candidates) {
    const storageMode =
      normalizeStorageMode(candidate);

    if (storageMode) {
      return storageMode;
    }
  }

  return "—";
}


export default function ReceptionFooter() {
  // PAISARULE_C117_R214_R2_DISPLAY_ONLY
  const [restoreDestinationLabel, setRestoreDestinationLabel] =
    useState("Not independently verified");
  // PAISARULE_C117_R270_R1_SAFETY
  const [restoreDestinationVerified, setRestoreDestinationVerified] =
    useState(false);
  const [restoreDestinationBusinessEmpty, setRestoreDestinationBusinessEmpty] =
    useState(false);
  // PAISARULE_R175_C33
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreProcessingMessage, setRestoreProcessingMessage] =
    useState<string | null>(null);

  // PAISARULE C117-R200
  // Native-completed stages only, not fabricated percentages.
  const [restoreNativeStage, setRestoreNativeStage] =
    useState<string | null>(null);

  usePaisaruleRestoreProgressEffect(() => {
    if (restoreProcessingMessage === null) {
      setRestoreNativeStage(null);
      return;
    }

    setRestoreNativeStage(null);

    type RestoreProgressEvent = {
      phase: "VERIFY" | "COMMIT";
      stage: string;
    };

    const bridge = window.finora?.paisaruleStorageBackup as
      | {
          onRestoreProgress?: (
            listener: (event: RestoreProgressEvent) => void,
          ) => (() => void);
        }
      | undefined;

    const labels: Record<string, string> = {
      FILE_SELECTED:
        "Backup file selected. Checking Owner authorization...",
      SERVER_SESSION_VERIFIED:
        "Owner session verified. Checking USB storage...",
      USB_IDENTITY_VERIFIED:
        "USB identity checked. Verifying encrypted backup...",
      BACKUP_ARCHIVE_VERIFIED:
        "Backup archive verified. Completing safety checks...",
      COMMIT_STARTED:
        "Starting protected business restore...",
      // PAISARULE C117-R208
      // Display only genuinely completed Native operations.
      DESTINATION_VERIFIED:
        "Existing business storage verified. Preparing restore...",
      STAGING_VERIFIED:
        "New storage snapshots written and verified...",
      PUBLISHED_READBACK_VERIFIED:
        "Published storage verified. Finalizing recovery safety...",
      COMMIT_COORDINATOR_SUCCEEDED:
        "Restore transaction finalized. Confirming result...",
    };

    let unsubscribe: (() => void) | undefined;

    try {
      unsubscribe = bridge?.onRestoreProgress?.(event => {
        const label = labels[event.stage];

        if (!label) return;

        const expectedPhase =
          (
          // PAISARULE C117-R223
          // All five native COMMIT stages use phase COMMIT.
          event.stage === "COMMIT_STARTED" ||
          event.stage === "DESTINATION_VERIFIED" ||
          event.stage === "STAGING_VERIFIED" ||
          event.stage === "PUBLISHED_READBACK_VERIFIED" ||
          event.stage === "COMMIT_COORDINATOR_SUCCEEDED"
        ) ? "COMMIT" : "VERIFY";

        if (event.phase !== expectedPhase) return;

        // PAISARULE C117-R209
        // A checkpoint is a completed Native operation,
        // not a percentage of bytes, records or elapsed time.
        const checkpointOrder: Record<string, number> = {
          FILE_SELECTED: 1,
          SERVER_SESSION_VERIFIED: 2,
          USB_IDENTITY_VERIFIED: 3,
          BACKUP_ARCHIVE_VERIFIED: 4,
          COMMIT_STARTED: 5,
          DESTINATION_VERIFIED: 6,
          STAGING_VERIFIED: 7,
          PUBLISHED_READBACK_VERIFIED: 8,
          COMMIT_COORDINATOR_SUCCEEDED: 9,
        };

        const checkpoint = checkpointOrder[event.stage];

        if (!checkpoint) return;

        setRestoreNativeStage(
          `${label} Safety checkpoint ${checkpoint} of 9.`,
        );
      });
    } catch {
      // Progress is optional; Restore remains independently secured.
    }

    return () => {
      try {
        unsubscribe?.();
      } catch {
        // Listener cleanup must never affect storage.
      }
    };
  }, [restoreProcessingMessage]);

  // Owner acknowledgement is required after native restore success.
  const [restoreSuccessOpen, setRestoreSuccessOpen] =
    useState(false);

  // PAISARULE_R175_C76_R2
  const [restorePopupOpen, setRestorePopupOpen] = useState(false);

  // PAISARULE_C117_R274_DIALOG_STAGE
  // Native Commit remains disabled until recovery validation.
  const windowsRestoreCommitReady = true;

  const [restoreDialogStage, setRestoreDialogStage] =
    useState<"preview" | "confirm">("preview");

  // PAISARULE_R175_C83
  // Display metadata only, never backup contents or paths.
  const [restoreFileName, setRestoreFileName] =
    useState<string | null>(null);

  const [restoreBackupDate, setRestoreBackupDate] =
    useState<string | null>(null);

  const [restoreStatus, setRestoreStatus] =
    useState<"idle" | "verified" | "failed">("idle");

  const [restoreMessage, setRestoreMessage] =
    useState<string | null>(null);

  // PAISARULE_C117_R196_R1_COUNTS
  const [restoreVerifiedCounts, setRestoreVerifiedCounts] =
    useState<{
      customers: number;
      loans: number;
      collections: number;
      goldRecords: number;
       totalStorageRecords: number;
    } | null>(null);

  // PAISARULE_R175_C84
  const [androidVerifiedSessionId, setAndroidVerifiedSessionId] =
    useState<string | null>(null);

  const isAndroidRestore =
    Capacitor.isNativePlatform() &&
    Capacitor.getPlatform() === "android";


  // PAISARULE_R175_C60_WINDOWS_VERIFY
  const isWindowsRestoreVerify =
    !Capacitor.isNativePlatform() &&
    typeof window.finora?.paisaruleStorageBackup
      ?.restoreVerify === "function";

  // PAISARULE C85-P0-S33-R1: display only; no server touch.
  const expiryEvidence = useContext(PaisaruleSessionExpiryContext);
  const [clockNow, setClockNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = window.setInterval(() => {
      setClockNow(Date.now());
    }, 1000);
    return () => window.clearInterval(interval);
  }, []);

  const activeSessionId = getSession()?.sessionId;
  const expiresAt =
    expiryEvidence &&
    expiryEvidence.sessionId === activeSessionId
      ? expiryEvidence.expiresAt
      : null;
  const expiryMs = expiresAt ? Date.parse(expiresAt) : NaN;
  const remainingMinutes = Number.isFinite(expiryMs)
    ? Math.max(0, Math.ceil((expiryMs - clockNow) / 60000))
    : null;
  const sessionLabel = remainingMinutes === null
    ? "Unverified"
    : `${remainingMinutes}m`;

  const {
    tokens,
    isMobile,
  } = useResponsive();

  const {
    theme,
  } = useTheme();

  const storageMode =
    resolveFooterStorageMode();

  // PAISARULE A92-R14:
  // Only non-sensitive backup display metadata is persisted.
  // Actual backup authorization remains inside Electron Main.
  const backupContext = getBusinessContext() as unknown as
    | Record<string, unknown>
    | null
    | undefined;

  const backupSession = getSession() as unknown as
    | Record<string, unknown>
    | null
    | undefined;

  const scopeValue = (key: string): string => {
    const value = backupContext?.[key] ?? backupSession?.[key];
    return typeof value === "string" ? value.trim() : "";
  };

  const backupOwnerId = scopeValue("ownerId");
  const backupBusinessId = scopeValue("businessId");
  const backupBranchId = scopeValue("branchId");

  const backupScopeKey =
    backupOwnerId && backupBusinessId && backupBranchId
      ? "PAISARULE_LAST_BACKUP_V1:" +
        JSON.stringify([
          backupOwnerId,
          backupBusinessId,
          backupBranchId,
        ])
      : null;

  const [lastBackupAt, setLastBackupAt] =
    useState<string | null>(null);

  const [isBackingUp, setIsBackingUp] =
    useState(false);
  // PAISARULE_C117_R185_B_STATE
  // Token and counts are transient UI metadata only.
  const [backupPreviewOpen, setBackupPreviewOpen] =
    useState(false);

  const [backupPreview, setBackupPreview] = useState<{
    token: string;
    createdAt: string;
    expiresAt: string;
    entityCounts: {
      customers: number;
      loans: number;
      collections: number;
      goldLoans: number;
      goldCustodyRecords: number;
      businessRecords: number;
      totalStorageRecords: number;
    };
  } | null>(null);

  const [backupPreviewError, setBackupPreviewError] =
    useState<string | null>(null);
  // PAISARULE_C117_R188_SUCCESS
  const [backupSaveSuccess, setBackupSaveSuccess] =
    useState<{
      fileName: string;
      bytesWritten: number;
      savedAt: string;
    } | null>(null);

  const [backupPreviewBusy, setBackupPreviewBusy] =
    useState<"prepare" | "download" | null>(null);


  useEffect(() => {
    setLastBackupAt(null);

    if (!backupScopeKey) {
      return;
    }

    try {
      const saved = window.localStorage.getItem(backupScopeKey);

      if (saved && Number.isFinite(Date.parse(saved))) {
        setLastBackupAt(saved);
      }
    } catch {
      // Display metadata is optional.
    }
  }, [backupScopeKey]);

  const lastBackupLabel = lastBackupAt
    ? new Date(lastBackupAt).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    : "Not Yet Backed Up";

    // PAISARULE_R175_C33_RESTORE_HANDLER
  // PAISARULE_R175_C84_ANDROID_VERIFY
  // No write is performed during selection or verification.
  async function handleBusinessRestore(): Promise<void> {
    if (
      isRestoring ||
      isBackingUp ||
      !isAndroidRestore ||
      storageMode !== "USB"
    ) {
      return;
    }

    const initialSessionId = getSession()?.sessionId;

    setAndroidVerifiedSessionId(null);
    setRestoreFileName(null);
    setRestoreBackupDate(null);
    setRestoreStatus("idle");
    setRestoreMessage(null);

    if (!initialSessionId) {
      setRestoreStatus("failed");
      setRestoreMessage("An active Owner session is required.");
      return;
    }

    const sessionStillCurrent = () =>
      getSession()?.sessionId === initialSessionId;

    setIsRestoring(true);

    try {
      const backup =
        await paisaruleRestoreUsbBridge
          .requestPaisaruleRestoreBackup();

      if (!sessionStillCurrent()) {
        setRestoreStatus("failed");
        setRestoreMessage("Login changed. Verification cancelled.");
        return;
      }

      if (!backup.selected) {
        // User cancelled selection.
        return;
      }

      if (
        typeof backup.fileName !== "string" ||
        !backup.fileName.toLowerCase().endsWith(".paisarule") ||
        backup.fileName.length === 0
      ) {
        setRestoreStatus("failed");
        setRestoreMessage("Backup filename is unavailable.");
        return;
      }

      // Filename display only. No content URI or path in React.
      const displayName = backup.fileName
        .replace(/[\x00-\x1f\x7f]/g, "")
        .slice(-160);

      if (!displayName) {
        setRestoreStatus("failed");
        setRestoreMessage("Backup filename is invalid.");
        return;
      }

      setRestoreFileName(displayName);
      setRestoreMessage(
        "Backup selected. Select a new empty USB for verification."
      );

      const usb =
        await paisaruleRestoreUsbBridge
          .requestPaisaruleRestoreUsb();

      if (!sessionStillCurrent()) {
        setRestoreStatus("failed");
        setRestoreMessage("Login changed. Verification cancelled.");
        return;
      }

      if (!usb.selected) {
        setRestoreMessage(
          "USB selection cancelled. No Restore was performed."
        );
        return;
      }

      const verification =
        await paisaruleRestoreUsbBridge
          .verifyPaisaruleRestoreSelection();

      if (!sessionStillCurrent()) {
        setRestoreStatus("failed");
        setRestoreMessage("Login changed. Verification cancelled.");
        return;
      }

      if (!verification.verified || verification.restoreWritten) {
        setRestoreStatus("failed");
        setRestoreMessage("Business Backup verification failed.");
        return;
      }

      setAndroidVerifiedSessionId(initialSessionId);
      setRestoreStatus("verified");
      setRestoreMessage(
        "Backup verified successfully for this Owner and Branch. " +
        "No data has been restored yet. Confirm to restore " +
        "to the selected new empty USB."
      );
    } catch {
      setRestoreStatus("failed");
      setRestoreMessage(
        "Backup verification could not be completed. " +
        "No Restore was performed."
      );
    } finally {
      setIsRestoring(false);
    }
  }

  // PAISARULE_R175_C84_ANDROID_COMMIT
  // Only an explicit second Owner action may initiate writing.
  async function handleAndroidRestoreCommit(): Promise<void> {
    if (
      isRestoring ||
      isBackingUp ||
      !isAndroidRestore ||
      !restorePopupOpen ||
      storageMode !== "USB" ||
      restoreStatus !== "verified" ||
      !androidVerifiedSessionId ||
      getSession()?.sessionId !== androidVerifiedSessionId
    ) {
      return;
    }

    const confirmed = window.confirm(
      "Restore the verified Business Backup to the " +
      "selected NEW EMPTY USB?\n\n" +
      "No data will be written to the currently active USB.\n\n" +
      "Continue?"
    );

    if (!confirmed) return;

    if (getSession()?.sessionId !== androidVerifiedSessionId) {
      setAndroidVerifiedSessionId(null);
      setRestoreStatus("failed");
      setRestoreMessage("Login changed. Restore cancelled.");
      return;
    }

    setIsRestoring(true);

    // Prevent a second click/replay from the same UI state.
    setAndroidVerifiedSessionId(null);

    try {
      const result =
        await paisaruleRestoreUsbBridge
          .commitPaisaruleRestoreToNewUsb({
            confirmation: "RESTORE_TO_NEW_EMPTY_USB"
          });

      if (getSession()?.sessionId !== androidVerifiedSessionId) {
        setRestoreStatus("failed");
        setRestoreMessage(
          "Login changed. Check the target USB before use."
        );
        return;
      }

      if (result.success && result.restoreWritten) {
        setRestorePopupOpen(false);
        window.alert(
          "Business Restore completed on the selected USB.\n\n" +
          "Reconnect and verify the restored business " +
          "before using it."
        );
      } else {
        setRestoreStatus("failed");
        setRestoreMessage(
          "Restore was not completed. Do not use a " +
          "partially restored USB."
        );
      }
    } catch {
      setRestoreStatus("failed");
      setRestoreMessage(
        "Restore failed. Do not use a partially restored USB."
      );
    } finally {
      setIsRestoring(false);
    }
  }
  // PAISARULE_R175_C60_WINDOWS_HANDLER
  // Verification only. No USB Restore commit.
  // PAISARULE_R175_C83_WINDOWS_VERIFY_POPUP
  // File picking + verification remains inside Electron Main.
  // This function NEVER commits or writes USB business data.
  async function handleWindowsRestoreVerify(): Promise<void> {
    if (
      isRestoring ||
      isBackingUp ||
      !isWindowsRestoreVerify ||
      storageMode !== "USB"
    ) {
      return;
    }

    const initialSessionId = getSession()?.sessionId;
    setRestoreDestinationLabel("Not independently verified");

    setRestoreVerifiedCounts(null);
    setRestoreFileName(null);
    setRestoreBackupDate(null);
    setRestoreStatus("idle");
    setRestoreMessage(null);

    if (!initialSessionId) {
      setRestoreStatus("failed");
      setRestoreMessage("An active Owner session is required.");
      return;
    }

    setRestoreProcessingMessage("Selecting and verifying your backup...");setIsRestoring(true);

    try {
      const bridge = window.finora?.paisaruleStorageBackup;

      if (!bridge?.restoreVerify) {
        setRestoreStatus("failed");
        setRestoreMessage("Backup verification is temporarily unavailable. Please reopen PAISARULE and try again.");
        return;
      }

      const result = await bridge.restoreVerify();

      // Restore preview only; never authorizes USB writes.
      if (result.success && result.verified) {
        try {
          const usbBridge = getFinoraUsbBridge();

          // getStatus is optional in the USB bridge contract.
          const usbStatus = await usbBridge?.getStatus?.();
          const selectedPath = usbStatus?.storagePath?.trim() ?? "";

          if (
            usbStatus?.availability === "READY" &&
            selectedPath &&
            !/^[A-Za-z]:[\\/]?$/.test(selectedPath) &&
            getSession()?.sessionId === initialSessionId
          ) {
            setRestoreDestinationLabel(selectedPath);
          }
        } catch {
    setRestoreDialogStage("preview");
    setRestoreDestinationVerified(false);
    setRestoreDestinationBusinessEmpty(false);
    setRestoreDestinationLabel("Not independently verified");
        }
      }

      if (getSession()?.sessionId !== initialSessionId) {
        setRestoreStatus("failed");
        setRestoreMessage(
          "Login changed. Backup verification was cancelled."
        );
        return;
      }

      if (result.success && result.cancelled) {
        // No selected file, no claimed verification.
        return;
      }

      if (result.success && result.verified) {
        // The runtime IPC result is authoritative. The
        // renderer's older window.finora declaration does
        // not yet include the new aggregate metadata.
        // Check all values before displaying anything.
        const counts = (
          result as typeof result & {
            entityCounts?: {
              customers: number;
              loans: number;
              collections: number;
              goldLoans: number;
              goldCustodyRecords: number;
              businessRecords: number;
              totalStorageRecords: number;
            };
          }
        ).entityCounts;

        const validCount = (value: unknown): value is number =>
          typeof value === "number" &&
          Number.isSafeInteger(value) &&
          value >= 0;

        if (
          !counts ||
          !validCount(counts.customers) ||
          !validCount(counts.loans) ||
          !validCount(counts.collections) ||
          !validCount(counts.goldLoans) ||
          !validCount(counts.goldCustodyRecords) ||
          !validCount(counts.businessRecords) ||
          !validCount(counts.totalStorageRecords) ||
          counts.businessRecords !==
            counts.customers + counts.loans +
            counts.collections ||
          counts.totalStorageRecords < counts.businessRecords ||
          counts.goldLoans > counts.loans ||
          !Number.isSafeInteger(
            counts.goldLoans + counts.goldCustodyRecords
          )
        ) {
          setRestoreVerifiedCounts(null);
          setRestoreStatus("failed");
          setRestoreMessage(
            "Verified backup record counts are invalid. " +
            "Restore remains disabled."
          );
          return;
        }

        setRestoreVerifiedCounts({
          customers: counts.customers,
          loans: counts.loans,
          collections: counts.collections,
          goldRecords: counts.goldLoans + counts.goldCustodyRecords,
          totalStorageRecords: counts.totalStorageRecords,
        });

        // Authenticated Electron Main receipt only.
        // Preview safety does not authorize a disk commit.
        const nativeDestinationSafe =
          "destinationSafetyVerified" in result &&
          result.destinationSafetyVerified === true &&
          "destinationWalletPreserved" in result &&
          result.destinationWalletPreserved === true;

        const nativeBusinessEmpty =
          "destinationBusinessEmpty" in result &&
          result.destinationBusinessEmpty === true;

        setRestoreDestinationVerified(nativeDestinationSafe);
        setRestoreDestinationBusinessEmpty(
          nativeDestinationSafe && nativeBusinessEmpty
        );

        setRestoreDestinationLabel(previous => {
          if (!nativeDestinationSafe || !nativeBusinessEmpty) {
            return "Destination safety not verified";
          }

          // Preserve the live USB storage path obtained from
          // getFinoraUsbBridge().getStatus(). Do not hardcode
          // the drive letter or Owner branch folder.
          const candidate = previous.trim();

          if (
            !/^[A-Za-z]:[\\/]/.test(candidate) ||
            /^[A-Za-z]:[\\/]?$/.test(candidate)
          ) {
            return "Destination path not independently verified";
          }

          return candidate;
        });

        setRestoreFileName(result.fileName);
        setRestoreBackupDate(result.createdAt);
        setRestoreStatus("verified");
        setRestoreMessage(
          "Backup verified successfully for this Owner and Branch. " +
          "No data has been restored. Windows USB Restore is not yet enabled."
        );
        return;
      }

      setRestoreStatus("failed");
      setRestoreMessage(
        getPaisaruleOwnerRestoreErrorMessage(result.errorCode)
      );
    } catch {
      setRestoreStatus("failed");
      setRestoreMessage(
        "Backup verification could not be completed. " +
        "No USB data was changed."
      );
    } finally {
      setIsRestoring(false);
      setRestoreProcessingMessage(null);
    }
  }
  // PAISARULE_C117_R185_B_HANDLERS
  // Windows only. Electron Main owns all authorization,
  // USB verification, encryption and filesystem writes.
  async function handleWindowsBackupPreview(): Promise<void> {
    if (
      isBackingUp ||
      isRestoring ||
      backupPreviewBusy ||
      storageMode !== "USB" ||
      Capacitor.isNativePlatform()
    ) {
      return;
    }

    const bridge = window.finora?.paisaruleStorageBackup as
      | {
          prepareBackup?: () => Promise<{
            success: boolean;
            data?: {
              token: string;
              createdAt: string;
              expiresAt: string;
              entityCounts: {
                customers: number;
                loans: number;
                collections: number;
                goldLoans: number;
                goldCustodyRecords: number;
                businessRecords: number;
                totalStorageRecords: number;
              };
            } | null;
            errorCode?: string | null;
          }>;
        }
      | undefined;

    setBackupPreview(null);
    setBackupPreviewError(null);
    setBackupPreviewOpen(true);

    const sessionId = getSession()?.sessionId;
    const scopeKey = backupScopeKey;

    if (!sessionId || !bridge?.prepareBackup) {
      setBackupPreviewError(
        "Backup preparation is unavailable. Check Owner login."
      );
      return;
    }

    setIsBackingUp(true);
    setBackupPreviewBusy("prepare");

    try {
      const result = await bridge.prepareBackup();

      if (
        getSession()?.sessionId !== sessionId ||
        backupScopeKey !== scopeKey
      ) {
        setBackupPreviewError(
          "Owner session changed. Prepare a new backup."
        );
        return;
      }

      if (
        !result.success ||
        !result.data ||
        !/^[a-f0-9]{48}$/.test(result.data.token) ||
        !Number.isFinite(Date.parse(result.data.expiresAt))
      ) {
        setBackupPreviewError(
          "Backup preparation failed [" +
          (result.errorCode || "INVALID_PREVIEW") +
          "]. No backup file was saved."
        );
        return;
      }

      setBackupPreview(result.data);
    } catch {
      setBackupPreviewError(
        "Unable to prepare encrypted backup. No file was saved."
      );
    } finally {
      setBackupPreviewBusy(null);
      setIsBackingUp(false);
    }
  }

  async function handleWindowsPreparedDownload(): Promise<void> {
    if (
      !backupPreview ||
      !backupPreviewOpen ||
      backupPreviewBusy ||
      isBackingUp ||
      isRestoring ||
      storageMode !== "USB" ||
      Capacitor.isNativePlatform()
    ) {
      return;
    }

    if (Date.now() >= Date.parse(backupPreview.expiresAt)) {
      setBackupPreview(null);
      setBackupPreviewError(
        "Backup preview expired. Prepare a new backup."
      );
      return;
    }

    const bridge = window.finora?.paisaruleStorageBackup as
      | {
          downloadPreparedBackup?: (
            token: string
          ) => Promise<{
            success: boolean;
            cancelled: boolean;
            data?: {
              fileName: string;
              bytesWritten: number;
              createdAt: string;
            } | null;
            errorCode?: string | null;
          }>;
        }
      | undefined;

    const sessionId = getSession()?.sessionId;
    const scopeKey = backupScopeKey;
    const token = backupPreview.token;

    if (!sessionId || !bridge?.downloadPreparedBackup) {
      setBackupPreview(null);
      setBackupPreviewError("Secure Download is unavailable.");
      return;
    }

    setBackupPreviewBusy("download");
    setIsBackingUp(true);
    setBackupPreviewError(null);

    try {
      const result =
        await bridge.downloadPreparedBackup(token);

      // Token is single-use even if the dialog was cancelled.
      setBackupPreview(null);

      if (
        getSession()?.sessionId !== sessionId ||
        backupScopeKey !== scopeKey
      ) {
        setBackupPreviewError(
          "Owner session changed. Verify the saved file separately."
        );
        return;
      }

      if (result.success && result.cancelled) {
        setBackupPreviewError(
          "Download cancelled. Prepare a new backup to retry."
        );
        return;
      }

      if (result.success && result.data) {
        const completedAt = new Date().toISOString();

        setLastBackupAt(completedAt);

        if (scopeKey) {
          try {
            window.localStorage.setItem(
              scopeKey,
              completedAt
            );
          } catch {
            // Display-only timestamp storage is optional.
          }
        }

        setBackupPreviewOpen(false);

        // PAISARULE_C117_R188_SUCCESS
        // Premium in-app confirmation, not a native alert.
        setBackupSaveSuccess({
          fileName: result.data.fileName,
          bytesWritten: result.data.bytesWritten,
          savedAt: completedAt,
        });
        return;
      }

      setBackupPreviewError(
        "Backup Download failed [" +
        (result.errorCode || "UNKNOWN") +
        "]. Prepare a new backup."
      );
    } catch {
      setBackupPreview(null);
      setBackupPreviewError(
        "Secure Download failed. Prepare a new backup."
      );
    } finally {
      setBackupPreviewBusy(null);
      setIsBackingUp(false);
    }
  }
async function handleBusinessBackup(): Promise<void> {
    if (isBackingUp || storageMode !== "USB") {
      return;
    }

    // PAISARULE_C117_R185_B_WINDOWS_ROUTE
    // Android continues using its existing native Backup flow.
    if (!Capacitor.isNativePlatform()) {
      await handleWindowsBackupPreview();
      return;
    }

    // PAISARULE R172-B15-R4
    // Android uses native Backup V1; Windows uses existing Electron.
    const isAndroid =
      Capacitor.isNativePlatform() &&
      Capacitor.getPlatform() === "android";

    type BackupExportResult = {
      success: boolean;
      cancelled?: boolean;
      data?: {
        fileName?: string;
        bytesWritten?: number;
        createdAt?: string;
      } | null;
      error?: string | null;
      errorCode?: string | null;
    };

    const androidBackupBridge = finoraControlShared as unknown as {
      exportPaisaruleBusinessBackup?: () =>
        Promise<BackupExportResult>;
    };

    const windowsBackupBridge =
      window.finora?.paisaruleStorageBackup;

    const exportBackup:
      (() => Promise<BackupExportResult>) | null =
      isAndroid
        ? typeof androidBackupBridge.exportPaisaruleBusinessBackup === "function"
          ? () => androidBackupBridge.exportPaisaruleBusinessBackup!()
          : null
        : typeof windowsBackupBridge?.exportBackup === "function"
          ? () => windowsBackupBridge.exportBackup()
          : null;

    if (!exportBackup) {
      window.alert("Business Backup is unavailable.");
      return;
    }

    const initialSessionId = getSession()?.sessionId;
    const initialScopeKey = backupScopeKey;

    setIsBackingUp(true);

    try {
      const result = await exportBackup();

      if (result.success && !result.cancelled && result.data) {
        const currentContext = getBusinessContext() as unknown as
          | Record<string, unknown>
          | null
          | undefined;

        const currentSession = getSession() as unknown as
          | Record<string, unknown>
          | null
          | undefined;

        const currentValue = (key: string): string => {
          const value = currentContext?.[key] ?? currentSession?.[key];
          return typeof value === "string" ? value.trim() : "";
        };

        const currentOwnerId = currentValue("ownerId");
        const currentBusinessId = currentValue("businessId");
        const currentBranchId = currentValue("branchId");

        const currentScopeKey =
          currentOwnerId && currentBusinessId && currentBranchId
            ? "PAISARULE_LAST_BACKUP_V1:" +
              JSON.stringify([
                currentOwnerId,
                currentBusinessId,
                currentBranchId,
              ])
            : null;

        if (
          getSession()?.sessionId !== initialSessionId ||
          currentScopeKey !== initialScopeKey
        ) {
          return;
        }

        // Time is recorded only after the backup file was saved.
        const completedAt = new Date().toISOString();

        setLastBackupAt(completedAt);

        if (initialScopeKey) {
          try {
            window.localStorage.setItem(
              initialScopeKey,
              completedAt,
            );
          } catch {
            // File export succeeded; UI history persistence failed.
          }
        }

        return;
      }

      if (!result.cancelled) {
        window.alert(
          result.error ?? "Business Backup failed.",
        );
      }
    } catch {
      window.alert("Business Backup could not be completed.");
    } finally {
      setIsBackingUp(false);
    }
  }
  const appVersion =
    String(
      packageVersion ?? "",
    ).trim() || "—";

  const {
    containerStyle,
    contentStyle,
    storageBadgeStyle,
    versionBadgeStyle,
    metadataLabelStyle,
    metadataDividerStyle,
    metadataValueStyle,
  } =
    createReceptionFooterStyles(
      tokens,
      theme,
      isMobile,
    );

  return (
    <footer style={containerStyle}>
      {/* PAISARULE_C117_R186_FOOTER_GRID */}
      <style>{`
        /*
         * Mobile: existing full-width single column unchanged.
         * Tablet: 3 columns, 2 rows.
         * Laptop/Desktop: 6 content-sized items in one row.
         */
        @media (min-width: 640px) and (max-width: 1023px) {
          .paisarule-r186-footer-grid {
            display: grid !important;
            grid-template-columns:
              repeat(3, minmax(0, 1fr)) !important;
            gap: 8px !important;
            align-items: stretch !important;
          }

          .paisarule-r186-footer-grid > * {
            box-sizing: border-box !important;
            width: 100% !important;
            min-width: 0 !important;
            max-width: 100% !important;
            justify-self: stretch !important;
            padding: 7px 8px !important;
          }
        }

        @media (min-width: 1024px) {
          .paisarule-r186-footer-grid {
            display: grid !important;
            grid-template-columns:
              repeat(6, max-content) !important;
            justify-content: space-between !important;
            align-items: stretch !important;
            column-gap: 7px !important;
            row-gap: 0 !important;
          }

          .paisarule-r186-footer-grid > * {
            box-sizing: border-box !important;
            width: max-content !important;
            min-width: 0 !important;
            max-width: 100% !important;
            justify-self: center !important;
            padding: 6px 8px !important;
            gap: 4px !important;
          }
        }
      `}</style>


      <div className="paisarule-r186-footer-grid" style={contentStyle}>



        <div
          style={{ ...storageBadgeStyle, width: "100%", minWidth: 0, justifySelf: "stretch" }}
          aria-label={`Storage mode ${storageMode}`}
        >
          <Database
            aria-hidden="true"
            size={14}
            strokeWidth={2}
          />

          <span style={metadataLabelStyle}>
            Storage Mode
          </span>

          <span style={metadataDividerStyle}>
            •
          </span>

          <span style={metadataValueStyle}>
            {storageMode}
          </span>
        </div>

        <div
          style={{ ...storageBadgeStyle, width: "100%", minWidth: 0, justifySelf: "stretch" }}
          aria-label={`Business session ${sessionLabel}`}
        >
          <Clock3
            aria-hidden="true"
            size={14}
            strokeWidth={2}
          />
          <span style={metadataLabelStyle}>
            Session
          </span>
          <span style={metadataDividerStyle}>
            •
          </span>
          <span style={metadataValueStyle}>
            {sessionLabel}
          </span>
        </div>

        <button
          type="button"
          style={{
            ...storageBadgeStyle,
            width: "100%",
            minWidth: 0,
            justifySelf: "stretch",
            cursor: isBackingUp ? "wait" : "pointer",
            opacity: storageMode === "USB" ? 1 : 0.5,
            fontWeight: 700,
          }}
          disabled={isBackingUp || storageMode !== "USB"}
          onClick={() => { void handleBusinessBackup(); }}
          aria-label="Save encrypted Business Backup"
        >
          <Download aria-hidden="true" size={14} strokeWidth={2} />
          <span>{isBackingUp ? "Saving..." : "Backup"}</span>
        </button>
                {/* PAISARULE_R175_C60_WINDOWS_BUTTON */}
        {isWindowsRestoreVerify && (
          <button
            type="button"
            style={{
              ...storageBadgeStyle,
              width: "100%",
              minWidth: 0,
              justifySelf: "stretch",
              cursor: isRestoring ? "wait" : "pointer",
              opacity: storageMode === "USB" ? 1 : 0.5,
              fontWeight: 700,
            }}
            disabled={
              isRestoring ||
              isBackingUp ||
              storageMode !== "USB"
            }
            onClick={() => {
              setRestoreFileName(null);
              setRestoreBackupDate(null);
              setRestoreStatus("idle");
              setRestoreMessage(null);
              setAndroidVerifiedSessionId(null);
              setRestorePopupOpen(true);
            }}
            aria-label="Verify encrypted Business Backup for Restore"
            title="Verify backup only — USB Restore is not yet enabled"
          >
            <History aria-hidden="true" size={14} strokeWidth={2} />
            <span>
              {isRestoring ? "Verifying..." : "Restore"}
            </span>
          </button>
        )}
{isAndroidRestore && (
          <button
            type="button"
            style={{
              ...storageBadgeStyle,
              width: "100%",
              minWidth: 0,
              justifySelf: "stretch",
              cursor: isRestoring ? "wait" : "pointer",
              opacity: storageMode === "USB" ? 1 : 0.5,
              fontWeight: 700,
            }}
            disabled={
              isRestoring ||
              isBackingUp ||
              storageMode !== "USB"
            }
            onClick={() => {
              setRestoreFileName(null);
              setRestoreBackupDate(null);
              setRestoreStatus("idle");
              setRestoreMessage(null);
              setAndroidVerifiedSessionId(null);
              setRestorePopupOpen(true);
            }}
            aria-label="Restore encrypted Business Backup to new USB"
          >
            <History aria-hidden="true" size={14} strokeWidth={2} />
            <span>{isRestoring ? "Restoring..." : "Restore"}</span>
          </button>
        )}

        <div
          style={{
            ...storageBadgeStyle,
            width: "100%",
            minWidth: 0,
            justifySelf: "stretch",
            flexWrap: "wrap",
            rowGap: "2px",
            padding: "6px 4px",
          }}
          aria-label={`Last Backup ${lastBackupLabel}`}
          title={lastBackupLabel}
        >
          <History aria-hidden="true" size={14} strokeWidth={2} />
          <span style={metadataLabelStyle}>Last Backup</span>
          <span
            style={{
              ...metadataValueStyle,
              minWidth: 0,
              whiteSpace: "normal",
              overflowWrap: "anywhere",
              textAlign: "center",
              lineHeight: 1.3,
              fontSize: "11px",
            }}
          >
            {lastBackupLabel}
          </span>
        </div>
        <div
          style={{ ...versionBadgeStyle, width: "100%", minWidth: 0, justifySelf: "stretch" }}
          aria-label={`Installed version ${appVersion}`}
        >
          <Info aria-hidden="true" size={14} strokeWidth={2} />
          <span style={metadataLabelStyle}>
            Version
          </span>

          <span style={metadataValueStyle}>
            {appVersion}
          </span>
        </div>

      </div>

      {/* PAISARULE_C117_R188_SUCCESS */}
      {backupSaveSuccess && (
        <div
          role="presentation"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10020,
            background: "rgba(5,9,18,0.78)",
            backdropFilter: "blur(10px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="paisarule-backup-success-title"
            style={{
              width: "100%",
              maxWidth: 445,
              boxSizing: "border-box",
              borderRadius: 22,
              padding: "28px 25px",
              background:
                "linear-gradient(150deg,#202b3c,#111a29)",
              color: "#ffffff",
              border: "1px solid rgba(230,196,119,0.45)",
              boxShadow: "0 28px 85px rgba(0,0,0,0.55)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: 76,
                height: 76,
                margin: "0 auto 16px",
                borderRadius: "50%",
                background: "rgba(39,190,111,0.13)",
                border: "1px solid rgba(68,225,133,0.48)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CheckCircle2
                size={47}
                strokeWidth={1.8}
                color="#49de90"
                aria-hidden="true"
              />
            </div>

            <div
              style={{
                color: "#e9c879",
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: 1.4,
                marginBottom: 8,
              }}
            >
              PAISARULE SECURE BACKUP
            </div>

            <h2
              id="paisarule-backup-success-title"
              style={{
                fontSize: 23,
                fontWeight: 800,
                margin: "0 0 9px",
              }}
            >
              Backup Saved Successfully
            </h2>

            <p
              style={{
                color: "#bcd3c5",
                fontSize: 13,
                lineHeight: 1.65,
                margin: "0 0 20px",
              }}
            >
              Your encrypted business backup has been saved
              to the selected location.
            </p>

            <div
              style={{
                padding: 15,
                borderRadius: 13,
                background: "rgba(255,255,255,0.055)",
                border: "1px solid rgba(255,255,255,0.12)",
                textAlign: "left",
                fontSize: 13,
                lineHeight: 1.65,
                overflowWrap: "anywhere",
              }}
            >
              <div style={{ color: "#abb9cc", fontSize: 11 }}>
                BACKUP FILE
              </div>
              <div style={{ fontWeight: 750, marginBottom: 10 }}>
                {backupSaveSuccess.fileName}
              </div>

              <div style={{ color: "#abb9cc", fontSize: 11 }}>
                FILE SIZE
              </div>
              <div style={{ fontWeight: 750, marginBottom: 10 }}>
                {(
                  backupSaveSuccess.bytesWritten /
                  (1024 * 1024)
                ).toFixed(2)} MB
              </div>

              <div style={{ color: "#abb9cc", fontSize: 11 }}>
                SAVED AT
              </div>
              <div style={{ fontWeight: 750 }}>
                {new Date(
                  backupSaveSuccess.savedAt
                ).toLocaleString("en-IN")}
              </div>
            </div>

            <div
              style={{
                color: "#65dfa2",
                margin: "15px 0 21px",
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              Original USB data was not modified.
            </div>

            <button
              type="button"
              autoFocus
              onClick={() => setBackupSaveSuccess(null)}
              style={{
                width: "100%",
                padding: "13px 16px",
                borderRadius: 11,
                border: "none",
                background: "#eac77b",
                color: "#142033",
                fontWeight: 850,
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              Done
            </button>
          </div>
        </div>
      )}
      {/* PAISARULE_C117_R185_B_PREMIUM_PREVIEW */}
      {backupPreviewOpen && !Capacitor.isNativePlatform() && (
        <div
          role="presentation"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10010,
            background: "rgba(5,8,18,0.82)",
            backdropFilter: "blur(9px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="paisarule-backup-preview-title"
            style={{
              width: "100%",
              maxWidth: 540,
              maxHeight: "90vh",
              overflowY: "auto",
              boxSizing: "border-box",
              borderRadius: 22,
              padding: 24,
              color: "#fff",
              background:
                "linear-gradient(145deg,#20283b,#101725)",
              border: "1px solid rgba(227,189,103,0.5)",
              boxShadow: "0 28px 90px rgba(0,0,0,0.65)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 8,
              }}
            >
              <Database
                size={25}
                color="#efd08d"
                aria-hidden="true"
              />
              <div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: 1.5,
                    color: "#e5bd72",
                  }}
                >
                  PAISARULE SECURE BACKUP
                </div>
                <h2
                  id="paisarule-backup-preview-title"
                  style={{
                    margin: "4px 0 0",
                    fontSize: 23,
                    fontWeight: 800,
                  }}
                >
                  Business Backup Preview
                </h2>
              </div>
            </div>

            <p
              style={{
                fontSize: 13,
                lineHeight: 1.7,
                color: "#bac5d5",
                margin: "12px 0 20px",
              }}
            >
              Review the records included in your encrypted
              backup. The original USB data is read-only.
            </p>

            {backupPreviewBusy === "prepare" && (
              <div
                role="status"
                style={{
                  padding: 18,
                  borderRadius: 12,
                  background: "rgba(255,255,255,0.06)",
                  textAlign: "center",
                }}
              >
                Preparing secure encrypted snapshot...
              </div>
            )}

            {backupPreview && (() => {
              const counts = backupPreview.entityCounts;
              const rows: Array<[string, number]> = [
                ["Customers", counts.customers],
                ["Loans", counts.loans],
                ["Collections", counts.collections],
                ["Gold Loans", counts.goldLoans],
                ["Gold Custody", counts.goldCustodyRecords],
                ["Business Records", counts.businessRecords],
                ["Total Storage Records", counts.totalStorageRecords],
              ];

              return (
                <>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(2,minmax(0,1fr))",
                      gap: 10,
                    }}
                  >
                    {rows.map(([label, value], index) => (
                      <div
                        key={label}
                        style={{
                          gridColumn:
                            index === rows.length - 1
                              ? "1 / -1"
                              : undefined,
                          padding: "13px 14px",
                          borderRadius: 13,
                          background:
                            index === rows.length - 1
                              ? "rgba(229,189,114,0.12)"
                              : "rgba(255,255,255,0.055)",
                          border:
                            "1px solid rgba(229,189,114,0.18)",
                        }}
                      >
                        <div
                          style={{
                            fontSize: 12,
                            color: "#b8c2d0",
                            marginBottom: 6,
                          }}
                        >
                          {label}
                        </div>
                        <strong
                          style={{
                            fontSize: 24,
                            color: "#f1d395",
                          }}
                        >
                          {value.toLocaleString("en-IN")}
                        </strong>
                      </div>
                    ))}
                  </div>

                  <div
                    style={{
                      marginTop: 14,
                      fontSize: 12,
                      color: "#c4cedb",
                      lineHeight: 1.8,
                    }}
                  >
                    Created: {new Date(
                      backupPreview.createdAt
                    ).toLocaleString("en-IN")}
                    <div>
                      Preview valid for up to 5 minutes.
                    </div>
                    <div>
                      Remaining: {Math.max(
                        0,
                        Math.ceil(
                          (
                            Date.parse(
                              backupPreview.expiresAt
                            ) - clockNow
                          ) / 60000
                        )
                      )} min
                    </div>
                  </div>
                </>
              );
            })()}

            {backupPreviewError && (
              <div
                role="alert"
                style={{
                  marginTop: 15,
                  padding: 13,
                  borderRadius: 11,
                  fontSize: 13,
                  lineHeight: 1.6,
                  color: "#ffd3d3",
                  border: "1px solid rgba(255,128,128,0.4)",
                  background: "rgba(160,45,45,0.16)",
                }}
              >
                {backupPreviewError}
              </div>
            )}

            <div
              style={{
                marginTop: 22,
                display: "grid",
                gridTemplateColumns: "1fr 1.4fr",
                gap: 10,
              }}
            >
              <button
                type="button"
                disabled={backupPreviewBusy !== null}
                onClick={() => {
                  setBackupPreview(null);
                  setBackupPreviewError(null);
                  setBackupPreviewOpen(false);
                }}
                style={{
                  padding: "13px 10px",
                  borderRadius: 11,
                  background: "transparent",
                  color: "#fff",
                  border:
                    "1px solid rgba(255,255,255,0.28)",
                  cursor: backupPreviewBusy
                    ? "wait"
                    : "pointer",
                  fontWeight: 750,
                }}
              >
                Close
              </button>
              <button
                type="button"
                disabled={
                  !backupPreview ||
                  backupPreviewBusy !== null ||
                  Date.now() >=
                    Date.parse(backupPreview.expiresAt)
                }
                onClick={() => {
                  void handleWindowsPreparedDownload();
                }}
                style={{
                  padding: "13px 10px",
                  borderRadius: 11,
                  background: "#ebc879",
                  color: "#181d28",
                  border: "none",
                  cursor:
                    backupPreviewBusy ? "wait" : "pointer",
                  fontWeight: 850,
                  opacity:
                    backupPreview &&
                    !backupPreviewBusy &&
                    clockNow <
                      Date.parse(backupPreview.expiresAt)
                      ? 1
                      : 0.5,
                }}
              >
                {backupPreviewBusy === "download"
                  ? "Saving..."
                  : "Download Backup File"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* PAISARULE_R175_C76_R2_SHARED_POPUP */}
      {Boolean(restorePopupOpen && restoreStatus !== "verified") && (
        <div
          role="presentation"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 4800,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            background: "rgba(0,0,0,0.72)",
          }}
          onClick={() => {
            if (!isRestoring) {
              setRestorePopupOpen(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="paisarule-restore-title"
            onClick={(event) => event.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 440,
              maxHeight: "90vh",
              overflowY: "auto",
              overflowX: "hidden",
              overflowWrap: "anywhere",
              boxSizing: "border-box",
              borderRadius: 18,
              border: "1px solid rgba(180,150,75,0.45)",
              background: "#171b27",
              color: "#ffffff",
              padding: 22,
              boxShadow: "0 24px 80px rgba(0,0,0,0.48)",
            }}
          >
            <h2
              id="paisarule-restore-title"
              style={{
                margin: "0 0 12px",
                fontSize: 20,
                fontWeight: 750,
                color: "#f0d58a",
              }}
            >
              Restore Business Backup
            </h2>

            <p
              style={{
                fontSize: 13,
                lineHeight: 1.7,
                opacity: 0.9,
                margin: "0 0 16px",
              }}
            >
              Select your encrypted .paisarule backup file.
              Your current Owner session will be used for
              verification. No additional login is required.
            </p>

            <div
              style={{
                padding: 15,
                border: "1px dashed rgba(240,213,138,0.55)",
                borderRadius: 12,
                textAlign: "center",
                marginBottom: 16,
                fontSize: 13,
              }}
            >
              Backup file: {restoreFileName || "Not selected"}

              <div
                style={{
                  marginTop: 7,
                  opacity: 0.7,
                  fontSize: 12,
                }}
              >
                {restoreStatus === "verified"
                  ? "Verified encrypted backup"
                  : "Select a file using the secure native picker."}
              </div>
            </div>

            <p
              style={{
                margin: "0 0 18px",
                fontSize: 12,
                lineHeight: 1.6,
                opacity: 0.8,
              }}
            >
              {isWindowsRestoreVerify
                ? "Restore requires verified backup, Owner session and branch safety."
                : "Android requires a NEW EMPTY USB for Restore."}
            </p>

            {restoreStatus !== "idle" && (
              <div
                role="status"
                aria-live="polite"
                style={{
                  borderRadius: 12,
                  padding: 12,
                  marginBottom: 16,
                  border: restoreStatus === "verified"
                    ? "1px solid rgba(90,210,145,0.55)"
                    : "1px solid rgba(255,130,130,0.55)",
                  background: restoreStatus === "verified"
                    ? "rgba(30,120,70,0.16)"
                    : "rgba(150,40,40,0.16)",
                  lineHeight: 1.6,
                  fontSize: 12,
                }}
              >
                <strong>
                  {restoreStatus === "verified"
                    ? "Backup Verified Successfully"
                    : "Backup Verification Failed"}
                </strong>

                {restoreBackupDate && (
                  <div>
                    Backup Date: {restoreBackupDate}
                  </div>
                )}

                <div>{restoreMessage}</div>
              </div>
            )}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
              }}
            >
              <button
                type="button"
                disabled={isRestoring}
                onClick={() => {
                  setAndroidVerifiedSessionId(null);
                  setRestorePopupOpen(false);
                }}
                style={{
                  borderRadius: 10,
                  padding: "12px 10px",
                  border: "1px solid rgba(255,255,255,0.25)",
                  background: "transparent",
                  color: "#ffffff",
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={
                  isRestoring ||
                  isBackingUp ||
                  storageMode !== "USB"
                }
                onClick={() => {
                  if (isAndroidRestore) {
                    if (restoreStatus === "verified") {
                      void handleAndroidRestoreCommit();
                    } else {
                      void handleBusinessRestore();
                    }
                  } else if (isWindowsRestoreVerify) {
                    // Windows remains verification-only.
                    void handleWindowsRestoreVerify();
                  }
                }}
                style={{
                  borderRadius: 10,
                  padding: "12px 10px",
                  border: "none",
                  background: "#e9c875",
                  color: "#171b27",
                  cursor: "pointer",
                  fontWeight: 800,
                }}
              >
                {isAndroidRestore && restoreStatus === "verified"
                  ? "Restore to New USB"
                  : "Select & Verify"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* PAISARULE_C117_R116_PREVIEW */}
      <PaisaruleRestorePremiumDialog
        open={restorePopupOpen && restoreStatus === "verified"}
        stage={restoreDialogStage}
        counts={restoreVerifiedCounts ?? undefined}
        countsVerified={
          restoreStatus === "verified" &&
          restoreVerifiedCounts !== null &&
          isWindowsRestoreVerify
        }
        backupVerified={restoreStatus === "verified"}
        authorizationVerified={
          isWindowsRestoreVerify &&
          restoreStatus === "verified" &&
          restoreVerifiedCounts !== null
        }
        targetVerified={restoreDestinationVerified}
        targetEmpty={restoreDestinationBusinessEmpty}
        commitReady={windowsRestoreCommitReady}
        sourceLabel={restoreFileName || "Verified encrypted backup"}
        destinationLabel={restoreDestinationLabel}
        onClose={() => {
          setRestoreDialogStage("preview");
          setAndroidVerifiedSessionId(null);
          setRestorePopupOpen(false);
        }}
        onContinue={() => {
          if (
            !windowsRestoreCommitReady ||
            restoreStatus !== "verified" ||
            !restoreVerifiedCounts ||
            !restoreDestinationVerified ||
            !restoreDestinationBusinessEmpty ||
            isRestoring
          ) {
            return;
          }

          setRestoreDialogStage("confirm");
        }}
        onBack={() => {
          setRestoreDialogStage("preview");
        }}
        onRestore={() => {
          void (async () => {
            if (
              !windowsRestoreCommitReady ||
              !isWindowsRestoreVerify ||
              !restorePopupOpen ||
              restoreStatus !== "verified" ||
              !restoreVerifiedCounts ||
              !restoreDestinationVerified ||
              !restoreDestinationBusinessEmpty ||
              storageMode !== "USB" ||
              isRestoring ||
              isBackingUp
            ) {
              return;
            }

            const initialSessionId = getSession()?.sessionId;
            const bridge = window.finora?.paisaruleStorageBackup;

            if (!initialSessionId || !bridge?.restoreCommit) {
              setRestoreStatus("failed");
              setRestoreMessage("Restore authorization unavailable.");
              return;
            }

            setRestoreProcessingMessage("Restoring verified business backup...");setIsRestoring(true);

            try {
              const result = await bridge.restoreCommit();

              if (getSession()?.sessionId !== initialSessionId) {
                setRestoreStatus("failed");
                setRestoreMessage(
                  "Login changed. Verify storage before using it."
                );
                return;
              }

              if (result.success && result.committed) {
                setRestorePopupOpen(false);
                setRestoreDialogStage("preview");
                setRestoreMessage(
                  "Restore completed. Reopen and verify business records."
                );
                setRestoreStatus("idle");
                setRestoreSuccessOpen(true);
              } else {
                setRestoreStatus("failed");
                const nativeErrorCode = (
                  result as typeof result & { errorCode?: string }
                ).errorCode;

                const safeErrorCode =
                  typeof nativeErrorCode === "string" &&
                  /^[A-Z0-9_]{1,120}$/.test(nativeErrorCode)
                    ? nativeErrorCode
                    : "UNKNOWN_NATIVE_RESTORE_ERROR";

                console.error(
                  "[PAISARULE RESTORE COMMIT]",
                  safeErrorCode
                );

                setRestoreMessage(
                  getPaisaruleOwnerRestoreErrorMessage(safeErrorCode)
                );
              }
            } catch {
              setRestoreStatus("failed");
              setRestoreMessage(
                "Restore failed. Storage requires verification."
              );
            } finally {
              setIsRestoring(false);
              setRestoreProcessingMessage(null);
            }
          })();
        }}
      />
      {restoreSuccessOpen && restoreProcessingMessage === null && (
        <div
          role="presentation"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 5000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            background: "rgba(3, 8, 20, 0.78)",
            boxSizing: "border-box",
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="paisarule-restore-success-title"
            style={{
              width: "100%",
              maxWidth: 440,
              maxHeight: "90vh",
              overflowY: "auto",
              overflowX: "hidden",
              boxSizing: "border-box",
              padding: 28,
              borderRadius: 20,
              border: "1px solid rgba(219, 176, 81, 0.55)",
              background: "linear-gradient(160deg, #18253b, #0d1527)",
              color: "#ffffff",
              boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                color: "#e8c56f",
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: 2,
                marginBottom: 16,
              }}
            >
              PAISARULE · SECURE RECOVERY
            </div>
            <div
              aria-hidden="true"
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                border: "2px solid #3bbf88",
                color: "#3bbf88",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 34,
                margin: "0 auto 18px",
              }}
            >
              ✓
            </div>
            <h2
              id="paisarule-restore-success-title"
              style={{
                fontSize: 23,
                margin: "0 0 12px",
                color: "#f0d58a",
              }}
            >
              Restore Successful
            </h2>
            <p
              style={{
                fontSize: 14,
                lineHeight: 1.7,
                color: "#e3e9f4",
                margin: "0 0 12px",
              }}
            >
              Your verified business backup was restored successfully.
            </p>
            <p
              style={{
                fontSize: 12,
                lineHeight: 1.7,
                color: "#b9c6db",
                margin: "0 0 24px",
              }}
            >
              The native restore operation has completed.
              Please review your business records.
            </p>
            <button
              type="button"
              autoFocus
              onClick={() => {
                setRestoreSuccessOpen(false);
              }}
              style={{
                width: "100%",
                minHeight: 48,
                borderRadius: 12,
                border: "none",
                background: "#e7c774",
                color: "#111827",
                fontSize: 15,
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              OK · Continue to Reception
            </button>
          </div>
        </div>
      )}

          {restoreProcessingMessage !== null && (
        <GlobalLoadingOverlay
          message={restoreNativeStage ?? restoreProcessingMessage}
        />
      )}
    </footer>
  );
}
