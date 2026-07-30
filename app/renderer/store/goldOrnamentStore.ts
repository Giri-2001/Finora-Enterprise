import type { GoldOrnament } from "../components/goldLoan/types";

const STORAGE_KEY = "finora_gold_ornaments";

function loadOrnaments(): GoldOrnament[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);

    if (!data) {
      return [];
    }

    return JSON.parse(data) as GoldOrnament[];
  } catch {
    return [];
  }
}

function saveOrnaments(ornaments: GoldOrnament[]): void {
  localStorage.setItem(
    STORAGE_KEY,

    JSON.stringify(ornaments),
  );
}

let ornaments: GoldOrnament[] = loadOrnaments();

export function getOrnaments(): GoldOrnament[] {
  return [...ornaments];
}

export function getOrnamentById(id: string): GoldOrnament | undefined {
  return ornaments.find((ornament) => ornament.id === id);
}

export function getLoanOrnaments(loanId: string): GoldOrnament[] {
  return ornaments.filter((ornament) => ornament.loanId === loanId);
}

export function getCustomerOrnaments(customerId: string): GoldOrnament[] {
  return ornaments.filter((ornament) => ornament.customerId === customerId);
}

export function addOrnament(ornament: GoldOrnament): void {
  ornaments = [...ornaments, ornament];

  saveOrnaments(ornaments);
}

export function updateOrnament(updatedOrnament: GoldOrnament): void {
  ornaments = ornaments.map((ornament) =>
    ornament.id === updatedOrnament.id ? updatedOrnament : ornament,
  );

  saveOrnaments(ornaments);
}

export function deleteOrnament(id: string): void {
  ornaments = ornaments.filter((ornament) => ornament.id !== id);

  saveOrnaments(ornaments);
}

export function replaceOrnaments(updatedOrnaments: GoldOrnament[]): void {
  ornaments = [...updatedOrnaments];

  saveOrnaments(ornaments);
}

export function clearOrnaments(): void {
  ornaments = [];

  saveOrnaments(ornaments);
}
