// ============================================================
// FINORA ENTERPRISE OS™
//
// ENTERPRISE SETTINGS
// SETTINGS FEEDBACK
//
// RESPONSIBILITY:
//
// - Render shared Settings feedback messages
// - Resolve severity icon presentation
// - Support optional feedback dismissal
//
// IMPORTANT:
//
// - No inline styles.
// - No theme values.
// - No responsive values.
// - No persistence.
// - No business logic.
// - Severity colors belong to CSS / Theme Engine.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

import {
  CircleAlert,
  CircleCheck,
  Info,
  TriangleAlert,
  X,
} from "lucide-react";

import type {
  SettingsFeedbackKind,
  SettingsFeedbackProps,
} from "./SettingsFeedback.types";

// ============================================================
// ICON
// ============================================================

function SettingsFeedbackIcon({
  kind,
}: {
  kind: SettingsFeedbackKind;
}) {

  const className =
    "finora-settings-feedback__icon-svg";

  if (kind === "success") {
    return (
      <CircleCheck
        className={className}
        aria-hidden="true"
      />
    );
  }

  if (kind === "warning") {
    return (
      <TriangleAlert
        className={className}
        aria-hidden="true"
      />
    );
  }

  if (kind === "danger") {
    return (
      <CircleAlert
        className={className}
        aria-hidden="true"
      />
    );
  }

  return (
    <Info
      className={className}
      aria-hidden="true"
    />
  );
}

// ============================================================
// COMPONENT
// ============================================================

export default function SettingsFeedback({
  kind,
  title,
  message,
  dismissible = false,
  onDismiss,
}: SettingsFeedbackProps) {

  const feedbackClassName = [
    "finora-settings-feedback",
    `finora-settings-feedback--${kind}`,
  ].join(" ");

  const showDismiss =
    dismissible &&
    typeof onDismiss === "function";

  return (
    <div
      className={feedbackClassName}
      role={
        kind === "danger"
          ? "alert"
          : "status"
      }
    >
      <span className="finora-settings-feedback__icon">
        <SettingsFeedbackIcon
          kind={kind}
        />
      </span>

      <div className="finora-settings-feedback__content">
        <strong className="finora-settings-feedback__title">
          {title}
        </strong>

        <p className="finora-settings-feedback__message">
          {message}
        </p>
      </div>

      {showDismiss && (
        <button
          type="button"
          className="finora-settings-feedback__dismiss"
          aria-label="Dismiss message"
          onClick={onDismiss}
        >
          <X
            className="finora-settings-feedback__dismiss-icon"
            aria-hidden="true"
          />
        </button>
      )}
    </div>
  );
}

// ============================================================
// END
// ============================================================
