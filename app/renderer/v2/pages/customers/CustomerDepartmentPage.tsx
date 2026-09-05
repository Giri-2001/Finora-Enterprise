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

  useEffect(() => {

    const normalizedBusinessId =
      businessId?.trim() ?? "";

    setCompanyName(undefined);
    setBranchName(undefined);

    if (!normalizedBusinessId) {
      return;
    }

    try {

      const context =
        requireBusinessContext();

      const profile =
        context.businessProfile;

      if (!profile) {

        console.error(
          "[FINORA CUSTOMER DEPARTMENT] Signed Business Profile is unavailable.",
        );

        return;
      }

      if (
        context.businessId?.trim() !==
          normalizedBusinessId ||
        profile.businessId !==
          normalizedBusinessId ||
        profile.ownerId !==
          context.ownerId ||
        profile.branchId !==
          context.branchId
      ) {

        console.error(
          "[FINORA CUSTOMER DEPARTMENT] Signed Business Profile does not match the active FINORA scope.",
        );

        return;
      }

      const resolvedBusinessName =
        profile.businessName.trim();

      const resolvedBranchName =
        profile.branchName.trim();

      setCompanyName(
        resolvedBusinessName.length > 0
          ? resolvedBusinessName
          : undefined,
      );

      setBranchName(
        resolvedBranchName.length > 0
          ? resolvedBranchName
          : undefined,
      );

    } catch (error) {

      console.error(
        "[FINORA CUSTOMER DEPARTMENT] Unable to resolve signed Business Profile:",
        error,
      );
    }

  }, [businessId]);

  return (
    <CustomerDepartment
        companyName={companyName}
        branchName={branchName}
    />
  );
}