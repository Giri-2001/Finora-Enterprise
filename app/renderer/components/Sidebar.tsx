type SidebarProps = {
  currentPage: "dashboard" | "customers";
  onNavigate: (page: "dashboard" | "customers") => void;
};

export default function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  return (
    <>
      <h2 style={{ margin: 0, fontSize: "22px" }}>FINORA</h2>

      <nav
        style={{
          marginTop: "40px",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
        }}
      >
        <button
          type="button"
          onClick={() => onNavigate("dashboard")}
          style={{
            background: "none",
            border: "none",
            color: "inherit",
            cursor: "pointer",
            textAlign: "left",
            fontWeight: currentPage === "dashboard" ? 700 : 400,
          }}
        >
          Dashboard
        </button>

        <button
          type="button"
          onClick={() => onNavigate("customers")}
          style={{
            background: "none",
            border: "none",
            color: "inherit",
            cursor: "pointer",
            textAlign: "left",
            fontWeight: currentPage === "customers" ? 700 : 400,
          }}
        >
          Customers
        </button>

        <span>Loans</span>
        <span>Payments</span>
        <span>Reports</span>
        <span>Settings</span>
      </nav>
    </>
  );
}
