/* ===========================================================
   FINORA OS V2
   SIDEBAR
=========================================================== */

import SidebarItem from "../components/navigation/SidebarItem";

interface SidebarProps {
  page:
  | "dashboard"
  | "customers"
  | "customerDepartment"
  | "loans"
  | "collections"
  | "reports";

onNavigate: (
  page:
    | "dashboard"
    | "customers"
    | "customerDepartment"
    | "loans"
    | "collections"
    | "reports"
) => void;
}

export default function Sidebar({
  page,
  onNavigate,
}: SidebarProps) {
  return (
    <aside
      style={{
        width: 100,
        background: "#111827",
        color: "#ffffff",
        padding: 0,
        boxSizing: "border-box",
      }}
    >
      <h2 style={{ marginTop: 0 }}>FINORA OS</h2>

      <p
        style={{
          opacity: 0.7,
          marginBottom: 32,
        }}
      >
        Enterprise V2
      </p>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <SidebarItem
          icon="🏠"
          title="Dashboard"
          active={page === "dashboard"}
          onClick={() => onNavigate("dashboard")}
        />

        <SidebarItem
          icon="👥"
          title="Customers"
          active={page === "customers"}
          onClick={() => onNavigate("customers")}
        />

        <SidebarItem

  icon="🏢"

  title="Customer Department"

  active={
    page === "customerDepartment"
  }

  onClick={() =>
    onNavigate(
      "customerDepartment",
    )
  }

/>

        <SidebarItem
  icon="💰"
  title="Loans"
  active={page === "loans"}
  onClick={() => onNavigate("loans")}
/>

        <SidebarItem
  icon="💵"
  title="Collections"
  active={page === "collections"}
  onClick={() => onNavigate("collections")}
/>

        <SidebarItem
  icon="📊"
  title="Reports"
  active={page === "reports"}
  onClick={() => onNavigate("reports")}
/>
      </div>
    </aside>
  );
}
