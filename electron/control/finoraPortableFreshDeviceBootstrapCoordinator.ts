/*
============================================================
FINORA ENTERPRISE
FRESH-DEVICE PASSWORD-FIRST BOOTSTRAP COORDINATOR
============================================================

PURPOSE

This authority performs only fresh-device portable verification.

It does NOT:
- write the Control Store,
- authorize Device Trust,
- issue a login session,
- accept renderer-controlled branch scope,
- accept renderer-controlled filesystem roots.

ORDERING

1. Read Portable Auth from the selected provisioned storage mode.
2. Verify Password first.
3. Only after valid Password may Security Code be requested.
4. Decrypt Portable Auth with Password + Security Code.
5. Verify the Branch-Certification signed runtime authority.
6. Verify exact Portable Auth fingerprint + branch/user/generation scope.
7. Enforce access validity without extending signed validity.
8. Produce a narrow main-process hydration plan.

Password and Security Code are never returned in the plan.
============================================================
*/

export type FinoraFreshDeviceBootstrapStorageMode =
  | "LOCAL"
  | "USB";

export type FinoraFreshDeviceBootstrapDataContext =
  | "REAL"
  | "DEMO";

export type FinoraFreshDeviceBootstrapAccessMode =
  | "ACTIVE"
  | "REGISTERED_EXPIRED_READ_ONLY";

export type FinoraFreshDeviceBootstrapAccessType =
  | "REGISTERED"
  | "DEMO";

export interface FinoraFreshDeviceBootstrapRequest {
  username:
    string;

  password:
    string;

  storageMode:
    FinoraFreshDeviceBootstrapStorageMode;

  securityCode?:
    string;
}

export interface FinoraFreshDevicePortablePayloadView {
  sourceAuthorizationId:
    string;

  sourceAuthorizationVerificationEvidence:
    unknown;

  branchCertificationPublicAuthority:
    unknown;

  ownerId:
    string;

  businessId:
    string;

  branchId:
    string;

  userId:
    string;

  username:
    string;

  canonicalUsername:
    string;

  fullName:
    string;

  role:
    string;

  dataContext:
    FinoraFreshDeviceBootstrapDataContext;

  demoId?:
    string;

  storageMode:
    FinoraFreshDeviceBootstrapStorageMode;

  passwordVerifier:
    unknown;

  securityVerifier:
    unknown;

  authGeneration:
    number;

  createdAt:
    string;

  updatedAt:
    string;
}

export interface FinoraFreshDeviceRegistrationPayment {
  amount:
    number;

  currency:
    "INR";

  paymentMode:
    "CASH" | "UPI" | "BANK_TRANSFER" | "OTHER";

  paidAt:
    string;

  reference?:
    string;

  remarks?:
    string;

  refundable:
    false;
}

export interface FinoraFreshDeviceRuntimeAuthorityView {
  authorityId:
    string;

  sourceAuthorizationId:
    string;

  credentialId:
    string;

  activationId:
    string;

  branchAccessGrantId:
    string;

  storageEntitlementId:
    string;

  ownerId:
    string;

  businessId:
    string;

  branchId:
    string;

  businessCode:
    string | null;

  branchCode:
    string | null;

  businessProfile?:
    import("./finoraControlStore.js").FinoraControlBusinessProfile;

  userId:
    string;

  username:
    string;

  canonicalUsername:
    string;

  fullName:
    string;

  role:
    string;

  storageMode:
    FinoraFreshDeviceBootstrapStorageMode;

  dataContext:
    FinoraFreshDeviceBootstrapDataContext;

  demoId?:
    string;

  authGeneration:
    number;

  activationStatus:
    "ACTIVE";

  activationActivatedAt?:
    string;

  activationCreatedAt:
    string;

  activationUpdatedAt:
    string;

  branchAccessType:
    FinoraFreshDeviceBootstrapAccessType;

  registrationPayment:
    FinoraFreshDeviceRegistrationPayment |
    null;

  registrationCycle:
    number |
    null;

  demoRemarks:
    string |
    null;

  accessMode:
    FinoraFreshDeviceBootstrapAccessMode;

  accessValidFrom:
    string;

  accessValidUntil:
    string;

  branchAccessCreatedAt:
    string;

  branchAccessUpdatedAt:
    string;

  storageEntitlementStatus:
    "ACTIVE";

  storageEntitlementActivatedAt:
    string;

  storageEntitlementCreatedAt:
    string;

  storageEntitlementUpdatedAt:
    string;

  portableAuthFingerprint:
    string;

  issuedAt:
    string;
}

export type FinoraFreshDevicePortableDecryptResult =
  | {
      success:
        true;

      payload:
        FinoraFreshDevicePortablePayloadView;
    }
  | {
      success:
        false;

      errorCode:
        | "SECURITY_CODE_INVALID"
        | "PORTABILITY_AUTH_VERIFICATION_FAILED";
    };

export interface FinoraFreshDeviceBootstrapHydrationPlan {
  authorityId:
    string;

  sourceAuthorizationId:
    string;

  sourceAuthorizationVerificationEvidence:
    unknown;

  credentialId:
    string;

  activationId:
    string;

  activationActivatedAt?:
    string;

  activationCreatedAt:
    string;

  activationUpdatedAt:
    string;

  branchAccessGrantId:
    string;

  storageEntitlementId:
    string;

  storageEntitlementActivatedAt:
    string;

  storageEntitlementCreatedAt:
    string;

  storageEntitlementUpdatedAt:
    string;

  ownerId:
    string;

  businessId:
    string;

  branchId:
    string;

  businessCode:
    string | null;

  branchCode:
    string | null;

  businessProfile?:
    import("./finoraControlStore.js").FinoraControlBusinessProfile;

  userId:
    string;

  username:
    string;

  canonicalUsername:
    string;

  fullName:
    string;

  role:
    string;

  storageMode:
    FinoraFreshDeviceBootstrapStorageMode;

  dataContext:
    FinoraFreshDeviceBootstrapDataContext;

  demoId?:
    string;

  passwordVerifier:
    unknown;

  securityVerifier:
    unknown;

  authGeneration:
    number;

  branchAccessType:
    FinoraFreshDeviceBootstrapAccessType;

  registrationPayment:
    FinoraFreshDeviceRegistrationPayment |
    null;

  registrationCycle:
    number |
    null;

  demoRemarks:
    string |
    null;

  accessMode:
    FinoraFreshDeviceBootstrapAccessMode;

  accessValidFrom:
    string;

  accessValidUntil:
    string;

  branchAccessCreatedAt:
    string;

  branchAccessUpdatedAt:
    string;

  portableAuthFingerprint:
    string;

  portableCredentialCreatedAt:
    string;

  portableCredentialUpdatedAt:
    string;

  runtimeAuthorityIssuedAt:
    string;
}

export type FinoraFreshDeviceBootstrapErrorCode =
  | "INVALID_REQUEST"
  | "INVALID_CREDENTIALS"
  | "SECURITY_CODE_REQUIRED"
  | "SECURITY_CODE_INVALID"
  | "PORTABILITY_AUTH_VERIFICATION_FAILED"
  | "RUNTIME_AUTHORITY_MISSING"
  | "RUNTIME_AUTHORITY_INVALID"
  | "RUNTIME_AUTHORITY_MISMATCH"
  | "BRANCH_ACCESS_DENIED"
  | "STORAGE_UNAVAILABLE";

export type FinoraFreshDeviceBootstrapResult =
  | {
      success:
        true;

      status:
        "READY_FOR_HYDRATION";

      plan:
        FinoraFreshDeviceBootstrapHydrationPlan;
    }
  | {
      success:
        false;

      errorCode:
        FinoraFreshDeviceBootstrapErrorCode;

      error:
        string;
    };

export interface FinoraFreshDeviceBootstrapDependencies {
  canonicalizeUsername(
    username:
      string,
  ):
    string;

  readPortableAuth(
    storageMode:
      FinoraFreshDeviceBootstrapStorageMode,
  ):
    Promise<
      unknown |
      null
    >;

  verifyPortablePassword(
    envelope:
      unknown,

    password:
      string,
  ):
    Promise<boolean>;

  decryptPortableAuth(
    envelope:
      unknown,

    password:
      string,

    securityCode:
      string,
  ):
    Promise<
      FinoraFreshDevicePortableDecryptResult
    >;

  createPortableAuthFingerprint(
    envelope:
      unknown,
  ):
    string;

  readRuntimeAuthority(
    storageMode:
      FinoraFreshDeviceBootstrapStorageMode,
  ):
    Promise<
      unknown |
      null
    >;

  verifyAndReadRuntimeAuthority(
    packageValue:
      unknown,

    branchCertificationPublicAuthority:
      unknown,
  ):
    FinoraFreshDeviceRuntimeAuthorityView |
    null;

  now():
    Date;
}

function failure(
  errorCode:
    FinoraFreshDeviceBootstrapErrorCode,

  error:
    string,
): FinoraFreshDeviceBootstrapResult {
  return {
    success:
      false,

    errorCode,

    error,
  };
}

function isNonEmptyString(
  value:
    unknown,
): value is string {
  return (
    typeof value ===
      "string" &&
    value.trim().length >
      0
  );
}

function isStorageMode(
  value:
    unknown,
): value is FinoraFreshDeviceBootstrapStorageMode {
  return (
    value ===
      "LOCAL" ||
    value ===
      "USB"
  );
}

function sanitizeRequest(
  input:
    unknown,
): FinoraFreshDeviceBootstrapRequest |
  null {
  if (
    !input ||
    typeof input !==
      "object"
  ) {
    return null;
  }

  const value =
    input as
      Record<
        string,
        unknown
      >;

  if (
    !isNonEmptyString(
      value.username,
    ) ||
    !isNonEmptyString(
      value.password,
    ) ||
    !isStorageMode(
      value.storageMode,
    )
  ) {
    return null;
  }

  if (
    value.securityCode !==
      undefined &&
    !isNonEmptyString(
      value.securityCode,
    )
  ) {
    return null;
  }

  return {
    username:
      value.username,

    password:
      value.password,

    storageMode:
      value.storageMode,

    ...(
      value.securityCode ===
        undefined
        ? {}
        : {
            securityCode:
              value.securityCode,
          }
    ),
  };
}

function datesAreValid(
  validFrom:
    string,

  validUntil:
    string,
): boolean {
  const from =
    Date.parse(
      validFrom,
    );

  const until =
    Date.parse(
      validUntil,
    );

  return (
    Number.isFinite(
      from,
    ) &&
    Number.isFinite(
      until,
    ) &&
    from <
      until
  );
}

function identitiesMatch(
  portable:
    FinoraFreshDevicePortablePayloadView,

  runtime:
    FinoraFreshDeviceRuntimeAuthorityView,
): boolean {
  return (
    (
      (
        runtime.businessCode === null &&
        runtime.branchCode === null
      ) ||
      (
        typeof runtime.businessCode ===
          "string" &&
        runtime.businessCode.trim().length >
          0 &&
        typeof runtime.branchCode ===
          "string" &&
        runtime.branchCode.trim().length >
          0
      )
    ) &&
    portable.sourceAuthorizationId ===
      runtime.sourceAuthorizationId &&
    portable.ownerId ===
      runtime.ownerId &&
    portable.businessId ===
      runtime.businessId &&
    portable.branchId ===
      runtime.branchId &&
    portable.userId ===
      runtime.userId &&
    portable.username ===
      runtime.username &&
    portable.canonicalUsername ===
      runtime.canonicalUsername &&
    portable.fullName ===
      runtime.fullName &&
    portable.role ===
      runtime.role &&
    portable.storageMode ===
      runtime.storageMode &&
    portable.dataContext ===
      runtime.dataContext &&
    portable.authGeneration ===
      runtime.authGeneration &&
    (
      portable.dataContext ===
        "REAL"
        ? (
            portable.demoId ===
              undefined &&
            runtime.demoId ===
              undefined &&
            runtime.branchAccessType ===
              "REGISTERED"
          )
        : (
            typeof portable.demoId ===
              "string" &&
            portable.demoId.length >
              0 &&
            portable.demoId ===
              runtime.demoId &&
            runtime.branchAccessType ===
              "DEMO"
          )
    )
  );
}

function resolveEffectiveAccessMode(
  runtime:
    FinoraFreshDeviceRuntimeAuthorityView,

  observedAt:
    Date,
):
  FinoraFreshDeviceBootstrapAccessMode |
  null {
  if (
    runtime.activationStatus !==
      "ACTIVE" ||
    runtime.storageEntitlementStatus !==
      "ACTIVE" ||
    !datesAreValid(
      runtime.accessValidFrom,
      runtime.accessValidUntil,
    )
  ) {
    return null;
  }

  const observedTime =
    observedAt.getTime();

  const validFromTime =
    Date.parse(
      runtime.accessValidFrom,
    );

  const validUntilTime =
    Date.parse(
      runtime.accessValidUntil,
    );

  if (
    !Number.isFinite(
      observedTime,
    ) ||
    observedTime <
      validFromTime
  ) {
    return null;
  }

  if (
    observedTime >=
      validUntilTime
  ) {
    return (
      runtime.branchAccessType ===
        "REGISTERED"
        ? "REGISTERED_EXPIRED_READ_ONLY"
        : null
    );
  }

  if (
    runtime.accessMode ===
      "REGISTERED_EXPIRED_READ_ONLY"
  ) {
    // Never elevate a signed stricter mode merely because
    // the local wall clock still falls inside validity.
    return "REGISTERED_EXPIRED_READ_ONLY";
  }

  return "ACTIVE";
}

export async function prepareFinoraFreshDeviceBootstrap(
  input:
    unknown,

  dependencies:
    FinoraFreshDeviceBootstrapDependencies,
): Promise<
  FinoraFreshDeviceBootstrapResult
> {
  const request =
    sanitizeRequest(
      input,
    );

  if (!request) {
    return failure(
      "INVALID_REQUEST",
      "A valid FINORA fresh-device bootstrap request is required.",
    );
  }

  const canonicalUsername =
    dependencies
      .canonicalizeUsername(
        request.username,
      );

  let envelope:
    unknown |
    null;

  try {
    envelope =
      await dependencies
        .readPortableAuth(
          request.storageMode,
        );
  }
  catch {
    return failure(
      "STORAGE_UNAVAILABLE",
      "FINORA portable branch authentication storage is unavailable.",
    );
  }

  if (
    envelope ===
      null
  ) {
    // Do not reveal whether a username or Portable Auth artifact exists.
    return failure(
      "INVALID_CREDENTIALS",
      "Invalid username or password.",
    );
  }

  let passwordValid:
    boolean;

  try {
    passwordValid =
      await dependencies
        .verifyPortablePassword(
          envelope,
          request.password,
        );
  }
  catch {
    return failure(
      "PORTABILITY_AUTH_VERIFICATION_FAILED",
      "FINORA portable branch authentication verification failed.",
    );
  }

  if (!passwordValid) {
    return failure(
      "INVALID_CREDENTIALS",
      "Invalid username or password.",
    );
  }

  if (
    request.securityCode ===
      undefined
  ) {
    return failure(
      "SECURITY_CODE_REQUIRED",
      "Security Code is required to authorize this device.",
    );
  }

  let decrypted:
    FinoraFreshDevicePortableDecryptResult;

  try {
    decrypted =
      await dependencies
        .decryptPortableAuth(
          envelope,
          request.password,
          request.securityCode,
        );
  }
  catch {
    return failure(
      "PORTABILITY_AUTH_VERIFICATION_FAILED",
      "FINORA portable branch authentication verification failed.",
    );
  }

  if (!decrypted.success) {
    return failure(
      decrypted.errorCode,
      decrypted.errorCode ===
        "SECURITY_CODE_INVALID"
        ? "Invalid Security Code."
        : "FINORA portable branch authentication verification failed.",
    );
  }

  const portable =
    decrypted.payload;

  if (
    portable.canonicalUsername !==
      canonicalUsername ||
    portable.storageMode !==
      request.storageMode ||
    portable.username.trim().length ===
      0 ||
    portable.authGeneration <=
      0 ||
    !Number.isSafeInteger(
      portable.authGeneration,
    ) ||
    portable.branchCertificationPublicAuthority ===
      undefined ||
    portable.branchCertificationPublicAuthority ===
      null
  ) {
    return failure(
      "PORTABILITY_AUTH_VERIFICATION_FAILED",
      "FINORA portable branch authentication scope is invalid.",
    );
  }

  let portableAuthFingerprint:
    string;

  try {
    portableAuthFingerprint =
      dependencies
        .createPortableAuthFingerprint(
          envelope,
        );
  }
  catch {
    return failure(
      "PORTABILITY_AUTH_VERIFICATION_FAILED",
      "FINORA portable branch authentication fingerprint verification failed.",
    );
  }

  let runtimePackage:
    unknown |
    null;

  try {
    runtimePackage =
      await dependencies
        .readRuntimeAuthority(
          request.storageMode,
        );
  }
  catch {
    return failure(
      "STORAGE_UNAVAILABLE",
      "FINORA portable runtime-authority storage is unavailable.",
    );
  }

  if (
    runtimePackage ===
      null
  ) {
    return failure(
      "RUNTIME_AUTHORITY_MISSING",
      "FINORA fresh-device runtime authority is unavailable.",
    );
  }

  const runtime =
    dependencies
      .verifyAndReadRuntimeAuthority(
        runtimePackage,
        portable.branchCertificationPublicAuthority,
      );

  if (!runtime) {
    return failure(
      "RUNTIME_AUTHORITY_INVALID",
      "FINORA fresh-device runtime authority could not be verified.",
    );
  }

  if (
    runtime.portableAuthFingerprint !==
      portableAuthFingerprint ||
    !identitiesMatch(
      portable,
      runtime,
    )
  ) {
    return failure(
      "RUNTIME_AUTHORITY_MISMATCH",
      "FINORA fresh-device runtime authority does not match Portable Branch Auth.",
    );
  }

  const effectiveAccessMode =
    resolveEffectiveAccessMode(
      runtime,
      dependencies.now(),
    );

  if (!effectiveAccessMode) {
    return failure(
      "BRANCH_ACCESS_DENIED",
      "FINORA Branch Access is not currently available for this fresh device.",
    );
  }

  const plan:
    FinoraFreshDeviceBootstrapHydrationPlan = {
      authorityId:
        runtime.authorityId,

      sourceAuthorizationId:
        portable.sourceAuthorizationId,

      sourceAuthorizationVerificationEvidence:
        portable.sourceAuthorizationVerificationEvidence,

      credentialId:
        runtime.credentialId,

      activationId:
        runtime.activationId,

      ...(
        runtime.activationActivatedAt ===
          undefined
          ? {}
          : {
              activationActivatedAt:
                runtime.activationActivatedAt,
            }
      ),

      activationCreatedAt:
        runtime.activationCreatedAt,

      activationUpdatedAt:
        runtime.activationUpdatedAt,

      branchAccessGrantId:
        runtime.branchAccessGrantId,

      storageEntitlementId:
        runtime.storageEntitlementId,

      storageEntitlementActivatedAt:
        runtime.storageEntitlementActivatedAt,

      storageEntitlementCreatedAt:
        runtime.storageEntitlementCreatedAt,

      storageEntitlementUpdatedAt:
        runtime.storageEntitlementUpdatedAt,

      ownerId:
        portable.ownerId,

      businessId:
        portable.businessId,

      branchId:
        portable.branchId,

      businessCode:
        runtime.businessCode,

      branchCode:
        runtime.branchCode,

      ...(
        runtime.businessProfile !== undefined
          ? {
              businessProfile:
                runtime.businessProfile,
            }
          : {}
      ),

      userId:
        portable.userId,

      username:
        portable.username,

      canonicalUsername:
        portable.canonicalUsername,

      fullName:
        portable.fullName,

      role:
        portable.role,

      storageMode:
        portable.storageMode,

      dataContext:
        portable.dataContext,

      ...(
        portable.demoId ===
          undefined
          ? {}
          : {
              demoId:
                portable.demoId,
            }
      ),

      passwordVerifier:
        portable.passwordVerifier,

      securityVerifier:
        portable.securityVerifier,

      authGeneration:
        portable.authGeneration,

      branchAccessType:
        runtime.branchAccessType,

      registrationPayment:
        runtime.registrationPayment,

      registrationCycle:
        runtime.registrationCycle,

      demoRemarks:
        runtime.demoRemarks,

      accessMode:
        effectiveAccessMode,

      accessValidFrom:
        runtime.accessValidFrom,

      accessValidUntil:
        runtime.accessValidUntil,

      branchAccessCreatedAt:
        runtime.branchAccessCreatedAt,

      branchAccessUpdatedAt:
        runtime.branchAccessUpdatedAt,

      portableAuthFingerprint,

      portableCredentialCreatedAt:
        portable.createdAt,

      portableCredentialUpdatedAt:
        portable.updatedAt,

      runtimeAuthorityIssuedAt:
        runtime.issuedAt,
    };

  return {
    success:
      true,

    status:
      "READY_FOR_HYDRATION",

    plan,
  };
}