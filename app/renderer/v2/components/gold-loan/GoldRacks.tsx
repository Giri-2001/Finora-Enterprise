/* ===========================================================
   FINORA ENTERPRISE OS™

   GOLD LOAN ENGINE™

   GOLD RACKS

   MODULE  : Gold Loan
   LAYER   : Presentation Component
   VERSION : 1.0
   STATUS  : Production Foundation

   RESPONSIBILITY:

   - Display all Racks for the selected Locker
   - Display Rack capacity / occupancy
   - Display Rack availability
   - Allow selection of any available Rack
   - Disable allocation for FULL Racks
   - Keep VIEW available for every Rack
   - Forward Rack inspection to parent
   - Preserve responsive Rack grid
   - Preserve FINORA theme inheritance

   IMPORTANT:

   - No persistence.
   - No storage mutation.
   - No business calculations.
   - No direct window access.
   - No inline style objects.
   - No theme hardcoding.
   - VIEW must remain enabled even when Rack is FULL.

=========================================================== */

/* ===========================================================
   IMPORTS
=========================================================== */

import { Check, Eye, Layers3, LockKeyhole, PackageOpen } from "lucide-react";

import type { MouseEvent } from "react";

import type {
  GoldRackId,
  GoldRackView,
} from "../../types/gold-loan/goldStorage.types";

import {
  getGoldLoanModuleTokens,
  useGoldLoanResponsive,
} from "../../utils/responsive/goldloan/goldLoan.index";

import {
  getGoldRackAllocationButtonStyle,
  getGoldRackAvailableTextStyle,
  getGoldRackCardCursorStyle,
  getGoldRackCardStateStyle,
  getGoldRackProgressFillStyle,
  getGoldRackStatusBadgeStyle,
  getGoldRacksStyles,
} from "./GoldRacks.styles";

/* ===========================================================
   PROPS
=========================================================== */

export interface GoldRacksProps {
  racks: GoldRackView[];

  selectedRackId: GoldRackId | null;

  onSelectRack: (rack: GoldRackView) => void;

  onViewRack: (rack: GoldRackView) => void;
}

/* ===========================================================
   STATUS LABEL
=========================================================== */

function getRackStatusLabel(rack: GoldRackView): string {
  switch (rack.occupancy.occupancyStatus) {
    case "FULL":
      return "Full";

    case "HIGH":
      return "Almost Full";

    case "PARTIAL":
      return "Available";

    case "AVAILABLE":
      return "Available";

    case "EMPTY":
    default:
      return "Empty";
  }
}

/* ===========================================================
   AVAILABILITY LABEL
=========================================================== */

function getRackAvailabilityLabel(rack: GoldRackView): string {
  if (rack.occupancy.isFull) {
    return `${rack.occupancy.occupied} bags already occupied`;
  }

  if (rack.occupancy.available === 1) {
    return "1 bag available only";
  }

  return `${rack.occupancy.available} bags available`;
}

/* ===========================================================
   RACK CODE
=========================================================== */

function getRackCode(rack: GoldRackView): string {
  const rackNumber = String(rack.configuration.rackNumber).padStart(2, "0");

  return `RACK-${rackNumber}`;
}

/* ===========================================================
   RACK DISPLAY NAME
=========================================================== */

function getRackDisplayName(rack: GoldRackView): string {
  const configuredName = String(rack.configuration.rackName ?? "").trim();

  if (configuredName.length > 0) {
    return configuredName;
  }

  return `Rack ${rack.configuration.rackNumber}`;
}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function GoldRacks(props: GoldRacksProps) {
  const { racks, selectedRackId, onSelectRack, onViewRack } = props;

  /* =========================================================
     RESPONSIVE
  ========================================================= */

  const responsive = useGoldLoanResponsive();

  const moduleTokens = getGoldLoanModuleTokens(responsive.device);

  const styles = getGoldRacksStyles({
    moduleTokens,

    rackGrid: responsive.layout.rackGrid,

    rackCard: responsive.layout.rackCard,

    isMobile: responsive.isMobile,
  });

  /* =========================================================
     SELECT RACK

     FULL Rack:
     - Selection blocked
     - VIEW remains independent
  ========================================================= */

  function handleSelectRack(rack: GoldRackView): void {
    if (!rack.occupancy.canAllocate) {
      return;
    }

    onSelectRack(rack);
  }

  /* =========================================================
     VIEW RACK

     This path intentionally has no canAllocate check.
  ========================================================= */

  function handleViewRack(
    event: MouseEvent<HTMLButtonElement>,

    rack: GoldRackView,
  ): void {
    event.stopPropagation();

    onViewRack(rack);
  }

  /* =========================================================
     ALLOCATION BUTTON
  ========================================================= */

  function handleAllocationButton(
    event: MouseEvent<HTMLButtonElement>,

    rack: GoldRackView,
  ): void {
    event.stopPropagation();

    handleSelectRack(rack);
  }

  /* =========================================================
     EMPTY STATE
  ========================================================= */

  if (racks.length === 0) {
    return (
      <section style={styles.root}>
        <header style={styles.header}>
          <div style={styles.headingGroup}>
            <span style={styles.headingIcon}>
              <Layers3 size={moduleTokens.rack.iconSize} strokeWidth={1.9} />
            </span>

            <div style={styles.headingTextGroup}>
              <h3 style={styles.title}>Gold Racks</h3>

              <p style={styles.subtitle}>
                Select a locker to view its storage racks.
              </p>
            </div>
          </div>
        </header>

        <div style={styles.emptyState}>
          <span style={styles.emptyIcon}>
            <PackageOpen size={20} strokeWidth={1.8} />
          </span>

          <h4 style={styles.emptyTitle}>No Racks Available</h4>

          <p style={styles.emptyDescription}>
            This locker does not currently contain any configured racks.
          </p>
        </div>
      </section>
    );
  }

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <section style={styles.root}>
      {/* =====================================================
          HEADER
      ===================================================== */}

      <header style={styles.header}>
        <div style={styles.headingGroup}>
          <span style={styles.headingIcon}>
            <Layers3 size={moduleTokens.rack.iconSize} strokeWidth={1.9} />
          </span>

          <div style={styles.headingTextGroup}>
            <h3 style={styles.title}>Gold Racks</h3>

            <p style={styles.subtitle}>
              Choose any available rack. Full racks remain available for
              inspection.
            </p>
          </div>
        </div>

        <span style={styles.rackCountBadge}>
          {racks.length} {racks.length === 1 ? "Rack" : "Racks"}
        </span>
      </header>

      {/* =====================================================
          RACK GRID
      ===================================================== */}

      <div style={styles.grid}>
        {racks.map((rack) => {
          const selected = selectedRackId === rack.configuration.id;

          const statusLabel = getRackStatusLabel(rack);

          const availabilityLabel = getRackAvailabilityLabel(rack);

          const rackCode = getRackCode(rack);

          const rackName = getRackDisplayName(rack);

          const cardStateStyle = getGoldRackCardStateStyle({
            occupancyStatus: rack.occupancy.occupancyStatus,

            selected,

            canAllocate: rack.occupancy.canAllocate,
          });

          const cardCursorStyle = getGoldRackCardCursorStyle(
            rack.occupancy.canAllocate,
          );

          const statusBadgeStyle = getGoldRackStatusBadgeStyle(
            rack.occupancy.occupancyStatus,
          );

          const availableTextStyle = getGoldRackAvailableTextStyle(
            rack.occupancy.occupancyStatus,
          );

          const progressFillStyle = getGoldRackProgressFillStyle({
            occupancyStatus: rack.occupancy.occupancyStatus,

            occupancyPercentage: rack.occupancy.occupancyPercentage,
          });

          const allocationButtonStateStyle = getGoldRackAllocationButtonStyle({
            selected,

            canAllocate: rack.occupancy.canAllocate,
          });

          const rackCardStyle = {
            ...styles.rackCard,
            ...cardStateStyle,
            ...cardCursorStyle,
          };

          const rackStatusStyle = {
            ...styles.statusBadge,
            ...statusBadgeStyle,
          };

          const rackAvailableStyle = {
            ...styles.availableText,
            ...availableTextStyle,
          };

          const rackAllocationStyle = {
            ...styles.allocateButton,
            ...allocationButtonStateStyle,
          };

          return (
            <article
              key={rack.configuration.id}
              style={rackCardStyle}
              onClick={() => {
                handleSelectRack(rack);
              }}
            >
              {/* ==========================================
                    RACK HEADER
                ========================================== */}

              <div style={styles.rackHeader}>
                <div style={styles.rackIdentity}>
                  <span style={styles.rackIcon}>
                    {rack.occupancy.isFull ? (
                      <LockKeyhole
                        size={moduleTokens.rack.iconSize}
                        strokeWidth={1.9}
                      />
                    ) : (
                      <Layers3
                        size={moduleTokens.rack.iconSize}
                        strokeWidth={1.9}
                      />
                    )}
                  </span>

                  <div style={styles.rackTitleGroup}>
                    <h4 style={styles.rackTitle}>{rackName}</h4>

                    <span style={styles.rackCode}>{rackCode}</span>
                  </div>
                </div>

                <span style={rackStatusStyle}>{statusLabel}</span>
              </div>

              {/* ==========================================
                    OCCUPANCY
                ========================================== */}

              <div style={styles.occupancyBlock}>
                <div style={styles.occupancyRow}>
                  <span style={styles.occupancyLabel}>Occupancy</span>

                  <strong style={styles.occupancyValue}>
                    {rack.occupancy.occupied}
                    {" / "}
                    {rack.occupancy.capacity}
                  </strong>
                </div>

                <div style={styles.progressTrack}>
                  <div style={progressFillStyle} />
                </div>

                <span style={rackAvailableStyle}>{availabilityLabel}</span>
              </div>

              {/* ==========================================
                    CAPACITY META
                ========================================== */}

              <div style={styles.capacityMeta}>
                <div style={styles.capacityMetaItem}>
                  <span style={styles.capacityMetaLabel}>Occupied</span>

                  <strong style={styles.capacityMetaValue}>
                    {rack.occupancy.occupied}
                  </strong>
                </div>

                <div style={styles.capacityMetaItem}>
                  <span style={styles.capacityMetaLabel}>Available</span>

                  <strong style={styles.capacityMetaValue}>
                    {rack.occupancy.available}
                  </strong>
                </div>
              </div>

              {/* ==========================================
                    ACTIONS

                    IMPORTANT:

                    FULL:
                    Allocate disabled.
                    VIEW enabled.
                ========================================== */}

              <div style={styles.actions}>
                <button
                  type="button"
                  disabled={!rack.occupancy.canAllocate}
                  onClick={(event) => {
                    handleAllocationButton(event, rack);
                  }}
                  style={rackAllocationStyle}
                >
                  {selected ? (
                    <>
                      <Check
                        size={moduleTokens.control.buttonIconSize}
                        strokeWidth={2}
                      />
                      Selected
                    </>
                  ) : rack.occupancy.canAllocate ? (
                    <>
                      <Layers3
                        size={moduleTokens.control.buttonIconSize}
                        strokeWidth={1.9}
                      />
                      Select
                    </>
                  ) : (
                    <>
                      <LockKeyhole
                        size={moduleTokens.control.buttonIconSize}
                        strokeWidth={1.9}
                      />
                      Full
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={(event) => {
                    handleViewRack(event, rack);
                  }}
                  style={styles.viewButton}
                  aria-label={`View ${rackName} bags`}
                >
                  <Eye
                    size={moduleTokens.control.buttonIconSize}
                    strokeWidth={1.9}
                  />
                  View
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

/* ===========================================================
   END
=========================================================== */
