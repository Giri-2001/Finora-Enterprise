/* ===========================================================
   FINORA ENTERPRISE OS™
   RECEPTION™

   RECEPTION HALL™
=========================================================== */

import finoraLogo
  from "../../../../app/assets/finoraenterprise.png";

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

  containerStyle,
  doorGridStyle,
  wallStyle,
  floorStyle,

} from "./styles";

/* ===========================================================
   COMPONENT
=========================================================== */

export default function ReceptionHall({

  onDoorClick,

}: Partial<ReceptionHallProps>) {

  const doors: DepartmentDoorModel[] =
    getReceptionDoors();

  return (

    <section style={containerStyle}>

      {/* ======================================
          FEATURE WALL
      ====================================== */}

      <section style={wallStyle}>

        <img

          src={finoraLogo}

          alt="FINORA"

          style={{

            width: 56,

            marginBottom: 8,

          }}

        />

        <h1

          style={{

            color: "#F8FAFC",

            fontSize: 24,

            margin: 0,

            fontWeight: 800,

            letterSpacing: 1,

          }}

        >

          FINORA ENTERPRISE™

        </h1>

        <div

          style={{

            width: "260px",

            height: "2px",

            background:
              "linear-gradient(90deg,transparent,#D4AF37,transparent)",

            marginTop: "10px",

          }}

        />

        <p

          style={{

            color: "#E5E7EB",

            marginTop: 4,

            fontSize: 12,

          }}

        >

          Enterprise Reception Headquarters

        </p>

      </section>

      {/* ======================================
          DEPARTMENT DOORS
      ====================================== */}

      <section style={doorGridStyle}>

        {doors.map((door) => (

          <DepartmentDoor

            key={door.id}

            door={door}

            onClick={onDoorClick}

          />

        ))}

      </section>

      {/* ======================================
          FLOOR LIGHT
      ====================================== */}

      <section style={floorStyle} />

    </section>

  );

}
