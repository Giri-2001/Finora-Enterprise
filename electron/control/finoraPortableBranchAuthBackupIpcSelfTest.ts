// ============================================================
// FINORA ENTERPRISE OS
// PORTABLE BRANCH AUTH BACKUP PRIVILEGED IPC SELF-TEST
// PHASE : 5.6N-N3B
// ============================================================

import type {
  BrowserWindow,
  IpcMainInvokeEvent,
  WebFrameMain,
} from "electron";

import {
  FINORA_PORTABLE_BRANCH_AUTH_BACKUP_IPC_CHANNEL,
  createFinoraPortableBranchAuthBackupIpcHandler,
  parseFinoraPortableBranchAuthBackupIpcRequest,
} from "./finoraPortableBranchAuthBackupIpc.js";

import type {
  FinoraPortableBranchAuthBackupIpcDependencies,
} from "./finoraPortableBranchAuthBackupIpc.js";

import type {
  FinoraPortableBranchAuthBackupExportResult,
} from "./finoraPortableBranchAuthBackupFileTransport.js";

import type {
  FinoraPortableBranchAuthStore,
} from "./finoraPortableBranchAuthStore.js";

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

const SESSION_ID =
  "FINORA-SESSION-N3B";

const PASSWORD =
  "N3B-Password";

const SECURITY_CODE =
  "N3B-Security-Code";

const trustedMainFrame =
  {} as WebFrameMain;

const untrustedMainFrame =
  {} as WebFrameMain;

const subFrame =
  {} as WebFrameMain;

const parentWindow =
  {
    isDestroyed:
      () =>
        false,
  } as BrowserWindow;

const destroyedWindow =
  {
    isDestroyed:
      () =>
        true,
  } as BrowserWindow;

const portableStore =
  {
    read:
      async () =>
        null,
  } as Pick<
    FinoraPortableBranchAuthStore,
    "read"
  >;

function createEvent(
  senderFrame:
    WebFrameMain | null,
  mainFrame:
    WebFrameMain = trustedMainFrame,
): IpcMainInvokeEvent {
  return {
    senderFrame,

    sender: {
      mainFrame,
    },
  } as unknown as IpcMainInvokeEvent;
}

function successExportResult():
  FinoraPortableBranchAuthBackupExportResult {
  return {
    success:
      true,

    cancelled:
      false,

    data: {
      backupId:
        "FINORA-PBA-BACKUP-N3B-TEST",

      fileName:
        "FINORA-PBA-BACKUP-N3B-TEST.finora",

      bytesWritten:
        1234,

      sourceStorageMode:
        "USB",

      authGeneration:
        11,
    },

    errorCode:
      null,

    error:
      null,
  };
}

function createDependencies(
  overrides:
    Partial<
      FinoraPortableBranchAuthBackupIpcDependencies
    > = {},
): FinoraPortableBranchAuthBackupIpcDependencies {
  return {
    isTrustedRenderer:
      (
        frame,
      ) =>
        frame ===
          trustedMainFrame,

    getParentWindow:
      () =>
        parentWindow,

    portableStore,

    exportBackup:
      async () =>
        successExportResult(),

    ...overrides,
  };
}

async function runSelfTest(): Promise<void> {
  // ==========================================================
  // CHANNEL + EXACT PARSER
  // ==========================================================

  assert(
    FINORA_PORTABLE_BRANCH_AUTH_BACKUP_IPC_CHANNEL ===
      "finora:portable-branch-auth:export-backup",
    "Backup IPC channel is invalid.",
  );

  const parsed =
    parseFinoraPortableBranchAuthBackupIpcRequest({
      sessionId:
        SESSION_ID,

      password:
        PASSWORD,

      securityCode:
        SECURITY_CODE,
    });

  assert(
    parsed !==
      null &&
    parsed.sessionId ===
      SESSION_ID &&
    parsed.password ===
      PASSWORD &&
    parsed.securityCode ===
      SECURITY_CODE,
    "Valid exact Backup IPC request was rejected.",
  );

  console.log(
    "PASS: backup IPC channel is fixed and exact credential/session request parses",
  );

  // ==========================================================
  // AUTHORIZED SUCCESS
  // ==========================================================

  const observation = {
    exportCalls:
      0,

    observedSessionId:
      "",

    observedPassword:
      "",

    observedSecurityCode:
      "",

    observedParent:
      null as BrowserWindow | null,

    observedStore:
      null as Pick<
        FinoraPortableBranchAuthStore,
        "read"
      > | null,
  };

  const handler =
    createFinoraPortableBranchAuthBackupIpcHandler(
      createDependencies({
        exportBackup:
          async (
            observedParent,
            request,
            observedStore,
          ) => {
            observation.exportCalls +=
              1;

            observation.observedParent =
              observedParent;

            observation.observedStore =
              observedStore;

            observation.observedSessionId =
              request.sessionId;

            observation.observedPassword =
              request.password;

            observation.observedSecurityCode =
              request.securityCode;

            return successExportResult();
          },
      }),
    );

  const success =
    await handler(
      createEvent(
        trustedMainFrame,
      ),
      {
        sessionId:
          SESSION_ID,

        password:
          PASSWORD,

        securityCode:
          SECURITY_CODE,
      },
    );

  assert(
    success.success &&
    !success.cancelled &&
    observation.exportCalls ===
      1 &&
    observation.observedParent ===
      parentWindow &&
    observation.observedStore ===
      portableStore &&
    observation.observedSessionId ===
      SESSION_ID &&
    observation.observedPassword ===
      PASSWORD &&
    observation.observedSecurityCode ===
      SECURITY_CODE,
    "Authorized trusted-main-frame backup IPC did not invoke native transport exactly.",
  );

  assert(
    success.data.backupId ===
      "FINORA-PBA-BACKUP-N3B-TEST" &&
    success.data.fileName ===
      "FINORA-PBA-BACKUP-N3B-TEST.finora" &&
    success.data.bytesWritten ===
      1234 &&
    success.data.sourceStorageMode ===
      "USB" &&
    success.data.authGeneration ===
      11,
    "IPC success metadata is invalid.",
  );

  const serializedSuccess =
    JSON.stringify(
      success,
    );

  assert(
    !serializedSuccess.includes(
      PASSWORD,
    ) &&
    !serializedSuccess.includes(
      SECURITY_CODE,
    ) &&
    !serializedSuccess.includes(
      "serializedBackup",
    ) &&
    !serializedSuccess.includes(
      "filePath",
    ) &&
    !serializedSuccess.includes(
      "ownerId",
    ) &&
    !serializedSuccess.includes(
      "businessId",
    ) &&
    !serializedSuccess.includes(
      "branchId",
    ),
    "IPC success leaked privileged backup authority or credentials.",
  );

  console.log(
    "PASS: trusted MAIN frame invokes native backup transport and receives non-secret metadata only",
  );

  // ==========================================================
  // SUBFRAME DENIED BEFORE TRANSPORT
  // ==========================================================

  const subframeObservation = {
    exportCalls:
      0,
  };

  const subframeHandler =
    createFinoraPortableBranchAuthBackupIpcHandler(
      createDependencies({
        exportBackup:
          async () => {
            subframeObservation.exportCalls +=
              1;

            return successExportResult();
          },
      }),
    );

  const subframeResult =
    await subframeHandler(
      createEvent(
        subFrame,
        trustedMainFrame,
      ),
      {
        sessionId:
          SESSION_ID,

        password:
          PASSWORD,

        securityCode:
          SECURITY_CODE,
      },
    );

  assert(
    !subframeResult.success &&
    subframeResult.errorCode ===
      "UNAUTHORIZED" &&
    subframeObservation.exportCalls ===
      0,
    "Renderer subframe reached backup transport.",
  );

  console.log(
    "PASS: renderer subframe is rejected before backup transport",
  );

  // ==========================================================
  // UNTRUSTED MAIN FRAME DENIED
  // ==========================================================

  const untrustedObservation = {
    exportCalls:
      0,
  };

  const untrustedHandler =
    createFinoraPortableBranchAuthBackupIpcHandler(
      createDependencies({
        exportBackup:
          async () => {
            untrustedObservation.exportCalls +=
              1;

            return successExportResult();
          },
      }),
    );

  const untrustedResult =
    await untrustedHandler(
      createEvent(
        untrustedMainFrame,
        untrustedMainFrame,
      ),
      {
        sessionId:
          SESSION_ID,

        password:
          PASSWORD,

        securityCode:
          SECURITY_CODE,
      },
    );

  assert(
    !untrustedResult.success &&
    untrustedResult.errorCode ===
      "UNAUTHORIZED" &&
    untrustedObservation.exportCalls ===
      0,
    "Untrusted main frame reached backup transport.",
  );

  console.log(
    "PASS: untrusted MAIN frame is rejected before backup transport",
  );

  // ==========================================================
  // AUTHORITY / PATH INJECTION REJECTED
  // ==========================================================

  const injectionObservation = {
    exportCalls:
      0,
  };

  const injectionHandler =
    createFinoraPortableBranchAuthBackupIpcHandler(
      createDependencies({
        exportBackup:
          async () => {
            injectionObservation.exportCalls +=
              1;

            return successExportResult();
          },
      }),
    );

  const injectionResult =
    await injectionHandler(
      createEvent(
        trustedMainFrame,
      ),
      {
        sessionId:
          SESSION_ID,

        password:
          PASSWORD,

        securityCode:
          SECURITY_CODE,

        branchId:
          "ATTACKER-BRANCH",

        destinationPath:
          "C:\\ATTACKER\\backup.finora",
      },
    );

  assert(
    !injectionResult.success &&
    injectionResult.errorCode ===
      "INVALID_REQUEST" &&
    injectionObservation.exportCalls ===
      0,
    "Renderer authority/path injection reached backup transport.",
  );

  console.log(
    "PASS: renderer cannot inject branch identity or filesystem destination into backup IPC",
  );

  // ==========================================================
  // INVALID REQUEST BEFORE WINDOW / TRANSPORT
  // ==========================================================

  const invalidObservation = {
    windowCalls:
      0,

    exportCalls:
      0,
  };

  const invalidHandler =
    createFinoraPortableBranchAuthBackupIpcHandler(
      createDependencies({
        getParentWindow:
          () => {
            invalidObservation.windowCalls +=
              1;

            return parentWindow;
          },

        exportBackup:
          async () => {
            invalidObservation.exportCalls +=
              1;

            return successExportResult();
          },
      }),
    );

  const invalidResult =
    await invalidHandler(
      createEvent(
        trustedMainFrame,
      ),
      {
        sessionId:
          SESSION_ID,

        password:
          PASSWORD,
      },
    );

  assert(
    !invalidResult.success &&
    invalidResult.errorCode ===
      "INVALID_REQUEST" &&
    invalidObservation.windowCalls ===
      0 &&
    invalidObservation.exportCalls ===
      0,
    "Invalid IPC request reached window or native backup transport.",
  );

  console.log(
    "PASS: malformed backup IPC request fails before window/native transport",
  );

  // ==========================================================
  // WINDOW UNAVAILABLE
  // ==========================================================

  const unavailableObservation = {
    exportCalls:
      0,
  };

  const unavailableHandler =
    createFinoraPortableBranchAuthBackupIpcHandler(
      createDependencies({
        getParentWindow:
          () =>
            null,

        exportBackup:
          async () => {
            unavailableObservation.exportCalls +=
              1;

            return successExportResult();
          },
      }),
    );

  const unavailable =
    await unavailableHandler(
      createEvent(
        trustedMainFrame,
      ),
      {
        sessionId:
          SESSION_ID,

        password:
          PASSWORD,

        securityCode:
          SECURITY_CODE,
      },
    );

  assert(
    !unavailable.success &&
    unavailable.errorCode ===
      "WINDOW_UNAVAILABLE" &&
    unavailableObservation.exportCalls ===
      0,
    "Missing parent window reached backup transport.",
  );

  const destroyedHandler =
    createFinoraPortableBranchAuthBackupIpcHandler(
      createDependencies({
        getParentWindow:
          () =>
            destroyedWindow,

        exportBackup:
          async () =>
            successExportResult(),
      }),
    );

  const destroyed =
    await destroyedHandler(
      createEvent(
        trustedMainFrame,
      ),
      {
        sessionId:
          SESSION_ID,

        password:
          PASSWORD,

        securityCode:
          SECURITY_CODE,
      },
    );

  assert(
    !destroyed.success &&
    destroyed.errorCode ===
      "WINDOW_UNAVAILABLE",
    "Destroyed parent window was accepted.",
  );

  console.log(
    "PASS: missing or destroyed parent window fails before native backup transport",
  );

  // ==========================================================
  // CANCELLATION PRESERVED
  // ==========================================================

  const cancellationHandler =
    createFinoraPortableBranchAuthBackupIpcHandler(
      createDependencies({
        exportBackup:
          async () => ({
            success:
              true,

            cancelled:
              true,

            data:
              null,

            errorCode:
              null,

            error:
              null,
          }),
      }),
    );

  const cancellation =
    await cancellationHandler(
      createEvent(
        trustedMainFrame,
      ),
      {
        sessionId:
          SESSION_ID,

        password:
          PASSWORD,

        securityCode:
          SECURITY_CODE,
      },
    );

  assert(
    cancellation.success &&
    cancellation.cancelled &&
    cancellation.data ===
      null,
    "Native save cancellation was not preserved by IPC.",
  );

  console.log(
    "PASS: native backup save cancellation is preserved without fabricated success metadata",
  );

  // ==========================================================
  // FAILURE SANITIZATION
  // ==========================================================

  const failureHandler =
    createFinoraPortableBranchAuthBackupIpcHandler(
      createDependencies({
        exportBackup:
          async () => ({
            success:
              false,

            cancelled:
              false,

            data:
              null,

            errorCode:
              "EXPORT_FAILED",

            error:
              "C:\\SECRET\\DO-NOT-LEAK.finora PASSWORD=LEAK",
          }),
      }),
    );

  const failed =
    await failureHandler(
      createEvent(
        trustedMainFrame,
      ),
      {
        sessionId:
          SESSION_ID,

        password:
          PASSWORD,

        securityCode:
          SECURITY_CODE,
      },
    );

  assert(
    !failed.success &&
    failed.errorCode ===
      "EXPORT_FAILED" &&
    !failed.error.includes(
      "C:\\SECRET",
    ) &&
    !failed.error.includes(
      "PASSWORD=LEAK",
    ),
    "IPC leaked privileged transport failure details.",
  );

  console.log(
    "PASS: backup IPC preserves failure code while sanitizing privileged error detail",
  );

  // ==========================================================
  // UNCAUGHT SERVICE FAILURE SANITIZED
  // ==========================================================

  const serviceFailureHandler =
    createFinoraPortableBranchAuthBackupIpcHandler(
      createDependencies({
        exportBackup:
          async () => {
            throw new Error(
              "C:\\SECRET\\UNCAUGHT.finora",
            );
          },
      }),
    );

  const serviceFailure =
    await serviceFailureHandler(
      createEvent(
        trustedMainFrame,
      ),
      {
        sessionId:
          SESSION_ID,

        password:
          PASSWORD,

        securityCode:
          SECURITY_CODE,
      },
    );

  assert(
    !serviceFailure.success &&
    serviceFailure.errorCode ===
      "SERVICE_FAILURE" &&
    !serviceFailure.error.includes(
      "C:\\SECRET",
    ),
    "Unhandled backup service failure leaked privileged detail.",
  );

  console.log(
    "PASS: unexpected backup service failure is fail-closed and sanitized",
  );

  console.log(
    "PASS: 5.6N-N3B privileged Portable Branch Auth backup IPC executable proof",
  );
}

runSelfTest()
  .then(
    () => {
      process.exit(
        0,
      );
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

      process.exit(
        1,
      );
    },
  );