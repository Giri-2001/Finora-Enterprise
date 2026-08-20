/* ===========================================================
   FINORA ENTERPRISE OS™
   ADMIN PROFILE™

   COMPONENT

   IMPORTANT
   -----------------------------------------------------------
   - Theme comes from the central FINORA Theme Engine.
   - No local theme definitions.
   - No hard-coded theme colors.
   - Responsive geometry remains outside this component.
=========================================================== */


/* ===========================================================
   IMPORTS
=========================================================== */

import {
  ChevronDown,
  CircleUserRound,
} from "lucide-react";


import type {
  AdminProfileProps,
} from "./types";


import {
  buildAdminName,
} from "./helpers";


import {
  useTheme,
} from "../../../../themes/provider";


import {
  createAdminProfileStyles,
} from "./styles";


/* ===========================================================
   COMPONENT
=========================================================== */

export default function AdminProfile({

  adminName,

  onClick,

}: AdminProfileProps) {


  /* =========================================================
     FINORA THEME ENGINE
  ========================================================= */

  const {
    theme,
  } =
    useTheme();


  /* =========================================================
     THEMED STYLES
  ========================================================= */

  const {

    containerStyle,

    iconStyle,

    nameStyle,

    arrowStyle,

  } =
    createAdminProfileStyles(
      theme,
    );


  /* =========================================================
     RENDER
  ========================================================= */

  return (

    <div

      style={
        containerStyle
      }

      onClick={
        onClick
      }

      title="Admin Menu"

    >

      <CircleUserRound

        size={
          22
        }

        style={
          iconStyle
        }

      />


      <span
        style={
          nameStyle
        }
      >

        {
          buildAdminName(
            adminName,
          )
        }

      </span>


      <ChevronDown

        size={
          16
        }

        style={
          arrowStyle
        }

      />

    </div>

  );

}


/* ===========================================================
   END
=========================================================== */