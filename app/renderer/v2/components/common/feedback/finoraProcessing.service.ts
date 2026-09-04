// ============================================================
// FINORA ENTERPRISE OS™
//
// GLOBAL PREMIUM PROCESSING SERVICE
//
// RESPONSIBILITY:
//
// - Own app-wide processing state
// - Start / stop FINORA Premium Loader
// - Support concurrent and nested async operations
// - Allow active processing message updates
// - Provide a safe try/finally processing wrapper
//
// IMPORTANT:
//
// - No React
// - No JSX
// - No business logic
// - No module-specific state
// - Every start call returns an independent token
// - stop is idempotent
// ============================================================

export interface FinoraProcessingRequest {
  id: number;
  message: string;
}

type FinoraProcessingSubscriber = (
  request: FinoraProcessingRequest | null,
) => void;

let requestSequence = 0;

let activeSubscriber:
  FinoraProcessingSubscriber | null = null;

const activeRequests =
  new Map<number, FinoraProcessingRequest>();

// ============================================================
// MESSAGE NORMALIZATION
// ============================================================

function normalizeProcessingMessage(
  message: unknown,
): string {
  if (
    typeof message === "string" &&
    message.trim()
  ) {
    return message.trim();
  }

  return "Processing...";
}

// ============================================================
// ACTIVE REQUEST
//
// Latest active request owns the visible message.
//
// If a nested/latest operation completes while an earlier
// operation is still active, the previous request becomes
// visible again instead of closing the loader prematurely.
// ============================================================

function resolveActiveRequest():
  FinoraProcessingRequest | null {
  const requests =
    Array.from(
      activeRequests.values(),
    );

  return (
    requests[
      requests.length - 1
    ] ??
    null
  );
}

function publishProcessingState(): void {
  activeSubscriber?.(
    resolveActiveRequest(),
  );
}

// ============================================================
// SUBSCRIPTION
// ============================================================

export function subscribeFinoraProcessing(
  subscriber: FinoraProcessingSubscriber,
): () => void {
  activeSubscriber =
    subscriber;

  /*
   * Synchronize immediately in case processing started before
   * the React host subscribed.
   */
  subscriber(
    resolveActiveRequest(),
  );

  return () => {
    if (
      activeSubscriber ===
      subscriber
    ) {
      activeSubscriber =
        null;
    }
  };
}

// ============================================================
// START
// ============================================================

export function startFinoraProcessing(
  message: unknown = "Processing...",
): number {
  requestSequence += 1;

  const request:
    FinoraProcessingRequest = {
      id:
        requestSequence,

      message:
        normalizeProcessingMessage(
          message,
        ),
    };

  activeRequests.set(
    request.id,
    request,
  );

  publishProcessingState();

  return request.id;
}

// ============================================================
// UPDATE
// ============================================================

export function updateFinoraProcessing(
  id: number,
  message: unknown,
): void {
  const current =
    activeRequests.get(id);

  if (!current) {
    return;
  }

  activeRequests.set(
    id,
    {
      ...current,

      message:
        normalizeProcessingMessage(
          message,
        ),
    },
  );

  publishProcessingState();
}

// ============================================================
// STOP
// ============================================================

export function stopFinoraProcessing(
  id: number,
): void {
  if (
    !activeRequests.has(id)
  ) {
    return;
  }

  activeRequests.delete(id);

  publishProcessingState();
}

// ============================================================
// CLEAR
//
// Defensive lifecycle utility only.
// Normal actions should stop their own token.
// ============================================================

export function clearFinoraProcessing(): void {
  activeRequests.clear();

  publishProcessingState();
}

// ============================================================
// SAFE ASYNC WRAPPER
// ============================================================

export async function runWithFinoraProcessing<T>(
  message: unknown,
  operation: () => Promise<T>,
): Promise<T> {
  const processingId =
    startFinoraProcessing(
      message,
    );

  try {
    return await operation();
  } finally {
    stopFinoraProcessing(
      processingId,
    );
  }
}

// ============================================================
// CONVENIENCE API
// ============================================================

export const finoraProcessing = {
  start:
    startFinoraProcessing,

  update:
    updateFinoraProcessing,

  stop:
    stopFinoraProcessing,

  clear:
    clearFinoraProcessing,

  run:
    runWithFinoraProcessing,
} as const;

// ============================================================
// END
// ============================================================
