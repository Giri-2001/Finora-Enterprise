import type { ReactNode } from "react";
import "../../styles/card.css";

type CardProps = {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
};

export default function Card({
  title,
  subtitle,
  children,
  footer,
}: CardProps) {
  return (
    <section className="card">
      {(title || subtitle) && (
        <header
          className="card-header"
        >
          {title && (
            <h3 className="card-title">
              {title}
            </h3>
          )}

          {subtitle && (
            <p
              className="card-subtitle"
            >
              {subtitle}
            </p>
          )}
        </header>
      )}

      <div className="card-body">
        {children}
      </div>

      {footer && (
        <footer
          className="card-footer"
        >
          {footer}
        </footer>
      )}
    </section>
  );
}
