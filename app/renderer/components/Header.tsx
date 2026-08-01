type HeaderProps = {
  title?: string;
};
export default function Header({
  title = "Dashboard",
}: HeaderProps) {
  return (
    <header
      className="app-header"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        width: "100%",
        minHeight: "64px",

        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",

        padding: "0 20px",

        background: "#ffffff",

        borderBottom: "1px solid #E5E7EB",

        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
        }}
      >
        <span
          style={{
            fontSize: 11,
            color: "#6B7280",
            fontWeight: 500,
            letterSpacing: "1px",
            textTransform: "uppercase",
          }}
        >
          FINORA Enterprise
        </span>

        <h1
          style={{
            margin: 0,
            marginTop: 2,

            fontSize: "clamp(18px, 2vw, 28px)",

            fontWeight: 700,

            color: "#111827",

            lineHeight: 1.2,
          }}
        >
          {title}
        </h1>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div
          style={{
            width: 12,
            height: 12,
            borderRadius: "50%",
            background: "#22C55E",
            boxShadow: "0 0 8px rgba(34,197,94,.45)",
          }}
        />

        <span
          style={{
            fontSize: 13,
            color: "#16A34A",
            fontWeight: 600,
          }}
        >
          Online
        </span>
      </div>
    </header>
  );
}
