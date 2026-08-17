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
     FOOTER DATA
  ========================================================= */

  const footer =
    buildReceptionFooter();


  /* =========================================================
     RESPONSIVE STYLES
  ========================================================= */

  const {

    containerStyle,

    contentStyle,

    copyrightStyle,

    versionStyle,

  } =
    createReceptionFooterStyles(
      tokens,
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