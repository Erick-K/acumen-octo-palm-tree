export const KRA_PIN_REGEX = /^[A-Z]\d{9}[A-Z]$/;

export function normalizeKraPin(value?: string) {
  return (value || '').trim().toUpperCase();
}

export function isValidKraPin(value?: string) {
  const normalized = normalizeKraPin(value);
  return !normalized || KRA_PIN_REGEX.test(normalized);
}

export function clientHasNoPin(client: { companyPin?: string; pinNotAvailable?: boolean }) {
  return Boolean(client.pinNotAvailable) || !normalizeKraPin(client.companyPin);
}
