package com.finora.enterprise.control;

import static org.junit.Assert.*;

import org.junit.Test;

public final class FinoraServerFirstLoginRuntimeAuthorityUsbStoreTest {

    @Test
    public void correctAccountFolderMatches() {
        assertTrue(
            FinoraServerFirstLoginRuntimeAuthorityUsbStore
                .accountMatches("testadmin", "testadmin")
        );
    }

    @Test
    public void otherAccountFolderRejected() {
        assertFalse(
            FinoraServerFirstLoginRuntimeAuthorityUsbStore
                .accountMatches("giriadmin", "testadmin")
        );
    }

    @Test
    public void missingSafAuthorityCannotWrite() {
        assertEquals(
            FinoraServerFirstLoginRuntimeAuthorityUsbStore
                .Status.INVALID_REQUEST,
            FinoraServerFirstLoginRuntimeAuthorityUsbStore
                .writeNew(null, null, "testadmin", "{}")
        );
    }

    @Test
    public void missingSafAuthorityCannotRead() {
        try {
            FinoraServerFirstLoginRuntimeAuthorityUsbStore
                .readExisting(null, null, "testadmin");

            fail("Missing SAF authority must fail closed.");
        } catch (Exception expected) {
            assertTrue(true);
        }
    }
}