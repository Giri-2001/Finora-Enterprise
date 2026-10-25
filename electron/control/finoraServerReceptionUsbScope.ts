import type {
  FinoraServerReceptionPrincipal,
} from "./finoraServerReceptionSession.js";

export type FinoraServerUsbPrincipal =
  FinoraServerReceptionPrincipal;

export type FinoraServerUsbScope = {
  sessionId: string;
  ownerId: string;
  businessId: string;
  branchId: string;
  dataContext: "REAL";
};

type ValidationResult =
  | {
      success: true;
      sessionId: string;
      principal: FinoraServerUsbPrincipal;
    }
  | {
      success: false;
    };

type Dependencies = {
  // Must be called with the actual Electron event.sender.
  validate: (
    sender: object,
    sessionId: string,
  ) => Promise<ValidationResult>;

  // Read current server-authenticated account/Wallet principal.
  getAccountPrincipal: (
    sender: object,
  ) => FinoraServerUsbPrincipal | null;

  // Read current Main Process login/Business Session generation.
  isCurrent: (
    sender: object,
  ) => boolean;
};

type ScopeResult =
  | {
      success: true;
      scope: FinoraServerUsbScope;
    }
  | {
      success: false;
      error: string;
    };

function equalScope(
  first: FinoraServerUsbPrincipal,
  second: FinoraServerUsbPrincipal,
): boolean {
  return (
    first.userId === second.userId &&
    first.ownerId === second.ownerId &&
    first.businessId === second.businessId &&
    first.branchId === second.branchId &&
    first.storageMode === second.storageMode
  );
}

function validPrincipal(
  principal: FinoraServerUsbPrincipal,
): boolean {
  return (
    typeof principal.userId === "string" &&
    principal.userId.trim().length > 0 &&
    typeof principal.ownerId === "string" &&
    principal.ownerId.trim().length > 0 &&
    typeof principal.businessId === "string" &&
    principal.businessId.trim().length > 0 &&
    typeof principal.branchId === "string" &&
    principal.branchId.trim().length > 0 &&
    typeof principal.username === "string" &&
    principal.username.trim().length > 0 &&
    typeof principal.fullName === "string" &&
    principal.fullName.trim().length > 0 &&
    principal.role === "OWNER" &&
    principal.storageMode === "USB"
  );
}

export async function resolveFinoraServerReceptionUsbScope(
  sender: object,
  sessionId: string,
  dependencies: Dependencies,
): Promise<ScopeResult> {
  // FINORA_P1_706I_SERVER_USB_SCOPE
  // Never resolve by session ID alone: Electron sender binding required.
  const denied = (error: string): ScopeResult => ({
    success: false,
    error,
  });

  if (
    !sender ||
    !/^[a-f0-9]{64}$/.test(sessionId)
  ) {
    return denied("INVALID_SERVER_RECEPTION_SESSION");
  }

  try {
    if (!dependencies.isCurrent(sender)) {
      return denied("SERVER_LOGIN_CHANGED");
    }

    const verified =
      await dependencies.validate(sender, sessionId);

    if (
      !verified.success ||
      verified.sessionId !== sessionId ||
      !validPrincipal(verified.principal)
    ) {
      return denied("SERVER_USB_SESSION_NOT_AUTHORIZED");
    }

    const account =
      dependencies.getAccountPrincipal(sender);

    if (
      !account ||
      !validPrincipal(account) ||
      !equalScope(verified.principal, account)
    ) {
      return denied("SERVER_USB_WALLET_SCOPE_MISMATCH");
    }

    // Prevent account switches while async verification was running.
    if (!dependencies.isCurrent(sender)) {
      return denied("SERVER_LOGIN_CHANGED");
    }

    const latestAccount =
      dependencies.getAccountPrincipal(sender);

    if (
      !latestAccount ||
      !validPrincipal(latestAccount) ||
      !equalScope(verified.principal, latestAccount)
    ) {
      return denied("SERVER_ACCOUNT_CHANGED");
    }

    return {
      success: true,
      scope: {
        sessionId,
        ownerId: verified.principal.ownerId,
        businessId: verified.principal.businessId,
        branchId: verified.principal.branchId,
        dataContext: "REAL",
      },
    };
  } catch {
    return denied("SERVER_USB_VERIFICATION_UNAVAILABLE");
  }
}