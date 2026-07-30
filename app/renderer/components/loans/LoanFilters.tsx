import type { CollectionType, LoanStatus } from "./types";

type LoanFiltersProps = {
  status: LoanStatus | "";
  collectionType: CollectionType | "";
  onStatusChange: (value: LoanStatus | "") => void;
  onCollectionChange: (value: CollectionType | "") => void;
};

const selectStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 12,
  border: "1px solid var(--surface-border)",
  background: "var(--surface)",
  color: "var(--text)",
  fontSize: 14,
  fontWeight: 500,
  outline: "none",
};

export default function LoanFilters({
  status,
  collectionType,
  onStatusChange,
  onCollectionChange,
}: LoanFiltersProps) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
        gap: 16,
        marginBottom: 24,
      }}
    >
      <div>
        <label
          style={{
            display: "block",
            marginBottom: 8,
            fontSize: 13,
            fontWeight: 700,
            color: "var(--text-muted)",
          }}
        >
          Loan Status
        </label>

        <select
          value={status}
          onChange={(event) =>
            onStatusChange(event.target.value as LoanStatus | "")
          }
          style={selectStyle}
        >
          <option value="">All Status</option>
          <option value="Active">Active</option>
          <option value="Closed">Closed</option>
          <option value="Pending">Pending</option>
          <option value="Default">Default</option>
        </select>
      </div>

      <div>
        <label
          style={{
            display: "block",
            marginBottom: 8,
            fontSize: 13,
            fontWeight: 700,
            color: "var(--text-muted)",
          }}
        >
          Collection Type
        </label>

        <select
          value={collectionType}
          onChange={(event) =>
            onCollectionChange(event.target.value as CollectionType | "")
          }
          style={selectStyle}
        >
          <option value="">All Collection Types</option>
          <option value="Daily">Daily</option>
          <option value="Weekly">Weekly</option>
          <option value="Monthly">Monthly</option>
        </select>
      </div>
    </div>
  );
}
