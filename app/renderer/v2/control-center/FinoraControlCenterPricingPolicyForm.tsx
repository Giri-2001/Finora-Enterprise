/* ===========================================================
   FINORA ENTERPRISE OS™

   CONTROL CENTER
   PRICING POLICY FORM

   RESPONSIBILITY:

   - Collect Pricing Policy renderer-editable draft values
   - Preserve shared Control Center target authority
   - Support zero or more Pricing Override rules
   - Keep fixed Pricing domain constants outside editable fields
   - Forward a prepared draft to the parent workspace

   IMPORTANT:

   - Action is fixed to REPLACE.
   - Charge Code is fixed to LOAN_DISBURSEMENT.
   - Model is fixed to FIXED_PRICE_OVERRIDE.
   - Currency is fixed to INR.
   - packageId is not renderer authority.
   - sequence is not renderer authority.
   - root issuedAt is not renderer authority.
   - Signing remains inside privileged Control Center main process.
=========================================================== */

import {
  useState,
} from "react";

import type {
  FinoraControlCenterTargetDraft,
  FinoraPricingOverrideDraft,
  FinoraPricingPolicyFormDraft,
} from "./FinoraControlCenterIssuanceForm.types";

/* ============================================================
   PROPS
============================================================ */

export interface FinoraControlCenterPricingPolicyFormProps {
  target:
    FinoraControlCenterTargetDraft;

  onIssue?:
    (
      draft:
        FinoraPricingPolicyFormDraft,
    ) => void;
}

/* ============================================================
   DRAFT FACTORY
============================================================ */

function createEmptyPricingOverrideDraft():
  FinoraPricingOverrideDraft {

  return {
    overrideId:
      "",

    amount:
      "",

    validFrom:
      "",

    validUntil:
      "",
  };
}

/* ============================================================
   COMPONENT
============================================================ */

export function FinoraControlCenterPricingPolicyForm({
  target,
  onIssue,
}: FinoraControlCenterPricingPolicyFormProps) {

  const [
    overrideSetId,
    setOverrideSetId,
  ] =
    useState(
      "",
    );

  const [
    overrides,
    setOverrides,
  ] =
    useState<
      FinoraPricingOverrideDraft[]
    >([
      createEmptyPricingOverrideDraft(),
    ]);

  function updateOverride(
    index:
      number,

    field:
      keyof FinoraPricingOverrideDraft,

    value:
      string,
  ): void {

    setOverrides(
      (current) =>
        current.map(
          (
            override,
            overrideIndex,
          ) =>
            overrideIndex ===
              index
              ? {
                  ...override,

                  [field]:
                    value,
                }
              : override,
        ),
    );
  }

  function addOverride(): void {

    setOverrides(
      (current) => [
        ...current,
        createEmptyPricingOverrideDraft(),
      ],
    );
  }

  function removeOverride(
    index:
      number,
  ): void {

    setOverrides(
      (current) =>
        current.filter(
          (
            _override,
            overrideIndex,
          ) =>
            overrideIndex !==
              index,
        ),
    );
  }

  return (
    <section
      data-finora-control-center-pricing-policy-form="true"
      style={{
        marginTop:
          "20px",

        borderTop:
          "1px solid rgba(148, 163, 184, 0.18)",

        paddingTop:
          "20px",
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

          marginBottom:
            "18px",

          flexWrap:
            "wrap",
        }}
      >
        <div>
          <h3
            style={{
              margin:
                0,

              fontSize:
                "15px",

              fontWeight:
                650,
            }}
          >
            Pricing Policy
          </h3>

          <p
            style={{
              margin:
                "6px 0 0",

              maxWidth:
                "720px",

              fontSize:
                "12px",

              lineHeight:
                1.55,

              opacity:
                0.66,
            }}
          >
            Replace the Pricing Override Set for this exact
            Owner / Business / Branch / Installation target.
            An empty override list is valid and restores Base Pricing.
          </p>
        </div>

        <div
          style={{
            border:
              "1px solid rgba(148, 163, 184, 0.2)",

            borderRadius:
              "9px",

            padding:
              "8px 10px",

            fontSize:
              "11px",

            lineHeight:
              1.5,

            background:
              "rgba(2, 6, 23, 0.34)",
          }}
        >
          <div>
            Action: <strong>REPLACE</strong>
          </div>

          <div>
            Charge: <strong>LOAN_DISBURSEMENT</strong>
          </div>

          <div>
            Model: <strong>FIXED_PRICE_OVERRIDE</strong>
          </div>

          <div>
            Currency: <strong>INR</strong>
          </div>
        </div>
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();

          onIssue?.({
            target,

            overrideSetId,

            overrides,
          });
        }}
      >
        <label
          style={{
            display:
              "grid",

            gap:
              "6px",

            marginBottom:
              "18px",
          }}
        >
          <span
            style={{
              fontSize:
                "11px",

              fontWeight:
                600,

              opacity:
                0.76,
            }}
          >
            Override Set ID
          </span>

          <input
            type="text"
            value={overrideSetId}
            onChange={(event) => {
              setOverrideSetId(
                event.target.value,
              );
            }}
            placeholder="PRICING-OVERRIDE-SET-001"
            autoComplete="off"
            style={{
              width:
                "100%",

              boxSizing:
                "border-box",

              border:
                "1px solid rgba(148, 163, 184, 0.24)",

              borderRadius:
                "8px",

              padding:
                "10px 11px",

              font:
                "inherit",

              fontSize:
                "12px",

              color:
                "inherit",

              background:
                "rgba(2, 6, 23, 0.38)",

              outline:
                "none",
            }}
          />
        </label>

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

            marginBottom:
              "12px",

            flexWrap:
              "wrap",
          }}
        >
          <div>
            <div
              style={{
                fontSize:
                  "12px",

                fontWeight:
                  650,
              }}
            >
              Pricing Overrides
            </div>

            <div
              style={{
                marginTop:
                  "3px",

                fontSize:
                  "11px",

                opacity:
                  0.58,
              }}
            >
              {overrides.length} override
              {overrides.length === 1
                ? ""
                : "s"} configured
            </div>
          </div>

          <button
            type="button"
            onClick={addOverride}
            style={{
              border:
                "1px solid rgba(96, 165, 250, 0.42)",

              borderRadius:
                "8px",

              padding:
                "8px 11px",

              font:
                "inherit",

              fontSize:
                "11px",

              fontWeight:
                650,

              cursor:
                "pointer",

              color:
                "#bfdbfe",

              background:
                "rgba(37, 99, 235, 0.12)",
            }}
          >
            Add Override
          </button>
        </div>

        {overrides.length === 0 && (
          <div
            style={{
              marginBottom:
                "16px",

              border:
                "1px dashed rgba(148, 163, 184, 0.24)",

              borderRadius:
                "9px",

              padding:
                "14px",

              fontSize:
                "11px",

              lineHeight:
                1.55,

              opacity:
                0.66,
            }}
          >
            No override rules. Issuing this REPLACE policy will
            represent an empty Pricing Override Set.
          </div>
        )}

        <div
          style={{
            display:
              "grid",

            gap:
              "12px",
          }}
        >
          {overrides.map(
            (
              override,
              index,
            ) => (
              <section
                key={index}
                style={{
                  border:
                    "1px solid rgba(148, 163, 184, 0.2)",

                  borderRadius:
                    "10px",

                  padding:
                    "14px",

                  background:
                    "rgba(2, 6, 23, 0.26)",
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
                      "10px",

                    marginBottom:
                      "12px",
                  }}
                >
                  <div
                    style={{
                      fontSize:
                        "12px",

                      fontWeight:
                        650,
                    }}
                  >
                    Override {index + 1}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      removeOverride(
                        index,
                      );
                    }}
                    style={{
                      border:
                        "1px solid rgba(248, 113, 113, 0.32)",

                      borderRadius:
                        "7px",

                      padding:
                        "6px 9px",

                      font:
                        "inherit",

                      fontSize:
                        "10px",

                      cursor:
                        "pointer",

                      color:
                        "#fecaca",

                      background:
                        "rgba(127, 29, 29, 0.14)",
                    }}
                  >
                    Remove
                  </button>
                </div>

                <div
                  style={{
                    display:
                      "grid",

                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(220px, 1fr))",

                    gap:
                      "12px",
                  }}
                >
                  <label
                    style={{
                      display:
                        "grid",

                      gap:
                        "6px",
                    }}
                  >
                    <span
                      style={{
                        fontSize:
                          "11px",

                        fontWeight:
                          600,

                        opacity:
                          0.76,
                      }}
                    >
                      Override ID
                    </span>

                    <input
                      type="text"
                      value={override.overrideId}
                      onChange={(event) => {
                        updateOverride(
                          index,
                          "overrideId",
                          event.target.value,
                        );
                      }}
                      placeholder="PRICING-OVERRIDE-001"
                      autoComplete="off"
                      style={{
                        width:
                          "100%",

                        boxSizing:
                          "border-box",

                        border:
                          "1px solid rgba(148, 163, 184, 0.24)",

                        borderRadius:
                          "8px",

                        padding:
                          "10px 11px",

                        font:
                          "inherit",

                        fontSize:
                          "12px",

                        color:
                          "inherit",

                        background:
                          "rgba(2, 6, 23, 0.38)",

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
                        "6px",
                    }}
                  >
                    <span
                      style={{
                        fontSize:
                          "11px",

                        fontWeight:
                          600,

                        opacity:
                          0.76,
                      }}
                    >
                      Amount (INR)
                    </span>

                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={override.amount}
                      onChange={(event) => {
                        updateOverride(
                          index,
                          "amount",
                          event.target.value,
                        );
                      }}
                      placeholder="7.25"
                      style={{
                        width:
                          "100%",

                        boxSizing:
                          "border-box",

                        border:
                          "1px solid rgba(148, 163, 184, 0.24)",

                        borderRadius:
                          "8px",

                        padding:
                          "10px 11px",

                        font:
                          "inherit",

                        fontSize:
                          "12px",

                        color:
                          "inherit",

                        background:
                          "rgba(2, 6, 23, 0.38)",

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
                        "6px",
                    }}
                  >
                    <span
                      style={{
                        fontSize:
                          "11px",

                        fontWeight:
                          600,

                        opacity:
                          0.76,
                      }}
                    >
                      Valid From
                    </span>

                    <input
                      type="text"
                      value={override.validFrom}
                      onChange={(event) => {
                        updateOverride(
                          index,
                          "validFrom",
                          event.target.value,
                        );
                      }}
                      placeholder="2026-01-01T00:00:00.000Z"
                      autoComplete="off"
                      style={{
                        width:
                          "100%",

                        boxSizing:
                          "border-box",

                        border:
                          "1px solid rgba(148, 163, 184, 0.24)",

                        borderRadius:
                          "8px",

                        padding:
                          "10px 11px",

                        font:
                          "inherit",

                        fontSize:
                          "12px",

                        color:
                          "inherit",

                        background:
                          "rgba(2, 6, 23, 0.38)",

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
                        "6px",
                    }}
                  >
                    <span
                      style={{
                        fontSize:
                          "11px",

                        fontWeight:
                          600,

                        opacity:
                          0.76,
                      }}
                    >
                      Valid Until
                    </span>

                    <input
                      type="text"
                      value={override.validUntil}
                      onChange={(event) => {
                        updateOverride(
                          index,
                          "validUntil",
                          event.target.value,
                        );
                      }}
                      placeholder="2027-01-01T00:00:00.000Z"
                      autoComplete="off"
                      style={{
                        width:
                          "100%",

                        boxSizing:
                          "border-box",

                        border:
                          "1px solid rgba(148, 163, 184, 0.24)",

                        borderRadius:
                          "8px",

                        padding:
                          "10px 11px",

                        font:
                          "inherit",

                        fontSize:
                          "12px",

                        color:
                          "inherit",

                        background:
                          "rgba(2, 6, 23, 0.38)",

                        outline:
                          "none",
                      }}
                    />
                  </label>
                </div>
              </section>
            ),
          )}
        </div>

        {onIssue && (
          <div
            style={{
              display:
                "flex",

              justifyContent:
                "flex-end",

              marginTop:
                "18px",
            }}
          >
            <button
              type="submit"
              style={{
                border:
                  "1px solid rgba(74, 222, 128, 0.38)",

                borderRadius:
                  "9px",

                padding:
                  "10px 14px",

                font:
                  "inherit",

                fontSize:
                  "12px",

                fontWeight:
                  650,

                cursor:
                  "pointer",

                color:
                  "#bbf7d0",

                background:
                  "rgba(22, 101, 52, 0.16)",
              }}
            >
              Prepare Pricing Policy Issuance
            </button>
          </div>
        )}
      </form>
    </section>
  );
}

/* ============================================================
   END
============================================================ */