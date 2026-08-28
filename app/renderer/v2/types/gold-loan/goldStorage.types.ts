/* ===========================================================
   FINORA ENTERPRISE OS™

   GOLD LOAN ENGINE™

   GOLD STORAGE TYPES

   MODULE  : Gold Loan
   LAYER   : Domain Contracts
   VERSION : 1.0
   STATUS  : Production Foundation

   RESPONSIBILITY:

   - Define physical Gold Locker Room contracts
   - Define Room / Locker / Rack / Bag hierarchy
   - Define occupancy and capacity contracts
   - Define active custody allocation contracts
   - Define bag release and relocation audit contracts
   - Define locker / rack inspection contracts

   PHYSICAL MODEL:

   Locker Room
        ↓
   Locker / Beeruva
        ↓
   Rack
        ↓
   Bag / Packet
        ↓
   Gold Loan

   TERMINOLOGY:

   Locker = Beeruva
   Bag    = Packet

   IMPORTANT:

   - No React.
   - No UI.
   - No persistence.
   - No calculations.
   - No StorageManager.
   - No repository access.
   - No hardcoded locker/rack capacities.
=========================================================== */

/* ===========================================================
   IDENTIFIERS
=========================================================== */

export type GoldRoomId = string;

export type GoldLockerId = string;

export type GoldRackId = string;

export type GoldBagId = string;

export type GoldCustodyAllocationId = string;

/* ===========================================================
   STORAGE STATUS
=========================================================== */

export type GoldStorageStatus = "ACTIVE" | "INACTIVE" | "MAINTENANCE";

/* ===========================================================
   OCCUPANCY STATUS
=========================================================== */

export type GoldOccupancyStatus =
  | "EMPTY"
  | "AVAILABLE"
  | "PARTIAL"
  | "HIGH"
  | "FULL";

/* ===========================================================
   BAG CUSTODY STATUS
=========================================================== */

export type GoldBagCustodyStatus = "OCCUPIED" | "RELEASED" | "RELOCATED";

/* ===========================================================
   GOLD STORAGE LOCATION
=========================================================== */

export interface GoldStorageLocation {
  roomId: GoldRoomId;

  roomNumber: number;

  roomName: string;

  lockerId: GoldLockerId;

  lockerNumber: number;

  lockerName: string;

  rackId: GoldRackId;

  rackNumber: number;

  rackName: string;

  bagId: GoldBagId;

  bagNumber: number;
}

/* ===========================================================
   LOCATION DISPLAY CODE

   Example:

   R01-L01-RK03-B017
=========================================================== */

export interface GoldStorageLocationCode {
  roomCode: string;

  lockerCode: string;

  rackCode: string;

  bagCode: string;

  fullCode: string;
}

/* ===========================================================
   GOLD BAG / PACKET
=========================================================== */

export interface GoldStorageBag {
  id: GoldBagId;

  bagNumber: number;

  bagLabel: string;

  roomId: GoldRoomId;

  lockerId: GoldLockerId;

  rackId: GoldRackId;

  loanId: string;

  loanNumber: string;

  customerId: string;

  customerName: string;

  customerPhone: string;

  status: GoldBagCustodyStatus;

  allocatedAt: string;

  allocatedBy: string;

  releasedAt?: string;

  releasedBy?: string;

  remarks?: string;
}

/* ===========================================================
   GOLD RACK CONFIGURATION
=========================================================== */

export interface GoldRackConfiguration {
  id: GoldRackId;

  rackNumber: number;

  rackName: string;

  lockerId: GoldLockerId;

  capacity: number;

  status: GoldStorageStatus;

  createdAt: string;

  updatedAt: string;
}

/* ===========================================================
   GOLD RACK OCCUPANCY
=========================================================== */

export interface GoldRackOccupancy {
  rackId: GoldRackId;

  capacity: number;

  occupied: number;

  available: number;

  occupancyPercentage: number;

  occupancyStatus: GoldOccupancyStatus;

  isFull: boolean;

  canAllocate: boolean;
}

/* ===========================================================
   GOLD RACK VIEW
=========================================================== */

export interface GoldRackView {
  configuration: GoldRackConfiguration;

  occupancy: GoldRackOccupancy;

  bags: GoldStorageBag[];
}

/* ===========================================================
   GOLD LOCKER CONFIGURATION

   Locker = Beeruva
=========================================================== */

export interface GoldLockerConfiguration {
  id: GoldLockerId;

  lockerNumber: number;

  lockerName: string;

  roomId: GoldRoomId;

  rackCount: number;

  defaultRackCapacity: number;

  status: GoldStorageStatus;

  createdAt: string;

  updatedAt: string;
}

/* ===========================================================
   GOLD LOCKER OCCUPANCY
=========================================================== */

export interface GoldLockerOccupancy {
  lockerId: GoldLockerId;

  totalRacks: number;

  totalCapacity: number;

  occupied: number;

  available: number;

  occupancyPercentage: number;

  occupancyStatus: GoldOccupancyStatus;

  fullRackCount: number;

  availableRackCount: number;

  isFull: boolean;

  canAllocate: boolean;
}

/* ===========================================================
   GOLD LOCKER VIEW

   IMPORTANT:

   VIEW remains available even when:

   - Locker is FULL
   - Locker allocation is disabled
   - Every rack is FULL

   Therefore:

   canView is intentionally independent from canAllocate.
=========================================================== */

export interface GoldLockerView {
  configuration: GoldLockerConfiguration;

  occupancy: GoldLockerOccupancy;

  racks: GoldRackView[];

  canView: true;
}

/* ===========================================================
   GOLD ROOM CONFIGURATION
=========================================================== */

export interface GoldRoomConfiguration {
  id: GoldRoomId;

  roomNumber: number;

  roomName: string;

  lockerCount: number;

  status: GoldStorageStatus;

  createdAt: string;

  updatedAt: string;
}

/* ===========================================================
   GOLD ROOM OCCUPANCY
=========================================================== */

export interface GoldRoomOccupancy {
  roomId: GoldRoomId;

  totalLockers: number;

  totalRacks: number;

  totalCapacity: number;

  occupied: number;

  available: number;

  occupancyPercentage: number;

  occupancyStatus: GoldOccupancyStatus;

  fullLockerCount: number;

  availableLockerCount: number;
}

/* ===========================================================
   GOLD LOCKER ROOM VIEW
=========================================================== */

export interface GoldLockerRoomView {
  configuration: GoldRoomConfiguration;

  occupancy: GoldRoomOccupancy;

  lockers: GoldLockerView[];
}

/* ===========================================================
   CUSTODY ALLOCATION
=========================================================== */

export interface GoldCustodyAllocation {
  id: GoldCustodyAllocationId;

  loanId: string;

  loanNumber: string;

  customerId: string;

  customerName: string;

  customerPhone: string;

  location: GoldStorageLocation;

  locationCode: GoldStorageLocationCode;

  status: GoldBagCustodyStatus;

  allocatedAt: string;

  allocatedBy: string;

  releasedAt?: string;

  releasedBy?: string;

  remarks?: string;
}

/* ===========================================================
   ALLOCATION REQUEST

   Owner can manually choose ANY Rack that:

   - belongs to selected Locker
   - is ACTIVE
   - has available capacity

   FINORA may suggest a Rack but must never force it.
=========================================================== */

export interface GoldStorageAllocationRequest {
  loanId: string;

  loanNumber: string;

  customerId: string;

  customerName: string;

  customerPhone: string;

  roomId: GoldRoomId;

  lockerId: GoldLockerId;

  rackId: GoldRackId;

  requestedBagNumber?: number;

  allocatedBy: string;

  remarks?: string;
}

/* ===========================================================
   ALLOCATION RESULT
=========================================================== */

export interface GoldStorageAllocationResult {
  success: boolean;

  allocation?: GoldCustodyAllocation;

  error?: string;
}

/* ===========================================================
   RELEASE REQUEST
=========================================================== */

export interface GoldStorageReleaseRequest {
  allocationId: GoldCustodyAllocationId;

  loanId: string;

  releasedBy: string;

  releasedAt: string;

  remarks?: string;
}

/* ===========================================================
   RELOCATION REQUEST
=========================================================== */

export interface GoldStorageRelocationRequest {
  allocationId: GoldCustodyAllocationId;

  loanId: string;

  fromLocation: GoldStorageLocation;

  targetRoomId: GoldRoomId;

  targetLockerId: GoldLockerId;

  targetRackId: GoldRackId;

  relocatedBy: string;

  relocatedAt: string;

  remarks?: string;
}

/* ===========================================================
   RELOCATION AUDIT
=========================================================== */

export interface GoldStorageRelocationAudit {
  id: string;

  allocationId: GoldCustodyAllocationId;

  loanId: string;

  loanNumber: string;

  fromLocation: GoldStorageLocation;

  toLocation: GoldStorageLocation;

  relocatedBy: string;

  relocatedAt: string;

  remarks?: string;
}

/* ===========================================================
   STORAGE SEARCH RESULT

   Used later during Gold Release Search.

   Search support can include:

   - Loan Number
   - Customer Name
   - Mobile Number
   - Customer ID
=========================================================== */

export interface GoldStorageSearchResult {
  allocationId: GoldCustodyAllocationId;

  loanId: string;

  loanNumber: string;

  customerId: string;

  customerName: string;

  customerPhone: string;

  location: GoldStorageLocation;

  locationCode: GoldStorageLocationCode;

  custodyStatus: GoldBagCustodyStatus;
}

/* ===========================================================
   LOCKER INSPECTION MODE
=========================================================== */

export interface GoldLockerInspectionState {
  roomId: GoldRoomId;

  lockerId: GoldLockerId;

  selectedRackId?: GoldRackId;

  isInspectionOpen: boolean;

  isReadOnly: true;
}

/* ===========================================================
   STORAGE SETTINGS

   Owner controls physical geometry.

   Example:

   Room 01
     Locker 01
       20 Racks
       40 Bags per Rack

   Capacity:

   20 × 40 = 800 Bags

   Nothing is hardcoded by the Gold Loan Engine.
=========================================================== */

export interface GoldStorageSettings {
  rooms: GoldRoomConfiguration[];

  lockers: GoldLockerConfiguration[];

  racks: GoldRackConfiguration[];

  updatedAt: string;

  updatedBy: string;
}

/* ===========================================================
   END
=========================================================== */
