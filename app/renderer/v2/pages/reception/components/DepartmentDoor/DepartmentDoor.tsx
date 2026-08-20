/* ===========================================================
   FINORA ENTERPRISE OS™

   RECEPTION™

   DEPARTMENT DOOR™

   IMPORTANT
   -----------------------------------------------------------
   - Responsive geometry comes ONLY from Responsive Engine.
   - Theme appearance comes ONLY from FINORA Theme Engine.
   - Premium module icons come from the installed Lucide system.
   - Reception cards intentionally show only:
       1. Premium icon
       2. Department title
   - Subtitle and status presentation are removed from the card.
=========================================================== */


/* ===========================================================
   IMPORTS
=========================================================== */

import {
  useState,
} from "react";

import {
  UsersRound,
  Banknote,
  CreditCard,
  NotebookTabs,
  ChartNoAxesCombined,
  Settings,
} from "lucide-react";

import {
  useResponsive,
} from "../../../../utils/responsive";

import {
  useTheme,
} from "../../../../themes/hooks";

import type {
  DepartmentDoorProps,
} from "./types";

import {
  createDepartmentDoorStyles,
} from "./styles";

import {
  DOOR_HOVER_TRANSFORM,
  DOOR_NORMAL_TRANSFORM,
  DOOR_TRANSITION,
  ICON_HOVER_TRANSFORM,
  ICON_NORMAL_TRANSFORM,
} from "./constants";


/* ===========================================================
   PREMIUM RECEPTION ICON
=========================================================== */

function getReceptionIcon(
  doorId:
    string,
) {

  switch (
    doorId
      .trim()
      .toLowerCase()
  ) {

    case "customers":

      return (
        <UsersRound
          aria-hidden="true"
          strokeWidth={1.9}
        />
      );


    case "loans":

      return (
        <Banknote
          aria-hidden="true"
          strokeWidth={1.9}
        />
      );


    case "collections":

      return (
        <CreditCard
          aria-hidden="true"
          strokeWidth={1.9}
        />
      );


    case "accounts":

      return (
        <NotebookTabs
          aria-hidden="true"
          strokeWidth={1.9}
        />
      );


    case "reports":

      return (
        <ChartNoAxesCombined
          aria-hidden="true"
          strokeWidth={1.9}
        />
      );


    case "settings":

      return (
        <Settings
          aria-hidden="true"
          strokeWidth={1.9}
        />
      );


    default:

      return null;

  }

}


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
     THEME ENGINE
  ========================================================= */

  const {
    theme,
  } = useTheme();


  /* =========================================================
     LOCAL INTERACTION STATE
  ========================================================= */

  const [
    hovered,
    setHovered,
  ] = useState(false);


  const [
    opening,
    setOpening,
  ] = useState(false);


  /* =========================================================
     RESPONSIVE + THEME STYLES
  ========================================================= */

  const {

    containerStyle,

    iconStyle,

    contentStyle,

    titleStyle,

  } =
    createDepartmentDoorStyles(
      tokens,
      theme,
    );


  /* =========================================================
     ROOT STATE
  ========================================================= */

  const rootStyle = {

    ...containerStyle,

    transform:
      opening
        ? DOOR_HOVER_TRANSFORM
        : hovered
          ? DOOR_HOVER_TRANSFORM
          : DOOR_NORMAL_TRANSFORM,

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
     PREMIUM ICON
  ========================================================= */

  const receptionIcon =
    getReceptionIcon(
      door.id,
    );


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
         PREMIUM MODULE ICON
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

        {receptionIcon}

      </div>


      {/* =====================================================
         DEPARTMENT TITLE
      ===================================================== */}

      <div
        style={contentStyle}
      >

        <h3
          style={titleStyle}
        >

          {door.title}

        </h3>

      </div>


    </section>

  );

}


/* ===========================================================
   END
=========================================================== */