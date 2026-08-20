/* ===========================================================
   FINORA ENTERPRISE OS™

   RECEPTION™

   PAGE
=========================================================== */


/* ===========================================================
   IMPORTS
=========================================================== */

import {
  useResponsive,
} from "../../utils/responsive";

import {
  useTheme,
} from "../../themes/hooks";

import ReceptionHall
  from "./components/ReceptionHall";

import ReceptionFooter
  from "./components/ReceptionFooter";

import {
  createReceptionPageStyles,
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
     PAGE STYLES
  ========================================================= */

  const {
    pageStyle,
  } =
    createReceptionPageStyles(
      tokens,
      theme,
    );


  /* =========================================================
     DOOR CLICK
  ========================================================= */

  function handleDoorClick(

    door:
      DepartmentDoor,

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


  /* =========================================================
     RENDER
  ========================================================= */

  return (

    <main style={pageStyle}>

      <ReceptionHall

        onDoorClick={
          handleDoorClick
        }

      />

      <ReceptionFooter />

    </main>

  );

}


/* ===========================================================
   END
=========================================================== */