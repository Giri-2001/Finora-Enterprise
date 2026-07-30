export type GoldRelease = {
  id: string;

  loanId: string;

  customerId: string;

  lockerNumber: string;

  bagNumber: string;

  releaseDate: string;

  releasedBy: string;

  remarks?: string;

  status: "RELEASED" | "PENDING";

  createdAt: string;

  updatedAt: string;
};

const STORAGE_KEY = "finora_gold_releases";

function loadReleases(): GoldRelease[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);

    if (!data) {
      return [];
    }

    return JSON.parse(data) as GoldRelease[];
  } catch {
    return [];
  }
}

function saveReleases(releases: GoldRelease[]): void {
  localStorage.setItem(
    STORAGE_KEY,

    JSON.stringify(releases),
  );
}

let releases: GoldRelease[] = loadReleases();

export function getReleases(): GoldRelease[] {
  return [...releases];
}

export function getReleaseById(id: string): GoldRelease | undefined {
  return releases.find((release) => release.id === id);
}

export function getLoanRelease(loanId: string): GoldRelease | undefined {
  return releases.find((release) => release.loanId === loanId);
}

export function addRelease(release: GoldRelease): void {
  releases = [...releases, release];

  saveReleases(releases);
}

export function updateRelease(updatedRelease: GoldRelease): void {
  releases = releases.map((release) =>
    release.id === updatedRelease.id ? updatedRelease : release,
  );

  saveReleases(releases);
}

export function deleteRelease(id: string): void {
  releases = releases.filter((release) => release.id !== id);

  saveReleases(releases);
}

export function clearReleases(): void {
  releases = [];

  saveReleases(releases);
}
