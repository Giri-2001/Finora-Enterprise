import { generateFinoraHumanId } from "./finoraHumanReadableId";

import {
  useEffect, useRef, useState } from "react";

import type { FinoraControlCenterBranchRegistryRecord } from "../../../../electron/control-center/finoraControlCenterBranchRegistry.types";

import type {
  FinoraControlCenterBranchCertificationRotationExportView,
  FinoraControlCenterBranchCertificationRotationOpenView,
  FinoraControlCenterEnrollmentOpenView,
  FinoraControlCenterWalletRechargeRequestOpenView,
} from "../../../../electron/control-center/finoraControlCenterPreload";

import type {
  FinoraBranchActivationFormDraft,
  FinoraBranchAccessFormDraft,
  FinoraBranchDeviceRevocationFormDraft,
  FinoraBusinessProfileFormDraft,
  FinoraControlCenterIssuanceWorkflow,
  FinoraControlCenterTargetDraft,
  FinoraPricingPolicyFormDraft,
  FinoraStorageEntitlementFormDraft,
  FinoraWalletRechargeFormDraft,
} from "./FinoraControlCenterIssuanceForm.types";

import FinoraControlCenterBranchActivationForm from "./FinoraControlCenterBranchActivationForm";
import FinoraControlCenterBranchAccessForm from "./FinoraControlCenterBranchAccessForm";
import FinoraControlCenterDeviceRevocationForm from "./FinoraControlCenterDeviceRevocationForm";
import FinoraControlCenterStorageEntitlementForm from "./FinoraControlCenterStorageEntitlementForm";
import FinoraControlCenterBusinessProfileForm from "./FinoraControlCenterBusinessProfileForm";
import { FinoraControlCenterPricingPolicyForm } from "./FinoraControlCenterPricingPolicyForm";
import { FinoraControlCenterWalletRechargeForm } from "./FinoraControlCenterWalletRechargeForm";

import {
  buildFinoraBranchActivationIssuanceRequest,
  buildFinoraBranchAccessIssuanceRequest,
  buildFinoraBranchDeviceRevocationIssuanceRequest,
  buildFinoraBusinessProfileIssuanceRequest,
  buildFinoraPricingPolicyIssuanceRequest,
  buildFinoraStorageEntitlementIssuanceRequest,
  buildFinoraWalletRechargeIssuanceRequest,
} from "./FinoraControlCenterIssuancePayloadBuilder";

import {
  buildFinoraControlBundleIssuanceRequest,
} from "./FinoraControlBundleDraftBuilder";

/* ===========================================================
   FINORA ENTERPRISE OS

   CONTROL CENTER
   ISSUANCE WORKSPACE FOUNDATION

   RESPONSIBILITY:

   - Select one supported issuance workflow
   - Own one shared signed-package target draft
   - Avoid duplicate Owner / Business / Branch target entry
   - Keep installation-binding identity in one target object

   NOT RESPONSIBLE FOR:

   - Signing
   - Private-key access
   - Package envelope authority
   - Main-process issuance calls
=========================================================== */

const WORKFLOWS: readonly {
  id: FinoraControlCenterIssuanceWorkflow;

  label: string;

  description: string;
}[] = [
  {
    id: "BRANCH_ACTIVATION",

    label: "Branch Activation",

    description:
      "Issue or manage signed Branch Activation state.",
  },
  {
    id: "BRANCH_ACCESS",

    label: "Owner Access & Subscription",

    description:
      "Create or renew branch owner access and subscription validity.",
  },
  {
    id: "DEVICE_REVOCATION",

    label: "Device Revocation",

    description:
      "Issue a signed terminal revocation for one exact branch user and native device binding.",
  },
  {
    id: "STORAGE_ENTITLEMENT",

    label: "USB Storage Access",

    description: "Authorize the FINORA USB storage mode for the selected branch.",
  },
  {
    id: "BUSINESS_PROFILE",

    label: "Business Profile",

    description:
      "Create and maintain the owner business identity for this FINORA branch.",
  },
  {
    id: "PRICING_POLICY",

    label: "Processing Fee Update",

    description: "Issue a branch-specific processing fee update without changing the APK.",
  },
  {
    id: "WALLET_RECHARGE",

    label: "Wallet Recharge",

    description:
      "Approve and issue the existing FINORA wallet recharge workflow.",
  },
];

const EMPTY_TARGET: FinoraControlCenterTargetDraft = {
  ownerId: "",

  businessId: "",

  branchId: "",

  installationId: "",

  bindingKeyId: "",

  fingerprintAlgorithm: "SHA-256",

  publicKeyFingerprint: "",
};

/* ============================================================
   FIELD
============================================================ */

interface TargetFieldProps {
  label: string;

  value: string;

  placeholder: string;

  onChange: (value: string) => void;

  readOnly?: boolean;
}

function TargetField({
  label,
  value,
  placeholder,
  onChange,
  readOnly = false,
}: TargetFieldProps) {
  return (
    <label
      style={{
        display: "grid",
        gap: "7px",
      }}
    >
      <span
        style={{
          fontSize: "12px",
          fontWeight: 650,
          letterSpacing: "0.02em",
          color: "#cbd5e1",
        }}
      >
        {label}
      </span>

      <input
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck={false}
        readOnly={readOnly}
        onChange={(event) => {
          onChange(event.target.value);
        }}
        style={{
          width: "100%",
          boxSizing: "border-box",
          minHeight: "42px",
          border: "1px solid rgba(148, 163, 184, 0.28)",
          borderRadius: "9px",
          padding: "9px 11px",
          fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
          fontSize: "13px",
          background: "rgba(15, 23, 42, 0.82)",
          color: "#e2e8f0",
          outline: "none",
        }}
      />
    </label>
  );
}

/* ============================================================
   WORKSPACE
============================================================ */

interface FinoraControlCenterIssuanceWorkspaceProps {
  selectedBranch?:
    FinoraControlCenterBranchRegistryRecord;
  workflow:
    FinoraControlCenterIssuanceWorkflow;
  workspaceFocusRequestId:
    number;

  branchAccessInitialAction?:
    "ISSUE" | "RENEW";
  newBranchProvisioning?:
    boolean;
  onWorkflowChange:
    (
      workflow:
        FinoraControlCenterIssuanceWorkflow,
    ) => void;
  onClearSelectedBranch:
    () => void;
}

function formatWalletRechargeAmount(
  amountMinor: number,
): string {
  return new Intl.NumberFormat(
    "en-IN",
    {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    },
  ).format(
    amountMinor / 100,
  );
}

export default function FinoraControlCenterIssuanceWorkspace({
  selectedBranch,
  workflow,
  workspaceFocusRequestId,
  branchAccessInitialAction = "ISSUE",
  newBranchProvisioning = false,
  onWorkflowChange,
  onClearSelectedBranch,
}: FinoraControlCenterIssuanceWorkspaceProps) {
  const workspaceRef =
    useRef<HTMLElement | null>(
      null,
    );

  const handledWorkspaceFocusRequestRef =
    useRef(0);

  const [target, setTarget] =
    useState<FinoraControlCenterTargetDraft>(EMPTY_TARGET);

  const [provisioningOwnerName, setProvisioningOwnerName] =
    useState("");

  const [provisioningBusinessName, setProvisioningBusinessName] =
    useState("");

  const [provisioningBranchName, setProvisioningBranchName] =
    useState("");

  const [provisioningDraftGenerated, setProvisioningDraftGenerated] =
    useState(false);

  const [provisioningUserId, setProvisioningUserId] =
    useState("");

  const [provisioningUsername, setProvisioningUsername] =
    useState("");


  const [provisioningMobile, setProvisioningMobile] =
    useState("");

  const [provisioningAadhaar, setProvisioningAadhaar] =
    useState("");

  const [provisioningAadhaarConsent, setProvisioningAadhaarConsent] =
    useState(false);

  const [provisioningValidFrom, setProvisioningValidFrom] =
    useState("");

  const [provisioningValidUntil, setProvisioningValidUntil] =
    useState("");

  const [provisioningOpeningWalletBalance, setProvisioningOpeningWalletBalance] =
    useState("0");

  const [serverProvisioningState, setServerProvisioningState] =
    useState<"IDLE" | "CREATING" | "SUCCESS" | "ERROR">("IDLE");

  const [serverProvisioningError, setServerProvisioningError] =
    useState<string | undefined>();

  const [serverProvisioningResult, setServerProvisioningResult] =
    useState<
      import("../../../electron/control-center/finoraControlCenterPreload").FinoraServerProvisionOwnerView | undefined
    >();

  const [serverAdminCredentialConfigured, setServerAdminCredentialConfigured] =
    useState<boolean | undefined>();

  const [serverAdminCredentialInput, setServerAdminCredentialInput] =
    useState("");

  const [serverAdminCredentialState, setServerAdminCredentialState] =
    useState<"IDLE" | "SAVING" | "SUCCESS" | "ERROR">("IDLE");

  const [serverAdminCredentialError, setServerAdminCredentialError] =
    useState<string | undefined>();



  useEffect(
    () => {
      if (
        workspaceFocusRequestId <= 0 ||
        handledWorkspaceFocusRequestRef.current ===
          workspaceFocusRequestId
      ) {
        return;
      }

      handledWorkspaceFocusRequestRef.current =
        workspaceFocusRequestId;

      workspaceRef.current?.scrollIntoView({
        behavior:
          "smooth",
        block:
          "start",
      });
    },
    [
      workspaceFocusRequestId,
    ],
  );


  // FINORA_SERVER_ADMIN_CREDENTIAL_STATUS_V1
  useEffect(
    () => {
      if (!newBranchProvisioning) {
        return;
      }

      const bridge =
        window.finoraControlCenter;

      if (!bridge) {
        setServerAdminCredentialConfigured(false);
        return;
      }

      let cancelled = false;

      // FINORA_SERVER_ADMIN_STATUS_LIVE_VERIFY_V1
      void (async () => {
        try {
          const status =
            await bridge.hasServerAdminCredential();

          if (cancelled) {
            return;
          }

          if (!status.success) {
            setServerAdminCredentialConfigured(false);
            setServerAdminCredentialState("ERROR");
            setServerAdminCredentialError(status.error);
            return;
          }

          if (!status.data) {
            setServerAdminCredentialConfigured(false);
            setServerAdminCredentialState("IDLE");
            setServerAdminCredentialError(undefined);
            return;
          }

          const verification =
            await bridge.verifyServerAdminCredential();

          if (cancelled) {
            return;
          }

          if (!verification.success) {
            setServerAdminCredentialConfigured(false);
            setServerAdminCredentialState("ERROR");
            setServerAdminCredentialError(
              verification.error,
            );
            return;
          }

          setServerAdminCredentialConfigured(true);
          setServerAdminCredentialState("SUCCESS");
          setServerAdminCredentialError(undefined);
        } catch (error) {
          if (cancelled) {
            return;
          }

          setServerAdminCredentialConfigured(false);
          setServerAdminCredentialState("ERROR");
          setServerAdminCredentialError(
            error instanceof Error
              ? error.message
              : "Unable to verify FINORA Server access.",
          );
        }
      })();
      return () => {
        cancelled = true;
      };
    },
    [newBranchProvisioning],
  );

  const [walletRechargeRequestOpenState, setWalletRechargeRequestOpenState] =
    useState<
      "IDLE" | "OPENING" | "SUCCESS" | "ERROR"
    >(
      "IDLE",
    );

  const [walletRechargeRequestOpenError, setWalletRechargeRequestOpenError] =
    useState<string | undefined>();

  const [verifiedWalletRechargeRequest, setVerifiedWalletRechargeRequest] =
    useState<
      | Extract<
          FinoraControlCenterWalletRechargeRequestOpenView,
          { cancelled: false }
        >
      | undefined
    >();

  const walletRechargeRequestOpenInFlightRef =
    useRef(false);

  const [enrollmentOpenState, setEnrollmentOpenState] =
    useState<
      "IDLE" | "OPENING" | "SUCCESS" | "ERROR"
    >(
      "IDLE",
    );

  const [enrollmentOpenError, setEnrollmentOpenError] =
    useState<string | undefined>();

  const [verifiedEnrollment, setVerifiedEnrollment] =
    useState<
      FinoraControlCenterEnrollmentOpenView | undefined
    >();

  const enrollmentOpenInFlightRef =
    useRef(false);

  const [enrollmentOwnerId, setEnrollmentOwnerId] =
    useState<string>(
      "",
    );

  const [enrollmentBusinessId, setEnrollmentBusinessId] =
    useState<string>(
      "",
    );

  const [enrollmentBranchId, setEnrollmentBranchId] =
    useState<string>(
      "",
    );

  const [enrollmentBusinessCode, setEnrollmentBusinessCode] =
    useState<string>(
      "",
    );

  const [enrollmentBranchCode, setEnrollmentBranchCode] =
    useState<string>(
      "",
    );

  const [enrollmentResponseState, setEnrollmentResponseState] =
    useState<
      "IDLE" | "EXPORTING" | "SUCCESS" | "ERROR"
    >(
      "IDLE",
    );

  const [enrollmentResponseError, setEnrollmentResponseError] =
    useState<string | undefined>();

  const [enrollmentResponseResult, setEnrollmentResponseResult] =
    useState<
      | {
          fileName: string;

          bytesWritten: number;

          responseId: string;

          requestId: string;

          installationId: string;
        }
      | undefined
    >();

  const enrollmentResponseInFlightRef =
    useRef(false);

  const [rotationOpenState, setRotationOpenState] =
    useState<
      "IDLE" | "OPENING" | "SUCCESS" | "ERROR"
    >(
      "IDLE",
    );

  const [rotationOpenError, setRotationOpenError] =
    useState<string | undefined>();

  const [verifiedRotation, setVerifiedRotation] =
    useState<
      FinoraControlCenterBranchCertificationRotationOpenView | undefined
    >();

  const rotationOpenInFlightRef =
    useRef(
      false,
    );

  const [rotationExportState, setRotationExportState] =
    useState<
      "IDLE" | "EXPORTING" | "SUCCESS" | "ERROR"
    >(
      "IDLE",
    );

  const [rotationExportError, setRotationExportError] =
    useState<string | undefined>();

  const [rotationExportResult, setRotationExportResult] =
    useState<
      FinoraControlCenterBranchCertificationRotationExportView | undefined
    >();

  const rotationExportInFlightRef =
    useRef(
      false,
    );
  const [branchIssuanceState, setBranchIssuanceState] = useState<
    "IDLE" | "ISSUING" | "SUCCESS" | "ERROR"
  >("IDLE");

  const [branchIssuanceError, setBranchIssuanceError] = useState<
    string | undefined
  >();

  const [branchSignedPackage, setBranchSignedPackage] = useState<
    Record<string, unknown> | undefined
  >();

  const branchIssuanceInFlightRef = useRef(false);

  const [branchAccessIssuanceState, setBranchAccessIssuanceState] =
    useState<"IDLE" | "ISSUING" | "SUCCESS" | "ERROR">("IDLE");

  const [branchAccessIssuanceError, setBranchAccessIssuanceError] =
    useState<string | undefined>();

  const [branchAccessSignedPackage, setBranchAccessSignedPackage] =
    useState<Record<string, unknown> | undefined>();

  const branchAccessIssuanceInFlightRef =
    useRef(false);

  const [deviceRevocationIssuanceState, setDeviceRevocationIssuanceState] =
    useState<"IDLE" | "ISSUING" | "SUCCESS" | "ERROR">("IDLE");

  const [deviceRevocationIssuanceError, setDeviceRevocationIssuanceError] =
    useState<string | undefined>();

  const [deviceRevocationSignedPackage, setDeviceRevocationSignedPackage] =
    useState<Record<string, unknown> | undefined>();

  const deviceRevocationIssuanceInFlightRef =
    useRef(false);

  const [storageIssuanceState, setStorageIssuanceState] = useState<
    "IDLE" | "ISSUING" | "SUCCESS" | "ERROR"
  >("IDLE");

  const [storageIssuanceError, setStorageIssuanceError] = useState<
    string | undefined
  >();

  const [storageSignedPackage, setStorageSignedPackage] = useState<
    Record<string, unknown> | undefined
  >();

  const storageIssuanceInFlightRef = useRef(false);

  const [businessProfileIssuanceState, setBusinessProfileIssuanceState] =
    useState<"IDLE" | "ISSUING" | "SUCCESS" | "ERROR">("IDLE");

  const [businessProfileIssuanceError, setBusinessProfileIssuanceError] =
    useState<string | undefined>();

  const [businessProfileSignedPackage, setBusinessProfileSignedPackage] =
    useState<Record<string, unknown> | undefined>();

  const businessProfileIssuanceInFlightRef = useRef(false);

  const [pricingPolicyIssuanceState, setPricingPolicyIssuanceState] = useState<
    "IDLE" | "ISSUING" | "SUCCESS" | "ERROR"
  >("IDLE");

  const [pricingPolicyIssuanceError, setPricingPolicyIssuanceError] = useState<
    string | undefined
  >();

  const [pricingPolicySignedPackage, setPricingPolicySignedPackage] = useState<
    Record<string, unknown> | undefined
  >();

  const pricingPolicyIssuanceInFlightRef = useRef(false);

  const [walletRechargeIssuanceState, setWalletRechargeIssuanceState] =
    useState<"IDLE" | "ISSUING" | "SUCCESS" | "ERROR">("IDLE");

  const [walletRechargeIssuanceError, setWalletRechargeIssuanceError] =
    useState<string | undefined>();

  const [walletRechargeSignedPackage, setWalletRechargeSignedPackage] =
    useState<Record<string, unknown> | undefined>();

  const walletRechargeIssuanceInFlightRef = useRef(false);

  const [bundleExportState, setBundleExportState] = useState<
    "IDLE" | "EXPORTING" | "SUCCESS" | "ERROR"
  >("IDLE");

  const [bundleExportError, setBundleExportError] = useState<
    string | undefined
  >();

  const [bundleExportResult, setBundleExportResult] = useState<
    | {
        fileName: string;

        bytesWritten: number;
      }
    | undefined
  >();

  const packagePersistenceKey =
    selectedBranch?.identity.installation.installationId
      ? `finora:control-center:issued-packages:${selectedBranch.identity.installation.installationId}`
      : undefined;

  const [
    packagePersistenceReadyKey,
    setPackagePersistenceReadyKey,
  ] = useState<string | undefined>();
  const bundleExportInFlightRef = useRef(false);
  function resetNormalIssuanceArtifacts(): void {
    setBranchSignedPackage(undefined);
    setBranchIssuanceState("IDLE");
    setBranchIssuanceError(undefined);

    setBranchAccessSignedPackage(undefined);
    setBranchAccessIssuanceState("IDLE");
    setBranchAccessIssuanceError(undefined);

    setDeviceRevocationSignedPackage(undefined);
    setDeviceRevocationIssuanceState("IDLE");
    setDeviceRevocationIssuanceError(undefined);

    setStorageSignedPackage(undefined);
    setStorageIssuanceState("IDLE");
    setStorageIssuanceError(undefined);

    setBusinessProfileSignedPackage(undefined);
    setBusinessProfileIssuanceState("IDLE");
    setBusinessProfileIssuanceError(undefined);

    setPricingPolicySignedPackage(undefined);
    setPricingPolicyIssuanceState("IDLE");
    setPricingPolicyIssuanceError(undefined);

    setWalletRechargeSignedPackage(undefined);
    setWalletRechargeIssuanceState("IDLE");
    setWalletRechargeIssuanceError(undefined);

    setBundleExportResult(undefined);
    setBundleExportState("IDLE");
    setBundleExportError(undefined);
  }

  useEffect(
    () => {
      if (!selectedBranch) {
        return;
      }

      const identity =
        selectedBranch.identity;

      setTarget({
        ownerId:
          identity.ownerId,

        businessId:
          identity.businessId,

        branchId:
          identity.branchId,

        installationId:
          identity.installation.installationId,

        bindingKeyId:
          identity.installation.bindingKeyId,

        fingerprintAlgorithm:
          identity.installation.fingerprintAlgorithm,

        publicKeyFingerprint:
          identity.installation.publicKeyFingerprint,
      });

      if (newBranchProvisioning) {
        /*
         * ===== FINORA GENERIC PROVISIONING RESUME =====
         *
         * Immutable branch scope comes only from Registry.
         * Non-secret provisioning metadata is restored from
         * the encrypted main-process resume store.
         *
         * Password and Security Code are never persisted.
         */
        const fallbackBusinessName =
          selectedBranch.profile?.businessName ?? "";

        const fallbackBranchName =
          selectedBranch.profile?.branchName ?? "";

        setProvisioningOwnerName("");
        setProvisioningBusinessName(
          fallbackBusinessName,
        );
        setProvisioningBranchName(
          fallbackBranchName,
        );
        setProvisioningUserId("");
        setProvisioningUsername("");

        const bridge =
          window.finoraControlCenter;

        if (bridge) {
          void bridge
            .getProvisioningResume({
              ownerId:
                identity.ownerId,
              businessId:
                identity.businessId,
              branchId:
                identity.branchId,
            })
            .then((result) => {
              if (
                !result.success ||
                !result.data
              ) {
                return;
              }

              const resume =
                result.data;

              if (
                resume.ownerId !== identity.ownerId ||
                resume.businessId !== identity.businessId ||
                resume.branchId !== identity.branchId
              ) {
                return;
              }

              setProvisioningOwnerName(
                resume.ownerName,
              );
              setProvisioningBusinessName(
                resume.businessName,
              );
              setProvisioningBranchName(
                resume.branchName,
              );
              setProvisioningUserId(
                resume.userId,
              );
              setProvisioningUsername(
                resume.username,
              );
            })
            .catch(() => {
              /*
               * Optional non-secret resume metadata failure
               * must not mutate Registry identity.
               */
            });
        }

        setProvisioningDraftGenerated(true);
      }

      /*
       * A registry-selected branch becomes the complete
       * immutable identity source for normal signed issuance.
       *
       * Signed artifacts belonging to any previous target must
       * not survive a target switch.
       */
      resetNormalIssuanceArtifacts();
    },
    [
      selectedBranch?.identity.ownerId,
      selectedBranch?.identity.businessId,
      selectedBranch?.identity.branchId,
      selectedBranch?.identity.installation.installationId,
      selectedBranch?.identity.installation.bindingKeyId,
      selectedBranch?.identity.installation.fingerprintAlgorithm,
      selectedBranch?.identity.installation.publicKeyFingerprint,
    ],
  );

  /*
   * ===== FINORA PACKAGE PERSISTENCE =====
   *
   * Signed packages belong to the exact installation target.
   * Keep them across Control Center reloads so a partial
   * seven-package issuance workflow is not lost.
   *
   * No credential secrets are persisted here.
   */

  useEffect(() => {
    if (!packagePersistenceKey) {
      setPackagePersistenceReadyKey(undefined);
      return;
    }

    setPackagePersistenceReadyKey(undefined);

    try {
      const raw =
        window.localStorage.getItem(
          packagePersistenceKey,
        );

      if (raw) {
        const stored =
          JSON.parse(raw) as Record<string, unknown>;

        setBranchSignedPackage(
          stored.branchSignedPackage as typeof branchSignedPackage,
        );

        setBranchAccessSignedPackage(
          stored.branchAccessSignedPackage as typeof branchAccessSignedPackage,
        );

        setDeviceRevocationSignedPackage(
          stored.deviceRevocationSignedPackage as typeof deviceRevocationSignedPackage,
        );

        setStorageSignedPackage(
          stored.storageSignedPackage as typeof storageSignedPackage,
        );

        setBusinessProfileSignedPackage(
          stored.businessProfileSignedPackage as typeof businessProfileSignedPackage,
        );

        setPricingPolicySignedPackage(
          stored.pricingPolicySignedPackage as typeof pricingPolicySignedPackage,
        );

        setWalletRechargeSignedPackage(
          stored.walletRechargeSignedPackage as typeof walletRechargeSignedPackage,
        );
      }
    } catch {
      window.localStorage.removeItem(
        packagePersistenceKey,
      );
    }

    setPackagePersistenceReadyKey(
      packagePersistenceKey,
    );
  }, [packagePersistenceKey]);

  useEffect(() => {
    if (
      !packagePersistenceKey ||
      packagePersistenceReadyKey !==
        packagePersistenceKey
    ) {
      return;
    }

    try {
      window.localStorage.setItem(
        packagePersistenceKey,
        JSON.stringify({
          branchSignedPackage,
          branchAccessSignedPackage,
          deviceRevocationSignedPackage,
          storageSignedPackage,
          businessProfileSignedPackage,
          pricingPolicySignedPackage,
          walletRechargeSignedPackage,
        }),
      );
    } catch {
      // Keep the signed-package workflow usable even if
      // browser storage is unavailable.
    }
  }, [
    packagePersistenceKey,
    packagePersistenceReadyKey,
    branchSignedPackage,
    branchAccessSignedPackage,
    deviceRevocationSignedPackage,
    storageSignedPackage,
    businessProfileSignedPackage,
    pricingPolicySignedPackage,
    walletRechargeSignedPackage,
  ]);
  async function openVerifiedEnrollmentRequest():
    Promise<void> {

    if (enrollmentOpenInFlightRef.current) {
      return;
    }

    enrollmentOpenInFlightRef.current =
      true;

    setEnrollmentOpenState(
      "OPENING",
    );

    setEnrollmentOpenError(
      undefined,
    );

    try {
      const bridge =
        window.finoraControlCenter;

      if (!bridge) {
        throw new Error(
          "Dedicated FINORA Control Center preload bridge is unavailable.",
        );
      }

      const result =
        await bridge.openInstallationEnrollmentRequest();

      if (!result.success) {
        throw new Error(
          result.error ??
            "Unable to open the FINORA Installation Enrollment Request.",
        );
      }

      const enrollment =
        result.data;

      if (enrollment.cancelled) {
        setEnrollmentOpenState(
          "IDLE",
        );

        return;
      }

      setVerifiedEnrollment(
        enrollment,
      );

      if (
        newBranchProvisioning &&
        provisioningDraftGenerated
      ) {
        setEnrollmentOwnerId(
          target.ownerId,
        );

        setEnrollmentBusinessId(
          target.businessId,
        );

        setEnrollmentBranchId(
          target.branchId,
        );

        const compactBranchMatch =
          /^BRANCH-([A-Z0-9]{3})-(\d{3})$/.exec(
            target.branchId,
          );

        if (compactBranchMatch) {
          const compactBusinessCode =
            compactBranchMatch[1];

          const compactBranchNumber =
            Number(
              compactBranchMatch[2],
            );

          setEnrollmentBusinessCode(
            compactBusinessCode,
          );

          setEnrollmentBranchCode(
            `${compactBusinessCode}-${String(
              compactBranchNumber,
            ).padStart(2, "0")}`,
          );
        }

        setEnrollmentBusinessCode(
          target.businessId,
        );

        setEnrollmentBranchCode(
          target.branchId,
        );
      }
      else {
        setEnrollmentOwnerId(
          "",
        );

        setEnrollmentBusinessId(
          "",
        );

        setEnrollmentBranchId(
          "",
        );

        setEnrollmentBusinessCode(
          "",
        );

        setEnrollmentBranchCode(
          "",
        );
      }

      setEnrollmentResponseResult(
        undefined,
      );

      setEnrollmentResponseError(
        undefined,
      );

      setEnrollmentResponseState(
        "IDLE",
      );

setEnrollmentOpenState(
        "SUCCESS",
      );

    } catch (error) {
      setVerifiedEnrollment(
        undefined,
      );

      setEnrollmentOpenError(
        error instanceof Error
          ? error.message
          : "Unable to open the FINORA Installation Enrollment Request.",
      );

      setEnrollmentOpenState(
        "ERROR",
      );

    } finally {
      enrollmentOpenInFlightRef.current =
        false;
    }
  }

  async function issueAndExportEnrollmentResponse():
    Promise<void> {

    if (enrollmentResponseInFlightRef.current) {
      return;
    }

    if (
      !verifiedEnrollment ||
      verifiedEnrollment.cancelled
    ) {
      setEnrollmentResponseError(
        "Open and verify an Installation Enrollment Request first.",
      );

      setEnrollmentResponseState(
        "ERROR",
      );

      return;
    }

    enrollmentResponseInFlightRef.current =
      true;

    setEnrollmentResponseState(
      "EXPORTING",
    );

    setEnrollmentResponseError(
      undefined,
    );

    setEnrollmentResponseResult(
      undefined,
    );

    try {
      const bridge =
        window.finoraControlCenter;

      if (!bridge) {
        throw new Error(
          "Dedicated FINORA Control Center preload bridge is unavailable.",
        );
      }

      const result =
        await bridge.issueAndExportInstallationEnrollmentResponse({
          ownerId:
            enrollmentOwnerId,

          businessId:
            enrollmentBusinessId,

          branchId:
            enrollmentBranchId,

          businessCode:
            enrollmentBusinessCode,

          branchCode:
            enrollmentBranchCode,
        });

      if (!result.success) {
        throw new Error(
          result.error ??
            "FINORA Installation Enrollment Response issuance failed.",
        );
      }

      if (result.data.cancelled) {
        setEnrollmentResponseState(
          "IDLE",
        );

        return;
      }

      setEnrollmentResponseResult({
        fileName:
          result.data.fileName,

        bytesWritten:
          result.data.bytesWritten,

        responseId:
          result.data.responseId,

        requestId:
          result.data.requestId,

        installationId:
          result.data.installationId,
      });

      setEnrollmentResponseState(
        "SUCCESS",
      );

    } catch (error) {
      setEnrollmentResponseError(
        error instanceof Error
          ? error.message
          : "Unable to issue and export the FINORA Installation Enrollment Response.",
      );

      setEnrollmentResponseState(
        "ERROR",
      );

    } finally {
      enrollmentResponseInFlightRef.current =
        false;
    }
  }

  async function openVerifiedBranchCertificationRotationRequest():
    Promise<void> {

    if (
      rotationOpenInFlightRef.current ||
      rotationExportInFlightRef.current
    ) {
      return;
    }

    rotationOpenInFlightRef.current =
      true;

    setRotationOpenState(
      "OPENING",
    );

    setRotationOpenError(
      undefined,
    );

    try {
      const bridge =
        window.finoraControlCenter;

      if (!bridge) {
        throw new Error(
          "Dedicated FINORA Control Center preload bridge is unavailable.",
        );
      }

      const result =
        await bridge.openBranchCertificationRotationRequest();

      if (!result.success) {
        throw new Error(
          result.error ??
            "Unable to open the FINORA Branch Certification Rotation Request.",
        );
      }

      const rotation =
        result.data;

      if (
        rotation.cancelled
      ) {
        setRotationOpenState(
          "IDLE",
        );

        return;
      }

      setVerifiedRotation(
        rotation,
      );

      setRotationExportResult(
        undefined,
      );

      setRotationExportError(
        undefined,
      );

      setRotationExportState(
        "IDLE",
      );

      setRotationOpenState(
        "SUCCESS",
      );
    }
    catch (
      error
    ) {
      setVerifiedRotation(
        undefined,
      );

      setRotationOpenError(
        error instanceof Error
          ? error.message
          : "Unable to open the FINORA Branch Certification Rotation Request.",
      );

      setRotationOpenState(
        "ERROR",
      );
    }
    finally {
      rotationOpenInFlightRef.current =
        false;
    }
  }

  async function approveAndExportBranchCertificationRotation():
    Promise<void> {

    if (
      rotationExportInFlightRef.current ||
      rotationOpenInFlightRef.current
    ) {
      return;
    }

    if (
      !verifiedRotation ||
      verifiedRotation.cancelled
    ) {
      setRotationExportError(
        "Open and cryptographically verify a Branch Certification Rotation Request first.",
      );

      setRotationExportState(
        "ERROR",
      );

      return;
    }

    rotationExportInFlightRef.current =
      true;

    setRotationExportState(
      "EXPORTING",
    );

    setRotationExportError(
      undefined,
    );

    setRotationExportResult(
      undefined,
    );

    try {
      const bridge =
        window.finoraControlCenter;

      if (!bridge) {
        throw new Error(
          "Dedicated FINORA Control Center preload bridge is unavailable.",
        );
      }

      const result =
        await bridge.issueAndExportBranchCertificationRotation();

      if (!result.success) {
        throw new Error(
          result.error ??
            "FINORA Branch Certification Rotation authority issuance failed.",
        );
      }

      if (
        result.data.cancelled
      ) {
        setRotationExportState(
          "IDLE",
        );

        return;
      }

      setRotationExportResult(
        result.data,
      );

      /*
       * Successful native export permanently consumes the
       * verified main-process request session.
       */
      setVerifiedRotation(
        undefined,
      );

      setRotationExportState(
        "SUCCESS",
      );
    }
    catch (
      error
    ) {
      setRotationExportError(
        error instanceof Error
          ? error.message
          : "Unable to approve and export the FINORA Branch Certification Rotation authority.",
      );

      setRotationExportState(
        "ERROR",
      );
    }
    finally {
      rotationExportInFlightRef.current =
        false;
    }
  }
  function updateTarget(
    field: keyof Omit<FinoraControlCenterTargetDraft, "fingerprintAlgorithm">,

    value: string,
  ): void {
    setTarget((current) => ({
      ...current,

      [field]: value,
    }));
  }

  async function issueBranchActivationDraft(
    draft: FinoraBranchActivationFormDraft,
  ): Promise<void> {
    if (branchIssuanceInFlightRef.current) {
      return;
    }

    branchIssuanceInFlightRef.current = true;

    setBranchIssuanceState("ISSUING");

    setBranchIssuanceError(undefined);

    setBranchSignedPackage(undefined);

    try {
      const request = buildFinoraBranchActivationIssuanceRequest(draft);

      const bridge = window.finoraControlCenter;

      if (!bridge) {
        throw new Error(
          "Dedicated FINORA Control Center preload bridge is unavailable.",
        );
      }

      const result = await bridge.issueBranchActivation(request);

      if (!result.success) {
        throw new Error(
          result.error ?? "FINORA Branch Activation issuance failed.",
        );
      }

      if (!result.data) {
        throw new Error(
          "FINORA Branch Activation issuance returned no signed package.",
        );
      }

      setBranchSignedPackage(result.data);

      setBranchIssuanceState("SUCCESS");
    } catch (error) {
      setBranchIssuanceError(
        error instanceof Error
          ? error.message
          : "Unable to issue FINORA Branch Activation package.",
      );

      setBranchIssuanceState("ERROR");
    } finally {
      branchIssuanceInFlightRef.current = false;
    }
  }

  async function issueBranchAccessDraft(
    draft: FinoraBranchAccessFormDraft,
  ): Promise<void> {

    if (
      branchAccessIssuanceInFlightRef.current
    ) {
      return;
    }

    branchAccessIssuanceInFlightRef.current =
      true;

    setBranchAccessIssuanceState(
      "ISSUING",
    );

    setBranchAccessIssuanceError(
      undefined,
    );

    setBranchAccessSignedPackage(
      undefined,
    );

    try {

      const request =
        buildFinoraBranchAccessIssuanceRequest(
          draft,
        );

      const bridge =
        window.finoraControlCenter;

      if (!bridge) {
        throw new Error(
          "Dedicated FINORA Control Center preload bridge is unavailable.",
        );
      }

      const result =
        await bridge.issueBranchAccess(
          request,
        );

      if (!result.success) {
        throw new Error(
          result.error ??
            "FINORA Branch Access issuance failed.",
        );
      }

      if (!result.data) {
        throw new Error(
          "FINORA Branch Access issuance returned no signed package.",
        );
      }

      setBranchAccessSignedPackage(
        result.data,
      );

      setBranchAccessIssuanceState(
        "SUCCESS",
      );

    } catch (error) {

      setBranchAccessIssuanceError(
        error instanceof Error
          ? error.message
          : "Unable to issue FINORA Branch Access package.",
      );

      setBranchAccessIssuanceState(
        "ERROR",
      );

    } finally {

      branchAccessIssuanceInFlightRef.current =
        false;
    }
  }
  async function issueDeviceRevocationDraft(
    draft: FinoraBranchDeviceRevocationFormDraft,
  ): Promise<void> {
    if (deviceRevocationIssuanceInFlightRef.current) {
      return;
    }

    deviceRevocationIssuanceInFlightRef.current = true;
    setDeviceRevocationIssuanceState("ISSUING");
    setDeviceRevocationIssuanceError(undefined);
    setDeviceRevocationSignedPackage(undefined);

    try {
      const request =
        buildFinoraBranchDeviceRevocationIssuanceRequest(
          draft,
        );

      const bridge = window.finoraControlCenter;

      if (!bridge) {
        throw new Error(
          "Dedicated FINORA Control Center preload bridge is unavailable.",
        );
      }

      const result =
        await bridge.issueBranchDeviceRevocation(
          request,
        );

      if (!result.success) {
        throw new Error(
          result.error ??
            "FINORA Device Revocation issuance failed.",
        );
      }

      if (!result.data) {
        throw new Error(
          "FINORA Device Revocation issuance returned no signed package.",
        );
      }

      setDeviceRevocationSignedPackage(result.data);
      setDeviceRevocationIssuanceState("SUCCESS");
    } catch (error) {
      setDeviceRevocationIssuanceError(
        error instanceof Error
          ? error.message
          : "Unable to issue FINORA Device Revocation package.",
      );
      setDeviceRevocationIssuanceState("ERROR");
    } finally {
      deviceRevocationIssuanceInFlightRef.current = false;
    }
  }

  async function issueStorageEntitlementDraft(
    draft: FinoraStorageEntitlementFormDraft,
  ): Promise<void> {
    if (storageIssuanceInFlightRef.current) {
      return;
    }

    storageIssuanceInFlightRef.current = true;

    setStorageIssuanceState("ISSUING");

    setStorageIssuanceError(undefined);

    setStorageSignedPackage(undefined);

    try {
      const request = buildFinoraStorageEntitlementIssuanceRequest(draft);

      const bridge = window.finoraControlCenter;

      if (!bridge) {
        throw new Error(
          "Dedicated FINORA Control Center preload bridge is unavailable.",
        );
      }

      const result = await bridge.issueStorageEntitlement(request);

      if (!result.success) {
        throw new Error(
          result.error ?? "FINORA Storage Entitlement issuance failed.",
        );
      }

      if (!result.data) {
        throw new Error(
          "FINORA Storage Entitlement issuance returned no signed package.",
        );
      }

      setStorageSignedPackage(result.data);

      setStorageIssuanceState("SUCCESS");
    } catch (error) {
      setStorageIssuanceError(
        error instanceof Error
          ? error.message
          : "Unable to issue FINORA Storage Entitlement package.",
      );

      setStorageIssuanceState("ERROR");
    } finally {
      storageIssuanceInFlightRef.current = false;
    }
  }

  async function issuePortableStorageEntitlementDraft(
    draft: FinoraStorageEntitlementFormDraft,
  ): Promise<void> {
    if (storageIssuanceInFlightRef.current) {
      return;
    }

    storageIssuanceInFlightRef.current = true;

    setStorageIssuanceState("ISSUING");

    setStorageIssuanceError(undefined);

    setStorageSignedPackage(undefined);

    try {
      const request = buildFinoraStorageEntitlementIssuanceRequest(draft);

      const bridge = window.finoraControlCenter;

      if (!bridge) {
        throw new Error(
          "Dedicated FINORA Control Center preload bridge is unavailable.",
        );
      }

      const result =
        await bridge.issuePortableStorageEntitlement(
          request,
        );

      if (!result.success) {
        throw new Error(
          result.error ??
            "FINORA Portable Storage Entitlement issuance failed.",
        );
      }

      if (!result.data) {
        throw new Error(
          "FINORA Portable Storage Entitlement issuance returned no signed package.",
        );
      }

      setStorageSignedPackage(result.data);

      setStorageIssuanceState("SUCCESS");
    } catch (error) {
      setStorageIssuanceError(
        error instanceof Error
          ? error.message
          : "Unable to issue FINORA Portable Storage Entitlement package.",
      );

      setStorageIssuanceState("ERROR");
    } finally {
      storageIssuanceInFlightRef.current = false;
    }
  }

  async function issueBusinessProfileDraft(
    draft: FinoraBusinessProfileFormDraft,
  ): Promise<void> {
    if (businessProfileIssuanceInFlightRef.current) {
      return;
    }

    businessProfileIssuanceInFlightRef.current = true;

    setBusinessProfileIssuanceState("ISSUING");

    setBusinessProfileIssuanceError(undefined);

    setBusinessProfileSignedPackage(undefined);

    try {
      const request = buildFinoraBusinessProfileIssuanceRequest(draft);

      const bridge = window.finoraControlCenter;

      if (!bridge) {
        throw new Error(
          "Dedicated FINORA Control Center preload bridge is unavailable.",
        );
      }

      const result = await bridge.issueBusinessProfile(request);

      if (!result.success) {
        throw new Error(
          result.error ?? "FINORA Business Profile issuance failed.",
        );
      }

      if (!result.data) {
        throw new Error(
          "FINORA Business Profile issuance returned no signed package.",
        );
      }

      setBusinessProfileSignedPackage(result.data);

      setBusinessProfileIssuanceState("SUCCESS");
    } catch (error) {
      setBusinessProfileIssuanceError(
        error instanceof Error
          ? error.message
          : "Unable to issue FINORA Business Profile package.",
      );

      setBusinessProfileIssuanceState("ERROR");
    } finally {
      businessProfileIssuanceInFlightRef.current = false;
    }
  }

  async function issuePricingPolicyDraft(
    draft: FinoraPricingPolicyFormDraft,
  ): Promise<void> {
    if (pricingPolicyIssuanceInFlightRef.current) {
      return;
    }

    pricingPolicyIssuanceInFlightRef.current = true;

    setPricingPolicyIssuanceState("ISSUING");

    setPricingPolicyIssuanceError(undefined);

    setPricingPolicySignedPackage(undefined);

    try {
      const request = buildFinoraPricingPolicyIssuanceRequest(draft);

      const bridge = window.finoraControlCenter;

      if (!bridge) {
        throw new Error(
          "Dedicated FINORA Control Center preload bridge is unavailable.",
        );
      }

      const result = await bridge.issuePricingPolicy(request);

      if (!result.success) {
        throw new Error(
          result.error ?? "FINORA Pricing Policy issuance failed.",
        );
      }

      if (!result.data) {
        throw new Error(
          "FINORA Pricing Policy issuance returned no signed package.",
        );
      }

      setPricingPolicySignedPackage(result.data);

      setPricingPolicyIssuanceState("SUCCESS");
    } catch (error) {
      setPricingPolicyIssuanceError(
        error instanceof Error
          ? error.message
          : "Unable to issue FINORA Pricing Policy package.",
      );

      setPricingPolicyIssuanceState("ERROR");
    } finally {
      pricingPolicyIssuanceInFlightRef.current = false;
    }
  }

  const [
    walletRechargeApprovalState,
    setWalletRechargeApprovalState,
  ] = useState<
    "IDLE" | "EXPORTING" | "SUCCESS" | "ERROR"
  >("IDLE");

  const [
    walletRechargeApprovalError,
    setWalletRechargeApprovalError,
  ] = useState<string | undefined>(
    undefined,
  );

  const [
    walletRechargeApprovalFileName,
    setWalletRechargeApprovalFileName,
  ] = useState<string | undefined>(
    undefined,
  );

  const walletRechargeApprovalInFlightRef =
    useRef(
      false,
    );
  const [
    walletRechargeDeclineState,
    setWalletRechargeDeclineState,
  ] = useState<
    "IDLE" | "EXPORTING" | "SUCCESS" | "ERROR"
  >("IDLE");

  const [
    walletRechargeDeclineError,
    setWalletRechargeDeclineError,
  ] = useState<string | undefined>(
    undefined,
  );

  const [
    walletRechargeDeclineFileName,
    setWalletRechargeDeclineFileName,
  ] = useState<string | undefined>(
    undefined,
  );

  const walletRechargeDeclineInFlightRef =
    useRef(
      false,
    );

  /*
   * Approval and Decline consume the same authoritative
   * main-process verified Request session. Keep one renderer
   * interaction lock so both actions cannot be started together.
   */
  const walletRechargeDecisionInFlightRef =
    useRef(
      false,
    );

  async function openWalletRechargeRequest(): Promise<void> {
    if (walletRechargeRequestOpenInFlightRef.current) {
      return;
    }

    walletRechargeRequestOpenInFlightRef.current =
      true;

    setWalletRechargeApprovalState(
      "IDLE",
    );

    setWalletRechargeApprovalError(
      undefined,
    );

    setWalletRechargeApprovalFileName(
      undefined,
    );

    setWalletRechargeDeclineState(
      "IDLE",
    );

    setWalletRechargeDeclineError(
      undefined,
    );

    setWalletRechargeDeclineFileName(
      undefined,
    );

    setWalletRechargeRequestOpenState(
      "OPENING",
    );

    setWalletRechargeRequestOpenError(
      undefined,
    );

    setVerifiedWalletRechargeRequest(
      undefined,
    );

    try {
      const bridge =
        window.finoraControlCenter;

      if (!bridge) {
        throw new Error(
          "Dedicated FINORA Control Center preload bridge is unavailable.",
        );
      }

      const result =
        await bridge.openWalletRechargeRequest();

      if (!result.success) {
        throw new Error(
          result.error ??
            "Unable to open the FINORA Wallet Recharge Request.",
        );
      }

      const request =
        result.data;

      if (request.cancelled) {
        setWalletRechargeRequestOpenState(
          "IDLE",
        );

        return;
      }

      setVerifiedWalletRechargeRequest(
        request,
      );

      setWalletRechargeRequestOpenState(
        "SUCCESS",
      );
    } catch (error) {
      setVerifiedWalletRechargeRequest(
        undefined,
      );

      setWalletRechargeRequestOpenError(
        error instanceof Error
          ? error.message
          : "Unable to import the FINORA Wallet Recharge Request.",
      );

      setWalletRechargeRequestOpenState(
        "ERROR",
      );
    } finally {
      walletRechargeRequestOpenInFlightRef.current =
        false;
    }
  }

  async function approveAndExportVerifiedWalletRechargeRequest():
    Promise<void> {

    if (
      walletRechargeDecisionInFlightRef.current ||
      walletRechargeApprovalInFlightRef.current ||
      walletRechargeDeclineState === "SUCCESS" ||
      !verifiedWalletRechargeRequest
    ) {
      return;
    }

    walletRechargeDecisionInFlightRef.current =
      true;

    walletRechargeApprovalInFlightRef.current =
      true;

    setWalletRechargeApprovalState(
      "EXPORTING",
    );

    setWalletRechargeApprovalError(
      undefined,
    );

    setWalletRechargeApprovalFileName(
      undefined,
    );

    try {
      const bridge =
        window.finoraControlCenter;

      if (!bridge) {
        throw new Error(
          "Dedicated FINORA Control Center preload bridge is unavailable.",
        );
      }

      const result =
        await bridge.approveAndExportWalletRechargeRequest();

      if (!result.success) {
        throw new Error(
          result.error ??
            "FINORA Wallet Recharge approval export failed.",
        );
      }

      const exportResult =
        result.data;

      if (exportResult.cancelled) {
        setWalletRechargeApprovalState(
          "IDLE",
        );

        return;
      }

      setWalletRechargeApprovalFileName(
        exportResult.fileName,
      );

      setWalletRechargeApprovalState(
        "SUCCESS",
      );

    } catch (error) {
      setWalletRechargeApprovalError(
        error instanceof Error
          ? error.message
          : "Unable to approve and export the FINORA Wallet Recharge authorization.",
      );

      setWalletRechargeApprovalState(
        "ERROR",
      );

    } finally {
      walletRechargeApprovalInFlightRef.current =
        false;

      walletRechargeDecisionInFlightRef.current =
        false;
    }
  }

  async function declineAndExportVerifiedWalletRechargeRequest():
    Promise<void> {

    if (
      walletRechargeDecisionInFlightRef.current ||
      walletRechargeDeclineInFlightRef.current ||
      walletRechargeApprovalState === "SUCCESS" ||
      !verifiedWalletRechargeRequest
    ) {
      return;
    }

    walletRechargeDecisionInFlightRef.current =
      true;

    walletRechargeDeclineInFlightRef.current =
      true;

    setWalletRechargeDeclineState(
      "EXPORTING",
    );

    setWalletRechargeDeclineError(
      undefined,
    );

    setWalletRechargeDeclineFileName(
      undefined,
    );

    try {
      const bridge =
        window.finoraControlCenter;

      if (!bridge) {
        throw new Error(
          "Dedicated FINORA Control Center preload bridge is unavailable.",
        );
      }

      const result =
        await bridge.declineAndExportWalletRechargeRequest();

      if (!result.success) {
        throw new Error(
          result.error ??
            "FINORA Wallet Recharge decline export failed.",
        );
      }

      const exportResult =
        result.data;

      if (exportResult.cancelled) {
        setWalletRechargeDeclineState(
          "IDLE",
        );

        return;
      }

      setWalletRechargeDeclineFileName(
        exportResult.fileName,
      );

      setWalletRechargeDeclineState(
        "SUCCESS",
      );

    } catch (error) {
      setWalletRechargeDeclineError(
        error instanceof Error
          ? error.message
          : "Unable to decline and export the FINORA Wallet Recharge Request.",
      );

      setWalletRechargeDeclineState(
        "ERROR",
      );

    } finally {
      walletRechargeDeclineInFlightRef.current =
        false;

      walletRechargeDecisionInFlightRef.current =
        false;
    }
  }

  async function issueWalletRechargeDraft(
    draft: FinoraWalletRechargeFormDraft,
  ): Promise<void> {
    if (walletRechargeIssuanceInFlightRef.current) {
      return;
    }

    walletRechargeIssuanceInFlightRef.current = true;

    setWalletRechargeIssuanceState("ISSUING");

    setWalletRechargeIssuanceError(undefined);

    setWalletRechargeSignedPackage(undefined);

    try {
      const request = buildFinoraWalletRechargeIssuanceRequest(draft);

      const bridge = window.finoraControlCenter;

      if (!bridge) {
        throw new Error(
          "Dedicated FINORA Control Center preload bridge is unavailable.",
        );
      }

      const result = await bridge.issueWalletRecharge(request);

      if (!result.success) {
        throw new Error(
          result.error ?? "FINORA Wallet Recharge issuance failed.",
        );
      }

      if (!result.data) {
        throw new Error(
          "FINORA Wallet Recharge issuance returned no signed package.",
        );
      }

      setWalletRechargeSignedPackage(result.data);

      setWalletRechargeIssuanceState("SUCCESS");
    } catch (error) {
      setWalletRechargeIssuanceError(
        error instanceof Error
          ? error.message
          : "Unable to issue FINORA Wallet Recharge package.",
      );

      setWalletRechargeIssuanceState("ERROR");
    } finally {
      walletRechargeIssuanceInFlightRef.current = false;
    }
  }

  async function exportCurrentControlBundle(): Promise<void> {
    if (bundleExportInFlightRef.current) {
      return;
    }

    bundleExportInFlightRef.current = true;

    setBundleExportState("EXPORTING");

    setBundleExportError(undefined);

    setBundleExportResult(undefined);

    try {
      const signedPackages = [
        branchSignedPackage,
        branchAccessSignedPackage,
        deviceRevocationSignedPackage,
        storageSignedPackage,
        businessProfileSignedPackage,
        pricingPolicySignedPackage,
        walletRechargeSignedPackage,
      ].filter(
        (
          candidate,
        ): candidate is Record<string, unknown> =>
          candidate !== undefined,
      );

      const request =
        buildFinoraControlBundleIssuanceRequest({
          target,

          packages:
            signedPackages,
        });

      const bridge =
        window.finoraControlCenter;

      if (!bridge) {
        throw new Error(
          "Dedicated FINORA Control Center preload bridge is unavailable.",
        );
      }

      const result =
        await bridge.issueAndExportControlBundle(
          request,
        );

      if (!result.success) {
        throw new Error(
          result.error ??
            "FINORA Control Bundle export failed.",
        );
      }

      if (!result.data) {
        throw new Error(
          "FINORA Control Bundle export returned no result.",
        );
      }

      if (result.data.cancelled) {
        setBundleExportState(
          "IDLE",
        );

        return;
      }

      setBundleExportResult({
        fileName:
          result.data.fileName,

        bytesWritten:
          result.data.bytesWritten,
      });

      setBundleExportState(
        "SUCCESS",
      );

    } catch (error) {

      setBundleExportError(
        error instanceof Error
          ? error.message
          : "Unable to export the FINORA Control Bundle.",
      );

      setBundleExportState(
        "ERROR",
      );

    } finally {

      bundleExportInFlightRef.current =
        false;
    }
  }

  const availableBundlePackageCount =
    [
      branchSignedPackage,
      branchAccessSignedPackage,
      deviceRevocationSignedPackage,
      storageSignedPackage,
      businessProfileSignedPackage,
      pricingPolicySignedPackage,
      walletRechargeSignedPackage,
    ].filter(
      (candidate) =>
        candidate !== undefined,
    ).length;

  const serverProvisioningValidationErrors: string[] = [];

  if (serverAdminCredentialConfigured !== true) {
    serverProvisioningValidationErrors.push("Production Server Access must be connected.");
  }

  if (provisioningOwnerName.trim().length === 0) {
    serverProvisioningValidationErrors.push("Owner Name is required.");
  }

  if (provisioningMobile.length !== 10) {
    serverProvisioningValidationErrors.push("Mobile Number must contain exactly 10 digits.");
  }

  if (
    provisioningAadhaar.length !== 0 &&
    provisioningAadhaar.length !== 12
  ) {
    serverProvisioningValidationErrors.push("Aadhaar must contain exactly 12 digits or remain blank.");
  }

  if (
    provisioningAadhaar.length === 12 &&
    !provisioningAadhaarConsent
  ) {
    serverProvisioningValidationErrors.push("Owner consent is required when Aadhaar is provided.");
  }

  if (provisioningBusinessName.trim().length === 0) {
    serverProvisioningValidationErrors.push("Business Name is required.");
  }

  if (provisioningBranchName.trim().length === 0) {
    serverProvisioningValidationErrors.push("Branch Name is required.");
  }

  if (
    provisioningUsername.trim().length < 4 ||
    provisioningUsername.trim().length > 12
  ) {
    serverProvisioningValidationErrors.push("Username must contain 4 to 12 characters.");
  }

  if (
    provisioningUsername.length > 0 &&
    !/^[a-z0-9._-]+$/.test(provisioningUsername)
  ) {
    serverProvisioningValidationErrors.push("Username may use letters, numbers, dot, underscore and hyphen only.");
  }

  if (provisioningValidFrom.length === 0) {
    serverProvisioningValidationErrors.push("Valid From date is required.");
  }

  if (provisioningValidUntil.length === 0) {
    serverProvisioningValidationErrors.push("Valid Until date is required.");
  }

  if (
    provisioningValidFrom.length > 0 &&
    provisioningValidUntil.length > 0 &&
    new Date(provisioningValidUntil).getTime() <=
      new Date(provisioningValidFrom).getTime()
  ) {
    serverProvisioningValidationErrors.push("Valid Until must be later than Valid From.");
  }

  const openingWalletBalanceNumber =
    Number(provisioningOpeningWalletBalance);

  if (
    !Number.isFinite(openingWalletBalanceNumber) ||
    openingWalletBalanceNumber < 0 ||
    openingWalletBalanceNumber > 100000000
  ) {
    serverProvisioningValidationErrors.push("Opening Wallet Balance must be between 0 and 100,000,000.");
  }

  const serverProvisioningHasInput =
    provisioningOwnerName.trim().length > 0 ||
    provisioningMobile.length > 0 ||
    provisioningAadhaar.length > 0 ||
    provisioningBusinessName.trim().length > 0 ||
    provisioningBranchName.trim().length > 0 ||
    provisioningUsername.trim().length > 0 ||
    provisioningValidFrom.length > 0 ||
    provisioningValidUntil.length > 0 ||
    provisioningOpeningWalletBalance !== "0";

  return (
    <section
      ref={workspaceRef}
      data-finora-control-center-issuance-workspace="true"
      style={{
        marginTop: "22px",
        scrollMarginTop: "16px",
        border: "1px solid rgba(148, 163, 184, 0.22)",
        borderRadius: "14px",
        padding: "16px",
        background: "rgba(15, 23, 42, 0.72)",
      }}
    >
      <header
        style={{
          display: newBranchProvisioning ? "none" : "block",
          marginBottom: "14px",
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: "18px",
            fontWeight: 650,
          }}
        >
          FINORA Owner Operations
        </h2>

        <p
          style={{
            margin: "8px 0 0",
            maxWidth: "720px",
            fontSize: "13px",
            lineHeight: 1.6,
            opacity: 0.74,
          }}
        >
          Choose the owner operation you want to complete for the selected FINORA branch.
        </p>
      </header>

      <div
        role="group"
        aria-label="FINORA issuance workflow"
        data-finora-owner-operations-grid="true"
        style={{
          display: newBranchProvisioning ? "none" : "grid",
          gridTemplateColumns: "repeat(var(--finora-cc-workflow-columns, 4), minmax(0, 1fr))",
          gap: "10px",
          marginBottom: "12px",
        }}
      >
        {WORKFLOWS
  .filter(
    (item) =>
      item.id !== "BRANCH_ACTIVATION" &&
      item.id !== "DEVICE_REVOCATION",
  )
  .map((item) => {
          const selected = workflow === item.id;

          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={selected}
              onClick={() => {
                onWorkflowChange(item.id);
              }}
              style={{
                minHeight: "88px",
                border: selected
                  ? "1px solid rgba(96, 165, 250, 0.72)"
                  : "1px solid rgba(148, 163, 184, 0.24)",
                borderRadius: "10px",
                padding: "13px",
                textAlign: "left",
                fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
                background: selected
                  ? "rgba(30, 64, 175, 0.22)"
                  : "rgba(15, 23, 42, 0.54)",
                color: "#e2e8f0",
                cursor: "pointer",
              }}
            >
              <strong
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontSize: "13px",
                }}
              >
                {item.label}
              </strong>

              <span
                style={{
                  display: "block",
                  fontSize: "12px",
                  lineHeight: 1.45,
                  opacity: 0.7,
                }}
              >
                {item.description}
              </span>
            </button>
          );
        })}
      </div>

      <section
        data-finora-installation-enrollment="true"
        aria-live="polite"
        style={{
          display: "none", marginBottom: "14px",
          border: "1px solid rgba(96, 165, 250, 0.28)",
          borderRadius: "11px",
          padding: "16px",
          background: "rgba(2, 6, 23, 0.34)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "18px",
          }}
        >
          <div
            style={{
              minWidth: 0,
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: "14px",
                fontWeight: 650,
              }}
            >
              Installation Enrollment Request
            </h3>

            <p
              style={{
                margin: "6px 0 0",
                maxWidth: "720px",
                fontSize: "12px",
                lineHeight: 1.55,
                opacity: 0.7,
              }}
            >
              Open the Branch Client .finora Enrollment Request and
              cryptographically verify its native installation possession proof.
              Opening a request does not authorize registration.
            </p>
          </div>

          <button
            type="button"
            disabled={
              enrollmentOpenState === "OPENING"
            }
            onClick={() => {
              void openVerifiedEnrollmentRequest();
            }}
            style={{
              minWidth: "190px",
              minHeight: "42px",
              border: "1px solid rgba(96, 165, 250, 0.62)",
              borderRadius: "9px",
              padding: "9px 14px",
              fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
              fontSize: "12px",
              fontWeight: 650,
              background: "rgba(30, 64, 175, 0.3)",
              color: "#dbeafe",
              cursor:
                enrollmentOpenState === "OPENING"
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            {enrollmentOpenState === "OPENING"
              ? "Opening & Verifying..."
              : "Open Enrollment Request"}
          </button>
        </div>

        {enrollmentOpenState === "ERROR" &&
          enrollmentOpenError && (
            <p
              style={{
                margin: "12px 0 0",
                fontSize: "12px",
                lineHeight: 1.55,
                color: "#fca5a5",
              }}
            >
              {enrollmentOpenError}
            </p>
          )}

        {enrollmentOpenState === "SUCCESS" &&
          verifiedEnrollment &&
          !verifiedEnrollment.cancelled && (
            <div
              style={{
                marginTop: "14px",
                display: "grid",
                gap: "7px",
                fontSize: "11px",
                lineHeight: 1.5,
                color: "#cbd5e1",
              }}
            >
              <strong
                style={{
                  color: "#86efac",
                }}
              >
                Verified native Installation Enrollment Request.
              </strong>

              <span>
                File: {verifiedEnrollment.fileName}
              </span>

              <span>
                Request ID: {verifiedEnrollment.requestId}
              </span>

              <span>
                Requested At: {verifiedEnrollment.requestedAt}
              </span>

              <span
                style={{
                  overflowWrap: "anywhere",
                }}
              >
                Installation ID: {verifiedEnrollment.installationId}
              </span>

              <span
                style={{
                  overflowWrap: "anywhere",
                }}
              >
                Binding Key ID: {verifiedEnrollment.bindingKeyId}
              </span>

              <span
                style={{
                  overflowWrap: "anywhere",
                }}
              >
                SHA-256: {verifiedEnrollment.publicKeyFingerprint}
              </span>

              <span
                style={{
                  color: "#fbbf24",
                }}
              >
                Owner, Business and Branch identity still require explicit
                FINORA operator assignment and approval.
              </span>
            </div>
          )}
      </section>
      <section
        data-finora-branch-certification-rotation="true"
        aria-live="polite"
        style={{
          display: "none", marginBottom: "14px",
          border: "1px solid rgba(251, 191, 36, 0.3)",
          borderRadius: "11px",
          padding: "16px",
          background: "rgba(2, 6, 23, 0.34)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "18px",
          }}
        >
          <div
            style={{
              flex: 1,
              minWidth: 0,
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: "14px",
                fontWeight: 650,
              }}
            >
              Branch Certification Recovery
            </h3>

            <p
              style={{
                margin: "6px 0 0",
                maxWidth: "760px",
                fontSize: "12px",
                lineHeight: 1.55,
                opacity: 0.72,
              }}
            >
              Open the native-signed Branch Certification Rotation Request
              exported by the trusted branch installation. Approval replaces
              only the Branch Certification public authority; Owner, Business
              and Branch identity remain unchanged.
            </p>
          </div>

          <button
            type="button"
            disabled={
              rotationOpenState === "OPENING" ||
              rotationExportState === "EXPORTING"
            }
            onClick={() => {
              void openVerifiedBranchCertificationRotationRequest();
            }}
            style={{
              minWidth: "210px",
              minHeight: "42px",
              border: "1px solid rgba(251, 191, 36, 0.62)",
              borderRadius: "9px",
              padding: "9px 14px",
              fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
              fontSize: "12px",
              fontWeight: 650,
              background: "rgba(146, 64, 14, 0.25)",
              color: "#fef3c7",
              cursor:
                rotationOpenState === "OPENING" ||
                rotationExportState === "EXPORTING"
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            {rotationOpenState === "OPENING"
              ? "Opening & Verifying..."
              : "Open Rotation Request"}
          </button>
        </div>

        {rotationOpenState === "ERROR" &&
          rotationOpenError && (
            <p
              style={{
                margin: "12px 0 0",
                fontSize: "12px",
                lineHeight: 1.55,
                color: "#fca5a5",
              }}
            >
              {rotationOpenError}
            </p>
          )}

        {rotationOpenState === "SUCCESS" &&
          verifiedRotation &&
          !verifiedRotation.cancelled && (
            <div
              style={{
                marginTop: "14px",
                display: "grid",
                gap: "7px",
                fontSize: "11px",
                lineHeight: 1.5,
                color: "#cbd5e1",
              }}
            >
              <strong
                style={{
                  color: "#86efac",
                }}
              >
                Verified native Branch Certification Rotation Request.
              </strong>

              <span>
                File: {verifiedRotation.fileName}
              </span>

              <span>
                Request ID: {verifiedRotation.requestId}
              </span>

              <span>
                Owner ID: {verifiedRotation.ownerId}
              </span>

              <span>
                Business ID: {verifiedRotation.businessId}
              </span>

              <span>
                Branch ID: {verifiedRotation.branchId}
              </span>

              <span
                style={{
                  overflowWrap: "anywhere",
                }}
              >
                Requesting Installation:{" "}
                {verifiedRotation.requestingInstallationId}
              </span>

              <span>
                Requested At: {verifiedRotation.requestedAt}
              </span>

              <span
                style={{
                  overflowWrap: "anywhere",
                }}
              >
                Current Certification Key:{" "}
                {verifiedRotation.previousCertificationKeyId}
              </span>

              <span
                style={{
                  overflowWrap: "anywhere",
                }}
              >
                Replacement Certification Key:{" "}
                {verifiedRotation.replacementCertificationKeyId}
              </span>

              <span
                style={{
                  color: "#fbbf24",
                }}
              >
                Approve only after confirming this request belongs to the
                intended branch. Successful export updates the authoritative
                Control Center Registry to the replacement certification key.
              </span>
            </div>
          )}

        <div
          style={{
            marginTop: "14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
          }}
        >
          <p
            style={{
              margin: 0,
              maxWidth: "720px",
              fontSize: "11px",
              lineHeight: 1.5,
              color: "#94a3b8",
            }}
          >
            Replacement private-key custody never enters the Control Center.
            The exported authority contains only signed public rotation
            evidence.
          </p>

          <button
            type="button"
            disabled={
              !verifiedRotation ||
              verifiedRotation.cancelled ||
              rotationOpenState === "OPENING" ||
              rotationExportState === "EXPORTING" ||
              rotationExportState === "SUCCESS"
            }
            onClick={() => {
              void approveAndExportBranchCertificationRotation();
            }}
            style={{
              minWidth: "240px",
              minHeight: "42px",
              border: "1px solid rgba(34, 197, 94, 0.58)",
              borderRadius: "9px",
              padding: "9px 14px",
              fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
              fontSize: "12px",
              fontWeight: 650,
              background: "rgba(20, 83, 45, 0.28)",
              color: "#dcfce7",
              cursor:
                !verifiedRotation ||
                verifiedRotation.cancelled ||
                rotationOpenState === "OPENING" ||
                rotationExportState === "EXPORTING" ||
                rotationExportState === "SUCCESS"
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            {rotationExportState === "EXPORTING"
              ? "Approving & Exporting..."
              : rotationExportState === "SUCCESS"
                ? "Rotation Authority Exported"
                : "Approve & Export Rotation Authority"}
          </button>
        </div>

        {rotationExportState === "ERROR" &&
          rotationExportError && (
            <p
              style={{
                margin: "12px 0 0",
                fontSize: "12px",
                lineHeight: 1.55,
                color: "#fca5a5",
              }}
            >
              {rotationExportError}
            </p>
          )}

        {rotationExportState === "SUCCESS" &&
          rotationExportResult &&
          !rotationExportResult.cancelled && (
            <div
              style={{
                marginTop: "12px",
                display: "grid",
                gap: "6px",
                fontSize: "11px",
                lineHeight: 1.5,
                color: "#bbf7d0",
              }}
            >
              <strong>
                Rotation authority exported and Registry transition completed.
              </strong>

              <span>
                File: {rotationExportResult.fileName}
              </span>

              <span>
                Request ID: {rotationExportResult.requestId}
              </span>

              <span>
                Package ID: {rotationExportResult.packageId}
              </span>

              <span>
                Sequence: {rotationExportResult.sequence}
              </span>

              <span>
                Bytes: {rotationExportResult.bytesWritten}
              </span>

              <span>
                Registry Updated:{" "}
                {rotationExportResult.registryUpdated
                  ? "Yes"
                  : "Exact retry / already applied"}
              </span>
            </div>
          )}
      </section>

      <div
        data-finora-selected-branch-bundle-layout="true"
        style={{
          display: newBranchProvisioning ? "none" : "block",
        }}
      >
      <section         data-finora-selected-branch-card="true"         style={{           minWidth: 0,           border: "1px solid rgba(148, 163, 184, 0.2)",           borderRadius: "11px",           padding: "16px",           background: "rgba(2, 6, 23, 0.34)",         }}       >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
            marginBottom: "14px",
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: "15px",
              fontWeight: 650,
            }}
          >
            Selected Branch
          </h3>

          <span
            style={{
              fontSize: "11px",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              opacity: 0.62,
            }}
          >
            {workflow}
          </span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(var(--finora-cc-form-columns, 3), minmax(0, 1fr))",
            gap: "14px",
          }}
        >
          {selectedBranch && (
            <div
              data-finora-control-center-selected-registry-target="true"
              style={{
                gridColumn:
                  "1 / -1",
                border:
                  "1px solid rgba(96, 165, 250, 0.38)",
                borderRadius:
                  "10px",
                padding:
                  "14px",
                background:
                  "rgba(30, 64, 175, 0.12)",
              }}
            >
              <div
                style={{
                  display:
                    "flex",
                  alignItems:
                    "flex-start",
                  justifyContent:
                    "space-between",
                  gap:
                    "16px",
                }}
              >
                <div
                  style={{
                    minWidth:
                      0,
                  }}
                >
                  <div
                    style={{
                      fontSize:
                        "12px",
                      fontWeight:
                        700,
                    }}
                  >
                    Registry Target Selected
                  </div>

                  <div
                    style={{
                      marginTop:
                        "4px",
                      fontSize:
                        "15px",
                      fontWeight:
                        700,
                      overflowWrap:
                        "anywhere",
                    }}
                  >
                    {selectedBranch.profile?.businessName ??
                      selectedBranch.identity.businessCode}
                    {" / "}
                    {selectedBranch.profile?.branchName ??
                      selectedBranch.identity.branchCode}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setTarget(
                      EMPTY_TARGET,
                    );

                    resetNormalIssuanceArtifacts();
                    onClearSelectedBranch();
                  }}
                  style={{
                    flex:
                      "0 0 auto",
                    minHeight:
                      "34px",
                    padding:
                      "6px 11px",
                    border:
                      "1px solid rgba(148, 163, 184, 0.28)",
                    borderRadius:
                      "8px",
                    background:
                      "rgba(15, 23, 42, 0.72)",
                    color:
                      "#e2e8f0",
                    fontFamily:
                      "inherit",
                    fontWeight:
                      650,
                    cursor:
                      "pointer",
                  }}
                >
                  Clear Selection
                </button>
              </div>

              <div
                style={{
                  marginTop:
                    "14px",
                  display:
                    "grid",
                  gridTemplateColumns:
                    "repeat(var(--finora-cc-form-columns, 3), minmax(0, 1fr))",
                  gap:
                    "12px 18px",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize:
                        "10px",
                      textTransform:
                        "uppercase",
                      letterSpacing:
                        "0.07em",
                      opacity:
                        0.58,
                    }}
                  >
                    Branch Code
                  </div>

                  <div
                    style={{
                      marginTop:
                        "4px",
                      fontSize:
                        "12px",
                      fontWeight:
                        650,
                    }}
                  >
                    {selectedBranch.identity.branchCode}
                  </div>
                </div>

                <div>
                  <div
                    style={{
                      fontSize:
                        "10px",
                      textTransform:
                        "uppercase",
                      letterSpacing:
                        "0.07em",
                      opacity:
                        0.58,
                    }}
                  >
                    Business Code
                  </div>

                  <div
                    style={{
                      marginTop:
                        "4px",
                      fontSize:
                        "12px",
                      fontWeight:
                        650,
                    }}
                  >
                    {selectedBranch.identity.businessCode}
                  </div>
                </div>

                <div
                  style={{
                    minWidth:
                      0,
                  }}
                >
                  <div
                    style={{
                      fontSize:
                        "10px",
                      textTransform:
                        "uppercase",
                      letterSpacing:
                        "0.07em",
                      opacity:
                        0.58,
                    }}
                  >
                    Installation ID
                  </div>

                  <div
                    style={{
                      marginTop:
                        "4px",
                      fontSize:
                        "11px",
                      overflowWrap:
                        "anywhere",
                      fontFamily:
                        "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                    }}
                  >
                    {selectedBranch.identity.installation.installationId}
                  </div>
                </div>

                <div
                  style={{
                    minWidth:
                      0,
                  }}
                >
                  <div
                    style={{
                      fontSize:
                        "10px",
                      textTransform:
                        "uppercase",
                      letterSpacing:
                        "0.07em",
                      opacity:
                        0.58,
                    }}
                  >
                    SHA-256 Fingerprint
                  </div>

                  <div
                    style={{
                      marginTop:
                        "4px",
                      fontSize:
                        "11px",
                      overflowWrap:
                        "anywhere",
                      fontFamily:
                        "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                    }}
                  >
                    {selectedBranch.identity.installation.publicKeyFingerprint}
                  </div>
                </div>
              </div>

              <div
                style={{
                  marginTop:
                    "12px",
                  fontSize:
                    "11px",
                  lineHeight:
                    1.5,
                  opacity:
                    0.66,
                }}
              >
                Immutable registry identity is locked for this signed issuance target.
              </div>
            </div>
          )}

          {!selectedBranch && (
            <>
              <div
                data-finora-control-center-manual-target="true"
                style={{
                  display:
                    "contents",
                }}
              >
                <TargetField
                  label="Owner ID"
                  value={target.ownerId}
                  placeholder="OWNER-..."
                  readOnly={selectedBranch !== undefined}
                  onChange={(value) => {
                    updateTarget("ownerId", value);
                  }}
                />

                <TargetField
                  label="Business ID"
                  value={target.businessId}
                  placeholder="BUSINESS-..."
                  readOnly={selectedBranch !== undefined}
                  onChange={(value) => {
                    updateTarget("businessId", value);
                  }}
                />

                <TargetField
                  label="Branch ID"
                  value={target.branchId}
                  placeholder="BRANCH-..."
                  readOnly={selectedBranch !== undefined}
                  onChange={(value) => {
                    updateTarget("branchId", value);
                  }}
                />




              </div>
            </>
          )}
        </div>
      </section>

      <section
        data-finora-control-bundle-export="true"
        aria-live="polite"
        style={{
          display: newBranchProvisioning ? "none" : "block",
          marginTop: "0",
          border: "1px solid rgba(148, 163, 184, 0.2)",
          borderRadius: "11px",
          padding: "16px",
          background: "rgba(2, 6, 23, 0.34)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "18px",
          }}
        >
          <div
            style={{
              minWidth: 0,
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: "14px",
                fontWeight: 650,
              }}
            >
              Control Bundle Export
            </h3>

            <p
              style={{
                margin: "6px 0 0",
                maxWidth: "none",
                fontSize: "12px",
                lineHeight: 1.55,
                opacity: 0.7,
              }}
            >
              Bundle all issued signed packages for this installation target into one signed FINORA .finora file.
            </p>
          </div>

        </div>

        <div           data-finora-control-bundle-status-row="true"           style={{             marginTop: "10px",             display: "flex",             alignItems: "center",             justifyContent: "space-between",             gap: "14px",           }}         >           <div             style={{               flex: 1,               minWidth: 0,             }}           >
        <p
          style={{
            margin: 0,
            fontSize: "14px",
            opacity: 0.62,
          }}
        >
          Available signed packages: {availableBundlePackageCount} / {WORKFLOWS.length}
        </p>

        {availableBundlePackageCount === 0 && (
          <p
            style={{
              margin: "8px 0 0",
              fontSize: "11px",
              lineHeight: 1.5,
              color: "#fbbf24",
            }}
          >
            Issue at least one signed package before exporting a Control Bundle.
          </p>
        )}
          </div>
          <button
          type="button"
          disabled={
          availableBundlePackageCount === 0 ||
          bundleExportState === "EXPORTING"
          }
          onClick={() => {
          void exportCurrentControlBundle();
          }}
          style={{
          minWidth: "150px",
          minHeight: "42px",
          border: "1px solid rgba(96, 165, 250, 0.62)",
          borderRadius: "9px",
          padding: "9px 14px",
          fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
          fontSize: "12px",
          fontWeight: 650,
          background:
          availableBundlePackageCount === 0
          ? "rgba(30, 41, 59, 0.46)"
          : "rgba(30, 64, 175, 0.3)",
          color:
          availableBundlePackageCount === 0
          ? "rgba(203, 213, 225, 0.48)"
          : "#dbeafe",
          cursor:
          availableBundlePackageCount === 0 ||
          bundleExportState === "EXPORTING"
          ? "not-allowed"
          : "pointer",
          }}
          >
          {bundleExportState === "EXPORTING"
          ? "Exporting..."
          : "Export .finora"}
          </button>
        </div>

        {bundleExportState === "ERROR" &&
          bundleExportError && (
            <p
              style={{
                margin: "10px 0 0",
                fontSize: "12px",
                lineHeight: 1.55,
                color: "#fca5a5",
              }}
            >
              {bundleExportError}
            </p>
          )}

        {bundleExportState === "SUCCESS" &&
          bundleExportResult && (
            <p
              style={{
                margin: "10px 0 0",
                fontSize: "12px",
                lineHeight: 1.55,
                color: "#86efac",
              }}
            >
              Exported {bundleExportResult.fileName} (
              {bundleExportResult.bytesWritten.toLocaleString()} bytes).
            </p>
          )}
      </section>
      </div>


      <section
        data-finora-enrollment-response-export="true"
        aria-live="polite"
        style={{
          display: "none",
          marginTop: "20px",
          border: "1px solid rgba(96, 165, 250, 0.28)",
          borderRadius: "11px",
          padding: "16px",
          background: "rgba(2, 6, 23, 0.34)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "18px",
          }}
        >
          <div
            style={{
              flex: 1,
              minWidth: 0,
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: "14px",
                fontWeight: 650,
              }}
            >
              Installation Enrollment Response
            </h3>

            <p
              style={{
                margin: "6px 0 0",
                maxWidth: "720px",
                fontSize: "12px",
                lineHeight: 1.55,
                opacity: 0.7,
              }}
            >
              Assign Owner, Business and Branch identity above, then define
              the immutable numbering codes. Device-binding authority comes
              only from the cryptographically verified Enrollment Request.
            </p>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(var(--finora-cc-form-columns, 3), minmax(0, 1fr))",
            gap: "14px",
            marginTop: "14px",
          }}
        >
          <TargetField
            label="Enrollment Owner ID"
            value={enrollmentOwnerId}
            placeholder="OWNER-..."
            readOnly={
              enrollmentResponseState === "SUCCESS"
            }
            onChange={setEnrollmentOwnerId}
          />

          <TargetField
            label="Enrollment Business ID"
            value={enrollmentBusinessId}
            placeholder="BUSINESS-..."
            readOnly={
              enrollmentResponseState === "SUCCESS"
            }
            onChange={setEnrollmentBusinessId}
          />

          <TargetField
            label="Enrollment Branch ID"
            value={enrollmentBranchId}
            placeholder="BRANCH-..."
            readOnly={
              enrollmentResponseState === "SUCCESS"
            }
            onChange={setEnrollmentBranchId}
          />

          <TargetField
            label="Business Code"
            value={enrollmentBusinessCode}
            placeholder="BUSINESS CODE"
            readOnly={
              enrollmentResponseState === "SUCCESS"
            }
            onChange={setEnrollmentBusinessCode}
          />

          <TargetField
            label="Branch Code"
            value={enrollmentBranchCode}
            placeholder="BRANCH CODE"
            readOnly={
              enrollmentResponseState === "SUCCESS"
            }
            onChange={setEnrollmentBranchCode}
          />
        </div>

        <div
          style={{
            marginTop: "14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: "11px",
              lineHeight: 1.5,
              color: "#fbbf24",
            }}
          >
            This response establishes installation identity and initial
            Control Center trust only. It does not activate the branch or
            grant storage.
          </p>

          <button
            type="button"
            disabled={
              !verifiedEnrollment ||
              verifiedEnrollment.cancelled ||
              !enrollmentOwnerId.trim() ||
              !enrollmentBusinessId.trim() ||
              !enrollmentBranchId.trim() ||
              !enrollmentBusinessCode.trim() ||
              !enrollmentBranchCode.trim() ||
              enrollmentResponseState === "EXPORTING" ||
              enrollmentResponseState === "SUCCESS"
            }
            onClick={() => {
              void issueAndExportEnrollmentResponse();
            }}
            style={{
              minWidth: "220px",
              minHeight: "42px",
              border: "1px solid rgba(96, 165, 250, 0.62)",
              borderRadius: "9px",
              padding: "9px 14px",
              fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
              fontSize: "12px",
              fontWeight: 650,
              background: "rgba(30, 64, 175, 0.3)",
              color: "#dbeafe",
              cursor:
                enrollmentResponseState === "EXPORTING" ||
                enrollmentResponseState === "SUCCESS"
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            {enrollmentResponseState === "EXPORTING"
              ? "Issuing & Exporting..."
              : enrollmentResponseState === "SUCCESS"
                ? "Enrollment Response Exported"
                : "Issue & Export Response"}
          </button>
        </div>

        {enrollmentResponseState === "ERROR" &&
          enrollmentResponseError && (
            <p
              style={{
                margin: "12px 0 0",
                fontSize: "12px",
                lineHeight: 1.55,
                color: "#fca5a5",
              }}
            >
              {enrollmentResponseError}
            </p>
          )}

        {enrollmentResponseState === "SUCCESS" &&
          enrollmentResponseResult && (
            <div
              style={{
                marginTop: "12px",
                display: "grid",
                gap: "5px",
                fontSize: "11px",
                lineHeight: 1.5,
                color: "#86efac",
              }}
            >
              <strong>
                Enrollment Response signed and exported successfully.
              </strong>

              <span>
                File: {enrollmentResponseResult.fileName} (
                {enrollmentResponseResult.bytesWritten.toLocaleString()} bytes)
              </span>

              <span
                style={{
                  overflowWrap: "anywhere",
                }}
              >
                Response ID: {enrollmentResponseResult.responseId}
              </span>

              <span
                style={{
                  overflowWrap: "anywhere",
                }}
              >
                Request ID: {enrollmentResponseResult.requestId}
              </span>
            </div>
          )}
      </section>

      {workflow === "BRANCH_ACTIVATION" &&
        newBranchProvisioning && (
          <section
            style={{
              display: "grid",
              gap: "18px",
              padding: "16px",
              border:
                "1px solid rgba(148, 163, 184, 0.22)",
              borderRadius: "16px",
              background:
                "rgba(15, 23, 42, 0.55)",
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: "20px",
                  fontWeight: 750,
                }}
              >
                New Owner Provisioning
              </h2>

              <p
                style={{
                  margin: "7px 0 0",
                  fontSize: "13px",
                  lineHeight: 1.6,
                  color: "#94a3b8",
                }}
              >
                Prepare a new FINORA owner, business and branch.
                Production provisioning securely creates the owner, business, branch, subscription, wallet and temporary login credentials.
              </p>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "14px",
              }}
            >
              <div
                style={{
                  gridColumn: "1 / -1",
                  display: "grid",
                  gap: "12px",
                  padding: "14px",
                  borderRadius: "12px",
                  border:
                    serverAdminCredentialConfigured
                      ? "1px solid rgba(34, 197, 94, 0.34)"
                      : "1px solid rgba(245, 158, 11, 0.34)",
                  background:
                    serverAdminCredentialConfigured
                      ? "rgba(34, 197, 94, 0.07)"
                      : "rgba(245, 158, 11, 0.06)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "12px",
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: 750,
                        color: "#f8fafc",
                      }}
                    >
                      FINORA Production Server Access
                    </div>

                    <div
                      style={{
                        marginTop: "4px",
                        fontSize: "12px",
                        color: "#94a3b8",
                      }}
                    >
                      {serverAdminCredentialConfigured === undefined
                        ? "Checking secure server credential..."
                        : serverAdminCredentialConfigured
                          ? "Production server administrator credential is verified and connected."
                          : "Configure the administrator credential once before creating production owners."}
                    </div>
                  </div>

                  <strong
                    style={{
                      fontSize: "12px",
                      color:
                        serverAdminCredentialConfigured
                          ? "#86efac"
                          : "#fbbf24",
                    }}
                  >
                    {serverAdminCredentialConfigured
                      ? "CONNECTED"
                      : "SETUP REQUIRED"}
                  </strong>
                  {/* FINORA_SERVER_ADMIN_DISCONNECT_BUTTON_V1 */}

                  {serverAdminCredentialConfigured === true && (
                    <button
                      type="button"
                      disabled={serverAdminCredentialState === "SAVING"}
                      onClick={async () => {
                        const bridge =
                          window.finoraControlCenter;

                        if (!bridge) {
                          setServerAdminCredentialState("ERROR");
                          setServerAdminCredentialError(
                            "Dedicated FINORA Control Center preload bridge is unavailable.",
                          );
                          return;
                        }

                        setServerAdminCredentialState("SAVING");
                        setServerAdminCredentialError(undefined);

                        try {
                          const result =
                            await bridge.disconnectServerAdminCredential();

                          if (!result.success) {
                            throw new Error(
                              result.error ??
                                "Unable to disconnect FINORA Production Server Access.",
                            );
                          }

                          setServerAdminCredentialConfigured(false);
                          setServerAdminCredentialInput("");
                          setServerAdminCredentialState("IDLE");
                          setServerAdminCredentialError(undefined);
                          setServerProvisioningError(undefined);
                        } catch (error) {
                          setServerAdminCredentialState("ERROR");
                          setServerAdminCredentialError(
                            error instanceof Error
                              ? error.message
                              : "Unable to disconnect FINORA Production Server Access.",
                          );
                        }
                      }}
                      style={{
                        minHeight: "34px",
                        padding: "0 12px",
                        borderRadius: "8px",
                        border: "1px solid rgba(248, 113, 113, 0.34)",
                        background: "rgba(127, 29, 29, 0.18)",
                        color: "#fecaca",
                        fontWeight: 700,
                        cursor:
                          serverAdminCredentialState === "SAVING"
                            ? "wait"
                            : "pointer",
                      }}
                    >
                      Disconnect Secure Access
                    </button>
                  )}
                </div>

                {serverAdminCredentialConfigured !== true && (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "minmax(260px, 1fr) auto",
                      gap: "10px",
                      alignItems: "end",
                    }}
                  >
                    <label
                      style={{
                        display: "grid",
                        gap: "6px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: 650,
                          color: "#cbd5e1",
                        }}
                      >
                        Administrator Credential
                      </span>

                      <input
                        type="password"
                        autoComplete="off"
                        value={serverAdminCredentialInput}
                        placeholder="Enter FINORA Server administrator credential"
                        onChange={(event) => {
                          setServerAdminCredentialInput(
                            event.currentTarget.value,
                          );
                          setServerAdminCredentialState("IDLE");
                          setServerAdminCredentialError(undefined);
                        }}
                        style={{
                          minHeight: "42px",
                          borderRadius: "9px",
                          border: "1px solid rgba(148, 163, 184, 0.28)",
                          background: "rgba(15, 23, 42, 0.78)",
                          color: "#f8fafc",
                          padding: "0 11px",
                        }}
                      />
                    </label>

                    <button
                      type="button"
                      disabled={
                        serverAdminCredentialState === "SAVING" ||
                        serverAdminCredentialInput.trim().length < 32
                      }
                      onClick={async () => {
                        const bridge =
                          window.finoraControlCenter;

                        if (!bridge) {
                          setServerAdminCredentialState("ERROR");
                          setServerAdminCredentialError(
                            "Dedicated FINORA Control Center preload bridge is unavailable.",
                          );
                          return;
                        }

                        setServerAdminCredentialState("SAVING");
                        setServerAdminCredentialError(undefined);

                        try {
                          const result =
                            await bridge.configureServerAdminCredential(
                              serverAdminCredentialInput,
                            );

                          if (!result.success) {
                            throw new Error(
                              result.error ??
                                "Unable to save FINORA Server administrator credential.",
                            );
                          }

                          setServerAdminCredentialInput("");
                          setServerAdminCredentialConfigured(true);
                          setServerAdminCredentialState("SUCCESS");
                        } catch (error) {
                          // FINORA_CONFIGURE_REJECTION_UI_V1
                          setServerAdminCredentialConfigured(false);
                          setServerAdminCredentialState("ERROR");
                          setServerAdminCredentialError(
                            error instanceof Error
                              ? error.message
                              : "Unable to save FINORA Server administrator credential.",
                          );
                        }
                      }}
                      style={{
                        minHeight: "42px",
                        padding: "0 16px",
                        border: 0,
                        borderRadius: "9px",
                        fontWeight: 700,
                        cursor:
                          serverAdminCredentialState === "SAVING"
                            ? "wait"
                            : serverAdminCredentialInput.trim().length < 32
                              ? "not-allowed"
                              : "pointer",
                      }}
                    >
                      {serverAdminCredentialState === "SAVING"
                        ? "Saving Securely..."
                        : serverAdminCredentialConfigured ? "Replace Secure Access" : "Configure Secure Access"}
                    </button>
                  </div>
                )}

                {serverAdminCredentialState === "ERROR" &&
                  serverAdminCredentialError && (
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#fca5a5",
                      }}
                    >
                      {serverAdminCredentialError}
                    </div>
                  )}
              </div>

              <TargetField
                label="Owner Name"
                value={provisioningOwnerName}
                placeholder="Owner full name"
                onChange={(value) => {
                  setProvisioningOwnerName(value);
                  setProvisioningDraftGenerated(false);
                }}
              />

              <TargetField
                label="Mobile Number"
                value={provisioningMobile}
                placeholder="10 digit mobile number"
                onChange={(value) => {
                  setProvisioningMobile(
                    value.replace(/\D/g, "").slice(0, 10),
                  );
                  setProvisioningDraftGenerated(false);
                  setServerProvisioningState("IDLE");
                  setServerProvisioningError(undefined);
                }}
              />

              <TargetField
                label="Aadhaar (Optional)"
                value={provisioningAadhaar}
                placeholder="12 digit Aadhaar - optional"
                onChange={(value) => {
                  setProvisioningAadhaar(
                    value.replace(/\D/g, "").slice(0, 12),
                  );
                  setProvisioningDraftGenerated(false);
                  setServerProvisioningState("IDLE");
                  setServerProvisioningError(undefined);
                }}
              />

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "9px",
                  minHeight: "42px",
                  fontSize: "12px",
                  color: "#cbd5e1",
                }}
              >
                <input
                  type="checkbox"
                  checked={provisioningAadhaarConsent}
                  disabled={provisioningAadhaar.length === 0}
                  onChange={(event) => {
                    setProvisioningAadhaarConsent(
                      event.currentTarget.checked,
                    );
                    setServerProvisioningState("IDLE");
                    setServerProvisioningError(undefined);
                  }}
                />
                Aadhaar details provided with owner consent
              </label>

              <TargetField
                label="Business Name"
                value={provisioningBusinessName}
                placeholder="Business name"
                onChange={(value) => {
                  setProvisioningBusinessName(value);
                  setProvisioningDraftGenerated(false);
                }}
              />

              <TargetField
                label="Branch Name"
                value={provisioningBranchName}
                placeholder="Main branch name"
                onChange={(value) => {
                  setProvisioningBranchName(value);
                  setProvisioningDraftGenerated(false);
                }}
              />

              <TargetField
                label="Username"
                value={provisioningUsername}
                placeholder="Username (4-12 characters)"
                onChange={(value) => {
                  setProvisioningUsername(
                    value
                      .trimStart()
                      .toLowerCase()
                      .replace(/[^a-z0-9._-]/g, "")
                      .slice(0, 12),
                  );
                  setProvisioningDraftGenerated(false);
                }}
              />

              <div
                style={{
                  gridColumn: "1 / -1",
                  marginTop: "4px",
                  paddingTop: "14px",
                  borderTop: "1px solid rgba(148, 163, 184, 0.16)",
                }}
              >
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "#e2e8f0",
                  }}
                >
                  Subscription & Wallet
                </div>
              </div>

              <label
                style={{
                  display: "grid",
                  gap: "6px",
                }}
              >
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 650,
                    color: "#cbd5e1",
                  }}
                >
                  Valid From
                </span>
                <input
                  type="date"
                  value={provisioningValidFrom}
                  onChange={(event) => {
                    setProvisioningValidFrom(event.currentTarget.value);
                    setServerProvisioningState("IDLE");
                    setServerProvisioningError(undefined);
                  }}
                  style={{
                    minHeight: "42px",
                    borderRadius: "9px",
                    border: "1px solid rgba(148, 163, 184, 0.28)",
                    background: "rgba(15, 23, 42, 0.78)",
                    color: "#f8fafc",
                    padding: "0 11px",
                  }}
                />
              </label>

              <label
                style={{
                  display: "grid",
                  gap: "6px",
                }}
              >
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 650,
                    color: "#cbd5e1",
                  }}
                >
                  Valid Until
                </span>
                <input
                  type="date"
                  value={provisioningValidUntil}
                  onChange={(event) => {
                    setProvisioningValidUntil(event.currentTarget.value);
                    setServerProvisioningState("IDLE");
                    setServerProvisioningError(undefined);
                  }}
                  style={{
                    minHeight: "42px",
                    borderRadius: "9px",
                    border: "1px solid rgba(148, 163, 184, 0.28)",
                    background: "rgba(15, 23, 42, 0.78)",
                    color: "#f8fafc",
                    padding: "0 11px",
                  }}
                />
              </label>

              <div
                style={{
                  display: "grid",
                  gap: "6px",
                }}
              >
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 650,
                    color: "#cbd5e1",
                  }}
                >
                  Remaining Days
                </span>
                <div
                  style={{
                    minHeight: "42px",
                    display: "flex",
                    alignItems: "center",
                    borderRadius: "9px",
                    border: "1px solid rgba(34, 197, 94, 0.28)",
                    background: "rgba(34, 197, 94, 0.08)",
                    color: "#86efac",
                    padding: "0 11px",
                    fontWeight: 700,
                  }}
                >
                  {provisioningValidFrom && provisioningValidUntil
                    ? Math.max(
                        0,
                        Math.ceil(
                          (new Date(provisioningValidUntil).getTime() -
                            new Date(provisioningValidFrom).getTime()) /
                            86400000,
                        ),
                      )
                    : 0}
                </div>
              </div>

              <TargetField
                label="Opening Wallet Balance"
                value={provisioningOpeningWalletBalance}
                placeholder="0"
                onChange={(value) => {
                  setProvisioningOpeningWalletBalance(
                    value.replace(/[^0-9.]/g, ""),
                  );
                  setServerProvisioningState("IDLE");
                  setServerProvisioningError(undefined);
                }}
              />
            </div>

            <div>
              {/* FINORA_SERVER_OWNER_CREATE_V1 */}
              <button
                type="button"
                disabled={
                  serverProvisioningState === "CREATING" ||
                  serverProvisioningValidationErrors.length > 0
                }
                onClick={async () => {
                  const bridge =
                    window.finoraControlCenter;

                  if (!bridge) {
                    setServerProvisioningState("ERROR");
                    setServerProvisioningError(
                      "Dedicated FINORA Control Center preload bridge is unavailable.",
                    );
                    return;
                  }

                  if (serverAdminCredentialConfigured !== true) {
                    setServerProvisioningState("ERROR");
                    setServerProvisioningError(
                      "Configure FINORA Production Server Access before creating an owner.",
                    );
                    return;
                  }

                  setServerProvisioningState("CREATING");
                  setServerProvisioningError(undefined);
                  setServerProvisioningResult(undefined);
                  setProvisioningDraftGenerated(false);

                  try {
                    const result =
                      await bridge.provisionServerOwner({
                        ownerName:
                          provisioningOwnerName.trim(),

                        mobile:
                          provisioningMobile,

                        aadhaar:
                          provisioningAadhaar.length === 12
                            ? provisioningAadhaar
                            : undefined,

                        aadhaarConsent:
                          provisioningAadhaar.length === 12
                            ? provisioningAadhaarConsent
                            : undefined,

                        businessName:
                          provisioningBusinessName.trim(),

                        branchName:
                          provisioningBranchName.trim(),

                        username:
                          provisioningUsername.trim(),

                        validFrom:
                          provisioningValidFrom,

                        validUntil:
                          provisioningValidUntil,

                        openingWalletBalance:
                          Number(
                            provisioningOpeningWalletBalance,
                          ),
                      });

                    if (!result.success) {
                      // FINORA_PROVISION_REJECTION_UI_SYNC_V1
                      if (
                        result.error?.toLowerCase().includes(
                          "administrator credential",
                        )
                      ) {
                        setServerAdminCredentialConfigured(false);
                        setServerAdminCredentialState("ERROR");
                        setServerAdminCredentialError(result.error);
                      }
                      throw new Error(
                        result.error ??
                          "FINORA production owner provisioning failed.",
                      );
                    }

                    if (!result.data) {
                      throw new Error(
                        "FINORA production server returned no provisioning result.",
                      );
                    }

                    setServerProvisioningResult(
                      result.data,
                    );

                    setTarget((current) => ({
                      ...current,
                      ownerId:
                        result.data.owner.ownerId,
                      businessId:
                        result.data.business.businessId,
                      branchId:
                        result.data.branch.branchId,
                    }));

                    setProvisioningUserId(
                      result.data.credentials.userId,
                    );

                    setProvisioningUsername(
                      result.data.credentials.username,
                    );

                    setServerProvisioningState("SUCCESS");
                  } catch (error) {
                    setServerProvisioningError(
                      error instanceof Error
                        ? error.message
                        : "Unable to create FINORA production owner and branch.",
                    );

                    setServerProvisioningState("ERROR");
                  }
                }}
                style={{
                  minHeight: "44px",
                  padding: "0 20px",
                  border: 0,
                  borderRadius: "10px",
                  fontWeight: 750,
                  cursor:
                    serverProvisioningState === "CREATING"
                      ? "wait"
                      : serverAdminCredentialConfigured !== true
                        ? "not-allowed"
                        : "pointer",
                }}
              >
                {serverProvisioningState === "CREATING"
                  ? "Creating Owner & Branch..."
                  : "Create Owner & Branch"}
              </button>

              {/* FINORA_SERVER_OWNER_VALIDATION_SUMMARY_V1 */}
              {serverProvisioningHasInput &&
                serverProvisioningValidationErrors.length > 0 && (
                  <div
                    style={{
                      marginTop: "10px",
                      maxWidth: "720px",
                      padding: "10px 12px",
                      borderRadius: "9px",
                      border:
                        "1px solid rgba(248, 113, 113, 0.26)",
                      background:
                        "rgba(127, 29, 29, 0.10)",
                      color: "#fecaca",
                      fontSize: "11px",
                      lineHeight: 1.55,
                    }}
                  >
                    <strong>Complete before creating:</strong>
                    <ul
                      style={{
                        margin: "6px 0 0",
                        paddingLeft: "18px",
                      }}
                    >
                      {serverProvisioningValidationErrors.map(
                        (message) => (
                          <li key={message}>{message}</li>
                        ),
                      )}
                    </ul>
                  </div>
                )}
            </div>

            {/* FINORA_SERVER_OWNER_SUCCESS_CARD_V1 */}
            {serverProvisioningState === "ERROR" &&
              serverProvisioningError && (
                <div
                  role="alert"
                  style={{
                    padding: "14px 16px",
                    borderRadius: "12px",
                    border:
                      "1px solid rgba(248, 113, 113, 0.34)",
                    background:
                      "rgba(127, 29, 29, 0.16)",
                    color: "#fecaca",
                    fontSize: "12px",
                    lineHeight: 1.6,
                  }}
                >
                  {serverProvisioningError}
                </div>
              )}

            {serverProvisioningState === "SUCCESS" &&
              serverProvisioningResult && (
                <div
                  style={{
                    display: "grid",
                    gap: "16px",
                    padding: "18px",
                    borderRadius: "14px",
                    border:
                      "1px solid rgba(34, 197, 94, 0.36)",
                    background:
                      "rgba(20, 83, 45, 0.14)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: "14px",
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: "16px",
                          fontWeight: 800,
                          color: "#86efac",
                        }}
                      >
                        Owner & Branch Created Successfully
                      </div>

                      <div
                        style={{
                          marginTop: "5px",
                          fontSize: "12px",
                          color: "#cbd5e1",
                        }}
                      >
                        Production records are active. Share the temporary credentials securely with the owner.
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const credentialsText = [
                          `User ID: ${serverProvisioningResult.credentials.userId}`,
                          `Username: ${serverProvisioningResult.credentials.username}`,
                          `Temporary Password: ${serverProvisioningResult.credentials.temporaryPassword}`,
                          `Temporary Security Code: ${serverProvisioningResult.credentials.temporarySecurityCode}`,
                        ].join("\n");

                        void navigator.clipboard.writeText(
                          credentialsText,
                        );
                      }}
                      style={{
                        minHeight: "38px",
                        padding: "0 14px",
                        borderRadius: "9px",
                        border:
                          "1px solid rgba(34, 197, 94, 0.42)",
                        background:
                          "rgba(34, 197, 94, 0.12)",
                        color: "#dcfce7",
                        fontWeight: 750,
                        cursor: "pointer",
                      }}
                    >
                      Copy Credentials
                    </button>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(220px, 1fr))",
                      gap: "10px",
                    }}
                  >
                    {[
                      ["Owner ID", serverProvisioningResult.owner.ownerId],
                      ["Business ID", serverProvisioningResult.business.businessId],
                      ["Branch ID", serverProvisioningResult.branch.branchId],
                      ["User ID", serverProvisioningResult.credentials.userId],
                      ["Username", serverProvisioningResult.credentials.username],
                      ["Temporary Password", serverProvisioningResult.credentials.temporaryPassword],
                      ["Temporary Security Code", serverProvisioningResult.credentials.temporarySecurityCode],
                      ["Subscription ID", serverProvisioningResult.subscription.subscriptionId],
                      ["Valid From", serverProvisioningResult.subscription.validFrom],
                      ["Valid Until", serverProvisioningResult.subscription.validUntil],
                      ["Remaining Days", String(serverProvisioningResult.subscription.remainingDays)],
                      ["Wallet ID", serverProvisioningResult.wallet.walletId],
                      ["Wallet Balance", `${String.fromCharCode(8377)}${serverProvisioningResult.wallet.balanceInr}`],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        style={{
                          padding: "10px 12px",
                          borderRadius: "10px",
                          border:
                            "1px solid rgba(148, 163, 184, 0.18)",
                          background:
                            "rgba(15, 23, 42, 0.48)",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "10px",
                            fontWeight: 750,
                            letterSpacing: "0.05em",
                            color: "#94a3b8",
                            textTransform:
                              "uppercase",
                          }}
                        >
                          {label}
                        </div>

                        <div
                          style={{
                            marginTop: "5px",
                            fontSize: "13px",
                            fontWeight: 700,
                            color: "#f8fafc",
                            overflowWrap:
                              "anywhere",
                          }}
                        >
                          {value}
                        </div>
                      </div>
                    ))}
                  </div>

                  {serverProvisioningResult.owner.aadhaar && (
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#94a3b8",
                      }}
                    >
                      Aadhaar: {serverProvisioningResult.owner.aadhaar.masked}
                      {" "}
                      ({serverProvisioningResult.owner.aadhaar.kycStatus})
                    </div>
                  )}

                  <div
                    style={{
                      paddingTop: "4px",
                      fontSize: "11px",
                      lineHeight: 1.55,
                      color: "#fbbf24",
                    }}
                  >
                    Temporary credentials should be shared once through a secure channel. The owner must change the password and security code at first login.
                  </div>
                </div>
              )}


            {provisioningDraftGenerated && (
              <div
                style={{
                  display: "grid",
                  gap: "12px",
                  padding: "16px",
                  borderRadius: "12px",
                  border:
                    "1px solid rgba(96, 165, 250, 0.28)",
                  background:
                    "rgba(30, 64, 175, 0.08)",
                }}
              >
                <strong>
                  Owner Device Authorization
                </strong>

                <span
                  style={{
                    fontSize: "12px",
                    lineHeight: 1.55,
                    color: "#94a3b8",
                  }}
                >
                  Open the Installation Enrollment Request exported by
                  the owner device. FINORA verifies the native device
                  binding before issuing the signed response.
                </span>

                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "10px",
                  }}
                >
                  <button
                    type="button"
                    disabled={
                      enrollmentOpenState === "OPENING"
                    }
                    onClick={() => {
                      void openVerifiedEnrollmentRequest();
                    }}
                    style={{
                      minHeight: "40px",
                      padding: "0 16px",
                      border:
                        "1px solid rgba(96, 165, 250, 0.62)",
                      borderRadius: "9px",
                      fontWeight: 700,
                      cursor:
                        enrollmentOpenState === "OPENING"
                          ? "wait"
                          : "pointer",
                    }}
                  >
                    {enrollmentOpenState === "OPENING"
                      ? "Opening Request..."
                      : verifiedEnrollment &&
                          !verifiedEnrollment.cancelled
                        ? "Recipient Request Verified"
                        : "Open Owner Device Request"}
                  </button>

                  {verifiedEnrollment &&
                    !verifiedEnrollment.cancelled && (
                      <button
                        type="button"
                        disabled={
                          enrollmentResponseState === "EXPORTING"
                        }
                        onClick={() => {
                          void issueAndExportEnrollmentResponse();
                        }}
                        style={{
                          minHeight: "40px",
                          padding: "0 16px",
                          border: 0,
                          borderRadius: "9px",
                          fontWeight: 700,
                          cursor:
                            enrollmentResponseState === "EXPORTING"
                              ? "wait"
                              : "pointer",
                        }}
                      >
                        {enrollmentResponseState === "EXPORTING"
                          ? "Signing Response..."
                          : enrollmentResponseState === "SUCCESS"
                            ? "Signed Response Exported"
                            : "Issue & Export Signed Response"}
                      </button>
                    )}
                </div>

                {enrollmentOpenState === "ERROR" &&
                  enrollmentOpenError && (
                    <span
                      style={{
                        fontSize: "12px",
                        color: "#fca5a5",
                      }}
                    >
                      {enrollmentOpenError}
                    </span>
                  )}

                {verifiedEnrollment &&
                  !verifiedEnrollment.cancelled && (
                    <div
                      style={{
                        display: "grid",
                        gap: "4px",
                        fontSize: "12px",
                        overflowWrap: "anywhere",
                      }}
                    >
                      <span>
                        Installation ID: {verifiedEnrollment.installationId}
                      </span>

                      <span>
                        Binding Key ID: {verifiedEnrollment.bindingKeyId}
                      </span>

                      <span>
                        Fingerprint: {verifiedEnrollment.publicKeyFingerprint}
                      </span>

                      <span
                        style={{
                          color: "#86efac",
                        }}
                      >
                        Verified recipient binding ready.
                      </span>
                    </div>
                  )}

                {enrollmentResponseState === "ERROR" &&
                  enrollmentResponseError && (
                    <span
                      style={{
                        fontSize: "12px",
                        color: "#fca5a5",
                      }}
                    >
                      {enrollmentResponseError}
                    </span>
                  )}

                {enrollmentResponseState === "SUCCESS" &&
                  enrollmentResponseResult && (
                    <span
                      style={{
                        fontSize: "12px",
                        color: "#86efac",
                      }}
                    >
                      Signed response ready:{" "}
                      {enrollmentResponseResult.fileName}
                    </span>
                  )}
              </div>
            )}

            {provisioningDraftGenerated && (
              <div
                style={{
                  padding: "16px",
                  borderRadius: "12px",
                  border:
                    "1px solid rgba(34, 197, 94, 0.28)",
                  background:
                    "rgba(34, 197, 94, 0.08)",
                }}
              >
                <strong>
                  Provisioning draft ready.
                </strong>

                <div
                  style={{
                    marginTop: "8px",
                    display: "grid",
                    gap: "4px",
                    fontSize: "13px",
                  }}
                >
                  <span>
                    Owner: {provisioningOwnerName.trim()}
                  </span>

                  <span>
                    Business: {provisioningBusinessName.trim()}
                  </span>

                  <span>
                    Branch: {provisioningBranchName.trim()}
                  </span>

                  <span>
                    Owner ID: {target.ownerId}
                  </span>

                  <span>
                    Business ID: {target.businessId}
                  </span>

                  <span>
                    Branch ID: {target.branchId}
                  </span>

                  <span>
                    User ID: {provisioningUserId}
                  </span>

                  <span>
                    Username: {provisioningUsername}
                  </span>
                </div>

                <p
                  style={{
                    margin: "10px 0 0",
                    fontSize: "12px",
                    color: "#94a3b8",
                  }}
                >
                  FINORA identifiers and temporary credentials
                  will be created by the secure provisioning phase.
                </p>

                <div
                  style={{
                    marginTop: "14px",
                    display: "grid",
                    gap: "8px",
                  }}
                >
                  <button
                    type="button"
                    disabled={
                      branchAccessIssuanceState === "ISSUING" ||
                      !verifiedEnrollment ||
                      verifiedEnrollment.cancelled
                    }
                    onClick={() => {
                      if (
                        !verifiedEnrollment ||
                        verifiedEnrollment.cancelled
                      ) {
                        return;
                      }

                      void issueBranchAccessDraft({
                        target: {
                          ownerId: target.ownerId,
                          businessId: target.businessId,
                          branchId: target.branchId,
                          installationId:
                            verifiedEnrollment.installationId,
                          bindingKeyId:
                            verifiedEnrollment.bindingKeyId,
                          fingerprintAlgorithm:
                            verifiedEnrollment.fingerprintAlgorithm,
                          publicKeyFingerprint:
                            verifiedEnrollment.publicKeyFingerprint,
                        },

                        action: "AUTHORIZE_CREDENTIAL",

                        grantId: "",

                        userId:
                          provisioningUserId,

                        storageMode: "USB",

                        deviceAccessPolicy: "PORTABLE_USB",

                        administrativeStatus: "ACTIVE",

                        accessType: "REGISTERED",

                        validFrom: "",
                        validUntil: "",
                        grantCreatedAt: "",
                        grantUpdatedAt: "",

                        registrationCycle: "",
                        registrationPaymentAmount: "",
                        registrationPaymentMode: "CASH",
                        registrationPaidAt: "",
                        registrationPaymentReference: "",
                        registrationPaymentRemarks: "",

                        demoId: "",
                        demoRemarks: "",

                        credentialEnrollmentEnabled: true,

                        credentialAuthorizationId:
                          generateFinoraHumanId(),

                        credentialUsername:
                          provisioningUsername,

                        credentialFullName:
                          provisioningOwnerName.trim(),

                        credentialRole: "ADMIN",

                        credentialLifecycle:
                          "TEMPORARY_FIRST_LOGIN",
                      });
                    }}
                    style={{
                      minHeight: "42px",
                      padding: "0 16px",
                      border: 0,
                      borderRadius: "9px",
                      fontWeight: 700,
                      cursor:
                        branchAccessIssuanceState === "ISSUING" ||
                        !verifiedEnrollment ||
                        verifiedEnrollment.cancelled
                          ? "not-allowed"
                          : "pointer",
                    }}
                  >
                    {branchAccessIssuanceState === "ISSUING"
                      ? "Issuing Temporary Authorization..."
                      : branchAccessIssuanceState === "SUCCESS"
                        ? "Temporary Credential Authorization Ready"
                        : "Issue Temporary Credential Authorization"}
                  </button>

                  {branchAccessIssuanceState === "ERROR" &&
                    branchAccessIssuanceError && (
                      <span
                        style={{
                          fontSize: "12px",
                          color: "#fca5a5",
                        }}
                      >
                        {branchAccessIssuanceError}
                      </span>
                    )}

                  {branchAccessIssuanceState === "SUCCESS" &&
                    branchAccessSignedPackage && (
                      <>
                      <span
                        style={{
                          fontSize: "12px",
                          color: "#86efac",
                          overflowWrap:
                            "anywhere",
                        }}
                      >
                        Signed temporary credential authorization ready.
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          const serialized = JSON.stringify(
                            branchAccessSignedPackage,
                            null,
                            2,
                          );

                          const blob = new Blob(
                            [serialized],
                            {
                              type: "application/json;charset=utf-8",
                            },
                          );

                          const url = URL.createObjectURL(blob);
                          const downloadAnchor = document.createElement("a");

                          downloadAnchor.href = url;
                          downloadAnchor.download =
                            "BRANCH3-SIGNED-BRANCH-ACCESS.json";

                          document.body.appendChild(downloadAnchor);
                          downloadAnchor.click();
                          downloadAnchor.remove();
                          URL.revokeObjectURL(url);
                        }}
                        style={{
                          marginTop: "8px",
                          padding: "8px 12px",
                          borderRadius: "8px",
                          cursor: "pointer",
                        }}
                      >
                        Backup Signed Package
                      </button>

                      </>
                    )}
                      <label
                        style={{
                          marginTop: "8px",
                          padding: "8px 12px",
                          borderRadius: "8px",
                          cursor: "pointer",
                          background: "#f8fafc",
                          color: "#020617",
                          textAlign: "center",
                        }}
                      >
                        Restore Signed Package
                        <input
                          type="file"
                          accept=".json,application/json"
                          style={{ display: "none" }}
                          onChange={async (event) => {
                            const file = event.currentTarget.files?.[0];

                            event.currentTarget.value = "";

                            if (!file) {
                              return;
                            }

                            try {
                              const parsed: unknown = JSON.parse(
                                await file.text(),
                              );

                              if (
                                typeof parsed !== "object" ||
                                parsed === null ||
                                Array.isArray(parsed)
                              ) {
                                throw new Error(
                                  "Signed package backup must contain one JSON object.",
                                );
                              }

                              const candidate = parsed as Record<string, unknown>;

                              if (candidate.purpose !== "BRANCH_ACCESS") {
                                throw new Error(
                                  "Only a FINORA BRANCH_ACCESS signed package can be restored here.",
                                );
                              }

                              buildFinoraControlBundleIssuanceRequest({
                                target,
                                packages: [candidate],
                              });

                              setBranchAccessSignedPackage(candidate);
                              setBranchAccessIssuanceState("SUCCESS");
                              setBranchAccessIssuanceError(undefined);
                              setBundleExportState("IDLE");
                              setBundleExportError(undefined);
                              setBundleExportResult(undefined);
                            } catch (error) {
                              setBranchAccessIssuanceError(
                                error instanceof Error
                                  ? error.message
                                  : "Unable to restore signed Branch Access package.",
                              );
                              setBranchAccessIssuanceState("ERROR");
                            }
                          }}
                        />
                      </label>

                  <span
                    style={{
                      fontSize: "11px",
                      lineHeight: 1.5,
                      color: "#94a3b8",
                    }}
                  >
                    The owner device must import the signed enrollment response
                    before credential enrollment. Temporary Password and Security
                    Code are never stored inside this signed package.
                  </span>
                </div>
              </div>
            )}
          </section>
        )}

      {workflow === "BRANCH_ACTIVATION" && !newBranchProvisioning && (
          <FinoraControlCenterBranchActivationForm
            target={target}
            onIssue={(draft) => {
              void issueBranchActivationDraft(draft);
            }}
          />
        )}

      {workflow === "BRANCH_ACCESS" && (
        <section           data-finora-branch-access-card="true"         >
        <FinoraControlCenterBranchAccessForm
          key={`${selectedBranch?.identity.branchId ?? "manual"}:${branchAccessInitialAction}:${workspaceFocusRequestId}`}
          target={target}
          initialAction={
            branchAccessInitialAction
          }
          initialGrantId={
            selectedBranch?.access?.grantId
          }
          initialUserId={
            selectedBranch?.access?.userId
          }
          initialGrantCreatedAt={
            selectedBranch?.access?.grantCreatedAt
          }
          initialAccessType={
            selectedBranch?.access?.accessType
          }
          initialAdministrativeStatus={
            selectedBranch?.access?.administrativeStatus
          }
          initialStorageMode={
            selectedBranch?.access?.storageMode
          }
          initialDeviceAccessPolicy={
            selectedBranch?.access?.deviceAccessPolicy
          }
          initialCurrentValidUntil={
            selectedBranch?.access?.validUntil
          }
          onIssue={(draft) => {
            void issueBranchAccessDraft(draft);
          }}
        />
        </section>
      )}
      {workflow === "DEVICE_REVOCATION" && (
        <FinoraControlCenterDeviceRevocationForm
          target={target}
          onIssue={(draft) => {
            void issueDeviceRevocationDraft(draft);
          }}
        />
      )}

      {workflow === "STORAGE_ENTITLEMENT" && (
        <FinoraControlCenterStorageEntitlementForm
          target={target}
          onIssue={(draft) => {
            void issueStorageEntitlementDraft(draft);
          }}
          onIssuePortable={(draft) => {
            void issuePortableStorageEntitlementDraft(
              draft,
            );
          }}
        />
      )}

      {workflow === "STORAGE_ENTITLEMENT" &&
        storageIssuanceState !== "IDLE" && (
          <section
            aria-live="polite"
            style={{
              marginTop: "20px",
              borderTop: "1px solid rgba(148, 163, 184, 0.18)",
              paddingTop: "18px",
            }}
          >
            <h3
              style={{
                margin: "0 0 10px",
                fontSize: "14px",
                fontWeight: 650,
              }}
            >
              Storage Entitlement Issuance Result
            </h3>

            {storageIssuanceState === "ISSUING" && (
              <p
                style={{
                  margin: 0,
                  fontSize: "12px",
                  opacity: 0.72,
                }}
              >
                Issuing signed Storage Entitlement package...
              </p>
            )}

            {storageIssuanceState === "ERROR" && storageIssuanceError && (
              <p
                style={{
                  margin: 0,
                  fontSize: "12px",
                  lineHeight: 1.55,
                  color: "#fca5a5",
                }}
              >
                {storageIssuanceError}
              </p>
            )}

            {storageIssuanceState === "SUCCESS" && storageSignedPackage && (
              <>
                <p
                  style={{
                    margin: "0 0 10px",
                    fontSize: "12px",
                    color: "#86efac",
                  }}
                >
                  Signed Storage Entitlement package issued successfully.
                </p>

                <pre
                  style={{
                    margin: 0,
                    maxHeight: "360px",
                    overflow: "auto",
                    border: "1px solid rgba(148, 163, 184, 0.2)",
                    borderRadius: "9px",
                    padding: "12px",
                    fontSize: "11px",
                    lineHeight: 1.5,
                    background: "rgba(2, 6, 23, 0.5)",
                    color: "#cbd5e1",
                    whiteSpace: "pre-wrap",
                    overflowWrap: "anywhere",
                  }}
                >
                  {JSON.stringify(storageSignedPackage, null, 2)}
                </pre>

                <p
                  style={{
                    margin: "10px 0 0",
                    fontSize: "11px",
                    opacity: 0.58,
                  }}
                >
                  Signed package display only. Use the workspace-level Export .finora action to bundle currently issued packages.
                </p>
              </>
            )}
          </section>
        )}

      {workflow === "BUSINESS_PROFILE" && (
        <FinoraControlCenterBusinessProfileForm
          target={target}
          initialProfileId={
            selectedBranch?.profile?.profileId ??
            ""
          }
          initialBusinessCode={
            selectedBranch?.identity.businessCode ??
            ""
          }
          initialBranchCode={
            selectedBranch?.identity.branchCode ??
            ""
          }
          initialBusinessName={
            selectedBranch?.profile?.businessName ??
            ""
          }
          initialBranchName={
            selectedBranch?.profile?.branchName ??
            ""
          }
          initialCreatedAt={
            selectedBranch?.profile?.createdAt ??
            ""
          }
          initialUpdatedAt={
            selectedBranch?.profile?.updatedAt ??
            ""
          }
          onIssue={(draft) => {
            void issueBusinessProfileDraft(draft);
          }}
        />
      )}

      {workflow === "BUSINESS_PROFILE" &&
        businessProfileIssuanceState !== "IDLE" && (
          <section
            aria-live="polite"
            style={{
              marginTop: "20px",
              borderTop: "1px solid rgba(148, 163, 184, 0.18)",
              paddingTop: "18px",
            }}
          >
            <h3
              style={{
                margin: "0 0 10px",
                fontSize: "14px",
                fontWeight: 650,
              }}
            >
              Business Profile Issuance Result
            </h3>

            {businessProfileIssuanceState === "ISSUING" && (
              <p
                style={{
                  margin: 0,
                  fontSize: "12px",
                  opacity: 0.72,
                }}
              >
                Issuing signed Business Profile package...
              </p>
            )}

            {businessProfileIssuanceState === "ERROR" &&
              businessProfileIssuanceError && (
                <p
                  style={{
                    margin: 0,
                    fontSize: "12px",
                    lineHeight: 1.55,
                    color: "#fca5a5",
                  }}
                >
                  {businessProfileIssuanceError}
                </p>
              )}

            {businessProfileIssuanceState === "SUCCESS" &&
              businessProfileSignedPackage && (
                <>
                  <p
                    style={{
                      margin: "0 0 10px",
                      fontSize: "12px",
                      color: "#86efac",
                    }}
                  >
                    Signed Business Profile package issued successfully.
                  </p>

                  <pre
                    style={{
                      margin: 0,
                      maxHeight: "360px",
                      overflow: "auto",
                      border: "1px solid rgba(148, 163, 184, 0.2)",
                      borderRadius: "9px",
                      padding: "12px",
                      fontSize: "11px",
                      lineHeight: 1.5,
                      background: "rgba(2, 6, 23, 0.5)",
                      color: "#cbd5e1",
                      whiteSpace: "pre-wrap",
                      overflowWrap: "anywhere",
                    }}
                  >
                    {JSON.stringify(businessProfileSignedPackage, null, 2)}
                  </pre>

                  <p
                    style={{
                      margin: "10px 0 0",
                      fontSize: "11px",
                      opacity: 0.58,
                    }}
                  >
                    Signed package display only. Use the workspace-level Export .finora action to bundle currently issued packages.
                  </p>
                </>
              )}
          </section>
        )}

      {workflow === "PRICING_POLICY" && (
        <FinoraControlCenterPricingPolicyForm
          target={target}
          onIssue={(draft) => {
            void issuePricingPolicyDraft(draft);
          }}
        />
      )}

      {workflow === "PRICING_POLICY" &&
        pricingPolicyIssuanceState !== "IDLE" && (
          <section
            aria-live="polite"
            style={{
              marginTop: "20px",
              borderTop: "1px solid rgba(148, 163, 184, 0.18)",
              paddingTop: "18px",
            }}
          >
            <h3
              style={{
                margin: "0 0 10px",
                fontSize: "14px",
                fontWeight: 650,
              }}
            >
              Pricing Policy Issuance Result
            </h3>

            {pricingPolicyIssuanceState === "ISSUING" && (
              <p
                style={{
                  margin: 0,
                  fontSize: "12px",
                  opacity: 0.72,
                }}
              >
                Issuing signed Pricing Policy package...
              </p>
            )}

            {pricingPolicyIssuanceState === "ERROR" &&
              pricingPolicyIssuanceError && (
                <p
                  style={{
                    margin: 0,
                    fontSize: "12px",
                    lineHeight: 1.55,
                    color: "#fca5a5",
                  }}
                >
                  {pricingPolicyIssuanceError}
                </p>
              )}

            {pricingPolicyIssuanceState === "SUCCESS" &&
              pricingPolicySignedPackage && (
                <>
                  <p
                    style={{
                      margin: "0 0 10px",
                      fontSize: "12px",
                      color: "#86efac",
                    }}
                  >
                    Signed Pricing Policy package issued successfully.
                  </p>

                  <pre
                    style={{
                      margin: 0,
                      maxHeight: "360px",
                      overflow: "auto",
                      border: "1px solid rgba(148, 163, 184, 0.2)",
                      borderRadius: "9px",
                      padding: "12px",
                      fontSize: "11px",
                      lineHeight: 1.5,
                      background: "rgba(2, 6, 23, 0.5)",
                      color: "#cbd5e1",
                      whiteSpace: "pre-wrap",
                      overflowWrap: "anywhere",
                    }}
                  >
                    {JSON.stringify(pricingPolicySignedPackage, null, 2)}
                  </pre>

                  <p
                    style={{
                      margin: "10px 0 0",
                      fontSize: "11px",
                      opacity: 0.58,
                    }}
                  >
                    Signed package display only. Use the workspace-level Export .finora action to bundle currently issued packages.
                  </p>
                </>
              )}
          </section>
        )}

      {workflow === "WALLET_RECHARGE" && (
        <section
          aria-live="polite"
          style={{
            marginBottom: "14px",
            border: "1px solid rgba(56, 189, 248, 0.24)",
            borderRadius: "12px",
            padding: "16px",
            background: "rgba(2, 132, 199, 0.06)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: "16px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <h3
                style={{
                  margin: 0,
                  fontSize: "15px",
                  fontWeight: 650,
                }}
              >
                Recharge Request Approval
              </h3>

              <p
                style={{
                  margin: "6px 0 0",
                  maxWidth: "760px",
                  fontSize: "12px",
                  lineHeight: 1.55,
                  opacity: 0.7,
                }}
              >
                Import the owner&apos;s signed .finora request. FINORA
                verifies the exact Branch Registry installation binding
                before displaying this locked review. Filename is
                convenience metadata only.
              </p>
            </div>

            <button
              type="button"
              disabled={
                walletRechargeRequestOpenState === "OPENING" ||
                walletRechargeApprovalState === "EXPORTING" ||
                walletRechargeDeclineState === "EXPORTING"
              }
              onClick={() => {
                void openWalletRechargeRequest();
              }}
              style={{
                border: "1px solid rgba(56, 189, 248, 0.42)",
                borderRadius: "9px",
                padding: "10px 14px",
                font: "inherit",
                fontSize: "12px",
                fontWeight: 650,
                cursor:
                  walletRechargeRequestOpenState === "OPENING"
                    ? "wait"
                    : "pointer",
                color: "#bae6fd",
                background: "rgba(3, 105, 161, 0.18)",
                opacity:
                  walletRechargeRequestOpenState === "OPENING"
                    ? 0.65
                    : 1,
              }}
            >
              {walletRechargeRequestOpenState === "OPENING"
                ? "Verifying Request..."
                : "Import Recharge Request"}
            </button>
          </div>

          {walletRechargeRequestOpenState === "ERROR" &&
            walletRechargeRequestOpenError && (
              <p
                style={{
                  margin: "14px 0 0",
                  fontSize: "12px",
                  lineHeight: 1.55,
                  color: "#fca5a5",
                }}
              >
                {walletRechargeRequestOpenError}
              </p>
            )}

          {walletRechargeRequestOpenState === "SUCCESS" &&
            verifiedWalletRechargeRequest && (
              <div
                style={{
                  marginTop: "16px",
                  border: "1px solid rgba(74, 222, 128, 0.28)",
                  borderRadius: "10px",
                  padding: "14px",
                  background: "rgba(22, 101, 52, 0.08)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "12px",
                    flexWrap: "wrap",
                    marginBottom: "14px",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: "#86efac",
                      }}
                    >
                      Cryptographically Verified Request
                    </div>

                    <div
                      style={{
                        marginTop: "5px",
                        fontSize: "24px",
                        fontWeight: 700,
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {formatWalletRechargeAmount(
                        verifiedWalletRechargeRequest.amountMinor,
                      )}
                    </div>
                  </div>

                  <div
                    style={{
                      border: "1px solid rgba(74, 222, 128, 0.3)",
                      borderRadius: "999px",
                      padding: "6px 10px",
                      fontSize: "11px",
                      fontWeight: 650,
                      color: "#bbf7d0",
                    }}
                  >
                    {verifiedWalletRechargeRequest.paymentMethod}
                  </div>
                </div>

                <dl
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(var(--finora-cc-form-columns, 3), minmax(0, 1fr))",
                    gap: "12px",
                    margin: 0,
                  }}
                >
                  {[
                    [
                      "Business / Branch",
                      `${verifiedWalletRechargeRequest.businessCode} / ${verifiedWalletRechargeRequest.branchCode}`,
                    ],
                    [
                      "Owner / Business / Branch IDs",
                      `${verifiedWalletRechargeRequest.ownerId} / ${verifiedWalletRechargeRequest.businessId} / ${verifiedWalletRechargeRequest.branchId}`,
                    ],
                    [
                      "Payment Reference",
                      verifiedWalletRechargeRequest.paymentReference,
                    ],
                    [
                      "Payment Source",
                      verifiedWalletRechargeRequest.paymentSource,
                    ],
                    [
                      "Requested At",
                      verifiedWalletRechargeRequest.requestedAt,
                    ],
                    [
                      "Verified Installation",
                      verifiedWalletRechargeRequest.installationId,
                    ],
                    [
                      "Binding Key",
                      verifiedWalletRechargeRequest.bindingKeyId,
                    ],
                    [
                      "Binding Fingerprint",
                      verifiedWalletRechargeRequest.publicKeyFingerprint,
                    ],
                    [
                      "Request ID",
                      verifiedWalletRechargeRequest.requestId,
                    ],
                    [
                      "Imported File",
                      verifiedWalletRechargeRequest.fileName,
                    ],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      style={{
                        minWidth: 0,
                        borderTop:
                          "1px solid rgba(148, 163, 184, 0.14)",
                        paddingTop: "9px",
                      }}
                    >
                      <dt
                        style={{
                          margin: 0,
                          fontSize: "10px",
                          fontWeight: 700,
                          letterSpacing: "0.06em",
                          textTransform: "uppercase",
                          opacity: 0.55,
                        }}
                      >
                        {label}
                      </dt>

                      <dd
                        style={{
                          margin: "5px 0 0",
                          fontSize: "12px",
                          lineHeight: 1.5,
                          overflowWrap: "anywhere",
                          color: "#e2e8f0",
                        }}
                      >
                        {value}
                      </dd>
                    </div>
                  ))}
                </dl>

                <div
                  style={{
                    marginTop: "16px",
                    paddingTop: "14px",
                    borderTop:
                      "1px solid rgba(74, 222, 128, 0.18)",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    type="button"
                    disabled={
                      walletRechargeApprovalState === "EXPORTING" ||
                      walletRechargeApprovalState === "SUCCESS" ||
                      walletRechargeDeclineState === "EXPORTING" ||
                      walletRechargeDeclineState === "SUCCESS"
                    }
                    onClick={() => {
                      void approveAndExportVerifiedWalletRechargeRequest();
                    }}
                    style={{
                      border:
                        "1px solid rgba(74, 222, 128, 0.48)",
                      borderRadius: "9px",
                      padding: "10px 14px",
                      font: "inherit",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor:
                        walletRechargeApprovalState === "EXPORTING" ||
                        walletRechargeDeclineState === "EXPORTING"
                          ? "wait"
                          : walletRechargeApprovalState === "SUCCESS" ||
                              walletRechargeDeclineState === "SUCCESS"
                            ? "default"
                            : "pointer",
                      color: "#dcfce7",
                      background:
                        "rgba(22, 163, 74, 0.2)",
                      opacity:
                        walletRechargeApprovalState === "EXPORTING" ||
                        walletRechargeApprovalState === "SUCCESS" ||
                        walletRechargeDeclineState === "EXPORTING" ||
                        walletRechargeDeclineState === "SUCCESS"
                          ? 0.7
                          : 1,
                    }}
                  >
                    {walletRechargeApprovalState === "EXPORTING"
                      ? "Approving..."
                      : walletRechargeApprovalState === "SUCCESS"
                        ? "Approved"
                        : "Approve"}
                  </button>

                  <button
                    type="button"
                    disabled={
                      walletRechargeDeclineState === "EXPORTING" ||
                      walletRechargeDeclineState === "SUCCESS" ||
                      walletRechargeApprovalState === "EXPORTING" ||
                      walletRechargeApprovalState === "SUCCESS"
                    }
                    onClick={() => {
                      void declineAndExportVerifiedWalletRechargeRequest();
                    }}
                    style={{
                      border:
                        "1px solid rgba(248, 113, 113, 0.48)",
                      borderRadius: "9px",
                      padding: "10px 14px",
                      font: "inherit",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor:
                        walletRechargeDeclineState === "EXPORTING" ||
                        walletRechargeApprovalState === "EXPORTING"
                          ? "wait"
                          : walletRechargeDeclineState === "SUCCESS" ||
                              walletRechargeApprovalState === "SUCCESS"
                            ? "default"
                            : "pointer",
                      color: "#fecaca",
                      background:
                        "rgba(185, 28, 28, 0.18)",
                      opacity:
                        walletRechargeDeclineState === "EXPORTING" ||
                        walletRechargeDeclineState === "SUCCESS" ||
                        walletRechargeApprovalState === "EXPORTING" ||
                        walletRechargeApprovalState === "SUCCESS"
                          ? 0.7
                          : 1,
                    }}
                  >
                    {walletRechargeDeclineState === "EXPORTING"
                      ? "Declining..."
                      : walletRechargeDeclineState === "SUCCESS"
                        ? "Declined"
                        : "Decline"}
                  </button>

                  {walletRechargeDeclineState === "ERROR" &&
                    walletRechargeDeclineError && (
                      <span
                        style={{
                          fontSize: "12px",
                          lineHeight: 1.5,
                          color: "#fca5a5",
                        }}
                      >
                        {walletRechargeDeclineError}
                      </span>
                    )}

                  {walletRechargeDeclineState === "SUCCESS" &&
                    walletRechargeDeclineFileName && (
                      <span
                        style={{
                          fontSize: "12px",
                          lineHeight: 1.5,
                          color: "#fca5a5",
                          overflowWrap: "anywhere",
                        }}
                      >
                        Decline exported:{" "}
                        <strong>
                          {walletRechargeDeclineFileName}
                        </strong>
                      </span>
                    )}

                  {walletRechargeApprovalState === "ERROR" &&
                    walletRechargeApprovalError && (
                      <span
                        style={{
                          fontSize: "12px",
                          lineHeight: 1.5,
                          color: "#fca5a5",
                        }}
                      >
                        {walletRechargeApprovalError}
                      </span>
                    )}

                  {walletRechargeApprovalState === "SUCCESS" &&
                    walletRechargeApprovalFileName && (
                      <span
                        style={{
                          fontSize: "12px",
                          lineHeight: 1.5,
                          color: "#86efac",
                          overflowWrap: "anywhere",
                        }}
                      >
                        Wallet Recharge approved successfully. DONE file downloaded.
                      </span>
                    )}
                </div>
              </div>
            )}
        </section>
      )}

      {workflow === "WALLET_RECHARGE" && (
        <FinoraControlCenterWalletRechargeForm
          target={target}
          onIssue={(draft) => {
            void issueWalletRechargeDraft(draft);
          }}
        />
      )}

      {workflow === "WALLET_RECHARGE" &&
        walletRechargeIssuanceState !== "IDLE" && (
          <section
            aria-live="polite"
            style={{
              marginTop: "20px",
              borderTop: "1px solid rgba(148, 163, 184, 0.18)",
              paddingTop: "18px",
            }}
          >
            <h3
              style={{
                margin: "0 0 10px",
                fontSize: "14px",
                fontWeight: 650,
              }}
            >
              Wallet Recharge Issuance Result
            </h3>

            {walletRechargeIssuanceState === "ISSUING" && (
              <p
                style={{
                  margin: 0,
                  fontSize: "12px",
                  opacity: 0.72,
                }}
              >
                Issuing signed Wallet Recharge package...
              </p>
            )}

            {walletRechargeIssuanceState === "ERROR" &&
              walletRechargeIssuanceError && (
                <p
                  style={{
                    margin: 0,
                    fontSize: "12px",
                    lineHeight: 1.55,
                    color: "#fca5a5",
                  }}
                >
                  {walletRechargeIssuanceError}
                </p>
              )}

            {walletRechargeIssuanceState === "SUCCESS" &&
              walletRechargeSignedPackage && (
                <>
                  <p
                    style={{
                      margin: "0 0 10px",
                      fontSize: "12px",
                      color: "#86efac",
                    }}
                  >
                    Signed Wallet Recharge package issued successfully.
                  </p>

                  <pre
                    style={{
                      margin: 0,
                      maxHeight: "360px",
                      overflow: "auto",
                      border: "1px solid rgba(148, 163, 184, 0.2)",
                      borderRadius: "9px",
                      padding: "12px",
                      fontSize: "11px",
                      lineHeight: 1.5,
                      background: "rgba(2, 6, 23, 0.5)",
                      color: "#cbd5e1",
                      whiteSpace: "pre-wrap",
                      overflowWrap: "anywhere",
                    }}
                  >
                    {JSON.stringify(walletRechargeSignedPackage, null, 2)}
                  </pre>

                  <p
                    style={{
                      margin: "10px 0 0",
                      fontSize: "11px",
                      opacity: 0.58,
                    }}
                  >
                    Signed package display only. Use the workspace-level Export .finora action to bundle currently issued packages.
                  </p>
                </>
              )}
          </section>
        )}

      {workflow === "BRANCH_ACCESS" &&
        branchAccessIssuanceState !== "IDLE" && (
          <section
            aria-live="polite"
            style={{
              marginTop: "20px",
              borderTop: "1px solid rgba(148, 163, 184, 0.18)",
              paddingTop: "18px",
            }}
          >
            <h3
              style={{
                margin: "0 0 10px",
                fontSize: "14px",
                fontWeight: 650,
              }}
            >
              Branch Access Issuance Result
            </h3>

            {branchAccessIssuanceState === "ISSUING" && (
              <p
                style={{
                  margin: 0,
                  fontSize: "12px",
                  opacity: 0.72,
                }}
              >
                Issuing signed Branch Access package...
              </p>
            )}

            {branchAccessIssuanceState === "ERROR" &&
              branchAccessIssuanceError && (
                <p
                  style={{
                    margin: 0,
                    fontSize: "12px",
                    lineHeight: 1.55,
                    color: "#fca5a5",
                  }}
                >
                  {branchAccessIssuanceError}
                </p>
              )}

            {branchAccessIssuanceState === "SUCCESS" &&
              branchAccessSignedPackage && (
                <>
                  <p
                    style={{
                      margin: "0 0 10px",
                      fontSize: "12px",
                      color: "#86efac",
                    }}
                  >
                    Signed Branch Access package issued successfully.
                  </p>

                  <pre
                    style={{
                      margin: 0,
                      maxHeight: "360px",
                      overflow: "auto",
                      border: "1px solid rgba(148, 163, 184, 0.2)",
                      borderRadius: "9px",
                      padding: "12px",
                      fontSize: "11px",
                      lineHeight: 1.5,
                      background: "rgba(2, 6, 23, 0.5)",
                      color: "#cbd5e1",
                      whiteSpace: "pre-wrap",
                      overflowWrap: "anywhere",
                    }}
                  >
                    {JSON.stringify(
                      branchAccessSignedPackage,
                      null,
                      2,
                    )}
                  </pre>

                  <p
                    style={{
                      margin: "10px 0 0",
                      fontSize: "11px",
                      opacity: 0.58,
                    }}
                  >
                    Signed package display only. Use the workspace-level Export
                    .finora action to bundle currently issued packages.
                  </p>
                </>
              )}
          </section>
        )}
      {workflow === "DEVICE_REVOCATION" &&
        deviceRevocationIssuanceState !== "IDLE" && (
          <section
            aria-live="polite"
            style={{
              marginTop: "20px",
              borderTop: "1px solid rgba(148, 163, 184, 0.18)",
              paddingTop: "18px",
            }}
          >
            <h3
              style={{
                margin: "0 0 10px",
                fontSize: "14px",
                fontWeight: 650,
              }}
            >
              Device Revocation Issuance Result
            </h3>

            {deviceRevocationIssuanceState === "ISSUING" && (
              <p
                style={{
                  margin: 0,
                  fontSize: "12px",
                  opacity: 0.72,
                }}
              >
                Issuing signed Device Revocation package...
              </p>
            )}

            {deviceRevocationIssuanceState === "ERROR" &&
              deviceRevocationIssuanceError && (
                <p
                  style={{
                    margin: 0,
                    fontSize: "12px",
                    lineHeight: 1.55,
                    color: "#fca5a5",
                  }}
                >
                  {deviceRevocationIssuanceError}
                </p>
              )}

            {deviceRevocationIssuanceState === "SUCCESS" &&
              deviceRevocationSignedPackage && (
                <>
                  <p
                    style={{
                      margin: "0 0 10px",
                      fontSize: "12px",
                      color: "#86efac",
                    }}
                  >
                    Signed Device Revocation package issued successfully.
                  </p>

                  <pre
                    style={{
                      margin: 0,
                      maxHeight: "360px",
                      overflow: "auto",
                      border: "1px solid rgba(148, 163, 184, 0.2)",
                      borderRadius: "9px",
                      padding: "12px",
                      fontSize: "11px",
                      lineHeight: 1.5,
                      background: "rgba(2, 6, 23, 0.5)",
                      color: "#cbd5e1",
                      whiteSpace: "pre-wrap",
                      overflowWrap: "anywhere",
                    }}
                  >
                    {JSON.stringify(
                      deviceRevocationSignedPackage,
                      null,
                      2,
                    )}
                  </pre>

                  <p
                    style={{
                      margin: "10px 0 0",
                      fontSize: "11px",
                      opacity: 0.58,
                    }}
                  >
                    Signed package display only. Use the workspace-level Export .finora action to bundle currently issued packages.
                  </p>
                </>
              )}
          </section>
        )}

      {workflow === "BRANCH_ACTIVATION" && branchIssuanceState !== "IDLE" && (
        <section
          aria-live="polite"
          style={{
            marginTop: "20px",
            borderTop: "1px solid rgba(148, 163, 184, 0.18)",
            paddingTop: "18px",
          }}
        >
          <h3
            style={{
              margin: "0 0 10px",
              fontSize: "14px",
              fontWeight: 650,
            }}
          >
            Branch Activation Issuance Result
          </h3>

          {branchIssuanceState === "ISSUING" && (
            <p
              style={{
                margin: 0,
                fontSize: "12px",
                opacity: 0.72,
              }}
            >
              Issuing signed Branch Activation package...
            </p>
          )}

          {branchIssuanceState === "ERROR" && branchIssuanceError && (
            <p
              style={{
                margin: 0,
                fontSize: "12px",
                lineHeight: 1.55,
                color: "#fca5a5",
              }}
            >
              {branchIssuanceError}
            </p>
          )}

          {branchIssuanceState === "SUCCESS" && branchSignedPackage && (
            <>
              <p
                style={{
                  margin: "0 0 10px",
                  fontSize: "12px",
                  color: "#86efac",
                }}
              >
                Signed Branch Activation package issued successfully.
              </p>

              <pre
                style={{
                  margin: 0,
                  maxHeight: "360px",
                  overflow: "auto",
                  border: "1px solid rgba(148, 163, 184, 0.2)",
                  borderRadius: "9px",
                  padding: "12px",
                  fontSize: "11px",
                  lineHeight: 1.5,
                  background: "rgba(2, 6, 23, 0.5)",
                  color: "#cbd5e1",
                  whiteSpace: "pre-wrap",
                  overflowWrap: "anywhere",
                }}
              >
                {JSON.stringify(branchSignedPackage, null, 2)}
              </pre>

              <p
                style={{
                  margin: "10px 0 0",
                  fontSize: "11px",
                  opacity: 0.58,
                }}
              >
                Signed package display only. Use the workspace-level Export .finora action to bundle currently issued packages.
              </p>
            </>
          )}
        </section>
      )}
    </section>
  );
}




