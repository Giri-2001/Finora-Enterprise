/* ===========================================================
   FINORA ENTERPRISE OS™
   CUSTOMER CARD FLIP
   -----------------------------------------------------------
   Module  : Customer Hub
   Layer   : Cards
   Version : 2.0
   Status  : Production
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
  containerStyle,
  innerStyle,
  frontStyle,
  backStyle,
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

  const duration =
    buildDuration(
      animationDuration,
    );

  const depth =
    buildPerspective(
      perspective,
    );

  const rotation =
    isFlipped(flipped)
      ? DEFAULT_ROTATION
      : 0;

  const rootStyle: CSSProperties = {

    ...containerStyle,

    perspective: `${depth}px`,

  };

  const flipStyle: CSSProperties = {

    ...innerStyle,

    transition: `transform ${duration}ms ease`,

    transform: `rotateY(${rotation}deg)`,

  };

  return (

    <div
      style={rootStyle}
      onClick={onFlip}
    >

      <div style={flipStyle}>

        <div style={frontStyle}>

          {front}

        </div>

        <div style={backStyle}>

          {back}

        </div>

      </div>

    </div>

  );

}
