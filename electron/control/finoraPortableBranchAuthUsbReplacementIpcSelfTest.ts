// ============================================================
// FINORA ENTERPRISE OS
// USB REPLACEMENT IPC SELF-TEST
// PHASE : 5.6M-1C2
// ============================================================

import {
  app,
} from "electron";

import {
  executeFinoraPortableBranchAuthUsbReplacementRequest,
  parseFinoraPortableBranchAuthUsbReplacementIpcRequest,
} from "./finoraPortableBranchAuthUsbReplacementIpc.js";

// ============================================================
// ASSERT
// ============================================================

function assert(
  condition:
    unknown,
  message:
    string,
): asserts condition {
  if (
    !condition
  ) {
    throw new Error(
      message,
    );
  }
}

// ============================================================
// FIXTURE
// ============================================================

const validRequest = {
  password:
    "PortablePassword-5.6M",

  securityCode:
    "PortableSecurityCode-5.6M",

  expectedScope: {
    ownerId:
      "OWNER-USB-REPLACEMENT-000001",

    businessId:
      "BUSINESS-USB-REPLACEMENT-000001",

    branchId:
      "BRANCH-USB-REPLACEMENT-000001",
  },
};

// ============================================================
// SELFTEST
// ============================================================

async function runSelfTest(): Promise<void> {
  // ==========================================================
  // STRICT REQUEST SHAPE
  // ==========================================================

  const parsed =
    parseFinoraPortableBranchAuthUsbReplacementIpcRequest(
      validRequest,
    );

  assert(
    parsed !==
      null,
    "Valid USB replacement IPC request was rejected.",
  );

  assert(
    parsed.password ===
      validRequest.password &&
    parsed.securityCode ===
      validRequest.securityCode &&
    parsed.expectedScope.branchId ===
      validRequest.expectedScope.branchId,
    "Valid USB replacement IPC request changed values.",
  );

  console.log(
    "PASS: IPC accepts only credential factors plus expected branch scope",
  );

  // ==========================================================
  // FILESYSTEM ROOT INJECTION MUST FAIL
  // ==========================================================

  const rootInjection =
    parseFinoraPortableBranchAuthUsbReplacementIpcRequest({
      ...validRequest,

      sourceUsbRoot:
        "Q:\\",

      targetUsbRoot:
        "R:\\",
    });

  assert(
    rootInjection ===
      null,
    "Renderer filesystem roots were accepted by USB replacement IPC request parser.",
  );

  console.log(
    "PASS: renderer cannot inject SOURCE or TARGET filesystem roots",
  );

  // ==========================================================
  // EXTRA SCOPE AUTHORITY MUST FAIL
  // ==========================================================

  const scopeInjection =
    parseFinoraPortableBranchAuthUsbReplacementIpcRequest({
      ...validRequest,

      expectedScope: {
        ...validRequest.expectedScope,

        installationId:
          "FORBIDDEN-INSTALLATION-AUTHORITY",
      },
    });

  assert(
    scopeInjection ===
      null,
    "Unexpected scope authority field was accepted.",
  );

  console.log(
    "PASS: IPC expectedScope is exact owner/business/branch only",
  );

  // ==========================================================
  // INVALID REQUEST MUST NOT OPEN SELECTION
  // ==========================================================

  let invalidSelectionCalls =
    0;

  let invalidReplaceCalls =
    0;

  const invalidExecution =
    await executeFinoraPortableBranchAuthUsbReplacementRequest(
      {
        ...validRequest,

        sourceUsbRoot:
          "Q:\\",
      },
      {
        selectRootPair:
          async () => {
            invalidSelectionCalls +=
              1;

            throw new Error(
              "Selection must not run for invalid request.",
            );
          },

        replaceUsb:
          async () => {
            invalidReplaceCalls +=
              1;

            throw new Error(
              "Replacement must not run for invalid request.",
            );
          },
      },
    );

  assert(
    !invalidExecution.success &&
    invalidExecution.errorCode ===
      "INVALID_REQUEST" &&
    invalidSelectionCalls ===
      0 &&
    invalidReplaceCalls ===
      0,
    "Invalid renderer request reached privileged filesystem authority.",
  );

  console.log(
    "PASS: invalid renderer request fails before native USB selection",
  );

  // ==========================================================
  // CANCEL MUST NOT EXECUTE REPLACEMENT
  // ==========================================================

  let cancelReplaceCalls =
    0;

  const cancelled =
    await executeFinoraPortableBranchAuthUsbReplacementRequest(
      validRequest,
      {
        selectRootPair:
          async () => ({
            success:
              true,

            cancelled:
              true,

            sourceUsbRoot:
              null,

            targetUsbRoot:
              null,

            errorCode:
              null,

            error:
              null,
          }),

        replaceUsb:
          async () => {
            cancelReplaceCalls +=
              1;

            throw new Error(
              "Replacement must not run after cancellation.",
            );
          },
      },
    );

  assert(
    cancelled.success &&
    cancelled.cancelled &&
    cancelReplaceCalls ===
      0,
    "Native USB selection cancellation reached replacement engine.",
  );

  console.log(
    "PASS: native USB selection cancellation never executes replacement",
  );

  // ==========================================================
  // SELECTION FAILURE MUST NOT EXECUTE REPLACEMENT
  // ==========================================================

  let selectionFailureReplaceCalls =
    0;

  const selectionFailure =
    await executeFinoraPortableBranchAuthUsbReplacementRequest(
      validRequest,
      {
        selectRootPair:
          async () => ({
            success:
              false,

            cancelled:
              false,

            sourceUsbRoot:
              null,

            targetUsbRoot:
              null,

            errorCode:
              "INVALID_USB_ROOT",

            error:
              "Synthetic invalid USB root.",
          }),

        replaceUsb:
          async () => {
            selectionFailureReplaceCalls +=
              1;

            throw new Error(
              "Replacement must not run after selection failure.",
            );
          },
      },
    );

  assert(
    !selectionFailure.success &&
    selectionFailure.errorCode ===
      "INVALID_USB_ROOT" &&
    selectionFailureReplaceCalls ===
      0,
    "Selection failure reached replacement engine.",
  );

  console.log(
    "PASS: USB selection failure stops before replacement engine",
  );

  // ==========================================================
  // SUCCESS PASSES ROOTS INTERNALLY ONLY
  // ==========================================================

  let observedSourceRoot:
    string | null =
      null;

  let observedTargetRoot:
    string | null =
      null;

  let observedPassword:
    string | null =
      null;

  let observedSecurityCode:
    string | null =
      null;

  const success =
    await executeFinoraPortableBranchAuthUsbReplacementRequest(
      validRequest,
      {
        selectRootPair:
          async () => ({
            success:
              true,

            cancelled:
              false,

            sourceUsbRoot:
              "Q:\\",

            targetUsbRoot:
              "R:\\",

            errorCode:
              null,

            error:
              null,
          }),

        replaceUsb:
          async (
            input,
          ) => {
            observedSourceRoot =
              input.sourceUsbRoot;

            observedTargetRoot =
              input.targetUsbRoot;

            observedPassword =
              input.password;

            observedSecurityCode =
              input.securityCode;

            return {
              success:
                true,

              data: {
                result:
                  "WRITTEN",

                ownerId:
                  validRequest.expectedScope.ownerId,

                businessId:
                  validRequest.expectedScope.businessId,

                branchId:
                  validRequest.expectedScope.branchId,

                authGeneration:
                  7,

                certificationKeyId:
                  "FINORA-CERTIFICATION-KEY-000001",
              },

              errorCode:
                null,

              error:
                null,
            };
          },
      },
    );

  assert(
    success.success &&
    !success.cancelled &&
    success.data.result ===
      "WRITTEN" &&
    observedSourceRoot ===
      "Q:\\" &&
    observedTargetRoot ===
      "R:\\" &&
    observedPassword ===
      validRequest.password &&
    observedSecurityCode ===
      validRequest.securityCode,
    "IPC execution boundary did not pass internally selected roots and credentials correctly.",
  );

  const serializedSuccess =
    JSON.stringify(
      success,
    );

  assert(
    !serializedSuccess.includes(
      "Q:\\\\",
    ) &&
    !serializedSuccess.includes(
      "R:\\\\",
    ) &&
    !serializedSuccess.includes(
      validRequest.password,
    ) &&
    !serializedSuccess.includes(
      validRequest.securityCode,
    ),
    "IPC result leaked filesystem roots or credential secrets.",
  );

  console.log(
    "PASS: selected USB roots stay inside privileged execution boundary",
  );

  console.log(
    "PASS: IPC success result leaks neither filesystem paths nor credential secrets",
  );

  assert(
    success.data.lifecycle.schemaVersion ===
      1 &&
    success.data.lifecycle.targetState ===
      "EXACT_VERIFIED_COPY" &&
    success.data.lifecycle.crashRecovery ===
      "IDEMPOTENT_RETRY" &&
    success.data.lifecycle.crashJournalRequired ===
      false &&
    success.data.lifecycle.sourceState ===
      "UNCHANGED_AND_STILL_VALID" &&
    success.data.lifecycle.sourceRetirement ===
      "PHYSICAL_RETIREMENT_REQUIRED" &&
    success.data.lifecycle.offlinePreexistingCloneRevocation ===
      "NOT_AVAILABLE" &&
    success.data.lifecycle.authGeneration ===
      "UNCHANGED" &&
    success.data.lifecycle.lostOrUnreadableSource ===
      "BACKUP_RESTORE_REQUIRED",
    "IPC success result did not expose exact USB replacement lifecycle truth.",
  );

  const serializedLifecycle =
    JSON.stringify(
      success.data.lifecycle,
    );

  assert(
    serializedLifecycle.includes(
      '"sourceRetirement":"PHYSICAL_RETIREMENT_REQUIRED"',
    ) &&
    !serializedLifecycle.includes(
      '"sourceRetirement":"REVOKED"',
    ) &&
    !serializedLifecycle.includes(
      '"sourceState":"DESTROYED"',
    ),
    "IPC lifecycle result contains a false OLD USB retirement claim.",
  );

  console.log(
    "PASS: IPC success exposes explicit physical-retirement lifecycle truth without false revocation",
  );

  // ==========================================================
  // REPLACEMENT FAILURE IS SANITIZED
  // ==========================================================

  const replacementFailure =
    await executeFinoraPortableBranchAuthUsbReplacementRequest(
      validRequest,
      {
        selectRootPair:
          async () => ({
            success:
              true,

            cancelled:
              false,

            sourceUsbRoot:
              "Q:\\",

            targetUsbRoot:
              "R:\\",

            errorCode:
              null,

            error:
              null,
          }),

        replaceUsb:
          async () => ({
            success:
              false,

            data:
              null,

            errorCode:
              "TARGET_STORAGE_FAILED",

            error:
              "Synthetic internal path Q:\\FINORA\\auth must never escape.",
          }),
      },
    );

  assert(
    !replacementFailure.success &&
    replacementFailure.errorCode ===
      "TARGET_STORAGE_FAILED" &&
    replacementFailure.error ===
      "USB replacement failed." &&
    !JSON.stringify(
      replacementFailure,
    ).includes(
      "Q:\\\\",
    ),
    "Internal replacement error leaked privileged filesystem detail.",
  );

  console.log(
    "PASS: replacement failures preserve code but sanitize privileged detail",
  );

  console.log(
    "PASS: 5.6M-1C2 specialized USB replacement IPC executable proof",
  );
}

// ============================================================
// ELECTRON ENTRY
// ============================================================

app.whenReady()
  .then(
    runSelfTest,
  )
  .then(
    () => {
      app.quit();
    },
  )
  .catch(
    (
      error,
    ) => {
      console.error(
        "SELF-TEST FAILED:",
        error,
      );

      app.exit(
        1,
      );
    },
  );