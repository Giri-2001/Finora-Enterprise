package com.finora.enterprise.control;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Process-lifetime authoritative Android branch login sessions.
 *
 * SECURITY:
 * - Sessions exist only in native process memory.
 * - Renderer receives only an opaque bearer.
 * - Bearer contains 256 bits of SecureRandom entropy.
 * - Password / Security Code / verifier material is never stored.
 * - 30-minute idle expiry uses monotonic time.
 * - Validation re-resolves authoritative credential/access state.
 * - Failed authoritative validation revokes the session.
 * - A new session for one credential revokes its previous session.
 */
public final class FinoraBranchLoginSessionAuthority {

    public static final String SESSION_PREFIX =
        "FINORA-SESSION-";

    public static final int SESSION_RANDOM_BYTES =
        32;

    public static final long IDLE_TIMEOUT_MS =
        30L * 60L * 1000L;

    public static final String ACCESS_MODE_ACTIVE =
        "ACTIVE";

    public static final String ACCESS_MODE_REGISTERED_EXPIRED_READ_ONLY =
        "REGISTERED_EXPIRED_READ_ONLY";

    public static final String ERROR_INVALID_REQUEST =
        "INVALID_REQUEST";

    public static final String ERROR_SESSION_NOT_FOUND =
        "SESSION_NOT_FOUND";

    public static final String ERROR_SESSION_EXPIRED =
        "SESSION_EXPIRED";

    public static final String ERROR_SESSION_INVALID =
        "SESSION_INVALID";

    public static final String ERROR_NATIVE_BINDING_UNAVAILABLE =
        "NATIVE_BINDING_UNAVAILABLE";

    public static final String ERROR_DEVICE_TRUST_FAILED =
        "DEVICE_TRUST_FAILED";

    public static final String ERROR_ACTIVATION_REQUIRED =
        "ACTIVATION_REQUIRED";

    public static final String ERROR_BRANCH_ACCESS_DENIED =
        "BRANCH_ACCESS_DENIED";

    public static final String ERROR_STORAGE_MODE_MISMATCH =
        "STORAGE_MODE_MISMATCH";

    public static final String ERROR_STORAGE_ENTITLEMENT_DENIED =
        "STORAGE_ENTITLEMENT_DENIED";

    public static final String ERROR_CONTROL_STATE_FAILED =
        "CONTROL_STATE_FAILED";

    public interface AuthorizationPort {

        AuthorizationResult authorize(
            String credentialId,
            String selectedStorageMode
        );
    }

    interface WallClockPort {

        String nowIso();
    }

    interface MonotonicClockPort {

        long nowMs();
    }

    interface SessionIdPort {

        String nextSessionId();
    }

    public static final class Principal {

        public final String credentialId;

        public final long authGeneration;

        public final String userId;
        public final String username;
        public final String fullName;
        public final String role;

        public final String ownerId;
        public final String businessId;
        public final String branchId;

        public final String storageMode;
        public final String dataContext;
        public final String demoId;

        public Principal(
            String credentialId,
            long authGeneration,
            String userId,
            String username,
            String fullName,
            String role,
            String ownerId,
            String businessId,
            String branchId,
            String storageMode,
            String dataContext,
            String demoId
        ) {

            this.credentialId =
                requireNonEmpty(
                    credentialId,
                    "credentialId"
                );

            if (authGeneration < 1L) {
                throw new IllegalArgumentException(
                    "authGeneration must be at least 1."
                );
            }

            this.authGeneration =
                authGeneration;

            this.userId =
                requireNonEmpty(
                    userId,
                    "userId"
                );

            this.username =
                requireNonEmpty(
                    username,
                    "username"
                );

            this.fullName =
                requireNonEmpty(
                    fullName,
                    "fullName"
                );

            this.role =
                requireRole(
                    role
                );

            this.ownerId =
                requireNonEmpty(
                    ownerId,
                    "ownerId"
                );

            this.businessId =
                requireNonEmpty(
                    businessId,
                    "businessId"
                );

            this.branchId =
                requireNonEmpty(
                    branchId,
                    "branchId"
                );

            this.storageMode =
                requireStorageMode(
                    storageMode
                );

            this.dataContext =
                requireDataContext(
                    dataContext
                );

            this.demoId =
                normalizeOptional(
                    demoId
                );

            if (
                "DEMO".equals(
                    this.dataContext
                ) &&
                this.demoId == null
            ) {
                throw new IllegalArgumentException(
                    "demoId is required for DEMO context."
                );
            }

            if (
                "REAL".equals(
                    this.dataContext
                ) &&
                this.demoId != null
            ) {
                throw new IllegalArgumentException(
                    "demoId is forbidden for REAL context."
                );
            }
        }

        static Principal fromAuthenticatedIdentity(
            FinoraBranchPasswordFirstLoginAuthority
                .AuthenticatedIdentity source
        ) {

            if (source == null) {
                throw new IllegalArgumentException(
                    "Authenticated identity is required."
                );
            }

            return new Principal(
                source.credentialId,
                source.authGeneration,
                source.userId,
                source.username,
                source.fullName,
                source.role,
                source.ownerId,
                source.businessId,
                source.branchId,
                source.storageMode,
                source.dataContext,
                source.demoId
            );
        }
    }

    public static final class AuthorizationResult {

        public final boolean success;

        public final Principal principal;

        public final String accessMode;

        public final String errorCode;
        public final String error;

        private AuthorizationResult(
            boolean success,
            Principal principal,
            String accessMode,
            String errorCode,
            String error
        ) {

            this.success =
                success;

            this.principal =
                principal;

            this.accessMode =
                accessMode;

            this.errorCode =
                errorCode;

            this.error =
                error;
        }

        public static AuthorizationResult success(
            Principal principal,
            String accessMode
        ) {

            if (principal == null) {
                throw new IllegalArgumentException(
                    "Authorized principal is required."
                );
            }

            return new AuthorizationResult(
                true,
                principal,
                requireAccessMode(
                    accessMode
                ),
                null,
                null
            );
        }

        public static AuthorizationResult failure(
            String errorCode,
            String error
        ) {

            return new AuthorizationResult(
                false,
                null,
                null,
                normalizeAuthorizationErrorCode(
                    errorCode
                ),
                requireNonEmpty(
                    error,
                    "error"
                )
            );
        }
    }

    public static final class SessionView {

        public final String sessionId;

        public final String userId;
        public final String username;
        public final String fullName;
        public final String role;

        public final String ownerId;
        public final String businessId;
        public final String branchId;

        public final String storageMode;
        public final String dataContext;
        public final String demoId;

        public final String accessMode;

        public final String loginTime;
        public final String lastActivity;
        public final String validatedAt;

        private SessionView(
            String sessionId,
            Principal principal,
            String accessMode,
            String loginTime,
            String lastActivity,
            String validatedAt
        ) {

            this.sessionId =
                sessionId;

            this.userId =
                principal.userId;

            this.username =
                principal.username;

            this.fullName =
                principal.fullName;

            this.role =
                principal.role;

            this.ownerId =
                principal.ownerId;

            this.businessId =
                principal.businessId;

            this.branchId =
                principal.branchId;

            this.storageMode =
                principal.storageMode;

            this.dataContext =
                principal.dataContext;

            this.demoId =
                principal.demoId;

            this.accessMode =
                accessMode;

            this.loginTime =
                loginTime;

            this.lastActivity =
                lastActivity;

            this.validatedAt =
                validatedAt;
        }
    }

    public static final class SessionResult {

        public final boolean success;

        public final SessionView data;

        public final String errorCode;
        public final String error;

        private SessionResult(
            boolean success,
            SessionView data,
            String errorCode,
            String error
        ) {

            this.success =
                success;

            this.data =
                data;

            this.errorCode =
                errorCode;

            this.error =
                error;
        }

        static SessionResult success(
            SessionView data
        ) {

            return new SessionResult(
                true,
                data,
                null,
                null
            );
        }

        static SessionResult failure(
            String errorCode,
            String error
        ) {

            return new SessionResult(
                false,
                null,
                errorCode,
                error
            );
        }
    }

    public static final class TouchView {

        public final String sessionId;

        public final String lastActivity;

        private TouchView(
            String sessionId,
            String lastActivity
        ) {

            this.sessionId =
                sessionId;

            this.lastActivity =
                lastActivity;
        }
    }

    public static final class TouchResult {

        public final boolean success;

        public final TouchView data;

        public final String errorCode;
        public final String error;

        private TouchResult(
            boolean success,
            TouchView data,
            String errorCode,
            String error
        ) {

            this.success =
                success;

            this.data =
                data;

            this.errorCode =
                errorCode;

            this.error =
                error;
        }

        static TouchResult success(
            TouchView data
        ) {

            return new TouchResult(
                true,
                data,
                null,
                null
            );
        }

        static TouchResult failure(
            String errorCode,
            String error
        ) {

            return new TouchResult(
                false,
                null,
                errorCode,
                error
            );
        }
    }

    private static final class SessionRecord {

        final String sessionId;

        final String credentialId;

        final String selectedStorageMode;

        final String loginTime;

        String lastActivity;

        long lastActivityMonotonicMs;

        SessionRecord(
            String sessionId,
            String credentialId,
            String selectedStorageMode,
            String loginTime,
            String lastActivity,
            long lastActivityMonotonicMs
        ) {

            this.sessionId =
                sessionId;

            this.credentialId =
                credentialId;

            this.selectedStorageMode =
                selectedStorageMode;

            this.loginTime =
                loginTime;

            this.lastActivity =
                lastActivity;

            this.lastActivityMonotonicMs =
                lastActivityMonotonicMs;
        }
    }

    private final AuthorizationPort authorizationPort;

    private final WallClockPort wallClock;

    private final MonotonicClockPort monotonicClock;

    private final SessionIdPort sessionIdPort;

    private final Map<
        String,
        SessionRecord
    > activeSessions =
        new LinkedHashMap<>();

    public FinoraBranchLoginSessionAuthority(
        AuthorizationPort authorizationPort
    ) {

        this(
            authorizationPort,
            new WallClockPort() {

                @Override
                public String nowIso() {
                    return Instant.now().toString();
                }
            },
            new MonotonicClockPort() {

                @Override
                public long nowMs() {
                    return System.nanoTime() / 1_000_000L;
                }
            },
            new SecureSessionIdPort()
        );
    }

    FinoraBranchLoginSessionAuthority(
        AuthorizationPort authorizationPort,
        WallClockPort wallClock,
        MonotonicClockPort monotonicClock,
        SessionIdPort sessionIdPort
    ) {

        if (authorizationPort == null) {
            throw new IllegalArgumentException(
                "Authorization port is required."
            );
        }

        if (
            wallClock == null ||
            monotonicClock == null ||
            sessionIdPort == null
        ) {
            throw new IllegalArgumentException(
                "Session clocks and ID source are required."
            );
        }

        this.authorizationPort =
            authorizationPort;

        this.wallClock =
            wallClock;

        this.monotonicClock =
            monotonicClock;

        this.sessionIdPort =
            sessionIdPort;
    }

    public synchronized SessionResult issue(
        FinoraBranchPasswordFirstLoginAuthority
            .AuthenticatedIdentity authenticatedIdentity
    ) {

        if (authenticatedIdentity == null) {
            return SessionResult.failure(
                ERROR_INVALID_REQUEST,
                "A valid FINORA authenticated identity is required."
            );
        }

        final Principal authenticatedPrincipal;

        try {
            authenticatedPrincipal =
                Principal.fromAuthenticatedIdentity(
                    authenticatedIdentity
                );
        }
        catch (RuntimeException error) {
            return SessionResult.failure(
                ERROR_INVALID_REQUEST,
                "A valid FINORA authenticated identity is required."
            );
        }

        pruneExpiredSessions();

        AuthorizationResult authorization =
            authorize(
                authenticatedPrincipal.credentialId,
                authenticatedPrincipal.storageMode
            );

        if (!authorization.success) {
            return SessionResult.failure(
                authorization.errorCode,
                authorization.error
            );
        }

        if (
            !samePrincipal(
                authenticatedPrincipal,
                authorization.principal
            )
        ) {
            return SessionResult.failure(
                ERROR_SESSION_INVALID,
                "FINORA authenticated identity no longer matches authoritative credential state."
            );
        }

        List<String> previousSessionIds =
            new ArrayList<>();

        for (
            Map.Entry<
                String,
                SessionRecord
            > entry
            : activeSessions.entrySet()
        ) {
            if (
                authenticatedPrincipal.credentialId.equals(
                    entry.getValue().credentialId
                )
            ) {
                previousSessionIds.add(
                    entry.getKey()
                );
            }
        }

        for (String previousSessionId : previousSessionIds) {
            activeSessions.remove(
                previousSessionId
            );
        }

        String sessionId =
            createUniqueSessionId();

        String now =
            wallClock.nowIso();

        SessionRecord record =
            new SessionRecord(
                sessionId,
                authenticatedPrincipal.credentialId,
                authenticatedPrincipal.storageMode,
                now,
                now,
                monotonicClock.nowMs()
            );

        activeSessions.put(
            sessionId,
            record
        );

        return SessionResult.success(
            toSessionView(
                record,
                authorization.principal,
                authorization.accessMode
            )
        );
    }

    public synchronized SessionResult validate(
        String sessionId
    ) {

        String normalizedSessionId =
            normalizeRequired(
                sessionId
            );

        if (normalizedSessionId == null) {
            return SessionResult.failure(
                ERROR_INVALID_REQUEST,
                "A valid FINORA session request is required."
            );
        }

        SessionRecord record =
            activeSessions.get(
                normalizedSessionId
            );

        if (record == null) {
            return SessionResult.failure(
                ERROR_SESSION_NOT_FOUND,
                "FINORA login session is unavailable."
            );
        }

        long currentMonotonicMs =
            monotonicClock.nowMs();

        if (
            isExpired(
                record,
                currentMonotonicMs
            )
        ) {
            activeSessions.remove(
                normalizedSessionId
            );

            return SessionResult.failure(
                ERROR_SESSION_EXPIRED,
                "FINORA login session has expired."
            );
        }

        AuthorizationResult authorization =
            authorize(
                record.credentialId,
                record.selectedStorageMode
            );

        if (!authorization.success) {

            activeSessions.remove(
                normalizedSessionId
            );

            return SessionResult.failure(
                authorization.errorCode,
                authorization.error
            );
        }

        if (
            !record.credentialId.equals(
                authorization.principal.credentialId
            )
        ) {
            activeSessions.remove(
                normalizedSessionId
            );

            return SessionResult.failure(
                ERROR_SESSION_INVALID,
                "FINORA login session credential is no longer valid."
            );
        }

        return SessionResult.success(
            toSessionView(
                record,
                authorization.principal,
                authorization.accessMode
            )
        );
    }

    public synchronized TouchResult touch(
        String sessionId
    ) {

        String normalizedSessionId =
            normalizeRequired(
                sessionId
            );

        if (normalizedSessionId == null) {
            return TouchResult.failure(
                ERROR_INVALID_REQUEST,
                "A valid FINORA session request is required."
            );
        }

        SessionRecord record =
            activeSessions.get(
                normalizedSessionId
            );

        if (record == null) {
            return TouchResult.failure(
                ERROR_SESSION_NOT_FOUND,
                "FINORA login session is unavailable."
            );
        }

        long currentMonotonicMs =
            monotonicClock.nowMs();

        if (
            isExpired(
                record,
                currentMonotonicMs
            )
        ) {
            activeSessions.remove(
                normalizedSessionId
            );

            return TouchResult.failure(
                ERROR_SESSION_EXPIRED,
                "FINORA login session has expired."
            );
        }

        String lastActivity =
            wallClock.nowIso();

        record.lastActivity =
            lastActivity;

        record.lastActivityMonotonicMs =
            currentMonotonicMs;

        return TouchResult.success(
            new TouchView(
                record.sessionId,
                lastActivity
            )
        );
    }

    public synchronized boolean invalidate(
        String sessionId
    ) {

        String normalizedSessionId =
            normalizeRequired(
                sessionId
            );

        if (normalizedSessionId == null) {
            return false;
        }

        return (
            activeSessions.remove(
                normalizedSessionId
            ) != null
        );
    }

    synchronized int activeSessionCountForTest() {
        return activeSessions.size();
    }

    private AuthorizationResult authorize(
        String credentialId,
        String selectedStorageMode
    ) {

        try {
            AuthorizationResult result =
                authorizationPort.authorize(
                    credentialId,
                    selectedStorageMode
                );

            if (result == null) {
                return AuthorizationResult.failure(
                    ERROR_CONTROL_STATE_FAILED,
                    "FINORA authoritative session access could not be verified."
                );
            }

            return result;
        }
        catch (RuntimeException error) {
            return AuthorizationResult.failure(
                ERROR_CONTROL_STATE_FAILED,
                "FINORA authoritative session access could not be verified."
            );
        }
    }

    private void pruneExpiredSessions() {

        long currentMonotonicMs =
            monotonicClock.nowMs();

        List<String> expired =
            new ArrayList<>();

        for (
            Map.Entry<
                String,
                SessionRecord
            > entry
            : activeSessions.entrySet()
        ) {
            if (
                isExpired(
                    entry.getValue(),
                    currentMonotonicMs
                )
            ) {
                expired.add(
                    entry.getKey()
                );
            }
        }

        for (String sessionId : expired) {
            activeSessions.remove(
                sessionId
            );
        }
    }

    private boolean isExpired(
        SessionRecord record,
        long currentMonotonicMs
    ) {

        long idleMilliseconds =
            currentMonotonicMs -
            record.lastActivityMonotonicMs;

        return (
            idleMilliseconds >
            IDLE_TIMEOUT_MS
        );
    }

    private String createUniqueSessionId() {

        String sessionId;

        do {
            sessionId =
                normalizeRequired(
                    sessionIdPort.nextSessionId()
                );

            if (sessionId == null) {
                throw new IllegalStateException(
                    "FINORA session ID source returned an invalid bearer."
                );
            }
        }
        while (
            activeSessions.containsKey(
                sessionId
            )
        );

        return sessionId;
    }

    private SessionView toSessionView(
        SessionRecord record,
        Principal principal,
        String accessMode
    ) {

        return new SessionView(
            record.sessionId,
            principal,
            requireAccessMode(
                accessMode
            ),
            record.loginTime,
            record.lastActivity,
            wallClock.nowIso()
        );
    }

    private static boolean samePrincipal(
        Principal left,
        Principal right
    ) {

        if (
            left == null ||
            right == null
        ) {
            return false;
        }

        return (
            left.authGeneration ==
                right.authGeneration &&
            equal(
                left.credentialId,
                right.credentialId
            ) &&
            equal(
                left.userId,
                right.userId
            ) &&
            equal(
                left.username,
                right.username
            ) &&
            equal(
                left.fullName,
                right.fullName
            ) &&
            equal(
                left.role,
                right.role
            ) &&
            equal(
                left.ownerId,
                right.ownerId
            ) &&
            equal(
                left.businessId,
                right.businessId
            ) &&
            equal(
                left.branchId,
                right.branchId
            ) &&
            equal(
                left.storageMode,
                right.storageMode
            ) &&
            equal(
                left.dataContext,
                right.dataContext
            ) &&
            equal(
                left.demoId,
                right.demoId
            )
        );
    }

    private static boolean equal(
        String left,
        String right
    ) {

        if (left == null) {
            return right == null;
        }

        return left.equals(
            right
        );
    }

    private static String normalizeAuthorizationErrorCode(
        String value
    ) {

        if (
            ERROR_NATIVE_BINDING_UNAVAILABLE.equals(value) ||
            ERROR_DEVICE_TRUST_FAILED.equals(value) ||
            ERROR_ACTIVATION_REQUIRED.equals(value) ||
            ERROR_BRANCH_ACCESS_DENIED.equals(value) ||
            ERROR_STORAGE_MODE_MISMATCH.equals(value) ||
            ERROR_STORAGE_ENTITLEMENT_DENIED.equals(value) ||
            ERROR_SESSION_INVALID.equals(value) ||
            ERROR_CONTROL_STATE_FAILED.equals(value)
        ) {
            return value;
        }

        return ERROR_CONTROL_STATE_FAILED;
    }

    private static String requireAccessMode(
        String value
    ) {

        if (
            ACCESS_MODE_ACTIVE.equals(value) ||
            ACCESS_MODE_REGISTERED_EXPIRED_READ_ONLY.equals(value)
        ) {
            return value;
        }

        throw new IllegalArgumentException(
            "Invalid FINORA access mode."
        );
    }

    private static String requireRole(
        String value
    ) {

        if (
            "ADMIN".equals(value) ||
            "MANAGER".equals(value) ||
            "COLLECTOR".equals(value) ||
            "VIEWER".equals(value)
        ) {
            return value;
        }

        throw new IllegalArgumentException(
            "Invalid FINORA role."
        );
    }

    private static String requireStorageMode(
        String value
    ) {

        if (
            "LOCAL".equals(value) ||
            "USB".equals(value)
        ) {
            return value;
        }

        throw new IllegalArgumentException(
            "Invalid FINORA storage mode."
        );
    }

    private static String requireDataContext(
        String value
    ) {

        if (
            "REAL".equals(value) ||
            "DEMO".equals(value)
        ) {
            return value;
        }

        throw new IllegalArgumentException(
            "Invalid FINORA data context."
        );
    }

    private static String requireNonEmpty(
        String value,
        String field
    ) {

        String normalized =
            normalizeRequired(
                value
            );

        if (normalized == null) {
            throw new IllegalArgumentException(
                field + " is required."
            );
        }

        return normalized;
    }

    private static String normalizeRequired(
        String value
    ) {

        if (value == null) {
            return null;
        }

        String normalized =
            value.trim();

        if (normalized.isEmpty()) {
            return null;
        }

        return normalized;
    }

    private static String normalizeOptional(
        String value
    ) {

        return normalizeRequired(
            value
        );
    }

    private static final class SecureSessionIdPort
        implements SessionIdPort {

        private final SecureRandom secureRandom =
            new SecureRandom();

        @Override
        public String nextSessionId() {

            byte[] random =
                new byte[
                    SESSION_RANDOM_BYTES
                ];

            secureRandom.nextBytes(
                random
            );

            return (
                SESSION_PREFIX +
                Base64.getUrlEncoder()
                    .withoutPadding()
                    .encodeToString(
                        random
                    )
            );
        }
    }
}