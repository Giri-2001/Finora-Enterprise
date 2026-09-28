/* ============================================================
   FINORA ENTERPRISE OS
   DEVELOPER CONTROL CENTER APPLICATION IDENTITY

   PURPOSE:
   - Define the standalone Developer application identity.
   - Keep Developer packaging separate from Owner FINORA.
   - Provide canonical names for Windows and Android builds.
   - Provide a distinct Developer userData namespace.

   SECURITY / SEPARATION:
   - This module does not open the Control Center.
   - This module does not register privileged IPC.
   - This module does not create or load signing authority.
   - This module does not weaken Owner recipient packaging.
   - No device binding is introduced here.
   ============================================================ */

export const
  FINORA_OWNER_APPLICATION_ID =
    "com.finora.enterprise" as const;

export const
  FINORA_DEVELOPER_CONTROL_CENTER_APPLICATION_ID =
    "com.finora.developer.controlcenter" as const;

export const
  FINORA_DEVELOPER_CONTROL_CENTER_PRODUCT_NAME =
    "FINORA Developer Control Center" as const;

export const
  FINORA_DEVELOPER_CONTROL_CENTER_USER_DATA_DIRECTORY =
    "FINORA Developer Control Center" as const;

export const
  FINORA_DEVELOPER_CONTROL_CENTER_WINDOWS_ARTIFACT_NAME =
    "Finora_Control_Center.exe" as const;

export const
  FINORA_DEVELOPER_CONTROL_CENTER_ANDROID_ARTIFACT_NAME =
    "Finora_Control_Center.apk" as const;

export function
assertFinoraDeveloperControlCenterIdentitySeparation():
  void {

  const ownerApplicationId:
    string =
      FINORA_OWNER_APPLICATION_ID;

  const developerApplicationId:
    string =
      FINORA_DEVELOPER_CONTROL_CENTER_APPLICATION_ID;

  if (
    developerApplicationId ===
    ownerApplicationId
  ) {
    throw new Error(
      "FINORA Developer Control Center application identity must remain separate from Owner FINORA.",
    );
  }

  if (
    FINORA_DEVELOPER_CONTROL_CENTER_PRODUCT_NAME.trim()
      .length ===
    0
  ) {
    throw new Error(
      "FINORA Developer Control Center product name is required.",
    );
  }

  if (
    FINORA_DEVELOPER_CONTROL_CENTER_USER_DATA_DIRECTORY
      .trim()
      .length ===
    0
  ) {
    throw new Error(
      "FINORA Developer Control Center userData directory name is required.",
    );
  }
}
