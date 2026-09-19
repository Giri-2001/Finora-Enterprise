// ============================================================
// FINORA ENTERPRISE OS
// USB REPLACEMENT SELECTION AUTHORITY SELF-TEST
// PHASE : 5.6M-1C1
// ============================================================

import {
  resolve,
} from "node:path";

import {
  isFinoraUsbReplacementDriveRoot,
  selectFinoraUsbReplacementRootPair,
} from "./finoraPortableBranchAuthUsbReplacementSelectionAuthority.js";

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

function driveRoot(
  drive:
    string,
): string {
  return resolve(
    `${drive}:\\`,
  );
}

// ============================================================
// SELFTEST
// ============================================================

async function runSelfTest(): Promise<void> {
  if (
    process.platform !==
      "win32"
  ) {
    throw new Error(
      "USB replacement drive-root proof is Windows-specific.",
    );
  }

  const sourceRoot =
    driveRoot(
      "Q",
    );

  const targetRoot =
    driveRoot(
      "R",
    );

  assert(
    isFinoraUsbReplacementDriveRoot(
      sourceRoot,
    ),
    "Valid Windows drive root was rejected.",
  );

  assert(
    !isFinoraUsbReplacementDriveRoot(
      `${sourceRoot}FINORA`,
    ),
    "Nested directory was accepted as a USB drive root.",
  );

  console.log(
    "PASS: selection authority accepts drive roots and rejects nested paths",
  );

  // ==========================================================
  // VALID DISTINCT PAIR
  // ==========================================================

  const selections = [
    sourceRoot,
    targetRoot,
  ];

  const validatedRoots:
    string[] =
      [];

  const pair =
    await selectFinoraUsbReplacementRootPair({
      selectDirectory:
        async () =>
          selections.shift() ??
          null,

      validateUsbRoot:
        async (
          root,
        ) => {
          validatedRoots.push(
            root,
          );

          return (
            root ===
              sourceRoot ||
            root ===
              targetRoot
          );
        },
    });

  assert(
    pair.success &&
    !pair.cancelled &&
    pair.sourceUsbRoot ===
      sourceRoot &&
    pair.targetUsbRoot ===
      targetRoot,
    "Valid distinct USB root pair was not accepted.",
  );

  assert(
    validatedRoots.length ===
      2,
    "Both selected USB roots were not validated.",
  );

  console.log(
    "PASS: distinct SOURCE and TARGET roots require validator approval",
  );

  // ==========================================================
  // SOURCE CANCEL
  // ==========================================================

  let targetRequestedAfterSourceCancel =
    false;

  const sourceCancel =
    await selectFinoraUsbReplacementRootPair({
      selectDirectory:
        async (
          purpose,
        ) => {
          if (
            purpose ===
              "TARGET"
          ) {
            targetRequestedAfterSourceCancel =
              true;
          }

          return null;
        },

      validateUsbRoot:
        async () =>
          true,
    });

  assert(
    sourceCancel.success &&
    sourceCancel.cancelled &&
    !targetRequestedAfterSourceCancel,
    "Source cancellation did not terminate selection safely.",
  );

  console.log(
    "PASS: SOURCE cancellation stops before TARGET selection",
  );

  // ==========================================================
  // NESTED SOURCE REJECT
  // ==========================================================

  let nestedSourceValidatorCalled =
    false;

  const nestedSource =
    await selectFinoraUsbReplacementRootPair({
      selectDirectory:
        async () =>
          `${sourceRoot}FINORA`,

      validateUsbRoot:
        async () => {
          nestedSourceValidatorCalled =
            true;

          return true;
        },
    });

  assert(
    !nestedSource.success &&
    nestedSource.errorCode ===
      "INVALID_USB_ROOT" &&
    !nestedSourceValidatorCalled,
    "Nested source path did not fail before USB validation.",
  );

  console.log(
    "PASS: nested directory cannot become replacement USB authority",
  );

  // ==========================================================
  // VALIDATOR REJECT
  // ==========================================================

  const rejectedRoot =
    await selectFinoraUsbReplacementRootPair({
      selectDirectory:
        async () =>
          sourceRoot,

      validateUsbRoot:
        async () =>
          false,
    });

  assert(
    !rejectedRoot.success &&
    rejectedRoot.errorCode ===
      "INVALID_USB_ROOT",
    "Unapproved drive root was accepted.",
  );

  console.log(
    "PASS: drive root rejected when main-process USB validator denies it",
  );

  // ==========================================================
  // SAME SOURCE / TARGET REJECT
  // ==========================================================

  const sameSelections = [
    sourceRoot,
    sourceRoot,
  ];

  const sameRoot =
    await selectFinoraUsbReplacementRootPair({
      selectDirectory:
        async () =>
          sameSelections.shift() ??
          null,

      validateUsbRoot:
        async () =>
          true,
    });

  assert(
    !sameRoot.success &&
    sameRoot.errorCode ===
      "SAME_USB_ROOT",
    "Same SOURCE and TARGET USB root was accepted.",
  );

  console.log(
    "PASS: SOURCE and TARGET must be different USB roots",
  );

  // ==========================================================
  // SELECTION FAILURE
  // ==========================================================

  const selectionFailure =
    await selectFinoraUsbReplacementRootPair({
      selectDirectory:
        async () => {
          throw new Error(
            "Synthetic native dialog failure.",
          );
        },

      validateUsbRoot:
        async () =>
          true,
    });

  assert(
    !selectionFailure.success &&
    selectionFailure.errorCode ===
      "SELECTION_FAILED",
    "Native selection failure did not fail closed.",
  );

  console.log(
    "PASS: native directory-selection failure fails closed",
  );

  console.log(
    "PASS: 5.6M-1C1 privileged USB root selection authority executable proof",
  );
}

runSelfTest()
  .then(
    () => {
      process.exitCode =
        0;
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

      process.exitCode =
        1;
    },
  );