import { useState } from "react";

export default function ThemeSettings() {
  const [theme, setTheme] = useState("light");

  const [accentColor, setAccentColor] = useState("#2563eb");

  function saveTheme() {
    localStorage.setItem("finora-theme", theme);

    localStorage.setItem("finora-accent", accentColor);

    alert("Theme Settings Saved Successfully");
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 24,
        maxWidth: 600,
      }}
    >
      <h1>Theme Settings</h1>

      <label>Select Theme</label>

      <select value={theme} onChange={(e) => setTheme(e.target.value)}>
        <option value="light">Light Theme</option>

        <option value="dark">Dark Theme</option>
      </select>

      <label>Brand Accent Color</label>

      <input
        type="color"
        value={accentColor}
        onChange={(e) => setAccentColor(e.target.value)}
      />

      <button type="button" onClick={saveTheme}>
        Save Theme Settings
      </button>
    </div>
  );
}
