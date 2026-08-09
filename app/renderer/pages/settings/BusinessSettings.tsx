// ============================================================
// FINORA ENTERPRISE OS™
//
// BUSINESS SETTINGS PAGE
//
// RESPONSIBILITY:
//
// - Display active FINORA Business Identity
// - Display active Business Settings
// - Load data through BusinessService
// - Persist data through BusinessService
// - Use authenticated session as the active business context
//
// IMPORTANT:
//
// - No direct localStorage access.
// - No repository access.
// - No StorageManager access.
// - No Electron IPC.
// - No business calculations.
// - No authentication logic.
//
// VERSION : 2.0
// STATUS  : Production Foundation
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import {
  useEffect,
  useState,
} from "react";

import {
  getSession,
} from "../../store/authStore";

import {
  loadBusinessIdentity,
  saveOrUpdateBusinessIdentity,
  loadBusinessSettings,
  saveOrUpdateBusinessSettings,
} from "../../v2/services/business/businessService";

import type {
  BusinessIdentity,
} from "../../v2/types/business/business.identity.types";

import type {
  BusinessSettings as BusinessSettingsModel,
} from "../../v2/types/business/business.settings.types";

// ============================================================
// COMPONENT
// ============================================================

export default function BusinessSettings() {

  // ==========================================================
  // BUSINESS IDENTITY STATE
  // ==========================================================

  const [
    companyName,
    setCompanyName,
  ] = useState("");

  const [
    branchName,
    setBranchName,
  ] = useState("");

  // ==========================================================
  // BUSINESS SETTINGS STATE
  // ==========================================================

  const [
    address,
    setAddress,
  ] = useState("");

  const [
    phone,
    setPhone,
  ] = useState("");

  const [
    email,
    setEmail,
  ] = useState("");

  const [
    gst,
    setGst,
  ] = useState("");

  const [
    currency,
    setCurrency,
  ] = useState("INR");

  // ==========================================================
  // UI STATE
  // ==========================================================

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState<string | null>(null);

  const [
    successMessage,
    setSuccessMessage,
  ] = useState<string | null>(null);

  // ==========================================================
  // LOAD BUSINESS DATA
  // ==========================================================

  useEffect(() => {

    let active =
      true;

    async function load() {

      setLoading(true);

      setError(null);

      setSuccessMessage(null);

      const session =
        getSession();

      if (!session) {

        if (active) {

          setLoading(false);

          setError(
            "No active FINORA session was found.",
          );
        }

        return;
      }

      if (!session.businessId) {

        if (active) {

          setLoading(false);

          setError(
            "No active business is assigned to the current user.",
          );
        }

        return;
      }

      try {

        const [
          identityResult,
          settingsResult,
        ] =
          await Promise.all([
            loadBusinessIdentity(
              session.businessId,
            ),

            loadBusinessSettings(
              session.businessId,
            ),
          ]);

        if (!active) {
          return;
        }

        if (
          !identityResult.success
        ) {

          setError(
            identityResult.error ??
            "Unable to load business identity.",
          );

          return;
        }

        if (
          !settingsResult.success
        ) {

          setError(
            settingsResult.error ??
            "Unable to load business settings.",
          );

          return;
        }

        // ----------------------------------------------------
        // BUSINESS IDENTITY
        // ----------------------------------------------------

        if (identityResult.data) {

          setCompanyName(
            identityResult.data.businessName,
          );

          setBranchName(
            identityResult.data.branchName,
          );
        } else {

          // --------------------------------------------------
          // New business identity defaults come only from the
          // authenticated business context.
          // --------------------------------------------------

          setCompanyName("");

          setBranchName("");
        }

        // ----------------------------------------------------
        // BUSINESS SETTINGS
        // ----------------------------------------------------

        if (settingsResult.data) {

          setAddress(
            settingsResult.data.address,
          );

          setPhone(
            settingsResult.data.phone,
          );

          setEmail(
            settingsResult.data.email,
          );

          setGst(
            settingsResult.data.gst ?? "",
          );

          setCurrency(
            settingsResult.data.currency ||
            "INR",
          );
        } else {

          setAddress("");

          setPhone("");

          setEmail("");

          setGst("");

          setCurrency("INR");
        }

      } catch {

        if (active) {

          setError(
            "Unable to load business information.",
          );
        }

      } finally {

        if (active) {

          setLoading(false);
        }
      }
    }

    void load();

    return () => {

      active =
        false;
    };

  }, []);

  // ==========================================================
  // SAVE
  // ==========================================================

  async function handleSave(): Promise<void> {

    setError(null);

    setSuccessMessage(null);

    const session =
      getSession();

    if (!session) {

      setError(
        "No active FINORA session was found.",
      );

      return;
    }

    if (!session.ownerId) {

      setError(
        "No active FINORA owner is assigned to the current session.",
      );

      return;
    }

    if (!session.businessId) {

      setError(
        "No active business is assigned to the current session.",
      );

      return;
    }

    if (!session.branchId) {

      setError(
        "No active branch is assigned to the current session.",
      );

      return;
    }

    if (!companyName.trim()) {

      setError(
        "Business name is required.",
      );

      return;
    }

    if (!branchName.trim()) {

      setError(
        "Branch name is required.",
      );

      return;
    }

    if (!currency) {

      setError(
        "Currency is required.",
      );

      return;
    }

    setSaving(true);

    try {

      const now =
        new Date().toISOString();

      // ------------------------------------------------------
      // LOAD EXISTING IDENTITY
      //
      // This preserves the original creation timestamp when
      // updating an existing Business Identity record.
      // ------------------------------------------------------

      const existingIdentityResult =
        await loadBusinessIdentity(
          session.businessId,
        );

      if (
        !existingIdentityResult.success
      ) {

        setError(
          existingIdentityResult.error ??
          "Unable to verify business identity.",
        );

        return;
      }

      const identity: BusinessIdentity = {

        ownerId:
          session.ownerId,

        businessId:
          session.businessId,

        businessName:
          companyName.trim(),

        branchId:
          session.branchId,

        branchName:
          branchName.trim(),

        createdAt:
          existingIdentityResult.data?.createdAt ??
          now,

        updatedAt:
          now,
      };

      // ------------------------------------------------------
      // BUSINESS SETTINGS
      // ------------------------------------------------------

      const existingSettingsResult =
        await loadBusinessSettings(
          session.businessId,
        );

      if (
        !existingSettingsResult.success
      ) {

        setError(
          existingSettingsResult.error ??
          "Unable to verify business settings.",
        );

        return;
      }

      const settings: BusinessSettingsModel = {

        businessId:
          session.businessId,

        address:
          address.trim(),

        phone:
          phone.trim(),

        email:
          email.trim(),

        gst:
          gst.trim() ||
          undefined,

        currency:
          currency,

        createdAt:
          existingSettingsResult.data?.createdAt ??
          now,

        updatedAt:
          now,
      };

      // ------------------------------------------------------
      // PERSIST BUSINESS IDENTITY
      // ------------------------------------------------------

      const identityResult =
        await saveOrUpdateBusinessIdentity(
          identity,
        );

      if (
        !identityResult.success
      ) {

        setError(
          identityResult.error ??
          "Unable to save business identity.",
        );

        return;
      }

      // ------------------------------------------------------
      // PERSIST BUSINESS SETTINGS
      // ------------------------------------------------------

      const settingsResult =
        await saveOrUpdateBusinessSettings(
          settings,
        );

      if (
        !settingsResult.success
      ) {

        setError(
          settingsResult.error ??
          "Unable to save business settings.",
        );

        return;
      }

      setSuccessMessage(
        "Business settings saved successfully.",
      );

    } catch {

      setError(
        "Unable to save business settings.",
      );

    } finally {

      setSaving(false);
    }
  }

  // ==========================================================
  // LOADING STATE
  // ==========================================================

  if (loading) {

    return (

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          maxWidth: 700,
        }}
      >

        <h2>
          Business Settings
        </h2>

        <div>
          Loading business settings...
        </div>

      </div>
    );
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 24,
        maxWidth: 700,
      }}
    >

      {/* ======================================================
          PAGE TITLE
      ====================================================== */}

      <div>

        <h2
          style={{
            margin: 0,
          }}
        >
          Business Settings
        </h2>

        <p
          style={{
            marginTop: 8,
            marginBottom: 0,
          }}
        >
          Manage your FINORA business identity and operational
          settings.
        </p>

      </div>

      {/* ======================================================
          ERROR MESSAGE
      ====================================================== */}

      {error && (

        <div
          role="alert"
          style={{
            padding: 12,
            border: "1px solid #dc2626",
            borderRadius: 8,
          }}
        >
          {error}
        </div>
      )}

      {/* ======================================================
          SUCCESS MESSAGE
      ====================================================== */}

      {successMessage && (

        <div
          role="status"
          style={{
            padding: 12,
            border: "1px solid #16a34a",
            borderRadius: 8,
          }}
        >
          {successMessage}
        </div>
      )}

      {/* ======================================================
          BUSINESS IDENTITY
      ====================================================== */}

      <section
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >

        <h3
          style={{
            margin: 0,
          }}
        >
          Business Identity
        </h3>

        <input
          value={companyName}
          onChange={(event) =>
            setCompanyName(
              event.target.value,
            )
          }
          placeholder="Business Name"
          disabled={saving}
        />

        <input
          value={branchName}
          onChange={(event) =>
            setBranchName(
              event.target.value,
            )
          }
          placeholder="Branch Name"
          disabled={saving}
        />

      </section>

      {/* ======================================================
          BUSINESS CONTACT
      ====================================================== */}

      <section
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >

        <h3
          style={{
            margin: 0,
          }}
        >
          Business Contact
        </h3>

        <textarea
          value={address}
          onChange={(event) =>
            setAddress(
              event.target.value,
            )
          }
          placeholder="Business Address"
          rows={4}
          disabled={saving}
        />

        <input
          value={phone}
          onChange={(event) =>
            setPhone(
              event.target.value,
            )
          }
          placeholder="Phone Number"
          disabled={saving}
        />

        <input
          value={email}
          onChange={(event) =>
            setEmail(
              event.target.value,
            )
          }
          placeholder="Email Address"
          type="email"
          disabled={saving}
        />

      </section>

      {/* ======================================================
          TAX / CURRENCY
      ====================================================== */}

      <section
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >

        <h3
          style={{
            margin: 0,
          }}
        >
          Tax & Currency
        </h3>

        <input
          value={gst}
          onChange={(event) =>
            setGst(
              event.target.value,
            )
          }
          placeholder="GST / Tax ID"
          disabled={saving}
        />

        <select
          value={currency}
          onChange={(event) =>
            setCurrency(
              event.target.value,
            )
          }
          disabled={saving}
        >

          <option value="INR">
            INR ₹
          </option>

          <option value="USD">
            USD $
          </option>

        </select>

      </section>

      {/* ======================================================
          SAVE
      ====================================================== */}

      <button
        type="button"
        onClick={() => {
          void handleSave();
        }}
        disabled={saving}
      >
        {saving
          ? "Saving..."
          : "Save Settings"}
      </button>

    </div>
  );
}
