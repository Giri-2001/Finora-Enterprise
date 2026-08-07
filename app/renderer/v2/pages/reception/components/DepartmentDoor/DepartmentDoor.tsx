/* ===========================================================
   FINORA ENTERPRISE OS™
   RECEPTION™

   DEPARTMENT DOOR™
=========================================================== */

import {
  useState,
} from "react";


import {

  buildDoorStatus,

} from "./helpers";


import type {

  DepartmentDoorProps,

} from "./types";


import {

  containerStyle,
  iconStyle,
  contentStyle,
  titleStyle,
  subtitleStyle,
  statusStyle,

} from "./styles";

import {
 DOOR_HOVER_SHADOW,
 DOOR_HOVER_TRANSFORM,
 DOOR_NORMAL_TRANSFORM,
 DOOR_TRANSITION,
 ICON_HOVER_TRANSFORM,
 ICON_NORMAL_TRANSFORM,
 STATUS_HOVER_GLOW,
} from "./constants";

import "./DepartmentDoor.css";


/* ===========================================================
   COMPONENT
=========================================================== */

export default function DepartmentDoor({

  door,

  onClick,

}: DepartmentDoorProps) {


  const [hovered,setHovered] =
    useState(false);

    const [opening,setOpening] =
useState(false);


  const status =
    buildDoorStatus(
      door,
    );


  return (

    <section


      style={{

        ...containerStyle,


        transform:

opening

?

"translateY(-12px) scale(1.08)"

:

hovered

?

"translateY(-8px) scale(1.02)"

:

"translateY(0) scale(1)",


boxShadow:

opening

?

"0 0 0 rgba(0,0,0,0)"

:

hovered

?

"0 12px 25px rgba(0,0,0,.25)"

:

containerStyle.boxShadow,

border:

hovered

?

"2px solid #D4AF37"

:

"2px solid rgba(212,175,55,.75)",


      }}


      onMouseEnter={() => {

        setHovered(true);

      }}


      onMouseLeave={() => {

        setHovered(false);

      }}


      onClick={() => {




  if (

    status.enabled &&

    onClick

  )

  {


    setOpening(true);


    setTimeout(() => {


      onClick(

        door,

      );


    },450);


  }


}}


    >


<div

style={{

  ...iconStyle,


 transform:

opening

?

"translateY(-8px) scale(1.18)"

:

hovered

?

"translateY(-4px) scale(1.10)"

:

"translateY(0) scale(1)",


  transition:

    "transform .35s cubic-bezier(.22,1,.36,1)",


}}

>
  {door.icon}

</div>



      <div style={contentStyle}>


        <h3 style={titleStyle}>


          {door.title}


        </h3>



        <p style={subtitleStyle}>


          {door.subtitle}


        </p>


      </div>



      <div


        style={{

 ...statusStyle,

 color:
 status.color,

 boxShadow:

hovered

?
"0 0 18px rgba(34,197,94,.45)"

:

"none",

}}


      >


        🔒 {status.label}


      </div>



    </section>

  );

}
