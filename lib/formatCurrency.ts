const kesFormatter = new Intl.NumberFormat('en-KE', {
  style: 'currency',
  currency: 'KES',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Kenyan Shilling (KES) display for cash amounts. */
export function formatKes(amount: number): string {
  return kesFormatter.format(amount);
}
