/* ===========================================================
   FINORA ENTERPRISE OS™

   Collections Engine

   REVIEW ACTIONS
=========================================================== */


import Button
  from "../../common/buttons/Button";


import SummaryCard
  from "../../common/cards/SummaryCard";


import {
  useCollectionController,
} from "../controller";


import {
  updateLoanOutstanding,
} from "../../../repositories/loan/loanRepository";


import {
  approveCollection,
} from "../../../services/collection/collectionService";



/* ===========================================================
   COMPONENT
=========================================================== */


export default function ReviewActions() {


  const {
    reviewData,
  } = useCollectionController();




  /* ===========================================================
     COMPLETE COLLECTION
  =========================================================== */


  async function handleCompleteCollection() {


    console.log(
      "COLLECTION LOAN ID:",
      reviewData.loanId,
    );


    console.log(
      "PAYMENT AMOUNT:",
      reviewData.paymentAmount,
    );



    if (
      !reviewData.loanId
    ) {


      alert(
        "Please select loan",
      );


      return;

    }




    if (
      !reviewData.paymentAmount ||
      reviewData.paymentAmount <= 0
    ) {


      alert(
        "Please enter collection amount",
      );


      return;

    }




    try {



      /*
        UPDATE LOAN OUTSTANDING
      */


      await updateLoanOutstanding(

        reviewData.loanId,

        reviewData.paymentAmount,

      );





      /*
        SAVE COLLECTION RECORD
      */


      await approveCollection(

        reviewData,

      );






      /*
        REFRESH CUSTOMER OFFICE DATA
      */


      window.dispatchEvent(


        new Event(

          "FINORA_LOAN_UPDATED",

        ),


      );





      alert(

        "Collection Completed Successfully",

      );



    }

    catch(error) {


      console.error(

        "COLLECTION ERROR:",

        error,

      );


      alert(

        "Collection failed",

      );


    }


  }





  return (



    <SummaryCard title="Review Actions">



      <div


        style={{


          display: "flex",


          gap: "12px",


          flexWrap: "wrap",


        }}


      >




        <Button


          onClick={() => {


            console.log(

              "Save Draft",

            );


          }}


        >


          Save Draft


        </Button>






        <Button


          onClick={

            handleCompleteCollection

          }


        >


          Complete Collection


        </Button>






        <Button


          onClick={() => {


            console.log(

              "Generate Report",

            );


          }}


        >


          Generate Report


        </Button>




      </div>



    </SummaryCard>



  );


}
