import type { GoldLocker } from "../components/goldLoan/types";

const STORAGE_KEY = "finora_gold_lockers";

function loadLockers(): GoldLocker[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);

    if (!data) {
      return [];
    }

    return JSON.parse(data) as GoldLocker[];
  } catch {
    return [];
  }
}

function saveLockers(lockers: GoldLocker[]): void {
  localStorage.setItem(
    STORAGE_KEY,

    JSON.stringify(lockers),
  );
}

let lockers: GoldLocker[] = loadLockers();

export function getLockers(): GoldLocker[] {
  return [...lockers];
}

export function getLockerById(id: string): GoldLocker | undefined {
  return lockers.find((locker) => locker.id === id);
}

export function getLockerByNumber(
  lockerNumber: string,
): GoldLocker | undefined {
  return lockers.find((locker) => locker.lockerNumber === lockerNumber);
}

export function addLocker(locker: GoldLocker): void {
  lockers = [...lockers, locker];

  saveLockers(lockers);
}

export function updateLocker(updatedLocker: GoldLocker): void {
  lockers = lockers.map((locker) =>
    locker.id === updatedLocker.id ? updatedLocker : locker,
  );

  saveLockers(lockers);
}

export function deleteLocker(id: string): void {
  lockers = lockers.filter((locker) => locker.id !== id);

  saveLockers(lockers);
}

export function releaseLocker(lockerNumber: string): void {
  lockers = lockers.map((locker) => {
    if (locker.lockerNumber !== lockerNumber) {
      return locker;
    }

    return {
      ...locker,

      status: "AVAILABLE",
    };
  });

  saveLockers(lockers);
}

export function clearLockers(): void {
  lockers = [];

  saveLockers(lockers);
}
