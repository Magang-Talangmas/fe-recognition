import { Mail } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/password-input";

export default function LoginPage() {
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
          <div className="absolute right-8 top-8">
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

          <form className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="johndoe@gmail.com"
                  className="h-10 pl-10"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Kata Sandi</Label>
              <PasswordInput />
              <a
                href="#"
                className="self-end text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                Lupa kata sandi?
              </a>
            </div>

            <Button
              type="submit"
              size="lg"
              className="mt-2 w-full cursor-pointer"
            >
              Masuk
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
