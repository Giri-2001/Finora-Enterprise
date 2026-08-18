/* ===========================================================
   FINORA ENTERPRISE OS™
   CUSTOMER CARD FLIP™

   PREMIUM CARD FLIP PRESENTATION STYLES

   RESPONSIVE:
   -----------------------------------------------------------
   All visual dimensions are supplied by the
   FINORA Responsive Engine.
=========================================================== */

import type {
  CSSProperties,
} from "react";

/* ===========================================================
   RESPONSIVE DIMENSIONS
   -----------------------------------------------------------
   These values are supplied by the component from
   utils/responsive/.
=========================================================== */

export interface CustomerCardFlipResponsiveDimensions {
  width: number | string;
  height: number | string;
  radius: number;
}

/* ===========================================================
   ROOT CONTAINER
=========================================================== */

export function createContainerStyle(
  responsive: CustomerCardFlipResponsiveDimensions,
): CSSProperties {

  return {

    position: "relative",

    width:
      typeof responsive.width === "number"
        ? `${responsive.width}px`
        : responsive.width,

    height:
      typeof responsive.height === "number"
        ? `${responsive.height}px`
        : responsive.height,

    flexShrink: 0,

  };

}

/* ===========================================================
   INNER FLIP SURFACE
=========================================================== */

export const innerStyle: CSSProperties = {

  position: "relative",

  width: "100%",

  height: "100%",

  transformStyle: "preserve-3d",

  WebkitTransformStyle:
    "preserve-3d",

};

/* ===========================================================
   SHARED CARD FACE
=========================================================== */

export function createFaceStyle(
  responsive: CustomerCardFlipResponsiveDimensions,
): CSSProperties {

  const width =
    typeof responsive.width === "number"
      ? `${responsive.width}px`
      : responsive.width;

  const height =
    typeof responsive.height === "number"
      ? `${responsive.height}px`
      : responsive.height;

  return {

    position: "absolute",

    inset: 0,

    width,

    height,

    borderRadius:
      `${responsive.radius}px`,

    overflow: "hidden",

    backfaceVisibility:
      "hidden",

    WebkitBackfaceVisibility:
      "hidden",

    transformStyle:
      "preserve-3d",

    WebkitTransformStyle:
      "preserve-3d",

    boxSizing: "border-box",

    boxShadow:
      "0 18px 42px rgba(0,0,0,.18)",

  };

}

/* ===========================================================
   FRONT
=========================================================== */

export function createFrontStyle(
  responsive: CustomerCardFlipResponsiveDimensions,
): CSSProperties {

  return {

    ...createFaceStyle(responsive),

  };

}

/* ===========================================================
   BACK
=========================================================== */

export function createBackStyle(
  responsive: CustomerCardFlipResponsiveDimensions,
): CSSProperties {

  return {

    ...createFaceStyle(responsive),

    transform:
      "rotateY(180deg)",

  };

}

/* ===========================================================
   END
=========================================================== */