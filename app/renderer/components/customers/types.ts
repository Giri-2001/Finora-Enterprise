export type Customer = {
  id: number;
  customerId: string;

  name: string;
  phone: string;
  email: string;
  address: string;

  status: "Active" | "Inactive";
};
