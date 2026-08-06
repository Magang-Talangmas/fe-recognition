"use client";

import { useEffect, useState } from "react";
import {
  Settings,
  Save,
  Gauge,
  BellRing,
  RotateCcw,
  CircleAlert,
  Coffee,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";

type RecognitionSettings = {
  notifUnregistered: boolean;
  notifCctvOffline: boolean;
  notifMissingCheckIn: boolean;
  trackPauseAuto: boolean;
};

const defaults: RecognitionSettings = {
  notifUnregistered: true,
  notifCctvOffline: true,
  notifMissingCheckIn: true,
  trackPauseAuto: true,
};

export default function SettingsPage() {
  const [form, setForm] = useState<RecognitionSettings>(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await apiFetch<RecognitionSettings>("/v1/settings");
        if (!active) return;
        setForm(data ?? defaults);
      } catch (err) {
        console.error("Gagal mengambil pengaturan:", err);
        if (active)
          setError(
            err instanceof Error ? err.message : "Gagal mengambil pengaturan"
          );
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  function updateField<K extends keyof RecognitionSettings>(
    key: K,
    value: boolean
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await apiFetch("/v1/settings", {
        method: "PUT",
        body: JSON.stringify(form),
      });
      toast.success("Pengaturan berhasil disimpan");
    } catch (err) {
      console.error("Gagal menyimpan pengaturan:", err);
      setError(
        err instanceof Error ? err.message : "Gagal menyimpan pengaturan"
      );
    } finally {
      setSaving(false);
    }
  }

  async function reset() {
    setSaving(true);
    setError("");
    try {
      const data = await apiFetch<RecognitionSettings>("/v1/settings/reset", {
        method: "POST",
      });
      setForm(data ?? defaults);
      toast.success("Pengaturan dikembalikan ke nilai default");
    } catch (err) {
      console.error("Gagal mereset pengaturan:", err);
      setError(err instanceof Error ? err.message : "Gagal mereset pengaturan");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Settings"
        description="Konfigurasi sistem pengenalan wajah & aturan kehadiran"
        icon={<Settings className="size-6" />}
      >
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="cursor-pointer"
            onClick={reset}
            disabled={loading || saving}
          >
            <RotateCcw className={saving ? "animate-spin" : ""} />
            Reset
          </Button>
          <Button
            className="cursor-pointer"
            onClick={handleSave}
            disabled={loading || saving}
          >
            <Save />
            Simpan
          </Button>
        </div>
      </PageHeader>

      {error && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <CircleAlert className="size-4 shrink-0" />
          {error}
        </div>
      )}

      <form className="flex flex-col gap-6">
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gauge className="size-4 text-primary" />
              Aturan Kehadiran
            </CardTitle>
            <CardDescription>
              Pengaturan status & peringatan sesuai alur kehadiran.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {loading ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Memuat pengaturan...
              </div>
            ) : (
              <>
                <ToggleRow
                  label="Notifikasi wajah tidak terdaftar"
                  description="Kirim peringatan saat wajah unknown terdeteksi"
                  checked={form.notifUnregistered}
                  onChange={(v) => updateField("notifUnregistered", v)}
                />
                <ToggleRow
                  label="Notifikasi CCTV offline"
                  description="Kirim peringatan saat kamera terputus"
                  checked={form.notifCctvOffline}
                  onChange={(v) => updateField("notifCctvOffline", v)}
                />
                <ToggleRow
                  label="Pengingat belum check in"
                  description="Kirim notifikasi jika wajah terdeteksi tetapi belum check in"
                  checked={form.notifMissingCheckIn}
                  onChange={(v) => updateField("notifMissingCheckIn", v)}
                />
                <ToggleRow
                  label="Auto-track waktu istirahat"
                  description="Pantau otomatis waktu istirahat dari jadwal kerja"
                  icon={<Coffee />}
                  checked={form.trackPauseAuto}
                  onChange={(v) => updateField("trackPauseAuto", v)}
                />
              </>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BellRing className="size-4 text-primary" />
              Notifikasi
            </CardTitle>
            <CardDescription>Pengaturan pemberitahuan sistem.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Notifikasi akan dikirim melalui panel notifikasi Super Admin.
          </CardContent>
        </Card>
      </form>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
  icon,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-white px-3 py-2.5">
      <div className="flex flex-col">
        <Label className="flex items-center gap-1.5 text-sm">
          {icon && <span className="text-muted-foreground">{icon}</span>}
          {label}
        </Label>
        <span className="text-xs text-muted-foreground">{description}</span>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors ${
          checked ? "bg-primary" : "bg-zinc-300"
        }`}
      >
        <span
          className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all ${
            checked ? "left-[calc(100%-1.25rem)]" : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
}
