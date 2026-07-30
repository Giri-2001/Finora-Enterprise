type LoanTimelineEvent = {
  id: string;
  title: string;
  description?: string;
  date: string;
  color?: string;
};

type LoanTimelineProps = {
  events: LoanTimelineEvent[];
};

export default function LoanTimeline({ events }: LoanTimelineProps) {
  if (events.length === 0) {
    return (
      <div
        style={{
          padding: 32,
          borderRadius: 18,
          border: "1px dashed var(--surface-border)",
          background: "var(--surface)",
          color: "var(--text-muted)",
          textAlign: "center",
        }}
      >
        No timeline history available.
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 18,
      }}
    >
      {events.map((event) => (
        <div
          key={event.id}
          style={{
            display: "flex",
            gap: 16,
            alignItems: "flex-start",
          }}
        >
          <div
            style={{
              width: 14,
              height: 14,
              marginTop: 6,
              borderRadius: "50%",
              background: event.color ?? "var(--finora-accent)",
              flexShrink: 0,
            }}
          />

          <div
            style={{
              flex: 1,
              padding: 18,
              borderRadius: 16,
              background: "var(--surface)",
              border: "1px solid var(--surface-border)",
              boxShadow: "var(--card-shadow)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <strong
                style={{
                  color: "var(--text)",
                }}
              >
                {event.title}
              </strong>

              <span
                style={{
                  color: "var(--text-muted)",
                  fontSize: 12,
                }}
              >
                {event.date}
              </span>
            </div>

            {event.description && (
              <p
                style={{
                  marginTop: 10,
                  marginBottom: 0,
                  color: "var(--text-muted)",
                  lineHeight: 1.6,
                }}
              >
                {event.description}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
