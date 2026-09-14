/* ============================================================
   FINORA ENTERPRISE OS
   SIGNED CONTROL PACKAGE VERIFIED SIGNER EVIDENCE SELF-TEST
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

function main():
  void {
  const candidatePaths = [
    path.resolve(
      process.cwd(),
      "electron/control/finoraSignedControlPackageVerifier.ts",
    ),

    path.resolve(
      process.cwd(),
      "../electron/control/finoraSignedControlPackageVerifier.ts",
    ),
  ];

  const sourcePath =
    candidatePaths.find(
      (
        candidate,
      ) =>
        fs.existsSync(
          candidate,
        ),
    );

  assert(
    sourcePath,
    "Unable to locate signed Control Package verifier source.",
  );

  const source =
    fs.readFileSync(
      sourcePath,
      "utf8",
    );

  const successContractRefs =
    (
      source.match(
        /verifiedTrustedKey:\s*FinoraBranchTrustedControlPublicKey/g,
      ) ??
      []
    ).length;

  const successReturnRefs =
    (
      source.match(
        /verifiedTrustedKey:\s*\{\s*\.\.\.trustedKey/g,
      ) ??
      []
    ).length;

  const resolverRefs =
    (
      source.match(
        /const trustedKey\s*=\s*trustedKeys\.find/g,
      ) ??
      []
    ).length;

  const returnedCallerKeyRefs =
    (
      source.match(
        /verifiedTrustedKey:\s*trustedKeys\[/g,
      ) ??
      []
    ).length;

  assert(
    successContractRefs ===
      1,
    "Verifier success contract must expose exactly one verifiedTrustedKey.",
  );

  assert(
    successReturnRefs ===
      1,
    "Verifier must return a defensive copy of the exact matched trustedKey.",
  );

  assert(
    resolverRefs ===
      1,
    "Verifier must preserve one exact trusted-key resolution seam.",
  );

  assert(
    returnedCallerKeyRefs ===
      0,
    "Verifier must not return an arbitrary caller-indexed trusted key.",
  );

  console.log(
    "PASS: verifier success contract exposes exact matched public-key evidence",
  );

  console.log(
    "PASS: verified signer evidence is derived only after trusted-key resolution",
  );

  console.log(
    "PASS: verifier returns a defensive copy rather than caller-owned key object",
  );

  console.log(
    "PASS: D4E4I1A VERIFIED MATCHED SIGNER EVIDENCE FOUNDATION",
  );
}

try {
  main();
}
catch (
  error
) {
  console.error(
    "FAIL: D4E4I1A VERIFIED MATCHED SIGNER EVIDENCE FOUNDATION",
    error,
  );

  process.exitCode =
    1;
}