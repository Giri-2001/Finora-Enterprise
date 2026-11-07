import React, { useEffect, useState } from "react";

export type PaisaruleRestoreStage =
  | "preview" | "confirm" | "progress" | "success" | "error";

export interface PaisaruleRestoreCounts {
  customers?: number;
  loans?: number;
  collections?: number;
  goldRecords?: number;
  totalStorageRecords?: number;
}

export interface PaisaruleRestorePremiumDialogProps {
  open: boolean;
  stage: PaisaruleRestoreStage;
  counts?: PaisaruleRestoreCounts;
  backupVerified: boolean;
  authorizationVerified: boolean;
  targetVerified: boolean;
  targetEmpty: boolean;
  countsVerified: boolean;
  // PAISARULE_C117_R270_R1_GATE
  commitReady?: boolean;
  sourceLabel?: string;
  destinationLabel?: string;
  progressPercent?: number;
  restoreWritten?: boolean;
  checksumMatched?: boolean;
  sourceSha256?: string;
  targetSha256?: string;
  errorMessage?: string;
  onClose: () => void;
  onContinue: () => void;
  onBack: () => void;
  onRestore: () => void;
  onOpenApp?: () => void;
}

const gold = "#D9B66E";
const muted = "#A8B5CA";

const surface: React.CSSProperties = {
  color: "#F8FAFC",
  background: "linear-gradient(145deg,#192742,#101827 60%,#0D1320)",
  border: "1px solid rgba(217,182,110,.4)",
  borderRadius: 22,
  padding: 26,
  width: "min(94vw,520px)",
  maxHeight: "96vh",
  overflowY: "auto",
  boxShadow: "0 24px 85px rgba(0,0,0,.58)",
  fontFamily: "inherit",
};

const tile: React.CSSProperties = {
  background: "rgba(255,255,255,.045)",
  border: "1px solid rgba(255,255,255,.11)",
  borderRadius: 14,
  padding: 14,
};

const primary: React.CSSProperties = {
  background: "linear-gradient(110deg,#D9B66E,#F5DEA1)",
  color: "#182132",
  border: 0,
  borderRadius: 12,
  padding: "12px 18px",
  fontWeight: 700,
  cursor: "pointer",
};

const secondary: React.CSSProperties = {
  ...primary,
  background: "rgba(255,255,255,.07)",
  color: "#F8FAFC",
  border: "1px solid rgba(255,255,255,.18)",
};

function validCount(value: unknown): value is number {
  return typeof value === "number" &&
    Number.isSafeInteger(value) && value >= 0;
}

function Count({
  name, count, icon,
}: {
  name: string;
  count?: number;
  icon: string;
}) {
  return (
    <div style={tile}>
      <div style={{fontSize:12,color:muted}}>
        {icon} {name}
      </div>
      <div style={{fontSize:26,fontWeight:750,marginTop:5}}>
        {validCount(count) ? count.toLocaleString("en-IN") : "—"}
      </div>
    </div>
  );
}

function Line({name,value}: {name:string;value:string}) {
  return (
    <div style={{
      display:"flex",
      justifyContent:"space-between",
      gap:12,
      marginTop:13,
      fontSize:13,
    }}>
      <span style={{color:muted}}>{name}</span>
      <strong style={{overflowWrap:"anywhere",textAlign:"right"}}>
        {value}
      </strong>
    </div>
  );
}

export default function PaisaruleRestorePremiumDialog(
  props: PaisaruleRestorePremiumDialogProps,
) {
  const [confirmed,setConfirmed] = useState(false);

  useEffect(() => {
    setConfirmed(false);
  }, [props.open, props.stage]);

  if (!props.open) return null;

  const verified =
    props.backupVerified &&
    props.authorizationVerified &&
    props.targetVerified &&
    props.targetEmpty &&
    props.countsVerified;

  const completeCounts =
    validCount(props.counts?.customers) &&
    validCount(props.counts?.loans) &&
    validCount(props.counts?.collections) &&
    validCount(props.counts?.goldRecords);

  const shaValid = (s: unknown): s is string =>
    typeof s === "string" && /^[0-9a-f]{64}$/i.test(s);

  const checksumPass =
    props.restoreWritten === true &&
    props.checksumMatched === true &&
    shaValid(props.sourceSha256) &&
    shaValid(props.targetSha256) &&
    props.sourceSha256.toLowerCase() ===
      props.targetSha256.toLowerCase();

  const stage =
    props.stage === "success" && !checksumPass
      ? "error" : props.stage;

  const headings = {
    preview: "Backup Verified",
    confirm: "Confirm USB Restore",
    progress: "Restoring Your Branch",
    success: "Restore Completed Successfully",
    error: "Restore Not Completed",
  };

  const progress = typeof props.progressPercent === "number" &&
    Number.isFinite(props.progressPercent)
      ? Math.min(100,Math.max(0,props.progressPercent))
      : 0;

  return (
    <div role="presentation" style={{
      position:"fixed",
      inset:0,
      zIndex:4800,
      display:"flex",
      alignItems:"center",
      justifyContent:"center",
      padding:14,
      background:"rgba(3,8,17,.8)",
      backdropFilter:"blur(8px)",
    }}>
      <div role="dialog" aria-modal="true"
        aria-labelledby="paisarule-restore-title"
        style={surface}>
        <div style={{
          height:3,
          background:`linear-gradient(90deg,transparent,${gold},transparent)`,
          marginBottom:19,
        }}/>
        <div style={{
          color:gold,
          fontSize:11,
          fontWeight:800,
          letterSpacing:2,
        }}>
          PAISARULE · SECURE RECOVERY
        </div>

        <h2 id="paisarule-restore-title"
          style={{fontSize:23,margin:"12px 0"}}>
          {stage === "success" ? "✓ " : ""}
          {headings[stage]}
        </h2>

        <p style={{color:muted,fontSize:13,lineHeight:1.65}}>
          {stage === "preview"
            ? "Review the verified backup before restoring."
            : stage === "confirm"
            ? "Confirm the selected branch folder."
            : stage === "progress"
            ? "Keep the USB connected until verification finishes."
            : stage === "success"
            ? "Restored data passed the supplied integrity checks."
            : "A successful restore has not been confirmed."}
        </p>

        {(stage === "preview" || stage === "confirm") && (
          <>
            <div style={{
              display:"grid",
              gridTemplateColumns:"repeat(2,minmax(0,1fr))",
              gap:10,
              marginTop:18,
            }}>
              <Count name="Customers" icon="♧"
                count={props.countsVerified
                  ? props.counts?.customers : undefined}/>
              <Count name="Loans" icon="▣"
                count={props.countsVerified
                  ? props.counts?.loans : undefined}/>
              <Count name="Collections" icon="↙"
                count={props.countsVerified
                  ? props.counts?.collections : undefined}/>
              <Count name="Gold Records" icon="◇"
                count={props.countsVerified
                  ? props.counts?.goldRecords : undefined}/>
            </div>

            <div style={{
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  marginTop: 12,
  padding: "12px 14px",
  borderRadius: 10,
  border: "1px solid rgba(217,182,110,0.28)",
  background: "rgba(217,182,110,0.07)"
}}>
  <span style={{
    fontSize: 13,
    fontWeight: 700,
    color: "#F8FAFC"
  }}>
    Total Storage Records
  </span>
  <strong style={{
    fontSize: 21,
    color: "#D9B66E",
    fontVariantNumeric: "tabular-nums"
  }}>
    {props.countsVerified &&
    validCount(props.counts?.totalStorageRecords)
      ? props.counts?.totalStorageRecords
      : "—"}
  </strong>
</div>
<div style={{...tile,marginTop:14}}>
              <Line name="Source"
                value={props.sourceLabel || "Verified Backup"}/>
              <Line name="Destination"
                value={props.destinationLabel || "Not selected"}/>
              <div style={{
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  padding: "7px 0",
  fontSize: 13
}}>
  <span style={{color: muted}}>Backup Integrity</span>
  <span style={{
    color: props.backupVerified ? "#22C55E" : muted,
    fontWeight: 700
  }}>
    {props.backupVerified ? "✓ Verified" : "Pending"}
  </span>
</div>
              <div style={{
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  padding: "7px 0",
  fontSize: 13
}}>
  <span style={{color: muted}}>Authorization</span>
  <span style={{
    color: props.authorizationVerified ? "#22C55E" : "#EF4444",
    fontWeight: 700,
    display: "inline-flex",
    alignItems: "center",
    gap: 6
  }}>
    <span aria-hidden="true">
      {props.authorizationVerified ? "✓" : "✕"}
    </span>
    {props.authorizationVerified ? "Verified" : "Pending"}
  </span>
</div>
              <div style={{
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  padding: "7px 0",
  fontSize: 13
}}>
  <span style={{color: muted}}>Destination Safety</span>
  <span style={{
    color: props.targetVerified && props.targetEmpty
      ? "#22C55E"
      : "#EF4444",
    fontWeight: 700,
    display: "inline-flex",
    alignItems: "center",
    gap: 6
  }}>
    <span aria-hidden="true">
      {props.targetVerified && props.targetEmpty ? "✓" : "✕"}
    </span>
    {props.targetVerified && props.targetEmpty
      ? "Verified"
      : "Pending"}
  </span>
</div>
            </div>

            {!completeCounts && (
              <p style={{fontSize:12,color:"#F4D18B"}}>
                Verified record counts unavailable. Restore disabled.
              </p>
            )}
          </>
        )}

        {stage === "confirm" && (
          <label style={{
            display:"flex",
            alignItems:"flex-start",
            gap:10,
            marginTop:18,
            fontSize:13,
          }}>
            <input
              type="checkbox"
              checked={confirmed}
              onChange={event => setConfirmed(event.target.checked)}
              style={{accentColor:gold}}
            />
            I confirm this is the correct selected branch folder and authorize the verified restore.
          </label>
        )}

        {stage === "progress" && (
          <div style={{...tile,marginTop:20}}>
            <Line name="Progress"
              value={`${Math.round(progress)}%`}/>
            <div role="progressbar" aria-valuemin={0}
              aria-valuemax={100} aria-valuenow={progress}
              style={{
                height:9,
                background:"rgba(255,255,255,.13)",
                marginTop:14,
                borderRadius:9,
                overflow:"hidden",
              }}>
              <div style={{
                width:`${progress}%`,
                height:"100%",
                background:gold,
              }}/>
            </div>
            <p style={{fontSize:12,color:muted}}>
              Final checksum verification is required.
            </p>
          </div>
        )}

        {stage === "success" && (
          <div style={{...tile,marginTop:20}}>
            <Line name="USB Write" value="Confirmed"/>
            <Line name="SHA256" value="MATCH"/>
            <Line name="Status" value="COMPLETE"/>
          </div>
        )}

        {stage === "error" && (
          <div role="alert"
            style={{
              ...tile,
              color:"#F5B6AD",
              marginTop:20,
            }}>
            {props.errorMessage ||
              "Integrity verification is incomplete or failed."}
          </div>
        )}

        <div style={{
          display:"flex",
          justifyContent:"flex-end",
          flexWrap:"wrap",
          gap:10,
          marginTop:24,
        }}>
          {stage === "preview" && (
            <>
              <button type="button" style={secondary}
                onClick={props.onClose}>Cancel</button>
              <button type="button" style={primary}
                disabled={!verified || !completeCounts || !props.commitReady}
                onClick={props.onContinue}>
                Continue to Restore
              </button>
            </>
          )}

          {stage === "confirm" && (
            <>
              <button type="button" style={secondary}
                onClick={props.onBack}>Back</button>
              <button type="button" style={primary}
                disabled={!verified || !completeCounts || !confirmed || !props.commitReady}
                onClick={() => {
                  if (verified && completeCounts && confirmed) {
                    setConfirmed(false);
                    props.onRestore();
                  }
                }}>
                Restore Now
              </button>
            </>
          )}

          {stage === "success" && (
            <button type="button" style={primary}
              onClick={props.onOpenApp || props.onClose}>
              Open PAISARULE
            </button>
          )}

          {stage === "error" && (
            <button type="button" style={secondary}
              onClick={props.onClose}>Close</button>
          )}

          {stage === "progress" && (
            <span style={{fontSize:12,color:muted}}>
              Restore verification in progress
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
