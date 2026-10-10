// Wallet-specific IPC sender validation.
// Configuration must be supplied by Electron main, never by renderer input.
import type { IpcMainInvokeEvent, WebContents } from "electron";
import path from "node:path";
import { pathToFileURL } from "node:url";

export function createFinoraServerWalletSenderGuard(options: {
  getOwnerWebContents: () => WebContents | null;
  packaged: boolean;
  ownerEntryPath: string;
}) {
  if (
    !options ||
    typeof options.getOwnerWebContents !== "function" ||
    typeof options.packaged !== "boolean" ||
    typeof options.ownerEntryPath !== "string" ||
    !path.isAbsolute(options.ownerEntryPath)
  ) throw new Error("WALLET_SENDER_GUARD_CONFIGURATION_INVALID");

  // Snapshot configuration so later mutation cannot relax the policy.
  const getOwnerWebContents = options.getOwnerWebContents;
  const packaged = options.packaged;
  const expectedFile = pathToFileURL(
    path.resolve(options.ownerEntryPath),
  ).href;

  function allowedUrl(value: string): boolean {
    if (typeof value !== "string" || value.length > 8192) return false;
    const url = new URL(value);

    if (url.username || url.password || url.search) return false;
    url.hash = "";

    if (packaged) {
      return url.protocol === "file:" && url.href === expectedFile;
    }

    // Development shell only; hash routing remains allowed.
    return url.protocol === "http:" &&
      url.hostname === "localhost" &&
      url.port === "5173" &&
      url.pathname === "/";
  }

  return function isAuthorized(event: IpcMainInvokeEvent): boolean {
    try {
      const owner = getOwnerWebContents();
      if (
        !owner || owner.isDestroyed() ||
        !event || event.sender !== owner ||
        !event.senderFrame ||
        event.senderFrame !== owner.mainFrame
      ) return false;

      // Check both the invoking frame and the currently loaded top-level URL.
      return allowedUrl(event.senderFrame.url) && allowedUrl(owner.getURL());
    } catch {
      return false;
    }
  };
}