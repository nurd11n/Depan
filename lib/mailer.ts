import nodemailer from "nodemailer";
import en from "@/messages/en.json";
import ru from "@/messages/ru.json";
import type { QuoteInput } from "./schemas";

export class MailerError extends Error {}

interface SendArgs {
  to: string;
  subject: string;
  text: string;
  attachments?: { filename: string; content: string }[];
}

// Created once and reused (with connection pooling) instead of opening a
// fresh SMTP connection on every single send — cuts the Gmail handshake off
// the critical path for every quote/warehouse-address request.
let cachedTransporter: nodemailer.Transporter | null = null;

function getTransporter(user: string, pass: string) {
  if (cachedTransporter) return cachedTransporter;
  cachedTransporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
    pool: true,
    maxConnections: 3,
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
    await transporter.sendMail({
      from: `DAPAN GLOBAL <${user}>`,
      to,
      subject,
      text,
      attachments,
    });
  } catch (err) {
    console.error("[mailer] send failed", err);
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
  return [
    input.fullAddress,
    "",
    "──────────",
    "",
    `EN — ${en.address.guideTitle}`,
    `1. ${en.address.guideStep1}`,
    `2. ${en.address.guideStep2}`,
    `3. ${en.address.guideStep3}`,
    "",
    `RU — ${ru.address.guideTitle}`,
    `1. ${ru.address.guideStep1}`,
    `2. ${ru.address.guideStep2}`,
    `3. ${ru.address.guideStep3}`,
    "",
    "— DAPAN GLOBAL LLC",
  ].join("\n");
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
