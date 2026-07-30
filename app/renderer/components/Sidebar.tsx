import type { Page } from "../types/page";

type SidebarProps = {
  currentPage: Page;

  onNavigate: (page: Page) => void;
};

export default function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  const buttonStyle = (active: boolean) => ({
    background: active ? "#e2e8f0" : "transparent",

    border: "none",

    borderRadius: 6,

    color: "#0f172a",

    cursor: "pointer",

    textAlign: "left" as const,

    padding: "10px 12px",

    fontWeight: active ? 700 : 400,

    transition: "0.2s",
  });

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
      <h2
        style={{
          margin: 0,
          fontSize: 22,
        }}
      >
        FINORA
      </h2>

      <nav
        style={{
          marginTop: 40,

          display: "flex",

          flexDirection: "column",

          gap: 10,
        }}
      >
        {menuItems.map((item) => (
          <button
            key={item.page}
            type="button"
            onClick={() => onNavigate(item.page)}
            style={buttonStyle(currentPage === item.page)}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </>
  );
}
