import { useRef, useState } from "react";

import type {
  FinoraControlCenterEnrollmentOpenView,
} from "../../../../electron/control-center/finoraControlCenterPreload";

import type {
  FinoraBranchActivationFormDraft,
  FinoraBranchAccessFormDraft,
  FinoraBusinessProfileFormDraft,
  FinoraControlCenterIssuanceWorkflow,
  FinoraControlCenterTargetDraft,
  FinoraPricingPolicyFormDraft,
  FinoraStorageEntitlementFormDraft,
  FinoraWalletRechargeFormDraft,
} from "./FinoraControlCenterIssuanceForm.types";

import FinoraControlCenterBranchActivationForm from "./FinoraControlCenterBranchActivationForm";
import FinoraControlCenterBranchAccessForm from "./FinoraControlCenterBranchAccessForm";
import FinoraControlCenterStorageEntitlementForm from "./FinoraControlCenterStorageEntitlementForm";
import FinoraControlCenterBusinessProfileForm from "./FinoraControlCenterBusinessProfileForm";
import { FinoraControlCenterPricingPolicyForm } from "./FinoraControlCenterPricingPolicyForm";
import { FinoraControlCenterWalletRechargeForm } from "./FinoraControlCenterWalletRechargeForm";

import {
  buildFinoraBranchActivationIssuanceRequest,
  buildFinoraBranchAccessIssuanceRequest,
  buildFinoraBusinessProfileIssuanceRequest,
  buildFinoraPricingPolicyIssuanceRequest,
  buildFinoraStorageEntitlementIssuanceRequest,
  buildFinoraWalletRechargeIssuanceRequest,
} from "./FinoraControlCenterIssuancePayloadBuilder";

import {
  buildFinoraControlBundleIssuanceRequest,
} from "./FinoraControlBundleDraftBuilder";

/* ===========================================================
   FINORA ENTERPRISE OS™

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

    label: "Branch Access",

    description:
      "Issue or manage signed Branch Access and recipient credential authorization.",
  },
  {
    id: "STORAGE_ENTITLEMENT",

    label: "Storage Entitlement",

    description: "Issue signed LOCAL or USB storage entitlement state.",
  },
  {
    id: "BUSINESS_PROFILE",

    label: "Business Profile",

    description:
      "Issue or replace signed Business and Branch profile identity.",
  },
  {
    id: "PRICING_POLICY",

    label: "Pricing Policy",

    description: "Replace signed Loan Disbursement Pricing Override policy.",
  },
  {
    id: "WALLET_RECHARGE",

    label: "Wallet Recharge",

    description:
      "Issue signed Wallet Recharge authorization for verified payment evidence.",
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

export default function FinoraControlCenterIssuanceWorkspace() {
  const [workflow, setWorkflow] =
    useState<FinoraControlCenterIssuanceWorkflow>("BRANCH_ACTIVATION");

  const [target, setTarget] =
    useState<FinoraControlCenterTargetDraft>(EMPTY_TARGET);

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

  const bundleExportInFlightRef = useRef(false);

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

      setEnrollmentBusinessCode(
        "",
      );

      setEnrollmentBranchCode(
        "",
      );

      setEnrollmentResponseResult(
        undefined,
      );

      setEnrollmentResponseError(
        undefined,
      );

      setEnrollmentResponseState(
        "IDLE",
      );

      setTarget(
        (current) => ({
          ...current,

          installationId:
            enrollment.installationId,

          bindingKeyId:
            enrollment.bindingKeyId,

          fingerprintAlgorithm:
            enrollment.fingerprintAlgorithm,

          publicKeyFingerprint:
            enrollment.publicKeyFingerprint,
        }),
      );

      /*
       * A newly verified installation target invalidates any
       * previously issued package workspace state.
       *
       * This prevents signed packages for a previous target
       * from being mixed into the newly loaded enrollment.
       */
      setBranchSignedPackage(
        undefined,
      );

      setBranchIssuanceState(
        "IDLE",
      );

      setBranchIssuanceError(
        undefined,
      );

      setBranchAccessSignedPackage(
        undefined,
      );

      setBranchAccessIssuanceState(
        "IDLE",
      );

      setBranchAccessIssuanceError(
        undefined,
      );

      setStorageSignedPackage(
        undefined,
      );

      setStorageIssuanceState(
        "IDLE",
      );

      setStorageIssuanceError(
        undefined,
      );

      setBusinessProfileSignedPackage(
        undefined,
      );

      setBusinessProfileIssuanceState(
        "IDLE",
      );

      setBusinessProfileIssuanceError(
        undefined,
      );

      setPricingPolicySignedPackage(
        undefined,
      );

      setPricingPolicyIssuanceState(
        "IDLE",
      );

      setPricingPolicyIssuanceError(
        undefined,
      );

      setWalletRechargeSignedPackage(
        undefined,
      );

      setWalletRechargeIssuanceState(
        "IDLE",
      );

      setWalletRechargeIssuanceError(
        undefined,
      );

      setBundleExportResult(
        undefined,
      );

      setBundleExportState(
        "IDLE",
      );

      setBundleExportError(
        undefined,
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
            target.ownerId,

          businessId:
            target.businessId,

          branchId:
            target.branchId,

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
      storageSignedPackage,
      businessProfileSignedPackage,
      pricingPolicySignedPackage,
      walletRechargeSignedPackage,
    ].filter(
      (candidate) =>
        candidate !== undefined,
    ).length;

  return (
    <section
      data-finora-control-center-issuance-workspace="true"
      style={{
        marginTop: "22px",
        border: "1px solid rgba(148, 163, 184, 0.22)",
        borderRadius: "14px",
        padding: "22px",
        background: "rgba(15, 23, 42, 0.72)",
      }}
    >
      <header
        style={{
          marginBottom: "20px",
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: "18px",
            fontWeight: 650,
          }}
        >
          Signed Issuance Workspace
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
          Select one purpose-specific workflow and enter the exact installation
          target that the signed package must bind to.
        </p>
      </header>

      <div
        role="group"
        aria-label="FINORA issuance workflow"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
          gap: "10px",
          marginBottom: "22px",
        }}
      >
        {WORKFLOWS.map((item) => {
          const selected = workflow === item.id;

          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={selected}
              onClick={() => {
                setWorkflow(item.id);
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
          marginBottom: "20px",
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
              ? "Opening & Verifying…"
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

      <section>
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
            Signed Package Target
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
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: "14px",
          }}
        >
          <TargetField
            label="Owner ID"
            value={target.ownerId}
            placeholder="OWNER-..."
            readOnly={
              enrollmentResponseState === "SUCCESS"
            }
            onChange={(value) => {
              updateTarget("ownerId", value);
            }}
          />

          <TargetField
            label="Business ID"
            value={target.businessId}
            placeholder="BUSINESS-..."
            readOnly={
              enrollmentResponseState === "SUCCESS"
            }
            onChange={(value) => {
              updateTarget("businessId", value);
            }}
          />

          <TargetField
            label="Branch ID"
            value={target.branchId}
            placeholder="BRANCH-..."
            readOnly={
              enrollmentResponseState === "SUCCESS"
            }
            onChange={(value) => {
              updateTarget("branchId", value);
            }}
          />

          <TargetField
            label="Installation ID"
            value={target.installationId}
            placeholder="INSTALLATION-..."
            readOnly={
              verifiedEnrollment !== undefined &&
              !verifiedEnrollment.cancelled
            }
            onChange={(value) => {
              updateTarget("installationId", value);
            }}
          />

          <TargetField
            label="Binding Key ID"
            value={target.bindingKeyId}
            placeholder="FINORA-BINDING-..."
            readOnly={
              verifiedEnrollment !== undefined &&
              !verifiedEnrollment.cancelled
            }
            onChange={(value) => {
              updateTarget("bindingKeyId", value);
            }}
          />

          <TargetField
            label="Public Key Fingerprint"
            value={target.publicKeyFingerprint}
            placeholder="64-character SHA-256 hex fingerprint"
            readOnly={
              verifiedEnrollment !== undefined &&
              !verifiedEnrollment.cancelled
            }
            onChange={(value) => {
              updateTarget("publicKeyFingerprint", value);
            }}
          />

          <div
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
              Fingerprint Algorithm
            </span>

            <div
              style={{
                minHeight: "42px",
                display: "flex",
                alignItems: "center",
                boxSizing: "border-box",
                border: "1px solid rgba(148, 163, 184, 0.2)",
                borderRadius: "9px",
                padding: "9px 11px",
                fontSize: "13px",
                background: "rgba(30, 41, 59, 0.62)",
                color: "#cbd5e1",
              }}
            >
              {target.fingerprintAlgorithm}
            </div>
          </div>
        </div>
      </section>

      <section
        data-finora-enrollment-response-export="true"
        aria-live="polite"
        style={{
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
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: "14px",
            marginTop: "14px",
          }}
        >
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
              !target.ownerId.trim() ||
              !target.businessId.trim() ||
              !target.branchId.trim() ||
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
              ? "Issuing & Exporting…"
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

      <section
        data-finora-control-bundle-export="true"
        aria-live="polite"
        style={{
          marginTop: "20px",
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
                maxWidth: "720px",
                fontSize: "12px",
                lineHeight: 1.55,
                opacity: 0.7,
              }}
            >
              Export all currently issued signed packages for this exact
              installation target as one signed FINORA .finora bundle.
            </p>
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
              ? "Exporting…"
              : "Export .finora"}
          </button>
        </div>

        <p
          style={{
            margin: "12px 0 0",
            fontSize: "11px",
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

      {workflow === "BRANCH_ACTIVATION" && (
        <FinoraControlCenterBranchActivationForm
          target={target}
          onIssue={(draft) => {
            void issueBranchActivationDraft(draft);
          }}
        />
      )}

      {workflow === "BRANCH_ACCESS" && (
        <FinoraControlCenterBranchAccessForm
          target={target}
          onIssue={(draft) => {
            void issueBranchAccessDraft(draft);
          }}
        />
      )}
      {workflow === "STORAGE_ENTITLEMENT" && (
        <FinoraControlCenterStorageEntitlementForm
          target={target}
          onIssue={(draft) => {
            void issueStorageEntitlementDraft(draft);
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
                Issuing signed Storage Entitlement package…
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
                Issuing signed Business Profile package…
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
                Issuing signed Pricing Policy package…
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
                Issuing signed Wallet Recharge package…
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
                Issuing signed Branch Access package…
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
              Issuing signed Branch Activation package…
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
