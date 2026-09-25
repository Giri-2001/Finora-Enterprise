import {
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  FinoraControlCenterBranchRegistryRecord,
} from "../../../../electron/control-center/finoraControlCenterBranchRegistry.types";

import type {
  FinoraControlCenterBranchPricingView,
  FinoraControlCenterIncomePricingView,
} from "../../../../electron/control-center/finoraControlCenterPreload";

interface Props {
  record:
    FinoraControlCenterBranchRegistryRecord;

  onClose:
    () => void;
}

interface Draft {
  customerCreateFee:
    string;

  loanDisbursementFee:
    string;

  collectionBelow25000Fee:
    string;

  collection25000To50000Fee:
    string;

  collectionAbove50000Fee:
    string;
}

type DraftKey =
  keyof Draft;

const EMPTY_DRAFT:
  Draft = {
    customerCreateFee:
      "",

    loanDisbursementFee:
      "",

    collectionBelow25000Fee:
      "",

    collection25000To50000Fee:
      "",

    collectionAbove50000Fee:
      "",
  };

function toDraft(
  custom:
    FinoraControlCenterBranchPricingView | undefined,
): Draft {

  return {
    customerCreateFee:
      custom?.customerCreateFee === undefined
        ? ""
        : String(
            custom.customerCreateFee,
          ),

    loanDisbursementFee:
      custom?.loanDisbursementFee === undefined
        ? ""
        : String(
            custom.loanDisbursementFee,
          ),

    collectionBelow25000Fee:
      custom?.collectionBelow25000Fee === undefined
        ? ""
        : String(
            custom.collectionBelow25000Fee,
          ),

    collection25000To50000Fee:
      custom?.collection25000To50000Fee === undefined
        ? ""
        : String(
            custom.collection25000To50000Fee,
          ),

    collectionAbove50000Fee:
      custom?.collectionAbove50000Fee === undefined
        ? ""
        : String(
            custom.collectionAbove50000Fee,
          ),
  };
}

function parseDraftPrice(
  value:
    string,
): number | null {

  const trimmed =
    value.trim();

  return trimmed
    ? Number(
        trimmed,
      )
    : null;
}

export default function FinoraControlCenterBranchPricingPanel({
  record,
  onClose,
}: Props) {

  const identity =
    record.identity;

  const scope =
    useMemo(
      () => ({
        ownerId:
          identity.ownerId,

        businessId:
          identity.businessId,

        branchId:
          identity.branchId,
      }),
      [
        identity.ownerId,
        identity.businessId,
        identity.branchId,
      ],
    );

  const [
    defaults,
    setDefaults,
  ] =
    useState<
      FinoraControlCenterIncomePricingView | undefined
    >();

  const [
    custom,
    setCustom,
  ] =
    useState<
      FinoraControlCenterBranchPricingView | undefined
    >();

  const [
    draft,
    setDraft,
  ] =
    useState<Draft>(
      EMPTY_DRAFT,
    );

  const [
    state,
    setState,
  ] =
    useState<
      "LOADING" |
      "READY" |
      "SAVING" |
      "ERROR"
    >(
      "LOADING",
    );

  const [
    message,
    setMessage,
  ] =
    useState<
      string | undefined
    >();

  useEffect(
    () => {

      let active =
        true;

      void (
        async () => {

          const bridge =
            window.finoraControlCenter;

          if (!bridge) {

            if (active) {
              setState(
                "ERROR",
              );

              setMessage(
                "Dedicated FINORA Control Center preload bridge is unavailable.",
              );
            }

            return;
          }

          try {

            const [
              defaultsResult,
              customResult,
            ] =
              await Promise.all([
                bridge.getFinoraIncomePricing(),

                bridge.getFinoraBranchPricing(
                  scope,
                ),
              ]);

            if (!active) {
              return;
            }

            if (!defaultsResult.success) {
              throw new Error(
                defaultsResult.error,
              );
            }

            if (!customResult.success) {
              throw new Error(
                customResult.error,
              );
            }

            setDefaults(
              defaultsResult.data,
            );

            setCustom(
              customResult.data,
            );

            setDraft(
              toDraft(
                customResult.data,
              ),
            );

            setState(
              "READY",
            );

          } catch (error) {

            if (!active) {
              return;
            }

            setState(
              "ERROR",
            );

            setMessage(
              error instanceof Error
                ? error.message
                : "Unable to load Branch Pricing.",
            );
          }
        }
      )();

      return () => {
        active =
          false;
      };
    },
    [
      scope.ownerId,
      scope.businessId,
      scope.branchId,
    ],
  );

  function setField(
    key:
      DraftKey,

    value:
      string,
  ): void {

    setDraft(
      (current) => ({
        ...current,
        [key]:
          value,
      }),
    );
  }

  async function save(
    nextDraft:
      Draft,
  ): Promise<void> {

    const bridge =
      window.finoraControlCenter;

    if (!bridge) {

      setState(
        "ERROR",
      );

      setMessage(
        "Dedicated FINORA Control Center preload bridge is unavailable.",
      );

      return;
    }

    setState(
      "SAVING",
    );

    setMessage(
      undefined,
    );

    try {

      const result =
        await bridge.updateFinoraBranchPricing({
          ...scope,

          customerCreateFee:
            parseDraftPrice(
              nextDraft.customerCreateFee,
            ),

          loanDisbursementFee:
            parseDraftPrice(
              nextDraft.loanDisbursementFee,
            ),

          collectionBelow25000Fee:
            parseDraftPrice(
              nextDraft.collectionBelow25000Fee,
            ),

          collection25000To50000Fee:
            parseDraftPrice(
              nextDraft.collection25000To50000Fee,
            ),

          collectionAbove50000Fee:
            parseDraftPrice(
              nextDraft.collectionAbove50000Fee,
            ),
        });

      if (!result.success) {
        throw new Error(
          result.error,
        );
      }

      setCustom(
        result.data,
      );

      setDraft(
        toDraft(
          result.data,
        ),
      );

      setState(
        "READY",
      );

      setMessage(
        result.data
          ? "Branch custom Pricing saved."
          : "Branch custom Pricing cleared. FINORA Income defaults will apply.",
      );

    } catch (error) {

      setState(
        "ERROR",
      );

      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to save Branch Pricing.",
      );
    }
  }

  const fields:
    readonly {
      key:
        DraftKey;

      label:
        string;

      defaultValue:
        number | undefined;
    }[] = [
      {
        key:
          "customerCreateFee",

        label:
          "Customer Create Fee",

        defaultValue:
          defaults?.customerCreateFee,
      },
      {
        key:
          "loanDisbursementFee",

        label:
          "Loan Disbursement Fee",

        defaultValue:
          defaults?.loanDisbursementFee,
      },
      {
        key:
          "collectionBelow25000Fee",

        label:
          "Collection < ₹25,000",

        defaultValue:
          defaults?.collectionBelow25000Fee,
      },
      {
        key:
          "collection25000To50000Fee",

        label:
          "Collection ₹25,000 – ₹50,000",

        defaultValue:
          defaults?.collection25000To50000Fee,
      },
      {
        key:
          "collectionAbove50000Fee",

        label:
          "Collection > ₹50,000",

        defaultValue:
          defaults?.collectionAbove50000Fee,
      },
    ];

  return (
    <section
      data-finora-branch-pricing="true"
      style={{
        display:
          "grid",

        gap:
          "18px",

        fontFamily:
          "Inter, ui-sans-serif, system-ui, sans-serif",
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

          flexWrap:
            "wrap",
        }}
      >
        <div>
          <div
            style={{
              fontSize:
                "22px",

              fontWeight:
                760,

              letterSpacing:
                "-0.02em",

              color:
                "#f8fafc",
            }}
          >
            Branch Pricing
          </div>

          <div
            style={{
              marginTop:
                "6px",

              fontSize:
                "13px",

              lineHeight:
                1.6,

              color:
                "#94a3b8",
            }}
          >
            {record.profile?.businessName ??
              identity.businessCode}
            {" · "}
            {record.profile?.branchName ??
              identity.branchCode}
            {" · "}
            {identity.branchId}
          </div>

          <div
            style={{
              marginTop:
                "8px",

              maxWidth:
                "820px",

              fontSize:
                "12px",

              lineHeight:
                1.6,

              color:
                "#cbd5e1",
            }}
          >
            Enter only prices that differ for this branch.
            Leave any field blank to inherit FINORA Income.
          </div>
        </div>

        <button
          type="button"
          onClick={
            onClose
          }
          style={{
            minHeight:
              "38px",

            padding:
              "8px 14px",

            border:
              "1px solid rgba(148, 163, 184, 0.3)",

            borderRadius:
              "9px",

            background:
              "rgba(15, 23, 42, 0.74)",

            color:
              "#e2e8f0",

            font:
              "inherit",

            fontWeight:
              700,

            cursor:
              "pointer",
          }}
        >
          Back to Branch
        </button>
      </div>

      <div
        style={{
          display:
            "grid",

          gridTemplateColumns:
            "repeat(auto-fit, minmax(210px, 1fr))",

          gap:
            "12px",
        }}
      >
        {fields.map(
          (field) => {

            const customValue =
              custom?.[
                field.key
              ];

            const effective =
              customValue ??
              field.defaultValue;

            return (
              <label
                key={
                  field.key
                }
                style={{
                  display:
                    "grid",

                  gap:
                    "8px",

                  padding:
                    "16px",

                  border:
                    "1px solid rgba(148, 163, 184, 0.18)",

                  borderRadius:
                    "13px",

                  background:
                    "rgba(15, 23, 42, 0.58)",
                }}
              >
                <span
                  style={{
                    fontSize:
                      "13px",

                    fontWeight:
                      720,

                    color:
                      "#e2e8f0",
                  }}
                >
                  {field.label}
                </span>

                <span
                  style={{
                    fontSize:
                      "11.5px",

                    lineHeight:
                      1.55,

                    color:
                      customValue === undefined
                        ? "#94a3b8"
                        : "#5eead4",
                  }}
                >
                  {customValue === undefined
                    ? `FINORA Income ₹${field.defaultValue ?? "—"}`
                    : `Branch custom ₹${customValue} · Effective ₹${effective ?? "—"}`}
                </span>

                <div
                  style={{
                    display:
                      "flex",

                    alignItems:
                      "center",

                    gap:
                      "8px",
                  }}
                >
                  <span
                    style={{
                      fontSize:
                        "18px",

                      fontWeight:
                        750,

                      color:
                        "#cbd5e1",
                    }}
                  >
                    ₹
                  </span>

                  <input
                    type="number"
                    min="0.01"
                    max="1000000"
                    step="0.01"
                    value={
                      draft[
                        field.key
                      ]
                    }
                    placeholder={
                      field.defaultValue === undefined
                        ? "FINORA Income"
                        : `Default ${field.defaultValue}`
                    }
                    disabled={
                      state ===
                        "LOADING" ||
                      state ===
                        "SAVING"
                    }
                    onChange={(event) => {
                      setField(
                        field.key,
                        event.target.value,
                      );
                    }}
                    style={{
                      width:
                        "100%",

                      minHeight:
                        "42px",

                      boxSizing:
                        "border-box",

                      border:
                        "1px solid rgba(148, 163, 184, 0.28)",

                      borderRadius:
                        "9px",

                      padding:
                        "9px 11px",

                      background:
                        "rgba(2, 6, 23, 0.56)",

                      color:
                        "#f8fafc",

                      font:
                        "inherit",

                      fontSize:
                        "15px",

                      fontWeight:
                        700,

                      outline:
                        "none",
                    }}
                  />
                </div>
              </label>
            );
          },
        )}
      </div>

      <div
        style={{
          display:
            "flex",

          alignItems:
            "center",

          justifyContent:
            "space-between",

          gap:
            "12px",

          flexWrap:
            "wrap",

          padding:
            "14px 16px",

          border:
            "1px solid rgba(45, 212, 191, 0.2)",

          borderRadius:
            "12px",

          background:
            "rgba(13, 148, 136, 0.08)",
        }}
      >
        <div
          style={{
            fontSize:
              "12px",

            lineHeight:
              1.55,

            color:
              "#cbd5e1",
          }}
        >
          {custom
            ? `Custom revision ${custom.revision} · exact Branch ${identity.branchId}`
            : "No custom prices · FINORA Income applies to all five fees"}
        </div>

        <div
          style={{
            display:
              "flex",

            gap:
              "8px",

            flexWrap:
              "wrap",
          }}
        >
          <button
            type="button"
            disabled={
              state ===
                "LOADING" ||
              state ===
                "SAVING"
            }
            onClick={() => {

              const cleared:
                Draft = {
                  ...EMPTY_DRAFT,
                };

              setDraft(
                cleared,
              );

              void save(
                cleared,
              );
            }}
            style={{
              minHeight:
                "40px",

              padding:
                "9px 14px",

              border:
                "1px solid rgba(148, 163, 184, 0.3)",

              borderRadius:
                "9px",

              background:
                "rgba(30, 41, 59, 0.7)",

              color:
                "#e2e8f0",

              font:
                "inherit",

              fontWeight:
                700,

              cursor:
                "pointer",
            }}
          >
            Use FINORA Income for All
          </button>

          <button
            type="button"
            disabled={
              state ===
                "LOADING" ||
              state ===
                "SAVING"
            }
            onClick={() => {
              void save(
                draft,
              );
            }}
            style={{
              minHeight:
                "40px",

              padding:
                "9px 16px",

              border:
                "1px solid rgba(45, 212, 191, 0.42)",

              borderRadius:
                "9px",

              background:
                "rgba(13, 148, 136, 0.18)",

              color:
                "#f0fdfa",

              font:
                "inherit",

              fontWeight:
                750,

              cursor:
                "pointer",
            }}
          >
            {state === "SAVING"
              ? "Saving…"
              : "Save Branch Pricing"}
          </button>
        </div>
      </div>

      {message && (
        <div
          style={{
            padding:
              "12px 14px",

            border:
              state === "ERROR"
                ? "1px solid rgba(248, 113, 113, 0.35)"
                : "1px solid rgba(45, 212, 191, 0.28)",

            borderRadius:
              "10px",

            background:
              state === "ERROR"
                ? "rgba(127, 29, 29, 0.16)"
                : "rgba(13, 148, 136, 0.08)",

            color:
              state === "ERROR"
                ? "#fecaca"
                : "#ccfbf1",

            fontSize:
              "12px",

            lineHeight:
              1.55,
          }}
        >
          {message}
        </div>
      )}
    </section>
  );
}