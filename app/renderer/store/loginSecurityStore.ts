import { createAuditLog } from "./auditStore";

const LOGIN_SECURITY_KEY = "finora_login_security";

const MAX_ATTEMPTS = 5;

const LOCK_DURATION_MINUTES = 15;

type LoginSecurityRecord = {
  username: string;

  failedAttempts: number;

  lockedUntil: string | null;

  lastFailedAt: string | null;
};

function loadRecords(): LoginSecurityRecord[] {
  try {
    const data = localStorage.getItem(LOGIN_SECURITY_KEY);

    if (!data) {
      return [];
    }

    return JSON.parse(data) as LoginSecurityRecord[];
  } catch {
    return [];
  }
}

function saveRecords(records: LoginSecurityRecord[]): void {
  localStorage.setItem(LOGIN_SECURITY_KEY, JSON.stringify(records));
}

let records: LoginSecurityRecord[] = loadRecords();

function getRecord(username: string): LoginSecurityRecord {
  const existing = records.find((item) => item.username === username);

  if (existing) {
    return existing;
  }

  const newRecord: LoginSecurityRecord = {
    username,

    failedAttempts: 0,

    lockedUntil: null,

    lastFailedAt: null,
  };

  records = [...records, newRecord];

  saveRecords(records);

  return newRecord;
}

export function isAccountLocked(username: string): boolean {
  const record = getRecord(username);

  if (!record.lockedUntil) {
    return false;
  }

  const lockTime = new Date(record.lockedUntil).getTime();

  if (Date.now() > lockTime) {
    resetLoginAttempts(username);

    return false;
  }

  return true;
}

export function registerFailedLogin(username: string): void {
  const record = getRecord(username);

  record.failedAttempts += 1;

  record.lastFailedAt = new Date().toISOString();

  if (record.failedAttempts >= MAX_ATTEMPTS) {
    const unlockTime = new Date(Date.now() + LOCK_DURATION_MINUTES * 60 * 1000);

    record.lockedUntil = unlockTime.toISOString();

    createAuditLog({
      action: "LOGIN",

      module: "AUTH",

      description: `Account ${username} locked after multiple failed attempts`,

      performedBy: username,

      userRole: "UNKNOWN",
    });
  }

  saveRecords(records);
}

export function resetLoginAttempts(username: string): void {
  records = records.map((item) =>
    item.username === username
      ? {
          ...item,

          failedAttempts: 0,

          lockedUntil: null,

          lastFailedAt: null,
        }
      : item,
  );

  saveRecords(records);
}

export function getLoginSecurityRecords(): LoginSecurityRecord[] {
  return [...records];
}
