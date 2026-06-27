import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

function createHttpError(statusCode: number, message: string) {
  return Object.assign(new Error(message), { statusCode });
}

function isPrivateIpAddress(hostname: string) {
  const version = isIP(hostname);

  if (version === 0) {
    return false;
  }

  if (version === 6) {
    const normalized = hostname.toLowerCase();
    return normalized === "::1" || normalized.startsWith("fc") || normalized.startsWith("fd") || normalized.startsWith("fe80");
  }

  const [first = 0, second = 0] = hostname.split(".").map((part) => Number.parseInt(part, 10));

  return (
    first === 0 ||
    first === 10 ||
    first === 127 ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168)
  );
}

function isInternalHostname(hostname: string) {
  const normalized = hostname.toLowerCase().replace(/\.$/, "");

  return (
    normalized === "localhost" ||
    normalized.endsWith(".localhost") ||
    normalized.endsWith(".local") ||
    normalized.endsWith(".internal") ||
    normalized === "metadata.google.internal"
  );
}

export async function validatePublicConsumerUrl(rawUrl: string) {
  let url: URL;

  try {
    url = new URL(rawUrl);
  } catch {
    throw createHttpError(400, "Enter a valid URL.");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw createHttpError(400, "Only http and https URLs are supported.");
  }

  if (isInternalHostname(url.hostname) || isPrivateIpAddress(url.hostname)) {
    throw createHttpError(400, "Internal, localhost, or private network URLs are not allowed.");
  }

  try {
    const addresses = await lookup(url.hostname, { all: true, verbatim: true });
    if (addresses.some((address) => isPrivateIpAddress(address.address))) {
      throw createHttpError(400, "This URL resolves to a private network address and cannot be scanned.");
    }
  } catch (error) {
    if (error instanceof Error && "statusCode" in error) {
      throw error;
    }
  }

  return url;
}
