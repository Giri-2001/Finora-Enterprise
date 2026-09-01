/* ============================================================
   FINORA ENTERPRISE OS™

   CUSTOMER ID CARD CAPTURE SERVICE™

   RESPONSIBILITY:
   - Capture an already-rendered CustomerIdCard DOM node
   - Use html-to-image for PNG generation
   - Keep capture separate from Notification persistence

   IMPORTANT:
   - No Customer persistence
   - No Notification persistence
   - No filesystem access
   - No Electron IPC
   - No provider logic
   - No responsive breakpoint logic
   - No theme ownership
   - Caller supplies the already-rendered capture node
============================================================ */

/* ============================================================
   IMPORTS
============================================================ */

import {
  toPng,
} from "html-to-image";

/* ============================================================
   RESULT TYPES
============================================================ */

export type CustomerIdCardCaptureResult =
  | {
      success: true;

      dataUrl: string;
    }
  | {
      success: false;

      error: string;
    };

/* ============================================================
   PNG DATA URL → BASE64
============================================================ */

export function pngDataUrlToBase64(
  dataUrl: string,
): string {
  const normalized =
    String(dataUrl ?? "").trim();

  const separator =
    normalized.indexOf(",");

  if (
    separator < 0 ||
    !normalized.startsWith("data:image/png;base64,")
  ) {
    throw new Error(
      "Invalid PNG data URL returned by Customer ID Card capture.",
    );
  }

  const base64 =
    normalized.slice(separator + 1).trim();

  if (!base64) {
    throw new Error(
      "Customer ID Card capture returned empty PNG data.",
    );
  }

  return base64;
}

/* ============================================================
   CAPTURE
============================================================ */

export async function captureCustomerIdCardPng(
  node: HTMLElement,
): Promise<CustomerIdCardCaptureResult> {
  if (!(node instanceof HTMLElement)) {
    return {
      success: false,

      error:
        "Customer ID Card capture target is unavailable.",
    };
  }

  try {
    /* --------------------------------------------------------
       Wait for browser fonts.
    -------------------------------------------------------- */

    if ("fonts" in document) {
      try {
        await document.fonts.ready;
      } catch {
        /* Best-effort only. */
      }
    }

    /* --------------------------------------------------------
       Allow the browser to complete layout/paint.
    -------------------------------------------------------- */

    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          resolve();
        });
      });
    });

    const dataUrl =
      await toPng(
        node,
        {
          cacheBust: true,

          pixelRatio: 2,

          backgroundColor: "transparent",
        },
      );

    if (
      typeof dataUrl !== "string" ||
      !dataUrl.startsWith("data:image/png;base64,")
    ) {
      return {
        success: false,

        error:
          "Customer ID Card capture did not return a valid PNG.",
      };
    }

    return {
      success: true,

      dataUrl,
    };
  } catch (error) {
    return {
      success: false,

      error:
        error instanceof Error
          ? error.message
          : "Unable to capture Customer ID Card as PNG.",
    };
  }
}

/* ============================================================
   END
============================================================ */
