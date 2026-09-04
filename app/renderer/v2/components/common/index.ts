/* ===========================================================
   FINORA ENTERPRISE V2
   COMMON COMPONENT EXPORTS
=========================================================== */

/* ===========================================================
   FORM
=========================================================== */

export * from "./form";

/* ===========================================================
   BUTTONS
=========================================================== */

export { default as Button } from "./buttons/Button";

export type {
  ButtonProps,
  ButtonVariant,
} from "./buttons/Button";

/* ===========================================================
   FEEDBACK
=========================================================== */

export { default as StatusBadge } from "./feedback/StatusBadge";
export { default as EmptyState } from "./feedback/EmptyState";
export { default as LoadingState } from "./feedback/LoadingState";

export type {
  StatusBadgeProps,
  StatusVariant,
} from "./feedback/StatusBadge";

export type { EmptyStateProps } from "./feedback/EmptyState";

export type { LoadingStateProps } from "./feedback/LoadingState";

/* ===========================================================
   CARDS
=========================================================== */

export { default as SummaryCard } from "./cards/SummaryCard";

export type { SummaryCardProps } from "./cards/SummaryCard";

export { default as GlobalLoadingOverlay } from "./feedback/GlobalLoadingOverlay";
export type { GlobalLoadingOverlayProps } from "./feedback/GlobalLoadingOverlay";

export { default as FinoraProcessingHost } from "./feedback/FinoraProcessingHost";

export {
  finoraProcessing,
  startFinoraProcessing,
  updateFinoraProcessing,
  stopFinoraProcessing,
  clearFinoraProcessing,
  runWithFinoraProcessing,
} from "./feedback/finoraProcessing.service";

export type {
  FinoraProcessingRequest,
} from "./feedback/finoraProcessing.service";


/* ===========================================================
   CALENDAR
=========================================================== */

export * from "./calendar";
