/* ===========================================================
   FINORA ENTERPRISE OSï¿½
   RESPONSIVE ENGINEï¿½

   CENTRAL RESPONSIVE TOKENS

   PURPOSE
   -----------------------------------------------------------
   SINGLE SOURCE OF TRUTH for responsive visual dimensions.

   FINORA RESPONSIVE DEVICES
   -----------------------------------------------------------
   1. Mobile
   2. Tablet
   3. Laptop
   4. Desktop

   CUSTOMER CARD CONTRACT
   -----------------------------------------------------------
   Mobile   ? 1 card
   Tablet   ? 3 cards
   Laptop   ? 5 cards
   Desktop  ? 6 cards

   IMPORTANT
   -----------------------------------------------------------
   Customer responsive geometry is controlled here.

   Components must consume these values and must NOT
   independently decide responsive dimensions.
=========================================================== */


/* ===========================================================
   RESPONSIVE DEVICE PROFILE
=========================================================== */

export type ResponsiveDevice =
  | "mobile"
  | "tablet"
  | "laptop"
  | "desktop";


/* ===========================================================
   RESPONSIVE VIEWPORT PROFILE
=========================================================== */

export type ResponsiveViewport =
  | "mobile"
  | "tablet"
  | "laptop"
  | "desktop";


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

  themeSelector?: {
  buttonSize: number;
  gap: number;
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
  height: number;
  minHeight: number;
  gap: number;
  padding: number;
  radius: number;
  photoSize: number;

  brandSize: number;
  companySize: number;
  nameSize: number;
  phoneSize: number;
  idSize: number;
  kycSize: number;
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
}


/* ===========================================================
   MOBILE
   0px - 767px
=========================================================== */

export const MOBILE_TOKENS: ResponsiveTokens = {

  meta: {
    name: "Mobile",
    viewport: "mobile",
    minWidth: 0,
    maxWidth: 767,
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

  reception: {
    titleSize: 18,
    wallLogoSize: 46,
    wallPadding: 10,
    wallGap: 7,
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

  /* MOBILE */

customerCards: {
  columns: 1,
  width: 210,
  height: 360,
  minHeight: 360,
  gap: 20,
  padding: 20,
  radius: 16,
  photoSize: 104,

  brandSize: 13,
  companySize: 12,
  nameSize: 18,
  phoneSize: 11,
  idSize: 10,
  kycSize: 10,
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
    brandVisible: false,
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

  reception: {
    titleSize: 18,
    wallLogoSize: 48,
    wallPadding: 10,
    wallGap: 7,
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

  /* =========================================================
     CUSTOMER GRID
     TABLET ? 3 CARDS
  ========================================================= */

  grid: {
    columns: 3,
    minCardWidth: 200,
    gap: 16,
  },

  /* =========================================================
     CUSTOMER CARDS
     TABLET ? 3 CARDS
  ========================================================= */

  /* TABLET */

customerCards: {
  columns: 3,
  width: 210,
  height: 360,
  minHeight: 360,
  gap: 20,
  padding: 20,
  radius: 16,
  photoSize: 104,

  brandSize: 13,
  companySize: 12,
  nameSize: 18,
  phoneSize: 11,
  idSize: 10,
  kycSize: 10,
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
};


/* ===========================================================
   LAPTOP
   1024px - 1599px
=========================================================== */

export const LAPTOP_TOKENS: ResponsiveTokens = {

  meta: {
    name: "Laptop",
    viewport: "laptop",
    minWidth: 1024,
    maxWidth: 1599,
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

  lineHeight: {
    display: 1.15,
    title: 1.2,
    heading: 1.2,
    body: 1.5,
    compact: 1.3,
  },

  spacing: {
    page: 28,
    section: 26,
    card: 22,
    control: 14,
    inline: 10,
    small: 8,
    medium: 16,
    large: 26,
    xlarge: 34,
    xxlarge: 46,
  },

  card: {
    width: 440,
    minWidth: 0,
    maxWidth: 660,
    minHeight: 0,
    padding: 26,
    radius: 16,
    gap: 18,
  },

  door: {
    width: 320,
    height: 180,
    padding: 24,
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
    pagePadding: 28,
    cardWidth: 440,
    cardMaxWidth: 660,
    cardPadding: 28,
    cardRadius: 16,
    titleSize: 30,
    subtitleSize: 15,
    inputHeight: 42,
    buttonHeight: 44,
    sectionGap: 18,
  },

  header: {
    height: 62,
    paddingX: 28,
    logoHeight: 34,
    titleSize: 19,
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

  reception: {
    titleSize: 26,
    wallLogoSize: 52,
    wallPadding: 12,
    wallGap: 8,
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
    pageGutter: 28,
    contentGap: 22,
    cardGap: 18,
    sectionGap: 26,
    maxContentWidth: 1280,
    headerHeight: 62,
    sidebarWidth: 220,
  },

  /* =========================================================
     CUSTOMER GRID
     LAPTOP ? 5 CARDS
  ========================================================= */

  grid: {
    columns: 6,
    minCardWidth: 200,
    gap: 20,
  },

  /* =========================================================
     CUSTOMER CARDS
     LAPTOP ? 5 CARDS

     220px gives the hanger root a real packing width.
     This prevents the previous zero-width hanger from
     collapsing the grid layout.
  ========================================================= */

  /* LAPTOP */

customerCards: {
  columns: 6,
  width: 210,
  height: 360,
  minHeight: 360,
  gap: 20,
  padding: 20,
  radius: 16,
  photoSize: 104,

  brandSize: 13,
  companySize: 12,
  nameSize: 18,
  phoneSize: 11,
  idSize: 10,
  kycSize: 10,
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
    maxWidth: 1280,
    padding: 28,
    headerHeight: 62,
    progressHeight: 58,
    contentGap: 22,
    navigationHeight: 66,
    stepGap: 10,
    stepIndicator: 33,
  },

  modal: {
    width: 560,
    maxWidth: 720,
    padding: 24,
    radius: 16,
    gap: 16,
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
   1600px+
=========================================================== */

export const DESKTOP_TOKENS: ResponsiveTokens = {

  meta: {
    name: "Desktop",
    viewport: "desktop",
    minWidth: 1600,
    maxWidth: null,
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

  reception: {
    titleSize: 28,
    wallLogoSize: 56,
    wallPadding: 14,
    wallGap: 8,
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

  /* =========================================================
     CUSTOMER GRID
     DESKTOP ? 6 CARDS
  ========================================================= */

  grid: {
    columns: 6,
    minCardWidth: 200,
    gap: 20,
  },

  /* =========================================================
     CUSTOMER CARDS
     DESKTOP ? 6 CARDS

     210px allows six hanger columns to fit inside the
     resolved desktop content area together with the
     responsive 20px grid gap and page padding.
  ========================================================= */

  /* DESKTOP */

customerCards: {
  columns: 6,
  width: 210,
  height: 360,
  minHeight: 360,
  gap: 20,
  padding: 20,
  radius: 16,
  photoSize: 104,

  brandSize: 13,
  companySize: 12,
  nameSize: 19,
  phoneSize: 12,
  idSize: 11,
  kycSize: 11,
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
};

/* ===========================================================
   HIGH-LEVEL DEVICE TOKEN RESOLVER
=========================================================== */

export function getResponsiveTokens(
  device: ResponsiveDevice,
): ResponsiveTokens {

  if (
    device === "mobile"
  ) {

    return MOBILE_TOKENS;

  }

  if (
    device === "tablet"
  ) {

    return TABLET_TOKENS;

  }

  if (
    device === "laptop"
  ) {

    return LAPTOP_TOKENS;

  }

  return DESKTOP_TOKENS;

}


/* ===========================================================
   VIEWPORT TOKEN RESOLVER

   FINORA OFFICIAL BREAKPOINTS
   -----------------------------------------------------------
   Mobile   : 0 - 767
   Tablet   : 768 - 1023
   Laptop   : 1024 - 1599
   Desktop  : 1600+
=========================================================== */

export function getResponsiveViewportTokens(
  width: number,
): ResponsiveTokens {

  if (
    !Number.isFinite(width) ||
    width < 768
  ) {

    return MOBILE_TOKENS;

  }

  if (
    width < 1024
  ) {

    return TABLET_TOKENS;

  }

  if (
    width < 1600
  ) {

    return LAPTOP_TOKENS;

  }

  return DESKTOP_TOKENS;

}


/* ===========================================================
   CUSTOMER RESPONSIVE TOKEN RESOLVER

   FINORA CUSTOMER HANGER™

   FINAL CUSTOMER GRID CONTRACT
   -----------------------------------------------------------

   MOBILE
      → existing mobile behavior remains untouched

   TABLET
      → existing tablet behavior remains untouched

   LAPTOP / DESKTOP
      → minimum 4 cards at 1024px
      → then 5 cards when a complete card fits
      → then 6 cards when a complete card fits
      → maximum 6 cards forever

   IMPORTANT
   -----------------------------------------------------------
   CUSTOMER ID CARD WIDTH IS LOCKED.

   The locked customer-card width is taken from the
   FINORA LAPTOP customer-card contract.

   This prevents the desktop token profile from changing
   the customer-card width when the viewport crosses
   1600px.

   The Responsive Engine changes ONLY:

      - column count
      - horizontal gap

   It does NOT change:

      - card width
      - card height
      - card padding
      - card radius
      - card typography
      - photo size

   Therefore:

      1024px
         → 4 locked cards

      larger viewport
         → 5 when a complete card fits

      larger viewport
         → 6 when a complete card fits

      6 reached
         → always 6

   Extra width is converted into grid gap.

   NO OVERLAP
   NO CARD STRETCHING
   NO CARD SHRINKING
   NO FORCED CUSTOMER-GRID OVERFLOW
=========================================================== */

export function getCustomerTokens(
  width: number,
): ResponsiveTokens {

  /* =========================================================
     BASE VIEWPORT TOKENS
  ========================================================= */

  const baseTokens =
    getResponsiveViewportTokens(
      width,
    );


  /* =========================================================
     MOBILE / TABLET

     Existing behavior remains untouched.

     This preserves the already-working mobile and tablet
     presentation exactly as supplied by their token profiles.
  ========================================================= */

  if (
    !Number.isFinite(width) ||
    width < 1024
  ) {

    return baseTokens;

  }


  /* =========================================================
     LOCKED CUSTOMER CARD CONTRACT

     IMPORTANT:
     ---------------------------------------------------------
     Always use the LAPTOP customer-card width.

     Do NOT use baseTokens.customerCards.width here because
     that would switch to the desktop token width at 1600px.

     The customer card therefore has ONE locked width across
     laptop and desktop responsive resolution.
  ========================================================= */

  const LOCKED_CARD_WIDTH =
    LAPTOP_TOKENS.customerCards.width;


  /* =========================================================
     SAFETY

     The customer-card contract must be numeric.
  ========================================================= */

  const cardWidth =
    typeof LOCKED_CARD_WIDTH === "number" &&
    Number.isFinite(LOCKED_CARD_WIDTH) &&
    LOCKED_CARD_WIDTH > 0
      ? LOCKED_CARD_WIDTH
      : 220;


  /* =========================================================
     CUSTOMER GRID LIMITS

     4 is the minimum customer-card count from 1024px onward.

     6 is the absolute FINORA maximum.
  ========================================================= */

  const MIN_COLUMNS =
    4;

  const MAX_COLUMNS =
    6;


  /* =========================================================
     RESPONSIVE PAGE GUTTER

     The existing viewport profile owns the page gutter.

     Customer-card geometry itself remains locked.
  ========================================================= */

  const pageGutter =
    Math.max(
      0,
      baseTokens.layout.pageGutter,
    );


  /* =========================================================
     AVAILABLE CUSTOMER WIDTH

     Only usable viewport width is considered.

     Card width is NEVER derived from this value.
  ========================================================= */

  const availableWidth =
    Math.max(
      0,
      width -
      (
        pageGutter *
        2
      ),
    );


  /* =========================================================
     MINIMUM GRID GAP

     The card width is locked, but cards must never visually
     touch when another column becomes available.

     20px is the existing FINORA customer-grid separation
     contract.

     Therefore a candidate column count is accepted only when:

       candidate × lockedCardWidth
       +
       (candidate - 1) × MIN_GRID_GAP
       <= availableWidth
  ========================================================= */

  const MIN_GRID_GAP =
    20;


  /* =========================================================
     COLUMN RESOLUTION

     This produces the requested packing behavior:

       1024px
          → 4 cards

       larger viewport
          → gap grows

       when 5 complete cards + minimum gap fit
          → 5 cards

       when 6 complete cards + minimum gap fit
          → 6 cards

       after 6
          → always 6

     With the current locked 220px card and laptop gutter:

       4 cards → 996px viewport threshold
       5 cards → 1236px viewport threshold
       6 cards → 1476px viewport threshold

     The exact threshold is calculated from the actual
     viewport and current FINORA page gutter.
  ========================================================= */

  let columns =
    MIN_COLUMNS;


  for (
    let candidate =
      MAX_COLUMNS;
    candidate >= MIN_COLUMNS;
    candidate--
  ) {

    const requiredWidth =
      (
        candidate *
        cardWidth
      ) +
      (
        (
          candidate -
          1
        ) *
        MIN_GRID_GAP
      );


    if (
      requiredWidth <=
      availableWidth
    ) {

      columns =
        candidate;

      break;

    }

  }


  /* =========================================================
     RESPONSIVE GAP

     The minimum gap is preserved.

     Any horizontal space beyond the minimum required grid
     is distributed between the cards.

     Therefore:

       screen grows
          → gap grows

       new complete card fits
          → column count increases

       6 cards reached
          → card width remains locked
          → gap continues growing

     No card resizing.
     No card shrinking.
  ========================================================= */

  const totalCardWidth =
    columns *
    cardWidth;


  const remainingWidth =
    Math.max(
      0,
      availableWidth -
      totalCardWidth,
    );


  const calculatedGap =
    columns > 1
      ? Math.floor(
          remainingWidth /
          (
            columns -
            1
          ),
        )
      : 0;


  const gap =
  columns > 1
    ? Math.min(
        50,
        Math.max(
          MIN_GRID_GAP,
          calculatedGap,
        ),
      )
    : 0;


  /* =========================================================
     FINAL CUSTOMER TOKENS

     ONLY:
       - columns
       - grid gap

     are responsive.

     Customer-card width remains locked.
  ========================================================= */

  return {

    ...baseTokens,

    grid: {

      ...baseTokens.grid,

      columns:
        columns,

      minCardWidth:
        cardWidth,

      gap:
        gap,

    },

    customerCards: {

      ...baseTokens.customerCards,

      columns:
        columns,

      width:
        cardWidth,

      gap:
        gap,

    },

  };

}


/* ===========================================================
   DEFAULT CUSTOMER TOKENS
=========================================================== */

export const DEFAULT_CUSTOMER_TOKENS:
  ResponsiveTokens =
    LAPTOP_TOKENS;


/* ===========================================================
   END
=========================================================== */