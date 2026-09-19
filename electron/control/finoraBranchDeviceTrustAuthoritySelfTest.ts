/* ============================================================
   FINORA ENTERPRISE OS
   BRANCH DEVICE TRUST AUTHORITY RUNTIME SELF-TEST
============================================================ */

import {
  createFinoraPortableBranchAuthTestSourceAuthorizationEvidence,
} from "./finoraPortableBranchAuthTestEvidence.js";

import {
  app,
} from "electron";

import {
  mkdtemp,
  rm,
} from "node:fs/promises";

import {
  join,
} from "node:path";

import {
  tmpdir,
} from "node:os";

import {
  ensureFinoraWindowsInstallationBinding,
} from "./finoraInstallationBindingService.js";

import {
  createFinoraPortableBranchAuthEnvelopeV1,
} from "./finoraPortableBranchAuthCrypto.js";

import {
  FinoraPortableBranchAuthStore,
} from "./finoraPortableBranchAuthStore.js";

import {
  loadFinoraBranchDeviceTrustStore,
  persistFinoraBranchDeviceTrustStore,
} from "./finoraBranchDeviceTrustStore.js";

import {
  authorizeFinoraCurrentBranchDevice,
  checkFinoraCurrentBranchDeviceTrust,
  createFinoraPortableBranchAuthFingerprint,
} from "./finoraBranchDeviceTrustAuthority.js";

import type {
  FinoraBranchDeviceTrustCheckPrincipal,
} from "./finoraBranchDeviceTrustAuthority.js";

import type {
  FinoraBranchOperationalSessionPrincipal,
} from "./finoraBranchLoginSessionAuthority.js";

import type {
  FinoraBranchCredentialAuthenticationSuccess,
} from "./finoraBranchCredentialAuthenticationService.js";

import {
  FINORA_BRANCH_ACCESS_CREDENTIAL_ENROLLMENT_METHOD,
} from "./finoraBranchAccessPackage.types.js";

import type {
  FinoraBranchCredentialEnrollmentAuthorization,
} from "./finoraBranchAccessPackage.types.js";

import type {
  FinoraPortableBranchAuthSourceAuthorizationVerificationEvidenceV1,
  FinoraPortableBranchAuthVerifiedControlSignerV1,
} from "./finoraPortableBranchAuthContract.js";

import {
  isFinoraBranchCredentialPortabilityAuthorityProvenanceV1,
} from "./finoraBranchCredentialPortabilityAuthorityProvenance.js";


import {
  issueFinoraBranchPortabilityAuthorityPackage,
} from "../control-center/finoraBranchPortabilityAuthorityIssuer.js";

import {
  getFinoraControlCenterPublicIdentity,
} from "../control-center/finoraControlCenterKeyVault.js";

import {
  signFinoraControlCenterPackage,
} from "../control-center/finoraControlCenterSigner.js";

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
// TEST
// ============================================================

async function runSelfTest():
  Promise<void> {
  let temporaryUserData:
    string | undefined;

  let failure:
    unknown;

  try {
    temporaryUserData =
      await mkdtemp(
        join(
          tmpdir(),
          "finora-device-trust-authority-",
        ),
      );

    app.setPath(
      "userData",
      temporaryUserData,
    );

    await app.whenReady();

    await ensureFinoraWindowsInstallationBinding();

    console.log(
      "PASS: isolated native Windows installation binding created",
    );

    let localResolverCalls =
      0;

    let usbResolverCalls =
      0;

    const portableStore =
      new FinoraPortableBranchAuthStore({
        resolveLocalRoot:
          () => {
            localResolverCalls +=
              1;

            return temporaryUserData;
          },

        resolveUsbRoot:
          async () => {
            usbResolverCalls +=
              1;

            return null;
          },
      });

    const password =
      "admin123";

    const securityCode =
      "FINORA-SECURITY-SELFTEST";

    const sourceAuthorizationId =
      "FINORA-CREDENTIAL-ENROLLMENT-DEVICE-TRUST-000001";

    const publicIdentity =
      await getFinoraControlCenterPublicIdentity();

    const pinnedSigner:
      FinoraPortableBranchAuthVerifiedControlSignerV1 = {
        issuerId:
          publicIdentity.issuerId,

        signingKeyId:
          publicIdentity.signingKeyId,

        algorithm:
          "ECDSA_P256_SHA256",

        format:
          "SPKI_DER_BASE64",

        publicKey:
          publicIdentity.publicKeySpkiDerBase64,

        status:
          "ACTIVE",

        /*
         * Keep the test key-validity window earlier than all
         * synthetic negative-package issuedAt values below.
         */
        validFrom:
          new Date(
            Date.now() -
              24 * 60 * 60 * 1000,
          ).toISOString(),
      };

    const sourceAuthorization:
      FinoraBranchCredentialEnrollmentAuthorization = {
        authorizationId:
          sourceAuthorizationId,

        userId:
          "FINORA-USER-DEVICE-TRUST",

        username:
          "admin",

        fullName:
          "FINORA Admin",

        role:
          "ADMIN",

        ownerId:
          "FINORA-OWNER-DEVICE-TRUST",

        businessId:
          "FINORA-BUSINESS-DEVICE-TRUST",

        branchId:
          "FINORA-BRANCH-DEVICE-TRUST",

        storageMode:
          "LOCAL",

        dataContext:
          "REAL",

        method:
          FINORA_BRANCH_ACCESS_CREDENTIAL_ENROLLMENT_METHOD,

        oneTime:
          true,

        schemaVersion:
          1,
      };

    const signedPortabilityAuthorityPackage =
      await issueFinoraBranchPortabilityAuthorityPackage({
        target: {
          ownerId:
            sourceAuthorization.ownerId,

          businessId:
            sourceAuthorization.businessId,

          branchId:
            sourceAuthorization.branchId,
        },

        sourceAuthorization,
      });

    const portabilityVerifiedAt =
      new Date().toISOString();

    const portabilityProofCandidate:
      unknown = {
        sourceAuthorizationId,

        signedPortabilityAuthorityPackage,

        verifiedControlSigner: {
          ...pinnedSigner,
        },

        verifiedAt:
          portabilityVerifiedAt,

        schemaVersion:
          1,
      };

    assert(
      isFinoraBranchCredentialPortabilityAuthorityProvenanceV1(
        portabilityProofCandidate,
      ),
      "Real signed portability proof did not satisfy authoritative I5C provenance validation.",
    );

    const sourceAuthorizationVerificationEvidence:
      FinoraPortableBranchAuthSourceAuthorizationVerificationEvidenceV1 = {
        ...createFinoraPortableBranchAuthTestSourceAuthorizationEvidence(
          sourceAuthorizationId,
        ),

        issuerId:
          pinnedSigner.issuerId,

        verifiedControlSigner: {
          ...pinnedSigner,
        },

        portabilityAuthorityProof:
          structuredClone(
            portabilityProofCandidate,
          ),

        verifiedAt:
          portabilityVerifiedAt,
      };

    console.log(
      "PASS: real Control Center-signed Branch Portability Authority fixture created and pinned",
    );

    const createdAt =
      new Date().toISOString();

    const envelope =
      await createFinoraPortableBranchAuthEnvelopeV1({
        authStateId:
          "FINORA-AUTH-STATE-DEVICE-TRUST-SELFTEST",

        sourceAuthorizationId,
        sourceAuthorizationVerificationEvidence,

        ownerId:
          "FINORA-OWNER-DEVICE-TRUST",

        businessId:
          "FINORA-BUSINESS-DEVICE-TRUST",

        branchId:
          "FINORA-BRANCH-DEVICE-TRUST",

        userId:
          "FINORA-USER-DEVICE-TRUST",

        username:
          "admin",


        fullName:
          "FINORA Admin",

        role:
          "ADMIN",

        dataContext:
          "REAL",

        storageMode:
          "LOCAL",

        password,

        securityCode,

        authGeneration:
          1,

        createdAt,

        updatedAt:
          createdAt,
      });

    const createScenarioEnvelope =
      async (
        evidence:
          FinoraPortableBranchAuthSourceAuthorizationVerificationEvidenceV1,

        scenarioSourceAuthorizationId:
          string =
            sourceAuthorizationId,

        scenarioAuthGeneration:
          number =
            1,
      ) =>
        createFinoraPortableBranchAuthEnvelopeV1({
          authStateId:
            "FINORA-AUTH-STATE-DEVICE-TRUST-SELFTEST",

          sourceAuthorizationId:
            scenarioSourceAuthorizationId,

          sourceAuthorizationVerificationEvidence:
            evidence,

          ownerId:
            "FINORA-OWNER-DEVICE-TRUST",

          businessId:
            "FINORA-BUSINESS-DEVICE-TRUST",

          branchId:
            "FINORA-BRANCH-DEVICE-TRUST",

          userId:
            "FINORA-USER-DEVICE-TRUST",

          username:
            "admin",

          fullName:
            "FINORA Admin",

          role:
            "ADMIN",

          dataContext:
            "REAL",

          storageMode:
            "LOCAL",

          password,
          securityCode,

          authGeneration:
            scenarioAuthGeneration,

          createdAt,
          updatedAt:
            createdAt,
        });

    await portableStore.ensureExact(
      "LOCAL",
      envelope,
    );

    console.log(
      "PASS: canonical LOCAL Portable Branch Auth fixture persisted",
    );

    const principal:
      FinoraBranchCredentialAuthenticationSuccess = {
        credentialId:
          "FINORA-CREDENTIAL-DEVICE-TRUST",

      authGeneration:
        1,

        userId:
          "FINORA-USER-DEVICE-TRUST",

        username:
          "admin",

        fullName:
          "FINORA Admin",

        role:
          "ADMIN",

        ownerId:
          "FINORA-OWNER-DEVICE-TRUST",

        businessId:
          "FINORA-BUSINESS-DEVICE-TRUST",

        branchId:
          "FINORA-BRANCH-DEVICE-TRUST",

        storageMode:
          "LOCAL",

        dataContext:
          "REAL",

        authenticatedAt:
          createdAt,
      };

    const checkPrincipal:
      FinoraBranchDeviceTrustCheckPrincipal = {
        authGeneration:
          principal.authGeneration,

        userId:
          principal.userId,

        username:
          principal.username,

        ownerId:
          principal.ownerId,

        businessId:
          principal.businessId,

        branchId:
          principal.branchId,

        storageMode:
          principal.storageMode,

        dataContext:
          principal.dataContext,
      };

    const operationalSessionPrincipal:
      FinoraBranchOperationalSessionPrincipal = {
        ...checkPrincipal,
      };

    const operationalCheckPrincipal:
      FinoraBranchDeviceTrustCheckPrincipal =
        operationalSessionPrincipal;

    assert(
      !(
        "credentialId" in
          checkPrincipal
      ) &&
      !(
        "authenticatedAt" in
          checkPrincipal
      ) &&
      !(
        "fullName" in
          checkPrincipal
      ) &&
      !(
        "role" in
          checkPrincipal
      ),
      "Device Trust CHECK principal contains full-auth-only fields.",
    );

    console.log(
      "PASS: Device Trust CHECK accepts the narrow operational session principal contract",
    );
    const expectedFingerprint =
      createFinoraPortableBranchAuthFingerprint(
        envelope,
      );

    assert(
      /^[a-f0-9]{64}$/.test(
        expectedFingerprint,
      ),
      "Portable Auth fingerprint is not canonical SHA-256 hex.",
    );

    console.log(
      "PASS: canonical Portable Auth envelope SHA-256 derived",
    );

    const initialCheck =
      await checkFinoraCurrentBranchDeviceTrust({
        principal:
          operationalCheckPrincipal,

        portableStore,
      });

    assert(
      initialCheck.success &&
      initialCheck.status ===
        "SECURITY_CODE_REQUIRED" &&
      initialCheck.portableAuthFingerprint ===
        expectedFingerprint,
      "Unknown device did not require Security Code.",
    );

    console.log(
      "PASS: authenticated principal on unknown device requires Security Code",
    );

    // ========================================================
    // I7 PORTABILITY AUTHORITY FAIL-CLOSED MATRIX
    //
    // All cases execute before the first successful Device
    // Trust mutation. Every authorization failure must leave
    // the authoritative Device Trust store absent.
    // ========================================================

    let scenarioIndex =
      0;

    const createScenarioPortableStore =
      (
        label:
          string,
      ): FinoraPortableBranchAuthStore => {
        if (!temporaryUserData) {
          throw new Error(
            "Temporary userData is unavailable.",
          );
        }

        scenarioIndex +=
          1;

        const scenarioRoot =
          join(
            temporaryUserData,
            `portable-${scenarioIndex}-${label}`,
          );

        return new FinoraPortableBranchAuthStore({
          resolveLocalRoot:
            () =>
              scenarioRoot,

          resolveUsbRoot:
            async () =>
              null,
        });
      };

    const expectPortabilityAuthorizationFailure =
      async (
        label:
          string,

        scenarioEnvelope:
          Awaited<
            ReturnType<
              typeof createFinoraPortableBranchAuthEnvelopeV1
            >
          >,
      ): Promise<void> => {
        const scenarioStore =
          createScenarioPortableStore(
            label,
          );

        await scenarioStore.ensureExact(
          "LOCAL",
          scenarioEnvelope,
        );

        const before =
          await loadFinoraBranchDeviceTrustStore();

        assert(
          before ===
            undefined,
          `${label}: Device Trust existed before negative authorization.`,
        );

        const result =
          await authorizeFinoraCurrentBranchDevice({
            principal,
            portableStore:
              scenarioStore,
            password,
            securityCode,
          });

        assert(
          !result.success &&
          result.errorCode ===
            "PORTABILITY_AUTH_VERIFICATION_FAILED",
          `${label}: expected PORTABILITY_AUTH_VERIFICATION_FAILED.`,
        );

        const after =
          await loadFinoraBranchDeviceTrustStore();

        assert(
          after ===
            undefined,
          `${label}: negative authorization mutated Device Trust.`,
        );

        console.log(
          `PASS: ${label} fails closed with zero Device Trust mutation`,
        );
      };

    // ========================================================
    // D4E4I8 STALE PORTABLE AUTH GENERATION
    //
    // Simulate credential rotation:
    //
    //   copied Portable Auth generation = 1
    //   current credential generation    = 2
    //
    // The stale copied artifact must fail before any Device
    // Trust persistence.
    // ========================================================

    const staleGenerationStore =
      createScenarioPortableStore(
        "stale-generation",
      );

    await staleGenerationStore.ensureExact(
      "LOCAL",
      envelope,
    );

    const staleGenerationBefore =
      await loadFinoraBranchDeviceTrustStore();

    assert(
      staleGenerationBefore ===
        undefined,
      "Stale-generation scenario began with existing Device Trust.",
    );

    const staleGenerationPrincipal:
      FinoraBranchCredentialAuthenticationSuccess = {
        ...principal,

        authGeneration:
          principal.authGeneration +
            1,
      };

    assert(
      principal.authGeneration ===
        1 &&
      staleGenerationPrincipal.authGeneration ===
        2,
      "Stale-generation fixture did not model generation 1 -> 2.",
    );

    const staleGenerationResult =
      await authorizeFinoraCurrentBranchDevice({
        principal:
          staleGenerationPrincipal,

        portableStore:
          staleGenerationStore,

        password,
        securityCode,
      });

    assert(
      !staleGenerationResult.success &&
      staleGenerationResult.errorCode ===
        "PORTABLE_AUTH_PAYLOAD_MISMATCH",
      "Stale Portable Auth generation was not rejected.",
    );

    const staleGenerationAfter =
      await loadFinoraBranchDeviceTrustStore();

    assert(
      staleGenerationAfter ===
        undefined,
      "Stale Portable Auth generation mutated Device Trust.",
    );

    console.log(
      "PASS: stale Portable Auth generation fails closed with zero Device Trust mutation",
    );

    // --------------------------------------------------------
    // 1. LEGACY / MISSING I6 PROOF
    // --------------------------------------------------------

    const missingProofEvidence =
      structuredClone(
        sourceAuthorizationVerificationEvidence,
      );

    delete missingProofEvidence.portabilityAuthorityProof;

    const missingProofEnvelope =
      await createScenarioEnvelope(
        missingProofEvidence,
      );

    await expectPortabilityAuthorizationFailure(
      "missing encrypted portability proof",
      missingProofEnvelope,
    );

    // --------------------------------------------------------
    // 2. CRYPTOGRAPHIC SIGNATURE TAMPER
    // --------------------------------------------------------

    const tamperedSignature =
      `${
        signedPortabilityAuthorityPackage.signature.value.startsWith(
          "A",
        )
          ? "B"
          : "A"
      }${
        signedPortabilityAuthorityPackage.signature.value.slice(
          1,
        )
      }`;

    const tamperedPackage = {
      ...structuredClone(
        signedPortabilityAuthorityPackage,
      ),

      signature: {
        ...signedPortabilityAuthorityPackage.signature,

        value:
          tamperedSignature,
      },
    };

    const tamperedProofCandidate:
      unknown = {
        sourceAuthorizationId,

        signedPortabilityAuthorityPackage:
          tamperedPackage,

        verifiedControlSigner: {
          ...pinnedSigner,
        },

        verifiedAt:
          portabilityVerifiedAt,

        schemaVersion:
          1,
      };

    assert(
      isFinoraBranchCredentialPortabilityAuthorityProvenanceV1(
        tamperedProofCandidate,
      ),
      "Tampered-signature proof lost structural provenance shape before runtime verification.",
    );

    const tamperedEvidence:
      FinoraPortableBranchAuthSourceAuthorizationVerificationEvidenceV1 = {
        ...structuredClone(
          sourceAuthorizationVerificationEvidence,
        ),

        portabilityAuthorityProof:
          structuredClone(
            tamperedProofCandidate,
          ),
      };

    const tamperedEnvelope =
      await createScenarioEnvelope(
        tamperedEvidence,
      );

    await expectPortabilityAuthorizationFailure(
      "tampered signed portability signature",
      tamperedEnvelope,
    );

    // --------------------------------------------------------
    // 3. GENUINELY SIGNED WRONG-BRANCH AUTHORITY
    // --------------------------------------------------------

    const wrongBranchId =
      "FINORA-BRANCH-DEVICE-TRUST-WRONG";

    const wrongBranchSourceAuthorization:
      FinoraBranchCredentialEnrollmentAuthorization = {
        ...sourceAuthorization,

        branchId:
          wrongBranchId,
      };

    const wrongBranchPackage =
      await issueFinoraBranchPortabilityAuthorityPackage({
        target: {
          ownerId:
            sourceAuthorization.ownerId,

          businessId:
            sourceAuthorization.businessId,

          branchId:
            wrongBranchId,
        },

        sourceAuthorization:
          wrongBranchSourceAuthorization,
      });

    const wrongBranchVerifiedAt =
      new Date().toISOString();

    const wrongBranchProofCandidate:
      unknown = {
        sourceAuthorizationId,

        signedPortabilityAuthorityPackage:
          wrongBranchPackage,

        verifiedControlSigner: {
          ...pinnedSigner,
        },

        verifiedAt:
          wrongBranchVerifiedAt,

        schemaVersion:
          1,
      };

    assert(
      isFinoraBranchCredentialPortabilityAuthorityProvenanceV1(
        wrongBranchProofCandidate,
      ),
      "Genuine wrong-branch portability package did not retain valid provenance shape.",
    );

    const wrongBranchEvidence:
      FinoraPortableBranchAuthSourceAuthorizationVerificationEvidenceV1 = {
        ...structuredClone(
          sourceAuthorizationVerificationEvidence,
        ),

        portabilityAuthorityProof:
          structuredClone(
            wrongBranchProofCandidate,
          ),

        verifiedAt:
          wrongBranchVerifiedAt,
      };

    const wrongBranchEnvelope =
      await createScenarioEnvelope(
        wrongBranchEvidence,
      );

    await expectPortabilityAuthorizationFailure(
      "genuine wrong-branch portability authority",
      wrongBranchEnvelope,
    );

    // --------------------------------------------------------
    // 4. SOURCE-AUTHORIZATION LINEAGE MISMATCH
    //
    // This malformed lineage must be rejected by the encrypted
    // Portable Auth contract before Device Trust authorization
    // can even consume it.
    // --------------------------------------------------------

    const mismatchedLineageEvidence:
      FinoraPortableBranchAuthSourceAuthorizationVerificationEvidenceV1 = {
        ...structuredClone(
          sourceAuthorizationVerificationEvidence,
        ),

        authorizationId:
          "FINORA-CREDENTIAL-ENROLLMENT-DEVICE-TRUST-DIFFERENT",
      };

    let mismatchedLineageRejected =
      false;

    try {
      await createScenarioEnvelope(
        mismatchedLineageEvidence,
      );
    }
    catch {
      mismatchedLineageRejected =
        true;
    }

    assert(
      mismatchedLineageRejected,
      "Mismatched source-authorization lineage was accepted into encrypted Portable Auth.",
    );

    assert(
      (
        await loadFinoraBranchDeviceTrustStore()
      ) ===
        undefined,
      "Source-lineage rejection unexpectedly mutated Device Trust.",
    );

    console.log(
      "PASS: mismatched source-authorization lineage rejected before Device Trust authorization",
    );

    // --------------------------------------------------------
    // 5. WRONG PINNED PUBLIC KEY
    // --------------------------------------------------------

    const wrongPinnedPublicKey =
      `${
        pinnedSigner.publicKey.startsWith(
          "A",
        )
          ? "B"
          : "A"
      }${
        pinnedSigner.publicKey.slice(
          1,
        )
      }`;

    const wrongPinnedSigner:
      FinoraPortableBranchAuthVerifiedControlSignerV1 = {
        ...pinnedSigner,

        publicKey:
          wrongPinnedPublicKey,
      };

    const wrongPinnedProofCandidate:
      unknown = {
        sourceAuthorizationId,

        signedPortabilityAuthorityPackage:
          signedPortabilityAuthorityPackage,

        verifiedControlSigner: {
          ...wrongPinnedSigner,
        },

        verifiedAt:
          portabilityVerifiedAt,

        schemaVersion:
          1,
      };

    assert(
      isFinoraBranchCredentialPortabilityAuthorityProvenanceV1(
        wrongPinnedProofCandidate,
      ),
      "Wrong-pinned-key proof did not retain structural provenance shape.",
    );

    const wrongPinnedEvidence:
      FinoraPortableBranchAuthSourceAuthorizationVerificationEvidenceV1 = {
        ...structuredClone(
          sourceAuthorizationVerificationEvidence,
        ),

        issuerId:
          wrongPinnedSigner.issuerId,

        verifiedControlSigner: {
          ...wrongPinnedSigner,
        },

        portabilityAuthorityProof:
          structuredClone(
            wrongPinnedProofCandidate,
          ),
      };

    const wrongPinnedEnvelope =
      await createScenarioEnvelope(
        wrongPinnedEvidence,
      );

    await expectPortabilityAuthorizationFailure(
      "wrong pinned Control Center public key",
      wrongPinnedEnvelope,
    );

    // --------------------------------------------------------
    // 6. EXPIRED BUT OTHERWISE GENUINELY SIGNED AUTHORITY
    // --------------------------------------------------------

    const expiredIssuedAt =
      new Date(
        Date.now() -
          2 * 60 * 1000,
      ).toISOString();

    const expiredAt =
      new Date(
        Date.now() -
          60 * 1000,
      ).toISOString();

    const expiredPackage =
      await signFinoraControlCenterPackage({
        packageId:
          "FINORA-BRANCH-PORTABILITY-00000000-0000-4000-8000-000000000099",

        purpose:
          "BRANCH_PORTABILITY_AUTHORITY",

        target: {
          ownerId:
            sourceAuthorization.ownerId,

          businessId:
            sourceAuthorization.businessId,

          branchId:
            sourceAuthorization.branchId,
        },

        issuedAt:
          expiredIssuedAt,

        validity: {
          expiresAt:
            expiredAt,
        },

        sequence:
          999,

        payloadVersion:
          signedPortabilityAuthorityPackage.payloadVersion,

        payload:
          structuredClone(
            signedPortabilityAuthorityPackage.payload,
          ),

        schemaVersion:
          1,
      });

    const expiredVerifiedAt =
      new Date().toISOString();

    const expiredProofCandidate:
      unknown = {
        sourceAuthorizationId,

        signedPortabilityAuthorityPackage:
          expiredPackage,

        verifiedControlSigner: {
          ...pinnedSigner,
        },

        verifiedAt:
          expiredVerifiedAt,

        schemaVersion:
          1,
      };

    assert(
      isFinoraBranchCredentialPortabilityAuthorityProvenanceV1(
        expiredProofCandidate,
      ),
      "Expired signed portability package did not retain valid provenance shape.",
    );

    const expiredEvidence:
      FinoraPortableBranchAuthSourceAuthorizationVerificationEvidenceV1 = {
        ...structuredClone(
          sourceAuthorizationVerificationEvidence,
        ),

        portabilityAuthorityProof:
          structuredClone(
            expiredProofCandidate,
          ),

        verifiedAt:
          expiredVerifiedAt,
      };

    const expiredEnvelope =
      await createScenarioEnvelope(
        expiredEvidence,
      );

    await expectPortabilityAuthorizationFailure(
      "expired signed portability authority",
      expiredEnvelope,
    );

    console.log(
      "PASS: I7 portability negative matrix completed before first trust mutation",
    );

    // ========================================================
    // EXISTING WRONG-SECURITY-CODE / VALID AUTHORIZATION FLOW
    // ========================================================

    const beforeWrongCode =
      await loadFinoraBranchDeviceTrustStore();

    assert(
      beforeWrongCode ===
        undefined,
      "Device Trust unexpectedly existed before authorization.",
    );

    const wrongCodeResult =
      await authorizeFinoraCurrentBranchDevice({
        principal,
        portableStore,
        password,
        securityCode:
          "WRONG-SECURITY-CODE",
      });

    assert(
      !wrongCodeResult.success &&
      wrongCodeResult.errorCode ===
        "PORTABLE_AUTH_AUTHENTICATION_FAILED",
      "Wrong Security Code did not fail closed.",
    );

    const afterWrongCode =
      await loadFinoraBranchDeviceTrustStore();

    assert(
      afterWrongCode ===
        undefined,
      "Wrong Security Code mutated Device Trust state.",
    );

    console.log(
      "PASS: wrong Security Code fails closed with zero trust mutation",
    );

    const authorized =
      await authorizeFinoraCurrentBranchDevice({
        principal,
        portableStore,
        password,
        securityCode,
      });

    assert(
      authorized.success &&
      authorized.status ===
        "AUTHORIZED",
      "Correct Portable credentials did not authorize current device.",
    );

    assert(
      authorized.success &&
      authorized.record.portableAuthFingerprint ===
        expectedFingerprint &&
      authorized.record.authStateId ===
        "FINORA-AUTH-STATE-DEVICE-TRUST-SELFTEST" &&
      authorized.record.authGeneration ===
        1,
      "Authorized Device Trust record lost Portable lineage evidence.",
    );

    console.log(
      "PASS: correct Password + Security Code authorizes exact current device",
    );

    const trustedCheck =
      await checkFinoraCurrentBranchDeviceTrust({
        principal,
        portableStore,
      });

    assert(
      trustedCheck.success &&
      trustedCheck.status ===
        "TRUSTED",
      "Authorized current device did not enter trusted fast path.",
    );

    console.log(
      "PASS: exact current device + current Portable envelope is trusted",
    );

    const retry =
      await authorizeFinoraCurrentBranchDevice({
        principal,
        portableStore,
        password,
        securityCode,
      });

    assert(
      retry.success &&
      retry.status ===
        "ALREADY_TRUSTED" &&
      retry.record.trustedAt ===
        authorized.record.trustedAt,
      "Current-device authorization retry was not idempotent.",
    );

    const persisted =
      await loadFinoraBranchDeviceTrustStore();

    assert(
      persisted !==
        undefined &&
      persisted.records.length ===
        1,
      "Idempotent authorization produced duplicate Device Trust records.",
    );

    console.log(
      "PASS: exact current-device authorization retry is idempotent",
    );

    // ========================================================
    // D4E4I8 TRUSTED-DEVICE CONTINUITY AFTER ROTATION
    //
    // Simulate a legitimate credential rotation that replaced
    // Portable Auth generation 1 with generation 2.
    //
    // The existing Device Trust record intentionally remains
    // historical generation-1 evidence. The exact same native
    // device must remain trusted after current credential
    // authentication succeeds at generation 2.
    // ========================================================

    const rotatedEnvelope =
      await createScenarioEnvelope(
        sourceAuthorizationVerificationEvidence,
        sourceAuthorizationId,
        2,
      );

    const rotatedFingerprint =
      createFinoraPortableBranchAuthFingerprint(
        rotatedEnvelope,
      );

    assert(
      rotatedFingerprint !==
        expectedFingerprint,
      "Rotated Portable Auth did not produce distinct fingerprint evidence.",
    );

    await portableStore.write(
      "LOCAL",
      rotatedEnvelope,
    );

    const rotatedPrincipal:
      FinoraBranchCredentialAuthenticationSuccess = {
        ...principal,

        authGeneration:
          2,
      };

    const trustedAfterRotation =
      await checkFinoraCurrentBranchDeviceTrust({
        principal:
          rotatedPrincipal,

        portableStore,
      });

    assert(
      trustedAfterRotation.success &&
      trustedAfterRotation.status ===
        "TRUSTED",
      "Credential rotation silently revoked the already-trusted exact device.",
    );

    const persistedAfterRotation =
      await loadFinoraBranchDeviceTrustStore();

    assert(
      persistedAfterRotation !==
        undefined &&
      persistedAfterRotation.records.length ===
        1 &&
      persistedAfterRotation.records[0].trustedAt ===
        authorized.record.trustedAt &&
      persistedAfterRotation.records[0].authGeneration ===
        1 &&
      persistedAfterRotation.records[0].portableAuthFingerprint ===
        expectedFingerprint,
      "Trusted-device continuity rewrote historical Device Trust evidence.",
    );

    console.log(
      "PASS: trusted exact device survives Portable Auth generation rotation without trust mutation",
    );

    const revokedAt =
      new Date().toISOString();

    await persistFinoraBranchDeviceTrustStore({
      ...persistedAfterRotation,

      records: [
        {
          ...persistedAfterRotation.records[0],
          status: "REVOKED",
          revokedAt,
          updatedAt: revokedAt,
        },
      ],

      updatedAt: revokedAt,
    });

    const revokedCheck =
      await checkFinoraCurrentBranchDeviceTrust({
        principal: rotatedPrincipal,
        portableStore,
      });

    assert(
      !revokedCheck.success &&
      revokedCheck.errorCode === "DEVICE_REVOKED",
      "Revoked exact current device remained trusted.",
    );

    console.log(
      "PASS: revoked exact current device fails trusted-device check",
    );

    const revokedReauthorization =
      await authorizeFinoraCurrentBranchDevice({
        principal: rotatedPrincipal,
        portableStore,
        password,
        securityCode,
      });

    assert(
      !revokedReauthorization.success &&
      revokedReauthorization.errorCode === "DEVICE_REVOKED",
      "Correct Security Code reactivated a revoked exact device.",
    );

    const persistedAfterRevokedReauthorization =
      await loadFinoraBranchDeviceTrustStore();

    assert(
      persistedAfterRevokedReauthorization !== undefined &&
      persistedAfterRevokedReauthorization.records.length === 1 &&
      persistedAfterRevokedReauthorization.records[0].status === "REVOKED" &&
      persistedAfterRevokedReauthorization.records[0].revokedAt === revokedAt,
      "Revoked Device Trust evidence was mutated or reactivated.",
    );

    console.log(
      "PASS: Security Code cannot reactivate revoked exact device",
    );

    const mismatchedPrincipal:
      FinoraBranchCredentialAuthenticationSuccess = {
        ...principal,

        branchId:
          "FINORA-OTHER-BRANCH",
      };

    const mismatchCheck =
      await checkFinoraCurrentBranchDeviceTrust({
        principal:
          mismatchedPrincipal,

        portableStore,
      });

    assert(
      !mismatchCheck.success &&
      mismatchCheck.errorCode ===
        "PORTABLE_AUTH_MISMATCH",
      "Portable branch-scope mismatch did not fail closed.",
    );

    console.log(
      "PASS: Portable envelope branch-scope mismatch fails closed",
    );

    assert(
      localResolverCalls >
        0 &&
      usbResolverCalls ===
        0,
      "LOCAL Device Trust authority unexpectedly resolved USB.",
    );

    console.log(
      "PASS: LOCAL trust authority has zero USB fallback",
    );

    const serializedTrust =
      JSON.stringify(
        persisted,
      );

    assert(
      !serializedTrust.includes(
        password,
      ) &&
      !serializedTrust.includes(
        securityCode,
      ) &&
      !serializedTrust.includes(
        "privateKey",
      ),
      "Device Trust persisted forbidden secret material.",
    );

    console.log(
      "PASS: Device Trust persistence contains no Password, Security Code or private key",
    );

    console.log(
      "============================================================",
    );

    console.log(
      "PASS: PHASE 5.6E3D4D2 BRANCH DEVICE TRUST AUTHORITY RUNTIME SELFTEST",
    );

    console.log(
      "============================================================",
    );
  }
  catch (
    error
  ) {
    failure =
      error;
  }
  finally {
    if (
      temporaryUserData !==
        undefined
    ) {
      try {
        await rm(
          temporaryUserData,
          {
            recursive:
              true,

            force:
              true,
          },
        );

        console.log(
          "PASS: isolated Device Trust Authority userData deleted",
        );
      }
      catch (
        cleanupError
      ) {
        if (!failure) {
          failure =
            cleanupError;
        }
      }
    }
  }

  if (failure) {
    throw failure;
  }
}

void runSelfTest()
  .then(
    () => {
      console.log(
        "PASS: Device Trust Authority self-test process exiting with code 0",
      );

      app.exit(
        0,
      );
    },
  )
  .catch(
    (
      error,
    ) => {
      console.error(
        "FAIL: PHASE 5.6E3D4D2 BRANCH DEVICE TRUST AUTHORITY RUNTIME SELFTEST",
        error,
      );

      app.exit(
        1,
      );
    },
  );