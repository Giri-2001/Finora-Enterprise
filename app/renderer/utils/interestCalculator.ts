import type {
  InterestResult,
  InterestSettings,
} from "../components/interest/types";

export function calculateInterest(
  principalAmount: number,

  duration: number,

  settings: InterestSettings,
): InterestResult {
  let interestAmount = 0;

  switch (settings.interestType) {
    case "Percentage":
      interestAmount = (principalAmount * settings.interestValue) / 100;

      break;

    case "Rupees":
      interestAmount = settings.interestValue * duration;

      break;

    case "Paisa":
      interestAmount = (principalAmount * settings.interestValue) / 1000;

      break;

    case "Fixed":
      interestAmount = settings.interestValue;

      break;
  }

  const totalPayableAmount = principalAmount + interestAmount;

  const installmentAmount =
    duration > 0 ? totalPayableAmount / duration : totalPayableAmount;

  return {
    interestAmount,

    totalPayableAmount,

    installmentAmount,
  };
}
