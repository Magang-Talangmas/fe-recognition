"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Loader2, CircleAlert } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/password-input";
import { API_URL } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.message);

      localStorage.setItem("token", json.data.token);
      localStorage.setItem("user", JSON.stringify(json.data.user));
      router.push("/superadmin");
    } catch (err) {
      if (err instanceof TypeError) {
        setError("Tidak dapat terhubung ke server. Pastikan backend berjalan.");
      } else {
        setError(
          err instanceof Error && err.message
            ? err.message
            : "Gagal masuk. Silakan coba lagi.",
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-blue-100 px-6">
      <Card className="grid w-full max-w-6xl overflow-hidden border-primary/10 p-0 md:grid-cols-2">
        <div className="relative hidden min-h-[36rem] md:block">
          <Image
            src="/images/kantor.jpg"
            alt="Kantor"
            fill
            priority
            className="object-cover"
            sizes="(min-width: 768px) 50vw, 100vw"
          />
        </div>

        <CardContent className="relative flex min-h-[36rem] flex-col justify-center gap-8 p-8 sm:p-12">
          <div className="absolute left-1/2 top-8 -translate-x-1/2 md:left-auto md:right-8 md:translate-x-0">
            <Image
              src="/images/logo-talangmas.png"
              alt="Logo Talangmas"
              width={100}
              height={100}
              className="h-12 w-auto object-contain"
            />
          </div>

          <div className="flex flex-col gap-1 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              Selamat datang
            </h1>
            <p className="text-sm text-muted-foreground">
              Masuk untuk mengelola pengenalan wajah Anda
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="johndoe@gmail.com"
                  className="h-10 pl-10"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Kata Sandi</Label>
              <PasswordInput value={password} onChange={setPassword} />
              <a
                href="#"
                className="self-end text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                Lupa kata sandi?
              </a>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <CircleAlert className="size-4 shrink-0" />
                {error}
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              className="mt-2 w-full cursor-pointer"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" />
                  Memproses...
                </>
              ) : (
                "Masuk"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
