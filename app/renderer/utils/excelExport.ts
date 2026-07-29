export function exportReportToExcel(
  title: string,
  rows: Record<string, unknown>[],
): void {
  if (rows.length === 0) {
    return;
  }

  const headers = Object.keys(rows[0]);

  const csvRows = [
    headers.join(","),

    ...rows.map((row) =>
      headers
        .map((header) => {
          const value = row[header];

          return `"${String(value ?? "").replace(/"/g, '""')}"`;
        })
        .join(","),
    ),
  ];

  const csvContent = csvRows.join("\n");

  const blob = new Blob([csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;

  link.download = `${title}.csv`;

  document.body.appendChild(link);

  link.click();

  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}
