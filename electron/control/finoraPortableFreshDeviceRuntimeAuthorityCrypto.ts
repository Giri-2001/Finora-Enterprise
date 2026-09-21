import {
  signFinoraBranchCertificationCanonicalValue,
  verifyFinoraBranchCertificationCanonicalValue,
} from "./finoraBranchCertificationCrypto.js";

import type {
  FinoraBranchCertificationKeyMaterialV1,
  FinoraBranchCertificationPublicKeyV1,
} from "./finoraBranchCertificationContract.js";

import {
  FINORA_PORTABLE_FRESH_DEVICE_RUNTIME_AUTHORITY_FORMAT,
  FINORA_PORTABLE_FRESH_DEVICE_RUNTIME_AUTHORITY_SCHEMA_VERSION,
  canonicalizeFinoraPortableFreshDeviceRuntimeAuthorityPayloadV1,
  validateFinoraPortableFreshDeviceRuntimeAuthorityPackageV1,
  validateFinoraPortableFreshDeviceRuntimeAuthorityPayloadV1,
} from "./finoraPortableFreshDeviceRuntimeAuthorityContract.js";

import type {
  FinoraPortableFreshDeviceRuntimeAuthorityPackageV1,
  FinoraPortableFreshDeviceRuntimeAuthorityPayloadV1,
} from "./finoraPortableFreshDeviceRuntimeAuthorityContract.js";

export function createFinoraPortableFreshDeviceRuntimeAuthorityPackageV1(
  payload:
    FinoraPortableFreshDeviceRuntimeAuthorityPayloadV1,

  certificationKeyMaterial:
    FinoraBranchCertificationKeyMaterialV1,
): FinoraPortableFreshDeviceRuntimeAuthorityPackageV1 {
  validateFinoraPortableFreshDeviceRuntimeAuthorityPayloadV1(
    payload,
  );

  const canonicalValue =
    canonicalizeFinoraPortableFreshDeviceRuntimeAuthorityPayloadV1(
      payload,
    );

  const signature =
    signFinoraBranchCertificationCanonicalValue(
      canonicalValue,
      certificationKeyMaterial,
    );

  const result:
    FinoraPortableFreshDeviceRuntimeAuthorityPackageV1 = {
      format:
        FINORA_PORTABLE_FRESH_DEVICE_RUNTIME_AUTHORITY_FORMAT,

      schemaVersion:
        FINORA_PORTABLE_FRESH_DEVICE_RUNTIME_AUTHORITY_SCHEMA_VERSION,

      payload:
        structuredClone(
          payload,
        ),

      signature:
        structuredClone(
          signature,
        ),
    };

  validateFinoraPortableFreshDeviceRuntimeAuthorityPackageV1(
    result,
  );

  return result;
}

export function verifyFinoraPortableFreshDeviceRuntimeAuthorityPackageV1(
  packageValue:
    unknown,

  certificationPublicKey:
    FinoraBranchCertificationPublicKeyV1,
): packageValue is FinoraPortableFreshDeviceRuntimeAuthorityPackageV1 {
  try {
    validateFinoraPortableFreshDeviceRuntimeAuthorityPackageV1(
      packageValue,
    );

    const canonicalValue =
      canonicalizeFinoraPortableFreshDeviceRuntimeAuthorityPayloadV1(
        packageValue.payload,
      );

    return verifyFinoraBranchCertificationCanonicalValue(
      canonicalValue,
      packageValue.signature,
      certificationPublicKey,
    );
  }
  catch {
    return false;
  }
}