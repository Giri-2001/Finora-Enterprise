// ============================================================
// FINORA ENTERPRISE OS™
//
// COLLECTION STUDIO™
// COLLECTION RESPONSIVE TOKENS
//
// RESPONSIBILITY:
//
// - Own Collection Studio responsive geometry
// - Define mobile / tablet / laptop / desktop values
// - Provide one responsive token contract
// - Keep responsive dimensions outside Theme Engine
//
// IMPORTANT:
//
// - NO theme colours
// - NO business logic
// - NO viewport detection
// - NO React code
// - NO localStorage
// - NO component rendering
//
// VIEWPORTS:
//
// - Mobile
// - Tablet
// - Laptop
// - Desktop
//
// VERSION : 1.0
// STATUS  : Production
// ============================================================


// ============================================================
// TYPES
// ============================================================

export interface CollectionStudioResponsiveTokens {

  page: {

    padding: number;

    gap: number;

  };


  customer: {

    width: number;

    minHeight: number;

    photoWidth: number;

  };


  loanSelection: {

    minHeight: number;

    gap: number;

    cardMinHeight: number;

  };


  loanCard: {

    minHeight: number;

    padding: number;

    gap: number;

  };


  selectedLoan: {

    minHeight: number;

    padding: number;

    gap: number;

  };


  metric: {

    minHeight: number;

    padding: number;

  };


  typography: {

    title: number;

    sectionTitle: number;

    body: number;

    label: number;

    value: number;

    small: number;

  };


  spacing: {

    tiny: number;

    small: number;

    medium: number;

    large: number;

  };


  radius: {

    card: number;

    input: number;

    badge: number;

  };


  border: {

    width: number;

  };

}


// ============================================================
// MOBILE
// ============================================================

export const COLLECTION_STUDIO_MOBILE_TOKENS:
  CollectionStudioResponsiveTokens = {

  page: {

    padding: 12,

    gap: 12,

  },


  customer: {

    width: 100,

    minHeight: 150,

    photoWidth: 88,

  },


  loanSelection: {

    minHeight: 0,

    gap: 8,

    cardMinHeight: 92,

  },


  loanCard: {

    minHeight: 88,

    padding: 10,

    gap: 6,

  },


  selectedLoan: {

    minHeight: 0,

    padding: 12,

    gap: 8,

  },


  metric: {

    minHeight: 64,

    padding: 10,

  },


  typography: {

    title: 24,

    sectionTitle: 16,

    body: 13,

    label: 11,

    value: 15,

    small: 10,

  },


  spacing: {

    tiny: 4,

    small: 8,

    medium: 12,

    large: 16,

  },


  radius: {

    card: 14,

    input: 10,

    badge: 999,

  },


  border: {

    width: 1,

  },

};


// ============================================================
// TABLET
// ============================================================

export const COLLECTION_STUDIO_TABLET_TOKENS:
  CollectionStudioResponsiveTokens = {

  page: {

    padding: 16,

    gap: 14,

  },


  customer: {

    width: 100,

    minHeight: 156,

    photoWidth: 96,

  },


  loanSelection: {

    minHeight: 0,

    gap: 10,

    cardMinHeight: 96,

  },


  loanCard: {

    minHeight: 92,

    padding: 12,

    gap: 7,

  },


  selectedLoan: {

    minHeight: 0,

    padding: 14,

    gap: 10,

  },


  metric: {

    minHeight: 68,

    padding: 12,

  },


  typography: {

    title: 27,

    sectionTitle: 17,

    body: 14,

    label: 12,

    value: 16,

    small: 11,

  },


  spacing: {

    tiny: 4,

    small: 9,

    medium: 14,

    large: 18,

  },


  radius: {

    card: 15,

    input: 10,

    badge: 999,

  },


  border: {

    width: 1,

  },

};


// ============================================================
// LAPTOP
// ============================================================

export const COLLECTION_STUDIO_LAPTOP_TOKENS:
  CollectionStudioResponsiveTokens = {

  page: {

    padding: 20,

    gap: 16,

  },


  customer: {

    width: 100,

    minHeight: 170,

    photoWidth: 112,

  },


  loanSelection: {

    minHeight: 0,

    gap: 10,

    cardMinHeight: 92,

  },


  loanCard: {

    minHeight: 90,

    padding: 12,

    gap: 8,

  },


  selectedLoan: {

    minHeight: 0,

    padding: 16,

    gap: 12,

  },


  metric: {

    minHeight: 72,

    padding: 13,

  },


  typography: {

    title: 30,

    sectionTitle: 18,

    body: 14,

    label: 12,

    value: 17,

    small: 11,

  },


  spacing: {

    tiny: 5,

    small: 10,

    medium: 16,

    large: 20,

  },


  radius: {

    card: 16,

    input: 11,

    badge: 999,

  },


  border: {

    width: 1,

  },

};


// ============================================================
// DESKTOP
// ============================================================

export const COLLECTION_STUDIO_DESKTOP_TOKENS:
  CollectionStudioResponsiveTokens = {

  page: {

    padding: 24,

    gap: 18,

  },


  customer: {

    width: 100,

    minHeight: 174,

    photoWidth: 116,

  },


  loanSelection: {

    minHeight: 0,

    gap: 10,

    cardMinHeight: 94,

  },


  loanCard: {

    minHeight: 92,

    padding: 13,

    gap: 8,

  },


  selectedLoan: {

    minHeight: 0,

    padding: 18,

    gap: 12,

  },


  metric: {

    minHeight: 74,

    padding: 14,

  },


  typography: {

    title: 32,

    sectionTitle: 19,

    body: 15,

    label: 12,

    value: 18,

    small: 11,

  },


  spacing: {

    tiny: 5,

    small: 10,

    medium: 18,

    large: 22,

  },


  radius: {

    card: 17,

    input: 11,

    badge: 999,

  },


  border: {

    width: 1,

  },

};


// ============================================================
// RESPONSIVE TOKEN MAP
// ============================================================

export const COLLECTION_STUDIO_TOKENS = {

  mobile:
    COLLECTION_STUDIO_MOBILE_TOKENS,

  tablet:
    COLLECTION_STUDIO_TABLET_TOKENS,

  laptop:
    COLLECTION_STUDIO_LAPTOP_TOKENS,

  desktop:
    COLLECTION_STUDIO_DESKTOP_TOKENS,

} as const;


// ============================================================
// DEFAULT
// ============================================================

export default COLLECTION_STUDIO_TOKENS;


// ============================================================
// END
// ============================================================