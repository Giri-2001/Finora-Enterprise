/* ===========================================================
   FINORA ENTERPRISE OS™

   RECEPTION™

   RECEPTION HALL™
=========================================================== */


/* ===========================================================
   IMPORTS
=========================================================== */

import {
  useResponsive,
} from "../../../../utils/responsive";

import {
  useTheme,
} from "../../../../themes/provider";
import {
  getSession,
} from "../../../../store/authStore";

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
   RECEPTION GREETING
=========================================================== */

function resolveReceptionGreeting(
  hour: number,
): string {

  if (hour < 12) {
    return "Good Morning";
  }

  if (hour < 17) {
    return "Good Afternoon";
  }

  return "Good Evening";
}

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
     OWNER GREETING
  ========================================================= */

  const session =
    getSession();

  const ownerFullName =
    session?.fullName?.trim() ?? "";

  const greeting =
    resolveReceptionGreeting(
      new Date().getHours(),
    );

  const ownerGreeting =
    ownerFullName
      ? `${greeting}, ${ownerFullName}`
      : greeting;


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

    wallBrandRowStyle,

    wallBrandContentStyle,


    wallTitleStyle,

    wallDividerStyle,

    wallGreetingStyle,

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

                        <div style={wallBrandRowStyle}>


          <div style={wallBrandContentStyle}>

            <h1 style={wallTitleStyle}>

              FINORA ENTERPRISE

            </h1>


            <div style={wallDividerStyle} />


            <p style={wallGreetingStyle}>

              {ownerGreeting}

            </p>


            <p style={wallSubtitleStyle}>

              Welcome back to FINORA

            </p>

          </div>

        </div>

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