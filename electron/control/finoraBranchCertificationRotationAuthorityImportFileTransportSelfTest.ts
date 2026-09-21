import assert from "node:assert/strict";

import {
  FINORA_BRANCH_CERTIFICATION_ROTATION_AUTHORITY_FORMAT,
  parseFinoraBranchCertificationRotationAuthorityFile,
} from "./finoraBranchCertificationRotationAuthorityImportFileTransport.js";

function expectRejected(
  value:
    unknown,

  label:
    string,
): void {

  assert.throws(
    () =>
      parseFinoraBranchCertificationRotationAuthorityFile(
        JSON.stringify(
          value,
        ),
      ),
  );

  console.log(
    `PASS: ${label}`,
  );
}

function run():
  void {

  const valid =
    parseFinoraBranchCertificationRotationAuthorityFile(
      JSON.stringify({
        format:
          FINORA_BRANCH_CERTIFICATION_ROTATION_AUTHORITY_FORMAT,

        signedPackage: {
          packageId:
            "FIN-PKG-BCR-TEST-001",

          controlPackage: {
            purpose:
              "BRANCH_CERTIFICATION_ROTATION",

            payload: {
              requestId:
                "FIN-BCR-REQ-TEST-001",

              replacementCertificationPublicKey: {
                keyId:
                  "FIN-BRANCH-CERT-REPLACEMENT-TEST",
              },
            },
          },

          signature: {
            algorithm:
              "ECDSA_P256_SHA256",
          },
        },

        schemaVersion:
          1,
      }),
    );

  assert.equal(
    valid.format,
    FINORA_BRANCH_CERTIFICATION_ROTATION_AUTHORITY_FORMAT,
  );

  assert.equal(
    valid.schemaVersion,
    1,
  );

  assert.equal(
    typeof valid.signedPackage,
    "object",
  );

  console.log(
    "PASS: canonical rotation authority wrapper accepted",
  );

  expectRejected(
    {
      format:
        "WRONG_FORMAT",

      signedPackage: {},

      schemaVersion:
        1,
    },
    "wrong wrapper format rejected",
  );

  expectRejected(
    {
      format:
        FINORA_BRANCH_CERTIFICATION_ROTATION_AUTHORITY_FORMAT,

      signedPackage: {},

      schemaVersion:
        2,
    },
    "wrong wrapper schema rejected",
  );

  expectRejected(
    {
      format:
        FINORA_BRANCH_CERTIFICATION_ROTATION_AUTHORITY_FORMAT,

      signedPackage: {},

      schemaVersion:
        1,

      unexpected:
        true,
    },
    "unknown wrapper field rejected",
  );

  expectRejected(
    {
      format:
        FINORA_BRANCH_CERTIFICATION_ROTATION_AUTHORITY_FORMAT,

      signedPackage:
        "not-an-object",

      schemaVersion:
        1,
    },
    "non-object signed package rejected",
  );

  expectRejected(
    {
      format:
        FINORA_BRANCH_CERTIFICATION_ROTATION_AUTHORITY_FORMAT,

      signedPackage: {
        payload: {
          replacementCertificationKeyMaterial: {
            keyId:
              "SHOULD-NOT-EXIST",

            privateKey:
              "SECRET",
          },
        },
      },

      schemaVersion:
        1,
    },
    "replacement private-key material rejected",
  );

  expectRejected(
    {
      format:
        FINORA_BRANCH_CERTIFICATION_ROTATION_AUTHORITY_FORMAT,

      signedPackage: {
        nested: {
          privateKey:
            "SECRET",
        },
      },

      schemaVersion:
        1,
    },
    "nested privateKey field rejected",
  );

  assert.throws(
    () =>
      parseFinoraBranchCertificationRotationAuthorityFile(
        "{not-json",
      ),
  );

  console.log(
    "PASS: malformed JSON rejected",
  );

  console.log(
    "============================================================",
  );

  console.log(
    "PASS: A5-M18D-B1 OWNER ROTATION AUTHORITY IMPORT EXECUTABLE PROOF",
  );

  console.log(
    "============================================================",
  );
}

run();