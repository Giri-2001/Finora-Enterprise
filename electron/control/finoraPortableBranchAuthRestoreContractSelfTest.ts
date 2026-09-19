/* ============================================================
   FINORA ENTERPRISE

   Phase 5.6O-O1
   Portable Branch Auth Restore Contract SelfTest
   ============================================================ */

import {
  evaluateFinoraPortableBranchAuthRestoreGeneration,
  isFinoraPortableBranchAuthRestoreScopeMatch,
  isFinoraPortableBranchAuthRestoreStorageModeMatch,
  sanitizeFinoraPortableBranchAuthRestoreCredentialRequest,
} from "./finoraPortableBranchAuthRestoreContract.js";

function assert(
  condition:
    unknown,
  message:
    string,
): asserts condition {
  if (!condition) {
    throw new Error(
      message,
    );
  }
}

function pass(
  message:
    string,
): void {
  console.log(
    `PASS: ${message}`,
  );
}

// ============================================================
// EXACT CREDENTIAL REQUEST
// ============================================================

const password =
  "  Password Secret  ";

const securityCode =
  "  Security Secret  ";

const request =
  sanitizeFinoraPortableBranchAuthRestoreCredentialRequest({
    username:
      "  OWNER-01  ",

    password,

    securityCode,
  });

assert(
  request !==
    null,
  "Exact Restore credential request should parse.",
);

assert(
  request.username ===
    "OWNER-01",
  "Restore username should trim surrounding whitespace only.",
);

assert(
  request.password ===
    password,
  "Restore Password must not be trimmed or transformed.",
);

assert(
  request.securityCode ===
    securityCode,
  "Restore Security Code must not be trimmed or transformed.",
);

pass(
  "Restore credential request preserves Password and Security Code exactly",
);

// ============================================================
// NO SESSION AUTHORITY
// ============================================================

assert(
  sanitizeFinoraPortableBranchAuthRestoreCredentialRequest({
    username:
      "owner",

    password:
      "password",

    securityCode:
      "security",

    sessionId:
      "renderer-session",
  }) ===
    null,
  "Renderer must not inject sessionId into Restore.",
);

pass(
  "Restore is session-less and rejects renderer sessionId injection",
);

// ============================================================
// NO SCOPE AUTHORITY
// ============================================================

for (
  const injected of [
    {
      ownerId:
        "owner",
    },

    {
      businessId:
        "business",
    },

    {
      branchId:
        "branch",
    },

    {
      storageMode:
        "USB",
    },

    {
      authGeneration:
        1,
    },

    {
      filePath:
        "C:\\backup.finora",
    },

    {
      destination:
        "E:\\",
    },

    {
      serializedBackup:
        "{}",
    },
  ]
) {
  const candidate =
    sanitizeFinoraPortableBranchAuthRestoreCredentialRequest({
      username:
        "owner",

      password:
        "password",

      securityCode:
        "security",

      ...injected,
    });

  assert(
    candidate ===
      null,
    `Injected Restore authority must be rejected: ${Object.keys(
      injected,
    )[0]}`,
  );
}

pass(
  "Restore credential request rejects renderer scope, storage, generation, path and raw-backup authority",
);

// ============================================================
// GENERATION POLICY
// ============================================================

assert(
  evaluateFinoraPortableBranchAuthRestoreGeneration(
    4,
    5,
  ) ===
    "STALE_BACKUP",
  "Older backup generation must be stale.",
);

pass(
  "backup generation lower than current authority is rejected as stale rollback",
);

assert(
  evaluateFinoraPortableBranchAuthRestoreGeneration(
    5,
    5,
  ) ===
    "MATCH",
  "Equal Restore generation should match.",
);

pass(
  "backup generation equal to current authority is Restore-eligible",
);

assert(
  evaluateFinoraPortableBranchAuthRestoreGeneration(
    6,
    5,
  ) ===
    "FUTURE_BACKUP",
  "Future backup generation must fail closed.",
);

pass(
  "backup generation higher than current authority fails closed as future authority",
);

let invalidGenerationRejected =
  false;

try {
  evaluateFinoraPortableBranchAuthRestoreGeneration(
    0,
    1,
  );
}
catch {
  invalidGenerationRejected =
    true;
}

assert(
  invalidGenerationRejected,
  "Invalid generation must reject.",
);

pass(
  "invalid Restore generation evidence is rejected",
);

// ============================================================
// EXACT SCOPE MATCH
// ============================================================

const scope = {
  ownerId:
    "owner-1",

  businessId:
    "business-1",

  branchId:
    "branch-1",
};

assert(
  isFinoraPortableBranchAuthRestoreScopeMatch(
    scope,
    {
      ...scope,
    },
  ),
  "Exact Restore scope should match.",
);

assert(
  !isFinoraPortableBranchAuthRestoreScopeMatch(
    scope,
    {
      ...scope,

      branchId:
        "branch-2",
    },
  ),
  "Different branch scope must fail.",
);

pass(
  "Restore requires exact authenticated owner/business/branch scope equality",
);

// ============================================================
// SAME STORAGE MODE ONLY
// ============================================================

assert(
  isFinoraPortableBranchAuthRestoreStorageModeMatch(
    "USB",
    "USB",
  ),
  "USB to USB Restore should match.",
);

assert(
  isFinoraPortableBranchAuthRestoreStorageModeMatch(
    "LOCAL",
    "LOCAL",
  ),
  "LOCAL to LOCAL Restore should match.",
);

assert(
  !isFinoraPortableBranchAuthRestoreStorageModeMatch(
    "USB",
    "LOCAL",
  ),
  "Cross-mode Restore must fail.",
);

assert(
  !isFinoraPortableBranchAuthRestoreStorageModeMatch(
    "LOCAL",
    "USB",
  ),
  "Cross-mode Restore must fail.",
);

pass(
  "Restore defaults to exact same-storage-mode recovery and rejects LOCAL/USB migration",
);

console.log(
  "PASS: 5.6O-O1 Portable Branch Auth Restore contract executable proof",
);