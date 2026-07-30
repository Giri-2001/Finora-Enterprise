function escapeCSV(value: unknown): string {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

export function exportReportToExcel(
  title: string,
  rows: Record<string, unknown>[],
): void {
  if (rows.length === 0) {
    return;
  }

  const headers = Object.keys(rows[0]);

  const generatedAt = new Date().toLocaleString("en-IN");

  const csvRows = [
    "FINORA ENTERPRISE REPORT",

    `Report: ${title}`,

    `Generated: ${generatedAt}`,

    "",

    headers.map((header) => escapeCSV(header)).join(","),

    ...rows.map((row) =>
      headers

        .map((header) => {
          const value = row[header];

          if (typeof value === "number") {
            return escapeCSV(value.toLocaleString("en-IN"));
          }

          return escapeCSV(value);
        })

        .join(","),
    ),
  ];

  const csvContent = csvRows.join("\n");

  const blob = new Blob(
    [csvContent],

    {
      type: "text/csv;charset=utf-8;",
    },
  );

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;

  link.download = `${title}_${Date.now()}.csv`;

  document.body.appendChild(link);

  link.click();

  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}
