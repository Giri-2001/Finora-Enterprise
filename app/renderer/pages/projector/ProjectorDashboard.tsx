import "../../styles/projector.css";

export default function ProjectorDashboard() {
  function enterFullscreen() {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen();
    }
  }

  return (
    <div className="projector-dashboard">
      <header className="projector-header">
        <h1>FINORA ENTERPRISE</h1>

        <p>TODAY'S BUSINESS OVERVIEW</p>

        <button
          type="button"
          onClick={enterFullscreen}
          style={{
            marginTop: 20,
            padding: "12px 24px",
            borderRadius: 8,
            border: "none",
            cursor: "pointer",
            fontSize: 16,
            fontWeight: 700,
          }}
        >
          ENTER FULLSCREEN
        </button>
      </header>

      <section className="projector-grid">
        <div className="projector-card">
          <h2>Total Customers</h2>

          <strong>1,250</strong>
        </div>

        <div className="projector-card">
          <h2>Active Loans</h2>

          <strong>430</strong>
        </div>

        <div className="projector-card">
          <h2>Today's Collection</h2>

          <strong>₹ 2,45,000</strong>
        </div>

        <div className="projector-card">
          <h2>Outstanding Amount</h2>

          <strong>₹ 18,50,000</strong>
        </div>
      </section>

      <footer className="projector-footer">
        <span>FINORA Enterprise • Projector Mode</span>
      </footer>
    </div>
  );
}
