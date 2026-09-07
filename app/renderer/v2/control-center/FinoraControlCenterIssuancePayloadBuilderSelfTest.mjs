/* ===========================================================
   FINORA ENTERPRISE OS™

   CONTROL CENTER
   ISSUANCE PAYLOAD BUILDER SELF TEST

   PURPOSE:

   - Exercise the real renderer issuance payload builder
   - Verify REGISTERED / DEMO payload separation
   - Verify Storage Entitlement payload construction
   - Verify Business Profile payload construction
   - Verify target / native-binding normalization
   - Verify renderer does not create package envelope authority

   RUNTIME:

   - Pure Node self-test.
   - No Electron.
   - No private signing key.
   - No Control Center key vault.
=========================================================== */

import {
  buildFinoraBranchActivationIssuanceRequest,
  buildFinoraBusinessProfileIssuanceRequest,
  buildFinoraPricingPolicyIssuanceRequest,
  buildFinoraStorageEntitlementIssuanceRequest,
  buildFinoraWalletRechargeIssuanceRequest,
} from "./FinoraControlCenterIssuancePayloadBuilder.ts";

// ============================================================
// FIXED TEST IDENTITY
// ============================================================

const OWNER_ID =
  "OWNER-BUILDER-SELFTEST";

const BUSINESS_ID =
  "BUSINESS-BUILDER-SELFTEST";

const BRANCH_ID =
  "BRANCH-BUILDER-SELFTEST";

const INSTALLATION_ID =
  "INSTALLATION-BUILDER-SELFTEST";

const FINGERPRINT =
  "0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF";

const NORMALIZED_FINGERPRINT =
  FINGERPRINT.toLowerCase();

const BINDING_KEY_ID =
  "FINORA-BINDING-0123456789ABCDEF0123456789ABCDEF";

const TARGET = {
  ownerId:
    OWNER_ID,

  businessId:
    BUSINESS_ID,

  branchId:
    BRANCH_ID,

  installationId:
    INSTALLATION_ID,

  bindingKeyId:
    BINDING_KEY_ID,

  fingerprintAlgorithm:
    "SHA-256",

  publicKeyFingerprint:
    FINGERPRINT,
};

const VALID_FROM =
  "2026-01-01T00:00:00.000Z";

const VALID_UNTIL =
  "2027-01-01T00:00:00.000Z";

// ============================================================
// ASSERT
// ============================================================

function assert(
  condition,
  message,
) {

  if (!condition) {
    throw new Error(
      message,
    );
  }
}

function hasOwn(
  value,
  key,
) {

  return Object.prototype.hasOwnProperty.call(
    value,
    key,
  );
}

function assertNoEnvelopeAuthority(
  request,
  label,
) {

  assert(
    !hasOwn(
      request,
      "packageId",
    ),
    `${label}: renderer created packageId authority.`,
  );

  assert(
    !hasOwn(
      request,
      "sequence",
    ),
    `${label}: renderer created sequence authority.`,
  );

  assert(
    !hasOwn(
      request,
      "issuedAt",
    ),
    `${label}: renderer created root issuedAt authority.`,
  );

  assert(
    !hasOwn(
      request,
      "packageValidity",
    ),
    `${label}: builder unexpectedly created packageValidity.`,
  );

  assert(
    !hasOwn(
      request.payload,
      "issuedAt",
    ),
    `${label}: payload builder created root issuedAt authority.`,
  );
}

function assertTarget(
  target,
  label,
) {

  assert(
    target.ownerId ===
      OWNER_ID,
    `${label}: Owner ID changed.`,
  );

  assert(
    target.businessId ===
      BUSINESS_ID,
    `${label}: Business ID changed.`,
  );

  assert(
    target.branchId ===
      BRANCH_ID,
    `${label}: Branch ID changed.`,
  );

  assert(
    target.installationId ===
      INSTALLATION_ID,
    `${label}: Installation ID changed.`,
  );

  assert(
    target.bindingKeyId ===
      BINDING_KEY_ID,
    `${label}: Binding Key ID changed.`,
  );

  assert(
    target.fingerprintAlgorithm ===
      "SHA-256",
    `${label}: fingerprint algorithm changed.`,
  );

  assert(
    target.publicKeyFingerprint ===
      NORMALIZED_FINGERPRINT,
    `${label}: fingerprint was not normalized to lowercase.`,
  );
}

function expectThrow(
  operation,
  expectedText,
  label,
) {

  let rejected =
    false;

  try {
    operation();
  } catch (
    error
  ) {
    rejected =
      error instanceof Error &&
      error.message.includes(
        expectedText,
      );
  }

  assert(
    rejected,
    `${label}: expected rejection was not produced.`,
  );
}

// ============================================================
// REGISTERED BRANCH ACTIVATION
// ============================================================

const registeredRequest =
  buildFinoraBranchActivationIssuanceRequest({
    target:
      TARGET,

    action:
      "ISSUE",

    activationId:
      "ACTIVATION-BUILDER-REGISTERED",

    activationActivatedAt:
      VALID_FROM,

    activationCreatedAt:
      VALID_FROM,

    activationUpdatedAt:
      VALID_FROM,

    grantId:
      "GRANT-BUILDER-REGISTERED",

    userId:
      "USER-BUILDER-REGISTERED",

    storageMode:
      "LOCAL",

    // ISSUE must derive ACTIVE regardless of this draft value.
    administrativeStatus:
      "SUSPENDED",

    accessType:
      "REGISTERED",

    validFrom:
      VALID_FROM,

    validUntil:
      VALID_UNTIL,

    grantCreatedAt:
      VALID_FROM,

    grantUpdatedAt:
      VALID_FROM,

    registrationCycle:
      "1",

    registrationPaymentMode:
      "UPI",

    registrationPaidAt:
      VALID_FROM,

    registrationPaymentReference:
      "  PAYMENT-REF-1  ",

    registrationPaymentRemarks:
      "  Annual registration  ",

    demoId:
      "SHOULD-NOT-APPEAR",

    demoRemarks:
      "SHOULD-NOT-APPEAR",
  });

assertNoEnvelopeAuthority(
  registeredRequest,
  "REGISTERED",
);

assertTarget(
  registeredRequest.target,
  "REGISTERED",
);

const registeredPayload =
  registeredRequest.payload;

const registeredActivation =
  registeredPayload.activation;

const registeredGrant =
  registeredPayload.accessGrant;

assert(
  registeredPayload.action ===
    "ISSUE",
  "REGISTERED: action changed.",
);

assert(
  registeredActivation.status ===
    "ACTIVE",
  "REGISTERED: activation status is not ACTIVE.",
);

assert(
  registeredActivation.ownerId ===
    OWNER_ID &&
  registeredActivation.businessId ===
    BUSINESS_ID &&
  registeredActivation.branchId ===
    BRANCH_ID,
  "REGISTERED: activation target identity was not derived.",
);

assert(
  registeredGrant.accessType ===
    "REGISTERED",
  "REGISTERED: access type changed.",
);

assert(
  registeredGrant.administrativeStatus ===
    "ACTIVE",
  "REGISTERED: ISSUE did not derive ACTIVE administrative status.",
);

assert(
  registeredGrant.storageMode ===
    "LOCAL",
  "REGISTERED: storage mode changed.",
);

assert(
  registeredGrant.registrationCycle ===
    1,
  "REGISTERED: registration cycle was not converted to a number.",
);

assert(
  registeredGrant.registrationPayment.amount ===
    2000 &&
  registeredGrant.registrationPayment.currency ===
    "INR" &&
  registeredGrant.registrationPayment.refundable ===
    false,
  "REGISTERED: fixed commercial payment policy changed.",
);

assert(
  registeredGrant.registrationPayment.paymentMode ===
    "UPI",
  "REGISTERED: payment mode changed.",
);

assert(
  registeredGrant.registrationPayment.reference ===
    "PAYMENT-REF-1",
  "REGISTERED: payment reference was not normalized.",
);

assert(
  registeredGrant.registrationPayment.remarks ===
    "Annual registration",
  "REGISTERED: payment remarks were not normalized.",
);

assert(
  !hasOwn(
    registeredGrant,
    "demoId",
  ) &&
  !hasOwn(
    registeredGrant,
    "demoRemarks",
  ),
  "REGISTERED: Demo-only fields leaked into the payload.",
);

console.log(
  "PASS: REGISTERED Branch Activation payload contract",
);

// ============================================================
// DEMO BRANCH ACTIVATION
// ============================================================

const demoRequest =
  buildFinoraBranchActivationIssuanceRequest({
    target:
      TARGET,

    action:
      "SUSPEND",

    activationId:
      "ACTIVATION-BUILDER-DEMO",

    activationActivatedAt:
      VALID_FROM,

    activationCreatedAt:
      VALID_FROM,

    activationUpdatedAt:
      VALID_FROM,

    grantId:
      "GRANT-BUILDER-DEMO",

    userId:
      "USER-BUILDER-DEMO",

    storageMode:
      "USB",

    administrativeStatus:
      "ACTIVE",

    accessType:
      "DEMO",

    validFrom:
      "2026-01-01T05:30:00+05:30",

    validUntil:
      "2026-02-01T05:30:00+05:30",

    grantCreatedAt:
      VALID_FROM,

    grantUpdatedAt:
      VALID_FROM,

    // These REGISTERED-only draft values must be ignored.
    registrationCycle:
      "99",

    registrationPaymentMode:
      "CASH",

    registrationPaidAt:
      VALID_FROM,

    registrationPaymentReference:
      "SHOULD-NOT-APPEAR",

    registrationPaymentRemarks:
      "SHOULD-NOT-APPEAR",

    demoId:
      "DEMO-BUILDER-1",

    demoRemarks:
      "  Trial branch  ",
  });

assertNoEnvelopeAuthority(
  demoRequest,
  "DEMO",
);

assertTarget(
  demoRequest.target,
  "DEMO",
);

const demoGrant =
  demoRequest.payload.accessGrant;

assert(
  demoGrant.accessType ===
    "DEMO",
  "DEMO: access type changed.",
);

assert(
  demoGrant.administrativeStatus ===
    "SUSPENDED",
  "DEMO: SUSPEND did not derive SUSPENDED administrative status.",
);

assert(
  demoGrant.storageMode ===
    "USB",
  "DEMO: storage mode changed.",
);

assert(
  demoGrant.demoId ===
    "DEMO-BUILDER-1",
  "DEMO: Demo ID changed.",
);

assert(
  demoGrant.demoRemarks ===
    "Trial branch",
  "DEMO: Demo remarks were not normalized.",
);

assert(
  !hasOwn(
    demoGrant,
    "registrationPayment",
  ) &&
  !hasOwn(
    demoGrant,
    "registrationCycle",
  ),
  "DEMO: REGISTERED-only fields leaked into the payload.",
);

console.log(
  "PASS: DEMO Branch Activation payload contract",
);

// ============================================================
// DEMO RENEW REJECTION
// ============================================================

expectThrow(
  () =>
    buildFinoraBranchActivationIssuanceRequest({
      target:
        TARGET,

      action:
        "RENEW",

      activationId:
        "ACTIVATION-DEMO-RENEW",

      activationActivatedAt:
        VALID_FROM,

      activationCreatedAt:
        VALID_FROM,

      activationUpdatedAt:
        VALID_FROM,

      grantId:
        "GRANT-DEMO-RENEW",

      userId:
        "USER-DEMO-RENEW",

      storageMode:
        "LOCAL",

      administrativeStatus:
        "ACTIVE",

      accessType:
        "DEMO",

      validFrom:
        VALID_FROM,

      validUntil:
        VALID_UNTIL,

      grantCreatedAt:
        VALID_FROM,

      grantUpdatedAt:
        VALID_FROM,

      registrationCycle:
        "1",

      registrationPaymentMode:
        "CASH",

      registrationPaidAt:
        VALID_FROM,

      registrationPaymentReference:
        "",

      registrationPaymentRemarks:
        "",

      demoId:
        "DEMO-RENEW",

      demoRemarks:
        "",
    }),

  "DEMO access cannot use the RENEW action.",
  "DEMO RENEW",
);

console.log(
  "PASS: DEMO RENEW rejected by renderer builder",
);

// ============================================================
// REGISTERED VALIDITY REJECTION
// ============================================================

expectThrow(
  () =>
    buildFinoraBranchActivationIssuanceRequest({
      target:
        TARGET,

      action:
        "ISSUE",

      activationId:
        "ACTIVATION-BAD-DURATION",

      activationActivatedAt:
        VALID_FROM,

      activationCreatedAt:
        VALID_FROM,

      activationUpdatedAt:
        VALID_FROM,

      grantId:
        "GRANT-BAD-DURATION",

      userId:
        "USER-BAD-DURATION",

      storageMode:
        "LOCAL",

      administrativeStatus:
        "ACTIVE",

      accessType:
        "REGISTERED",

      validFrom:
        VALID_FROM,

      validUntil:
        "2026-12-31T00:00:00.000Z",

      grantCreatedAt:
        VALID_FROM,

      grantUpdatedAt:
        VALID_FROM,

      registrationCycle:
        "1",

      registrationPaymentMode:
        "CASH",

      registrationPaidAt:
        VALID_FROM,

      registrationPaymentReference:
        "",

      registrationPaymentRemarks:
        "",

      demoId:
        "",

      demoRemarks:
        "",
    }),

  "REGISTERED access must contain exactly 365 days of validity.",
  "REGISTERED duration",
);

console.log(
  "PASS: invalid REGISTERED validity rejected by renderer builder",
);

// ============================================================
// STORAGE ENTITLEMENT
// ============================================================

const storageRequest =
  buildFinoraStorageEntitlementIssuanceRequest({
    target:
      TARGET,

    entitlementId:
      "ENTITLEMENT-BUILDER-1",

    userId:
      "USER-BUILDER-STORAGE",

    storageMode:
      "USB",

    status:
      "ACTIVE",

    activatedAt:
      "2026-01-02T05:30:00+05:30",

    createdAt:
      "2026-01-01T05:30:00+05:30",

    updatedAt:
      "2026-01-03T05:30:00+05:30",
  });

assertNoEnvelopeAuthority(
  storageRequest,
  "STORAGE",
);

assertTarget(
  storageRequest.target,
  "STORAGE",
);

const entitlement =
  storageRequest.payload.entitlement;

assert(
  entitlement.ownerId ===
    OWNER_ID &&
  entitlement.businessId ===
    BUSINESS_ID &&
  entitlement.branchId ===
    BRANCH_ID,
  "STORAGE: target identity was not derived.",
);

assert(
  entitlement.installationId ===
    INSTALLATION_ID &&
  entitlement.bindingKeyId ===
    BINDING_KEY_ID &&
  entitlement.publicKeyFingerprint ===
    NORMALIZED_FINGERPRINT,
  "STORAGE: native installation binding was not derived.",
);

assert(
  entitlement.createdAt ===
    "2026-01-01T00:00:00.000Z" &&
  entitlement.activatedAt ===
    "2026-01-02T00:00:00.000Z" &&
  entitlement.updatedAt ===
    "2026-01-03T00:00:00.000Z",
  "STORAGE: timestamps were not canonicalized.",
);

assert(
  entitlement.schemaVersion ===
    1 &&
  storageRequest.payload.schemaVersion ===
    1,
  "STORAGE: schema version changed.",
);

console.log(
  "PASS: Storage Entitlement payload contract",
);

// ============================================================
// BUSINESS PROFILE
// ============================================================

const profileRequest =
  buildFinoraBusinessProfileIssuanceRequest({
    target:
      TARGET,

    action:
      "ISSUE",

    profileId:
      "PROFILE-BUILDER-1",

    businessCode:
      "  FINORA-BUSINESS-01  ",

    branchCode:
      "  FINORA-BRANCH-01  ",

    businessName:
      "  FINORA Finance  ",

    branchName:
      "  Main Branch  ",

    createdAt:
      "2026-01-01T05:30:00+05:30",

    updatedAt:
      "2026-01-02T05:30:00+05:30",
  });

assertNoEnvelopeAuthority(
  profileRequest,
  "BUSINESS_PROFILE",
);

assertTarget(
  profileRequest.target,
  "BUSINESS_PROFILE",
);

const profile =
  profileRequest.payload.profile;

const profileBinding =
  profileRequest.payload.installationBinding;

assert(
  profile.ownerId ===
    OWNER_ID &&
  profile.businessId ===
    BUSINESS_ID &&
  profile.branchId ===
    BRANCH_ID,
  "BUSINESS_PROFILE: target identity was not derived.",
);

assert(
  profile.businessCode ===
    "FINORA-BUSINESS-01" &&
  profile.branchCode ===
    "FINORA-BRANCH-01" &&
  profile.businessName ===
    "FINORA Finance" &&
  profile.branchName ===
    "Main Branch",
  "BUSINESS_PROFILE: display identity was not normalized.",
);

assert(
  profile.createdAt ===
    "2026-01-01T00:00:00.000Z" &&
  profile.updatedAt ===
    "2026-01-02T00:00:00.000Z",
  "BUSINESS_PROFILE: timestamps were not canonicalized.",
);

assert(
  profileBinding.installationId ===
    INSTALLATION_ID &&
  profileBinding.bindingKeyId ===
    BINDING_KEY_ID &&
  profileBinding.fingerprintAlgorithm ===
    "SHA-256" &&
  profileBinding.publicKeyFingerprint ===
    NORMALIZED_FINGERPRINT &&
  profileBinding.schemaVersion ===
    1,
  "BUSINESS_PROFILE: installation binding was not derived.",
);

assert(
  profileRequest.payload.action ===
    "ISSUE" &&
  profile.schemaVersion ===
    1 &&
  profileRequest.payload.schemaVersion ===
    1,
  "BUSINESS_PROFILE: action/schema contract changed.",
);

console.log(
  "PASS: Business Profile payload contract",
);

// ============================================================
// PRICING POLICY
// ============================================================

const pricingRequest =
  buildFinoraPricingPolicyIssuanceRequest({
    target:
      TARGET,

    overrideSetId:
      "PRICING-OVERRIDE-SET-1",

    overrides: [
      {
        overrideId:
          "PRICING-OVERRIDE-1",

        amount:
          "7.25",

        validFrom:
          "2026-02-01T05:30:00+05:30",

        validUntil:
          "2026-03-01T05:30:00+05:30",
      },
    ],
  });

assertNoEnvelopeAuthority(
  pricingRequest,
  "PRICING_POLICY",
);

assertTarget(
  pricingRequest.target,
  "PRICING_POLICY",
);

assert(
  pricingRequest.payload.action ===
    "REPLACE",
  "PRICING_POLICY: action changed.",
);

assert(
  pricingRequest.payload.schemaVersion ===
    1,
  "PRICING_POLICY: payload schema changed.",
);

const pricingOverrideSet =
  pricingRequest.payload.overrideSet;

assert(
  pricingOverrideSet.overrideSetId ===
    "PRICING-OVERRIDE-SET-1",
  "PRICING_POLICY: Override Set ID changed.",
);

assert(
  pricingOverrideSet.scope.ownerId ===
    OWNER_ID &&
  pricingOverrideSet.scope.businessId ===
    BUSINESS_ID &&
  pricingOverrideSet.scope.branchId ===
    BRANCH_ID,
  "PRICING_POLICY: scope changed.",
);

assert(
  pricingOverrideSet.schemaVersion ===
    1,
  "PRICING_POLICY: Override Set schema changed.",
);

assert(
  pricingOverrideSet.overrides.length ===
    1,
  "PRICING_POLICY: expected one override.",
);

const pricingRule =
  pricingOverrideSet.overrides[0];

assert(
  pricingRule.overrideId ===
    "PRICING-OVERRIDE-1" &&
  pricingRule.chargeCode ===
    "LOAN_DISBURSEMENT" &&
  pricingRule.model ===
    "FIXED_PRICE_OVERRIDE" &&
  pricingRule.amount ===
    7.25 &&
  pricingRule.currency ===
    "INR" &&
  pricingRule.schemaVersion ===
    1,
  "PRICING_POLICY: override rule contract changed.",
);

assert(
  pricingRule.validity.validFrom ===
    "2026-02-01T00:00:00.000Z" &&
  pricingRule.validity.validUntil ===
    "2026-03-01T00:00:00.000Z",
  "PRICING_POLICY: override validity was not canonicalized.",
);

assert(
  !hasOwn(
    pricingRule,
    "validFrom",
  ) &&
  !hasOwn(
    pricingRule,
    "validUntil",
  ),
  "PRICING_POLICY: flat validity fields leaked into the signed rule.",
);

assert(
  pricingRequest.payload.installationBinding.installationId ===
    INSTALLATION_ID &&
  pricingRequest.payload.installationBinding.bindingKeyId ===
    BINDING_KEY_ID &&
  pricingRequest.payload.installationBinding.fingerprintAlgorithm ===
    "SHA-256" &&
  pricingRequest.payload.installationBinding.publicKeyFingerprint ===
    NORMALIZED_FINGERPRINT &&
  pricingRequest.payload.installationBinding.schemaVersion ===
    1,
  "PRICING_POLICY: installation binding changed.",
);

console.log(
  "PASS: Pricing Policy payload contract + decimal amount + canonical validity",
);

// ============================================================
// PRICING POLICY EMPTY OVERRIDES
// ============================================================

const emptyPricingRequest =
  buildFinoraPricingPolicyIssuanceRequest({
    target:
      TARGET,

    overrideSetId:
      "PRICING-OVERRIDE-SET-EMPTY",

    overrides:
      [],
  });

assertNoEnvelopeAuthority(
  emptyPricingRequest,
  "PRICING_POLICY EMPTY",
);

assert(
  emptyPricingRequest.payload.overrideSet.overrides.length ===
    0,
  "PRICING_POLICY EMPTY: empty override set was not preserved.",
);

console.log(
  "PASS: Pricing Policy empty overrides accepted",
);

// ============================================================
// PRICING POLICY TOUCHING WINDOWS
// ============================================================

const touchingPricingRequest =
  buildFinoraPricingPolicyIssuanceRequest({
    target:
      TARGET,

    overrideSetId:
      "PRICING-OVERRIDE-SET-TOUCHING",

    overrides: [
      {
        overrideId:
          "PRICING-TOUCHING-1",

        amount:
          "5",

        validFrom:
          "2026-04-01T00:00:00.000Z",

        validUntil:
          "2026-04-15T00:00:00.000Z",
      },
      {
        overrideId:
          "PRICING-TOUCHING-2",

        amount:
          "6",

        validFrom:
          "2026-04-15T00:00:00.000Z",

        validUntil:
          "2026-05-01T00:00:00.000Z",
      },
    ],
  });

assert(
  touchingPricingRequest.payload.overrideSet.overrides.length ===
    2,
  "PRICING_POLICY TOUCHING: touching validity windows were rejected.",
);

console.log(
  "PASS: Pricing Policy touching validity boundaries accepted",
);

// ============================================================
// PRICING POLICY DUPLICATE OVERRIDE ID REJECTION
// ============================================================

expectThrow(
  () =>
    buildFinoraPricingPolicyIssuanceRequest({
      target:
        TARGET,

      overrideSetId:
        "PRICING-OVERRIDE-SET-DUPLICATE",

      overrides: [
        {
          overrideId:
            "PRICING-DUPLICATE",

          amount:
            "5",

          validFrom:
            "2026-06-01T00:00:00.000Z",

          validUntil:
            "2026-06-10T00:00:00.000Z",
        },
        {
          overrideId:
            "PRICING-DUPLICATE",

          amount:
            "6",

          validFrom:
            "2026-06-10T00:00:00.000Z",

          validUntil:
            "2026-06-20T00:00:00.000Z",
        },
      ],
    }),

  "Duplicate Pricing Override ID: PRICING-DUPLICATE.",
  "Pricing duplicate Override ID",
);

console.log(
  "PASS: duplicate Pricing Override ID rejected",
);

// ============================================================
// PRICING POLICY OVERLAP REJECTION
// ============================================================

expectThrow(
  () =>
    buildFinoraPricingPolicyIssuanceRequest({
      target:
        TARGET,

      overrideSetId:
        "PRICING-OVERRIDE-SET-OVERLAP",

      overrides: [
        {
          overrideId:
            "PRICING-OVERLAP-1",

          amount:
            "5",

          validFrom:
            "2026-07-01T00:00:00.000Z",

          validUntil:
            "2026-07-20T00:00:00.000Z",
        },
        {
          overrideId:
            "PRICING-OVERLAP-2",

          amount:
            "6",

          validFrom:
            "2026-07-15T00:00:00.000Z",

          validUntil:
            "2026-07-25T00:00:00.000Z",
        },
      ],
    }),

  "Pricing Override validity windows must not overlap.",
  "Pricing overlap",
);

console.log(
  "PASS: overlapping Pricing validity windows rejected",
);

// ============================================================
// PRICING POLICY NON-POSITIVE AMOUNT REJECTION
// ============================================================

expectThrow(
  () =>
    buildFinoraPricingPolicyIssuanceRequest({
      target:
        TARGET,

      overrideSetId:
        "PRICING-OVERRIDE-SET-ZERO",

      overrides: [
        {
          overrideId:
            "PRICING-ZERO-AMOUNT",

          amount:
            "0",

          validFrom:
            "2026-08-01T00:00:00.000Z",

          validUntil:
            "2026-08-10T00:00:00.000Z",
        },
      ],
    }),

  "Override 1 Amount must be a positive finite number.",
  "Pricing zero amount",
);

console.log(
  "PASS: non-positive Pricing amount rejected",
);

// ============================================================
// PRICING POLICY BINDING REJECTION
// ============================================================

expectThrow(
  () =>
    buildFinoraPricingPolicyIssuanceRequest({
      target: {
        ...TARGET,

        bindingKeyId:
          "FINORA-BINDING-INVALID",
      },

      overrideSetId:
        "PRICING-OVERRIDE-SET-BAD-BINDING",

      overrides:
        [],
    }),

  "Binding Key ID does not match the native public-key fingerprint.",
  "Pricing binding identity",
);

console.log(
  "PASS: invalid Pricing native Binding Key ID rejected",
);

// ============================================================
// BINDING ID REJECTION
// ============================================================

expectThrow(
  () =>
    buildFinoraStorageEntitlementIssuanceRequest({
      target: {
        ...TARGET,

        bindingKeyId:
          "FINORA-BINDING-INVALID",
      },

      entitlementId:
        "ENTITLEMENT-BAD-BINDING",

      userId:
        "USER-BAD-BINDING",

      storageMode:
        "LOCAL",

      status:
        "ACTIVE",

      activatedAt:
        VALID_FROM,

      createdAt:
        VALID_FROM,

      updatedAt:
        VALID_FROM,
    }),

  "Binding Key ID does not match the native public-key fingerprint.",
  "Binding identity",
);

console.log(
  "PASS: invalid native Binding Key ID rejected",
);

// ============================================================
// WALLET RECHARGE EXACT AMOUNT CONVERSION
// ============================================================

function buildWalletRechargeRequestForAmount(
  amount,
) {

  return buildFinoraWalletRechargeIssuanceRequest({
    target:
      TARGET,

    paymentReference:
      "  WALLET-PAYMENT-REFERENCE-1  ",

    amount,

    paymentMethod:
      "UPI",

    paymentSource:
      "UPI",

    providerOrderId:
      "",

    providerTransactionId:
      "",
  });
}

const walletAmountCases = [
  {
    amount:
      "7",

    expectedAmountMinor:
      700,
  },
  {
    amount:
      "7.2",

    expectedAmountMinor:
      720,
  },
  {
    amount:
      "7.25",

    expectedAmountMinor:
      725,
  },
  {
    amount:
      "0.01",

    expectedAmountMinor:
      1,
  },
];

for (
  const walletAmountCase
  of walletAmountCases
) {

  const walletRequest =
    buildWalletRechargeRequestForAmount(
      walletAmountCase.amount,
    );

  assertNoEnvelopeAuthority(
    walletRequest,
    `WALLET_RECHARGE ${walletAmountCase.amount}`,
  );

  assertTarget(
    walletRequest.target,
    `WALLET_RECHARGE ${walletAmountCase.amount}`,
  );

  assert(
    walletRequest.payload.scope.ownerId ===
      OWNER_ID &&
    walletRequest.payload.scope.businessId ===
      BUSINESS_ID &&
    walletRequest.payload.scope.branchId ===
      BRANCH_ID,
    `WALLET_RECHARGE ${walletAmountCase.amount}: signed scope does not match target.`,
  );

  assert(
    walletRequest.payload.installationBinding.installationId ===
      INSTALLATION_ID &&
    walletRequest.payload.installationBinding.bindingKeyId ===
      BINDING_KEY_ID &&
    walletRequest.payload.installationBinding.fingerprintAlgorithm ===
      "SHA-256" &&
    walletRequest.payload.installationBinding.publicKeyFingerprint ===
      NORMALIZED_FINGERPRINT &&
    walletRequest.payload.installationBinding.schemaVersion ===
      1,
    `WALLET_RECHARGE ${walletAmountCase.amount}: installation binding does not match target.`,
  );

  assert(
    walletRequest.payload.paymentReference ===
      "WALLET-PAYMENT-REFERENCE-1",
    `WALLET_RECHARGE ${walletAmountCase.amount}: payment reference was not normalized.`,
  );

  assert(
    walletRequest.payload.amountMinor ===
      walletAmountCase.expectedAmountMinor,
    `WALLET_RECHARGE ${walletAmountCase.amount}: incorrect amountMinor.`,
  );

  assert(
    walletRequest.payload.currency ===
      "INR",
    `WALLET_RECHARGE ${walletAmountCase.amount}: currency changed.`,
  );

  assert(
    walletRequest.payload.paymentMethod ===
      "UPI",
    `WALLET_RECHARGE ${walletAmountCase.amount}: payment method changed.`,
  );

  assert(
    walletRequest.payload.paymentSource ===
      "UPI",
    `WALLET_RECHARGE ${walletAmountCase.amount}: payment source changed.`,
  );

  assert(
    walletRequest.payload.schemaVersion ===
      1,
    `WALLET_RECHARGE ${walletAmountCase.amount}: payload schemaVersion changed.`,
  );

  assert(
    !hasOwn(
      walletRequest.payload,
      "walletId",
    ),
    `WALLET_RECHARGE ${walletAmountCase.amount}: renderer signed walletId.`,
  );

  assert(
    !hasOwn(
      walletRequest.payload,
      "providerOrderId",
    ),
    `WALLET_RECHARGE ${walletAmountCase.amount}: blank providerOrderId was not omitted.`,
  );

  assert(
    !hasOwn(
      walletRequest.payload,
      "providerTransactionId",
    ),
    `WALLET_RECHARGE ${walletAmountCase.amount}: blank providerTransactionId was not omitted.`,
  );
}

console.log(
  "PASS: Wallet Recharge exact INR amount conversion + target/scope/binding contract",
);

// ============================================================
// WALLET RECHARGE PROVIDER EVIDENCE
// ============================================================

const walletProviderRequest =
  buildFinoraWalletRechargeIssuanceRequest({
    target:
      TARGET,

    paymentReference:
      "  WALLET-PAYMENT-REFERENCE-PROVIDER  ",

    amount:
      "1250.50",

    paymentMethod:
      "RAZORPAY",

    paymentSource:
      "RAZORPAY",

    providerOrderId:
      "  ORDER-WALLET-001  ",

    providerTransactionId:
      "  TXN-WALLET-001  ",
  });

assertNoEnvelopeAuthority(
  walletProviderRequest,
  "WALLET_RECHARGE PROVIDER",
);

assert(
  walletProviderRequest.payload.amountMinor ===
    125050,
  "WALLET_RECHARGE PROVIDER: incorrect amountMinor.",
);

assert(
  walletProviderRequest.payload.paymentReference ===
    "WALLET-PAYMENT-REFERENCE-PROVIDER",
  "WALLET_RECHARGE PROVIDER: payment reference was not normalized.",
);

assert(
  walletProviderRequest.payload.providerOrderId ===
    "ORDER-WALLET-001",
  "WALLET_RECHARGE PROVIDER: providerOrderId was not normalized.",
);

assert(
  walletProviderRequest.payload.providerTransactionId ===
    "TXN-WALLET-001",
  "WALLET_RECHARGE PROVIDER: providerTransactionId was not normalized.",
);

assert(
  walletProviderRequest.payload.paymentMethod ===
    "RAZORPAY" &&
  walletProviderRequest.payload.paymentSource ===
    "RAZORPAY",
  "WALLET_RECHARGE PROVIDER: payment method/source changed.",
);

console.log(
  "PASS: Wallet Recharge optional provider evidence preserved",
);

// ============================================================
// WALLET RECHARGE INVALID AMOUNT REJECTION
// ============================================================

const invalidWalletAmounts = [
  {
    amount:
      "0",

    expected:
      "Wallet Recharge Amount must resolve to a positive safe INR minor-unit amount.",

    label:
      "Wallet zero amount",
  },
  {
    amount:
      "-1",

    expected:
      "Wallet Recharge Amount must be a positive INR amount with at most 2 decimal places.",

    label:
      "Wallet negative amount",
  },
  {
    amount:
      "1e2",

    expected:
      "Wallet Recharge Amount must be a positive INR amount with at most 2 decimal places.",

    label:
      "Wallet exponent amount",
  },
  {
    amount:
      "1,000",

    expected:
      "Wallet Recharge Amount must be a positive INR amount with at most 2 decimal places.",

    label:
      "Wallet comma amount",
  },
  {
    amount:
      "7.251",

    expected:
      "Wallet Recharge Amount must be a positive INR amount with at most 2 decimal places.",

    label:
      "Wallet excessive decimal amount",
  },
];

for (
  const invalidWalletAmount
  of invalidWalletAmounts
) {

  expectThrow(
    () =>
      buildWalletRechargeRequestForAmount(
        invalidWalletAmount.amount,
      ),

    invalidWalletAmount.expected,
    invalidWalletAmount.label,
  );
}

console.log(
  "PASS: invalid Wallet Recharge amount formats rejected",
);

// ============================================================
// WALLET RECHARGE REQUIRED PAYMENT REFERENCE
// ============================================================

expectThrow(
  () =>
    buildFinoraWalletRechargeIssuanceRequest({
      target:
        TARGET,

      paymentReference:
        "   ",

      amount:
        "10",

      paymentMethod:
        "UPI",

      paymentSource:
        "UPI",

      providerOrderId:
        "",

      providerTransactionId:
        "",
    }),

  "Payment Reference is required.",
  "Wallet payment reference",
);

console.log(
  "PASS: blank Wallet Recharge payment reference rejected",
);

// ============================================================
// WALLET RECHARGE BINDING REJECTION
// ============================================================

expectThrow(
  () =>
    buildFinoraWalletRechargeIssuanceRequest({
      target: {
        ...TARGET,

        bindingKeyId:
          "FINORA-BINDING-INVALID",
      },

      paymentReference:
        "WALLET-PAYMENT-REFERENCE-BAD-BINDING",

      amount:
        "10",

      paymentMethod:
        "UPI",

      paymentSource:
        "UPI",

      providerOrderId:
        "",

      providerTransactionId:
        "",
    }),

  "Binding Key ID does not match the native public-key fingerprint.",
  "Wallet binding identity",
);

console.log(
  "PASS: invalid Wallet Recharge native Binding Key ID rejected",
);

// ============================================================
// COMPLETE
// ============================================================

console.log(
  "============================================================",
);

console.log(
  "PASS: FINORA CONTROL CENTER ISSUANCE PAYLOAD BUILDER SELFTEST",
);

console.log(
  "============================================================",
);

// ============================================================
// END
// ============================================================