import { useEffect, useState } from "react";

import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";

import {
  applyTheme,
  getSavedAccent,
  getSavedTheme,
  saveAccent,
  saveTheme,
  type ThemeMode,
} from "../../utils/themeManager";

import { useNotification } from "../../context/NotificationContext";

export default function ThemeSettings() {
  const [theme, setTheme] = useState<ThemeMode>("light");

  const [accentColor, setAccentColor] = useState("#2563eb");

  const { showToast } = useNotification();

  useEffect(() => {
    const savedTheme = getSavedTheme();

    const savedAccent = getSavedAccent();

    setTheme(savedTheme);

    setAccentColor(savedAccent);

    applyTheme(savedTheme, savedAccent);
  }, []);

  function handleThemeChange(value: ThemeMode) {
    setTheme(value);

    applyTheme(value, accentColor);
  }

  function handleAccentChange(value: string) {
    setAccentColor(value);

    applyTheme(theme, value);
  }

  function saveSettings() {
    saveTheme(theme);

    saveAccent(accentColor);

    applyTheme(theme, accentColor);

    showToast("FINORA theme updated successfully", "success");
  }

  return (
    <div
      style={{
        maxWidth: 700,

        display: "flex",

        flexDirection: "column",

        gap: 24,
      }}
    >
      <h1
        style={{
          margin: 0,

          color: "var(--text)",

          fontSize: 32,

          fontWeight: 900,
        }}
      >
        Theme Settings
      </h1>

      <Card
        title="FINORA Appearance Control"
        subtitle="Manage professional light and dark experience"
      >
        <div
          style={{
            display: "flex",

            flexDirection: "column",

            gap: 22,
          }}
        >
          <div>
            <label
              style={{
                display: "block",

                marginBottom: 8,

                fontWeight: 750,

                color: "var(--text)",
              }}
            >
              Select Theme
            </label>

            <select
              value={theme}
              onChange={(event) =>
                handleThemeChange(event.target.value as ThemeMode)
              }
              style={{
                width: "100%",

                padding: "12px 14px",

                borderRadius: 12,

                background: "var(--input-bg)",

                color: "var(--text)",

                border: "1px solid var(--input-border)",

                fontWeight: 600,
              }}
            >
              <option value="light">Light Theme</option>

              <option value="dark">Dark Theme</option>
            </select>
          </div>

          <div>
            <label
              style={{
                display: "block",

                marginBottom: 8,

                fontWeight: 750,

                color: "var(--text)",
              }}
            >
              Brand Accent Color
            </label>

            <input
              type="color"
              value={accentColor}
              onChange={(event) => handleAccentChange(event.target.value)}
              style={{
                width: 100,

                height: 48,

                border: "none",

                borderRadius: 12,

                cursor: "pointer",
              }}
            />
          </div>

          <Card
            variant="glass"
            title="Live FINORA Preview"
            subtitle="Preview always follows selected theme"
          >
            <div
              style={{
                display: "flex",

                flexDirection: "column",

                gap: 16,
              }}
            >
              <p
                style={{
                  margin: 0,

                  color: "var(--text-muted)",
                }}
              >
                Dashboard cards, buttons, forms and notifications will use this
                theme.
              </p>

              <div
                style={{
                  padding: 20,

                  borderRadius: 16,

                  background: "var(--bg)",

                  border: "1px solid var(--surface-border)",
                }}
              >
                <h3
                  style={{
                    marginTop: 0,

                    color: "var(--text)",
                  }}
                >
                  FINORA Enterprise
                </h3>

                <Button>Premium Action</Button>
              </div>
            </div>
          </Card>

          <Button size="large" onClick={saveSettings}>
            Save Theme Settings
          </Button>
        </div>
      </Card>
    </div>
  );
}
