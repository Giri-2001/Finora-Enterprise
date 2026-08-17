/* ===========================================================
   FINORA ENTERPRISE OS™
   RECEPTION™

   PAGE
=========================================================== */

import ReceptionHall
  from "./components/ReceptionHall";

import ReceptionFooter
  from "./components/ReceptionFooter";

import {
  pageStyle,
} from "./styles";

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

/* ===========================================================
   END
=========================================================== */