"use client";

import Link from "next/link";

export default function Header() {
  return (
    <div
      className="sticky top-0 z-10 h-12.5 border-b backdrop-blur-xs border-neutral-800"
      style={{
        "backgroundImage": "radial-gradient(transparent 1px, var(--color-background) 1px)",
        "backgroundSize": "4px 4px"
      }}
    >
      <div className="px-6 h-full flex items-center justify-center">
        <Link href="/">
          <img src="/minecraft_title.png" className="max-h-10" />
        </Link>
      </div>
    </div>
  )
}
