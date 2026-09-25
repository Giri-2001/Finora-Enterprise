import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  FinoraControlCenterWalletHistoryView,
} from "../../../../electron/control-center/finoraControlCenterPreload";

export type FinoraControlCenterWalletHistoryScope =
  | {
      mode:
        "GLOBAL";
    }
  | {
      mode:
        "BRANCH";

      ownerId:
        string;

      businessId:
        string;

      branchId:
        string;

      branchCode:
        string;
    };

type WalletHistoryLoadState =
  | "LOADING"
  | "READY"
  | "ERROR"
  | "UNAVAILABLE";

type WalletHistoryPeriod =
  | "TODAY"
  | "LAST_7_DAYS"
  | "THIS_MONTH"
  | "ALL";

type WalletHistoryDecisionFilter =
  | "ALL"
  | "APPROVED"
  | "DECLINED";

const FONT_FAMILY =
  "Inter, ui-sans-serif, system-ui, sans-serif";

function scopeKey(
  ownerId: string,
  businessId: string,
  branchId: string,
): string {

  return [
    ownerId,
    businessId,
    branchId,
  ].join(
    "\u001f",
  );
}

function matchesBranchScope(
  record:
    FinoraControlCenterWalletHistoryView,

  scope:
    FinoraControlCenterWalletHistoryScope,
): boolean {

  if (
    scope.mode ===
      "GLOBAL"
  ) {
    return true;
  }

  return (
    record.ownerId ===
      scope.ownerId &&
    record.businessId ===
      scope.businessId &&
    record.branchId ===
      scope.branchId
  );
}

function startOfLocalDay(
  value:
    Date,
): Date {

  return new Date(
    value.getFullYear(),
    value.getMonth(),
    value.getDate(),
    0,
    0,
    0,
    0,
  );
}

function matchesPeriod(
  value:
    string,

  period:
    WalletHistoryPeriod,

  now:
    Date,
): boolean {

  if (
    period ===
      "ALL"
  ) {
    return true;
  }

  const timestamp =
    new Date(
      value,
    );

  if (
    Number.isNaN(
      timestamp.getTime(),
    )
  ) {
    return false;
  }

  const today =
    startOfLocalDay(
      now,
    );

  const tomorrow =
    new Date(
      today,
    );

  tomorrow.setDate(
    tomorrow.getDate() +
      1,
  );

  if (
    period ===
      "TODAY"
  ) {
    return (
      timestamp >=
        today &&
      timestamp <
        tomorrow
    );
  }

  if (
    period ===
      "LAST_7_DAYS"
  ) {

    const start =
      new Date(
        today,
      );

    start.setDate(
      start.getDate() -
        6,
    );

    return (
      timestamp >=
        start &&
      timestamp <
        tomorrow
    );
  }

  const monthStart =
    new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
      0,
      0,
      0,
      0,
    );

  const nextMonth =
    new Date(
      now.getFullYear(),
      now.getMonth() +
        1,
      1,
      0,
      0,
      0,
      0,
    );

  return (
    timestamp >=
      monthStart &&
    timestamp <
      nextMonth
  );
}

function formatTimestamp(
  value:
    string,
): string {

  const parsed =
    new Date(
      value,
    );

  if (
    Number.isNaN(
      parsed.getTime(),
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      year:
        "numeric",

      month:
        "short",

      day:
        "2-digit",

      hour:
        "2-digit",

      minute:
        "2-digit",

      second:
        "2-digit",
    },
  ).format(
    parsed,
  );
}

function formatAmount(
  amountMinor:
    number,

  currency:
    string,
): string {

  try {

    return new Intl.NumberFormat(
      "en-IN",
      {
        style:
          "currency",

        currency,
      },
    ).format(
      amountMinor /
        100,
    );

  } catch {

    return (
      `${currency} ` +
      (
        amountMinor /
        100
      ).toLocaleString(
        "en-IN",
        {
          minimumFractionDigits:
            2,

          maximumFractionDigits:
            2,
        },
      )
    );
  }
}

function formatApprovedTotals(
  records:
    FinoraControlCenterWalletHistoryView[],
): string {

  const totals =
    new Map<
      string,
      number
    >();

  for (
    const record of
    records
  ) {

    if (
      record.decision !==
        "APPROVED"
    ) {
      continue;
    }

    totals.set(
      record.currency,
      (
        totals.get(
          record.currency,
        ) ??
        0
      ) +
        record.amountMinor,
    );
  }

  if (
    totals.size ===
      0
  ) {
    return "—";
  }

  return Array.from(
    totals.entries(),
  )
    .map(
      (
        [
          currency,
          amountMinor,
        ],
      ) =>
        formatAmount(
          amountMinor,
          currency,
        ),
    )
    .join(
      " · ",
    );
}

const buttonStyle = {
  minHeight:
    "38px",

  padding:
    "8px 13px",

  border:
    "1px solid rgba(148, 163, 184, 0.28)",

  borderRadius:
    "9px",

  background:
    "rgba(30, 41, 59, 0.72)",

  color:
    "#e2e8f0",

  fontFamily:
    FONT_FAMILY,

  fontSize:
    "12px",

  fontWeight:
    700,

  cursor:
    "pointer",
} as const;

const inputStyle = {
  width:
    "100%",

  minHeight:
    "38px",

  boxSizing:
    "border-box",

  border:
    "1px solid rgba(148, 163, 184, 0.24)",

  borderRadius:
    "9px",

  padding:
    "7px 10px",

  background:
    "rgba(15, 23, 42, 0.72)",

  color:
    "#e2e8f0",

  fontFamily:
    FONT_FAMILY,

  fontSize:
    "12px",
} as const;

export default function FinoraControlCenterWalletHistoryPanel({
  scope,
  onClose,
}: {
  scope:
    FinoraControlCenterWalletHistoryScope;

  onClose:
    () => void;
}) {

  const [
    loadState,
    setLoadState,
  ] = useState<
    WalletHistoryLoadState
  >(
    "LOADING",
  );

  const [
    records,
    setRecords,
  ] = useState<
    FinoraControlCenterWalletHistoryView[]
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
    filterOpen,
    setFilterOpen,
  ] = useState(
    false,
  );

  const [
    period,
    setPeriod,
  ] = useState<
    WalletHistoryPeriod
  >(
    "TODAY",
  );

  const [
    decisionFilter,
    setDecisionFilter,
  ] = useState<
    WalletHistoryDecisionFilter
  >(
    "ALL",
  );

  const [
    branchFilter,
    setBranchFilter,
  ] = useState(
    "ALL",
  );

  const loadHistory =
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

        setErrorMessage(
          undefined,
        );

        try {

          const result =
            await bridge.getWalletHistory();

          if (!result.success) {

            setLoadState(
              "ERROR",
            );

            setErrorMessage(
              result.error,
            );

            return;
          }

          setRecords(
            result.data,
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
              : "Unable to load FINORA Wallet History.",
          );
        }
      },
      [],
    );

  useEffect(
    () => {
      void loadHistory();
    },
    [
      loadHistory,
    ],
  );

  const branchOptions =
    useMemo(
      () => {

        const unique =
          new Map<
            string,
            {
              key:
                string;

              label:
                string;
            }
          >();

        for (
          const record of
          records
        ) {

          const key =
            scopeKey(
              record.ownerId,
              record.businessId,
              record.branchId,
            );

          if (
            !unique.has(
              key,
            )
          ) {
            unique.set(
              key,
              {
                key,

                label:
                  `${record.businessCode} / ${record.branchCode}`,
              },
            );
          }
        }

        return Array.from(
          unique.values(),
        ).sort(
          (
            left,
            right,
          ) =>
            left.label.localeCompare(
              right.label,
            ),
        );
      },
      [
        records,
      ],
    );

  const filteredRecords =
    useMemo(
      () => {

        const now =
          new Date();

        return records
          .filter(
            (record) =>
              matchesBranchScope(
                record,
                scope,
              ),
          )
          .filter(
            (record) =>
              decisionFilter ===
                "ALL" ||
              record.decision ===
                decisionFilter,
          )
          .filter(
            (record) =>
              matchesPeriod(
                record.decisionAt,
                period,
                now,
              ),
          )
          .filter(
            (record) => {

              if (
                scope.mode !==
                  "GLOBAL" ||
                branchFilter ===
                  "ALL"
              ) {
                return true;
              }

              return (
                scopeKey(
                  record.ownerId,
                  record.businessId,
                  record.branchId,
                ) ===
                branchFilter
              );
            },
          )
          .sort(
            (
              left,
              right,
            ) =>
              Date.parse(
                right.decisionAt,
              ) -
              Date.parse(
                left.decisionAt,
              ),
          );
      },
      [
        records,
        scope,
        period,
        decisionFilter,
        branchFilter,
      ],
    );

  const approvedCount =
    filteredRecords.filter(
      (record) =>
        record.decision ===
          "APPROVED",
    ).length;

  const declinedCount =
    filteredRecords.filter(
      (record) =>
        record.decision ===
          "DECLINED",
    ).length;

  const affectedBranchCount =
    new Set(
      filteredRecords.map(
        (record) =>
          scopeKey(
            record.ownerId,
            record.businessId,
            record.branchId,
          ),
      ),
    ).size;

  const approvedAmount =
    formatApprovedTotals(
      filteredRecords,
    );

  const title =
    scope.mode ===
      "GLOBAL"
      ? "FINORA Wallet History"
      : `Wallet History · ${scope.branchCode}`;

  const periodLabel =
    period ===
      "TODAY"
      ? "Today"
      : period ===
          "LAST_7_DAYS"
        ? "Last 7 Days"
        : period ===
            "THIS_MONTH"
          ? "This Month"
          : "All History";

  return (
    <section
      data-finora-control-center-wallet-history="true"
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

        color:
          "#e2e8f0",

        fontFamily:
          FONT_FAMILY,
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

          flexWrap:
            "wrap",

          gap:
            "12px",
        }}
      >
        <div>
          <h2
            style={{
              margin:
                0,

              fontSize:
                "20px",

              fontWeight:
                800,
            }}
          >
            {title}
          </h2>

          <div
            style={{
              marginTop:
                "6px",

              fontSize:
                "12px",

              opacity:
                0.68,
            }}
          >
            Report Period: {periodLabel}
          </div>
        </div>

        <div
          style={{
            display:
              "flex",

            gap:
              "8px",

            flexWrap:
              "wrap",

            justifyContent:
              "flex-end",
          }}
        >
          <button
            type="button"
            onClick={() => {
              setFilterOpen(
                (current) =>
                  !current,
              );
            }}
            style={
              buttonStyle
            }
          >
            Reports Filter
          </button>

          <button
            type="button"
            onClick={() => {
              void loadHistory();
            }}
            style={
              buttonStyle
            }
          >
            Refresh
          </button>

          <button
            type="button"
            onClick={
              onClose
            }
            style={
              buttonStyle
            }
          >
            ← Back
          </button>
        </div>
      </div>

      {filterOpen && (
        <div
          data-finora-wallet-history-filters="true"
          style={{
            marginTop:
              "16px",

            display:
              "grid",

            gridTemplateColumns:
              scope.mode ===
                "GLOBAL"
                ? "repeat(auto-fit, minmax(180px, 1fr))"
                : "repeat(auto-fit, minmax(220px, 1fr))",

            gap:
              "10px",

            padding:
              "14px",

            border:
              "1px solid rgba(148, 163, 184, 0.16)",

            borderRadius:
              "12px",

            background:
              "rgba(15, 23, 42, 0.32)",
          }}
        >
          <label
            style={{
              display:
                "grid",

              gap:
                "6px",

              fontSize:
                "11px",

              fontWeight:
                700,
            }}
          >
            Period

            <select
              value={
                period
              }
              onChange={(event) => {
                setPeriod(
                  event.target.value as
                    WalletHistoryPeriod,
                );
              }}
              style={
                inputStyle
              }
            >
              <option value="TODAY">
                Today
              </option>

              <option value="LAST_7_DAYS">
                Last 7 Days
              </option>

              <option value="THIS_MONTH">
                This Month
              </option>

              <option value="ALL">
                All History
              </option>
            </select>
          </label>

          <label
            style={{
              display:
                "grid",

              gap:
                "6px",

              fontSize:
                "11px",

              fontWeight:
                700,
            }}
          >
            Decision

            <select
              value={
                decisionFilter
              }
              onChange={(event) => {
                setDecisionFilter(
                  event.target.value as
                    WalletHistoryDecisionFilter,
                );
              }}
              style={
                inputStyle
              }
            >
              <option value="ALL">
                All Decisions
              </option>

              <option value="APPROVED">
                Approved
              </option>

              <option value="DECLINED">
                Declined
              </option>
            </select>
          </label>

          {scope.mode ===
            "GLOBAL" && (
            <label
              style={{
                display:
                  "grid",

                gap:
                  "6px",

                fontSize:
                  "11px",

                fontWeight:
                  700,
              }}
            >
              Branch

              <select
                value={
                  branchFilter
                }
                onChange={(event) => {
                  setBranchFilter(
                    event.target.value,
                  );
                }}
                style={
                  inputStyle
                }
              >
                <option value="ALL">
                  All Branches
                </option>

                {branchOptions.map(
                  (option) => (
                    <option
                      key={
                        option.key
                      }
                      value={
                        option.key
                      }
                    >
                      {option.label}
                    </option>
                  ),
                )}
              </select>
            </label>
          )}
        </div>
      )}

      <div
        style={{
          marginTop:
            "16px",

          display:
            "grid",

          gridTemplateColumns:
            "repeat(auto-fit, minmax(150px, 1fr))",

          gap:
            "10px",
        }}
      >
        {[
          [
            "Records",
            filteredRecords.length.toLocaleString(
              "en-IN",
            ),
          ],
          [
            "Approved",
            approvedCount.toLocaleString(
              "en-IN",
            ),
          ],
          [
            "Approved Amount",
            approvedAmount,
          ],
          [
            "Branches",
            affectedBranchCount.toLocaleString(
              "en-IN",
            ),
          ],
          [
            "Declined",
            declinedCount.toLocaleString(
              "en-IN",
            ),
          ],
        ].map(
          (
            [
              label,
              value,
            ],
          ) => (
            <div
              key={
                label
              }
              style={{
                minWidth:
                  0,

                padding:
                  "13px",

                border:
                  "1px solid rgba(148, 163, 184, 0.16)",

                borderRadius:
                  "11px",

                background:
                  "rgba(30, 41, 59, 0.42)",
              }}
            >
              <div
                style={{
                  fontSize:
                    "10px",

                  textTransform:
                    "uppercase",

                  letterSpacing:
                    "0.06em",

                  opacity:
                    0.58,
                }}
              >
                {label}
              </div>

              <div
                style={{
                  marginTop:
                    "5px",

                  fontSize:
                    "16px",

                  fontWeight:
                    800,

                  overflowWrap:
                    "anywhere",
                }}
              >
                {value}
              </div>
            </div>
          ),
        )}
      </div>

      {loadState ===
        "LOADING" && (
        <div
          style={{
            marginTop:
              "18px",

            padding:
              "20px",

            textAlign:
              "center",

            opacity:
              0.72,
          }}
        >
          Loading FINORA Wallet History…
        </div>
      )}

      {(
        loadState ===
          "ERROR" ||
        loadState ===
          "UNAVAILABLE"
      ) && (
        <div
          role="alert"
          style={{
            marginTop:
              "18px",

            padding:
              "14px",

            border:
              "1px solid rgba(248, 113, 113, 0.28)",

            borderRadius:
              "10px",

            fontSize:
              "12px",
          }}
        >
          {errorMessage ??
            "Unable to load FINORA Wallet History."}
        </div>
      )}

      {(
        loadState ===
          "READY" &&
        filteredRecords.length ===
          0
      ) && (
        <div
          style={{
            marginTop:
              "18px",

            padding:
              "22px",

            border:
              "1px dashed rgba(148, 163, 184, 0.24)",

            borderRadius:
              "12px",

            textAlign:
              "center",

            fontSize:
              "12px",

            lineHeight:
              1.55,

            opacity:
              0.72,
          }}
        >
          No audited Wallet Recharge records match this report.
          Historical recharge records are shown only when authenticated
          evidence has been persisted; FINORA does not fabricate missing
          history.
        </div>
      )}

      {(
        loadState ===
          "READY" &&
        filteredRecords.length >
          0
      ) && (
        <div
          style={{
            marginTop:
              "18px",

            overflowX:
              "auto",

            border:
              "1px solid rgba(148, 163, 184, 0.16)",

            borderRadius:
              "12px",
          }}
        >
          <table
            style={{
              width:
                "100%",

              minWidth:
                "1380px",

              borderCollapse:
                "collapse",

              fontSize:
                "11px",
            }}
          >
            <thead>
              <tr>
                {[
                  "Decision",
                  "Decision Date / Time",
                  "Branch",
                  "Amount",
                  "Payment Reference",
                  "Payment",
                  "Request ID",
                  "Imported Request",
                  "Exported Result",
                ].map(
                  (label) => (
                    <th
                      key={
                        label
                      }
                      style={{
                        padding:
                          "10px",

                        textAlign:
                          "left",

                        borderBottom:
                          "1px solid rgba(148, 163, 184, 0.18)",

                        background:
                          "rgba(30, 41, 59, 0.55)",

                        fontSize:
                          "10px",

                        textTransform:
                          "uppercase",

                        letterSpacing:
                          "0.05em",

                        whiteSpace:
                          "nowrap",
                      }}
                    >
                      {label}
                    </th>
                  ),
                )}
              </tr>
            </thead>

            <tbody>
              {filteredRecords.map(
                (record) => (
                  <tr
                    key={
                      record.historyId
                    }
                  >
                    <td
                      style={{
                        padding:
                          "10px",

                        verticalAlign:
                          "top",

                        borderBottom:
                          "1px solid rgba(148, 163, 184, 0.10)",

                        fontWeight:
                          800,
                      }}
                    >
                      {record.decision}
                    </td>

                    <td
                      style={{
                        padding:
                          "10px",

                        verticalAlign:
                          "top",

                        borderBottom:
                          "1px solid rgba(148, 163, 184, 0.10)",

                        whiteSpace:
                          "nowrap",
                      }}
                    >
                      {formatTimestamp(
                        record.decisionAt,
                      )}
                    </td>

                    <td
                      style={{
                        padding:
                          "10px",

                        verticalAlign:
                          "top",

                        borderBottom:
                          "1px solid rgba(148, 163, 184, 0.10)",
                      }}
                    >
                      <div
                        style={{
                          fontWeight:
                            750,
                        }}
                      >
                        {record.businessCode} / {record.branchCode}
                      </div>

                      <div
                        style={{
                          marginTop:
                            "3px",

                          opacity:
                            0.58,

                          overflowWrap:
                            "anywhere",
                        }}
                      >
                        {record.branchId}
                      </div>
                    </td>

                    <td
                      style={{
                        padding:
                          "10px",

                        verticalAlign:
                          "top",

                        borderBottom:
                          "1px solid rgba(148, 163, 184, 0.10)",

                        whiteSpace:
                          "nowrap",

                        fontWeight:
                          750,
                      }}
                    >
                      {formatAmount(
                        record.amountMinor,
                        record.currency,
                      )}
                    </td>

                    <td
                      style={{
                        padding:
                          "10px",

                        verticalAlign:
                          "top",

                        borderBottom:
                          "1px solid rgba(148, 163, 184, 0.10)",

                        overflowWrap:
                          "anywhere",
                      }}
                    >
                      {record.paymentReference}
                    </td>

                    <td
                      style={{
                        padding:
                          "10px",

                        verticalAlign:
                          "top",

                        borderBottom:
                          "1px solid rgba(148, 163, 184, 0.10)",
                      }}
                    >
                      <div>
                        {record.paymentMethod}
                      </div>

                      <div
                        style={{
                          marginTop:
                            "3px",

                          opacity:
                            0.58,
                        }}
                      >
                        {record.paymentSource}
                      </div>
                    </td>

                    <td
                      style={{
                        padding:
                          "10px",

                        verticalAlign:
                          "top",

                        borderBottom:
                          "1px solid rgba(148, 163, 184, 0.10)",

                        overflowWrap:
                          "anywhere",
                      }}
                    >
                      {record.requestId}
                    </td>

                    <td
                      style={{
                        padding:
                          "10px",

                        verticalAlign:
                          "top",

                        borderBottom:
                          "1px solid rgba(148, 163, 184, 0.10)",

                        maxWidth:
                          "280px",
                      }}
                    >
                      <div
                        style={{
                          fontWeight:
                            700,

                          overflowWrap:
                            "anywhere",
                        }}
                      >
                        {record.importedRequestFileName}
                      </div>

                      <div
                        title={
                          record.importedRequestFilePath
                        }
                        style={{
                          marginTop:
                            "4px",

                          opacity:
                            0.56,

                          fontSize:
                            "10px",

                          lineHeight:
                            1.4,

                          overflowWrap:
                            "anywhere",
                        }}
                      >
                        {record.importedRequestFilePath}
                      </div>
                    </td>

                    <td
                      style={{
                        padding:
                          "10px",

                        verticalAlign:
                          "top",

                        borderBottom:
                          "1px solid rgba(148, 163, 184, 0.10)",

                        maxWidth:
                          "280px",
                      }}
                    >
                      <div
                        style={{
                          fontWeight:
                            700,

                          overflowWrap:
                            "anywhere",
                        }}
                      >
                        {record.exportedResultFileName}
                      </div>

                      <div
                        title={
                          record.exportedResultFilePath
                        }
                        style={{
                          marginTop:
                            "4px",

                          opacity:
                            0.56,

                          fontSize:
                            "10px",

                          lineHeight:
                            1.4,

                          overflowWrap:
                            "anywhere",
                        }}
                      >
                        {record.exportedResultFilePath}
                      </div>
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}