import {
  useState,
} from "react";

import type {
  FinoraBranchActivationActionDraft,
  FinoraBranchActivationFormDraft,
  FinoraControlCenterTargetDraft,
} from "./FinoraControlCenterIssuanceForm.types";

/* ===========================================================
   FINORA ENTERPRISE OS™

   CONTROL CENTER
   BRANCH ACTIVATION FORM FOUNDATION

   RESPONSIBILITY:

   - Own renderer-editable Branch Activation draft fields
   - Reuse the authoritative shared signed-package target
   - Keep Branch Activation separate from Branch Access issuance
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

  onIssue:
    (
      draft:
        FinoraBranchActivationFormDraft,
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
    "text" | "datetime-local" | "number";

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
   SELECT
============================================================ */

interface SelectFieldProps<
  T extends string,
> {
  label:
    string;

  value:
    T;

  options:
    readonly T[];

  onChange:
    (
      value:
        T,
    ) => void;
}

function SelectField<
  T extends string,
>({
  label,
  value,
  options,
  onChange,
}: SelectFieldProps<T>) {

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

      <select
        value={value}
        onChange={(
          event,
        ) => {
          onChange(
            event.target.value as T,
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
        {options.map(
          (
            option,
          ) => (
            <option
              key={option}
              value={option}
            >
              {option}
            </option>
          ),
        )}
      </select>
    </label>
  );
}

/* ============================================================
   COMPONENT
============================================================ */

export default function FinoraControlCenterBranchActivationForm({
  target,
  onIssue,
}: Props) {

  const [
    draft,
    setDraft,
  ] = useState<
    Omit<
      FinoraBranchActivationFormDraft,
      "target"
    >
  >({
    action:
      "ISSUE",

    activationId:
      "",

    activationActivatedAt:
      "",

    activationCreatedAt:
      "",

    activationUpdatedAt:
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
      data-finora-branch-activation-form="true"
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
          Branch Activation
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
          Prepare the initial ACTIVE Branch Activation for the shared signed-package target. Branch Access is issued separately.
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
        <SelectField<FinoraBranchActivationActionDraft>
          label="Action"
          value={draft.action}
          options={[
            "ISSUE",
          ]}
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
          label="Activation ID"
          value={draft.activationId}
          placeholder="ACTIVATION-..."
          onChange={(
            value,
          ) => {
            update(
              "activationId",
              value,
            );
          }}
        />

        <Field
          label="Activation Activated At"
          type="datetime-local"
          value={draft.activationActivatedAt}
          onChange={(
            value,
          ) => {
            update(
              "activationActivatedAt",
              value,
            );
          }}
        />

        <Field
          label="Activation Created At"
          type="datetime-local"
          value={draft.activationCreatedAt}
          onChange={(
            value,
          ) => {
            update(
              "activationCreatedAt",
              value,
            );
          }}
        />

        <Field
          label="Activation Updated At"
          type="datetime-local"
          value={draft.activationUpdatedAt}
          onChange={(
            value,
          ) => {
            update(
              "activationUpdatedAt",
              value,
            );
          }}
        />
      </div>
      <div
        style={{
          display:
            "flex",
          justifyContent:
            "flex-end",
          marginTop:
            "22px",
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
            border:
              "1px solid rgba(96, 165, 250, 0.72)",
            borderRadius:
              "9px",
            padding:
              "9px 16px",
            fontFamily:
              "Inter, ui-sans-serif, system-ui, sans-serif",
            fontSize:
              "13px",
            fontWeight:
              650,
            background:
              "rgba(30, 64, 175, 0.28)",
            color:
              "#e2e8f0",
            cursor:
              "pointer",
          }}
        >
          Prepare Branch Activation Issuance
        </button>
      </div>

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
        Target scope: {target.ownerId || "—"} / {target.businessId || "—"} / {target.branchId || "—"}
      </div>
    </section>
  );
}