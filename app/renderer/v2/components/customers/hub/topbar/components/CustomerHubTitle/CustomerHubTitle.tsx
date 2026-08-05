/* ===========================================================
   FINORA ENTERPRISE OS™
   CUSTOMER HUB TITLE

   COMPONENT
=========================================================== */

import type {
  CustomerHubTitleProps,
} from "./types";

import {
  DEFAULT_TITLE,
  DEFAULT_SUBTITLE,
  HUB_VERSION,
} from "./constants";

import {
  buildTitle,
  buildSubtitle,
} from "./helpers";

import {
  containerStyle,
  titleStyle,
  subtitleStyle,
  versionStyle,
} from "./styles";

/* ===========================================================
   COMPONENT
=========================================================== */

export default function CustomerHubTitle({

  title = DEFAULT_TITLE,

  subtitle = DEFAULT_SUBTITLE,

}: CustomerHubTitleProps) {

  return (

    <section style={containerStyle}>

      <h1 style={titleStyle}>

        👥 {buildTitle(title)}

      </h1>

      <p style={subtitleStyle}>

        {buildSubtitle(subtitle)}

      </p>

      <span style={versionStyle}>

        {HUB_VERSION}

      </span>

    </section>

  );

}
