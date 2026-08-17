/* ===========================================================
   FINORA ENTERPRISE OS™
   RESPONSIVE ENGINE™

   CENTRAL RESPONSIVE TOKENS

   PURPOSE
   -----------------------------------------------------------
   SINGLE SOURCE OF TRUTH for responsive visual dimensions.

   Components/pages must consume these values instead of
   independently deciding responsive dimensions.
=========================================================== */

/* ===========================================================
   RESPONSIVE DEVICE PROFILE
=========================================================== */

export type ResponsiveDevice =
  | "mobile"
  | "tablet"
  | "desktop";

/* ===========================================================
   RESPONSIVE VIEWPORT PROFILE
=========================================================== */

export type ResponsiveViewport =
  | "verySmallMobile"
  | "mobile"
  | "largeMobile"
  | "tablet"
  | "smallLaptop"
  | "laptop"
  | "desktop"
  | "wideDesktop"
  | "ultraWide"
  | "projector";

/* ===========================================================
   RESPONSIVE TOKEN GROUP
=========================================================== */

export interface ResponsiveTokens {
  meta: {
    name: string;
    viewport: ResponsiveViewport;
    minWidth: number;
    maxWidth: number | null;
  };

  typography: {
    display: number;
    title: number;
    heading: number;
    subheading: number;
    body: number;
    label: number;
    small: number;
    caption: number;
    button: number;
    input: number;
    table: number;
    navigation: number;
  };

  lineHeight: {
    display: number;
    title: number;
    heading: number;
    body: number;
    compact: number;
  };

  spacing: {
    page: number;
    section: number;
    card: number;
    control: number;
    inline: number;
    small: number;
    medium: number;
    large: number;
    xlarge: number;
    xxlarge: number;
  };

  card: {
    width: number | string;
    minWidth: number;
    maxWidth: number;
    minHeight: number;
    padding: number;
    radius: number;
    gap: number;
  };

  /* =========================================================
     DEPARTMENT DOOR
  ========================================================= */

  door: {
  width: number | string;
  height: number;
  padding: number;
  radius: number;
  gap: number;
  iconSize: number;
  iconRadius: number;
  titleSize: number;
  subtitleSize: number;
  statusSize: number;
  statusPaddingX: number;
  statusPaddingY: number;
  statusMinHeight: number;
};

  panel: {
    padding: number;
    radius: number;
    gap: number;
    minHeight: number;
  };

  border: {
    width: number;
    radius: number;
    strongWidth: number;
  };

  control: {
    height: number;
    minHeight: number;
    radius: number;
    paddingX: number;
    paddingY: number;
    gap: number;
  };

  input: {
    height: number;
    minHeight: number;
    radius: number;
    paddingX: number;
    paddingY: number;
    fontSize: number;
    iconSize: number;
  };

  button: {
    height: number;
    minHeight: number;
    radius: number;
    paddingX: number;
    paddingY: number;
    fontSize: number;
    iconSize: number;
  };

  icon: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };

  login: {
    pagePadding: number;
    cardWidth: number | string;
    cardMaxWidth: number;
    cardPadding: number;
    cardRadius: number;
    titleSize: number;
    subtitleSize: number;
    inputHeight: number;
    buttonHeight: number;
    sectionGap: number;
  };

    header: {
    height: number;
    paddingX: number;
    logoHeight: number;
    titleSize: number;
    iconSize: number;
    brandVisible: boolean;
  };

    footer: {
    height: number;
    minHeight: number;
    paddingX: number;
    paddingY: number;
    radius: number;
    gap: number;
    fontSize: number;
  };

  reception: {
  titleSize: number;
  wallLogoSize: number;
  wallPadding: number;
  wallGap: number;
};

  sidebar: {
    width: number;
    collapsedWidth: number;
    padding: number;
    itemHeight: number;
    itemGap: number;
    iconSize: number;
    labelSize: number;
  };

  navigation: {
    height: number;
    itemHeight: number;
    gap: number;
    iconSize: number;
    labelSize: number;
  };

  layout: {
    pageGutter: number;
    contentGap: number;
    cardGap: number;
    sectionGap: number;
    maxContentWidth: number;
    headerHeight: number;
    sidebarWidth: number;
  };

  grid: {
    columns: number;
    minCardWidth: number;
    gap: number;
  };

  customerCards: {
    columns: number;
    width: number;
    minHeight: number;
    gap: number;
    padding: number;
    radius: number;
  };

  table: {
    rowHeight: number;
    compactRowHeight: number;
    headerHeight: number;
    cellPaddingX: number;
    cellPaddingY: number;
    fontSize: number;
  };

  form: {
    fieldGap: number;
    rowGap: number;
    sectionGap: number;
    labelSize: number;
    labelGap: number;
    inputGap: number;
  };

    identityForm: {
    wrapperGap: number;
    columnGap: number;
    rowGap: number;
    fieldGap: number;
    labelHeight: number;
    labelSize: number;
    requiredSize: number;
    inputHeight: number;
    inputRadius: number;
    inputPaddingX: number;
    inputFontSize: number;
    checkboxSize: number;
    checkboxGap: number;
    iconSize: number;
    iconLeft: number;
    iconInputPaddingLeft: number;
    noteSize: number;
    noteMarginTop: number;
  };

  wizard: {
    maxWidth: number;
    padding: number;
    headerHeight: number;
    progressHeight: number;
    contentGap: number;
    navigationHeight: number;
    stepGap: number;
    stepIndicator: number;
  };

  modal: {
    width: number;
    maxWidth: number;
    padding: number;
    radius: number;
    gap: number;
  };

  dashboard: {
    maxWidth: number;
    padding: number;
    cardGap: number;
    columns: number;
  };

  projector: {
    scale: number;
    pagePadding: number;
    cardGap: number;
    titleSize: number;
    bodySize: number;
    statusSize: number;
  };
}

/* ===========================================================
   VERY SMALL MOBILE
   0px - 359px
=========================================================== */

export const VERY_SMALL_MOBILE_TOKENS: ResponsiveTokens = {
  meta: {
    name: "Very Small Mobile",
    viewport: "verySmallMobile",
    minWidth: 0,
    maxWidth: 359,
    
  },

  typography: {
    display: 24,
    title: 22,
    heading: 19,
    subheading: 16,
    body: 13,
    label: 12,
    small: 11,
    caption: 10,
    button: 13,
    input: 13,
    table: 11,
    navigation: 12,
  },

  reception: {
  titleSize: 14,
  wallLogoSize: 42,
  wallPadding: 8,
  wallGap: 6,
},

  lineHeight: {
    display: 1.15,
    title: 1.2,
    heading: 1.2,
    body: 1.45,
    compact: 1.25,
  },

  spacing: {
    page: 10,
    section: 14,
    card: 12,
    control: 8,
    inline: 6,
    small: 4,
    medium: 8,
    large: 14,
    xlarge: 18,
    xxlarge: 24,
  },

  card: {
    width: "100%",
    minWidth: 0,
    maxWidth: 360,
    minHeight: 0,
    padding: 12,
    radius: 12,
    gap: 8,
  },

  door: {
    width: "100%",
    height: 150,
    padding: 16,
    radius: 12,
    gap: 8,
    iconSize: 40,
    iconRadius: 12,
    titleSize: 16,
    subtitleSize: 11,
    statusSize: 10,
    statusPaddingX: 10,
    statusPaddingY: 4,
    statusMinHeight: 22,
  },

  panel: {
    padding: 12,
    radius: 12,
    gap: 8,
    minHeight: 0,
  },

  border: {
    width: 1,
    radius: 12,
    strongWidth: 1,
  },

  control: {
    height: 42,
    minHeight: 40,
    radius: 8,
    paddingX: 10,
    paddingY: 9,
    gap: 6,
  },

  input: {
    height: 42,
    minHeight: 40,
    radius: 8,
    paddingX: 10,
    paddingY: 9,
    fontSize: 13,
    iconSize: 15,
  },

  button: {
    height: 44,
    minHeight: 42,
    radius: 8,
    paddingX: 12,
    paddingY: 10,
    fontSize: 13,
    iconSize: 16,
  },

  icon: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 20,
    xl: 24,
  },

  login: {
    pagePadding: 10,
    cardWidth: "100%",
    cardMaxWidth: 340,
    cardPadding: 16,
    cardRadius: 12,
    titleSize: 22,
    subtitleSize: 13,
    inputHeight: 42,
    buttonHeight: 44,
    sectionGap: 12,
  },

  header: {
    height: 82,
    paddingX: 8,
    logoHeight: 24,
    titleSize: 13,
    iconSize: 16,
    brandVisible: false,
  },

    footer: {
    height: 58,
    minHeight: 58,
    paddingX: 10,
    paddingY: 10,
    radius: 12,
    gap: 8,
    fontSize: 10,
  },

  sidebar: {
    width: 0,
    collapsedWidth: 0,
    padding: 0,
    itemHeight: 42,
    itemGap: 4,
    iconSize: 18,
    labelSize: 12,
  },

  navigation: {
    height: 52,
    itemHeight: 42,
    gap: 4,
    iconSize: 18,
    labelSize: 11,
  },

  layout: {
    pageGutter: 10,
    contentGap: 12,
    cardGap: 8,
    sectionGap: 14,
    maxContentWidth: 360,
    headerHeight: 52,
    sidebarWidth: 0,
  },

  grid: {
    columns: 1,
    minCardWidth: 0,
    gap: 8,
  },

  customerCards: {
    columns: 1,
    width: 0,
    minHeight: 0,
    gap: 8,
    padding: 12,
    radius: 12,
  },

  table: {
    rowHeight: 42,
    compactRowHeight: 36,
    headerHeight: 40,
    cellPaddingX: 8,
    cellPaddingY: 6,
    fontSize: 11,
  },

  form: {
    fieldGap: 4,
    rowGap: 10,
    sectionGap: 16,
    labelSize: 12,
    labelGap: 4,
    inputGap: 6,
  },

    identityForm: {
    wrapperGap: 10,
    columnGap: 12,
    rowGap: 8,
    fieldGap: 5,
    labelHeight: 15,
    labelSize: 9,
    requiredSize: 10,
    inputHeight: 38,
    inputRadius: 10,
    inputPaddingX: 12,
    inputFontSize: 11,
    checkboxSize: 15,
    checkboxGap: 8,
    iconSize: 16,
    iconLeft: 11,
    iconInputPaddingLeft: 34,
    noteSize: 8,
    noteMarginTop: 2,
  },

  wizard: {
    maxWidth: 360,
    padding: 10,
    headerHeight: 52,
    progressHeight: 44,
    contentGap: 12,
    navigationHeight: 56,
    stepGap: 4,
    stepIndicator: 28,
  },

  modal: {
    width: 0,
    maxWidth: 340,
    padding: 16,
    radius: 12,
    gap: 10,
  },

  dashboard: {
    maxWidth: 360,
    padding: 10,
    cardGap: 8,
    columns: 1,
  },

  projector: {
    scale: 1,
    pagePadding: 16,
    cardGap: 12,
    titleSize: 24,
    bodySize: 14,
    statusSize: 12,
  },
};

/* ===========================================================
   MOBILE
   360px - 599px
=========================================================== */

export const MOBILE_TOKENS: ResponsiveTokens = {
  meta: {
    name: "Mobile",
    viewport: "mobile",
    minWidth: 360,
    maxWidth: 599,
  },

  typography: {
    display: 28,
    title: 26,
    heading: 22,
    subheading: 18,
    body: 14,
    label: 13,
    small: 12,
    caption: 11,
    button: 14,
    input: 14,
    table: 12,
    navigation: 12,
  },

  reception: {
  titleSize: 18,
  wallLogoSize: 46,
  wallPadding: 10,
  wallGap: 7,
},

  lineHeight: {
    display: 1.15,
    title: 1.2,
    heading: 1.2,
    body: 1.5,
    compact: 1.3,
  },

  spacing: {
    page: 16,
    section: 20,
    card: 16,
    control: 12,
    inline: 8,
    small: 6,
    medium: 12,
    large: 20,
    xlarge: 24,
    xxlarge: 32,
  },

  card: {
    width: "100%",
    minWidth: 0,
    maxWidth: 480,
    minHeight: 0,
    padding: 16,
    radius: 14,
    gap: 12,
  },

  door: {
    width: "100%",
    height: 160,
    padding: 18,
    radius: 14,
    gap: 10,
    iconSize: 42,
    iconRadius: 13,
    titleSize: 17,
    subtitleSize: 11,
    statusSize: 11,
    statusPaddingX: 12,
    statusPaddingY: 4,
    statusMinHeight: 24,
  },

  panel: {
    padding: 16,
    radius: 14,
    gap: 12,
    minHeight: 0,
  },

  border: {
    width: 1,
    radius: 14,
    strongWidth: 1,
  },

  control: {
    height: 46,
    minHeight: 44,
    radius: 9,
    paddingX: 12,
    paddingY: 11,
    gap: 8,
  },

  input: {
    height: 44,
    minHeight: 44,
    radius: 8,
    paddingX: 12,
    paddingY: 10,
    fontSize: 12,
    iconSize: 16,
  },

  button: {
    height: 34,
    minHeight: 36,
    radius: 8,
    paddingX: 8,
    paddingY: 8,
    fontSize: 12,
    iconSize: 15,
  },

  icon: {
    xs: 12,
    sm: 16,
    md: 18,
    lg: 22,
    xl: 28,
  },

  login: {
    pagePadding: 16,
    cardWidth: "100%",
    cardMaxWidth: 480,
    cardPadding: 20,
    cardRadius: 14,
    titleSize: 26,
    subtitleSize: 14,
    inputHeight: 44,
    buttonHeight: 46,
    sectionGap: 16,
  },

  header: {
  height: 82,
  paddingX: 10,
  logoHeight: 26,
  titleSize: 18,
  iconSize: 17,
  brandVisible: false,
},

  footer: {
    height: 60,
    minHeight: 60,
    paddingX: 12,
    paddingY: 10,
    radius: 14,
    gap: 8,
    fontSize: 11,
  },

  sidebar: {
    width: 0,
    collapsedWidth: 0,
    padding: 0,
    itemHeight: 44,
    itemGap: 6,
    iconSize: 20,
    labelSize: 13,
  },

  navigation: {
    height: 56,
    itemHeight: 44,
    gap: 6,
    iconSize: 20,
    labelSize: 12,
  },

  layout: {
    pageGutter: 16,
    contentGap: 16,
    cardGap: 12,
    sectionGap: 20,
    maxContentWidth: 480,
    headerHeight: 56,
    sidebarWidth: 0,
  },

  grid: {
    columns: 1,
    minCardWidth: 0,
    gap: 12,
  },

  customerCards: {
    columns: 1,
    width: 0,
    minHeight: 0,
    gap: 12,
    padding: 16,
    radius: 14,
  },

  table: {
    rowHeight: 48,
    compactRowHeight: 42,
    headerHeight: 46,
    cellPaddingX: 10,
    cellPaddingY: 8,
    fontSize: 12,
  },

  form: {
    fieldGap: 6,
    rowGap: 14,
    sectionGap: 20,
    labelSize: 13,
    labelGap: 6,
    inputGap: 8,
  },

    identityForm: {
    wrapperGap: 10,
    columnGap: 12,
    rowGap: 8,
    fieldGap: 5,
    labelHeight: 15,
    labelSize: 9,
    requiredSize: 10,
    inputHeight: 38,
    inputRadius: 10,
    inputPaddingX: 12,
    inputFontSize: 11,
    checkboxSize: 15,
    checkboxGap: 8,
    iconSize: 16,
    iconLeft: 11,
    iconInputPaddingLeft: 34,
    noteSize: 8,
    noteMarginTop: 2,
  },

  wizard: {
    maxWidth: 480,
    padding: 16,
    headerHeight: 56,
    progressHeight: 52,
    contentGap: 16,
    navigationHeight: 60,
    stepGap: 6,
    stepIndicator: 30,
  },

  modal: {
    width: 0,
    maxWidth: 480,
    padding: 20,
    radius: 14,
    gap: 12,
  },

  dashboard: {
    maxWidth: 480,
    padding: 16,
    cardGap: 12,
    columns: 1,
  },

  projector: {
    scale: 1,
    pagePadding: 20,
    cardGap: 16,
    titleSize: 28,
    bodySize: 15,
    statusSize: 13,
  },
};

/* ===========================================================
   LARGE MOBILE
   600px - 767px
=========================================================== */

export const LARGE_MOBILE_TOKENS: ResponsiveTokens = {
  ...MOBILE_TOKENS,

  meta: {
    name: "Large Mobile",
    viewport: "largeMobile",
    minWidth: 600,
    maxWidth: 767,
  },

  card: {
    ...MOBILE_TOKENS.card,
    maxWidth: 560,
  },

  login: {
    ...MOBILE_TOKENS.login,
    cardMaxWidth: 560,
  },

  layout: {
    ...MOBILE_TOKENS.layout,
    maxContentWidth: 560,
  },
};

/* ===========================================================
   TABLET
   768px - 1023px
=========================================================== */

export const TABLET_TOKENS: ResponsiveTokens = {
  meta: {
    name: "Tablet",
    viewport: "tablet",
    minWidth: 768,
    maxWidth: 1023,
  },

  typography: {
    display: 30,
    title: 28,
    heading: 24,
    subheading: 19,
    body: 15,
    label: 13,
    small: 12,
    caption: 11,
    button: 14,
    input: 14,
    table: 12,
    navigation: 13,
  },

  reception: {
  titleSize: 18,
  wallLogoSize: 48,
  wallPadding: 10,
  wallGap: 7,
},

  lineHeight: {
    display: 1.15,
    title: 1.2,
    heading: 1.2,
    body: 1.5,
    compact: 1.3,
  },

  spacing: {
    page: 24,
    section: 24,
    card: 20,
    control: 14,
    inline: 10,
    small: 8,
    medium: 16,
    large: 24,
    xlarge: 30,
    xxlarge: 40,
  },

  card: {
    width: 400,
    minWidth: 0,
    maxWidth: 560,
    minHeight: 0,
    padding: 24,
    radius: 16,
    gap: 16,
  },

  door: {
    width: 300,
    height: 170,
    padding: 20,
    radius: 14,
    gap: 10,
    iconSize: 44,
    iconRadius: 14,
    titleSize: 18,
    subtitleSize: 12,
    statusSize: 11,
    statusPaddingX: 12,
    statusPaddingY: 4,
    statusMinHeight: 24,
  },

  panel: {
    padding: 20,
    radius: 16,
    gap: 16,
    minHeight: 0,
  },

  border: {
    width: 1,
    radius: 16,
    strongWidth: 1,
  },

  control: {
    height: 44,
    minHeight: 42,
    radius: 9,
    paddingX: 14,
    paddingY: 10,
    gap: 10,
  },

  input: {
    height: 42,
    minHeight: 42,
    radius: 8,
    paddingX: 12,
    paddingY: 10,
    fontSize: 14,
    iconSize: 17,
  },

  button: {
    height: 44,
    minHeight: 42,
    radius: 9,
    paddingX: 14,
    paddingY: 10,
    fontSize: 14,
    iconSize: 18,
  },

  icon: {
    xs: 14,
    sm: 17,
    md: 20,
    lg: 24,
    xl: 30,
  },

  login: {
    pagePadding: 20,
    cardWidth: 400,
    cardMaxWidth: 560,
    cardPadding: 24,
    cardRadius: 16,
    titleSize: 28,
    subtitleSize: 15,
    inputHeight: 42,
    buttonHeight: 44,
    sectionGap: 18,
  },

  header: {
    height: 60,
    paddingX: 24,
    logoHeight: 32,
    titleSize: 18,
    iconSize: 21,
    brandVisible: true,
  },

    footer: {
    height: 54,
    minHeight: 54,
    paddingX: 18,
    paddingY: 10,
    radius: 14,
    gap: 10,
    fontSize: 13,
  },

  sidebar: {
    width: 0,
    collapsedWidth: 0,
    padding: 0,
    itemHeight: 46,
    itemGap: 6,
    iconSize: 20,
    labelSize: 13,
  },

  navigation: {
    height: 60,
    itemHeight: 46,
    gap: 8,
    iconSize: 20,
    labelSize: 13,
  },

  layout: {
    pageGutter: 24,
    contentGap: 20,
    cardGap: 16,
    sectionGap: 24,
    maxContentWidth: 960,
    headerHeight: 60,
    sidebarWidth: 0,
  },

  grid: {
    columns: 2,
    minCardWidth: 260,
    gap: 16,
  },

  customerCards: {
    columns: 2,
    width: 0,
    minHeight: 0,
    gap: 16,
    padding: 20,
    radius: 16,
  },

  table: {
    rowHeight: 50,
    compactRowHeight: 44,
    headerHeight: 48,
    cellPaddingX: 12,
    cellPaddingY: 8,
    fontSize: 12,
  },

  form: {
    fieldGap: 6,
    rowGap: 16,
    sectionGap: 24,
    labelSize: 13,
    labelGap: 6,
    inputGap: 8,
  },

    identityForm: {
    wrapperGap: 12,
    columnGap: 14,
    rowGap: 10,
    fieldGap: 6,
    labelHeight: 16,
    labelSize: 10,
    requiredSize: 11,
    inputHeight: 40,
    inputRadius: 10,
    inputPaddingX: 13,
    inputFontSize: 12,
    checkboxSize: 16,
    checkboxGap: 8,
    iconSize: 17,
    iconLeft: 11,
    iconInputPaddingLeft: 35,
    noteSize: 9,
    noteMarginTop: 2,
  },

  wizard: {
    maxWidth: 960,
    padding: 24,
    headerHeight: 60,
    progressHeight: 56,
    contentGap: 20,
    navigationHeight: 64,
    stepGap: 8,
    stepIndicator: 32,
  },

  modal: {
    width: 520,
    maxWidth: 680,
    padding: 24,
    radius: 16,
    gap: 16,
  },

  dashboard: {
    maxWidth: 1100,
    padding: 24,
    cardGap: 16,
    columns: 2,
  },

  projector: {
    scale: 1.05,
    pagePadding: 24,
    cardGap: 20,
    titleSize: 30,
    bodySize: 16,
    statusSize: 14,
  },
};

/* ===========================================================
   SMALL LAPTOP
   1024px - 1279px
=========================================================== */

export const SMALL_LAPTOP_TOKENS: ResponsiveTokens = {
  meta: {
    name: "Small Laptop",
    viewport: "smallLaptop",
    minWidth: 1024,
    maxWidth: 1279,
  },

  typography: {
    display: 32,
    title: 30,
    heading: 25,
    subheading: 20,
    body: 15,
    label: 13,
    small: 12,
    caption: 11,
    button: 14,
    input: 14,
    table: 12,
    navigation: 13,
  },

  reception: {
  titleSize: 26,
  wallLogoSize: 52,
  wallPadding: 12,
  wallGap: 8,
},

  lineHeight: {
    display: 1.15,
    title: 1.2,
    heading: 1.2,
    body: 1.5,
    compact: 1.3,
  },

  spacing: {
    page: 24,
    section: 24,
    card: 20,
    control: 14,
    inline: 10,
    small: 8,
    medium: 16,
    large: 24,
    xlarge: 32,
    xxlarge: 44,
  },

  card: {
    width: 420,
    minWidth: 0,
    maxWidth: 620,
    minHeight: 0,
    padding: 24,
    radius: 16,
    gap: 16,
  },

  door: {
    width: 300,
    height: 175,
    padding: 22,
    radius: 15,
    gap: 10,
    iconSize: 46,
    iconRadius: 14,
    titleSize: 18,
    subtitleSize: 12,
    statusSize: 11,
    statusPaddingX: 12,
    statusPaddingY: 4,
    statusMinHeight: 24,
  },

  panel: {
    padding: 22,
    radius: 16,
    gap: 16,
    minHeight: 0,
  },

  border: {
    width: 1,
    radius: 16,
    strongWidth: 1,
  },

  control: {
    height: 44,
    minHeight: 42,
    radius: 9,
    paddingX: 14,
    paddingY: 10,
    gap: 10,
  },

  input: {
    height: 42,
    minHeight: 42,
    radius: 8,
    paddingX: 12,
    paddingY: 10,
    fontSize: 14,
    iconSize: 17,
  },

  button: {
    height: 44,
    minHeight: 42,
    radius: 9,
    paddingX: 14,
    paddingY: 10,
    fontSize: 14,
    iconSize: 18,
  },

  icon: {
    xs: 14,
    sm: 17,
    md: 20,
    lg: 24,
    xl: 30,
  },

  login: {
    pagePadding: 24,
    cardWidth: 420,
    cardMaxWidth: 620,
    cardPadding: 26,
    cardRadius: 16,
    titleSize: 30,
    subtitleSize: 15,
    inputHeight: 42,
    buttonHeight: 44,
    sectionGap: 18,
  },

  header: {
    height: 60,
    paddingX: 24,
    logoHeight: 34,
    titleSize: 18,
    iconSize: 22,
    brandVisible: true,
  },

    footer: {
    height: 58,
    minHeight: 58,
    paddingX: 20,
    paddingY: 10,
    radius: 14,
    gap: 10,
    fontSize: 13,
  },

  sidebar: {
    width: 220,
    collapsedWidth: 64,
    padding: 12,
    itemHeight: 44,
    itemGap: 6,
    iconSize: 20,
    labelSize: 13,
  },

  navigation: {
    height: 60,
    itemHeight: 44,
    gap: 8,
    iconSize: 20,
    labelSize: 13,
  },

  layout: {
    pageGutter: 24,
    contentGap: 20,
    cardGap: 16,
    sectionGap: 24,
    maxContentWidth: 1180,
    headerHeight: 60,
    sidebarWidth: 220,
  },

  grid: {
    columns: 3,
    minCardWidth: 280,
    gap: 16,
  },

  customerCards: {
    columns: 3,
    width: 0,
    minHeight: 0,
    gap: 16,
    padding: 20,
    radius: 16,
  },

  table: {
    rowHeight: 50,
    compactRowHeight: 44,
    headerHeight: 48,
    cellPaddingX: 12,
    cellPaddingY: 8,
    fontSize: 12,
  },

  form: {
    fieldGap: 6,
    rowGap: 16,
    sectionGap: 24,
    labelSize: 13,
    labelGap: 6,
    inputGap: 8,
  },

    identityForm: {
    wrapperGap: 12,
    columnGap: 14,
    rowGap: 10,
    fieldGap: 6,
    labelHeight: 16,
    labelSize: 10,
    requiredSize: 11,
    inputHeight: 40,
    inputRadius: 10,
    inputPaddingX: 13,
    inputFontSize: 12,
    checkboxSize: 16,
    checkboxGap: 8,
    iconSize: 17,
    iconLeft: 11,
    iconInputPaddingLeft: 35,
    noteSize: 9,
    noteMarginTop: 2,
  },

  wizard: {
    maxWidth: 1180,
    padding: 24,
    headerHeight: 60,
    progressHeight: 56,
    contentGap: 20,
    navigationHeight: 64,
    stepGap: 10,
    stepIndicator: 32,
  },

  modal: {
    width: 560,
    maxWidth: 720,
    padding: 24,
    radius: 16,
    gap: 16,
  },

  dashboard: {
    maxWidth: 1240,
    padding: 24,
    cardGap: 16,
    columns: 3,
  },

  projector: {
    scale: 1.1,
    pagePadding: 28,
    cardGap: 20,
    titleSize: 32,
    bodySize: 16,
    statusSize: 14,
  },
};

/* ===========================================================
   LAPTOP
   1280px - 1599px
=========================================================== */

export const LAPTOP_TOKENS: ResponsiveTokens = {
  ...SMALL_LAPTOP_TOKENS,

  meta: {
    name: "Laptop",
    viewport: "laptop",
    minWidth: 1280,
    maxWidth: 1599,
  },

  card: {
    ...SMALL_LAPTOP_TOKENS.card,
    width: 440,
    maxWidth: 660,
    padding: 26,
  },

  door: {
    ...SMALL_LAPTOP_TOKENS.door,
    width: 320,
    height: 180,
    padding: 24,
  },

  login: {
    ...SMALL_LAPTOP_TOKENS.login,
    pagePadding: 28,
    cardWidth: 440,
    cardMaxWidth: 660,
    cardPadding: 28,
  },

  layout: {
    ...SMALL_LAPTOP_TOKENS.layout,
    pageGutter: 28,
    contentGap: 22,
    cardGap: 18,
    sectionGap: 26,
    maxContentWidth: 1280,
  },

  grid: {
    columns: 4,
    minCardWidth: 280,
    gap: 18,
  },

  customerCards: {
    columns: 4,
    width: 0,
    minHeight: 0,
    gap: 18,
    padding: 22,
    radius: 16,
  },

  dashboard: {
    maxWidth: 1360,
    padding: 28,
    cardGap: 18,
    columns: 4,
  },
};

/* ===========================================================
   DESKTOP
   1600px - 1919px
=========================================================== */

export const DESKTOP_TOKENS: ResponsiveTokens = {
  meta: {
    name: "Desktop",
    viewport: "desktop",
    minWidth: 1600,
    maxWidth: 1919,
  },

  typography: {
    display: 36,
    title: 32,
    heading: 27,
    subheading: 21,
    body: 16,
    label: 14,
    small: 12,
    caption: 11,
    button: 14,
    input: 14,
    table: 13,
    navigation: 14,
  },

  reception: {
  titleSize: 28,
  wallLogoSize: 56,
  wallPadding: 14,
  wallGap: 8,
},

  lineHeight: {
    display: 1.15,
    title: 1.2,
    heading: 1.2,
    body: 1.5,
    compact: 1.3,
  },

  spacing: {
    page: 32,
    section: 28,
    card: 24,
    control: 16,
    inline: 12,
    small: 8,
    medium: 20,
    large: 32,
    xlarge: 40,
    xxlarge: 52,
  },

  card: {
    width: 460,
    minWidth: 0,
    maxWidth: 720,
    minHeight: 0,
    padding: 30,
    radius: 16,
    gap: 20,
  },

  door: {
    width: 340,
    height: 190,
    padding: 26,
    radius: 16,
    gap: 12,
    iconSize: 48,
    iconRadius: 15,
    titleSize: 19,
    subtitleSize: 12,
    statusSize: 11,
    statusPaddingX: 13,
    statusPaddingY: 4,
    statusMinHeight: 24,
  },

  panel: {
    padding: 24,
    radius: 16,
    gap: 20,
    minHeight: 0,
  },

  border: {
    width: 1,
    radius: 16,
    strongWidth: 1,
  },

  control: {
    height: 44,
    minHeight: 42,
    radius: 9,
    paddingX: 14,
    paddingY: 10,
    gap: 10,
  },

  input: {
    height: 42,
    minHeight: 42,
    radius: 8,
    paddingX: 12,
    paddingY: 10,
    fontSize: 14,
    iconSize: 18,
  },

  button: {
    height: 44,
    minHeight: 42,
    radius: 9,
    paddingX: 14,
    paddingY: 10,
    fontSize: 14,
    iconSize: 18,
  },

  icon: {
    xs: 14,
    sm: 18,
    md: 22,
    lg: 26,
    xl: 32,
  },

  login: {
    pagePadding: 32,
    cardWidth: 460,
    cardMaxWidth: 720,
    cardPadding: 30,
    cardRadius: 16,
    titleSize: 32,
    subtitleSize: 16,
    inputHeight: 42,
    buttonHeight: 44,
    sectionGap: 20,
  },

  header: {
    height: 64,
    paddingX: 32,
    logoHeight: 36,
    titleSize: 20,
    iconSize: 22,
    brandVisible: true,
  },

    footer: {
    height: 60,
    minHeight: 60,
    paddingX: 24,
    paddingY: 10,
    radius: 16,
    gap: 10,
    fontSize: 14,
  },

  sidebar: {
    width: 250,
    collapsedWidth: 68,
    padding: 14,
    itemHeight: 46,
    itemGap: 8,
    iconSize: 21,
    labelSize: 14,
  },

  navigation: {
    height: 64,
    itemHeight: 46,
    gap: 10,
    iconSize: 21,
    labelSize: 14,
  },

  layout: {
    pageGutter: 32,
    contentGap: 24,
    cardGap: 20,
    sectionGap: 28,
    maxContentWidth: 1440,
    headerHeight: 64,
    sidebarWidth: 250,
  },

  grid: {
    columns: 5,
    minCardWidth: 260,
    gap: 20,
  },

  customerCards: {
    columns: 5,
    width: 0,
    minHeight: 0,
    gap: 20,
    padding: 24,
    radius: 16,
  },

  table: {
    rowHeight: 52,
    compactRowHeight: 46,
    headerHeight: 50,
    cellPaddingX: 14,
    cellPaddingY: 9,
    fontSize: 13,
  },

  form: {
    fieldGap: 8,
    rowGap: 18,
    sectionGap: 28,
    labelSize: 14,
    labelGap: 7,
    inputGap: 10,
  },

    identityForm: {
    wrapperGap: 14,
    columnGap: 16,
    rowGap: 11,
    fieldGap: 7,
    labelHeight: 17,
    labelSize: 11,
    requiredSize: 12,
    inputHeight: 42,
    inputRadius: 11,
    inputPaddingX: 14,
    inputFontSize: 13,
    checkboxSize: 17,
    checkboxGap: 9,
    iconSize: 18,
    iconLeft: 12,
    iconInputPaddingLeft: 36,
    noteSize: 10,
    noteMarginTop: 3,
  },

  wizard: {
    maxWidth: 1440,
    padding: 28,
    headerHeight: 64,
    progressHeight: 60,
    contentGap: 24,
    navigationHeight: 68,
    stepGap: 12,
    stepIndicator: 34,
  },

  modal: {
    width: 600,
    maxWidth: 800,
    padding: 28,
    radius: 16,
    gap: 18,
  },

  dashboard: {
    maxWidth: 1500,
    padding: 32,
    cardGap: 20,
    columns: 5,
  },

  projector: {
    scale: 1.15,
    pagePadding: 32,
    cardGap: 24,
    titleSize: 36,
    bodySize: 18,
    statusSize: 15,
  },
};

/* ===========================================================
   WIDE DESKTOP
   1920px - 2559px
=========================================================== */

export const WIDE_DESKTOP_TOKENS: ResponsiveTokens = {
  ...DESKTOP_TOKENS,

  meta: {
    name: "Wide Desktop",
    viewport: "wideDesktop",
    minWidth: 1920,
    maxWidth: 2559,
  },

  typography: {
    ...DESKTOP_TOKENS.typography,
    display: 40,
    title: 34,
    heading: 28,
    subheading: 22,
  },

  layout: {
    ...DESKTOP_TOKENS.layout,
    pageGutter: 40,
    contentGap: 28,
    cardGap: 24,
    sectionGap: 32,
    maxContentWidth: 1760,
  },

  grid: {
    columns: 6,
    minCardWidth: 260,
    gap: 24,
  },

  customerCards: {
    columns: 6,
    width: 0,
    minHeight: 0,
    gap: 24,
    padding: 26,
    radius: 18,
  },

  dashboard: {
    maxWidth: 1840,
    padding: 40,
    cardGap: 24,
    columns: 6,
  },

  projector: {
    scale: 1.25,
    pagePadding: 40,
    cardGap: 28,
    titleSize: 40,
    bodySize: 20,
    statusSize: 16,
  },
};

/* ===========================================================
   ULTRA WIDE
   2560px - 3839px
=========================================================== */

export const ULTRA_WIDE_TOKENS: ResponsiveTokens = {
  ...WIDE_DESKTOP_TOKENS,

  meta: {
    name: "Ultra Wide",
    viewport: "ultraWide",
    minWidth: 2560,
    maxWidth: 3839,
  },

  typography: {
    ...WIDE_DESKTOP_TOKENS.typography,
    display: 46,
    title: 38,
    heading: 30,
    subheading: 24,
    body: 17,
  },

  layout: {
    ...WIDE_DESKTOP_TOKENS.layout,
    pageGutter: 48,
    contentGap: 32,
    cardGap: 28,
    sectionGap: 36,
    maxContentWidth: 2200,
  },

  grid: {
    columns: 7,
    minCardWidth: 270,
    gap: 28,
  },

  customerCards: {
    columns: 7,
    width: 0,
    minHeight: 0,
    gap: 28,
    padding: 28,
    radius: 18,
  },

  dashboard: {
    maxWidth: 2280,
    padding: 48,
    cardGap: 28,
    columns: 7,
  },

  projector: {
    scale: 1.4,
    pagePadding: 48,
    cardGap: 32,
    titleSize: 46,
    bodySize: 22,
    statusSize: 18,
  },
};

/* ===========================================================
   PROJECTOR / TV
   3840px+
=========================================================== */

export const PROJECTOR_TV_TOKENS: ResponsiveTokens = {
  ...ULTRA_WIDE_TOKENS,

  meta: {
    name: "Projector / TV",
    viewport: "projector",
    minWidth: 3840,
    maxWidth: null,
  },

  typography: {
    ...ULTRA_WIDE_TOKENS.typography,
    display: 56,
    title: 44,
    heading: 34,
    subheading: 26,
    body: 19,
    label: 16,
    small: 14,
    caption: 13,
    button: 16,
    input: 16,
    table: 15,
    navigation: 16,
  },

  lineHeight: {
    display: 1.15,
    title: 1.2,
    heading: 1.2,
    body: 1.55,
    compact: 1.3,
  },

  spacing: {
    page: 64,
    section: 48,
    card: 36,
    control: 24,
    inline: 16,
    small: 12,
    medium: 24,
    large: 40,
    xlarge: 56,
    xxlarge: 72,
  },

  card: {
    width: 520,
    minWidth: 0,
    maxWidth: 900,
    minHeight: 0,
    padding: 36,
    radius: 22,
    gap: 28,
  },

  door: {
    ...ULTRA_WIDE_TOKENS.door,
    width: 620,
    height: 220,
    padding: 36,
    radius: 22,
    gap: 16,
    iconSize: 56,
    iconRadius: 18,
    titleSize: 24,
    subtitleSize: 15,
    statusSize: 14,
    statusPaddingX: 16,
    statusPaddingY: 6,
  },

  panel: {
    padding: 36,
    radius: 22,
    gap: 28,
    minHeight: 0,
  },

  border: {
    width: 1,
    radius: 22,
    strongWidth: 2,
  },

  control: {
    height: 54,
    minHeight: 50,
    radius: 12,
    paddingX: 20,
    paddingY: 14,
    gap: 14,
  },

  input: {
    height: 52,
    minHeight: 50,
    radius: 11,
    paddingX: 16,
    paddingY: 13,
    fontSize: 16,
    iconSize: 21,
  },

  button: {
    height: 54,
    minHeight: 50,
    radius: 12,
    paddingX: 20,
    paddingY: 14,
    fontSize: 16,
    iconSize: 22,
  },

  icon: {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 30,
    xl: 38,
  },

  login: {
    pagePadding: 64,
    cardWidth: 560,
    cardMaxWidth: 900,
    cardPadding: 40,
    cardRadius: 22,
    titleSize: 44,
    subtitleSize: 19,
    inputHeight: 52,
    buttonHeight: 54,
    sectionGap: 28,
  },

  header: {
    height: 80,
    paddingX: 64,
    logoHeight: 46,
    titleSize: 26,
    iconSize: 30,
    brandVisible: true,
  },

    footer: {
    height: 72,
    minHeight: 72,
    paddingX: 36,
    paddingY: 14,
    radius: 20,
    gap: 14,
    fontSize: 16,
  },

  sidebar: {
    width: 320,
    collapsedWidth: 84,
    padding: 20,
    itemHeight: 56,
    itemGap: 10,
    iconSize: 26,
    labelSize: 16,
  },

  navigation: {
    height: 80,
    itemHeight: 56,
    gap: 12,
    iconSize: 26,
    labelSize: 16,
  },

  layout: {
    pageGutter: 64,
    contentGap: 36,
    cardGap: 32,
    sectionGap: 48,
    maxContentWidth: 3200,
    headerHeight: 80,
    sidebarWidth: 320,
  },

  grid: {
    columns: 8,
    minCardWidth: 300,
    gap: 32,
  },

  customerCards: {
    columns: 8,
    width: 0,
    minHeight: 0,
    gap: 32,
    padding: 36,
    radius: 22,
  },

  table: {
    rowHeight: 64,
    compactRowHeight: 56,
    headerHeight: 60,
    cellPaddingX: 18,
    cellPaddingY: 12,
    fontSize: 15,
  },

  form: {
    fieldGap: 10,
    rowGap: 24,
    sectionGap: 36,
    labelSize: 16,
    labelGap: 8,
    inputGap: 12,
  },

    identityForm: {
    wrapperGap: 18,
    columnGap: 20,
    rowGap: 14,
    fieldGap: 9,
    labelHeight: 20,
    labelSize: 14,
    requiredSize: 15,
    inputHeight: 52,
    inputRadius: 12,
    inputPaddingX: 17,
    inputFontSize: 16,
    checkboxSize: 21,
    checkboxGap: 12,
    iconSize: 21,
    iconLeft: 15,
    iconInputPaddingLeft: 43,
    noteSize: 12,
    noteMarginTop: 4,
  },

  wizard: {
    maxWidth: 3200,
    padding: 48,
    headerHeight: 80,
    progressHeight: 72,
    contentGap: 32,
    navigationHeight: 84,
    stepGap: 16,
    stepIndicator: 42,
  },

  modal: {
    width: 760,
    maxWidth: 1100,
    padding: 36,
    radius: 22,
    gap: 24,
  },

  dashboard: {
    maxWidth: 3200,
    padding: 64,
    cardGap: 32,
    columns: 8,
  },

  projector: {
    scale: 1.6,
    pagePadding: 64,
    cardGap: 36,
    titleSize: 56,
    bodySize: 22,
    statusSize: 19,
  },
};

/* ===========================================================
   HIGH-LEVEL DEVICE TOKEN RESOLVER
=========================================================== */

export function getResponsiveTokens(
  device: ResponsiveDevice,
): ResponsiveTokens {
  if (device === "mobile") {
    return MOBILE_TOKENS;
  }

  if (device === "tablet") {
    return TABLET_TOKENS;
  }

  return DESKTOP_TOKENS;
}

/* ===========================================================
   VIEWPORT TOKEN RESOLVER
=========================================================== */

export function getResponsiveViewportTokens(
  width: number,
): ResponsiveTokens {
  if (
    !Number.isFinite(width) ||
    width < 360
  ) {
    return VERY_SMALL_MOBILE_TOKENS;
  }

  if (width < 600) {
    return MOBILE_TOKENS;
  }

  if (width < 768) {
    return LARGE_MOBILE_TOKENS;
  }

  if (width < 1024) {
    return TABLET_TOKENS;
  }

  if (width < 1280) {
    return SMALL_LAPTOP_TOKENS;
  }

  if (width < 1600) {
    return LAPTOP_TOKENS;
  }

  if (width < 1920) {
    return DESKTOP_TOKENS;
  }

  if (width < 2560) {
    return WIDE_DESKTOP_TOKENS;
  }

  if (width < 3840) {
    return ULTRA_WIDE_TOKENS;
  }

  return PROJECTOR_TV_TOKENS;
}

/* ===========================================================
   END
=========================================================== */