/**
 * تنسيق المبالغ المالية بالجنيه المصري (EGP)
 */
export function formatEGP(amount: number): string {
  if (!Number.isFinite(amount)) {
    return "0.00 ج.م";
  }

  return new Intl.NumberFormat("ar-EG", {
    style: "currency",
    currency: "EGP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}