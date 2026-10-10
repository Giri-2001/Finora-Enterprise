import type { IpcMain, WebContents, IpcMainInvokeEvent } from "electron";
import {
  createFinoraServerWalletSenderGuard,
} from "./finoraServerWalletSenderGuard.js";
import {
  createFinoraServerWalletIpcBoundary,
} from "./finoraServerWalletIpcBoundary.js";

type Service = Parameters<typeof createFinoraServerWalletIpcBoundary>[0]["service"];

export const FINORA_SERVER_WALLET_CHANNELS = Object.freeze({
  enroll: "finora:server-wallet:enroll",
  signIn: "finora:server-wallet:sign-in",
  // FINORA_P565J_PRICING
  pricing: "finora:server-wallet:pricing",
  balance: "finora:server-wallet:balance",
  logout: "finora:server-wallet:logout",
  recharge: "finora:server-wallet:recharge",
});

const registrations = new WeakSet<object>();

// Register once for the exact Owner WebContents.
// Caller must invoke invalidate() before an explicit branch/account switch.
// This registration does not expose a renderer-selected endpoint or scope.
export function registerFinoraServerWalletIpc(options: {
  ipc: Pick<IpcMain, "handle" | "removeHandler">;
  owner: WebContents;
  packaged: boolean;
  ownerEntryPath: string;
  service: Service;
}) {
  const ipc = options?.ipc;
  const owner = options?.owner;
  if (
    !ipc || typeof ipc.handle !== "function" ||
    typeof ipc.removeHandler !== "function" ||
    !owner || typeof owner.on !== "function" ||
    typeof owner.removeListener !== "function" ||
    typeof owner.isDestroyed !== "function" || owner.isDestroyed()
  ) throw new Error("WALLET_IPC_REGISTRATION_INVALID");

  if (registrations.has(ipc)) {
    throw new Error("WALLET_IPC_ALREADY_REGISTERED");
  }

  let disposed = false;
  const authorize = createFinoraServerWalletSenderGuard({
    getOwnerWebContents: () => disposed ? null : owner,
    packaged: options.packaged,
    ownerEntryPath: options.ownerEntryPath,
  });
  const boundary = createFinoraServerWalletIpcBoundary({
    service: options.service,
    authorize,
  });
  const installed: string[] = [];

  function invalidate(): void {
    if (!disposed) boundary.invalidate();
  }

  function navigation(
    details: { isMainFrame?: boolean; isSameDocument?: boolean },
    _url?: string,
    legacyInPlace?: boolean,
    legacyMainFrame?: boolean,
  ): void {
    const main = typeof details?.isMainFrame === "boolean"
      ? details.isMainFrame : legacyMainFrame;
    const sameDocument = typeof details?.isSameDocument === "boolean"
      ? details.isSameDocument : legacyInPlace;

    // Unknown event shape fails closed.
    if (main === false) return;
    if (main === true && sameDocument === true) return;
    invalidate();
  }

  function dispose(): void {
    if (disposed) return;
    disposed = true;
    try {
      boundary.invalidate();
    } finally {
      owner.removeListener("did-start-navigation", navigation);
      owner.removeListener("render-process-gone", invalidate);
      owner.removeListener("destroyed", dispose);
      for (const channel of installed) ipc.removeHandler(channel);
      registrations.delete(ipc);
    }
  }

  registrations.add(ipc);
  try {
    for (const method of ["enroll", "signIn", "balance", "pricing", "logout", "recharge"] as const) {
      const channel = FINORA_SERVER_WALLET_CHANNELS[method];
      ipc.handle(channel, (event: IpcMainInvokeEvent, ...args: unknown[]) => {
        if (disposed) return { success: false, errorCode: "UNAUTHORIZED" };
        const expected = method === "enroll" || method === "signIn" || method === "recharge" ? 1 : 0;
        if (args.length !== expected) {
          return { success: false, errorCode: "INVALID_REQUEST" };
        }
        return boundary[method](event, args[0]);
      });
      installed.push(channel);
    }

    owner.on("did-start-navigation", navigation);
    owner.on("render-process-gone", invalidate);
    owner.on("destroyed", dispose);
  } catch {
    dispose();
    throw new Error("WALLET_IPC_REGISTRATION_FAILED");
  }

  return Object.freeze({ invalidate, dispose });
}