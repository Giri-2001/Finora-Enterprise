// ============================================================
// FINORA ENTERPRISE OS
// PORTABLE BRANCH AUTH USB REPLACEMENT SELECTION AUTHORITY
// PHASE : 5.6M-1C1
// ============================================================
//
// Renderer never supplies filesystem roots.
//
// Native main-process selection provides candidate directories.
// This authority accepts only:
// - absolute drive roots
// - roots approved by the injected USB-root validator
// - distinct SOURCE and TARGET roots
//
// ============================================================

import {
  parse,
  resolve,
} from "node:path";

// ============================================================
// CONTRACT
// ============================================================

export type FinoraUsbReplacementSelectionPurpose =
  | "SOURCE"
  | "TARGET";

export interface FinoraUsbReplacementSelectionDependencies {
  selectDirectory:
    (
      purpose:
        FinoraUsbReplacementSelectionPurpose,
    ) =>
      Promise<
        string |
        null |
        undefined
      >;

  validateUsbRoot:
    (
      root:
        string,
    ) =>
      Promise<boolean>;
}

export type FinoraUsbReplacementSelectionErrorCode =
  | "SELECTION_FAILED"
  | "INVALID_USB_ROOT"
  | "SAME_USB_ROOT";

export type FinoraUsbReplacementRootSelectionResult =
  | {
      success:
        true;

      cancelled:
        true;

      root:
        null;

      errorCode:
        null;

      error:
        null;
    }
  | {
      success:
        true;

      cancelled:
        false;

      root:
        string;

      errorCode:
        null;

      error:
        null;
    }
  | {
      success:
        false;

      cancelled:
        false;

      root:
        null;

      errorCode:
        FinoraUsbReplacementSelectionErrorCode;

      error:
        string;
    };

export type FinoraUsbReplacementRootPairResult =
  | {
      success:
        true;

      cancelled:
        true;

      sourceUsbRoot:
        null;

      targetUsbRoot:
        null;

      errorCode:
        null;

      error:
        null;
    }
  | {
      success:
        true;

      cancelled:
        false;

      sourceUsbRoot:
        string;

      targetUsbRoot:
        string;

      errorCode:
        null;

      error:
        null;
    }
  | {
      success:
        false;

      cancelled:
        false;

      sourceUsbRoot:
        null;

      targetUsbRoot:
        null;

      errorCode:
        FinoraUsbReplacementSelectionErrorCode;

      error:
        string;
    };

// ============================================================
// HELPERS
// ============================================================

function failure(
  errorCode:
    FinoraUsbReplacementSelectionErrorCode,
  error:
    string,
): FinoraUsbReplacementRootSelectionResult {
  return {
    success:
      false,

    cancelled:
      false,

    root:
      null,

    errorCode,

    error,
  };
}

function pairFailure(
  errorCode:
    FinoraUsbReplacementSelectionErrorCode,
  error:
    string,
): FinoraUsbReplacementRootPairResult {
  return {
    success:
      false,

    cancelled:
      false,

    sourceUsbRoot:
      null,

    targetUsbRoot:
      null,

    errorCode,

    error,
  };
}

function rootsEqual(
  left:
    string,
  right:
    string,
): boolean {
  if (
    process.platform ===
      "win32"
  ) {
    return (
      left.toLowerCase() ===
      right.toLowerCase()
    );
  }

  return (
    left ===
    right
  );
}

export function isFinoraUsbReplacementDriveRoot(
  value:
    string,
): boolean {
  if (
    typeof value !==
      "string"
  ) {
    return false;
  }

  const trimmed =
    value.trim();

  if (
    trimmed.length ===
      0
  ) {
    return false;
  }

  const normalized =
    resolve(
      trimmed,
    );

  const parsedRoot =
    resolve(
      parse(
        normalized,
      ).root,
    );

  return rootsEqual(
    normalized,
    parsedRoot,
  );
}

// ============================================================
// SINGLE ROOT SELECTION
// ============================================================

export async function selectFinoraUsbReplacementRoot(
  purpose:
    FinoraUsbReplacementSelectionPurpose,
  dependencies:
    FinoraUsbReplacementSelectionDependencies,
): Promise<
  FinoraUsbReplacementRootSelectionResult
> {
  let selected:
    string |
    null |
    undefined;

  try {
    selected =
      await dependencies.selectDirectory(
        purpose,
      );
  }
  catch {
    return failure(
      "SELECTION_FAILED",
      "Unable to select replacement USB root.",
    );
  }

  if (
    selected ===
      null ||
    selected ===
      undefined ||
    selected.trim().length ===
      0
  ) {
    return {
      success:
        true,

      cancelled:
        true,

      root:
        null,

      errorCode:
        null,

      error:
        null,
    };
  }

  const normalized =
    resolve(
      selected.trim(),
    );

  if (
    !isFinoraUsbReplacementDriveRoot(
      normalized,
    )
  ) {
    return failure(
      "INVALID_USB_ROOT",
      "Selected location must be the root of an approved USB drive.",
    );
  }

  let approved:
    boolean;

  try {
    approved =
      await dependencies.validateUsbRoot(
        normalized,
      );
  }
  catch {
    return failure(
      "SELECTION_FAILED",
      "Unable to validate selected USB root.",
    );
  }

  if (
    !approved
  ) {
    return failure(
      "INVALID_USB_ROOT",
      "Selected location is not an approved USB root.",
    );
  }

  return {
    success:
      true,

    cancelled:
      false,

    root:
      normalized,

    errorCode:
      null,

    error:
      null,
  };
}

// ============================================================
// SOURCE + TARGET PAIR
// ============================================================

export async function selectFinoraUsbReplacementRootPair(
  dependencies:
    FinoraUsbReplacementSelectionDependencies,
): Promise<
  FinoraUsbReplacementRootPairResult
> {
  const source =
    await selectFinoraUsbReplacementRoot(
      "SOURCE",
      dependencies,
    );

  if (
    !source.success
  ) {
    return pairFailure(
      source.errorCode,
      source.error,
    );
  }

  if (
    source.cancelled
  ) {
    return {
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
    };
  }

  const target =
    await selectFinoraUsbReplacementRoot(
      "TARGET",
      dependencies,
    );

  if (
    !target.success
  ) {
    return pairFailure(
      target.errorCode,
      target.error,
    );
  }

  if (
    target.cancelled
  ) {
    return {
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
    };
  }

  if (
    rootsEqual(
      source.root,
      target.root,
    )
  ) {
    return pairFailure(
      "SAME_USB_ROOT",
      "Source and target USB roots must be different.",
    );
  }

  return {
    success:
      true,

    cancelled:
      false,

    sourceUsbRoot:
      source.root,

    targetUsbRoot:
      target.root,

    errorCode:
      null,

    error:
      null,
  };
}