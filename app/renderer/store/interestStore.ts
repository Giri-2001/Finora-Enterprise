import type { InterestHistory } from "../components/interest/types";

const STORAGE_KEY = "finora_interest_history";

function loadHistory(): InterestHistory[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);

    if (!data) {
      return [];
    }

    return JSON.parse(data) as InterestHistory[];
  } catch {
    return [];
  }
}

function saveHistory(history: InterestHistory[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

let history: InterestHistory[] = loadHistory();

export function getInterestHistory(): InterestHistory[] {
  return [...history];
}

export function addInterestHistory(record: InterestHistory): void {
  history = [...history, record];

  saveHistory(history);
}

export function getLoanInterestHistory(loanId: number): InterestHistory[] {
  return history.filter((item) => item.loanId === loanId);
}

export function deleteInterestHistory(id: number): void {
  history = history.filter((item) => item.id !== id);

  saveHistory(history);
}

export function clearInterestHistory(): void {
  history = [];

  saveHistory(history);
}
