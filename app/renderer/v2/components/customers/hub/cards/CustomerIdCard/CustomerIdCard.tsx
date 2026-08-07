/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER ID CARD™

   PREMIUM IDENTITY CARD COMPONENT
=========================================================== */

import finoraLogo from "../../../../../app/assets/finoraenterprise.png";

import type {
  CustomerIdCardProps,
} from "./types";

import {
  BRAND_NAME,
  COMPANY_NAME,
} from "./constants";

import {
  cardStyle,
  statusHeaderStyle,
  companyStyle,
  photoStyle,
  nameStyle,
  customerIdStyle,
} from "./styles";


/* ===========================================================
   COMPONENT
=========================================================== */

export default function CustomerIdCard({

  customerId,

  customerName,

  phoneNumber,

  profilePhoto,

  kycVerified = false,

}: CustomerIdCardProps) {


  const statusColor =
    kycVerified
      ? "#16A34A"
      : "#DC2626";


  return (

    <article

      style={{

        ...cardStyle,

        position: "relative",

      }}

    >


      {/* ======================================
          PREMIUM LAMINATE EFFECT
      ====================================== */}



      <div

        style={{

          position: "relative",

          zIndex: 2,

          display: "flex",

          flexDirection: "column",

          height: "100%",

        }}

      >



        {/* ======================================
            STATUS STRIP
        ====================================== */}

        <div

          style={{

            ...statusHeaderStyle,

            background: statusColor,

          }}

        />



        {/* ======================================
            FINORA BRAND
        ====================================== */}

        <div style={companyStyle}>

          {BRAND_NAME}

        </div>



        {/* ======================================
            COMPANY NAME
        ====================================== */}

        <div

          style={{

            marginTop: "8px",

            background:
            `
            linear-gradient(
            180deg,
            #E8C778 0%,
            #B88938 45%,
            #8A612B 100%
            )
            `,

            boxShadow:
            "inset 0 1px 3px rgba(255,255,255,.5)",

            color:"#FFFFFF",

            fontSize:"10px",

            fontWeight:700,

            letterSpacing:".8px",

            textTransform:"uppercase",

            padding:"5px 8px",

            textAlign:"center",

          }}

        >

          {COMPANY_NAME}

        </div>




        {/* ======================================
            PROFILE PHOTO / DEFAULT FINORA LOGO
        ====================================== */}

        <div style={photoStyle}>


          {

            profilePhoto

            ?

            (

              <img

                src={profilePhoto}

                alt={customerName}

                style={{

                  width:"100%",

                  height:"100%",

                  objectFit:"cover",

                  objectPosition:"center",

                  borderRadius:"50%",

                  display:"block",

                }}

              />

            )

            :

            (

              <img

                src={finoraLogo}

                alt="FINORA"

                style={{

                  width:"72%",

                  height:"72%",

                  objectFit:"contain",

                  objectPosition:"center",

                  display:"block",

                }}

              />

            )

          }


        </div>




        {/* ======================================
            CUSTOMER NAME
        ====================================== */}

        <div style={nameStyle}>

          {customerName || "Unknown"}


          <div

            style={{

              textAlign:"center",

              fontSize:"12px",

              fontWeight:600,

              color:"#374151",

              marginTop:"6px",

            }}

          >

            📞 {phoneNumber || "—"}

          </div>


        </div>




        {/* ======================================
            CUSTOMER ID
        ====================================== */}

        <div style={customerIdStyle}>

          {customerId}

        </div>

        <div

style={{

margin:"10px auto 0",

padding:"4px 12px",

borderRadius:"999px",

background:"#DCFCE7",

color:"#166534",

fontSize:"10px",

fontWeight:700,

}}

>

● Active Customer

</div>



      </div>


    </article>

  );

}
