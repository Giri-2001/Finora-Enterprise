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


import type {
  CustomerCardFlipResponsiveDimensions,
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
     CARD SURFACE
     ---------------------------------------------------------
     CustomerHanger already owns the resolved customer-card
     geometry.

     CustomerCardFlip only acts as the flip mechanism.

     IMPORTANT:
     - No independent card sizing
     - No independent radius
     - No responsive breakpoint logic
     - No outer card layout ownership
  ========================================================= */

  const responsiveCard:
    CustomerCardFlipResponsiveDimensions = {

    width:
      "100%",

    height:
      "100%",

    radius:
      0,

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
     FLIP STYLES
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
     ---------------------------------------------------------
     Only the flip mechanism owns perspective.
     Customer card geometry remains with the parent.
  ========================================================= */

  const rootStyle:
    CSSProperties = {

    ...containerStyle,

    perspective:
      `${depth}px`,

  };


  /* =========================================================
     FLIP STYLE
  ========================================================= */

  const flipStyle:
    CSSProperties = {

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

      style={
        rootStyle
      }

      onClick={
        onFlip
      }

    >

      <div

        style={
          flipStyle
        }

      >

        {/* ================================================
            FRONT FACE
        ================================================ */}

        <div

          style={
            frontStyle
          }

        >

          {front}

        </div>


        {/* ================================================
            BACK FACE
        ================================================ */}

        <div

          style={
            backStyle
          }

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