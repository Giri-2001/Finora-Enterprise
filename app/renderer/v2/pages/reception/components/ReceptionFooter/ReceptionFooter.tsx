/* ===========================================================
   FINORA ENTERPRISE
   RECEPTION FOOTER
=========================================================== */

import {
  Database,
} from "lucide-react";

import packageMetadata
  from "../../../../../../../package.json";

import {
  useResponsive,
} from "../../../../utils/responsive";

import {
  useTheme,
} from "../../../../themes/hooks";

import {
  getSession,
} from "../../../../store/authStore";

import {
  getBusinessContext,
} from "../../../../services/business/businessContextService";

import {
  createReceptionFooterStyles,
} from "./styles";


type FooterStorageMode =
  | "USB"
  | "LOCAL"
  | "—";

type StorageModeCarrier = {
  storageMode?: unknown;
};


function normalizeStorageMode(
  value: unknown,
): FooterStorageMode | undefined {

  const normalized =
    String(value ?? "")
      .trim()
      .toUpperCase();

  if (
    normalized === "USB" ||
    normalized === "LOCAL"
  ) {
    return normalized;
  }

  return undefined;
}


function resolveFooterStorageMode():
  FooterStorageMode {

  const businessContext =
    getBusinessContext() as
      | StorageModeCarrier
      | null
      | undefined;

  const session =
    getSession() as
      | StorageModeCarrier
      | null
      | undefined;

  let sessionStorageMode:
    string | null = null;

  try {
    sessionStorageMode =
      window.sessionStorage.getItem(
        "FINORA_STORAGE_MODE",
      );
  } catch {
    sessionStorageMode = null;
  }

  const candidates = [
    businessContext?.storageMode,
    session?.storageMode,
    sessionStorageMode,
  ];

  for (const candidate of candidates) {
    const storageMode =
      normalizeStorageMode(candidate);

    if (storageMode) {
      return storageMode;
    }
  }

  return "—";
}


export default function ReceptionFooter() {

  const {
    tokens,
  } = useResponsive();

  const {
    theme,
  } = useTheme();

  const storageMode =
    resolveFooterStorageMode();

  const appVersion =
    String(
      packageMetadata.version ?? "",
    ).trim() || "—";

  const {
    containerStyle,
    contentStyle,
    brandStyle,
    storageBadgeStyle,
    versionBadgeStyle,
    metadataLabelStyle,
    metadataDividerStyle,
    metadataValueStyle,
  } =
    createReceptionFooterStyles(
      tokens,
      theme,
    );

  return (
    <footer style={containerStyle}>

      <div style={contentStyle}>

        <div style={brandStyle}>
          FINORA Enterprise
        </div>

        <div
          style={storageBadgeStyle}
          aria-label={`Storage mode ${storageMode}`}
        >
          <Database
            aria-hidden="true"
            size={14}
            strokeWidth={2}
          />

          <span style={metadataLabelStyle}>
            Storage Mode
          </span>

          <span style={metadataDividerStyle}>
            •
          </span>

          <span style={metadataValueStyle}>
            {storageMode}
          </span>
        </div>

        <div
          style={versionBadgeStyle}
          aria-label={`Installed version ${appVersion}`}
        >
          <span style={metadataLabelStyle}>
            Version
          </span>

          <span style={metadataValueStyle}>
            {appVersion}
          </span>
        </div>

      </div>

    </footer>
  );
}
