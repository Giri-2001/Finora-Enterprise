type LoanSearchBarProps = {
  value: string;
  onChange: (value: string) => void;
};

export default function LoanSearchBar({ value, onChange }: LoanSearchBarProps) {
  return (
    <div
      style={{
        marginBottom: 24,
      }}
    >
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search by Loan ID, Customer Name, Phone..."
        style={{
          width: "100%",
          padding: "12px 16px",
          borderRadius: 12,
          border: "1px solid var(--surface-border)",
          background: "var(--surface)",
          color: "var(--text)",
          fontSize: 14,
          outline: "none",
          boxSizing: "border-box",
        }}
      />
    </div>
  );
}
