/* ============================================================
   FINORA ENTERPRISE OS™

   CONTROL CENTER

   BRANCH ISSUANCE AUTHORIZATION

   RESPONSIBILITY:

   - Authorize signed-control issuance target against the
     authoritative Control Center Branch Registry
   - Fail closed when branch scope is not registered
   - Fail closed when immutable installation identity differs
   - Keep renderer-selected branch state non-authoritative

   SECURITY:

   - MAIN PROCESS ONLY
   - No renderer authority
   - No registry mutation
   - Exact immutable identity comparison
============================================================ */

import {
  findFinoraControlCenterBranchRegistryRecord,
} from "./finoraControlCenterBranchRegistryStore.js";

export interface FinoraControlCenterRegistryBoundIssuanceTarget {
  ownerId:
    string;

  businessId:
    string;

  branchId:
    string;

  installationId:
    string;

  bindingKeyId:
    string;

  fingerprintAlgorithm:
    string;

  publicKeyFingerprint:
    string;
}

function requireIdentityText(
  value:
    unknown,
  field:
    string,
): asserts value is string {

  if (
    typeof value !==
      "string" ||
    value.length ===
      0
  ) {
    throw new Error(
      `FINORA Control Center issuance target ${field} is required.`,
    );
  }
}

export async function authorizeFinoraControlCenterRegistryBoundIssuanceTarget(
  target:
    FinoraControlCenterRegistryBoundIssuanceTarget,
): Promise<void> {

  if (
    !target ||
    typeof target !==
      "object"
  ) {
    throw new Error(
      "FINORA Control Center issuance target is required.",
    );
  }

  requireIdentityText(
    target.ownerId,
    "ownerId",
  );

  requireIdentityText(
    target.businessId,
    "businessId",
  );

  requireIdentityText(
    target.branchId,
    "branchId",
  );

  requireIdentityText(
    target.installationId,
    "installationId",
  );

  requireIdentityText(
    target.bindingKeyId,
    "bindingKeyId",
  );

  requireIdentityText(
    target.fingerprintAlgorithm,
    "fingerprintAlgorithm",
  );

  requireIdentityText(
    target.publicKeyFingerprint,
    "publicKeyFingerprint",
  );

  const record =
    await findFinoraControlCenterBranchRegistryRecord(
      target.ownerId,
      target.businessId,
      target.branchId,
    );

  if (!record) {
    throw new Error(
      "FINORA Control Center refused signed issuance because the target branch is not present in the authoritative Branch Registry.",
    );
  }

  const identity =
    record.identity;

  const installation =
    identity.installation;

  if (
    identity.ownerId !==
      target.ownerId ||
    identity.businessId !==
      target.businessId ||
    identity.branchId !==
      target.branchId ||
    installation.installationId !==
      target.installationId ||
    installation.bindingKeyId !==
      target.bindingKeyId ||
    installation.fingerprintAlgorithm !==
      target.fingerprintAlgorithm ||
    installation.publicKeyFingerprint !==
      target.publicKeyFingerprint
  ) {
    throw new Error(
      "FINORA Control Center refused signed issuance because the requested target does not exactly match the authoritative Branch Registry identity.",
    );
  }
}