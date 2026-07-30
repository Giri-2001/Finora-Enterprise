import logo from "../../../../assets/icons/finora.png";

type BrandLogoProps = {
  size?: number;
};

export default function BrandLogo({ size = 42 }: BrandLogoProps) {
  return (
    <img
      src={logo}
      alt="FINORA"
      width={size}
      height={size}
      style={{
        display: "block",
        objectFit: "contain",
      }}
    />
  );
}
