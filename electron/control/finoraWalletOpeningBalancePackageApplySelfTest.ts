/* ============================================================
   FINORA ENTERPRISE OS

   CONTROL PLANE
   WALLET OPENING BALANCE PACKAGE APPLY SELF TEST

   ISOLATION:
   - Temporary Electron userData
   - Temporary Control Store
   - Ephemeral Control Center signing key
   - No production Control Center key vault
   - No production FINORA userData
   - Temporary state deleted before exit

   COVERAGE:
   - Valid signed WALLET_OPENING_BALANCE
   - Canonical opening balance persistence
   - Same-package replay rejection
   - Wrong Wallet ID rejection
   - Wrong Branch rejection
   - Invalid opening balance rejection
   - Temporary canonical vault cleanup
   ============================================================ */

import {
  app,
} from "electron";

import {
  mkdtemp,
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
} from "../control-center/finoraControlCenterCanonicalization.js";

import {
  generateFinoraControlCenterSigningMaterial,
  signFinoraControlCenterCanonicalValue,
} from "../control-center/finoraControlCenterCrypto.js";

import type {
  FinoraBranchTrustedControlPublicKey,
} from "./finoraSignedControlPackageVerifier.js";

import type {
  FinoraControlInstallationIdentity,
} from "./finoraControlStore.js";

import {
  saveFinoraInstallationIdentity,
} from "./finoraControlStore.js";

import {
  ensureFinoraWindowsInstallationBinding,
} from "./finoraInstallationBindingService.js";

import {
  loadFinoraCanonicalWalletAuthorityVault,
} from "./finoraCanonicalWalletAuthorityVault.js";

import {
  applyFinoraSignedWalletOpeningBalancePackage,
} from "./finoraWalletOpeningBalancePackageApplyService.js";

function assert(
  condition:
    boolean,
  message:
    string,
): void {

  if (!condition) {
    throw new Error(
      message,
    );
  }
}

function createSignedPackage(
  input: {
    packageId:
      string;

    target: {
      ownerId:
        string;

      businessId:
        string;

      branchId:
        string;
    };

    issuedAt:
      string;

    sequence:
      number;

    payload:
      Record<string, unknown>;

    issuerId:
      string;

    signingKeyId:
      string;

    privateKeyPkcs8DerBase64:
      string;
  },
) {

  const unsignedPackage = {
    packageId:
      input.packageId,

    purpose:
      "WALLET_OPENING_BALANCE",

    issuer: {
      type:
        "FINORA_CONTROL_CENTER" as const,

      issuerId:
        input.issuerId,

      signingKeyId:
        input.signingKeyId,
    },

    target: {
      ...input.target,
    },

    issuedAt:
      input.issuedAt,

    sequence:
      input.sequence,

    payloadVersion:
      1,

    payload:
      input.payload,

    payloadDigest:
      createFinoraControlCenterPayloadDigest(
        input.payload,
      ),

    schemaVersion:
      1 as const,
  };

  const canonicalPackage =
    canonicalizeFinoraControlCenterValue(
      unsignedPackage,
    );

  const signature =
    signFinoraControlCenterCanonicalValue(
      canonicalPackage,
      input.privateKeyPkcs8DerBase64,
    );

  return {
    ...unsignedPackage,

    signature: {
      algorithm:
        "ECDSA_P256_SHA256" as const,

      encoding:
        "IEEE_P1363" as const,

      canonicalization:
        "FINORA_CANONICAL_JSON_V1" as const,

      signingKeyId:
        input.signingKeyId,

      value:
        signature,
    },
  };
}

async function main(): Promise<void> {

  let temporaryUserData:
    string | undefined;

  let failure:
    unknown;

  try {

    temporaryUserData =
      await mkdtemp(
        join(
          tmpdir(),
          "finora-wallet-opening-balance-selftest-",
        ),
      );

    app.setPath(
      "userData",
      temporaryUserData,
    );

    await app.whenReady();

    console.log(
      "PASS: isolated temporary FINORA userData created",
    );

    const now =
      new Date();

    const nativeBinding =
      await ensureFinoraWindowsInstallationBinding();

    console.log(
      "PASS: isolated native Windows installation binding created",
    );

    const issuedAt =
      now.toISOString();

    const scope = {
      ownerId:
        "OWNER-WALLET-OPENING-SELFTEST",

      businessId:
        "BUSINESS-WALLET-OPENING-SELFTEST",

      branchId:
        "BRANCH-WALLET-OPENING-SELFTEST",
    };

    const walletId =
      [
        "FINORA",
        "WALLET",
        "OWNER-WALLET-OPENING-SELFTEST",
        "BUSINESS-WALLET-OPENING-SELFTEST",
        "BRANCH-WALLET-OPENING-SELFTEST",
      ].join(":");

    const installation:
      FinoraControlInstallationIdentity =
      {
        installationId:
          "FINORA-INSTALLATION-WALLET-OPENING-SELFTEST",

        ownerId:
          scope.ownerId,

        businessId:
          scope.businessId,

        branchId:
          scope.branchId,

        businessCode:
          "WOB01",

        branchCode:
          "B01",

        createdAt:
          issuedAt,

        updatedAt:
          issuedAt,

        schemaVersion:
          1,
      };

    const installationResult =
      await saveFinoraInstallationIdentity(
        installation,
      );

    assert(
      installationResult.success,
      installationResult.error ??
        "Unable to save isolated installation identity.",
    );

    console.log(
      "PASS: isolated Control Store installation identity persisted",
    );

    const signingMaterial =
      generateFinoraControlCenterSigningMaterial();

    const issuerId =
      "FINORA-WALLET-OPENING-SELFTEST-CONTROL-CENTER";

    const trustedKeys:
      FinoraBranchTrustedControlPublicKey[] =
      [
        {
          issuerId,

          signingKeyId:
            signingMaterial.signingKeyId,

          algorithm:
            "ECDSA_P256_SHA256",

          format:
            "SPKI_DER_BASE64",

          publicKey:
            signingMaterial.publicKeySpkiDerBase64,

          status:
            "ACTIVE",

          validFrom:
            new Date(
              now.getTime() -
                24 * 60 * 60 * 1000,
            ).toISOString(),
        },
      ];

    console.log(
      "PASS: ephemeral Control Center signing identity created",
    );

    const target = {
      ownerId:
        scope.ownerId,

      businessId:
        scope.businessId,

      branchId:
        scope.branchId,

      installationId:
        nativeBinding.installationId,

      bindingKeyId:
        nativeBinding.bindingKeyId,

      fingerprintAlgorithm:
        nativeBinding.fingerprintAlgorithm,

      publicKeyFingerprint:
        nativeBinding.publicKeyFingerprint,
    };

    const payload = {
      scope,

      walletId,

      openingBalanceMinor:
        7000,

      schemaVersion:
        1,
    };

    /* ========================================================
       TEST 1 - VALID ₹70 OPENING BALANCE
       ======================================================== */

    console.log(
      "===== OPENING BALANCE TARGET DIAGNOSTIC =====",
    );

    console.log(
      "INSTALLATION OWNER = " +
        String(installation.ownerId),
    );

    console.log(
      "PACKAGE TARGET OWNER = " +
        String(target.ownerId),
    );

    console.log(
      "INSTALLATION BUSINESS = " +
        String(installation.businessId),
    );

    console.log(
      "PACKAGE TARGET BUSINESS = " +
        String(target.businessId),
    );

    console.log(
      "INSTALLATION BRANCH = " +
        String(installation.branchId),
    );

    console.log(
      "PACKAGE TARGET BRANCH = " +
        String(target.branchId),
    );

    console.log(
      "OWNER MATCH = " +
        String(
          target.ownerId ===
            installation.ownerId,
        ),
    );

    console.log(
      "BUSINESS MATCH = " +
        String(
          target.businessId ===
            installation.businessId,
        ),
    );

    console.log(
      "BRANCH MATCH = " +
        String(
          target.branchId ===
            installation.branchId,
        ),
    );

    const validPackage =
      createSignedPackage({
        packageId:
          "FINORA-WALLET-OPENING-SELFTEST-VALID",

        target,

        issuedAt,

        sequence:
          1,

        payload,

        issuerId,

        signingKeyId:
          signingMaterial.signingKeyId,

        privateKeyPkcs8DerBase64:
          signingMaterial.privateKeyPkcs8DerBase64,
      });

    const validResult =
      await applyFinoraSignedWalletOpeningBalancePackage(
        validPackage,
        trustedKeys,
        now,
      );

    assert(
      validResult.success,
      validResult.error ??
        "Valid signed WALLET_OPENING_BALANCE was rejected.",
    );

    assert(
      validResult.data?.openingBalance ===
        70,
      "Opening Balance result is not ₹70.",
    );

    console.log(
      "PASS: valid signed WALLET_OPENING_BALANCE applied at ₹70",
    );

    const persisted =
      await loadFinoraCanonicalWalletAuthorityVault();

    assert(
      persisted !== undefined,
      "Canonical Wallet Authority was not persisted.",
    );

    if (!persisted) {
      throw new Error(
        "Canonical Wallet Authority was unexpectedly unavailable after successful apply.",
      );
    }

    assert(
      persisted.authoritativeBalance ===
        70,
      "Persisted canonical balance is not ₹70.",
    );

    assert(
      persisted.walletId ===
        walletId,
      "Persisted canonical Wallet ID mismatch.",
    );

    console.log(
      "PASS: canonical Wallet Authority persisted at ₹70",
    );

    /* ========================================================
       TEST 2 - EXACT REPLAY
       ======================================================== */

    const replayResult =
      await applyFinoraSignedWalletOpeningBalancePackage(
        validPackage,
        trustedKeys,
        now,
      );

    assert(
      !replayResult.success,
      "Same opening-balance package replay was accepted.",
    );

    console.log(
      "PASS: same signed WALLET_OPENING_BALANCE package rejected on replay",
    );

    /* ========================================================
       TEST 3 - WRONG WALLET ID
       ======================================================== */

    const wrongWalletPayload = {
      ...payload,

      walletId:
        "FINORA:WALLET:WRONG:WALLET:IDENTITY",
    };

    const wrongWalletPackage =
      createSignedPackage({
        packageId:
          "FINORA-WALLET-OPENING-SELFTEST-WRONG-WALLET",

        target,

        issuedAt,

        sequence:
          2,

        payload:
          wrongWalletPayload,

        issuerId,

        signingKeyId:
          signingMaterial.signingKeyId,

        privateKeyPkcs8DerBase64:
          signingMaterial.privateKeyPkcs8DerBase64,
      });

    const wrongWalletResult =
      await applyFinoraSignedWalletOpeningBalancePackage(
        wrongWalletPackage,
        trustedKeys,
        now,
      );

    assert(
      !wrongWalletResult.success,
      "Wrong Wallet ID opening-balance package was accepted.",
    );

    console.log(
      "PASS: wrong Wallet ID rejected",
    );

    /* ========================================================
       TEST 4 - WRONG BRANCH
       ======================================================== */

    const wrongBranchTarget = {
      ownerId:
        scope.ownerId,

      businessId:
        scope.businessId,

      branchId:
        "BRANCH-WALLET-OPENING-OTHER",
    };

    const wrongBranchPayload = {
      scope: {
        ownerId:
          scope.ownerId,

        businessId:
          scope.businessId,

        branchId:
          "BRANCH-WALLET-OPENING-OTHER",
      },

      walletId:
        "FINORA:WALLET:OWNER-WALLET-OPENING-SELFTEST:BUSINESS-WALLET-OPENING-SELFTEST:BRANCH-WALLET-OPENING-OTHER",

      openingBalanceMinor:
        7000,

      schemaVersion:
        1,
    };

    const wrongBranchPackage =
      createSignedPackage({
        packageId:
          "FINORA-WALLET-OPENING-SELFTEST-WRONG-BRANCH",

        target:
          wrongBranchTarget,

        issuedAt,

        sequence:
          3,

        payload:
          wrongBranchPayload,

        issuerId,

        signingKeyId:
          signingMaterial.signingKeyId,

        privateKeyPkcs8DerBase64:
          signingMaterial.privateKeyPkcs8DerBase64,
      });

    const wrongBranchResult =
      await applyFinoraSignedWalletOpeningBalancePackage(
        wrongBranchPackage,
        trustedKeys,
        now,
      );

    assert(
      !wrongBranchResult.success,
      "Wrong Branch opening-balance package was accepted.",
    );

    console.log(
      "PASS: wrong Branch rejected",
    );

    /* ========================================================
       TEST 5 - INVALID OPENING BALANCE
       ======================================================== */

    const invalidBalancePackage =
      createSignedPackage({
        packageId:
          "FINORA-WALLET-OPENING-SELFTEST-INVALID-BALANCE",

        target,

        issuedAt,

        sequence:
          4,

        payload: {
          ...payload,

          openingBalanceMinor:
            -1,
        },

        issuerId,

        signingKeyId:
          signingMaterial.signingKeyId,

        privateKeyPkcs8DerBase64:
          signingMaterial.privateKeyPkcs8DerBase64,
      });

    const invalidBalanceResult =
      await applyFinoraSignedWalletOpeningBalancePackage(
        invalidBalancePackage,
        trustedKeys,
        now,
      );

    assert(
      !invalidBalanceResult.success,
      "Invalid opening balance was accepted.",
    );

    console.log(
      "PASS: invalid opening balance rejected",
    );

    /* ========================================================
       TEST 6 - FINAL CANONICAL STATE UNCHANGED
       ======================================================== */

    const finalState =
      await loadFinoraCanonicalWalletAuthorityVault();

    assert(
      finalState !== undefined,
      "Canonical Authority disappeared unexpectedly.",
    );

    if (!finalState) {
      throw new Error(
        "Canonical Wallet Authority was unexpectedly unavailable during final-state verification.",
      );
    }

    assert(
      finalState.authoritativeBalance ===
        70,
      "Negative tests mutated canonical balance.",
    );

    assert(
      finalState.walletId ===
        walletId,
      "Negative tests changed canonical Wallet ID.",
    );

    console.log(
      "PASS: negative opening-balance tests caused zero canonical mutation",
    );

    console.log(
      "PASS: FINORA WALLET OPENING BALANCE ISOLATED SELF-TEST",
    );

  }
  catch (error) {

    failure =
      error;

  }
  finally {

    if (temporaryUserData) {

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
          "PASS: isolated temporary FINORA userData deleted",
        );

      }
      catch (cleanupError) {

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

const selfTestKeepAlive =
  setInterval(
    () => {
      // Intentionally empty.
    },
    1000,
  );

void main()
  .then(
    async () => {

      clearInterval(
        selfTestKeepAlive,
      );

      await new Promise<void>(
        (
          resolve,
        ) => {
          process.stdout.write(
            "",
            () => {
              process.stderr.write(
                "",
                () => {
                  resolve();
                },
              );
            },
          );
        },
      );

      app.exit(
        0,
      );
    },
    async (
      error,
    ) => {

      clearInterval(
        selfTestKeepAlive,
      );

      console.error(
        "FAIL: FINORA WALLET OPENING BALANCE ISOLATED SELF-TEST",
        error,
      );

      await new Promise<void>(
        (
          resolve,
        ) => {
          process.stdout.write(
            "",
            () => {
              process.stderr.write(
                "",
                () => {
                  resolve();
                },
              );
            },
          );
        },
      );

      app.exit(
        1,
      );
    },
  );






