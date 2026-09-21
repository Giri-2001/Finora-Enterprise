import {
  mkdtemp,
  mkdir,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";

import {
  tmpdir,
} from "node:os";

import {
  join,
} from "node:path";

import {
  generateFinoraBranchCertificationKeyMaterial,
} from "./finoraBranchCertificationCrypto.js";

import type {
  FinoraBranchCertificationKeyMaterialV1,
} from "./finoraBranchCertificationContract.js";

import {
  FINORA_PORTABLE_FRESH_DEVICE_RUNTIME_AUTHORITY_PURPOSE,
  FINORA_PORTABLE_FRESH_DEVICE_RUNTIME_AUTHORITY_SCHEMA_VERSION,
} from "./finoraPortableFreshDeviceRuntimeAuthorityContract.js";

import type {
  FinoraPortableFreshDeviceRuntimeAuthorityPayloadV1,
} from "./finoraPortableFreshDeviceRuntimeAuthorityContract.js";

import {
  createFinoraPortableFreshDeviceRuntimeAuthorityPackageV1,
} from "./finoraPortableFreshDeviceRuntimeAuthorityCrypto.js";

import {
  FinoraPortableFreshDeviceRuntimeAuthorityStore,
  getFinoraPortableFreshDeviceRuntimeAuthorityFilePath,
} from "./finoraPortableFreshDeviceRuntimeAuthorityStore.js";

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

function createKeyMaterial(
  createdAt:
    string,
): FinoraBranchCertificationKeyMaterialV1 {
  const generator =
    generateFinoraBranchCertificationKeyMaterial as unknown as
      (
        ...args:
          unknown[]
      ) =>
        FinoraBranchCertificationKeyMaterialV1;

  const attempts:
    unknown[][] = [
      [
        createdAt,
      ],
      [
        new Date(
          createdAt,
        ),
      ],
      [],
    ];

  let lastError:
    unknown;

  for (
    const args of attempts
  ) {
    try {
      return generator(
        ...args,
      );
    }
    catch (
      error
    ) {
      lastError =
        error;
    }
  }

  throw (
    lastError instanceof Error
      ? lastError
      : new Error(
          "Unable to generate Branch Certification test key material.",
        )
  );
}

const payload:
  FinoraPortableFreshDeviceRuntimeAuthorityPayloadV1 = {
    schemaVersion:
      FINORA_PORTABLE_FRESH_DEVICE_RUNTIME_AUTHORITY_SCHEMA_VERSION,

    purpose:
      FINORA_PORTABLE_FRESH_DEVICE_RUNTIME_AUTHORITY_PURPOSE,

    authorityId:
      "FINORA-FRESH-RUNTIME-AUTHORITY-STORE-001",

    sourceAuthorizationId:
      "FINORA-SOURCE-AUTH-STORE-001",

    credentialId:
      "FINORA-CREDENTIAL-STORE-001",

    activationId:
      "FINORA-ACTIVATION-STORE-001",

    branchAccessGrantId:
      "FINORA-ACCESS-GRANT-STORE-001",

    storageEntitlementId:
      "FINORA-STORAGE-ENTITLEMENT-STORE-001",

    ownerId:
      "OWNER-STORE-001",

    businessId:
      "BUSINESS-STORE-001",

    branchId:
      "BRANCH-STORE-001",

    userId:
      "USER-STORE-001",

    username:
      "giriadmin",

    canonicalUsername:
      "giriadmin",

    fullName:
      "Giri Admin",

    role:
      "ADMIN",

    storageMode:
      "USB",

    dataContext:
      "REAL",

    demoId:
      null,

    authGeneration:
      1,

    activationStatus:
      "ACTIVE",

    businessCode:
      null,

    branchCode:
      null,

    activationActivatedAt:
      "2026-01-01T00:00:00.000Z",

    activationCreatedAt:
      "2026-01-01T00:00:00.000Z",

    activationUpdatedAt:
      "2026-09-20T00:00:00.000Z",

    branchAccessType:
      "REGISTERED",
    registrationPayment: {
      amount:
        2000,

      currency:
        "INR",

      paymentMode:
        "CASH",

      paidAt:
        "2026-01-01T00:00:00.000Z",

      refundable:
        false,
    },

    registrationCycle:
      1,

    demoRemarks:
      null,
    accessMode:
      "ACTIVE",

    accessValidFrom:
      "2026-01-01T00:00:00.000Z",

    accessValidUntil:
      "2027-01-01T00:00:00.000Z",

    branchAccessCreatedAt:
      "2026-01-01T00:00:00.000Z",

    branchAccessUpdatedAt:
      "2026-09-20T00:00:00.000Z",

    storageEntitlementStatus:
      "ACTIVE",

    storageEntitlementActivatedAt:
      "2026-01-01T00:00:00.000Z",

    storageEntitlementCreatedAt:
      "2026-01-01T00:00:00.000Z",

    storageEntitlementUpdatedAt:
      "2026-09-20T00:00:00.000Z",

    portableAuthFingerprint:
      "a".repeat(
        64,
      ),

    issuedAt:
      "2026-09-20T00:00:00.000Z",
  };

const keyMaterial =
  createKeyMaterial(
    "2026-09-20T00:00:00.000Z",
  );

const packageValue =
  createFinoraPortableFreshDeviceRuntimeAuthorityPackageV1(
    payload,
    keyMaterial,
  );

async function main():
  Promise<void> {

const root =
  await mkdtemp(
    join(
      tmpdir(),
      "finora-runtime-authority-store-",
    ),
  );

const localRoot =
  join(
    root,
    "local",
  );

const usbRoot =
  join(
    root,
    "usb",
  );

await mkdir(
  localRoot,
  {
    recursive:
      true,
  },
);

await mkdir(
  usbRoot,
  {
    recursive:
      true,
  },
);

try {
  const store =
    new FinoraPortableFreshDeviceRuntimeAuthorityStore({
      resolveLocalRoot:
        () =>
          localRoot,

      resolveUsbRoot:
        async () =>
          usbRoot,
    });

  await store.write(
    "USB",
    packageValue,
  );

  const usbRead =
    await store.read(
      "USB",
    );

  assert(
    usbRead !==
      null,
    "USB runtime authority was not persisted.",
  );

  assert(
    JSON.stringify(
      usbRead,
    ) ===
      JSON.stringify(
        packageValue,
      ),
    "USB runtime authority did not round-trip exactly.",
  );

  console.log(
    "PASS: USB runtime authority round-trips exactly",
  );

  const localRead =
    await store.read(
      "LOCAL",
    );

  assert(
    localRead ===
      null,
    "USB runtime authority incorrectly appeared in LOCAL storage.",
  );

  console.log(
    "PASS: USB runtime authority never falls back to LOCAL storage",
  );

  const usbPath =
    getFinoraPortableFreshDeviceRuntimeAuthorityFilePath(
      usbRoot,
    );

  const persisted =
    await readFile(
      usbPath,
      "utf8",
    );

  const tampered =
    JSON.parse(
      persisted,
    ) as Record<
      string,
      unknown
    >;

  tampered["unexpectedField"] =
    "tamper";

  await writeFile(
    usbPath,
    JSON.stringify(
      tampered,
    ),
    "utf8",
  );

  let tamperRejected =
    false;

  try {
    await store.read(
      "USB",
    );
  }
  catch {
    tamperRejected =
      true;
  }

  assert(
    tamperRejected,
    "Malformed runtime-authority package was accepted.",
  );

  console.log(
    "PASS: malformed stored runtime authority is rejected",
  );

  await store.write(
    "USB",
    packageValue,
  );

  const recovered =
    await store.read(
      "USB",
    );

  assert(
    recovered !==
      null,
    "Valid runtime authority could not replace malformed stored state.",
  );

  console.log(
    "PASS: valid runtime authority can replace malformed stored state",
  );

  console.log(
    "PASS: STEP A2 PORTABLE RUNTIME AUTHORITY STORE EXECUTABLE PROOF",
  );
}
finally {
  await rm(
    root,
    {
      recursive:
        true,

      force:
        true,
    },
  );
}

}

void main().catch(
  (
    error,
  ) => {
    console.error(
      error,
    );

    process.exitCode =
      1;
  },
);