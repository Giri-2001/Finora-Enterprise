/* ===========================================================
   FINORA ENTERPRISE OS™

   ADDRESS PREVIEW CARD

   Version     : 3.0
   Phase       : Phase 2
   Architecture: Enterprise
   Status      : Production

   RESPONSIBILITY:

   - Live presentation of captured address data
   - Theme-aware preview surface
   - Responsive preview geometry
   - Lucide icon presentation

   IMPORTANT:

   - No local breakpoints
   - No media queries
   - No local responsive calculations
   - No local colour palette
   - No emoji icons
=========================================================== */


/* ===========================================================
   IMPORTS
=========================================================== */

import type {
  CSSProperties,
} from "react";


import {
  Building2,
  Hash,
  House,
  Map,
  MapPin,
} from "lucide-react";


import {
  useResponsive,
} from "../../../utils/responsive";


import {
  useTheme,
} from "../../../themes/provider";


import {
  getAddressTokens,
} from "../../../utils/responsive/customers/address/address.tokens";


import {
  createAddressPreviewHeaderStyle,
  createAddressPreviewIconStyle,
  createAddressPreviewLabelStyle,
  createAddressPreviewMetaGridStyle,
  createAddressPreviewMetaItemStyle,
  createAddressPreviewRowStyle,
  createAddressPreviewRowsStyle,
  createAddressPreviewStyle,
  createAddressPreviewSubtitleStyle,
  createAddressPreviewTitleStyle,
} from "../../../utils/responsive/customers/address/address.layout";


/* ===========================================================
   TYPES
=========================================================== */

export interface AddressPreviewData {

  customerName?:
    string;

  currentAddress?:
    string;

  city?:
    string;

  state?:
    string;

  pinCode?:
    string;

}


interface AddressPreviewCardProps {

  value:
    AddressPreviewData;

}


type AddressThemeStyle =
  CSSProperties &
  Record<
    `--${string}`,
    string
  >;


/* ===========================================================
   SAFE TEXT
=========================================================== */

function safeText(
  value:
    | string
    | undefined,
):
  string {

  const normalized =
    value?.trim() ??
    "";

  return normalized
    ? normalized
    : "--";

}


/* ===========================================================
   COMPONENT
=========================================================== */

export default function AddressPreviewCard({

  value,

}: AddressPreviewCardProps) {

  const {
    tokens,
  } =
    useResponsive();


  const {
    theme,
  } =
    useTheme();


  const addressTokens =
    getAddressTokens(
      tokens.meta.viewport,
    );


  const themeVariables:
    AddressThemeStyle = {

    "--finora-theme-brand-primary":
      theme.colors.brand.primary,

    "--finora-theme-brand-secondary":
      theme.colors.brand.secondary,

    "--finora-theme-brand-accent":
      theme.colors.brand.accent,

    "--finora-theme-brand-accent-soft":
      theme.colors.brand.accentSoft,

    "--finora-theme-surface":
      theme.colors.background.surface,

    "--finora-theme-surface-muted":
      theme.colors.background.surfaceMuted,

    "--finora-theme-text-primary":
      theme.colors.text.primary,

    "--finora-theme-text-secondary":
      theme.colors.text.secondary,

    "--finora-theme-text-muted":
      theme.colors.text.muted,

    "--finora-theme-text-inverse":
      theme.colors.text.inverse,

    "--finora-theme-border-default":
      theme.colors.border.default,

    "--finora-theme-border-strong":
      theme.colors.border.strong,

    "--finora-theme-border-subtle":
      theme.colors.border.subtle,

    "--finora-theme-overlay-shadow":
      theme.colors.overlay.shadow,

  };


  const previewStyle =
    createAddressPreviewStyle(
      addressTokens,
    );


  const previewHeaderStyle =
    createAddressPreviewHeaderStyle(
      addressTokens,
    );


  const previewIconStyle =
    createAddressPreviewIconStyle(
      addressTokens,
    );


  const previewTitleStyle =
    createAddressPreviewTitleStyle(
      addressTokens,
    );


  const previewSubtitleStyle =
    createAddressPreviewSubtitleStyle(
      addressTokens,
    );


  const previewRowsStyle =
    createAddressPreviewRowsStyle(
      addressTokens,
    );


  const previewRowStyle =
    createAddressPreviewRowStyle(
      addressTokens,
    );


  const previewLabelStyle =
    createAddressPreviewLabelStyle(
      addressTokens,
    );


  const previewValueStyle =
    {
      ...createAddressPreviewTitleStyle(
        addressTokens,
      ),

      fontSize:
        `${addressTokens.previewValueSize}px`,

      fontWeight:
        650,
    };


  const previewMetaGridStyle =
    createAddressPreviewMetaGridStyle(
      addressTokens,
    );


  const previewMetaItemStyle =
    createAddressPreviewMetaItemStyle(
      addressTokens,
    );


  return (

    <section
      style={{
        ...themeVariables,

        ...previewStyle,

      }}
    >

      <header
        style={
          previewHeaderStyle
        }
      >

        <div
          style={
            previewIconStyle
          }
        >

          <House
            size={
              addressTokens.previewIconSize *
              0.58
            }

            strokeWidth={
              1.8
          }

            aria-hidden="true"
          />

        </div>


        <div
          style={{
            minWidth:
              0,
          }}
        >

          <h3
            style={
              previewTitleStyle
            }
          >
            Address Preview
          </h3>


          <p
            style={
              previewSubtitleStyle
            }
          >
            Live preview of the customer's address.
          </p>

        </div>

      </header>


      <div
        style={
          previewRowsStyle
        }
      >

        <div
          style={
            previewRowStyle
          }
        >

          <div
            style={
              previewLabelStyle
            }
          >
            Customer
          </div>


          <div
            style={
              {
                ...previewValueStyle,

                fontSize:
                  `${addressTokens.previewValueSize}px`,

                fontWeight:
                  650,

              }
            }
          >
            {safeText(
              value.customerName,
            )}
          </div>

        </div>


        <div
          style={
            previewRowStyle
          }
        >

          <div
            style={{
              display:
                "flex",

              alignItems:
                "center",

              gap:
                `${Math.max(
                  4,
                  addressTokens.labelGap,
                )}px`,

              color:
                "var(--finora-theme-text-muted, #7A8494)",

              fontSize:
                `${addressTokens.previewLabelSize}px`,

              fontWeight:
                800,

              letterSpacing:
                `${addressTokens.labelLetterSpacing}px`,

              textTransform:
                "uppercase",

            }}
          >

            <MapPin
              size={
                addressTokens.previewLabelSize + 4
              }

              strokeWidth={
                1.8
              }

              aria-hidden="true"
            />

            Current Address

          </div>


          <div
            style={{
              ...previewValueStyle,

              fontSize:
                `${addressTokens.previewValueSize}px`,

              fontWeight:
                650,

              whiteSpace:
                "normal",

              overflowWrap:
                "anywhere",

            }}
          >
            {safeText(
              value.currentAddress,
            )}
          </div>

        </div>


        <div
          style={
            previewMetaGridStyle
          }
        >

          <div
            style={
              previewMetaItemStyle
            }
          >

            <div
              style={{
                ...previewLabelStyle,

                display:
                  "flex",

                alignItems:
                  "center",

                gap:
                  `${Math.max(
                    3,
                    addressTokens.labelGap - 1,
                  )}px`,

              }}
            >

              <Building2
                size={
                  addressTokens.previewLabelSize + 4
                }

                strokeWidth={
                  1.8
                }

                aria-hidden="true"
              />

              City

            </div>


            <div
              style={{
                ...previewValueStyle,

                fontSize:
                  `${addressTokens.previewValueSize}px`,

              }}
            >
              {safeText(
                value.city,
              )}
            </div>

          </div>


          <div
            style={
              previewMetaItemStyle
            }
          >

            <div
              style={{
                ...previewLabelStyle,

                display:
                  "flex",

                alignItems:
                  "center",

                gap:
                  `${Math.max(
                    3,
                    addressTokens.labelGap - 1,
                  )}px`,

              }}
            >

              <Map
                size={
                  addressTokens.previewLabelSize + 4
                }

                strokeWidth={
                  1.8
                }

                aria-hidden="true"
              />

              State

            </div>


            <div
              style={{
                ...previewValueStyle,

                fontSize:
                  `${addressTokens.previewValueSize}px`,

              }}
            >
              {safeText(
                value.state,
              )}
            </div>

          </div>


          <div
            style={
              previewMetaItemStyle
            }
          >

            <div
              style={{
                ...previewLabelStyle,

                display:
                  "flex",

                alignItems:
                  "center",

                gap:
                  `${Math.max(
                    3,
                    addressTokens.labelGap - 1,
                  )}px`,

              }}
            >

              <Hash
                size={
                  addressTokens.previewLabelSize + 4
                }

                strokeWidth={
                  1.8
                }

                aria-hidden="true"
              />

              PIN

            </div>


            <div
              style={{
                ...previewValueStyle,

                fontSize:
                  `${addressTokens.previewValueSize}px`,

              }}
            >
              {safeText(
                value.pinCode,
              )}
            </div>

          </div>

        </div>

      </div>

    </section>

  );

}


/* ===========================================================
   END
=========================================================== */
