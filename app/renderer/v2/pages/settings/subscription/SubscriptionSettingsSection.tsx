// ============================================================
// FINORA ENTERPRISE OS
//
// ENTERPRISE SETTINGS
// SUBSCRIPTION SETTINGS SECTION
//
// RESPONSIBILITY:
//
// - Display authoritative active-branch subscription state
// - Display signed FINORA Branch identity
// - Display registration / demo validity
// - Display registration payment metadata when available
//
// IMPORTANT:
//
// - READ ONLY.
// - No persistence.
// - No subscription mutation.
// - No direct Control Store access.
// - No local expiry authority.
// - No inline styles.
// - No theme values.
// - No breakpoint values.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

import {
  useEffect,
  useState,
} from "react";

import {
  evaluateAuthoritativeFinoraBranchAccess,
  loadFinoraBranchAccessRenewalHistory,
  loadFinoraBusinessProfile,
} from "../../../services/activation/activationService";

import type {
  FinoraAuthoritativeBranchAccessDecision,
  FinoraBranchAccessRenewalHistoryRecord,
} from "../../../services/activation/activationControlBridge";

import type {
  FinoraProvisionedBusinessProfileV1,
} from "../../../types/business/finoraBusinessProfileControl.types";

import {
  getSession,
} from "../../../store/authStore";

import SettingsFeedback from "../components/SettingsFeedback";

const REFRESH_INTERVAL_MS =
  60_000;

const EXPIRING_SOON_MS =
  7 * 24 * 60 * 60 * 1000;

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return "Not recorded";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "Unavailable";
  }

  const day =
    pad2(date.getDate());

  const month =
    pad2(date.getMonth() + 1);

  const year =
    date.getFullYear();

  const rawHour =
    date.getHours();

  const minute =
    pad2(date.getMinutes());

  const period =
    rawHour >= 12
      ? "PM"
      : "AM";

  const hour =
    rawHour % 12 || 12;

  return `${day}-${month}-${year} ${pad2(hour)}:${minute} ${period}`;
}

function formatMoney(
  amount: number | null | undefined,
  currency: string | null | undefined,
): string {
  if (
    typeof amount !== "number" ||
    !Number.isFinite(amount) ||
    typeof currency !== "string" ||
    currency.trim().length === 0
  ) {
    return "Not recorded";
  }

  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency.trim(),
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return "Not recorded";
  }
}

function resolveRemainingLabel(
  decision: FinoraAuthoritativeBranchAccessDecision,
): string {
  const grant = decision.grant;

  if (!grant) {
    return "Unavailable";
  }

  // Presentation only. Never changes subscription authority.
  const observedAt = new Date(decision.observedAt).getTime();
  const validUntil = new Date(grant.validity.validUntil).getTime();

  if (!Number.isFinite(observedAt) ||
      !Number.isFinite(validUntil)) {
    return "Unavailable";
  }

  const difference = validUntil - observedAt;
  const expired = difference <= 0;

  // Before expiry round upward so 10 seconds does not show 0m.
  // After expiry show completed elapsed minutes.
  const totalMinutes = expired
    ? Math.floor(Math.abs(difference) / 60000)
    : Math.ceil(difference / 60000);

  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  let duration: string;

  if (days > 0) {
    duration = `${days}d`;
    if (hours > 0) duration += ` ${hours}h`;
    if (minutes > 0) duration += ` ${minutes}m`;
  } else if (hours > 0) {
    duration = `${hours}h`;
    if (minutes > 0) duration += ` ${minutes}m`;
  } else {
    duration = `${minutes}m`;
  }

  return expired
    ? `+${duration} - Expired`
    : `-${duration}`;
}

function resolveStatus(
  decision:
    FinoraAuthoritativeBranchAccessDecision,
): {
  label: string;
  tone:
    | "active"
    | "warning"
    | "danger"
    | "info";
} {
  if (
    decision.state ===
    "ACTIVE" &&
    decision.grant
  ) {
    const remaining =
      new Date(
        decision.grant.validity.validUntil,
      ).getTime() -
      new Date(
        decision.observedAt,
      ).getTime();

    if (
      Number.isFinite(remaining) &&
      remaining <=
        EXPIRING_SOON_MS
    ) {
      return {
        label:
          "Expiring Soon",

        tone:
          "warning",
      };
    }

    return {
      label:
        "Active",

      tone:
        "active",
    };
  }

  if (
    decision.state ===
    "EXPIRED"
  ) {
    return {
      label:
        "Expired",

      tone:
        "danger",
    };
  }

  if (
    decision.state ===
      "SUSPENDED" ||
    decision.state ===
      "REVOKED" ||
    decision.state ===
      "INVALID"
  ) {
    return {
      label:
        decision.state
          .replaceAll("_", " "),

      tone:
        "danger",
    };
  }

  return {
    label:
      decision.state
        .replaceAll("_", " "),

    tone:
      "info",
  };
}

export default function SubscriptionSettingsSection() {

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState<
    string | null
  >(null);

  const [
    decision,
    setDecision,
  ] = useState<
    FinoraAuthoritativeBranchAccessDecision | null
  >(null);

  const [
    profile,
    setProfile,
  ] = useState<
    FinoraProvisionedBusinessProfileV1 | null
  >(null);

  const [
    renewalHistory,
    setRenewalHistory,
  ] = useState<
    FinoraBranchAccessRenewalHistoryRecord[]
  >([]);

  useEffect(
    () => {

      let active =
        true;

      async function load():
        Promise<void> {

        const session =
          getSession();

        if (
          !session ||
          !session.userId ||
          !session.ownerId ||
          !session.businessId ||
          !session.branchId
        ) {
          if (active) {
            setError(
              "No complete active FINORA branch session is available.",
            );

            setLoading(false);
          }

          return;
        }

        const [
          accessResult,
          profileResult,
          renewalHistoryResult,
        ] =
          await Promise.all([
            evaluateAuthoritativeFinoraBranchAccess(
              session.userId,
              session.ownerId,
              session.businessId,
              session.branchId,
            ),

            loadFinoraBusinessProfile(
              session.ownerId,
              session.businessId,
              session.branchId,
            ),

            loadFinoraBranchAccessRenewalHistory(
              session.userId,
              session.ownerId,
              session.businessId,
              session.branchId,
            ),
          ]);

        if (!active) {
          return;
        }

        if (
          !accessResult.success ||
          !accessResult.data
        ) {
          setError(
            accessResult.error ??
            "Unable to load the authoritative FINORA subscription state.",
          );

          setLoading(false);

          return;
        }

        if (
          !profileResult.success ||
          !profileResult.data
        ) {
          setError(
            profileResult.error ??
            "Unable to load the signed FINORA Branch Profile.",
          );

          setLoading(false);

          return;
        }

        if (
          !renewalHistoryResult.success ||
          !renewalHistoryResult.data
        ) {
          setError(
            renewalHistoryResult.error ??
            "Unable to load FINORA subscription renewal history.",
          );

          setLoading(false);

          return;
        }

        setDecision(
          accessResult.data,
        );

        setProfile(
          profileResult.data,
        );

        setRenewalHistory(
          renewalHistoryResult.data,
        );

        setError(null);

        setLoading(false);
      }

      void load();

      return () => {
        active =
          false;
      };
    },
    [],
  );

  if (loading) {
    return (
      <section className="finora-settings-section finora-settings-subscription-section">
        <SettingsFeedback
          kind="info"
          title="Loading Subscription"
          message="FINORA is loading the authoritative branch subscription state."
        />
      </section>
    );
  }

  if (
    error ||
    !decision ||
    !profile
  ) {
    return (
      <section className="finora-settings-section finora-settings-subscription-section">
        <SettingsFeedback
          kind="danger"
          title="Subscription Unavailable"
          message={
            error ??
            "The active branch subscription could not be loaded."
          }
        />
      </section>
    );
  }

  const grant =
    decision.grant;

  if (!grant) {
    return (
      <section className="finora-settings-section finora-settings-subscription-section">
        <SettingsFeedback
          kind="warning"
          title="No Subscription Grant"
          message={decision.reason}
        />
      </section>
    );
  }

  const status =
    resolveStatus(
      decision,
    );

  return (
    <section className="finora-settings-section finora-settings-subscription-section">
      <div className="finora-settings-form__section">

        <div className="finora-settings-form__section-header">
          <div className="finora-settings-form__section-heading">
            <h2 className="finora-settings-form__section-title">
              Current Subscription
            </h2>

            <p className="finora-settings-form__section-subtitle">
              Authoritative registration and validity details for the active FINORA branch.
            </p>
          </div>

          <span className={`finora-settings-subscription__status finora-settings-subscription__status--${status.tone}`}>
            {status.label}
          </span>
        </div>

        <div className="finora-settings-form__grid finora-settings-subscription__grid">

          <div className="finora-settings-subscription__field">
            <span className="finora-settings-subscription__label">
              Branch Name
            </span>
            <strong className="finora-settings-subscription__value">
              {profile.branchName}
            </strong>
          </div>

          <div className="finora-settings-subscription__field">
            <span className="finora-settings-subscription__label">
              Branch ID
            </span>
            <strong className="finora-settings-subscription__value">
              {grant.branchId}
            </strong>
          </div>

          <div className="finora-settings-subscription__field">
            <span className="finora-settings-subscription__label">
              Access Type
            </span>
            <strong className="finora-settings-subscription__value">
              {grant.accessType}
            </strong>
          </div>

          <div className="finora-settings-subscription__field">
            <span className="finora-settings-subscription__label">
              Storage Mode
            </span>
            <strong className="finora-settings-subscription__value">
              {grant.storageMode}
            </strong>
          </div>

          <div className="finora-settings-subscription__field">
            <span className="finora-settings-subscription__label">
              Activated
            </span>
            <strong className="finora-settings-subscription__value">
              {formatDateTime(
                grant.validity.validFrom,
              )}
            </strong>
          </div>

          <div className="finora-settings-subscription__field">
            <span className="finora-settings-subscription__label">
              Expires
            </span>
            <strong className="finora-settings-subscription__value">
              {formatDateTime(
                grant.validity.validUntil,
              )}
            </strong>
          </div>

          <div className="finora-settings-subscription__field">
            <span className="finora-settings-subscription__label">
              Remaining
            </span>
            <strong className="finora-settings-subscription__value">
              {resolveRemainingLabel(
                decision,
              )}
            </strong>
          </div>

          <div className="finora-settings-subscription__field">
            <span className="finora-settings-subscription__label">
              Runtime State
            </span>
            <strong className="finora-settings-subscription__value">
              {decision.state}
            </strong>
          </div>

          {grant.accessType === "REGISTERED" ? (
            <>
              <div className="finora-settings-subscription__field">
                <span className="finora-settings-subscription__label">
                  Subscription Amount
                </span>
                <strong className="finora-settings-subscription__value">
                  {formatMoney(
                    grant.registrationPayment?.amount,
                    grant.registrationPayment?.currency,
                  )}
                </strong>
              </div>

              <div className="finora-settings-subscription__field">
                <span className="finora-settings-subscription__label">
                  Payment Mode
                </span>
                <strong className="finora-settings-subscription__value">
                  {grant.registrationPayment?.paymentMode.replaceAll("_", " ") ?? "Not recorded"}
                </strong>
              </div>

              <div className="finora-settings-subscription__field">
                <span className="finora-settings-subscription__label">
                  Paid At
                </span>
                <strong className="finora-settings-subscription__value">
                  {formatDateTime(
                    grant.registrationPayment?.paidAt,
                  )}
                </strong>
              </div>

              <div className="finora-settings-subscription__field">
                <span className="finora-settings-subscription__label">
                  Registration Cycle
                </span>
                <strong className="finora-settings-subscription__value">
                  {grant.registrationCycle ?? "Not recorded"}
                </strong>
              </div>
            </>
          ) : (
            <div className="finora-settings-subscription__field">
              <span className="finora-settings-subscription__label">
                Demo ID
              </span>
              <strong className="finora-settings-subscription__value">
                {grant.demoId}
              </strong>
            </div>
          )}
        </div>

        <p className="finora-settings-subscription__authority">
          Status observed at {formatDateTime(decision.observedAt)} using FINORA authoritative system time.
        </p>
      </div>

      <div className="finora-settings-form__section finora-settings-subscription__history-section">
        <div className="finora-settings-form__section-header">
          <div className="finora-settings-form__section-heading">
            <h2 className="finora-settings-form__section-title">
              Renewal History
            </h2>

            <p className="finora-settings-form__section-subtitle">
              Append-only verified subscription renewals accepted for this FINORA branch.
            </p>
          </div>
        </div>

        {renewalHistory.length === 0 ? (
          <p className="finora-settings-subscription__empty-history">
            No verified renewal has been applied yet.
          </p>
        ) : (
          <div className="finora-settings-subscription__history-list">
            {renewalHistory.map(
              (record) => {
                const historyGrant =
                  record.accessGrant;

                if (
                  historyGrant.accessType !==
                    "REGISTERED"
                ) {
                  return null;
                }

                const payment =
                  historyGrant.registrationPayment;

                return (
                  <article
                    className="finora-settings-subscription__history-item"
                    key={record.packageId}
                  >
                    <div className="finora-settings-subscription__history-heading">
                      <strong className="finora-settings-subscription__history-cycle">
                        Cycle {historyGrant.registrationCycle ?? "ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â"}
                      </strong>

                      <span className="finora-settings-subscription__history-applied">
                        Applied {formatDateTime(record.appliedAt)}
                      </span>
                    </div>

                    <div className="finora-settings-form__grid finora-settings-subscription__grid">
                      <div className="finora-settings-subscription__field">
                        <span className="finora-settings-subscription__label">
                          Activated
                        </span>
                        <strong className="finora-settings-subscription__value">
                          {formatDateTime(historyGrant.validity.validFrom)}
                        </strong>
                      </div>

                      <div className="finora-settings-subscription__field">
                        <span className="finora-settings-subscription__label">
                          Expires
                        </span>
                        <strong className="finora-settings-subscription__value">
                          {formatDateTime(historyGrant.validity.validUntil)}
                        </strong>
                      </div>

                      {payment ? (
                        <>
                          <div className="finora-settings-subscription__field">
                            <span className="finora-settings-subscription__label">
                              Subscription Amount
                            </span>
                            <strong className="finora-settings-subscription__value">
                              {formatMoney(
                                payment.amount,
                                payment.currency,
                              )}
                            </strong>
                          </div>

                          <div className="finora-settings-subscription__field">
                            <span className="finora-settings-subscription__label">
                              Payment Mode
                            </span>
                            <strong className="finora-settings-subscription__value">
                              {payment.paymentMode.replaceAll("_", " ")}
                            </strong>
                          </div>

                          <div className="finora-settings-subscription__field">
                            <span className="finora-settings-subscription__label">
                              Paid At
                            </span>
                            <strong className="finora-settings-subscription__value">
                              {formatDateTime(payment.paidAt)}
                            </strong>
                          </div>
                        </>
                      ) : null}

                      <div className="finora-settings-subscription__field">
                        <span className="finora-settings-subscription__label">
                          Sequence
                        </span>
                        <strong className="finora-settings-subscription__value">
                          {record.sequence}
                        </strong>
                      </div>
                    </div>
                  </article>
                );
              },
            )}
          </div>
        )}
      </div>
    </section>
  );
}

// ============================================================
// END
// ============================================================
