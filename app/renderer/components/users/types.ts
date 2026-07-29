import type { UserRole, UserStatus } from "../auth/types";

export type UserFormData = {
  username: string;

  password: string;

  fullName: string;

  role: UserRole;

  status: UserStatus;
};

export type UserTableProps = {
  users: User[];

  onDelete?: (id: string) => void;
};

export type User = {
  id: string;

  username: string;

  password: string;

  fullName: string;

  role: UserRole;

  status: UserStatus;

  createdAt: string;

  updatedAt: string;
};
