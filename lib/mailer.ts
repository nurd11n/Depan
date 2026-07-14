import nodemailer from "nodemailer";
import en from "@/messages/en.json";
import ru from "@/messages/ru.json";
import es from "@/messages/es.json";
import uk from "@/messages/uk.json";
import { routing } from "@/i18n/routing";
import type { QuoteInput } from "./schemas";

// Keyed by locale so the warehouse-address guide below can loop over every
// supported language instead of hardcoding which ones exist — adding a new
// locale to i18n/routing.ts is then enough, no change needed here.
const MESSAGES_BY_LOCALE: Record<string, typeof en> = { en, ru, es, uk };

export class MailerError extends Error {}

interface SendArgs {
  to: string;
  subject: string;
  text: string;
  attachments?: { filename: string; content: string }[];
}

// Cached config object (not a persistent connection). We deliberately do NOT
// use `pool: true` here: pooling keeps long-lived SMTP sockets open, and in a
// long-running container Gmail silently drops idle connections — so a
// sporadic send (like a warehouse-address email) can land on a stale socket
// and fail in prod while working in short-lived local dev. Explicit timeouts
// make any connection problem fail fast and land in the logs instead of
// hanging the request.
let cachedTransporter: nodemailer.Transporter | null = null;

function getTransporter(user: string, pass: string) {
  if (cachedTransporter) return cachedTransporter;
  cachedTransporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
  });
  return cachedTransporter;
}

async function deliverEmail({ to, subject, text, attachments }: SendArgs): Promise<void> {
  const user = process.env.GMAIL_USER?.trim();
  // Google's UI displays app passwords space-separated in groups of 4 for
  // readability; the actual secret has no spaces, so strip them defensively
  // in case they were copy-pasted verbatim.
  const pass = process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, "");

  if (!user || !pass) {
    console.warn(
      `[mailer] GMAIL_USER / GMAIL_APP_PASSWORD not set — logging email instead (to: ${to}, subject: ${subject}):\n` +
        text,
    );
    return;
  }

  const transporter = getTransporter(user, pass);

  try {
    const info = await transporter.sendMail({
      from: `DAPAN GLOBAL <${user}>`,
      to,
      subject,
      text,
      attachments,
    });
    // Log the SMTP result so the server logs show whether Gmail actually
    // ACCEPTED the recipient. accepted=[recipient] means the mail was handed
    // off successfully and any non-arrival is a downstream deliverability /
    // spam-filter / DNS (SPF/DKIM) issue, not a send failure.
    console.log(
      `[mailer] sent to=${to} subject="${subject}" messageId=${info.messageId} ` +
        `accepted=${JSON.stringify(info.accepted)} rejected=${JSON.stringify(info.rejected)} ` +
        `response=${JSON.stringify(info.response)}`,
    );
  } catch (err) {
    console.error(`[mailer] send FAILED to=${to} subject="${subject}"`, err);
    throw new MailerError("Could not send email.");
  }
}

export interface WarehouseAddressEmailInput {
  to: string;
  firstName: string;
  lastName: string;
  code: string;
  fullAddress: string;
}

function buildWarehouseAddressBody(input: WarehouseAddressEmailInput): string {
  const guideBlocks = routing.locales.flatMap((locale) => {
    const msgs = MESSAGES_BY_LOCALE[locale];
    if (!msgs) return [];
    return [
      "",
      `${locale.toUpperCase()} — ${msgs.address.guideTitle}`,
      `1. ${msgs.address.guideStep1}`,
      `2. ${msgs.address.guideStep2}`,
      `3. ${msgs.address.guideStep3}`,
    ];
  });

  return [input.fullAddress, "", "──────────", ...guideBlocks, "", "— DAPAN GLOBAL LLC"].join("\n");
}

export async function sendWarehouseAddressEmail(input: WarehouseAddressEmailInput): Promise<void> {
  await deliverEmail({
    to: input.to,
    subject: `Your China Warehouse Address — ${input.code}`,
    text: buildWarehouseAddressBody(input),
  });
}

function buildQuoteLeadBody(data: QuoteInput): string {
  if (data.type === "cargo") {
    return [
      "New cargo quote request",
      `Name: ${data.name}`,
      `Contact: ${data.contact}`,
      `Email: ${data.email}`,
      `Weight: ${data.weightKg} kg`,
      `Cargo type: ${data.cargoType}`,
      `Shipping preference: ${data.shippingPref}`,
      `Description: ${data.description}`,
    ].join("\n");
  }

  return [
    "New sourcing quote request",
    `Name: ${data.name}`,
    `Contact: ${data.contact}`,
    `Email: ${data.email}`,
    `Product: ${data.product}`,
    data.targetPricePerUnit ? `Target price/unit: $${data.targetPricePerUnit}` : null,
    `Quantity: ${data.quantity}`,
    data.notes ? `Notes: ${data.notes}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

export async function sendQuoteLeadEmail(data: QuoteInput): Promise<void> {
  const to = process.env.LEADS_EMAIL || process.env.GMAIL_USER;
  if (!to) {
    console.warn(
      "[mailer] No LEADS_EMAIL / GMAIL_USER configured — logging lead instead:\n" +
        buildQuoteLeadBody(data),
    );
    return;
  }

  await deliverEmail({
    to,
    subject: data.type === "cargo" ? "New cargo quote request" : "New sourcing quote request",
    text: buildQuoteLeadBody(data),
  });
}

export async function sendDailyWarehouseCsvReport(csvContent: string): Promise<void> {
  const to = process.env.LEADS_EMAIL || process.env.GMAIL_USER;
  const dateLabel = new Date().toISOString().slice(0, 10);

  if (!to) {
    console.warn(
      `[mailer] No LEADS_EMAIL / GMAIL_USER configured — skipping daily CSV report for ${dateLabel}.`,
    );
    return;
  }

  await deliverEmail({
    to,
    subject: `Warehouse Address Report — ${dateLabel}`,
    text: `Attached: the full warehouse address CSV as of ${dateLabel}.`,
    attachments: [{ filename: `warehouse-addresses-${dateLabel}.csv`, content: csvContent }],
  });
}
