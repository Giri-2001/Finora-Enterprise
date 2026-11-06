/** PAISARULE C117-R95: isolated synthetic atomic restore primitive. NOT wired to USB or grant redemption. */
import { lstat, mkdir, open, readdir, rename, rm } from 'node:fs/promises';
import { dirname, join, resolve, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';

const FILES = Object.freeze(['finora-storage.json', 'finora-storage.backup.json']);
const DENIED = 'PAISARULE_ATOMIC_RESTORE_DENIED';
const deny = () => { throw new Error(DENIED); };
const digest = b => createHash('sha256').update(b).digest();
const maxFile = 32 * 1024 * 1024;
async function assertDirectory(path) { const s = await lstat(path); if (!s.isDirectory() || s.isSymbolicLink()) deny(); }
async function assertAbsent(path) { try { await lstat(path); deny(); } catch(e) { if (e?.code !== 'ENOENT') throw e; } }
function validateFiles(files) {
  if (!files || Object.getPrototypeOf(files) !== Object.prototype ||
      Object.keys(files).sort().join(',') !== [...FILES].sort().join(',')) deny();
  for (const name of FILES) {
    const f = files[name];
    if (!f || Object.getPrototypeOf(f) !== Object.prototype ||
        Object.keys(f).sort().join(',') !== 'bytes,sha256' ||
        !Buffer.isBuffer(f.bytes) || f.bytes.length === 0 || f.bytes.length > maxFile ||
        typeof f.sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(f.sha256)) deny();
    const expected = Buffer.from(f.sha256, 'hex');
    const actual = digest(f.bytes);
    try { if (!timingSafeEqual(expected, actual)) deny(); }
    finally { expected.fill(0); actual.fill(0); }
  }
}
/**
 * Dedicated empty parent only. destination must NOT exist. The caller must
 * verify trusted USB mount/branch scope and signed grant independently.
 * Commit is one same-volume directory rename, never partial file replacement.
 */
export async function stageAndCommitPaisaruleRestoreV1({ parentDirectory, destinationName, files, allowSyntheticOnly = false }) {
  if (allowSyntheticOnly !== true || typeof parentDirectory !== 'string' ||
      typeof destinationName !== 'string' || !/^[A-Za-z][A-Za-z0-9_-]{0,63}$/.test(destinationName)) deny();
  validateFiles(files);
  const parent = resolve(parentDirectory);
  if (parent !== parentDirectory || parent === dirname(parent) ||
      !parent.startsWith(resolve(tmpdir()) + sep)) deny();
  await assertDirectory(parent);
  const currentEntries = await readdir(parent);
  if (currentEntries.length !== 0) deny(); // no existing production data or unrelated entries
  const destination = join(parent, destinationName);
  if (dirname(destination) !== parent || !destination.startsWith(parent + sep)) deny();
  await assertAbsent(destination);
  const stage = join(parent, '.paisarule-stage-' + randomUUID());
  let stageCreated = false;
  let committed = false;
  try {
    await mkdir(stage, {recursive:false, mode:0o700});
    stageCreated = true;
    for (const name of FILES) {
      const p = join(stage, name);
      const fh = await open(p, 'wx', 0o600);
      try { await fh.writeFile(files[name].bytes); await fh.sync(); }
      finally { await fh.close(); }
      // Important: verify bytes after write, not solely caller hashes.
      const verify = await import('node:fs/promises').then(m=>m.readFile(p));
      const actual = digest(verify);
      const expected = Buffer.from(files[name].sha256, 'hex');
      try { if (!timingSafeEqual(actual, expected)) deny(); }
      finally { verify.fill(0); actual.fill(0); expected.fill(0); }
    }
    // Verify parent wasn't populated concurrently; nothing can share destination.
    const entries = await readdir(parent);
    if (entries.length !== 1 || entries[0] !== stage.split(sep).at(-1)) deny();
    await assertAbsent(destination);
    await rename(stage, destination);
    committed = true;
    return Object.freeze({success:true, filesCommitted:FILES.length});
  } finally {
    if (stageCreated && !committed) await rm(stage, {recursive:true, force:true});
  }
}
