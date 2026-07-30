import { useState } from "react";

import Button from "../ui/Button";

import type { GoldOrnament, OrnamentType } from "./types";

type OrnamentManagerProps = {
  ornaments: GoldOrnament[];

  onAdd: (ornament: GoldOrnament) => void;

  onDelete?: (id: string) => void;
};

export default function OrnamentManager({
  ornaments,

  onAdd,

  onDelete,
}: OrnamentManagerProps) {
  const [loanId, setLoanId] = useState("");

  const [customerId, setCustomerId] = useState("");

  const [ornamentType, setOrnamentType] = useState<OrnamentType>("RING");

  const [description, setDescription] = useState("");

  const [quantity, setQuantity] = useState("");

  const [grossWeight, setGrossWeight] = useState("");

  const [netWeight, setNetWeight] = useState("");

  const [purity, setPurity] = useState("");

  const [imageUrl, setImageUrl] = useState("");

  const [error, setError] = useState("");

  function addOrnament() {
    setError("");

    if (!loanId) {
      setError("Loan ID required");

      return;
    }

    const ornament: GoldOrnament = {
      id: Date.now().toString(),

      loanId,

      customerId,

      ornamentType,

      description,

      quantity: Number(quantity || 0),

      grossWeight: Number(grossWeight || 0),

      netWeight: Number(netWeight || 0),

      purity,

      imageUrl,

      createdAt: new Date().toISOString(),

      updatedAt: new Date().toISOString(),
    };

    onAdd(ornament);

    setLoanId("");

    setCustomerId("");

    setDescription("");

    setQuantity("");

    setGrossWeight("");

    setNetWeight("");

    setPurity("");

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

        <select
          value={ornamentType}
          onChange={(e) => setOrnamentType(e.target.value as OrnamentType)}
        >
          <option value="RING">Ring</option>

          <option value="CHAIN">Chain</option>

          <option value="BANGLE">Bangle</option>

          <option value="NECKLACE">Necklace</option>

          <option value="OTHER">Other</option>
        </select>

        <input
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <input
          type="number"
          placeholder="Quantity"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
        />

        <input
          type="number"
          placeholder="Gross Weight"
          value={grossWeight}
          onChange={(e) => setGrossWeight(e.target.value)}
        />

        <input
          type="number"
          placeholder="Net Weight"
          value={netWeight}
          onChange={(e) => setNetWeight(e.target.value)}
        />

        <input
          placeholder="Purity"
          value={purity}
          onChange={(e) => setPurity(e.target.value)}
        />

        <input
          placeholder="Image URL"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
        />

        <Button type="button" onClick={addOrnament}>
          Add Ornament
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
            <th style={cellStyle}>Type</th>

            <th style={cellStyle}>Quantity</th>

            <th style={cellStyle}>Gross</th>

            <th style={cellStyle}>Net</th>

            <th style={cellStyle}>Purity</th>

            <th style={cellStyle}>Action</th>
          </tr>
        </thead>

        <tbody>
          {ornaments.map((item) => (
            <tr key={item.id}>
              <td style={cellStyle}>{item.ornamentType}</td>

              <td style={cellStyle}>{item.quantity}</td>

              <td style={cellStyle}>{item.grossWeight}</td>

              <td style={cellStyle}>{item.netWeight}</td>

              <td style={cellStyle}>{item.purity}</td>

              <td style={cellStyle}>
                {onDelete && (
                  <Button type="button" onClick={() => onDelete(item.id)}>
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
