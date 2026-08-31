// ============================================================
// FINORA ENTERPRISE OS™
//
// ENTERPRISE SETTINGS
// NUMBERING & SERIES FORM TYPES
//
// RESPONSIBILITY:
//
// - Define the presentation contract for Numbering & Series
// - Keep Settings form state strongly typed
// - Keep service orchestration outside the presentation form
//
// IMPORTANT:
//
// - No React.
// - No persistence.
// - No service calls.
// - No repository access.
// - No StorageManager access.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

import type {
  CustomerNumberPreview,
  CustomerSeriesConfiguration,
  CustomerSeriesSetupPreview,
} from "../../../types/numbering/numbering.types";

// ============================================================
// PROPS
// ============================================================

export interface NumberingSeriesSettingsFormProps {

  configuration:
    CustomerSeriesConfiguration | null;

  setupPreview:
    CustomerSeriesSetupPreview | null;

  nextPreview:
    CustomerNumberPreview | null;

  startingCustomerNumber:
    string;

  disabled?:
    boolean;

  saving?:
    boolean;

  onStartingCustomerNumberChange:
    (value: string) => void;

  onSubmit:
    () => void;
}

// ============================================================
// END
// ============================================================
