import Input from "../ui/Input";

type AuditFiltersProps = {
  search: string;

  module: string;

  action: string;

  onSearchChange: (value: string) => void;

  onModuleChange: (value: string) => void;

  onActionChange: (value: string) => void;
};

export default function AuditFilters({
  search,
  module,
  action,
  onSearchChange,
  onModuleChange,
  onActionChange,
}: AuditFiltersProps) {
  return (
    <div
      style={{
        display: "grid",

        gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",

        gap: 12,

        marginBottom: 20,
      }}
    >
      <Input
        value={search}
        placeholder="Search audit events..."
        onChange={(event) => onSearchChange(event.target.value)}
      />

      <select
        value={module}
        onChange={(event) => onModuleChange(event.target.value)}
        style={{
          padding: "8px",

          borderRadius: 6,
        }}
      >
        <option value="">All Modules</option>

        <option value="AUTH">AUTH</option>

        <option value="CUSTOMER">CUSTOMER</option>

        <option value="LOAN">LOAN</option>

        <option value="COLLECTION">COLLECTION</option>

        <option value="SYSTEM">SYSTEM</option>
      </select>

      <select
        value={action}
        onChange={(event) => onActionChange(event.target.value)}
        style={{
          padding: "8px",

          borderRadius: 6,
        }}
      >
        <option value="">All Actions</option>

        <option value="CREATE">CREATE</option>

        <option value="UPDATE">UPDATE</option>

        <option value="DELETE">DELETE</option>

        <option value="LOGIN">LOGIN</option>

        <option value="LOGOUT">LOGOUT</option>

        <option value="EXPORT">EXPORT</option>

        <option value="RESTORE">RESTORE</option>
      </select>
    </div>
  );
}
