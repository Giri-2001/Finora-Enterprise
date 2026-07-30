import Button from "./Button";

type ConfirmModalProps = {
  title: string;

  message: string;

  confirmText?: string;

  cancelText?: string;

  danger?: boolean;

  onConfirm: () => void;

  onCancel: () => void;
};

export default function ConfirmModal({
  title,

  message,

  confirmText = "Confirm",

  cancelText = "Cancel",

  danger = false,

  onConfirm,

  onCancel,
}: ConfirmModalProps) {
  return (
    <div
      style={{
        position: "fixed",

        inset: 0,

        background: "var(--overlay)",

        display: "flex",

        alignItems: "center",

        justifyContent: "center",

        zIndex: 5000,

        padding: 20,

        backdropFilter: "blur(12px)",
      }}
      onClick={onCancel}
    >
      <div
        style={{
          width: "100%",

          maxWidth: 460,

          background: "var(--surface)",

          color: "var(--text)",

          border: "1px solid var(--surface-border)",

          borderRadius: 22,

          padding: 32,

          boxShadow: "var(--popup-shadow)",

          animation: "finoraModalIn .25s ease",
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div
          style={{
            display: "flex",

            alignItems: "center",

            gap: 12,

            marginBottom: 16,
          }}
        >
          <div
            style={{
              width: 44,

              height: 44,

              borderRadius: "50%",

              display: "flex",

              alignItems: "center",

              justifyContent: "center",

              background: danger ? "var(--danger-soft)" : "rgba(37,99,235,.15)",

              color: danger ? "var(--danger)" : "var(--finora-accent)",

              fontSize: 22,

              fontWeight: 900,
            }}
          >
            {danger ? "!" : "?"}
          </div>

          <h2
            style={{
              margin: 0,

              fontSize: 23,

              fontWeight: 900,

              color: "var(--text)",
            }}
          >
            {title}
          </h2>
        </div>

        <p
          style={{
            margin: 0,

            color: "var(--text-muted)",

            lineHeight: 1.7,

            fontSize: 15,
          }}
        >
          {message}
        </p>

        <div
          style={{
            display: "flex",

            justifyContent: "flex-end",

            gap: 12,

            marginTop: 30,
          }}
        >
          <Button variant="secondary" onClick={onCancel}>
            {cancelText}
          </Button>

          <Button variant={danger ? "danger" : "primary"} onClick={onConfirm}>
            {confirmText}
          </Button>
        </div>

        <style>
          {`

            @keyframes finoraModalIn {

              from {

                opacity:0;

                transform:
                  scale(.92)
                  translateY(20px);

              }


              to {

                opacity:1;

                transform:
                  scale(1)
                  translateY(0);

              }

            }

          `}
        </style>
      </div>
    </div>
  );
}
