import { confirmFinoraServerDisconnect } from "./finoraConfirmServerDisconnect";
import { useCallback, useEffect, useState } from "react";
import { RefreshCw, Server, ShieldCheck, Unplug } from "lucide-react";

// P1-630F: Existing Electron encrypted credential vault only.
const CHANGE_EVENT = "finora:control-center-server-connection-changed";

type ConnectionState = "CHECKING" | "CONNECTED" | "SETUP" | "ERROR";

export default function FinoraControlCenterServerConnectionPanel() {
  const [state, setState] = useState<ConnectionState>("CHECKING");
  const [busy, setBusy] = useState(false);
  const [keyInput, setKeyInput] = useState("");
  const [message, setMessage] = useState("Checking authenticated server access...");

  const check = useCallback(async () => {
    const bridge = window.finoraControlCenter;
    if (!bridge) {
      setState("ERROR");
      setMessage("Control Center bridge unavailable.");
      return;
    }
    try {
      const stored = await bridge.hasServerAdminCredential();
      if (!stored.success) {
        setState("ERROR");
        setMessage(stored.error ?? "Cannot check secure server credential.");
        return;
      }
      if (stored.data !== true) {
        setState("SETUP");
        setMessage("Administrator credential setup required.");
        return;
      }
      const verified = await bridge.verifyServerAdminCredential();
      if (verified.success && verified.data === true) {
        setState("CONNECTED");
        setMessage("Production administrator authentication verified.");
      } else {
        setState("ERROR");
        setMessage(("error" in verified ? verified.error : undefined) ?? "Server authentication not verified.");
      }
    } catch {
      setState("ERROR");
      setMessage("Cannot verify FINORA server connection.");
    }
  }, []);

  useEffect(() => {
    void check();
    const timer = window.setInterval(() => void check(), 30000);
    return () => window.clearInterval(timer);
  }, [check]);

  function broadcast() {
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }

  async function connect() {
    if (busy || keyInput.trim().length < 32) return;
    const supplied = keyInput.trim();
    setKeyInput("");
    setBusy(true);
    setState("CHECKING");
    try {
      const bridge = window.finoraControlCenter;
      if (!bridge) throw new Error("Control Center bridge unavailable.");

      const saved = await bridge.configureServerAdminCredential(supplied);
      if (!saved.success || saved.data !== true) {
        throw new Error(("error" in saved ? saved.error : undefined) ?? "Secure connection failed.");
      }

      const verified = await bridge.verifyServerAdminCredential();
      if (!verified.success || verified.data !== true) {
        throw new Error(("error" in verified ? verified.error : undefined) ?? "Server authentication failed.");
      }

      setState("CONNECTED");
      setMessage("Secure administrator connection established.");
      broadcast();
    } catch (error) {
      setState("ERROR");
      setMessage(error instanceof Error ? error.message : "Connection failed.");
      broadcast();
    } finally {
      setBusy(false);
    }
  }

  async function disconnect() {
    if (busy || !(await confirmFinoraServerDisconnect())) return;

    setBusy(true);
    try {
      const bridge = window.finoraControlCenter;
      if (!bridge) throw new Error("Control Center bridge unavailable.");

      const result = await bridge.disconnectServerAdminCredential();
      if (!result.success || result.data !== true) {
        throw new Error(("error" in result ? result.error : undefined) ?? "Disconnect failed.");
      }

      setKeyInput("");
      setState("SETUP");
      setMessage("Administrator access disconnected.");
      broadcast();
    } catch (error) {
      setState("ERROR");
      setMessage(error instanceof Error ? error.message : "Disconnect failed.");
    } finally {
      setBusy(false);
    }
  }

  const connected = state === "CONNECTED";
  const color = connected ? "#4ade80" :
    state === "CHECKING" ? "#fbbf24" : "#f87171";

  const buttonStyle = {
    borderRadius: 10,
    padding: "10px 16px",
    fontWeight: 700,
    border: "1px solid rgba(148,163,184,.35)",
    background: "#1b3157",
    color: "#f8fafc",
    cursor: "pointer",
  } as const;

  return (
    <section aria-label="FINORA Production Server Connection"
      style={{
        padding: "18px 22px",
        marginBottom: 20,
        borderRadius: 18,
        background: "linear-gradient(110deg,#14223c,#101827)",
        border: `1px solid ${connected
          ? "rgba(74,222,128,.48)"
          : "rgba(148,163,184,.30)"}`,
        color: "#f8fafc",
      }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 14,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
          <Server size={28} color="#93c5fd" />
          <div>
            <div style={{ fontSize: 19, fontWeight: 800 }}>
              FINORA Production Server
            </div>
            <div style={{ fontSize: 12, color: "#94a3b8" }}>
              api.finoraenterprise.com
            </div>
          </div>
        </div>
        <strong role="status"
          style={{
            color,
            fontSize: 13,
            border: `1px solid ${color}`,
            borderRadius: 999,
            padding: "9px 14px",
          }} className="finora-cc-p756j-connected-badge">
          {connected ? "● LIVE CONNECTED" :
            state === "CHECKING" ? "● VERIFYING" :
            state === "SETUP" ? "● SETUP REQUIRED" :
            "● DISCONNECTED / ERROR"}
        </strong>
      </div>

      <p style={{ color: "#cbd5e1", fontSize: 13, margin: "14px 0" }}>
        <ShieldCheck size={15} style={{ verticalAlign: "middle" }} />
        {" "}Admin Access: {connected ? "VERIFIED" : "NOT VERIFIED"}
        {" · "}{message}
      </p>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }} className="finora-cc-p756j-connection-actions">
        {!connected && (
          <>
            <input
              type="password"
              autoComplete="off"
              aria-label="FINORA Server administrator credential"
              placeholder="Enter Server Admin Credential"
              value={keyInput}
              onChange={(e) => setKeyInput(e.currentTarget.value)}
              style={{
                flex: "1 1 260px",
                minHeight: 43,
                borderRadius: 10,
                padding: "0 12px",
                background: "#0f172a",
                border: "1px solid #475569",
                color: "#fff",
              }}
            />
            <button type="button"
              style={buttonStyle}
              disabled={busy || keyInput.trim().length < 32}
              onClick={() => void connect()}>
              {busy ? "Connecting..." : "Connect Server"}
            </button>
          </>
        )}

        <button type="button" style={buttonStyle}
          disabled={busy}
          onClick={() => void check()}>
          <RefreshCw size={15} style={{ verticalAlign: "middle" }} />
          {" "}Verify Connection
        </button>

        {connected && (
          <button type="button"
            style={{ ...buttonStyle, background: "#581d2b" }}
            disabled={busy}
            onClick={() => void disconnect()}>
            <Unplug size={15} style={{ verticalAlign: "middle" }} />
            {" "}Disconnect
          </button>
        )}
      </div>
    </section>
  );
}