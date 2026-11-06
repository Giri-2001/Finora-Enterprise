import type {
  PaisaruleV1CombinedUsbEvidence,
} from "./paisaruleStorageBackupV1UsbAuthority.js";

import {
  PaisaruleStorageBackupV1PreparedCache,
} from "./paisaruleStorageBackupV1PreparedCache.js";

import type {
  PaisaruleV1PreparedScope,
  PaisaruleV1PreparePreview,
} from "./paisaruleStorageBackupV1PreparedCache.js";

import {
  PaisaruleStorageBackupV1PreparedEvidence,
} from "./paisaruleStorageBackupV1PreparedEvidence.js";

export interface PaisaruleV1PrepareLifecycleInput {
  sender: object;
  generation: number;
  scope: PaisaruleV1PreparedScope;
  isCurrent(): boolean;

  /**
   * Trusted Electron main-process server authority.
   * Must validate authenticated Owner, USB mode
   * and exactly matching branch scope.
   */
  assertCurrentAuthority(): Promise<void>;
}

export interface PaisaruleV1PrepareLifecycleDependencies {
  cache: PaisaruleStorageBackupV1PreparedCache;
  evidenceRegistry:
    PaisaruleStorageBackupV1PreparedEvidence;

  /**
   * Main-process-owned hardware/source capture.
   */
  captureEvidence():
    Promise<PaisaruleV1CombinedUsbEvidence>;

  /**
   * Verify the captured hardware/source against
   * currently connected authoritative USB.
   */
  assertEvidenceCurrent(
    expected: PaisaruleV1CombinedUsbEvidence,
  ): Promise<void>;

  /**
   * Already implemented USB -> verified bytes ->
   * encrypted Cache operation.
   *
   * Must use the SAME cache instance as above.
   */
  prepareUsb(): Promise<PaisaruleV1PreparePreview>;
}

function fail(code: string): never {
  throw new Error(code);
}

function validInput(
  input: PaisaruleV1PrepareLifecycleInput,
  deps: PaisaruleV1PrepareLifecycleDependencies,
): boolean {
  return !!input &&
    !!input.sender &&
    typeof input.sender === "object" &&
    Number.isSafeInteger(input.generation) &&
    input.generation > 0 &&
    typeof input.isCurrent === "function" &&
    typeof input.assertCurrentAuthority === "function" &&
    !!input.scope &&
    !!deps &&
    deps.cache instanceof
      PaisaruleStorageBackupV1PreparedCache &&
    deps.evidenceRegistry instanceof
      PaisaruleStorageBackupV1PreparedEvidence &&
    typeof deps.captureEvidence === "function" &&
    typeof deps.assertEvidenceCurrent === "function" &&
    typeof deps.prepareUsb === "function";
}

/**
 * R173: Main-process singleton coordinator.
 *
 * One preparation at a time per renderer sender.
 * No renderer access to evidence, raw records or keys.
 * Both staging registries are invalidated on failure.
 *
 * Not an IPC endpoint. All injected dependencies
 * must come from privileged Electron main process.
 */
export class PaisaruleStorageBackupV1PrepareLifecycle {
  private readonly preparing = new Set<object>();

  async prepare(
    input: PaisaruleV1PrepareLifecycleInput,
    deps: PaisaruleV1PrepareLifecycleDependencies,
  ): Promise<PaisaruleV1PreparePreview> {
    if (!validInput(input, deps)) {
      return fail("BACKUP_LIFECYCLE_INPUT_INVALID");
    }

    const sender = input.sender;

    // Do not disturb an operation already running
    // for this renderer sender.
    if (this.preparing.has(sender)) {
      return fail("BACKUP_PREPARE_ALREADY_RUNNING");
    }

    this.preparing.add(sender);

    try {
      // Every new attempt invalidates older preview
      // and its hardware/source evidence together.
      deps.cache.clear(sender);
      deps.evidenceRegistry.clear(sender);

      if (!input.isCurrent()) {
        return fail("BACKUP_PREPARE_LOGIN_CHANGED");
      }

      await input.assertCurrentAuthority();

      if (!input.isCurrent()) {
        return fail("BACKUP_PREPARE_LOGIN_CHANGED");
      }

      const evidence = await deps.captureEvidence();

      await input.assertCurrentAuthority();

      if (!input.isCurrent()) {
        return fail("BACKUP_PREPARE_LOGIN_CHANGED");
      }

      // The subordinate wrapper also verifies
      // USB identity and source against the exact
      // bytes used by encryption and preview counts.
      const preview = await deps.prepareUsb();

      if (!input.isCurrent()) {
        return fail("BACKUP_PREPARE_LOGIN_CHANGED");
      }

      // Verify the originally captured evidence
      // AFTER the encrypted snapshot is prepared.
      await deps.assertEvidenceCurrent(evidence);

      await input.assertCurrentAuthority();

      if (!input.isCurrent()) {
        return fail("BACKUP_PREPARE_LOGIN_CHANGED");
      }

      // Register only after every previous check
      // has completed successfully.
      deps.evidenceRegistry.register({
        sender,
        token: preview.token,
        generation: input.generation,
        scope: input.scope,
        evidence,
        expiresAt: preview.expiresAt,
      });

      if (!input.isCurrent()) {
        return fail("BACKUP_PREPARE_LOGIN_CHANGED");
      }

      return preview;
    } catch (error) {
      // Invalidate both the encrypted artifact and
      // its USB evidence on any rejected preparation.
      deps.evidenceRegistry.clear(sender);
      deps.cache.clear(sender);
      throw error;
    } finally {
      this.preparing.delete(sender);
    }
  }

  isPreparing(sender: object): boolean {
    return this.preparing.has(sender);
  }
}