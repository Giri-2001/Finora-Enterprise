/* ===========================================================
   FINORA ENTERPRISE OS™
   RECEPTION™

   DEPARTMENT DOOR™
=========================================================== */


/* ===========================================================
   IMPORTS
=========================================================== */

import {
  useState,
} from "react";

import {
  useResponsive,
} from "../../../../utils/responsive";

import {
  buildDoorStatus,
} from "./helpers";

import type {
  DepartmentDoorProps,
} from "./types";

import {
  createDepartmentDoorStyles,
} from "./styles";

import {
  DOOR_BORDER,
  DOOR_HOVER_SHADOW,
  DOOR_HOVER_TRANSFORM,
  DOOR_NORMAL_TRANSFORM,
  DOOR_TRANSITION,
  ICON_HOVER_TRANSFORM,
  ICON_NORMAL_TRANSFORM,
  STATUS_HOVER_GLOW,
} from "./constants";

import "./DepartmentDoor.css";


/* ===========================================================
   COMPONENT
=========================================================== */

export default function DepartmentDoor({

  door,

  onClick,

}: DepartmentDoorProps) {


  /* =========================================================
     RESPONSIVE ENGINE
  ========================================================= */

  const {
    tokens,
  } = useResponsive();


  /* =========================================================
     LOCAL INTERACTION STATE
  ========================================================= */

  const [hovered, setHovered] =
    useState(false);

  const [opening, setOpening] =
    useState(false);


  /* =========================================================
     DOOR STATUS
  ========================================================= */

  const status =
    buildDoorStatus(
      door,
    );


  /* =========================================================
     RESPONSIVE STYLES
  ========================================================= */

  const {

    containerStyle,

    iconStyle,

    contentStyle,

    titleStyle,

    subtitleStyle,

    statusStyle,

  } =
    createDepartmentDoorStyles(
      tokens,
    );


  /* =========================================================
     ROOT STATE STYLES
  ========================================================= */

  const rootStyle = {

    ...containerStyle,

    transform:
      opening
        ? DOOR_HOVER_TRANSFORM
        : hovered
          ? DOOR_HOVER_TRANSFORM
          : DOOR_NORMAL_TRANSFORM,

    boxShadow:
      opening
        ? "0 0 0 rgba(0,0,0,0)"
        : hovered
          ? DOOR_HOVER_SHADOW
          : containerStyle.boxShadow,

    border:
      `${tokens.border.strongWidth}px solid ${DOOR_BORDER}`,

    transition:
      DOOR_TRANSITION,

  };


  /* =========================================================
     ICON STATE
  ========================================================= */

  const currentIconTransform =
    opening
      ? ICON_HOVER_TRANSFORM
      : hovered
        ? ICON_HOVER_TRANSFORM
        : ICON_NORMAL_TRANSFORM;


  /* =========================================================
     STATUS STATE
  ========================================================= */

  const currentStatusShadow =
    hovered
      ? STATUS_HOVER_GLOW
      : "none";


  /* =========================================================
     RENDER
  ========================================================= */

  return (

    <section

      style={rootStyle}

      onMouseEnter={() => {

        setHovered(true);

      }}

      onMouseLeave={() => {

        setHovered(false);

      }}

      onClick={() => {

        if (

          !status.enabled ||

          !onClick

        ) {

          return;

        }


        setOpening(true);


        setTimeout(() => {

          onClick(
            door,
          );

        }, 450);

      }}

    >


      {/* =====================================================
         ICON
      ===================================================== */}

      <div

        style={{

          ...iconStyle,

          transform:
            currentIconTransform,

          transition:
            DOOR_TRANSITION,

        }}

      >

        {door.icon}

      </div>


      {/* =====================================================
         CONTENT
      ===================================================== */}

      <div
        style={contentStyle}
      >

        <h3
          style={titleStyle}
        >

          {door.title}

        </h3>


        <p
          style={subtitleStyle}
        >

          {door.subtitle}

        </p>

      </div>


      {/* =====================================================
         STATUS
      ===================================================== */}

      <div

        style={{

          ...statusStyle,

          color:
            status.color,

          boxShadow:
            currentStatusShadow,

        }}

      >

        🔒 {status.label}

      </div>


    </section>

  );

}


/* ===========================================================
   END
=========================================================== */