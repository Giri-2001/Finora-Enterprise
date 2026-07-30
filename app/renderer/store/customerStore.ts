import type { Customer } from "../components/customers/types";

const STORAGE_KEY = "finora_customers";

function loadCustomers(): Customer[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);

    if (!data) {
      return [];
    }

    return JSON.parse(data) as Customer[];
  } catch {
    return [];
  }
}

function saveCustomers(customers: Customer[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(customers));
}

let customers: Customer[] = loadCustomers();

export function getCustomers(): Customer[] {
  return [...customers];
}

export function addCustomer(customer: Customer): void {
  customers = [...customers, customer];

  saveCustomers(customers);
}

export function updateCustomer(updatedCustomer: Customer): void {
  customers = customers.map((customer) =>
    customer.id === updatedCustomer.id ? updatedCustomer : customer,
  );

  saveCustomers(customers);
}

export function deleteCustomer(id: number): void {
  customers = customers.filter((customer) => customer.id !== id);

  saveCustomers(customers);
}

export function replaceCustomers(updatedCustomers: Customer[]): void {
  customers = [...updatedCustomers];

  saveCustomers(customers);
}
