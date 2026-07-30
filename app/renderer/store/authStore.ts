import type {
  AuthSession,
  LoginCredentials,
  User,
} from "../components/auth/types";

import { createAuditLog } from "./auditStore";

import {
  isAccountLocked,
  registerFailedLogin,
  resetLoginAttempts,
} from "./loginSecurityStore";

import {
  generateSessionId,
  hashPassword,
  verifyPassword,
} from "../utils/security";

const USERS_KEY = "finora_users";

const SESSION_KEY = "finora_session";

function loadUsers(): User[] {
  try {
    const data = localStorage.getItem(USERS_KEY);

    if (!data) {
      const defaultAdmin: User = {
        id: "1",

        username: "admin",

        password: hashPassword("admin123"),

        fullName: "FINORA Admin",

        role: "ADMIN",

        status: "ACTIVE",

        createdAt: new Date().toISOString(),

        updatedAt: new Date().toISOString(),
      };

      localStorage.setItem(USERS_KEY, JSON.stringify([defaultAdmin]));

      return [defaultAdmin];
    }

    return JSON.parse(data) as User[];
  } catch {
    return [];
  }
}

function saveUsers(users: User[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

let users: User[] = loadUsers();

export function getUsers(): User[] {
  return [...users];
}

export function addUser(user: User): void {
  users = [
    ...users,

    {
      ...user,

      password: hashPassword(user.password),
    },
  ];

  saveUsers(users);
}

export function replaceUsers(updatedUsers: User[]): void {
  users = [...updatedUsers];

  saveUsers(users);
}

export function login(credentials: LoginCredentials): AuthSession | null {
  if (isAccountLocked(credentials.username)) {
    createAuditLog({
      action: "LOGIN",

      module: "AUTH",

      description: `Blocked login attempt for locked account ${credentials.username}`,

      performedBy: credentials.username,

      userRole: "UNKNOWN",
    });

    return null;
  }

  const user = users.find(
    (item) =>
      item.username === credentials.username && item.status === "ACTIVE",
  );

  if (!user || !verifyPassword(credentials.password, user.password)) {
    registerFailedLogin(credentials.username);

    createAuditLog({
      action: "LOGIN",

      module: "AUTH",

      description: `Failed login attempt for ${credentials.username}`,

      performedBy: credentials.username,

      userRole: "UNKNOWN",
    });

    return null;
  }

  resetLoginAttempts(credentials.username);

  const session: AuthSession = {
    userId: user.id,

    username: user.username,

    fullName: user.fullName,

    role: user.role,

    loginTime: new Date().toISOString(),

    sessionId: generateSessionId(),

    lastActivity: new Date().toISOString(),
  };

  localStorage.setItem(
    SESSION_KEY,

    JSON.stringify(session),
  );

  createAuditLog({
    action: "LOGIN",

    module: "AUTH",

    description: `User ${user.fullName} logged into FINORA`,

    performedBy: user.username,

    userRole: user.role,
  });

  return session;
}

export function getSession(): AuthSession | null {
  const data = localStorage.getItem(SESSION_KEY);

  if (!data) {
    return null;
  }

  return JSON.parse(data) as AuthSession;
}

export function updateSessionActivity(): void {
  const session = getSession();

  if (!session) {
    return;
  }

  localStorage.setItem(
    SESSION_KEY,

    JSON.stringify({
      ...session,

      lastActivity: new Date().toISOString(),
    }),
  );
}

export function logout(): void {
  const session = getSession();

  if (session) {
    createAuditLog({
      action: "LOGOUT",

      module: "AUTH",

      description: `User ${session.fullName} logged out from FINORA`,

      performedBy: session.username,

      userRole: session.role,
    });
  }

  localStorage.removeItem(SESSION_KEY);
}

export function clearUsers(): void {
  users = [];

  saveUsers(users);
}
