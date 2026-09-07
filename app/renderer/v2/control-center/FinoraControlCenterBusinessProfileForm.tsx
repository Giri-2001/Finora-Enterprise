import {
  useState,
} from "react";

import type {
  FinoraBusinessProfileActionDraft,
  FinoraBusinessProfileFormDraft,
  FinoraControlCenterTargetDraft,
} from "./FinoraControlCenterIssuanceForm.types";

/* ===========================================================
   FINORA ENTERPRISE OS™

   CONTROL CENTER
   BUSINESS PROFILE FORM FOUNDATION

   RESPONSIBILITY:

   - Own renderer-editable Business Profile draft fields
   - Reuse the authoritative shared signed-package target
   - Model ISSUE / REPLACE profile operations
   - Keep package envelope authority out of renderer form state

   NOT RESPONSIBLE FOR:

   - Signing
   - IPC issuance
   - packageId
   - sequence
   - root issuedAt
=========================================================== */

interface Props {
  target:
    FinoraControlCenterTargetDraft;

  onIssue?:
    (
      draft:
        FinoraBusinessProfileFormDraft,
    ) => void;
}

/* ============================================================
   FIELD
============================================================ */

interface FieldProps {
  label:
    string;

  value:
    string;

  placeholder?:
    string;

  type?:
    "text" | "datetime-local";

  onChange:
    (
      value:
        string,
    ) => void;
}

function Field({
  label,
  value,
  placeholder,
  type =
    "text",
  onChange,
}: FieldProps) {

  return (
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
            650,
          color:
            "#cbd5e1",
        }}
      >
        {label}
      </span>

      <input
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck={false}
        onChange={(
          event,
        ) => {
          onChange(
            event.target.value,
          );
        }}
        style={{
          width:
            "100%",
          boxSizing:
            "border-box",
          minHeight:
            "42px",
          border:
            "1px solid rgba(148, 163, 184, 0.28)",
          borderRadius:
            "9px",
          padding:
            "9px 11px",
          fontFamily:
            "Inter, ui-sans-serif, system-ui, sans-serif",
          fontSize:
            "13px",
          background:
            "rgba(15, 23, 42, 0.82)",
          color:
            "#e2e8f0",
          outline:
            "none",
        }}
      />
    </label>
  );
}

/* ============================================================
   ACTION
============================================================ */

function ActionField({
  value,
  onChange,
}: {
  value:
    FinoraBusinessProfileActionDraft;

  onChange:
    (
      value:
        FinoraBusinessProfileActionDraft,
    ) => void;
}) {

  return (
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
            650,
          color:
            "#cbd5e1",
        }}
      >
        Action
      </span>

      <select
        value={value}
        onChange={(
          event,
        ) => {
          onChange(
            event.target.value as
              FinoraBusinessProfileActionDraft,
          );
        }}
        style={{
          width:
            "100%",
          boxSizing:
            "border-box",
          minHeight:
            "42px",
          border:
            "1px solid rgba(148, 163, 184, 0.28)",
          borderRadius:
            "9px",
          padding:
            "9px 11px",
          fontFamily:
            "Inter, ui-sans-serif, system-ui, sans-serif",
          fontSize:
            "13px",
          background:
            "#0f172a",
          color:
            "#e2e8f0",
          outline:
            "none",
        }}
      >
        <option value="ISSUE">
          ISSUE
        </option>

        <option value="REPLACE">
          REPLACE
        </option>
      </select>
    </label>
  );
}

/* ============================================================
   COMPONENT
============================================================ */

export default function FinoraControlCenterBusinessProfileForm({
  target,
  onIssue,
}: Props) {

  const [
    draft,
    setDraft,
  ] = useState<
    Omit<
      FinoraBusinessProfileFormDraft,
      "target"
    >
  >({
    action:
      "ISSUE",

    profileId:
      "",

    businessCode:
      "",

    branchCode:
      "",

    businessName:
      "",

    branchName:
      "",

    createdAt:
      "",

    updatedAt:
      "",
  });

  function update<
    K extends keyof typeof draft,
  >(
    key:
      K,

    value:
      typeof draft[K],
  ): void {

    setDraft(
      (
        current,
      ) => ({
        ...current,

        [key]:
          value,
      }),
    );
  }

  return (
    <section
      data-finora-business-profile-form="true"
      style={{
        marginTop:
          "22px",
        paddingTop:
          "22px",
        borderTop:
          "1px solid rgba(148, 163, 184, 0.18)",
      }}
    >
      <header
        style={{
          marginBottom:
            "18px",
        }}
      >
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
          Business Profile
        </h3>

        <p
          style={{
            margin:
              "7px 0 0",
            fontSize:
              "12px",
            lineHeight:
              1.55,
            opacity:
              0.7,
          }}
        >
          Configure signed Business and Branch profile identity for the shared installation target.
        </p>
      </header>

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
        <ActionField
          value={draft.action}
          onChange={(
            value,
          ) => {
            update(
              "action",
              value,
            );
          }}
        />

        <Field
          label="Profile ID"
          value={draft.profileId}
          placeholder="PROFILE-..."
          onChange={(
            value,
          ) => {
            update(
              "profileId",
              value,
            );
          }}
        />

        <Field
          label="Business Code"
          value={draft.businessCode}
          placeholder="BUSINESS-CODE"
          onChange={(
            value,
          ) => {
            update(
              "businessCode",
              value,
            );
          }}
        />

        <Field
          label="Branch Code"
          value={draft.branchCode}
          placeholder="BRANCH-CODE"
          onChange={(
            value,
          ) => {
            update(
              "branchCode",
              value,
            );
          }}
        />

        <Field
          label="Business Name"
          value={draft.businessName}
          placeholder="Business name"
          onChange={(
            value,
          ) => {
            update(
              "businessName",
              value,
            );
          }}
        />

        <Field
          label="Branch Name"
          value={draft.branchName}
          placeholder="Branch name"
          onChange={(
            value,
          ) => {
            update(
              "branchName",
              value,
            );
          }}
        />

        <Field
          label="Created At"
          type="datetime-local"
          value={draft.createdAt}
          onChange={(
            value,
          ) => {
            update(
              "createdAt",
              value,
            );
          }}
        />

        <Field
          label="Updated At"
          type="datetime-local"
          value={draft.updatedAt}
          onChange={(
            value,
          ) => {
            update(
              "updatedAt",
              value,
            );
          }}
        />
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
            type="button"
            onClick={() => {
              onIssue({
                target,
                ...draft,
              });
            }}
            style={{
              minHeight:
                "42px",
              padding:
                "0 18px",
              border:
                "1px solid rgba(96, 165, 250, 0.72)",
              borderRadius:
                "10px",
              background:
                "rgba(30, 64, 175, 0.28)",
              color:
                "#e2e8f0",
              fontFamily:
                "inherit",
              fontSize:
                "12px",
              fontWeight:
                700,
              cursor:
                "pointer",
            }}
          >
            Prepare Business Profile Issuance
          </button>
        </div>
      )}

      <div
        style={{
          marginTop:
            "18px",
          fontSize:
            "11px",
          lineHeight:
            1.5,
          opacity:
            0.58,
        }}
      >
        Target scope: {target.ownerId || "—"} / {target.businessId || "—"} / {target.branchId || "—"} / {target.installationId || "—"}
      </div>
    </section>
  );
}

/* ============================================================
   END
============================================================ */