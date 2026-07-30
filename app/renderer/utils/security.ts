const HASH_PREFIX = "FINORA_HASH_";

export function hashPassword(password: string): string {
  let hash = 0;

  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);

    hash = (hash << 5) - hash + char;

    hash = hash & hash;
  }

  return HASH_PREFIX + Math.abs(hash).toString();
}

export function verifyPassword(
  password: string,
  hashedPassword: string,
): boolean {
  return hashPassword(password) === hashedPassword;
}

export function generateSessionId(): string {
  return `SESSION-${Date.now()}-${Math.random().toString(36).substring(2)}`;
}

export function isSessionExpired(
  lastActivity: string,
  timeoutMinutes = 30,
): boolean {
  const last = new Date(lastActivity).getTime();

  const now = Date.now();

  const difference = now - last;

  return difference > timeoutMinutes * 60 * 1000;
}
