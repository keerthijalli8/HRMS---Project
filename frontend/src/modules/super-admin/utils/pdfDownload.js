import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";

pdfMake.addVirtualFileSystem(pdfFonts);

const normalize = (value) => String(value ?? "-");

const sectionHeaders = (heading, width) => {
  const name = heading.toLowerCase();
  if (name === "branches") return ["Branch", "Location", "Status", "Employees"].slice(0, width);
  if (name.includes("departments in this branch")) return ["Department", "Department head", "Employees", "Status"].slice(0, width);
  if (name.includes("departments in associated branch")) return ["Department", "Employees", "Status"].slice(0, width);
  if (name.includes("department")) return ["Department", "Code", "Status", "Employees"].slice(0, width);
  return Array.from({ length: width }, (_, index) => `Detail ${index + 1}`);
};

const relatedTable = (heading, rows) => {
  const parsedRows = rows.filter((row) => typeof row === "string").map((row) => row.split(/\s+\u00B7\s+/).map(normalize));
  const columns = Math.max(1, ...parsedRows.map((row) => row.length));
  const headers = sectionHeaders(heading, columns);
  return {
    table: {
      headerRows: 1,
      widths: headers.map(() => "*"),
      body: [headers, ...parsedRows.map((row) => headers.map((_, index) => row[index] || "-"))],
    },
    layout: {
      fillColor: (rowIndex) => rowIndex === 0 ? "#E8F1F2" : rowIndex % 2 ? "#FFFFFF" : "#F5F8FA",
      hLineColor: () => "#D6E1E5",
      vLineColor: () => "#D6E1E5",
      hLineWidth: () => 0.6,
      vLineWidth: () => 0.6,
      paddingLeft: () => 7,
      paddingRight: () => 7,
      paddingTop: () => 6,
      paddingBottom: () => 6,
    },
  };
};

const detailTable = (rows, isAmountSummary = false) => {
  if (isAmountSummary) {
    return {
      table: {
        headerRows: 1,
        widths: ["*", "auto"],
        body: [
          [
            { text: "Description", style: "tableHeader" },
            { text: "Amount", style: "tableHeader", alignment: "right" },
          ],
          ...rows.map((row, index) => [
            { text: normalize(row.label), style: "tableCell", fillColor: index % 2 ? "#F5F8FA" : "#FFFFFF" },
            { text: normalize(row.value), style: "tableCell", alignment: "right", fillColor: index % 2 ? "#F5F8FA" : "#FFFFFF" },
          ]),
        ],
      },
      layout: {
        hLineColor: () => "#D6E1E5",
        vLineColor: () => "#D6E1E5",
        hLineWidth: () => 0.6,
        vLineWidth: () => 0.6,
        paddingLeft: () => 7,
        paddingRight: () => 7,
        paddingTop: () => 6,
        paddingBottom: () => 6,
      },
    };
  }
  const body = [];
  for (let index = 0; index < rows.length; index += 2) {
    const pair = rows.slice(index, index + 2);
    body.push(pair.map((row) => ({
      stack: [
        { text: normalize(row.label), style: "label" },
        { text: normalize(row.value), style: "value" },
      ],
      fillColor: index % 4 === 0 ? "#F5F8FA" : "#FFFFFF",
      margin: [8, 8, 8, 8],
    })));
    if (pair.length === 1) body[body.length - 1].push("");
  }
  return {
    table: { widths: ["*", "*"], body },
    layout: {
      hLineColor: () => "#D6E1E5",
      vLineColor: () => "#D6E1E5",
      hLineWidth: () => 0.6,
      vLineWidth: () => 0.6,
      paddingLeft: () => 0,
      paddingRight: () => 0,
      paddingTop: () => 0,
      paddingBottom: () => 0,
    },
  };
};

const subtitleFor = (title, sections, subtitle) => {
  if (subtitle) return subtitle;
  const profile = sections.find((section) => section.heading && section.heading.toLowerCase().includes("details")) || sections[0];
  const organization = profile?.rows?.find((row) => row?.label === "Organization")?.value;
  return organization ? `${organization} | Report details` : "Selected record details";
};

export const downloadPdf = (filename, title, sections, options = {}) => {
  const content = [
    { text: options.reportTitle || normalize(title).toUpperCase(), style: "title" },
    { text: subtitleFor(title, sections, options.subtitle), style: "subtitle", margin: [0, 3, 0, 20] },
  ];
  sections.forEach((section) => {
    const heading = normalize(section.heading || "Details");
    const rows = section.rows || [];
    content.push({ text: heading.toUpperCase(), style: "section", margin: [0, 12, 0, 8] });
    const objects = rows.filter((row) => row && typeof row === "object");
    content.push(objects.length === rows.length ? detailTable(objects, heading.toLowerCase().includes("amount")) : relatedTable(heading, rows));
  });
  const documentDefinition = {
    pageSize: "A4",
    pageMargins: [50, 48, 50, 42],
    content,
    defaultStyle: { font: "Roboto", fontSize: 9, color: "#18343C" },
    styles: {
      title: { fontSize: 20, bold: true, color: "#17324D", characterSpacing: 0.2 },
      subtitle: { fontSize: 9, color: "#5B6875" },
      section: { fontSize: 11, bold: true, color: "#17324D", characterSpacing: 0.3 },
      label: { fontSize: 7.5, color: "#5B6875", bold: false, margin: [0, 0, 0, 4] },
      value: { fontSize: 8.8, color: "#17324D", bold: true },
      amount: { fontSize: 9, color: "#17324D", bold: true },
      tableHeader: { fontSize: 8, bold: true, color: "#17324D" },
      tableCell: { fontSize: 8.8, color: "#18343C" },
    },
    header: () => ({ canvas: [{ type: "line", x1: 50, y1: 32, x2: 545, y2: 32, lineWidth: 0.6, lineColor: "#D6E1E5" }] }),
    footer: (currentPage, pageCount) => ({
      columns: [
        { text: "Confidential", fontSize: 7, color: "#5B6875" },
        { text: `Page ${currentPage} of ${pageCount}`, alignment: "right", fontSize: 7, color: "#5B6875" },
      ],
      margin: [50, 8, 50, 0],
    }),
    info: { title: normalize(title), subject: "HRMS report" },
  };
  pdfMake.createPdf(documentDefinition).download(filename.endsWith(".pdf") ? filename : `${filename}.pdf`);
};
