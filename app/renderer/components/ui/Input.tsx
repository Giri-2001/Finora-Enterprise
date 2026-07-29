import type {
  InputHTMLAttributes,
} from "react";

type InputProps =
  InputHTMLAttributes<HTMLInputElement> & {
    label?: string;
    error?: string;
    fullWidth?: boolean;
  };

export default function Input({
  label,
  error,
  fullWidth = true,
  style,
  ...props
}: InputProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 6,
        width: fullWidth
          ? "100%"
          : undefined,
      }}
    >
      {label && (
        <label
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: "#334155",
          }}
        >
          {label}
        </label>
      )}

      <input
        {...props}
        style={{
          width: "100%",
          padding: "10px 12px",
          borderRadius: 8,
          border: error
            ? "1px solid #dc2626"
            : "1px solid #cbd5e1",
          background: "#ffffff",
          color: "#0f172a",
          outline: "none",
          fontSize: 14,
          transition:
            "border-color 0.2s ease",
          ...style,
        }}
      />

      {error && (
        <span
          style={{
            fontSize: 12,
            color: "#dc2626",
          }}
        >
          {error}
        </span>
      )}
    </div>
  );
}
