/* ===========================================================
   FINORA ENTERPRISE OS™

   RECEPTION™

   RECEPTION HEADER™
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
} from "../../../../themes/hooks";

import {
  buildReceptionHeader,
} from "./helpers";

import {
  createReceptionHeaderStyles,
} from "./styles";


/* ===========================================================
   COMPONENT
=========================================================== */

export default function ReceptionHeader() {


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
     HEADER DATA
  ========================================================= */

  const header =
    buildReceptionHeader();


  /* =========================================================
     STYLES
  ========================================================= */

  const {
    containerStyle,
    logoStyle,
    titleStyle,
    subtitleStyle,
    descriptionStyle,
    versionStyle,
  } =
    createReceptionHeaderStyles(
      tokens,
      theme,
    );


  /* =========================================================
     RENDER
  ========================================================= */

  return (

    <header style={containerStyle}>

      <img
        src={finoraLogo}
        alt={header.title}
        style={logoStyle}
      />


      <h1 style={titleStyle}>

        {header.title}

      </h1>


      <h2 style={subtitleStyle}>

        {header.subtitle}

      </h2>


      <p style={descriptionStyle}>

        {header.description}

      </p>


      <div style={versionStyle}>

        {header.version}

      </div>

    </header>

  );

}


/* ===========================================================
   END
=========================================================== */