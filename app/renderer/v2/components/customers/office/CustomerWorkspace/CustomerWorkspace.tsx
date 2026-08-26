/* ===========================================================
   FINORA ENTERPRISE OS™
   CUSTOMER WORKSPACE™

   COMPONENT
=========================================================== */

import EmptyState from "../../../common/feedback/EmptyState";

import type { CustomerWorkspaceProps } from "./types";

import { hasCustomer, buildEmptyWorkspace } from "./helpers";

import { useResponsive } from "../../../../utils/responsive";

import { createCustomerWorkspaceStyles } from "./styles";

import CustomerProfilePanel from "../CustomerOffice/components/CustomerProfilePanel";

import CustomerActionsPanel from "../CustomerOffice/components/CustomerActionsPanel";

import CustomerLoanPanel from "../CustomerOffice/components/CustomerLoanPanel";

import LoanStudio from "../CustomerOffice/components/LoanStudio";

import CollectionStudio from "../CustomerOffice/components/CollectionStudio";

import { useState } from "react";

/* ===========================================================
   COMPONENT
=========================================================== */

export default function CustomerWorkspace({
  selectedCustomer,
}: CustomerWorkspaceProps) {
  const [workspace, setWorkspace] = useState<
    "overview" | "loan" | "collection" | "documents" | "timeline" | "reports"
  >("overview");

  /* =========================================================
     RESPONSIVE ENGINE
  ========================================================= */

  const { tokens } = useResponsive();

  /* =========================================================
     RESPONSIVE STYLES
  ========================================================= */

  const {
    containerStyle,

    sidebarStyle,

    contentStyle,
  } = createCustomerWorkspaceStyles(tokens);

  if (!hasCustomer(selectedCustomer)) {
    const emptyWorkspace = buildEmptyWorkspace();

    return (
      <EmptyState
        title={emptyWorkspace.title}
        description={emptyWorkspace.description}
      />
    );
  }

  return (
    <section style={containerStyle}>
      {/* ==========================================
          LEFT SIDEBAR
      ========================================== */}

      <aside style={sidebarStyle}>
        <CustomerProfilePanel customer={selectedCustomer!} />

        <CustomerActionsPanel
          onApplyLoan={() => setWorkspace("loan")}
          onCollectPayment={() => setWorkspace("collection")}
          onDocuments={() => setWorkspace("documents")}
          onTimeline={() => setWorkspace("timeline")}
          onReports={() => setWorkspace("reports")}
        />
      </aside>

      {/* ==========================================
          RIGHT CONTENT
      ========================================== */}

      <section style={contentStyle}>
        {workspace === "overview" && (
          <CustomerLoanPanel customer={selectedCustomer!} />
        )}

        {workspace === "loan" && (
          <LoanStudio
            customerName={selectedCustomer!.name}
            customerId={selectedCustomer!.id}
            phoneNumber={selectedCustomer!.phone}
          />
        )}

        {workspace === "collection" && (
          <CollectionStudio
            customerName={selectedCustomer!.name}
            customerId={selectedCustomer!.id}
            phoneNumber={selectedCustomer!.phone}
            loans={selectedCustomer!.loans ?? []}
          />
        )}

        {/* Timeline */}

        {/* Reports */}
      </section>
    </section>
  );
}
