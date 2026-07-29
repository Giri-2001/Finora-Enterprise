type Page = "dashboard" | "customers" | "loans" | "collections";

type AppShellProps = {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  children: React.ReactNode;
};

export default function AppShell({
  currentPage,
  onNavigate,
  children,
}: AppShellProps) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "260px 1fr",
        gridTemplateRows: "64px 1fr",
        width: "100vw",
        height: "100vh",
        background: "#0f172a",
        color: "#ffffff",
        fontFamily: "Segoe UI, sans-serif",
      }}
    >
      <aside
        style={{
          gridRow: "1 / 3",
          background: "#111827",
          padding: "24px",
          borderRight: "1px solid #1f2937",
        }}
      >
        <h2>FINORA</h2>

        <nav
          style={{
            marginTop: "40px",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
          }}
        >
          <button onClick={() => onNavigate("dashboard")}>Dashboard</button>

          <button onClick={() => onNavigate("customers")}>Customers</button>

          <button onClick={() => onNavigate("loans")}>Loans</button>

          <button onClick={() => onNavigate("collections")}>Collections</button>
        </nav>
      </aside>

      <header
        style={{
          background: "#111827",
          borderBottom: "1px solid #1f2937",
          display: "flex",
          alignItems: "center",
          padding: "0 24px",
          fontSize: "20px",
          fontWeight: 600,
        }}
      >
        {currentPage.toUpperCase()}
      </header>

      <main
        style={{
          padding: "24px",
          overflow: "auto",
        }}
      >
        {children}
      </main>
    </div>
  );
}
