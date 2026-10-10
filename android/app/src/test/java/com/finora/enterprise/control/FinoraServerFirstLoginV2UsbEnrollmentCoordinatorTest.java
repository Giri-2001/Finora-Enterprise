package com.finora.enterprise.control;

import static org.junit.Assert.*;

import org.junit.Test;

public final class FinoraServerFirstLoginV2UsbEnrollmentCoordinatorTest {

    @Test
    public void missingUsbAuthorityFailsClosed() {
        FinoraServerFirstLoginV2UsbEnrollmentCoordinator.Result
            result =
                FinoraServerFirstLoginV2UsbEnrollmentCoordinator
                    .enrollNew(
                        null,
                        null,
                        null,
                        "testadmin",
                        "SyntheticPassword123!",
                        "SyntheticSecurity123!"
                    );

        assertFalse(result.success());

        assertEquals(
            FinoraServerFirstLoginV2UsbEnrollmentCoordinator.Status
                .INVALID_USB_ROOT,
            result.status
        );
    }

    @Test
    public void resultStatusCannotImplySessionAuthorization() {
        assertFalse(
            FinoraServerFirstLoginV2UsbEnrollmentCoordinator
                .enrollNew(
                    null, null, null,
                    "testadmin",
                    "SyntheticPassword123!",
                    "SyntheticSecurity123!"
                )
                .success()
        );
    }
}