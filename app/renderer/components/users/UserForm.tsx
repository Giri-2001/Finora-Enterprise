import { useState } from "react";

import type { UserRole, UserStatus } from "../auth/types";

type UserFormProps = {
  onSubmit: (data: {
    username: string;

    password: string;

    fullName: string;

    role: UserRole;

    status: UserStatus;
  }) => void;
};

export default function UserForm({ onSubmit }: UserFormProps) {
  const [username, setUsername] = useState("");

  const [password, setPassword] = useState("");

  const [fullName, setFullName] = useState("");

  const [role, setRole] = useState<UserRole>("COLLECTOR");

  const [status, setStatus] = useState<UserStatus>("ACTIVE");

  function submit() {
    onSubmit({
      username,

      password,

      fullName,

      role,

      status,
    });

    setUsername("");

    setPassword("");

    setFullName("");
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <input
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        style={inputStyle}
      />

      <input
        placeholder="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={inputStyle}
      />

      <input
        placeholder="Full Name"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        style={inputStyle}
      />

      <select
        value={role}
        onChange={(e) => setRole(e.target.value as UserRole)}
        style={inputStyle}
      >
        <option value="ADMIN">ADMIN</option>

        <option value="MANAGER">MANAGER</option>

        <option value="COLLECTOR">COLLECTOR</option>

        <option value="VIEWER">VIEWER</option>
      </select>

      <select
        value={status}
        onChange={(e) => setStatus(e.target.value as UserStatus)}
        style={inputStyle}
      >
        <option value="ACTIVE">ACTIVE</option>

        <option value="INACTIVE">INACTIVE</option>
      </select>

      <button
        type="button"
        onClick={submit}
        style={{
          padding: "10px",
          borderRadius: 8,
          border: "none",
          background: "#2563eb",
          color: "#ffffff",
          cursor: "pointer",
          fontWeight: 600,
        }}
      >
        Create User
      </button>
    </div>
  );
}

const inputStyle = {
  padding: "10px",

  borderRadius: 8,

  border: "1px solid #334155",

  background: "#1e293b",

  color: "#ffffff",
};
