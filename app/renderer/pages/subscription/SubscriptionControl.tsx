import { useState } from "react";

export default function SubscriptionControl() {
  const [plan, setPlan] = useState("Enterprise");

  const [status, setStatus] = useState("Active");

  const [expiryDate, setExpiryDate] = useState("31-12-2026");

  const [userLimit, setUserLimit] = useState(50);

  const [features, setFeatures] = useState({
    reports: true,
    audit: true,
    backup: true,
    security: true,
  });

  function toggleFeature(feature: keyof typeof features) {
    setFeatures({
      ...features,
      [feature]: !features[feature],
    });
  }

  function saveSubscription() {
    alert("Subscription Settings Saved Successfully");
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
      <h1>Subscription Control</h1>

      <label>Subscription Plan</label>

      <select value={plan} onChange={(e) => setPlan(e.target.value)}>
        <option value="Starter">Starter</option>

        <option value="Professional">Professional</option>

        <option value="Enterprise">Enterprise</option>
      </select>

      <label>License Status</label>

      <select value={status} onChange={(e) => setStatus(e.target.value)}>
        <option value="Active">Active</option>

        <option value="Expired">Expired</option>

        <option value="Suspended">Suspended</option>
      </select>

      <label>Expiry Date</label>

      <input
        value={expiryDate}
        onChange={(e) => setExpiryDate(e.target.value)}
      />

      <label>User Limit</label>

      <input
        type="number"
        value={userLimit}
        onChange={(e) => setUserLimit(Number(e.target.value))}
      />

      <h2>Feature Access Control</h2>

      <label>
        <input
          type="checkbox"
          checked={features.reports}
          onChange={() => toggleFeature("reports")}
        />
        Reports
      </label>

      <label>
        <input
          type="checkbox"
          checked={features.audit}
          onChange={() => toggleFeature("audit")}
        />
        Audit Logs
      </label>

      <label>
        <input
          type="checkbox"
          checked={features.backup}
          onChange={() => toggleFeature("backup")}
        />
        Backup
      </label>

      <label>
        <input
          type="checkbox"
          checked={features.security}
          onChange={() => toggleFeature("security")}
        />
        Security
      </label>

      <button type="button" onClick={saveSubscription}>
        Save Subscription Settings
      </button>
    </div>
  );
}
