import { useState } from "react";

import Card from "../../components/ui/Card";

import UserForm from "../../components/users/UserForm";
import UserTable from "../../components/users/UserTable";

import type { User } from "../../components/users/types";

import { addUser, getUsers } from "../../store/authStore";

export default function Users() {
  const [users, setUsers] = useState<User[]>(getUsers() as User[]);

  function refresh() {
    setUsers(getUsers() as User[]);
  }

  function createUser(data: {
    username: string;

    password: string;

    fullName: string;

    role: "ADMIN" | "MANAGER" | "COLLECTOR" | "VIEWER";

    status: "ACTIVE" | "INACTIVE";
  }) {
    const now = new Date().toISOString();

    const user: User = {
      id: Date.now().toString(),

      username: data.username,

      password: data.password,

      fullName: data.fullName,

      role: data.role,

      status: data.status,

      createdAt: now,

      updatedAt: now,
    };

    addUser(user);

    refresh();
  }

  return (
    <div>
      <h1>User Management</h1>

      <p>Manage FINORA staff accounts and permissions.</p>

      <Card title="Create New User">
        <UserForm onSubmit={createUser} />
      </Card>

      <Card title="Staff Users">
        <UserTable users={users} />
      </Card>
    </div>
  );
}
