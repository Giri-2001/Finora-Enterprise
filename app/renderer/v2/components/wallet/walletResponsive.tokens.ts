/* ============================================================
   FINORA ENTERPRISE OS™

   FINORA WALLET™

   WALLET RESPONSIVE TOKENS

   RESPONSIBILITY:
   - Map the central Responsive Engine into Wallet semantics
   - Preserve the FINORA four-device responsive system
   - Keep Wallet components free from local breakpoint logic
   - Keep Wallet geometry derived from ResponsiveTokens

   IMPORTANT:
   - No viewport detection.
   - No breakpoint definitions.
   - No hard-coded device widths.
   - No theme colors.
   - No React.
============================================================ */

import type {
  ResponsiveTokens,
} from "../../utils/responsive/tokens";

/* ============================================================
   WALLET RESPONSIVE CONTRACT
============================================================ */

export interface WalletResponsiveTokens {
  page: {
    padding:
      number;

    maxWidth:
      number;

    sectionGap:
      number;
  };

  summary: {
    gap:
      number;

    columns:
      number;

    cardPadding:
      number;

    cardRadius:
      number;

    cardMinHeight:
      number;
  };

  balanceCard: {
    padding:
      number;

    radius:
      number;

    minHeight:
      number;

    titleSize:
      number;

    balanceSize:
      number;

    captionSize:
      number;
  };

  actions: {
    gap:
      number;

    buttonHeight:
      number;

    buttonRadius:
      number;

    buttonPaddingX:
      number;

    buttonFontSize:
      number;

    iconSize:
      number;
  };

  history: {
    gap:
      number;

    rowMinHeight:
      number;

    rowPaddingX:
      number;

    rowPaddingY:
      number;

    titleSize:
      number;

    detailSize:
      number;

    amountSize:
      number;
  };

  modal: {
    width:
      number;

    maxWidth:
      number;

    padding:
      number;

    radius:
      number;

    gap:
      number;
  };
}

/* ============================================================
   WALLET RESPONSIVE TOKEN FACTORY
============================================================ */

export function createWalletResponsiveTokens(
  tokens: ResponsiveTokens,
): WalletResponsiveTokens {
  return {
    page: {
      padding:
        tokens.spacing.page,

      maxWidth:
        tokens.layout.maxContentWidth,

      sectionGap:
        tokens.layout.sectionGap,
    },

    summary: {
      gap:
        tokens.layout.cardGap,

      columns:
        tokens.grid.columns,

      cardPadding:
        tokens.card.padding,

      cardRadius:
        tokens.card.radius,

      cardMinHeight:
        tokens.card.minHeight,
    },

    balanceCard: {
      padding:
        tokens.card.padding,

      radius:
        tokens.card.radius,

      minHeight:
        tokens.card.minHeight,

      titleSize:
        tokens.typography.heading,

      balanceSize:
        tokens.typography.display,

      captionSize:
        tokens.typography.caption,
    },

    actions: {
      gap:
        tokens.control.gap,

      buttonHeight:
        tokens.button.height,

      buttonRadius:
        tokens.button.radius,

      buttonPaddingX:
        tokens.button.paddingX,

      buttonFontSize:
        tokens.button.fontSize,

      iconSize:
        tokens.button.iconSize,
    },

    history: {
      gap:
        tokens.spacing.small,

      rowMinHeight:
        tokens.table.rowHeight,

      rowPaddingX:
        tokens.table.cellPaddingX,

      rowPaddingY:
        tokens.table.cellPaddingY,

      titleSize:
        tokens.typography.body,

      detailSize:
        tokens.typography.caption,

      amountSize:
        tokens.typography.body,
    },

    modal: {
      width:
        tokens.modal.width,

      maxWidth:
        tokens.modal.maxWidth,

      padding:
        tokens.modal.padding,

      radius:
        tokens.modal.radius,

      gap:
        tokens.modal.gap,
    },
  };
}

/* ============================================================
   END
============================================================ */
