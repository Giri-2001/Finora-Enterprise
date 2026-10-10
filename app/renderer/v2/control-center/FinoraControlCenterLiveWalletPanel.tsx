import { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Wallet,
} from "lucide-react";

import type {
  FinoraServerLiveWalletRecordView,
} from "../../../../electron/control-center/finoraControlCenterPreload";

const PAGE_SIZE = 4;

type LoadState =
  | "LOADING"
  | "READY"
  | "ERROR";

function formatInr(value: string): string {
  if (!/^\d{1,10}(\.\d{1,2})?$/.test(value)) {
    return "Unavailable";
  }

  return new Intl.NumberFormat(
    "en-IN",
    {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  ).format(
    Number(value),
  );
}

function formatDateTime(
  value:
    | string
    | Date
    | undefined,
): string {
  if (!value) {
    return "Unavailable";
  }

  const date =
    value instanceof Date
      ? value
      : new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "Unavailable";
  }

  const day = String(
    date.getDate(),
  ).padStart(2, "0");

  const month = String(
    date.getMonth() + 1,
  ).padStart(2, "0");

  const year =
    date.getFullYear();

  let hours =
    date.getHours();

  const minutes = String(
    date.getMinutes(),
  ).padStart(2, "0");

  const seconds = String(
    date.getSeconds(),
  ).padStart(2, "0");

  const meridiem =
    hours >= 12
      ? "PM"
      : "AM";

  hours =
    hours % 12 || 12;

  const hourText =
    String(hours).padStart(
      2,
      "0",
    );

  return `${day}-${month}-${year} ${hourText}:${minutes}:${seconds} ${meridiem}`;
}

const sectionStyle: React.CSSProperties = {
  border:
    "1px solid var(--border, #334155)",
  borderRadius: 18,
  padding: 18,
  marginBottom: 20,
  minWidth: 0,
};

const cardStyle: React.CSSProperties = {
  border:
    "1px solid rgba(148, 163, 184, 0.20)",
  borderRadius: 18,
  padding: 18,
  background:
    "linear-gradient(180deg, rgba(15,23,42,0.98) 0%, rgba(9,16,35,0.98) 100%)",
  minWidth: 0,
  display: "flex",
  flexDirection: "column",
  gap: 10,
};

const metaLabelStyle: React.CSSProperties = {
  fontSize: 12,
  opacity: 0.72,
  letterSpacing: 0.4,
};

const metaValueStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  lineHeight: 1.35,
  wordBreak: "break-word",
};

const paginatorButtonBase: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  minWidth: 122,
  padding: "12px 16px",
  borderRadius: 12,
  border:
    "1px solid rgba(96, 165, 250, 0.35)",
  fontSize: 14,
  fontWeight: 700,
  transition:
    "transform 120ms ease, opacity 120ms ease",
};

export default function FinoraControlCenterLiveWalletPanel() {
  const [offset, setOffset] =
    useState(0);

  const [revision, setRevision] =
    useState(0);

  const [state, setState] =
    useState<LoadState>(
      "LOADING",
    );

  const [error, setError] =
    useState<string>();

  const [wallets, setWallets] =
    useState<
      FinoraServerLiveWalletRecordView[]
    >([]);

  const [hasMore, setHasMore] =
    useState(false);

  const [fetchedAt, setFetchedAt] =
    useState<string>();

  useEffect(
    () => {
      let active = true;

      setState("LOADING");
      setWallets([]);
      setHasMore(false);
      setFetchedAt(undefined);
      setError(undefined);

      void (async () => {
        const bridge =
          window.finoraControlCenter;

        if (
          !bridge ||
          typeof bridge.getServerLiveWallets !==
            "function"
        ) {
          if (active) {
            setState("ERROR");
            setError(
              "Server Live Wallet bridge is unavailable on this platform.",
            );
          }

          return;
        }

        try {
          const result =
            await bridge.getServerLiveWallets(
              {
                limit:
                  PAGE_SIZE,
                offset,
              },
            );

          if (!active) {
            return;
          }

          if (!result.success) {
            setState("ERROR");
            setError(
              result.error,
            );
            return;
          }

          if (
            result.data.source !==
              "POSTGRESQL_WALLETS" ||
            result.data.limit !==
              PAGE_SIZE ||
            result.data.offset !==
              offset ||
            !Array.isArray(
              result.data.wallets,
            ) ||
            typeof result.data.hasMore !==
              "boolean"
          ) {
            setState("ERROR");
            setError(
              "Server Live Wallet response is inconsistent.",
            );
            return;
          }

          setWallets(
            result.data.wallets,
          );
          setHasMore(
            result.data.hasMore,
          );
          setFetchedAt(
            formatDateTime(
              new Date(),
            ),
          );
          setState("READY");
        } catch {
          if (!active) {
            return;
          }

          setState("ERROR");
          setError(
            "Unable to retrieve live wallet balances.",
          );
        }
      })();

      return () => {
        active = false;
      };
    },
    [offset, revision],
  );

  // FINORA_P475_HIDE_TEST_MAIN_BRANCH
  // UI-only exclusion of one exact historical test wallet.
  // No PostgreSQL deletion or financial data mutation.
  const visibleWallets = wallets.filter(
    (wallet) =>
      !(
        wallet.branch_id === "6607590671" &&
        wallet.wallet_id === "1191224453" &&
        wallet.branch_name === "Test Main Branch" &&
        wallet.business_name === "Test Finance"
      ),
  );
  const busy =
    state === "LOADING";

  const currentPage =
    Math.floor(
      offset / PAGE_SIZE,
    ) + 1;

  const previousDisabled =
    busy || offset === 0;

  const nextDisabled =
    busy || !hasMore;

  return (
    <section
      aria-label="Server Live Wallet Balances"
      style={sectionStyle}
    >
      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems:
            "flex-start",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 12,
        }}
      >
        <div>
          <h2
            style={{
              fontSize: 19,
              fontWeight: 700,
              display: "flex",
              alignItems:
                "center",
              gap: 8,
              margin: 0,
            }}
          >
            <Wallet size={20} />
            Server Live Wallet Balances
          </h2>

          <p
            style={{
              fontSize: 13,
              opacity: 0.75,
              marginTop: 6,
              marginBottom: 0,
            }}
          >
            PostgreSQL wallet balances, not USB or branch snapshots.
          </p>
        </div>

        <button
          type="button"
          disabled={busy}
          onClick={() =>
            setRevision(
              (n) => n + 1,
            )
          }
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding:
              "10px 16px",
            borderRadius: 12,
            cursor:
              busy
                ? "wait"
                : "pointer",
            fontWeight: 700,
            border:
              "1px solid rgba(255,255,255,0.18)",
          }}
        >
          <RefreshCw
            size={16}
          />
          Refresh
        </button>
      </div>

      {state === "LOADING" && (
        <p role="status">
          Checking live server wallet balances...
        </p>
      )}

      {state === "ERROR" && (
        <p
          role="alert"
          style={{
            marginTop: 14,
          }}
        >
          Live wallet unavailable:{" "}
          {error ??
            "Unknown error"}
        </p>
      )}

      {state === "READY" && (
        <>
          <p
            style={{
              fontSize: 12,
              opacity: 0.78,
              marginTop: 0,
              marginBottom: 16,
            }}
          >
            Source: PostgreSQL | Retrieved:{" "}
            {fetchedAt ??
              "Unavailable"}
          </p>

          {visibleWallets.length === 0 ? (
            <p>
              No wallet records on this page.
            </p>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(2, minmax(0, 1fr))",
                gap: 18,
                alignItems:
                  "stretch",
              }}
            >
              {visibleWallets.map(
                (wallet) => (
                  <article
                    key={`${wallet.owner_id}-${wallet.business_id}-${wallet.branch_id}-${wallet.wallet_id}`}
                    style={
                      cardStyle
                    }
                  >
                    <div
                      style={{
                        display:
                          "flex",
                        justifyContent:
                          "space-between",
                        alignItems:
                          "flex-start",
                        gap: 12,
                      }}
                    >
                      <h3
                        style={{
                          fontSize: 22,
                          fontWeight: 800,
                          margin: 0,
                          lineHeight: 1.2,
                          wordBreak:
                            "break-word",
                        }}
                      >
                        {wallet.branch_name}
                      </h3>

                      <span
                        style={{
                          padding:
                            "6px 12px",
                          borderRadius: 999,
                          border:
                            "1px solid rgba(148, 163, 184, 0.30)",
                          fontSize: 13,
                          fontWeight: 800,
                          whiteSpace:
                            "nowrap",
                        }}
                      >
                        {wallet.wallet_status}
                      </span>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gap: 8,
                      }}
                    >
                      <div>
                        <div
                          style={
                            metaLabelStyle
                          }
                        >
                          OWNER
                        </div>
                        <div
                          style={
                            metaValueStyle
                          }
                        >
                          {wallet.owner_name}
                        </div>
                      </div>

                      <div>
                        <div
                          style={
                            metaLabelStyle
                          }
                        >
                          BUSINESS
                        </div>
                        <div
                          style={
                            metaValueStyle
                          }
                        >
                          {wallet.business_name}
                        </div>
                      </div>

                      <div>
                        <div
                          style={
                            metaLabelStyle
                          }
                        >
                          BRANCH
                        </div>
                        <div
                          style={
                            metaValueStyle
                          }
                        >
                          {wallet.branch_name}
                        </div>
                      </div>

                      <div>
                        <div
                          style={
                            metaLabelStyle
                          }
                        >
                          OWNER MOBILE
                        </div>
                        <div
                          style={
                            metaValueStyle
                          }
                        >
                          {wallet.owner_mobile?.trim()
                            ? wallet.owner_mobile
                            : "Not available"}
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        borderTop:
                          "1px solid rgba(148, 163, 184, 0.20)",
                        marginTop: 2,
                        paddingTop: 14,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 13,
                          opacity: 0.78,
                          letterSpacing:
                            0.4,
                          marginBottom: 6,
                        }}
                      >
                        LIVE WALLET BALANCE
                      </div>

                      <div
                        style={{
                          fontSize: 28,
                          fontWeight: 900,
                          lineHeight: 1.1,
                          marginBottom: 12,
                        }}
                      >
                        {formatInr(
                          wallet.balance_inr,
                        )}
                      </div>

                      <div
                        style={{
                          fontSize: 13,
                          opacity: 0.88,
                          marginBottom: 6,
                        }}
                      >
                        Last Synced:{" "}
                        {fetchedAt ??
                          "Unavailable"}
                      </div>

                      <div
                        style={{
                          fontSize: 13,
                          opacity: 0.88,
                          marginBottom: 6,
                        }}
                      >
                        Wallet Updated:{" "}
                        {formatDateTime(
                          wallet.wallet_updated_at,
                        )}
                      </div>

                      <div
                        style={{
                          fontSize: 13,
                          opacity: 0.78,
                          marginBottom: 6,
                        }}
                      >
                        Branch ID:{" "}
                        {wallet.branch_id}
                      </div>

                      <div
                        style={{
                          fontSize: 13,
                          opacity: 0.78,
                          marginBottom: 6,
                        }}
                      >
                        Wallet ID:{" "}
                        {wallet.wallet_id}
                      </div>

                      <div
                        style={{
                          fontSize: 13,
                          opacity: 0.72,
                        }}
                      >
                        Source: PostgreSQL (server verified)
                      </div>
                    </div>
                  </article>
                ),
              )}
            </div>
          )}

          <div
            style={{
              display: "flex",
              justifyContent:
                "center",
              alignItems:
                "center",
              gap: 14,
              marginTop: 20,
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              disabled={
                previousDisabled
              }
              onClick={() =>
                setOffset(
                  (current) =>
                    Math.max(
                      0,
                      current -
                        PAGE_SIZE,
                    ),
                )
              }
              style={{
                ...paginatorButtonBase,
                cursor:
                  previousDisabled
                    ? "not-allowed"
                    : "pointer",
                opacity:
                  previousDisabled
                    ? 0.55
                    : 1,
                background:
                  previousDisabled
                    ? "rgba(15,23,42,0.70)"
                    : "linear-gradient(135deg, rgba(30,41,59,0.95) 0%, rgba(37,99,235,0.92) 100%)",
                color:
                  "#ffffff",
              }}
            >
              <ChevronLeft
                size={16}
              />
              Previous
            </button>

            <div
              style={{
                minWidth: 104,
                textAlign: "center",
                padding:
                  "12px 18px",
                borderRadius: 12,
                border:
                  "1px solid rgba(148, 163, 184, 0.20)",
                fontSize: 15,
                fontWeight: 800,
                background:
                  "rgba(15,23,42,0.70)",
              }}
            >
              Page {currentPage}
            </div>

            <button
              type="button"
              disabled={nextDisabled}
              onClick={() =>
                setOffset(
                  (current) =>
                    current +
                    PAGE_SIZE,
                )
              }
              style={{
                ...paginatorButtonBase,
                cursor:
                  nextDisabled
                    ? "not-allowed"
                    : "pointer",
                opacity:
                  nextDisabled
                    ? 0.55
                    : 1,
                background:
                  nextDisabled
                    ? "rgba(15,23,42,0.70)"
                    : "linear-gradient(135deg, rgba(37,99,235,0.92) 0%, rgba(14,165,233,0.92) 100%)",
                color:
                  "#ffffff",
              }}
            >
              Next
              <ChevronRight
                size={16}
              />
            </button>
          </div>
        </>
      )}
    </section>
  );
}
