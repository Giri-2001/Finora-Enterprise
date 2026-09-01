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
  businessIdentityService,
} from "../../services/business/businessService";

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

  useEffect(() => {
    let active = true;

    const normalizedBusinessId =
      businessId?.trim() ?? "";

    setCompanyName(undefined);

    if (!normalizedBusinessId) {
      return () => {
        active = false;
      };
    }

    void (async () => {
      const result =
        await businessIdentityService.load(
          normalizedBusinessId,
        );

      if (!active) {
        return;
      }

      if (
        !result.success ||
        !result.data
      ) {
        return;
      }

      const resolvedBusinessName =
        result.data.businessName.trim();

      setCompanyName(
        resolvedBusinessName.length > 0
          ? resolvedBusinessName
          : undefined,
      );
    })();

    return () => {
      active = false;
    };
  }, [businessId]);

  return (
    <CustomerDepartment
      companyName={companyName}
    />
  );
}