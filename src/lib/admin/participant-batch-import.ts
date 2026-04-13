import * as XLSX from "xlsx";

export type ParsedBatchParticipant = {
  name: string;
  email: string;
};

export type ParsedBatchImport = {
  entries: ParsedBatchParticipant[];
  ignoredRowCount: number;
  sourceSheetName: string;
};

function normaliseCellValue(value: unknown) {
  return String(value ?? "").trim();
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function findHeaderIndex(rows: string[][]) {
  return rows.findIndex((row) => {
    const normalised = row.map((cell) => cell.trim().toLowerCase());
    return (
      normalised.includes("fulde navn") &&
      normalised.includes("e-mailadresse")
    );
  });
}

export async function parseParticipantBatchFile(file: File): Promise<ParsedBatchImport> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, {
    type: "array",
    raw: false,
    cellDates: false,
  });

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<(string | number | null)[]>(worksheet, {
      header: 1,
      blankrows: false,
      defval: "",
    });
    const normalisedRows = rows.map((row) => row.map(normaliseCellValue));
    const headerIndex = findHeaderIndex(normalisedRows);

    if (headerIndex === -1) {
      continue;
    }

    const headerRow = normalisedRows[headerIndex].map((cell) => cell.toLowerCase());
    const nameColumnIndex = headerRow.indexOf("fulde navn");
    const emailColumnIndex = headerRow.indexOf("e-mailadresse");

    if (nameColumnIndex === -1 || emailColumnIndex === -1) {
      continue;
    }

    const seenEmails = new Set<string>();
    const entries: ParsedBatchParticipant[] = [];
    let ignoredRowCount = 0;

    for (const row of normalisedRows.slice(headerIndex + 1)) {
      const name = row[nameColumnIndex] ?? "";
      const email = (row[emailColumnIndex] ?? "").toLowerCase();

      if (!name && !email) {
        continue;
      }

      if (
        !name ||
        !email ||
        name.toLowerCase().startsWith("tilmeldinger:") ||
        name.toLowerCase().startsWith("genereret:") ||
        !isValidEmail(email) ||
        seenEmails.has(email)
      ) {
        ignoredRowCount += 1;
        continue;
      }

      seenEmails.add(email);
      entries.push({
        name,
        email,
      });
    }

    return {
      entries,
      ignoredRowCount,
      sourceSheetName: sheetName,
    };
  }

  throw new Error("Filen indeholder ikke et ark med kolonnerne 'Fulde navn' og 'E-mailadresse'.");
}
