const FINORA_API_BASE_URL =
  "https://api.finoraenterprise.com";

const FINORA_SERVER_REQUEST_TIMEOUT_MS =
  15_000;

export interface FinoraServerProvisionOwnerInput {
  ownerName:
    string;

  mobile:
    string;

  aadhaar?:
    string;

  aadhaarConsent?:
    boolean;

  businessName:
    string;

  branchName:
    string;

  username:
    string;

  validFrom:
    string;

  validUntil:
    string;

  openingWalletBalance:
    number;
}

export interface FinoraServerProvisionOwnerResult {
  ok:
    true;

  owner: {
    ownerId:
      string;

    ownerName:
      string;

    mobile:
      string;

    aadhaar:
      | {
          masked:
            string;

          last4:
            string;

          kycStatus:
            string;

          consentAt:
            string | null;

          verifiedAt:
            string | null;
        }
      | null;
  };

  business: {
    businessId:
      string;

    businessName:
      string;
  };

  branch: {
    branchId:
      string;

    branchName:
      string;

    storageMode:
      "USB";

    status:
      string;
  };

  credentials: {
    userId:
      string;

    username:
      string;

    temporaryPassword:
      string;

    temporarySecurityCode:
      string;

    mustChangePassword:
      boolean;

    mustChangeSecurityCode:
      boolean;
  };

  subscription: {
    subscriptionId:
      string;

    validFrom:
      string;

    validUntil:
      string;

    remainingDays:
      number;

    status:
      string;
  };

  wallet: {
    walletId:
      string;

    balanceInr:
      number;
  };
}

interface FinoraServerErrorResponse {
  ok?:
    false;

  error?:
    string;
}

function assertAdminApiKey(
  value:
    string,
): string {
  const normalized =
    value.trim();

  if (
    normalized.length < 32
  ) {
    throw new Error(
      "FINORA Server administrator credential is unavailable.",
    );
  }

  return normalized;
}

function getServerErrorMessage(
  status:
    number,
  body:
    FinoraServerErrorResponse | undefined,
): string {
  switch (
    body?.error
  ) {
    case "USERNAME_TAKEN":
      return "Username is already taken.";

    case "MOBILE_INVALID":
      return "Owner mobile number is invalid.";

    case "AADHAAR_INVALID":
      return "Aadhaar must contain exactly 12 digits.";

    case "AADHAAR_CONSENT_REQUIRED":
      return "Aadhaar consent is required when Aadhaar is provided.";

    case "VALID_FROM_INVALID":
      return "Subscription Valid From date is invalid.";

    case "VALID_UNTIL_INVALID":
      return "Subscription Valid Until date is invalid.";

    case "VALID_UNTIL_MUST_BE_AFTER_VALID_FROM":
      return "Valid Until must be after Valid From.";

    case "OPENING_BALANCE_INVALID":
      return "Opening wallet balance is invalid.";

    case "USERNAME_INVALID":
      return "Username must contain 4 to 12 supported characters.";

    case "UNAUTHORIZED":
      return "FINORA Server rejected the Control Center administrator credential.";

    default:
      return `FINORA Server request failed with status ${status}.`;
  }
}

export async function provisionFinoraServerOwner(
  input:
    FinoraServerProvisionOwnerInput,
  adminApiKey:
    string,
): Promise<
  FinoraServerProvisionOwnerResult
> {
  const protectedAdminApiKey =
    assertAdminApiKey(
      adminApiKey,
    );

  let response:
    Response;

  try {
    response =
      await fetch(
        `${FINORA_API_BASE_URL}/admin/provision-owner`,
        {
          method:
            "POST",

          headers: {
            "content-type":
              "application/json",

            "x-finora-admin-key":
              protectedAdminApiKey,
          },

          body:
            JSON.stringify(
              input,
            ),

          signal:
            AbortSignal.timeout(
              FINORA_SERVER_REQUEST_TIMEOUT_MS,
            ),
        },
      );
  } catch {
    throw new Error(
      "Unable to reach the FINORA production server.",
    );
  }

  let body:
    unknown;

  try {
    body =
      await response.json();
  } catch {
    throw new Error(
      "FINORA Server returned an unreadable response.",
    );
  }

  if (
    !response.ok
  ) {
    throw new Error(
      getServerErrorMessage(
        response.status,
        typeof body === "object" &&
          body !== null
          ? body as FinoraServerErrorResponse
          : undefined,
      ),
    );
  }

  if (
    typeof body !== "object" ||
    body === null ||
    Array.isArray(body) ||
    (body as { ok?: unknown }).ok !== true
  ) {
    throw new Error(
      "FINORA Server returned an invalid provisioning response.",
    );
  }

  return body as FinoraServerProvisionOwnerResult;
}


export async function verifyFinoraServerAdminCredential(
  adminApiKey:
    string,
): Promise<true> {
  const protectedAdminApiKey =
    assertAdminApiKey(
      adminApiKey,
    );

  let response:
    Response;

  try {
    response =
      await fetch(
        `${FINORA_API_BASE_URL}/admin/verify`,
        {
          method:
            "GET",

          headers: {
            "x-finora-admin-key":
              protectedAdminApiKey,
          },

          signal:
            AbortSignal.timeout(
              FINORA_SERVER_REQUEST_TIMEOUT_MS,
            ),
        },
      );
  } catch {
    throw new Error(
      "Unable to reach the FINORA production server.",
    );
  }

  let body:
    unknown;

  try {
    body =
      await response.json();
  } catch {
    throw new Error(
      "FINORA Server returned an unreadable response.",
    );
  }

  if (
    !response.ok
  ) {
    throw new Error(
      getServerErrorMessage(
        response.status,
        typeof body === "object" &&
          body !== null
          ? body as FinoraServerErrorResponse
          : undefined,
      ),
    );
  }

  if (
    typeof body !== "object" ||
    body === null ||
    (
      body as {
        ok?: unknown;
      }
    ).ok !== true ||
    (
      body as {
        authenticated?: unknown;
      }
    ).authenticated !== true
  ) {
    throw new Error(
      "FINORA Server administrator credential verification returned an invalid response.",
    );
  }

  return true;
}
// FINORA_P292_LIVE_WALLET_CLIENT
// Electron main process only. Never expose admin credentials to renderer.

export interface FinoraServerLiveWalletRecord {
  owner_id: string;
  owner_name: string;
  owner_mobile?: string;
  business_id: string;
  business_name: string;
  branch_id: string;
  branch_name: string;
  wallet_id: string;
  balance_inr: string;
  wallet_status: string;
  wallet_updated_at: string;
}

export interface FinoraServerLiveWalletPage {
  ok: true;
  source: "POSTGRESQL_WALLETS";
  wallets: FinoraServerLiveWalletRecord[];
  limit: number;
  offset: number;
  hasMore: boolean;
}

export async function fetchFinoraServerLiveWallets(
  adminApiKey: string,
  limit = 100,
  offset = 0,
): Promise<FinoraServerLiveWalletPage> {
  const protectedKey = assertAdminApiKey(adminApiKey);

  if (
    !Number.isSafeInteger(limit) ||
    limit < 1 ||
    limit > 100 ||
    !Number.isSafeInteger(offset) ||
    offset < 0 ||
    offset > 99999999
  ) {
    throw new Error("FINORA wallet pagination is invalid.");
  }

  let response: Response;

  try {
    response = await fetch(
      `${FINORA_API_BASE_URL}/admin/wallets/live?limit=${limit}&offset=${offset}`,
      {
        method: "GET",
        headers: {
          "x-finora-admin-key": protectedKey,
        },
        signal: AbortSignal.timeout(
          FINORA_SERVER_REQUEST_TIMEOUT_MS,
        ),
        cache: "no-store",
      },
    );
  } catch {
    throw new Error(
      "Unable to reach the FINORA live Wallet server.",
    );
  }

  let body: unknown;

  try {
    body = await response.json();
  } catch {
    throw new Error(
      "FINORA live Wallet response is unreadable.",
    );
  }

  if (!response.ok) {
    throw new Error(
      getServerErrorMessage(
        response.status,
        typeof body === "object" &&
        body !== null &&
        !Array.isArray(body)
          ? body as FinoraServerErrorResponse
          : undefined,
      ),
    );
  }

  if (
    typeof body !== "object" ||
    body === null ||
    Array.isArray(body)
  ) {
    throw new Error("FINORA live Wallet response is invalid.");
  }

  const candidate = body as Record<string, unknown>;

  if (
    candidate.ok !== true ||
    candidate.source !== "POSTGRESQL_WALLETS" ||
    !Array.isArray(candidate.wallets) ||
    candidate.limit !== limit ||
    candidate.offset !== offset ||
    typeof candidate.hasMore !== "boolean"
  ) {
    throw new Error("FINORA live Wallet response is invalid.");
  }

  for (const item of candidate.wallets) {
    if (
      typeof item !== "object" ||
      item === null ||
      Array.isArray(item)
    ) {
      throw new Error("FINORA live Wallet record is invalid.");
    }

    const wallet = item as Record<string, unknown>;

    for (const key of [
      "owner_id",
      "owner_name",
      "business_id",
      "business_name",
      "branch_id",
      "branch_name",
      "wallet_id",
      "wallet_status",
      "wallet_updated_at",
    ]) {
      if (
        typeof wallet[key] !== "string" ||
        (wallet[key] as string).trim().length === 0
      ) {
        throw new Error("FINORA live Wallet record is incomplete.");
      }
    }

    if (
      wallet.owner_mobile !== undefined &&
      (
        typeof wallet.owner_mobile !== "string" ||
        !/^[6-9][0-9]{9}$/.test(wallet.owner_mobile)
      )
    ) {
      throw new Error("FINORA live Wallet owner mobile is invalid.");
    }

    const balance = wallet.balance_inr;

    if (
      !(typeof balance === "string" ||
        typeof balance === "number") ||
      !/^\d{1,10}(\.\d{1,2})?$/.test(String(balance)) ||
      !Number.isFinite(Number(balance))
    ) {
      throw new Error("FINORA live Wallet balance is invalid.");
    }
  }

  if (candidate.wallets.length > limit) {
    throw new Error("FINORA live Wallet page exceeds limit.");
  }

  return candidate as unknown as FinoraServerLiveWalletPage;
}

// FINORA_P1_579IC_SERVER_GLOBAL_PRICING

export interface FinoraServerGlobalPricingInput {
  customerCreateFee: number;
  loanDisbursementFee: number;
  collectionBelow25000Fee: number;
  collection25000To50000Fee: number;
  collectionAbove50000Fee: number;
  subscription1MonthFee: number;
  subscription3MonthFee: number;
  subscription6MonthFee: number;
  subscription12MonthFee: number;
  pricingNoticeTitle?: string;
  pricingNoticeMessage?: string;
}

export interface FinoraServerGlobalPricingView {
  source: "CONTROL_CENTER";
  revision: number;
  updatedAt?: string;
  customerCreateFee: number;
  loanDisbursementFee: number;
  collectionBelow25000Fee: number;
  collection25000To50000Fee: number;
  collectionAbove50000Fee: number;
  subscription1MonthFee: number;
  subscription3MonthFee: number;
  subscription6MonthFee: number;
  subscription12MonthFee: number;
  pricingNoticeTitle?: string;
  pricingNoticeMessage?: string;
}

// FINORA_P1_579IL_PRICING_NUMBER_NORMALIZATION
function requireFinoraServerGlobalPricingAmount(
  value: unknown,
  field: string,
): number {
  // FINORA_P1_579IT_PRICING_RUNTIME_TRACE
  console.log(
    "[FINORA PRICING INPUT]",
    JSON.stringify({
      field,
      type: typeof value,
      value:
        typeof value === "number" ||
        typeof value === "string"
          ? value
          : value === null
            ? null
            : "[NON_PRIMITIVE]",
    }),
  );
  const normalized =
    typeof value === "number"
      ? value
      : typeof value === "string" &&
          value.trim() !== ""
        ? Number(value.trim())
        : Number.NaN;

  if (
    !Number.isFinite(normalized) ||
    normalized < 0 ||
    normalized > 1_000_000 ||
    Math.round(normalized * 100) !==
      normalized * 100
  ) {
    throw new Error(`FINORA ${field} is invalid.`);
  }

  return normalized;
}

function mapFinoraServerGlobalPricing(
  body: unknown,
): FinoraServerGlobalPricingView {
  if (
    typeof body !== "object" ||
    body === null ||
    Array.isArray(body) ||
    (body as { ok?: unknown }).ok !== true
  ) {
    throw new Error(
      "FINORA global pricing server response is invalid.",
    );
  }

  const root = body as Record<string, unknown>;
  const rawPricing = root.pricing;

  if (
    typeof rawPricing !== "object" ||
    rawPricing === null ||
    Array.isArray(rawPricing)
  ) {
    throw new Error(
      "FINORA global pricing is not configured on the server.",
    );
  }

  const pricing = rawPricing as Record<string, unknown>;

  const revision =
    typeof root.revision === "object" &&
    root.revision !== null &&
    !Array.isArray(root.revision)
      ? root.revision as Record<string, unknown>
      : undefined;

  const title =
    revision && typeof revision.title === "string"
      ? revision.title
      : undefined;

  const message =
    revision && typeof revision.message === "string"
      ? revision.message
      : undefined;

  const updatedAt =
    revision && typeof revision.createdAt === "string"
      ? revision.createdAt
      : undefined;

  // FINORA_P1_579IV_PRICING_ROW_AMOUNT
  // The canonical admin API may return each pricing code either as the
  // amount itself or as a PostgreSQL-derived row object.  Extract only the
  // amount field; never infer or fabricate a price.
  const readPricingAmount = (
    value: unknown,
  ): unknown => {
    if (
      typeof value === "number" ||
      typeof value === "string"
    ) {
      return value;
    }

    if (
      value !== null &&
      typeof value === "object" &&
      !Array.isArray(value)
    ) {
      const row = value as Record<string, unknown>;

      if ("amountInr" in row) {
        return row.amountInr;
      }

      if ("amount_inr" in row) {
        return row.amount_inr;
      }

      if ("amount" in row) {
        return row.amount;
      }
    }

    return value;
  };

  return {
    source: "CONTROL_CENTER",
    revision: 1,

    customerCreateFee:
      requireFinoraServerGlobalPricingAmount(
        readPricingAmount(pricing.CUSTOMER_CREATE),
        "Customer Create price",
      ),

    loanDisbursementFee:
      requireFinoraServerGlobalPricingAmount(
        readPricingAmount(pricing.LOAN_DISBURSEMENT),
        "Loan Disbursement price",
      ),

    collectionBelow25000Fee:
      requireFinoraServerGlobalPricingAmount(
        readPricingAmount(pricing.COLLECTION_BELOW_25000),
        "Collection Below 25000 price",
      ),

    collection25000To50000Fee:
      requireFinoraServerGlobalPricingAmount(
        readPricingAmount(pricing.COLLECTION_25000_TO_50000),
        "Collection 25000 To 50000 price",
      ),

    collectionAbove50000Fee:
      requireFinoraServerGlobalPricingAmount(
        readPricingAmount(pricing.COLLECTION_ABOVE_50000),
        "Collection Above 50000 price",
      ),

    subscription1MonthFee:
      requireFinoraServerGlobalPricingAmount(
        readPricingAmount(pricing.SUBSCRIPTION_1_MONTH),
        "1 Month Subscription price",
      ),

    subscription3MonthFee:
      requireFinoraServerGlobalPricingAmount(
        readPricingAmount(pricing.SUBSCRIPTION_3_MONTH),
        "3 Month Subscription price",
      ),

    subscription6MonthFee:
      requireFinoraServerGlobalPricingAmount(
        readPricingAmount(pricing.SUBSCRIPTION_6_MONTH),
        "6 Month Subscription price",
      ),

    subscription12MonthFee:
      requireFinoraServerGlobalPricingAmount(
        readPricingAmount(pricing.SUBSCRIPTION_12_MONTH),
        "12 Month Subscription price",
      ),

    ...(title ? { pricingNoticeTitle: title } : {}),
    ...(message ? { pricingNoticeMessage: message } : {}),
    ...(updatedAt ? { updatedAt } : {}),
  };
}

async function readFinoraServerGlobalPricingBody(
  response: Response,
): Promise<unknown> {
  let body: unknown;

  try {
    body = await response.json();
  } catch {
    throw new Error(
      "FINORA global pricing response is unreadable.",
    );
  }

  if (!response.ok) {
    throw new Error(
      getServerErrorMessage(
        response.status,
        typeof body === "object" &&
          body !== null &&
          !Array.isArray(body)
          ? body as FinoraServerErrorResponse
          : undefined,
      ),
    );
  }

  return body;
}

export async function fetchFinoraServerGlobalPricing(
  adminApiKey: string,
): Promise<FinoraServerGlobalPricingView> {
  const protectedKey = assertAdminApiKey(adminApiKey);

  let response: Response;

  try {
    response = await fetch(
      `${FINORA_API_BASE_URL}/admin/pricing/global`,
      {
        method: "GET",
        headers: {
          "x-finora-admin-key": protectedKey,
        },
        signal: AbortSignal.timeout(
          FINORA_SERVER_REQUEST_TIMEOUT_MS,
        ),
        cache: "no-store",
      },
    );
  } catch {
    throw new Error(
      "Unable to reach the FINORA global pricing server.",
    );
  }

  return mapFinoraServerGlobalPricing(
    await readFinoraServerGlobalPricingBody(response),
  );
}

export async function updateFinoraServerGlobalPricing(
  adminApiKey: string,
  input: FinoraServerGlobalPricingInput,
): Promise<FinoraServerGlobalPricingView> {
  const protectedKey = assertAdminApiKey(adminApiKey);

  const pricing = {
    CUSTOMER_CREATE:
      requireFinoraServerGlobalPricingAmount(
        input.customerCreateFee,
        "Customer Create price",
      ),
    LOAN_DISBURSEMENT:
      requireFinoraServerGlobalPricingAmount(
        input.loanDisbursementFee,
        "Loan Disbursement price",
      ),
    COLLECTION_BELOW_25000:
      requireFinoraServerGlobalPricingAmount(
        input.collectionBelow25000Fee,
        "Collection Below 25000 price",
      ),
    COLLECTION_25000_TO_50000:
      requireFinoraServerGlobalPricingAmount(
        input.collection25000To50000Fee,
        "Collection 25000 To 50000 price",
      ),
    COLLECTION_ABOVE_50000:
      requireFinoraServerGlobalPricingAmount(
        input.collectionAbove50000Fee,
        "Collection Above 50000 price",
      ),
    SUBSCRIPTION_1_MONTH:
      requireFinoraServerGlobalPricingAmount(
        input.subscription1MonthFee,
        "1 Month Subscription price",
      ),
    SUBSCRIPTION_3_MONTH:
      requireFinoraServerGlobalPricingAmount(
        input.subscription3MonthFee,
        "3 Month Subscription price",
      ),
    SUBSCRIPTION_6_MONTH:
      requireFinoraServerGlobalPricingAmount(
        input.subscription6MonthFee,
        "6 Month Subscription price",
      ),
    SUBSCRIPTION_12_MONTH:
      requireFinoraServerGlobalPricingAmount(
        input.subscription12MonthFee,
        "12 Month Subscription price",
      ),
  };

  const payload: Record<string, unknown> = { pricing };

  if (input.pricingNoticeTitle !== undefined) {
    payload.title = input.pricingNoticeTitle;
  }

  if (input.pricingNoticeMessage !== undefined) {
    payload.message = input.pricingNoticeMessage;
  }

  let response: Response;

  try {
    response = await fetch(
      `${FINORA_API_BASE_URL}/admin/pricing/global`,
      {
        method: "PUT",
        headers: {
          "content-type": "application/json",
          "x-finora-admin-key": protectedKey,
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(
          FINORA_SERVER_REQUEST_TIMEOUT_MS,
        ),
        cache: "no-store",
      },
    );
  } catch {
    throw new Error(
      "Unable to reach the FINORA global pricing server.",
    );
  }

  await readFinoraServerGlobalPricingBody(response);

  return fetchFinoraServerGlobalPricing(protectedKey);
}
