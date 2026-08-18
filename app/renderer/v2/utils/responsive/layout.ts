/* ===========================================================
   FINORA ENTERPRISE OS™
   RESPONSIVE ENGINE™

   LAYOUT

   RESPONSIBILITY:
   - Reusable responsive layout calculations
   - Page/content dimensions
   - Grid calculations
   - Card layout calculations
   - Sidebar/content calculations
   - Responsive width calculations

   IMPORTANT:
   - Breakpoint decisions belong to breakpoints.ts
   - Device detection belongs to helpers.ts
   - Visual tokens belong to tokens.ts
   - Type contracts belong to types.ts
   - Live viewport state belongs to useResponsive.ts
=========================================================== */

import type {
  ResponsiveLayout,
  ResponsiveCard,
} from "./types";

import type {
  ResponsiveTokens,
} from "./tokens";

import {
  getResponsiveViewportTokens,
} from "./tokens";


/* ===========================================================
   SAFE NUMBER
=========================================================== */

export function safeNumber(
  value: number,
  fallback: number = 0,
): number {

  if (!Number.isFinite(value)) {
    return fallback;
  }

  return value;
}




/* ===========================================================
   CLAMP
=========================================================== */

export function clamp(
  value: number,
  min: number,
  max: number,
): number {

  const safeValue = safeNumber(value);
  const safeMin = safeNumber(min);
  const safeMax = safeNumber(max);

  if (safeMax < safeMin) {
    return safeMin;
  }

  return Math.min(
    Math.max(safeValue, safeMin),
    safeMax,
  );

}




/* ===========================================================
   PAGE WIDTH
=========================================================== */

export function getPageWidth(
  viewportWidth: number,
  tokens: ResponsiveTokens,
): number {

  const width =
    safeNumber(viewportWidth);

  const gutter =
    Math.max(
      0,
      safeNumber(tokens.layout.pageGutter),
    );

  const maxWidth =
    safeNumber(
      tokens.layout.maxContentWidth,
      width,
    );

  return Math.min(
    Math.max(
      0,
      width - gutter * 2,
    ),
    maxWidth,
  );

}

// ===========================================================
// CUSTOMER CARDS PER PAGE
//
// Responsibility:
// - Resolve the number of customer cards for the current
//   responsive viewport.
// - Responsive values remain inside tokens.ts.
// - This helper only reads the resolved token.
//
// ===========================================================

export function getCustomerCardsPerPage(
  viewportWidth: number,
): number {

  const width =
    safeNumber(viewportWidth);

  const tokens =
    getResponsiveViewportTokens(
      width,
    );

  return Math.max(
    1,
    Math.round(
      tokens.customerCards.columns,
    ),
  );

}


/* ===========================================================
   CONTENT WIDTH
=========================================================== */

export function getContentWidth(
  viewportWidth: number,
  tokens: ResponsiveTokens,
): number {

  return getPageWidth(
    viewportWidth,
    tokens,
  );

}


/* ===========================================================
   CONTENT MAX WIDTH
=========================================================== */

export function getContentMaxWidth(
  tokens: ResponsiveTokens,
): number {

  return Math.max(
    0,
    safeNumber(
      tokens.layout.maxContentWidth,
    ),
  );

}


/* ===========================================================
   PAGE GUTTER
=========================================================== */

export function getPageGutter(
  tokens: ResponsiveTokens,
): number {

  return Math.max(
    0,
    safeNumber(
      tokens.layout.pageGutter,
    ),
  );

}


/* ===========================================================
   CONTENT GAP
=========================================================== */

export function getContentGap(
  tokens: ResponsiveTokens,
): number {

  return Math.max(
    0,
    safeNumber(
      tokens.layout.contentGap,
    ),
  );

}


/* ===========================================================
   CARD GAP
=========================================================== */

export function getCardGap(
  tokens: ResponsiveTokens,
): number {

  return Math.max(
    0,
    safeNumber(
      tokens.layout.cardGap,
    ),
  );

}


/* ===========================================================
   SECTION GAP
=========================================================== */

export function getSectionGap(
  tokens: ResponsiveTokens,
): number {

  return Math.max(
    0,
    safeNumber(
      tokens.layout.sectionGap,
    ),
  );

}


/* ===========================================================
   HEADER HEIGHT
=========================================================== */

export function getHeaderHeight(
  tokens: ResponsiveTokens,
): number {

  return Math.max(
    0,
    safeNumber(
      tokens.layout.headerHeight,
    ),
  );

}


/* ===========================================================
   SIDEBAR WIDTH
=========================================================== */

export function getSidebarWidth(
  tokens: ResponsiveTokens,
): number {

  return Math.max(
    0,
    safeNumber(
      tokens.layout.sidebarWidth,
    ),
  );

}


/* ===========================================================
   AVAILABLE CONTENT WIDTH
=========================================================== */

export function getAvailableContentWidth(
  viewportWidth: number,
  tokens: ResponsiveTokens,
): number {

  const width =
    safeNumber(viewportWidth);

  const sidebar =
    getSidebarWidth(tokens);

  const gutter =
    getPageGutter(tokens);

  const available =
    width -
    sidebar -
    gutter * 2;

  return Math.max(
    0,
    Math.min(
      available,
      getContentMaxWidth(tokens),
    ),
  );

}


/* ===========================================================
   MAIN CONTENT WIDTH
=========================================================== */

export function getMainContentWidth(
  viewportWidth: number,
  tokens: ResponsiveTokens,
): number {

  return getAvailableContentWidth(
    viewportWidth,
    tokens,
  );

}


/* ===========================================================
   GRID COLUMNS
=========================================================== */

export function getGridColumns(
  tokens: ResponsiveTokens,
): number {

  return Math.max(
    1,
    Math.floor(
      safeNumber(
        tokens.grid.columns,
        1,
      ),
    ),
  );

}


/* ===========================================================
   GRID GAP
=========================================================== */

export function getGridGap(
  tokens: ResponsiveTokens,
): number {

  return Math.max(
    0,
    safeNumber(
      tokens.grid.gap,
    ),
  );

}


/* ===========================================================
   GRID MIN CARD WIDTH
=========================================================== */

export function getGridMinCardWidth(
  tokens: ResponsiveTokens,
): number {

  return Math.max(
    0,
    safeNumber(
      tokens.grid.minCardWidth,
    ),
  );

}


/* ===========================================================
   GRID TOTAL GAP
=========================================================== */

export function getGridTotalGap(
  tokens: ResponsiveTokens,
): number {

  const columns =
    getGridColumns(tokens);

  const gap =
    getGridGap(tokens);

  return Math.max(
    0,
    (columns - 1) * gap,
  );

}


/* ===========================================================
   GRID CARD WIDTH
=========================================================== */

export function getGridCardWidth(
  containerWidth: number,
  tokens: ResponsiveTokens,
): number {

  const width =
    Math.max(
      0,
      safeNumber(containerWidth),
    );

  const columns =
    getGridColumns(tokens);

  const totalGap =
    getGridTotalGap(tokens);

  const calculated =
    (width - totalGap) /
    columns;

  const minWidth =
    getGridMinCardWidth(tokens);

  return Math.max(
    minWidth,
    calculated,
  );

}


/* ===========================================================
   GRID WIDTHS
=========================================================== */

export function getGridCardWidths(
  containerWidth: number,
  tokens: ResponsiveTokens,
): number[] {

  const columns =
    getGridColumns(tokens);

  const cardWidth =
    getGridCardWidth(
      containerWidth,
      tokens,
    );

  return Array.from(
    { length: columns },
    () => cardWidth,
  );

}


/* ===========================================================
   CUSTOMER CARD WIDTH
=========================================================== */

export function getCustomerCardWidth(
  containerWidth: number,
  tokens: ResponsiveTokens,
): number {

  const columns =
    Math.max(
      1,
      Math.floor(
        safeNumber(
          tokens.customerCards.columns,
          1,
        ),
      ),
    );

  const gap =
    Math.max(
      0,
      safeNumber(
        tokens.customerCards.gap,
      ),
    );

  const totalGap =
    Math.max(
      0,
      (columns - 1) * gap,
    );

  const available =
    Math.max(
      0,
      safeNumber(containerWidth) -
      totalGap,
    );

  const calculated =
    available / columns;

  const configuredWidth =
    safeNumber(
      tokens.customerCards.width,
    );

  if (configuredWidth > 0) {
    return Math.min(
      calculated,
      configuredWidth,
    );
  }

  return calculated;

}


/* ===========================================================
   CUSTOMER CARD COLUMNS
=========================================================== */

export function getCustomerCardColumns(
  tokens: ResponsiveTokens,
): number {

  return Math.max(
    1,
    Math.floor(
      safeNumber(
        tokens.customerCards.columns,
        1,
      ),
    ),
  );

}


/* ===========================================================
   CARD WIDTH
=========================================================== */

export function getCardWidth(
  tokens: ResponsiveTokens,
) {

  return {
    width:
      tokens.card.width,

    height:
      "auto",
  };

}


/* ===========================================================
   CARD MAX WIDTH
=========================================================== */

export function getCardMaxWidth(
  tokens: ResponsiveTokens,
): number {

  return Math.max(
    0,
    safeNumber(
      tokens.card.maxWidth,
    ),
  );

}


/* ===========================================================
   CARD PADDING
=========================================================== */

export function getCardPadding(
  tokens: ResponsiveTokens,
): number {

  return Math.max(
    0,
    safeNumber(
      tokens.card.padding,
    ),
  );

}


/* ===========================================================
   CARD GAP
=========================================================== */

export function getCardInnerGap(
  tokens: ResponsiveTokens,
): number {

  return Math.max(
    0,
    safeNumber(
      tokens.card.gap,
    ),
  );

}


/* ===========================================================
   CONTAINER
=========================================================== */

export function getContainer(
  viewportWidth: number,
  tokens: ResponsiveTokens,
) {

  const width =
    getPageWidth(
      viewportWidth,
      tokens,
    );

  return {

    width,

    maxWidth:
      getContentMaxWidth(tokens),

    padding:
      getPageGutter(tokens),

  };

}


/* ===========================================================
   LAYOUT CONTRACT
=========================================================== */

export function getResponsiveLayout(
  tokens: ResponsiveTokens,
): ResponsiveLayout {

  return {

    pageGutter:
      Math.max(
        0,
        safeNumber(
          tokens.layout.pageGutter,
        ),
      ),

    contentGap:
      Math.max(
        0,
        safeNumber(
          tokens.layout.contentGap,
        ),
      ),

    cardGap:
      Math.max(
        0,
        safeNumber(
          tokens.layout.cardGap,
        ),
      ),

    sectionGap:
      Math.max(
        0,
        safeNumber(
          tokens.layout.sectionGap,
        ),
      ),

    maxContentWidth:
      Math.max(
        0,
        safeNumber(
          tokens.layout.maxContentWidth,
        ),
      ),

    headerHeight:
      Math.max(
        0,
        safeNumber(
          tokens.layout.headerHeight,
        ),
      ),

    sidebarWidth:
      Math.max(
        0,
        safeNumber(
          tokens.layout.sidebarWidth,
        ),
      ),

  };

}


/* ===========================================================
   CARD CONTRACT
=========================================================== */

export function getResponsiveCard(
  tokens: ResponsiveTokens,
): ResponsiveCard {

  return {

    width:
      tokens.card.width,

    minWidth:
      Math.max(
        0,
        safeNumber(
          tokens.card.minWidth,
        ),
      ),

    maxWidth:
      Math.max(
        0,
        safeNumber(
          tokens.card.maxWidth,
        ),
      ),

    minHeight:
      Math.max(
        0,
        safeNumber(
          tokens.card.minHeight,
        ),
      ),

    padding:
      Math.max(
        0,
        safeNumber(
          tokens.card.padding,
        ),
      ),

    radius:
      Math.max(
        0,
        safeNumber(
          tokens.card.radius,
        ),
      ),

    gap:
      Math.max(
        0,
        safeNumber(
          tokens.card.gap,
        ),
      ),

  };

}


/* ===========================================================
   TWO COLUMN WIDTH
=========================================================== */

export function getTwoColumnWidth(
  containerWidth: number,
  gap: number,
): number {

  const width =
    Math.max(
      0,
      safeNumber(containerWidth),
    );

  const safeGap =
    Math.max(
      0,
      safeNumber(gap),
    );

  return Math.max(
    0,
    (width - safeGap) / 2,
  );

}


/* ===========================================================
   THREE COLUMN WIDTH
=========================================================== */

export function getThreeColumnWidth(
  containerWidth: number,
  gap: number,
): number {

  const width =
    Math.max(
      0,
      safeNumber(containerWidth),
    );

  const safeGap =
    Math.max(
      0,
      safeNumber(gap),
    );

  return Math.max(
    0,
    (
      width -
      safeGap * 2
    ) / 3,
  );

}


/* ===========================================================
   FOUR COLUMN WIDTH
=========================================================== */

export function getFourColumnWidth(
  containerWidth: number,
  gap: number,
): number {

  const width =
    Math.max(
      0,
      safeNumber(containerWidth),
    );

  const safeGap =
    Math.max(
      0,
      safeNumber(gap),
    );

  return Math.max(
    0,
    (
      width -
      safeGap * 3
    ) / 4,
  );

}


/* ===========================================================
   SIDEBAR + CONTENT
=========================================================== */

export function getSidebarAndContentWidths(
  viewportWidth: number,
  tokens: ResponsiveTokens,
): {
  sidebarWidth: number;
  contentWidth: number;
} {

  const width =
    Math.max(
      0,
      safeNumber(viewportWidth),
    );

  const sidebarWidth =
    getSidebarWidth(tokens);

  const contentWidth =
    getAvailableContentWidth(
      width,
      tokens,
    );

  return {

    sidebarWidth,

    contentWidth,

  };

}


/* ===========================================================
   PAGE HEIGHT
=========================================================== */

export function getPageHeight(
  viewportHeight: number,
  tokens: ResponsiveTokens,
): number {

  const height =
    Math.max(
      0,
      safeNumber(viewportHeight),
    );

  const header =
    getHeaderHeight(tokens);

  return Math.max(
    0,
    height - header,
  );

}


/* ===========================================================
   FULL CONTENT HEIGHT
=========================================================== */

export function getContentHeight(
  viewportHeight: number,
  tokens: ResponsiveTokens,
): number {

  return getPageHeight(
    viewportHeight,
    tokens,
  );

}


/* ===========================================================
   DASHBOARD WIDTH
=========================================================== */

export function getDashboardWidth(
  viewportWidth: number,
  tokens: ResponsiveTokens,
): number {

  const width =
    Math.max(
      0,
      safeNumber(viewportWidth),
    );

  const maxWidth =
    Math.max(
      0,
      safeNumber(
        tokens.dashboard.maxWidth,
        width,
      ),
    );

  const padding =
    Math.max(
      0,
      safeNumber(
        tokens.dashboard.padding,
      ),
    );

  return Math.min(
    Math.max(
      0,
      width - padding * 2,
    ),
    maxWidth,
  );

}


/* ===========================================================
   DASHBOARD COLUMNS
=========================================================== */

export function getDashboardColumns(
  tokens: ResponsiveTokens,
): number {

  return Math.max(
    1,
    Math.floor(
      safeNumber(
        tokens.dashboard.columns,
        1,
      ),
    ),
  );

}


/* ===========================================================
   DASHBOARD CARD WIDTH
=========================================================== */

export function getDashboardCardWidth(
  containerWidth: number,
  tokens: ResponsiveTokens,
): number {

  const columns =
    getDashboardColumns(tokens);

  const gap =
    Math.max(
      0,
      safeNumber(
        tokens.dashboard.cardGap,
      ),
    );

  const totalGap =
    Math.max(
      0,
      (columns - 1) * gap,
    );

  return Math.max(
    0,
    (
      Math.max(
        0,
        safeNumber(containerWidth) -
        totalGap,
      )
    ) / columns,
  );

}


/* ===========================================================
   MODAL WIDTH
=========================================================== */

export function getModalWidth(
  viewportWidth: number,
  tokens: ResponsiveTokens,
): number {

  const viewport =
    Math.max(
      0,
      safeNumber(viewportWidth),
    );

  const configuredWidth =
    Math.max(
      0,
      safeNumber(
        tokens.modal.width,
      ),
    );

  const maxWidth =
    Math.max(
      0,
      safeNumber(
        tokens.modal.maxWidth,
        viewport,
      ),
    );

  const pagePadding =
    getPageGutter(tokens);

  const available =
    Math.max(
      0,
      viewport -
      pagePadding * 2,
    );

  if (configuredWidth <= 0) {
    return Math.min(
      available,
      maxWidth,
    );
  }

  return Math.min(
    configuredWidth,
    maxWidth,
    available,
  );

}


/* ===========================================================
   LOGIN WIDTH
=========================================================== */

export function getLoginWidth(
  viewportWidth: number,
  tokens: ResponsiveTokens,
): number {

  const viewport =
    Math.max(
      0,
      safeNumber(viewportWidth),
    );

  const pagePadding =
    Math.max(
      0,
      safeNumber(
        tokens.login.pagePadding,
      ),
    );

  const available =
    Math.max(
      0,
      viewport -
      pagePadding * 2,
    );

  const maxWidth =
    Math.max(
      0,
      safeNumber(
        tokens.login.cardMaxWidth,
        available,
      ),
    );

  const configuredWidth =
    typeof tokens.login.cardWidth === "number"
      ? Math.max(
          0,
          tokens.login.cardWidth,
        )
      : available;

  return Math.min(
    available,
    maxWidth,
    configuredWidth,
  );

}


/* ===========================================================
   WIZARD WIDTH
=========================================================== */

export function getWizardWidth(
  viewportWidth: number,
  tokens: ResponsiveTokens,
): number {

  const viewport =
    Math.max(
      0,
      safeNumber(viewportWidth),
    );

  const padding =
    Math.max(
      0,
      safeNumber(
        tokens.wizard.padding,
      ),
    );

  const available =
    Math.max(
      0,
      viewport -
      padding * 2,
    );

  return Math.min(
    available,
    Math.max(
      0,
      safeNumber(
        tokens.wizard.maxWidth,
        available,
      ),
    ),
  );

}


/* ===========================================================
   TABLE WIDTH
=========================================================== */

export function getTableWidth(
  containerWidth: number,
): number {

  return Math.max(
    0,
    safeNumber(containerWidth),
  );

}


/* ===========================================================
   RESPONSIVE GRID STYLE
=========================================================== */

export function getGridStyle(
  tokens: ResponsiveTokens,
): {
  columns: number;
  gap: number;
  minCardWidth: number;
} {

  return {

    columns:
      getGridColumns(tokens),

    gap:
      getGridGap(tokens),

    minCardWidth:
      getGridMinCardWidth(tokens),

  };

}


/* ===========================================================
   PAGE LAYOUT STYLE
=========================================================== */

export function getPageLayoutStyle(
  tokens: ResponsiveTokens,
): ResponsiveLayout {

  return getResponsiveLayout(
    tokens,
  );

}


/* ===========================================================
   END
=========================================================== */