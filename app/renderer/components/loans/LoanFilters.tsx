import type { CollectionType, LoanStatus } from "./types";

type LoanFiltersProps = {
  status: LoanStatus | "";

  collectionType: CollectionType | "";

  onStatusChange: (value: LoanStatus | "") => void;

  onCollectionChange: (value: CollectionType | "") => void;
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

        gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",

        gap: 12,

        marginBottom: 20,
      }}
    >
      <select
        value={status}
        onChange={(event) =>
          onStatusChange(event.target.value as LoanStatus | "")
        }
        style={{
          padding: 10,

          borderRadius: 8,
        }}
      >
        <option value="">All Status</option>

        <option value="Active">Active</option>

        <option value="Closed">Closed</option>

        <option value="Pending">Pending</option>

        <option value="Default">Default</option>
      </select>

      <select
        value={collectionType}
        onChange={(event) =>
          onCollectionChange(event.target.value as CollectionType | "")
        }
        style={{
          padding: 10,

          borderRadius: 8,
        }}
      >
        <option value="">All Collection Types</option>

        <option value="Daily">Daily</option>

        <option value="Weekly">Weekly</option>

        <option value="Monthly">Monthly</option>
      </select>
    </div>
  );
}
