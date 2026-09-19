import { useState } from "react";

import type {
  FinoraBranchDeviceRevocationDataContextDraft,
  FinoraBranchDeviceRevocationFormDraft,
  FinoraControlCenterTargetDraft,
  FinoraStorageModeDraft,
} from "./FinoraControlCenterIssuanceForm.types";

interface Props {
  target: FinoraControlCenterTargetDraft;
  onIssue: (draft: FinoraBranchDeviceRevocationFormDraft) => void;
}

interface FieldProps {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}

function Field({ label, value, placeholder, onChange }: FieldProps) {
  return (
    <label style={{ display: "grid", gap: "7px" }}>
      <span style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "12px", fontWeight: 650, color: "#cbd5e1" }}>{label}</span>
      <input type="text" value={value} placeholder={placeholder} autoComplete="off" spellCheck={false} onChange={(event) => onChange(event.target.value)} style={{ width: "100%", boxSizing: "border-box", minHeight: "42px", border: "1px solid rgba(148, 163, 184, 0.28)", borderRadius: "9px", padding: "9px 11px", fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "13px", background: "rgba(15, 23, 42, 0.82)", color: "#e2e8f0", outline: "none" }} />
    </label>
  );
}

interface SelectFieldProps<T extends string> {
  label: string;
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
}

function SelectField<T extends string>({ label, value, options, onChange }: SelectFieldProps<T>) {
  return (
    <label style={{ display: "grid", gap: "7px" }}>
      <span style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "12px", fontWeight: 650, color: "#cbd5e1" }}>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value as T)} style={{ width: "100%", boxSizing: "border-box", minHeight: "42px", border: "1px solid rgba(148, 163, 184, 0.28)", borderRadius: "9px", padding: "9px 11px", fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "13px", background: "#0f172a", color: "#e2e8f0", outline: "none" }}>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}

export default function FinoraControlCenterDeviceRevocationForm({ target, onIssue }: Props) {
  const [draft, setDraft] = useState<Omit<FinoraBranchDeviceRevocationFormDraft, "target">>({
    userId: "",
    canonicalUsername: "",
    storageMode: "LOCAL",
    dataContext: "REAL",
    demoId: "",
    reason: "",
  });

  function update<K extends keyof typeof draft>(key: K, value: typeof draft[K]): void {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  const canIssue =
    draft.userId.trim().length > 0 &&
    draft.canonicalUsername.trim().length > 0 &&
    draft.reason.trim().length > 0 &&
    (draft.dataContext === "REAL" || draft.demoId.trim().length > 0);

  return (
    <section data-finora-device-revocation-form="true" style={{ marginTop: "22px", paddingTop: "22px", borderTop: "1px solid rgba(148, 163, 184, 0.18)" }}>
      <header style={{ marginBottom: "18px" }}>
        <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 650 }}>Device Revocation</h3>
        <p style={{ margin: "7px 0 0", fontSize: "12px", lineHeight: 1.55, opacity: 0.7 }}>Issue a signed terminal revocation for the exact branch user and native device binding.</p>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "14px" }}>
        <Field label="User ID" value={draft.userId} placeholder="Branch user ID" onChange={(value) => update("userId", value)} />
        <Field label="Canonical Username" value={draft.canonicalUsername} placeholder="username" onChange={(value) => update("canonicalUsername", value)} />
        <SelectField<FinoraStorageModeDraft> label="Storage Mode" value={draft.storageMode} options={["LOCAL","USB"]} onChange={(value) => update("storageMode", value)} />
        <SelectField<FinoraBranchDeviceRevocationDataContextDraft> label="Data Context" value={draft.dataContext} options={["REAL","DEMO"]} onChange={(value) => update("dataContext", value)} />
        {draft.dataContext === "DEMO" && <Field label="Demo ID" value={draft.demoId} placeholder="Demo ID" onChange={(value) => update("demoId", value)} />}
      </div>

      <label style={{ display: "grid", gap: "7px", marginTop: "14px" }}>
        <span style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "12px", fontWeight: 650, color: "#cbd5e1" }}>Revocation Reason</span>
        <textarea value={draft.reason} placeholder="Reason for revoking this exact device" onChange={(event) => update("reason", event.target.value)} rows={4} style={{ width: "100%", boxSizing: "border-box", resize: "vertical", border: "1px solid rgba(148, 163, 184, 0.28)", borderRadius: "9px", padding: "10px 11px", fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "13px", background: "rgba(15, 23, 42, 0.82)", color: "#e2e8f0", outline: "none" }} />
      </label>

      <button type="button" disabled={!canIssue} onClick={() => onIssue({ target, ...draft })} style={{ minHeight: "42px", marginTop: "16px", border: "1px solid rgba(248, 113, 113, 0.72)", borderRadius: "9px", padding: "9px 16px", fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "13px", fontWeight: 650, background: canIssue ? "rgba(127, 29, 29, 0.36)" : "rgba(51, 65, 85, 0.42)", color: canIssue ? "#fecaca" : "#94a3b8", cursor: canIssue ? "pointer" : "not-allowed" }}>Issue Signed Device Revocation</button>
    </section>
  );
}
