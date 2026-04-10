"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatINRPlain } from "@/lib/utils/currency";

interface CollectionChartProps {
  data: Array<{ month: string; total: number }>;
}

export default function CollectionChart({ data }: CollectionChartProps) {
  return (
    <div className="rounded-lg border bg-white p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">
        Monthly collections (last 6 months)
      </h3>
      {data.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
          No data yet
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12, fill: "#6b7280" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v) => `₹${formatINRPlain(v)}`}
              tick={{ fontSize: 11, fill: "#6b7280" }}
              axisLine={false}
              tickLine={false}
              width={70}
            />
            <Tooltip
              formatter={(value: number) => [`₹${formatINRPlain(value)}`, "Collection"]}
              contentStyle={{ borderRadius: 8, fontSize: 12 }}
            />
            <Bar dataKey="total" fill="#059669" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
