import { existsSync } from "node:fs";
import { mkdir, readFile, appendFile } from "node:fs/promises";
import path from "node:path";
import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";
import {
  formatAddress,
  formatCode,
  LAST_ISSUED_NUMBER,
  normalizeEmail,
  normalizePhone,
  parseCodeNumber,
  type WarehouseAddressRecord,
} from "./warehouseAddress";

export class CsvStoreError extends Error {}

const HEADER = ["firstName", "lastName", "phone", "email", "code", "fullAddress", "createdAt"];

// Resolved to an absolute path immediately: CSV_FILE_PATH is easy to
// mistype as a relative path (e.g. accidentally re-including the project
// folder name), which silently writes to an unexpected nested directory
// instead of failing loudly. Logging the resolved path at startup
// (instrumentation.ts) makes that mistake obvious instead of looking like
// "nothing is being saved."
export const CSV_PATH = path.resolve(
  /* turbopackIgnore: true */ process.env.CSV_FILE_PATH ||
    path.join(/* turbopackIgnore: true */ process.cwd(), "data", "warehouse-addresses.csv"),
);

// Cached in memory after the first read so repeat requests (dedupe lookups,
// numbering) skip disk I/O + CSV parsing entirely. Safe because every write
// goes through appendRow below, which updates this same cache in place —
// there is no other writer in this single-container deployment.
let cachedRows: WarehouseAddressRecord[] | null = null;

async function readRowsFromDisk(): Promise<WarehouseAddressRecord[]> {
  if (!existsSync(/* turbopackIgnore: true */ CSV_PATH)) return [];

  let content: string;
  try {
    content = await readFile(/* turbopackIgnore: true */ CSV_PATH, "utf8");
  } catch (err) {
    console.error(`[csvStore] read failed for ${CSV_PATH}`, err);
    throw new CsvStoreError("Could not read the warehouse address CSV file.");
  }

  if (!content.trim()) return [];

  try {
    return parse(content, { columns: HEADER, skip_empty_lines: true, from_line: 2 });
  } catch {
    throw new CsvStoreError("Could not parse the warehouse address CSV file.");
  }
}

async function getRows(): Promise<WarehouseAddressRecord[]> {
  if (!cachedRows) {
    cachedRows = await readRowsFromDisk();
  }
  return cachedRows;
}

async function appendRow(record: WarehouseAddressRecord & { createdAt: string }): Promise<void> {
  try {
    await mkdir(/* turbopackIgnore: true */ path.dirname(CSV_PATH), { recursive: true });

    const needsHeader = !existsSync(/* turbopackIgnore: true */ CSV_PATH);
    const line = stringify([record], { header: false, columns: HEADER });
    const chunk = needsHeader ? stringify([HEADER]) + line : line;

    await appendFile(/* turbopackIgnore: true */ CSV_PATH, chunk, "utf8");
    cachedRows = [...(cachedRows ?? []), record];
  } catch (err) {
    console.error(`[csvStore] append failed for ${CSV_PATH}`, err);
    throw new CsvStoreError("Could not save the new warehouse address.");
  }
}

// Serializes calls within this process so a "read max code, then append" pair
// can't interleave between two concurrent requests and hand out the same
// number. This only guards a single Node process/container — it is not a
// distributed lock — which matches how this app is deployed (one container).
let lock: Promise<unknown> = Promise.resolve();
function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = lock.then(fn, fn);
  lock = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export interface AssignAddressInput {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
}

export interface AssignAddressResult {
  code: string;
  fullAddress: string;
  isExisting: boolean;
}

export async function assignWarehouseAddress(
  input: AssignAddressInput,
): Promise<AssignAddressResult> {
  return withLock(async () => {
    const rows = await getRows();

    const targetEmail = normalizeEmail(input.email);
    const targetPhone = normalizePhone(input.phone);

    const existing = rows.find((row) => {
      const rowEmail = normalizeEmail(row.email ?? "");
      const rowPhone = normalizePhone(row.phone ?? "");
      return (rowEmail && rowEmail === targetEmail) || (rowPhone && rowPhone === targetPhone);
    });

    if (existing) {
      return { code: existing.code, fullAddress: existing.fullAddress, isExisting: true };
    }

    const maxExisting = rows.reduce((max, row) => {
      const n = parseCodeNumber(row.code ?? "");
      return n !== null && n > max ? n : max;
    }, LAST_ISSUED_NUMBER);

    const code = formatCode(maxExisting + 1);
    const fullAddress = formatAddress(input.firstName, input.lastName, code);

    await appendRow({
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      email: input.email,
      code,
      fullAddress,
      createdAt: new Date().toISOString(),
    });

    return { code, fullAddress, isExisting: false };
  });
}
