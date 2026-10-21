/*
 * FINORA_P1_591B_RECHARGE_DECISION_CLIENT
 * Electron main-process only.
 * No UI/IPC wiring. Never log the administrator credential.
 */

const API_URL =
  "https://api.finoraenterprise.com/admin/wallet/recharges/decision";

export type FinoraRechargeDecisionInput =
  | {
      requestId: string;
      decision: "APPROVE";
      paymentVerified: true;
      paymentReference: string;
    }
  | {
      requestId: string;
      decision: "DECLINE";
      reason: string;
    };

export interface FinoraRechargeDecisionResult {
  ok: true;
  source: "POSTGRESQL_RECHARGE_REQUESTS";
  request: {
    requestId: string;
    walletId: string;
    amountInr: string;
    status: "APPROVED" | "DECLINED";
    decidedAt: string;
  };
  replayed: boolean;
}

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value &&
    typeof value === "object" &&
    !Array.isArray(value);
}

function validateDecision(input: unknown): FinoraRechargeDecisionInput {
  if (!isRecord(input) ||
      typeof input.requestId !== "string" ||
      !UUID.test(input.requestId)) {
    throw new Error("INVALID_RECHARGE_DECISION");
  }

  const keys = Object.keys(input);

  if (input.decision === "APPROVE") {
    if (keys.some(k => ![
      "requestId", "decision", "paymentVerified", "paymentReference",
    ].includes(k)) ||
        input.paymentVerified !== true ||
        typeof input.paymentReference !== "string") {
      throw new Error("PAYMENT_VERIFICATION_REQUIRED");
    }

    const reference = input.paymentReference.trim().toUpperCase();
    if (!/^[A-Z0-9]{6,64}$/.test(reference)) {
      throw new Error("INVALID_PAYMENT_REFERENCE");
    }

    return {
      requestId: input.requestId.toLowerCase(),
      decision: "APPROVE",
      paymentVerified: true,
      paymentReference: reference,
    };
  }

  if (input.decision === "DECLINE") {
    if (keys.some(k => ![
      "requestId", "decision", "reason",
    ].includes(k)) ||
        typeof input.reason !== "string" ||
        input.reason.length > 1000) {
      throw new Error("INVALID_DECLINE_REASON");
    }

    const reason = input.reason.trim();
    if (!reason || /[\u0000-\u001f\u007f]/.test(reason)) {
      throw new Error("INVALID_DECLINE_REASON");
    }

    return {
      requestId: input.requestId.toLowerCase(),
      decision: "DECLINE",
      reason,
    };
  }

  throw new Error("INVALID_RECHARGE_DECISION");
}

export function createFinoraRechargeDecisionClient(
  transport: typeof fetch,
) {
  if (typeof transport !== "function") {
    throw new Error("INVALID_RECHARGE_TRANSPORT");
  }

  return async (
    adminApiKey: string,
    input: FinoraRechargeDecisionInput,
  ): Promise<FinoraRechargeDecisionResult> => {
    if (typeof adminApiKey !== "string" ||
        !adminApiKey.trim() ||
        adminApiKey.length > 4096) {
      throw new Error("ADMIN_CREDENTIAL_REQUIRED");
    }

    const request = validateDecision(input);

    let response: Response;
    try {
      response = await transport(API_URL, {
        method: "POST",
        headers: {
          "x-finora-admin-key": adminApiKey,
          "content-type": "application/json",
        },
        body: JSON.stringify(request),
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      });
    } catch {
      // Near-COMMIT failures may have an uncertain outcome.
      throw new Error("RECHARGE_DECISION_OUTCOME_UNKNOWN_RETRY_SAME_REQUEST");
    }

    let body: unknown;
    try {
      body = await response.json();
    } catch {
      throw new Error("RECHARGE_DECISION_OUTCOME_UNKNOWN_RETRY_SAME_REQUEST");
    }

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("RECHARGE_ADMIN_UNAUTHORIZED");
      }

      if (isRecord(body) && body.ok === false &&
          typeof body.error === "string" &&
          [
            "INVALID_DECISION",
            "INVALID_REQUEST_ID",
            "UNEXPECTED_DECISION_FIELD",
            "PAYMENT_VERIFICATION_REQUIRED",
            "INVALID_PAYMENT_REFERENCE",
            "INVALID_DECLINE_REASON",
            "RECHARGE_REQUEST_NOT_FOUND",
            "RECHARGE_DECISION_CONFLICT",
            "PAYMENT_REFERENCE_ALREADY_USED",
            "WALLET_NOT_AVAILABLE",
            "WALLET_BALANCE_LIMIT_EXCEEDED",
          ].includes(body.error)) {
        throw new Error(body.error);
      }

      throw new Error("RECHARGE_DECISION_OUTCOME_UNKNOWN_RETRY_SAME_REQUEST");
    }

    if (!isRecord(body) ||
        body.ok !== true ||
        body.source !== "POSTGRESQL_RECHARGE_REQUESTS" ||
        typeof body.replayed !== "boolean" ||
        !isRecord(body.request)) {
      throw new Error("INVALID_RECHARGE_DECISION_RESPONSE");
    }

    const result = body.request;

    if (typeof result.requestId !== "string" ||
        result.requestId.toLowerCase() !== request.requestId ||
        typeof result.walletId !== "string" ||
        !result.walletId.trim() ||
        result.walletId.length > 512 ||
        typeof result.amountInr !== "string" ||
        !/^\d{1,10}(\.\d{1,2})?$/.test(result.amountInr) ||
        result.status !== (
          request.decision === "APPROVE" ? "APPROVED" : "DECLINED"
        ) ||
        typeof result.decidedAt !== "string" ||
        !Number.isFinite(Date.parse(result.decidedAt))) {
      throw new Error("INVALID_RECHARGE_DECISION_RESPONSE");
    }

    return body as unknown as FinoraRechargeDecisionResult;
  };
}

// Deliberately no default exported network caller.
// Privileged IPC must explicitly bind transport and credential vault.