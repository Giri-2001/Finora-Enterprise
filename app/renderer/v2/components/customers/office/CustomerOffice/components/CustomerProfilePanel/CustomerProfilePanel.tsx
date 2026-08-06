/* ===========================================================
   FINORA ENTERPRISE OS™
   CUSTOMER PROFILE PANEL™

   COMPONENT
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
  containerStyle,
  headerStyle,
  companyStyle,
  subtitleStyle,
  bodyStyle,
  imageStyle,
  nameStyle,
  idStyle,
  statusStyle,
} from "./styles";

/* ===========================================================
   COMPONENT
=========================================================== */

export default function CustomerProfilePanel({

  customer,

}: CustomerProfilePanelProps) {

  const statusColors =
    getStatusColors(customer);

  return (

    <section style={containerStyle}>

      {/* ======================================
          HEADER
      ====================================== */}

      <header style={headerStyle}>

        <div style={companyStyle}>

          {COMPANY_NAME}

        </div>

        <div style={subtitleStyle}>

          {COMPANY_SUBTITLE}

        </div>

      </header>

      {/* ======================================
          BODY
      ====================================== */}

      <div style={bodyStyle}>

        <img

          src={getProfileImage(customer)}

          alt={customer.name}

          style={{

            ...imageStyle,

            objectFit:
              getImageFit(customer),

            padding:
              getImagePadding(customer),

          }}

        />

                <div style={nameStyle}>

          {customer.name}

        </div>

        <div style={idStyle}>

          {customer.id}

        </div>

        <div

          style={{

            ...statusStyle,

            background:
              statusColors.background,

            color:
              statusColors.color,

          }}

        >

          {getCustomerStatus(customer)}

        </div>

      </div>

    </section>

  );

}
