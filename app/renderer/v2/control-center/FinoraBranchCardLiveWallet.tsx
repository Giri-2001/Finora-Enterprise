import { useEffect, useState } from "react";
import { Phone, RefreshCw, Wallet } from "lucide-react";

import type {
  FinoraServerLiveWalletRecordView,
} from "../../../../electron/control-center/finoraControlCenterPreload";

type Status = "LOADING" | "READY" | "NOT_FOUND" | "ERROR";

const LIMIT = 100;
const MAX_PAGES = 100;

function formatBalance(value: string): string {
  if (!/^\d{1,10}(\.\d{1,2})?$/.test(value)) {
    return "Unavailable";
  }

  const [whole, fraction = ""] = value.split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  return `₹${grouped}.${fraction.padEnd(2, "0")}`;
}

export default function FinoraBranchCardLiveWallet({
  ownerId,
  businessId,
  branchId,
}: {
  ownerId: string;
  businessId: string;
  branchId: string;
}) {
  const [revision, setRevision] = useState(0);
  const [status, setStatus] = useState<Status>("LOADING");
  const [wallet, setWallet] = useState<
    FinoraServerLiveWalletRecordView | undefined
  >();
  const [syncedAt, setSyncedAt] = useState<string>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    let active = true;

    setStatus("LOADING");
    setWallet(undefined);
    setSyncedAt(undefined);
    setError(undefined);

    void (async () => {
      try {
        const bridge = window.finoraControlCenter;

        if (
          !bridge ||
          typeof bridge.getServerLiveWallets !== "function"
        ) {
          throw new Error("Server wallet bridge unavailable.");
        }

        let offset = 0;
        let found: FinoraServerLiveWalletRecordView | undefined;
        let completed = false;

        for (let page = 0; page < MAX_PAGES; page++) {
          const response = await bridge.getServerLiveWallets({
            limit: LIMIT,
            offset,
          });

          if (!active) return;

          if (!response.success) {
            const message = response.error;

            const reason =
              /credential.*(missing|not configured|unavailable)/i.test(message)
                ? "Administrator credential not configured."
                : /rejected.*credential|invalid.*credential|unauthorized|401/i.test(message)
                  ? "Administrator authorization failed."
                  : /unable to reach|network|timed out|timeout/i.test(message)
                    ? "FINORA wallet server connection unavailable."
                    : /wallet.*response.*invalid|record.*invalid/i.test(message)
                      ? "Invalid wallet server response."
                      : "Wallet request failed. Check Control Center server connection.";

            throw new Error(reason);
          }

          const data = response.data;

          if (
            data.source !== "POSTGRESQL_WALLETS" ||
            data.limit !== LIMIT ||
            data.offset !== offset ||
            !Array.isArray(data.wallets) ||
            typeof data.hasMore !== "boolean"
          ) {
            throw new Error("Invalid live wallet response.");
          }

          for (const item of data.wallets) {
            if (
              item.owner_id === ownerId &&
              item.business_id === businessId &&
              item.branch_id === branchId
            ) {
              if (found) {
                throw new Error(
                  "Duplicate matching wallet records."
                );
              }

              found = item;
            }
          }

          if (!data.hasMore) {
            completed = true;
            break;
          }

          if (data.wallets.length !== LIMIT) {
            throw new Error("Incomplete wallet pagination.");
          }

          offset += LIMIT;
        }

        if (!completed) {
          throw new Error(
            "Wallet directory exceeds verification limit."
          );
        }

        if (!active) return;

        setWallet(found);
        setSyncedAt(new Date().toLocaleString("en-IN"));
        setStatus(found ? "READY" : "NOT_FOUND");
      } catch (cause) {
        if (!active) return;

        setWallet(undefined);
        setSyncedAt(undefined);
        setError(
          cause instanceof Error
            ? cause.message
            : "Server wallet unavailable."
        );
        setStatus("ERROR");
      }
    })();

    return () => {
      active = false;
    };
  }, [ownerId, businessId, branchId, revision]);

  const busy = status === "LOADING";

  const mobile =
    wallet?.owner_mobile &&
    /^[6-9][0-9]{9}$/.test(wallet.owner_mobile)
      ? wallet.owner_mobile
      : undefined;

  return (
    <section
      aria-label="Branch live server wallet"
      onClick={(event) => event.stopPropagation()}
      style={{
        marginTop: 14,
        padding: 12,
        border: "1px solid rgba(148,163,184,0.22)",
        borderRadius: 12,
        background: "rgba(15,23,42,0.28)",
        display: "grid",
        gap: 9,
        overflowWrap: "anywhere",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 8,
        }}
      >
        <strong style={{ display: "inline-flex", gap: 7, alignItems: "center" }}>
          <Wallet size={16} />
          Live Wallet Balance
        </strong>

        <button
          type="button"
          title="Refresh live wallet"
          aria-label="Refresh live wallet"
          disabled={busy}
          onClick={() => setRevision((value) => value + 1)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            cursor: busy ? "wait" : "pointer",
          }}
        >
          <RefreshCw size={15} />
          Refresh
        </button>
      </div>

      {status === "READY" && wallet ? (
        <>
          <div style={{ fontSize: 23, fontWeight: 800 }}>
            {formatBalance(String(wallet.balance_inr))}
          </div>
          <div style={{ fontSize: 12 }}>
            <strong>Owner:</strong> {wallet.owner_name}
          </div>
          <div style={{ fontSize: 12 }}>
            <strong>Business:</strong> {wallet.business_name}
          </div>
          <div style={{ fontSize: 12 }}>
            <strong>Branch:</strong> {wallet.branch_name}
          </div>
          <div
            style={{
              fontSize: 12,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Phone size={14} />
            <span>
              Owner Mobile: {mobile ?? "Not available"}
            </span>
          </div>
          <div style={{ fontSize: 11, opacity: 0.75 }}>
            Last Synced: {syncedAt}
          </div>
          <div style={{ fontSize: 11, opacity: 0.75 }}>
            Wallet Updated:{" "}
            {new Date(wallet.wallet_updated_at).toLocaleString("en-IN")}
          </div>
          <div style={{ fontSize: 10, opacity: 0.7 }}>
            Source: PostgreSQL | Status: {wallet.wallet_status}
          </div>
        </>
      ) : (
        <div
          role="status"
          style={{ fontSize: 12, opacity: 0.8 }}
        >
          {status === "LOADING"
            ? "Checking PostgreSQL wallet..."
            : status === "NOT_FOUND"
              ? "No matching server wallet found."
              : `Live wallet unavailable: ${error ?? "Unknown error"}`}
        </div>
      )}
    </section>
  );
}