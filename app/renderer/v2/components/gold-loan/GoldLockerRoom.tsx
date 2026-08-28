/* ===========================================================
   FINORA ENTERPRISE OS™

   GOLD LOAN ENGINE™

   GOLD LOCKER ROOM

   MODULE  : Gold Loan
   LAYER   : Presentation Component
   VERSION : 1.0
   STATUS  : Production Foundation

   RESPONSIBILITY:

   - Display Gold Locker Room hierarchy
   - Provide custom Room selector
   - Display Locker occupancy
   - Allow selection of any available Locker
   - Disable allocation for FULL / unavailable Lockers
   - Keep Locker VIEW always available
   - Open every Rack for Locker inspection
   - Display selected / inspected Locker racks
   - Forward Rack selection to Gold Loan form
   - Preserve four-device responsive behaviour
   - Preserve FINORA theme inheritance

   IMPORTANT:

   - No persistence.
   - No storage mutation.
   - No business calculations.
   - No direct window access.
   - No native select element.
   - No ad-hoc JSX style objects.
   - VIEW is independent from allocation availability.

=========================================================== */

/* ===========================================================
   IMPORTS
=========================================================== */

import {
  Archive,
  Building2,
  Check,
  ChevronDown,
  Eye,
  Layers3,
  LockKeyhole,
  PackageOpen,
} from "lucide-react";

import { useEffect, useMemo, useState } from "react";

import type { MouseEvent } from "react";

import type {
  GoldLockerId,
  GoldLockerRoomView,
  GoldLockerView,
  GoldRackId,
  GoldRackView,
  GoldRoomId,
} from "../../types/gold-loan/goldStorage.types";

import {
  getGoldLoanModuleTokens,
  useGoldLoanResponsive,
} from "../../utils/responsive/goldloan/goldLoan.index";

import GoldRacks from "./GoldRacks";

import {
  getGoldLockerAllocationButtonStyle,
  getGoldLockerAvailabilityTextStyle,
  getGoldLockerCardCursorStyle,
  getGoldLockerCardStateStyle,
  getGoldLockerProgressFillStyle,
  getGoldLockerRoomStyles,
  getGoldLockerStatusBadgeStyle,
  getGoldRoomOptionStateStyle,
} from "./GoldLockerRoom.styles";

/* ===========================================================
   PROPS
=========================================================== */

export interface GoldLockerRoomProps {
  rooms: GoldLockerRoomView[];

  selectedRoomId: GoldRoomId | null;

  selectedLockerId: GoldLockerId | null;

  selectedRackId: GoldRackId | null;

  onSelectRoom: (room: GoldLockerRoomView) => void;

  onSelectLocker: (locker: GoldLockerView) => void;

  onViewLocker: (locker: GoldLockerView) => void;

  onSelectRack: (rack: GoldRackView) => void;

  onViewRack: (rack: GoldRackView) => void;
}

/* ===========================================================
   ROOM DISPLAY NAME
=========================================================== */

function getRoomDisplayName(room: GoldLockerRoomView): string {
  const configuredName = String(room.configuration.roomName ?? "").trim();

  if (configuredName.length > 0) {
    return configuredName;
  }

  return `Locker Room ${room.configuration.roomNumber}`;
}

/* ===========================================================
   ROOM CODE
=========================================================== */

function getRoomCode(room: GoldLockerRoomView): string {
  return `ROOM-${String(room.configuration.roomNumber).padStart(2, "0")}`;
}

/* ===========================================================
   ROOM META
=========================================================== */

function getRoomMeta(room: GoldLockerRoomView): string {
  const lockerLabel = room.occupancy.totalLockers === 1 ? "Locker" : "Lockers";

  return `${room.occupancy.totalLockers} ${lockerLabel} • ${room.occupancy.available} bags available`;
}

/* ===========================================================
   LOCKER DISPLAY NAME
=========================================================== */

function getLockerDisplayName(locker: GoldLockerView): string {
  const configuredName = String(locker.configuration.lockerName ?? "").trim();

  if (configuredName.length > 0) {
    return configuredName;
  }

  return `Locker ${locker.configuration.lockerNumber}`;
}

/* ===========================================================
   LOCKER CODE
=========================================================== */

function getLockerCode(locker: GoldLockerView): string {
  return `LOCKER-${String(locker.configuration.lockerNumber).padStart(2, "0")}`;
}

/* ===========================================================
   LOCKER ALLOCATION AVAILABILITY
=========================================================== */

function canAllocateLocker(locker: GoldLockerView): boolean {
  return (
    locker.configuration.status === "ACTIVE" &&
    locker.occupancy.canAllocate &&
    !locker.occupancy.isFull
  );
}

/* ===========================================================
   LOCKER VISUAL STATUS

   A non-active Locker is visually blocked even if the
   occupancy record itself still contains available capacity.
=========================================================== */

function getLockerVisualStatus(locker: GoldLockerView) {
  if (locker.configuration.status !== "ACTIVE") {
    return "FULL" as const;
  }

  return locker.occupancy.occupancyStatus;
}

/* ===========================================================
   LOCKER STATUS LABEL
=========================================================== */

function getLockerStatusLabel(locker: GoldLockerView): string {
  if (locker.configuration.status === "MAINTENANCE") {
    return "Maintenance";
  }

  if (locker.configuration.status === "INACTIVE") {
    return "Inactive";
  }

  switch (locker.occupancy.occupancyStatus) {
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
   LOCKER AVAILABILITY LABEL
=========================================================== */

function getLockerAvailabilityLabel(locker: GoldLockerView): string {
  if (locker.configuration.status === "MAINTENANCE") {
    return "Locker under maintenance • View remains available";
  }

  if (locker.configuration.status === "INACTIVE") {
    return "Locker inactive • View remains available";
  }

  if (locker.occupancy.isFull) {
    return `${locker.occupancy.occupied} bags already occupied`;
  }

  if (locker.occupancy.available === 1) {
    return "1 bag available only";
  }

  return `${locker.occupancy.available} bags available`;
}

/* ===========================================================
   FIND ROOM
=========================================================== */

function findRoom(
  rooms: GoldLockerRoomView[],

  roomId: GoldRoomId | null,
): GoldLockerRoomView | null {
  if (!roomId) {
    return rooms[0] ?? null;
  }

  return (
    rooms.find((room) => room.configuration.id === roomId) ?? rooms[0] ?? null
  );
}

/* ===========================================================
   FIND LOCKER
=========================================================== */

function findLocker(
  room: GoldLockerRoomView | null,

  lockerId: GoldLockerId | null,
): GoldLockerView | null {
  if (!room || !lockerId) {
    return null;
  }

  return (
    room.lockers.find((locker) => locker.configuration.id === lockerId) ?? null
  );
}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function GoldLockerRoom(props: GoldLockerRoomProps) {
  const {
    rooms,
    selectedRoomId,
    selectedLockerId,
    selectedRackId,
    onSelectRoom,
    onSelectLocker,
    onViewLocker,
    onSelectRack,
    onViewRack,
  } = props;

  /* =========================================================
     LOCAL PRESENTATION STATE
  ========================================================= */

  const [roomMenuOpen, setRoomMenuOpen] = useState(false);

  const [inspectionLockerId, setInspectionLockerId] =
    useState<GoldLockerId | null>(null);

  /* =========================================================
     RESPONSIVE
  ========================================================= */

  const responsive = useGoldLoanResponsive();

  const moduleTokens = getGoldLoanModuleTokens(responsive.device);

  const styles = getGoldLockerRoomStyles({
    moduleTokens,

    lockerRoom: responsive.layout.lockerRoom,

    lockerCard: responsive.layout.lockerCard,

    isMobile: responsive.isMobile,
  });

  /* =========================================================
     SELECTED ROOM
  ========================================================= */

  const selectedRoom = useMemo(
    () => findRoom(rooms, selectedRoomId),
    [rooms, selectedRoomId],
  );

  /* =========================================================
     SELECTED LOCKER
  ========================================================= */

  const selectedLocker = useMemo(
    () => findLocker(selectedRoom, selectedLockerId),
    [selectedLockerId, selectedRoom],
  );

  /* =========================================================
     INSPECTION LOCKER

     VIEW is allowed independently from allocation.
  ========================================================= */

  const inspectionLocker = useMemo(
    () => findLocker(selectedRoom, inspectionLockerId),
    [inspectionLockerId, selectedRoom],
  );

  /* =========================================================
     ACTIVE RACK SOURCE

     Priority:

     1. Locker opened through VIEW
     2. Selected Locker for allocation
  ========================================================= */

  const activeLocker = inspectionLocker ?? selectedLocker;

  /* =========================================================
     ROOM CHANGE CLEANUP
  ========================================================= */

  useEffect(() => {
    setInspectionLockerId(null);

    setRoomMenuOpen(false);
  }, [selectedRoomId]);

  /* =========================================================
     TOGGLE ROOM MENU
  ========================================================= */

  function handleToggleRoomMenu(): void {
    setRoomMenuOpen((current) => !current);
  }

  /* =========================================================
     SELECT ROOM

     All configured rooms remain inspectable.

     Allocation rules are enforced at Locker/Rack level.
  ========================================================= */

  function handleSelectRoom(room: GoldLockerRoomView): void {
    setRoomMenuOpen(false);

    setInspectionLockerId(null);

    onSelectRoom(room);
  }

  /* =========================================================
     SELECT LOCKER
  ========================================================= */

  function handleSelectLocker(locker: GoldLockerView): void {
    if (!canAllocateLocker(locker)) {
      return;
    }

    setInspectionLockerId(null);

    onSelectLocker(locker);
  }

  /* =========================================================
     LOCKER VIEW

     IMPORTANT:

     No allocation check exists here.

     FULL / INACTIVE / MAINTENANCE Locker can still be viewed.
  ========================================================= */

  function handleViewLocker(
    event: MouseEvent<HTMLButtonElement>,

    locker: GoldLockerView,
  ): void {
    event.stopPropagation();

    setInspectionLockerId(locker.configuration.id);

    onViewLocker(locker);
  }

  /* =========================================================
     LOCKER SELECT BUTTON
  ========================================================= */

  function handleLockerSelectButton(
    event: MouseEvent<HTMLButtonElement>,

    locker: GoldLockerView,
  ): void {
    event.stopPropagation();

    handleSelectLocker(locker);
  }

  /* =========================================================
     EMPTY ROOM STATE
  ========================================================= */

  if (rooms.length === 0) {
    return (
      <section style={styles.root}>
        <header style={styles.header}>
          <div style={styles.headingGroup}>
            <span style={styles.headingIcon}>
              <Building2 size={18} strokeWidth={1.9} />
            </span>

            <div style={styles.headingTextGroup}>
              <h2 style={styles.title}>Gold Locker Room</h2>

              <p style={styles.subtitle}>
                Physical gold custody and rack allocation.
              </p>
            </div>
          </div>
        </header>

        <div style={styles.emptyState}>
          <span style={styles.emptyIcon}>
            <PackageOpen size={20} strokeWidth={1.8} />
          </span>

          <h3 style={styles.emptyTitle}>No Locker Rooms Configured</h3>

          <p style={styles.emptyDescription}>
            Add locker rooms, lockers and rack capacities from Gold Storage
            Settings.
          </p>
        </div>
      </section>
    );
  }

  /* =========================================================
     ROOM RESOLUTION FALLBACK
  ========================================================= */

  if (!selectedRoom) {
    return null;
  }

  /* =========================================================
     ROOM NAME / META
  ========================================================= */

  const selectedRoomName = getRoomDisplayName(selectedRoom);

  const selectedRoomCode = getRoomCode(selectedRoom);

  /* =========================================================
     ACTIVE LOCKER RACK SELECTION

     If VIEW is showing another Locker, do not visually carry
     a Rack selection from the allocation Locker into it.
  ========================================================= */

  const activeRackSelection =
    activeLocker &&
    selectedLocker &&
    activeLocker.configuration.id === selectedLocker.configuration.id
      ? selectedRackId
      : null;

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
            <Building2 size={18} strokeWidth={1.9} />
          </span>

          <div style={styles.headingTextGroup}>
            <h2 style={styles.title}>Gold Locker Room</h2>

            <p style={styles.subtitle}>
              Choose a physical locker and rack for gold custody.
            </p>
          </div>
        </div>

        {/* ===================================================
            CUSTOM ROOM SELECTOR
        =================================================== */}

        <div style={styles.roomControlArea}>
          <span style={styles.controlLabel}>Locker Room</span>

          <div style={styles.roomSelector}>
            <button
              type="button"
              onClick={handleToggleRoomMenu}
              style={styles.roomSelectorButton}
              aria-haspopup="listbox"
              aria-expanded={roomMenuOpen}
            >
              <span style={styles.roomSelectorButtonContent}>
                <span style={styles.roomSelectorIcon}>
                  <Building2
                    size={moduleTokens.control.inputIconSize}
                    strokeWidth={1.9}
                  />
                </span>

                <span style={styles.roomSelectorTextGroup}>
                  <span style={styles.roomSelectorPrimary}>
                    {selectedRoomName}
                  </span>

                  <span style={styles.roomSelectorSecondary}>
                    {selectedRoomCode}
                  </span>
                </span>
              </span>

              <span style={styles.roomSelectorChevron}>
                <ChevronDown size={16} strokeWidth={1.9} />
              </span>
            </button>

            {roomMenuOpen ? (
              <div style={styles.roomMenu} role="listbox">
                {rooms.map((room) => {
                  const selected =
                    room.configuration.id === selectedRoom.configuration.id;

                  const roomOptionStateStyle = getGoldRoomOptionStateStyle({
                    selected,

                    disabled: false,
                  });

                  const roomOptionStyle = {
                    ...styles.roomOption,
                    ...roomOptionStateStyle,
                  };

                  return (
                    <button
                      key={room.configuration.id}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onClick={() => {
                        handleSelectRoom(room);
                      }}
                      style={roomOptionStyle}
                    >
                      <span style={styles.roomOptionIdentity}>
                        <span style={styles.roomOptionIcon}>
                          <Building2 size={15} strokeWidth={1.9} />
                        </span>

                        <span style={styles.roomOptionTextGroup}>
                          <span style={styles.roomOptionName}>
                            {getRoomDisplayName(room)}
                          </span>

                          <span style={styles.roomOptionMeta}>
                            {getRoomMeta(room)}
                          </span>
                        </span>
                      </span>

                      {selected ? (
                        <span style={styles.roomOptionCheck}>
                          <Check size={16} strokeWidth={2} />
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>
      </header>

      {/* =====================================================
          ROOM OVERVIEW
      ===================================================== */}

      <div style={styles.overview}>
        <article style={styles.overviewMetric}>
          <span style={styles.overviewMetricLabel}>Lockers</span>

          <strong style={styles.overviewMetricValue}>
            {selectedRoom.occupancy.totalLockers}
          </strong>

          <span style={styles.overviewMetricSubtext}>Physical lockers</span>
        </article>

        <article style={styles.overviewMetric}>
          <span style={styles.overviewMetricLabel}>Racks</span>

          <strong style={styles.overviewMetricValue}>
            {selectedRoom.occupancy.totalRacks}
          </strong>

          <span style={styles.overviewMetricSubtext}>Configured racks</span>
        </article>

        <article style={styles.overviewMetric}>
          <span style={styles.overviewMetricLabel}>Occupied</span>

          <strong style={styles.overviewMetricValue}>
            {selectedRoom.occupancy.occupied}
          </strong>

          <span style={styles.overviewMetricSubtext}>Gold bags stored</span>
        </article>

        <article style={styles.overviewMetric}>
          <span style={styles.overviewMetricLabel}>Available</span>

          <strong style={styles.overviewMetricValue}>
            {selectedRoom.occupancy.available}
          </strong>

          <span style={styles.overviewMetricSubtext}>Bag capacity free</span>
        </article>
      </div>

      {/* =====================================================
          LOCKERS
      ===================================================== */}

      <div style={styles.lockerSection}>
        <header style={styles.lockerSectionHeader}>
          <div style={styles.lockerSectionTitleGroup}>
            <h3 style={styles.lockerSectionTitle}>Lockers</h3>

            <p style={styles.lockerSectionSubtitle}>
              Full lockers cannot receive new bags but can always be viewed.
            </p>
          </div>

          <span style={styles.lockerCountBadge}>
            {selectedRoom.lockers.length}{" "}
            {selectedRoom.lockers.length === 1 ? "Locker" : "Lockers"}
          </span>
        </header>

        {selectedRoom.lockers.length === 0 ? (
          <div style={styles.emptyState}>
            <span style={styles.emptyIcon}>
              <Archive size={20} strokeWidth={1.8} />
            </span>

            <h3 style={styles.emptyTitle}>No Lockers Configured</h3>

            <p style={styles.emptyDescription}>
              This locker room does not currently contain any configured
              lockers.
            </p>
          </div>
        ) : (
          <div style={styles.lockerGrid}>
            {selectedRoom.lockers.map((locker) => {
              const selected = selectedLockerId === locker.configuration.id;

              const inspected = inspectionLockerId === locker.configuration.id;

              const canAllocate = canAllocateLocker(locker);

              const visualStatus = getLockerVisualStatus(locker);

              const cardStateStyle = getGoldLockerCardStateStyle({
                occupancyStatus: visualStatus,

                selected: selected || inspected,

                canAllocate,
              });

              const cursorStyle = getGoldLockerCardCursorStyle(canAllocate);

              const cardStyle = {
                ...styles.lockerCard,
                ...cardStateStyle,
                ...cursorStyle,
              };

              const statusStyle = {
                ...styles.lockerStatusBadge,
                ...getGoldLockerStatusBadgeStyle(visualStatus),
              };

              const availabilityStyle = {
                ...styles.availabilityText,
                ...getGoldLockerAvailabilityTextStyle(visualStatus),
              };

              const progressFillStyle = getGoldLockerProgressFillStyle({
                occupancyStatus: visualStatus,

                occupancyPercentage: locker.occupancy.occupancyPercentage,
              });

              const allocationButtonStyle = {
                ...styles.selectLockerButton,
                ...getGoldLockerAllocationButtonStyle({
                  selected,

                  canAllocate,
                }),
              };

              const lockerName = getLockerDisplayName(locker);

              return (
                <article
                  key={locker.configuration.id}
                  style={cardStyle}
                  onClick={() => {
                    handleSelectLocker(locker);
                  }}
                >
                  {/* ======================================
                        LOCKER HEADER
                    ====================================== */}

                  <div style={styles.lockerHeader}>
                    <div style={styles.lockerIdentity}>
                      <span style={styles.lockerIcon}>
                        {canAllocate ? (
                          <Archive
                            size={moduleTokens.locker.iconSize}
                            strokeWidth={1.9}
                          />
                        ) : (
                          <LockKeyhole
                            size={moduleTokens.locker.iconSize}
                            strokeWidth={1.9}
                          />
                        )}
                      </span>

                      <div style={styles.lockerTitleGroup}>
                        <h4 style={styles.lockerTitle}>{lockerName}</h4>

                        <span style={styles.lockerCode}>
                          {getLockerCode(locker)}
                        </span>
                      </div>
                    </div>

                    {/* ====================================
                          VIEW — ALWAYS ENABLED
                      ==================================== */}

                    <div style={styles.lockerHeaderActions}>
                      <button
                        type="button"
                        onClick={(event) => {
                          handleViewLocker(event, locker);
                        }}
                        style={styles.lockerViewButton}
                        aria-label={`View ${lockerName} racks`}
                      >
                        <Eye
                          size={moduleTokens.control.buttonIconSize}
                          strokeWidth={1.9}
                        />
                        View
                      </button>
                    </div>
                  </div>

                  {/* ======================================
                        STATUS
                    ====================================== */}

                  <span style={statusStyle}>
                    {getLockerStatusLabel(locker)}
                  </span>

                  {/* ======================================
                        OCCUPANCY
                    ====================================== */}

                  <div style={styles.occupancyBlock}>
                    <div style={styles.occupancyRow}>
                      <span style={styles.occupancyLabel}>Occupancy</span>

                      <strong style={styles.occupancyValue}>
                        {locker.occupancy.occupied}
                        {" / "}
                        {locker.occupancy.totalCapacity}
                      </strong>
                    </div>

                    <div style={styles.progressTrack}>
                      <div style={progressFillStyle} />
                    </div>

                    <span style={availabilityStyle}>
                      {getLockerAvailabilityLabel(locker)}
                    </span>
                  </div>

                  {/* ======================================
                        LOCKER METRICS
                    ====================================== */}

                  <div style={styles.lockerMetrics}>
                    <div style={styles.lockerMetric}>
                      <span style={styles.lockerMetricLabel}>Racks</span>

                      <strong style={styles.lockerMetricValue}>
                        {locker.occupancy.totalRacks}
                      </strong>
                    </div>

                    <div style={styles.lockerMetric}>
                      <span style={styles.lockerMetricLabel}>Full</span>

                      <strong style={styles.lockerMetricValue}>
                        {locker.occupancy.fullRackCount}
                      </strong>
                    </div>

                    <div style={styles.lockerMetric}>
                      <span style={styles.lockerMetricLabel}>Free</span>

                      <strong style={styles.lockerMetricValue}>
                        {locker.occupancy.available}
                      </strong>
                    </div>
                  </div>

                  {/* ======================================
                        FOOTER
                    ====================================== */}

                  <div style={styles.lockerFooter}>
                    {selected ? (
                      <span style={styles.selectedIndicator}>
                        <Check size={15} strokeWidth={2} />
                        Selected
                      </span>
                    ) : inspected ? (
                      <span style={styles.selectedIndicator}>
                        <Eye size={15} strokeWidth={1.9} />
                        Viewing
                      </span>
                    ) : (
                      <span />
                    )}

                    <button
                      type="button"
                      disabled={!canAllocate}
                      onClick={(event) => {
                        handleLockerSelectButton(event, locker);
                      }}
                      style={allocationButtonStyle}
                    >
                      {selected ? (
                        <>
                          <Check
                            size={moduleTokens.control.buttonIconSize}
                            strokeWidth={2}
                          />
                          Selected
                        </>
                      ) : canAllocate ? (
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
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* =====================================================
          ACTIVE LOCKER RACKS

          Selected Locker:
          allocation mode.

          VIEW Locker:
          inspection mode.

          FULL Locker can reach this section via VIEW.
      ===================================================== */}

      {activeLocker ? (
        <GoldRacks
          racks={activeLocker.racks}
          selectedRackId={activeRackSelection}
          onSelectRack={onSelectRack}
          onViewRack={onViewRack}
        />
      ) : null}
    </section>
  );
}

/* ===========================================================
   END
=========================================================== */
