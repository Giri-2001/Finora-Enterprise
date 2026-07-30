function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatValue(value: unknown): string {
  if (typeof value === "number") {
    return value.toLocaleString("en-IN");
  }

  return escapeHtml(value);
}

export function exportReportToPDF(
  title: string,
  rows: Record<string, unknown>[],
): void {
  const printWindow = window.open("", "_blank", "width=1000,height=800");

  if (!printWindow) {
    return;
  }

  const generatedAt = new Date().toLocaleString("en-IN");

  const totalAmount = rows.reduce(
    (sum, row) => {
      const amount = Number(
        row.amount ?? row.totalAmount ?? row.approvedAmount ?? 0,
      );

      return sum + amount;
    },

    0,
  );

  const headers =
    rows.length > 0
      ? Object.keys(rows[0])

          .map((key) => `<th>${escapeHtml(key)}</th>`)

          .join("")
      : "";

  const tableRows = rows
    .map(
      (row) =>
        `
        <tr>
          ${Object.values(row)

            .map((value) => `<td>${formatValue(value)}</td>`)

            .join("")}
        </tr>
        `,
    )

    .join("");

  printWindow.document.write(
    `

<html>

<head>

<title>
${escapeHtml(title)}
</title>


<style>


body {

  font-family:
    Arial, sans-serif;

  padding:
    30px;

  color:
    #111827;

}



.header {

  text-align:
    center;

  margin-bottom:
    20px;

}



.logo {

  font-size:
    28px;

  font-weight:
    bold;

}



.summary {

  display:
    flex;

  justify-content:
    space-between;

  margin-bottom:
    20px;

}



table {

  width:
    100%;

  border-collapse:
    collapse;

}



th {

  background:
    #0f172a;

  color:
    white;

}



th,
td {

  border:
    1px solid #333;

  padding:
    8px;

  font-size:
    12px;

}



.footer {

  margin-top:
    30px;

  text-align:
    center;

  font-size:
    12px;

  color:
    #666;

}


</style>


</head>


<body>


<div class="header">

<div class="logo">
FINORA ENTERPRISE
</div>


<h2>
${escapeHtml(title)}
</h2>


<p>
Generated:
${generatedAt}
</p>


</div>





<div class="summary">

<div>

<strong>
Records:
</strong>

${rows.length}

</div>


<div>

<strong>
Total:
</strong>

₹${totalAmount.toLocaleString("en-IN")}

</div>


</div>





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




<div class="footer">

FINORA Enterprise
<br/>
Official Business Report

</div>



</body>


</html>

`,
  );

  printWindow.document.close();

  printWindow.print();
}
