const CUSTOMER_PREFIX = "CUST";

export function generateCustomerId(count: number): string {
  const nextId = count + 1;

  return `${CUSTOMER_PREFIX}${String(nextId).padStart(4, "0")}`;
}

export function formatCustomerId(id: number): string {
  return `${CUSTOMER_PREFIX}${String(id).padStart(4, "0")}`;
}
