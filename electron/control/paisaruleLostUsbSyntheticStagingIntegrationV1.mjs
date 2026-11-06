/** C117-R98: Synthetic-only signed-evidence-to-temp-dir restore integration.
 * Intentionally NEVER accepts a USB path or grants production restore permission.
 * The signed evidence is NOT a server redemption acknowledgment.
 */
import { authorizePaisaruleLostUsbStagingV1 } from './paisaruleLostUsbElectronStagingGrantGateV1.mjs';
import { stageAndCommitPaisaruleRestoreV1 } from './paisaruleLostUsbAtomicRestoreSyntheticV1.mjs';
export async function runPaisaruleSyntheticStagingIntegrationV1(input) {
  if (!input || Object.getPrototypeOf(input) !== Object.prototype ||
      Object.keys(input).sort().join(',') !== 'authoritativeOwner,authorizationId,destinationName,files,now,originalArchiveBytes,parentDirectory,signedEvidence,trustedPublicKey') {
    throw new Error('PAISARULE_SYNTHETIC_STAGING_DENIED');
  }
  const approved = authorizePaisaruleLostUsbStagingV1({
    originalArchiveBytes:input.originalArchiveBytes,
    authoritativeOwner:input.authoritativeOwner,
    authorizationId:input.authorizationId,
    signedEvidence:input.signedEvidence,
    trustedPublicKey:input.trustedPublicKey,
    now:input.now,
  });
  if (approved.authorizedForStaging !== true || approved.usbCommitAuthorized !== false ||
      approved.redemptionVerified !== false) throw Error('PAISARULE_SYNTHETIC_STAGING_DENIED');
  const result = await stageAndCommitPaisaruleRestoreV1({
    parentDirectory:input.parentDirectory,destinationName:input.destinationName,
    files:input.files,allowSyntheticOnly:true,
  });
  return Object.freeze({ syntheticOnly:true,usbCommitAuthorized:false,redemptionVerified:false,
    filesCommittedToOsTemp:result.filesCommitted,authorizationId:approved.authorizationId });
}
