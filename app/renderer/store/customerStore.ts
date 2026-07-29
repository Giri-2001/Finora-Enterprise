import type { Customer } from "../components/customers/types";

const STORAGE_KEY = "finora_customers";

function loadCustomers(): Customer[] {
  const data = localStorage.getItem(STORAGE_KEY);

  if (!data) {
    return [];
  }

  return JSON.parse(data);
}

function saveCustomers(customers: Customer[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(customers));
}

let customers: Customer[] = loadCustomers();

export function getCustomers() {
  return customers;
}

export function addCustomer(customer: Customer) {
  customers = [...customers, customer];

  saveCustomers(customers);
}

export function updateCustomer(updatedCustomer: Customer) {
  customers = customers.map((customer) =>
    customer.id === updatedCustomer.id ? updatedCustomer : customer,
  );

  saveCustomers(customers);
}

export function deleteCustomer(id: number) {
  customers = customers.filter((customer) => customer.id !== id);

  saveCustomers(customers);
}
