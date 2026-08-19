/* ===========================================================
   FINORA ENTERPRISE OS™
   CUSTOMER PROFILE PANEL™

   COMPONENT
=========================================================== */


/* ===========================================================
   IMPORTS
=========================================================== */

import type {
  CustomerProfilePanelProps,
} from "./types";

import {
  COMPANY_NAME,
  COMPANY_SUBTITLE,
} from "./constants";

import {
  getProfileImage,
  getImageFit,
  getImagePadding,
  getCustomerStatus,
  getStatusColors,
} from "./helpers";

import {
  useResponsive,
} from "../../../../../../utils/responsive";

import {
  createCustomerProfilePanelStyles,
} from "./styles";


/* ===========================================================
   COMPONENT
=========================================================== */

export default function CustomerProfilePanel({

  customer,

}: CustomerProfilePanelProps) {


  /* =========================================================
     RESPONSIVE TOKENS
  ========================================================= */

  const {
    tokens,
  } = useResponsive();


  /* =========================================================
     RESPONSIVE STYLES
  ========================================================= */

  const styles =
    createCustomerProfilePanelStyles(
      tokens,
    );


  /* =========================================================
     CUSTOMER STATUS
  ========================================================= */

  const statusColors =
    getStatusColors(customer);


  /* =========================================================
     RENDER
  ========================================================= */

  return (

    <section
      style={
        styles.containerStyle
      }
    >

      {/* ======================================
          HEADER
      ====================================== */}

      <header
        style={
          styles.headerStyle
        }
      >

        <div
          style={
            styles.companyStyle
          }
        >

          {COMPANY_NAME}

        </div>


        <div
          style={
            styles.subtitleStyle
          }
        >

          {COMPANY_SUBTITLE}

        </div>

      </header>


      {/* ======================================
          BODY
      ====================================== */}

      <div
        style={
          styles.bodyStyle
        }
      >

        <img

          src={
            getProfileImage(
              customer,
            )
          }

          alt={
            customer.name
          }

          style={{

            ...styles.imageStyle,

            objectFit:
              getImageFit(
                customer,
              ),

            padding:
              getImagePadding(
                customer,
              ),

          }}

        />


        {/* ====================================
            CUSTOMER NAME
        ==================================== */}

        <div
          style={
            styles.nameStyle
          }
        >

          {customer.name}

        </div>


        {/* ====================================
            CUSTOMER ID
        ==================================== */}

        <div
          style={
            styles.idStyle
          }
        >

          {customer.id}

        </div>


        {/* ====================================
            CUSTOMER STATUS
        ==================================== */}

        <div

          style={{

            ...styles.statusStyle,

            background:
              statusColors.background,

            color:
              statusColors.color,

          }}

        >

          {
            getCustomerStatus(
              customer,
            )
          }

        </div>

      </div>

    </section>

  );

}


/* ===========================================================
   END
=========================================================== */