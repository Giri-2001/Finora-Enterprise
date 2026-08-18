/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER CARD FLIP™

   PREMIUM CARD FLIP COMPONENT

   RESPONSIVE ENGINE CONSUMER
=========================================================== */

/* ===========================================================
   IMPORTS
=========================================================== */

import type {
  CSSProperties,
} from "react";

import {
  useResponsive,
} from "../../../../../utils/responsive";

import type {
  CustomerCardFlipProps,
} from "./types";

import {
  DEFAULT_ROTATION,
} from "./constants";

import {
  buildDuration,
  buildPerspective,
  isFlipped,
} from "./helpers";

import {
  createContainerStyle,
  innerStyle,
  createFrontStyle,
  createBackStyle,
} from "./styles";

/* ===========================================================
   COMPONENT
=========================================================== */

export default function CustomerCardFlip({

  front,

  back,

  flipped = false,

  animationDuration,

  perspective,

  onFlip,

}: CustomerCardFlipProps) {

  /* =========================================================
     RESPONSIVE ENGINE
  ========================================================= */

  const {
    tokens,
  } = useResponsive();


  /* =========================================================
     RESPONSIVE CARD DIMENSIONS
  ========================================================= */

  const responsiveCard = {

    /*
      Customer card radius comes from the centralized
      customerCards responsive token group.

      Width / height are intentionally resolved by the
      CustomerCardFlip style factory so the component itself
      does not contain viewport-specific sizing decisions.
    */

    width:
      tokens.customerCards.width ||
      "100%",

    height:
      tokens.card.minHeight > 0
        ? tokens.card.minHeight
        : "100%",

    radius:
      tokens.customerCards.radius,

  };


  /* =========================================================
     ANIMATION
  ========================================================= */

  const duration =
    buildDuration(
      animationDuration,
    );


  /* =========================================================
     PERSPECTIVE
  ========================================================= */

  const depth =
    buildPerspective(
      perspective,
    );


  /* =========================================================
     ROTATION
  ========================================================= */

  const rotation =
    isFlipped(flipped)
      ? DEFAULT_ROTATION
      : 0;


  /* =========================================================
     RESPONSIVE STYLES
  ========================================================= */

  const containerStyle =
    createContainerStyle(
      responsiveCard,
    );


  const frontStyle =
    createFrontStyle(
      responsiveCard,
    );


  const backStyle =
    createBackStyle(
      responsiveCard,
    );


  /* =========================================================
     ROOT STYLE
  ========================================================= */

  const rootStyle: CSSProperties = {

    ...containerStyle,

    perspective:
      `${depth}px`,

  };


  /* =========================================================
     FLIP STYLE
  ========================================================= */

  const flipStyle: CSSProperties = {

    ...innerStyle,

    transition:
      `transform ${duration}ms ease`,

    transform:
      `rotateY(${rotation}deg)`,

  };


  /* =========================================================
     RENDER
  ========================================================= */

  return (

    <div
      style={rootStyle}
      onClick={onFlip}
    >

      <div
        style={flipStyle}
      >

        {/* ================================================
            FRONT FACE
        ================================================ */}

        <div
          style={frontStyle}
        >

          {front}

        </div>


        {/* ================================================
            BACK FACE
        ================================================ */}

        <div
          style={backStyle}
        >

          {back}

        </div>

      </div>

    </div>

  );

}


/* ===========================================================
   END
=========================================================== */