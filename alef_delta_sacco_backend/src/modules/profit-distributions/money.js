export function etbToCents(value) {
  const normalized = String(value ?? '0').trim();
  if (!/^-?\d+(?:\.\d{1,2})?$/.test(normalized)) throw new Error(`Invalid ETB amount: ${value}`);
  const negative = normalized.startsWith('-');
  const unsigned = negative ? normalized.slice(1) : normalized;
  const [whole, fraction = ''] = unsigned.split('.');
  const cents = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'));
  return negative ? -cents : cents;
}

export function centsToEtb(cents) {
  const value = BigInt(cents);
  const negative = value < 0n;
  const absolute = negative ? -value : value;
  return `${negative ? '-' : ''}${absolute / 100n}.${String(absolute % 100n).padStart(2, '0')}`;
}

export function addisAbabaDate(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Addis_Ababa', year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(date);
}

export function allocateLargestRemainder(totalCents, weightedIds) {
  const total = BigInt(totalCents);
  const weights = weightedIds.map((item) => ({ id: item.id, weight: BigInt(item.weight) }));
  const denominator = weights.reduce((sum, item) => sum + item.weight, 0n);
  if (denominator <= 0n) throw new Error('Allocation denominator must be greater than zero');

  const rows = weights.map((item) => {
    const numerator = total * item.weight;
    return { id: item.id, amount: numerator / denominator, remainder: numerator % denominator };
  });
  let remaining = total - rows.reduce((sum, item) => sum + item.amount, 0n);
  rows.sort((a, b) => {
    if (a.remainder === b.remainder) return String(a.id).localeCompare(String(b.id));
    return a.remainder > b.remainder ? -1 : 1;
  });
  for (let index = 0; remaining > 0n; index = (index + 1) % rows.length) {
    rows[index].amount += 1n;
    remaining -= 1n;
  }
  return new Map(rows.map((item) => [item.id, item.amount]));
}
