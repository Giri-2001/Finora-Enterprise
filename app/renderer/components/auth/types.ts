export type UserRole = "ADMIN" | "MANAGER" | "COLLECTOR" | "VIEWER";

export type UserStatus = "ACTIVE" | "INACTIVE";

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

export type LoginCredentials = {
  username: string;

  password: string;
};

export type AuthSession = {
  userId: string;

  username: string;

  fullName: string;

  role: UserRole;

  loginTime: string;

  sessionId: string;

  lastActivity: string;
};
