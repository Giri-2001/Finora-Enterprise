/* ============================================================
   FINORA ENTERPRISE

   Phase 5.6O-O3B
   Portable Branch Auth Restore IPC SelfTest
   ============================================================ */

import {
  app,
} from "electron";

import type {
  BrowserWindow,
  IpcMainInvokeEvent,
  WebFrameMain,
} from "electron";

import {
  FINORA_PORTABLE_BRANCH_AUTH_RESTORE_IPC_CHANNEL,
  handleFinoraPortableBranchAuthRestoreIpcRequest,
} from "./finoraPortableBranchAuthRestoreIpc.js";

import type {
  FinoraPortableBranchAuthRestoreHandlerDependencies,
} from "./finoraPortableBranchAuthRestoreIpc.js";

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

const mainFrame =
  {} as WebFrameMain;

const subFrame =
  {} as WebFrameMain;

const trustedMainEvent =
  {
    senderFrame:
      mainFrame,

    sender: {
      mainFrame,
    },
  } as unknown as IpcMainInvokeEvent;

const trustedSubframeEvent =
  {
    senderFrame:
      subFrame,

    sender: {
      mainFrame,
    },
  } as unknown as IpcMainInvokeEvent;

const noFrameEvent =
  {
    senderFrame:
      null,

    sender: {
      mainFrame,
    },
  } as unknown as IpcMainInvokeEvent;

const parentWindow =
  {
    isDestroyed:
      () =>
        false,
  } as unknown as BrowserWindow;

const destroyedWindow =
  {
    isDestroyed:
      () =>
        true,
  } as unknown as BrowserWindow;

const request = {
  username:
    "owner",

  password:
    "  Password-123  ",

  securityCode:
    "  Security-123  ",
};

function createDependencies() {
  const state = {
    trusted:
      true,

    parent:
      parentWindow as
        BrowserWindow |
        null,

    trustedChecks:
      0,

    parentCalls:
      0,

    transportCalls:
      0,

    observedInput:
      null as
        unknown,

    observedParent:
      null as
        BrowserWindow |
        null,

    observedResolveLocalRoot:
      null as
        unknown,

    observedValidateUsbRoot:
      null as
        unknown,

    throwFromTransport:
      false,

    transportResult:
      {
        success:
          true as const,

        cancelled:
          false as const,

        data: {
          backupId:
            "backup-1",

          fileName:
            "branch-backup.finora",

          storageMode:
            "USB" as const,

          authGeneration:
            5,
        },
      },
  };

  const resolveLocalRoot =
    () =>
      "LOCAL_ROOT";

  const validateUsbRoot =
    async (
      _root:
        string,
    ) =>
      true;

  const dependencies:
    FinoraPortableBranchAuthRestoreHandlerDependencies =
    {
      isTrustedRenderer(
        frame,
      ) {
        state.trustedChecks +=
          1;

        return (
          state.trusted &&
          frame ===
            mainFrame
        );
      },

      getParentWindow() {
        state.parentCalls +=
          1;

        return state.parent;
      },

      resolveLocalRoot,

      validateUsbRoot,

      async restoreFromNativeBackup(
        input,
        transportDependencies,
      ) {
        state.transportCalls +=
          1;

        state.observedInput =
          input;

        state.observedParent =
          transportDependencies.parentWindow;

        state.observedResolveLocalRoot =
          transportDependencies.resolveLocalRoot;

        state.observedValidateUsbRoot =
          transportDependencies.validateUsbRoot;

        if (
          state.throwFromTransport
        ) {
          throw new Error(
            "sensitive internal transport detail",
          );
        }

        return state.transportResult;
      },
    };

  return {
    state,
    dependencies,
    resolveLocalRoot,
    validateUsbRoot,
  };
}

async function main():
  Promise<void> {

  await app.whenReady();

  // ==========================================================
  // FIXED CHANNEL
  // ==========================================================

  assert(
    FINORA_PORTABLE_BRANCH_AUTH_RESTORE_IPC_CHANNEL ===
      "finora:portable-branch-auth:restore-backup",
    "Restore IPC channel must remain fixed.",
  );

  pass(
    "Restore IPC uses fixed privileged channel",
  );

  // ==========================================================
  // UNTRUSTED MAIN FRAME
  // ==========================================================

  {
    const {
      state,
      dependencies,
    } =
      createDependencies();

    state.trusted =
      false;

    const result =
      await handleFinoraPortableBranchAuthRestoreIpcRequest(
        trustedMainEvent,
        request,
        dependencies,
      );

    assert(
      !result.success &&
      result.errorCode ===
        "UNAUTHORIZED",
      "Untrusted renderer must reject.",
    );

    assert(
      state.parentCalls ===
        0 &&
      state.transportCalls ===
        0,
      "Unauthorized request must stop before parent/transport.",
    );

    pass(
      "untrusted renderer is rejected before request service execution",
    );
  }

  // ==========================================================
  // SUBFRAME REJECTED EVEN IF TRUST FUNCTION WOULD ACCEPT IT
  // ==========================================================

  {
    const {
      state,
      dependencies,
    } =
      createDependencies();

    dependencies.isTrustedRenderer =
      () =>
        true;

    const result =
      await handleFinoraPortableBranchAuthRestoreIpcRequest(
        trustedSubframeEvent,
        request,
        dependencies,
      );

    assert(
      !result.success &&
      result.errorCode ===
        "UNAUTHORIZED",
      "Subframe Restore request must reject.",
    );

    assert(
      state.parentCalls ===
        0 &&
      state.transportCalls ===
        0,
      "Subframe rejection must happen before native service.",
    );

    pass(
      "trusted-looking subframe cannot invoke Restore IPC",
    );
  }

  // ==========================================================
  // NULL SENDER FRAME
  // ==========================================================

  {
    const {
      state,
      dependencies,
    } =
      createDependencies();

    const result =
      await handleFinoraPortableBranchAuthRestoreIpcRequest(
        noFrameEvent,
        request,
        dependencies,
      );

    assert(
      !result.success &&
      result.errorCode ===
        "UNAUTHORIZED",
      "Null sender frame must reject.",
    );

    assert(
      state.transportCalls ===
        0,
      "Null sender frame must never invoke transport.",
    );

    pass(
      "missing sender frame fails closed",
    );
  }

  // ==========================================================
  // POLLUTED REQUEST
  // ==========================================================

  {
    const {
      state,
      dependencies,
    } =
      createDependencies();

    const result =
      await handleFinoraPortableBranchAuthRestoreIpcRequest(
        trustedMainEvent,
        {
          ...request,

          branchId:
            "renderer-injected",
        },
        dependencies,
      );

    assert(
      !result.success &&
      result.errorCode ===
        "INVALID_REQUEST",
      "Injected branch authority must reject.",
    );

    assert(
      state.parentCalls ===
        0 &&
      state.transportCalls ===
        0,
      "Invalid request must fail before parent/transport.",
    );

    pass(
      "Restore IPC accepts exact Username + Password + Security Code fields only",
    );
  }

  // ==========================================================
  // PASSWORD / SECURITY CODE PRESERVED
  // ==========================================================

  {
    const {
      state,
      dependencies,
    } =
      createDependencies();

    const result =
      await handleFinoraPortableBranchAuthRestoreIpcRequest(
        trustedMainEvent,
        request,
        dependencies,
      );

    assert(
      result.success &&
      !result.cancelled,
      "Valid IPC Restore request should succeed.",
    );

    const observed =
      state.observedInput as {
        username:
          string;

        password:
          string;

        securityCode:
          string;
      };

    assert(
      observed.password ===
        request.password,
      "Password must remain untrimmed.",
    );

    assert(
      observed.securityCode ===
        request.securityCode,
      "Security Code must remain untrimmed.",
    );

    pass(
      "IPC preserves Password and Security Code exactly for native authentication",
    );
  }

  // ==========================================================
  // WINDOW UNAVAILABLE
  // ==========================================================

  {
    const {
      state,
      dependencies,
    } =
      createDependencies();

    state.parent =
      null;

    const result =
      await handleFinoraPortableBranchAuthRestoreIpcRequest(
        trustedMainEvent,
        request,
        dependencies,
      );

    assert(
      !result.success &&
      result.errorCode ===
        "WINDOW_UNAVAILABLE",
      "Missing parent window must reject.",
    );

    assert(
      state.transportCalls ===
        0,
      "Missing parent must fail before transport.",
    );

    pass(
      "missing parent window fails closed before native Restore transport",
    );
  }

  {
    const {
      state,
      dependencies,
    } =
      createDependencies();

    state.parent =
      destroyedWindow;

    const result =
      await handleFinoraPortableBranchAuthRestoreIpcRequest(
        trustedMainEvent,
        request,
        dependencies,
      );

    assert(
      !result.success &&
      result.errorCode ===
        "WINDOW_UNAVAILABLE",
      "Destroyed parent window must reject.",
    );

    assert(
      state.transportCalls ===
        0,
      "Destroyed parent must not invoke transport.",
    );

    pass(
      "destroyed parent window fails closed",
    );
  }

  // ==========================================================
  // DEPENDENCY WIRING
  // ==========================================================

  {
    const {
      state,
      dependencies,
      resolveLocalRoot,
      validateUsbRoot,
    } =
      createDependencies();

    const result =
      await handleFinoraPortableBranchAuthRestoreIpcRequest(
        trustedMainEvent,
        request,
        dependencies,
      );

    assert(
      result.success &&
      !result.cancelled,
      "Valid Restore IPC should succeed.",
    );

    assert(
      state.transportCalls ===
        1,
      "Native Restore transport should execute once.",
    );

    assert(
      state.observedParent ===
        parentWindow,
      "IPC must pass the authoritative parent window.",
    );

    assert(
      state.observedResolveLocalRoot ===
        resolveLocalRoot,
      "IPC must pass authoritative LOCAL root resolver.",
    );

    assert(
      state.observedValidateUsbRoot ===
        validateUsbRoot,
      "IPC must pass approved USB-root validator.",
    );

    pass(
      "IPC wires only privileged parent/root/USB-validation dependencies into O3A",
    );
  }

  // ==========================================================
  // CANCELLATION MAPPING
  // ==========================================================

  {
    const {
      state,
      dependencies,
    } =
      createDependencies();

    state.transportResult =
      {
        success:
          true,

        cancelled:
          true,
      } as never;

    const result =
      await handleFinoraPortableBranchAuthRestoreIpcRequest(
        trustedMainEvent,
        request,
        dependencies,
      );

    assert(
      result.success &&
      result.cancelled &&
      result.data ===
        null &&
      result.errorCode ===
        null,
      "Native cancellation must remain cancellation.",
    );

    pass(
      "native Backup/USB cancellation crosses IPC only as cancellation",
    );
  }

  // ==========================================================
  // SANITIZED SUCCESS RESULT
  // ==========================================================

  {
    const {
      dependencies,
    } =
      createDependencies();

    const result =
      await handleFinoraPortableBranchAuthRestoreIpcRequest(
        trustedMainEvent,
        request,
        dependencies,
      );

    assert(
      result.success &&
      !result.cancelled,
      "Expected successful Restore IPC result.",
    );

    const serialized =
      JSON.stringify(
        result,
      );

    for (
      const forbidden of [
        "filePath",
        "serializedBackup",
        "portableAuthEnvelopeSerialized",
        "ownerId",
        "businessId",
        "branchId",
        "usbRoot",
        "LOCAL_ROOT",
      ]
    ) {
      assert(
        !serialized.includes(
          forbidden,
        ),
        `IPC result leaked privileged field: ${forbidden}`,
      );
    }

    assert(
      result.data.fileName ===
        "branch-backup.finora",
      "IPC may expose basename only.",
    );

    pass(
      "successful IPC result exposes only safe Restore metadata",
    );
  }

  // ==========================================================
  // DOWNSTREAM SECURITY FAILURE PRESERVED
  // ==========================================================

  {
    const {
      state,
      dependencies,
    } =
      createDependencies();

    state.transportResult =
      {
        success:
          false,

        cancelled:
          false,

        errorCode:
          "STALE_BACKUP",

        error:
          "This FINORA backup is older than the current Branch Credential authority.",
      } as never;

    const result =
      await handleFinoraPortableBranchAuthRestoreIpcRequest(
        trustedMainEvent,
        request,
        dependencies,
      );

    assert(
      !result.success &&
      result.errorCode ===
        "STALE_BACKUP",
      "O3A security failure code must be preserved.",
    );

    pass(
      "Restore IPC preserves sanitized downstream stale/future/scope security failures",
    );
  }

  // ==========================================================
  // UNEXPECTED THROW SANITIZED
  // ==========================================================

  {
    const {
      state,
      dependencies,
    } =
      createDependencies();

    state.throwFromTransport =
      true;

    const result =
      await handleFinoraPortableBranchAuthRestoreIpcRequest(
        trustedMainEvent,
        request,
        dependencies,
      );

    assert(
      !result.success &&
      result.errorCode ===
        "SERVICE_FAILURE",
      "Unexpected transport throw must sanitize.",
    );

    assert(
      !result.error.includes(
        "sensitive internal transport detail",
      ),
      "Unexpected internal error detail leaked.",
    );

    pass(
      "unexpected native Restore failure is sanitized at IPC boundary",
    );
  }

  console.log(
    "PASS: 5.6O-O3B Portable Branch Auth Restore IPC executable proof",
  );
}

void main().then(
  () => {
    app.quit();
  },
  (
    error:
      unknown,
  ) => {
    console.error(
      error,
    );

    process.exitCode =
      1;

    app.quit();
  },
);