/*
 * FINORA C8-P
 *
 * Strict four-plan GET response contract.
 * No network access, credential storage or database writes.
 * Missing prices must never become zero.
 */

export const FINORA_PLAN_MONTHS = [1, 3, 6, 12] as const;

export const FINORA_PLAN_USAGE_CODES = [
  "CUSTOMER_CREATE",
  "LOAN_DISBURSEMENT",
  "COLLECTION",
] as const;

export type FinoraFourPlanPricingSource = "GLOBAL" | "BRANCH";

export interface FinoraFourPlanPrice {
  amountInr: string;
  source: FinoraFourPlanPricingSource;
  revisionId: string;
}

export interface FinoraFourPlanPricingPlan {
  months: 1 | 3 | 6 | 12;
  subscription: FinoraFourPlanPrice;
  fees: {
    CUSTOMER_CREATE: FinoraFourPlanPrice;
    LOAN_DISBURSEMENT: FinoraFourPlanPrice;
    COLLECTION: FinoraFourPlanPrice;
  };
}

export interface FinoraFourPlanPricingView {
  ok: true;
  scope: "GLOBAL" | "BRANCH";
  branchId: string | null;
  plans: FinoraFourPlanPricingPlan[];
}

function object(
  value: unknown,
  error: string,
): Record<string, unknown> {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    throw new Error(error);
  }

  return value as Record<string, unknown>;
}

function keysExactly(
  value: Record<string, unknown>,
  expected: readonly string[],
  error: string,
): void {
  const actual = Object.keys(value);

  if (
    actual.length !== expected.length ||
    actual.some((key) => !expected.includes(key))
  ) {
    throw new Error(error);
  }
}

function price(
  value: unknown,
  scope: "GLOBAL" | "BRANCH",
): FinoraFourPlanPrice {
  const input = object(
    value,
    "FINORA_PLAN_PRICE_INVALID",
  );

  keysExactly(
    input,
    ["amountInr", "source", "revisionId"],
    "FINORA_PLAN_PRICE_FIELDS_INVALID",
  );

  if (
    typeof input.amountInr !== "string" ||
    !/^(0|[1-9][0-9]{0,9})\.[0-9]{2}$/.test(
      input.amountInr,
    )
  ) {
    throw new Error("FINORA_PLAN_PRICE_AMOUNT_INVALID");
  }

  if (
    input.source !== "GLOBAL" &&
    input.source !== "BRANCH"
  ) {
    throw new Error("FINORA_PLAN_PRICE_SOURCE_INVALID");
  }

  if (scope === "GLOBAL" && input.source !== "GLOBAL") {
    throw new Error("FINORA_GLOBAL_PRICE_SOURCE_INVALID");
  }

  if (
    typeof input.revisionId !== "string" ||
    !/^[A-Za-z0-9_-]{1,12}$/.test(input.revisionId)
  ) {
    throw new Error("FINORA_PLAN_PRICE_REVISION_INVALID");
  }

  return {
    amountInr: input.amountInr,
    source: input.source,
    revisionId: input.revisionId,
  };
}

export function parseFinoraFourPlanPricingResponse(
  body: unknown,
  expectedScope: "GLOBAL" | "BRANCH",
  expectedBranchId: string | null,
): FinoraFourPlanPricingView {
  if (
    expectedScope !== "GLOBAL" &&
    expectedScope !== "BRANCH"
  ) {
    throw new Error("FINORA_EXPECTED_SCOPE_INVALID");
  }

  if (
    (expectedScope === "GLOBAL" && expectedBranchId !== null) ||
    (
      expectedScope === "BRANCH" &&
      (
        typeof expectedBranchId !== "string" ||
        !/^[A-Za-z0-9_-]{1,128}$/.test(expectedBranchId)
      )
    )
  ) {
    throw new Error("FINORA_EXPECTED_BRANCH_INVALID");
  }

  const input = object(
    body,
    "FINORA_PLAN_PRICING_RESPONSE_INVALID",
  );

  keysExactly(
    input,
    ["ok", "scope", "branchId", "plans"],
    "FINORA_PLAN_PRICING_RESPONSE_FIELDS_INVALID",
  );

  if (
    input.ok !== true ||
    input.scope !== expectedScope ||
    input.branchId !== expectedBranchId ||
    !Array.isArray(input.plans) ||
    input.plans.length !== 4
  ) {
    throw new Error("FINORA_PLAN_PRICING_SCOPE_INVALID");
  }

  const seen = new Set<number>();

  const plans = input.plans.map((raw) => {
    const plan = object(
      raw,
      "FINORA_PLAN_ROW_INVALID",
    );

    keysExactly(
      plan,
      ["months", "subscription", "fees"],
      "FINORA_PLAN_ROW_FIELDS_INVALID",
    );

    const months = plan.months;

    if (
      typeof months !== "number" ||
      !FINORA_PLAN_MONTHS.includes(
        months as 1 | 3 | 6 | 12,
      ) ||
      seen.has(months)
    ) {
      throw new Error("FINORA_PLAN_MONTHS_INVALID");
    }

    seen.add(months);

    const fees = object(
      plan.fees,
      "FINORA_PLAN_FEES_INVALID",
    );

    keysExactly(
      fees,
      FINORA_PLAN_USAGE_CODES,
      "FINORA_PLAN_FEES_INCOMPLETE",
    );

    return {
      months: months as 1 | 3 | 6 | 12,
      subscription: price(
        plan.subscription,
        expectedScope,
      ),
      fees: {
        CUSTOMER_CREATE: price(
          fees.CUSTOMER_CREATE,
          expectedScope,
        ),
        LOAN_DISBURSEMENT: price(
          fees.LOAN_DISBURSEMENT,
          expectedScope,
        ),
        COLLECTION: price(
          fees.COLLECTION,
          expectedScope,
        ),
      },
    };
  });

  for (const months of FINORA_PLAN_MONTHS) {
    if (!seen.has(months)) {
      throw new Error("FINORA_PLAN_MISSING");
    }
  }

  return {
    ok: true,
    scope: expectedScope,
    branchId: expectedBranchId,
    plans,
  };
}
