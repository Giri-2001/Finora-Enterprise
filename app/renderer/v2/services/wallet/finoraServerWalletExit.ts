import {
  getFinoraServerWalletBridge,
} from "./finoraServerWalletBridge";

export type ServerWalletExitResult = {
  localCleared: boolean;
  serverStatus: string;
};

export async function endFinoraServerWalletAccess():
  Promise<ServerWalletExitResult> {
  try {
    const bridge = getFinoraServerWalletBridge();
    if (!bridge) {
      return { localCleared: false, serverStatus: "BRIDGE_UNAVAILABLE" };
    }

    const result = await bridge.logout();
    if (!result || result.localCleared !== true) {
      return { localCleared: false, serverStatus: "SERVER_UNAVAILABLE" };
    }

    const statuses = [
      "REVOKED", "NOT_REVOKED", "NO_LOCAL_SESSION",
      "UNAUTHORIZED", "SERVER_UNAVAILABLE", "INVALID_SERVER_RESPONSE",
    ];

    return {
      localCleared: true,
      serverStatus: statuses.includes(result.serverStatus)
        ? result.serverStatus
        : "INVALID_SERVER_RESPONSE",
    };
  } catch {
    return { localCleared: false, serverStatus: "SERVER_UNAVAILABLE" };
  }
}
