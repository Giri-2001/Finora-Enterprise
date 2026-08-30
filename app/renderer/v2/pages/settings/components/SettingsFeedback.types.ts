// ============================================================
// FINORA ENTERPRISE OS™
//
// ENTERPRISE SETTINGS
// SETTINGS FEEDBACK TYPES
//
// RESPONSIBILITY:
//
// - Define shared Settings feedback contracts
// - Define supported feedback severity kinds
// - Keep feedback presentation type-safe
//
// IMPORTANT:
//
// - TYPES ONLY.
// - No React component.
// - No icons.
// - No styles.
// - No theme values.
// - No responsive values.
// - No persistence.
// - No business logic.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

// ============================================================
// FEEDBACK KIND
// ============================================================

export type SettingsFeedbackKind =
  | "success"
  | "warning"
  | "danger"
  | "info";

// ============================================================
// FEEDBACK MODEL
// ============================================================

export interface SettingsFeedbackMessage {
  kind:
    SettingsFeedbackKind;

  title:
    string;

  message:
    string;
}

// ============================================================
// FEEDBACK PROPS
// ============================================================

export interface SettingsFeedbackProps
  extends SettingsFeedbackMessage {

  dismissible?:
    boolean;

  onDismiss?:
    () => void;
}

// ============================================================
// END
// ============================================================
