import {
  useCallback,
  useEffect,
  useState,
} from "react";
import FinoraControlCenterIncomePricingPanel from "./FinoraControlCenterIncomePricingPanel";
import FinoraControlCenterBranchPricingPanel from "./FinoraControlCenterBranchPricingPanel";

import type { FinoraControlCenterIssuanceWorkflow } from "./FinoraControlCenterIssuanceForm.types";

import FinoraControlCenterWalletHistoryPanel, {
  type FinoraControlCenterWalletHistoryScope,
} from "./FinoraControlCenterWalletHistoryPanel";

import type {
  FinoraControlCenterBranchRegistryView,
} from "../../../../electron/control-center/finoraControlCenterPreload";

import type {
  FinoraControlCenterBranchDirectoryMetadataView,
} from "../../../../electron/control-center/finoraControlCenterPreload";

import type {
  FinoraControlCenterBranchRegistryRecord,
} from "../../../../electron/control-center/finoraControlCenterBranchRegistry.types";

import {
  calculateFinoraControlCenterBranchValidity,
} from "../../../../electron/control-center/finoraControlCenterBranchValidity";

/* ===========================================================
   FINORA ENTERPRISE OS™

   CONTROL CENTER
   BRANCH REGISTRY PANEL

   RESPONSIBILITY:

   - Read the privileged Branch Registry snapshot
   - Display automatically provisioned branches as cards
   - Keep provisioned identity read-only
   - Show access validity derived from current time
   - Show Last Reported Wallet Balance as snapshot evidence
   - Show Last Sync without claiming continuous connectivity

   SECURITY:

   - Renderer receives read-only registry data only.
   - No registry mutation method exists here.
   - No private key material.
=========================================================== */

type BranchRegistryLoadState =
  | "LOADING"
  | "READY"
  | "UNAVAILABLE"
  | "ERROR";

function formatTimestamp(
  value:
    string | undefined,
): string {

  if (!value) {
    return "Not reported yet";
  }

  const timestamp =
    new Date(
      value,
    );

  if (
    !Number.isFinite(
      timestamp.getTime(),
    )
  ) {
    return value;
  }

  return timestamp.toLocaleString(
    "en-IN",
  );
}

function formatLastReportedWallet(
  record:
    FinoraControlCenterBranchRegistryRecord,
): string {

  const wallet =
    record.lastReportedWallet;

  if (!wallet) {
    return "Not reported yet";
  }

  const rupees =
    wallet.balanceMinor /
    100;

  return `₹${new Intl.NumberFormat(
    "en-IN",
    {
      minimumFractionDigits:
        0,
      maximumFractionDigits:
        0,
    },
  ).format(
    rupees,
  )}`;
}

function formatValidity(
  record:
    FinoraControlCenterBranchRegistryRecord,
): string {

  if (!record.access) {
    return "Not provisioned";
  }

  const validity =
    calculateFinoraControlCenterBranchValidity(
      record.access.validUntil,
      new Date(),
    );

  if (validity.expired) {
    return "Expired";
  }

  return `${validity.remainingDays} days`;
}

function DetailRow({
  label,
  value,
  monospace = false,
}: {
  label:
    string;
  value:
    string;
  monospace?:
    boolean;
}) {
  return (
    <div
      style={{
        minWidth:
          0,
      }}
    >
      <div
        style={{
          fontSize:
            "11px",
          opacity:
            0.6,
          marginBottom:
            "4px",
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize:
            "12px",
          lineHeight:
            1.5,
          overflowWrap:
            "anywhere",
          fontFamily:
            monospace
              ? "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
              : "inherit",
        }}
      >
        {value}
      </div>
    </div>
  );
}

const BRANCH_ISSUANCE_ACTIONS: readonly {
  workflow:
    FinoraControlCenterIssuanceWorkflow;
  label:
    string;
}[] = [
  {
    workflow:
      "BRANCH_ACTIVATION",
    label:
      "Activation",
  },
  {
    workflow:
      "BRANCH_ACCESS",
    label:
      "Access",
  },
  {
    workflow:
      "DEVICE_REVOCATION",
    label:
      "Revoke Device",
  },
  {
    workflow:
      "STORAGE_ENTITLEMENT",
    label:
      "Storage",
  },
  {
    workflow:
      "BUSINESS_PROFILE",
    label:
      "Edit Profile",
  },
  {
    workflow:
      "PRICING_POLICY",
    label:
      "Pricing",
  },
  {
    workflow:
      "WALLET_RECHARGE",
    label:
      "Wallet Recharge",
  },
];
function BranchCard({
  record,
  selected,
  selectedWorkflow,
  onLaunchWorkflow,
  onOpenWalletHistory,
  directoryMetadata,
  directorySummary = false,
  forceExpanded = false,
  onOpenDetails,
}: {
  record:
    FinoraControlCenterBranchRegistryRecord;
  selected:
    boolean;
  selectedWorkflow?:
    FinoraControlCenterIssuanceWorkflow;
  onLaunchWorkflow:
    (
      workflow:
        FinoraControlCenterIssuanceWorkflow,
    ) => void;

  onOpenWalletHistory:
    () => void;

  directoryMetadata?:
    FinoraControlCenterBranchDirectoryMetadataView;
  directorySummary?:
    boolean;
  forceExpanded?:
    boolean;
  onOpenDetails?:
    () => void;
}) {

  const [
    expanded,
    setExpanded,
  ] = useState(
    false,
  );

  const detailsExpanded =
    !directorySummary &&
    (
      forceExpanded ||
      expanded
    );

  const identity =
    record.identity;

  const authorizedDevices =
    record.authorizedDevices;

  const businessName =
    directoryMetadata?.businessName ??
    record.profile?.businessName ??
    identity.businessCode;

  const branchName =
    directoryMetadata?.branchName ??
    record.profile?.branchName ??
    identity.branchCode;

  if (directorySummary) {

    const summaryOwnerName =
      directoryMetadata?.ownerName ??
      "—";

    const summaryBusinessName =
      directoryMetadata?.businessName ??
      record.profile?.businessName ??
      "—";

    const summaryBranchName =
      directoryMetadata?.branchName ??
      record.profile?.branchName ??
      "—";

    return (
      <article
        data-finora-control-center-branch-card="true"
        onClick={() => {
          setExpanded(
            false,
          );

          onOpenDetails?.();
        }}
        style={{
          minWidth:
            0,
          minHeight:
            "250px",
          height:
            "100%",
          boxSizing:
            "border-box",
          display:
            "flex",
          flexDirection:
            "column",
          border:
            "1px solid rgba(148, 163, 184, 0.24)",
          borderRadius:
            "14px",
          padding:
            "18px",
          background:
            "linear-gradient(145deg, rgba(30, 41, 59, 0.90), rgba(15, 23, 42, 0.78))",
          boxShadow:
            "0 10px 26px rgba(2, 6, 23, 0.16)",
          cursor:
            "pointer",
          transition:
            "border-color 160ms ease, transform 160ms ease, box-shadow 160ms ease",
        }}
      >
        <div
          style={{
            display:
              "flex",
            justifyContent:
              "space-between",
            alignItems:
              "flex-start",
            gap:
              "12px",
          }}
        >
          <h3
            style={{
              margin:
                0,
              fontSize:
                "20px",
              lineHeight:
                1.2,
              fontWeight:
                800,
              letterSpacing:
                "-0.02em",
              overflowWrap:
                "anywhere",
            }}
          >
            {identity.branchCode}
          </h3>

          <div
            style={{
              flex:
                "0 0 auto",
              border:
                "1px solid rgba(148, 163, 184, 0.24)",
              borderRadius:
                "999px",
              padding:
                "5px 9px",
              fontSize:
                "10px",
              fontWeight:
                750,
              letterSpacing:
                "0.04em",
            }}
          >
            {record.access?.administrativeStatus ??
              "ENROLLED"}
          </div>
        </div>

        <div
          style={{
            display:
              "grid",
            gap:
              "11px",
            marginTop:
              "18px",
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
                  0.56,
                marginBottom:
                  "3px",
              }}
            >
              Owner
            </div>

            <div
              style={{
                fontSize:
                  "13px",
                fontWeight:
                  700,
                overflowWrap:
                  "anywhere",
              }}
            >
              {summaryOwnerName}
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
                  0.56,
                marginBottom:
                  "3px",
              }}
            >
              Business
            </div>

            <div
              style={{
                fontSize:
                  "13px",
                fontWeight:
                  700,
                overflowWrap:
                  "anywhere",
              }}
            >
              {summaryBusinessName}
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
                  0.56,
                marginBottom:
                  "3px",
              }}
            >
              Branch
            </div>

            <div
              style={{
                fontSize:
                  "13px",
                fontWeight:
                  700,
                overflowWrap:
                  "anywhere",
              }}
            >
              {summaryBranchName}
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop:
              "auto",
            paddingTop:
              "18px",
          }}
        >
          <div
            style={{
              paddingTop:
                "12px",
              borderTop:
                "1px solid rgba(148, 163, 184, 0.14)",
              fontSize:
                "10px",
              lineHeight:
                1.45,
              opacity:
                0.62,
              overflowWrap:
                "anywhere",
            }}
          >
            Branch ID: {identity.branchId}
          </div>

          <div
            style={{
              marginTop:
                "12px",
              minHeight:
                "36px",
              display:
                "flex",
              alignItems:
                "center",
              justifyContent:
                "center",
              border:
                "1px solid rgba(148, 163, 184, 0.22)",
              borderRadius:
                "10px",
              background:
                "rgba(15, 23, 42, 0.34)",
              fontSize:
                "12px",
              fontWeight:
                800,
              letterSpacing:
                "0.01em",
            }}
          >
            Open Branch Workspace →
          </div>
        </div>
      </article>
    );
  }

  return (
    <article
      data-finora-control-center-branch-card="true"
      onClick={
        directorySummary
          ? () => {
              setExpanded(
                false,
              );
              onOpenDetails?.();
            }
          : undefined
      }
      style={{
        minWidth:
          0,
        border:
          "1px solid rgba(148, 163, 184, 0.22)",
        borderRadius:
          "14px",
        padding:
          "18px",
        background:
          directorySummary
            ? "linear-gradient(180deg, rgba(30, 41, 59, 0.94) 0%, rgba(15, 23, 42, 0.90) 100%)"
            : "rgba(30, 41, 59, 0.72)",
        boxShadow:
          directorySummary
            ? "0 10px 30px rgba(2, 6, 23, 0.18)"
            : "none",
        transition:
          "all 220ms ease",
        cursor:
          directorySummary
            ? "pointer"
            : "default",
      }}
    >
      <div
        style={{
          display:
            "flex",
          justifyContent:
            "space-between",
          gap:
            "16px",
          alignItems:
            "flex-start",
          marginBottom:
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
              opacity:
                0.68,
              marginBottom:
                "5px",
            }}
          >
            {businessName}
          </div>

          <h3
            style={{
              margin:
                0,
              fontSize:
                "18px",
              lineHeight:
                1.3,
              fontWeight:
                700,
              overflowWrap:
                "anywhere",
            }}
          >
            {branchName}
          </h3>

          <div
            style={{
              marginTop:
                "5px",
              fontSize:
                "12px",
              opacity:
                0.68,
            }}
          >
            {identity.businessCode} / {identity.branchCode}
          </div>
        </div>

        <div
          style={{
            flex:
              "0 0 auto",
            border:
              "1px solid rgba(148, 163, 184, 0.24)",
            borderRadius:
              "999px",
            padding:
              "5px 9px",
            fontSize:
              "11px",
            fontWeight:
              700,
            letterSpacing:
              "0.04em",
          }}
        >
          {record.access?.administrativeStatus ??
            "ENROLLED"}
        </div>
      </div>

      <dl
        style={{
          display:
            directorySummary
              ? "none"
              : "grid",
          gridTemplateColumns:
            "minmax(0, 1fr) minmax(0, 1fr)",
          gap:
            "14px",
          margin:
            0,
        }}
      >
        <div>
          <dt
            style={{
              fontSize:
                "11px",
              opacity:
                0.62,
              marginBottom:
                "4px",
            }}
          >
            Access
          </dt>
          <dd
            style={{
              margin:
                0,
              fontSize:
                "13px",
              fontWeight:
                650,
            }}
          >
            {record.access
              ? `${record.access.accessType} · ${record.access.storageMode}`
              : "Not provisioned"}
          </dd>
        </div>

        <div>
          <dt
            style={{
              fontSize:
                "11px",
              opacity:
                0.62,
              marginBottom:
                "4px",
            }}
          >
            Validity Remaining
          </dt>
          <dd
            style={{
              margin:
                0,
              fontSize:
                "13px",
              fontWeight:
                650,
            }}
          >
            {formatValidity(
              record,
            )}
          </dd>
        </div>

        <div>
          <dt
            style={{
              fontSize:
                "11px",
              opacity:
                0.62,
              marginBottom:
                "4px",
            }}
          >
            Last Reported Wallet Balance
          </dt>
          <dd
            style={{
              margin:
                0,
              fontSize:
                "15px",
              fontWeight:
                700,
            }}
          >
            {formatLastReportedWallet(
              record,
            )}
          </dd>
        </div>

        <div>
          <dt
            style={{
              fontSize:
                "11px",
              opacity:
                0.62,
              marginBottom:
                "4px",
            }}
          >
            Last Sync
          </dt>
          <dd
            style={{
              margin:
                0,
              fontSize:
                "13px",
              fontWeight:
                600,
            }}
          >
            {formatTimestamp(
              record.lastSync?.receivedAt,
            )}
          </dd>
        </div>
      </dl>

      {directorySummary && (
        <div
          aria-hidden="true"
          style={{
            marginTop:
              "18px",
            paddingTop:
              "14px",
            borderTop:
              "1px solid rgba(148, 163, 184, 0.16)",
            display:
              "flex",
            alignItems:
              "center",
            justifyContent:
              "space-between",
            gap:
              "10px",
            fontSize:
              "12px",
            lineHeight:
              1.35,
            fontWeight:
              700,
            letterSpacing:
              "0.02em",
            color:
              "#bfdbfe",
          }}
        >
          <span>
            Open Branch Workspace
          </span>
          <span
            style={{
              fontSize:
                "16px",
              lineHeight:
                1,
            }}
          >
            →
          </span>
        </div>
      )}

      <div
        data-finora-control-center-branch-actions="true"
        style={{
          marginTop:
            "16px",
          display:
            directorySummary
              ? "none"
              : "grid",
          gridTemplateColumns:
            "repeat(2, minmax(0, 1fr))",
          gap:
            "8px",
        }}
      >
        {BRANCH_ISSUANCE_ACTIONS.map(
          (action) => {
            const active =
              selected &&
              selectedWorkflow ===
                action.workflow;

            return (
              <button
                key={
                  action.workflow
                }
                type="button"
                aria-pressed={
                  active
                }
                onClick={() => {
                  onLaunchWorkflow(
                    action.workflow,
                  );
                }}
                style={{
                  minHeight:
                    "36px",
                  padding:
                    "7px 9px",
                  border:
                    active
                      ? "1px solid rgba(96, 165, 250, 0.68)"
                      : "1px solid rgba(148, 163, 184, 0.24)",
                  borderRadius:
                    "8px",
                  background:
                    active
                      ? "rgba(30, 64, 175, 0.24)"
                      : "rgba(15, 23, 42, 0.62)",
                  color:
                    "#e2e8f0",
                  fontFamily:
                    "inherit",
                  fontSize:
                    "11px",
                  fontWeight:
                    active
                      ? 700
                      : 650,
                  cursor:
                    "pointer",
                }}
              >
                {action.label}
              </button>
            );
          },
        )}

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();

            onOpenWalletHistory();
          }}
          style={{
            minHeight:
              "36px",

            padding:
              "7px 9px",

            border:
              "1px solid rgba(45, 212, 191, 0.34)",

            borderRadius:
              "8px",

            background:
              "rgba(13, 148, 136, 0.12)",

            color:
              "#e2e8f0",

            fontFamily:
              "Inter, ui-sans-serif, system-ui, sans-serif",

            fontSize:
              "11px",

            fontWeight:
              700,

            cursor:
              "pointer",
          }}
        >
          Wallet History
        </button>
      </div>

      <button
        type="button"
        aria-expanded={
          detailsExpanded
        }
        onClick={() => {
          setExpanded(
            (current) =>
              !current,
          );
        }}
        style={{
          display:
            directorySummary || forceExpanded
              ? "none"
              : "block",
          width:
            "100%",
          marginTop:
            "16px",
          minHeight:
            "36px",
          border:
            "1px solid rgba(148, 163, 184, 0.24)",
          borderRadius:
            "9px",
          background:
            "rgba(15, 23, 42, 0.62)",
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
        {expanded
          ? "Hide Details"
          : "View Details"}
      </button>

      {detailsExpanded && (
        <section
          data-finora-control-center-branch-details="true"
          style={{
            marginTop:
              "14px",
            padding:
              "16px",
            border:
              "1px solid rgba(148, 163, 184, 0.16)",
            borderRadius:
              "11px",
            background:
              "rgba(15, 23, 42, 0.48)",
          }}
        >
          <div
            style={{
              fontSize:
                "12px",
              fontWeight:
                700,
              marginBottom:
                "12px",
            }}
          >
            Provisioned Identity
          </div>

          <div
            style={{
              display:
                "grid",
              gridTemplateColumns:
                "repeat(2, minmax(0, 1fr))",
              gap:
                "14px",
            }}
          >
            <DetailRow
              label="Owner ID"
              value={identity.ownerId}
              monospace
            />

            <DetailRow
              label="Business ID"
              value={identity.businessId}
              monospace
            />

            <DetailRow
              label="Branch ID"
              value={identity.branchId}
              monospace
            />

            <DetailRow
              label="Business Code"
              value={identity.businessCode}
            />

            <DetailRow
              label="Branch Code"
              value={identity.branchCode}
            />

            <div
              style={{
                gridColumn:
                  "1 / -1",
                marginTop:
                  "2px",
                paddingTop:
                  "14px",
                borderTop:
                  "1px solid rgba(148, 163, 184, 0.14)",
                fontSize:
                  "12px",
                fontWeight:
                  700,
              }}
            >
              Provisioned Device
            </div>

            <DetailRow
              label="Installation ID"
              value={identity.installation.installationId}
              monospace
            />

            <DetailRow
              label="Binding Key ID"
              value={identity.installation.bindingKeyId}
              monospace
            />

            <DetailRow
              label="Platform"
              value={identity.installation.platform}
            />

            <DetailRow
              label="Binding Algorithm"
              value={identity.installation.algorithm}
            />

            <DetailRow
              label="Public Key Format"
              value={identity.installation.publicKeyFormat}
            />

            <DetailRow
              label="Fingerprint Algorithm"
              value={identity.installation.fingerprintAlgorithm}
            />

            <DetailRow
              label="Public Key Fingerprint"
              value={identity.installation.publicKeyFingerprint}
              monospace
            />

            <DetailRow
              label="Binding Created At"
              value={formatTimestamp(
                identity.installation.bindingCreatedAt,
              )}
            />
          </div>

          <div
            style={{
              margin:
                "18px 0 6px",
              paddingTop:
                "16px",
              borderTop:
                "1px solid rgba(148, 163, 184, 0.14)",
              fontSize:
                "12px",
              fontWeight:
                700,
            }}
          >
            Authorized Devices ({authorizedDevices.length})
          </div>

          <div
            style={{
              marginBottom:
                "12px",
              fontSize:
                "11px",
              opacity:
                0.62,
            }}
          >
            Control Center verified evidence only. Runtime device access
            remains enforced by recipient Device Trust.
          </div>

          <div
            style={{
              display:
                "grid",
              gap:
                "12px",
            }}
          >
            {authorizedDevices.map(
              (device, index) => (
                <div
                  key={device.installation.installationId}
                  style={{
                    padding:
                      "14px",
                    border:
                      "1px solid rgba(148, 163, 184, 0.14)",
                    borderRadius:
                      "12px",
                    background:
                      "rgba(15, 23, 42, 0.18)",
                  }}
                >
                  <div
                    style={{
                      display:
                        "flex",
                      justifyContent:
                        "space-between",
                      alignItems:
                        "baseline",
                      gap:
                        "12px",
                      marginBottom:
                        "12px",
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
                      Device {index + 1}
                    </div>

                    <div
                      style={{
                        fontSize:
                          "11px",
                        opacity:
                          0.68,
                      }}
                    >
                      {device.evidenceSource ===
                      "INITIAL_PROVISIONING"
                        ? "Initial Provisioning"
                        : device.evidenceSource}
                    </div>
                  </div>

                  <div
                    style={{
                      display:
                        "grid",
                      gridTemplateColumns:
                        "repeat(2, minmax(0, 1fr))",
                      gap:
                        "12px",
                    }}
                  >
                    <DetailRow
                      label="Installation ID"
                      value={device.installation.installationId}
                      monospace
                    />

                    <DetailRow
                      label="Platform"
                      value={device.installation.platform}
                    />

                    <DetailRow
                      label="Binding Key ID"
                      value={device.installation.bindingKeyId}
                      monospace
                    />

                    <DetailRow
                      label="Public Key Fingerprint"
                      value={device.installation.publicKeyFingerprint}
                      monospace
                    />

                    <DetailRow
                      label="First Observed"
                      value={formatTimestamp(
                        device.firstObservedAt,
                      )}
                    />

                    <DetailRow
                      label="Evidence Updated"
                      value={formatTimestamp(
                        device.updatedAt,
                      )}
                    />
                  </div>
                </div>
              ),
            )}
          </div>

          <div
            style={{
              margin:
                "18px 0 12px",
              paddingTop:
                "16px",
              borderTop:
                "1px solid rgba(148, 163, 184, 0.14)",
              fontSize:
                "12px",
              fontWeight:
                700,
            }}
          >
            Operational Summary
          </div>

          <div
            style={{
              display:
                "grid",
              gridTemplateColumns:
                "repeat(2, minmax(0, 1fr))",
              gap:
                "14px",
            }}
          >
            <DetailRow
              label="Business Name"
              value={
                record.profile?.businessName ??
                "Not reported yet"
              }
            />

            <DetailRow
              label="Branch Name"
              value={
                record.profile?.branchName ??
                "Not reported yet"
              }
            />

            <DetailRow
              label="Access Type"
              value={
                record.access?.accessType ??
                "Not provisioned"
              }
            />

            <DetailRow
              label="Administrative Status"
              value={
                record.access?.administrativeStatus ??
                "Not provisioned"
              }
            />

            <DetailRow
              label="Storage Mode"
              value={
                record.access?.storageMode ??
                "Not provisioned"
              }
            />

            <DetailRow
              label="Valid From"
              value={formatTimestamp(
                record.access?.validFrom,
              )}
            />

            <DetailRow
              label="Valid Until"
              value={formatTimestamp(
                record.access?.validUntil,
              )}
            />

            <DetailRow
              label="Validity Remaining"
              value={formatValidity(
                record,
              )}
            />

            <DetailRow
              label="Last Reported Wallet Balance"
              value={formatLastReportedWallet(
                record,
              )}
            />

            <DetailRow
              label="Wallet ID"
              value={
                record.lastReportedWallet?.walletId ??
                "Not reported yet"
              }
              monospace
            />

            <DetailRow
              label="Wallet Reported At"
              value={formatTimestamp(
                record.lastReportedWallet?.reportedAt,
              )}
            />

            <DetailRow
              label="Last Transaction At"
              value={formatTimestamp(
                record.lastReportedWallet?.lastTransactionAt,
              )}
            />

            <DetailRow
              label="Last Sync Reported At"
              value={formatTimestamp(
                record.lastSync?.reportedAt,
              )}
            />

            <DetailRow
              label="Last Sync Received At"
              value={formatTimestamp(
                record.lastSync?.receivedAt,
              )}
            />

            <DetailRow
              label="Snapshot ID"
              value={
                record.lastSync?.snapshotId ??
                "Not reported yet"
              }
              monospace
            />

            <DetailRow
              label="Registry Created At"
              value={formatTimestamp(
                record.createdAt,
              )}
            />

            <DetailRow
              label="Registry Updated At"
              value={formatTimestamp(
                record.updatedAt,
              )}
            />
          </div>
        </section>
      )}

      <div
        style={{
          marginTop:
            "16px",
          paddingTop:
            "14px",
          borderTop:
            "1px solid rgba(148, 163, 184, 0.14)",
          display:
            "grid",
          gap:
            "5px",
          fontSize:
            "11px",
          opacity:
            0.62,
          fontFamily:
            "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
          overflowWrap:
            "anywhere",
        }}
      >
        <div>
          Branch ID: {identity.branchId}
        </div>
        <div>
          Provisioned Installation ID: {identity.installation.installationId}
        </div>
      </div>
    </article>
  );
}

interface FinoraControlCenterBranchRegistryPanelProps {
  selectedBranchId?:
    string;
  selectedWorkflow:
    FinoraControlCenterIssuanceWorkflow;
  directoryMode?:
    boolean;
  onLaunchBranchWorkflow:
    (
      record:
        FinoraControlCenterBranchRegistryRecord,
      workflow:
        FinoraControlCenterIssuanceWorkflow,
    ) => void;
}

export default function FinoraControlCenterBranchRegistryPanel({
  selectedBranchId,
  selectedWorkflow,
  directoryMode = false,
  onLaunchBranchWorkflow,
}: FinoraControlCenterBranchRegistryPanelProps) {

  const [
    openedBranchId,
    setOpenedBranchId,
  ] = useState<
    string | undefined
  >();

  const [
    incomePricingOpen,
    setIncomePricingOpen,
  ] = useState(
    false,
  );
  const [
    branchPricingRecord,
    setBranchPricingRecord,
  ] = useState<
    FinoraControlCenterBranchRegistryRecord | undefined
  >();
  const [
    walletHistoryScope,
    setWalletHistoryScope,
  ] = useState<
    FinoraControlCenterWalletHistoryScope | undefined
  >();

  const [
    loadState,
    setLoadState,
  ] = useState<BranchRegistryLoadState>(
    "LOADING",
  );

  const [
    registry,
    setRegistry,
  ] = useState<
    FinoraControlCenterBranchRegistryView | undefined
  >();

  const [
    directoryMetadata,
    setDirectoryMetadata,
  ] = useState<
    FinoraControlCenterBranchDirectoryMetadataView[]
  >(
    [],
  );

  const [
    errorMessage,
    setErrorMessage,
  ] = useState<
    string | undefined
  >();

  const [
    historicalBackfillState,
    setHistoricalBackfillState,
  ] = useState<
    "IDLE" | "RUNNING"
  >(
    "IDLE",
  );

  const [
    historicalBackfillMessage,
    setHistoricalBackfillMessage,
  ] = useState<
    string | undefined
  >();
  const loadRegistry =
    useCallback(
      async (): Promise<void> => {

        const bridge =
          window.finoraControlCenter;

        if (!bridge) {
          setLoadState(
            "UNAVAILABLE",
          );

          setErrorMessage(
            "Dedicated FINORA Control Center preload bridge is unavailable.",
          );

          return;
        }

        setLoadState(
          "LOADING",
        );

        try {
          const result =
            await bridge.getBranchRegistry();

          if (!result.success) {
            setLoadState(
              "ERROR",
            );

            setErrorMessage(
              result.error,
            );

            return;
          }

          setRegistry(
            result.data,
          );

          const directoryMetadataResult =
            await bridge.getBranchDirectoryMetadata();

          setDirectoryMetadata(
            directoryMetadataResult.success
              ? directoryMetadataResult.data
              : [],
          );

          setErrorMessage(
            undefined,
          );

          setLoadState(
            "READY",
          );
        } catch (error) {
          setLoadState(
            "ERROR",
          );

          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Unable to load the FINORA Control Center Branch Registry.",
          );
        }
      },
      [],
    );

  async function handleHistoricalBranchBackfill():
    Promise<void> {

    if (
      historicalBackfillState ===
        "RUNNING"
    ) {
      return;
    }

    const bridge =
      window.finoraControlCenter;

    if (!bridge) {
      setErrorMessage(
        "Dedicated FINORA Control Center preload bridge is unavailable.",
      );

      return;
    }

    setHistoricalBackfillState(
      "RUNNING",
    );

    setHistoricalBackfillMessage(
      undefined,
    );

    setErrorMessage(
      undefined,
    );

    try {

      /*
       * Renderer supplies no identity, filesystem location,
       * or evidence bytes.
       *
       * Native evidence selection, cryptographic verification,
       * and Branch Registry persistence remain Electron-main
       * responsibilities.
       */
      const result =
        await bridge.backfillHistoricalEnrollmentBranch();

      if (!result.success) {
        setErrorMessage(
          result.error,
        );

        return;
      }

      const backfill =
        result.data;

      if (backfill.cancelled) {
        setHistoricalBackfillMessage(
          backfill.cancelledAt ===
            "REQUEST"
            ? "Backfill cancelled while selecting the original Enrollment Request."
            : "Backfill cancelled while selecting the historical Enrollment Response.",
        );

        return;
      }

      await loadRegistry();

      setHistoricalBackfillMessage(
        backfill.created
          ? `Backfilled ${backfill.branchCode} (${backfill.branchId}) from verified historical Enrollment evidence.`
          : `${backfill.branchCode} (${backfill.branchId}) is already registered. No Branch Registry change was required.`,
      );

    } catch (
      error
    ) {

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to backfill the historical FINORA Branch.",
      );

    } finally {

      setHistoricalBackfillState(
        "IDLE",
      );
    }
  }
  useEffect(
    () => {
      void loadRegistry();
    },
    [
      loadRegistry,
    ],
  );

  const branches =
    registry?.branches ??
    [];

  const directoryMetadataByScope =
    new Map(
      directoryMetadata.map(
        (metadata) => [
          [
            metadata.ownerId,
            metadata.businessId,
            metadata.branchId,
          ].join(
            "\u001f",
          ),
          metadata,
        ] as const,
      ),
    );

  const openedBranch =
    directoryMode &&
    openedBranchId
      ? branches.find(
          (record) =>
            record.identity.branchId ===
            openedBranchId,
        )
      : undefined;

  if (incomePricingOpen) {

    return (
      <FinoraControlCenterIncomePricingPanel
        onClose={() => {
          setIncomePricingOpen(
            false,
          );
        }}
      />
    );
  }
  if (branchPricingRecord) {

    return (
      <FinoraControlCenterBranchPricingPanel
        record={
          branchPricingRecord
        }
        onClose={() => {
          setBranchPricingRecord(
            undefined,
          );
        }}
      />
    );
  }
  if (walletHistoryScope) {

    return (
      <FinoraControlCenterWalletHistoryPanel
        scope={
          walletHistoryScope
        }
        onClose={() => {
          setWalletHistoryScope(
            undefined,
          );
        }}
      />
    );
  }

  return (
    <section
      data-finora-control-center-branch-registry="true"
      aria-live="polite"
      style={{
        marginTop:
          "22px",
        border:
          "1px solid rgba(148, 163, 184, 0.22)",
        borderRadius:
          "14px",
        padding:
          "22px",
        background:
          "rgba(15, 23, 42, 0.72)",
      }}
    >
      <div
        style={{
          display:
            "flex",
          alignItems:
            "center",
          justifyContent:
            "space-between",
          gap:
            "16px",
          marginBottom:
            "18px",
        }}
      >
        <div>
          <h2
            style={{
              margin:
                0,
              fontSize:
                "18px",
              fontWeight:
                700,
            }}
          >
            {directoryMode ? "FINORA Branches" : "Branch Registry"}
          </h2>

          <p
            style={{
              margin:
                "6px 0 0",
              fontSize:
                "13px",
              lineHeight:
                1.5,
              opacity:
                0.7,
            }}
          >
            {directoryMode
              ? "Select a FINORA branch to open its complete administrative view."
              : "Provisioned branch identities and last reported operational state."}
          </p>
        </div>

        <div
          style={{
            display:
              "flex",
            alignItems:
              "center",
            justifyContent:
              "flex-end",
            flexWrap:
              "wrap",
            gap:
              "8px",
          }}
        >
          {directoryMode && !openedBranch && (
            <button
              type="button"
              onClick={() => {
                setIncomePricingOpen(
                  true,
                );
              }}
              style={{
                minHeight:
                  "38px",

                padding:
                  "8px 14px",

                border:
                  "1px solid rgba(251, 191, 36, 0.38)",

                borderRadius:
                  "9px",

                background:
                  "rgba(217, 119, 6, 0.12)",

                color:
                  "#fef3c7",

                fontFamily:
                  "Inter, ui-sans-serif, system-ui, sans-serif",

                fontWeight:
                  700,

                cursor:
                  "pointer",
              }}
            >
              FINORA Income
            </button>
          )}
          {directoryMode && !openedBranch && (
            <button
              type="button"
              onClick={() => {
                setWalletHistoryScope({
                  mode:
                    "GLOBAL",
                });
              }}
              style={{
                minHeight:
                  "38px",

                padding:
                  "8px 14px",

                border:
                  "1px solid rgba(45, 212, 191, 0.34)",

                borderRadius:
                  "9px",

                background:
                  "rgba(13, 148, 136, 0.12)",

                color:
                  "#e2e8f0",

                fontFamily:
                  "Inter, ui-sans-serif, system-ui, sans-serif",

                fontWeight:
                  700,

                cursor:
                  "pointer",
              }}
            >
              FINORA Wallet History
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              void handleHistoricalBranchBackfill();
            }}
            disabled={
              historicalBackfillState ===
                "RUNNING" ||
              loadState ===
                "LOADING"
            }
            style={{
              flex:
                "0 0 auto",
              minHeight:
                "36px",
              padding:
                "7px 13px",
              border:
                "1px solid rgba(96, 165, 250, 0.42)",
              borderRadius:
                "9px",
              background:
                historicalBackfillState ===
                  "RUNNING"
                  ? "rgba(30, 41, 59, 0.78)"
                  : "rgba(30, 64, 175, 0.20)",
              color:
                "#e2e8f0",
              fontFamily:
                "inherit",
              fontWeight:
                650,
              cursor:
                historicalBackfillState ===
                  "RUNNING"
                  ? "wait"
                  : "pointer",
              opacity:
                historicalBackfillState ===
                  "RUNNING"
                  ? 0.72
                  : 1,
            }}
          >
            {historicalBackfillState ===
              "RUNNING"
              ? "Backfill in progress…"
              : "Backfill Existing Branch"}
          </button>

<button
          type="button"
          onClick={() => {
            void loadRegistry();
          }}
          disabled={
            loadState ===
            "LOADING"
          }
          style={{
            flex:
              "0 0 auto",
            minHeight:
              "36px",
            padding:
              "7px 13px",
            border:
              "1px solid rgba(148, 163, 184, 0.28)",
            borderRadius:
              "9px",
            background:
              "rgba(30, 41, 59, 0.88)",
            color:
              "#e2e8f0",
            fontFamily:
              "inherit",
            fontWeight:
              650,
            cursor:
              loadState === "LOADING"
                ? "default"
                : "pointer",
            opacity:
              loadState === "LOADING"
                ? 0.6
                : 1,
          }}
        >
          {loadState ===
            "LOADING"
            ? "Loading…"
            : "Refresh"}
        </button>
        </div>
      </div>
      {historicalBackfillMessage && (
        <div
          aria-live="polite"
          style={{
            marginBottom:
              "16px",
            border:
              "1px solid rgba(96, 165, 250, 0.24)",
            borderRadius:
              "9px",
            padding:
              "9px 11px",
            background:
              "rgba(30, 64, 175, 0.10)",
            color:
              "#bfdbfe",
            fontSize:
              "12px",
            lineHeight:
              1.5,
          }}
        >
          {historicalBackfillMessage}
        </div>
      )}

      {loadState ===
        "ERROR" && (
        <div>
          <strong>
            Unable to load Branch Registry
          </strong>

          <p
            style={{
              margin:
                "7px 0 0",
              opacity:
                0.72,
            }}
          >
            {errorMessage}
          </p>
        </div>
      )}

      {loadState ===
        "UNAVAILABLE" && (
        <p
          style={{
            margin:
              0,
          }}
        >
          {errorMessage}
        </p>
      )}

      {directoryMode && openedBranch && (
        <button
          type="button"
          onClick={() => {
            setOpenedBranchId(
              undefined,
            );
          }}
          style={{
            marginBottom:
              "14px",
            minHeight:
              "38px",
            padding:
              "8px 14px",
            border:
              "1px solid rgba(148, 163, 184, 0.28)",
            borderRadius:
              "9px",
            background:
              "rgba(30, 41, 59, 0.72)",
            color:
              "#e2e8f0",
            fontFamily:
              "inherit",
            fontWeight:
              700,
            cursor:
              "pointer",
          }}
        >
          ← Back to FINORA Branches
        </button>
      )}

      {(
        loadState ===
          "READY" &&
        branches.length ===
          0
      ) && (
        <div
          style={{
            border:
              "1px dashed rgba(148, 163, 184, 0.24)",
            borderRadius:
              "12px",
            padding:
              "20px",
            textAlign:
              "center",
            opacity:
              0.72,
          }}
        >
          No provisioned branches are registered yet.
        </div>
      )}

      {(
        loadState ===
          "READY" &&
        (
          branches.length >
            0
        )
      ) && (
        <div
          style={{
            display:
              "grid",
            gridTemplateColumns:
              directoryMode &&
              !openedBranch
                ? "repeat(5, minmax(0, 1fr))"
                : "repeat(auto-fit, minmax(320px, 1fr))",
            gap:
              directoryMode &&
              !openedBranch
                ? "12px"
                : "14px",
          }}
        >
          {(openedBranch ? [openedBranch] : branches).map(
            (record) => (
              <BranchCard
                key={
                  `${record.identity.ownerId}:${record.identity.businessId}:${record.identity.branchId}`
                }
                record={
                  record
                }
                directoryMetadata={
                  directoryMetadataByScope.get(
                    [
                      record.identity.ownerId,
                      record.identity.businessId,
                      record.identity.branchId,
                    ].join(
                      "\u001f",
                    ),
                  )
                }
                selected={
                  selectedBranchId ===
                  record.identity.branchId
                }
                selectedWorkflow={
                  selectedBranchId ===
                  record.identity.branchId
                    ? selectedWorkflow
                    : undefined
                }
                directorySummary={
                  directoryMode &&
                  !openedBranch
                }
                forceExpanded={
                  false
                }
                onOpenDetails={() => {
                  setOpenedBranchId(
                    record.identity.branchId,
                  );
                }}
                onOpenWalletHistory={() => {
                  setWalletHistoryScope({
                    mode:
                      "BRANCH",

                    ownerId:
                      record.identity.ownerId,

                    businessId:
                      record.identity.businessId,

                    branchId:
                      record.identity.branchId,

                    branchCode:
                      record.identity.branchCode,
                  });
                }}
                onLaunchWorkflow={(workflow) => {

                  if (
                    workflow ===
                    "PRICING_POLICY"
                  ) {
                    setBranchPricingRecord(
                      record,
                    );

                    return;
                  }

                  onLaunchBranchWorkflow(
                    record,
                    workflow,
                  );
                }}
              />
            ),
          )}
        </div>
      )}
    </section>
  );
}