export type FinoraCalendarMode =
  | "single"
  | "range";

export interface FinoraCalendarRangeValue {
  from: string;
  to: string;
}

export interface FinoraCalendarThemeOverride {
  page: string;
  surface: string;
  surfaceMuted: string;

  textPrimary: string;
  textSecondary: string;
  textMuted: string;

  brand: string;

  border: string;
  borderStrong: string;

  shadow: string;
}

export interface FinoraCalendarCommonProps {
  min?: string;
  max?: string;
  disabled?: boolean;
  allowClear?: boolean;
  allowToday?: boolean;
  placeholder?: string;
  ariaLabel?: string;
  showRelativeDay?: boolean;
  themeOverride?: FinoraCalendarThemeOverride;
}

export interface FinoraCalendarSingleProps
  extends FinoraCalendarCommonProps {

  mode?: "single";

  value: string;

  onChange:
    (value: string) => void;
}

export interface FinoraCalendarRangeProps
  extends FinoraCalendarCommonProps {

  mode: "range";

  value: FinoraCalendarRangeValue;

  onChange:
    (value: FinoraCalendarRangeValue) => void;

  fromLabel?: string;

  toLabel?: string;

  showDuration?: boolean;
}

export type FinoraCalendarProps =
  | FinoraCalendarSingleProps
  | FinoraCalendarRangeProps;
