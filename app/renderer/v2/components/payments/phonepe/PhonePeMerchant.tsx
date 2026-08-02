/* ===========================================================
   FINORA ENTERPRISE V2
   PAYMENT GATEWAY ENGINE
   PHONEPE INTEGRATION STUDIO
   PHONEPE MERCHANT
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface PhonePeMerchantProps {

  merchantId?: string;

  merchantName?: string;

  environment?: string;

  integrationStatus?: string;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function PhonePeMerchant({

  merchantId = "--",

  merchantName = "--",

  environment = "Sandbox",

  integrationStatus = "Not Connected",

}: PhonePeMerchantProps) {

  return (

    <SummaryCard title="PhonePe Merchant">

      <span>

        Merchant ID :
        <strong> {merchantId}</strong>

      </span>

      <span>

        Merchant Name :
        <strong> {merchantName}</strong>

      </span>

      <span>

        Environment :
        <strong> {environment}</strong>

      </span>

      <span>

        Status :
        <strong> {integrationStatus}</strong>

      </span>

    </SummaryCard>

  );

}
