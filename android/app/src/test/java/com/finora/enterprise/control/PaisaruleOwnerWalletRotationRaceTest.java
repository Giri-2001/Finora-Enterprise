package com.finora.enterprise.control;

import org.json.JSONObject;
import org.junit.After;
import org.junit.BeforeClass;
import org.junit.Test;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.lang.reflect.Field;
import java.net.URL;
import java.net.URLConnection;
import java.net.URLStreamHandler;
import java.time.Instant;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;
import javax.net.ssl.HttpsURLConnection;

import static org.junit.Assert.*;

public class PaisaruleOwnerWalletRotationRaceTest {

    private static final String HANDLE = "test-owner-handle";
    private static final String BUSINESS = "test-business-session";
    private static final String OLD_TOKEN = hex('a');
    private static final String NEW_TOKEN = hex('b');

    private static volatile MockRotationServer server;

    private static String hex(char character) {
        StringBuilder value = new StringBuilder();
        for (int i = 0; i < 64; i++) value.append(character);
        return value.toString();
    }

    @BeforeClass
    public static void installLocalHttpsMock() {
        URL.setURLStreamHandlerFactory(protocol -> {
            if (!"https".equals(protocol)) return null;

            return new URLStreamHandler() {
                @Override
                protected URLConnection openConnection(URL url)
                    throws IOException {

                    if (!"api.finoraenterprise.com".equals(url.getHost()) ||
                        !"/owner/wallet/session/rotate".equals(url.getPath())) {
                        throw new IOException("UNEXPECTED_HTTPS_DESTINATION");
                    }

                    MockRotationServer active = server;
                    if (active == null) {
                        throw new IOException("TEST_SERVER_NOT_READY");
                    }

                    active.connections.incrementAndGet();
                    return new FakeHttpsConnection(url, active);
                }
            };
        });
    }

    private static void set(String fieldName, Object value)
        throws Exception {

        Field field = FinoraNativeWalletSession.class
            .getDeclaredField(fieldName);
        field.setAccessible(true);
        field.set(null, value);
    }

    private static Object get(String fieldName)
        throws Exception {

        Field field = FinoraNativeWalletSession.class
            .getDeclaredField(fieldName);
        field.setAccessible(true);
        return field.get(null);
    }

    private static JSONObject principal() throws Exception {
        JSONObject value = new JSONObject();
        value.put("userId", "test-user");
        value.put("ownerId", "test-owner");
        value.put("businessId", "test-business");
        value.put("branchId", "test-branch");
        return value;
    }

    private static void seedSession() throws Exception {
        synchronized (FinoraNativeWalletSession.class) {
            FinoraNativeWalletSession.clear();
            set("bearerToken", OLD_TOKEN);
            set("walletExpiresAt", Instant.now().plusSeconds(300));
            set("verifiedBusinessSessionId", BUSINESS);
            set("verifiedWalletPrincipal", principal());
            set("verifiedBusinessPrincipal", principal());
            set("receptionHandle", HANDLE);
        }
    }

    @After
    public void cleanup() {
        server = null;
        FinoraNativeWalletSession.clear();
    }

    @Test
    public void concurrentRotationUsesSingleFlight()
        throws Exception {

        seedSession();

        MockRotationServer mock = new MockRotationServer();
        server = mock;

        ExecutorService pool = Executors.newFixedThreadPool(2);

        try {
            Future<JSONObject> first = pool.submit(
                () -> FinoraNativeWalletSession
                    .rotateAndroidOwnerWalletIfDue(HANDLE)
            );

            assertTrue(
                "First rotation did not reach mock HTTPS",
                mock.entered.await(5, TimeUnit.SECONDS)
            );

            Future<JSONObject> second = pool.submit(
                () -> FinoraNativeWalletSession
                    .rotateAndroidOwnerWalletIfDue(HANDLE)
            );

            JSONObject rejected = second.get(5, TimeUnit.SECONDS);

            assertFalse(rejected.optBoolean("success", false));
            assertEquals(
                "WALLET_ROTATION_IN_PROGRESS",
                rejected.optString("errorCode", "")
            );

            assertEquals(1, mock.connections.get());

            mock.release.countDown();

            JSONObject accepted = first.get(5, TimeUnit.SECONDS);

            assertTrue(accepted.optBoolean("success", false));
            assertTrue(accepted.optBoolean("rotated", false));
            assertEquals(NEW_TOKEN, get("bearerToken"));
            assertEquals(1, mock.connections.get());

        } finally {
            mock.release.countDown();
            pool.shutdownNow();
        }
    }

    @Test
    public void logoutPreventsDelayedRotationCommit()
        throws Exception {

        seedSession();

        MockRotationServer mock = new MockRotationServer();
        server = mock;

        ExecutorService pool = Executors.newSingleThreadExecutor();

        try {
            Future<JSONObject> pending = pool.submit(
                () -> FinoraNativeWalletSession
                    .rotateAndroidOwnerWalletIfDue(HANDLE)
            );

            assertTrue(
                "Rotation did not reach mock HTTPS",
                mock.entered.await(5, TimeUnit.SECONDS)
            );

            FinoraNativeWalletSession.clear();

            mock.release.countDown();

            JSONObject result = pending.get(5, TimeUnit.SECONDS);

            assertFalse(result.optBoolean("success", false));
            assertEquals(
                "WALLET_ROTATION_SUPERSEDED",
                result.optString("errorCode", "")
            );

            assertNull(get("bearerToken"));
            assertNull(get("walletExpiresAt"));
            assertEquals(1, mock.connections.get());

        } finally {
            mock.release.countDown();
            pool.shutdownNow();
        }
    }

    @Test
    public void accountSwitchPreventsDelayedRotationCommit()
        throws Exception {

        seedSession();

        MockRotationServer mock = new MockRotationServer();
        server = mock;

        ExecutorService pool =
            Executors.newSingleThreadExecutor();

        final String nextToken = hex('c');
        final String nextHandle = "next-owner-handle";

        try {
            Future<JSONObject> pending = pool.submit(
                () -> FinoraNativeWalletSession
                    .rotateAndroidOwnerWalletIfDue(HANDLE)
            );

            assertTrue(
                "Account-switch rotation did not start",
                mock.entered.await(5, TimeUnit.SECONDS)
            );

            synchronized (FinoraNativeWalletSession.class) {
                FinoraNativeWalletSession.clear();

                set("bearerToken", nextToken);
                set(
                    "walletExpiresAt",
                    Instant.now().plusSeconds(300)
                );
                set(
                    "verifiedBusinessSessionId",
                    "next-business-session"
                );
                set("verifiedWalletPrincipal", principal());
                set("verifiedBusinessPrincipal", principal());
                set("receptionHandle", nextHandle);
            }

            mock.release.countDown();

            JSONObject result =
                pending.get(5, TimeUnit.SECONDS);

            assertFalse(result.optBoolean("success", false));

            assertEquals(
                "WALLET_ROTATION_SUPERSEDED",
                result.optString("errorCode", "")
            );

            assertEquals(nextToken, get("bearerToken"));
            assertEquals(nextHandle, get("receptionHandle"));

            assertFalse(
                (Boolean) get("walletRotationInFlight")
            );

            assertEquals(1, mock.connections.get());

        } finally {
            mock.release.countDown();
            pool.shutdownNow();
        }
    }

    @Test
    public void networkFailurePreservesSessionAndAllowsRetry()
        throws Exception {

        seedSession();

        MockRotationServer failed = new MockRotationServer();
        failed.networkFailure = true;
        server = failed;

        ExecutorService pool =
            Executors.newSingleThreadExecutor();

        try {
            Future<JSONObject> first = pool.submit(
                () -> FinoraNativeWalletSession
                    .rotateAndroidOwnerWalletIfDue(HANDLE)
            );

            assertTrue(
                "Network failure request did not start",
                failed.entered.await(5, TimeUnit.SECONDS)
            );

            failed.release.countDown();

            JSONObject failure =
                first.get(5, TimeUnit.SECONDS);

            assertFalse(failure.optBoolean("success", false));
            assertEquals(OLD_TOKEN, get("bearerToken"));

            assertFalse(
                (Boolean) get("walletRotationInFlight")
            );

            assertEquals(1, failed.connections.get());

            MockRotationServer retry =
                new MockRotationServer();

            server = retry;

            Future<JSONObject> second = pool.submit(
                () -> FinoraNativeWalletSession
                    .rotateAndroidOwnerWalletIfDue(HANDLE)
            );

            assertTrue(
                "Retry request did not start",
                retry.entered.await(5, TimeUnit.SECONDS)
            );

            retry.release.countDown();

            JSONObject accepted =
                second.get(5, TimeUnit.SECONDS);

            assertTrue(accepted.optBoolean("success", false));
            assertTrue(accepted.optBoolean("rotated", false));

            assertEquals(NEW_TOKEN, get("bearerToken"));
            assertEquals(1, retry.connections.get());

        } finally {
            server = null;
            pool.shutdownNow();
        }
    }
    private static final class MockRotationServer {

        volatile boolean networkFailure = false;
        final AtomicInteger connections = new AtomicInteger();
        final CountDownLatch entered = new CountDownLatch(1);
        final CountDownLatch release = new CountDownLatch(1);

        byte[] response() throws Exception {
            JSONObject scope = principal();

            JSONObject body = new JSONObject();
            body.put("ok", true);
            body.put("accessToken", NEW_TOKEN);
            body.put(
                "expiresAt",
                Instant.now().plusSeconds(3500).toString()
            );
            body.put("scope", scope);

            return body.toString().getBytes(StandardCharsets.UTF_8);
        }
    }

    private static final class FakeHttpsConnection
        extends HttpsURLConnection {

        private final MockRotationServer mock;
        private final ByteArrayOutputStream written =
            new ByteArrayOutputStream();

        FakeHttpsConnection(URL url, MockRotationServer mock) {
            super(url);
            this.mock = mock;
        }

        @Override
        public void connect() {}

        @Override
        public void disconnect() {}

        @Override
        public boolean usingProxy() {
            return false;
        }

        @Override
        public OutputStream getOutputStream() {
            return written;
        }

        @Override
        public int getResponseCode() throws IOException {
            mock.entered.countDown();

            try {
                if (!mock.release.await(5, TimeUnit.SECONDS)) {
                    throw new IOException("TEST_MOCK_TIMEOUT");
                }
            } catch (InterruptedException interrupted) {
                Thread.currentThread().interrupt();
                throw new IOException("TEST_INTERRUPTED", interrupted);
            }

            if (mock.networkFailure) {
                throw new IOException("TEST_NETWORK_FAILURE");
            }

            return 200;
        }

        @Override
        public InputStream getInputStream() throws IOException {
            try {
                return new ByteArrayInputStream(mock.response());
            } catch (Exception error) {
                throw new IOException("INVALID_TEST_RESPONSE", error);
            }
        }

        @Override
        public String getCipherSuite() {
            return "TEST_MOCK_ONLY";
        }

        @Override
        public java.security.cert.Certificate[]
            getLocalCertificates() {
            return null;
        }

        @Override
        public java.security.cert.Certificate[]
            getServerCertificates() {
            return null;
        }
    }
}