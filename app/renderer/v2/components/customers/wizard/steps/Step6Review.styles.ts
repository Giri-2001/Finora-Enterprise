/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER WIZARD
   STEP 6 — REVIEW
   PRESENTATION STYLES

   IMPORTANT:

   - Responsive geometry is owned by the Step 6 Review
     Responsive Engine.
   - This file contains only presentation adapters and
     compatibility exports.
   - No local breakpoints.
   - No media queries.
   - No viewport detection.
=========================================================== */

import type {
  CSSProperties,
} from "react";

import type {
  ReviewResponsiveTokens,
} from "../../../../utils/responsive/customers/review/review.tokens";

import {
  DEFAULT_REVIEW_TOKENS,
} from "../../../../utils/responsive/customers/review/review.tokens";

import {
  createStep6ReviewWorkspaceStyle,
  createStep6ReviewColumnStyle,
  createStep6ReviewActionPanelStyle,
  createStep6ReviewDraftAreaStyle,
  createStep6ReviewActionAreaStyle,
  createStep6ReviewResponsiveStyle,
} from "../../../../utils/responsive/customers/review/review.layout";


/* ===========================================================
   RESOLVED STYLE FACTORY
=========================================================== */

export function createStep6ReviewStyles(
  tokens:
    ReviewResponsiveTokens,
) {

  return {

    workspaceStyle:
      createStep6ReviewWorkspaceStyle(
        tokens,
      ),

    leftColumnStyle:
      createStep6ReviewColumnStyle(),

    rightColumnStyle:
      createStep6ReviewColumnStyle(),

    actionPanelStyle:
      createStep6ReviewActionPanelStyle(
        tokens,
      ),

    draftAreaStyle:
      createStep6ReviewDraftAreaStyle(),

    actionAreaStyle:
      createStep6ReviewActionAreaStyle(),

    responsiveStyle:
      createStep6ReviewResponsiveStyle(),

  };

}


/* ===========================================================
   DEFAULT COMPATIBILITY EXPORTS

   These keep older imports working. Runtime responsive
   presentation must use createStep6ReviewStyles().
=========================================================== */

const DEFAULT_STYLES =
  createStep6ReviewStyles(
    DEFAULT_REVIEW_TOKENS,
  );


export const workspaceStyle:
  CSSProperties =
    DEFAULT_STYLES.workspaceStyle;


export const leftColumnStyle:
  CSSProperties =
    DEFAULT_STYLES.leftColumnStyle;


export const rightColumnStyle:
  CSSProperties =
    DEFAULT_STYLES.rightColumnStyle;


export const actionPanelStyle:
  CSSProperties =
    DEFAULT_STYLES.actionPanelStyle;


export const draftAreaStyle:
  CSSProperties =
    DEFAULT_STYLES.draftAreaStyle;


export const actionAreaStyle:
  CSSProperties =
    DEFAULT_STYLES.actionAreaStyle;


export const responsiveStyle:
  CSSProperties =
    DEFAULT_STYLES.responsiveStyle;


/* ===========================================================
   END
=========================================================== */