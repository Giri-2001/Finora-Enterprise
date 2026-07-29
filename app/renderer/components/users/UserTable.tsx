import type { User } from "./types";

type UserTableProps = {
  users: User[];

  onDelete?: (id: string) => void;
};

export default function UserTable({ users, onDelete }: UserTableProps) {
  if (users.length === 0) {
    return (
      <div
        style={{
          padding: 20,
          background: "#1e293b",
          borderRadius: 12,
        }}
      >
        No users available
      </div>
    );
  }

  return (
    <table
      style={{
        width: "100%",
        borderCollapse: "collapse",
        marginTop: 20,
      }}
    >
      <thead>
        <tr>
          <th style={cellStyle}>Name</th>

          <th style={cellStyle}>Username</th>

          <th style={cellStyle}>Role</th>

          <th style={cellStyle}>Status</th>

          <th style={cellStyle}>Action</th>
        </tr>
      </thead>

      <tbody>
        {users.map((user) => (
          <tr key={user.id}>
            <td style={cellStyle}>{user.fullName}</td>

            <td style={cellStyle}>{user.username}</td>

            <td style={cellStyle}>{user.role}</td>

            <td style={cellStyle}>{user.status}</td>

            <td style={cellStyle}>
              {onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(user.id)}
                  style={{
                    padding: "6px 12px",

                    borderRadius: 6,

                    border: "none",

                    background: "#dc2626",

                    color: "#ffffff",

                    cursor: "pointer",
                  }}
                >
                  Delete
                </button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const cellStyle = {
  borderBottom: "1px solid #334155",

  padding: "12px",

  textAlign: "left" as const,
};
