import type { Collection } from "../components/collections/types";

const STORAGE_KEY = "finora_collections";

function loadCollections(): Collection[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);

    if (!data) {
      return [];
    }

    const parsed = JSON.parse(data);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.map((item) => ({
      ...item,

      interestAmount: Number(item.interestAmount) || 0,

      principalAmount: Number(item.principalAmount) || 0,

      penaltyAmount: Number(item.penaltyAmount) || 0,

      totalAmount: Number(item.totalAmount) || 0,
    })) as Collection[];
  } catch {
    return [];
  }
}

function saveCollections(collections: Collection[]): void {
  localStorage.setItem(
    STORAGE_KEY,

    JSON.stringify(collections),
  );
}

let collections: Collection[] = loadCollections();

export function getCollections(): Collection[] {
  return [...collections];
}

export function getCollectionById(id: string): Collection | undefined {
  return collections.find((collection) => collection.id === id);
}

export function getLoanCollections(loanId: string): Collection[] {
  return collections.filter((collection) => collection.loanId === loanId);
}

export function getCustomerCollections(customerId: string): Collection[] {
  return collections.filter(
    (collection) => collection.customerId === customerId,
  );
}

export function addCollection(collection: Collection): void {
  const safeCollection: Collection = {
    ...collection,

    interestAmount: Number(collection.interestAmount) || 0,

    principalAmount: Number(collection.principalAmount) || 0,

    penaltyAmount: Number(collection.penaltyAmount) || 0,

    totalAmount: Number(collection.totalAmount) || 0,
  };

  collections = [...collections, safeCollection];

  saveCollections(collections);
}

export function updateCollection(updatedCollection: Collection): void {
  collections = collections.map((collection) =>
    collection.id === updatedCollection.id
      ? {
          ...updatedCollection,

          interestAmount: Number(updatedCollection.interestAmount) || 0,

          principalAmount: Number(updatedCollection.principalAmount) || 0,

          penaltyAmount: Number(updatedCollection.penaltyAmount) || 0,

          totalAmount: Number(updatedCollection.totalAmount) || 0,
        }
      : collection,
  );

  saveCollections(collections);
}

export function deleteCollection(id: string): void {
  collections = collections.filter((collection) => collection.id !== id);

  saveCollections(collections);
}

export function replaceCollections(updatedCollections: Collection[]): void {
  collections = updatedCollections.map((collection) => ({
    ...collection,

    interestAmount: Number(collection.interestAmount) || 0,

    principalAmount: Number(collection.principalAmount) || 0,

    penaltyAmount: Number(collection.penaltyAmount) || 0,

    totalAmount: Number(collection.totalAmount) || 0,
  }));

  saveCollections(collections);
}

export function clearCollections(): void {
  collections = [];

  saveCollections(collections);
}

export function getTodayCollections(date: string): Collection[] {
  return collections.filter((collection) => collection.collectionDate === date);
}
