// ============================================================
// FINORA ENTERPRISE OS
// PORTABLE BRANCH AUTH V2 CREDENTIAL MUTATION QUEUE
//
// SECURITY:
//
// - MAIN PROCESS ONLY.
// - Serializes operations capable of deriving or committing
//   successor Portable Branch Auth V2 credential generations.
// - Normal credential rotation and Security-Code password recovery
//   MUST use this exact shared queue.
// - Failed operations never poison later queue operations.
// ============================================================

let finoraPortableBranchAuthV2CredentialMutationQueue:
  Promise<void> =
  Promise.resolve();

export function runFinoraPortableBranchAuthV2CredentialMutationSerialized<T>(
  operation:
    () => Promise<T>,
): Promise<T> {
  const result =
    finoraPortableBranchAuthV2CredentialMutationQueue.then(
      operation,
      operation,
    );

  finoraPortableBranchAuthV2CredentialMutationQueue =
    result.then(
      () =>
        undefined,
      () =>
        undefined,
    );

  return result;
}