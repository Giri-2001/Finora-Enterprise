export type ThemeMode = "light" | "dark";

const THEME_KEY = "finora-theme";

const ACCENT_KEY = "finora-accent";

const DEFAULT_THEME: ThemeMode = "light";

const DEFAULT_ACCENT = "#2563eb";

export function getSavedTheme(): ThemeMode {
  const saved = localStorage.getItem(THEME_KEY);

  if (saved === "dark" || saved === "light") {
    return saved;
  }

  return DEFAULT_THEME;
}

export function saveTheme(theme: ThemeMode): void {
  localStorage.setItem(THEME_KEY, theme);
}

export function getSavedAccent(): string {
  return localStorage.getItem(ACCENT_KEY) || DEFAULT_ACCENT;
}

export function saveAccent(color: string): void {
  localStorage.setItem(ACCENT_KEY, color);
}

export function resetTheme(): void {
  localStorage.removeItem(THEME_KEY);

  localStorage.removeItem(ACCENT_KEY);

  applyTheme(DEFAULT_THEME, DEFAULT_ACCENT);
}

export function applyTheme(
  theme: ThemeMode,

  accent: string = DEFAULT_ACCENT,
): void {
  const root = document.documentElement;

  root.dataset.theme = theme;

  root.style.setProperty("--finora-accent", accent);

  root.style.setProperty(
    "--finora-accent-hover",

    theme === "dark" ? "#60a5fa" : "#1d4ed8",
  );

  root.style.setProperty(
    "--success",

    theme === "dark" ? "#22c55e" : "#16a34a",
  );

  root.style.setProperty(
    "--danger",

    theme === "dark" ? "#ef4444" : "#dc2626",
  );

  root.style.setProperty(
    "--warning",

    theme === "dark" ? "#eab308" : "#ca8a04",
  );

  /*
    User custom accent only controls
    branding color.
    Text/background always follow
    FINORA theme defaults.
  */

  root.style.setProperty("--button-text", "#ffffff");

  root.style.setProperty(
    "--text-contrast",

    theme === "dark" ? "#f8fafc" : "#0f172a",
  );
}
