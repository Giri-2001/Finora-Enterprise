/* ===========================================================
   FINORA OS V2
   COLLECTIONS PAGE
=========================================================== */

import StudioLayout from "../../components/common/layout/StudioLayout";

import CollectionHeader from "../../components/collections/details/CollectionHeader";
import CollectionStatistics from "../../components/collections/details/CollectionStatistics";
import CollectionForm from "../../components/collections/details/CollectionForm";

/* ===========================================================
   COMPONENT
=========================================================== */

export default function CollectionsPage() {
  return (
    <StudioLayout>
      <CollectionHeader />

      <CollectionStatistics
        totalCollected={0}
        outstandingAmount={0}
        collectionCount={0}
        lastCollectionDate="--"
      />

      <div
        style={{
          marginTop: 24,
        }}
      >
        <CollectionForm />
      </div>
    </StudioLayout>
  );
}
