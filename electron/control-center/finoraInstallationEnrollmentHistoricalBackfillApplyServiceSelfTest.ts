/* ============================================================
   FINORA ENTERPRISE OS

   HISTORICAL INSTALLATION ENROLLMENT BACKFILL APPLY SELFTEST

   PROVES:

   - Authentic current-signer Enrollment evidence creates one Registry row
   - Exact replay is idempotent and preserves exact Registry bytes
   - Tampered Response is rejected with zero Registry mutation
   - Wrong verified Request binding is rejected with zero Registry mutation
   - Pre-rotation Response verifies through retained Control Center signer
   - Retained-signer exact replay remains idempotent
   - Foreign Control Center Response is rejected with zero Registry mutation
   - Final Registry contains only the two authentic historical branches

   IMPORTANT:

   - Real Electron safeStorage runtime
   - Isolated temporary userData
   - Real Control Center signing
   - Real historical verification authority
   - Real Branch Registry persistence
   - No native dialogs
   - No renderer
   - No IPC
============================================================ */

import {
  app,
} from "electron";

import {
  mkdtemp,
  readFile,
  rm,
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
} from "./finoraControlCenterKeyVault.js";

import {
  loadFinoraControlCenterBranchRegistry,
} from "./finoraControlCenterBranchRegistryStore.js";

import {
  applyFinoraHistoricalEnrollmentEvidenceToBranchRegistry,
} from "./finoraInstallationEnrollmentHistoricalBackfillApplyService.js";

import type {
  FinoraHistoricalBranchBackfillApplyResult,
} from "./finoraInstallationEnrollmentHistoricalBackfillApplyService.js";

import {
  rotateFinoraControlCenterSigningKey,
} from "./finoraControlCenterSigningKeyRotationService.js";
import {
  signFinoraInstallationEnrollmentResponse,
} from "./finoraInstallationEnrollmentResponseIssuer.js";

import type {
  FinoraVerifiedInstallationEnrollmentRequest,
} from "./finoraInstallationEnrollmentRequestVerifier.js";

import {
  createFinoraInstallationBindingFingerprint,
} from "../control/finoraInstallationBindingCrypto.js";

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
// VERIFIED ENROLLMENT FIXTURE
//
// The production apply service accepts an already-verified
// Enrollment Request. Request-file possession verification is
// independently owned by the Request verifier / transport.
//
// Each fixture below contains a real valid P-256 public binding.
// ============================================================

function createVerifiedEnrollmentFixture(
  requestId:
    string,

  installationId:
    string,

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

  return {
    requestId,

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

  ownerId:
    string,

  businessId:
    string,

  branchId:
    string,
): FinoraInstallationEnrollmentResponseTarget {

  return {
    ownerId,

    businessId,

    branchId,

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

  target:
    FinoraInstallationEnrollmentResponseTarget,

  issuedAt:
    string,

  expiresAt:
    string,
): FinoraInstallationEnrollmentResponseFile {

  const foreignMaterial =
    generateFinoraControlCenterSigningMaterial();

  const foreignIssuerId =
    "FINORA-FOREIGN-CONTROL-CENTER-SELFTEST";

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
      "FINORA-ENROLLMENT-RESPONSE-HISTORICAL-BACKFILL-FOREIGN",

    purpose:
      FINORA_INSTALLATION_ENROLLMENT_RESPONSE_PURPOSE,

    target,

    issuedAt,

    validity: {
      notBefore:
        issuedAt,

      expiresAt,
    },

    sequence:
      9001,

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

  const signatureValue =
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
          signatureValue,
      },
    };

  return wrapResponse(
    response,
  );
}

// ============================================================
// ZERO-MUTATION ASSERTION
// ============================================================

async function applyWithExactRegistryBytePreservation(
  registryPath:
    string,

  label:
    string,

  operation:
    () => Promise<
      FinoraHistoricalBranchBackfillApplyResult
    >,
): Promise<
  FinoraHistoricalBranchBackfillApplyResult
> {

  const before =
    await readFile(
      registryPath,
    );

  const result =
    await operation();

  const after =
    await readFile(
      registryPath,
    );

  assert(
    after.equals(
      before,
    ),
    `${label} unexpectedly changed Branch Registry bytes.`,
  );

  return result;
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
        "finora-historical-backfill-apply-selftest-",
      ),
    );

  try {

    app.setPath(
      "userData",
      temporaryUserData,
    );

    await app.whenReady();

    console.log(
      "PASS: isolated Electron userData configured",
    );

    // --------------------------------------------------------
    // CONTROL CENTER SIGNER A
    // --------------------------------------------------------

    const vaultA =
      await loadOrCreateFinoraControlCenterKeyVault();

    // --------------------------------------------------------
    // AUTHENTIC HISTORICAL EVIDENCE — BRANCH 1
    // --------------------------------------------------------

    const enrollmentOne =
      createVerifiedEnrollmentFixture(
        "FINORA-ENROLLMENT-HISTORICAL-BACKFILL-REQUEST-001",
        "FINORA-HISTORICAL-INSTALLATION-001",
        vaultA.createdAt,
      );

    const targetOne =
      createResponseTarget(
        enrollmentOne,
        "FINORA-HISTORICAL-OWNER-001",
        "FINORA-HISTORICAL-BUSINESS-001",
        "FINORA-HISTORICAL-BRANCH-001",
      );

    const issuedAtOne =
      new Date()
        .toISOString();

    const signedResponseOne =
      await signFinoraInstallationEnrollmentResponse({
        responseId:
          "FINORA-ENROLLMENT-RESPONSE-HISTORICAL-BACKFILL-001",

        requestId:
          enrollmentOne.requestId,

        sequence:
          1,

        issuedAt:
          issuedAtOne,

        expiresAt:
          addMilliseconds(
            issuedAtOne,
            60 * 60 * 1000,
          ),

        target:
          targetOne,

        businessCode:
          "BUS-001",

        branchCode:
          "BR-001",
      });

    const responseFileOne =
      wrapResponse(
        signedResponseOne,
      );

    // --------------------------------------------------------
    // PRE-SIGN BRANCH 2 WITH A
    //
    // This file is intentionally applied only after A -> B
    // rotation, proving retained-key historical authority.
    // --------------------------------------------------------

    const enrollmentTwo =
      createVerifiedEnrollmentFixture(
        "FINORA-ENROLLMENT-HISTORICAL-BACKFILL-REQUEST-002",
        "FINORA-HISTORICAL-INSTALLATION-002",
        addMilliseconds(
          vaultA.createdAt,
          1,
        ),
      );

    const targetTwo =
      createResponseTarget(
        enrollmentTwo,
        "FINORA-HISTORICAL-OWNER-002",
        "FINORA-HISTORICAL-BUSINESS-002",
        "FINORA-HISTORICAL-BRANCH-002",
      );

    const issuedAtTwo =
      new Date()
        .toISOString();

    const signedResponseTwo =
      await signFinoraInstallationEnrollmentResponse({
        responseId:
          "FINORA-ENROLLMENT-RESPONSE-HISTORICAL-BACKFILL-002",

        requestId:
          enrollmentTwo.requestId,

        sequence:
          2,

        issuedAt:
          issuedAtTwo,

        expiresAt:
          addMilliseconds(
            issuedAtTwo,
            60 * 60 * 1000,
          ),

        target:
          targetTwo,

        businessCode:
          "BUS-002",

        branchCode:
          "BR-002",
      });

    const responseFileTwo =
      wrapResponse(
        signedResponseTwo,
      );

    // --------------------------------------------------------
    // APPLY BRANCH 1 — CURRENT SIGNER A
    // --------------------------------------------------------

    const firstApply =
      await applyFinoraHistoricalEnrollmentEvidenceToBranchRegistry(
        responseFileOne,
        enrollmentOne,
      );

    assert(
      firstApply.success,
      firstApply.success
        ? "Initial backfill unexpectedly returned no data."
        : firstApply.error,
    );

    assert(
      firstApply.data.created ===
        true,
      "Initial authentic historical evidence did not create a Registry record.",
    );

    assert(
      firstApply.data.verificationKeyWasCurrent ===
        true,
      "Initial historical evidence was not authenticated by current signer A.",
    );

    assert(
      firstApply.data.verificationSigningKeyId ===
        vaultA.signingKeyId,
      "Initial historical evidence resolved to the wrong Control Center signer.",
    );

    assert(
      firstApply.data.record.identity.ownerId ===
        targetOne.ownerId &&
      firstApply.data.record.identity.businessId ===
        targetOne.businessId &&
      firstApply.data.record.identity.branchId ===
        targetOne.branchId &&
      firstApply.data.record.identity.businessCode ===
        "BUS-001" &&
      firstApply.data.record.identity.branchCode ===
        "BR-001" &&
      firstApply.data.record.identity.installation.installationId ===
        enrollmentOne.deviceBinding.installationId &&
      firstApply.data.record.identity.installation.publicKey ===
        enrollmentOne.deviceBinding.publicKey,
      "Initial historical Registry identity did not preserve authenticated evidence.",
    );

    assert(
      firstApply.data.record.access ===
        undefined,
      "Historical Enrollment backfill unexpectedly inferred access authority.",
    );

    console.log(
      "PASS: authentic current-signer evidence created Branch 1 identity-only Registry record",
    );

    const registryPath =
      join(
        temporaryUserData,
        "FINORA",
        "control-center",
        "finora-control-center-branch-registry.bin",
      );

    const registryAfterFirst =
      await loadFinoraControlCenterBranchRegistry();

    assert(
      registryAfterFirst !==
        undefined &&
      registryAfterFirst.branches.length ===
        1,
      "Branch Registry did not contain exactly one record after first historical backfill.",
    );

    // --------------------------------------------------------
    // EXACT REPLAY — CREATED FALSE + BYTE IDENTICAL
    // --------------------------------------------------------

    const replayOne =
      await applyWithExactRegistryBytePreservation(
        registryPath,
        "Exact current-signer replay",
        () =>
          applyFinoraHistoricalEnrollmentEvidenceToBranchRegistry(
            responseFileOne,
            enrollmentOne,
          ),
      );

    assert(
      replayOne.success,
      replayOne.success
        ? "Exact replay unexpectedly returned no data."
        : replayOne.error,
    );

    assert(
      replayOne.data.created ===
        false,
      "Exact historical evidence replay was not idempotent.",
    );

    console.log(
      "PASS: exact current-signer replay returned created:false with byte-identical Registry",
    );

    // --------------------------------------------------------
    // TAMPERED RESPONSE — ZERO REGISTRY MUTATION
    // --------------------------------------------------------

    const tamperedResponseFile:
      FinoraInstallationEnrollmentResponseFile = {

        ...responseFileOne,

        response: {
          ...responseFileOne.response,

          payload: {
            ...responseFileOne.response.payload,

            branchCode:
              "BR-TAMPERED",
          },
        },
      };

    const tamperedResult =
      await applyWithExactRegistryBytePreservation(
        registryPath,
        "Tampered historical Response",
        () =>
          applyFinoraHistoricalEnrollmentEvidenceToBranchRegistry(
            tamperedResponseFile,
            enrollmentOne,
          ),
      );

    assert(
      !tamperedResult.success,
      "Tampered historical Enrollment Response was unexpectedly accepted.",
    );

    console.log(
      "PASS: tampered historical Response rejected with zero Registry mutation",
    );

    // --------------------------------------------------------
    // WRONG VERIFIED REQUEST BINDING — ZERO MUTATION
    //
    // Same Request ID, different independently valid public
    // installation binding. This proves exact evidence pairing
    // instead of merely testing a Request-ID typo.
    // --------------------------------------------------------

    const wrongEnrollmentBinding =
      createVerifiedEnrollmentFixture(
        enrollmentOne.requestId,
        "FINORA-HISTORICAL-INSTALLATION-WRONG",
        enrollmentOne.requestedAt,
      );

    const wrongBindingResult =
      await applyWithExactRegistryBytePreservation(
        registryPath,
        "Wrong verified Request binding",
        () =>
          applyFinoraHistoricalEnrollmentEvidenceToBranchRegistry(
            responseFileOne,
            wrongEnrollmentBinding,
          ),
      );

    assert(
      !wrongBindingResult.success,
      "Historical Response was unexpectedly accepted against the wrong verified Request binding.",
    );

    console.log(
      "PASS: wrong verified Request binding rejected with zero Registry mutation",
    );

    // --------------------------------------------------------
    // ROTATE A -> B, RETAIN A
    // --------------------------------------------------------

    const rotationAB =
      await rotateFinoraControlCenterSigningKey(
        new Date(),
      );

    assert(
      rotationAB.success,
      rotationAB.success
        ? "A-to-B production signing-key rotation unexpectedly returned no proof."
        : rotationAB.error,
    );

    const vaultB =
      await loadOrCreateFinoraControlCenterKeyVault();

    assert(
      vaultB.issuerId ===
        vaultA.issuerId,
      "A-to-B production rotation changed the stable Control Center issuerId.",
    );

    assert(
      vaultB.signingKeyId !==
        vaultA.signingKeyId,
      "A-to-B production rotation did not install a new current signing key.",
    );

    const retainedA =
      (
        vaultB.retainedSigningKeys ??
        []
      ).find(
        (record) =>
          record.signingKeyId ===
            vaultA.signingKeyId,
      );

    assert(
      retainedA !==
        undefined,
      "A-to-B production rotation did not retain signing key A.",
    );

    assert(
      retainedA.publicKeySpkiDerBase64 ===
        vaultA.publicKeySpkiDerBase64,
      "A-to-B production rotation did not preserve retained public key A.",
    );

    assert(
      retainedA.retiredAt ===
        vaultB.createdAt,
      "A-to-B production rotation did not align retained-A retirement with key-B creation time.",
    );

    const rotateAt =
      vaultB.createdAt;

    console.log(
      "PASS: Control Center key A rotated to retained history and key B became current through production rotation authority",
    );

    // --------------------------------------------------------
    // APPLY BRANCH 2 — OLD RESPONSE A THROUGH RETAINED A
    // --------------------------------------------------------

    const retainedApply =
      await applyFinoraHistoricalEnrollmentEvidenceToBranchRegistry(
        responseFileTwo,
        enrollmentTwo,
      );

    assert(
      retainedApply.success,
      retainedApply.success
        ? "Retained-signer apply unexpectedly returned no data."
        : retainedApply.error,
    );

    assert(
      retainedApply.data.created ===
        true,
      "Authentic retained-signer historical evidence did not create Branch 2.",
    );

    assert(
      retainedApply.data.verificationKeyWasCurrent ===
        false &&
      retainedApply.data.verificationSigningKeyId ===
        vaultA.signingKeyId &&
      retainedApply.data.verificationKeyRetiredAt ===
        rotateAt,
      "Historical Response A did not resolve exactly through retained signer A.",
    );

    assert(
      retainedApply.data.record.identity.ownerId ===
        targetTwo.ownerId &&
      retainedApply.data.record.identity.businessId ===
        targetTwo.businessId &&
      retainedApply.data.record.identity.branchId ===
        targetTwo.branchId &&
      retainedApply.data.record.identity.installation.installationId ===
        enrollmentTwo.deviceBinding.installationId,
      "Retained-signer historical Registry identity is incorrect.",
    );

    assert(
      retainedApply.data.record.access ===
        undefined,
      "Retained historical Enrollment evidence unexpectedly inferred access authority.",
    );

    console.log(
      "PASS: pre-rotation Response A created Branch 2 through retained signer A",
    );

    // --------------------------------------------------------
    // RETAINED-SIGNER EXACT REPLAY
    // --------------------------------------------------------

    const retainedReplay =
      await applyWithExactRegistryBytePreservation(
        registryPath,
        "Retained-signer exact replay",
        () =>
          applyFinoraHistoricalEnrollmentEvidenceToBranchRegistry(
            responseFileTwo,
            enrollmentTwo,
          ),
      );

    assert(
      retainedReplay.success,
      retainedReplay.success
        ? "Retained-signer replay unexpectedly returned no data."
        : retainedReplay.error,
    );

    assert(
      retainedReplay.data.created ===
        false &&
      retainedReplay.data.verificationKeyWasCurrent ===
        false &&
      retainedReplay.data.verificationSigningKeyId ===
        vaultA.signingKeyId,
      "Retained-signer exact replay did not preserve idempotent historical authority.",
    );

    console.log(
      "PASS: retained-signer exact replay returned created:false with byte-identical Registry",
    );

    // --------------------------------------------------------
    // FOREIGN CONTROL CENTER — ZERO REGISTRY MUTATION
    // --------------------------------------------------------

    const foreignIssuedAt =
      new Date()
        .toISOString();

    const foreignResponseFile =
      createForeignResponseFile(
        enrollmentOne,
        targetOne,
        foreignIssuedAt,
        addMilliseconds(
          foreignIssuedAt,
          60 * 60 * 1000,
        ),
      );

    const foreignResult =
      await applyWithExactRegistryBytePreservation(
        registryPath,
        "Foreign Control Center Response",
        () =>
          applyFinoraHistoricalEnrollmentEvidenceToBranchRegistry(
            foreignResponseFile,
            enrollmentOne,
          ),
      );

    assert(
      !foreignResult.success,
      "Foreign Control Center historical Response was unexpectedly accepted.",
    );

    console.log(
      "PASS: foreign Control Center Response rejected with zero Registry mutation",
    );

    // --------------------------------------------------------
    // FINAL AUTHORITATIVE REGISTRY
    // --------------------------------------------------------

    const finalRegistry =
      await loadFinoraControlCenterBranchRegistry();

    assert(
      finalRegistry !==
        undefined,
      "Final Branch Registry is missing.",
    );

    assert(
      finalRegistry.branches.length ===
        2,
      "Final Branch Registry contains unexpected records after historical backfill tests.",
    );

    const branchIds =
      new Set(
        finalRegistry.branches.map(
          (record) =>
            record.identity.branchId,
        ),
      );

    assert(
      branchIds.size ===
        2 &&
      branchIds.has(
        targetOne.branchId,
      ) &&
      branchIds.has(
        targetTwo.branchId,
      ),
      "Final Branch Registry does not contain exactly the two authentic historical branches.",
    );

    for (
      const record of
        finalRegistry.branches
    ) {
      assert(
        record.access ===
          undefined,
        "Historical Enrollment backfill persisted inferred access authority.",
      );
    }

    console.log(
      "PASS: final Registry contains exactly two authentic identity-only historical branches",
    );

    console.log(
      "PASS: historical backfill apply-service executable selftest complete",
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
      app.exit(
        0,
      );
    },
  )
  .catch(
    (error) => {

      console.error(
        error,
      );

      app.exit(
        1,
      );
    },
  );