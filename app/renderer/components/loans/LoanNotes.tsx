import { useState } from "react";

import Button from "../ui/Button";

type LoanNote = {
  id: string;
  text: string;
  createdAt: string;
};

type LoanNotesProps = {
  notes: LoanNote[];
  onAddNote?: (text: string) => void;
};

export default function LoanNotes({ notes, onAddNote }: LoanNotesProps) {
  const [value, setValue] = useState("");

  const handleAdd = () => {
    const text = value.trim();

    if (!text) {
      return;
    }

    onAddNote?.(text);
    setValue("");
  };

  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--surface-border)",
        borderRadius: 18,
        padding: 20,
        boxShadow: "var(--card-shadow)",
      }}
    >
      <h3
        style={{
          marginTop: 0,
          marginBottom: 18,
          color: "var(--text)",
        }}
      >
        Loan Notes
      </h3>

      {onAddNote && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            marginBottom: 24,
          }}
        >
          <textarea
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="Write a note..."
            rows={4}
            style={{
              width: "100%",
              resize: "vertical",
              padding: 12,
              borderRadius: 12,
              border: "1px solid var(--surface-border)",
              background: "var(--surface)",
              color: "var(--text)",
              boxSizing: "border-box",
            }}
          />

          <div>
            <Button type="button" onClick={handleAdd}>
              Add Note
            </Button>
          </div>
        </div>
      )}

      {notes.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            color: "var(--text-muted)",
            padding: "24px 0",
          }}
        >
          No notes available.
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          {notes.map((note) => (
            <div
              key={note.id}
              style={{
                border: "1px solid var(--surface-border)",
                borderRadius: 14,
                padding: 16,
                background: "var(--surface-hover)",
              }}
            >
              <div
                style={{
                  color: "var(--text)",
                  whiteSpace: "pre-wrap",
                  lineHeight: 1.6,
                }}
              >
                {note.text}
              </div>

              <div
                style={{
                  marginTop: 10,
                  fontSize: 12,
                  color: "var(--text-muted)",
                }}
              >
                {note.createdAt}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
