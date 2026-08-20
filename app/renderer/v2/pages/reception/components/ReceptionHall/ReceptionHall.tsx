/* ===========================================================
   FINORA ENTERPRISE OS™

   RECEPTION™

   RECEPTION HALL™
=========================================================== */


/* ===========================================================
   IMPORTS
=========================================================== */

import finoraLogo
  from "../../../../app/assets/finoraenterprise.png";

import {
  useResponsive,
} from "../../../../utils/responsive";

import {
  useTheme,
} from "../../../../themes/provider";

import DepartmentDoor
  from "../DepartmentDoor";

import {
  getReceptionDoors,
} from "./helpers";

import type {
  DepartmentDoor as DepartmentDoorModel,
} from "../../types";

import type {
  ReceptionHallProps,
} from "./types";

import {
  createReceptionHallStyles,
} from "./styles";


/* ===========================================================
   COMPONENT
=========================================================== */

export default function ReceptionHall({

  onDoorClick,

}: Partial<ReceptionHallProps>) {


  /* =========================================================
     RESPONSIVE ENGINE
  ========================================================= */

  const {
    tokens,
  } = useResponsive();


  /* =========================================================
     FINORA THEME ENGINE
  ========================================================= */

  const {
    theme,
  } = useTheme();


  /* =========================================================
     DEPARTMENT DOORS
  ========================================================= */

  const doors:
    DepartmentDoorModel[] =
    getReceptionDoors();


  /* =========================================================
     RESPONSIVE + THEME STYLES
  ========================================================= */

  const {

    containerStyle,

    doorGridStyle,

    wallStyle,

    wallLogoStyle,

    wallTitleStyle,

    wallDividerStyle,

    wallSubtitleStyle,

  } =
    createReceptionHallStyles(
      tokens,
      theme,
    );


  /* =========================================================
     RENDER
  ========================================================= */

  return (

    <section style={containerStyle}>


      {/* =====================================================
          FEATURE WALL
      ===================================================== */}

      <section style={wallStyle}>

        <img

          src={finoraLogo}

          alt="FINORA"

          style={wallLogoStyle}

        />


        <h1 style={wallTitleStyle}>

          FINORA ENTERPRISE™

        </h1>


        <div style={wallDividerStyle} />


        <p style={wallSubtitleStyle}>

          Enterprise Reception Headquarters

        </p>

      </section>


      {/* =====================================================
          DEPARTMENT DOORS
      ===================================================== */}

      <section style={doorGridStyle}>

        {doors.map((door) => (

          <DepartmentDoor

            key={door.id}

            door={door}

            onClick={onDoorClick}

          />

        ))}

      </section>



    </section>

  );

}


/* ===========================================================
   END
=========================================================== */