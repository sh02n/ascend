import { createReadStream } from "node:fs";
import {
  type Buyer,
  type DatasetRecord,
  type NormalizedDataset,
  type Review,
} from "../types/DatasetRecord.js";

const EXPECTED_HEADERS = [
  "Reviewer Name",
  "Profile Link",
  "Country",
  "Review Count",
  "Review Date",
  "Rating",
  "Review Title",
  "Review Text",
  "Date of Experience",
] as const;

interface RawCSVRow {
  [columnName: string]: string | undefined;
}

const MAX_WARNING_LOGS = 25;
let warningCount = 0;
let warningSuppressed = false;

function logWarning(message: string) {
  warningCount += 1;

  if (warningCount <= MAX_WARNING_LOGS) {
    void message;
    return;
  }

  if (!warningSuppressed) {
    warningSuppressed = true;
  }
}

function sanitizeValue(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : null;
}

function parseReviewCount(value: string | null) {
  if (!value) {
    return null;
  }

  const match = value.match(/\d+/);
  return match ? Number.parseInt(match[0], 10) : null;
}

function parseRatingValue(value: string | null) {
  if (!value) {
    return null;
  }

  const match = value.match(/Rated\s+(\d+)\s+out\s+of\s+5/i);
  return match ? Number.parseInt(match[1], 10) : null;
}

function parseISODate(value: string | null) {
  if (!value) {
    return null;
  }

  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? null : new Date(timestamp).toISOString();
}

function parseExperienceDate(value: string | null) {
  if (!value) {
    return null;
  }

  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? null : new Date(timestamp).toISOString().slice(0, 10);
}

function createStableId(prefix: string, rowNumber: number, seed: string | null) {
  const safeSeed = (seed ?? `${prefix}-${rowNumber}`)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);

  return safeSeed.length > 0 ? `${prefix}-${safeSeed}` : `${prefix}-${rowNumber}`;
}

function normalizeRecord(row: RawCSVRow, rowNumber: number): DatasetRecord {
  const reviewerName = sanitizeValue(row["Reviewer Name"]);
  const profileLink = sanitizeValue(row["Profile Link"]);
  const countryCode = sanitizeValue(row["Country"]);
  const reviewCount = parseReviewCount(sanitizeValue(row["Review Count"]));
  const reviewDate = parseISODate(sanitizeValue(row["Review Date"]));
  const ratingValue = parseRatingValue(sanitizeValue(row["Rating"]));
  const reviewTitle = sanitizeValue(row["Review Title"]);
  const reviewText = sanitizeValue(row["Review Text"]);
  const experienceDate = parseExperienceDate(sanitizeValue(row["Date of Experience"]));

  return {
    rowNumber,
    sourceRecordId: createStableId("record", rowNumber, profileLink ?? reviewerName),
    reviewerName,
    profileLink,
    countryCode,
    reviewCount,
    reviewDate,
    ratingValue,
    reviewTitle,
    reviewText,
    experienceDate,
  };
}

function recordToBuyer(record: DatasetRecord): Buyer | null {
  const identitySeed = record.profileLink ?? record.reviewerName;

  if (!identitySeed || !record.reviewerName) {
    return null;
  }

  const buyerId = createStableId("buyer", record.rowNumber, identitySeed);

  return {
    id: buyerId,
    externalId: buyerId,
    displayName: record.reviewerName,
    profileLink: record.profileLink,
    countryCode: record.countryCode,
    reviewCount: record.reviewCount,
    sourceRowNumbers: [record.rowNumber],
  };
}

function recordToReview(record: DatasetRecord, buyerId: string | null): Review {
  const reviewId = createStableId(
    "review",
    record.rowNumber,
    `${record.sourceRecordId}-${record.reviewDate ?? "no-date"}`,
  );

  return {
    id: reviewId,
    externalId: reviewId,
    buyerId,
    sellerId: null,
    ratingValue: record.ratingValue,
    title: record.reviewTitle,
    body: record.reviewText,
    reviewDate: record.reviewDate,
    experienceDate: record.experienceDate,
    countryCode: record.countryCode,
  };
}

async function* parseCSVRows(csvPath: string): AsyncGenerator<string[]> {
  const stream = createReadStream(csvPath, { encoding: "utf-8" });
  let currentField = "";
  let currentRow: string[] = [];
  let inQuotes = false;
  let isFirstCharacter = true;

  for await (const chunk of stream) {
    const text = isFirstCharacter ? chunk.replace(/^\uFEFF/, "") : chunk;
    isFirstCharacter = false;

    for (let index = 0; index < text.length; index += 1) {
      const character = text[index];
      const nextCharacter = text[index + 1];

      if (character === "\"") {
        if (inQuotes && nextCharacter === "\"") {
          currentField += "\"";
          index += 1;
        } else {
          inQuotes = !inQuotes;
        }

        continue;
      }

      if (!inQuotes && character === ",") {
        currentRow.push(currentField);
        currentField = "";
        continue;
      }

      if (!inQuotes && (character === "\n" || character === "\r")) {
        if (character === "\r" && nextCharacter === "\n") {
          index += 1;
        }

        currentRow.push(currentField);
        currentField = "";

        const completedRow = currentRow;
        currentRow = [];

        if (completedRow.length > 1 || completedRow[0] !== "") {
          yield completedRow;
        }

        continue;
      }

      currentField += character;
    }
  }

  if (inQuotes) {
    logWarning("Reached end of CSV with an open quoted field. Final row was still emitted.");
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField);
    yield currentRow;
  }
}

function mapRowToObject(headers: string[], values: string[], rowNumber: number): RawCSVRow {
  const normalizedValues = values.slice(0, headers.length);

  if (values.length < headers.length) {
    logWarning(
      `Row ${rowNumber} has ${values.length} columns but ${headers.length} headers. Missing values were padded.`,
    );

    while (normalizedValues.length < headers.length) {
      normalizedValues.push("");
    }
  }

  if (values.length > headers.length) {
    logWarning(
      `Row ${rowNumber} has ${values.length} columns but ${headers.length} headers. Extra values were truncated.`,
    );
  }

  return headers.reduce<RawCSVRow>((accumulator, header, headerIndex) => {
    accumulator[header] = normalizedValues[headerIndex];
    return accumulator;
  }, {});
}

export async function loadCSV(csvPath: string): Promise<NormalizedDataset> {
  warningCount = 0;
  warningSuppressed = false;

  const buyersById = new Map<string, Buyer>();
  const reviews: Review[] = [];

  let headers: string[] | null = null;
  let currentRowNumber = 0;

  for await (const row of parseCSVRows(csvPath)) {
    currentRowNumber += 1;

    if (!headers) {
      headers = row;

      for (const expectedHeader of EXPECTED_HEADERS) {
        if (!headers.includes(expectedHeader)) {
          logWarning(`Missing expected header "${expectedHeader}" in CSV source.`);
        }
      }

      continue;
    }

    const rawRow = mapRowToObject(headers, row, currentRowNumber);
    const record = normalizeRecord(rawRow, currentRowNumber);

    if (!record.reviewerName && !record.profileLink && !record.reviewText) {
      logWarning(`Skipped row ${currentRowNumber} because it did not contain enough review identity data.`);
      continue;
    }

    const buyer = recordToBuyer(record);

    if (!buyer) {
      logWarning(`Row ${currentRowNumber} could not be normalized into a buyer entity.`);
    } else if (buyersById.has(buyer.id)) {
      const existingBuyer = buyersById.get(buyer.id);

      if (existingBuyer) {
        existingBuyer.sourceRowNumbers.push(record.rowNumber);
        existingBuyer.reviewCount = existingBuyer.reviewCount ?? buyer.reviewCount;
        existingBuyer.countryCode = existingBuyer.countryCode ?? buyer.countryCode;
      }
    } else {
      buyersById.set(buyer.id, buyer);
    }

    const review = recordToReview(record, buyer?.id ?? null);
    reviews.push(review);
  }

  const buyers = [...buyersById.values()];

  return {
    buyers,
    sellers: [],
    orders: [],
    reviews,
    refunds: [],
    paymentMethods: [],
    devices: [],
    ipAddresses: [],
    graph: {
      nodes: [],
      edges: [],
    },
  };
}
