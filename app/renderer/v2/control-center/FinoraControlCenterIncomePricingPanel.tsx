import {
  useEffect,
  useState,
} from "react";

import type {
  FinoraControlCenterIncomePricingView,
} from "../../../../electron/control-center/finoraControlCenterPreload";

interface Props {
  onClose:
    () => void;
}

interface PricingDraft {
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

  subscription1MonthFee:
    string;

  subscription3MonthFee:
    string;

  subscription6MonthFee:
    string;

  subscription12MonthFee:
    string;

  pricingNoticeTitle:
    string;

  pricingNoticeMessage:
    string;
}

const EMPTY_DRAFT:
  PricingDraft = {

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

    subscription1MonthFee:
      "",

    subscription3MonthFee:
      "",

    subscription6MonthFee:
      "",

    subscription12MonthFee:
      "",

    pricingNoticeTitle:
      "",

    pricingNoticeMessage:
      "",
  };

function toDraft(
  value:
    FinoraControlCenterIncomePricingView,
): PricingDraft {

  return {
    customerCreateFee:
      String(
        value.customerCreateFee,
      ),

    loanDisbursementFee:
      String(
        value.loanDisbursementFee,
      ),

    collectionBelow25000Fee:
      String(
        value.collectionBelow25000Fee,
      ),

    collection25000To50000Fee:
      String(
        value.collection25000To50000Fee,
      ),

    collectionAbove50000Fee:
      String(
        value.collectionAbove50000Fee,
      ),

    subscription1MonthFee:
      value.subscription1MonthFee === undefined
        ? ""
        : String(value.subscription1MonthFee),

    subscription3MonthFee:
      value.subscription3MonthFee === undefined
        ? ""
        : String(value.subscription3MonthFee),

    subscription6MonthFee:
      value.subscription6MonthFee === undefined
        ? ""
        : String(value.subscription6MonthFee),

    subscription12MonthFee:
      value.subscription12MonthFee === undefined
        ? ""
        : String(value.subscription12MonthFee),

    pricingNoticeTitle:
      value.pricingNoticeTitle ?? "",

    pricingNoticeMessage:
      value.pricingNoticeMessage ?? "",
  };
}

function optionalPrice(
  value:
    string,
): number | undefined {

  const normalized =
    value.trim();

  if (!normalized) {
    return undefined;
  }

  return Number(normalized);
}

export default function FinoraControlCenterIncomePricingPanel({
  onClose,
}: Props) {

  const [
    draft,
    setDraft,
  ] =
    useState<PricingDraft>(
      EMPTY_DRAFT,
    );

  const [
    current,
    setCurrent,
  ] =
    useState<
      FinoraControlCenterIncomePricingView | undefined
    >();

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

            const result =
              await bridge.getFinoraIncomePricing();

            if (!active) {
              return;
            }

            if (!result.success) {
              setState(
                "ERROR",
              );

              setMessage(
                result.error,
              );

              return;
            }

            setCurrent(
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
              undefined,
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
                : "Unable to load FINORA Income Pricing.",
            );
          }
        }
      )();

      return () => {
        active =
          false;
      };
    },
    [],
  );

  function updateField(
    field:
      keyof PricingDraft,

    value:
      string,
  ): void {

    setDraft(
      (existing) => ({
        ...existing,
        [field]:
          value,
      }),
    );
  }

  async function save():
    Promise<void> {

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
        await bridge.updateFinoraIncomePricing({

          customerCreateFee:
            Number(
              draft.customerCreateFee,
            ),

          loanDisbursementFee:
            Number(
              draft.loanDisbursementFee,
            ),

          collectionBelow25000Fee:
            Number(
              draft.collectionBelow25000Fee,
            ),

          collection25000To50000Fee:
            Number(
              draft.collection25000To50000Fee,
            ),

          collectionAbove50000Fee:
            Number(
              draft.collectionAbove50000Fee,
            ),

          subscription1MonthFee:
            optionalPrice(
              draft.subscription1MonthFee,
            ),

          subscription3MonthFee:
            optionalPrice(
              draft.subscription3MonthFee,
            ),

          subscription6MonthFee:
            optionalPrice(
              draft.subscription6MonthFee,
            ),

          subscription12MonthFee:
            optionalPrice(
              draft.subscription12MonthFee,
            ),

          pricingNoticeTitle:
            draft.pricingNoticeTitle.trim() ||
              undefined,

          pricingNoticeMessage:
            draft.pricingNoticeMessage.trim() ||
              undefined,
        });

      if (!result.success) {

        setState(
          "ERROR",
        );

        setMessage(
          result.error,
        );

        return;
      }

      setCurrent(
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
        "FINORA Income global defaults saved.",
      );

    } catch (error) {

      setState(
        "ERROR",
      );

      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to save FINORA Income Pricing.",
      );
    }
  }

  const fields:
    readonly {
      key:
        keyof PricingDraft;

      title:
        string;

      description:
        string;
    }[] = [
      {
        key:
          "customerCreateFee",

        title:
          "Customer Create Fee",

        description:
          "Default charge for every new Customer.",
      },
      {
        key:
          "loanDisbursementFee",

        title:
          "Loan Disbursement Fee",

        description:
          "Default FINORA platform charge for Loan disbursement.",
      },
      {
        key:
          "collectionBelow25000Fee",

        title:
          "Collection < ₹25,000",

        description:
          "Default Collection Processing fee below ₹25,000.",
      },
      {
        key:
          "collection25000To50000Fee",

        title:
"Collection ₹25,000 - ₹50,000",

        description:
          "Default Collection Processing fee from ₹25,000 through ₹50,000 inclusive.",
      },
      {
        key:
          "collectionAbove50000Fee",

        title:
          "Collection > ₹50,000",

        description:
          "Default Collection Processing fee above ₹50,000.",
      },
    ];

  const subscriptionFields:
    readonly {
      key:
        | "subscription1MonthFee"
        | "subscription3MonthFee"
        | "subscription6MonthFee"
        | "subscription12MonthFee";
      title:
        string;
      description:
        string;
    }[] = [
      {
        key:
          "subscription1MonthFee",
        title:
          "1 Month",
        description:
          "Global FINORA subscription price for one month.",
      },
      {
        key:
          "subscription3MonthFee",
        title:
          "3 Months",
        description:
          "Global FINORA subscription price for three months.",
      },
      {
        key:
          "subscription6MonthFee",
        title:
          "6 Months",
        description:
          "Global FINORA subscription price for six months.",
      },
      {
        key:
          "subscription12MonthFee",
        title:
          "12 Months",
        description:
          "Global FINORA subscription price for twelve months.",
      },
    ];

  return (
    <section
      data-finora-control-center-income-pricing="true"
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

          justifyContent:
            "space-between",

          alignItems:
            "flex-start",

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
            FINORA Income
          </div>

          <div
            style={{
              marginTop:
                "7px",

              maxWidth:
                "760px",

              fontSize:
                "13px",

              lineHeight:
                1.6,

              color:
                "#94a3b8",
            }}
          >
            Global platform pricing defaults for every FINORA branch.
            Exact branch-specific custom Pricing can replace individual values
            only for that branch.
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

            fontFamily:
              "Inter, ui-sans-serif, system-ui, sans-serif",

            fontWeight:
              700,

            cursor:
              "pointer",
          }}
        >
          Back to Branches
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
          (field) => (
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
                {field.title}
              </span>

              <span
                style={{
                  minHeight:
                    "36px",

                  fontSize:
                    "11.5px",

                  lineHeight:
                    1.55,

                  color:
                    "#94a3b8",
                }}
              >
                {field.description}
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
                  disabled={
                    state ===
                    "LOADING" ||
                    state ===
                    "SAVING"
                  }
                  onChange={(event) => {
                    updateField(
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

                    fontFamily:
                      "Inter, ui-sans-serif, system-ui, sans-serif",

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
          ),
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
            "14px",

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
        <section
        style={{
          display:
            "grid",
          gap:
            "14px",
          padding:
            "18px",
          border:
            "1px solid rgba(56, 189, 248, 0.22)",
          borderRadius:
            "14px",
          background:
            "rgba(14, 116, 144, 0.08)",
        }}
      >
        <div>
          <div
            style={{
              fontSize:
                "16px",
              fontWeight:
                760,
              color:
                "#f8fafc",
            }}
          >
            Subscription Plans
          </div>

          <div
            style={{
              marginTop:
                "5px",
              fontSize:
                "12px",
              lineHeight:
                1.55,
              color:
                "#94a3b8",
            }}
          >
            Global subscription pricing for every FINORA branch.
            A value of 0 is allowed only for an intentional free offer.
          </div>
        </div>

        <div
          style={{
            display:
              "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(190px, 1fr))",
            gap:
              "12px",
          }}
        >
          {subscriptionFields.map(
            (field) => (
              <label
                key={field.key}
                style={{
                  display:
                    "grid",
                  gap:
                    "8px",
                  padding:
                    "15px",
                  border:
                    "1px solid rgba(148, 163, 184, 0.18)",
                  borderRadius:
                    "12px",
                  background:
                    "rgba(2, 6, 23, 0.42)",
                }}
              >
                <span
                  style={{
                    fontSize:
                      "14px",
                    fontWeight:
                      760,
                    color:
                      "#e2e8f0",
                  }}
                >
                  {field.title}
                </span>

                <span
                  style={{
                    minHeight:
                      "34px",
                    fontSize:
                      "11.5px",
                    lineHeight:
                      1.5,
                    color:
                      "#94a3b8",
                  }}
                >
                  {field.description}
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
                        "13px",
                      fontWeight:
                        750,
                      color:
                        "#cbd5e1",
                    }}
                  >
                    INR
                  </span>

                  <input
                    type="number"
                    min="0"
                    max="1000000"
                    step="0.01"
                    placeholder="Not configured"
                    value={draft[field.key]}
                    disabled={
                      state === "LOADING" ||
                      state === "SAVING"
                    }
                    onChange={(event) => {
                      updateField(
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
                      fontFamily:
                        "Inter, ui-sans-serif, system-ui, sans-serif",
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
            ),
          )}
        </div>
      </section>

      <section
        style={{
          display:
            "grid",
          gap:
            "12px",
          padding:
            "18px",
          border:
            "1px solid rgba(168, 85, 247, 0.22)",
          borderRadius:
            "14px",
          background:
            "rgba(88, 28, 135, 0.08)",
        }}
      >
        <div>
          <div
            style={{
              fontSize:
                "16px",
              fontWeight:
                760,
              color:
                "#f8fafc",
            }}
          >
            Owner Pricing Notice
          </div>

          <div
            style={{
              marginTop:
                "5px",
              fontSize:
                "12px",
              lineHeight:
                1.55,
              color:
                "#94a3b8",
            }}
          >
            Explain a festival offer, free plan, price reduction or price increase.
            This note will later travel with the published pricing revision.
          </div>
        </div>

        <label
          style={{
            display:
              "grid",
            gap:
              "7px",
          }}
        >
          <span
            style={{
              fontSize:
                "12px",
              fontWeight:
                700,
              color:
                "#cbd5e1",
            }}
          >
            Title / Reason
          </span>

          <input
            type="text"
            maxLength={120}
            placeholder="Example: Diwali Special Offer"
            value={draft.pricingNoticeTitle}
            disabled={
              state === "LOADING" ||
              state === "SAVING"
            }
            onChange={(event) => {
              updateField(
                "pricingNoticeTitle",
                event.target.value,
              );
            }}
            style={{
              minHeight:
                "42px",
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
              fontFamily:
                "Inter, ui-sans-serif, system-ui, sans-serif",
              fontSize:
                "13px",
              fontWeight:
                650,
              outline:
                "none",
            }}
          />
        </label>

        <label
          style={{
            display:
              "grid",
            gap:
              "7px",
          }}
        >
          <span
            style={{
              fontSize:
                "12px",
              fontWeight:
                700,
              color:
                "#cbd5e1",
            }}
          >
            Owner Note
          </span>

          <textarea
            maxLength={500}
            rows={3}
            placeholder="Example: One Month subscription is free during the Diwali offer period."
            value={draft.pricingNoticeMessage}
            disabled={
              state === "LOADING" ||
              state === "SAVING"
            }
            onChange={(event) => {
              updateField(
                "pricingNoticeMessage",
                event.target.value,
              );
            }}
            style={{
              width:
                "100%",
              boxSizing:
                "border-box",
              resize:
                "vertical",
              border:
                "1px solid rgba(148, 163, 184, 0.28)",
              borderRadius:
                "9px",
              padding:
                "10px 11px",
              background:
                "rgba(2, 6, 23, 0.56)",
              color:
                "#f8fafc",
              fontFamily:
                "Inter, ui-sans-serif, system-ui, sans-serif",
              fontSize:
                "13px",
              lineHeight:
                1.55,
              outline:
                "none",
            }}
          />
        </label>
      </section>
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
          {current
            ? (
                <>
                  Source: <strong>{current.source}</strong>
                  {" · "}
                  Revision: <strong>{current.revision}</strong>
                  {current.updatedAt
                    ? (
                        <>
                          {" · "}
                          Updated: <strong>{current.updatedAt}</strong>
                        </>
                      )
                    : null}
                </>
              )
            : "Loading current FINORA Income defaults…"}
        </div>

        <button
          type="button"
          disabled={
            state ===
            "LOADING" ||
            state ===
            "SAVING"
          }
          onClick={() => {
            void save();
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

            fontFamily:
              "Inter, ui-sans-serif, system-ui, sans-serif",

            fontSize:
              "13px",

            fontWeight:
              750,

            cursor:
              state === "LOADING" ||
              state === "SAVING"
                ? "default"
                : "pointer",
          }}
        >
          {state === "SAVING"
            ? "Saving…"
            : "Save Global Pricing"}
        </button>
      </div>

      {message && (
        <div
          style={{
            padding:
              "12px 14px",

            borderRadius:
              "10px",

            border:
              state === "ERROR"
                ? "1px solid rgba(248, 113, 113, 0.35)"
                : "1px solid rgba(45, 212, 191, 0.28)",

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
