/* ===========================================================
   FINORA ENTERPRISE OS™
   RECEPTION™

   PAGE
=========================================================== */

import ReceptionHall
  from "./components/ReceptionHall";

import ReceptionFooter
  from "./components/ReceptionFooter";

import type {

  DepartmentDoor,

  DepartmentId,

} from "./types";

/* ===========================================================
   TYPES
=========================================================== */

export interface ReceptionPageProps {

  onNavigate?: (
    department: DepartmentId,
  ) => void;

}

/* ===========================================================
   STYLES
=========================================================== */

const pageStyle = {

  width: "100%",

  minHeight: "100vh",

  height: "100vh",

  display: "flex",

  flexDirection: "column" as const,

  alignItems: "center",

  overflow: "hidden",

  background:
    "linear-gradient(180deg,#1E130C 0%,#5B3A22 45%,#8A6135 100%)",

};

/* ===========================================================
   COMPONENT
=========================================================== */

export default function ReceptionPage({

  onNavigate,

}: ReceptionPageProps) {

  /* ==========================================
     DOOR CLICK
  ========================================== */

  function handleDoorClick(

    door: DepartmentDoor,

  ) {

    if (

      !door.enabled ||

      !onNavigate

    ) {

      return;

    }

    onNavigate(

      door.id,

    );

  }

  return (

    <main style={pageStyle}>

      <ReceptionHall

        onDoorClick={handleDoorClick}

      />

      <ReceptionFooter />

    </main>

  );

}
