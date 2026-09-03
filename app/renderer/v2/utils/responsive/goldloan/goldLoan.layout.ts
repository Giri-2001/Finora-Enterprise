/* ===========================================================
   FINORA ENTERPRISE OS™

   GOLD LOAN ENGINE™

   GOLD LOAN RESPONSIVE LAYOUT

   MODULE  : Gold Loan
   LAYER   : Responsive Geometry
   VERSION : 1.0
   STATUS  : Production Foundation

   RESPONSIBILITY:

   - Resolve complete Gold Loan page geometry
   - Resolve Customer / Locker top workspace
   - Preserve 30% / 70% layout on Laptop / Desktop
   - Stack workspace safely on Mobile / Tablet
   - Resolve Locker grid
   - Resolve Rack grid
   - Resolve Gold valuation form
   - Resolve Gold Items layout
   - Resolve Storage Allocation layout
   - Resolve action layout

   IMPORTANT:

   - No React.
   - No window access.
   - No theme colors.
   - No business calculations.
   - No component state.
   - No CSS media queries.
   - No inline component layout calculations.

   TOP WORKSPACE:

   LAPTOP / DESKTOP

   ┌──────────────────────┬───────────────────────────────────┐
   │ CUSTOMER             │ GOLD LOCKER ROOM                  │
   │ 30%                  │ 70%                               │
   └──────────────────────┴───────────────────────────────────┘

   TABLET / MOBILE

   ┌──────────────────────────────────────────────────────────┐
   │ CUSTOMER                                                 │
   └──────────────────────────────────────────────────────────┘

   ┌──────────────────────────────────────────────────────────┐
   │ GOLD LOCKER ROOM                                         │
   └──────────────────────────────────────────────────────────┘

=========================================================== */

/* ===========================================================
   IMPORTS
=========================================================== */

import {
  resolveGoldLoanActionColumns,
  resolveGoldLoanFormFieldColumns,
  resolveGoldLoanItemColumns,
  resolveGoldLoanLockerColumns,
  resolveGoldLoanRackColumns,
  resolveGoldLoanSummaryColumns,
  shouldStackGoldLoanTopWorkspace,
} from "./goldLoan.helpers";

import { getGoldLoanModuleTokens } from "./goldLoan.tokens";

import type {
  GoldLoanActionLayout,
  GoldLoanCustomerSelectorLayout,
  GoldLoanFormLayout,
  GoldLoanItemsLayout,
  GoldLoanLayout,
  GoldLoanLayoutInput,
  GoldLoanLockerCardLayout,
  GoldLoanLockerRoomLayout,
  GoldLoanPageLayout,
  GoldLoanRackCardLayout,
  GoldLoanRackGridLayout,
  GoldLoanStorageAllocationLayout,
  GoldLoanTopWorkspaceLayout,
  GoldLoanValuationLayout,
} from "./goldLoan.types";

/* ===========================================================
   PAGE WIDTH
=========================================================== */

const FULL_WIDTH = "100%";

/* ===========================================================
   LARGE SCREEN WORKSPACE WIDTHS
=========================================================== */

const CUSTOMER_WORKSPACE_WIDTH = "30%";

const LOCKER_WORKSPACE_WIDTH = "70%";

/* ===========================================================
   COMPACT WORKSPACE WIDTH
=========================================================== */

const STACKED_WORKSPACE_WIDTH = "100%";

/* ===========================================================
   RESOLVE PAGE LAYOUT
=========================================================== */

function resolvePageLayout(input: GoldLoanLayoutInput): GoldLoanPageLayout {
  const moduleTokens = getGoldLoanModuleTokens(input.device);

  return {
    width: FULL_WIDTH,

    maxWidth: FULL_WIDTH,

    pagePadding: moduleTokens.spacing.pageX,

    sectionGap: moduleTokens.spacing.sectionGap,

    panelGap: moduleTokens.spacing.panelGap,

    panelRadius: moduleTokens.panel.radius,
  };
}

/* ===========================================================
   RESOLVE TOP WORKSPACE

   IMPORTANT:

   Laptop / Desktop:
   - 30% Customer
   - 70% Locker

   Gap is handled by the parent Grid/Flex container.

   Therefore individual panels use minmax-safe proportions
   in the component style layer rather than performing
   viewport arithmetic inside React.
=========================================================== */

function resolveTopWorkspaceLayout(
  input: GoldLoanLayoutInput,
): GoldLoanTopWorkspaceLayout {
  const moduleTokens = getGoldLoanModuleTokens(input.device);

  const isStacked = shouldStackGoldLoanTopWorkspace(input.device);

  const workspaceHeight = moduleTokens.panel.topWorkspaceMinHeight;

  return {
    columns: isStacked ? 1 : 2,

    customerWidth: isStacked
      ? STACKED_WORKSPACE_WIDTH
      : CUSTOMER_WORKSPACE_WIDTH,

    lockerWidth: isStacked ? STACKED_WORKSPACE_WIDTH : LOCKER_WORKSPACE_WIDTH,

    gap: moduleTokens.spacing.panelGap,

    minHeight: workspaceHeight,

    customerPanelHeight: workspaceHeight,

    lockerPanelHeight: workspaceHeight,

    isStacked,
  };
}

/* ===========================================================
   RESOLVE CUSTOMER SELECTOR LAYOUT
=========================================================== */

function resolveCustomerSelectorLayout(
  input: GoldLoanLayoutInput,
): GoldLoanCustomerSelectorLayout {
  const moduleTokens = getGoldLoanModuleTokens(input.device);

  return {
    width: FULL_WIDTH,

    minHeight: moduleTokens.panel.topWorkspaceMinHeight,

    padding: moduleTokens.spacing.panelPadding,

    radius: moduleTokens.panel.radius,

    photoSize: moduleTokens.customer.selectedPhotoSize,

    fieldHeight: moduleTokens.control.inputHeight,

    gap: moduleTokens.customer.customerGap,
  };
}

/* ===========================================================
   RESOLVE LOCKER ROOM LAYOUT
=========================================================== */

function resolveLockerRoomLayout(
  input: GoldLoanLayoutInput,
): GoldLoanLockerRoomLayout {
  const moduleTokens = getGoldLoanModuleTokens(input.device);

  return {
    width: FULL_WIDTH,

    minHeight: moduleTokens.panel.topWorkspaceMinHeight,

    padding: moduleTokens.spacing.panelPadding,

    radius: moduleTokens.panel.radius,

    headerGap: moduleTokens.spacing.cardGap,

    lockerGridColumns: resolveGoldLoanLockerColumns(input.device),

    lockerGap: moduleTokens.spacing.cardGap,
  };
}

/* ===========================================================
   RESOLVE LOCKER CARD LAYOUT
=========================================================== */

function resolveLockerCardLayout(
  input: GoldLoanLayoutInput,
): GoldLoanLockerCardLayout {
  const moduleTokens = getGoldLoanModuleTokens(input.device);

  return {
    minHeight: moduleTokens.locker.cardMinHeight,

    padding: moduleTokens.locker.cardPadding,

    radius: moduleTokens.locker.cardRadius,

    gap: moduleTokens.spacing.compactGap,

    statusHeight: moduleTokens.locker.statusHeight,

    progressHeight: moduleTokens.locker.progressHeight,

    viewButtonHeight: moduleTokens.locker.viewButtonHeight,
  };
}

/* ===========================================================
   RESOLVE RACK GRID
=========================================================== */

function resolveRackGridLayout(
  input: GoldLoanLayoutInput,
): GoldLoanRackGridLayout {
  const moduleTokens = getGoldLoanModuleTokens(input.device);

  return {
    columns: resolveGoldLoanRackColumns(input.device),

    gap: moduleTokens.spacing.cardGap,

    cardMinWidth: moduleTokens.rack.cardMinWidth,

    cardMinHeight: moduleTokens.rack.cardMinHeight,
  };
}

/* ===========================================================
   RESOLVE RACK CARD
=========================================================== */

function resolveRackCardLayout(
  input: GoldLoanLayoutInput,
): GoldLoanRackCardLayout {
  const moduleTokens = getGoldLoanModuleTokens(input.device);

  return {
    padding: moduleTokens.rack.cardPadding,

    radius: moduleTokens.rack.cardRadius,

    gap: moduleTokens.spacing.compactGap,

    progressHeight: moduleTokens.rack.progressHeight,

    actionHeight: moduleTokens.rack.actionHeight,
  };
}

/* ===========================================================
   RESOLVE FULL-WIDTH FORM
=========================================================== */

function resolveFormLayout(input: GoldLoanLayoutInput): GoldLoanFormLayout {
  const moduleTokens = getGoldLoanModuleTokens(input.device);

  return {
    width: FULL_WIDTH,

    sectionColumns: 1,

    fieldColumns: resolveGoldLoanFormFieldColumns(input.device),

    sectionGap: moduleTokens.spacing.sectionGap,

    rowGap: moduleTokens.spacing.rowGap,

    fieldGap: moduleTokens.spacing.fieldGap,

    sectionPadding: moduleTokens.spacing.panelPadding,

    sectionRadius: moduleTokens.panel.radius,
  };
}

/* ===========================================================
   RESOLVE VALUATION LAYOUT
=========================================================== */

function resolveValuationLayout(
  input: GoldLoanLayoutInput,
): GoldLoanValuationLayout {
  const moduleTokens = getGoldLoanModuleTokens(input.device);

  return {
    columns: resolveGoldLoanFormFieldColumns(input.device),

    gap: moduleTokens.spacing.fieldGap,

    summaryColumns:
      input.device === "laptop"
        ? 4
        : resolveGoldLoanSummaryColumns(input.device),

    inputHeight: moduleTokens.control.inputHeight,
  };
}

/* ===========================================================
   RESOLVE GOLD ITEMS LAYOUT
=========================================================== */

function resolveItemsLayout(input: GoldLoanLayoutInput): GoldLoanItemsLayout {
  const moduleTokens = getGoldLoanModuleTokens(input.device);

  return {
    columns: resolveGoldLoanItemColumns(input.device),

    gap: moduleTokens.spacing.cardGap,

    itemCardMinHeight: moduleTokens.item.cardMinHeight,

    itemCardPadding: moduleTokens.item.cardPadding,

    itemCardRadius: moduleTokens.item.cardRadius,

    summaryColumns: resolveGoldLoanSummaryColumns(input.device),
  };
}

/* ===========================================================
   RESOLVE STORAGE ALLOCATION LAYOUT
=========================================================== */

function resolveStorageAllocationLayout(
  input: GoldLoanLayoutInput,
): GoldLoanStorageAllocationLayout {
  const moduleTokens = getGoldLoanModuleTokens(input.device);

  const fieldColumns = resolveGoldLoanFormFieldColumns(input.device);

  const locatorColumns = resolveGoldLoanSummaryColumns(input.device);

  return {
    columns: fieldColumns,

    gap: moduleTokens.spacing.fieldGap,

    locatorColumns,

    controlHeight: moduleTokens.control.inputHeight,
  };
}

/* ===========================================================
   RESOLVE ACTION LAYOUT
=========================================================== */

function resolveActionLayout(input: GoldLoanLayoutInput): GoldLoanActionLayout {
  const moduleTokens = getGoldLoanModuleTokens(input.device);

  const columns = resolveGoldLoanActionColumns(input.device);

  return {
    columns,

    gap: moduleTokens.spacing.cardGap,

    buttonHeight: moduleTokens.control.buttonHeight,

    isStacked: columns === 1,
  };
}

/* ===========================================================
   CREATE COMPLETE GOLD LOAN LAYOUT
=========================================================== */

export function createGoldLoanLayout(
  input: GoldLoanLayoutInput,
): GoldLoanLayout {
  return {
    device: input.device,

    page: resolvePageLayout(input),

    topWorkspace: resolveTopWorkspaceLayout(input),

    customerSelector: resolveCustomerSelectorLayout(input),

    lockerRoom: resolveLockerRoomLayout(input),

    lockerCard: resolveLockerCardLayout(input),

    rackGrid: resolveRackGridLayout(input),

    rackCard: resolveRackCardLayout(input),

    form: resolveFormLayout(input),

    valuation: resolveValuationLayout(input),

    items: resolveItemsLayout(input),

    storageAllocation: resolveStorageAllocationLayout(input),

    actions: resolveActionLayout(input),
  };
}

/* ===========================================================
   END
=========================================================== */
