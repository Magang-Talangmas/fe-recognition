import { Mail } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/password-input";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-blue-100 px-6">
      <div className="grid w-full max-w-6xl overflow-hidden rounded-sm border border-primary/10 bg-background shadow-xl md:grid-cols-2">
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

        <div className="relative flex min-h-[36rem] flex-col justify-center gap-8 p-8 sm:p-12">
          <div className="absolute right-6 top-6">
            <Image
              src="/images/logo-talangmas.png"
              alt="Logo Talangmas"
              width={100}
              height={100}
              className="h-12 w-auto object-contain"
            />
          </div>

          <div className="flex flex-col items-center gap-3">
            <div className="flex flex-col gap-1">
              <h1 className="text-center text-2xl font-semibold tracking-tight">
                Selamat datang
              </h1>
              <p className="text-center text-sm text-muted-foreground">
                Masuk untuk mengelola pengenalan wajah Anda
              </p>
            </div>
          </div>

          <form className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label
                htmlFor="email"
                className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
                <input
                  id="email"
                  type="email"
                  placeholder="johndoe@gmail.com"
                  className="h-10 w-full rounded-lg border border-zinc-200 bg-white pl-10 pr-3 text-sm outline-none transition-colors focus:border-zinc-400 focus:ring-2 focus:ring-zinc-400/30 dark:border-zinc-800 dark:bg-black dark:focus:border-zinc-600"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="password"
                className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Kata Sandi
              </label>
              <PasswordInput />
              <a
                href="#"
                className="self-end text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                Lupa kata sandi?
              </a>
            </div>

            <Button type="submit" size="lg" className="mt-2 w-full cursor-pointer">
              Masuk
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
