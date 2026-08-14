import type { CSSProperties } from "react";

export const disbursementFormStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  boxSizing: "border-box",
};

export const fieldsGridStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,

  display: "grid",
  gridTemplateColumns:
    "minmax(0, 1fr) minmax(0, 1fr)",

  gap: "10px",
  alignItems: "start",

  boxSizing: "border-box",
};

export const fieldStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  boxSizing: "border-box",
};

export const inputWrapperStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  boxSizing: "border-box",
};

export const dateInputStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  boxSizing: "border-box",

  colorScheme: "dark",

  fontFamily:
    "Inter, Segoe UI, Roboto, Arial, sans-serif",

  fontSize: "13px",
  fontWeight: 500,

  color: "#F4F7FF",

  background:
    "linear-gradient(180deg, #0D1A2E 0%, #091426 100%)",

  border:
    "1px solid #29466F",

  borderRadius: "7px",

  outline: "none",

  minHeight: "36px",

  padding:
    "8px 36px 8px 12px",

  accentColor: "#2F6BFF",

  transition:
    "border-color 140ms ease, box-shadow 140ms ease",
};

export const amountInputStyle: CSSProperties = {
  ...dateInputStyle,

  color: "#EAF2FF",

  background:
    "linear-gradient(180deg, #122442 0%, #0E1B30 100%)",

  border:
    "1px solid #315B9E",

  fontWeight: 700,

  cursor: "default",
};
