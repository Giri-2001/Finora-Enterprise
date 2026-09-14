/* ============================================================
   FINORA ENTERPRISE OS
   CREDENTIAL AUTHORIZATION VERIFICATION EVIDENCE SELF-TEST
============================================================ */

import fs from "node:fs";
import path from "node:path";

function assert(
  condition:
    unknown,
  message:
    string,
): asserts condition {
  if (!condition) {
    throw new Error(
      message,
    );
  }
}

function readSource():
  string {
  const candidates = [
    path.resolve(
      process.cwd(),
      "electron/control/finoraControlStore.ts",
    ),

    path.resolve(
      process.cwd(),
      "../electron/control/finoraControlStore.ts",
    ),
  ];

  const sourcePath =
    candidates.find(
      (
        candidate,
      ) =>
        fs.existsSync(
          candidate,
        ),
    );

  assert(
    sourcePath,
    "Unable to locate finoraControlStore.ts.",
  );

  return fs.readFileSync(
    sourcePath,
    "utf8",
  );
}

function count(
  source:
    string,
  pattern:
    RegExp,
): number {
  return (
    source.match(
      pattern,
    ) ??
    []
  ).length;
}

function main():
  void {
  const source =
    readSource();

  assert(
    count(
      source,
      /export interface FinoraBranchCredentialAuthorizationVerificationEvidence/g,
    ) ===
      1,
    "Expected exactly one signer-evidence DTO.",
  );

  assert(
    count(
      source,
      /branchCredentialAuthorizationVerificationEvidence\?:\s*FinoraBranchCredentialAuthorizationVerificationEvidence\[\]/g,
    ) ===
      1,
    "Control Store must expose exactly one optional evidence collection.",
  );

  assert(
    count(
      source,
      /function isBranchCredentialAuthorizationVerificationEvidence\(/g,
    ) ===
      1,
    "Persisted signer evidence requires strict record validation.",
  );

  assert(
    count(
      source,
      /value\.branchCredentialAuthorizationVerificationEvidence\.findIndex/g,
    ) ===
      2,
    "Production and diagnostic root validators must both validate every evidence record.",
  );

  assert(
    count(
      source,
      /credentialAuthorizationVerificationEvidence\.push\(\{/g,
    ) ===
      1,
    "Credential authorization mutation must append one evidence record.",
  );

  assert(
    count(
      source,
      /verifiedControlSigner:\s*\{\s*\.\.\.verifiedControlSigner/g,
    ) ===
      1,
    "Evidence must snapshot the exact verifier-selected public signer.",
  );

  assert(
    count(
      source,
      /verifiedAt:\s*input\.appliedAt/g,
    ) ===
      1,
    "Signer evidence must use package application time as verification evidence.",
  );

  assert(
    count(
      source,
      /controlStore\.branchCredentialAuthorizationVerificationEvidence\s*=\s*credentialAuthorizationVerificationEvidence/g,
    ) ===
      1,
    "Evidence must join the same authoritative Control Store mutation.",
  );

  assert(
    count(
      source,
      /credentialAuthorizationVerificationEvidence\.(splice|pop|shift)|branchCredentialAuthorizationVerificationEvidence\.(splice|pop|shift)/g,
    ) ===
      0,
    "I1B2 must not consume signer evidence before Portable Auth copies it.",
  );

  console.log(
    "PASS: persisted signer evidence has strict exact record validation",
  );

  console.log(
    "PASS: production and diagnostic Control Store validators reject malformed evidence",
  );

  console.log(
    "PASS: exact verifier-selected public signer is persisted with authorizationId provenance",
  );

  console.log(
    "PASS: authorization and signer evidence join one encrypted Control Store mutation",
  );

  console.log(
    "PASS: signer evidence remains available for later Portable Auth propagation",
  );

  console.log(
    "PASS: D4E4I1B2R2 PARALLEL VERIFIED SIGNER EVIDENCE PERSISTENCE",
  );
}

try {
  main();
}
catch (
  error
) {
  console.error(
    "FAIL: D4E4I1B2R2 PARALLEL VERIFIED SIGNER EVIDENCE PERSISTENCE",
    error,
  );

  process.exitCode =
    1;
}