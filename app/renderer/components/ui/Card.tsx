import type { ReactNode } from "react";

import "../../styles/card.css";

type CardProps = {
  title?: string;

  subtitle?: string;

  children: ReactNode;

  footer?: ReactNode;

  variant?: "default" | "glass";
};

export default function Card({
  title,

  subtitle,

  children,

  footer,

  variant = "default",
}: CardProps) {
  return (
    <section className={variant === "glass" ? "card card-glass" : "card"}>
      {(title || subtitle) && (
        <header className="card-header">
          {title && <h3 className="card-title">{title}</h3>}

          {subtitle && <p className="card-subtitle">{subtitle}</p>}
        </header>
      )}

      <div className="card-body">{children}</div>

      {footer && <footer className="card-footer">{footer}</footer>}
    </section>
  );
}
