"use client";

import { useState } from "react";
import { Lock, Eye, EyeOff } from "lucide-react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function PasswordInput({
  className,
  value,
  onChange,
}: {
  className?: string;
  value?: string;
  onChange?: (value: string) => void;
}) {
  const [show, setShow] = useState(false);

  return (
    <div className={cn("relative", className)}>
      <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        id="password"
        type={show ? "text" : "password"}
        placeholder="••••••••"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className="h-10 pl-10 pr-10"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={show ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
        onClick={() => setShow((prev) => !prev)}
        className="absolute right-1 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground active:!-translate-y-1/2"
      >
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </Button>
    </div>
  );
}
