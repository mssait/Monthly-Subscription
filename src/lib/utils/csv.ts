export function arrayToCSV(data: Record<string, unknown>[], headers?: string[]): string {
  if (data.length === 0) return "";

  const keys = headers ?? Object.keys(data[0]);
  const header = keys.join(",");
  const rows = data.map((row) =>
    keys
      .map((key) => {
        const value = row[key];
        if (value === null || value === undefined) return "";
        const str = String(value);
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        if (str.includes(",") || str.includes('"') || str.includes("\n")) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      })
      .join(",")
  );

  return [header, ...rows].join("\n");
}

export function downloadCSV(data: Record<string, unknown>[], filename: string): void {
  const csv = arrayToCSV(data);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
