/*
 * Main-process only.
 * Business transitions clear wallet access for the exact WebContents.
 * This does not confirm server-session revocation.
 */
const bindings = new WeakMap<object, () => void>();

export function bindFinoraServerWalletBusinessLifecycle(
  owner: object,
  invalidate: () => void,
): () => void {
  if (
    !owner ||
    typeof owner !== "object" ||
    typeof invalidate !== "function" ||
    bindings.has(owner)
  ) {
    throw new Error("INVALID_WALLET_LIFECYCLE_BINDING");
  }

  bindings.set(owner, invalidate);
  let released = false;

  return () => {
    if (released) return;
    released = true;
    if (bindings.get(owner) === invalidate) {
      bindings.delete(owner);
    }
  };
}

export function invalidateFinoraServerWalletForBusinessTransition(
  sender: object,
): void {
  bindings.get(sender)?.();
}
