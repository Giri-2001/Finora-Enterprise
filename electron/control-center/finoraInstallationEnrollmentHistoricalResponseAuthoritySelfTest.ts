/* ============================================================
   FINORA ENTERPRISE OS

   HISTORICAL INSTALLATION ENROLLMENT RESPONSE AUTHORITY SELFTEST

   PROVES:

   - Current Control Center signing key response verifies
   - Expired historical response remains authentic evidence
   - Strict live verification still rejects that expired response
   - Old response verifies after its signer becomes retained
   - Tampered response is rejected
   - Wrong verified Enrollment Request provenance is rejected
   - Foreign Control Center response is rejected
   - Verification never mutates persisted key-vault bytes
   - Missing key vault fails closed and is not recreated

   IMPORTANT:

   - Real Electron safeStorage runtime
   - Isolated temporary userData
   - Real Control Center P-256 signatures
   - No renderer
   - No IPC
   - No Branch Registry mutation
============================================================ */

import {
  app,
} from "electron";

import {
  access,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";

import {
  tmpdir,
} from "node:os";

import {
  join,
} from "node:path";

import {
  canonicalizeFinoraControlCenterValue,
  createFinoraControlCenterPayloadDigest,
} from "./finoraControlCenterCanonicalization.js";

import {
  generateFinoraControlCenterSigningMaterial,
  signFinoraControlCenterCanonicalValue,
} from "./finoraControlCenterCrypto.js";

import {
  loadOrCreateFinoraControlCenterKeyVault,
  replaceFinoraControlCenterKeyVault,
} from "./finoraControlCenterKeyVault.js";

import type {
  FinoraControlCenterKeyVaultRecord,
  FinoraControlCenterRetainedSigningKeyRecord,
} from "./finoraControlCenterKeyVault.js";

import {
  signFinoraInstallationEnrollmentResponse,
} from "./finoraInstallationEnrollmentResponseIssuer.js";

import {
  verifyFinoraHistoricalInstallationEnrollmentResponseAgainstControlCenterAuthority,
} from "./finoraInstallationEnrollmentHistoricalResponseAuthority.js";

import type {
  FinoraVerifiedInstallationEnrollmentRequest,
} from "./finoraInstallationEnrollmentRequestVerifier.js";

import {
  createFinoraInstallationBindingFingerprint,
} from "../control/finoraInstallationBindingCrypto.js";

import {
  verifyFinoraInstallationEnrollmentResponseFile,
} from "../control/finoraInstallationEnrollmentResponseVerifier.js";

import {
  FINORA_INSTALLATION_ENROLLMENT_RESPONSE_FILE_FORMAT,
  FINORA_INSTALLATION_ENROLLMENT_RESPONSE_PAYLOAD_VERSION,
  FINORA_INSTALLATION_ENROLLMENT_RESPONSE_PURPOSE,
} from "../control/finoraInstallationEnrollmentResponse.types.js";

import type {
  FinoraInstallationEnrollmentInitialTrustedKey,
  FinoraInstallationEnrollmentResponseFile,
  FinoraInstallationEnrollmentResponsePayload,
  FinoraInstallationEnrollmentResponseTarget,
  FinoraSignedInstallationEnrollmentResponse,
} from "../control/finoraInstallationEnrollmentResponse.types.js";

// ============================================================
// ASSERT
// ============================================================

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

// ============================================================
// TIME
// ============================================================

function addMilliseconds(
  iso:
    string,
  milliseconds:
    number,
): string {

  const parsed =
    Date.parse(
      iso,
    );

  assert(
    Number.isFinite(
      parsed,
    ),
    `Invalid selftest timestamp: ${iso}`,
  );

  return new Date(
    parsed +
      milliseconds,
  ).toISOString();
}

// ============================================================
// VERIFIED REQUEST FIXTURE
//
// This fixture starts at the resolver's declared input boundary:
// FinoraVerifiedInstallationEnrollmentRequest.
//
// Possession-signature verification of the original Enrollment
// Request is already owned by the production request verifier.
// This test does not duplicate that independent responsibility.
// ============================================================

function createVerifiedEnrollmentFixture(
  createdAt:
    string,
): FinoraVerifiedInstallationEnrollmentRequest {

  const recipientMaterial =
    generateFinoraControlCenterSigningMaterial();

  const publicKeyFingerprint =
    createFinoraInstallationBindingFingerprint(
      recipientMaterial.publicKeySpkiDerBase64,
    );

  const bindingKeyId =
    `FINORA-BINDING-${publicKeyFingerprint
      .slice(
        0,
        32,
      )
      .toUpperCase()}`;

  const installationId =
    "FINORA-INSTALLATION-HISTORICAL-SELFTEST-001";

  return {
    requestId:
      "FINORA-ENROLLMENT-HISTORICAL-SELFTEST-REQUEST-001",

    deviceBinding: {
      installationId,

      bindingKeyId,

      platform:
        "WINDOWS",

      algorithm:
        "ECDSA_P256_SHA256",

      publicKeyFormat:
        "SPKI_DER_BASE64",

      publicKey:
        recipientMaterial.publicKeySpkiDerBase64,

      fingerprintAlgorithm:
        "SHA-256",

      publicKeyFingerprint,

      createdAt,

      schemaVersion:
        1,
    },

    requestedAt:
      createdAt,

    target: {
      installationId,

      bindingKeyId,

      fingerprintAlgorithm:
        "SHA-256",

      publicKeyFingerprint,

      schemaVersion:
        1,
    },

    schemaVersion:
      1,
  };
}

// ============================================================
// RESPONSE TARGET
// ============================================================

function createResponseTarget(
  enrollment:
    FinoraVerifiedInstallationEnrollmentRequest,
): FinoraInstallationEnrollmentResponseTarget {

  return {
    ownerId:
      "FINORA-OWNER-HISTORICAL-SELFTEST-001",

    businessId:
      "FINORA-BUSINESS-HISTORICAL-SELFTEST-001",

    branchId:
      "FINORA-BRANCH-HISTORICAL-SELFTEST-001",

    installationId:
      enrollment.target.installationId,

    bindingKeyId:
      enrollment.target.bindingKeyId,

    fingerprintAlgorithm:
      enrollment.target.fingerprintAlgorithm,

    publicKeyFingerprint:
      enrollment.target.publicKeyFingerprint,
  };
}

// ============================================================
// RESPONSE FILE
// ============================================================

function wrapResponse(
  response:
    FinoraSignedInstallationEnrollmentResponse,
): FinoraInstallationEnrollmentResponseFile {

  return {
    format:
      FINORA_INSTALLATION_ENROLLMENT_RESPONSE_FILE_FORMAT,

    response,

    schemaVersion:
      1,
  };
}

// ============================================================
// FOREIGN CONTROL CENTER RESPONSE
// ============================================================

function createForeignResponseFile(
  enrollment:
    FinoraVerifiedInstallationEnrollmentRequest,

  issuedAt:
    string,

  expiresAt:
    string,
): FinoraInstallationEnrollmentResponseFile {

  const foreignMaterial =
    generateFinoraControlCenterSigningMaterial();

  const foreignIssuerId =
    "FINORA-CC-FOREIGN-HISTORICAL-SELFTEST";

  const initialTrustedKey:
    FinoraInstallationEnrollmentInitialTrustedKey = {

      issuerId:
        foreignIssuerId,

      signingKeyId:
        foreignMaterial.signingKeyId,

      algorithm:
        "ECDSA_P256_SHA256",

      format:
        "SPKI_DER_BASE64",

      publicKey:
        foreignMaterial.publicKeySpkiDerBase64,

      status:
        "ACTIVE",

      validFrom:
        issuedAt,
    };

  const payload:
    FinoraInstallationEnrollmentResponsePayload = {

      requestId:
        enrollment.requestId,

      businessCode:
        "BUS-FOREIGN",

      branchCode:
        "BR-FOREIGN",

      initialTrustedKey,

      issuedAt,

      schemaVersion:
        1,
    };

  const unsignedResponse = {

    responseId:
      "FINORA-ENROLLMENT-RESPONSE-FOREIGN-SELFTEST-001",

    purpose:
      FINORA_INSTALLATION_ENROLLMENT_RESPONSE_PURPOSE,

    target:
      createResponseTarget(
        enrollment,
      ),

    issuedAt,

    validity: {
      notBefore:
        issuedAt,

      expiresAt,
    },

    sequence:
      999,

    payloadVersion:
      FINORA_INSTALLATION_ENROLLMENT_RESPONSE_PAYLOAD_VERSION,

    payload,

    issuer: {
      type:
        "FINORA_CONTROL_CENTER" as const,

      issuerId:
        foreignIssuerId,

      signingKeyId:
        foreignMaterial.signingKeyId,
    },

    payloadDigest:
      createFinoraControlCenterPayloadDigest(
        payload,
      ),

    schemaVersion:
      1 as const,
  };

  const signature =
    signFinoraControlCenterCanonicalValue(
      canonicalizeFinoraControlCenterValue(
        unsignedResponse,
      ),
      foreignMaterial.privateKeyPkcs8DerBase64,
    );

  const response:
    FinoraSignedInstallationEnrollmentResponse = {

      ...unsignedResponse,

      signature: {
        algorithm:
          "ECDSA_P256_SHA256",

        encoding:
          "IEEE_P1363",

        canonicalization:
          "FINORA_CANONICAL_JSON_V1",

        signingKeyId:
          foreignMaterial.signingKeyId,

        value:
          signature,
      },
    };

  return wrapResponse(
    response,
  );
}

// ============================================================
// ZERO-MUTATION VERIFICATION
// ============================================================

async function runWithVaultMutationProof<T>(
  vaultPath:
    string,

  label:
    string,

  operation:
    () => Promise<T>,
): Promise<T> {

  const before =
    await readFile(
      vaultPath,
    );

  const result =
    await operation();

  const after =
    await readFile(
      vaultPath,
    );

  assert(
    after.equals(
      before,
    ),
    `${label} mutated persisted Control Center key-vault bytes.`,
  );

  return result;
}

// ============================================================
// FILE ABSENCE
// ============================================================

async function exists(
  filePath:
    string,
): Promise<boolean> {

  try {
    await access(
      filePath,
    );

    return true;
  } catch (
    error
  ) {
    const code =
      (
        error as
          NodeJS.ErrnoException
      ).code;

    if (code === "ENOENT") {
      return false;
    }

    throw error;
  }
}

// ============================================================
// RUN
// ============================================================

async function runSelfTest():
  Promise<void> {

  const temporaryUserData =
    await mkdtemp(
      join(
        tmpdir(),
        "finora-historical-enrollment-response-selftest-",
      ),
    );

  try {

    // --------------------------------------------------------
    // ISOLATED ELECTRON USERDATA
    // --------------------------------------------------------

    app.setPath(
      "userData",
      temporaryUserData,
    );

    await app.whenReady();

    console.log(
      "PASS: isolated Electron userData configured",
    );

    // --------------------------------------------------------
    // INITIAL CONTROL CENTER KEY A
    // --------------------------------------------------------

    const vaultA =
      await loadOrCreateFinoraControlCenterKeyVault();

    const vaultPath =
      join(
        temporaryUserData,
        "FINORA",
        "control-center",
        "finora-control-center-key.bin",
      );

    assert(
      await exists(
        vaultPath,
      ),
      "Initial Control Center key vault was not created.",
    );

    const enrollment =
      createVerifiedEnrollmentFixture(
        vaultA.createdAt,
      );

    const target =
      createResponseTarget(
        enrollment,
      );

    // --------------------------------------------------------
    // CURRENT KEY A RESPONSE
    // --------------------------------------------------------

    const issuedAtA =
      new Date()
        .toISOString();

    const responseA =
      await signFinoraInstallationEnrollmentResponse({
        responseId:
          "FINORA-ENROLLMENT-RESPONSE-HISTORICAL-SELFTEST-A",

        requestId:
          enrollment.requestId,

        sequence:
          1,

        issuedAt:
          issuedAtA,

        expiresAt:
          addMilliseconds(
            issuedAtA,
            60 * 60 * 1000,
          ),

        target,

        businessCode:
          "BUS-001",

        branchCode:
          "BR-001",
      });

    const responseFileA =
      wrapResponse(
        responseA,
      );

    const currentResult =
      await runWithVaultMutationProof(
        vaultPath,
        "Current-key historical verification",
        () =>
          verifyFinoraHistoricalInstallationEnrollmentResponseAgainstControlCenterAuthority(
            responseFileA,
            enrollment,
          ),
      );

    assert(
      currentResult.success,
      currentResult.success
        ? "Current-key result unexpectedly missing."
        : currentResult.error,
    );

    assert(
      currentResult.data.verificationKey.current ===
        true &&
      currentResult.data.verificationKey.signingKeyId ===
        vaultA.signingKeyId &&
      currentResult.data.response.responseId ===
        responseA.responseId,
      "Current-key historical verification did not resolve exact key A authority.",
    );

    console.log(
      "PASS: current Control Center signing key response authenticated with zero vault mutation",
    );

    // --------------------------------------------------------
    // EXPIRED HISTORICAL RESPONSE
    // --------------------------------------------------------

    const issuedAtExpired =
      new Date()
        .toISOString();

    const expiresAtExpired =
      addMilliseconds(
        issuedAtExpired,
        5,
      );

    const expiredResponse =
      await signFinoraInstallationEnrollmentResponse({
        responseId:
          "FINORA-ENROLLMENT-RESPONSE-HISTORICAL-SELFTEST-EXPIRED",

        requestId:
          enrollment.requestId,

        sequence:
          2,

        issuedAt:
          issuedAtExpired,

        expiresAt:
          expiresAtExpired,

        target,

        businessCode:
          "BUS-001",

        branchCode:
          "BR-001",
      });

    const expiredFile =
      wrapResponse(
        expiredResponse,
      );

    await new Promise<void>(
      (resolve) =>
        setTimeout(
          resolve,
          30,
        ),
    );

    assert(
      Date.now() >
        Date.parse(
          expiresAtExpired,
        ),
      "Expired-response fixture did not advance beyond expiresAt.",
    );

    const strictExpired =
      verifyFinoraInstallationEnrollmentResponseFile({
        value:
          expiredFile,

        expectedControlCenterPublicKeyFingerprint:
          createFinoraInstallationBindingFingerprint(
            vaultA.publicKeySpkiDerBase64,
          ),

        expectedRequestId:
          enrollment.requestId,

        nativeBinding: {
          installationId:
            enrollment.target.installationId,

          bindingKeyId:
            enrollment.target.bindingKeyId,

          fingerprintAlgorithm:
            enrollment.target.fingerprintAlgorithm,

          publicKeyFingerprint:
            enrollment.target.publicKeyFingerprint,
        },
      });

    assert(
      !strictExpired.success &&
      strictExpired.error.includes(
        "expired",
      ),
      "Strict live Enrollment Response verification did not reject expired evidence.",
    );

    const historicalExpired =
      await runWithVaultMutationProof(
        vaultPath,
        "Expired historical verification",
        () =>
          verifyFinoraHistoricalInstallationEnrollmentResponseAgainstControlCenterAuthority(
            expiredFile,
            enrollment,
          ),
      );

    assert(
      historicalExpired.success,
      historicalExpired.success
        ? "Expired historical result unexpectedly missing."
        : historicalExpired.error,
    );

    console.log(
      "PASS: expired Response rejected by strict live verification but accepted as historical evidence",
    );

    // --------------------------------------------------------
    // ROTATE A -> B, RETAIN A
    // --------------------------------------------------------

    const materialB =
      generateFinoraControlCenterSigningMaterial();

    const rotateAt =
      new Date(
        Math.max(
          Date.now(),
          Date.parse(
            vaultA.createdAt,
          ) + 1,
        ),
      ).toISOString();

    const retainedA:
      FinoraControlCenterRetainedSigningKeyRecord = {

        signingKeyId:
          vaultA.signingKeyId,

        privateKeyPkcs8DerBase64:
          vaultA.privateKeyPkcs8DerBase64,

        publicKeySpkiDerBase64:
          vaultA.publicKeySpkiDerBase64,

        createdAt:
          vaultA.createdAt,

        retiredAt:
          rotateAt,
      };

    const vaultB:
      FinoraControlCenterKeyVaultRecord = {

        issuerId:
          vaultA.issuerId,

        signingKeyId:
          materialB.signingKeyId,

        privateKeyPkcs8DerBase64:
          materialB.privateKeyPkcs8DerBase64,

        publicKeySpkiDerBase64:
          materialB.publicKeySpkiDerBase64,

        createdAt:
          rotateAt,

        retainedSigningKeys: [
          retainedA,
        ],

        schemaVersion:
          1,
      };

    await replaceFinoraControlCenterKeyVault(
      vaultB,
    );

    console.log(
      "PASS: Control Center key A rotated to retained history and key B became current",
    );

    // --------------------------------------------------------
    // OLD RESPONSE A -> RETAINED KEY PASS
    // --------------------------------------------------------

    const retainedResult =
      await runWithVaultMutationProof(
        vaultPath,
        "Retained-key historical verification",
        () =>
          verifyFinoraHistoricalInstallationEnrollmentResponseAgainstControlCenterAuthority(
            responseFileA,
            enrollment,
          ),
      );

    assert(
      retainedResult.success,
      retainedResult.success
        ? "Retained-key result unexpectedly missing."
        : retainedResult.error,
    );

    assert(
      retainedResult.data.verificationKey.current ===
        false &&
      retainedResult.data.verificationKey.signingKeyId ===
        vaultA.signingKeyId &&
      retainedResult.data.verificationKey.retiredAt ===
        rotateAt,
      "Old Response A did not resolve exactly to retained Control Center key A.",
    );

    console.log(
      "PASS: pre-rotation Response A authenticated through retained key A with zero vault mutation",
    );

    // --------------------------------------------------------
    // TAMPERED RESPONSE -> REJECT
    // --------------------------------------------------------

    const tamperedFile:
      FinoraInstallationEnrollmentResponseFile = {

        ...responseFileA,

        response: {
          ...responseFileA.response,

          payload: {
            ...responseFileA.response.payload,

            branchCode:
              "BR-TAMPERED",
          },
        },
      };

    const tamperedResult =
      await runWithVaultMutationProof(
        vaultPath,
        "Tampered-response rejection",
        () =>
          verifyFinoraHistoricalInstallationEnrollmentResponseAgainstControlCenterAuthority(
            tamperedFile,
            enrollment,
          ),
      );

    assert(
      !tamperedResult.success,
      "Tampered historical Enrollment Response was unexpectedly accepted.",
    );

    console.log(
      "PASS: tampered historical Response rejected with zero vault mutation",
    );

    // --------------------------------------------------------
    // WRONG VERIFIED REQUEST PROVENANCE -> REJECT
    // --------------------------------------------------------

    const wrongEnrollment:
      FinoraVerifiedInstallationEnrollmentRequest = {

        ...enrollment,

        requestId:
          "FINORA-ENROLLMENT-HISTORICAL-SELFTEST-WRONG-REQUEST",
      };

    const wrongRequestResult =
      await runWithVaultMutationProof(
        vaultPath,
        "Wrong-request rejection",
        () =>
          verifyFinoraHistoricalInstallationEnrollmentResponseAgainstControlCenterAuthority(
            responseFileA,
            wrongEnrollment,
          ),
      );

    assert(
      !wrongRequestResult.success,
      "Historical Response was unexpectedly accepted against wrong Enrollment Request provenance.",
    );

    console.log(
      "PASS: wrong verified Enrollment Request pairing rejected with zero vault mutation",
    );

    // --------------------------------------------------------
    // FOREIGN CONTROL CENTER -> REJECT
    // --------------------------------------------------------

    const foreignIssuedAt =
      new Date()
        .toISOString();

    const foreignFile =
      createForeignResponseFile(
        enrollment,
        foreignIssuedAt,
        addMilliseconds(
          foreignIssuedAt,
          60 * 60 * 1000,
        ),
      );

    const foreignResult =
      await runWithVaultMutationProof(
        vaultPath,
        "Foreign-Control-Center rejection",
        () =>
          verifyFinoraHistoricalInstallationEnrollmentResponseAgainstControlCenterAuthority(
            foreignFile,
            enrollment,
          ),
      );

    assert(
      !foreignResult.success,
      "Foreign Control Center historical Response was unexpectedly accepted.",
    );

    console.log(
      "PASS: foreign Control Center Response rejected with zero vault mutation",
    );

    // --------------------------------------------------------
    // FINAL STABLE VAULT BYTES
    // --------------------------------------------------------

    const stableVaultBytes =
      await readFile(
        vaultPath,
      );

    assert(
      stableVaultBytes.length >
        0,
      "Stable Control Center key-vault snapshot is empty.",
    );

    console.log(
      "PASS: all normal historical verification success/rejection paths preserved exact vault bytes",
    );

    // --------------------------------------------------------
    // MISSING VAULT -> FAIL CLOSED / NO RE-CREATION
    // --------------------------------------------------------

    await rm(
      vaultPath,
      {
        force:
          true,
      },
    );

    assert(
      !(await exists(
        vaultPath,
      )),
      "Missing-vault fixture could not remove the Control Center vault.",
    );

    const missingVaultResult =
      await verifyFinoraHistoricalInstallationEnrollmentResponseAgainstControlCenterAuthority(
        responseFileA,
        enrollment,
      );

    assert(
      !missingVaultResult.success &&
      missingVaultResult.error.includes(
        "does not exist",
      ),
      "Historical verification did not fail closed for missing Control Center vault.",
    );

    assert(
      !(await exists(
        vaultPath,
      )),
      "Historical verification recreated a missing Control Center key vault.",
    );

    console.log(
      "PASS: missing Control Center vault fails closed and is not recreated",
    );

    // Restore fixture only so final byte proof can confirm exact test state.
    await writeFile(
      vaultPath,
      stableVaultBytes,
    );

    const restoredVaultBytes =
      await readFile(
        vaultPath,
      );

    assert(
      restoredVaultBytes.equals(
        stableVaultBytes,
      ),
      "Selftest failed to restore exact stable vault fixture bytes.",
    );

    console.log(
      "PASS: historical Enrollment Response authority selftest complete",
    );

  } finally {

    await rm(
      temporaryUserData,
      {
        recursive:
          true,

        force:
          true,
      },
    );
  }
}

// ============================================================
// ENTRY
// ============================================================

void runSelfTest()
  .then(
    () => {
      app.quit();
    },
  )
  .catch(
    (error) => {

      console.error(
        error,
      );

      process.exitCode =
        1;

      app.quit();
    },
  );