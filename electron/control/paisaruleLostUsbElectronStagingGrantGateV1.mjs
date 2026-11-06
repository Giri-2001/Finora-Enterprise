/** PAISARULE C117-R97: Electron-main-only signed grant-to-staging boundary.
 * Does NOT redeem grants, write USB, expose IPC, or authorize a restore commit.
 * Caller MUST inject a verified server-held P-256 public key (pinned by main).
 */
import { createHash, createPublicKey, KeyObject, timingSafeEqual, verify } from 'node:crypto';
const DENIED='PAISARULE_RESTORE_STAGING_DENIED';
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const SHA=/^[a-f0-9]{64}$/;
const FIELDS=['purpose','authorizationId','userId','ownerId','businessId','branchId','credentialId','canonicalUsername','authGeneration','backupSha256','issuedAt','expiresAt'];
const ID=x=>typeof x==='string'&&x.length>0&&x.length<=128&&x.trim()===x&&!/[\u0000-\u001f\u007f]/u.test(x);
const deny=()=>{throw Error(DENIED);};
const eq=(a,b)=>{if(!SHA.test(a)||!SHA.test(b))return false;const x=Buffer.from(a,'hex'),y=Buffer.from(b,'hex');try{return timingSafeEqual(x,y);}finally{x.fill(0);y.fill(0);}};
export function authorizePaisaruleLostUsbStagingV1({originalArchiveBytes,authoritativeOwner,authorizationId,signedEvidence,trustedPublicKey,now=new Date()}){
  if(!Buffer.isBuffer(originalArchiveBytes)||originalArchiveBytes.length===0||originalArchiveBytes.length>96*1024*1024||
    !authoritativeOwner||authoritativeOwner.role!=='OWNER'||authoritativeOwner.storageMode!=='USB'||authoritativeOwner.dataContext!=='REAL'||
    !['userId','ownerId','businessId','branchId','credentialId'].every(k=>ID(authoritativeOwner[k]))||
    !Number.isSafeInteger(authoritativeOwner.authGeneration)||authoritativeOwner.authGeneration<1||
    !ID(authoritativeOwner.canonicalUsername)||authoritativeOwner.canonicalUsername.length>100||
    authoritativeOwner.canonicalUsername!==authoritativeOwner.canonicalUsername.normalize('NFKC').toLowerCase()||
    typeof authorizationId!=='string'||!UUID.test(authorizationId)||
    !signedEvidence||typeof signedEvidence!=='object'||Array.isArray(signedEvidence)||
    Object.keys(signedEvidence).sort().join(',')!=='payload,signatureBase64'||
    !signedEvidence.payload||typeof signedEvidence.payload!=='object'||Array.isArray(signedEvidence.payload)||
    Object.keys(signedEvidence.payload).length!==FIELDS.length||!FIELDS.every(k=>Object.hasOwn(signedEvidence.payload,k))||
    typeof signedEvidence.signatureBase64!=='string'||
    !trustedPublicKey||!(now instanceof Date)||!Number.isFinite(now.getTime()))deny();
  const p=signedEvidence.payload;
  const digest=createHash('sha256').update(originalArchiveBytes).digest('hex');
  const values={purpose:'LOST_USB_BUSINESS_BACKUP_RESTORE',authorizationId,
    userId:authoritativeOwner.userId,ownerId:authoritativeOwner.ownerId,
    businessId:authoritativeOwner.businessId,branchId:authoritativeOwner.branchId,
    credentialId:authoritativeOwner.credentialId,canonicalUsername:authoritativeOwner.canonicalUsername,
    authGeneration:authoritativeOwner.authGeneration,backupSha256:digest,
    issuedAt:p.issuedAt,expiresAt:p.expiresAt};
  if(!UUID.test(p.authorizationId)||!SHA.test(p.backupSha256)||!eq(p.backupSha256,digest)||
    !FIELDS.every(k=>p[k]===values[k])||
    !['userId','ownerId','businessId','branchId','credentialId','canonicalUsername'].every(k=>ID(p[k]))||
    !Number.isSafeInteger(p.authGeneration)||p.authGeneration<1||
    typeof p.issuedAt!=='string'||typeof p.expiresAt!=='string')deny();
  const issued=Date.parse(p.issuedAt),expires=Date.parse(p.expiresAt);
  if(!Number.isFinite(issued)||!Number.isFinite(expires)||new Date(issued).toISOString()!==p.issuedAt||
    new Date(expires).toISOString()!==p.expiresAt||expires<=issued||expires-issued>120000||
    issued>now.getTime()||expires<=now.getTime())deny();
  let signature;
  try{
    signature=Buffer.from(signedEvidence.signatureBase64,'base64');
    if(signature.length!==64||signature.toString('base64')!==signedEvidence.signatureBase64)deny();
    const key=trustedPublicKey instanceof KeyObject?trustedPublicKey:createPublicKey(trustedPublicKey);
    if(key.type!=='public'||key.asymmetricKeyType!=='ec'||key.asymmetricKeyDetails?.namedCurve!=='prime256v1')deny();
    const data=Buffer.from(JSON.stringify(FIELDS.map(k=>p[k])),'utf8');
    try{
      if(!verify('sha256',data,{key,dsaEncoding:'ieee-p1363'},signature))deny();
    }finally{data.fill(0);}
  }catch{deny();}finally{signature?.fill(0);}
  return Object.freeze({authorizedForStaging:true,usbCommitAuthorized:false,redemptionVerified:false,
    authorizationId,backupSha256:digest,branchId:authoritativeOwner.branchId,
    credentialId:authoritativeOwner.credentialId,authGeneration:authoritativeOwner.authGeneration});
}