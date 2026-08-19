import type { CSSProperties } from "react";
import Image from "next/image";

type Dust = {
  left: string;
  duration: number;
  delay: number;
  size: number;
  opacity: number;
};

const DUST: Dust[] = [
  { left: "8%", duration: 26, delay: 0, size: 2, opacity: 0.25 },
  { left: "18%", duration: 32, delay: 6, size: 1, opacity: 0.18 },
  { left: "27%", duration: 24, delay: 3, size: 2, opacity: 0.2 },
  { left: "38%", duration: 30, delay: 9, size: 1, opacity: 0.22 },
  { left: "52%", duration: 25, delay: 2, size: 2, opacity: 0.18 },
  { left: "63%", duration: 33, delay: 11, size: 1, opacity: 0.2 },
  { left: "74%", duration: 27, delay: 5, size: 2, opacity: 0.22 },
  { left: "86%", duration: 29, delay: 8, size: 1, opacity: 0.18 },
  { left: "93%", duration: 23, delay: 13, size: 2, opacity: 0.2 },
];

function dustStyle(dust: Dust): CSSProperties {
  return {
    left: dust.left,
    width: dust.size,
    height: dust.size,
    animationDuration: `${dust.duration}s`,
    animationDelay: `${dust.delay}s`,
    "--op": dust.opacity,
  } as CSSProperties;
}

export default function Home() {
  return (
    <div className="relative flex min-h-dvh max-h-full flex-col overflow-y-hidden bg-background font-sans text-foreground">
      {/* Void layer */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="grid-floor" />
        <div
          className="orb"
          style={{
            left: "14%",
            top: "-20%",
            width: 440,
            height: 440,
            background:
              "radial-gradient(circle, rgba(148,163,184,0.11), transparent 62%)",
          }}
        />
        <div
          className="orb"
          style={{
            right: "-12%",
            bottom: "-24%",
            width: 500,
            height: 500,
            background:
              "radial-gradient(circle, rgba(100,116,139,0.12), transparent 62%)",
            animationDelay: "-10s",
          }}
        />
        {DUST.map((dust, i) => (
          <span key={i} className="dust" style={dustStyle(dust)} />
        ))}
        <div className="noise" />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 85% 75% at 50% 42%, transparent 52%, rgba(0,0,0,0.65) 100%)",
          }}
        />
      </div>

      <main className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-9 px-6 py-14 text-center sm:gap-11">
        <header
          className="fade-up flex flex-col items-center"
          style={{ animationDelay: "0.05s" }}
        >
          <div className="mb-7 flex items-center gap-4 text-zinc-500">
            <span className="h-px w-9 bg-white/15" />
            <span className="text-xs tracking-[0.45em]">珀 涅 罗 珀</span>
            <span className="h-px w-9 bg-white/15" />
          </div>
          <h1 className="font-display text-[clamp(4.25rem,12vw,8.5rem)] font-semibold leading-none">
            <span className="bg-linear-to-b from-zinc-100 via-zinc-200 to-zinc-500/60 bg-clip-text text-transparent drop-shadow-[0_0_35px_rgba(203,213,225,0.14)]">
              Penelope
            </span>
          </h1>
          <p className="mt-5 text-[0.65rem] font-medium uppercase tracking-[0.55em] text-zinc-600">
            The Pixel Loom
          </p>
        </header>

        <section
          className="fade-up flex flex-col items-center gap-3.5"
          style={{ animationDelay: "0.15s" }}
        >
          <p className="text-sm tracking-wide text-zinc-400 sm:text-base">
            一款在线的《我的世界》地图画生成网站
          </p>
          <p className="max-w-xl text-sm leading-relaxed text-zinc-500/90">
            将任意图片，依照特定的宽高比与方块材质，织成可以在原版
            《我的世界》中逐块放置实现的地图画作品。
          </p>
        </section>

        <section
          className="fade-up flex w-full max-w-2xl flex-col items-center gap-8 sm:flex-row sm:items-stretch sm:justify-center sm:gap-12"
          style={{ animationDelay: "0.25s" }}
        >
          <div className="flex w-full max-w-xs flex-col items-center gap-2.5">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-5 text-zinc-500"
            >
              <rect x="3.5" y="3.5" width="17" height="17" rx="2" />
              <path
                d="M3.5 8.5h17M8.5 3.5v17M15.5 3.5v17M3.5 15.5h17"
                opacity="0.55"
              />
            </svg>
            <p className="text-sm font-medium tracking-wide text-zinc-300">
              方块转换
            </p>
            <p className="text-xs leading-relaxed text-zinc-500/80">
              根据你选定的方块类型，将图片转换成地图画
            </p>
          </div>

          <div className="hidden w-px self-stretch bg-white/10 sm:block" />

          <div className="flex w-full max-w-xs flex-col items-center gap-2.5">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-5 text-zinc-500"
            >
              <path d="M12 3.5v11.5" />
              <path d="m8 11 4 4 4-4" />
              <path d="M4.5 17v1.5a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V17" />
            </svg>
            <p className="text-sm font-medium tracking-wide text-zinc-300">
              Litematic 导出
            </p>
            <p className="text-xs leading-relaxed text-zinc-500/80">
              将地图画导出成 litematic 文件，配合投影模组铺设
            </p>
          </div>
        </section>

        <section
          className="fade-up flex items-center gap-6"
          style={{ animationDelay: "0.35s" }}
        >
          <Image
            src="/next.svg"
            alt="Next.js"
            width={64}
            height={13}
            className="invert h-3.5 w-auto opacity-80"
          />
          <span className="font-display text-2xl font-medium text-zinc-600">
            ×
          </span>
          <span className="flex items-center gap-2">
            <Image
              src="/rust-logo.svg"
              alt="Rust"
              width={18}
              height={18}
              className="invert size-4.5 opacity-80"
            />
            <span className="text-sm font-semibold tracking-wide text-zinc-300">
              Rust
            </span>
          </span>
        </section>
      </main>

      <footer
        className="fade-up relative z-10 pb-7 text-center text-[0.7rem] text-zinc-600"
        style={{ animationDelay: "0.45s" }}
      >
        © 2026 Penelope · Wrought by Ten3b
      </footer>
    </div>
  );
}
