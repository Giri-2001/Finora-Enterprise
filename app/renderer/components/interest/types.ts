export type InterestType = "Percentage" | "Rupees" | "Paisa" | "Fixed";

export type InterestCalculationType = "Simple" | "Flat";

export type InterestHistory = {
  id: number;

  loanId: number;

  interestType: InterestType;

  interestValue: number;

  principalAmount: number;

  interestAmount: number;

  totalPayableAmount: number;

  duration: number;

  calculationType: InterestCalculationType;

  createdAt: string;
};

export type InterestResult = {
  interestAmount: number;

  totalPayableAmount: number;

  installmentAmount: number;
};

export type InterestSettings = {
  interestType: InterestType;

  interestValue: number;

  calculationType: InterestCalculationType;
};
