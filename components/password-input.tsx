"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function PasswordInput({ className }: { className?: string }) {
  const [show, setShow] = useState(false);

  return (
    <div className={cn("relative", className)}>
      <Input
        id="password"
        type={show ? "text" : "password"}
        placeholder="••••••••"
        className="h-10 pr-10"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={show ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
        onClick={() => setShow((prev) => !prev)}
        className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground"
      >
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </Button>
    </div>
  );
}
