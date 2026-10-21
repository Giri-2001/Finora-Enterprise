/*
 * FINORA_P1_610F_RECHARGE_INTENT_STORE
 * Electron Main Process only.
 * Local encrypted retry recovery; never Wallet authority.
 * No IPC, renderer, network, payment approval or balance mutation.
 */

import { app, safeStorage } from "electron";
import path from "node:path";

import {
  createFinoraServerRechargeIntentCore,
  type RechargeIntent,
  type RechargeIntentScope,
} from "./finoraServerRechargeIntentCore.js";

export function createFinoraServerRechargeIntentStore() {
  const directory = path.join(
    app.getPath("userData"),
    "FINORA",
    "wallet",
    "pending-recharge-intents",
  );

  const core = createFinoraServerRechargeIntentCore(
    directory,
    {
      available: () =>
        safeStorage.isEncryptionAvailable(),

      encrypt: (plain: string): Buffer => {
        if (!safeStorage.isEncryptionAvailable()) {
          throw new Error("RECHARGE_ENCRYPTION_UNAVAILABLE");
        }

        return safeStorage.encryptString(plain);
      },

      decrypt: (encrypted: Buffer): string => {
        if (!safeStorage.isEncryptionAvailable()) {
          throw new Error("RECHARGE_ENCRYPTION_UNAVAILABLE");
        }

        return safeStorage.decryptString(encrypted);
      },
    },
  );

  return Object.freeze({
    save: (
      scope: RechargeIntentScope,
      intent: RechargeIntent,
    ) => core.save(scope, intent),

    load: (
      scope: RechargeIntentScope,
    ) => core.load(scope),

    clearIfMatches: (
      scope: RechargeIntentScope,
      idempotencyKey: string,
    ) => core.clearIfMatches(scope, idempotencyKey),
  });
}