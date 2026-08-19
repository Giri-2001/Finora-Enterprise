/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER CARD FLIP™

   MODULE:
   Customer Hub / Cards

   VERSION:
   2.1

   STATUS:
   Production

   RESPONSIBILITY:
   - Customer card flip contract
   - Accept resolved card geometry
   - No breakpoint logic
   - No responsive calculations
=========================================================== */


/* ===========================================================
   IMPORTS
=========================================================== */

import type {
  ReactNode,
} from "react";


/* ===========================================================
   RESPONSIVE CARD GEOMETRY
=========================================================== */

/*
 * IMPORTANT:
 *
 * These dimensions are already resolved by the
 * Customer Responsive Engine.
 *
 * CustomerCardFlip does NOT calculate:
 *
 * - breakpoints
 * - device widths
 * - card widths
 * - card heights
 * - responsive scaling
 *
 * It only consumes the resolved geometry.
 */

export interface CustomerCardFlipDimensions {

  width:
    number |
    string;

  height:
    number |
    string;

  radius:
    number;

}


/* ===========================================================
   CUSTOMER CARD FLIP PROPS
=========================================================== */

export interface CustomerCardFlipProps {

  /* ---------------------------------------------------------
     CARD FACES
  --------------------------------------------------------- */

  front:
    ReactNode;

  back:
    ReactNode;


  /* ---------------------------------------------------------
     RESOLVED RESPONSIVE GEOMETRY
  --------------------------------------------------------- */

  dimensions?:
    CustomerCardFlipDimensions;


  /* ---------------------------------------------------------
     FLIP STATE
  --------------------------------------------------------- */

  flipped?:
    boolean;


  /* ---------------------------------------------------------
     ANIMATION
  --------------------------------------------------------- */

  animationDuration?:
    number;

  perspective?:
    number;


  /* ---------------------------------------------------------
     CALLBACK
  --------------------------------------------------------- */

  onFlip?:
    () => void;

}


/* ===========================================================
   END
=========================================================== */