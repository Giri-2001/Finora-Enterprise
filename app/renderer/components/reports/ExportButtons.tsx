type ExportButtonsProps = {
  onExportPDF: () => void;

  onExportExcel: () => void;
};

export default function ExportButtons({
  onExportPDF,
  onExportExcel,
}: ExportButtonsProps) {
  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        marginTop: 20,
      }}
    >
      <button type="button" onClick={onExportPDF} style={buttonStyle}>
        Export PDF
      </button>

      <button type="button" onClick={onExportExcel} style={buttonStyle}>
        Export Excel
      </button>
    </div>
  );
}

const buttonStyle = {
  padding: "10px 18px",

  borderRadius: "8px",

  border: "none",

  background: "#2563eb",

  color: "#ffffff",

  cursor: "pointer",

  fontWeight: 600,
};
