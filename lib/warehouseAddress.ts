export const WAREHOUSE_PHONE = "15658275953";
export const CODE_PREFIX = "ZWQ05";
// The last code issued manually before this system took over — the sequence
// continues from here even if the sheet is still empty.
export const LAST_ISSUED_NUMBER = 2;

export interface WarehouseAddressRecord {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  code: string;
  fullAddress: string;
}

export function formatCode(n: number): string {
  return `${CODE_PREFIX}-${n}`;
}

export function parseCodeNumber(code: string): number | null {
  const match = code.trim().match(/^ZWQ05-(\d+)$/);
  return match ? Number(match[1]) : null;
}

export function formatAddress(firstName: string, lastName: string, code: string): string {
  return [
    `收件人：${firstName} ${lastName}`,
    `联系电话：${WAREHOUSE_PHONE}`,
    `地址：广东省东莞市虎门镇沙角光明二路2号2栋${code}转集运仓库`,
  ].join("\n");
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function normalizePhone(phone: string): string {
  return phone.replace(/[^\d]/g, "");
}
