type SidebarProps = {
  currentPage: "dashboard" | "customers" | "loans" | "collections";

  onNavigate: (
    page: "dashboard" | "customers" | "loans" | "collections",
  ) => void;
};

export default function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  const buttonStyle = (active: boolean) => ({
    background: "none",
    border: "none",
    color: "inherit",
    cursor: "pointer",
    textAlign: "left" as const,
    fontWeight: active ? 700 : 400,
    padding: "8px 0",
  });

  return (
    <>
      <h2
        style={{
          margin: 0,
          fontSize: "22px",
        }}
      >
        FINORA
      </h2>

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
          style={buttonStyle(currentPage === "dashboard")}
        >
          Dashboard
        </button>

        <button
          type="button"
          onClick={() => onNavigate("customers")}
          style={buttonStyle(currentPage === "customers")}
        >
          Customers
        </button>

        <button
          type="button"
          onClick={() => onNavigate("loans")}
          style={buttonStyle(currentPage === "loans")}
        >
          Loans
        </button>

        <button
          type="button"
          onClick={() => onNavigate("collections")}
          style={buttonStyle(currentPage === "collections")}
        >
          Collections
        </button>

        <span>Reports</span>

        <span>Settings</span>
      </nav>
    </>
  );
}
