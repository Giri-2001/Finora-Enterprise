package com.finora.enterprise.control;

import static org.junit.Assert.*;

import org.junit.Test;

public final class FinoraPortableBranchAccountUsbRootTest {

    @Test
    public void usernameIsCanonicalized() {
        assertEquals(
            "testadmin",
            FinoraPortableBranchAccountUsbRoot
                .canonicalUsername("  TestAdmin  ")
        );

        assertEquals(
            "giriadmin",
            FinoraPortableBranchAccountUsbRoot
                .canonicalUsername("GIRIADMIN")
        );
    }

    @Test
    public void invalidFolderNamesAreRejected() {
        String[] invalid = {
            "",
            " ",
            ".",
            "..",
            "../testadmin",
            "test/admin",
            "test\\admin",
            "test:admin"
        };

        for (String username : invalid) {
            try {
                FinoraPortableBranchAccountUsbRoot
                    .canonicalUsername(username);

                fail(
                    "Unsafe username accepted."
                );
            }
            catch (IllegalArgumentException expected) {
                // Correct.
            }
        }
    }

    @Test
    public void usernameCannotBeNull() {
        try {
            FinoraPortableBranchAccountUsbRoot
                .canonicalUsername(null);

            fail("Null username accepted.");
        }
        catch (IllegalArgumentException expected) {
            // Correct.
        }
    }
}