package com.finora.enterprise.control;

import static org.junit.Assert.*;

import org.json.JSONObject;
import org.junit.Test;

public final class FinoraServerFirstLoginSignatureVerifierTest {

    @Test
    public void nullResponseIsRejected() {
        assertFalse(
            FinoraServerFirstLoginSignatureVerifier.verify(null)
        );
    }

    @Test
    public void emptyResponseIsRejected() throws Exception {
        assertFalse(
            FinoraServerFirstLoginSignatureVerifier.verify(
                new JSONObject("{}")
            )
        );
    }

    @Test
    public void unsupportedSchemaIsRejected() throws Exception {
        JSONObject response = new JSONObject();

        response.put("schemaVersion", 99);

        assertFalse(
            FinoraServerFirstLoginSignatureVerifier.verify(
                response
            )
        );
    }

    @Test
    public void unsignedPayloadIsRejected() throws Exception {
        JSONObject response = new JSONObject();

        response.put("schemaVersion", 1);

        JSONObject payload = new JSONObject();
        payload.put("kind", "FINORA_SERVER_FIRST_LOGIN_BOOTSTRAP");

        response.put("payload", payload);

        assertFalse(
            FinoraServerFirstLoginSignatureVerifier.verify(
                response
            )
        );
    }

    @Test
    public void forgedAuthorityIsRejected() throws Exception {
        JSONObject response = new JSONObject();

        response.put("schemaVersion", 1);
        response.put("payload", new JSONObject());

        JSONObject issuer = new JSONObject();
        issuer.put("issuerId", "ATTACKER");
        issuer.put("signingKeyId", "ATTACKER");

        JSONObject signature = new JSONObject();
        signature.put("algorithm", "ECDSA_P256_SHA256");
        signature.put("encoding", "BASE64");
        signature.put("value", "AAAA");

        JSONObject authority = new JSONObject();
        authority.put("issuerId", "ATTACKER");
        authority.put("signingKeyId", "ATTACKER");
        authority.put("algorithm", "ECDSA_P256_SHA256");
        authority.put("format", "SPKI_DER_BASE64");
        authority.put("publicKey", "AAAA");
        authority.put("publicKeyFingerprint", "ATTACKER");

        response.put("issuer", issuer);
        response.put("signature", signature);
        response.put("publicAuthority", authority);

        assertFalse(
            FinoraServerFirstLoginSignatureVerifier.verify(
                response
            )
        );
    }
}