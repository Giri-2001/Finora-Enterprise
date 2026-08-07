/* ===========================================================
   FINORA ENTERPRISE OS™
   RECEPTION™

   RECEPTION FOOTER™
=========================================================== */

import {

  buildReceptionFooter,

} from "./helpers";

import {

  containerStyle,
  copyrightStyle,
  versionStyle,
  statusStyle,

} from "./styles";

/* ===========================================================
   COMPONENT
=========================================================== */

export default function ReceptionFooter() {

  const footer =
    buildReceptionFooter();

  return (

    <footer style={containerStyle}>

      <div style={copyrightStyle}>

        {footer.copyright}

      </div>

      <div style={versionStyle}>

        {footer.version}

      </div>

      <div style={statusStyle}>

        🟢 {footer.status}

      </div>

    </footer>

  );

}
