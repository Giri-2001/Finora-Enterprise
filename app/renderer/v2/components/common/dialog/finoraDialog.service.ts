// ============================================================
// FINORA ENTERPRISE OS™
//
// GLOBAL PREMIUM DIALOG SERVICE
//
// ============================================================

export type FinoraDialogKind =
  | "success"
  | "error"
  | "warning"
  | "info"
  | "confirm";

export interface FinoraDialogOptions {
  message: unknown;

  kind?: FinoraDialogKind;

  heading?: string;

  confirmLabel?: string;

  cancelLabel?: string;

  showCancel?: boolean;

  dismissible?: boolean;
}

export interface FinoraDialogRequest {
  id: number;

  message: string;

  kind: FinoraDialogKind;

  heading: string;

  confirmLabel: string;

  cancelLabel: string;

  showCancel: boolean;

  dismissible: boolean;

  resolve: (confirmed: boolean) => void;
}

type FinoraDialogSubscriber = (
  request: FinoraDialogRequest,
) => void;

type FinoraAlertOptions =
  Omit<
    FinoraDialogOptions,
    "message" | "showCancel"
  >;

type FinoraConfirmOptions =
  Omit<
    FinoraDialogOptions,
    "message" | "kind" | "showCancel"
  >;

const DEFAULT_HEADINGS:
  Record<FinoraDialogKind, string> = {
    success: "Success",
    error: "Action Failed",
    warning: "Attention",
    info: "Information",
    confirm: "Please Confirm",
  };

let requestSequence = 0;

let activeSubscriber:
  FinoraDialogSubscriber | null = null;

const pendingRequests:
  FinoraDialogRequest[] = [];

function normalizeMessage(
  message: unknown,
): string {
  if (message instanceof Error) {
    return message.message;
  }

  if (
    message === undefined ||
    message === null
  ) {
    return "";
  }

  return String(message);
}

function publishRequest(
  request: FinoraDialogRequest,
): void {
  if (!activeSubscriber) {
    pendingRequests.push(request);

    return;
  }

  activeSubscriber(request);
}

export function subscribeFinoraDialogs(
  subscriber: FinoraDialogSubscriber,
): () => void {
  activeSubscriber = subscriber;

  while (pendingRequests.length > 0) {
    const request =
      pendingRequests.shift();

    if (request) {
      subscriber(request);
    }
  }

  return () => {
    if (activeSubscriber === subscriber) {
      activeSubscriber = null;
    }
  };
}

export function showFinoraDialog(
  options: FinoraDialogOptions,
): Promise<boolean> {
  const kind =
    options.kind ?? "info";

  return new Promise<boolean>(
    (resolve) => {
      requestSequence += 1;

      publishRequest({
        id: requestSequence,

        message:
          normalizeMessage(options.message),

        kind,

        heading:
          options.heading ??
          DEFAULT_HEADINGS[kind],

        confirmLabel:
          options.confirmLabel ?? "OK",

        cancelLabel:
          options.cancelLabel ?? "Cancel",

        showCancel:
          options.showCancel ??
          kind === "confirm",

        dismissible:
          options.dismissible ?? false,

        resolve,
      });
    },
  );
}

export async function finoraAlert(
  message: unknown,
  options: FinoraAlertOptions = {},
): Promise<void> {
  await showFinoraDialog({
    ...options,

    message,

    showCancel: false,
  });
}

export async function finoraSuccess(
  message: unknown,
  options: FinoraAlertOptions = {},
): Promise<void> {
  await finoraAlert(
    message,
    {
      ...options,

      kind: "success",
    },
  );
}

export async function finoraError(
  message: unknown,
  options: FinoraAlertOptions = {},
): Promise<void> {
  await finoraAlert(
    message,
    {
      ...options,

      kind: "error",
    },
  );
}

export async function finoraWarning(
  message: unknown,
  options: FinoraAlertOptions = {},
): Promise<void> {
  await finoraAlert(
    message,
    {
      ...options,

      kind: "warning",
    },
  );
}

export function finoraConfirm(
  message: unknown,
  options: FinoraConfirmOptions = {},
): Promise<boolean> {
  return showFinoraDialog({
    ...options,

    message,

    kind: "confirm",

    showCancel: true,
  });
}

// ============================================================
// END
// ============================================================
