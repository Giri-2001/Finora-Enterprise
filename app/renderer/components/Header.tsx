type HeaderProps = {
  title?: string;
};

export default function Header({ title = "Dashboard" }: HeaderProps) {
  return (
    <header className="app-header">
      <h1
        style={{
          margin: 0,

          fontSize: "20px",

          fontWeight: 600,
        }}
      >
        {title}
      </h1>
    </header>
  );
}
