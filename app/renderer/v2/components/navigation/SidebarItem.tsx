/* ===========================================================
   FINORA OS V2
   NAVIGATION
   SIDEBAR ITEM
=========================================================== */

import type { ReactNode } from "react";

/* ===========================================================
   TYPES
=========================================================== */

interface SidebarItemProps {
  icon: ReactNode;
  title: string;
  active?: boolean;
  onClick?: () => void;
}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function SidebarItem({
  icon,
  title,
  active = false,
  onClick,
}: SidebarItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 16px",
        border: "none",
        borderRadius: 12,
        cursor: "pointer",
        background: active ? "#1f2937" : "transparent",
        color: "#ffffff",
        fontSize: 15,
        fontWeight: active ? 700 : 500,
      }}
    >
      <span>{icon}</span>

      <span>{title}</span>
    </button>
  );
}
