/* ===========================================================
   FINORA ENTERPRISE OS™

   LAST PAYMENT PREVIEW™

   SMART WALL
=========================================================== */


import type {
  OfficeCustomer,
} from "../types";



interface TodayCollectionsPreviewCardProps {

  customer: OfficeCustomer;

}



/* ===========================================================
   COMPONENT
=========================================================== */


export default function TodayCollectionsPreviewCard({

  customer,

}: TodayCollectionsPreviewCardProps) {



  const lastPayment =

    customer.collections &&

    customer.collections.length > 0

      ? customer.collections[
          customer.collections.length - 1
        ]

      : undefined;



  return (

    <section

      style={{

        height: "230px",

        background: "#FFFDF9",

        border: "1px solid #D8C7A4",

        borderRadius: "22px",

        overflow: "hidden",

        boxShadow:

          "0 12px 28px rgba(15,23,42,.08)",

        display: "flex",

        flexDirection: "column",

      }}

    >


      {/* ======================================
          HEADER
      ====================================== */}


      <div

        style={{

          background:

            "linear-gradient(180deg,#6F4A23,#8A6135)",

          padding: "12px",

          textAlign: "center",

        }}

      >

        <div

          style={{

            color: "#F8E7B2",

            fontWeight: 700,

            fontSize: "18px",

          }}

        >

          Last Payment

        </div>


      </div>




      {/* ======================================
          BODY
      ====================================== */}


      <div

        style={{

          flex: 1,

          padding: "18px",

          display: "flex",

          flexDirection: "column",

          justifyContent: "flex-start",

          gap: "18px",

        }}

      >



        {/* PAYMENT AMOUNT */}


        <div>


          <div

            style={{

              color: "#8A6135",

              fontSize: "13px",

              fontWeight: 600,

              marginBottom: "6px",

            }}

          >

            Payment Amount

          </div>



          <div

            style={{

              fontSize: "30px",

              fontWeight: 700,

              color: "#1E293B",

            }}

          >

            ₹ {lastPayment?.amount ?? 0}


          </div>


        </div>





        {/* PAYMENT DATE */}


        <div>


          <div

            style={{

              color: "#8A6135",

              fontSize: "13px",

              fontWeight: 600,

              marginBottom: "4px",

            }}

          >

            Payment Date

          </div>




          <div

            style={{

              fontSize: "18px",

              fontWeight: 600,

              color: "#475569",

            }}

          >

            {lastPayment?.paymentDate || "--"}


          </div>


        </div>






        {/* FOOTER */}


        <div

          style={{

            borderTop:

              "1px solid #E8D8B6",

            paddingTop:

              "10px",

            display:

              "flex",

            justifyContent:

              "space-between",

            alignItems:

              "center",

          }}

        >


          <span

            style={{

              color: "#8A6135",

              fontSize: "13px",

              fontWeight: 600,

            }}

          >

            View Receipt

          </span>




          <span

            style={{

              color: "#8A6135",

              fontSize: "18px",

              fontWeight: 700,

              cursor: "pointer",

            }}

          >

            →

          </span>



        </div>


      </div>


    </section>


  );

}
