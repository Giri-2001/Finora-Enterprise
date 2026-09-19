import { app } from "electron";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { canonicalizeFinoraControlCenterValue, createFinoraControlCenterPayloadDigest } from "../control-center/finoraControlCenterCanonicalization.js";
import { generateFinoraControlCenterSigningMaterial, signFinoraControlCenterCanonicalValue } from "../control-center/finoraControlCenterCrypto.js";
import { ensureFinoraWindowsInstallationBinding } from "./finoraInstallationBindingService.js";
import type { FinoraBranchTrustedControlPublicKey } from "./finoraSignedControlPackageVerifier.js";
import type { FinoraControlInstallationIdentity } from "./finoraControlStore.js";
import { readFinoraControlStore, saveFinoraInstallationIdentity } from "./finoraControlStore.js";
import { FINORA_BRANCH_DEVICE_TRUST_FORMAT, FINORA_BRANCH_DEVICE_TRUST_RECORD_SCHEMA_VERSION, FINORA_BRANCH_DEVICE_TRUST_SCHEMA_VERSION, loadFinoraBranchDeviceTrustStore, persistFinoraBranchDeviceTrustStore } from "./finoraBranchDeviceTrustStore.js";
import type { FinoraBranchDeviceRevocationPackageTarget } from "./finoraBranchDeviceTrustRevocationPackage.types.js";
import { applyFinoraSignedBranchDeviceRevocationPackage } from "./finoraBranchDeviceTrustRevocationPackageApplyService.js";

function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }
function expectSuccess(label: string, result: { success: boolean; error?: string }): void { assert(result.success, result.error ?? (label + ": expected success.")); console.log("PASS: " + label); }
function expectFailure(label: string, result: { success: boolean; error?: string }, text?: string): void { assert(!result.success, label + ": expected failure."); if (text !== undefined) assert((result.error ?? "").includes(text), label + ": unexpected error: " + (result.error ?? "")); console.log("PASS: " + label); }

function createSignedPackage(input: { packageId: string; purpose?: string; payloadVersion?: number; target: FinoraBranchDeviceRevocationPackageTarget; issuedAt: string; sequence: number; payload: Record<string, unknown>; issuerId: string; signingKeyId: string; privateKeyPkcs8DerBase64: string }) {
  const unsignedPackage = { packageId: input.packageId, purpose: input.purpose ?? "DEVICE_REVOCATION", issuer: { type: "FINORA_CONTROL_CENTER" as const, issuerId: input.issuerId, signingKeyId: input.signingKeyId }, target: { ...input.target }, issuedAt: input.issuedAt, sequence: input.sequence, payloadVersion: input.payloadVersion ?? 1, payload: input.payload, payloadDigest: createFinoraControlCenterPayloadDigest(input.payload), schemaVersion: 1 as const };
  const signature = signFinoraControlCenterCanonicalValue(canonicalizeFinoraControlCenterValue(unsignedPackage), input.privateKeyPkcs8DerBase64);
  return { ...unsignedPackage, signature: { algorithm: "ECDSA_P256_SHA256" as const, encoding: "IEEE_P1363" as const, canonicalization: "FINORA_CANONICAL_JSON_V1" as const, signingKeyId: input.signingKeyId, value: signature } };
}

async function runSelfTest(): Promise<void> {
  const temporaryUserData = await mkdtemp(join(tmpdir(), "finora-device-revocation-selftest-"));
  let failure: unknown;
  try {
    app.setPath("userData", temporaryUserData);
    await app.whenReady();
    console.log("PASS: isolated Electron userData configured");

    const nativeBinding = await ensureFinoraWindowsInstallationBinding();
    console.log("PASS: isolated native Windows installation binding created");

    const now = new Date();
    const verificationNow = new Date(now.getTime() + 5000);
    const baseTimestamp = new Date(now.getTime() - 30 * 60 * 1000).toISOString();
    const ownerId = "OWNER-DEVICE-REVOCATION-SELFTEST";
    const businessId = "BUSINESS-DEVICE-REVOCATION-SELFTEST";
    const branchId = "BRANCH-DEVICE-REVOCATION-SELFTEST";
    const userId = "USER-DEVICE-REVOCATION-SELFTEST";
    const canonicalUsername = "owner-device-revocation-selftest";

    const installation: FinoraControlInstallationIdentity = { installationId: nativeBinding.installationId, ownerId, businessId, branchId, businessCode: "DVR01", branchCode: "B01", createdAt: baseTimestamp, updatedAt: baseTimestamp, schemaVersion: 1 };
    expectSuccess("isolated Control Store installation identity persisted", await saveFinoraInstallationIdentity(installation));

    await persistFinoraBranchDeviceTrustStore({
      format: FINORA_BRANCH_DEVICE_TRUST_FORMAT,
      schemaVersion: FINORA_BRANCH_DEVICE_TRUST_SCHEMA_VERSION,
      records: [{ authStateId: "FINORA-AUTH-STATE-DEVICE-REVOCATION-SELFTEST", userId, canonicalUsername, ownerId, businessId, branchId, storageMode: "LOCAL", dataContext: "REAL", authGeneration: 1, portableAuthFingerprintAlgorithm: "SHA256", portableAuthFingerprint: "a".repeat(64), platform: "WINDOWS", installationId: nativeBinding.installationId, bindingKeyId: nativeBinding.bindingKeyId, fingerprintAlgorithm: nativeBinding.fingerprintAlgorithm, publicKeyFingerprint: nativeBinding.publicKeyFingerprint, status: "ACTIVE", trustedAt: baseTimestamp, updatedAt: baseTimestamp, schemaVersion: FINORA_BRANCH_DEVICE_TRUST_RECORD_SCHEMA_VERSION }],
      updatedAt: baseTimestamp,
    });
    console.log("PASS: exact ACTIVE Device Trust fixture persisted");

    const signingMaterial = generateFinoraControlCenterSigningMaterial();
    const issuerId = "FINORA-DEVICE-REVOCATION-SELFTEST-CONTROL-CENTER";
    const trustedKeys: FinoraBranchTrustedControlPublicKey[] = [{ issuerId, signingKeyId: signingMaterial.signingKeyId, algorithm: "ECDSA_P256_SHA256", format: "SPKI_DER_BASE64", publicKey: signingMaterial.publicKeySpkiDerBase64, status: "ACTIVE", validFrom: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString() }];
    const target: FinoraBranchDeviceRevocationPackageTarget = { ownerId, businessId, branchId, installationId: nativeBinding.installationId, bindingKeyId: nativeBinding.bindingKeyId, fingerprintAlgorithm: "SHA-256", publicKeyFingerprint: nativeBinding.publicKeyFingerprint };
    const issuedAt = now.toISOString();
    const payload = { schemaVersion: 1, action: "REVOKE", issuedAt, userId, canonicalUsername, storageMode: "LOCAL", dataContext: "REAL", reason: "Signed E2E self-test device revocation." };
    const signedPackage = createSignedPackage({ packageId: "FINORA-DEVICE-REVOCATION-SELFTEST-VALID", target, issuedAt, sequence: 1, payload, issuerId, signingKeyId: signingMaterial.signingKeyId, privateKeyPkcs8DerBase64: signingMaterial.privateKeyPkcs8DerBase64 });

    const applyResult = await applyFinoraSignedBranchDeviceRevocationPackage(signedPackage, trustedKeys, verificationNow);
    expectSuccess("valid signed DEVICE_REVOCATION applied", applyResult);
    assert(applyResult.data?.status === "REVOKED" && applyResult.data.changedRecords === 1, "Valid Device Revocation did not revoke exactly one ACTIVE record.");

    const revokedStore = await loadFinoraBranchDeviceTrustStore();
    assert(revokedStore !== undefined && revokedStore.records.length === 1 && revokedStore.records[0].status === "REVOKED" && typeof revokedStore.records[0].revokedAt === "string", "Persisted Device Trust was not terminal REVOKED.");
    const revokedSnapshot = JSON.stringify(revokedStore);
    console.log("PASS: exact Device Trust record persisted as terminal REVOKED");

    const controlStore = await readFinoraControlStore();
    assert(controlStore.success && controlStore.data, controlStore.error ?? "Unable to read Device Revocation Control Store.");
    assert(controlStore.data.appliedControlPackages?.some((item) => item.packageId === "FINORA-DEVICE-REVOCATION-SELFTEST-VALID" && item.purpose === "DEVICE_REVOCATION"), "Successful Device Revocation missing from applied-package ledger.");
    assert(controlStore.data.controlSequences?.some((item) => item.issuerId === issuerId && item.purpose === "DEVICE_REVOCATION" && item.installationId === nativeBinding.installationId && item.lastSequence === 1), "Successful Device Revocation missing from sequence high-water state.");
    console.log("PASS: Device Revocation replay ledger and sequence high-water persisted");

    const replayResult = await applyFinoraSignedBranchDeviceRevocationPackage(signedPackage, trustedKeys, verificationNow);
    expectFailure("same signed DEVICE_REVOCATION package replay rejected", replayResult, "REPLAYED_PACKAGE");
    const afterReplay = await loadFinoraBranchDeviceTrustStore();
    assert(afterReplay !== undefined && JSON.stringify(afterReplay) === revokedSnapshot, "Rejected replay mutated Device Trust state.");
    console.log("PASS: replay rejection preserved terminal Device Trust state");

    const expectZeroMutationFailure = async (label: string, operation: () => Promise<{ success: boolean; error?: string }>, expectedText?: string): Promise<void> => {
      const beforeTrust = JSON.stringify(await loadFinoraBranchDeviceTrustStore());
      const beforeControl = await readFinoraControlStore();
      assert(beforeControl.success && beforeControl.data, beforeControl.error ?? (label + ": unable to read pre-state Control Store."));
      const beforeControlJson = JSON.stringify(beforeControl.data);
      const result = await operation();
      expectFailure(label, result, expectedText);
      const afterTrust = JSON.stringify(await loadFinoraBranchDeviceTrustStore());
      const afterControl = await readFinoraControlStore();
      assert(afterControl.success && afterControl.data, afterControl.error ?? (label + ": unable to read post-state Control Store."));
      assert(afterTrust === beforeTrust, label + ": rejected package mutated Device Trust state.");
      assert(JSON.stringify(afterControl.data) === beforeControlJson, label + ": rejected package mutated Control Store state.");
      console.log("PASS: " + label + " preserved Device Trust + Control Store state");
    };

    const badSignatureBase = createSignedPackage({ packageId: "FINORA-DEVICE-REVOCATION-SELFTEST-BAD-SIGNATURE", target, issuedAt, sequence: 2, payload, issuerId, signingKeyId: signingMaterial.signingKeyId, privateKeyPkcs8DerBase64: signingMaterial.privateKeyPkcs8DerBase64 });
    const badSignaturePackage = { ...badSignatureBase, signature: { ...badSignatureBase.signature, value: (badSignatureBase.signature.value[0] === "A" ? "B" : "A") + badSignatureBase.signature.value.slice(1) } };
    await expectZeroMutationFailure("tampered DEVICE_REVOCATION signature rejected", () => applyFinoraSignedBranchDeviceRevocationPackage(badSignaturePackage, trustedKeys, verificationNow), "INVALID_SIGNATURE");

    const wrongPurposePackage = createSignedPackage({ packageId: "FINORA-DEVICE-REVOCATION-SELFTEST-WRONG-PURPOSE", purpose: "STORAGE_ENTITLEMENT", target, issuedAt, sequence: 2, payload, issuerId, signingKeyId: signingMaterial.signingKeyId, privateKeyPkcs8DerBase64: signingMaterial.privateKeyPkcs8DerBase64 });
    await expectZeroMutationFailure("wrong signed purpose rejected", () => applyFinoraSignedBranchDeviceRevocationPackage(wrongPurposePackage, trustedKeys, verificationNow), "purpose must be DEVICE_REVOCATION");

    const wrongTarget = { ...target, ownerId: ownerId + "-WRONG" };
    const wrongTargetPackage = createSignedPackage({ packageId: "FINORA-DEVICE-REVOCATION-SELFTEST-WRONG-TARGET", target: wrongTarget, issuedAt, sequence: 2, payload, issuerId, signingKeyId: signingMaterial.signingKeyId, privateKeyPkcs8DerBase64: signingMaterial.privateKeyPkcs8DerBase64 });
    await expectZeroMutationFailure("wrong signed Device Revocation target rejected", () => applyFinoraSignedBranchDeviceRevocationPackage(wrongTargetPackage, trustedKeys, verificationNow));

    const wrongVersionPackage = createSignedPackage({ packageId: "FINORA-DEVICE-REVOCATION-SELFTEST-WRONG-VERSION", payloadVersion: 2, target, issuedAt, sequence: 2, payload, issuerId, signingKeyId: signingMaterial.signingKeyId, privateKeyPkcs8DerBase64: signingMaterial.privateKeyPkcs8DerBase64 });
    await expectZeroMutationFailure("unsupported Device Revocation payload version rejected", () => applyFinoraSignedBranchDeviceRevocationPackage(wrongVersionPackage, trustedKeys, verificationNow), "payload version is unsupported");

    const malformedPayload = { ...payload, reason: "" };
    const malformedPayloadPackage = createSignedPackage({ packageId: "FINORA-DEVICE-REVOCATION-SELFTEST-MALFORMED-PAYLOAD", target, issuedAt, sequence: 2, payload: malformedPayload, issuerId, signingKeyId: signingMaterial.signingKeyId, privateKeyPkcs8DerBase64: signingMaterial.privateKeyPkcs8DerBase64 });
    await expectZeroMutationFailure("malformed Device Revocation payload rejected", () => applyFinoraSignedBranchDeviceRevocationPackage(malformedPayloadPackage, trustedKeys, verificationNow), "payload structure is invalid");

    const staleSequencePackage = createSignedPackage({ packageId: "FINORA-DEVICE-REVOCATION-SELFTEST-STALE-SEQUENCE", target, issuedAt, sequence: 1, payload, issuerId, signingKeyId: signingMaterial.signingKeyId, privateKeyPkcs8DerBase64: signingMaterial.privateKeyPkcs8DerBase64 });
    await expectZeroMutationFailure("equal/stale DEVICE_REVOCATION sequence rejected", () => applyFinoraSignedBranchDeviceRevocationPackage(staleSequencePackage, trustedKeys, verificationNow), "STALE_SEQUENCE");

    console.log("PASS: DEVICE_REVOCATION negative matrix preserved zero mutation");
    console.log("PASS: FINORA SIGNED DEVICE REVOCATION E2E SELFTEST PART 1");
  } catch (error) { failure = error; } finally {
    try { await rm(temporaryUserData, { recursive: true, force: true }); console.log("PASS: isolated temporary FINORA userData deleted"); } catch (cleanupError) { if (!failure) failure = cleanupError; }
  }
  if (failure) throw failure;
}

void runSelfTest().then(() => app.exit(0), (error) => { console.error("FAIL: FINORA SIGNED DEVICE REVOCATION E2E SELFTEST PART 1", error); app.exit(1); });
