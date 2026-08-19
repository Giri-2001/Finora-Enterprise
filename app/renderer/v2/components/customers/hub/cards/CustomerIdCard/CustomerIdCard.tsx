/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER ID CARD™

   PREMIUM IDENTITY CARD COMPONENT

   Module  : Customer Hub
   Layer   : Cards
   Version : 2.2
   Status  : Production

   RESPONSIBILITY:
   - Customer identity presentation
   - Consume resolved Customer Responsive Engine tokens
   - Premium customer card presentation
   - Customer photo presentation
   - Customer status presentation

   IMPORTANT:
   - No viewport detection inside this component
   - No independent responsive dimensions
   - No breakpoint resolution inside this component
   - Responsive values come from the parent responsive layer
   - Standard / compact presentation remains supported
   - Parent responsive layer owns viewport resolution
=========================================================== */


/* ===========================================================
   IMPORTS
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
  createCardStyle,
  createStatusHeaderStyle,
  createCompanyStyle,
  createPhotoStyle,
  createNameStyle,
  createCustomerIdStyle,
  createKycStyle,
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

  responsiveTokens,

  compact = false,

}: CustomerIdCardProps) {


  /* =========================================================
     COMPATIBILITY

     The compact prop remains part of the public component API.

     Customer Hanger currently uses compact presentation.

     Responsive geometry itself is NOT decided by this flag.
     Geometry comes exclusively from the resolved
     Customer Responsive Engine token set.
  ========================================================= */

  void compact;


  /* =========================================================
     RESPONSIVE TOKEN CONTRACT

     IMPORTANT:

     CustomerIdCard does NOT:

     - inspect window.innerWidth
     - resolve breakpoints
     - select mobile tokens
     - select tablet tokens
     - select laptop tokens
     - select desktop tokens

     The parent responsive layer resolves the correct token
     set and passes it through responsiveTokens.

     This keeps the Customer Responsive Engine as the single
     source of truth.
  ========================================================= */

  if (!responsiveTokens) {

    return null;

  }


  /* =========================================================
     RESPONSIVE STYLE CONTRACTS
  ========================================================= */

  const resolvedCardStyle =
    createCardStyle(
      responsiveTokens,
    );


  const resolvedStatusHeaderStyle =
    createStatusHeaderStyle(
      responsiveTokens,
    );


  const resolvedCompanyStyle =
    createCompanyStyle(
      responsiveTokens,
    );


  const resolvedPhotoStyle =
    createPhotoStyle(
      responsiveTokens,
    );


  const resolvedNameStyle =
    createNameStyle(
      responsiveTokens,
    );


  const resolvedCustomerIdStyle =
    createCustomerIdStyle(
      responsiveTokens,
    );


  const resolvedKycStyle =
    createKycStyle(
      responsiveTokens,
    );


  /* =========================================================
     CARD PRESENTATION

     The responsive width / height contract is owned by
     CustomerHanger.

     CustomerIdCard only consumes the resolved token set
     for its internal presentation geometry.
  ========================================================= */

  const presentationCardStyle = {

    ...resolvedCardStyle,

    boxSizing:
      "border-box" as const,

    position:
      "relative" as const,

  };


  /* =========================================================
     STATUS COLOR
  ========================================================= */

  const statusColor =
    kycVerified
      ? "#16A34A"
      : "#DC2626";


  /* =========================================================
     UI
  ========================================================= */

  return (

    <article

      data-finora-customer-card="true"

      style={
        presentationCardStyle
      }

    >

      {/* =====================================================
          PREMIUM LAMINATE LAYER
      ===================================================== */}

      <div

        style={{

          position:
            "relative",

          zIndex:
            2,

          display:
            "flex",

          flexDirection:
            "column",

          width:
            "100%",

          height:
            "100%",

          minWidth:
            0,

          boxSizing:
            "border-box",

        }}

      >

        {/* =================================================
            STATUS STRIP
        ================================================= */}

        <div

          style={{

            ...resolvedStatusHeaderStyle,

            background:
              statusColor,

            flexShrink:
              0,

          }}

        />


        {/* =================================================
            FINORA BRAND
        ================================================= */}

        <div

          style={
            resolvedCompanyStyle
          }

        >

          {BRAND_NAME}

        </div>


        {/* =================================================
            COMPANY NAME
        ================================================= */}

        <div

          style={{

            marginTop:
              responsiveTokens.spacing.small,

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

            color:
              "#FFFFFF",

            fontSize:
  `${responsiveTokens.customerCards.companySize}px`,

            fontWeight:
              700,

            letterSpacing:
              ".8px",

            textTransform:
              "uppercase",

            padding:
              `${responsiveTokens.spacing.small}px ${responsiveTokens.spacing.inline}px`,

            textAlign:
              "center",

            boxSizing:
              "border-box",

            width:
              "100%",

            minWidth:
              0,

            whiteSpace:
              "nowrap",

            overflow:
              "visible",

            textOverflow:
              "clip",

            flexShrink:
              0,

          }}

        >

          {COMPANY_NAME}

        </div>


        {/* =================================================
            PROFILE PHOTO
        ================================================= */}

        <div

          style={{

            ...resolvedPhotoStyle,

            flexShrink:
              0,

          }}

        >

          {profilePhoto ? (

            <img

              src={
                profilePhoto
              }

              alt={
                customerName || "Customer"
              }

              style={{

                width:
                  "100%",

                height:
                  "100%",

                objectFit:
                  "cover",

                objectPosition:
                  "center",

                borderRadius:
                  "50%",

                display:
                  "block",

              }}

            />

          ) : (

            <img

              src={
                finoraLogo
              }

              alt="FINORA"

              style={{

                width:
                  "72%",

                height:
                  "72%",

                objectFit:
                  "contain",

                objectPosition:
                  "center",

                display:
                  "block",

              }}

            />

          )}

        </div>


        {/* =================================================
            CUSTOMER NAME + PHONE
        ================================================= */}

        <div

          style={
            resolvedNameStyle
          }

        >

          {customerName || "Unknown"}


          {/* ===============================================
              PHONE
          =============================================== */}

          <div

            style={{

              width:
                "100%",

              minWidth:
                0,

              boxSizing:
                "border-box",

              display:
                "block",

              textAlign:
                "center",

              fontSize:
                 `${responsiveTokens.customerCards.phoneSize}px`,

              fontWeight:
                600,

              color:
                "#374151",

              marginTop:
                responsiveTokens.spacing.small,

              lineHeight:
                responsiveTokens.lineHeight.compact,

              overflow:
                "hidden",

              textOverflow:
                "ellipsis",

              whiteSpace:
                "nowrap",

            }}

          >

            📞 {phoneNumber || "—"}

          </div>

        </div>


        {/* =================================================
            CUSTOMER ID
        ================================================= */}

        <div

          style={
            resolvedCustomerIdStyle
          }

        >

          {customerId}

        </div>


        {/* =================================================
            CUSTOMER STATUS
        ================================================= */}

        <div

          style={
            resolvedKycStyle
          }

        >

          ● {kycVerified
            ? "KYC Verified"
            : "KYC Pending"}

        </div>

      </div>

    </article>

  );

}


/* ===========================================================
   END
=========================================================== */