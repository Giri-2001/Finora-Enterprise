// ============================================================
// FINORA ENTERPRISE OS™
//
// COLLECTION STUDIO™
//
// RESPONSIVE RESOLVER
//
// RESPONSIBILITY:
//
// - Connect FINORA Global Responsive Engine
// - Resolve Collection Studio module tokens
// - Expose one stable responsive contract
// - Keep breakpoint selection outside UI components
//
// ARCHITECTURE:
//
// Global Responsive Engine
//          ↓
//     tokens.meta.viewport
//          ↓
// Collection Studio Responsive Tokens
//          ↓
// Collection Studio Components
//
// IMPORTANT:
//
// - No local breakpoint detection
// - No window.innerWidth
// - No local responsive state
// - No theme colours
// - No business logic
// - No UI rendering
//
// VERSION : 1.0
// STATUS  : Production
// ============================================================


// ============================================================
// IMPORTS
// ============================================================

import {
  useResponsive,
} from "../index";


import {
  COLLECTION_STUDIO_TOKENS,
  type CollectionStudioResponsiveTokens,
} from "./collectionStudio.tokens";


// ============================================================
// VIEWPORT TYPE
// ============================================================

export type CollectionStudioViewport =
  | "mobile"
  | "tablet"
  | "laptop"
  | "desktop";


// ============================================================
// TOKEN RESOLVER
// ============================================================
//
// The Global Responsive Engine owns viewport detection.
//
// This function ONLY maps the already-resolved viewport
// identity to Collection Studio's dedicated token set.
// ============================================================

export function getCollectionStudioTokens(
  viewport:
    CollectionStudioViewport,
): CollectionStudioResponsiveTokens {

  return (
    COLLECTION_STUDIO_TOKENS[
      viewport
    ]
  );

}


// ============================================================
// HOOK
// ============================================================
//
// Collection Studio components should normally consume:
//
//   useCollectionStudioResponsive()
//
// rather than resolving viewport information themselves.
// ============================================================

export function useCollectionStudioResponsive() {

  const {
    tokens,
  } =
    useResponsive();


  const viewport =
    tokens.meta.viewport as CollectionStudioViewport;


  const collectionStudioTokens =
    getCollectionStudioTokens(
      viewport,
    );


  return {

    viewport,

    tokens:
      collectionStudioTokens,

    globalTokens:
      tokens,

  };

}


// ============================================================
// DEFAULT EXPORT
// ============================================================

export default useCollectionStudioResponsive;


// ============================================================
// END
// ============================================================