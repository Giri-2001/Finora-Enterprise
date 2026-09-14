/* ============================================================
   FINORA ENTERPRISE OS
   VERIFIED CREDENTIAL SIGNER TRANSPORT SELF-TEST
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

function readSource(
  relativePath:
    string,
): string {
  const candidates = [
    path.resolve(
      process.cwd(),
      relativePath,
    ),

    path.resolve(
      process.cwd(),
      "..",
      relativePath,
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
    `Unable to locate ${relativePath}.`,
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
  const store =
    readSource(
      "electron/control/finoraControlStore.ts",
    );

  const apply =
    readSource(
      "electron/control/finoraBranchAccessPackageApplyService.ts",
    );

  assert(
    count(
      store,
      /verifiedControlSigner\?:\s*FinoraBranchTrustedControlPublicKey/g,
    ) ===
      1,
    "Branch Access apply input must carry optional verified signer evidence.",
  );

  assert(
    count(
      store,
      /verifiedControlSigner:\s*FinoraBranchTrustedControlPublicKey/g,
    ) ===
      1,
    "Dedicated credential authorization input must require verified signer evidence.",
  );

  assert(
    count(
      store,
      /const verifiedControlSigner\s*=\s*input\.verifiedControlSigner/g,
    ) ===
      1,
    "Internal Branch Access mutation boundary must validate signer evidence.",
  );

  assert(
    count(
      store,
      /verifiedControlSigner\.issuerId\s*!==\s*input\.issuerId/g,
    ) ===
      1,
    "Verified signer evidence must match the verified package issuer.",
  );

  assert(
    count(
      apply,
      /verifiedControlSigner:\s*\{\s*\.\.\.verification\.verifiedTrustedKey/g,
    ) ===
      2,
    "Both ISSUE credential enrollment and AUTHORIZE_CREDENTIAL must forward the verifier-selected key.",
  );

  assert(
    count(
      apply,
      /credentialAuthorization\.verifiedControlSigner|credentialEnrollmentAuthorization\.verifiedControlSigner/g,
    ) ===
      0,
    "Local signer evidence must not mutate the signed domain payload.",
  );

  console.log(
    "PASS: ISSUE credential enrollment carries exact verifier-selected signer evidence",
  );

  console.log(
    "PASS: AUTHORIZE_CREDENTIAL carries exact verifier-selected signer evidence",
  );

  console.log(
    "PASS: Control Store verifies signer issuer correlation",
  );

  console.log(
    "PASS: signed credential authorization payload remains unchanged",
  );

  console.log(
    "PASS: D4E4I1B1R2 VERIFIED CREDENTIAL SIGNER EVIDENCE TRANSPORT",
  );
}

try {
  main();
}
catch (
  error
) {
  console.error(
    "FAIL: D4E4I1B1R2 VERIFIED CREDENTIAL SIGNER EVIDENCE TRANSPORT",
    error,
  );

  process.exitCode =
    1;
}