import { useRef, useState } from "react";

import type {
  FinoraBranchActivationFormDraft,
  FinoraBusinessProfileFormDraft,
  FinoraControlCenterIssuanceWorkflow,
  FinoraControlCenterTargetDraft,
  FinoraPricingPolicyFormDraft,
  FinoraStorageEntitlementFormDraft,
  FinoraWalletRechargeFormDraft,
} from "./FinoraControlCenterIssuanceForm.types";

import FinoraControlCenterBranchActivationForm from "./FinoraControlCenterBranchActivationForm";
import FinoraControlCenterStorageEntitlementForm from "./FinoraControlCenterStorageEntitlementForm";
import FinoraControlCenterBusinessProfileForm from "./FinoraControlCenterBusinessProfileForm";
import { FinoraControlCenterPricingPolicyForm } from "./FinoraControlCenterPricingPolicyForm";
import { FinoraControlCenterWalletRechargeForm } from "./FinoraControlCenterWalletRechargeForm";

import {
  buildFinoraBranchActivationIssuanceRequest,
  buildFinoraBusinessProfileIssuanceRequest,
  buildFinoraPricingPolicyIssuanceRequest,
  buildFinoraStorageEntitlementIssuanceRequest,
  buildFinoraWalletRechargeIssuanceRequest,
} from "./FinoraControlCenterIssuancePayloadBuilder";

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
      "Issue or manage signed Branch Activation and Branch Access state.",
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
}

function TargetField({
  label,
  value,
  placeholder,
  onChange,
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
          gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
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
            onChange={(value) => {
              updateTarget("ownerId", value);
            }}
          />

          <TargetField
            label="Business ID"
            value={target.businessId}
            placeholder="BUSINESS-..."
            onChange={(value) => {
              updateTarget("businessId", value);
            }}
          />

          <TargetField
            label="Branch ID"
            value={target.branchId}
            placeholder="BRANCH-..."
            onChange={(value) => {
              updateTarget("branchId", value);
            }}
          />

          <TargetField
            label="Installation ID"
            value={target.installationId}
            placeholder="INSTALLATION-..."
            onChange={(value) => {
              updateTarget("installationId", value);
            }}
          />

          <TargetField
            label="Binding Key ID"
            value={target.bindingKeyId}
            placeholder="FINORA-BINDING-..."
            onChange={(value) => {
              updateTarget("bindingKeyId", value);
            }}
          />

          <TargetField
            label="Public Key Fingerprint"
            value={target.publicKeyFingerprint}
            placeholder="64-character SHA-256 hex fingerprint"
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

      {workflow === "BRANCH_ACTIVATION" && (
        <FinoraControlCenterBranchActivationForm
          target={target}
          onIssue={(draft) => {
            void issueBranchActivationDraft(draft);
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
                  Signed package display only. Bundle export is not performed by
                  this workflow.
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
                    Signed package display only. Bundle export is not performed
                    by this workflow.
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
                    Signed package display only. Bundle export is not performed
                    by this workflow.
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
                    Signed package display only. Bundle export is not performed
                    by this workflow.
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
                Signed package display only. Bundle export is not performed by
                this workflow.
              </p>
            </>
          )}
        </section>
      )}
    </section>
  );
}
