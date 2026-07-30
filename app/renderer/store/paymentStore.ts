import type { Payment } from "../components/payments/types";

const STORAGE_KEY = "finora_payments";

function loadPayments(): Payment[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);

    if (!data) {
      return [];
    }

    return JSON.parse(data) as Payment[];
  } catch {
    return [];
  }
}

function savePayments(payments: Payment[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payments));
}

let payments: Payment[] = loadPayments();

export function getPayments(): Payment[] {
  return [...payments];
}

export function getPaymentById(id: string): Payment | undefined {
  return payments.find((payment) => payment.id === id);
}

export function getLoanPayments(loanId: string): Payment[] {
  return payments.filter((payment) => payment.loanId === loanId);
}

export function getCustomerPayments(customerId: string): Payment[] {
  return payments.filter((payment) => payment.customerId === customerId);
}

export function addPayment(payment: Payment): void {
  payments = [...payments, payment];

  savePayments(payments);
}

export function updatePayment(updatedPayment: Payment): void {
  payments = payments.map((payment) =>
    payment.id === updatedPayment.id ? updatedPayment : payment,
  );

  savePayments(payments);
}

export function deletePayment(id: string): void {
  payments = payments.filter((payment) => payment.id !== id);

  savePayments(payments);
}

export function replacePayments(updatedPayments: Payment[]): void {
  payments = [...updatedPayments];

  savePayments(payments);
}

export function clearPayments(): void {
  payments = [];

  savePayments(payments);
}
