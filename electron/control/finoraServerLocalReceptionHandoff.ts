import {
  verifyFinoraServerLocalReceptionScope,
  type FinoraReceptionPrincipal,
  type FinoraReceptionLocalAuthority,
} from "./finoraServerLocalReceptionScopeGate.js";

/**
 * Server-first Reception handoff foundation.
 *
 * This pure function does not create sessions, read USB,
 * alter Wallet authorization, or grant business-data access.
 *
 * Both arguments must come from independently verified
 * Main-process authorities, never renderer-supplied identities.
 */
export function evaluateFinoraReceptionHandoff(
  serverPrincipal: FinoraReceptionPrincipal | null,
  localAuthority: FinoraReceptionLocalAuthority | null,
) {
  const result = verifyFinoraServerLocalReceptionScope(
    serverPrincipal !== null,
    serverPrincipal,
    localAuthority,
  );

  if (!result.allowed) {
    return {
      success: false as const,
      businessDataAccess: false as const,
      errorCode: result.errorCode,
    };
  }

  return {
    success: true as const,
    eligible: true as const,
    operationalMode: result.operationalMode,
    businessDataAccess: false as const,
    errorCode: "RECEPTION_COMMIT_NOT_IMPLEMENTED" as const,
  };
}
/**
 * Independently authorize local business operation.
 *
 * The caller must first authenticate the server principal.
 * Local session identity is compared with server identity
 * before the session can qualify for Reception.
 *
 * No Wallet clearing and no Reception commit occur here.
 */
export async function authorizeFinoraServerFirstLocalSession(
  input: {
    username: string;
    password: string;
    storageMode: "LOCAL" | "USB";
  },
  serverPrincipal: FinoraReceptionPrincipal,
  dependencies: {
    createLocalSession: (
      request: {
        username: string;
        password: string;
        storageMode: "LOCAL" | "USB";
      },
    ) => Promise<{
      success: boolean;
      data?: FinoraReceptionLocalAuthority & {
        sessionId: string;
      };
      errorCode?: string;
    }>;
    invalidateLocalSession: (
      sessionId: string,
    ) => void | Promise<void>;
  },
) {
  const local = await dependencies.createLocalSession(input);

  if (!local.success || !local.data) {
    return {
      success: false as const,
      errorCode: local.errorCode ?? "LOCAL_AUTHORIZATION_DENIED",
    };
  }

  const decision = evaluateFinoraReceptionHandoff(
    serverPrincipal,
    local.data,
  );

  if (!decision.success) {
    await dependencies.invalidateLocalSession(
      local.data.sessionId,
    );

    return {
      success: false as const,
      errorCode: decision.errorCode,
    };
  }

  return {
    success: true as const,
    eligible: true as const,
    localSessionId: local.data.sessionId,
    operationalMode: decision.operationalMode,
    businessDataAccess: false as const,
    errorCode: "RECEPTION_COMMIT_NOT_IMPLEMENTED" as const,
  };
}