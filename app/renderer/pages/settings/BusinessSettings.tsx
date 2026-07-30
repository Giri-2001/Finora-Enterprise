import { useState } from "react";

export default function BusinessSettings() {
  const [companyName, setCompanyName] = useState("FINORA Enterprise");

  const [branchName, setBranchName] = useState("Main Branch");

  const [address, setAddress] = useState("");

  const [phone, setPhone] = useState("");

  const [email, setEmail] = useState("");

  const [gst, setGst] = useState("");

  const [currency, setCurrency] = useState("INR");

  function handleSave() {
    alert("Business Settings Saved Successfully");
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 24,
        maxWidth: 700,
      }}
    >
      <h1>Business Settings</h1>

      <input
        value={companyName}
        onChange={(e) => setCompanyName(e.target.value)}
        placeholder="Company Name"
      />

      <input
        value={branchName}
        onChange={(e) => setBranchName(e.target.value)}
        placeholder="Branch Name"
      />

      <textarea
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder="Business Address"
        rows={4}
      />

      <input
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="Phone Number"
      />

      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email Address"
      />

      <input
        value={gst}
        onChange={(e) => setGst(e.target.value)}
        placeholder="GST / Tax ID"
      />

      <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
        <option value="INR">INR ₹</option>

        <option value="USD">USD $</option>
      </select>

      <button type="button" onClick={handleSave}>
        Save Settings
      </button>
    </div>
  );
}
