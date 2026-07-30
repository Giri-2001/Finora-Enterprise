type IconProps = {
  size?: number;
};

const iconStyle = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function DashboardIcon({ size = 20 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={{ flexShrink: 0 }}
    >
      <path
        {...iconStyle}
        d="M3 13h8V3H3v10zm10 8h8V11h-8v10zM3 21h8v-6H3v6zm10-10h8V3h-8v8z"
      />
    </svg>
  );
}

export function CustomerIcon({ size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path
        {...iconStyle}
        d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm-7 8a7 7 0 0 1 14 0"
      />
    </svg>
  );
}

export function LoanIcon({ size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path {...iconStyle} d="M3 7h18M3 12h18M3 17h12" />
    </svg>
  );
}

export function CollectionIcon({ size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path {...iconStyle} d="M12 3v18M3 12h18" />
    </svg>
  );
}

export function ReportIcon({ size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path {...iconStyle} d="M7 3h7l5 5v13H7z" />
      <path {...iconStyle} d="M14 3v5h5" />
    </svg>
  );
}

export function PaymentIcon({ size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path {...iconStyle} d="M3 7h18v10H3z" />
      <path {...iconStyle} d="M3 11h18" />
    </svg>
  );
}

export function GoldLoanIcon({ size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <circle {...iconStyle} cx="12" cy="12" r="7" />
      <path {...iconStyle} d="M12 8v8M8 12h8" />
    </svg>
  );
}

export function UserIcon({ size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path {...iconStyle} d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4z" />
      <path {...iconStyle} d="M5 20a7 7 0 0 1 14 0" />
    </svg>
  );
}

export function SecurityIcon({ size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path {...iconStyle} d="M12 3l7 3v5c0 5-3.5 8-7 10-3.5-2-7-5-7-10V6z" />
    </svg>
  );
}

export function SettingsIcon({ size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <circle {...iconStyle} cx="12" cy="12" r="3" />
      <path
        {...iconStyle}
        d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"
      />
    </svg>
  );
}
