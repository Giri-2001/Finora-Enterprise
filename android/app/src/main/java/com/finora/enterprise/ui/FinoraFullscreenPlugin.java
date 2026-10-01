package com.finora.enterprise.ui;

import android.os.Build;
import android.view.View;
import android.view.Window;
import android.view.WindowInsets;
import android.view.WindowInsetsController;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(
    name = "FinoraFullscreen"
)
public final class FinoraFullscreenPlugin
    extends Plugin {

    private boolean fullscreen = false;

    @PluginMethod
    public void toggleFullscreen(
        PluginCall call
    ) {
        if (call == null) {
            return;
        }

        getActivity().runOnUiThread(
            () -> {
                try {
                    fullscreen =
                        !fullscreen;

                    applyFullscreen(
                        fullscreen
                    );

                    JSObject result =
                        new JSObject();

                    result.put(
                        "fullscreen",
                        fullscreen
                    );

                    call.resolve(
                        result
                    );
                }
                catch (Exception error) {
                    call.reject(
                        "Unable to toggle FINORA fullscreen.",
                        error
                    );
                }
            }
        );
    }

    private void applyFullscreen(
        boolean enabled
    ) {
        Window window =
            getActivity().getWindow();

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            WindowInsetsController controller =
                window.getInsetsController();

            if (controller == null) {
                return;
            }

            if (enabled) {
                controller.hide(
                    WindowInsets.Type.statusBars() |
                    WindowInsets.Type.navigationBars()
                );

                controller.setSystemBarsBehavior(
                    WindowInsetsController
                        .BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
                );
            }
            else {
                controller.show(
                    WindowInsets.Type.statusBars() |
                    WindowInsets.Type.navigationBars()
                );
            }

            return;
        }

        View decorView =
            window.getDecorView();

        if (enabled) {
            decorView.setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY |
                View.SYSTEM_UI_FLAG_FULLSCREEN |
                View.SYSTEM_UI_FLAG_HIDE_NAVIGATION |
                View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN |
                View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION |
                View.SYSTEM_UI_FLAG_LAYOUT_STABLE
            );
        }
        else {
            decorView.setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_VISIBLE
            );
        }
    }
}