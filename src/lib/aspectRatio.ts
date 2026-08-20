const MAX_TERM = 20;

function gcd(a: number, b: number): number {
  let x = a;
  let y = b;
  while (y !== 0) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x;
}

/**
 * 根据实际宽高，动态计算最接近的「漂亮」宽高比（分子、分母都是较小的整数）。
 *
 * 不再依赖固定比例列表，而是在 1..MAX_TERM 内搜索误差最小的分数：
 * 例如 2264×1614（约 1.4:1）会得到 7:5，而不是固定列表里的 4:3。
 */
export function getClosestAspectRatio(width: number, height: number): string {
  if (!width || !height) return "—";

  const ratio = width / height;

  let bestNumerator = 1;
  let bestDenominator = 1;
  let bestError = Number.POSITIVE_INFINITY;

  for (let denominator = 1; denominator <= MAX_TERM; denominator++) {
    for (let numerator = 1; numerator <= MAX_TERM; numerator++) {
      const error = Math.abs(numerator / denominator - ratio) / ratio;
      if (error < bestError) {
        bestError = error;
        bestNumerator = numerator;
        bestDenominator = denominator;
      }
    }
  }

  const g = gcd(bestNumerator, bestDenominator);
  return `${bestNumerator / g}:${bestDenominator / g}`;
}
