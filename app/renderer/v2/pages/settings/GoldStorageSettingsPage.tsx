// ============================================================
// FINORA ENTERPRISE OS™
//
// GOLD LOAN ENGINE™
// GOLD STORAGE SETTINGS PAGE
//
// RESPONSIBILITY:
//
// - Configure Gold Locker Rooms.
// - Configure Lockers / Beeruvas.
// - Configure Racks.
// - Configure arbitrary Rack bag capacity.
// - Configure ACTIVE / INACTIVE / MAINTENANCE status.
// - Keep Room lockerCount synchronized.
// - Keep Locker rackCount synchronized.
// - Load persisted Gold Storage Settings.
// - Save through GoldStorageSettingsService.
// - Consume FINORA Theme Engine.
// - Consume FINORA Responsive Engine.
//
// PHYSICAL MODEL:
//
// Locker Room
//      ↓
// Locker / Beeruva
//      ↓
// Rack
//      ↓
// Bag / Packet
//      ↓
// Gold Loan
//
// IMPORTANT:
//
// - No direct repository access.
// - No direct StorageManager access.
// - No localStorage.
// - No filesystem.
// - No Electron IPC.
// - No hardcoded Room count.
// - No hardcoded Locker count.
// - No hardcoded Rack count.
// - No hardcoded Rack capacity.
// - Rack has lockerId only.
// - Rack does NOT contain roomId.
// - Occupancy is NOT calculated here.
// - Custody allocation is NOT handled here.
// - Inter only.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import { useCallback, useEffect, useMemo, useState } from "react";

import type { CSSProperties } from "react";

import {
  Archive,
  Boxes,
  CircleCheck,
  LockKeyhole,
  Pencil,
  Plus,
  RefreshCw,
  Rows3,
  Save,
  Trash2,
  TriangleAlert,
  Warehouse,
} from "lucide-react";

import { useTheme } from "../../themes/provider";

import type { FinoraTheme } from "../../themes/core/types";

import useResponsive from "../../utils/responsive/useResponsive";

import { getBusinessContext } from "../../services/business/businessContextService";

import {
  createEmptyGoldStorageSettings,
  loadGoldStorageSettings,
  saveGoldStorageSettings,
  validateGoldStorageSettings,
  validateGoldStorageSettingsCustodyIntegrity,
} from "../../services/gold-loan/goldStorageSettingsService";

import type {
  GoldLockerConfiguration,
  GoldRackConfiguration,
  GoldRoomConfiguration,
  GoldStorageSettings,
  GoldStorageStatus,
} from "../../types/gold-loan/goldStorage.types";

import { getGoldStorageSettingsStyles } from "./GoldStorageSettings.styles";

// ============================================================
// THEME STYLE
// ============================================================

type GoldStorageThemeStyle = CSSProperties & Record<`--${string}`, string>;

// ============================================================
// THEME VARIABLE FACTORY
// ============================================================

function createGoldStorageThemeVariables(
  theme: FinoraTheme,
): GoldStorageThemeStyle {
  return {
    "--finora-theme-brand-primary": theme.colors.brand.primary,

    "--finora-theme-brand-secondary": theme.colors.brand.secondary,

    "--finora-theme-brand-accent": theme.colors.brand.accent,

    "--finora-theme-brand-accent-soft": theme.colors.brand.accentSoft,

    "--finora-theme-page": theme.colors.background.page,

    "--finora-theme-background-page": theme.colors.background.page,

    "--finora-theme-surface": theme.colors.background.surface,

    "--finora-theme-background-surface": theme.colors.background.surface,

    "--finora-theme-surface-muted": theme.colors.background.surfaceMuted,

    "--finora-theme-background-surface-muted":
      theme.colors.background.surfaceMuted,

    "--finora-theme-surface-strong": theme.colors.background.surfaceStrong,

    "--finora-theme-text-primary": theme.colors.text.primary,

    "--finora-theme-text-secondary": theme.colors.text.secondary,

    "--finora-theme-text-body": theme.colors.text.secondary,

    "--finora-theme-text-muted": theme.colors.text.muted,

    "--finora-theme-text-inverse": theme.colors.text.inverse,

    "--finora-theme-border-default": theme.colors.border.default,

    "--finora-theme-border-strong": theme.colors.border.strong,

    "--finora-theme-border-subtle": theme.colors.border.subtle,

    "--finora-theme-focus": theme.colors.border.focus,

    "--finora-theme-success": theme.colors.status.success,

    "--finora-theme-success-soft": theme.colors.status.successSoft,

    "--finora-theme-success-border": theme.colors.border.strong,

    "--finora-theme-warning": theme.colors.status.warning,

    "--finora-theme-warning-soft": theme.colors.status.warningSoft,

    "--finora-theme-danger": theme.colors.status.danger,

    "--finora-theme-danger-soft": theme.colors.status.dangerSoft,

    "--finora-theme-info": theme.colors.status.info,

    "--finora-theme-info-soft": theme.colors.status.infoSoft,

    "--finora-theme-overlay-shadow": theme.colors.overlay.shadow,

    "--finora-theme-overlay-backdrop": theme.colors.overlay.backdrop,
  };
}

// ============================================================
// SETTINGS SECTION
// ============================================================

type SettingsSection = "ROOMS" | "LOCKERS" | "RACKS";

// ============================================================
// FEEDBACK
// ============================================================

type FeedbackKind = "SUCCESS" | "WARNING" | "DANGER";

interface SettingsFeedback {
  kind: FeedbackKind;

  title: string;

  text: string;
}

// ============================================================
// DRAFTS
// ============================================================

interface RoomDraft {
  id: string;

  roomNumber: string;

  roomName: string;

  status: GoldStorageStatus;
}

interface LockerDraft {
  id: string;

  roomId: string;

  lockerNumber: string;

  lockerName: string;

  defaultRackCapacity: string;

  status: GoldStorageStatus;
}

interface RackDraft {
  id: string;

  lockerId: string;

  rackNumber: string;

  rackName: string;

  capacity: string;

  status: GoldStorageStatus;
}

// ============================================================
// EMPTY DRAFTS
// ============================================================

function createEmptyRoomDraft(): RoomDraft {
  return {
    id: "",

    roomNumber: "",

    roomName: "",

    status: "ACTIVE",
  };
}

function createEmptyLockerDraft(): LockerDraft {
  return {
    id: "",

    roomId: "",

    lockerNumber: "",

    lockerName: "",

    defaultRackCapacity: "",

    status: "ACTIVE",
  };
}

function createEmptyRackDraft(): RackDraft {
  return {
    id: "",

    lockerId: "",

    rackNumber: "",

    rackName: "",

    capacity: "",

    status: "ACTIVE",
  };
}

// ============================================================
// CONFIGURATION ID
// ============================================================

function createConfigurationId(prefix: string): string {
  const cryptoObject = globalThis.crypto as
    | (Crypto & {
        randomUUID?: () => string;
      })
    | undefined;

  const uuid = cryptoObject?.randomUUID?.();

  if (uuid) {
    return `${prefix}-${uuid}`;
  }

  return [
    prefix,

    Date.now().toString(36),

    Math.random().toString(36).slice(2, 10),
  ].join("-");
}

// ============================================================
// POSITIVE INTEGER
// ============================================================

function parsePositiveInteger(value: string): number | null {
  const numeric = Number(value);

  if (!Number.isInteger(numeric) || numeric <= 0) {
    return null;
  }

  return numeric;
}

// ============================================================
// SYNCHRONIZE DERIVED COUNTS
// ============================================================
//
// lockerCount and rackCount are derived from the actual
// configured hierarchy.
//
// They are never manually entered by the owner.
// ============================================================

function synchronizeConfigurationCounts(
  settings: GoldStorageSettings,
): GoldStorageSettings {
  const rooms = settings.rooms.map((room) => {
    const lockerCount = settings.lockers.filter(
      (locker) => locker.roomId === room.id,
    ).length;

    return {
      ...room,

      lockerCount,
    };
  });

  const lockers = settings.lockers.map((locker) => {
    const rackCount = settings.racks.filter(
      (rack) => rack.lockerId === locker.id,
    ).length;

    return {
      ...locker,

      rackCount,
    };
  });

  return {
    ...settings,

    rooms,

    lockers,
  };
}

// ============================================================
// SORT HELPERS
// ============================================================

function sortRooms(rooms: GoldRoomConfiguration[]): GoldRoomConfiguration[] {
  return [...rooms].sort((left, right) => left.roomNumber - right.roomNumber);
}

function sortLockers(
  lockers: GoldLockerConfiguration[],
): GoldLockerConfiguration[] {
  return [...lockers].sort((left, right) => {
    if (left.roomId !== right.roomId) {
      return left.roomId.localeCompare(right.roomId);
    }

    return left.lockerNumber - right.lockerNumber;
  });
}

function sortRacks(racks: GoldRackConfiguration[]): GoldRackConfiguration[] {
  return [...racks].sort((left, right) => {
    if (left.lockerId !== right.lockerId) {
      return left.lockerId.localeCompare(right.lockerId);
    }

    return left.rackNumber - right.rackNumber;
  });
}

// ============================================================
// COMPONENT
// ============================================================

export default function GoldStorageSettingsPage() {
  // ==========================================================
  // THEME ENGINE
  // ==========================================================

  const { theme } = useTheme();

  const themeVariables = createGoldStorageThemeVariables(theme);

  // ==========================================================
  // RESPONSIVE ENGINE
  // ==========================================================

  const responsive = useResponsive();

  const styles = getGoldStorageSettingsStyles({
    tokens: responsive.tokens,

    isMobile: responsive.isMobile,

    isTablet: responsive.isTablet,

    isLaptop: responsive.isLaptop,

    isDesktop: responsive.isDesktop,
  });

  const actionIconSize = responsive.tokens.button.iconSize;

  // ==========================================================
  // BUSINESS CONTEXT
  // ==========================================================

  const businessContext = getBusinessContext();

  const updatedBy = businessContext?.ownerId ?? "";

  // ==========================================================
  // STATE
  // ==========================================================

  const [settings, setSettings] = useState<GoldStorageSettings>(() =>
    createEmptyGoldStorageSettings(updatedBy),
  );

  const [selectedSection, setSelectedSection] =
    useState<SettingsSection>("ROOMS");

  const [roomDraft, setRoomDraft] = useState<RoomDraft>(createEmptyRoomDraft);

  const [lockerDraft, setLockerDraft] = useState<LockerDraft>(
    createEmptyLockerDraft,
  );

  const [rackDraft, setRackDraft] = useState<RackDraft>(createEmptyRackDraft);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [dirty, setDirty] = useState(false);

  const [feedback, setFeedback] = useState<SettingsFeedback | null>(null);

  // ==========================================================
  // SORTED CONFIGURATION
  // ==========================================================

  const rooms = useMemo(() => sortRooms(settings.rooms), [settings.rooms]);

  const lockers = useMemo(
    () => sortLockers(settings.lockers),
    [settings.lockers],
  );

  const racks = useMemo(() => sortRacks(settings.racks), [settings.racks]);

  // ==========================================================
  // TOTAL CAPACITY
  // ==========================================================

  const totalBagCapacity = useMemo(
    () => settings.racks.reduce((total, rack) => total + rack.capacity, 0),
    [settings.racks],
  );

  // ==========================================================
  // RELATION HELPERS
  // ==========================================================

  function getRoomName(roomId: string): string {
    const room = settings.rooms.find((item) => item.id === roomId);

    if (!room) {
      return "Unknown Room";
    }

    return room.roomName || `Room ${room.roomNumber}`;
  }

  function getLockerName(lockerId: string): string {
    const locker = settings.lockers.find((item) => item.id === lockerId);

    if (!locker) {
      return "Unknown Locker";
    }

    return locker.lockerName || `Locker ${locker.lockerNumber}`;
  }

  // ==========================================================
  // APPLY SETTINGS CHANGE
  // ==========================================================

  function applySettingsChange(nextSettings: GoldStorageSettings): void {
    setSettings(synchronizeConfigurationCounts(nextSettings));

    setDirty(true);

    setFeedback(null);
  }

  // ==========================================================
  // LOAD SETTINGS
  // ==========================================================

  const handleLoadSettings = useCallback(async () => {
    setLoading(true);

    setFeedback(null);

    const result = await loadGoldStorageSettings();

    if (!result.success) {
      setLoading(false);

      setFeedback({
        kind: "DANGER",

        title: "Unable to load Gold Storage",

        text: result.error ?? "Gold Storage Settings could not be loaded.",
      });

      return;
    }

    if (!result.data) {
      setSettings(
        createEmptyGoldStorageSettings(getBusinessContext()?.ownerId ?? ""),
      );

      setDirty(false);

      setLoading(false);

      setFeedback({
        kind: "WARNING",

        title: "Gold Storage is not configured",

        text: "Add Locker Rooms, Lockers and Racks, then save the configuration.",
      });

      return;
    }

    setSettings(synchronizeConfigurationCounts(result.data));

    setRoomDraft(createEmptyRoomDraft());

    setLockerDraft(createEmptyLockerDraft());

    setRackDraft(createEmptyRackDraft());

    setDirty(false);

    setLoading(false);

    setFeedback({
      kind: "SUCCESS",

      title: "Gold Storage loaded",

      text: "Saved Locker Room configuration is ready.",
    });
  }, []);

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    void handleLoadSettings();
  }, [handleLoadSettings]);

  // ==========================================================
  // ROOM SAVE
  // ==========================================================

  function handleSaveRoom(): void {
    const roomNumber = parsePositiveInteger(roomDraft.roomNumber);

    const roomName = roomDraft.roomName.trim();

    if (!roomNumber) {
      setFeedback({
        kind: "DANGER",

        title: "Invalid Room Number",

        text: "Room Number must be a positive whole number.",
      });

      return;
    }

    if (!roomName) {
      setFeedback({
        kind: "DANGER",

        title: "Room Name required",

        text: "Enter a name for the Locker Room.",
      });

      return;
    }

    const duplicate = settings.rooms.some(
      (room) => room.roomNumber === roomNumber && room.id !== roomDraft.id,
    );

    if (duplicate) {
      setFeedback({
        kind: "DANGER",

        title: "Duplicate Room Number",

        text: `Room ${roomNumber} is already configured.`,
      });

      return;
    }

    const now = new Date().toISOString();

    if (roomDraft.id) {
      const nextRooms = settings.rooms.map((room) =>
        room.id === roomDraft.id
          ? {
              ...room,

              roomNumber,

              roomName,

              status: roomDraft.status,

              updatedAt: now,
            }
          : room,
      );

      applySettingsChange({
        ...settings,

        rooms: nextRooms,
      });
    } else {
      const room: GoldRoomConfiguration = {
        id: createConfigurationId("gold-room"),

        roomNumber,

        roomName,

        lockerCount: 0,

        status: roomDraft.status,

        createdAt: now,

        updatedAt: now,
      };

      applySettingsChange({
        ...settings,

        rooms: [...settings.rooms, room],
      });
    }

    setRoomDraft(createEmptyRoomDraft());

    setFeedback({
      kind: "SUCCESS",

      title: roomDraft.id ? "Locker Room updated" : "Locker Room added",

      text: "Save Gold Storage Settings to persist this change.",
    });
  }

  // ==========================================================
  // ROOM EDIT
  // ==========================================================

  function handleEditRoom(room: GoldRoomConfiguration): void {
    setSelectedSection("ROOMS");

    setRoomDraft({
      id: room.id,

      roomNumber: String(room.roomNumber),

      roomName: room.roomName,

      status: room.status,
    });
  }

  // ==========================================================
  // ROOM DELETE
  //
  // Configuration-level cascade:
  //
  // Room
  //   -> Lockers
  //      -> Racks
  //
  // Active custody protection is added when persistent
  // allocation records are wired in Step 27.
  // ==========================================================

  async function handleDeleteRoom(room: GoldRoomConfiguration): Promise<void> {
    const lockerIds = new Set(
      settings.lockers
        .filter((locker) => locker.roomId === room.id)
        .map((locker) => locker.id),
    );

    const nextSettings = synchronizeConfigurationCounts({
      ...settings,

      rooms: settings.rooms.filter((item) => item.id !== room.id),

      lockers: settings.lockers.filter((locker) => locker.roomId !== room.id),

      racks: settings.racks.filter((rack) => !lockerIds.has(rack.lockerId)),
    });

    /*
     * Check active Gold custody before changing the local draft.
     * Save Settings performs the authoritative guard again.
     */
    const custodyValidation =
      await validateGoldStorageSettingsCustodyIntegrity(nextSettings);

    if (!custodyValidation.success) {
      setFeedback({
        kind: "DANGER",

        title: "Locker Room cannot be removed",

        text:
          custodyValidation.error ??
          "This Locker Room is currently required by active Gold custody.",
      });

      return;
    }

    const confirmed = window.confirm(
      `Delete "${room.roomName}" and its configured Lockers and Racks?`,
    );

    if (!confirmed) {
      return;
    }

    applySettingsChange(nextSettings);

    if (roomDraft.id === room.id) {
      setRoomDraft(createEmptyRoomDraft());
    }

    setFeedback({
      kind: "WARNING",

      title: "Locker Room removed",

      text: "The configuration change is not persisted until Save Settings is pressed.",
    });
  }
  // ==========================================================
  // LOCKER SAVE
  // ==========================================================

  function handleSaveLocker(): void {
    const roomId = lockerDraft.roomId.trim();

    const lockerNumber = parsePositiveInteger(lockerDraft.lockerNumber);

    const lockerName = lockerDraft.lockerName.trim();

    const defaultRackCapacity = parsePositiveInteger(
      lockerDraft.defaultRackCapacity,
    );

    if (!roomId || !settings.rooms.some((room) => room.id === roomId)) {
      setFeedback({
        kind: "DANGER",

        title: "Locker Room required",

        text: "Select the Locker Room that physically contains this Locker.",
      });

      return;
    }

    if (!lockerNumber) {
      setFeedback({
        kind: "DANGER",

        title: "Invalid Locker Number",

        text: "Locker Number must be a positive whole number.",
      });

      return;
    }

    if (!lockerName) {
      setFeedback({
        kind: "DANGER",

        title: "Locker Name required",

        text: "Enter a name for the Locker / Beeruva.",
      });

      return;
    }

    if (!defaultRackCapacity) {
      setFeedback({
        kind: "DANGER",

        title: "Invalid default capacity",

        text: "Default Rack Capacity must be a positive whole number.",
      });

      return;
    }

    const duplicate = settings.lockers.some(
      (locker) =>
        locker.roomId === roomId &&
        locker.lockerNumber === lockerNumber &&
        locker.id !== lockerDraft.id,
    );

    if (duplicate) {
      setFeedback({
        kind: "DANGER",

        title: "Duplicate Locker Number",

        text: `Locker ${lockerNumber} already exists inside the selected Locker Room.`,
      });

      return;
    }

    const now = new Date().toISOString();

    if (lockerDraft.id) {
      const nextLockers = settings.lockers.map((locker) =>
        locker.id === lockerDraft.id
          ? {
              ...locker,

              roomId,

              lockerNumber,

              lockerName,

              defaultRackCapacity,

              status: lockerDraft.status,

              updatedAt: now,
            }
          : locker,
      );

      applySettingsChange({
        ...settings,

        lockers: nextLockers,
      });
    } else {
      const locker: GoldLockerConfiguration = {
        id: createConfigurationId("gold-locker"),

        lockerNumber,

        lockerName,

        roomId,

        rackCount: 0,

        defaultRackCapacity,

        status: lockerDraft.status,

        createdAt: now,

        updatedAt: now,
      };

      applySettingsChange({
        ...settings,

        lockers: [...settings.lockers, locker],
      });
    }

    setLockerDraft(createEmptyLockerDraft());

    setFeedback({
      kind: "SUCCESS",

      title: lockerDraft.id ? "Locker updated" : "Locker added",

      text: "Save Gold Storage Settings to persist this change.",
    });
  }

  // ==========================================================
  // LOCKER EDIT
  // ==========================================================

  function handleEditLocker(locker: GoldLockerConfiguration): void {
    setSelectedSection("LOCKERS");

    setLockerDraft({
      id: locker.id,

      roomId: locker.roomId,

      lockerNumber: String(locker.lockerNumber),

      lockerName: locker.lockerName,

      defaultRackCapacity: String(locker.defaultRackCapacity),

      status: locker.status,
    });
  }

  // ==========================================================
  // LOCKER DELETE
  // ==========================================================

  async function handleDeleteLocker(
    locker: GoldLockerConfiguration,
  ): Promise<void> {
    const nextSettings = synchronizeConfigurationCounts({
      ...settings,

      lockers: settings.lockers.filter((item) => item.id !== locker.id),

      racks: settings.racks.filter((rack) => rack.lockerId !== locker.id),
    });

    /*
     * Check active Gold custody before changing the local draft.
     * Save Settings performs the authoritative guard again.
     */
    const custodyValidation =
      await validateGoldStorageSettingsCustodyIntegrity(nextSettings);

    if (!custodyValidation.success) {
      setFeedback({
        kind: "DANGER",

        title: "Locker cannot be removed",

        text:
          custodyValidation.error ??
          "This Locker is currently required by active Gold custody.",
      });

      return;
    }

    const confirmed = window.confirm(
      `Delete "${locker.lockerName}" and all Racks configured inside it?`,
    );

    if (!confirmed) {
      return;
    }

    applySettingsChange(nextSettings);

    if (lockerDraft.id === locker.id) {
      setLockerDraft(createEmptyLockerDraft());
    }

    setFeedback({
      kind: "WARNING",

      title: "Locker removed",

      text: "The configuration change is not persisted until Save Settings is pressed.",
    });
  }

  // ==========================================================
  // RACK SAVE
  // ==========================================================

  function handleSaveRack(): void {
    const lockerId = rackDraft.lockerId.trim();

    const rackNumber = parsePositiveInteger(rackDraft.rackNumber);

    const rackName = rackDraft.rackName.trim();

    const capacity = parsePositiveInteger(rackDraft.capacity);

    if (
      !lockerId ||
      !settings.lockers.some((locker) => locker.id === lockerId)
    ) {
      setFeedback({
        kind: "DANGER",

        title: "Locker required",

        text: "Select the Locker / Beeruva that physically contains this Rack.",
      });

      return;
    }

    if (!rackNumber) {
      setFeedback({
        kind: "DANGER",

        title: "Invalid Rack Number",

        text: "Rack Number must be a positive whole number.",
      });

      return;
    }

    if (!rackName) {
      setFeedback({
        kind: "DANGER",

        title: "Rack Name required",

        text: "Enter a name for the Rack.",
      });

      return;
    }

    if (!capacity) {
      setFeedback({
        kind: "DANGER",

        title: "Invalid Rack Capacity",

        text: "Rack Capacity must be a positive whole number.",
      });

      return;
    }

    const duplicate = settings.racks.some(
      (rack) =>
        rack.lockerId === lockerId &&
        rack.rackNumber === rackNumber &&
        rack.id !== rackDraft.id,
    );

    if (duplicate) {
      setFeedback({
        kind: "DANGER",

        title: "Duplicate Rack Number",

        text: `Rack ${rackNumber} already exists inside the selected Locker.`,
      });

      return;
    }

    const now = new Date().toISOString();

    if (rackDraft.id) {
      const nextRacks = settings.racks.map((rack) =>
        rack.id === rackDraft.id
          ? {
              ...rack,

              lockerId,

              rackNumber,

              rackName,

              capacity,

              status: rackDraft.status,

              updatedAt: now,
            }
          : rack,
      );

      applySettingsChange({
        ...settings,

        racks: nextRacks,
      });
    } else {
      const rack: GoldRackConfiguration = {
        id: createConfigurationId("gold-rack"),

        rackNumber,

        rackName,

        lockerId,

        capacity,

        status: rackDraft.status,

        createdAt: now,

        updatedAt: now,
      };

      applySettingsChange({
        ...settings,

        racks: [...settings.racks, rack],
      });
    }

    setRackDraft(createEmptyRackDraft());

    setFeedback({
      kind: "SUCCESS",

      title: rackDraft.id ? "Rack updated" : "Rack added",

      text: "Save Gold Storage Settings to persist this change.",
    });
  }

  // ==========================================================
  // RACK EDIT
  // ==========================================================

  function handleEditRack(rack: GoldRackConfiguration): void {
    setSelectedSection("RACKS");

    setRackDraft({
      id: rack.id,

      lockerId: rack.lockerId,

      rackNumber: String(rack.rackNumber),

      rackName: rack.rackName,

      capacity: String(rack.capacity),

      status: rack.status,
    });
  }

  // ==========================================================
  // RACK DELETE
  // ==========================================================

  async function handleDeleteRack(rack: GoldRackConfiguration): Promise<void> {
    const nextSettings = synchronizeConfigurationCounts({
      ...settings,

      racks: settings.racks.filter((item) => item.id !== rack.id),
    });

    /*
     * Active Gold custody must be checked BEFORE changing
     * the local Settings draft.
     *
     * The Save service performs the same authoritative guard
     * again, so this is an immediate UX preflight only.
     */
    const custodyValidation =
      await validateGoldStorageSettingsCustodyIntegrity(nextSettings);

    if (!custodyValidation.success) {
      setFeedback({
        kind: "DANGER",

        title: "Rack cannot be removed",

        text:
          custodyValidation.error ??
          "This Rack is currently required by active Gold custody.",
      });

      return;
    }

    const confirmed = window.confirm(
      `Delete "${rack.rackName}" from the Gold Storage configuration?`,
    );

    if (!confirmed) {
      return;
    }

    applySettingsChange(nextSettings);

    if (rackDraft.id === rack.id) {
      setRackDraft(createEmptyRackDraft());
    }

    setFeedback({
      kind: "WARNING",

      title: "Rack removed",

      text: "The configuration change is not persisted until Save Settings is pressed.",
    });
  }

  // ==========================================================
  // SAVE ALL SETTINGS
  // ==========================================================

  async function handleSaveSettings(): Promise<void> {
    if (saving) {
      return;
    }

    const preparedSettings = synchronizeConfigurationCounts(settings);

    const validation = validateGoldStorageSettings(preparedSettings);

    if (!validation.valid) {
      setFeedback({
        kind: "DANGER",

        title: "Gold Storage validation failed",

        text:
          validation.errors[0]?.message ??
          "Review the Gold Storage configuration.",
      });

      return;
    }

    if (!updatedBy) {
      setFeedback({
        kind: "DANGER",

        title: "Business Context unavailable",

        text: "An active FINORA owner context is required before Gold Storage Settings can be saved.",
      });

      return;
    }

    setSaving(true);

    setFeedback(null);

    const result = await saveGoldStorageSettings(
      preparedSettings,

      updatedBy,
    );

    setSaving(false);

    if (!result.success) {
      setFeedback({
        kind: "DANGER",

        title: "Unable to save Gold Storage",

        text: result.error ?? "Gold Storage Settings could not be saved.",
      });

      return;
    }

    setSettings(
      synchronizeConfigurationCounts(result.data ?? preparedSettings),
    );

    setDirty(false);

    setFeedback({
      kind: "SUCCESS",

      title: "Gold Storage Settings saved",

      text: "Locker Room, Locker, Rack and capacity configuration has been persisted.",
    });
  }

  // ==========================================================
  // STATUS CHIP STYLE
  // ==========================================================

  function getStatusChipStyle(status: GoldStorageStatus): CSSProperties {
    if (status === "MAINTENANCE") {
      return {
        ...styles.statusChip,
        ...styles.maintenanceStatusChip,
      };
    }

    if (status === "INACTIVE") {
      return {
        ...styles.statusChip,
        ...styles.inactiveStatusChip,
      };
    }

    return styles.statusChip;
  }

  // ==========================================================
  // FEEDBACK STYLE
  // ==========================================================

  function getFeedbackStyle(kind: FeedbackKind): CSSProperties {
    if (kind === "SUCCESS") {
      return {
        ...styles.statusBanner,
        ...styles.successBanner,
      };
    }

    if (kind === "DANGER") {
      return {
        ...styles.statusBanner,
        ...styles.dangerBanner,
      };
    }

    return {
      ...styles.statusBanner,
      ...styles.warningBanner,
    };
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div
      style={{
        ...styles.page,
        ...themeVariables,
      }}
    >
      <div style={styles.pageInner}>
        {/* ==================================================
            HEADER
        ================================================== */}

        <header style={styles.header}>
          <div style={styles.headerContent}>
            <span style={styles.eyebrow}>GOLD LOAN ENGINE™</span>

            <h1 style={styles.title}>Gold Storage Settings</h1>

            <p style={styles.subtitle}>
              Configure the physical Locker Room → Locker → Rack hierarchy used
              for Gold Loan custody. Rack capacity represents the number of Gold
              bags or packets that may be stored in that Rack.
            </p>
          </div>

          <div style={styles.headerActions}>
            <button
              type="button"
              style={{
                ...styles.secondaryButton,
                ...styles.mobileFullButton,
              }}
              disabled={loading || saving}
              onClick={() => void handleLoadSettings()}
            >
              <RefreshCw size={actionIconSize} />
              Reload Saved
            </button>

            <button
              type="button"
              style={{
                ...styles.primaryButton,
                ...styles.mobileFullButton,
                ...(saving ? styles.disabledButton : {}),
              }}
              disabled={saving}
              onClick={() => void handleSaveSettings()}
            >
              <Save size={actionIconSize} />

              {saving ? "Saving..." : dirty ? "Save Settings" : "Saved"}
            </button>
          </div>
        </header>

        {/* ==================================================
            SUMMARY
        ================================================== */}

        <div style={styles.summaryGrid}>
          <div style={styles.summaryCard}>
            <span style={styles.summaryLabel}>Locker Rooms</span>

            <span style={styles.summaryValue}>{settings.rooms.length}</span>
          </div>

          <div style={styles.summaryCard}>
            <span style={styles.summaryLabel}>Lockers / Beeruvas</span>

            <span style={styles.summaryValue}>{settings.lockers.length}</span>
          </div>

          <div style={styles.summaryCard}>
            <span style={styles.summaryLabel}>Racks</span>

            <span style={styles.summaryValue}>{settings.racks.length}</span>
          </div>

          <div style={styles.summaryCard}>
            <span style={styles.summaryLabel}>Bag Capacity</span>

            <span style={styles.summaryValue}>{totalBagCapacity}</span>
          </div>
        </div>

        {/* ==================================================
            FEEDBACK
        ================================================== */}

        {feedback && (
          <div style={getFeedbackStyle(feedback.kind)}>
            {feedback.kind === "SUCCESS" ? (
              <CircleCheck
                size={responsive.tokens.icon.md}
                style={styles.statusIcon}
              />
            ) : (
              <TriangleAlert
                size={responsive.tokens.icon.md}
                style={styles.statusIcon}
              />
            )}

            <div style={styles.statusContent}>
              <span style={styles.statusTitle}>{feedback.title}</span>

              <span style={styles.statusText}>{feedback.text}</span>
            </div>
          </div>
        )}

        {/* ==================================================
            LOADING
        ================================================== */}

        {loading ? (
          <div style={styles.loadingState}>
            Loading Gold Storage Settings...
          </div>
        ) : (
          <div style={styles.workspace}>
            {/* ==============================================
                NAVIGATOR
            ============================================== */}

            <aside style={styles.navigator}>
              <div style={styles.navigatorHeader}>
                <h2 style={styles.navigatorTitle}>Storage Geometry</h2>

                <Warehouse size={responsive.tokens.icon.lg} />
              </div>

              <p style={styles.navigatorSubtitle}>
                Configure each physical level independently.
              </p>

              <div style={styles.navigatorList}>
                <button
                  type="button"
                  style={{
                    ...styles.navigatorItem,
                    ...(selectedSection === "ROOMS"
                      ? styles.navigatorItemActive
                      : {}),
                  }}
                  onClick={() => setSelectedSection("ROOMS")}
                >
                  <span style={styles.navigatorItemLabel}>Locker Rooms</span>

                  <span style={styles.navigatorItemCount}>
                    {settings.rooms.length}
                  </span>
                </button>

                <button
                  type="button"
                  style={{
                    ...styles.navigatorItem,
                    ...(selectedSection === "LOCKERS"
                      ? styles.navigatorItemActive
                      : {}),
                  }}
                  onClick={() => setSelectedSection("LOCKERS")}
                >
                  <span style={styles.navigatorItemLabel}>
                    Lockers / Beeruvas
                  </span>

                  <span style={styles.navigatorItemCount}>
                    {settings.lockers.length}
                  </span>
                </button>

                <button
                  type="button"
                  style={{
                    ...styles.navigatorItem,
                    ...(selectedSection === "RACKS"
                      ? styles.navigatorItemActive
                      : {}),
                  }}
                  onClick={() => setSelectedSection("RACKS")}
                >
                  <span style={styles.navigatorItemLabel}>Racks</span>

                  <span style={styles.navigatorItemCount}>
                    {settings.racks.length}
                  </span>
                </button>
              </div>
            </aside>

            {/* ==============================================
                EDITOR
            ============================================== */}

            <main style={styles.editor}>
              {/* ============================================
                  ROOMS
              ============================================ */}

              {selectedSection === "ROOMS" && (
                <>
                  <div style={styles.editorHeader}>
                    <div style={styles.editorHeading}>
                      <h2 style={styles.editorTitle}>Locker Rooms</h2>

                      <p style={styles.editorSubtitle}>
                        Add any number of physical Gold Locker Rooms.
                      </p>
                    </div>

                    <Warehouse size={responsive.tokens.icon.lg} />
                  </div>

                  <section style={styles.section}>
                    <div style={styles.sectionHeader}>
                      <div style={styles.sectionHeading}>
                        <h3 style={styles.sectionTitle}>
                          {roomDraft.id
                            ? "Edit Locker Room"
                            : "Add Locker Room"}
                        </h3>

                        <p style={styles.sectionSubtitle}>
                          Room numbering and naming are controlled by the owner.
                        </p>
                      </div>
                    </div>

                    <div style={styles.formGrid}>
                      <label style={styles.field}>
                        <span style={styles.label}>
                          Room Number
                          <span style={styles.requiredMark}>*</span>
                        </span>

                        <input
                          type="number"
                          min="1"
                          step="1"
                          style={styles.input}
                          value={roomDraft.roomNumber}
                          onChange={(event) =>
                            setRoomDraft((current) => ({
                              ...current,

                              roomNumber: event.target.value,
                            }))
                          }
                        />
                      </label>

                      <label style={styles.field}>
                        <span style={styles.label}>
                          Room Name
                          <span style={styles.requiredMark}>*</span>
                        </span>

                        <input
                          type="text"
                          style={styles.input}
                          value={roomDraft.roomName}
                          onChange={(event) =>
                            setRoomDraft((current) => ({
                              ...current,

                              roomName: event.target.value,
                            }))
                          }
                        />
                      </label>

                      <label style={styles.field}>
                        <span style={styles.label}>Status</span>

                        <select
                          style={styles.select}
                          value={roomDraft.status}
                          onChange={(event) =>
                            setRoomDraft((current) => ({
                              ...current,

                              status: event.target.value as GoldStorageStatus,
                            }))
                          }
                        >
                          <option value="ACTIVE">ACTIVE</option>

                          <option value="INACTIVE">INACTIVE</option>

                          <option value="MAINTENANCE">MAINTENANCE</option>
                        </select>
                      </label>
                    </div>

                    <div style={styles.saveFooter}>
                      <p style={styles.saveFooterText}>
                        Locker count is calculated automatically from configured
                        Lockers.
                      </p>

                      <div style={styles.saveFooterActions}>
                        {roomDraft.id && (
                          <button
                            type="button"
                            style={styles.secondaryButton}
                            onClick={() => setRoomDraft(createEmptyRoomDraft())}
                          >
                            Cancel Edit
                          </button>
                        )}

                        <button
                          type="button"
                          style={styles.primaryButton}
                          onClick={handleSaveRoom}
                        >
                          <Plus size={actionIconSize} />

                          {roomDraft.id ? "Update Room" : "Add Room"}
                        </button>
                      </div>
                    </div>
                  </section>

                  <section style={styles.section}>
                    <div style={styles.sectionHeader}>
                      <div style={styles.sectionHeading}>
                        <h3 style={styles.sectionTitle}>
                          Configured Locker Rooms
                        </h3>
                      </div>
                    </div>

                    {rooms.length === 0 ? (
                      <div style={styles.emptyState}>
                        <Warehouse style={styles.emptyStateIcon} />

                        <h3 style={styles.emptyStateTitle}>
                          No Locker Rooms Configured
                        </h3>

                        <p style={styles.emptyStateText}>
                          Add the first physical Locker Room above.
                        </p>
                      </div>
                    ) : (
                      <div style={styles.roomGrid}>
                        {rooms.map((room) => (
                          <article
                            key={room.id}
                            style={styles.configurationCard}
                          >
                            <div style={styles.configurationCardHeader}>
                              <div style={styles.configurationCardIdentity}>
                                <h4 style={styles.configurationCardTitle}>
                                  {room.roomName}
                                </h4>

                                <p style={styles.configurationCardSubtitle}>
                                  Room {room.roomNumber}
                                </p>
                              </div>

                              <span style={getStatusChipStyle(room.status)}>
                                {room.status}
                              </span>
                            </div>

                            <div style={styles.configurationMeta}>
                              <span style={styles.configurationMetric}>
                                <LockKeyhole size={14} />
                                {room.lockerCount} Lockers
                              </span>
                            </div>

                            <div style={styles.editorActions}>
                              <button
                                type="button"
                                style={styles.secondaryButton}
                                onClick={() => handleEditRoom(room)}
                              >
                                <Pencil size={actionIconSize} />
                                Edit
                              </button>

                              <button
                                type="button"
                                style={styles.dangerButton}
                                onClick={() => void handleDeleteRoom(room)}
                              >
                                <Trash2 size={actionIconSize} />
                                Delete
                              </button>
                            </div>
                          </article>
                        ))}
                      </div>
                    )}
                  </section>
                </>
              )}

              {/* ============================================
                  LOCKERS
              ============================================ */}

              {selectedSection === "LOCKERS" && (
                <>
                  <div style={styles.editorHeader}>
                    <div style={styles.editorHeading}>
                      <h2 style={styles.editorTitle}>Lockers / Beeruvas</h2>

                      <p style={styles.editorSubtitle}>
                        Each Locker belongs to exactly one Locker Room.
                      </p>
                    </div>

                    <LockKeyhole size={responsive.tokens.icon.lg} />
                  </div>

                  <section style={styles.section}>
                    <div style={styles.formGrid}>
                      <label style={styles.field}>
                        <span style={styles.label}>
                          Locker Room
                          <span style={styles.requiredMark}>*</span>
                        </span>

                        <select
                          style={styles.select}
                          value={lockerDraft.roomId}
                          onChange={(event) =>
                            setLockerDraft((current) => ({
                              ...current,

                              roomId: event.target.value,
                            }))
                          }
                        >
                          <option value="">Select Locker Room</option>

                          {rooms.map((room) => (
                            <option key={room.id} value={room.id}>
                              {room.roomNumber} - {room.roomName}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label style={styles.field}>
                        <span style={styles.label}>
                          Locker Number
                          <span style={styles.requiredMark}>*</span>
                        </span>

                        <input
                          type="number"
                          min="1"
                          step="1"
                          style={styles.input}
                          value={lockerDraft.lockerNumber}
                          onChange={(event) =>
                            setLockerDraft((current) => ({
                              ...current,

                              lockerNumber: event.target.value,
                            }))
                          }
                        />
                      </label>

                      <label style={styles.field}>
                        <span style={styles.label}>
                          Locker Name
                          <span style={styles.requiredMark}>*</span>
                        </span>

                        <input
                          type="text"
                          style={styles.input}
                          value={lockerDraft.lockerName}
                          onChange={(event) =>
                            setLockerDraft((current) => ({
                              ...current,

                              lockerName: event.target.value,
                            }))
                          }
                        />
                      </label>

                      <label style={styles.field}>
                        <span style={styles.label}>
                          Default Rack Capacity
                          <span style={styles.requiredMark}>*</span>
                        </span>

                        <input
                          type="number"
                          min="1"
                          step="1"
                          style={styles.input}
                          value={lockerDraft.defaultRackCapacity}
                          onChange={(event) =>
                            setLockerDraft((current) => ({
                              ...current,

                              defaultRackCapacity: event.target.value,
                            }))
                          }
                        />

                        <p style={styles.helperText}>
                          Used as the owner's preferred capacity when creating
                          Racks. Each Rack may still have its own capacity.
                        </p>
                      </label>

                      <label style={styles.field}>
                        <span style={styles.label}>Status</span>

                        <select
                          style={styles.select}
                          value={lockerDraft.status}
                          onChange={(event) =>
                            setLockerDraft((current) => ({
                              ...current,

                              status: event.target.value as GoldStorageStatus,
                            }))
                          }
                        >
                          <option value="ACTIVE">ACTIVE</option>

                          <option value="INACTIVE">INACTIVE</option>

                          <option value="MAINTENANCE">MAINTENANCE</option>
                        </select>
                      </label>
                    </div>

                    <div style={styles.saveFooter}>
                      <p style={styles.saveFooterText}>
                        Rack count is derived automatically from the Racks
                        assigned to this Locker.
                      </p>

                      <div style={styles.saveFooterActions}>
                        {lockerDraft.id && (
                          <button
                            type="button"
                            style={styles.secondaryButton}
                            onClick={() =>
                              setLockerDraft(createEmptyLockerDraft())
                            }
                          >
                            Cancel Edit
                          </button>
                        )}

                        <button
                          type="button"
                          style={{
                            ...styles.primaryButton,
                            ...(rooms.length === 0
                              ? styles.disabledButton
                              : {}),
                          }}
                          disabled={rooms.length === 0}
                          onClick={handleSaveLocker}
                        >
                          <Plus size={actionIconSize} />

                          {lockerDraft.id ? "Update Locker" : "Add Locker"}
                        </button>
                      </div>
                    </div>
                  </section>

                  <section style={styles.section}>
                    {lockers.length === 0 ? (
                      <div style={styles.emptyState}>
                        <LockKeyhole style={styles.emptyStateIcon} />

                        <h3 style={styles.emptyStateTitle}>
                          No Lockers Configured
                        </h3>

                        <p style={styles.emptyStateText}>
                          Create a Locker Room first, then add its Lockers /
                          Beeruvas.
                        </p>
                      </div>
                    ) : (
                      <div style={styles.lockerGrid}>
                        {lockers.map((locker) => (
                          <article
                            key={locker.id}
                            style={styles.configurationCard}
                          >
                            <div style={styles.configurationCardHeader}>
                              <div style={styles.configurationCardIdentity}>
                                <h4 style={styles.configurationCardTitle}>
                                  {locker.lockerName}
                                </h4>

                                <p style={styles.configurationCardSubtitle}>
                                  {getRoomName(locker.roomId)} • Locker{" "}
                                  {locker.lockerNumber}
                                </p>
                              </div>

                              <span style={getStatusChipStyle(locker.status)}>
                                {locker.status}
                              </span>
                            </div>

                            <div style={styles.configurationMeta}>
                              <span style={styles.configurationMetric}>
                                <Rows3 size={14} />
                                {locker.rackCount} Racks
                              </span>

                              <span style={styles.configurationMetric}>
                                <Archive size={14} />
                                Default {locker.defaultRackCapacity}
                              </span>
                            </div>

                            <div style={styles.editorActions}>
                              <button
                                type="button"
                                style={styles.secondaryButton}
                                onClick={() => handleEditLocker(locker)}
                              >
                                <Pencil size={actionIconSize} />
                                Edit
                              </button>

                              <button
                                type="button"
                                style={styles.dangerButton}
                                onClick={() => void handleDeleteLocker(locker)}
                              >
                                <Trash2 size={actionIconSize} />
                                Delete
                              </button>
                            </div>
                          </article>
                        ))}
                      </div>
                    )}
                  </section>
                </>
              )}

              {/* ============================================
                  RACKS
              ============================================ */}

              {selectedSection === "RACKS" && (
                <>
                  <div style={styles.editorHeader}>
                    <div style={styles.editorHeading}>
                      <h2 style={styles.editorTitle}>Racks</h2>

                      <p style={styles.editorSubtitle}>
                        Each Rack belongs to a Locker and owns its exact Gold
                        bag capacity.
                      </p>
                    </div>

                    <Rows3 size={responsive.tokens.icon.lg} />
                  </div>

                  <section style={styles.section}>
                    <div style={styles.formGrid}>
                      <label style={styles.field}>
                        <span style={styles.label}>
                          Locker / Beeruva
                          <span style={styles.requiredMark}>*</span>
                        </span>

                        <select
                          style={styles.select}
                          value={rackDraft.lockerId}
                          onChange={(event) => {
                            const lockerId = event.target.value;

                            const locker = settings.lockers.find(
                              (item) => item.id === lockerId,
                            );

                            setRackDraft((current) => ({
                              ...current,

                              lockerId,

                              capacity:
                                current.capacity ||
                                (locker
                                  ? String(locker.defaultRackCapacity)
                                  : ""),
                            }));
                          }}
                        >
                          <option value="">Select Locker</option>

                          {lockers.map((locker) => (
                            <option key={locker.id} value={locker.id}>
                              {getRoomName(locker.roomId)} / {locker.lockerName}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label style={styles.field}>
                        <span style={styles.label}>
                          Rack Number
                          <span style={styles.requiredMark}>*</span>
                        </span>

                        <input
                          type="number"
                          min="1"
                          step="1"
                          style={styles.input}
                          value={rackDraft.rackNumber}
                          onChange={(event) =>
                            setRackDraft((current) => ({
                              ...current,

                              rackNumber: event.target.value,
                            }))
                          }
                        />
                      </label>

                      <label style={styles.field}>
                        <span style={styles.label}>
                          Rack Name
                          <span style={styles.requiredMark}>*</span>
                        </span>

                        <input
                          type="text"
                          style={styles.input}
                          value={rackDraft.rackName}
                          onChange={(event) =>
                            setRackDraft((current) => ({
                              ...current,

                              rackName: event.target.value,
                            }))
                          }
                        />
                      </label>

                      <label style={styles.field}>
                        <span style={styles.label}>
                          Bag / Packet Capacity
                          <span style={styles.requiredMark}>*</span>
                        </span>

                        <input
                          type="number"
                          min="1"
                          step="1"
                          style={styles.input}
                          value={rackDraft.capacity}
                          onChange={(event) =>
                            setRackDraft((current) => ({
                              ...current,

                              capacity: event.target.value,
                            }))
                          }
                        />
                      </label>

                      <label style={styles.field}>
                        <span style={styles.label}>Status</span>

                        <select
                          style={styles.select}
                          value={rackDraft.status}
                          onChange={(event) =>
                            setRackDraft((current) => ({
                              ...current,

                              status: event.target.value as GoldStorageStatus,
                            }))
                          }
                        >
                          <option value="ACTIVE">ACTIVE</option>

                          <option value="INACTIVE">INACTIVE</option>

                          <option value="MAINTENANCE">MAINTENANCE</option>
                        </select>
                      </label>
                    </div>

                    <div style={styles.saveFooter}>
                      <p style={styles.saveFooterText}>
                        Capacity is configured per Rack. The Locker default only
                        provides a starting value.
                      </p>

                      <div style={styles.saveFooterActions}>
                        {rackDraft.id && (
                          <button
                            type="button"
                            style={styles.secondaryButton}
                            onClick={() => setRackDraft(createEmptyRackDraft())}
                          >
                            Cancel Edit
                          </button>
                        )}

                        <button
                          type="button"
                          style={{
                            ...styles.primaryButton,
                            ...(lockers.length === 0
                              ? styles.disabledButton
                              : {}),
                          }}
                          disabled={lockers.length === 0}
                          onClick={handleSaveRack}
                        >
                          <Plus size={actionIconSize} />

                          {rackDraft.id ? "Update Rack" : "Add Rack"}
                        </button>
                      </div>
                    </div>
                  </section>

                  <section style={styles.section}>
                    {racks.length === 0 ? (
                      <div style={styles.emptyState}>
                        <Rows3 style={styles.emptyStateIcon} />

                        <h3 style={styles.emptyStateTitle}>
                          No Racks Configured
                        </h3>

                        <p style={styles.emptyStateText}>
                          Create a Locker first, then configure its physical
                          Racks and capacities.
                        </p>
                      </div>
                    ) : (
                      <div style={styles.rackGrid}>
                        {racks.map((rack) => (
                          <article
                            key={rack.id}
                            style={styles.configurationCard}
                          >
                            <div style={styles.configurationCardHeader}>
                              <div style={styles.configurationCardIdentity}>
                                <h4 style={styles.configurationCardTitle}>
                                  {rack.rackName}
                                </h4>

                                <p style={styles.configurationCardSubtitle}>
                                  {getLockerName(rack.lockerId)} • Rack{" "}
                                  {rack.rackNumber}
                                </p>
                              </div>

                              <span style={getStatusChipStyle(rack.status)}>
                                {rack.status}
                              </span>
                            </div>

                            <div style={styles.configurationMeta}>
                              <span style={styles.configurationMetric}>
                                <Boxes size={14} />
                                Capacity {rack.capacity}
                              </span>
                            </div>

                            <div style={styles.editorActions}>
                              <button
                                type="button"
                                style={styles.secondaryButton}
                                onClick={() => handleEditRack(rack)}
                              >
                                <Pencil size={actionIconSize} />
                                Edit
                              </button>

                              <button
                                type="button"
                                style={styles.dangerButton}
                                onClick={() => void handleDeleteRack(rack)}
                              >
                                <Trash2 size={actionIconSize} />
                                Delete
                              </button>
                            </div>
                          </article>
                        ))}
                      </div>
                    )}
                  </section>
                </>
              )}

              {/* ============================================
                  PERSISTENCE FOOTER
              ============================================ */}

              <div style={styles.saveFooter}>
                <p style={styles.saveFooterText}>
                  {dirty
                    ? "Unsaved Gold Storage configuration changes are waiting."
                    : "Gold Storage configuration matches the last saved state."}
                </p>

                <div style={styles.saveFooterActions}>
                  <button
                    type="button"
                    style={styles.secondaryButton}
                    disabled={loading || saving}
                    onClick={() => void handleLoadSettings()}
                  >
                    <RefreshCw size={actionIconSize} />
                    Discard / Reload
                  </button>

                  <button
                    type="button"
                    style={{
                      ...styles.primaryButton,
                      ...(saving ? styles.disabledButton : {}),
                    }}
                    disabled={saving}
                    onClick={() => void handleSaveSettings()}
                  >
                    <Save size={actionIconSize} />

                    {saving ? "Saving..." : "Save Settings"}
                  </button>
                </div>
              </div>
            </main>
          </div>
        )}

        <div style={styles.responsiveMeta} aria-hidden="true" />
      </div>
    </div>
  );
}

// ============================================================
// END
// ============================================================
