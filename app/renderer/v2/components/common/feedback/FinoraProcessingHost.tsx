// ============================================================
// FINORA ENTERPRISE OS™
//
// GLOBAL PREMIUM PROCESSING HOST
//
// RESPONSIBILITY:
//
// - Subscribe to FINORA global processing state
// - Render the canonical FINORA Premium Loader
// - Keep processing presentation centralized
//
// IMPORTANT:
//
// - No business logic
// - No module-specific async logic
// - GlobalLoadingOverlay owns presentation
// ============================================================

import {
  useEffect,
  useState,
} from "react";

import GlobalLoadingOverlay
  from "./GlobalLoadingOverlay";

import {
  subscribeFinoraProcessing,
  type FinoraProcessingRequest,
} from "./finoraProcessing.service";

// ============================================================
// COMPONENT
// ============================================================

export default function FinoraProcessingHost() {
  const [
    activeRequest,
    setActiveRequest,
  ] =
    useState<FinoraProcessingRequest | null>(
      null,
    );

  useEffect(() => {
    return subscribeFinoraProcessing(
      setActiveRequest,
    );
  }, []);

  if (!activeRequest) {
    return null;
  }

  return (
    <GlobalLoadingOverlay
      message={
        activeRequest.message
      }
    />
  );
}

// ============================================================
// END
// ============================================================
