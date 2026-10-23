/**
 * Formats a number into Iraqi Dinar currency string.
 * Example: 25000 -> "25,000 د.ع"
 */
export function formatPrice(price: number): string {
  if (typeof price !== "number" || isNaN(price) || price < 0) {
    return "0 د.ع";
  }
  const formatted = Math.round(price).toLocaleString("en-US");
  return `${formatted} د.ع`;
}
