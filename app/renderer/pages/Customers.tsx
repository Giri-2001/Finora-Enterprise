import { useMemo, useState } from "react";

import CustomerStats from "../components/customers/CustomerStats";
import CustomerTable from "../components/customers/CustomerTable";
import CustomerForm from "../components/customers/forms/CustomerForm";
import type { Customer } from "../components/customers/types";

import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import Input from "../components/ui/Input";

import {
  addCustomer,
  getCustomers,
  deleteCustomer as removeCustomer,
  updateCustomer,
} from "../store/customerStore";

import { generateCustomerId } from "../utils/customerId";

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>(getCustomers());

  const [search, setSearch] = useState("");

  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);

  const [error, setError] = useState("");

  function refresh() {
    setCustomers(getCustomers());
  }

  function saveCustomer(customer: {
    id?: number;
    name: string;
    phone: string;
    email: string;
    address: string;
  }) {
    setError("");

    const duplicate = customers.some(
      (item) => item.phone === customer.phone && item.id !== customer.id,
    );

    if (duplicate) {
      setError("Customer with this phone number already exists.");
      return;
    }

    if (customer.id) {
      const existing = customers.find((item) => item.id === customer.id);

      if (!existing) return;

      updateCustomer({
        ...existing,
        ...customer,
      });

      refresh();
      setEditingCustomer(null);
      return;
    }

    addCustomer({
      id: Date.now(),
      customerId: generateCustomerId(customers.length),
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      address: customer.address,
      status: "Active",
    });

    refresh();
  }

  function deleteCustomer(id: number) {
    removeCustomer(id);

    if (viewingCustomer?.id === id) {
      setViewingCustomer(null);
    }

    refresh();
  }

  const filteredCustomers = useMemo(
    () =>
      customers.filter((customer) => {
        const q = search.toLowerCase();

        return (
          customer.customerId.toLowerCase().includes(q) ||
          customer.name.toLowerCase().includes(q) ||
          customer.phone.includes(search)
        );
      }),
    [customers, search],
  );

  return (
    <div>
      <h1>Customer Management</h1>

      <p>Create, edit and manage customer profiles.</p>

      <CustomerStats customers={customers} />

      <Card title="Search Customers">
        <Input
          value={search}
          placeholder="Search by ID, name or phone..."
          onChange={setSearch}
        />
      </Card>

      {error && <p style={{ color: "#dc2626" }}>{error}</p>}

      <Card title={editingCustomer ? "Edit Customer" : "New Customer"}>
        <CustomerForm customer={editingCustomer} onSubmit={saveCustomer} />
      </Card>
      <Card title="Customer List">
        {filteredCustomers.length > 0 ? (
          <CustomerTable
            customers={filteredCustomers}
            onDelete={deleteCustomer}
            onEdit={setEditingCustomer}
            onView={setViewingCustomer}
          />
        ) : (
          <EmptyState
            title="No Customers Found"
            description="Try a different search or add a new customer."
          />
        )}
      </Card>

      {viewingCustomer && (
        <Card title="Customer Profile" subtitle={viewingCustomer.customerId}>
          <p>
            <strong>Name:</strong> {viewingCustomer.name}
          </p>

          <p>
            <strong>Phone:</strong> {viewingCustomer.phone}
          </p>

          <p>
            <strong>Email:</strong> {viewingCustomer.email || "-"}
          </p>

          <p>
            <strong>Address:</strong> {viewingCustomer.address || "-"}
          </p>

          <p>
            <strong>Status:</strong> {viewingCustomer.status}
          </p>

          <button type="button" onClick={() => setViewingCustomer(null)}>
            Close
          </button>
        </Card>
      )}
    </div>
  );
}
