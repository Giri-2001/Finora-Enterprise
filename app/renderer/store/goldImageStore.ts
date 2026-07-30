export type GoldImage = {
  id: string;

  loanId: string;

  customerId: string;

  ornamentId?: string;

  imageName: string;

  imageUrl: string;

  createdAt: string;
};

const STORAGE_KEY = "finora_gold_images";

function loadImages(): GoldImage[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);

    if (!data) {
      return [];
    }

    return JSON.parse(data) as GoldImage[];
  } catch {
    return [];
  }
}

function saveImages(images: GoldImage[]): void {
  localStorage.setItem(
    STORAGE_KEY,

    JSON.stringify(images),
  );
}

let images: GoldImage[] = loadImages();

export function getGoldImages(): GoldImage[] {
  return [...images];
}

export function getImageById(id: string): GoldImage | undefined {
  return images.find((image) => image.id === id);
}

export function getLoanImages(loanId: string): GoldImage[] {
  return images.filter((image) => image.loanId === loanId);
}

export function getOrnamentImages(ornamentId: string): GoldImage[] {
  return images.filter((image) => image.ornamentId === ornamentId);
}

export function addGoldImage(image: GoldImage): void {
  images = [...images, image];

  saveImages(images);
}

export function updateGoldImage(updatedImage: GoldImage): void {
  images = images.map((image) =>
    image.id === updatedImage.id ? updatedImage : image,
  );

  saveImages(images);
}

export function deleteGoldImage(id: string): void {
  images = images.filter((image) => image.id !== id);

  saveImages(images);
}

export function clearGoldImages(): void {
  images = [];

  saveImages(images);
}
