package com.finora.enterprise.control;

import java.time.Instant;

public final class FinoraBranchAccessRuntimeEvaluator {
    public static final String MISSING="MISSING", INVALID="INVALID", REVOKED="REVOKED", SUSPENDED="SUSPENDED", NOT_YET_VALID="NOT_YET_VALID", EXPIRED="EXPIRED", ACTIVE="ACTIVE";
    public static final long REGISTERED_ACCESS_DURATION_MS=365L*24L*60L*60L*1000L;
    private static final long JS_MAX_SAFE_INTEGER=9007199254740991L;

    private FinoraBranchAccessRuntimeEvaluator() {}

    public static final class RegistrationPayment {
        public final double amount;
        public final String currency;
        public final String paidAt;
        public final Boolean refundable;

        public RegistrationPayment(double amount,String currency,String paidAt,Boolean refundable) {
            this.amount=amount;
            this.currency=currency;
            this.paidAt=paidAt;
            this.refundable=refundable;
        }
    }

    public static final class Grant {
        public final String grantId,userId,ownerId,businessId,branchId,storageMode,administrativeStatus,validFrom,validUntil,createdAt,updatedAt,accessType,demoId;
        public final Integer schemaVersion;
        public final Long registrationCycle;
        public final RegistrationPayment registrationPayment;

        public Grant(String grantId,String userId,String ownerId,String businessId,String branchId,String storageMode,String administrativeStatus,String validFrom,String validUntil,String createdAt,String updatedAt,Integer schemaVersion,String accessType,Long registrationCycle,RegistrationPayment registrationPayment,String demoId) {
            this.grantId=grantId;
            this.userId=userId;
            this.ownerId=ownerId;
            this.businessId=businessId;
            this.branchId=branchId;
            this.storageMode=storageMode;
            this.administrativeStatus=administrativeStatus;
            this.validFrom=validFrom;
            this.validUntil=validUntil;
            this.createdAt=createdAt;
            this.updatedAt=updatedAt;
            this.schemaVersion=schemaVersion;
            this.accessType=accessType;
            this.registrationCycle=registrationCycle;
            this.registrationPayment=registrationPayment;
            this.demoId=demoId;
        }
    }

    public static final class Decision {
        public final boolean allowed;
        public final String state;
        public final String reason;
        public final Grant grant;

        private Decision(boolean allowed,String state,String reason,Grant grant) {
            this.allowed=allowed;
            this.state=state;
            this.reason=reason;
            this.grant=grant;
        }
    }

    public static Decision evaluate(Grant grant,String observedAt) {
        if (grant==null) return denied(MISSING,"FINORA registration or Demo access is required.",null);
        String error=validateGrant(grant);
        if (error!=null) return denied(INVALID,error,grant);
        if ("REVOKED".equals(grant.administrativeStatus)) return denied(REVOKED,"FINORA access has been revoked.",grant);
        if ("SUSPENDED".equals(grant.administrativeStatus)) return denied(SUSPENDED,"FINORA access is currently suspended.",grant);
        Instant now=parse(observedAt);
        if (now==null) return denied(INVALID,"FINORA runtime clock is invalid.",grant);
        Instant from=parse(grant.validFrom);
        Instant until=parse(grant.validUntil);
        if (now.isBefore(from)) return denied(NOT_YET_VALID,"FINORA access validity has not started yet.",grant);
        if (!now.isBefore(until)) return denied(EXPIRED,"DEMO".equals(grant.accessType)?"FINORA Demo access has expired.":"FINORA annual registration has expired.",grant);
        return new Decision(true,ACTIVE,"FINORA Branch Access is active.",grant);
    }

    public static String validateGrant(Grant grant) {
        if (grant==null) return "FINORA access grant is required.";
        if (grant.schemaVersion==null || grant.schemaVersion.intValue()!=1) return "FINORA access grant schema is unsupported.";
        if (!text(grant.grantId)||!text(grant.userId)||!text(grant.ownerId)||!text(grant.businessId)||!text(grant.branchId)) return "FINORA access grant identity is incomplete.";
        if (!"LOCAL".equals(grant.storageMode)&&!"USB".equals(grant.storageMode)) return "FINORA access grant storage mode must be LOCAL or USB.";
        if (!"ACTIVE".equals(grant.administrativeStatus)&&!"SUSPENDED".equals(grant.administrativeStatus)&&!"REVOKED".equals(grant.administrativeStatus)) return "FINORA access grant administrative status is invalid.";
        if (parse(grant.createdAt)==null||parse(grant.updatedAt)==null) return "FINORA access grant audit timestamps are invalid.";
        Instant from=parse(grant.validFrom), until=parse(grant.validUntil);
        if (from==null||until==null) return "FINORA access validity timestamps are invalid.";
        if (!until.isAfter(from)) return "FINORA access expiry must be later than its start timestamp.";

        if ("REGISTERED".equals(grant.accessType)) {
            long duration;
            try { duration=Math.subtractExact(until.toEpochMilli(),from.toEpochMilli()); }
            catch (ArithmeticException error) { return "FINORA registered access must have exactly 365 days of validity."; }
            if (duration!=REGISTERED_ACCESS_DURATION_MS) return "FINORA registered access must have exactly 365 days of validity.";
            if (grant.registrationCycle==null||grant.registrationCycle.longValue()<=0L||grant.registrationCycle.longValue()>JS_MAX_SAFE_INTEGER) return "FINORA registration cycle must be a positive integer.";
            RegistrationPayment payment=grant.registrationPayment;
            if (payment==null||!Double.isFinite(payment.amount)||payment.amount<=0.0d||!text(payment.currency)||parse(payment.paidAt)==null||!Boolean.FALSE.equals(payment.refundable)) return "FINORA registration payment metadata is invalid.";
            return null;
        }

        if ("DEMO".equals(grant.accessType)) {
            return text(grant.demoId)?null:"FINORA Demo ID is required.";
        }

        return "FINORA access type is unsupported.";
    }

    private static Decision denied(String state,String reason,Grant grant) {
        return new Decision(false,state,reason,grant);
    }

    private static boolean text(String value) {
        return value!=null&&!value.trim().isEmpty();
    }

    private static Instant parse(String value) {
        if (!text(value)) return null;
        try { return Instant.parse(value); }
        catch (Exception error) { return null; }
    }
}
