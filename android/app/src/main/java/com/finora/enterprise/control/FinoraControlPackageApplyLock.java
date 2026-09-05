package com.finora.enterprise.control;

// ============================================================
// FINORA ENTERPRISE OS™
//
// ANDROID CONTROL
// VERIFIED CONTROL PACKAGE APPLY LOCK
//
// RESPONSIBILITY:
//
// - Serialize read / verify / mutate / write transactions that
//   share the encrypted FINORA Android Control Store
// - Prevent BRANCH_ACTIVATION and STORAGE_ENTITLEMENT imports
//   from racing each other inside this process
//
// IMPORTANT:
//
// - Package-private native synchronization boundary.
// - No persistence.
// - No signing.
// - No private key.
// - No WebView.
// - No Business Date.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

final class FinoraControlPackageApplyLock {

    static final Object LOCK =
        new Object();

    private FinoraControlPackageApplyLock() {
    }
}

// ============================================================
// END
// ============================================================