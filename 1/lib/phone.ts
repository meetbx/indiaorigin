export function normalizePhone(phone: unknown): string {
  if (typeof phone !== "string") return "";
  const trimmed = phone.trim();
  const match = trimmed.match(/^(?:\+?91|0)?([6-9]\d{9})$/);
  if (!match) return "";
  return match[1];
}

export function isValidIndianPhone(phone: unknown): boolean {
  return normalizePhone(phone).length === 10;
}

export function toInternationalPhone(phone: string): string {
  const normalized = normalizePhone(phone);
  if (!normalized) throw new Error("Invalid phone number format.");
  return `91${normalized}`;
}