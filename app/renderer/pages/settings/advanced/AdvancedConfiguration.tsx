import { useState } from "react";

export default function AdvancedConfiguration() {
  const [autoBackup, setAutoBackup] = useState(true);

  const [dataRetention, setDataRetention] = useState("5 Years");

  const [notifications, setNotifications] = useState(true);

  const [securityMode, setSecurityMode] = useState("Standard");

  const [maintenanceMode, setMaintenanceMode] = useState(false);

  function saveConfiguration() {
    alert("Advanced Configuration Saved Successfully");
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
      <h1>Advanced Configuration</h1>

      <h2>System Preferences</h2>

      <label>
        <input
          type="checkbox"
          checked={autoBackup}
          onChange={() => setAutoBackup(!autoBackup)}
        />
        Enable Automatic Backup
      </label>

      <label>Data Retention Period</label>

      <select
        value={dataRetention}
        onChange={(e) => setDataRetention(e.target.value)}
      >
        <option value="1 Year">1 Year</option>

        <option value="5 Years">5 Years</option>

        <option value="10 Years">10 Years</option>
      </select>

      <h2>Security Preferences</h2>

      <select
        value={securityMode}
        onChange={(e) => setSecurityMode(e.target.value)}
      >
        <option value="Standard">Standard Security</option>

        <option value="High">High Security</option>

        <option value="Maximum">Maximum Security</option>
      </select>

      <h2>Notification Settings</h2>

      <label>
        <input
          type="checkbox"
          checked={notifications}
          onChange={() => setNotifications(!notifications)}
        />
        Enable Notifications
      </label>

      <h2>Application Controls</h2>

      <label>
        <input
          type="checkbox"
          checked={maintenanceMode}
          onChange={() => setMaintenanceMode(!maintenanceMode)}
        />
        Maintenance Mode
      </label>

      <button type="button" onClick={saveConfiguration}>
        Save Advanced Configuration
      </button>
    </div>
  );
}
