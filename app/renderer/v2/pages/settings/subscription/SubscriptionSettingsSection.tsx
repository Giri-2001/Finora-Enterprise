/**
 * FINORA_P1_725X_LIVE_SUBSCRIPTION_SETTINGS
 *
 * Authoritative source: PostgreSQL Owner Wallet subscription.
 * Android uses native authenticated server session.
 * Windows uses trusted Electron Main IPC.
 *
 * Read-only. Never changes registration, billing or access grants.
 */

import { useEffect, useState } from "react";

import {
  getSession,
} from "../../../store/authStore";

import {
  getBusinessContext,
} from "../../../services/business/businessContextService";

import {
  isFinoraAndroidWallet,
} from "../../../services/wallet/finoraAndroidWalletBridge";

import {
  getFinoraAndroidPricing,
} from "../../../services/wallet/finoraAndroidWalletReads";

import {
  getFinoraServerWalletBridge,
} from "../../../services/wallet/finoraServerWalletBridge";

import type {
  ServerWalletLiveSubscription,
} from "../../../services/wallet/finoraServerWalletBridge";

import {
  loadFinoraServerSettingsIdentity,
} from "../../../services/business/finoraServerSettingsIdentity";

import {
  formatFinoraDateTime,
} from "../../../../shared/finoraDateTimeDisplay";

import SettingsFeedback from "../components/SettingsFeedback";

type LiveSubscription = {
  branchName: string;
  branchId: string;
  plan: ServerWalletLiveSubscription | null;
};

const displayDate = (value: string): string => {
  const formatted = formatFinoraDateTime(value);
  return formatted === "\u2014" ? "Unavailable" : formatted;
};

export default function SubscriptionSettingsSection() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<LiveSubscription | null>(null);

  useEffect(() => {
    let active = true;

    async function load(): Promise<void> {
      if (active) {
        setLoading(true);
        setError(null);
        setData(null);
      }

      const session = getSession();
      const context = getBusinessContext();

      if (
        !session ||
        !context ||
        !session.ownerId ||
        !session.businessId ||
        !session.branchId ||
        session.ownerId !== context.ownerId ||
        session.businessId !== context.businessId ||
        session.branchId !== context.branchId
      ) {
        if (active) {
          setError("Verified FINORA branch session is unavailable.");
          setLoading(false);
        }
        return;
      }

      try {
        const scope = {
          ownerId: session.ownerId,
          businessId: session.businessId,
          branchId: session.branchId,
        };

        const [identity, pricing] = await Promise.all([
          loadFinoraServerSettingsIdentity(scope),
          isFinoraAndroidWallet()
            ? getFinoraAndroidPricing()
            : (async () => {
                const bridge = getFinoraServerWalletBridge();
                return bridge
                  ? bridge.pricing()
                  : {
                      success: false as const,
                      errorCode: "SERVER_WALLET_BRIDGE_UNAVAILABLE",
                    };
              })(),
        ]);

        if (!active) return;

        if (!identity.success) {
          setError("Server Business identity unavailable: " + identity.errorCode);
          setLoading(false);
          return;
        }

        if (
          !pricing.success ||
          pricing.data.source !== "FINORA_POSTGRESQL_PRICING" ||
          pricing.data.branchId !== scope.branchId
        ) {
          setError(
            "Live PostgreSQL subscription unavailable or branch mismatch."
          );
          setLoading(false);
          return;
        }

        const current = pricing.data.currentSubscription;

        if (
          current &&
          (
            !Number.isFinite(Date.parse(current.startsAt)) ||
            !Number.isFinite(Date.parse(current.expiresAt)) ||
            !Number.isFinite(Date.parse(current.serverNow))
          )
        ) {
          setError("Invalid subscription dates returned by server.");
          setLoading(false);
          return;
        }

        setData({
          branchName: identity.data.branchName,
          branchId: identity.data.branchId,
          plan: current,
        });
        setLoading(false);
      } catch {
        if (active) {
          setError("Unable to verify the live server subscription.");
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <section className="finora-settings-section finora-settings-subscription-section">
        <SettingsFeedback
          kind="info"
          title="Loading Server Subscription"
          message="Verifying the active subscription from FINORA PostgreSQL."
        />
      </section>
    );
  }

  if (error || !data) {
    return (
      <section className="finora-settings-section finora-settings-subscription-section">
        <SettingsFeedback
          kind="danger"
          title="Server Subscription Unavailable"
          message={error ?? "Subscription verification failed."}
        />
      </section>
    );
  }

  const plan = data.plan;
  const status = plan?.status ?? "NO_ACTIVE_SUBSCRIPTION";

  const tone =
    status === "ACTIVE" ? "active" :
    status === "EXPIRED" ? "danger" : "warning";

  return (
    <section className="finora-settings-section finora-settings-subscription-section">
      <div className="finora-settings-form__section">
        <div className="finora-settings-form__section-header">
          <div className="finora-settings-form__section-heading">
            <h2 className="finora-settings-form__section-title">
              Current Server Subscription
            </h2>
            <p className="finora-settings-form__section-subtitle">
              Verified PostgreSQL subscription for the active FINORA branch.
            </p>
          </div>

          <span className={`finora-settings-subscription__status finora-settings-subscription__status--${tone}`}>
            {status.replaceAll("_", " ")}
          </span>
        </div>

        <div className="finora-settings-form__grid finora-settings-subscription__grid">
          <div className="finora-settings-subscription__field">
            <span className="finora-settings-subscription__label">Branch Name</span>
            <strong className="finora-settings-subscription__value">{data.branchName}</strong>
          </div>

          <div className="finora-settings-subscription__field">
            <span className="finora-settings-subscription__label">Branch ID</span>
            <strong className="finora-settings-subscription__value">{data.branchId}</strong>
          </div>

          <div className="finora-settings-subscription__field">
            <span className="finora-settings-subscription__label">Selected Plan</span>
            <strong className="finora-settings-subscription__value">
              {plan
                ? (() => {
                    const match = /^SUBSCRIPTION_(1|3|6|12)_MONTH$/.exec(plan.planCode);
                    if (!match) return "Unknown Plan";
                    const months = Number(match[1]);
                    return `${months} ${months === 1 ? "Month" : "Months"} Plan`;
                  })()
                : "No subscription"}
            </strong>
          </div>

          <div className="finora-settings-subscription__field">
            <span className="finora-settings-subscription__label">Subscription Amount</span>
            <strong className="finora-settings-subscription__value">
              {plan ? `₹${plan.amountInr}` : "Not available"}
            </strong>
          </div>

          <div className="finora-settings-subscription__field">
            <span className="finora-settings-subscription__label">Activated</span>
            <strong className="finora-settings-subscription__value">
              {plan ? displayDate(plan.startsAt) : "Not available"}
            </strong>
          </div>

          <div className="finora-settings-subscription__field">
            <span className="finora-settings-subscription__label">Expires</span>
            <strong className="finora-settings-subscription__value">
              {plan ? displayDate(plan.expiresAt) : "Not available"}
            </strong>
          </div>

          <div className="finora-settings-subscription__field">
            <span className="finora-settings-subscription__label">Remaining Days</span>
            <strong className="finora-settings-subscription__value">
              {plan ? plan.daysRemaining : "Not available"}
            </strong>
          </div>

          <div className="finora-settings-subscription__field">
            <span className="finora-settings-subscription__label">Auto Renewal</span>
            <strong className="finora-settings-subscription__value">
              {plan ? (plan.autoRenew ? "Enabled" : "Disabled") : "Not available"}
            </strong>
          </div>
        </div>

        <p className="finora-settings-subscription__authority">
          Source: FINORA PostgreSQL Subscription.
          {plan ? ` Server observed at ${displayDate(plan.serverNow)}.` : ""}
        </p>
      </div>
    </section>
  );
}