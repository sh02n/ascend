import { isIP } from "node:net";
import type { ConsumerProduct } from "../types/index.js";

interface JsonLdRecord {
  [key: string]: unknown;
}

const REQUEST_TIMEOUT_MS = 5_000;
const ALLOWED_MARKETPLACES = new Set(["amazon", "shopee", "lazada", "ebay", "etsy"]);

function normalizeWhitespace(value: string | null | undefined) {
  return value?.replace(/\s+/g, " ").trim() || null;
}

function decodeHtml(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function toNullableNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.replace(/[^0-9.,-]/g, "").replace(/,/g, "");
  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : null;
}

function toNullableInteger(value: unknown) {
  const numericValue = toNullableNumber(value);

  return numericValue === null ? null : Math.round(numericValue);
}

function hostnameToMarketplace(hostname: string) {
  if (hostname.includes("amazon.")) {
    return "Amazon";
  }

  if (hostname.includes("shopee.")) {
    return "Shopee";
  }

  if (hostname.includes("lazada.")) {
    return "Lazada";
  }

  const domain = hostname.replace(/^www\./, "");

  return domain
    .split(".")
    .slice(0, 2)
    .join(".")
    .replace(/(^\w|-\w)/g, (match) => match.replace("-", " ").toUpperCase());
}

function isPrivateIp(hostname: string) {
  const version = isIP(hostname);

  if (version === 0) {
    return false;
  }

  if (version === 6) {
    return hostname === "::1" || hostname.toLowerCase().startsWith("fc") || hostname.toLowerCase().startsWith("fd");
  }

  const [first = 0, second = 0] = hostname.split(".").map((part) => Number.parseInt(part, 10));

  return (
    first === 10 ||
    first === 127 ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168)
  );
}

function allowedMarketplaceHost(hostname: string) {
  const labels = hostname.toLowerCase().replace(/\.$/, "").split(".");
  const brandIndex = labels.findIndex((label) => ALLOWED_MARKETPLACES.has(label));

  if (brandIndex === -1) {
    return false;
  }

  return brandIndex === labels.length - 2 || brandIndex === labels.length - 3;
}

export function assertSupportedProductUrl(productUrl: string) {
  let url: URL;

  try {
    url = new URL(productUrl);
  } catch {
    throw Object.assign(new Error("Enter a valid product URL."), { statusCode: 400 });
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw Object.assign(new Error("Only http and https product URLs are supported."), { statusCode: 400 });
  }

  const hostname = url.hostname.toLowerCase();

  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname === "metadata.google.internal" ||
    hostname.endsWith(".internal") ||
    isPrivateIp(hostname)
  ) {
    throw Object.assign(new Error("Internal or private product URLs are not allowed."), { statusCode: 400 });
  }

  if (!allowedMarketplaceHost(hostname)) {
    throw Object.assign(
      new Error("Supported marketplaces are Amazon, Shopee, Lazada, eBay, and Etsy."),
      { statusCode: 400 },
    );
  }
}

function slugToTitle(slug: string) {
  return normalizeWhitespace(
    decodeURIComponent(slug)
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, (character) => character.toUpperCase()),
  );
}

function guessBrandFromTitle(title: string | null) {
  if (!title) {
    return null;
  }

  const [firstWord] = title.split(" ");

  return firstWord && firstWord.length > 2 ? firstWord : null;
}

function extractMetaContent(html: string, key: string) {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${key}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${key}["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+name=["']${key}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${key}["'][^>]*>`, "i"),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);

    if (match?.[1]) {
      return normalizeWhitespace(decodeHtml(match[1]));
    }
  }

  return null;
}

function extractTitleFromHtml(html: string) {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);

  return normalizeWhitespace(decodeHtml(match?.[1]));
}

function extractJsonLdBlocks(html: string) {
  const blocks = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi) ?? [];

  return blocks
    .map((block) => block.replace(/<script[^>]*>/i, "").replace(/<\/script>/i, "").trim())
    .flatMap((block) => {
      try {
        const parsed = JSON.parse(block) as unknown;
        return [parsed];
      } catch {
        return [];
      }
    });
}

function findProductNode(value: unknown): JsonLdRecord | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const productNode = findProductNode(item);

      if (productNode) {
        return productNode;
      }
    }

    return null;
  }

  const record = value as JsonLdRecord;
  const recordType = record["@type"];

  if (
    recordType === "Product" ||
    (Array.isArray(recordType) && recordType.some((item) => item === "Product"))
  ) {
    return record;
  }

  if (record["@graph"]) {
    return findProductNode(record["@graph"]);
  }

  for (const nestedValue of Object.values(record)) {
    const productNode = findProductNode(nestedValue);

    if (productNode) {
      return productNode;
    }
  }

  return null;
}

function extractTextValue(value: unknown): string | null {
  if (typeof value === "string") {
    return normalizeWhitespace(decodeHtml(value));
  }

  if (value && typeof value === "object") {
    const record = value as JsonLdRecord;

    if (typeof record.name === "string") {
      return normalizeWhitespace(decodeHtml(record.name));
    }
  }

  return null;
}

function buildProductFromUrl(productUrl: string): ConsumerProduct {
  const url = new URL(productUrl);
  const marketplace = hostnameToMarketplace(url.hostname);
  const pathParts = url.pathname.split("/").filter(Boolean);
  let title: string | null = null;

  if (url.hostname.includes("amazon.")) {
    const dpIndex = pathParts.findIndex((segment) => segment === "dp");
    title = dpIndex > 0 ? slugToTitle(pathParts[dpIndex - 1]) : slugToTitle(pathParts[0] ?? "");
  } else if (url.hostname.includes("shopee.")) {
    const slugMatch = url.pathname.match(/\/([^/]+)-i\.\d+\.\d+/i);
    title = slugToTitle(slugMatch?.[1] ?? pathParts.at(-1) ?? "");
  } else if (url.hostname.includes("lazada.")) {
    const lazadaSlugMatch = url.pathname.match(/\/products\/([^/]+)-i\d+/i);
    title = slugToTitle(lazadaSlugMatch?.[1] ?? pathParts.at(-1) ?? "");
  } else {
    title = slugToTitle(pathParts.at(-1) ?? url.hostname.replace(/^www\./, ""));
  }

  return {
    url: productUrl,
    marketplace,
    title,
    brand: guessBrandFromTitle(title),
    seller: null,
    rating: null,
    reviewCount: null,
    price: toNullableNumber(url.searchParams.get("price")),
    currency: url.searchParams.get("currency"),
    imageUrl: null,
  };
}

async function fetchHtml(productUrl: string) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(productUrl, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      return null;
    }

    const contentType = response.headers.get("content-type") ?? "";

    if (!contentType.includes("text/html")) {
      return null;
    }

    return response.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

function mergeProduct(base: ConsumerProduct, partial: Partial<ConsumerProduct>): ConsumerProduct {
  return {
    ...base,
    ...Object.fromEntries(
      Object.entries(partial).filter(([, value]) => value !== undefined),
    ),
  };
}

function extractProductFromHtml(baseProduct: ConsumerProduct, html: string): ConsumerProduct {
  const jsonLdProduct = extractJsonLdBlocks(html).map(findProductNode).find(Boolean) ?? null;
  const offers = (jsonLdProduct?.offers ?? null) as JsonLdRecord | JsonLdRecord[] | null;
  const firstOffer = Array.isArray(offers) ? offers[0] : offers;
  const aggregateRating = (jsonLdProduct?.aggregateRating ?? null) as JsonLdRecord | null;
  const pageTitle = extractTitleFromHtml(html);
  const openGraphTitle = extractMetaContent(html, "og:title");
  const imageUrl = extractMetaContent(html, "og:image");
  const rawTitle = extractTextValue(jsonLdProduct?.name) ?? openGraphTitle ?? pageTitle;
  const cleanedTitle = rawTitle?.split("|")[0]?.split(" - ")[0]?.trim() ?? null;
  const metaPrice =
    extractMetaContent(html, "product:price:amount") ??
    extractMetaContent(html, "og:price:amount") ??
    extractMetaContent(html, "twitter:data1");

  return mergeProduct(baseProduct, {
    title: cleanedTitle || baseProduct.title,
    brand:
      extractTextValue(jsonLdProduct?.brand) ??
      extractMetaContent(html, "product:brand") ??
      baseProduct.brand,
    seller:
      extractTextValue(firstOffer?.seller) ??
      extractMetaContent(html, "og:merchant") ??
      extractMetaContent(html, "author") ??
      baseProduct.seller,
    rating: toNullableNumber(aggregateRating?.ratingValue) ?? baseProduct.rating,
    reviewCount: toNullableInteger(aggregateRating?.reviewCount) ?? baseProduct.reviewCount,
    price: toNullableNumber(firstOffer?.price) ?? toNullableNumber(metaPrice) ?? baseProduct.price,
    currency:
      extractTextValue(firstOffer?.priceCurrency) ??
      extractMetaContent(html, "product:price:currency") ??
      baseProduct.currency,
    imageUrl,
  });
}

export async function parseConsumerProduct(productUrl: string): Promise<ConsumerProduct> {
  assertSupportedProductUrl(productUrl);
  const baseProduct = buildProductFromUrl(productUrl);
  const html = await fetchHtml(productUrl);

  if (!html) {
    return baseProduct;
  }

  return extractProductFromHtml(baseProduct, html);
}
