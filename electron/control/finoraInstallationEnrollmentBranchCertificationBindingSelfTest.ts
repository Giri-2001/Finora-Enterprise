/* ============================================================
   FINORA ENTERPRISE OS™

   INSTALLATION ENROLLMENT BRANCH CERTIFICATION BINDING SELFTEST

   Proves the production Enrollment bootstrap coordinator keeps:
   - Branch Certification custody preflight before first mutation
   - retry-stable boundAt derivation
   - bind after installation read-back
   - durable Branch Certification read-back
   - Pending Enrollment clear LAST
============================================================ */

import {
  readFileSync,
} from "node:fs";

import {
  resolve,
} from "node:path";

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

function allIndices(
  source:
    string,
  needle:
    string,
): number[] {

  const indices:
    number[] =
      [];

  let cursor =
    0;

  while (true) {

    const index =
      source.indexOf(
        needle,
        cursor,
      );

    if (index <
      0) {
      return indices;
    }

    indices.push(
      index,
    );

    cursor =
      index +
      needle.length;
  }
}

function run(): void {

  const coordinatorPath =
    resolve(
      process.cwd(),
      "electron",
      "control",
      "finoraInstallationEnrollmentBootstrapCoordinator.ts",
    );

  const source =
    readFileSync(
      coordinatorPath,
      "utf8",
    ).replace(
      /\r\n/g,
      "\n",
    );

  const certificationLoads =
    allIndices(
      source,
      "await loadFinoraBranchCertificationBootstrap();",
    );

  assert(
    certificationLoads.length ===
      2,
    "Expected exactly two Branch Certification bootstrap loads: preflight and durable read-back.",
  );

  const latchIndex =
    source.indexOf(
      "await latchFinoraPendingInstallationEnrollmentResponse(",
    );

  const installationReadBackIndex =
    source.indexOf(
      "const installationAfterResult =",
    );

  const bindIndex =
    source.indexOf(
      "await bindFinoraBranchCertificationBootstrapToBranch({",
    );

  const pendingClearIndex =
    source.indexOf(
      "await clearFinoraPendingInstallationEnrollment(",
    );

  assert(
    certificationLoads[0] >=
      0 &&
    latchIndex >
      certificationLoads[0],
    "Branch Certification custody preflight must happen before the first Pending Response latch mutation.",
  );

  console.log(
    "PASS: Branch Certification custody preflight occurs before first bootstrap mutation",
  );

  assert(
    source.includes(
      "Math.max(",
    ) &&
    source.includes(
      "certificationBeforeBind.generatedAt",
    ) &&
    source.includes(
      "response.issuedAt",
    ) &&
    source.includes(
      "boundAt:\n              branchCertificationBoundAt",
    ),
    "Branch Certification boundAt is not derived from stable generatedAt / signed issuedAt evidence.",
  );

  assert(
    !source.includes(
      "boundAt:\n              new Date()",
    ) &&
    !source.includes(
      "boundAt: new Date()",
    ),
    "Branch Certification boundAt must not depend on retry wall-clock time.",
  );

  console.log(
    "PASS: Branch Certification boundAt is deterministic and retry-stable",
  );

  assert(
    latchIndex >=
      0 &&
    installationReadBackIndex >
      latchIndex &&
    bindIndex >
      installationReadBackIndex &&
    certificationLoads[1] >
      bindIndex &&
    pendingClearIndex >
      certificationLoads[1],
    "Enrollment bootstrap authority ordering is invalid.",
  );

  console.log(
    "PASS: Branch Certification bind occurs after installation read-back and before Pending clear",
  );

  assert(
    source.includes(
      'confirmedCertification.state !==\n            "BRANCH_BOUND_AFTER_RESPONSE"',
    ) &&
    source.includes(
      "confirmedCertification.branchBinding",
    ) &&
    source.includes(
      "certificationBeforeBind.certificationKeyMaterial",
    ),
    "Branch Certification durable read-back does not verify immutable custody.",
  );

  console.log(
    "PASS: Branch Certification durable bound-state read-back is enforced",
  );

  const finalMutationCommentIndex =
    source.indexOf(
      "FINAL MUTATION — CLEAR EXACT PENDING REQUEST",
    );

  assert(
    finalMutationCommentIndex >
      certificationLoads[1] &&
    pendingClearIndex >
      finalMutationCommentIndex,
    "Pending Enrollment clear is not the final protected bootstrap mutation.",
  );

  console.log(
    "PASS: Pending Enrollment clear remains LAST after all authority confirmations",
  );

  console.log(
    "============================================================",
  );

  console.log(
    "PASS: PHASE 5.6L-3D3C-C1 BRANCH CERTIFICATION BINDING EXECUTABLE PROOF",
  );

  console.log(
    "============================================================",
  );
}

run();
