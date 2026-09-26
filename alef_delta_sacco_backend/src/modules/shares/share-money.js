export const SHARE_UNIT_SCALE = 100000000n;

export function decimalToScaled(value, scaleDigits, label = 'value') {
  const normalized = String(value ?? '').trim();
  const pattern = new RegExp(`^\\d+(?:\\.\\d{1,${scaleDigits}})?$`);
  if (!pattern.test(normalized)) throw new Error(`Invalid ${label}: ${value}`);
  const [whole, fraction = ''] = normalized.split('.');
  const scale = 10n ** BigInt(scaleDigits);
  return BigInt(whole) * scale + BigInt(fraction.padEnd(scaleDigits, '0'));
}

export function scaledToDecimal(value, scaleDigits) {
  const numeric = BigInt(value);
  const negative = numeric < 0n;
  const absolute = negative ? -numeric : numeric;
  const scale = 10n ** BigInt(scaleDigits);
  return `${negative ? '-' : ''}${absolute / scale}.${String(absolute % scale).padStart(scaleDigits, '0')}`;
}

export function etbToCents(value) {
  return decimalToScaled(value, 2, 'ETB amount');
}

export function centsToEtb(value) {
  return scaledToDecimal(value, 2);
}

export function unitsToMicros(value) {
  return decimalToScaled(value, 8, 'share units');
}

export function microsToUnits(value) {
  return scaledToDecimal(value, 8);
}

export function divideHalfUp(numerator, denominator) {
  const divisor = BigInt(denominator);
  if (divisor <= 0n) throw new Error('Division denominator must be greater than zero');
  const value = BigInt(numerator);
  const quotient = value / divisor;
  const remainder = value % divisor;
  return remainder * 2n >= divisor ? quotient + 1n : quotient;
}

export function calculatePurchaseUnits(amountCents, priceCents) {
  return divideHalfUp(BigInt(amountCents) * SHARE_UNIT_SCALE, priceCents);
}

