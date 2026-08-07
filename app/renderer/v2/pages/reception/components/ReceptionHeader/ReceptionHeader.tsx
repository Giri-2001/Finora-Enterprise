/* ===========================================================
   FINORA ENTERPRISE OS™
   RECEPTION™

   RECEPTION HEADER™
=========================================================== */

import finoraLogo
  from "../../../../app/assets/finoraenterprise.png";

import {

  buildReceptionHeader,

} from "./helpers";

import {

  containerStyle,
  logoStyle,
  titleStyle,
  subtitleStyle,
  descriptionStyle,
  versionStyle,

} from "./styles";

/* ===========================================================
   COMPONENT
=========================================================== */

export default function ReceptionHeader() {

  const header =
    buildReceptionHeader();

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
