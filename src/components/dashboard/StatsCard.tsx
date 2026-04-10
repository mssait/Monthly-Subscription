interface StatsCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: string;
  variant?: "default" | "warning";
}

export default function StatsCard({
  title,
  value,
  subtitle,
  icon,
  variant = "default",
}: StatsCardProps) {
  return (
    <div className={`rounded-lg border bg-white p-5 ${variant === "warning" ? "border-red-200" : ""}`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-gray-500">{title}</p>
        <span className="text-xl">{icon}</span>
      </div>
      <p className={`text-2xl font-bold ${variant === "warning" ? "text-red-600" : "text-gray-900"}`}>
        {value}
      </p>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </div>
  );
}
