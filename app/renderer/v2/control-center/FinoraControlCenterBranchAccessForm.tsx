import {
  useState,
} from "react";

import type {
  FinoraBranchAccessActionDraft,
  FinoraBranchAccessAdministrativeStatusDraft,
  FinoraBranchAccessFormDraft,
  FinoraBranchAccessTypeDraft,
  FinoraBranchAccessUserRoleDraft,
  FinoraControlCenterTargetDraft,
  FinoraRegistrationPaymentModeDraft,
  FinoraStorageModeDraft,
} from "./FinoraControlCenterIssuanceForm.types";

/* ===========================================================
   FINORA ENTERPRISE OS™

   CONTROL CENTER
   BRANCH ACCESS FORM

   RESPONSIBILITY:

   - Collect dedicated signed Branch Access draft data
   - Keep Branch Activation state out of this workflow
   - Support REGISTERED and DEMO access
   - Support one-time recipient credential authorization
   - Preserve shared installation target from workspace

   SECURITY:

   - No signing.
   - No IPC.
   - No package envelope authority.
   - No credential secret collection.
   - Recipient credential material is established only on
     the authorized recipient installation.
=========================================================== */

interface Props {
  target:
    FinoraControlCenterTargetDraft;

  onIssue:
    (
      draft:
        FinoraBranchAccessFormDraft,
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
    "text" |
    "number" |
    "datetime-local";

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
          "6px",
      }}
    >
      <span
        style={{
          fontFamily:
            "Inter, ui-sans-serif, system-ui, sans-serif",
          fontSize:
            "12px",
          fontWeight:
            600,
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
            "1px solid rgba(148, 163, 184, 0.24)",
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
   SELECT FIELD
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
          "6px",
      }}
    >
      <span
        style={{
          fontFamily:
            "Inter, ui-sans-serif, system-ui, sans-serif",
          fontSize:
            "12px",
          fontWeight:
            600,
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
            "1px solid rgba(148, 163, 184, 0.24)",
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

type BranchAccessDraftState =
  Omit<
    FinoraBranchAccessFormDraft,
    "target"
  >;

export default function FinoraControlCenterBranchAccessForm({
  target,
  onIssue,
}: Props) {

  const [
    draft,
    setDraft,
  ] =
    useState<
      BranchAccessDraftState
    >({
      action:
        "ISSUE",

      grantId:
        "",

      userId:
        "",

      storageMode:
        "LOCAL",

      administrativeStatus:
        "ACTIVE",

      accessType:
        "REGISTERED",

      validFrom:
        "",

      validUntil:
        "",

      grantCreatedAt:
        "",

      grantUpdatedAt:
        "",

      registrationCycle:
        "1",

      registrationPaymentMode:
        "CASH",

      registrationPaidAt:
        "",

      registrationPaymentReference:
        "",

      registrationPaymentRemarks:
        "",

      demoId:
        "",

      demoRemarks:
        "",

      credentialEnrollmentEnabled:
        true,

      credentialAuthorizationId:
        "",

      credentialUsername:
        "",

      credentialFullName:
        "",

      credentialRole:
        "ADMIN",
    });

  function update<
    K extends keyof BranchAccessDraftState,
  >(
    key:
      K,
    value:
      BranchAccessDraftState[K],
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

  const credentialEnrollmentAvailable =
    draft.action === "ISSUE" ||
    draft.action === "AUTHORIZE_CREDENTIAL";

  return (
    <section
      data-finora-control-center-branch-access-form="true"
      style={{
        display:
          "grid",
        gap:
          "20px",
      }}
    >
      <header>
        <h3
          style={{
            margin:
              0,
            fontFamily:
              "Inter, ui-sans-serif, system-ui, sans-serif",
            fontSize:
              "16px",
            fontWeight:
              650,
            color:
              "#e2e8f0",
          }}
        >
          Branch Access
        </h3>

        <p
          style={{
            margin:
              "7px 0 0",
            fontFamily:
              "Inter, ui-sans-serif, system-ui, sans-serif",
            fontSize:
              "12px",
            lineHeight:
              1.55,
            color:
              "#94a3b8",
          }}
        >
          Issue or manage signed access for the verified
          Owner / Business / Branch / Installation target.
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
        <SelectField<FinoraBranchAccessActionDraft>
          label="Action"
          value={draft.action}
          options={[
            "ISSUE",
            "RENEW",
            "REPLACE",
            "SUSPEND",
            "RESUME",
            "REVOKE",
            "AUTHORIZE_CREDENTIAL",
          ]}
          onChange={(
            value,
          ) => {
            setDraft(
              (
                current,
              ) => ({
                ...current,

                action:
                  value,

                credentialEnrollmentEnabled:
                  value ===
                    "AUTHORIZE_CREDENTIAL"
                    ? true
                    : value ===
                        "ISSUE"
                      ? current
                          .credentialEnrollmentEnabled
                      : false,
              }),
            );
          }}
        />

        <SelectField<FinoraBranchAccessTypeDraft>
          label="Access Type"
          value={draft.accessType}
          options={[
            "REGISTERED",
            "DEMO",
          ]}
          onChange={(
            value,
          ) => {
            update(
              "accessType",
              value,
            );
          }}
        />

        <Field
          label="Grant ID"
          value={draft.grantId}
          placeholder="ACCESS-..."
          onChange={(
            value,
          ) => {
            update(
              "grantId",
              value,
            );
          }}
        />

        <Field
          label="User ID"
          value={draft.userId}
          placeholder="USER-..."
          onChange={(
            value,
          ) => {
            update(
              "userId",
              value,
            );
          }}
        />

        <SelectField<FinoraStorageModeDraft>
          label="Storage Mode"
          value={draft.storageMode}
          options={[
            "LOCAL",
            "USB",
          ]}
          onChange={(
            value,
          ) => {
            update(
              "storageMode",
              value,
            );
          }}
        />

        <SelectField<FinoraBranchAccessAdministrativeStatusDraft>
          label="Administrative Status"
          value={draft.administrativeStatus}
          options={[
            "ACTIVE",
            "SUSPENDED",
            "REVOKED",
          ]}
          onChange={(
            value,
          ) => {
            update(
              "administrativeStatus",
              value,
            );
          }}
        />

        <Field
          label="Valid From"
          type="datetime-local"
          value={draft.validFrom}
          onChange={(
            value,
          ) => {
            update(
              "validFrom",
              value,
            );
          }}
        />

        <Field
          label="Valid Until"
          type="datetime-local"
          value={draft.validUntil}
          onChange={(
            value,
          ) => {
            update(
              "validUntil",
              value,
            );
          }}
        />

        <Field
          label="Grant Created At"
          type="datetime-local"
          value={draft.grantCreatedAt}
          onChange={(
            value,
          ) => {
            update(
              "grantCreatedAt",
              value,
            );
          }}
        />

        <Field
          label="Grant Updated At"
          type="datetime-local"
          value={draft.grantUpdatedAt}
          onChange={(
            value,
          ) => {
            update(
              "grantUpdatedAt",
              value,
            );
          }}
        />
      </div>

      {draft.accessType ===
        "REGISTERED" && (
        <section
          style={{
            display:
              "grid",
            gap:
              "14px",
            borderTop:
              "1px solid rgba(148, 163, 184, 0.18)",
            paddingTop:
              "18px",
          }}
        >
          <strong
            style={{
              fontFamily:
                "Inter, ui-sans-serif, system-ui, sans-serif",
              fontSize:
                "13px",
              color:
                "#e2e8f0",
            }}
          >
            Registration
          </strong>

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
            <Field
              label="Registration Cycle"
              type="number"
              value={draft.registrationCycle}
              onChange={(
                value,
              ) => {
                update(
                  "registrationCycle",
                  value,
                );
              }}
            />

            <SelectField<FinoraRegistrationPaymentModeDraft>
              label="Payment Mode"
              value={draft.registrationPaymentMode}
              options={[
                "CASH",
                "UPI",
                "BANK_TRANSFER",
                "OTHER",
              ]}
              onChange={(
                value,
              ) => {
                update(
                  "registrationPaymentMode",
                  value,
                );
              }}
            />

            <Field
              label="Paid At"
              type="datetime-local"
              value={draft.registrationPaidAt}
              onChange={(
                value,
              ) => {
                update(
                  "registrationPaidAt",
                  value,
                );
              }}
            />

            <Field
              label="Payment Reference"
              value={draft.registrationPaymentReference}
              placeholder="Optional"
              onChange={(
                value,
              ) => {
                update(
                  "registrationPaymentReference",
                  value,
                );
              }}
            />

            <Field
              label="Payment Remarks"
              value={draft.registrationPaymentRemarks}
              placeholder="Optional"
              onChange={(
                value,
              ) => {
                update(
                  "registrationPaymentRemarks",
                  value,
                );
              }}
            />

            <div
              style={{
                alignSelf:
                  "end",
                minHeight:
                  "42px",
                display:
                  "flex",
                alignItems:
                  "center",
                border:
                  "1px solid rgba(148, 163, 184, 0.2)",
                borderRadius:
                  "9px",
                padding:
                  "0 12px",
                fontFamily:
                  "Inter, ui-sans-serif, system-ui, sans-serif",
                fontSize:
                  "12px",
                color:
                  "#cbd5e1",
                background:
                  "rgba(15, 23, 42, 0.48)",
              }}
            >
              ₹2,000 · INR · Non-refundable
            </div>
          </div>
        </section>
      )}

      {draft.accessType ===
        "DEMO" && (
        <section
          style={{
            display:
              "grid",
            gap:
              "14px",
            borderTop:
              "1px solid rgba(148, 163, 184, 0.18)",
            paddingTop:
              "18px",
          }}
        >
          <strong
            style={{
              fontFamily:
                "Inter, ui-sans-serif, system-ui, sans-serif",
              fontSize:
                "13px",
              color:
                "#e2e8f0",
            }}
          >
            Demo Access
          </strong>

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
            <Field
              label="Demo ID"
              value={draft.demoId}
              placeholder="DEMO-..."
              onChange={(
                value,
              ) => {
                update(
                  "demoId",
                  value,
                );
              }}
            />

            <Field
              label="Demo Remarks"
              value={draft.demoRemarks}
              placeholder="Optional"
              onChange={(
                value,
              ) => {
                update(
                  "demoRemarks",
                  value,
                );
              }}
            />
          </div>
        </section>
      )}

      <section
        style={{
          display:
            "grid",
          gap:
            "14px",
          borderTop:
            "1px solid rgba(148, 163, 184, 0.18)",
          paddingTop:
            "18px",
        }}
      >
        <strong
          style={{
            fontFamily:
              "Inter, ui-sans-serif, system-ui, sans-serif",
            fontSize:
              "13px",
            color:
              "#e2e8f0",
          }}
        >
          Recipient Credential Authorization
        </strong>

        <label
          style={{
            display:
              "flex",
            alignItems:
              "center",
            gap:
              "10px",
            minHeight:
              "42px",
            border:
              "1px solid rgba(148, 163, 184, 0.2)",
            borderRadius:
              "9px",
            padding:
              "0 12px",
            fontFamily:
              "Inter, ui-sans-serif, system-ui, sans-serif",
            fontSize:
              "12px",
            color:
              credentialEnrollmentAvailable
                ? "#cbd5e1"
                : "#64748b",
            background:
              "rgba(15, 23, 42, 0.48)",
          }}
        >
          <input
            type="checkbox"
            checked={
              draft
                .credentialEnrollmentEnabled
            }
            disabled={
              !credentialEnrollmentAvailable ||
              draft.action ===
                "AUTHORIZE_CREDENTIAL"
            }
            onChange={(
              event,
            ) => {
              update(
                "credentialEnrollmentEnabled",
                event.target.checked,
              );
            }}
          />

          Authorize one-time credential setup on recipient
        </label>

        {!credentialEnrollmentAvailable && (
          <p
            style={{
              margin:
                0,
              fontFamily:
                "Inter, ui-sans-serif, system-ui, sans-serif",
              fontSize:
                "11px",
              lineHeight:
                1.5,
              color:
                "#94a3b8",
            }}
          >
            Credential enrollment authorization is available
            only for ISSUE or AUTHORIZE_CREDENTIAL actions.
          </p>
        )}

        {draft.credentialEnrollmentEnabled &&
          credentialEnrollmentAvailable && (
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
            <Field
              label="Authorization ID"
              value={draft.credentialAuthorizationId}
              placeholder="AUTH-..."
              onChange={(
                value,
              ) => {
                update(
                  "credentialAuthorizationId",
                  value,
                );
              }}
            />

            <Field
              label="Username"
              value={draft.credentialUsername}
              placeholder="Username"
              onChange={(
                value,
              ) => {
                update(
                  "credentialUsername",
                  value,
                );
              }}
            />

            <Field
              label="Full Name"
              value={draft.credentialFullName}
              placeholder="Authorized user name"
              onChange={(
                value,
              ) => {
                update(
                  "credentialFullName",
                  value,
                );
              }}
            />

            <SelectField<FinoraBranchAccessUserRoleDraft>
              label="Role"
              value={draft.credentialRole}
              options={[
                "ADMIN",
                "MANAGER",
                "COLLECTOR",
                "VIEWER",
              ]}
              onChange={(
                value,
              ) => {
                update(
                  "credentialRole",
                  value,
                );
              }}
            />
          </div>
        )}
      </section>

      <div
        style={{
          display:
            "flex",
          justifyContent:
            "flex-end",
          marginTop:
            "2px",
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
          Issue Branch Access
        </button>
      </div>
    </section>
  );
}

/* ============================================================
   END
============================================================ */