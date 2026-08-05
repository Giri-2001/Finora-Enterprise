/* ===========================================================
   FINORA ENTERPRISE OS™
   CUSTOMER DEPARTMENT HEADER™

   COMPONENT
=========================================================== */

import type {
  CustomerDepartmentHeaderProps,
} from "./types";

import {

  DEPARTMENT_NAME,

  DEPARTMENT_SUBTITLE,

} from "./constants";

import {

  containerStyle,

  departmentStyle,

  subtitleStyle,

} from "./styles";

/* ===========================================================
   COMPONENT
=========================================================== */

export default function CustomerDepartmentHeader({

  adminName,

}: CustomerDepartmentHeaderProps) {

  return (

    <section style={containerStyle}>

      {/* ==========================================
          DEPARTMENT
      ========================================== */}

      <h1 style={departmentStyle}>

        {DEPARTMENT_NAME}

      </h1>

      {/* ==========================================
          SUBTITLE
      ========================================== */}

      <p style={subtitleStyle}>

        {DEPARTMENT_SUBTITLE}

      </p>

    </section>

  );

}
