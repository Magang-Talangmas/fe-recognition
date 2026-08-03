"use client";

import { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";

import { cn } from "@/lib/utils";

export function PasswordInput({ className }: { className?: string }) {
  const [show, setShow] = useState(false);

  return (
    <div className={cn("relative", className)}>
      <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
      <input
        id="password"
        type={show ? "text" : "password"}
        placeholder="••••••••"
        className="h-10 w-full rounded-lg border border-zinc-200 bg-white pl-10 pr-10 text-sm outline-none transition-colors focus:border-zinc-400 focus:ring-2 focus:ring-zinc-400/30 dark:border-zinc-800 dark:bg-black dark:focus:border-zinc-600"
      />
      <button
        type="button"
        aria-label={show ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
        onClick={() => setShow((prev) => !prev)}
        className="absolute right-1 top-1/2 flex size-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-zinc-400 transition-colors hover:text-zinc-600 dark:hover:text-zinc-300"
      >
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}