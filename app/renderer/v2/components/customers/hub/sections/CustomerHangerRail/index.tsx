/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER HANGER RAIL™

   COMPONENT ENTRY POINT

   RESPONSIBILITY:
   - Re-export the production CustomerHangerRail component
   - Preserve the existing module entry point
   - Keep responsive decisions out of this index module

   IMPORTANT:
   - Responsive values are resolved by CustomerHangerRail.tsx
   - No breakpoint logic belongs here
   - No responsive dimensions belong here
=========================================================== */


/* ===========================================================
   COMPONENT
=========================================================== */

export {
  default,
} from "./CustomerHangerRail";


/* ===========================================================
   END
=========================================================== */