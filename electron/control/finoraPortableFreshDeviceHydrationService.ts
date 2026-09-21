import {
  applyFinoraPortableFreshDeviceHydrationState,
} from "./finoraControlStore.js";

import {
  ensureFinoraWindowsInstallationBinding,
} from "./finoraInstallationBindingService.js";

import {
  hydrateFinoraPortableFreshDeviceControlState,
} from "./finoraPortableFreshDeviceHydrationCoordinator.js";

import type {
  FinoraFreshDeviceBootstrapHydrationPlan,
} from "./finoraPortableFreshDeviceBootstrapCoordinator.js";

import type {
  FinoraPortableFreshDeviceHydrationResult,
} from "./finoraPortableFreshDeviceHydrationCoordinator.js";

// ============================================================
// PRODUCTION ADAPTER
// ============================================================

export async function hydrateFinoraPortableFreshDeviceFromPlan(
  plan:
    FinoraFreshDeviceBootstrapHydrationPlan,
): Promise<
  FinoraPortableFreshDeviceHydrationResult
> {
  return hydrateFinoraPortableFreshDeviceControlState(
    plan,
    {
      ensureNativeBinding:
        ensureFinoraWindowsInstallationBinding,

      applyAtomicState:
        async (
          input,
        ) => {
          const result =
            await applyFinoraPortableFreshDeviceHydrationState(
              input,
            );

          if (
            !result.success ||
            !result.data
          ) {
            return {
              success:
                false,

              error:
                result.error ??
                "FINORA fresh-device Control Store hydration failed.",
            };
          }

          return {
            success:
              true,

            status:
              result.data.status,
          };
        },

      now:
        () =>
          new Date(),
    },
  );
}