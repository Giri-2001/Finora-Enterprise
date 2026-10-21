/**
 * FINORA_P1_677F_PASSWORD_ONLY_PORTABLE_RECOVERY
 *
 * Decrypt existing Portable Auth V2 using Password only.
 *
 * IMPORTANT:
 * - Decryption proves access to encrypted data, NOT server ownership.
 * - This helper does not grant Login.
 * - This helper does not overwrite USB or Runtime Authority.
 * - Legacy-native credentials still require trusted migration.
 */

import {
  decryptFinoraPortableBranchAuthEnvelopeV2WithPassword,
} from "./finoraPortableBranchAuthV2Crypto.js";

type FinoraPortableRecoveryEnvelope =
  Parameters<
    typeof decryptFinoraPortableBranchAuthEnvelopeV2WithPassword
  >[0];

export async function decryptFinoraPortableForAuthenticatedRecovery(
  envelope: FinoraPortableRecoveryEnvelope,
  password: string,
) {
  if (
    typeof password !== "string" ||
    password.length === 0
  ) {
    throw new Error("INVALID_PASSWORD_INPUT");
  }

  return decryptFinoraPortableBranchAuthEnvelopeV2WithPassword(
    envelope,
    password,
  );
}