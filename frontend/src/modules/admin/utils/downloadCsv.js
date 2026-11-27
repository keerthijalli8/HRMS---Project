export function downloadCsv(filename, headers, rows) {
  const escapeValue = (value) => {
    const text = String(value ?? "");
    const safeText = /^[=+\-@]/.test(text) ? `'${text}` : text;
    return `"${safeText.replace(/"/g, '""')}"`;
  };
  const content = [headers, ...rows]
    .map((row) => row.map(escapeValue).join(","))
    .join("\r\n");
  const url = URL.createObjectURL(
    new Blob(["\uFEFF", content], { type: "text/csv;charset=utf-8;" })
  );
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
