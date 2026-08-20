import { useEffect, useState } from "react";

/**
 * 与 localStorage 同步的状态。
 * 首次挂载后再从 localStorage 读取，避免 SSR 与客户端水合不一致；
 * 之后每次变化都会写回 localStorage。
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(key);
      if (stored !== null) setValue(JSON.parse(stored) as T);
    } catch {
      // 忽略损坏的存储值或隐私模式下的读取异常
    }
    setHydrated(true);
  }, [key]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // 忽略写入异常（配额 / 隐私模式）
    }
  }, [key, value, hydrated]);

  return [value, setValue] as const;
}
