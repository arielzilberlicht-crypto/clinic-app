// Israeli ID (ת.ז.) checksum validation and display masking.
// Weights alternate 1,2,1,2...; two-digit products have their digits summed
// (equivalent to subtracting 9 for any product above 9); valid when the
// total is divisible by 10.
function isValidIsraeliId(id) {
  const digits = String(id || '').trim();
  if (!/^\d{5,9}$/.test(digits)) return false;

  const padded = digits.padStart(9, '0');
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let value = Number(padded[i]) * ((i % 2) + 1);
    if (value > 9) value -= 9;
    sum += value;
  }
  return sum % 10 === 0;
}

// Masks all but the last 3 digits, e.g. "123456782" -> "••••••782".
function maskIsraeliId(id) {
  const digits = String(id || '').replace(/\D/g, '');
  if (!digits) return '';
  const visible = digits.slice(-3);
  const hiddenCount = Math.max(digits.length - 3, 0);
  return '•'.repeat(hiddenCount) + visible;
}

module.exports = { isValidIsraeliId, maskIsraeliId };
