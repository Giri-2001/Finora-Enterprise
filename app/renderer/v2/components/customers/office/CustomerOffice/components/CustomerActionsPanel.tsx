/* ===========================================================
   FINORA ENTERPRISE OS™
   CUSTOMER ACTIONS PANEL™

   COMPONENT
=========================================================== */

const actions = [

  {
    title: "Apply Loan",
    icon: "💰",
  },

  {
    title: "Collect Payment",
    icon: "💵",
  },

  {
    title: "Documents",
    icon: "📄",
  },

  {
    title: "Timeline",
    icon: "🕒",
  },

  {
    title: "Reports",
    icon: "📊",
  },

];

/* ===========================================================
   COMPONENT
=========================================================== */

interface CustomerActionsPanelProps {

  onApplyLoan?: () => void;

  onCollectPayment?: () => void;

  onDocuments?: () => void;

  onTimeline?: () => void;

  onReports?: () => void;

}

export default function CustomerActionsPanel({

  onApplyLoan,

  onCollectPayment,

  onDocuments,

  onTimeline,

  onReports,

}: CustomerActionsPanelProps) {

  return (

    <section

      style={{

        background: "#FFFDF9",

        border: "1px solid #D8C7A4",

        borderRadius: "22px",

        padding: "18px",

        boxShadow:
          "0 12px 28px rgba(15,23,42,.08)",

      }}

    >

      {/* ======================================
          HEADER
      ====================================== */}

      <div

        style={{

          color: "#6F4A23",

          fontSize: "18px",

          fontWeight: 700,

          marginBottom: "18px",

        }}

      >

        Customer Actions

      </div>

      {/* ======================================
          ACTION GRID
      ====================================== */}

      <div

        style={{

          display: "grid",

          gridTemplateColumns: "1fr 1fr",

          gap: "12px",

        }}

      >

        {actions.map((action) => (

          <button

  key={action.title}

  onClick={() => {

    switch (action.title) {

      case "Apply Loan":
        onApplyLoan?.();
        break;

      case "Collect Payment":
        onCollectPayment?.();
        break;

      case "Documents":
        onDocuments?.();
        break;

      case "Timeline":
        onTimeline?.();
        break;

      case "Reports":
        onReports?.();
        break;

    }

  }}

  style={{

    height: "52px",

    borderRadius: "14px",

    border: "1px solid #D8C7A4",

    background:
      "linear-gradient(180deg,#8A6135,#6F4A23)",

    color: "#FFF7E3",

    fontSize: "14px",

    fontWeight: 700,

    cursor: "pointer",

    display: "flex",

    alignItems: "center",

    justifyContent: "center",

    gap: "8px",

    transition: ".25s",

  }}

>

            <span>{action.icon}</span>

            <span>{action.title}</span>

          </button>

        ))}

      </div>

    </section>

  );

}
