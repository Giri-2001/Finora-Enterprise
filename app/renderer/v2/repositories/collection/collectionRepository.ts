/* ===========================================================
   FINORA ENTERPRISE OS™

   Collections Engine

   COLLECTION REPOSITORY
=========================================================== */


import type {
  CollectionReviewData,
} from "../../components/collections/CollectionReviewData";



/* ===========================================================
   STORAGE KEY
=========================================================== */


const STORAGE_KEY =
  "FINORA_COLLECTIONS_V2";



/* ===========================================================
   REPOSITORY
=========================================================== */


export class CollectionRepository {



  /* ==========================================
     GET ALL
  ========================================== */


  getAll():

  CollectionReviewData[] {


    try {


      const raw =
        localStorage.getItem(
          STORAGE_KEY,
        );


      if (!raw) {

        return [];

      }


      return JSON.parse(raw);


    }

    catch {


      return [];

    }


  }




  /* ==========================================
     SAVE
  ========================================== */


  async save(

    collection: CollectionReviewData,

  ): Promise<CollectionReviewData> {



    const collections =
      this.getAll();



    const newCollection: CollectionReviewData = {

  ...collection,

  status: "Approved",

  createdAt:
    collection.createdAt ||
    new Date().toISOString(),

  updatedAt:
    new Date().toISOString(),

};



    collections.push(

      newCollection,

    );



    localStorage.setItem(

      STORAGE_KEY,

      JSON.stringify(
        collections,
      ),

    );



    return newCollection;


  }





  /* ==========================================
     UPDATE
  ========================================== */


  async update(

    collection: CollectionReviewData,

  ): Promise<CollectionReviewData> {


    const collections =
      this.getAll();



    const updated =
      collections.map(

        (item) =>

          item.loanId === collection.loanId

          ? collection

          : item,

      );



    localStorage.setItem(

      STORAGE_KEY,

      JSON.stringify(
        updated,
      ),

    );



    return collection;


  }





  /* ==========================================
     FIND BY ID
  ========================================== */


  async findById(

    id: string,

  ): Promise<CollectionReviewData | null> {


    const collections =
      this.getAll();



    return (

      collections.find(

        (item) =>

          item.loanId === id,

      )

      ?? null

    );


  }





  /* ==========================================
     DELETE
  ========================================== */


  async delete(

    id: string,

  ): Promise<void> {


    const collections =
      this.getAll();



    const filtered =
      collections.filter(

        (item) =>

          item.loanId !== id,

      );



    localStorage.setItem(

      STORAGE_KEY,

      JSON.stringify(
        filtered,
      ),

    );


  }


}





export const collectionRepository =
  new CollectionRepository();
