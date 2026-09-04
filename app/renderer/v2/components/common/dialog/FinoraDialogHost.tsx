// ============================================================
// FINORA ENTERPRISE OS™
//
// GLOBAL PREMIUM DIALOG HOST
//
// ============================================================

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  createPortal,
} from "react-dom";

import {
  subscribeFinoraDialogs,
  type FinoraDialogKind,
  type FinoraDialogRequest,
} from "./finoraDialog.service";

import {
  actionRowStyle,
  backdropStyle,
  brandTitleStyle,
  cancelButtonStyle,
  cardStyle,
  createConfirmButtonStyle,
  createIconStyle,
  dialogAnimationCss,
  headingStyle,
  messageStyle,
  titleDividerStyle,
} from "./FinoraDialog.styles";

const ICON_MARKS:
  Record<FinoraDialogKind, string> = {
    success: "✓",
    error: "×",
    warning: "!",
    info: "i",
    confirm: "?",
  };

export default function FinoraDialogHost() {
  const [
    requests,
    setRequests,
  ] = useState<FinoraDialogRequest[]>([]);

  const confirmButtonRef =
    useRef<HTMLButtonElement | null>(null);

  const settlingRef =
    useRef(false);

  const activeRequest =
    requests[0] ?? null;

  useEffect(() => {
    return subscribeFinoraDialogs(
      (request) => {
        setRequests(
          (current) => {
            if (
              current.some(
                (item) =>
                  item.id === request.id,
              )
            ) {
              return current;
            }

            return [
              ...current,
              request,
            ];
          },
        );
      },
    );
  }, []);

  useEffect(() => {
    settlingRef.current = false;

    if (!activeRequest) {
      return;
    }

    const frame =
      window.requestAnimationFrame(
        () => {
          confirmButtonRef.current?.focus();
        },
      );

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [activeRequest?.id]);

  useEffect(() => {
    if (!activeRequest) {
      return;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    return () => {
      document.body.style.overflow =
        previousOverflow;
    };
  }, [activeRequest]);

  const settle =
    useCallback(
      (confirmed: boolean) => {
        if (
          !activeRequest ||
          settlingRef.current
        ) {
          return;
        }

        settlingRef.current = true;

        activeRequest.resolve(confirmed);

        setRequests(
          (current) => {
            if (
              current[0]?.id ===
              activeRequest.id
            ) {
              return current.slice(1);
            }

            return current.filter(
              (item) =>
                item.id !== activeRequest.id,
            );
          },
        );
      },
      [activeRequest],
    );

  useEffect(() => {
    if (!activeRequest) {
      return;
    }

    function handleKeyDown(
      event: KeyboardEvent,
    ): void {
      if (event.key !== "Escape") {
        return;
      }

      if (
        activeRequest.showCancel ||
        activeRequest.dismissible
      ) {
        event.preventDefault();

        settle(false);
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [activeRequest, settle]);

  if (
    !activeRequest ||
    typeof document === "undefined"
  ) {
    return null;
  }

  return createPortal(
    <>
      <style>
        {dialogAnimationCss}
      </style>

      <div
        className="finora-dialog-backdrop"
        style={backdropStyle}
        onMouseDown={(event) => {
          if (
            event.target ===
              event.currentTarget &&
            activeRequest.dismissible
          ) {
            settle(false);
          }
        }}
      >
        <section
          className="finora-dialog-card"
          style={cardStyle}
          role={
            activeRequest.showCancel
              ? "alertdialog"
              : "dialog"
          }
          aria-modal="true"
          aria-labelledby="finora-dialog-heading"
          aria-describedby="finora-dialog-message"
        >
          <div style={brandTitleStyle}>
            FINORA
          </div>

          <div style={titleDividerStyle} />

          <div
            className="finora-dialog-icon"
            style={
              createIconStyle(
                activeRequest.kind,
              )
            }
            aria-hidden="true"
          >
            <span className="finora-dialog-icon-mark">
              {
                ICON_MARKS[
                  activeRequest.kind
                ]
              }
            </span>
          </div>

          <h2
            id="finora-dialog-heading"
            style={headingStyle}
          >
            {activeRequest.heading}
          </h2>

          <p
            id="finora-dialog-message"
            style={messageStyle}
          >
            {activeRequest.message}
          </p>

          <div style={actionRowStyle}>
            {activeRequest.showCancel && (
              <button
                type="button"
                className="finora-dialog-button"
                style={cancelButtonStyle}
                onClick={() => {
                  settle(false);
                }}
              >
                {activeRequest.cancelLabel}
              </button>
            )}

            <button
              ref={confirmButtonRef}
              type="button"
              className="finora-dialog-button"
              style={
                createConfirmButtonStyle(
                  activeRequest.kind,
                )
              }
              onClick={() => {
                settle(true);
              }}
            >
              {activeRequest.confirmLabel}
            </button>
          </div>
        </section>
      </div>
    </>,
    document.body,
  );
}

// ============================================================
// END
// ============================================================
