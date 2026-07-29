import { useState } from "react";

import { login } from "../../store/authStore";

type LoginProps = {
  onLogin: () => void;
};

export default function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState("");

  const [password, setPassword] = useState("");

  const [error, setError] = useState("");

  function handleLogin() {
    const session = login({
      username,
      password,
    });

    if (!session) {
      setError("Invalid username or password");

      return;
    }

    setError("");

    onLogin();
  }

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0f172a",
        color: "#ffffff",
        fontFamily: "Segoe UI, sans-serif",
      }}
    >
      <div
        style={{
          width: 360,
          padding: 30,
          background: "#111827",
          borderRadius: 12,
        }}
      >
        <h1
          style={{
            textAlign: "center",
          }}
        >
          FINORA
        </h1>

        <p
          style={{
            textAlign: "center",
            opacity: 0.7,
          }}
        >
          Enterprise Login
        </p>

        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          style={inputStyle}
        />

        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          type="password"
          style={inputStyle}
        />

        {error && (
          <p
            style={{
              color: "#ef4444",
            }}
          >
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={handleLogin}
          style={{
            width: "100%",
            padding: "12px",
            marginTop: 16,
            borderRadius: 8,
            border: "none",
            background: "#2563eb",
            color: "#ffffff",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Login
        </button>

        <p
          style={{
            marginTop: 20,
            fontSize: 13,
            opacity: 0.6,
          }}
        >
          Default:
          <br />
          admin / admin123
        </p>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "10px",
  marginTop: 12,
  borderRadius: 8,
  border: "1px solid #334155",
  background: "#1e293b",
  color: "#ffffff",
};
