// Windows main-process adapter. Call only after app ready.
// The root is app-owned and cannot be selected through renderer input.
// Local OS encryption does not impose a permanent server device lock.
import { app, safeStorage } from "electron";
import path from "node:path";
import {
  createFinoraServerWalletKeyVaultCore,
} from "./finoraServerWalletKeyVaultCore.js";

export function createFinoraServerWalletKeyVault() {
  if (process.platform !== "win32" || !app.isReady()) {
    throw new Error("WALLET_KEY_VAULT_PLATFORM_UNAVAILABLE");
  }

  return createFinoraServerWalletKeyVaultCore(
    path.join(app.getPath("userData"), "finora-server-wallet-keys-v1"),
    {
      available: () => safeStorage.isEncryptionAvailable(),
      encrypt: plain => safeStorage.encryptString(plain),
      decrypt: encrypted => safeStorage.decryptString(encrypted),
    },
  );
}