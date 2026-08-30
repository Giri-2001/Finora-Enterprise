package com.finora.enterprise;

import android.os.Bundle;

import com.finora.enterprise.control.FinoraControlPlugin;
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

        super.onCreate(
            savedInstanceState
        );
    }
}