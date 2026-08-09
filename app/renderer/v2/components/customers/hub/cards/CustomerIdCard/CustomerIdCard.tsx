/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER ID CARD™

   PREMIUM IDENTITY CARD COMPONENT

   Module  : Customer Hub
   Layer   : Cards
   Version : 2.0
   Status  : Production

   Presentation:
   - Standard Identity Card → 350px
   - Customer Hub Compact   → 315px
=========================================================== */

import finoraLogo
  from "../../../../../app/assets/finoraenterprise.png";

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

  compact = false,

}: CustomerIdCardProps) {

  /* =========================================================
     STATUS
  ========================================================= */

  const statusColor =
    kycVerified
      ? "#16A34A"
      : "#DC2626";

  /* =========================================================
     CARD HEIGHT

     Standard:
       350px

     Customer Hub:
       315px

     We keep the default card height untouched so
     Identity Studio and other future usages remain
     independent from Customer Hub presentation.
  ========================================================= */

  const presentationCardStyle = {

    ...cardStyle,

    height:
      compact
        ? "290px"
        : "350px",

  };

  /* =========================================================
     UI
  ========================================================= */

  return (

    <article
      data-finora-customer-card="true"
      style={{

        ...presentationCardStyle,

        position: "relative",

      }}
    >

      {/* =====================================================
          PREMIUM LAMINATE LAYER
      ===================================================== */}

      <div
        style={{

          position: "relative",

          zIndex: 2,

          display: "flex",

          flexDirection: "column",

          height: "100%",

          boxSizing: "border-box",

        }}
      >

        {/* =================================================
            STATUS STRIP
        ================================================= */}

        <div
          style={{

            ...statusHeaderStyle,

            background:
              statusColor,

          }}
        />

        {/* =================================================
            FINORA BRAND
        ================================================= */}

        <div
          style={companyStyle}
        >

          {BRAND_NAME}

        </div>

        {/* =================================================
            COMPANY NAME
        ================================================= */}

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

            color: "#FFFFFF",

            fontSize: "10px",

            fontWeight: 700,

            letterSpacing: ".8px",

            textTransform: "uppercase",

            padding: "5px 8px",

            textAlign: "center",

          }}
        >

          {COMPANY_NAME}

        </div>

        {/* =================================================
            PROFILE PHOTO
        ================================================= */}

        <div
          style={photoStyle}
        >

          {profilePhoto ? (

            <img
              src={profilePhoto}
              alt={customerName}
              style={{

                width: "100%",

                height: "100%",

                objectFit: "cover",

                objectPosition: "center",

                borderRadius: "50%",

                display: "block",

              }}
            />

          ) : (

            <img
              src={finoraLogo}
              alt="FINORA"
              style={{

                width: "72%",

                height: "72%",

                objectFit: "contain",

                objectPosition: "center",

                display: "block",

              }}
            />

          )}

        </div>

        {/* =================================================
            CUSTOMER NAME + PHONE
        ================================================= */}

        <div
          style={nameStyle}
        >

          {customerName || "Unknown"}

          <div
            style={{

              textAlign: "center",

              fontSize: "12px",

              fontWeight: 600,

              color: "#374151",

              marginTop: "6px",

            }}
          >

            📞 {phoneNumber || "—"}

          </div>

        </div>

        {/* =================================================
            CUSTOMER ID
        ================================================= */}

        <div
          style={customerIdStyle}
        >

          {customerId}

        </div>

        {/* =================================================
            CUSTOMER STATUS
        ================================================= */}

        <div
          style={{

            margin: "10px auto 0",

            padding: "4px 12px",

            borderRadius: "999px",

            background: "#DCFCE7",

            color: "#166534",

            fontSize: "10px",

            fontWeight: 700,

          }}
        >

          ● Active Customer

        </div>

      </div>

    </article>

  );

}
