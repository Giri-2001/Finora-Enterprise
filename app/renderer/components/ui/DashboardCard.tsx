import "../../styles/dashboard-card.css";

type DashboardCardProps = {
  icon: string;
  title: string;
  value: string | number;
  description: string;
};

export default function DashboardCard({
  icon,
  title,
  value,
  description,
}: DashboardCardProps) {
  return (
    <div className="dashboard-card">
      <div className="dashboard-card-icon-wrapper">
        <img
          src={icon}
          alt={title}
          className="dashboard-card-icon"
        />
      </div>

      <h3 className="dashboard-card-title">
        {title}
      </h3>

      <h2 className="dashboard-card-value">
        {value}
      </h2>

      <p className="dashboard-card-description">
        {description}
      </p>
    </div>
  );
}
