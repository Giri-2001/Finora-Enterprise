package com.finora.enterprise;

import android.os.Bundle;

import com.finora.enterprise.control.FinoraControlPlugin;
import com.finora.enterprise.control.FinoraDevProvisioning;
import com.finora.enterprise.control.FinoraInstallationBindingCrypto;
import com.finora.enterprise.control.FinoraInstallationBindingService;
import com.finora.enterprise.usb.FinoraUsbPlugin;
import com.getcapacitor.BridgeActivity;

public class MainActivity
    extends BridgeActivity {

    @Override
    protected void onCreate(
        Bundle savedInstanceState
    ) {
        /*
         * IMPORTANT:
         *
         * Register FINORA native plugins BEFORE
         * BridgeActivity creates the Capacitor bridge.
         */
        registerPlugin(
            FinoraControlPlugin.class
        );

        registerPlugin(
            FinoraUsbPlugin.class
        );

        /*
         * Trusted Android development provisioning.
         *
         * - Native only.
         * - Requires explicit Activity intent extras.
         * - FinoraDevProvisioning itself rejects use when the
         *   installed application is not debuggable.
         * - Must run before the renderer starts so the global
         *   activation gate reads the newly provisioned state.
         */
        try {
            FinoraInstallationBindingService bindingService =
                new FinoraInstallationBindingService(
                    this
                );

            FinoraInstallationBindingCrypto.PublicBinding nativeBinding =
                bindingService
                    .ensure();

            FinoraDevProvisioning.run(
                this,
                getIntent(),
                nativeBinding
            );
        } catch (Exception error) {
            throw new IllegalStateException(
                "FINORA Android development provisioning failed.",
                error
            );
        }

        super.onCreate(
            savedInstanceState
        );
    }
}
