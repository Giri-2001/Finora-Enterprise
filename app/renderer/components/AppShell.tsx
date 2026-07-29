import { useMemo, useState } from "react";

type Page = "dashboard" | "customers" | "loans";

type AppShellProps = {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  children: React.ReactNode;
};

type NavigationItem = {
  key: Page;
  title: string;
  icon: string;
};

const navigationItems: NavigationItem[] = [
  {
    key: "dashboard",
    title: "Dashboard",
    icon: "🏠",
  },
  {
    key: "customers",
    title: "Customers",
    icon: "👥",
  },
  {
    key: "loans",
    title: "Loans",
    icon: "💰",
  },
];

export default function AppShell({
  currentPage,
  onNavigate,
  children,
}: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);

  const pageTitle = useMemo(() => {
    return (
      navigationItems.find((item) => item.key === currentPage)?.title ??
      "FINORA"
    );
  }, [currentPage]);

  const sidebarWidth = collapsed ? 80 : 260;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `${sidebarWidth}px 1fr`,
        gridTemplateRows: "64px 1fr",
        width: "100vw",
        height: "100vh",
        background: "#f1f5f9",
        color: "#111827",
        fontFamily: "Segoe UI, sans-serif",
        transition: "grid-template-columns 0.2s ease",
      }}
    >
      <aside
        style={{
          gridRow: "1 / 3",
          background: "#0f172a",
          color: "#ffffff",
          borderRight: "1px solid #1e293b",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "space-between",
            padding: "0 18px",
            borderBottom: "1px solid #1e293b",
          }}
        >
          {!collapsed && (
            <div>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 20,
                  letterSpacing: 1,
                }}
              >
                FINORA
              </div>

              <div
                style={{
                  fontSize: 11,
                  color: "#94a3b8",
                }}
              >
                Enterprise V1
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            style={{
              width: 36,
              height: 36,
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              background: "#1e293b",
              color: "#ffffff",
            }}
          >
            {collapsed ? "➡" : "⬅"}
          </button>
        </div>

        <nav
          style={{
            flex: 1,
            padding: 16,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {navigationItems.map((item) => {
            const active = item.key === currentPage;

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onNavigate(item.key)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: collapsed ? "center" : "flex-start",
                  gap: 12,
                  padding: "12px 14px",
                  border: "none",
                  borderRadius: 10,
                  cursor: "pointer",
                  background: active ? "#2563eb" : "transparent",
                  color: "#ffffff",
                  fontWeight: active ? 700 : 500,
                  transition: "0.2s",
                }}
              >
                <span>{item.icon}</span>

                {!collapsed && <span>{item.title}</span>}
              </button>
            );
          })}
        </nav>

        <div
          style={{
            padding: 16,
            borderTop: "1px solid #1e293b",
          }}
        >
          {!collapsed ? (
            <>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                FINORA Enterprise
              </div>

              <div
                style={{
                  marginTop: 4,
                  fontSize: 12,
                  color: "#94a3b8",
                }}
              >
                Version 1.0
              </div>
            </>
          ) : (
            <div
              style={{
                textAlign: "center",
                fontSize: 20,
              }}
            >
              🏦
            </div>
          )}
        </div>
      </aside>

      <header
        style={{
          background: "#ffffff",
          borderBottom: "1px solid #e5e7eb",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: "#0f172a",
            }}
          >
            {pageTitle}
          </div>

          <div
            style={{
              marginTop: 2,
              fontSize: 13,
              color: "#64748b",
            }}
          >
            FINORA Enterprise Management System
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <div
            style={{
              textAlign: "right",
            }}
          >
            <div
              style={{
                fontWeight: 600,
                color: "#0f172a",
              }}
            >
              Administrator
            </div>

            <div
              style={{
                fontSize: 12,
                color: "#64748b",
              }}
            >
              System User
            </div>
          </div>

          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: "50%",
              background: "#2563eb",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: 16,
            }}
          >
            A
          </div>
        </div>
      </header>

      <main
        style={{
          overflow: "auto",
          padding: 24,
          background: "#f8fafc",
        }}
      >
        {children}
      </main>
    </div>
  );
}
