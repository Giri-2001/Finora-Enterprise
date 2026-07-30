export type GoldLoanStatus = "ACTIVE" | "RELEASED" | "PENDING";

export type OrnamentType = "RING" | "CHAIN" | "BANGLE" | "NECKLACE" | "OTHER";

export interface GoldOrnament {
  id: string;

  loanId: string;

  customerId: string;

  ornamentType: OrnamentType;

  description: string;

  quantity: number;

  grossWeight: number;

  netWeight: number;

  purity: string;

  imageUrl?: string;

  createdAt: string;

  updatedAt: string;
}

export interface GoldLocker {
  id: string;

  lockerNumber: string;

  branch?: string;

  status: "AVAILABLE" | "OCCUPIED";

  createdAt: string;
}

export interface GoldBag {
  id: string;

  bagNumber: string;

  lockerNumber: string;

  loanId: string;

  status: "SEALED" | "RELEASED";

  createdAt: string;
}

export interface GoldLoan {
  id: string;

  loanId: string;

  customerId: string;

  lockerNumber: string;

  bagNumber: string;

  ornaments: GoldOrnament[];

  status: GoldLoanStatus;

  releaseDate?: string;

  createdAt: string;

  updatedAt: string;
}
