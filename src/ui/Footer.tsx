"use client";

import { Button } from "minecraft-ui";
import Link from "next/link";

export default function Footer() {
  function jumpToGithub() {
    window.open("https://github.com/overl0ad1ng/penelope", "_blank");
  }

  return (
    <div className="mc border-t py-4 border-neutral-800">
      <div className="text-xs max-w-6xl mx-auto flex items-center justify-between">
        <p className="text-neutral-300">
          © 2026 Penelope · Wrought by Ten3b
        </p>
        <div className="flex items-center gap-6">
          <Link href="/disclaimer" className="noto-sans opacity-80 hover:opacity-100">
            免责声明
          </Link>

          <Button
            onClick={jumpToGithub}
            className="px-3! hover:bg-white/5 duration-100 ease-in-out cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <img src="/github.svg" className="size-3.5 mb-0.75" />
              View on Github
            </span>
          </Button>
        </div>
      </div>
    </div>
  )
}
