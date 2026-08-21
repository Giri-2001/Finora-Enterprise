/* ===========================================================
   FINORA ENTERPRISE OS™

   IDENTITY PREVIEW CARD™

   LIVE CUSTOMER IDENTITY PREVIEW
=========================================================== */

/* ===========================================================
   IMPORTS
=========================================================== */

import {
  useResponsive,
} from "../../../utils/responsive";

import {
  useTheme,
} from "../../../themes/provider";

import {
  createIdentityPreviewCardStyles,
} from "./IdentityPreviewCard.styles";

/* ===========================================================
   TYPES
=========================================================== */

export interface IdentityPreviewCardProps {

  customerName:
    string;

  customerId:
    string;

  businessName:
    string;

  branchName:
    string;

  imageUrl:
    string;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function IdentityPreviewCard({

  customerName,

  customerId,

  businessName,

  branchName,

  imageUrl,

}: IdentityPreviewCardProps) {

  const {
    tokens,
  } =
    useResponsive();

  const {
    theme,
  } =
    useTheme();

  const styles =
    createIdentityPreviewCardStyles(
      tokens,
      theme,
    );

  const displayName =
    customerName.trim() ||
    "Customer Name";

  const displayBusiness =
    businessName.trim() ||
    "Sri Giri Finance";

  const displayBranch =
    branchName.trim() ||
    "Hyderabad";

  const displayCustomerId =
    customerId.trim() ||
    "FIN-CUS-SGF-HYD-900001";

  return (

    <section
      style={
        styles.cardStyle
      }
      data-finora-identity-preview="true"
    >

      <div
        style={
          styles.headerStyle
        }
      >
        FINORA ENTERPRISE
      </div>


      <div
        style={
          styles.photoStyle
        }
      >

        {imageUrl ? (

          <img
            src={
              imageUrl
            }
            alt="Customer"
            style={
              styles.imageStyle
            }
          />

        ) : (

          <span
            style={
              styles.photoTextStyle
            }
          >
            PHOTO
          </span>

        )}

      </div>


      <h2
        style={
          styles.nameStyle
        }
        title={
          displayName
        }
      >
        {displayName}
      </h2>


      <div
        style={
          styles.idStyle
        }
        title={
          displayCustomerId
        }
      >
        {displayCustomerId}
      </div>


      <div
        style={
          styles.infoGroupStyle
        }
      >

        <div>

          <p
            style={
              styles.infoLabelStyle
            }
          >
            BUSINESS
          </p>

          <p
            style={
              styles.infoValueStyle
            }
            title={
              displayBusiness
            }
          >
            {displayBusiness}
          </p>

        </div>


        <div>

          <p
            style={
              styles.infoLabelStyle
            }
          >
            BRANCH
          </p>

          <p
            style={
              styles.infoValueStyle
            }
            title={
              displayBranch
            }
          >
            {displayBranch}
          </p>

        </div>

      </div>


      <div
        style={
          styles.verificationStyle
        }
      >

        <p
          style={
            styles.verificationTitleStyle
          }
        >
          QR Verification
        </p>

        <p
          style={
            styles.verificationTextStyle
          }
        >
          QR Code will be generated automatically after customer registration.
        </p>

      </div>


      <div
        style={
          styles.statusStyle
        }
      >

        <span
          style={
            styles.statusTextStyle
          }
        >
          • New Customer
        </span>

      </div>


      <div
        style={
          styles.footerStyle
        }
      >
        Live FINORA Customer Identity Preview
      </div>

    </section>

  );

}

/* ===========================================================
   END
=========================================================== */