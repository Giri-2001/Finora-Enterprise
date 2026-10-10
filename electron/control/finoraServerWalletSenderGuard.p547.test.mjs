import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  createFinoraServerWalletSenderGuard,
} from "../../dist-electron/control/finoraServerWalletSenderGuard.js";

const entry = path.resolve("dist/index.html");
const entryUrl = pathToFileURL(entry).href;

function setup(packaged = true) {
  const frame = { url: packaged ? entryUrl : "http://localhost:5173/" };
  const owner = {
    mainFrame: frame,
    isDestroyed: () => false,
    getURL: () => frame.url,
  };
  const options = {
    packaged,
    ownerEntryPath: entry,
    getOwnerWebContents: () => owner,
  };
  return {
    owner, frame, options,
    event: { sender: owner, senderFrame: frame },
    guard: createFinoraServerWalletSenderGuard(options),
  };
}

test("exact Owner main frame and packaged entry are accepted", () => {
  const { guard, event, frame } = setup();
  assert.equal(guard(event), true);
  frame.url = entryUrl + "#/wallet";
  assert.equal(guard(event), true);
});

test("another window cannot reuse the trusted entry URL", () => {
  const { guard, frame } = setup();
  const other = {
    mainFrame: frame, isDestroyed: () => false, getURL: () => entryUrl,
  };
  assert.equal(guard({ sender: other, senderFrame: frame }), false);
});

test("subframes and missing frames are rejected", () => {
  const { guard, owner } = setup();
  assert.equal(guard({ sender: owner, senderFrame: { url: entryUrl } }), false);
  assert.equal(guard({ sender: owner, senderFrame: null }), false);
  assert.equal(guard(null), false);
});

test("other local files, remote pages and query variants are rejected", () => {
  const { guard, event, frame } = setup();
  for (const url of [
    pathToFileURL(path.resolve("dist/control-center.html")).href,
    pathToFileURL(path.resolve("dist/subfolder/index.html")).href,
    entryUrl + "?mode=wallet",
    "https://api.finoraenterprise.com/",
    "http://localhost:5173/",
    "about:blank",
    "not a URL",
  ]) {
    frame.url = url;
    assert.equal(guard(event), false, url);
  }
});

test("destroyed owner or top-level navigation mismatch fails closed", () => {
  const first = setup();
  first.owner.isDestroyed = () => true;
  assert.equal(first.guard(first.event), false);

  const second = setup();
  second.owner.getURL = () => "https://example.invalid/";
  assert.equal(second.guard(second.event), false);

  const third = setup();
  third.owner.getURL = () => { throw new Error("frame gone"); };
  assert.equal(third.guard(third.event), false);
});

test("development permits only the exact localhost shell and hash routing", () => {
  const { guard, event, frame } = setup(false);
  for (const url of [
    "http://localhost:5173/",
    "http://localhost:5173/#/wallet",
  ]) {
    frame.url = url;
    assert.equal(guard(event), true);
  }
  for (const url of [
    "http://localhost:5174/",
    "http://localhost.attacker.invalid:5173/",
    "http://127.0.0.1:5173/",
    "http://user:password@localhost:5173/",
    "http://localhost:5173/control-center.html",
    "http://localhost:5173/?mode=wallet",
    "https://localhost:5173/",
  ]) {
    frame.url = url;
    assert.equal(guard(event), false, url);
  }
});

test("configuration is snapshotted and invalid dependencies are rejected", () => {
  const { guard, event, frame, options } = setup();
  options.packaged = false;
  options.ownerEntryPath = path.resolve("another.html");
  options.getOwnerWebContents = () => null;
  assert.equal(guard(event), true);
  frame.url = "http://localhost:5173/";
  assert.equal(guard(event), false);

  assert.throws(() => createFinoraServerWalletSenderGuard({
    getOwnerWebContents: () => null,
    packaged: true,
    ownerEntryPath: "relative/index.html",
  }));
});