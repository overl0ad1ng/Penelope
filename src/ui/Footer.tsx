"use client";

import { Button } from "minecraft-ui";

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
  )
}
