import { registerPlugin } from "@capacitor/core";

// Register the Android FinoraControl plugin exactly once.
// Other bridges use this shared proxy with their own TypeScript interfaces.
export const finoraControlShared =
  registerPlugin<object>("FinoraControl");