/* ===========================================================
   FINORA ENTERPRISE V2
   CUSTOMER PHOTO UPLOADER
--------------------------------------------------------------
Reusable Photo Upload Component
=========================================================== */

import type {
  ChangeEvent,
  CSSProperties,
} from "react";

interface CustomerPhotoUploaderProps {
  imageUrl: string;
  onImageChange: (image: string) => void;
}

const wrapperStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "16px",
};

const previewStyle: CSSProperties = {
  width: "160px",
  height: "160px",
  borderRadius: "18px",
  border: "2px dashed #cbd5e1",
  background: "#f8fafc",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
};

const imageStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

const buttonRowStyle: CSSProperties = {
  display: "flex",
  gap: "12px",
  flexWrap: "wrap",
};

const buttonStyle: CSSProperties = {
  padding: "10px 18px",
  borderRadius: "12px",
  border: "1px solid #d1d5db",
  background: "#ffffff",
  cursor: "pointer",
  fontWeight: 600,
};

export default function CustomerPhotoUploader({
  imageUrl,
  onImageChange,
}: CustomerPhotoUploaderProps) {

  function handleFileSelect(
    event: ChangeEvent<HTMLInputElement>,
  ): void {

    const file = event.target.files?.[0];

    if (!file) {

      return;

    }

    const reader = new FileReader();

    reader.onload = () => {

      onImageChange(
        String(reader.result),
      );

    };

    reader.readAsDataURL(file);

  }

  function removePhoto(): void {

    onImageChange("");

  }

  return (

    <section style={wrapperStyle}>

      <div style={previewStyle}>

        {imageUrl ? (

          <img
            src={imageUrl}
            alt="Customer"
            style={imageStyle}
          />

        ) : (

          <span>No Photo</span>

        )}

      </div>

      <div style={buttonRowStyle}>

        <label style={buttonStyle}>

          Upload Photo

          <input
            hidden
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
          />

        </label>

        <button
          type="button"
          style={buttonStyle}
          onClick={removePhoto}
        >
          Remove
        </button>

      </div>

    </section>

  );

}
