export type ParsedDataset = {
  headers: string[];
  rows: Array<Record<string, string>>;
  delimiter: string;
  encoding: string;
  fileSize: number;
};

export type FieldMapping = {
  target: string;
  source: string;
  confidence: number;
};

export type CleaningResult = {
  cleanedRows: Array<Record<string, string>>;
  removedRows: Array<{ row: Record<string, string>; reason: string }>;
  fixedCells: Set<string>;
  summary: {
    rowsImported: number;
    duplicatesRemoved: number;
    rowsFixed: number;
    rowsRemoved: number;
    rowsRemaining: number;
  };
};

const mappingTargets = [
  "Buyer ID",
  "Seller ID",
  "Order ID",
  "Review",
  "Rating",
  "Timestamp",
  "Payment Method",
  "Device",
  "IP Address",
  "Refund",
] as const;

const aliases: Record<(typeof mappingTargets)[number], string[]> = {
  "Buyer ID": ["buyer", "buyer_id", "customer", "customer_id", "user", "reviewer"],
  "Seller ID": ["seller", "seller_id", "merchant", "vendor", "store"],
  "Order ID": ["order", "order_id", "transaction", "transaction_id"],
  Review: ["review", "review_text", "comment", "body", "text"],
  Rating: ["rating", "stars", "score"],
  Timestamp: ["timestamp", "date", "created_at", "review_date", "order_date"],
  "Payment Method": ["payment", "payment_method", "card", "last4"],
  Device: ["device", "device_id", "fingerprint"],
  "IP Address": ["ip", "ip_address", "address"],
  Refund: ["refund", "refund_id", "refund_reason", "chargeback"],
};

function splitCsv(input: string, delimiter: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const next = input[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        cell += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === delimiter && !inQuotes) {
      row.push(cell);
      cell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell);
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  row.push(cell);
  if (row.some((value) => value.trim())) rows.push(row);
  return rows;
}

function detectDelimiter(text: string) {
  const sample = text.slice(0, 2000);
  const candidates = [",", ";", "\t", "|"];
  return candidates
    .map((delimiter) => ({ delimiter, count: sample.split(delimiter).length }))
    .sort((left, right) => right.count - left.count)[0]?.delimiter ?? ",";
}

function normalizeHeader(header: string) {
  return header.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function parseDate(value: string) {
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? null : new Date(timestamp);
}

export function parseDataset(text: string, file: File): ParsedDataset {
  const delimiter = detectDelimiter(text);
  const [headers = [], ...rows] = splitCsv(text.replace(/^\uFEFF/, ""), delimiter);
  const safeHeaders = headers.map((header, index) => header.trim() || `Column ${index + 1}`);

  return {
    headers: safeHeaders,
    delimiter: delimiter === "\t" ? "Tab" : delimiter,
    encoding: "UTF-8",
    fileSize: file.size,
    rows: rows.map((row) =>
      safeHeaders.reduce<Record<string, string>>((accumulator, header, index) => {
        accumulator[header] = row[index] ?? "";
        return accumulator;
      }, {}),
    ),
  };
}

export function generateFieldMappings(headers: string[]): FieldMapping[] {
  return mappingTargets.map((target) => {
    const targetAliases = aliases[target].map(normalizeHeader);
    const scored = headers
      .map((header) => {
        const normalized = normalizeHeader(header);
        const exact = targetAliases.some((alias) => normalized === alias);
        const partial = targetAliases.some((alias) => normalized.includes(alias) || alias.includes(normalized));
        return { header, score: exact ? 96 : partial ? 78 : 0 };
      })
      .sort((left, right) => right.score - left.score)[0];

    return {
      target,
      source: scored?.score ? scored.header : "",
      confidence: scored?.score ?? 0,
    };
  });
}

export function profileDataset(dataset: ParsedDataset, mappings: FieldMapping[]) {
  const mapped = new Map(mappings.map((mapping) => [mapping.target, mapping.source]));
  const rows = dataset.rows;
  const duplicateRows = rows.length - new Set(rows.map((row) => JSON.stringify(row))).size;
  const missingValues = rows.reduce(
    (count, row) => count + Object.values(row).filter((value) => !value.trim()).length,
    0,
  );
  const timestampColumn = mapped.get("Timestamp");
  const dates = timestampColumn
    ? rows.map((row) => parseDate(row[timestampColumn] ?? "")).filter((date): date is Date => Boolean(date))
    : [];

  const uniqueFor = (target: string) => {
    const column = mapped.get(target);
    if (!column) return 0;
    return new Set(rows.map((row) => row[column]?.trim()).filter(Boolean)).size;
  };

  const requiredMissing = ["Buyer ID", "Seller ID", "Order ID"].filter((target) => !mapped.get(target)).length;

  return {
    rows: rows.length,
    columns: dataset.headers.length,
    fileSize: dataset.fileSize,
    detectedDelimiter: dataset.delimiter,
    encoding: dataset.encoding,
    dateRange:
      dates.length > 0
        ? `${new Date(Math.min(...dates.map(Number))).toLocaleDateString()} - ${new Date(Math.max(...dates.map(Number))).toLocaleDateString()}`
        : "Not detected",
    duplicateRows,
    missingValues,
    invalidRecords: requiredMissing > 0 ? rows.length : rows.filter((row) => Object.values(row).every((value) => !value.trim())).length,
    uniqueBuyers: uniqueFor("Buyer ID"),
    uniqueSellers: uniqueFor("Seller ID"),
    uniqueOrders: uniqueFor("Order ID"),
    uniqueReviews: uniqueFor("Review"),
    uniqueRefunds: uniqueFor("Refund"),
  };
}

export function cleanDataset(dataset: ParsedDataset, mappings: FieldMapping[]): CleaningResult {
  const seen = new Set<string>();
  const cleanedRows: Array<Record<string, string>> = [];
  const removedRows: Array<{ row: Record<string, string>; reason: string }> = [];
  const fixedCells = new Set<string>();
  const required = mappings.filter((mapping) => ["Buyer ID", "Seller ID", "Order ID"].includes(mapping.target));
  let duplicatesRemoved = 0;
  let rowsFixed = 0;

  dataset.rows.forEach((row, rowIndex) => {
    const trimmed = Object.fromEntries(
      Object.entries(row).map(([key, value]) => {
        const nextValue = value.trim();
        if (nextValue !== value) fixedCells.add(`${rowIndex}:${key}`);
        return [key, nextValue];
      }),
    );
    const signature = JSON.stringify(trimmed);

    if (seen.has(signature)) {
      duplicatesRemoved += 1;
      removedRows.push({ row, reason: "Duplicate row" });
      return;
    }

    seen.add(signature);

    const missingRequired = required.some((mapping) => mapping.source && !trimmed[mapping.source]);
    if (missingRequired) {
      removedRows.push({ row, reason: "Required field missing" });
      return;
    }

    const normalized = { ...trimmed };
    for (const mapping of mappings) {
      if (!mapping.source) continue;
      const value = normalized[mapping.source];
      if (!value) continue;

      if (mapping.target.includes("ID")) {
        const nextValue = value.toLowerCase().replace(/\s+/g, "-");
        if (nextValue !== value) {
          normalized[mapping.source] = nextValue;
          fixedCells.add(`${rowIndex}:${mapping.source}`);
        }
      }

      if (mapping.target === "Timestamp") {
        const date = parseDate(value);
        if (date) {
          const nextValue = date.toISOString();
          if (nextValue !== value) {
            normalized[mapping.source] = nextValue;
            fixedCells.add(`${rowIndex}:${mapping.source}`);
          }
        }
      }
    }

    if ([...fixedCells].some((key) => key.startsWith(`${rowIndex}:`))) rowsFixed += 1;
    cleanedRows.push(normalized);
  });

  return {
    cleanedRows,
    removedRows,
    fixedCells,
    summary: {
      rowsImported: dataset.rows.length,
      duplicatesRemoved,
      rowsFixed,
      rowsRemoved: removedRows.length,
      rowsRemaining: cleanedRows.length,
    },
  };
}

export function rowsToCsv(headers: string[], rows: Array<Record<string, string>>) {
  const escape = (value: string) => {
    if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
    return value;
  };

  return [headers.join(","), ...rows.map((row) => headers.map((header) => escape(row[header] ?? "")).join(","))].join("\n");
}
