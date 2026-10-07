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
