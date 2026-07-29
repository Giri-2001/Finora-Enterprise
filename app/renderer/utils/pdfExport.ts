export function exportReportToPDF(
  title: string,
  rows: Record<string, unknown>[],
): void {
  const printWindow = window.open("", "_blank", "width=900,height=700");

  if (!printWindow) {
    return;
  }

  const tableRows = rows
    .map(
      (row) =>
        `
        <tr>
          ${Object.values(row)
            .map((value) => `<td>${value}</td>`)
            .join("")}
        </tr>
        `,
    )
    .join("");

  const headers =
    rows.length > 0
      ? Object.keys(rows[0])
          .map((key) => `<th>${key}</th>`)
          .join("")
      : "";

  printWindow.document.write(
    `
    <html>
      <head>
        <title>${title}</title>

        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
          }

          h1 {
            text-align: center;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }

          th,
          td {
            border: 1px solid #333;
            padding: 8px;
            text-align: left;
          }

          th {
            background: #eeeeee;
          }
        </style>

      </head>

      <body>

        <h1>
          ${title}
        </h1>

        <table>

          <thead>
            <tr>
              ${headers}
            </tr>
          </thead>

          <tbody>
            ${tableRows}
          </tbody>

        </table>

      </body>
    </html>
    `,
  );

  printWindow.document.close();

  printWindow.print();
}
