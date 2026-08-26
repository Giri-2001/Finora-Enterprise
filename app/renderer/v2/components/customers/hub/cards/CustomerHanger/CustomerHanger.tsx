/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER HANGER™

   PREMIUM FRONT IDENTITY PRESENTATION

   Module  : Customer Hub
   Layer   : Cards
   Version : 3.0
   Status  : Production

   RESPONSIBILITY:
   - Customer selection
   - Premium hanging presentation
   - Customer ID card presentation
   - Customer Responsive Engine integration
   - FINORA Theme Engine visual integration
   - Card geometry propagation to CustomerCardFlip
   - Controlled single-card flip presentation

   RESPONSIVE CONTRACT:
   - Mobile  → 1 card
   - Tablet  → 3 cards
   - Laptop  → 5 cards
   - Desktop → 6 cards

   FLIP CONTRACT:
   - CustomerHanger does NOT own flip state.
   - Parent Customer Hub owns the active flipped customer.
   - flipped is received as a controlled prop.
   - onFlip is forwarded to the parent.
   - Parent is responsible for allowing only ONE
     customer card to remain flipped at a time.

   IMPORTANT:
   - Responsive visual values come from the Customer
     Responsive Engine.
   - Theme visual values come from the FINORA Theme Engine.
   - This component does NOT decide breakpoint values.
   - This component does NOT calculate responsive dimensions.
   - Customer card width comes only from
     customerTokens.customerCards.width.
   - Customer card height comes only from
     customerTokens.customerCards.height.
   - Customer card minimum height comes only from
     customerTokens.customerCards.minHeight.
   - CustomerCardFlip inherits the resolved card geometry
     through this component.
   - Mobile card remains a real fixed-width ID card.
   - Mobile card does NOT expand to fill available width.
   - Mobile card is centered so equal side gaps remain.
   - Parent layout remains responsible for column count
     and inter-card spacing.
=========================================================== */


/* ===========================================================
   IMPORTS
=========================================================== */

import type {
  CSSProperties,
  MouseEvent,
} from "react";


/* ===========================================================
   THEME ENGINE
=========================================================== */

import {
  useTheme,
} from "../../../../../themes/provider/ThemeProvider";


/* ===========================================================
   CUSTOMER CARD COMPONENTS
=========================================================== */

import CustomerIdCard
  from "../CustomerIdCard";

import CustomerCardFlip
  from "../CustomerCardFlip";

import CustomerIdCardBack
  from "../CustomerIdCardBack";


/* ===========================================================
   COMPONENT CONTRACT
=========================================================== */

import type {
  CustomerHangerProps,
} from "./types";


/* ===========================================================
   HELPERS
=========================================================== */

import {
  canOpen,
} from "./helpers";


/* ===========================================================
   CUSTOMER RESPONSIVE ENGINE
=========================================================== */

import {
  getCustomerTokens,
} from "../../../../../utils/responsive/customers/customers.tokens";


/* ===========================================================
   PRESENTATION STYLES
=========================================================== */

import {
  containerStyle,
  pinStyle,
  ropeStyle,
  hangerStyle,
  cardContainerStyle,
  bottomRailStyle,
} from "./styles";


/* ===========================================================
   THEME STYLE TYPE
=========================================================== */

type ThemeStyle =
  CSSProperties &
  Record<
    `--${string}`,
    string
  >;


/* ===========================================================
   COMPONENT
=========================================================== */

export default function CustomerHanger({

  customer,

  onClick,

  flipped = false,

  onFlip,

}: CustomerHangerProps) {


  /* =========================================================
     THEME ENGINE

     Theme controls visual appearance only.

     Responsive geometry is never derived from theme values.
  ========================================================= */

  const {
    theme,
  } = useTheme();


  /* =========================================================
     CUSTOMER DATA
  ========================================================= */

  const {

    id,

    name,

    phone,

    photo,

    branch,

    active,

    kycVerified,

    fatherName,

    village,

    pinCode,

    district,

    customerSince,

    outstandingAmount,

    lastPaymentDate,

    lastPaymentAmount,

    totalLoans,

    activeLoans,

    closedLoans,

  } = customer;


  /* =========================================================
     CUSTOMER RESPONSIVE ENGINE

     IMPORTANT:

     CustomerHanger does not calculate breakpoints.

     getCustomerTokens() is the single source of truth
     for customer responsive geometry.
  ========================================================= */

  const customerTokens =
    getCustomerTokens(
      typeof window !== "undefined"
        ? window.innerWidth
        : 0,
    );


  /* =========================================================
     CUSTOMER CARD WIDTH

     SINGLE SOURCE OF TRUTH:

       customerTokens.customerCards.width
  ========================================================= */

  const customerCardWidth =
    customerTokens.customerCards.width;


  /* =========================================================
     CUSTOMER CARD HEIGHT

     SINGLE SOURCE OF TRUTH:

       customerTokens.customerCards.height
  ========================================================= */

  const customerCardHeight =
    customerTokens.customerCards.height;


  /* =========================================================
     CUSTOMER CARD MINIMUM HEIGHT

     SINGLE SOURCE OF TRUTH:

       customerTokens.customerCards.minHeight
  ========================================================= */

  const customerCardMinHeight =
    customerTokens.customerCards.minHeight;


  /* =========================================================
     THEME CSS VARIABLES
  ========================================================= */

  const themeVariables: ThemeStyle = {

    "--finora-theme-brand-primary":
      theme.colors.brand.primary,

    "--finora-theme-brand-secondary":
      theme.colors.brand.secondary,

    "--finora-theme-brand-accent":
      theme.colors.brand.accent,

    "--finora-theme-brand-accent-soft":
      theme.colors.brand.accentSoft,

    "--finora-theme-border-default":
      theme.colors.border.default,

    "--finora-theme-border-strong":
      theme.colors.border.strong,

    "--finora-theme-border-subtle":
      theme.colors.border.subtle,

    "--finora-theme-overlay-shadow":
      theme.colors.overlay.shadow,

          /* -------------------------------------------------------
       IMPERIAL GOLD / WHITE THEME SURFACE CONTRACT

       PAGE:
       - intentionally softened to a light grey
       - prevents the entire page from becoming pure white

       CARD:
       - remains 100% solid white
       - creates clear separation between card and page

       OTHER FOUR THEMES:
       - completely unchanged
    ------------------------------------------------------- */

    "--finora-theme-card-surface":
      theme.id === "imperial-gold"
        ? "#FFFFFF"
        : theme.colors.background.surface,

    "--finora-theme-surface":
      theme.id === "imperial-gold"
        ? "color-mix(in srgb, #FFFFFF 30%, #DDE2E8 70%)"
        : theme.colors.background.surface,

    "--finora-theme-background-surface":
      theme.id === "imperial-gold"
        ? "color-mix(in srgb, #FFFFFF 30%, #DDE2E8 70%)"
        : theme.colors.background.surface,

    "--finora-theme-surface-muted":
      theme.id === "imperial-gold"
        ? "color-mix(in srgb, #FFFFFF 30%, #D4D9E0 70%)"
        : theme.colors.background.surfaceMuted,

    "--finora-theme-background-surface-muted":
      theme.id === "imperial-gold"
        ? "color-mix(in srgb, #FFFFFF 30%, #D4D9E0 70%)"
        : theme.colors.background.surfaceMuted,

    "--finora-theme-text-primary":
      theme.colors.text.primary,

    "--finora-theme-text-secondary":
      theme.colors.text.secondary,

    "--finora-theme-text-body":
     theme.colors.text.secondary,

    "--finora-theme-text-muted":
      theme.colors.text.muted,

        "--finora-theme-success-soft":
      `color-mix(
        in srgb,
        ${theme.colors.status.successSoft} 55%,
        ${theme.colors.background.surface}
      )`,

    "--finora-theme-success":
      theme.colors.status.success,

      "--finora-theme-success-border":
      theme.colors.border.strong,

        ...(theme.id === "obsidian"
  ? {
      "--finora-company-band-background":
        "color-mix(in srgb, var(--finora-theme-brand-accent) 10%, var(--finora-theme-surface))",
    }
  : {}),

  };


  /* =========================================================
     HANGER ROOT

     Root width is exactly the resolved Customer ID Card width.
  ========================================================= */

  const resolvedContainerStyle:
    ThemeStyle = {

    ...containerStyle,

    ...themeVariables,

    width:
      `${customerCardWidth}px`,

    minWidth:
      `${customerCardWidth}px`,

    maxWidth:
      `${customerCardWidth}px`,

    flex:
      `0 0 ${customerCardWidth}px`,

    flexShrink:
      0,

    boxSizing:
      "border-box",

    alignItems:
      "center",

    alignSelf:
      "center",

    marginInline:
      "auto",

    /* -------------------------------------------------------
       RESPONSIVE CARD SHAPE LOCK

       The container carries the same radius as the actual
       Customer ID Card. This prevents the fixed responsive
       width/height layer from exposing square corners on
       light themes.
    ------------------------------------------------------- */

    position:
      "relative",

    borderRadius:
      `${customerTokens.customerCards.radius}px`,

    overflow:
      "visible",

  };


  /* =========================================================
     THEMED PIN
  ========================================================= */

  const resolvedPinStyle:
    CSSProperties = {

    ...pinStyle,

    background:
      `linear-gradient(
        180deg,
        ${theme.colors.brand.accent},
        ${theme.colors.brand.primary}
      )`,

    border:
      `1px solid ${theme.colors.border.strong}`,

    boxShadow:
      `0 2px 4px ${theme.colors.overlay.shadow}`,

  };


  /* =========================================================
     THEMED ROPE

     VISUAL CORRECTION:

     Previous rope thickness:
       2px

     Required premium thickness:
       3px

     This affects only the decorative vertical rope.
     It does NOT affect responsive card geometry.
  ========================================================= */

  const resolvedRopeStyle:
    CSSProperties = {

    ...ropeStyle,

    width:
      "3px",

    minWidth:
      "3px",

    maxWidth:
      "3px",

    background:
      `linear-gradient(
        180deg,
        ${theme.colors.border.subtle},
        ${theme.colors.border.default},
        ${theme.colors.border.strong}
      )`,

  };


  /* =========================================================
     THEMED HANGER

     CRITICAL GEOMETRY LOCK:

     The hanger MUST remain an OPEN-TOP U shape.

     Top border:
       0px

     Left:
       3px

     Right:
       3px

     Bottom:
       3px

     We intentionally use borderWidth instead of the
     border shorthand so no later borderColor/theme merge
     can visually recreate a top border.

     Result:

           │
           │
         ╭   ╮
        ╱     ╲
        ╲     ╱
         ╰───╯

     There must be NOTHING connecting the two top ends.
  ========================================================= */

  const resolvedHangerStyle:
    CSSProperties = {

    ...hangerStyle,

    borderStyle:
      "solid",

    borderWidth:
      "0 3px 3px 3px",

    borderTopWidth:
      "0px",

    borderLeftColor:
      theme.colors.border.strong,

    borderRightColor:
      theme.colors.border.strong,

    borderBottomColor:
      theme.colors.border.strong,

    borderTopColor:
      "transparent",

    borderTopStyle:
      "none",

  };


  /* =========================================================
     CUSTOMER CARD CONTAINER
  ========================================================= */

  const resolvedCardContainerStyle:
    CSSProperties = {

    ...cardContainerStyle,

    width:
      `${customerCardWidth}px`,

    minWidth:
      `${customerCardWidth}px`,

    maxWidth:
      `${customerCardWidth}px`,

    height:
      `${customerCardHeight}px`,

    minHeight:
      `${customerCardMinHeight}px`,

    maxHeight:
      `${customerCardHeight}px`,

    boxSizing:
      "border-box",

    flex:
      `0 0 ${customerCardWidth}px`,

    flexShrink:
      0,

    alignSelf:
      "center",

    marginInline:
      "auto",

    overflow:
      "visible",

  };


  /* =========================================================
     CUSTOMER SELECTION
  ========================================================= */

  function handleCardClick(
    event:
      MouseEvent<HTMLDivElement>,
  ): void {


    const target =
      event.target as HTMLElement;


    const clickedCustomerCard =
      target.closest(
        '[data-finora-customer-card="true"]',
      );


    if (
      !clickedCustomerCard
    ) {

      return;

    }


    if (
      !canOpen(active)
    ) {

      return;

    }


    onClick?.(
      customer,
    );

  }


  /* =========================================================
     CONTROLLED FLIP HANDLER
  ========================================================= */

  function handleFlip(): void {

    if (
      !canOpen(active)
    ) {

      return;

    }


    onFlip?.();

  }


  /* =========================================================
     UI
  ========================================================= */

  return (

    <div

      style={
        resolvedContainerStyle
      }

      onClick={
        handleCardClick
      }

    >

      {/* =====================================================
          PIN
      ===================================================== */}

      <div
        style={
          resolvedPinStyle
        }
      />


      {/* =====================================================
          ROPE

          3px premium thickness.
      ===================================================== */}

      <div
        style={
          resolvedRopeStyle
        }
      />


      {/* =====================================================
          METAL CONNECTOR
      ===================================================== */}

      <div

        style={{

          width:
            "8px",

          height:
            "8px",

          minWidth:
            "8px",

          minHeight:
            "8px",

          borderRadius:
            "50%",

          background:
            `linear-gradient(
              180deg,
              ${theme.colors.brand.accent},
              ${theme.colors.brand.primary}
            )`,

          border:
            `1px solid ${theme.colors.border.strong}`,

          marginTop:
            "-5px",

          marginBottom:
            "4px",

          zIndex:
            4,

          flexShrink:
            0,

        }}

      />


      {/* =====================================================
          HANGER

          OPEN-TOP U SHAPE

          NO TOP BORDER.
      ===================================================== */}

      <div
        style={
          resolvedHangerStyle
        }
      />


      {/* =====================================================
          CUSTOMER CARD CONTAINER

          Responsive Engine owns card geometry.
      ===================================================== */}

      <div
        style={
          resolvedCardContainerStyle
        }
      >

        <div

          data-finora-customer-card="true"

          style={{

            width:
              "100%",

            height:
              "100%",

            minWidth:
              0,

            minHeight:
              0,

            boxSizing:
              "border-box",

            /* -------------------------------------------------
               FINAL CARD CLIPPING BOUNDARY

               CustomerCardFlip may expose its own square
               width/height layer. That is almost invisible
               on dark themes but becomes clearly visible on
               the white theme.

               This wrapper is therefore the parent visual
               boundary for the resolved responsive radius.
               The card itself remains responsible for its
               own internal theme surface/border.
            ------------------------------------------------- */

            position:
              "relative",

            borderRadius:
              `${customerTokens.customerCards.radius}px`,

            /* -------------------------------------------------
               ROUNDED CARD CLIPPING

               clipPath is the visual clipping boundary.
               overflow MUST remain visible so the card elevation
               shadow can extend outside the card on light themes.
               This removes the square/flat white-theme appearance
               without exposing the internal flip layer corners.
            ------------------------------------------------- */

            overflow:
              "visible",

            clipPath:
              `inset(0 round ${customerTokens.customerCards.radius}px)`,

            isolation:
              "isolate",

            background:
              "transparent",

            /* -------------------------------------------------
               PREMIUM CARD ELEVATION

               The shadow is deliberately stronger than the
               previous 18px / 32px value so a white card remains
               visually separated from the white theme surface.

               No outer border is introduced.
            ------------------------------------------------- */

            filter:
              `
              drop-shadow(
                0 20px 34px
                color-mix(
                  in srgb,
                  ${theme.colors.overlay.shadow} 82%,
                  transparent
                )
              )
              drop-shadow(
                0 6px 12px
                color-mix(
                  in srgb,
                  ${theme.colors.overlay.shadow} 62%,
                  transparent
                )
              )
              `,

          }}

        >

          {/* =================================================
              CUSTOMER CARD FLIP
          ================================================= */}

          <CustomerCardFlip

            flipped={
              flipped
            }

            onFlip={
              handleFlip
            }

            front={

              <CustomerIdCard

                customerId={
                  id
                }

                customerName={
                  name
                }

                profilePhoto={
                  photo
                }

                phoneNumber={
                  phone
                }

                branchName={
                  branch
                }

                kycVerified={
                  kycVerified
                }

                responsiveTokens={
                  customerTokens
                }

                compact={
                  true
                }

              />

            }

            back={

              <CustomerIdCardBack

                customerId={
                  id
                }

                fatherName={
                  fatherName
                }

                village={
                  village
                }

                pinCode={
                  pinCode
                }

                district={
                  district
                }

                customerSince={
                  customerSince
                }

                totalLoans={
                  totalLoans
                }

                activeLoans={
                  activeLoans
                }

                closedLoans={
                  closedLoans
                }

                outstandingAmount={
                  outstandingAmount
                }

                lastPaymentDate={
                  lastPaymentDate
                }

                lastPaymentAmount={
                  lastPaymentAmount
                }

                responsiveTokens={
                  customerTokens
                }

              />

            }

          />

        </div>

      </div>


      {/* =====================================================
          FINISHING RAIL
      ===================================================== */}

      <div
        style={
          {
            ...bottomRailStyle,

            background:
              `linear-gradient(
                90deg,
                transparent,
                ${theme.colors.brand.accent},
                transparent
              )`,
          }
        }
      />

    </div>

  );

}


/* ===========================================================
   END
=========================================================== */