"use client";

import { useState } from "react";
import {
  Settings,
  Save,
  ScanFace,
  Timer,
  Gauge,
  BellRing,
  RotateCcw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { toast } from "sonner";

type RecognitionSettings = {
  threshold: number;
  confidence: number;
  timeout: number;
  notifUnregistered: boolean;
  notifCctvOffline: boolean;
  notifMissingCheckIn: boolean;
  trackPauseAuto: boolean;
};

const defaults: RecognitionSettings = {
  threshold: 80,
  confidence: 90,
  timeout: 30,
  notifUnregistered: true,
  notifCctvOffline: true,
  notifMissingCheckIn: true,
  trackPauseAuto: true,
};

export default function SettingsPage() {
  const [form, setForm] = useState<RecognitionSettings>(defaults);

  function updateField<K extends keyof RecognitionSettings>(
    key: K,
    value: string | boolean
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    toast.success("Pengaturan berhasil disimpan");
  }

  function reset() {
    setForm(defaults);
    toast.success("Pengaturan dikembalikan ke nilai default");
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
          >
            <RotateCcw />
            Reset
          </Button>
          <Button className="cursor-pointer" onClick={handleSave}>
            <Save />
            Simpan
          </Button>
        </div>
      </PageHeader>

      <form className="flex flex-col gap-6">
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ScanFace className="size-4 text-primary" />
              Face Recognition
            </CardTitle>
            <CardDescription>
              Ambang batas & skor keyakinan untuk verifikasi wajah.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="st-threshold">Threshold Pengenalan (%)</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="st-threshold"
                  type="number"
                  min={0}
                  max={100}
                  value={form.threshold}
                  onChange={(e) => updateField("threshold", e.target.value)}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Skor minimum agar wajah dianggap cocok dengan karyawan.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="st-confidence">Recognition Confidence (%)</Label>
              <Input
                id="st-confidence"
                type="number"
                min={0}
                max={100}
                value={form.confidence}
                onChange={(e) => updateField("confidence", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Target keyakinan minimal hasil pengenalan.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Timer className="size-4 text-primary" />
              Tracking
            </CardTitle>
            <CardDescription>
              Perilaku pemantauan saat karyawan meninggalkan area kamera.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="st-timeout">Tracking Timeout (menit)</Label>
              <Input
                id="st-timeout"
                type="number"
                min={1}
                value={form.timeout}
                onChange={(e) => updateField("timeout", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Durasi sebelum status berubah menjadi Tracking Pause.
              </p>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border bg-white px-3 py-2.5">
              <div className="flex flex-col">
                <Label className="text-sm">Tracking Pause Otomatis</Label>
                <span className="text-xs text-muted-foreground">
                  Lanjutkan tracking saat wajah terdeteksi kembali
                </span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={form.trackPauseAuto}
                onClick={() =>
                  updateField("trackPauseAuto", !form.trackPauseAuto)
                }
                className={`relative h-6 w-11 cursor-pointer rounded-full transition-colors ${
                  form.trackPauseAuto ? "bg-primary" : "bg-zinc-300"
                }`}
              >
                <span
                  className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all ${
                    form.trackPauseAuto ? "left-[calc(100%-1.25rem)]" : "left-0.5"
                  }`}
                />
              </button>
            </div>
          </CardContent>
        </Card>

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
          </CardContent>
        </Card>

        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BellRing className="size-4 text-primary" />
              Notifikasi
            </CardTitle>
            <CardDescription>
              Pengaturan pemberitahuan sistem.
            </CardDescription>
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
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-white px-3 py-2.5">
      <div className="flex flex-col">
        <Label className="text-sm">{label}</Label>
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