/* ===========================================================
   FINORA ENTERPRISE OS™

   GOLD LOAN ENGINE™

   GOLD STORAGE SERVICE

   MODULE  : Gold Loan
   LAYER   : Domain Service
   VERSION : 1.0
   STATUS  : Production Foundation

   RESPONSIBILITY:

   - Build physical Gold Storage digital twin
   - Derive Rack occupancy from ACTIVE allocations
   - Derive Locker occupancy from Rack occupancy
   - Derive Room occupancy from Locker occupancy
   - Validate Room → Locker → Rack hierarchy
   - Re-check Rack capacity before allocation
   - Allocate next available Bag / Packet number
   - Respect manually requested Bag number
   - Prevent duplicate active custody per Gold Loan
   - Prevent duplicate active Bag occupancy
   - Preserve RELEASED allocation history
   - Preserve RELOCATED allocation history
   - Create relocation audit trail
   - Restore available capacity automatically after release
   - Search current / historical custody records
   - Suggest available Rack without forcing allocation

   CRITICAL RULE:

   occupiedCount MUST NEVER be trusted from a manual counter.

   Authoritative occupancy source:

   allocation.status === "OCCUPIED"

   Therefore:

   RELEASED
      → no longer consumes capacity

   RELOCATED
      → old location no longer consumes capacity

   OCCUPIED
      → consumes exactly one Bag position

   IMPORTANT:

   - No React.
   - No UI.
   - No localStorage.
   - No StorageManager.
   - No repository access.
   - No server access.
   - No hardcoded Room / Locker / Rack counts.
   - No hardcoded Rack capacity.
   - Settings remain authoritative for physical geometry.
   - Owner can select ANY available Rack.
   - Rack suggestion is advisory only.

=========================================================== */

/* ===========================================================
   IMPORTS
=========================================================== */

import type {
  GoldBagId,
  GoldCustodyAllocation,
  GoldCustodyAllocationId,
  GoldLockerConfiguration,
  GoldLockerId,
  GoldLockerOccupancy,
  GoldLockerRoomView,
  GoldLockerView,
  GoldOccupancyStatus,
  GoldRackConfiguration,
  GoldRackId,
  GoldRackOccupancy,
  GoldRackView,
  GoldRoomConfiguration,
  GoldRoomId,
  GoldRoomOccupancy,
  GoldStorageAllocationRequest,
  GoldStorageAllocationResult,
  GoldStorageBag,
  GoldStorageLocation,
  GoldStorageLocationCode,
  GoldStorageRelocationAudit,
  GoldStorageRelocationRequest,
  GoldStorageReleaseRequest,
  GoldStorageSearchResult,
  GoldStorageSettings,
} from "../../types/gold-loan/goldStorage.types";

/* ===========================================================
   SERVICE STATE

   Persistence layer can later store these three authoritative
   structures.

   Views and occupancy are always derived.
=========================================================== */

export interface GoldStorageState {
  settings: GoldStorageSettings;

  allocations: GoldCustodyAllocation[];

  relocationAudits: GoldStorageRelocationAudit[];
}

/* ===========================================================
   STORAGE SNAPSHOT
=========================================================== */

export interface GoldStorageSnapshot {
  state: GoldStorageState;

  rooms: GoldLockerRoomView[];
}

/* ===========================================================
   ALLOCATION MUTATION RESULT
=========================================================== */

export interface GoldStorageAllocationMutationResult extends GoldStorageAllocationResult {
  state: GoldStorageState;

  rooms: GoldLockerRoomView[];
}

/* ===========================================================
   RELEASE RESULT
=========================================================== */

export interface GoldStorageReleaseResult {
  success: boolean;

  state: GoldStorageState;

  rooms: GoldLockerRoomView[];

  allocation?: GoldCustodyAllocation;

  error?: string;
}

/* ===========================================================
   RELOCATION RESULT
=========================================================== */

export interface GoldStorageRelocationResult {
  success: boolean;

  state: GoldStorageState;

  rooms: GoldLockerRoomView[];

  previousAllocation?: GoldCustodyAllocation;

  activeAllocation?: GoldCustodyAllocation;

  audit?: GoldStorageRelocationAudit;

  error?: string;
}

/* ===========================================================
   RACK SUGGESTION
=========================================================== */

export interface GoldStorageRackSuggestion {
  roomId: GoldRoomId;

  lockerId: GoldLockerId;

  rackId: GoldRackId;

  available: number;

  capacity: number;
}

/* ===========================================================
   HIERARCHY RESULT
=========================================================== */

interface GoldStorageHierarchyResult {
  room: GoldRoomConfiguration;

  locker: GoldLockerConfiguration;

  rack: GoldRackConfiguration;
}

/* ===========================================================
   ID GENERATOR
=========================================================== */

function createGoldStorageId(prefix: string): string {
  const randomPart = Math.random().toString(36).slice(2, 10);

  return `${prefix}-${Date.now()}-${randomPart}`;
}

/* ===========================================================
   BAG ID
=========================================================== */

function createGoldBagId(): GoldBagId {
  return createGoldStorageId("gold-bag");
}

/* ===========================================================
   ALLOCATION ID
=========================================================== */

function createGoldAllocationId(): GoldCustodyAllocationId {
  return createGoldStorageId("gold-allocation");
}

/* ===========================================================
   AUDIT ID
=========================================================== */

function createGoldRelocationAuditId(): string {
  return createGoldStorageId("gold-relocation");
}

/* ===========================================================
   SAFE CAPACITY
=========================================================== */

function getSafeCapacity(capacity: number): number {
  if (!Number.isFinite(capacity)) {
    return 0;
  }

  return Math.max(0, Math.trunc(capacity));
}

/* ===========================================================
   SAFE PERCENTAGE
=========================================================== */

function getOccupancyPercentage(
  occupied: number,

  capacity: number,
): number {
  const safeCapacity = getSafeCapacity(capacity);

  if (safeCapacity <= 0) {
    return 0;
  }

  const percentage = (occupied / safeCapacity) * 100;

  return Math.max(0, Math.min(100, Number(percentage.toFixed(2))));
}

/* ===========================================================
   OCCUPANCY STATUS

   EMPTY      = 0
   AVAILABLE  = > 0 and < 50%
   PARTIAL    = 50% to < 80%
   HIGH       = 80% to < 100%
   FULL       = 100% or greater
=========================================================== */

function resolveGoldOccupancyStatus(
  occupied: number,

  capacity: number,
): GoldOccupancyStatus {
  const safeCapacity = getSafeCapacity(capacity);

  if (occupied <= 0) {
    return "EMPTY";
  }

  if (safeCapacity <= 0 || occupied >= safeCapacity) {
    return "FULL";
  }

  const percentage = (occupied / safeCapacity) * 100;

  if (percentage >= 80) {
    return "HIGH";
  }

  if (percentage >= 50) {
    return "PARTIAL";
  }

  return "AVAILABLE";
}

/* ===========================================================
   ACTIVE ALLOCATION
=========================================================== */

function isActiveGoldAllocation(allocation: GoldCustodyAllocation): boolean {
  return allocation.status === "OCCUPIED";
}

/* ===========================================================
   ACTIVE ALLOCATIONS
=========================================================== */

export function getActiveGoldCustodyAllocations(
  allocations: GoldCustodyAllocation[],
): GoldCustodyAllocation[] {
  return allocations.filter(isActiveGoldAllocation);
}

/* ===========================================================
   RACK ACTIVE ALLOCATIONS
=========================================================== */

function getRackActiveAllocations(
  allocations: GoldCustodyAllocation[],

  rackId: GoldRackId,
): GoldCustodyAllocation[] {
  return allocations.filter(
    (allocation) =>
      isActiveGoldAllocation(allocation) &&
      allocation.location.rackId === rackId,
  );
}

/* ===========================================================
   BAG NUMBER NORMALIZER
=========================================================== */

function normalizeBagNumber(bagNumber: number): number {
  if (!Number.isFinite(bagNumber)) {
    return 0;
  }

  return Math.max(0, Math.trunc(bagNumber));
}

/* ===========================================================
   PAD NUMBER
=========================================================== */

function padGoldStorageNumber(
  value: number,

  width: number,
): string {
  return String(Math.max(0, Math.trunc(value))).padStart(width, "0");
}

/* ===========================================================
   DISPLAY NAME
=========================================================== */

function getStorageDisplayName(
  configuredName: string,

  fallback: string,
): string {
  const normalized = String(configuredName ?? "").trim();

  return normalized || fallback;
}

/* ===========================================================
   LOCATION CODE
=========================================================== */

export function createGoldStorageLocationCode(
  location: GoldStorageLocation,
): GoldStorageLocationCode {
  const roomCode = `R${padGoldStorageNumber(location.roomNumber, 2)}`;

  const lockerCode = `L${padGoldStorageNumber(location.lockerNumber, 2)}`;

  const rackCode = `RK${padGoldStorageNumber(location.rackNumber, 2)}`;

  const bagCode = `B${padGoldStorageNumber(location.bagNumber, 3)}`;

  return {
    roomCode,

    lockerCode,

    rackCode,

    bagCode,

    fullCode: `${roomCode}-${lockerCode}-${rackCode}-${bagCode}`,
  };
}

/* ===========================================================
   HIERARCHY RESOLUTION
=========================================================== */

function resolveGoldStorageHierarchy(
  settings: GoldStorageSettings,

  roomId: GoldRoomId,

  lockerId: GoldLockerId,

  rackId: GoldRackId,
): GoldStorageHierarchyResult | null {
  const room = settings.rooms.find((currentRoom) => currentRoom.id === roomId);

  if (!room) {
    return null;
  }

  const locker = settings.lockers.find(
    (currentLocker) =>
      currentLocker.id === lockerId && currentLocker.roomId === room.id,
  );

  if (!locker) {
    return null;
  }

  const rack = settings.racks.find(
    (currentRack) =>
      currentRack.id === rackId && currentRack.lockerId === locker.id,
  );

  if (!rack) {
    return null;
  }

  return {
    room,

    locker,

    rack,
  };
}

/* ===========================================================
   LOCATION CREATION
=========================================================== */

function createGoldStorageLocation(
  hierarchy: GoldStorageHierarchyResult,

  bagNumber: number,
): GoldStorageLocation {
  return {
    roomId: hierarchy.room.id,

    roomNumber: hierarchy.room.roomNumber,

    roomName: getStorageDisplayName(
      hierarchy.room.roomName,
      `Room ${hierarchy.room.roomNumber}`,
    ),

    lockerId: hierarchy.locker.id,

    lockerNumber: hierarchy.locker.lockerNumber,

    lockerName: getStorageDisplayName(
      hierarchy.locker.lockerName,
      `Locker ${hierarchy.locker.lockerNumber}`,
    ),

    rackId: hierarchy.rack.id,

    rackNumber: hierarchy.rack.rackNumber,

    rackName: getStorageDisplayName(
      hierarchy.rack.rackName,
      `Rack ${hierarchy.rack.rackNumber}`,
    ),

    bagId: createGoldBagId(),

    bagNumber,
  };
}

/* ===========================================================
   ALLOCATION → BAG VIEW
=========================================================== */

function createGoldStorageBagFromAllocation(
  allocation: GoldCustodyAllocation,
): GoldStorageBag {
  return {
    id: allocation.location.bagId,

    bagNumber: allocation.location.bagNumber,

    bagLabel: allocation.locationCode.bagCode,

    roomId: allocation.location.roomId,

    lockerId: allocation.location.lockerId,

    rackId: allocation.location.rackId,

    loanId: allocation.loanId,

    loanNumber: allocation.loanNumber,

    customerId: allocation.customerId,

    customerName: allocation.customerName,

    customerPhone: allocation.customerPhone,

    status: allocation.status,

    allocatedAt: allocation.allocatedAt,

    allocatedBy: allocation.allocatedBy,

    releasedAt: allocation.releasedAt,

    releasedBy: allocation.releasedBy,

    remarks: allocation.remarks,
  };
}

/* ===========================================================
   RACK OCCUPANCY

   Authoritative occupied count is derived from active
   allocations in this Rack.
=========================================================== */

export function createGoldRackOccupancy(
  configuration: GoldRackConfiguration,

  allocations: GoldCustodyAllocation[],
): GoldRackOccupancy {
  const capacity = getSafeCapacity(configuration.capacity);

  const activeAllocations = getRackActiveAllocations(
    allocations,
    configuration.id,
  );

  const occupied = activeAllocations.length;

  const physicalAvailable = Math.max(0, capacity - occupied);

  const canAllocate =
    configuration.status === "ACTIVE" && capacity > 0 && physicalAvailable > 0;

  const available = configuration.status === "ACTIVE" ? physicalAvailable : 0;

  const isFull = capacity <= 0 || occupied >= capacity;

  return {
    rackId: configuration.id,

    capacity,

    occupied,

    available,

    occupancyPercentage: getOccupancyPercentage(occupied, capacity),

    occupancyStatus: resolveGoldOccupancyStatus(occupied, capacity),

    isFull,

    canAllocate,
  };
}

/* ===========================================================
   RACK VIEW
=========================================================== */

export function createGoldRackView(
  configuration: GoldRackConfiguration,

  allocations: GoldCustodyAllocation[],
): GoldRackView {
  const activeAllocations = getRackActiveAllocations(
    allocations,
    configuration.id,
  )
    .slice()
    .sort((left, right) => left.location.bagNumber - right.location.bagNumber);

  return {
    configuration,

    occupancy: createGoldRackOccupancy(configuration, allocations),

    bags: activeAllocations.map(createGoldStorageBagFromAllocation),
  };
}

/* ===========================================================
   LOCKER OCCUPANCY

   Locker counters are derived entirely from its Rack views.
=========================================================== */

export function createGoldLockerOccupancy(
  configuration: GoldLockerConfiguration,

  rackViews: GoldRackView[],
): GoldLockerOccupancy {
  const totalRacks = rackViews.length;

  const totalCapacity = rackViews.reduce(
    (total, rack) => total + rack.occupancy.capacity,
    0,
  );

  const occupied = rackViews.reduce(
    (total, rack) => total + rack.occupancy.occupied,
    0,
  );

  const available = rackViews.reduce(
    (total, rack) => total + rack.occupancy.available,
    0,
  );

  const fullRackCount = rackViews.filter(
    (rack) => rack.occupancy.isFull,
  ).length;

  const availableRackCount = rackViews.filter(
    (rack) => rack.occupancy.canAllocate,
  ).length;

  const canAllocate =
    configuration.status === "ACTIVE" && availableRackCount > 0;

  const isFull =
    totalCapacity <= 0 || occupied >= totalCapacity || availableRackCount === 0;

  return {
    lockerId: configuration.id,

    totalRacks,

    totalCapacity,

    occupied,

    available,

    occupancyPercentage: getOccupancyPercentage(occupied, totalCapacity),

    occupancyStatus: resolveGoldOccupancyStatus(occupied, totalCapacity),

    fullRackCount,

    availableRackCount,

    isFull,

    canAllocate,
  };
}

/* ===========================================================
   LOCKER VIEW
=========================================================== */

export function createGoldLockerView(
  configuration: GoldLockerConfiguration,

  settings: GoldStorageSettings,

  allocations: GoldCustodyAllocation[],
): GoldLockerView {
  const rackViews = settings.racks
    .filter((rack) => rack.lockerId === configuration.id)
    .slice()
    .sort((left, right) => left.rackNumber - right.rackNumber)
    .map((rack) => createGoldRackView(rack, allocations));

  return {
    configuration,

    occupancy: createGoldLockerOccupancy(configuration, rackViews),

    racks: rackViews,

    canView: true,
  };
}

/* ===========================================================
   ROOM OCCUPANCY

   Room counters are derived from Locker views.
=========================================================== */

export function createGoldRoomOccupancy(
  configuration: GoldRoomConfiguration,

  lockerViews: GoldLockerView[],
): GoldRoomOccupancy {
  const totalLockers = lockerViews.length;

  const totalRacks = lockerViews.reduce(
    (total, locker) => total + locker.occupancy.totalRacks,
    0,
  );

  const totalCapacity = lockerViews.reduce(
    (total, locker) => total + locker.occupancy.totalCapacity,
    0,
  );

  const occupied = lockerViews.reduce(
    (total, locker) => total + locker.occupancy.occupied,
    0,
  );

  const available = lockerViews.reduce(
    (total, locker) => total + locker.occupancy.available,
    0,
  );

  const fullLockerCount = lockerViews.filter(
    (locker) => locker.occupancy.isFull,
  ).length;

  const availableLockerCount = lockerViews.filter(
    (locker) => locker.occupancy.canAllocate,
  ).length;

  return {
    roomId: configuration.id,

    totalLockers,

    totalRacks,

    totalCapacity,

    occupied,

    available,

    occupancyPercentage: getOccupancyPercentage(occupied, totalCapacity),

    occupancyStatus: resolveGoldOccupancyStatus(occupied, totalCapacity),

    fullLockerCount,

    availableLockerCount,
  };
}

/* ===========================================================
   ROOM VIEW
=========================================================== */

export function createGoldLockerRoomView(
  configuration: GoldRoomConfiguration,

  settings: GoldStorageSettings,

  allocations: GoldCustodyAllocation[],
): GoldLockerRoomView {
  const lockerViews = settings.lockers
    .filter((locker) => locker.roomId === configuration.id)
    .slice()
    .sort((left, right) => left.lockerNumber - right.lockerNumber)
    .map((locker) => createGoldLockerView(locker, settings, allocations));

  return {
    configuration,

    occupancy: createGoldRoomOccupancy(configuration, lockerViews),

    lockers: lockerViews,
  };
}

/* ===========================================================
   BUILD COMPLETE DIGITAL TWIN
=========================================================== */

export function buildGoldStorageRoomViews(
  settings: GoldStorageSettings,

  allocations: GoldCustodyAllocation[],
): GoldLockerRoomView[] {
  return settings.rooms
    .slice()
    .sort((left, right) => left.roomNumber - right.roomNumber)
    .map((room) => createGoldLockerRoomView(room, settings, allocations));
}

/* ===========================================================
   SNAPSHOT
=========================================================== */

export function createGoldStorageSnapshot(
  state: GoldStorageState,
): GoldStorageSnapshot {
  return {
    state,

    rooms: buildGoldStorageRoomViews(state.settings, state.allocations),
  };
}

/* ===========================================================
   ACTIVE LOAN ALLOCATION
=========================================================== */

export function findActiveGoldAllocationByLoanId(
  allocations: GoldCustodyAllocation[],

  loanId: string,
): GoldCustodyAllocation | undefined {
  return allocations.find(
    (allocation) =>
      allocation.loanId === loanId && isActiveGoldAllocation(allocation),
  );
}

/* ===========================================================
   BAG NUMBER OCCUPIED
=========================================================== */

function isGoldBagNumberOccupied(
  allocations: GoldCustodyAllocation[],

  rackId: GoldRackId,

  bagNumber: number,
): boolean {
  return allocations.some(
    (allocation) =>
      isActiveGoldAllocation(allocation) &&
      allocation.location.rackId === rackId &&
      allocation.location.bagNumber === bagNumber,
  );
}

/* ===========================================================
   FIRST AVAILABLE BAG NUMBER
=========================================================== */

function findFirstAvailableGoldBagNumber(
  configuration: GoldRackConfiguration,

  allocations: GoldCustodyAllocation[],
): number | null {
  const capacity = getSafeCapacity(configuration.capacity);

  for (let bagNumber = 1; bagNumber <= capacity; bagNumber += 1) {
    if (!isGoldBagNumberOccupied(allocations, configuration.id, bagNumber)) {
      return bagNumber;
    }
  }

  return null;
}

/* ===========================================================
   RESOLVE ALLOCATION BAG NUMBER
=========================================================== */

function resolveAllocationBagNumber(
  configuration: GoldRackConfiguration,

  allocations: GoldCustodyAllocation[],

  requestedBagNumber?: number,
): {
  bagNumber?: number;

  error?: string;
} {
  const capacity = getSafeCapacity(configuration.capacity);

  if (requestedBagNumber !== undefined) {
    const normalizedBagNumber = normalizeBagNumber(requestedBagNumber);

    if (normalizedBagNumber < 1) {
      return {
        error: "Requested Bag number must be greater than 0.",
      };
    }

    if (
      isGoldBagNumberOccupied(
        allocations,
        configuration.id,
        normalizedBagNumber,
      )
    ) {
      return {
        error: `Bag ${normalizedBagNumber} is already occupied in this Rack.`,
      };
    }

    return {
      bagNumber: normalizedBagNumber,
    };
  }

  const nextAvailableBagNumber = findFirstAvailableGoldBagNumber(
    configuration,
    allocations,
  );

  if (nextAvailableBagNumber === null) {
    return {
      error: "Selected Rack has no available Bag capacity.",
    };
  }

  return {
    bagNumber: nextAvailableBagNumber,
  };
}

/* ===========================================================
   VALIDATE ALLOCATION HIERARCHY
=========================================================== */

function validateGoldAllocationHierarchy(
  hierarchy: GoldStorageHierarchyResult,
): string | null {
  if (hierarchy.room.status !== "ACTIVE") {
    return "Selected Gold Locker Room is not active.";
  }

  if (hierarchy.locker.status !== "ACTIVE") {
    return "Selected Gold Locker is not active.";
  }

  if (hierarchy.rack.status !== "ACTIVE") {
    return "Selected Gold Rack is not active.";
  }

  if (getSafeCapacity(hierarchy.rack.capacity) <= 0) {
    return "Selected Gold Rack has no configured capacity.";
  }

  return null;
}

/* ===========================================================
   ALLOCATE GOLD STORAGE

   IMPORTANT:

   Capacity is re-read from the current state immediately
   before allocation.

   This is the authoritative save-time capacity check.
=========================================================== */

export function allocateGoldStorage(
  state: GoldStorageState,

  request: GoldStorageAllocationRequest,
): GoldStorageAllocationMutationResult {
  const hierarchy = resolveGoldStorageHierarchy(
    state.settings,
    request.roomId,
    request.lockerId,
    request.rackId,
  );

  if (!hierarchy) {
    return {
      success: false,

      state,

      rooms: buildGoldStorageRoomViews(state.settings, state.allocations),

      error: "Selected Room → Locker → Rack hierarchy is invalid.",
    };
  }

  const hierarchyError = validateGoldAllocationHierarchy(hierarchy);

  if (hierarchyError) {
    return {
      success: false,

      state,

      rooms: buildGoldStorageRoomViews(state.settings, state.allocations),

      error: hierarchyError,
    };
  }

  const existingActiveAllocation = findActiveGoldAllocationByLoanId(
    state.allocations,
    request.loanId,
  );

  if (existingActiveAllocation) {
    return {
      success: false,

      state,

      rooms: buildGoldStorageRoomViews(state.settings, state.allocations),

      error:
        "This Gold Loan already has an active physical custody allocation.",
    };
  }

  /* =========================================================
     SAVE-TIME CAPACITY RE-CHECK
  ========================================================= */

  const rackOccupancy = createGoldRackOccupancy(
    hierarchy.rack,
    state.allocations,
  );

  if (!rackOccupancy.canAllocate || rackOccupancy.isFull) {
    return {
      success: false,

      state,

      rooms: buildGoldStorageRoomViews(state.settings, state.allocations),

      error: "Selected Gold Rack is full or unavailable for allocation.",
    };
  }

  const bagResolution = resolveAllocationBagNumber(
    hierarchy.rack,
    state.allocations,
    request.requestedBagNumber,
  );

  if (bagResolution.error || bagResolution.bagNumber === undefined) {
    return {
      success: false,

      state,

      rooms: buildGoldStorageRoomViews(state.settings, state.allocations),

      error: bagResolution.error ?? "Unable to allocate a Bag number.",
    };
  }

  const location = createGoldStorageLocation(
    hierarchy,
    bagResolution.bagNumber,
  );

  const allocation: GoldCustodyAllocation = {
    id: createGoldAllocationId(),

    loanId: request.loanId,

    loanNumber: request.loanNumber,

    customerId: request.customerId,

    customerName: request.customerName,

    customerPhone: request.customerPhone,

    location,

    locationCode: createGoldStorageLocationCode(location),

    status: "OCCUPIED",

    allocatedAt: new Date().toISOString(),

    allocatedBy: request.allocatedBy,

    remarks: request.remarks,
  };

  const nextState: GoldStorageState = {
    ...state,

    allocations: [...state.allocations, allocation],
  };

  return {
    success: true,

    allocation,

    state: nextState,

    rooms: buildGoldStorageRoomViews(nextState.settings, nextState.allocations),
  };
}

/* ===========================================================
   RELEASE GOLD STORAGE

   History is preserved.

   Record is updated to RELEASED.

   Nothing is deleted.

   Next occupancy calculation automatically makes the Bag
   available again.
=========================================================== */

export function releaseGoldStorage(
  state: GoldStorageState,

  request: GoldStorageReleaseRequest,
): GoldStorageReleaseResult {
  const existingAllocation = state.allocations.find(
    (allocation) =>
      allocation.id === request.allocationId &&
      allocation.loanId === request.loanId,
  );

  if (!existingAllocation) {
    return {
      success: false,

      state,

      rooms: buildGoldStorageRoomViews(state.settings, state.allocations),

      error: "Gold custody allocation was not found.",
    };
  }

  if (existingAllocation.status !== "OCCUPIED") {
    return {
      success: false,

      state,

      rooms: buildGoldStorageRoomViews(state.settings, state.allocations),

      error: "Only an active Gold custody allocation can be released.",
    };
  }

  const releasedAllocation: GoldCustodyAllocation = {
    ...existingAllocation,

    status: "RELEASED",

    releasedAt: request.releasedAt,

    releasedBy: request.releasedBy,

    remarks: request.remarks ?? existingAllocation.remarks,
  };

  const nextAllocations = state.allocations.map((allocation) =>
    allocation.id === existingAllocation.id ? releasedAllocation : allocation,
  );

  const nextState: GoldStorageState = {
    ...state,

    allocations: nextAllocations,
  };

  return {
    success: true,

    allocation: releasedAllocation,

    state: nextState,

    rooms: buildGoldStorageRoomViews(nextState.settings, nextState.allocations),
  };
}

/* ===========================================================
   SAME PHYSICAL LOCATION CHECK
=========================================================== */

function isSameGoldPhysicalLocation(
  left: GoldStorageLocation,

  right: GoldStorageLocation,
): boolean {
  return (
    left.roomId === right.roomId &&
    left.lockerId === right.lockerId &&
    left.rackId === right.rackId &&
    left.bagId === right.bagId &&
    left.bagNumber === right.bagNumber
  );
}

/* ===========================================================
   RELOCATE GOLD STORAGE

   History model:

   OLD allocation
      OCCUPIED → RELOCATED

   NEW allocation
      OCCUPIED at target location

   Audit
      fromLocation → toLocation

   Therefore old physical location immediately stops consuming
   capacity while relocation history remains intact.
=========================================================== */

export function relocateGoldStorage(
  state: GoldStorageState,

  request: GoldStorageRelocationRequest,
): GoldStorageRelocationResult {
  const sourceAllocation = state.allocations.find(
    (allocation) =>
      allocation.id === request.allocationId &&
      allocation.loanId === request.loanId,
  );

  if (!sourceAllocation) {
    return {
      success: false,

      state,

      rooms: buildGoldStorageRoomViews(state.settings, state.allocations),

      error: "Source Gold custody allocation was not found.",
    };
  }

  if (sourceAllocation.status !== "OCCUPIED") {
    return {
      success: false,

      state,

      rooms: buildGoldStorageRoomViews(state.settings, state.allocations),

      error: "Only an active Gold custody allocation can be relocated.",
    };
  }

  if (
    !isSameGoldPhysicalLocation(sourceAllocation.location, request.fromLocation)
  ) {
    return {
      success: false,

      state,

      rooms: buildGoldStorageRoomViews(state.settings, state.allocations),

      error:
        "Source physical location changed before relocation. Refresh and try again.",
    };
  }

  if (
    sourceAllocation.location.roomId === request.targetRoomId &&
    sourceAllocation.location.lockerId === request.targetLockerId &&
    sourceAllocation.location.rackId === request.targetRackId
  ) {
    return {
      success: false,

      state,

      rooms: buildGoldStorageRoomViews(state.settings, state.allocations),

      error: "Target Rack must be different from the current Rack.",
    };
  }

  const targetHierarchy = resolveGoldStorageHierarchy(
    state.settings,
    request.targetRoomId,
    request.targetLockerId,
    request.targetRackId,
  );

  if (!targetHierarchy) {
    return {
      success: false,

      state,

      rooms: buildGoldStorageRoomViews(state.settings, state.allocations),

      error: "Target Room → Locker → Rack hierarchy is invalid.",
    };
  }

  const hierarchyError = validateGoldAllocationHierarchy(targetHierarchy);

  if (hierarchyError) {
    return {
      success: false,

      state,

      rooms: buildGoldStorageRoomViews(state.settings, state.allocations),

      error: hierarchyError,
    };
  }

  /* =========================================================
     TARGET CAPACITY RE-CHECK
  ========================================================= */

  const targetOccupancy = createGoldRackOccupancy(
    targetHierarchy.rack,
    state.allocations,
  );

  if (!targetOccupancy.canAllocate || targetOccupancy.isFull) {
    return {
      success: false,

      state,

      rooms: buildGoldStorageRoomViews(state.settings, state.allocations),

      error: "Target Gold Rack is full or unavailable.",
    };
  }

  const targetBagNumber = findFirstAvailableGoldBagNumber(
    targetHierarchy.rack,
    state.allocations,
  );

  if (targetBagNumber === null) {
    return {
      success: false,

      state,

      rooms: buildGoldStorageRoomViews(state.settings, state.allocations),

      error: "Target Gold Rack has no available Bag position.",
    };
  }

  const targetLocation = createGoldStorageLocation(
    targetHierarchy,
    targetBagNumber,
  );

  const relocatedHistoricalAllocation: GoldCustodyAllocation = {
    ...sourceAllocation,

    status: "RELOCATED",

    remarks: request.remarks ?? sourceAllocation.remarks,
  };

  const activeAllocation: GoldCustodyAllocation = {
    id: createGoldAllocationId(),

    loanId: sourceAllocation.loanId,

    loanNumber: sourceAllocation.loanNumber,

    customerId: sourceAllocation.customerId,

    customerName: sourceAllocation.customerName,

    customerPhone: sourceAllocation.customerPhone,

    location: targetLocation,

    locationCode: createGoldStorageLocationCode(targetLocation),

    status: "OCCUPIED",

    allocatedAt: request.relocatedAt,

    allocatedBy: request.relocatedBy,

    remarks: request.remarks,
  };

  const audit: GoldStorageRelocationAudit = {
    id: createGoldRelocationAuditId(),

    allocationId: sourceAllocation.id,

    loanId: sourceAllocation.loanId,

    loanNumber: sourceAllocation.loanNumber,

    fromLocation: sourceAllocation.location,

    toLocation: targetLocation,

    relocatedBy: request.relocatedBy,

    relocatedAt: request.relocatedAt,

    remarks: request.remarks,
  };

  const nextAllocations = state.allocations
    .map((allocation) =>
      allocation.id === sourceAllocation.id
        ? relocatedHistoricalAllocation
        : allocation,
    )
    .concat(activeAllocation);

  const nextState: GoldStorageState = {
    ...state,

    allocations: nextAllocations,

    relocationAudits: [...state.relocationAudits, audit],
  };

  return {
    success: true,

    previousAllocation: relocatedHistoricalAllocation,

    activeAllocation,

    audit,

    state: nextState,

    rooms: buildGoldStorageRoomViews(nextState.settings, nextState.allocations),
  };
}

/* ===========================================================
   RACK SUGGESTION

   IMPORTANT:

   Recommendation only.

   UI / owner is free to select ANY other available Rack.
=========================================================== */

export function suggestGoldStorageRack(
  state: GoldStorageState,

  preferredRoomId?: GoldRoomId,

  preferredLockerId?: GoldLockerId,
): GoldStorageRackSuggestion | null {
  const rooms = buildGoldStorageRoomViews(state.settings, state.allocations);

  const candidates: GoldStorageRackSuggestion[] = [];

  for (const room of rooms) {
    if (preferredRoomId && room.configuration.id !== preferredRoomId) {
      continue;
    }

    if (room.configuration.status !== "ACTIVE") {
      continue;
    }

    for (const locker of room.lockers) {
      if (preferredLockerId && locker.configuration.id !== preferredLockerId) {
        continue;
      }

      if (locker.configuration.status !== "ACTIVE") {
        continue;
      }

      for (const rack of locker.racks) {
        if (!rack.occupancy.canAllocate) {
          continue;
        }

        candidates.push({
          roomId: room.configuration.id,

          lockerId: locker.configuration.id,

          rackId: rack.configuration.id,

          available: rack.occupancy.available,

          capacity: rack.occupancy.capacity,
        });
      }
    }
  }

  candidates.sort((left, right) => {
    if (right.available !== left.available) {
      return right.available - left.available;
    }

    return left.rackId.localeCompare(right.rackId);
  });

  return candidates[0] ?? null;
}

/* ===========================================================
   SEARCH NORMALIZER
=========================================================== */

function normalizeGoldStorageSearchText(value: string): string {
  return value.trim().toLocaleLowerCase();
}

/* ===========================================================
   SEARCH STORAGE

   Search supports:

   - Loan Number
   - Customer Name
   - Mobile Number
   - Customer ID

   Historical RELEASED / RELOCATED records are preserved and
   searchable.

   activeOnly=true can be used for Gold Release workflow.
=========================================================== */

export function searchGoldStorage(
  allocations: GoldCustodyAllocation[],

  query: string,

  activeOnly: boolean = false,
): GoldStorageSearchResult[] {
  const normalizedQuery = normalizeGoldStorageSearchText(query);

  if (!normalizedQuery) {
    return [];
  }

  return allocations
    .filter((allocation) => {
      if (activeOnly && !isActiveGoldAllocation(allocation)) {
        return false;
      }

      const searchableValues = [
        allocation.loanNumber,

        allocation.customerName,

        allocation.customerPhone,

        allocation.customerId,
      ];

      return searchableValues.some((value) =>
        normalizeGoldStorageSearchText(String(value ?? "")).includes(
          normalizedQuery,
        ),
      );
    })
    .map(
      (allocation): GoldStorageSearchResult => ({
        allocationId: allocation.id,

        loanId: allocation.loanId,

        loanNumber: allocation.loanNumber,

        customerId: allocation.customerId,

        customerName: allocation.customerName,

        customerPhone: allocation.customerPhone,

        location: allocation.location,

        locationCode: allocation.locationCode,

        custodyStatus: allocation.status,
      }),
    );
}

/* ===========================================================
   CURRENT LOAN STORAGE SEARCH
=========================================================== */

export function findCurrentGoldStorageByLoanId(
  state: GoldStorageState,

  loanId: string,
): GoldStorageSearchResult | null {
  const allocation = findActiveGoldAllocationByLoanId(
    state.allocations,
    loanId,
  );

  if (!allocation) {
    return null;
  }

  return {
    allocationId: allocation.id,

    loanId: allocation.loanId,

    loanNumber: allocation.loanNumber,

    customerId: allocation.customerId,

    customerName: allocation.customerName,

    customerPhone: allocation.customerPhone,

    location: allocation.location,

    locationCode: allocation.locationCode,

    custodyStatus: allocation.status,
  };
}

/* ===========================================================
   ALLOCATION HISTORY
=========================================================== */

export function getGoldStorageHistoryByLoanId(
  state: GoldStorageState,

  loanId: string,
): GoldCustodyAllocation[] {
  return state.allocations
    .filter((allocation) => allocation.loanId === loanId)
    .slice()
    .sort((left, right) => right.allocatedAt.localeCompare(left.allocatedAt));
}

/* ===========================================================
   RELOCATION HISTORY
=========================================================== */

export function getGoldRelocationHistoryByLoanId(
  state: GoldStorageState,

  loanId: string,
): GoldStorageRelocationAudit[] {
  return state.relocationAudits
    .filter((audit) => audit.loanId === loanId)
    .slice()
    .sort((left, right) => right.relocatedAt.localeCompare(left.relocatedAt));
}

/* ===========================================================
   END
=========================================================== */
