import type { GoldBag } from "../components/goldLoan/types";

const STORAGE_KEY = "finora_gold_bags";

function loadBags(): GoldBag[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);

    if (!data) {
      return [];
    }

    return JSON.parse(data) as GoldBag[];
  } catch {
    return [];
  }
}

function saveBags(bags: GoldBag[]): void {
  localStorage.setItem(
    STORAGE_KEY,

    JSON.stringify(bags),
  );
}

let bags: GoldBag[] = loadBags();

export function getBags(): GoldBag[] {
  return [...bags];
}

export function getBagById(id: string): GoldBag | undefined {
  return bags.find((bag) => bag.id === id);
}

export function getBagByNumber(bagNumber: string): GoldBag | undefined {
  return bags.find((bag) => bag.bagNumber === bagNumber);
}

export function getLoanBag(loanId: string): GoldBag | undefined {
  return bags.find((bag) => bag.loanId === loanId);
}

export function addBag(bag: GoldBag): void {
  bags = [...bags, bag];

  saveBags(bags);
}

export function updateBag(updatedBag: GoldBag): void {
  bags = bags.map((bag) => (bag.id === updatedBag.id ? updatedBag : bag));

  saveBags(bags);
}

export function deleteBag(id: string): void {
  bags = bags.filter((bag) => bag.id !== id);

  saveBags(bags);
}

export function releaseBag(bagNumber: string): void {
  bags = bags.map((bag) => {
    if (bag.bagNumber !== bagNumber) {
      return bag;
    }

    return {
      ...bag,

      status: "RELEASED",
    };
  });

  saveBags(bags);
}

export function clearBags(): void {
  bags = [];

  saveBags(bags);
}
