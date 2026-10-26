/* ===========================================================
   FINORA ENTERPRISE OS
   CUSTOMER DEPARTMENT PAGE

   PAGE ORCHESTRATION
=========================================================== */

import {
  useEffect,
  useState,
} from "react";

import CustomerDepartment from "../../components/customers/hub/CustomerDepartment";

import {
  requireBusinessContext,
} from "../../services/business/businessContextService";

import {
  resolveCustomerCreateWalletEntryGate,
  type FinoraWalletEntryGateResult,
} from "../../services/wallet/walletEntryGateService";

import {
  subscribeWalletBalanceUpdates,
} from "../../services/wallet/walletBalanceEvent";

/* ===========================================================
   PROPS
=========================================================== */

interface CustomerDepartmentPageProps {
  businessId?: string;
}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function CustomerDepartmentPage({
  businessId,
}: CustomerDepartmentPageProps) {
  const [companyName, setCompanyName] = useState<
    string | undefined
  >(undefined);

  const [branchName, setBranchName] = useState<
    string | undefined
  >(undefined);

  const [
    customerCreateGate,
    setCustomerCreateGate,
  ] = useState<FinoraWalletEntryGateResult | null>(
    null,
  );

  useEffect(() => {
    const normalizedBusinessId =
      businessId?.trim() ?? "";

    setCompanyName(undefined);
    setBranchName(undefined);
    setCustomerCreateGate(null);

    if (!normalizedBusinessId) {
      return;
    }

    let active = true;

    void (async () => {
      try {
        const context =
          requireBusinessContext();

        // FINORA_P1_719M_CROSS_DEVICE_CUSTOMER
        // A local signed profile is optional for the modern
        // server-authorized path. If present, it must match.
        // The commercial and live Wallet gates below remain
        // mandatory and fail closed for unauthorized sessions.
        const profile = context.businessProfile;

        if (
          context.businessId?.trim() !== normalizedBusinessId ||
          !context.ownerId?.trim() ||
          !context.branchId?.trim()
        ) {
          console.error(
            "[FINORA CUSTOMER] Authenticated business scope mismatch.",
          );
          return;
        }

        if (
          profile &&
          (
            profile.businessId !== normalizedBusinessId ||
            profile.ownerId !== context.ownerId ||
            profile.branchId !== context.branchId
          )
        ) {
          console.error(
            "[FINORA CUSTOMER] Signed profile scope mismatch.",
          );
          return;
        }

        if (active && profile) {
          const resolvedBusinessName =
            profile.businessName.trim();

          const resolvedBranchName =
            profile.branchName.trim();

          setCompanyName(
            resolvedBusinessName || undefined,
          );

          setBranchName(
            resolvedBranchName || undefined,
          );
        }

        // No client-side authorization bypass:
        // verify commercial access, server pricing and
        // PostgreSQL Wallet balance before enabling entry.
        const gateResult =
          await resolveCustomerCreateWalletEntryGate({
            ownerId:
              context.ownerId,

            businessId:
              context.businessId,

            branchId:
              context.branchId,
          });

        if (active) {
          setCustomerCreateGate(
            gateResult,
          );
        }
      } catch (error) {
        console.error(
          "[FINORA CUSTOMER DEPARTMENT] Unable to resolve signed Business Profile or Customer Wallet Entry Gate:",
          error,
        );
      }
    })();

    return () => {
      active = false;
    };
  }, [businessId]);

  useEffect(() => {
    const unsubscribe =
      subscribeWalletBalanceUpdates(() => {
        const normalizedBusinessId =
          businessId?.trim() ?? "";

        if (!normalizedBusinessId) {
          return;
        }

        void (async () => {
          try {
            const context =
              requireBusinessContext();

            if (
              context.businessId?.trim() !==
                normalizedBusinessId
            ) {
              return;
            }

            const ownerId =
              context.ownerId?.trim() ?? "";

            const scopedBusinessId =
              context.businessId?.trim() ?? "";

            const branchId =
              context.branchId?.trim() ?? "";

            if (
              !ownerId ||
              !scopedBusinessId ||
              !branchId
            ) {
              return;
            }

            const gateResult =
              await resolveCustomerCreateWalletEntryGate({
                ownerId,

                businessId:
                  scopedBusinessId,

                branchId,
              });

            setCustomerCreateGate(
              gateResult,
            );
          } catch (error) {
            console.error(
              "[FINORA CUSTOMER DEPARTMENT] Unable to refresh Customer Wallet Entry Gate:",
              error,
            );
          }
        })();
      });

    return unsubscribe;
  }, [businessId]);
  return (
    <CustomerDepartment
      companyName={companyName}
      branchName={branchName}
      customerCreateGate={customerCreateGate}
    />
  );
}



