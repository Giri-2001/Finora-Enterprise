import { useEffect, useState, type FormEvent } from "react";

import Button from "../../ui/Button";
import type { Customer } from "../types";

type CustomerFormProps = {
  customer?: Customer | null;
  onSubmit: (customer: Customer) => void;
};

export default function CustomerForm({
  customer,
  onSubmit,
}: CustomerFormProps) {
  const [customerId, setCustomerId] = useState("");

  const [name, setName] = useState("");

  const [phone, setPhone] = useState("");

  const [email, setEmail] = useState("");

  const [address, setAddress] = useState("");

  const [status, setStatus] = useState<"Active" | "Inactive">("Active");

  const [error, setError] = useState("");

  function clearForm() {
    setCustomerId(customer?.customerId ?? "");
    setName("");
    setPhone("");
    setEmail("");
    setAddress("");
    setStatus("Active");
    setError("");
  }

  useEffect(() => {
    if (!customer) {
      clearForm();
      return;
    }

    setCustomerId(customer.customerId);

    setName(customer.name);

    setPhone(customer.phone);

    setEmail(customer.email);

    setAddress(customer.address);

    setStatus(customer.status);

    setError("");
  }, [customer]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    if (!name.trim()) {
      setError("Customer name is required.");
      return;
    }

    if (!/^[A-Za-z\s]+$/.test(name)) {
      setError("Name can contain only letters.");
      return;
    }

    if (!/^\d{10}$/.test(phone)) {
      setError("Phone number must contain exactly 10 digits.");
      return;
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter a valid email address.");
      return;
    }

    if (phone.trim() === "") {
      setError("Phone number is required.");
      return;
    }

    onSubmit({
      id: customer?.id ?? 0,
      customerId,
      name: name.trim(),
      phone,
      email: email.trim(),
      address: address.trim(),
      status,
    });

    clearForm();
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        maxWidth: 700,
        marginTop: 20,
        padding: 24,
        border: "1px solid #e2e8f0",
        borderRadius: 12,
        background: "#ffffff",
        display: "flex",
        flexDirection: "column",
        gap: 20,
      }}
    >
      <h2
        style={{
          margin: 0,
          color: "#0f172a",
        }}
      >
        {customer ? "Edit Customer" : "Add Customer"}
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 16,
        }}
      >
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as Customer["status"])}
        >
          <option value="Active">Active</option>

          <option value="Inactive">Inactive</option>
        </select>

        <input
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value.replace(/[^A-Za-z\s]/g, ""))}
        />

        <input
          placeholder="Phone Number"
          value={phone}
          maxLength={10}
          inputMode="numeric"
          onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
        />

        <input
          placeholder="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <textarea
          placeholder="Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          style={{
            gridColumn: "1 / span 2",
            minHeight: 100,
            resize: "vertical",
          }}
        />
      </div>

      {error && (
        <div
          style={{
            padding: 12,
            borderRadius: 8,
            background: "#fee2e2",
            border: "1px solid #fecaca",
            color: "#b91c1c",
            fontWeight: 600,
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 12,
        }}
      >
        <Button type="button" onClick={clearForm}>
          Clear
        </Button>

        <Button type="submit">
          {customer ? "Update Customer" : "Add Customer"}
        </Button>
      </div>
    </form>
  );
}
