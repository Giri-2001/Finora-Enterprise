import type { Page } from "../types/page";

type SidebarProps = {
  currentPage: Page;
  onNavigate: (page: Page) => void;
};

export default function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  const menuItems: {
    page: Page;
    label: string;
  }[] = [
    {
      page: "dashboard",
      label: "Dashboard",
    },

    {
      page: "customers",
      label: "Customers",
    },

    {
      page: "loans",
      label: "Loans",
    },

    {
      page: "interest",
      label: "Interest Engine",
    },

    {
      page: "collections",
      label: "Collections",
    },

    {
      page: "payments",
      label: "Payments",
    },

    {
      page: "goldLoan",
      label: "Gold Loan",
    },

    {
      page: "reports",
      label: "Reports",
    },

    {
      page: "users",
      label: "Users",
    },

    {
      page: "audit",
      label: "Audit",
    },

    {
      page: "backup",
      label: "Backup",
    },

    {
      page: "security",
      label: "Security",
    },
  ];

  return (
    <>
      <div
        style={{
          display: "flex",

          alignItems: "center",

          gap: 10,

          paddingBottom: 24,

          borderBottom: "1px solid var(--surface-border)",
        }}
      >
        <div
          style={{
            width: 42,

            height: 42,

            borderRadius: 12,

            display: "flex",

            alignItems: "center",

            justifyContent: "center",

            background: "var(--finora-accent)",

            color: "#ffffff",

            fontWeight: 900,

            fontSize: 18,
          }}
        >
          F
        </div>

        <h2
          style={{
            margin: 0,

            fontSize: 22,

            fontWeight: 900,

            color: "var(--text)",
          }}
        >
          FINORA
        </h2>
      </div>

      <nav
        style={{
          marginTop: 28,

          display: "flex",

          flexDirection: "column",

          gap: 8,
        }}
      >
        {menuItems.map((item) => {
          const active = currentPage === item.page;

          return (
            <button
              key={item.page}
              type="button"
              onClick={() => onNavigate(item.page)}
              style={{
                background: active ? "var(--finora-accent)" : "transparent",

                border: active
                  ? "1px solid var(--finora-accent)"
                  : "1px solid transparent",

                borderRadius: 10,

                color: active ? "#ffffff" : "var(--text)",

                cursor: "pointer",

                textAlign: "left",

                padding: "12px 16px",

                fontWeight: active ? 800 : 600,

                fontSize: 14,

                transition: "all 0.25s ease",

                boxShadow: active ? "0 8px 20px rgba(37,99,235,0.25)" : "none",
              }}
              onMouseEnter={(event) => {
                if (!active) {
                  event.currentTarget.style.background = "var(--surface-hover)";
                }
              }}
              onMouseLeave={(event) => {
                if (!active) {
                  event.currentTarget.style.background = "transparent";
                }
              }}
            >
              {item.label}
            </button>
          );
        })}
      </nav>
    </>
  );
}
