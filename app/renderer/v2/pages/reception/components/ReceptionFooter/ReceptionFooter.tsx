/* ===========================================================
   FINORA ENTERPRISE OS™

   RECEPTION™

   RECEPTION FOOTER™
=========================================================== */


/* ===========================================================
   IMPORTS
=========================================================== */

import {
  useResponsive,
} from "../../../../utils/responsive";

import {
  useTheme,
} from "../../../../themes/hooks";

import {
  buildReceptionFooter,
} from "./helpers";

import {
  createReceptionFooterStyles,
} from "./styles";


/* ===========================================================
   COMPONENT
=========================================================== */

export default function ReceptionFooter() {


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
     FOOTER DATA
  ========================================================= */

  const footer =
    buildReceptionFooter();


  /* =========================================================
     STYLES
  ========================================================= */

  const {

    containerStyle,

    contentStyle,

    copyrightStyle,

    versionStyle,

  } =
    createReceptionFooterStyles(
      tokens,
      theme,
    );


  /* =========================================================
     RENDER
  ========================================================= */

  return (

    <footer style={containerStyle}>

      <div style={contentStyle}>

        <div style={copyrightStyle}>

          {footer.copyright}

        </div>

        <div style={versionStyle}>

          {footer.version}

        </div>

      </div>

    </footer>

  );

}


/* ===========================================================
   END
=========================================================== */