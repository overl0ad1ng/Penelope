export function clamp(value: number, max: number, min: number): number {
  if (max <= min) {
    throw new Error("clamp: max 必须大于 min");
  }

  if (value > max) return max;
  if (value < min) return min;
  return value;
}
