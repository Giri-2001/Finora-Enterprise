import { createAuditArchive } from "../../store/auditArchiveStore";

import { getSession } from "../../store/authStore";

type AuditArchiveButtonProps = {
  onArchiveCreated?: () => void;
};

export default function AuditArchiveButton({
  onArchiveCreated,
}: AuditArchiveButtonProps) {
  function handleArchive() {
    const session = getSession();

    createAuditArchive(session?.username ?? "SYSTEM");

    if (onArchiveCreated) {
      onArchiveCreated();
    }
  }

  return (
    <button
      type="button"
      onClick={handleArchive}
      style={{
        background: "#7c3aed",

        color: "#ffffff",

        border: "none",

        padding: "8px 14px",

        borderRadius: 6,

        cursor: "pointer",
      }}
    >
      Create Audit Archive
    </button>
  );
}
