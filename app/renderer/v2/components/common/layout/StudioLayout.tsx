/* ===========================================================
FINORA ENTERPRISE OS™

STUDIO LAYOUT™

GLOBAL RESPONSIVE SHELL
=========================================================== */


import type {

  CSSProperties,

  ReactNode,

} from "react";


import GlobalHeader
from "../header/GlobalHeader";



/* ===========================================================
TYPES
=========================================================== */


interface StudioLayoutProps {

  children: ReactNode;

  department?: string;

  allowScroll?: boolean;

}



/* ===========================================================
ROOT
=========================================================== */


const layoutStyle: CSSProperties = {


  width: "100%",


  height: "100vh",


  minHeight: 0,


  minWidth: 0,


  maxWidth: "100%",


  margin: 0,


  background:"#321B12",


  display:"flex",


  flexDirection:"column",


  overflow:"hidden",


};




/* ===========================================================
   CONTENT BUILDER
=========================================================== */

function buildContentStyle(
  allowScroll:boolean,
):CSSProperties {

return {

flex:1,

width:"100%",

padding:

allowScroll

  ? "16px"

  : "0",

boxSizing:"border-box",

overflowX:"hidden",

overflowY:
allowScroll
  ? "auto"
  : "hidden",

display:"flex",

flexDirection:"column",

gap:

allowScroll

  ? "16px"

  : "0px",

minHeight:0,

};

}




/* ===========================================================
COMPONENT
=========================================================== */


export default function StudioLayout({


  children,


  department="Reception",


  allowScroll=true,


}:StudioLayoutProps){



return (


<main

style={layoutStyle}

>


  <GlobalHeader

    department={department}

  />



  <section

    style={buildContentStyle(

      allowScroll,

    )}

  >


    {children}


  </section>



</main>


);


}
