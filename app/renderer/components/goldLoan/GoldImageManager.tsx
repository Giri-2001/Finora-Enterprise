import { useState } from "react";

import Button from "../ui/Button";

import type { GoldImage } from "../../store/goldImageStore";

type GoldImageManagerProps = {
  images: GoldImage[];

  onAdd: (image: GoldImage) => void;

  onDelete?: (id: string) => void;
};

export default function GoldImageManager({
  images,

  onAdd,

  onDelete,
}: GoldImageManagerProps) {
  const [loanId, setLoanId] = useState("");

  const [customerId, setCustomerId] = useState("");

  const [ornamentId, setOrnamentId] = useState("");

  const [imageName, setImageName] = useState("");

  const [imageUrl, setImageUrl] = useState("");

  const [error, setError] = useState("");

  function addImage() {
    setError("");

    if (!loanId) {
      setError("Loan ID required");

      return;
    }

    if (!imageUrl) {
      setError("Image URL required");

      return;
    }

    const image: GoldImage = {
      id: Date.now().toString(),

      loanId,

      customerId,

      ornamentId: ornamentId || undefined,

      imageName: imageName || "Gold Image",

      imageUrl,

      createdAt: new Date().toISOString(),
    };

    onAdd(image);

    setLoanId("");

    setCustomerId("");

    setOrnamentId("");

    setImageName("");

    setImageUrl("");
  }

  return (
    <div>
      <div
        style={{
          display: "grid",

          gap: 10,

          maxWidth: 450,

          marginBottom: 20,
        }}
      >
        <input
          placeholder="Loan ID"
          value={loanId}
          onChange={(e) => setLoanId(e.target.value)}
        />

        <input
          placeholder="Customer ID"
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
        />

        <input
          placeholder="Ornament ID"
          value={ornamentId}
          onChange={(e) => setOrnamentId(e.target.value)}
        />

        <input
          placeholder="Image Name"
          value={imageName}
          onChange={(e) => setImageName(e.target.value)}
        />

        <input
          placeholder="Image URL"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
        />

        <Button type="button" onClick={addImage}>
          Save Image
        </Button>
      </div>

      {error && (
        <div
          style={{
            color: "#dc2626",
          }}
        >
          {error}
        </div>
      )}

      <table
        style={{
          width: "100%",

          borderCollapse: "collapse",
        }}
      >
        <thead>
          <tr>
            <th style={cellStyle}>Image</th>

            <th style={cellStyle}>Loan</th>

            <th style={cellStyle}>Ornament</th>

            <th style={cellStyle}>Date</th>

            <th style={cellStyle}>Action</th>
          </tr>
        </thead>

        <tbody>
          {images.map((image) => (
            <tr key={image.id}>
              <td style={cellStyle}>{image.imageName}</td>

              <td style={cellStyle}>{image.loanId}</td>

              <td style={cellStyle}>{image.ornamentId ?? "-"}</td>

              <td style={cellStyle}>{image.createdAt}</td>

              <td style={cellStyle}>
                {onDelete && (
                  <Button type="button" onClick={() => onDelete(image.id)}>
                    Delete
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const cellStyle = {
  padding: "12px",

  borderBottom: "1px solid #334155",
};
