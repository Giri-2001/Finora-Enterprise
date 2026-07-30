const STORAGE_KEY = "finora_audit_retention";

export type AuditRetentionConfig = {
  id: string;

  retentionDays: number;

  autoArchiveEnabled: boolean;

  cleanupEnabled: boolean;

  updatedAt: string;

  updatedBy: string;
};

function loadConfig(): AuditRetentionConfig {
  try {
    const data = localStorage.getItem(STORAGE_KEY);

    if (!data) {
      const defaultConfig: AuditRetentionConfig = {
        id: "1",

        retentionDays: 365,

        autoArchiveEnabled: false,

        cleanupEnabled: false,

        updatedAt: new Date().toISOString(),

        updatedBy: "SYSTEM",
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultConfig));

      return defaultConfig;
    }

    return JSON.parse(data) as AuditRetentionConfig;
  } catch {
    return {
      id: "1",

      retentionDays: 365,

      autoArchiveEnabled: false,

      cleanupEnabled: false,

      updatedAt: new Date().toISOString(),

      updatedBy: "SYSTEM",
    };
  }
}

function saveConfig(config: AuditRetentionConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

let config: AuditRetentionConfig = loadConfig();

export function getAuditRetentionConfig(): AuditRetentionConfig {
  return {
    ...config,
  };
}

export function updateAuditRetentionConfig(
  data: Partial<AuditRetentionConfig>,
  updatedBy: string,
): void {
  config = {
    ...config,

    ...data,

    updatedAt: new Date().toISOString(),

    updatedBy,
  };

  saveConfig(config);
}

export function resetAuditRetentionConfig(): void {
  config = {
    id: "1",

    retentionDays: 365,

    autoArchiveEnabled: false,

    cleanupEnabled: false,

    updatedAt: new Date().toISOString(),

    updatedBy: "SYSTEM",
  };

  saveConfig(config);
}
