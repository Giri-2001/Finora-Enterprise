/* ============================================================
   FINORA ENTERPRISE OS™

   CUSTOMER ID CARD CAPTURE HOOK™

   RESPONSIBILITY:
   - Mount the existing CustomerIdCardCapture boundary
   - Keep a deterministic DOM target per Customer ID
   - Delegate PNG generation to the capture service
   - Return PNG Base64 to the caller

   IMPORTANT:
   - No Notification persistence
   - No filesystem access
   - No Electron IPC
   - No provider logic
   - No duplicate Customer ID Card markup
   - Capture target is resolved by Customer ID
============================================================ */

import {
  useCallback,
  useRef,
} from "react";

import type {
  CustomerProfile,
} from "../../../../../types/customers";

import CustomerIdCardCapture, {
  DEFAULT_CAPTURE_WIDTH,
  DEFAULT_CAPTURE_HEIGHT,
} from "./CustomerIdCardCapture";

import {
  captureCustomerIdCardPng,
  pngDataUrlToBase64,
} from "../../../../../services/notifications/artifacts/customerIdCardCaptureService";

/* ============================================================
   TYPES
============================================================ */

export type CustomerIdCardCaptureHookResult =
  | {
      success: true;

      contentBase64: string;
    }
  | {
      success: false;

      error: string;
    };

export interface CustomerIdCardCaptureIdentity {
  companyName:
    string;

  branchName:
    string;
}

/* ============================================================
   HOOK
============================================================ */

export function useCustomerIdCardCapture() {
  const captureTargets =
    useRef<
      Map<string, HTMLElement>
    >(
      new Map(),
    );

  /* ==========================================================
     REGISTER TARGET
  ========================================================== */

  const registerCaptureTarget =
    useCallback(
      (
        customerId:
          string,
      ) =>
        (
          node:
            HTMLDivElement | null,
        ): void => {
          const normalizedCustomerId =
            String(
              customerId ?? "",
            ).trim();

          if (!normalizedCustomerId) {
            return;
          }

          if (node) {
            captureTargets.current.set(
              normalizedCustomerId,
              node,
            );

            return;
          }

          captureTargets.current.delete(
            normalizedCustomerId,
          );
        },
      [],
    );

  /* ==========================================================
     CAPTURE
  ========================================================== */

  const capture =
    useCallback(
      async (
        customer:
          CustomerProfile,
      ): Promise<
        CustomerIdCardCaptureHookResult
      > => {
        const customerId =
          customer.identity.customerId
            ?.trim();

        if (!customerId) {
          return {
            success: false,

            error:
              "Customer ID is required for Customer ID Card capture.",
          };
        }

        const captureTarget =
          captureTargets.current.get(
            customerId,
          );

        if (!captureTarget) {
          return {
            success: false,

            error:
              "Customer ID Card capture target is not mounted.",
          };
        }

        const result =
          await captureCustomerIdCardPng(
            captureTarget,
          );

        if (!result.success) {
          return result;
        }

        try {
          return {
            success: true,

            contentBase64:
              pngDataUrlToBase64(
                result.dataUrl,
              ),
          };
        } catch (error) {
          return {
            success: false,

            error:
              error instanceof Error
                ? error.message
                : "Unable to extract Customer ID Card PNG data.",
          };
        }
      },
      [],
    );

  /* ==========================================================
     CAPTURE NODE
  ========================================================== */

  const captureNode =
    useCallback(
      (
        customer:
          CustomerProfile,

        identity:
          CustomerIdCardCaptureIdentity,
      ) => {
        const customerId =
          customer.identity.customerId
            ?.trim();

        const companyName =
          identity.companyName.trim();

        const branchName =
          identity.branchName.trim();

        if (
          !customerId ||
          !companyName ||
          !branchName
        ) {
          return null;
        }

        return (
          <div
            ref={
              registerCaptureTarget(
                customerId,
              )
            }
            data-finora-customer-id-card-capture-host="true"
            data-finora-customer-id={
              customerId
            }
            style={{
              position:
                "fixed",

              left:
                "-100000px",

              top:
                "0",

              width:
                `${DEFAULT_CAPTURE_WIDTH}px`,

              height:
                `${DEFAULT_CAPTURE_HEIGHT}px`,

              overflow:
                "hidden",

              pointerEvents:
                "none",

              visibility:
                "visible",

              margin:
                "0",

              padding:
                "0",

              zIndex:
                -1,
            }}
          >
            <CustomerIdCardCapture
              customer={
                customer
              }

              companyName={
                  companyName
                }

                branchName={
                  branchName
                }
            />
          </div>
        );
      },
      [
          registerCaptureTarget,
        ],
    );

  return {
    capture,

    captureNode,
  };
}

/* ============================================================
   END
============================================================ */

