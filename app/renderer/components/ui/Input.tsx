import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
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

        gap: 8,

        width: fullWidth ? "100%" : undefined,
      }}
    >
      {label && (
        <label
          style={{
            fontSize: 14,

            fontWeight: 750,

            color: "var(--text)",
          }}
        >
          {label}
        </label>
      )}

      <input
        {...props}
        style={{
          width: "100%",

          padding: "12px 14px",

          borderRadius: 12,

          border: error
            ? "1px solid var(--danger)"
            : "1px solid var(--input-border)",

          background: "var(--input-bg)",

          color: "var(--text)",

          outline: "none",

          fontSize: 14,

          fontWeight: 500,

          transition: "all .25s ease",

          boxShadow: "inset 0 1px 3px rgba(0,0,0,0.06)",

          ...style,
        }}
        onFocus={(event) => {
          event.currentTarget.style.border = "1px solid var(--finora-accent)";

          event.currentTarget.style.boxShadow =
            "0 0 0 4px rgba(37,99,235,0.14)";

          props.onFocus?.(event);
        }}
        onBlur={(event) => {
          event.currentTarget.style.border = error
            ? "1px solid var(--danger)"
            : "1px solid var(--input-border)";

          event.currentTarget.style.boxShadow = "none";

          props.onBlur?.(event);
        }}
      />

      {error && (
        <span
          style={{
            fontSize: 12,

            fontWeight: 700,

            color: "var(--danger)",
          }}
        >
          {error}
        </span>
      )}
    </div>
  );
}
